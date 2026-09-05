//! Transport adapter for the supervised Orchestrator Provider process.

use crate::material_exec::{
    MaterialCancelToken, MaterialExecutionStatus, MaterialExecutor, RollbackOutcome,
};
use crate::material_intake::{
    MaterialEntryMode, MaterialIntakeConfirmationV01, MaterialIntakeEngine, MaterialIntakePlanV01,
    RiskDecisionChoice, RiskDecisionV01, SourceFolderInspectionV01,
};
use crate::material_task::MaterialTaskResult;
use crate::model::ProjectRef;
use crate::project_lock::{
    acquire_project_lock, begin_mutation, read_pending_mutation, LockHolder,
    MutationMarkerGuard, PendingMutation, ProjectLockError, ProjectLockGuard,
    MARKER_FILE_NAME,
};
use crate::download_events::{
    fold_lifecycle, retry_decision, ConsumerError, DownloadEventConsumer, DownloadEventV01,
    IngestOutcome, RetryDecision,
};
use crate::{
    AppErrorV1, BuildRecordStore, ErrorCategory, IdempotentCancellation,
    IdempotentTaskAcceptance, NewTask, ProjectIdentity, SqliteStoreError, SqliteTaskStore,
    BdlStore, StoredTask, StoredTaskEvent, TaskEventKind, TaskMutation, TaskState,
};
use crate::contracts::ParamValue;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::fs::{File, OpenOptions};
use std::io::{BufRead, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

pub const PROVIDER_FRAME_VERSION: &str = "0.1";
const APPLICATION_CONTRACT_VERSION: &str = "0.1";
const MAX_FRAME_BYTES: u64 = 1024 * 1024;

#[derive(Debug)]
pub enum ProviderHostError {
    Io(std::io::Error),
    Store(SqliteStoreError),
    Encode(serde_json::Error),
    OversizedFrame,
    AlreadyRunning,
}

impl std::fmt::Display for ProviderHostError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(error) => write!(formatter, "Provider I/O failed: {error}"),
            Self::Store(error) => write!(formatter, "Provider store failed: {error}"),
            Self::Encode(error) => write!(formatter, "Provider frame encoding failed: {error}"),
            Self::OversizedFrame => formatter.write_str("Provider frame exceeded one MiB"),
            Self::AlreadyRunning => formatter.write_str("another Provider already owns this store"),
        }
    }
}

impl std::error::Error for ProviderHostError {}

impl From<std::io::Error> for ProviderHostError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<SqliteStoreError> for ProviderHostError {
    fn from(error: SqliteStoreError) -> Self {
        Self::Store(error)
    }
}

impl From<serde_json::Error> for ProviderHostError {
    fn from(error: serde_json::Error) -> Self {
        Self::Encode(error)
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct InboundFrame {
    frame_version: String,
    frame_id: String,
    kind: String,
    #[serde(default)]
    payload: Value,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct OutboundFrame<'a> {
    frame_version: &'static str,
    frame_id: &'a str,
    kind: &'a str,
    payload: Value,
}

struct HostState {
    store: Arc<SqliteTaskStore>,
    provider_instance_id: String,
    recovered_nonterminal_tasks: HashSet<String>,
    production: Option<Arc<ProductionServices>>,
    downloads: Option<Arc<DownloadServices>>,
}

/// B4/F4-4 download acquisition wiring. When absent, every `download.*`
/// method answers a typed `unavailable` error — honest absence, never a
/// silent success (same discipline as production.*).
pub struct DownloadConfig {
    /// The BDL local database the download consumer folds events into.
    pub bdl: Arc<BdlStore>,
}

struct DownloadServices {
    bdl: Arc<BdlStore>,
    /// Per-download monotonic intent sequence (AMF-issued, Main-side dedup
    /// key). In-memory only: intents concern live downloads, and a provider
    /// restart leaves no live downloads behind (orphan discipline).
    intent_seqs: Mutex<std::collections::HashMap<String, u64>>,
    /// Outbound Provider -> Main intent notifications, drained by the frame
    /// loop as ordinary event frames (the same ordering channel as events).
    pending_intents: Mutex<Vec<serde_json::Value>>,
}

impl DownloadServices {
    fn next_intent(&self, download_id: &str, intent: &str) -> serde_json::Value {
        let mut intents = self.intent_seqs.lock().expect("download intents poisoned");
        let seq = intents.entry(download_id.to_owned()).or_insert(0);
        *seq += 1;
        serde_json::json!({
            "kind": "download.intent",
            "downloadId": download_id,
            "intent": intent,
            "intentSeq": *seq,
        })
    }

    fn queue_intent(&self, download_id: &str, intent: &str) -> u64 {
        let payload = self.next_intent(download_id, intent);
        let seq = payload["intentSeq"].as_u64().unwrap_or(0);
        self.pending_intents
            .lock()
            .expect("pending intents poisoned")
            .push(payload);
        seq
    }
}

/// Production use-case wiring (production-use-case v0.1): when absent, every
/// `production.*` method answers a typed `unavailable` error — honest
/// absence, never a silent success.
pub struct ProductionConfig {
    pub executor: Arc<MaterialExecutor>,
    pub records: Arc<BuildRecordStore>,
}

struct ProductionServices {
    executor: Arc<MaterialExecutor>,
    records: Arc<BuildRecordStore>,
    engine: MaterialIntakeEngine,
    running: Mutex<HashMap<String, MaterialCancelToken>>,
    completed_events: Mutex<Vec<StoredTaskEvent>>,
}

struct ProviderInstanceLock {
    _file: File,
}

impl ProviderInstanceLock {
    fn acquire(database_path: &Path) -> Result<Self, ProviderHostError> {
        if let Some(parent) = database_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let mut lock_name = database_path.as_os_str().to_os_string();
        lock_name.push(".provider.lock");
        let file = OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .open(PathBuf::from(lock_name))?;
        if let Err(error) = file.try_lock() {
            return Err(match error {
                std::fs::TryLockError::WouldBlock => ProviderHostError::AlreadyRunning,
                std::fs::TryLockError::Error(error) => ProviderHostError::Io(error),
            });
        }
        Ok(Self { _file: file })
    }
}

/// Runs the bounded JSONL protocol until stdin closes or shutdown commits.
/// Stdout is protocol-only; diagnostics belong on stderr in the binary shell.
pub fn run_provider_host(
    input: impl BufRead + Send + 'static,
    output: impl Write,
    database_path: impl AsRef<Path>,
) -> Result<(), ProviderHostError> {
    run_provider_host_with(input, output, database_path, None)
}

/// Same protocol with the production use-case surface wired to concrete
/// services (material intake executor + build record store).
pub fn run_provider_host_with(
    input: impl BufRead + Send + 'static,
    output: impl Write,
    database_path: impl AsRef<Path>,
    production: Option<ProductionConfig>,
) -> Result<(), ProviderHostError> {
    run_provider_host_with_downloads(input, output, database_path, production, None)
}

/// The download-capable entry: when `downloads` is configured, the host
/// serves `download.ingest` / `download.retry` and emits download intents
/// over the event channel.
pub fn run_provider_host_with_downloads(
    input: impl BufRead + Send + 'static,
    mut output: impl Write,
    database_path: impl AsRef<Path>,
    production: Option<ProductionConfig>,
    downloads: Option<DownloadConfig>,
) -> Result<(), ProviderHostError> {
    let database_path = database_path.as_ref();
    let _instance_lock = ProviderInstanceLock::acquire(database_path)?;
    let store = Arc::new(SqliteTaskStore::open(database_path)?);
    let provider_instance_id = provider_instance_id();
    let recovered_nonterminal_tasks: HashSet<String> = store
        .tasks()?
        .into_iter()
        .filter(|task| !task.state.is_terminal())
        .map(|task| task.task_id)
        .collect();
    store.mark_other_owners_interrupted(&provider_instance_id, &now_rfc3339())?;

    // A previous process may have died with production tasks mid-flight.
    // They are failed as interrupted (recoverable) — never silently resumed;
    // per the recovery discipline the next mutation must Inspect first.
    for task in store.tasks()? {
        if task.task_id.starts_with("prod-")
            && !task.state.is_terminal()
            && recovered_nonterminal_tasks.contains(&task.task_id)
        {
            let error = AppErrorV1::new(
                "vua.task.interrupted",
                ErrorCategory::ExternalFailure,
                "errors.task.interrupted",
                &task.correlation_id,
            )
            .with_recoverable(true);
            let _ = advance_production_task(
                &store,
                &task.task_id,
                TaskMutation::Complete {
                    state: if matches!(task.state, TaskState::Queued | TaskState::Preparing) {
                        TaskState::Cancelled
                    } else {
                        TaskState::Failed
                    },
                    error: if matches!(task.state, TaskState::Queued | TaskState::Preparing) {
                        None
                    } else {
                        Some(error)
                    },
                    result: None,
                },
            );
        }
    }

    let production = production.map(|config| {
        Arc::new(ProductionServices {
            executor: config.executor,
            records: config.records,
            engine: MaterialIntakeEngine,
            running: Mutex::new(HashMap::new()),
            completed_events: Mutex::new(Vec::new()),
        })
    });
    let downloads = downloads.map(|config| {
        Arc::new(DownloadServices {
            bdl: config.bdl,
            intent_seqs: Mutex::new(std::collections::HashMap::new()),
            pending_intents: Mutex::new(Vec::new()),
        })
    });
    let mut state = HostState {
        store,
        provider_instance_id,
        recovered_nonterminal_tasks,
        production,
        downloads,
    };

    // The reader runs on its own thread so the host can wake up between
    // frames: worker completion events reach an idle Gateway without it
    // having to send another request first.
    let (line_sender, line_receiver) = std::sync::mpsc::channel::<std::io::Result<Vec<u8>>>();
    std::thread::spawn(move || {
        let mut input = input;
        loop {
            let mut line = Vec::new();
            // The frame budget is re-established for EVERY frame: a
            // single cumulative Take would treat ~1 MiB of total session
            // traffic as EOF and silently end the protocol.
            let read = {
                let mut limited =
                    std::io::Read::take(input.by_ref(), MAX_FRAME_BYTES + 1);
                std::io::BufRead::read_until(&mut limited, b'\n', &mut line)
            };
            match read {
                Ok(0) => break,
                Ok(_) => {
                    if line_sender.send(Ok(line)).is_err() {
                        break;
                    }
                }
                Err(error) => {
                    let _ = line_sender.send(Err(error));
                    break;
                }
            }
        }
    });

    loop {
        write_pending_events(&mut state, &mut output)?;
        let mut line = match line_receiver.recv_timeout(Duration::from_millis(100)) {
            Ok(Ok(line)) => line,
            Ok(Err(error)) => return Err(ProviderHostError::Io(error)),
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => continue,
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                write_pending_events(&mut state, &mut output)?;
                // Intents queued by the LAST frame still go out before the
                // host exits — ordering never strands a port intent.
                if let Some(downloads) = &state.downloads {
                    let mut intents = downloads
                        .pending_intents
                        .lock()
                        .expect("pending intents poisoned");
                    for payload in intents.drain(..) {
                        let frame_id = format!(
                            "download-intent-{}-{}",
                            payload["downloadId"].as_str().unwrap_or("?"),
                            payload["intentSeq"].as_u64().unwrap_or(0)
                        );
                        write_frame(&mut output, &frame_id, "event", payload)?;
                    }
                }
                break;
            }
        };
        if line.len() as u64 > MAX_FRAME_BYTES {
            return Err(ProviderHostError::OversizedFrame);
        }
        while matches!(line.last(), Some(b'\n' | b'\r')) {
            line.pop();
        }
        // demo.task deterministic progression: one stage per received frame,
        // holding at running awaiting cancellation; events are written before
        // this frame's response (notifications of fact, queries stay authoritative)
        let mut pending_events = advance_demo_tasks(&mut state)?;
        // production workers finish in their own threads; their persisted
        // events drain here and go out as ordinary event frames.
        if let Some(services) = &state.production {
            let mut guard = services
                .completed_events
                .lock()
                .expect("completed events poisoned");
            pending_events.extend(guard.drain(..));
            drop(guard);
        }
        for event in pending_events {
            let event_id = format!("sqlite-{}-{}", event.task_id, event.revision);
            write_frame(&mut output, &event_id, "event", task_event(&event_id, &event))?;
        }
        if let Some(downloads) = &state.downloads {
            let mut intents = downloads
                .pending_intents
                .lock()
                .expect("pending intents poisoned");
            for payload in intents.drain(..) {
                let frame_id = format!(
                    "download-intent-{}-{}",
                    payload["downloadId"].as_str().unwrap_or("?"),
                    payload["intentSeq"].as_u64().unwrap_or(0)
                );
                write_frame(&mut output, &frame_id, "event", payload)?;
            }
        }
        let frame = match serde_json::from_slice::<InboundFrame>(&line) {
            Ok(frame) => frame,
            Err(_) => {
                write_frame(
                    &mut output,
                    "invalid",
                    "protocol_error",
                    json!({"code": "vua.provider.invalid_frame"}),
                )?;
                continue;
            }
        };
        if frame.frame_version != PROVIDER_FRAME_VERSION || frame.frame_id.is_empty() {
            write_frame(
                &mut output,
                &frame.frame_id,
                "protocol_error",
                json!({"code": "vua.provider.unsupported_frame_version"}),
            )?;
            continue;
        }

        let outcome = handle_frame(&mut state, &frame)?;
        match outcome {
            FrameOutcome::Response(payload) => {
                write_frame(&mut output, &frame.frame_id, "response", payload)?;
            }
            FrameOutcome::ResponseAndEvent { response, event } => {
                write_frame(&mut output, &frame.frame_id, "response", response)?;
                write_frame(&mut output, &event.0, "event", event.1)?;
            }
            FrameOutcome::Exit(payload) => {
                state.store.checkpoint()?;
                write_frame(&mut output, &frame.frame_id, "response", payload)?;
                break;
            }
        }
    }
    Ok(())
}

enum FrameOutcome {
    Response(Value),
    ResponseAndEvent {
        response: Value,
        event: (String, Value),
    },
    Exit(Value),
}

fn handle_frame(
    state: &mut HostState,
    frame: &InboundFrame,
) -> Result<FrameOutcome, ProviderHostError> {
    Ok(match frame.kind.as_str() {
        "handshake" => FrameOutcome::Response(json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "supportedContractVersions": [APPLICATION_CONTRACT_VERSION],
            "providerBuildId": env!("CARGO_PKG_VERSION"),
            "providerInstanceId": state.provider_instance_id,
            "downloadIngest": state.downloads.is_some(),
        })),
        "request" => handle_application_request(state, &frame.payload),
        "prepare_shutdown" => wait_for_safe_boundary(state, shutdown_timeout(&frame.payload)),
        "continue_shutdown" => continue_shutdown(state, &frame.payload)?,
        _ => FrameOutcome::Response(json!({
            "code": "vua.provider.unknown_frame_kind",
        })),
    })
}

fn continue_shutdown(
    state: &mut HostState,
    payload: &Value,
) -> Result<FrameOutcome, ProviderHostError> {
    match payload.get("decision").and_then(Value::as_str) {
        Some("wait") => Ok(wait_for_safe_boundary(state, shutdown_timeout(payload))),
        Some("force") => {
            let user_decision_id = payload
                .get("userDecisionId")
                .and_then(Value::as_str)
                .unwrap_or("");
            if user_decision_id.trim().is_empty() {
                return Ok(FrameOutcome::Response(json!({
                    "code": "vua.provider.force_requires_user_decision",
                })));
            }
            let interrupted_tasks = blocking_tasks(state)?;
            state
                .store
                .mark_owner_interrupted(&state.provider_instance_id, &now_rfc3339())?;
            Ok(FrameOutcome::Exit(json!({
                "contractVersion": APPLICATION_CONTRACT_VERSION,
                "outcome": "forced",
                "userDecisionId": user_decision_id,
                "interruptedTasks": interrupted_tasks,
            })))
        }
        _ => Ok(FrameOutcome::Response(json!({
            "code": "vua.provider.invalid_shutdown_decision",
        }))),
    }
}

fn shutdown_timeout(payload: &Value) -> Duration {
    Duration::from_millis(
        payload
            .get("timeoutMs")
            .and_then(Value::as_u64)
            .filter(|timeout| *timeout > 0)
            .unwrap_or(1),
    )
}

fn wait_for_safe_boundary(state: &HostState, timeout: Duration) -> FrameOutcome {
    let started = Instant::now();
    loop {
        match blocking_tasks(state) {
            Ok(blocking_tasks) if blocking_tasks.is_empty() => {
                return FrameOutcome::Exit(json!({
                    "contractVersion": APPLICATION_CONTRACT_VERSION,
                    "outcome": "safe_to_stop",
                    "blockingTasks": [],
                }));
            }
            Ok(blocking_tasks) if started.elapsed() >= timeout => {
                return FrameOutcome::Response(json!({
                    "contractVersion": APPLICATION_CONTRACT_VERSION,
                    "outcome": "needs_user_choice",
                    "blockingTasks": blocking_tasks,
                }));
            }
            Err(_) => {
                return FrameOutcome::Response(json!({
                    "code": "vua.provider.persistence_failed",
                }));
            }
            _ => {
                let remaining = timeout.saturating_sub(started.elapsed());
                std::thread::sleep(remaining.min(Duration::from_millis(25)));
            }
        }
    }
}

fn blocking_tasks(state: &HostState) -> Result<Vec<Value>, SqliteStoreError> {
    let mut tasks = Vec::new();
    // A registered production task blocks shutdown even BEFORE its
    // worker acquired the lease (the spawn window) — a safe_to_stop
    // verdict must never race a mutation that is about to start.
    if let Some(services) = &state.production {
        let running = services.running.lock().expect("running poisoned");
        for task_id in running.keys() {
            if let Some(task) = state.store.task(task_id)? {
                if !task.state.is_terminal() {
                    tasks.push(json!({
                        "taskId": task.task_id,
                        "revision": task.revision,
                        "state": state_name(task.state),
                    }));
                }
            }
        }
    }
    for lease in state.store.project_leases()? {
        if lease.owner_instance_id != state.provider_instance_id || lease.recovery_required {
            continue;
        }
        if let Some(task) = state.store.task(&lease.task_id)? {
            if !task.state.is_terminal() {
                tasks.push(json!({
                    "taskId": task.task_id,
                    "revision": task.revision,
                    "state": state_name(task.state),
                }));
            }
        }
    }
    Ok(tasks)
}

fn handle_application_request(state: &mut HostState, request: &Value) -> FrameOutcome {
    let request_id = request
        .get("requestId")
        .and_then(Value::as_str)
        .unwrap_or("invalid");
    let correlation_id = request
        .get("correlationId")
        .and_then(Value::as_str)
        .unwrap_or("invalid");
    if request.get("contractVersion").and_then(Value::as_str) != Some(APPLICATION_CONTRACT_VERSION)
    {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.provider.unsupported_contract",
            "errors.provider.unsupportedContract",
            "validation",
        ));
    }
    let method = request.get("method").and_then(Value::as_str).unwrap_or("");
    if method.starts_with("production.") {
        return production_request(state, method, request, request_id, correlation_id);
    }
    if method.starts_with("download.") {
        return download_request(state, method, request, request_id, correlation_id);
    }
    let outcome = (|| -> Result<FrameOutcome, SqliteStoreError> {
        match method {
            "application.getSnapshot" => Ok(FrameOutcome::Response(application_success(
                request_id,
                json!({
                    "contractVersion": APPLICATION_CONTRACT_VERSION,
                    "revision": state.store.application_revision()?,
                    "capabilities": {"revision": 0, "operations": served_capabilities(state)},
                }),
            ))),
            "task.list" => {
                let tasks = state
                    .store
                    .tasks()?
                    .iter()
                    .map(|task| task_snapshot(state, task))
                    .collect::<Vec<_>>();
                Ok(FrameOutcome::Response(application_success(
                    request_id,
                    json!({
                        "contractVersion": APPLICATION_CONTRACT_VERSION,
                        "revision": state.store.application_revision()?,
                        "tasks": tasks,
                    }),
                )))
            }
            "task.get" => {
                let task_id = request
                    .pointer("/params/taskId")
                    .and_then(Value::as_str)
                    .unwrap_or("");
                match state.store.task(task_id)? {
                    Some(task) => Ok(FrameOutcome::Response(application_success(
                        request_id,
                        task_snapshot(state, &task),
                    ))),
                    None => Ok(FrameOutcome::Response(application_error(
                        request_id,
                        correlation_id,
                        "vua.task.not_found",
                        "errors.task.notFound",
                        "validation",
                    ))),
                }
            }
            "task.requestCancellation" => handle_cancellation(state, request, request_id),
            "environment.getSnapshot" => Ok(FrameOutcome::Response(application_success(
                request_id,
                json!({
                    "contractVersion": APPLICATION_CONTRACT_VERSION,
                    "revision": state.store.application_revision()?,
                    "capturedAt": now_rfc3339(),
                    // presence vocabulary frozen by the B6 spike; real probes land
                    // with F6/B6 - an empty list is an honest empty, not a ready verdict
                    "items": [],
                }),
            ))),
            "task.startDemo" => Ok(handle_start_demo(state, request, request_id, correlation_id)),
            _ => Ok(FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.provider.unknown_method",
                "errors.provider.unknownMethod",
                "validation",
            ))),
        }
    })();
    outcome.unwrap_or_else(|error: SqliteStoreError| {
        FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            store_error_code(&error),
            "errors.provider.persistence",
            store_error_category(&error),
        ))
    })
}

/// Kernel-side derivation source for the Gateway boolean capabilities and the
/// entry visibility (contract operation-level Capability). demo.task leaves the
/// production capability table once the F3 real use-case command lands.
fn served_capabilities(state: &HostState) -> Value {
    let production_availability = if state.production.is_some() {
        "available"
    } else {
        "unavailable"
    };
    json!([
        {"operationId": "task.list", "availability": "available"},
        {"operationId": "environment.getSnapshot", "availability": "available"},
        {"operationId": "demo.task", "availability": "available"},
        {"operationId": "production.useCase", "availability": production_availability},
        {
            "operationId": "desktop.remoteBrowser",
            "availability": "unavailable",
            "reason": {
                "contractVersion": APPLICATION_CONTRACT_VERSION,
                "code": "vua.desktop.remote_browser_unavailable",
                "category": "unavailable",
                "messageKey": "errors.desktop.remoteBrowserUnavailable",
                "recoverable": true,
                "retryable": false,
                "correlationId": "provider-capability",
            },
        },
    ])
}

/// demo commandId -> deterministic task id: a repeated command hits the same
/// task, with the persistence-layer idempotent accept as the second line of defense.
fn demo_task_id(command_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(command_id.as_bytes());
    let digest = hasher
        .finalize()
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<String>();
    format!("demo-{}", &digest[..12])
}

fn handle_start_demo(
    state: &mut HostState,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let command_id = request
        .get("commandId")
        .and_then(Value::as_str)
        .unwrap_or("");
    if command_id.is_empty() {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.demo.invalid_command",
            "errors.demo.invalidCommand",
            "validation",
        ));
    }
    let task_id = demo_task_id(command_id);
    if let Ok(Some(task)) = state.store.task(&task_id) {
        // idempotent replay: the same commandId returns the existing task
        // snapshot without creating a new task or emitting new events
        return FrameOutcome::Response(application_success(
            request_id,
            json!({
                "contractVersion": APPLICATION_CONTRACT_VERSION,
                "task": task_snapshot(state, &task),
            }),
        ));
    }

    let new_task = NewTask {
        task_id: task_id.clone(),
        correlation_id: correlation_id.to_string(),
        occurred_at: now_rfc3339(),
    };
    let fingerprint_input = json!({"kind": "task.startDemo", "commandId": command_id});
    let result = state.store.accept_idempotent_task(
        "task.startDemo",
        command_id,
        &request_fingerprint(&fingerprint_input),
        &new_task,
        &json!({"demo": true}),
    );
    match result {
        Ok(IdempotentTaskAcceptance::Accepted { task, event }) => {
            let response = application_success(
                request_id,
                json!({
                    "contractVersion": APPLICATION_CONTRACT_VERSION,
                    "task": task_snapshot(state, &task),
                }),
            );
            let event_id = format!("sqlite-{}-{}", event.task_id, event.revision);
            FrameOutcome::ResponseAndEvent {
                response,
                event: (event_id.clone(), task_event(&event_id, &event)),
            }
        }
        Ok(IdempotentTaskAcceptance::Replayed { response, .. }) => {
            FrameOutcome::Response(application_success(request_id, response))
        }
        Err(error) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            store_error_code(&error),
            "errors.provider.persistence",
            store_error_category(&error),
        )),
    }
}

/// Demo task deterministic progression: queued -> preparing -> running, holding
/// at running awaiting cancellation; cancellation then completes as cancelled.
/// Progression is driven by received frames (deterministic, no timers).
fn advance_demo_tasks(
    state: &mut HostState,
) -> Result<Vec<StoredTaskEvent>, SqliteStoreError> {
    let mut events = Vec::new();
    for task in state.store.tasks()? {
        if !task.task_id.starts_with("demo-") || task.state.is_terminal() {
            continue;
        }
        // 取消不阻塞前进:演示任务照常推进到 running,取消请求把
        // running 的下一步转为 cancelled 终态(修复:取消在 queued/preparing
        // 到达时任务曾永久卡在 preparing,旧假绿掩盖了它)
        let target = match task.state {
            TaskState::Queued => Some(TaskState::Preparing),
            TaskState::Preparing => Some(TaskState::Running),
            TaskState::Running if task.cancel_requested => Some(TaskState::Cancelled),
            _ => None,
        };
        let Some(target) = target else { continue };
        let mutation = if target.is_terminal() {
            TaskMutation::Complete {
                state: target,
                error: None,
                result: Some(json!({"demo": true})),
            }
        } else {
            TaskMutation::Transition {
                state: target,
                payload: json!({}),
            }
        };
        if let Some(event) = state
            .store
            .mutate_task(&task.task_id, task.revision, &now_rfc3339(), mutation)?
        {
            events.push(event);
        }
    }
    Ok(events)
}

fn handle_cancellation(
    state: &mut HostState,
    request: &Value,
    request_id: &str,
) -> Result<FrameOutcome, SqliteStoreError> {
    let command_id = request
        .get("commandId")
        .and_then(Value::as_str)
        .unwrap_or("");
    let task_id = request
        .pointer("/params/taskId")
        .and_then(Value::as_str)
        .unwrap_or("");
    let observed_revision = request
        .pointer("/params/observedRevision")
        .and_then(Value::as_u64);
    let fingerprint = request_fingerprint(&method_and_task(request));
    let occurred_at = now_rfc3339();
    let cancellation = state.store.request_cancellation_idempotent(
        command_id,
        &fingerprint,
        task_id,
        observed_revision,
        &occurred_at,
    )?;
    // The worker token is cancelled ONLY after the authoritative store has
    // accepted the request — a request rejected by idempotency or revision
    // validation must not cancel anything as a side effect.
    if matches!(cancellation, IdempotentCancellation::Applied { .. }) {
        if let Some(services) = &state.production {
            if let Some(token) =
                services.running.lock().expect("running poisoned").get(task_id)
            {
                token.cancel();
            }
        }
        // Download tasks: the user's cancellation folds to an abandon intent
        // for the port (discard the partial file). The download task id is
        // `dl-<downloadId>-a<attempt>`; the intent carries the downloadId.
        if task_id.starts_with("dl-") {
            if let Some(downloads) = &state.downloads {
                if let Ok(Some(task)) = state.store.task(task_id) {
                    downloads.queue_intent(&task.correlation_id, "abandon");
                }
            }
        }
    }
    match cancellation {
        IdempotentCancellation::Replayed(result) => {
            Ok(FrameOutcome::Response(application_success(
                request_id,
                serde_json::to_value(result).expect("serializable"),
            )))
        }
        IdempotentCancellation::Applied { result, event } => {
            let response = application_success(
                request_id,
                serde_json::to_value(result).expect("serializable"),
            );
            match event {
                Some(event) => {
                    let event_id = format!("sqlite-{}-{}", event.task_id, event.revision);
                    Ok(FrameOutcome::ResponseAndEvent {
                        response,
                        event: (event_id.clone(), task_event(&event_id, &event)),
                    })
                }
                None => Ok(FrameOutcome::Response(response)),
            }
        }
    }
}

fn task_snapshot(state: &HostState, task: &StoredTask) -> Value {
    let recovery = if state.recovered_nonterminal_tasks.contains(&task.task_id) {
        "inspect_required"
    } else {
        "none"
    };
    let mut snapshot = json!({
        "contractVersion": APPLICATION_CONTRACT_VERSION,
        "taskId": task.task_id,
        "revision": task.revision,
        "correlationId": task.correlation_id,
        "state": state_name(task.state),
        "cancellationRequested": task.cancel_requested,
        "recoveryDisposition": recovery,
        "updatedAt": task.updated_at,
    });
    if let Some(error) = &task.error {
        snapshot
            .as_object_mut()
            .expect("snapshot is an object")
            .insert(
                "error".into(),
                serde_json::to_value(error).expect("error serializes"),
            );
    }
    snapshot
}

fn task_event(event_id: &str, event: &StoredTaskEvent) -> Value {
    json!({
        "contractVersion": APPLICATION_CONTRACT_VERSION,
        "eventId": event_id,
        "taskId": event.task_id,
        "revision": event.revision,
        "occurredAt": event.occurred_at,
        "correlationId": event.correlation_id,
        "kind": match event.kind {
            TaskEventKind::Accepted => "task.accepted",
            TaskEventKind::StateChanged => "task.stateChanged",
            TaskEventKind::Progress => "task.progressed",
            TaskEventKind::CancelRequested => "task.cancellationRequested",
            TaskEventKind::Completed => "task.completed",
        },
        "state": state_name(event.state),
        "payload": event.payload,
    })
}

fn application_success(request_id: &str, value: Value) -> Value {
    json!({
        "contractVersion": APPLICATION_CONTRACT_VERSION,
        "requestId": request_id,
        "ok": true,
        "value": value,
    })
}

/// B4/F4-4: the download acquisition surface. `download.ingest` folds port
/// events into BDL (at-least-once; the BDL unique key dedups) and drives the
/// per-attempt nine-state task; `download.retry` adjudicates a user retry
/// through the frozen retry policy and emits the port intent.
fn download_request(
    state: &mut HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(downloads) = state.downloads.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.download.unavailable",
            "errors.download.unavailable",
            "unavailable",
        ));
    };
    match method {
        "download.ingest" => {
            download_ingest(state, downloads, request, request_id, correlation_id)
        }
        "download.retry" => {
            download_retry(state, downloads, request, request_id, correlation_id)
        }
        _ => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.provider.unknown_method",
            "errors.provider.unknownMethod",
            "validation",
        )),
    }
}

fn download_ingest(
    state: &mut HostState,
    downloads: Arc<DownloadServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    if request.pointer("/params/schemaVersion").and_then(Value::as_str)
        != Some(crate::download_events::DOWNLOAD_EVENT_SCHEMA_VERSION)
    {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.download.unsupported_schema",
            "errors.download.unsupportedSchema",
            "validation",
        ));
    }
    let empty = Vec::new();
    let events = request
        .pointer("/params/events")
        .and_then(Value::as_array)
        .unwrap_or(&empty);
    let consumer = DownloadEventConsumer::new(&downloads.bdl);
    let mut folded = 0u64;
    let mut duplicates = 0u64;
    let mut rejected: Vec<Value> = Vec::new();
    for (index, value) in events.iter().enumerate() {
        let event: DownloadEventV01 = match serde_json::from_value(value.clone()) {
            Ok(event) => event,
            Err(error) => {
                rejected.push(json!({
                    "index": index,
                    "code": "vua.download.invalid_event",
                    "reason": error.to_string(),
                }));
                continue;
            }
        };
        match consumer.ingest(&event) {
            Ok(IngestOutcome::Recorded { .. }) => {
                folded += 1;
                if let Err(error) = fold_download_task(state, &event) {
                    rejected.push(json!({
                        "index": index,
                        "code": "vua.download.store_failed",
                        "reason": error.to_string(),
                    }));
                }
            }
            Ok(IngestOutcome::Duplicate { .. }) => duplicates += 1,
            Err(error) => rejected.push(json!({
                "index": index,
                "code": consumer_error_code(&error),
                "reason": error.to_string(),
            })),
        }
    }
    FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "folded": folded,
            "duplicates": duplicates,
            "rejected": rejected,
        }),
    ))
}

/// The download task exists per ATTEMPT (`dl-<downloadId>-a<attempt>`): the
/// nine-state task records one run, and a fresh retry attempt is a new
/// record — the B3 attempt discipline. Folding is idempotent: a redelivered
/// event never advances a task twice.
fn fold_download_task(
    state: &HostState,
    event: &DownloadEventV01,
) -> Result<(), SqliteStoreError> {
    let task_id = format!("dl-{}-a{}", event.download_id, event.attempt);
    let occurred_at = event.occurred_at.as_str();
    match event.kind {
        crate::download_events::DownloadEventKind::Started => {
            if state.store.task(&task_id)?.is_none() {
                state.store.accept_task(&NewTask {
                    task_id: task_id.clone(),
                    correlation_id: event.download_id.clone(),
                    occurred_at: occurred_at.to_owned(),
                })?;
            }
            // The nine-state machine walks Queued -> Preparing -> Running;
            // a started download is already transferring, so it walks both
            // steps immediately (idempotently for redeliveries).
            let payload = || {
                json!({
                    "receivedBytes": event.received_bytes,
                    "expectedBytes": event.expected_bytes,
                })
            };
            if let Some(task) = state.store.task(&task_id)? {
                if task.state == TaskState::Queued {
                    state.store.mutate_task(
                        &task_id,
                        task.revision,
                        occurred_at,
                        TaskMutation::Transition {
                            state: TaskState::Preparing,
                            payload: payload(),
                        },
                    )?;
                }
            }
            if let Some(task) = state.store.task(&task_id)? {
                if task.state == TaskState::Preparing {
                    state.store.mutate_task(
                        &task_id,
                        task.revision,
                        occurred_at,
                        TaskMutation::Transition {
                            state: TaskState::Running,
                            payload: payload(),
                        },
                    )?;
                }
            }
        }
        crate::download_events::DownloadEventKind::Progress => {
            if let Some(task) = state.store.task(&task_id)? {
                if task.state == TaskState::Running {
                    state.store.mutate_task(
                        &task_id,
                        task.revision,
                        occurred_at,
                        TaskMutation::Progress {
                            payload: json!({
                                "receivedBytes": event.received_bytes,
                                "expectedBytes": event.expected_bytes,
                            }),
                        },
                    )?;
                }
            }
        }
        // interrupted returns to downloading: no task-side transition (the
        // same-attempt progress proves the resume).
        crate::download_events::DownloadEventKind::Interrupted => {}
        crate::download_events::DownloadEventKind::Completed => {
            complete_download_task(
                state,
                &task_id,
                occurred_at,
                TaskState::Succeeded,
                None,
            )?;
        }
        crate::download_events::DownloadEventKind::Cancelled => {
            complete_download_task(
                state,
                &task_id,
                occurred_at,
                TaskState::Cancelled,
                None,
            )?;
        }
        crate::download_events::DownloadEventKind::Failed => {
            let failure_kind = event
                .failure_kind
                .map(|kind| match kind {
                    crate::download_events::DownloadFailureKind::Policy => "policy",
                    crate::download_events::DownloadFailureKind::Unknown => "unknown",
                })
                .unwrap_or("unknown");
            let error = AppErrorV1::new(
                "vua.download.failed",
                ErrorCategory::ExternalFailure,
                "errors.download.failed",
                &event.download_id,
            )
            .with_param("failureKind", ParamValue::Text(failure_kind.to_owned()));
            complete_download_task(
                state,
                &task_id,
                occurred_at,
                TaskState::Failed,
                Some(error),
            )?;
        }
    }
    Ok(())
}

fn complete_download_task(
    state: &HostState,
    task_id: &str,
    occurred_at: &str,
    state_to: TaskState,
    error: Option<AppErrorV1>,
) -> Result<(), SqliteStoreError> {
    if let Some(task) = state.store.task(task_id)? {
        if !task.state.is_terminal() {
            state.store.mutate_task(
                task_id,
                task.revision,
                occurred_at,
                TaskMutation::Complete {
                    state: state_to,
                    error,
                    result: None,
                },
            )?;
        }
    }
    Ok(())
}

fn consumer_error_code(error: &ConsumerError) -> &'static str {
    match error {
        ConsumerError::SchemaVersion(_) => "vua.download.unsupported_schema",
        ConsumerError::AlreadyTerminal { .. } => "vua.download.already_terminal",
        ConsumerError::IllegalSequence { .. } => "vua.download.illegal_sequence",
        ConsumerError::Store(_) => "vua.download.store_failed",
    }
}

fn download_retry(
    state: &mut HostState,
    downloads: Arc<DownloadServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let task_id = request
        .pointer("/params/taskId")
        .and_then(Value::as_str)
        .unwrap_or("");
    let task = match state.store.task(task_id) {
        Ok(Some(task)) => task,
        Ok(None) => {
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.task.not_found",
                "errors.task.notFound",
                "validation",
            ))
        }
        Err(error) => {
            let _ = error;
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.download.store_failed",
                "errors.download.storeFailed",
                "internal",
            ));
        }
    };
    let download_id = task.correlation_id.clone();
    let history = match downloads.bdl.download_events(&download_id) {
        Ok(history) => history,
        Err(error) => {
            let _ = error;
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.download.store_failed",
                "errors.download.storeFailed",
                "internal",
            ));
        }
    };
    let lifecycle = match fold_lifecycle(&download_id, &history) {
        Ok(lifecycle) => lifecycle,
        Err(error) => {
            let _ = error;
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.download.not_retryable",
                "errors.download.notRetryable",
                "conflict",
            ));
        }
    };
    let decision = retry_decision(&lifecycle);
    let intent = match decision {
        RetryDecision::Resume => "resume",
        RetryDecision::StartNextAttempt { .. } => "retry",
        RetryDecision::GiveUp => {
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.download.not_retryable",
                "errors.download.notRetryable",
                "conflict",
            ))
        }
    };
    let intent_seq = downloads.queue_intent(&download_id, intent);
    FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "taskId": task_id,
            "decision": intent,
            "intentSeq": intent_seq,
        }),
    ))
}

fn application_error(
    request_id: &str,
    correlation_id: &str,
    code: &str,
    message_key: &str,
    category: &str,
) -> Value {
    json!({
        "contractVersion": APPLICATION_CONTRACT_VERSION,
        "requestId": request_id,
        "ok": false,
        "error": {
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "code": code,
            "category": category,
            "messageKey": message_key,
            "recoverable": true,
            "retryable": false,
            "correlationId": correlation_id,
        },
    })
}

fn store_error_code(error: &SqliteStoreError) -> &'static str {
    match error {
        SqliteStoreError::UnknownTask(_) => "vua.task.not_found",
        SqliteStoreError::IdempotencyConflict { .. } => "vua.command.id_conflict",
        SqliteStoreError::LeaseInspectionRequired(_) => "vua.project.inspect_required",
        SqliteStoreError::LeaseFenceMismatch { .. } => "vua.project.lease_conflict",
        SqliteStoreError::RevisionConflict { .. } => "vua.task.revision_conflict",
        _ => "vua.provider.persistence_failed",
    }
}

fn store_error_category(error: &SqliteStoreError) -> &'static str {
    match error {
        SqliteStoreError::UnknownTask(_) => "validation",
        SqliteStoreError::IdempotencyConflict { .. }
        | SqliteStoreError::RevisionConflict { .. } => "conflict",
        _ => "internal",
    }
}

fn request_fingerprint(request: &Value) -> String {
    let bytes = serde_json::to_vec(request).expect("JSON value serializes");
    let digest = Sha256::digest(bytes);
    let mut text = String::from("sha256:");
    for byte in digest {
        use std::fmt::Write as _;
        write!(&mut text, "{byte:02x}").expect("writing to String");
    }
    text
}

fn method_and_task(request: &Value) -> Value {
    json!({
        "method": request.get("method").and_then(Value::as_str).unwrap_or(""),
        "taskId": request.pointer("/params/taskId").and_then(Value::as_str).unwrap_or(""),
    })
}

fn state_name(state: TaskState) -> &'static str {
    match state {
        TaskState::Queued => "queued",
        TaskState::Preparing => "preparing",
        TaskState::Running => "running",
        TaskState::WaitingForInput => "waiting_for_input",
        TaskState::Paused => "paused",
        TaskState::Succeeded => "succeeded",
        TaskState::SucceededWithWarnings => "succeeded_with_warnings",
        TaskState::Failed => "failed",
        TaskState::Cancelled => "cancelled",
    }
}

fn provider_instance_id() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    format!("provider-{}-{nanos}", std::process::id())
}

fn now_rfc3339() -> String {
    use crate::Clock as _;
    crate::SystemClock.now_rfc3339()
}

// ==== production.* surface (production-use-case v0.1) ====
//
// Commands other than queries create persisted tasks; commandId idempotency
// is the store's `command_idempotency` table. Fast, non-Unity stages
// (Inspect, Plan) drive inline to a terminal state; confirmPlan/recover run
// the material intake executor on a worker thread and complete through the
// same store, so a host restart never loses an authoritative state.

/// Builds the production services from the provider process environment:
/// `VUA_UNITY_EDITOR` — absolute path to the pinned Unity editor executable,
/// `VUA_PROVIDER_DATA` — absolute root for the build records, package
/// identities, temp roots and the vrc-get environment. Both must be set and
/// absolute; anything else leaves production honestly unavailable.
pub fn production_config_from_env() -> Option<ProductionConfig> {
    let unity = std::env::var_os("VUA_UNITY_EDITOR")?;
    let data = std::env::var_os("VUA_PROVIDER_DATA")?;
    let (unity, data) = (PathBuf::from(unity), PathBuf::from(data));
    if !unity.is_absolute() || !data.is_absolute() {
        eprintln!(
            "VUA provider: VUA_UNITY_EDITOR/VUA_PROVIDER_DATA must be absolute paths; production stays unavailable"
        );
        return None;
    }
    let vpm = match crate::VrcGetLibBackend::with_environment_root(data.join("vpm-env"), false) {
        Ok(vpm) => Arc::new(vpm) as Arc<dyn crate::VpmBackend>,
        Err(_) => {
            eprintln!("VUA provider: vrc-get backend init failed; production stays unavailable");
            return None;
        }
    };
    let executor = Arc::new(MaterialExecutor::new(
        Arc::new(crate::UnityBatchBridge::new(unity)),
        crate::FileSystemSnapshotStore,
        vpm,
        BuildRecordStore::new(data.join("records")),
        Arc::new(crate::SystemClock),
        data.join("temp"),
        "2022.3.22f1",
        crate::LocalPackageIdentityStore::new(data.join("identities.json")),
    ));
    Some(ProductionConfig {
        executor,
        records: Arc::new(BuildRecordStore::new(data.join("records"))),
    })
}

fn production_task_id(command_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(command_id.as_bytes());
    let digest = hasher
        .finalize()
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<String>();
    format!("prod-{}", &digest[..12])
}

/// Applies a mutation at the task's CURRENT revision (workers and the host
/// loop share the store; revisions race through cancellation).
fn advance_production_task(
    store: &SqliteTaskStore,
    task_id: &str,
    mutation: TaskMutation,
) -> Result<Option<StoredTaskEvent>, SqliteStoreError> {
    let revision = store
        .task(task_id)?
        .ok_or_else(|| SqliteStoreError::UnknownTask(task_id.to_owned()))?
        .revision;
    store.mutate_task(task_id, revision, &now_rfc3339(), mutation)
}

fn param_str<'a>(request: &'a Value, pointer: &str) -> &'a str {
    request
        .pointer(pointer)
        .and_then(Value::as_str)
        .unwrap_or("")
}

fn production_request(
    state: &mut HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(services) = state.production.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.production.unavailable",
            "errors.production.unavailable",
            "unavailable",
        ));
    };
    let command_id = request.get("commandId").and_then(Value::as_str).unwrap_or("");
    let outcome: Result<FrameOutcome, ProductionError> = match method {
        "production.startInspection" => {
            start_inspection(state, &services, request, request_id, correlation_id, command_id)
        }
        "production.getInspection" => get_task_payload(state, request, request_id, "inspection"),
        "production.requestPlan" => {
            request_plan(state, &services, request, request_id, correlation_id, command_id)
        }
        "production.getPlan" => get_task_payload(state, request, request_id, "plan"),
        "production.confirmPlan" => {
            confirm_plan(state, &services, request, request_id, correlation_id, command_id, false)
        }
        "production.recover" => {
            confirm_plan(state, &services, request, request_id, correlation_id, command_id, true)
        }
        "production.getBuildRecord" => get_build_record(state, request, request_id),
        _ => Ok(FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.provider.unknown_method",
            "errors.provider.unknownMethod",
            "validation",
        ))),
    };
    match outcome {
        Ok(outcome) => outcome,
        Err(error) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            error.code,
            error.message_key,
            error.category,
        )),
    }
}

struct ProductionError {
    code: &'static str,
    message_key: &'static str,
    category: &'static str,
}

impl From<SqliteStoreError> for ProductionError {
    fn from(error: SqliteStoreError) -> Self {
        Self {
            code: store_error_code(&error),
            message_key: "errors.provider.persistence",
            category: store_error_category(&error),
        }
    }
}

fn not_recoverable_error() -> ProductionError {
    validation_error(
        "vua.production.not_recoverable",
        "errors.production.notRecoverable",
    )
}

fn validation_error(code: &'static str, message_key: &'static str) -> ProductionError {
    ProductionError { code, message_key, category: "validation" }
}

/// Accepts a production task idempotently and drives the staged
/// Queued → Preparing → Running transitions shared by every command.
fn accept_production_task(
    state: &HostState,
    command_kind: &str,
    command_id: &str,
    fingerprint_input: &Value,
    request_id: &str,
    correlation_id: &str,
) -> Result<(String, Option<FrameOutcome>), ProductionError> {
    if command_id.is_empty() {
        return Err(validation_error(
            "vua.production.invalid_command",
            "errors.production.invalidCommand",
        ));
    }
    let task_id = production_task_id(command_id);
    let new_task = NewTask {
        task_id: task_id.clone(),
        correlation_id: correlation_id.to_owned(),
        occurred_at: now_rfc3339(),
    };
    let acceptance = state.store.accept_idempotent_task(
        command_kind,
        command_id,
        &request_fingerprint(fingerprint_input),
        &new_task,
        &json!({"kind": command_kind}),
    )?;
    match acceptance {
        // A replayed commandId answers with the task's CURRENT snapshot, so
        // re-polling a command never shows a stale acceptance-time stub.
        IdempotentTaskAcceptance::Replayed { .. } => {
            let task = state
                .store
                .task(&task_id)?
                .ok_or_else(|| SqliteStoreError::UnknownTask(task_id.clone()))?;
            Ok((
                task_id,
                Some(FrameOutcome::Response(application_success(
                    request_id,
                    json!({
                        "contractVersion": APPLICATION_CONTRACT_VERSION,
                        "task": task_snapshot(state, &task),
                    }),
                ))),
            ))
        }
        IdempotentTaskAcceptance::Accepted { .. } => {
            advance_production_task(
                &state.store,
                &task_id,
                TaskMutation::Transition { state: TaskState::Preparing, payload: json!({}) },
            )?;
            advance_production_task(
                &state.store,
                &task_id,
                TaskMutation::Transition { state: TaskState::Running, payload: json!({}) },
            )?;
            Ok((task_id, None))
        }
    }
}

fn start_inspection(
    state: &HostState,
    services: &Arc<ProductionServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
    command_id: &str,
) -> Result<FrameOutcome, ProductionError> {
    let source_folder = param_str(request, "/params/sourceFolder").to_owned();
    let (task_id, replayed) = accept_production_task(
        state,
        "production.startInspection",
        command_id,
        &json!({"kind": "production.startInspection", "commandId": command_id, "sourceFolder": source_folder}),
        request_id,
        correlation_id,
    )?;
    if let Some(outcome) = replayed {
        return Ok(outcome);
    }

    let inspection = services
        .engine
        .inspect_folder(Path::new(&source_folder), correlation_id)
        .map_err(|error| persist_task_error(&state.store, &task_id, error))?;
    let result = serde_json::to_value(&inspection)
        .map_err(|_| SqliteStoreError::CorruptValue { field: "inspection", value: "json".into() })?;
    advance_production_task(
        &state.store,
        &task_id,
        TaskMutation::Complete { state: TaskState::Succeeded, error: None, result: Some(result) },
    )?;
    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "task": task_snapshot(state, &state.store.task(&task_id)?.expect("task exists")),
        }),
    )))
}

fn request_plan(
    state: &HostState,
    services: &Arc<ProductionServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
    command_id: &str,
) -> Result<FrameOutcome, ProductionError> {
    let inspection_task_id = param_str(request, "/params/inspectionTaskId").to_owned();
    let mode_raw = param_str(request, "/params/mode").to_owned();
    let project_id = param_str(request, "/params/projectId").to_owned();
    let project_fingerprint = param_str(request, "/params/projectFingerprint").to_owned();
    if inspection_task_id.is_empty()
        || mode_raw.is_empty()
        || project_id.is_empty()
        || project_fingerprint.is_empty()
    {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    let mode: MaterialEntryMode = serde_json::from_value(Value::String(mode_raw.clone()))
        .map_err(|_| {
            validation_error(
                "vua.production.invalid_params",
                "errors.production.invalidParams",
            )
        })?;

    let inspection_task = state
        .store
        .task(&inspection_task_id)?
        .ok_or_else(|| {
            validation_error("vua.task.not_found", "errors.task.notFound")
        })?;
    let inspection: SourceFolderInspectionV01 = serde_json::from_value(
        inspection_task.result.clone().unwrap_or(Value::Null),
    )
    .map_err(|_| {
        validation_error(
            "vua.production.inspection_mismatch",
            "errors.production.inspectionMismatch",
        )
    })?;

    let (task_id, replayed) = accept_production_task(
        state,
        "production.requestPlan",
        command_id,
        &json!({
            "commandId": command_id,
            "inspectionTaskId": inspection_task_id,
            "mode": mode_raw,
            "projectId": project_id,
            "projectFingerprint": project_fingerprint,
        }),
        request_id,
        correlation_id,
    )?;
    if let Some(outcome) = replayed {
        return Ok(outcome);
    }

    let plan = services
        .engine
        .plan(mode, project_id, project_fingerprint, inspection, correlation_id)
        .map_err(|error| persist_task_error(&state.store, &task_id, error))?;
    let result = serde_json::to_value(&plan)
        .map_err(|_| SqliteStoreError::CorruptValue { field: "plan", value: "json".into() })?;
    advance_production_task(
        &state.store,
        &task_id,
        TaskMutation::Complete { state: TaskState::Succeeded, error: None, result: Some(result) },
    )?;
    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "task": task_snapshot(state, &state.store.task(&task_id)?.expect("task exists")),
        }),
    )))
}

/// Builds and runs the confirmed material intake (confirmPlan), or performs
/// a recovery decision (recover): `continue` re-runs the confirmed plan
/// fresh under the executor's attempt semantics; `rollback` restores the
/// failed attempt's recovery point WITHOUT running any import. Recovery
/// binds the original failed task and always requires a Kernel-issued user
/// decision id. Every mutating run takes the full mutation gate — the
/// SQLite project lease, the cross-profile project lock, and the
/// pending-mutation marker — for its whole duration.
fn confirm_plan(
    state: &HostState,
    services: &Arc<ProductionServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
    command_id: &str,
    recovery: bool,
) -> Result<FrameOutcome, ProductionError> {
    let plan_task_id = param_str(request, "/params/planTaskId").to_owned();
    let source_folder = param_str(request, "/params/sourceFolder").to_owned();
    let project_root = param_str(request, "/params/projectRoot").to_owned();
    let artifact_output_root = param_str(request, "/params/artifactOutputRoot").to_owned();
    let confirmed_at = param_str(request, "/params/confirmedAt").to_owned();
    let risk_choice = param_str(request, "/params/riskChoice").to_owned();
    let remember_for_session = request
        .pointer("/params/rememberForSession")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let user_decision_id = param_str(request, "/params/userDecisionId").to_owned();
    let original_task_id = param_str(request, "/params/originalTaskId").to_owned();
    let decision = if recovery {
        let decision = param_str(request, "/params/decision").to_owned();
        if !matches!(decision.as_str(), "continue" | "rollback") {
            return Err(validation_error(
                "vua.production.invalid_params",
                "errors.production.invalidParams",
            ));
        }
        decision
    } else {
        "execute".to_owned()
    };
    if recovery && user_decision_id.trim().is_empty() {
        return Err(validation_error(
            "vua.production.user_decision_required",
            "errors.production.userDecisionRequired",
        ));
    }
    if project_root.is_empty()
        || (decision != "rollback"
            && (plan_task_id.is_empty()
                || source_folder.is_empty()
                || artifact_output_root.is_empty()
                || risk_choice.is_empty()))
    {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    if recovery && original_task_id.is_empty() {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    // Inspect-first applies to the WHOLE recovery: every recovery run
    // captures a project inspection before its mutation, whatever the
    // original failure was. ("No receipt" alone would prove nothing — a
    // crash after Unity mutated but before the record was written also has
    // no receipt — so the inspection, not the receipt, governs here.)
    let require_project_inspection = recovery;
    if recovery {
        // Recovery binds the ORIGINAL failed run: only a terminal failed or
        // cancelled production task is a recovery source.
        let original = state
            .store
            .task(&original_task_id)?
            .ok_or_else(|| validation_error("vua.task.not_found", "errors.task.notFound"))?;
        if !matches!(original.state, TaskState::Failed | TaskState::Cancelled)
            || !original.task_id.starts_with("prod-")
        {
            return Err(validation_error(
                "vua.production.not_recoverable",
                "errors.production.notRecoverable",
            ));
        }
    }

    // What the worker will do. Built BEFORE accepting so a malformed plan
    // or an unreadable receipt is a validation error, never a half-created
    // task.
    enum Run {
        Execute(Box<MaterialIntakeConfirmationV01>),
        Rollback {
            snapshot_id: String,
            original_record: Box<crate::build_record::BuildRecordV01>,
        },
    }
    let run = if decision == "rollback" {
        // The failed attempt's receipt names its recovery snapshot.
        let original = state
            .store
            .task(&original_task_id)?
            .ok_or_else(|| validation_error("vua.task.not_found", "errors.task.notFound"))?;
        let record_id = original
            .result
            .as_ref()
            .and_then(|result| result.get("buildRecordId"))
            .and_then(Value::as_str)
            .ok_or_else(|| {
                validation_error(
                    "vua.production.not_recoverable",
                    "errors.production.notRecoverable",
                )
            })?
            .to_owned();
        let record = services.records.read(&record_id).map_err(|_| {
            validation_error(
                "vua.production.not_recoverable",
                "errors.production.notRecoverable",
            )
        })?;
        // Three-way ownership binding, sides 1+2: the failed run's receipt
        // must name the very project the caller points at (side 3 — the
        // snapshot manifest — is enforced inside restore). Records written
        // before identity binding existed carry none and are not
        // recoverable through this path.
        let request_identity = ProjectIdentity::from_existing_path(&project_root)
            .map_err(|_| {
                validation_error(
                    "vua.project.identity_invalid",
                    "errors.project.identityInvalid",
                )
            })?;
        if record.project_identity.as_deref() != Some(request_identity.as_str()) {
            return Err(not_recoverable_error());
        }
        let snapshot_id = record
            .snapshot
            .as_ref()
            .map(|snapshot| snapshot.snapshot_id.clone())
            .ok_or_else(not_recoverable_error)?;
        // The requested project must actually own this snapshot: a
        // recovery can never restore a snapshot directory from ANOTHER
        // project root the caller supplies.
        if !PathBuf::from(&project_root)
            .join(".vua/snapshots")
            .join(&snapshot_id)
            .is_dir()
        {
            return Err(not_recoverable_error());
        }
        Run::Rollback { snapshot_id, original_record: Box::new(record) }
    } else {
        let plan_task = state
            .store
            .task(&plan_task_id)?
            .ok_or_else(|| validation_error("vua.task.not_found", "errors.task.notFound"))?;
        let plan: MaterialIntakePlanV01 =
            serde_json::from_value(plan_task.result.clone().unwrap_or(Value::Null)).map_err(
                |_| {
                    validation_error(
                        "vua.production.plan_mismatch",
                        "errors.production.planMismatch",
                    )
                },
            )?;
        let choice: RiskDecisionChoice = serde_json::from_value(Value::String(risk_choice.clone()))
            .map_err(|_| {
                validation_error(
                    "vua.production.invalid_params",
                    "errors.production.invalidParams",
                )
            })?;
        Run::Execute(Box::new(MaterialIntakeConfirmationV01 {
            plan: plan.clone(),
            risk_decision: RiskDecisionV01 {
                choice,
                source_fingerprint: plan.source.source_fingerprint.clone(),
                risk_fingerprint: plan.source.risk_fingerprint.clone(),
                remember_for_session,
            },
            confirmed_at: if confirmed_at.is_empty() { now_rfc3339() } else { confirmed_at.clone() },
            correlation_id: correlation_id.to_owned(),
        }))
    };

    // A recovery `continue` binds the ORIGINAL failed run: its receipt
    // must belong to the same plan and the same project as this
    // request, otherwise the two are unrelated and not recoverable.
    if recovery && decision == "continue" {
        let original = state
            .store
            .task(&original_task_id)?
            .ok_or_else(not_recoverable_error)?;
        let original_record_id = original
            .result
            .as_ref()
            .and_then(|result| result.get("buildRecordId"))
            .and_then(Value::as_str);
        let plan_for_binding = match &run {
            Run::Execute(confirmation) => &confirmation.plan,
            Run::Rollback { .. } => unreachable!(),
        };
        if let Some(original_record_id) = original_record_id {
            let original_record = services
                .records
                .read(original_record_id)
                .map_err(|_| not_recoverable_error())?;
            if original_record.plan_id != plan_for_binding.plan_id
                || original_record.project_id != plan_for_binding.project_id
            {
                return Err(not_recoverable_error());
            }
        }
        // An original WITHOUT a receipt was refused before any mutation
        // (e.g. at the mutation gate): nothing to bind, recovery proceeds
        // fresh.
    }

    // The idempotency fingerprint binds the FULL parameter set: the same
    // commandId with a different plan, source, project, risk decision or
    // recovery decision is a conflict (vua.command.id_conflict), never a
    // silent replay.
    let fingerprint_input = json!({
        "commandId": command_id,
        "planTaskId": plan_task_id,
        "sourceFolder": source_folder,
        "projectRoot": project_root,
        "artifactOutputRoot": artifact_output_root,
        "confirmedAt": confirmed_at,
        "riskChoice": risk_choice,
        "rememberForSession": remember_for_session,
        "originalTaskId": original_task_id,
        "decision": decision,
        "userDecisionId": user_decision_id,
    });
    let (task_id, replayed) = accept_production_task(
        state,
        if recovery { "production.recover" } else { "production.confirmPlan" },
        command_id,
        &fingerprint_input,
        request_id,
        correlation_id,
    )?;
    if let Some(outcome) = replayed {
        return Ok(outcome);
    }

    let token = MaterialCancelToken::new();
    services
        .running
        .lock()
        .expect("running poisoned")
        .insert(task_id.clone(), token.clone());

    let store = Arc::clone(&state.store);
    let executor = Arc::clone(&services.executor);
    let services_for_worker = Arc::clone(services);
    let owner_instance_id = state.provider_instance_id.clone();
    let worker_task_id = task_id.clone();
    let worker_correlation = correlation_id.to_owned();
    // userDecisionId stays an AUTHORIZATION record (task result + recovery
    // receipt); the lease takeover credential is a PROJECT INSPECTION.
    let recovery_decision_id = user_decision_id.clone();
    let recovery_started_at = now_rfc3339();
    let inspect: Option<ProjectInspectFn> = if recovery {
        let executor_for_inspect = Arc::clone(&executor);
        let correlation_for_inspect = worker_correlation.clone();
        Some(Arc::new(move |project: &ProjectRef| {
            executor_for_inspect.inspect_project(project, &correlation_for_inspect)
        }))
    } else {
        None
    };
    std::thread::spawn(move || {
        let project_id = match &run {
            Run::Execute(confirmation) => confirmation.plan.project_id.clone(),
            Run::Rollback { original_record, .. } => original_record.project_id.clone(),
        };
        let project =
            ProjectRef { id: project_id, root: PathBuf::from(&project_root) };

        // The mutation gate: SQLite lease → cross-profile project lock →
        // pending-mutation marker, held for the whole mutating run. A crash
        // leaves the marker behind (inspect-first evidence) and the OS lock
        // releases itself; prepare_shutdown sees the lease as blocking.
        let (gate, inspection_evidence) = match MutationGate::acquire(
            &store,
            &project_root,
            &owner_instance_id,
            &worker_task_id,
            &worker_correlation,
            inspect.as_ref(),
            require_project_inspection,
        ) {
            Ok(gate) => gate,
            Err(error) => {
                if let Ok(Some(event)) = advance_production_task(
                    &store,
                    &worker_task_id,
                    TaskMutation::Complete {
                        state: TaskState::Failed,
                        error: Some(error),
                        result: None,
                    },
                ) {
                    services_for_worker
                        .completed_events
                        .lock()
                        .expect("completed events poisoned")
                        .push(event);
                }
                services_for_worker
                    .running
                    .lock()
                    .expect("running poisoned")
                    .remove(&worker_task_id);
                return;
            }
        };

        let (state_final, error, result_value) = match &run {
            Run::Execute(confirmation) => {
                let report = executor.execute(
                    confirmation,
                    Path::new(&source_folder),
                    &project,
                    Path::new(&artifact_output_root),
                    &token,
                );
                let result = MaterialTaskResult {
                    plan_id: report.plan_id.clone(),
                    status: match report.status {
                        MaterialExecutionStatus::Succeeded => "succeeded".to_owned(),
                        MaterialExecutionStatus::Cancelled => "cancelled".to_owned(),
                        MaterialExecutionStatus::Failed => "failed".to_owned(),
                    },
                    error_code: report.error_code.clone(),
                    rollback: match report.rollback {
                        RollbackOutcome::NotNeeded => "not_needed".to_owned(),
                        RollbackOutcome::Restored => "restored".to_owned(),
                        RollbackOutcome::Failed => "failed".to_owned(),
                    },
                    build_record_id: report.build_record_id.clone(),
                    replayed: report.replayed,
                };
                let result_value = serde_json::to_value(&result).ok();
                match report.status {
                    MaterialExecutionStatus::Succeeded => {
                        (TaskState::Succeeded, None, result_value)
                    }
                    MaterialExecutionStatus::Cancelled => {
                        (TaskState::Cancelled, None, result_value)
                    }
                    MaterialExecutionStatus::Failed => (
                        TaskState::Failed,
                        Some(
                            AppErrorV1::new(
                                report
                                    .error_code
                                    .clone()
                                    .unwrap_or_else(|| "vua.material.failed".to_owned()),
                                ErrorCategory::ExternalFailure,
                                "errors.material.executionFailed",
                                &confirmation.correlation_id,
                            )
                            .with_param(
                                "planId",
                                crate::contracts::ParamValue::Text(report.plan_id.clone()),
                            )
                            .with_recoverable(true),
                        ),
                        result_value,
                    ),
                }
            }
            Run::Rollback { snapshot_id, original_record } => {
                let reference = crate::SnapshotRef {
                    id: snapshot_id.clone(),
                    path: project.root.join(".vua/snapshots").join(snapshot_id),
                };
                // The failed attempt's restore left a quarantine for this
                // same snapshot. The user's explicit rollback supersedes
                // it, but the quarantine holds the pre-restore project
                // state — it is VERSIONED aside, never deleted before the
                // new restore has succeeded.
                let stamp = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|elapsed| elapsed.as_millis())
                    .unwrap_or(0);
                let stale_quarantine =
                    project.root.join(".vua/recovery").join(snapshot_id);
                if stale_quarantine.exists() {
                    let archived = project
                        .root
                        .join(".vua/recovery")
                        .join(format!("{snapshot_id}.superseded-{stamp}"));
                    let _ = std::fs::rename(&stale_quarantine, &archived);
                }
                match crate::FileSystemSnapshotStore.restore_verified(&project, &reference) {
                    Ok(()) => {
                        // The recovery itself gets an immutable receipt
                        // with status `recovered`, bound to THIS recovery
                        // task and decision, referencing the failed run's
                        // record it supersedes.
                        let recovered_id = format!(
                            "{}-recover-{stamp}",
                            original_record.record_id
                        );
                        let mut recovered = original_record.clone();
                        recovered.record_id = recovered_id.clone();
                        recovered.status = crate::BuildRecordStatus::Recovered;
                        recovered.task_id = worker_task_id.clone();
                        recovered.correlation_id = worker_correlation.clone();
                        recovered.started_at = recovery_started_at.clone();
                        recovered.completed_at = now_rfc3339();
                        recovered.recovered_from_record_id =
                            Some(original_record.record_id.clone());
                        recovered.recovery_decision_id =
                            Some(recovery_decision_id.clone());
                        recovered.snapshot = Some(crate::BuildSnapshotEvidenceV01 {
                            snapshot_id: snapshot_id.clone(),
                            verified: true,
                            restore_attempted: true,
                            restore_succeeded: Some(true),
                        });
                        recovered.bridge_jobs = Vec::new();
                        recovered.validation = None;
                        recovered.local_vpm = None;
                        recovered.result_code = "vua.material.recovered".to_owned();
                        // The project restore HAS happened; a receipt
                        // publish failure is nevertheless a typed failure
                        // (authoritative receipts are not optional) whose
                        // retry is safe: the restore repeats and the record
                        // is written under the same id.
                        match services_for_worker.records.publish(&recovered) {
                            Ok(_) => (
                                TaskState::Succeeded,
                                None,
                                Some(json!({
                                    "recovered": "rollback",
                                    "restored": true,
                                    "snapshotId": snapshot_id,
                                    "buildRecordId": recovered_id,
                                    "recoveryDecisionId": recovery_decision_id,
                                })),
                            ),
                            Err(publish_error) => (
                                TaskState::Failed,
                                Some(
                                    AppErrorV1::new(
                                        "vua.material.record_failed",
                                        ErrorCategory::ExternalFailure,
                                        "errors.material.recordFailed",
                                        &worker_correlation,
                                    )
                                    .with_recoverable(true),
                                ),
                                Some(json!({
                                    "recovered": "rollback",
                                    "restored": true,
                                    "recordPersisted": false,
                                    "detail": publish_error.to_string(),
                                })),
                            ),
                        }
                    }
                    Err(restore_error) => (
                        TaskState::Failed,
                        Some(
                            AppErrorV1::new(
                                "vua.material.rollback_failed",
                                ErrorCategory::ExternalFailure,
                                "errors.material.executionFailed",
                                &worker_correlation,
                            )
                            .with_recoverable(true),
                        ),
                        Some(json!({
                            "recovered": "rollback",
                            "restored": false,
                            "detail": restore_error.to_string(),
                        })),
                    ),
                }
            }
        };

        // The captured project inspection rides along in the task result:
        // it ties the recovery to an observed project state, not just to a
        // user decision.
        let result_value = result_value.map(|mut value| {
            if let Some(inspection) = inspection_evidence.as_ref() {
                if let Some(object) = value.as_object_mut() {
                    if let Ok(evidence) = serde_json::to_value(inspection) {
                        object.insert("projectInspection".into(), evidence);
                    }
                }
            }
            value
        });

        // Persist the authoritative terminal state BEFORE releasing the
        // gate: between the two, a safe_to_stop verdict could otherwise
        // miss both the lease and the unfinished task.
        if let Ok(Some(event)) = advance_production_task(
            &store,
            &worker_task_id,
            TaskMutation::Complete { state: state_final, error, result: result_value },
        ) {
            services_for_worker
                .completed_events
                .lock()
                .expect("completed events poisoned")
                .push(event);
        }
        gate.release();
        services_for_worker
            .running
            .lock()
            .expect("running poisoned")
            .remove(&worker_task_id);
    });

    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "task": task_snapshot(state, &state.store.task(&task_id)?.expect("task exists")),
        }),
    )))
}

/// The read-only project inspection closure a recovery run carries: it
/// produces the fingerprint the takeover credential binds.
type ProjectInspectFn =
    Arc<dyn Fn(&ProjectRef) -> Result<String, crate::AppErrorV1> + Send + Sync>;

/// A captured project inspection: the credential that authorizes a lease
/// takeover and the supersession of crash evidence. `inspection_id` binds
/// the normalized project identity, the observed fingerprint and the lease
/// generation at inspection time.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInspectionEvidence {
    pub inspection_id: String,
    pub project_fingerprint: String,
    pub observed_at: String,
    pub lease_generation: u64,
}

/// Builds the project ref an inspection command addresses. The id is a
/// task-scoped label — the binding power lives in the identity digest,
/// not in this label.
fn rootless_project_ref(project_root: &str, task_id: &str) -> ProjectRef {
    ProjectRef {
        id: format!("{task_id}-project-inspect"),
        root: PathBuf::from(project_root),
    }
}

/// Runs the read-only project inspection through the recover closure and
/// derives the inspection id from identity + fingerprint + generation.
fn run_project_inspection(
    inspect: Option<&ProjectInspectFn>,
    identity: &ProjectIdentity,
    project: &ProjectRef,
    lease_generation: u64,
    correlation_id: &str,
) -> Result<ProjectInspectionEvidence, AppErrorV1> {
    let inspect = inspect.ok_or_else(|| {
        AppErrorV1::new(
            "vua.project.inspect_required",
            ErrorCategory::Conflict,
            "errors.project.inspectRequired",
            correlation_id,
        )
        .with_recoverable(true)
    })?;
    let project_fingerprint = inspect(project).map_err(|error| {
        AppErrorV1::new(
            "vua.project.inspect_failed",
            ErrorCategory::ExternalFailure,
            "errors.project.inspectFailed",
            correlation_id,
        )
        .with_recoverable(true)
        .with_param("detail", crate::contracts::ParamValue::Text(format!("{error:?}")))
    })?;
    let observed_at = now_rfc3339();
    let mut hasher = Sha256::new();
    hasher.update(identity.as_str().as_bytes());
    hasher.update(project_fingerprint.as_bytes());
    hasher.update(lease_generation.to_le_bytes());
    hasher.update(observed_at.as_bytes());
    let digest = hasher
        .finalize()
        .iter()
        .map(|byte| format!("{:02x}", byte))
        .collect::<String>();
    Ok(ProjectInspectionEvidence {
        inspection_id: format!("pins-{}", &digest[..16]),
        project_fingerprint,
        observed_at,
        lease_generation,
    })
}

/// The full cross-profile mutation gate, acquired in order (SQLite lease →
/// project lock → pending-mutation marker) and released in reverse. Any
/// acquisition failure fails the task with a typed error — never a silent
/// mutate-without-lock.
struct MutationGate {
    store: Arc<SqliteTaskStore>,
    identity: ProjectIdentity,
    owner_instance_id: String,
    generation: u64,
    marker: Option<MutationMarkerGuard>,
    lock: Option<ProjectLockGuard>,
}

impl MutationGate {
    fn acquire(
        store: &Arc<SqliteTaskStore>,
        project_root: &str,
        owner_instance_id: &str,
        task_id: &str,
        correlation_id: &str,
        inspect: Option<&ProjectInspectFn>,
        require_project_inspection: bool,
    ) -> Result<(Self, Option<ProjectInspectionEvidence>), AppErrorV1> {
        let identity = ProjectIdentity::from_existing_path(project_root).map_err(|error| {
            AppErrorV1::new(
                "vua.project.identity_invalid",
                ErrorCategory::Validation,
                "errors.project.identityInvalid",
                correlation_id,
            )
            .with_recoverable(false)
            .with_param("detail", crate::contracts::ParamValue::Text(error.to_string()))
        })?;

        let mut inspection_evidence: Option<ProjectInspectionEvidence> = None;
        let lease =
            match store.acquire_project_lease(
                &identity,
                owner_instance_id,
                task_id,
                &now_rfc3339(),
            ) {
                Ok(lease) => {
                if require_project_inspection {
                    let inspection = run_project_inspection(
                        inspect,
                        &identity,
                        &rootless_project_ref(project_root, task_id),
                        lease.generation,
                        correlation_id,
                    )?;
                    inspection_evidence = Some(inspection);
                }
                lease
            }
                Err(SqliteStoreError::LeaseHeld { .. }) => {
                    let existing = store
                        .project_lease(&identity)
                        .map_err(|error| {
                            AppErrorV1::new(
                                "vua.project.lease_unavailable",
                                ErrorCategory::Unavailable,
                                "errors.project.leaseUnavailable",
                                correlation_id,
                            )
                            .with_recoverable(true)
                            .with_param(
                                "detail",
                                crate::contracts::ParamValue::Text(error.to_string()),
                            )
                        })?
                        .ok_or_else(|| {
                            AppErrorV1::new(
                                "vua.project.lease_unavailable",
                                ErrorCategory::Unavailable,
                                "errors.project.leaseUnavailable",
                                correlation_id,
                            )
                            .with_recoverable(true)
                        })?;
                    if !existing.recovery_required {
                        // A live owner holds the lease: refuse, never steal.
                        return Err(AppErrorV1::new(
                            "vua.project.lease_unavailable",
                            ErrorCategory::Unavailable,
                            "errors.project.leaseUnavailable",
                            correlation_id,
                        )
                        .with_recoverable(true)
                        .with_param(
                            "holder",
                            crate::contracts::ParamValue::Text(
                                existing.owner_instance_id.clone(),
                            ),
                        ));
                    }
                    // A stale lease from an interrupted owner recovers ONLY
                    // through a PROJECT INSPECTION: the read-only Bridge
                    // inspection produces the credential (identity +
                    // fingerprint + lease generation) that the takeover
                    // binds. A user decision alone never supersedes it.
                    let inspection = run_project_inspection(
                        inspect,
                        &identity,
                        &rootless_project_ref(project_root, task_id),
                        existing.generation,
                        correlation_id,
                    )?;
                    let inspection_id = inspection.inspection_id.clone();
                    inspection_evidence = Some(inspection);
                    store
                        .takeover_project_lease_after_inspect(
                            &identity,
                            existing.generation,
                            owner_instance_id,
                            task_id,
                            inspection_id.as_str(),
                            &now_rfc3339(),
                        )
                        .map_err(|error| {
                            AppErrorV1::new(
                                "vua.project.lease_unavailable",
                                ErrorCategory::Unavailable,
                                "errors.project.leaseUnavailable",
                                correlation_id,
                            )
                            .with_recoverable(true)
                            .with_param(
                                "detail",
                                crate::contracts::ParamValue::Text(error.to_string()),
                            )
                        })?
                }
                Err(error) => {
                    return Err(AppErrorV1::new(
                        "vua.project.lease_unavailable",
                        ErrorCategory::Unavailable,
                        "errors.project.leaseUnavailable",
                        correlation_id,
                    )
                    .with_recoverable(true)
                    .with_param(
                        "detail",
                        crate::contracts::ParamValue::Text(error.to_string()),
                    ))
                }
            };

        let holder = LockHolder {
            channel: "provider".to_owned(),
            profile: "default".to_owned(),
            pid: std::process::id(),
            instance_id: owner_instance_id.to_owned(),
            acquired_at: now_rfc3339(),
        };
        let root = PathBuf::from(project_root);
        let lock = match acquire_project_lock(&root, holder.clone()) {
            Ok(lock) => Some(lock),
            Err(ProjectLockError::Held { previous }) => {
                let _ = store.release_project_lease(
                    &identity,
                    owner_instance_id,
                    lease.generation,
                );
                return Err(AppErrorV1::new(
                    "vua.project.lock_held",
                    ErrorCategory::Conflict,
                    "errors.project.lockHeld",
                    correlation_id,
                )
                .with_recoverable(true)
                .with_param(
                    "holder",
                    crate::contracts::ParamValue::Text(
                        previous
                            .map(|holder| holder.instance_id)
                            .unwrap_or_else(|| "unknown".to_owned()),
                    ),
                ));
            }
            Err(ProjectLockError::Io(lock_error)) => {
                let _ = store.release_project_lease(
                    &identity,
                    owner_instance_id,
                    lease.generation,
                );
                return Err(AppErrorV1::new(
                    "vua.project.lock_failed",
                    ErrorCategory::ExternalFailure,
                    "errors.project.lockFailed",
                    correlation_id,
                )
                .with_recoverable(true)
                .with_param(
                    "detail",
                    crate::contracts::ParamValue::Text(lock_error.to_string()),
                ));
            }
        };

        // Inspect-first discipline (ADR decision 7): a leftover marker
        // from any profile is never silently overwritten. Plain confirms
        // are refused until a recovery decision supersedes it — and that
        // path ARCHIVES the old marker instead of destroying it.
        match read_pending_mutation(&root) {
            PendingMutation::None => {}
            finding @ (PendingMutation::Leftover(_) | PendingMutation::Unreadable) => {
                // Superseding requires a CAPTURED project inspection — a
                // user decision alone never archives crash evidence.
                if inspection_evidence.is_none() {
                    drop(lock);
                    let _ = store.release_project_lease(
                        &identity,
                        owner_instance_id,
                        lease.generation,
                    );
                    return Err(AppErrorV1::new(
                        "vua.project.inspect_required",
                        ErrorCategory::Conflict,
                        "errors.project.inspectRequired",
                        correlation_id,
                    )
                    .with_recoverable(true)
                    .with_param(
                        "finding",
                        crate::contracts::ParamValue::Text(match finding {
                            PendingMutation::Leftover(marker) => marker.mutation_kind,
                            _ => "unreadable".to_owned(),
                        }),
                    ));
                }
                let stamp = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|elapsed| elapsed.as_millis())
                    .unwrap_or(0);
                let _ = std::fs::rename(
                    root.join(".vua").join(MARKER_FILE_NAME),
                    root.join(".vua").join(format!("{MARKER_FILE_NAME}.superseded-{stamp}")),
                );
            }
        }

        let marker = match begin_mutation(&root, "material_intake", &holder) {
            Ok(marker) => Some(marker),
            Err(marker_error) => {
                drop(lock);
                let _ = store.release_project_lease(
                    &identity,
                    owner_instance_id,
                    lease.generation,
                );
                return Err(AppErrorV1::new(
                    "vua.project.marker_failed",
                    ErrorCategory::ExternalFailure,
                    "errors.project.markerFailed",
                    correlation_id,
                )
                .with_recoverable(true)
                .with_param(
                    "detail",
                    crate::contracts::ParamValue::Text(marker_error.to_string()),
                ));
            }
        };

        Ok((
            Self {
                store: Arc::clone(store),
                identity,
                owner_instance_id: owner_instance_id.to_owned(),
                generation: lease.generation,
                marker,
                lock,
            },
            inspection_evidence,
        ))
    }

    /// Releases in reverse order: marker → lock → SQLite lease.
    fn release(self) {
        if let Some(marker) = self.marker {
            let _ = marker.release();
        }
        if let Some(lock) = self.lock {
            let _ = lock.release();
        }
        let _ = self.store.release_project_lease(
            &self.identity,
            &self.owner_instance_id,
            self.generation,
        );
    }
}

fn get_task_payload(
    state: &HostState,
    request: &Value,
    request_id: &str,
    kind: &str,
) -> Result<FrameOutcome, ProductionError> {
    let task_id = param_str(request, "/params/taskId").to_owned();
    let task = state
        .store
        .task(&task_id)?
        .ok_or_else(|| validation_error("vua.task.not_found", "errors.task.notFound"))?;
    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "taskId": task.task_id,
            "state": state_name(task.state),
            kind: task.result,
        }),
    )))
}

fn get_build_record(
    state: &HostState,
    request: &Value,
    request_id: &str,
) -> Result<FrameOutcome, ProductionError> {
    let services = state.production.as_ref().expect("checked by production_request");
    let plan_id = param_str(request, "/params/planId").to_owned();
    if plan_id.is_empty() {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    let record_id = if plan_id.starts_with("material-") {
        plan_id.clone()
    } else {
        format!("material-{plan_id}")
    };
    let record = services
        .records
        .read(&record_id)
        .map_err(|_| validation_error("vua.task.not_found", "errors.task.notFound"))?;
    let value = serde_json::to_value(&record).map_err(|_| {
        validation_error("vua.production.record_invalid", "errors.production.recordInvalid")
    })?;
    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "buildRecord": value,
        }),
    )))
}

/// Fails a task with the given application error; used when an inline stage
/// (Inspect/Plan) fails so the authoritative terminal state is persisted.
fn persist_task_error(
    store: &SqliteTaskStore,
    task_id: &str,
    error: AppErrorV1,
) -> ProductionError {
    let _ = advance_production_task(
        store,
        task_id,
        TaskMutation::Complete {
            state: TaskState::Failed,
            error: Some(error),
            result: None,
        },
    );
    ProductionError {
        code: "vua.production.stage_failed",
        message_key: "errors.production.stageFailed",
        category: "external_failure",
    }
}



/// Emits every finished production task's terminal event — including when
/// the host is otherwise idle waiting for input.
fn write_pending_events(
    state: &mut HostState,
    output: &mut impl Write,
) -> Result<(), ProviderHostError> {
    let mut pending_events = Vec::new();
    if let Some(services) = &state.production {
        let mut guard = services
            .completed_events
            .lock()
            .expect("completed events poisoned");
        pending_events.extend(guard.drain(..));
        drop(guard);
    }
    for event in pending_events {
        let event_id = format!("sqlite-{}-{}", event.task_id, event.revision);
        write_frame(output, &event_id, "event", task_event(&event_id, &event))?;
    }
    Ok(())
}

fn write_frame(
    output: &mut impl Write,
    frame_id: &str,
    kind: &str,
    payload: Value,
) -> Result<(), ProviderHostError> {
    serde_json::to_writer(
        &mut *output,
        &OutboundFrame {
            frame_version: PROVIDER_FRAME_VERSION,
            frame_id,
            kind,
            payload,
        },
    )?;
    output.write_all(b"\n")?;
    output.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{NewTask, ProjectIdentity};
    use std::io::Cursor;

    fn database_path(label: &str) -> std::path::PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("vua-provider-{label}-{nanos}.db"))
    }

    fn frame(id: &str, kind: &str, payload: Value) -> String {
        json!({
            "frameVersion": PROVIDER_FRAME_VERSION,
            "frameId": id,
            "kind": kind,
            "payload": payload,
        })
        .to_string()
    }

    fn request(id: &str, method: &str, extra: Value) -> Value {
        let mut value = json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "requestId": id,
            "correlationId": "corr-host-test",
            "kind": if method == "task.requestCancellation" { "command" } else { "query" },
            "method": method,
            "params": {},
        });
        for (key, value_to_add) in extra.as_object().expect("test extra object") {
            value
                .as_object_mut()
                .expect("test request object")
                .insert(key.clone(), value_to_add.clone());
        }
        value
    }

    fn parse_frames(bytes: Vec<u8>) -> Vec<Value> {
        String::from_utf8(bytes)
            .unwrap()
            .lines()
            .map(|line| serde_json::from_str(line).unwrap())
            .collect()
    }

    #[test]
    fn supervised_protocol_queries_cancels_emits_and_replays_after_restart() {
        let path = database_path("roundtrip");
        {
            let store = SqliteTaskStore::open(&path).unwrap();
            store
                .accept_task(&NewTask {
                    task_id: "task-host".into(),
                    correlation_id: "corr-task-host".into(),
                    occurred_at: "2026-09-02T00:00:00.000Z".into(),
                })
                .unwrap();
            store.checkpoint().unwrap();
        }

        let cancel = request(
            "request-cancel-1",
            "task.requestCancellation",
            json!({
                "commandId": "command-cancel-1",
                "params": {"taskId": "task-host", "observedRevision": 1},
            }),
        );
        let input = [
            frame("frame-handshake", "handshake", Value::Null),
            frame(
                "frame-get",
                "request",
                request(
                    "request-get-1",
                    "task.get",
                    json!({"params": {"taskId": "task-host"}}),
                ),
            ),
            frame("frame-cancel", "request", cancel),
            frame("frame-stop", "prepare_shutdown", json!({"timeoutMs": 1000})),
        ]
        .join("\n")
            + "\n";
        let mut output = Vec::new();
        run_provider_host(Cursor::new(input), &mut output, &path).unwrap();
        let frames = parse_frames(output);
        assert_eq!(frames.len(), 5);
        assert_eq!(frames[0]["payload"]["contractVersion"], "0.1");
        assert_eq!(
            frames[1]["payload"]["value"]["recoveryDisposition"],
            "inspect_required"
        );
        assert_eq!(frames[2]["payload"]["value"]["outcome"], "requested");
        assert_eq!(frames[3]["kind"], "event");
        assert_eq!(frames[3]["payload"]["kind"], "task.cancellationRequested");
        assert_eq!(frames[4]["payload"]["outcome"], "safe_to_stop");

        // A new request envelope with the same commandId replays the durable
        // result rather than emitting another event.
        let replay = request(
            "request-cancel-2",
            "task.requestCancellation",
            json!({
                "commandId": "command-cancel-1",
                "params": {"taskId": "task-host", "observedRevision": 99},
            }),
        );
        let input = [
            frame("frame-cancel-replay", "request", replay),
            frame(
                "frame-stop-2",
                "prepare_shutdown",
                json!({"timeoutMs": 1000}),
            ),
        ]
        .join("\n")
            + "\n";
        let mut output = Vec::new();
        run_provider_host(Cursor::new(input), &mut output, &path).unwrap();
        let frames = parse_frames(output);
        assert_eq!(frames.len(), 2);
        assert_eq!(frames[0]["payload"]["value"]["outcome"], "requested");
        assert_eq!(frames[0]["payload"]["value"]["revision"], 2);

        let store = SqliteTaskStore::open(&path).unwrap();
        assert_eq!(
            store
                .events_after("task-host", 0)
                .unwrap()
                .iter()
                .filter(|event| event.kind == TaskEventKind::CancelRequested)
                .count(),
            1
        );
        store.checkpoint().unwrap();
        drop(store);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn protocol_rejects_an_oversized_frame() {
        let path = database_path("oversized");
        let input = vec![b'x'; (MAX_FRAME_BYTES + 1) as usize];
        let error = run_provider_host(Cursor::new(input), Vec::new(), &path).unwrap_err();
        assert!(matches!(error, ProviderHostError::OversizedFrame));
        let store = SqliteTaskStore::open(&path).unwrap();
        store.checkpoint().unwrap();
        drop(store);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn provider_store_lock_allows_exactly_one_supervisor() {
        let path = database_path("exclusive");
        let first = ProviderInstanceLock::acquire(&path).unwrap();
        assert!(matches!(
            ProviderInstanceLock::acquire(&path),
            Err(ProviderHostError::AlreadyRunning)
        ));
        drop(first);
        ProviderInstanceLock::acquire(&path).unwrap();
    }

    #[test]
    fn restart_marks_old_provider_leases_for_inspection() {
        let path = database_path("old-owner");
        let identity = ProjectIdentity::from_test_label("old-owner-project");
        {
            let store = SqliteTaskStore::open(&path).unwrap();
            store
                .accept_task(&NewTask {
                    task_id: "task-old-owner".into(),
                    correlation_id: "corr-old-owner".into(),
                    occurred_at: "2026-09-02T00:00:00.000Z".into(),
                })
                .unwrap();
            store
                .acquire_project_lease(
                    &identity,
                    "provider-old",
                    "task-old-owner",
                    "2026-09-02T00:00:00.000Z",
                )
                .unwrap();
        }
        let input = frame("frame-stop", "prepare_shutdown", json!({"timeoutMs": 1})) + "\n";
        run_provider_host(Cursor::new(input), Vec::new(), &path).unwrap();

        let store = SqliteTaskStore::open(&path).unwrap();
        let lease = store.project_lease(&identity).unwrap().unwrap();
        assert!(lease.recovery_required);
        assert_eq!(lease.owner_instance_id, "provider-old");
    }

    #[test]
    fn active_mutation_requires_choice_and_force_freezes_lease_for_inspect() {
        let store = SqliteTaskStore::open_in_memory().unwrap();
        store
            .accept_task(&NewTask {
                task_id: "task-mutating".into(),
                correlation_id: "corr-mutating".into(),
                occurred_at: "2026-09-02T00:00:00.000Z".into(),
            })
            .unwrap();
        let identity = ProjectIdentity::from_test_label("project-a");
        store
            .acquire_project_lease(
                &identity,
                "provider-test",
                "task-mutating",
                "2026-09-02T00:00:00.000Z",
            )
            .unwrap();
        let mut state = HostState {
            store: Arc::new(store),
            provider_instance_id: "provider-test".into(),
            recovered_nonterminal_tasks: HashSet::new(),
            production: None,
            downloads: None,
        };

        let prepare = InboundFrame {
            frame_version: PROVIDER_FRAME_VERSION.into(),
            frame_id: "prepare".into(),
            kind: "prepare_shutdown".into(),
            payload: json!({"timeoutMs": 1}),
        };
        let FrameOutcome::Response(result) = handle_frame(&mut state, &prepare).unwrap() else {
            panic!("an active mutation must keep the Provider alive");
        };
        assert_eq!(result["outcome"], "needs_user_choice");
        assert_eq!(result["blockingTasks"][0]["taskId"], "task-mutating");

        let force = InboundFrame {
            frame_version: PROVIDER_FRAME_VERSION.into(),
            frame_id: "force".into(),
            kind: "continue_shutdown".into(),
            payload: json!({"decision": "force", "userDecisionId": "decision-test"}),
        };
        let FrameOutcome::Exit(result) = handle_frame(&mut state, &force).unwrap() else {
            panic!("a recorded force decision must stop the Provider");
        };
        assert_eq!(result["outcome"], "forced");
        assert_eq!(result["interruptedTasks"][0]["taskId"], "task-mutating");
        assert!(
            state
                .store
                .project_lease(&identity)
                .unwrap()
                .unwrap()
                .recovery_required
        );
    }

    #[test]
    fn demo_task_walks_lifecycle_over_frames_and_replays_idempotently() {
        let path = database_path("demo-lifecycle");

        // run 1: start -> accepted queued(事件),确定性 taskId
        let start = request(
            "request-demo-1",
            "task.startDemo",
            json!({"commandId": "command-demo-1", "kind": "command"}),
        );
        let input = [frame("frame-1", "request", start)].join("\n") + "\n";
        let mut output = Vec::new();
        run_provider_host(Cursor::new(input), &mut output, &path).unwrap();
        let frames = parse_frames(output);
        assert_eq!(frames.len(), 2);
        assert_eq!(frames[0]["kind"], "response");
        let task_id = frames[0]["payload"]["value"]["task"]["taskId"]
            .as_str()
            .expect("demo task id")
            .to_string();
        assert!(task_id.starts_with("demo-"));
        assert_eq!(frames[0]["payload"]["value"]["task"]["state"], "queued");
        assert_eq!(frames[1]["kind"], "event");
        assert_eq!(frames[1]["payload"]["kind"], "task.accepted");

        // run 2: 幂等重放返回既有任务(帧驱动推进一格:queued -> preparing);
        // 取消 -> requested;能力表登记 demo.task
        let replay = request(
            "request-demo-2",
            "task.startDemo",
            json!({"commandId": "command-demo-1", "kind": "command"}),
        );
        let cancel = request(
            "request-cancel",
            "task.requestCancellation",
            json!({
                "commandId": "command-cancel-1",
                "kind": "command",
                "params": {"taskId": task_id},
            }),
        );
        let input = [
            frame("frame-2", "request", replay),
            frame("frame-3", "request", cancel),
            frame(
                "frame-4",
                "request",
                request("request-snap", "application.getSnapshot", json!({})),
            ),
        ]
        .join("\n")
            + "\n";
        let mut output = Vec::new();
        run_provider_host(Cursor::new(input), &mut output, &path).unwrap();
        let frames = parse_frames(output);
        // frame-2: 推进事件(preparing) + 重放响应;frame-3: 推进事件(running) + requested + 取消事件;
        // frame-4: 能力表响应
        assert_eq!(frames.len(), 7);
        assert_eq!(frames[0]["kind"], "event");
        assert_eq!(frames[0]["payload"]["state"], "preparing");
        assert_eq!(frames[1]["payload"]["value"]["task"]["state"], "preparing");
        assert_eq!(frames[2]["kind"], "event");
        assert_eq!(frames[2]["payload"]["state"], "running");
        assert_eq!(frames[3]["payload"]["value"]["outcome"], "requested");
        assert_eq!(frames[4]["kind"], "event");
        assert_eq!(frames[4]["payload"]["kind"], "task.cancellationRequested");
        let operations = &frames[6]["payload"]["value"]["capabilities"]["operations"];
        assert!(operations
            .as_array()
            .expect("operations array")
            .iter()
            .any(|operation| operation["operationId"] == "demo.task"));

        // run 3: 重启后宿主推进取消中任务到 cancelled 终态(事件先于查询响应)
        let input = [
            frame(
                "frame-5",
                "request",
                request("request-list", "task.list", json!({})),
            ),
        ]
        .join("\n")
            + "\n";
        let mut output = Vec::new();
        run_provider_host(Cursor::new(input), &mut output, &path).unwrap();
        let frames = parse_frames(output);
        // 取消在 run 2 的下一帧推进中已完成;重启宿主后终态如实持久
        assert_eq!(frames.len(), 1);
        assert_eq!(frames[0]["payload"]["value"]["tasks"][0]["state"], "cancelled");
        assert_eq!(
            frames[0]["payload"]["value"]["tasks"][0]["recoveryDisposition"],
            "none"
        );
    }
}
