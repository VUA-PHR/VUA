//! Transport adapter for the supervised Orchestrator Provider process.

use vua_unity_bridge::{
    MaterialCancelToken, MaterialExecutionStatus, MaterialExecutor, RollbackOutcome,
};
use vua_orchestrator::{
    MaterialEntryMode, RecipeDocumentStore, RiskDecisionChoice, SourceFolderInspectionV01,
};
use vua_unity_bridge::{
    MaterialIntakeConfirmationV01, MaterialIntakeEngine, MaterialIntakePlanV01, RiskDecisionV01,
};
use vua_unity_bridge::MaterialTaskResult;
use vua_orchestrator::ProjectRef;
use vua_project_manager::{
    acquire_project_lock, apply_import_copy, begin_mutation, plan_import_copy, read_pending_mutation,
    ImportCopyRequest, LockHolder, ManagerRoots, MutationMarkerGuard, PendingMutation,
    ProjectLockError, ProjectLockGuard, MARKER_FILE_NAME,
};
use vua_bdl_store::download_events::{
    fold_lifecycle, retry_decision, ConsumerError, DownloadEventConsumer, DownloadEventV01,
    IngestOutcome, RetryDecision,
};
use vua_orchestrator::{
    AppErrorV1, BuildRecordStore, ErrorCategory, IdempotentCancellation,
    IdempotentTaskAcceptance, NanosTaskIdGenerator, NewTask, ProjectIdentity, SqliteStoreError,
    SqliteTaskStore, StoredTask, StoredTaskEvent, SystemClock, TaskEventKind, TaskMutation,
    TaskRuntime, TaskState,
};
use vua_bdl_store::{
    ArtifactMode, BdlStore, BdlStoreError, CatalogListParams, CatalogParamsError,
    BDL_QUERIES_SCHEMA_VERSION,
};
use vua_orchestrator::ParamValue;
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

#[derive(Clone, Serialize)]
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
    warehouse: Option<Arc<WarehouseServices>>,
    use_cases: Option<Arc<ProductionUseCaseServices>>,
    project_ops: Option<Arc<ProjectOpsServices>>,
}

/// B4/F4-4 download acquisition wiring. When absent, every `download.*`
/// method answers a typed `unavailable` error — honest absence, never a
/// silent success (same discipline as production.*).
pub struct DownloadConfig {
    /// The BDL local database the download consumer folds events into.
    pub bdl: Arc<BdlStore>,
}

/// B4 warehouse maintenance wiring (proposal 005): roots and the global
/// default mode are provider-side runtime configuration and never travel the
/// wire; the wire params carry only the warehouse item id and (for
/// setArtifactMode) the per-entry override.
#[derive(Clone)]
pub struct WarehouseConfig {
    /// The BDL local database the warehouse commands operate on.
    pub bdl: Arc<BdlStore>,
    /// The warehouse root the generate-VPM staging/publish flow writes under.
    pub warehouse_root: PathBuf,
    /// The shell-level default artifact mode (override resolution stays
    /// dynamic: per-entry override ?? this default).
    pub global_default: ArtifactMode,
    /// The real Unity conversion executor for `warehouse.generateVpm`
    /// (same source as the production wiring). When absent, generation
    /// answers a typed unavailable error while the other two commands and
    /// the read face keep working — honest absence, never a silent success.
    pub executor: Option<Arc<MaterialExecutor>>,
}

struct WarehouseServices {
    bdl: Arc<BdlStore>,
    warehouse_root: PathBuf,
    global_default: ArtifactMode,
    executor: Option<Arc<MaterialExecutor>>,
    /// The tasked commands (generateVpm / deleteOriginals) run on the SQLite
    /// task authority: existing nonterminal tasks register for explicit
    /// Inspect/recovery and are never resumed implicitly.
    runtime: TaskRuntime,
}

/// Project-domain write-command wiring (proposal 014, `project.import-copy`):
/// the server-side guards read VCC/ALCOM registration facts through the
/// environment-manager readers, the copy plan/apply run inside the
/// project-manager library, and the tasked execution rides the shared SQLite
/// task authority. Absent wiring answers a typed `vua.project.unavailable` —
/// honest absence, never a silent success.
#[derive(Clone)]
pub struct ProjectOpsConfig {
    /// VCC `settings.json` candidates in priority order (the
    /// registered-project guard reads the association facts from these).
    pub vcc_settings_candidates: Vec<PathBuf>,
    /// Manager roots (ALCOM settings candidates) for the same guard face.
    pub manager_roots: ManagerRoots,
}

struct ProjectOpsServices {
    vcc_settings_candidates: Arc<Vec<PathBuf>>,
    manager_roots: ManagerRoots,
    runtime: TaskRuntime,
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

/// W20 production-use-case v0.2 wiring (recipe/plan/job/record command
/// face): when absent, every `recipe.*` method answers a typed
/// `unavailable` error — honest absence, never a silent success. The
/// recipe document store is the AMF production-domain document store
/// (011 convergence decision 1; never BDL).
#[derive(Clone)]
pub struct ProductionUseCaseConfig {
    pub recipes: Arc<RecipeDocumentStore>,
    pub plans: Arc<vua_orchestrator::PlanDocumentStore>,
    pub evidence: Arc<vua_orchestrator::EvidenceStore>,
    pub records: Arc<vua_orchestrator::RecipeRecordStore>,
    /// The Bridge the orchestrated jobs execute through (the M5 smoke
    /// target project is provider configuration, not wire state).
    pub bridge: Arc<dyn vua_orchestrator::UnityBridge>,
    /// The Unity project root the approved plan executes against.
    pub project_root: PathBuf,
    /// The Unity Hub editors root the job.execute environment precheck
    /// observes (009 stance 4 ②: recipe constraint vs installed editors).
    pub unity_editors_root: PathBuf,
}

struct ProductionUseCaseServices {
    recipes: Arc<RecipeDocumentStore>,
    plans: Arc<vua_orchestrator::PlanDocumentStore>,
    records: Arc<vua_orchestrator::RecipeRecordStore>,
    bridge: Arc<dyn vua_orchestrator::UnityBridge>,
    project_root: PathBuf,
    unity_editors_root: PathBuf,
    /// W23 production-evidence store — consumed by the Local Resolution
    /// executor (next cut).
    #[allow(dead_code)]
    evidence: Arc<vua_orchestrator::EvidenceStore>,
    /// The shared SQLite task authority and BDL come with the warehouse
    /// wiring; the tasked half (recipe.resolve / job.execute) answers a
    /// typed unavailable without them, while the document faces (save/get/
    /// list/approve) work standalone. Consumed from the next cut on.
    #[allow(dead_code)]
    runtime: Option<TaskRuntime>,
    #[allow(dead_code)]
    bdl: Option<Arc<BdlStore>>,
    #[allow(dead_code)]
    env_initial: Option<ArtifactMode>,
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
    output: impl Write,
    database_path: impl AsRef<Path>,
    production: Option<ProductionConfig>,
    downloads: Option<DownloadConfig>,
) -> Result<(), ProviderHostError> {
    run_provider_host_with_services(input, output, database_path, production, downloads, None, None)
}

/// The full entry: additionally wires the B4 warehouse command trio
/// (proposal 005, `warehouse.setArtifactMode` / `warehouse.generateVpm` /
/// `warehouse.deleteOriginals`). When `warehouse` is configured the tasked
/// commands run on the SQLite task authority over the same store.
pub fn run_provider_host_with_services(
    input: impl BufRead + Send + 'static,
    output: impl Write,
    database_path: impl AsRef<Path>,
    production: Option<ProductionConfig>,
    downloads: Option<DownloadConfig>,
    warehouse: Option<WarehouseConfig>,
    use_cases: Option<ProductionUseCaseConfig>,
) -> Result<(), ProviderHostError> {
    run_provider_host_full(
        input,
        output,
        database_path,
        production,
        downloads,
        warehouse,
        use_cases,
        None,
    )
}

/// The full entry: additionally wires the project-domain write command face
/// (proposal 014, `project.import-copy`). When `project_ops` is absent the
/// `project.*` methods answer a typed `vua.project.unavailable`.
#[allow(clippy::too_many_arguments)]
pub fn run_provider_host_full(
    input: impl BufRead + Send + 'static,
    mut output: impl Write,
    database_path: impl AsRef<Path>,
    production: Option<ProductionConfig>,
    downloads: Option<DownloadConfig>,
    warehouse: Option<WarehouseConfig>,
    use_cases: Option<ProductionUseCaseConfig>,
    project_ops: Option<ProjectOpsConfig>,
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
    let warehouse = warehouse
        .map(|config| {
            TaskRuntime::with_sqlite(
                store.clone(),
                Arc::new(SystemClock),
                Arc::new(NanosTaskIdGenerator::default()),
            )
            .map(|runtime| {
                Arc::new(WarehouseServices {
                    bdl: config.bdl,
                    warehouse_root: config.warehouse_root,
                    global_default: config.global_default,
                    executor: config.executor,
                    runtime,
                })
            })
        })
        .transpose()?;
    // The use-case face reuses the warehouse task authority and BDL (Local
    // Resolution reads warehouse facts) — both are required together.
    let use_cases = use_cases.map(|config| {
        let (bdl, runtime, env_initial) = warehouse
            .as_ref()
            .map(|warehouse| {
                (
                    Some(warehouse.bdl.clone()),
                    Some(warehouse.runtime.clone()),
                    Some(warehouse.global_default),
                )
            })
            .unwrap_or((None, None, None));
        Arc::new(ProductionUseCaseServices {
            recipes: config.recipes,
            plans: config.plans,
            records: config.records,
            evidence: config.evidence,
            bridge: config.bridge,
            project_root: config.project_root,
            unity_editors_root: config.unity_editors_root,
            bdl,
            runtime,
            env_initial,
        })
    });
    let project_ops = project_ops
        .map(|config| {
            TaskRuntime::with_sqlite(
                store.clone(),
                Arc::new(SystemClock),
                Arc::new(NanosTaskIdGenerator::default()),
            )
            .map(|runtime| {
                Arc::new(ProjectOpsServices {
                    vcc_settings_candidates: Arc::new(config.vcc_settings_candidates),
                    manager_roots: config.manager_roots,
                    runtime,
                })
            })
        })
        .transpose()?;
    let mut state = HostState {
        store,
        provider_instance_id,
        use_cases,
        recovered_nonterminal_tasks,
        production,
        downloads,
        warehouse,
        project_ops,
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
            FrameOutcome::ProtocolError(payload) => {
                write_frame(&mut output, &frame.frame_id, "protocol_error", payload)?;
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
    ProtocolError(Value),
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
        // Handshake wire shape is frozen by schemas/orchestrator/provider-frame-v0.1
        // (proposal 001): the request payload must be null; anything else is an
        // illegal frame and is answered with protocol_error, never a handshake.
        "handshake" if frame.payload.is_null() => FrameOutcome::Response(json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "supportedContractVersions": [APPLICATION_CONTRACT_VERSION],
            "providerBuildId": env!("CARGO_PKG_VERSION"),
            "providerInstanceId": state.provider_instance_id,
            "downloadIngest": state.downloads.is_some(),
        })),
        "handshake" => FrameOutcome::ProtocolError(json!({
            "code": "vua.provider.invalid_handshake",
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
    if method.starts_with("catalog.") {
        return catalog_request(state, method, request, request_id, correlation_id);
    }
    if method.starts_with("downloads.") {
        return downloads_query_request(state, method, request, request_id, correlation_id);
    }
    if method.starts_with("recipe.") {
        return recipe_request(state, method, request, request_id, correlation_id);
    }
    if method.starts_with("plan.") {
        let Some(use_cases) = state.use_cases.clone() else {
            return plan_unavailable(request_id, correlation_id);
        };
        return plan_request(use_cases, method, request, request_id, correlation_id);
    }
    if method.starts_with("job.") {
        let Some(use_cases) = state.use_cases.clone() else {
            return job_unavailable(state, request_id, correlation_id);
        };
        return match method {
            "job.execute" => job_execute(use_cases, request, request_id, correlation_id),
            _ => job_unavailable(state, request_id, correlation_id),
        };
    }
    if method.starts_with("record.") {
        let Some(use_cases) = state.use_cases.clone() else {
            return record_unavailable(request_id, correlation_id);
        };
        return record_request(use_cases, method, request, request_id, correlation_id);
    }
    if method.starts_with("warehouse.") {
        return warehouse_request(state, method, request, request_id, correlation_id);
    }
    if method.starts_with("project.") {
        return project_request(state, method, request, request_id, correlation_id);
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
    let recipe_availability = if state.use_cases.is_some() {
        "available"
    } else {
        "unavailable"
    };
    let project_ops_availability = if state.project_ops.is_some() {
        "available"
    } else {
        "unavailable"
    };
    json!([
        {"operationId": "task.list", "availability": "available"},
        {"operationId": "environment.getSnapshot", "availability": "available"},
        {"operationId": "demo.task", "availability": "available"},
        {"operationId": "production.useCase", "availability": production_availability},
        {"operationId": "production.recipes", "availability": recipe_availability},
        {"operationId": "project.import-copy", "availability": project_ops_availability},
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
/// B4 warehouse maintenance surface (proposal 005, bdl-commands v0.2) plus
/// the bdl-queries v0.3 warehouse read face.
/// `warehouse.setArtifactMode` / `warehouse.setGlobalDefaultMode` apply
/// synchronously and report the stored fact read back from BDL — the entry's
/// resulting effective mode / the persisted global default, never an echo of
/// the request. `warehouse.generateVpm` / `warehouse.deleteOriginals`
/// submit audited maintenance tasks and return a task acceptance — their Done
/// payloads travel the application-contract task surface. Guards are
/// server-side facts evaluated inside the tasks, never at admission.
/// All FOUR command acceptances (the proposal-005 trio plus
/// `setGlobalDefaultMode`) are bdl-commands v0.2 documents (v0.1 is
/// superseded; the trio's shapes are unchanged, only the envelope version
/// moved). `warehouse.listEntries` / `warehouse.entryDetail` are the frozen
/// read queries: bdl-queries v0.3 documents over the same assembly the
/// catalog face wraps.
fn warehouse_request(
    state: &mut HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(warehouse) = state.warehouse.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.warehouse.unavailable",
            "errors.warehouse.unavailable",
            "unavailable",
        ));
    };
    match method {
        "warehouse.setArtifactMode" => {
            warehouse_set_artifact_mode(warehouse, request, request_id, correlation_id)
        }
        "warehouse.setGlobalDefaultMode" => {
            warehouse_set_global_default_mode(warehouse, request, request_id, correlation_id)
        }
        "warehouse.generateVpm" | "warehouse.deleteOriginals" => {
            warehouse_submit_task(warehouse, method, request, request_id, correlation_id)
        }
        "warehouse.import" => {
            warehouse_import_submit(warehouse, request, request_id, correlation_id)
        }
        "warehouse.importDownloads" => {
            warehouse_import_downloads_submit(warehouse, request, request_id, correlation_id)
        }
        "warehouse.listEntries" => {
            warehouse_list_entries(warehouse, request, request_id, correlation_id)
        }
        "warehouse.entryDetail" => {
            warehouse_entry_detail_query(warehouse, request, request_id, correlation_id)
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

fn warehouse_invalid_params(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.warehouse.invalid_params",
        "errors.warehouse.invalidParams",
        "validation",
    ))
}

/// `warehouse.listEntries` (bdl-queries v0.3 read face): every entry card,
/// effective modes resolved against the composed global default. The closed
/// set is `{}` — any key at all is a contract error.
fn warehouse_list_entries(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    if !matches!(request.get("params"), Some(Value::Object(params)) if params.is_empty()) {
        return warehouse_invalid_params(request_id, correlation_id);
    }
    let global_default = match composed_global_default(&warehouse.bdl, warehouse.global_default) {
        Ok(global_default) => global_default,
        Err(_) => return warehouse_store_failed(request_id, correlation_id),
    };
    match warehouse.bdl.warehouse_entry_cards(global_default) {
        Ok(entries) => match serde_json::to_value(&entries) {
            Ok(entries) => bdl_query_success(
                request_id,
                "warehouse.listEntries",
                json!({ "entries": entries }),
            ),
            Err(_) => warehouse_store_failed(request_id, correlation_id),
        },
        Err(_) => warehouse_store_failed(request_id, correlation_id),
    }
}

/// `warehouse.entryDetail` (bdl-queries v0.3 read face): per-artifact
/// inspection facts for one entry. The closed set is `{ warehouseItemId }`;
/// a miss is the frozen application-face entry_not_found.
fn warehouse_entry_detail_query(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let warehouse_item_id = match request.get("params") {
        Some(Value::Object(params)) if params.keys().all(|key| key == "warehouseItemId") => {
            params
                .get("warehouseItemId")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .filter(|id| !id.is_empty())
        }
        _ => None,
    };
    let Some(warehouse_item_id) = warehouse_item_id else {
        return warehouse_invalid_params(request_id, correlation_id);
    };
    let global_default = match composed_global_default(&warehouse.bdl, warehouse.global_default) {
        Ok(global_default) => global_default,
        Err(_) => return warehouse_store_failed(request_id, correlation_id),
    };
    match warehouse
        .bdl
        .warehouse_entry_detail(&warehouse_item_id, global_default)
    {
        Ok(Some(detail)) => match serde_json::to_value(&detail) {
            Ok(entry) => {
                bdl_query_success(request_id, "warehouse.entryDetail", json!({ "entry": entry }))
            }
            Err(_) => warehouse_store_failed(request_id, correlation_id),
        },
        Ok(None) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.warehouse.entry_not_found",
            "errors.warehouse.entryNotFound",
            "validation",
        )),
        Err(_) => warehouse_store_failed(request_id, correlation_id),
    }
}

fn warehouse_item_id_param(request: &Value) -> Option<String> {
    request
        .pointer("/params/warehouseItemId")
        .and_then(Value::as_str)
        .map(str::to_owned)
        .filter(|id| !id.is_empty())
}

/// The composed global default (U8 two-level options, global level): the
/// persisted bdl_meta value once one exists, otherwise the provider's
/// environment-injected initial default. Read per request — never a wiring
/// time snapshot, so a setGlobalDefaultMode rules every later resolution.
fn composed_global_default(
    bdl: &BdlStore,
    initial: ArtifactMode,
) -> Result<ArtifactMode, BdlStoreError> {
    Ok(bdl.global_default_mode()?.unwrap_or(initial))
}

fn warehouse_store_failed(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.warehouse.storeFailed",
        "errors.warehouse.storeFailed",
        "internal",
    ))
}

/// The entry's resulting effective mode, read back from the store:
/// `override ?? composed global default`. A miss after a successful write
/// is an internal failure, never an empty mode.
fn warehouse_entry_effective_mode(
    warehouse: &WarehouseServices,
    warehouse_item_id: &str,
) -> Result<String, BdlStoreError> {
    let global = composed_global_default(&warehouse.bdl, warehouse.global_default)?;
    let detail = warehouse
        .bdl
        .warehouse_entry_detail(warehouse_item_id, global)?
        .ok_or_else(|| BdlStoreError::UnknownWarehouseItem(warehouse_item_id.to_owned()))?;
    Ok(detail.effective_artifact_mode.name().to_owned())
}

fn warehouse_set_artifact_mode(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(warehouse_item_id) = warehouse_item_id_param(request) else {
        return warehouse_invalid_params(request_id, correlation_id);
    };
    let mode = match request.pointer("/params/mode") {
        // The override follows the frozen closed vocabulary; null clears it
        // so the entry follows the global default again. A missing mode is a
        // params violation, not a clear.
        Some(Value::Null) => None,
        Some(Value::String(raw)) => match ArtifactMode::parse(raw) {
            Ok(mode) => Some(mode),
            Err(_) => return warehouse_invalid_params(request_id, correlation_id),
        },
        Some(_) | None => return warehouse_invalid_params(request_id, correlation_id),
    };
    match warehouse.bdl.set_artifact_mode(&warehouse_item_id, mode) {
        Ok(()) => {}
        Err(BdlStoreError::UnknownWarehouseItem(_)) => {
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.warehouse.entry_not_found",
                "errors.warehouse.entryNotFound",
                "validation",
            ));
        }
        Err(_) => return warehouse_store_failed(request_id, correlation_id),
    }
    // The effective mode is read back from the store (override ?? composed
    // global default), never echoed from the request. A read-back failure is
    // an internal failure whose retry is safe — never an empty mode.
    let effective = match warehouse_entry_effective_mode(&warehouse, &warehouse_item_id) {
        Ok(effective) => effective,
        Err(_) => return warehouse_store_failed(request_id, correlation_id),
    };
    FrameOutcome::Response(application_success(
        request_id,
        json!({
            "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
            "operation": "warehouse.setArtifactMode",
            "warehouseItemId": warehouse_item_id,
            "effectiveMode": effective,
        }),
    ))
}

/// bdl-commands v0.4 is the frozen command face all warehouse command
/// acceptances travel as (v0.1/v0.2/v0.3 superseded; the trio, the global
/// default and the M5 batch import keep their shapes; v0.4 adds
/// `warehouse.importDownloads` — the M6 download-adoption task, IMP-3 /
/// user ruling U7-3).
const BDL_COMMANDS_SCHEMA_VERSION: &str = "0.4";

/// project-ops v0.1 is the frozen write-command face `project.import-copy`
/// travels as (proposal 014, arbitrated 2026-09-09).
const PROJECT_OPS_SCHEMA_VERSION: &str = "0.1";

/// `warehouse.setGlobalDefaultMode` (bdl-commands v0.2, U8 ruling): the
/// synchronous write of the two-level options' GLOBAL level. The global
/// default always has a value — a persisted fact once written, the
/// environment-injected initial default before — so the params carry no
/// null: a missing/null mode is a params violation, not a no-op. The
/// acceptance reports the persisted fact read back from BDL, never the
/// echoed request.
fn warehouse_set_global_default_mode(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let mode = match request.pointer("/params/mode") {
        Some(Value::String(raw)) => match ArtifactMode::parse(raw) {
            Ok(mode) => mode,
            Err(_) => return warehouse_invalid_params(request_id, correlation_id),
        },
        _ => return warehouse_invalid_params(request_id, correlation_id),
    };
    if warehouse.bdl.set_global_default_mode(mode).is_err() {
        return warehouse_store_failed(request_id, correlation_id);
    }
    // Read back the stored fact through the ordinary read path; a write
    // that cannot be read back is an internal failure whose retry is safe
    // (the write is idempotent).
    let persisted = match warehouse.bdl.global_default_mode() {
        Ok(Some(persisted)) => persisted,
        _ => return warehouse_store_failed(request_id, correlation_id),
    };
    FrameOutcome::Response(application_success(
        request_id,
        json!({
            "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
            "operation": "warehouse.setGlobalDefaultMode",
            "globalDefaultMode": persisted.name(),
        }),
    ))
}

fn warehouse_submit_task(
    warehouse: Arc<WarehouseServices>,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(warehouse_item_id) = warehouse_item_id_param(request) else {
        return warehouse_invalid_params(request_id, correlation_id);
    };
    // The composed global default at submission time (persisted ?? env
    // initial): the guards fire inside the tasks and resolve overrides
    // against this value.
    let global_default =
        match composed_global_default(&warehouse.bdl, warehouse.global_default) {
            Ok(global_default) => global_default,
            Err(_) => return warehouse_store_failed(request_id, correlation_id),
        };
    let accepted = match method {
        "warehouse.generateVpm" => {
            let Some(executor) = warehouse.executor.clone() else {
                return FrameOutcome::Response(application_error(
                    request_id,
                    correlation_id,
                    "vua.warehouse.unavailable",
                    "errors.warehouse.unavailable",
                    "unavailable",
                ));
            };
            vua_acquisition::warehouse_maintenance::submit_generate_vpm(
                &warehouse.runtime,
                warehouse.bdl.clone(),
                executor,
                vua_acquisition::warehouse_maintenance::GenerateVpmTaskSpec {
                    correlation_id: correlation_id.to_owned(),
                    warehouse_item_id,
                    warehouse_root: warehouse.warehouse_root.clone(),
                    global_default,
                    // Manual wire initiation never carries the audit chain;
                    // import orchestration fills it in acquisition (010).
                    import_correlation_id: None,
                },
                None,
            )
        }
        "warehouse.deleteOriginals" => {
            vua_acquisition::warehouse_maintenance::submit_delete_originals(
                &warehouse.runtime,
                warehouse.bdl.clone(),
                vua_acquisition::warehouse_maintenance::DeleteOriginalsTaskSpec {
                    correlation_id: correlation_id.to_owned(),
                    warehouse_item_id,
                    global_default,
                },
                None,
            )
        }
        _ => unreachable!("warehouse_request dispatches only the tasked pair"),
    };
    match accepted {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
                "operation": method,
                "taskId": accepted.task_id,
                "correlationId": correlation_id,
            }),
        )),
        // Submission rejection is a persistence failure of the task authority
        // (the guards themselves fire inside the task, not at admission).
        Err(_) => warehouse_store_failed(request_id, correlation_id),
    }
}

/// Generates a uuid-v7-shaped identity (unix-ts-ms ordering + in-process
/// counter randomness; single-process uniqueness is what the stores need).
/// The version nibble is `7` and the variant bits are `10xx` so every
/// identity satisfies the frozen `uuidV7` pattern shared by the recipe
/// v0.3 suite and the production-use-case v0.2 word list.
fn uuid_v7_identity() -> String {
    use std::sync::atomic::{AtomicU64, Ordering};
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let counter = COUNTER.fetch_add(1, Ordering::Relaxed);
    let pid = std::process::id() as u64;
    let unix_ts_ms = ms & 0x0000_ffff_ffff_ffff;
    let ver_rand_a = 0x7000u32 | (((counter << 1) as u32) & 0x0fff);
    let var_hi = 0x8000u16 | (((pid << 4) as u16) & 0x3fff);
    let var_lo = (counter & 0xffff_ffff) | 0x0000_0001_0000_0000;
    format!(
        "{:08x}-{:04x}-7{:03x}-{:04x}-{:012x}",
        (unix_ts_ms >> 16) as u32,
        (unix_ts_ms & 0xffff) as u16,
        ver_rand_a & 0x0fff,
        var_hi,
        var_lo & 0xffff_ffff_ffff,
    )
}

/// Canonical plan-hash: SHA-256 over the serialization of the plan document
/// with the `status` field removed (the lifecycle is not part of the
/// authorized content) and `planHash` itself absent (it names this hash).
fn plan_document_hash(document: &Value) -> String {
    let mut canonical = document.clone();
    if let Some(object) = canonical.as_object_mut() {
        object.remove("status");
        object.remove("planHash");
    }
    let serialized = serde_json::to_string(&canonical).unwrap_or_default();
    let digest = sha2::Sha256::digest(serialized.as_bytes());
    format!(
        "sha256:{}",
        digest.iter().map(|byte| format!("{byte:02x}")).collect::<String>()
    )
}

/// Local Resolution over a Recipe v0.3 document (011 section 5, minimal
/// honest semantics): warehouse-sourced assets resolve through the frozen
/// entry detail query against the composed global default; provider-sourced
/// assets have no import record on this machine and are honest
/// missing-asset evidence. Every missing asset publishes its evidence
/// (identity referenced, body in the W23 store); skipped relations are
/// reported in the Done payload - the draft plan only carries executable
/// jobs.
fn run_local_resolution(
    store: &BdlStore,
    recipes: &RecipeDocumentStore,
    plans: &vua_orchestrator::PlanDocumentStore,
    evidence: &vua_orchestrator::EvidenceStore,
    env_initial: ArtifactMode,
    recipe_id: &str,
    correlation_id: &str,
) -> Result<Value, AppErrorV1> {
    use vua_bdl_store::ArtifactInspectionVerdict;

    let stored = recipes
        .get(recipe_id)
        .map_err(|error| {
            AppErrorV1::new(
                "vua.recipe.store_failed",
                ErrorCategory::Internal,
                "errors.recipe.storeFailed",
                correlation_id,
            )
            .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
        })?
        .ok_or_else(|| {
            AppErrorV1::new(
                "vua.recipe.not_found",
                ErrorCategory::Validation,
                "errors.recipe.notFound",
                correlation_id,
            )
        })?;
    let recipe = &stored.recipe;
    let composed = store.global_default_mode().unwrap_or(None).unwrap_or(env_initial);

    let local_resolution_id = uuid_v7_identity();
    let mut resolved_assets: std::collections::HashMap<String, Value> =
        std::collections::HashMap::new();
    let mut missing_count: usize = 0;
    let mut evidence_ids: Vec<String> = Vec::new();
    let mut skipped_job_ids: Vec<String> = Vec::new();

    // resolve_one_asset: returns the resolvedSource value or None after
    // publishing the honest missing evidence.
    let resolve_one_asset = |asset: &Value,
                             evidence_ids: &mut Vec<String>,
                             missing_count: &mut usize,
                             local_resolution_id: &str|
     -> Option<Value> {
        let source_ref = asset.get("sourceRef")?;
        if let Some(warehouse_item_id) =
            source_ref.get("warehouseItemId").and_then(Value::as_str)
        {
            let requested_role =
                source_ref.get("role").and_then(Value::as_str).unwrap_or("original");
            if let Ok(Some(detail)) =
                store.warehouse_entry_detail(warehouse_item_id, composed)
            {
                // Source selection follows the entry's effective artifact
                // mode (override ?? composed global, W14): generate_vpm
                // prefers a CLEAN generated_vpm copy, anything else falls
                // back to the original copy - the fallback is honest
                // (fallbackUsed on the plan), never invented.
                let original = detail.artifacts.iter().find(|fact| fact.role.name() == "original");
                let clean_vpm = detail.artifacts.iter().find(|fact| {
                    fact.role.name() == "generated_vpm"
                        && matches!(fact.state, ArtifactInspectionVerdict::Clean)
                });
                let chosen = match detail.effective_artifact_mode {
                    vua_bdl_store::ArtifactMode::GenerateVpm => clean_vpm
                        .map(|fact| (fact, false))
                        .or(original.map(|fact| (fact, true))),
                    _ => original.map(|fact| (fact, false)),
                };
                if let Some((fact, fallback_used)) = chosen {
                    return Some(serde_json::json!({
                        "sourceKind": fact.role.name(),
                        "artifactSha256": fact.artifact_sha256,
                        "warehouseItemId": warehouse_item_id,
                        "fallbackUsed": fallback_used,
                    }));
                }
            }
            let evidence_id = uuid_v7_identity();
            let document = vua_orchestrator::ProductionEvidenceV01::new_unresolved(
                evidence_id.clone(),
                vua_orchestrator::EvidenceKind::MissingAsset,
                vua_orchestrator::EvidenceSubject {
                    ref_: format!("warehouse:{warehouse_item_id}"),
                    label: None,
                },
                now_rfc3339(),
                "Local Resolution found no entry or no clean artifact for this asset",
                vua_orchestrator::EvidenceSourceRef::from_local_resolution(local_resolution_id),
            );
            if evidence.publish(&document).is_ok() {
                evidence_ids.push(evidence_id.clone());
                *missing_count += 1;
            }
            Some(serde_json::json!({
                "sourceKind": requested_role,
                "artifactSha256": Value::Null,
                "warehouseItemId": warehouse_item_id,
                "fallbackUsed": false,
                "missing": true,
                "evidenceId": evidence_id,
            }))
        } else {
            // Provider-sourced asset: no import record exists on this
            // machine - honest missing evidence (never invented paths).
            let provider =
                source_ref.get("provider").and_then(Value::as_str).unwrap_or("unknown");
            let product =
                source_ref.get("productId").and_then(Value::as_str).unwrap_or("unknown");
            let evidence_id = uuid_v7_identity();
            let document = vua_orchestrator::ProductionEvidenceV01::new_unresolved(
                evidence_id.clone(),
                vua_orchestrator::EvidenceKind::MissingAsset,
                vua_orchestrator::EvidenceSubject {
                    ref_: format!("provider:{provider}:{product}"),
                    label: None,
                },
                now_rfc3339(),
                "provider-sourced asset has no import record on this machine",
                vua_orchestrator::EvidenceSourceRef::from_local_resolution(local_resolution_id),
            );
            if evidence.publish(&document).is_ok() {
                evidence_ids.push(evidence_id.clone());
                *missing_count += 1;
            }
            Some(serde_json::json!({
                "sourceKind": "original",
                "artifactSha256": Value::Null,
                "warehouseItemId": Value::Null,
                "fallbackUsed": false,
                "missing": true,
                "evidenceId": evidence_id,
            }))
        }
    };

    // Assets resolve first (instances reference them by assetId).
    if let Some(assets) = recipe.get("assets").and_then(Value::as_array) {
        for asset in assets {
            let asset_id = asset.get("id").and_then(Value::as_str).unwrap_or_default();
            if let Some(resolved_source) =
                resolve_one_asset(asset, &mut evidence_ids, &mut missing_count, &local_resolution_id)
            {
                resolved_assets.insert(asset_id.to_owned(), resolved_source);
            }
        }
    }

    // Relations project to jobs (only jobs whose resolved source exists).
    let mut jobs: Vec<Value> = Vec::new();
    if let Some(relations) = recipe.get("relations").and_then(Value::as_array) {
        for relation in relations {
            let kind = relation.get("kind").and_then(Value::as_str).unwrap_or_default();
            let relation_id =
                relation.get("id").and_then(Value::as_str).unwrap_or_default();
            let asset_instance_id = relation
                .get("assetInstanceId")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let instance = recipe
                .get("instances")
                .and_then(Value::as_array)
                .and_then(|instances| {
                    instances.iter().find(|instance| {
                        instance.get("id").and_then(Value::as_str)
                            == Some(asset_instance_id)
                    })
                });
            let asset_id = instance
                .and_then(|instance| instance.get("assetId"))
                .and_then(Value::as_str)
                .unwrap_or_default();
            let Some(resolved_source) = resolved_assets.get(asset_id) else {
                skipped_job_ids.push(relation_id.to_owned());
                continue;
            };
            if resolved_source.get("missing").and_then(Value::as_bool) == Some(true) {
                skipped_job_ids.push(relation_id.to_owned());
                continue;
            }
            let mut inputs = serde_json::json!({
                "assetId": asset_id,
                "resolvedSource": resolved_source,
            });
            if kind == "attach_to_bone" {
                if let Some(bone) = relation.get("bone") {
                    inputs["bone"] = bone.clone();
                }
                if let Some(transform) = relation.get("localTransform") {
                    inputs["localTransform"] = transform.clone();
                }
                if let Some(selector_id) = instance
                    .and_then(|instance| instance.get("entrypoint"))
                    .and_then(|entrypoint| entrypoint.get("selectorId"))
                {
                    inputs["selectorId"] = selector_id.clone();
                }
            } else if kind == "exclude_object" || kind == "set_object_active" {
                if let Some(selector) = relation.get("selector") {
                    inputs["selector"] = selector.clone();
                }
                if let Some(active) = relation.get("active") {
                    inputs["active"] = active.clone();
                }
                if let Some(target) = relation.get("targetInstanceId") {
                    inputs["targetInstanceId"] = target.clone();
                }
            }
            jobs.push(serde_json::json!({
                "jobId": uuid_v7_identity(),
                "kind": kind,
                "inputs": inputs,
            }));
        }
    }

    let target_resolved = recipe
        .get("target")
        .and_then(|target| target.get("avatarInstanceId"))
        .and_then(Value::as_str)
        .and_then(|avatar_instance_id| {
            recipe
                .get("instances")
                .and_then(Value::as_array)
                .and_then(|instances| {
                    instances.iter().find(|instance| {
                        instance.get("id").and_then(Value::as_str)
                            == Some(avatar_instance_id)
                    })
                })
        })
        .and_then(|instance| instance.get("assetId"))
        .and_then(Value::as_str)
        .and_then(|asset_id| resolved_assets.get(asset_id))
        .cloned();

    let created_at = now_rfc3339();
    let plan_id = uuid_v7_identity();
    let mut plan = serde_json::json!({
        "schemaVersion": "0.3",
        "planId": plan_id,
        "recipeId": recipe.get("recipeId").cloned().unwrap_or(serde_json::json!(recipe_id)),
        // The version-lock value is the store's optimistic-concurrency
        // revision (the authority on "the document changed"), not the
        // author-facing revision field inside the document body: job.execute
        // rejects the plan when the store revision has moved past what this
        // resolution was run against.
        "recipeRevision": serde_json::json!(stored.revision),
        "localResolutionId": local_resolution_id,
        "environmentId": uuid_v7_identity(),
        "createdAt": created_at,
        "approvedAt": created_at,
        "fingerprint": {"expectedProjectFingerprint": "not_verified_at_resolution"},
        "target": {
            "avatarInstanceId": recipe
                .get("target")
                .and_then(|target| target.get("avatarInstanceId"))
                .cloned()
                .unwrap_or(Value::Null),
            "resolvedSource": target_resolved,
        },
        "jobs": jobs,
        "status": "draft",
    });
    let plan_hash = plan_document_hash(&plan);
    plan["planHash"] = serde_json::json!(plan_hash);
    plans.publish_draft(&plan_id, &plan).map_err(|error| {
        AppErrorV1::new(
            "vua.plan.store_failed",
            ErrorCategory::Internal,
            "errors.plan.storeFailed",
            correlation_id,
        )
        .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
    })?;

    Ok(serde_json::json!({
        "planId": plan_id,
        "planStatus": "draft",
        "localResolutionId": local_resolution_id,
        "missingCount": missing_count,
        "evidenceIds": evidence_ids,
        "skippedJobIds": skipped_job_ids,
    }))
}

/// W20 production-use-case v0.2 command face (first cut): the recipe
/// document face (save with baseRevision optimistic concurrency / get /
/// list) over the AMF production-domain recipe document store. Absent
/// wiring answers a typed unavailable; unknown params and stale bases are
/// typed contract errors (011 section 7 convergence decisions, data stance).
fn recipe_request(
    state: &HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(use_cases) = state.use_cases.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.recipe.unavailable",
            "errors.recipe.unavailable",
            "unavailable",
        ));
    };
    match method {
        "recipe.save" => recipe_save(use_cases, request, request_id, correlation_id),
        "recipe.get" => recipe_get(use_cases, request, request_id, correlation_id),
        "recipe.list" => recipe_list(use_cases, request, request_id, correlation_id),
        "recipe.resolve" => recipe_resolve(use_cases, request, request_id, correlation_id),
        _ => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.provider.unknown_method",
            "errors.provider.unknownMethod",
            "validation",
        )),
    }
}

/// The plan approval/read face (011 section 4): draft -> approved is the
/// user's explicit authorization act and is idempotent; approved plans are
/// the only ones job.execute will accept.
fn plan_request(
    use_cases: Arc<ProductionUseCaseServices>,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    match method {
        "plan.approve" => plan_approve(use_cases, request, request_id, correlation_id),
        "plan.get" => plan_get(use_cases, request, request_id, correlation_id),
        "plan.list" => plan_list(use_cases, request, request_id, correlation_id),
        _ => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.provider.unknown_method",
            "errors.provider.unknownMethod",
            "validation",
        )),
    }
}

/// Canonical SHA-256 over a document's serde serialization (the same
/// serialization rule the planHash anchor uses — insertion order, compact).
/// This is the `recipeDigest` production rule: the whole stored document.
fn document_sha256(document: &Value) -> String {
    let serialized = serde_json::to_string(document).unwrap_or_default();
    let digest = sha2::Sha256::digest(serialized.as_bytes());
    format!(
        "sha256:{}",
        digest.iter().map(|byte| format!("{byte:02x}")).collect::<String>()
    )
}

/// The `localResolutionDigest` production rule (declared here because no
/// frozen schema pins the computation): SHA-256 over the canonical
/// serialization of the resolution conclusions the approved plan carries —
/// `{"jobs": [jobs[].inputs...], "target": target.resolvedSource}`. The
/// plan's resolution face is the materialized Local Resolution fact of this
/// implementation (011 section 5 minimal honest semantics), so hashing that
/// face anchors the facts independently of the lifecycle fields.
fn local_resolution_digest(plan: &Value) -> String {
    let inputs: Vec<Value> = plan
        .get("jobs")
        .and_then(Value::as_array)
        .map(|jobs| {
            jobs.iter()
                .map(|job| job.get("inputs").cloned().unwrap_or(Value::Null))
                .collect()
        })
        .unwrap_or_default();
    let projection = json!({
        "jobs": inputs,
        "target": plan.get("target")
            .and_then(|target| target.get("resolvedSource"))
            .cloned()
            .unwrap_or(Value::Null),
    });
    document_sha256(&projection)
}

/// One approved-plan execution: re-verify the plan hash and lifecycle, run
/// the receipt-side prechecks (version lock first, per 009 stance 4 as the
/// v0.2 protocol restates it), write the plan file into the job directory,
/// assemble the Bridge v2 command (fingerprint optimistic lock), execute it
/// through the Bridge, and transpose the receipt into a Build Record v0.3
/// document: jobs[] is the receipt-bearing ordered prefix of the plan's
/// jobs, planDeviations carries the typed plan-vs-actual deviations
/// (source_fallback / guard_skip / partial_completion), recoveryPoints
/// register the receipt snapshot, and evidenceSummary references the
/// evidence the resolution run published. Returns the Done payload
/// (buildId + receipt summary).
#[allow(clippy::too_many_arguments)]
fn run_approved_plan_job(
    recipes: &RecipeDocumentStore,
    plans: &vua_orchestrator::PlanDocumentStore,
    records: &vua_orchestrator::RecipeRecordStore,
    evidence: &vua_orchestrator::EvidenceStore,
    bridge: &Arc<dyn vua_orchestrator::UnityBridge>,
    project_root: &Path,
    unity_editors_root: &Path,
    plan_id: &str,
    correlation_id: &str,
) -> Result<Value, AppErrorV1> {
    // Load + lifecycle gate: only approved plans execute.
    let plan = plans
        .get(plan_id)
        .map_err(|error| {
            AppErrorV1::new(
                "vua.plan.store_failed",
                ErrorCategory::Internal,
                "errors.plan.storeFailed",
                correlation_id,
            )
            .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
        })?
        .ok_or_else(|| {
            AppErrorV1::new(
                "vua.plan.not_found",
                ErrorCategory::Validation,
                "errors.plan.notFound",
                correlation_id,
            )
        })?;
    if plan.get("status").and_then(Value::as_str) != Some("approved") {
        return Err(AppErrorV1::new(
            "vua.plan.not_approved",
            ErrorCategory::Conflict,
            "errors.plan.notApproved",
            correlation_id,
        )
        .with_param(
            "status",
            vua_orchestrator::ParamValue::Text(
                plan.get("status").and_then(Value::as_str).unwrap_or("unknown").to_owned(),
            ),
        ));
    }
    // Integrity gate: the stored document must still hash to its planHash
    // (canonical form without status/planHash - the authorization content).
    let plan_hash = plan_document_hash(&plan);
    if plan.get("planHash").and_then(Value::as_str) != Some(plan_hash.as_str()) {
        return Err(AppErrorV1::new(
            "vua.plan.hash_mismatch",
            ErrorCategory::Conflict,
            "errors.plan.hashMismatch",
            correlation_id,
        ));
    }
    // Version lock precheck (009 stance 4, first in the precheck order): the
    // recipe the plan was resolved from must still be at the planned
    // revision. The optimistic-concurrency save guarantees that an unchanged
    // revision means an unchanged document, so the digest computed here is
    // the digest the approval was made against.
    let recipe_id = plan
        .get("recipeId")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_owned();
    let planned_revision = plan
        .get("recipeRevision")
        .and_then(Value::as_u64)
        .unwrap_or(1);
    let stored_recipe = recipes
        .get(&recipe_id)
        .map_err(|error| {
            AppErrorV1::new(
                "vua.recipe.store_failed",
                ErrorCategory::Internal,
                "errors.recipe.storeFailed",
                correlation_id,
            )
            .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
        })?
        .ok_or_else(|| {
            AppErrorV1::new(
                "vua.recipe.not_found",
                ErrorCategory::Validation,
                "errors.recipe.notFound",
                correlation_id,
            )
        })?;
    let current_revision = stored_recipe.revision;
    if current_revision != planned_revision {
        return Err(AppErrorV1::new(
            "vua.recipe.revision_conflict",
            ErrorCategory::Conflict,
            "errors.recipe.revisionConflict",
            correlation_id,
        )
        .with_param("currentRevision", vua_orchestrator::ParamValue::Number(current_revision as f64))
        .with_param("expectedRevision", vua_orchestrator::ParamValue::Number(planned_revision as f64)));
    }
    // Environment precheck (009 stance 4 ②, second in the precheck order):
    // when the recipe declares a machine-parseable Unity version constraint,
    // a matching editor must be installed on this machine. The constraint is
    // matched exactly (major/minor/patch/release kind/number — a China
    // distribution suffix never matches the plain version, mirroring the
    // unsupported-environment policy). A recipe without a constraint, or
    // with a constraint that is not a parseable version string, skips this
    // precheck honestly — the plan never invents a compatibility verdict.
    if let Some(constraint) = stored_recipe
        .recipe
        .get("environment")
        .and_then(|environment| environment.get("unityVersionConstraint"))
        .and_then(Value::as_str)
    {
        if let Some(required) = vua_orchestrator::parse_editor_version(constraint) {
            match vua_orchestrator::installed_unity_editors(unity_editors_root) {
                vua_orchestrator::EditorInstallObservation::Detected(editors) => {
                    let satisfied = editors.iter().any(|editor| {
                        let version = &editor.parsed;
                        version.major == required.major
                            && version.minor == required.minor
                            && version.patch == required.patch
                            && version.release_kind == required.release_kind
                            && version.release_number == required.release_number
                            && version.china_suffix == required.china_suffix
                    });
                    if !satisfied {
                        return Err(AppErrorV1::new(
                            "vua.job.environment_unmet",
                            ErrorCategory::Validation,
                            "errors.job.environmentUnmet",
                            correlation_id,
                        )
                        .with_param(
                            "requiredVersion",
                            vua_orchestrator::ParamValue::Text(required.display.clone()),
                        ));
                    }
                }
                vua_orchestrator::EditorInstallObservation::NotDetected => {
                    return Err(AppErrorV1::new(
                        "vua.job.environment_unmet",
                        ErrorCategory::Validation,
                        "errors.job.environmentUnmet",
                        correlation_id,
                    )
                    .with_param(
                        "requiredVersion",
                        vua_orchestrator::ParamValue::Text(required.display.clone()),
                    )
                    .with_param(
                        "detail",
                        vua_orchestrator::ParamValue::Text(
                            "no Unity editor installation detected on this machine".into(),
                        ),
                    ));
                }
                vua_orchestrator::EditorInstallObservation::DetectionFailed { reason } => {
                    // The observation itself failed: an external failure, not
                    // a config verdict — retryable, never dressed as "unmet".
                    return Err(AppErrorV1::new(
                        "vua.job.environment_check_failed",
                        ErrorCategory::ExternalFailure,
                        "errors.job.environmentCheckFailed",
                        correlation_id,
                    )
                    .with_recoverable(true)
                    .with_param(
                        "detail",
                        vua_orchestrator::ParamValue::Text(reason),
                    ));
                }
            }
        }
        // A free-text constraint (parse_editor_version returning None) or a
        // recipe without a constraint carries no machine-checkable
        // semantics: the precheck skips it rather than guessing a verdict.
    }
    let recipe_digest = document_sha256(&stored_recipe.recipe);
    let local_resolution = local_resolution_digest(&plan);
    let plan_schema_version = plan
        .get("schemaVersion")
        .and_then(Value::as_str)
        .unwrap_or("0.3")
        .to_owned();
    let command_id = format!("job-{}", uuid_v7_identity());
    let started_at = now_rfc3339();

    // Plan file into the job directory (the Bridge reads the file and
    // verifies its local hash against payload.planHash).
    let plan_bytes = serde_json::to_vec_pretty(&plan).map_err(|error| {
        AppErrorV1::new(
            "vua.plan.store_failed",
            ErrorCategory::Internal,
            "errors.plan.storeFailed",
            correlation_id,
        )
        .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
    })?;
    let plan_file = vua_unity_bridge::write_plan_file(
        project_root,
        &command_id,
        &String::from_utf8(plan_bytes).expect("plan bytes are UTF-8"),
    )
    .map_err(|error| {
        AppErrorV1::new(
            "vua.job.plan_file_failed",
            ErrorCategory::Internal,
            "errors.job.planFileFailed",
            correlation_id,
        )
        .with_param("detail", vua_orchestrator::ParamValue::Text(error.0))
    })?;

    // Assemble the Bridge v2 command. payload.planHash carries the
    // authorization hash (canonical, status-independent - the idempotency
    // key); the file hash travels with the file for the Bridge's local
    // verification.
    let project = vua_orchestrator::ProjectRef {
        id: recipe_id.clone(),
        root: project_root.to_path_buf(),
    };
    let expected_fingerprint = plan
        .get("fingerprint")
        .and_then(|fingerprint| fingerprint.get("expectedProjectFingerprint"))
        .and_then(Value::as_str)
        .map(str::to_owned);
    let mut command = vua_unity_bridge::production_job::build_job_command(
        &command_id,
        project.id.as_str(),
        false,
        expected_fingerprint.as_deref(),
        &plan_file,
        &plan_schema_version,
    )
    .map_err(|error| {
        AppErrorV1::new(
            "vua.job.command_failed",
            ErrorCategory::Internal,
            "errors.job.commandFailed",
            correlation_id,
        )
        .with_param("detail", vua_orchestrator::ParamValue::Text(error.0))
    })?;
    command.payload.plan_hash = Some(plan_hash.clone());

    // Execute through the Bridge.
    let result = bridge.execute(&project, &command).map_err(|error| {
        AppErrorV1::new(
            "vua.job.bridge_failed",
            ErrorCategory::ExternalFailure,
            "errors.job.bridgeFailed",
            correlation_id,
        )
        .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
    })?;

    // Top-level record status: succeeded (with/without warnings) or failed.
    let status = match result.status {
        vua_orchestrator::ResultStatus::Succeeded => {
            if result.diagnostics.iter().any(|diagnostic| {
                matches!(
                    diagnostic.severity,
                    vua_orchestrator::DiagnosticSeverity::Warning
                )
            }) {
                "succeeded_with_warnings"
            } else {
                "succeeded"
            }
        }
        vua_orchestrator::ResultStatus::Failed | vua_orchestrator::ResultStatus::Rejected => {
            "failed"
        }
    };
    // The receipt diagnostics travel at the result level (v2 shape); the
    // record transposes them verbatim instead of inventing per-step
    // attribution.
    let result_diagnostics = serde_json::to_value(&result.diagnostics)
        .unwrap_or_else(|_| json!([]));
    let first_error_code = result
        .diagnostics
        .iter()
        .find(|diagnostic| {
            matches!(
                diagnostic.severity,
                vua_orchestrator::DiagnosticSeverity::Error
            )
        })
        .map(|diagnostic| diagnostic.code.clone());

    // Receipt transposition. jobs[] is the receipt-bearing ordered prefix of
    // the plan's jobs (1:1 with resolvedSource); typed deviations record
    // every plan-vs-actual difference the prefix exposes.
    let steps = result
        .data
        .get("steps")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let plan_jobs = plan
        .get("jobs")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut record_jobs: Vec<Value> = Vec::new();
    let mut deviations: Vec<Value> = Vec::new();
    let mut failure_seen = false;
    for (index, step) in steps.iter().enumerate() {
        let Some(plan_job) = plan_jobs.get(index) else {
            // The receipt outgrew the plan: no planned identity exists for
            // the surplus steps, so they cannot be transposed into jobs[]
            // (jobId/kind come from the plan vocabulary). The surplus is
            // recorded as a partial-completion deviation detail instead of
            // being silently dropped.
            deviations.push(json!({
                "jobId": plan_jobs.last().and_then(|job| job.get("jobId")).cloned()
                    .unwrap_or(json!(uuid_v7_identity())),
                "deviationKind": "partial_completion",
                "detail": format!(
                    "bridge returned {} steps but the plan declares {} jobs; surplus steps have no planned identity",
                    steps.len(), plan_jobs.len()
                ),
            }));
            break;
        };
        let step_status = step.get("status").and_then(Value::as_str).unwrap_or("");
        if matches!(step_status, "skipped" | "pending") {
            if failure_seen {
                // After a fail-fast these steps are interruption debris, not
                // guard decisions - they stay out of jobs[] and out of the
                // guard_skip vocabulary; the partial_completion deviation
                // below carries the truncation.
                continue;
            }
            // A guard skipped this job before execution: no receipt exists,
            // so the job stays out of jobs[] and the skip is recorded as the
            // typed guard_skip deviation (012 section 3).
            deviations.push(json!({
                "jobId": plan_job.get("jobId").cloned().unwrap_or(Value::Null),
                "deviationKind": "guard_skip",
                "detail": step
                    .get("warning")
                    .and_then(Value::as_str)
                    .filter(|warning| !warning.is_empty())
                    .unwrap_or("bridge skipped this job before execution"),
            }));
            continue;
        }
        let receipt_status = match step_status {
            "executed" => "succeeded",
            "failed" => {
                failure_seen = true;
                "failed"
            }
            _ => continue,
        };
        // resolvedSourceUsed: the receipt is authoritative; when the
        // receipt's source differs from the plan's declaration the
        // difference MUST appear as a source_fallback deviation (double
        // -record cross-evidence, 012 section 3-3). Without a receipt source
        // the plan declaration stands (nothing was observed to differ).
        let planned_source = plan_job
            .get("inputs")
            .and_then(|inputs| inputs.get("resolvedSource"))
            .cloned();
        let mut resolved_source_used = planned_source.clone().unwrap_or(json!({
            "sourceKind": "original",
            "artifactSha256": Value::Null
        }));
        resolved_source_used
            .as_object_mut()
            .map(|source| source.remove("fallbackUsed"));
        if let Some(receipt_source) = step.get("resolvedSource").filter(|value| !value.is_null())
        {
            let differs = match (&planned_source, receipt_source) {
                (Some(planned), receipt) => {
                    planned.get("sourceKind") != receipt.get("sourceKind")
                        || planned.get("artifactSha256") != receipt.get("artifactSha256")
                }
                (None, _) => true,
            };
            if differs {
                deviations.push(json!({
                    "jobId": plan_job.get("jobId").cloned().unwrap_or(Value::Null),
                    "deviationKind": "source_fallback",
                    "detail": format!(
                        "receipt consumed sourceKind={} artifactSha256={} but the plan declares {}",
                        receipt_source.get("sourceKind").and_then(Value::as_str).unwrap_or("unknown"),
                        receipt_source.get("artifactSha256").and_then(Value::as_str).unwrap_or("null"),
                        planned_source.as_ref()
                            .and_then(|source| source.get("sourceKind"))
                            .and_then(Value::as_str)
                            .unwrap_or("no declared source"),
                    ),
                }));
            }
            resolved_source_used = json!({
                "sourceKind": receipt_source.get("sourceKind").cloned().unwrap_or(Value::Null),
                "artifactSha256": receipt_source.get("artifactSha256").cloned().unwrap_or(Value::Null),
                "warehouseItemId": receipt_source.get("warehouseItemId").cloned().unwrap_or(Value::Null),
            });
        }
        let mut job = json!({
            "jobId": plan_job.get("jobId").cloned().unwrap_or(Value::Null),
            "kind": plan_job.get("kind").cloned().unwrap_or(Value::Null),
            "commandId": command_id,
            "planHash": plan_hash,
            "dryRun": false,
            "replayed": result.replayed.unwrap_or(false),
            "status": receipt_status,
            "resolvedSourceUsed": resolved_source_used,
            "changedPaths": result.changed_paths,
            "diagnostics": if receipt_status == "failed" {
                result_diagnostics.clone()
            } else {
                json!([])
            },
        });
        if receipt_status == "failed" {
            job["rejectReason"] = json!(
                first_error_code.clone().unwrap_or_else(|| "unknown".to_owned())
            );
        }
        record_jobs.push(job);
    }
    // A receipt prefix shorter than the plan means the batch partially
    // completed (fail-fast) - the interruption is carried by the top-level
    // status AND by one typed partial_completion deviation pointing at the
    // first unexecuted plan job.
    if record_jobs.len() < plan_jobs.len() {
        if let Some(next_plan_job) = plan_jobs.get(record_jobs.len()) {
            deviations.push(json!({
                "jobId": next_plan_job.get("jobId").cloned().unwrap_or(Value::Null),
                "deviationKind": "partial_completion",
                "detail": format!(
                    "receipt prefix covers {} of {} planned jobs (top-level status: {})",
                    record_jobs.len(), plan_jobs.len(), status
                ),
            }));
        }
    }

    // Recovery points: the receipt's snapshot identity is registered as the
    // pre-job recovery point (009 cross-review point 5). A rejected receipt
    // carries no snapshot - nothing is invented.
    let recovery_points = match &result.snapshot_id {
        Some(snapshot_id) => json!([{
            "snapshotId": snapshot_id,
            "phase": "pre_job",
            "createdAt": now_rfc3339(),
        }]),
        None => json!([]),
    };

    // Evidence summary: the evidence facts the resolution run published,
    // found through their localResolutionId back-reference (identity
    // references - the bodies stay in the evidence store).
    let local_resolution_id = plan
        .get("localResolutionId")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_owned();
    let evidence_ids = evidence
        .list_by_local_resolution(&local_resolution_id)
        .map_err(|error| {
            AppErrorV1::new(
                "vua.record.store_failed",
                ErrorCategory::Internal,
                "errors.record.storeFailed",
                correlation_id,
            )
            .with_param("detail", vua_orchestrator::ParamValue::Text(
                format!("evidence listing failed: {error}"),
            ))
        })?;

    let finished_at = now_rfc3339();
    let build_id = uuid_v7_identity();
    let record = json!({
        "schemaVersion": "0.3",
        "buildId": build_id,
        "recipeId": plan.get("recipeId").cloned().unwrap_or(Value::Null),
        "recipeRevision": plan.get("recipeRevision").cloned().unwrap_or(json!(1)),
        "planId": plan_id,
        "planHash": plan_hash,
        "planSchemaVersion": plan_schema_version,
        "environmentId": plan.get("environmentId").cloned().unwrap_or(Value::Null),
        "startedAt": started_at,
        "finishedAt": finished_at,
        "status": status,
        "inputs": {
            "recipeDigest": recipe_digest,
            "localResolutionDigest": local_resolution,
            "planHash": plan_hash,
        },
        "jobs": record_jobs,
        "planDeviations": deviations,
        "recoveryPoints": recovery_points,
        "evidenceSummary": { "evidenceIds": evidence_ids },
    });
    records
        .publish(&build_id, &record)
        .map_err(|error| {
            AppErrorV1::new(
                "vua.record.store_failed",
                ErrorCategory::Internal,
                "errors.record.storeFailed",
                correlation_id,
            )
            .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
        })?;

    Ok(json!({
        "buildId": build_id,
        "status": status,
        "jobsRecorded": record["jobs"].as_array().map(Vec::len).unwrap_or(0),
        "deviationsRecorded": record["planDeviations"].as_array().map(Vec::len).unwrap_or(0),
    }))
}

/// `job.execute`: submits the APPROVED plan for orchestration. The tasked
/// job re-verifies the plan hash and status, writes the plan file into the
/// job directory, assembles the Bridge v2 `execute_production_job` command
/// (fingerprint/lock prechecks per 009 stance 4), executes it through the
/// Bridge, and transposes the receipt into a Build Record v0.3 document
/// (jobs are the receipt-bearing ordered prefix of the plan's jobs).
fn job_execute(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // The tasked half requires the shared task authority and BDL.
    let (Some(runtime), _) = (use_cases.runtime.clone(), use_cases.bdl.clone()) else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.job.unavailable",
            "errors.job.unavailable",
            "unavailable",
        ));
    };
    let Some(plan_id) = request
        .get("params")
        .and_then(|params| params.get("planId"))
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(str::to_owned)
    else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.invalid_params",
            "errors.plan.invalidParams",
            "validation",
        ));
    };
    let plans = use_cases.plans.clone();
    let records = use_cases.records.clone();
    let recipes = use_cases.recipes.clone();
    let evidence = use_cases.evidence.clone();
    let bridge = use_cases.bridge.clone();
    let project_root = use_cases.project_root.clone();
    let unity_editors_root = use_cases.unity_editors_root.clone();
    let job_correlation = correlation_id.to_owned();
    let accepted = runtime.submit(vua_orchestrator::SubmitRequest {
        correlation_id: Some(correlation_id.to_owned()),
        timeout: None,
        job: Box::new(move |_| {
            let payload = run_approved_plan_job(
                &recipes,
                &plans,
                &records,
                &evidence,
                &bridge,
                &project_root,
                &unity_editors_root,
                &plan_id,
                &job_correlation,
            )?;
            Ok(vua_orchestrator::TaskExit::Done(payload))
        }),
    });
    match accepted {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
                "operation": "job.execute",
                "taskId": accepted.task_id,
                "correlationId": correlation_id,
            }),
        )),
        Err(_) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.store_failed",
            "errors.plan.storeFailed",
            "internal",
        )),
    }
}

fn record_request(
    use_cases: Arc<ProductionUseCaseServices>,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let params = request.get("params").cloned().unwrap_or(json!({}));
    let params_object = params.as_object().ok_or(());
    let _ = params_object;
    match method {
        "record.get" => {
            let Some(build_id) = params
                .get("buildId")
                .and_then(Value::as_str)
                .filter(|id| !id.is_empty())
            else {
                return FrameOutcome::Response(application_error(
                    request_id,
                    correlation_id,
                    "vua.record.invalid_params",
                    "errors.record.invalidParams",
                    "validation",
                ));
            };
            match use_cases.records.get(build_id) {
                Ok(Some(record)) => FrameOutcome::Response(application_success(
                    request_id,
                    json!({ "buildId": build_id, "recordDocument": record }),
                )),
                Ok(None) => FrameOutcome::Response(application_error(
                    request_id,
                    correlation_id,
                    "vua.record.not_found",
                    "errors.record.notFound",
                    "validation",
                )),
                Err(_) => FrameOutcome::Response(application_error(
                    request_id,
                    correlation_id,
                    "vua.record.store_failed",
                    "errors.record.storeFailed",
                    "internal",
                )),
            }
        }
        "record.list" => {
            let allowed = ["recipeId", "status", "text", "limit", "offset"];
            let empty = serde_json::Map::new();
            let params = request
                .get("params")
                .and_then(Value::as_object)
                .unwrap_or(&empty);
            if params.keys().any(|key| !allowed.contains(&key.as_str())) {
                return FrameOutcome::Response(application_error(
                    request_id,
                    correlation_id,
                    "vua.record.invalid_params",
                    "errors.record.invalidParams",
                    "validation",
                ));
            }
            let limit = params
                .get("limit")
                .and_then(Value::as_u64)
                .unwrap_or(50)
                .clamp(1, 200) as usize;
            let offset = params.get("offset").and_then(Value::as_u64).unwrap_or(0) as usize;
            let text_filter = params
                .get("text")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_lowercase();
            let recipe_filter = params.get("recipeId").and_then(Value::as_str);
            let status_filter = params.get("status").and_then(Value::as_str);
            let mut documents = match use_cases.records.list_documents() {
                Ok(documents) => documents,
                Err(_) => {
                    return FrameOutcome::Response(application_error(
                        request_id,
                        correlation_id,
                        "vua.record.store_failed",
                        "errors.record.storeFailed",
                        "internal",
                    ))
                }
            };
            documents.sort_by_key(|document| {
                document.get("buildId").and_then(Value::as_str).unwrap_or("").to_owned()
            });
            let filtered: Vec<&Value> = documents
                .iter()
                .filter(|document| {
                    let recipe_match = recipe_filter.is_none_or(|filter| {
                        document.get("recipeId").and_then(Value::as_str) == Some(filter)
                    });
                    let status_match = status_filter.is_none_or(|filter| {
                        document.get("status").and_then(Value::as_str) == Some(filter)
                    });
                    let text_match = text_filter.is_empty();
                    recipe_match && status_match && text_match
                })
                .collect();
            let total = filtered.len();
            let entries: Vec<Value> = filtered
                .iter()
                .skip(offset)
                .take(limit)
                .map(|document| {
                    json!({
                        "buildId": document.get("buildId").cloned().unwrap_or(Value::Null),
                        "planId": document.get("planId").cloned().unwrap_or(Value::Null),
                        "status": document.get("status").cloned().unwrap_or(Value::Null),
                        "finishedAt": document.get("finishedAt").cloned().unwrap_or(Value::Null),
                    })
                })
                .collect();
            FrameOutcome::Response(application_success(
                request_id,
                json!({ "total": total, "entries": entries }),
            ))
        }
        _ => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.record.unavailable",
            "errors.record.unavailable",
            "unavailable",
        )),
    }
}

/// plan.list: identity listing over stored plans. Closed param set
/// (catalog.list precedent): recipeId/status/text/limit/offset; unknown
/// keys are contract errors. Sorted by planId (identity-derived).
#[allow(clippy::needless_option_as_deref)]
fn plan_list(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let allowed = ["recipeId", "status", "text", "limit", "offset"];
    let empty = serde_json::Map::new();
    let params = request
        .get("params")
        .and_then(Value::as_object)
        .unwrap_or(&empty);
    if params.keys().any(|key| !allowed.contains(&key.as_str())) {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.invalid_params",
            "errors.plan.invalidParams",
            "validation",
        ));
    }
    let limit = params
        .get("limit")
        .and_then(Value::as_u64)
        .unwrap_or(50)
        .clamp(1, 200) as usize;
    let offset = params.get("offset").and_then(Value::as_u64).unwrap_or(0) as usize;
    let text_filter = params
        .get("text")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_lowercase();
    let recipe_filter = params.get("recipeId").and_then(Value::as_str);
    let status_filter = params.get("status").and_then(Value::as_str);

    let mut documents = match use_cases.plans.list_documents() {
        Ok(documents) => documents,
        Err(_) => {
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.plan.store_failed",
                "errors.plan.storeFailed",
                "internal",
            ))
        }
    };
    documents.sort_by_key(|document| {
        document.get("planId").and_then(Value::as_str).unwrap_or("").to_owned()
    });
    let filtered: Vec<&Value> = documents
        .iter()
        .filter(|document| {
            let recipe_match = recipe_filter.is_none_or(|filter| {
                document.get("recipeId").and_then(Value::as_str) == Some(filter)
            });
            let status_match = status_filter.is_none_or(|filter| {
                document.get("status").and_then(Value::as_str) == Some(filter)
            });
            let text_match = text_filter.is_empty()
                || document
                    .get("title")
                    .and_then(Value::as_str)
                    .map(|title| title.to_lowercase().contains(&text_filter))
                    .unwrap_or(false);
            recipe_match && status_match && text_match
        })
        .collect();
    let total = filtered.len();
    let entries: Vec<Value> = filtered
        .iter()
        .skip(offset)
        .take(limit)
        .map(|document| {
            json!({
                "planId": document.get("planId").cloned().unwrap_or(Value::Null),
                "recipeId": document.get("recipeId").cloned().unwrap_or(Value::Null),
                "status": document.get("status").cloned().unwrap_or(Value::Null),
                "approvedAt": document.get("approvedAt").cloned().unwrap_or(Value::Null),
            })
        })
        .collect();
    FrameOutcome::Response(application_success(
        request_id,
        json!({ "total": total, "entries": entries }),
    ))
}

fn plan_approve(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // Closed set: { planId }.
    let Some(plan_id) = request
        .get("params")
        .and_then(|params| params.get("planId"))
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
    else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.invalid_params",
            "errors.plan.invalidParams",
            "validation",
        ));
    };
    match use_cases.plans.approve(plan_id) {
        Ok(vua_orchestrator::ApproveOutcome::Approved) => {
            FrameOutcome::Response(application_success(
                request_id,
                json!({ "planId": plan_id, "planStatus": "approved" }),
            ))
        }
        Ok(vua_orchestrator::ApproveOutcome::AlreadyApproved) => {
            FrameOutcome::Response(application_success(
                request_id,
                json!({ "planId": plan_id, "planStatus": "approved" }),
            ))
        }
        Err(error) if error.kind() == std::io::ErrorKind::InvalidInput => {
            FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.plan.not_approvable",
                "errors.plan.notApprovable",
                "conflict",
            ))
        }
        Err(_) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.store_failed",
            "errors.plan.storeFailed",
            "internal",
        )),
    }
}

fn plan_get(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(plan_id) = request
        .get("params")
        .and_then(|params| params.get("planId"))
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
    else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.invalid_params",
            "errors.plan.invalidParams",
            "validation",
        ));
    };
    match use_cases.plans.get(plan_id) {
        Ok(Some(document)) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "planId": plan_id,
                "planStatus": document.get("status").cloned().unwrap_or(Value::Null),
                "planDocument": document,
            }),
        )),
        Ok(None) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.not_found",
            "errors.plan.notFound",
            "validation",
        )),
        Err(_) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.plan.store_failed",
            "errors.plan.storeFailed",
            "internal",
        )),
    }
}

/// Honest absence helpers: the Local Resolution executor (recipe.resolve),
/// the job orchestration (job.execute) and the Build Record read face
/// (record.*) arrive in the next cut — the frozen vocabulary answers a
/// typed unavailable, never a silent stub.
fn plan_unavailable(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.plan.unavailable",
        "errors.plan.unavailable",
        "unavailable",
    ))
}

fn job_unavailable(_state: &HostState, request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.job.unavailable",
        "errors.job.unavailable",
        "unavailable",
    ))
}

fn record_unavailable(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.record.unavailable",
        "errors.record.unavailable",
        "unavailable",
    ))
}

/// `recipe.resolve`: submits the Local Resolution executor as a tasked
/// operation (011 §7 — may be heavy). The Done payload carries the draft
/// plan id, the missing-asset count and the evidence identities; the draft
/// plan itself is read back through plan.get.
fn recipe_resolve(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // Closed set: { recipeId }.
    let Some(recipe_id) = request
        .get("params")
        .and_then(|params| params.get("recipeId"))
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(str::to_owned)
    else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.recipe.invalid_params",
            "errors.recipe.invalidParams",
            "validation",
        ));
    };
    // The tasked half requires the shared task authority and BDL (warehouse
    // wiring). Without them: typed unavailable, never a silent stub.
    let (Some(runtime), Some(bdl)) = (use_cases.runtime.clone(), use_cases.bdl.clone()) else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.recipe.resolve_unavailable",
            "errors.recipe.resolveUnavailable",
            "unavailable",
        ));
    };
    let recipes = use_cases.recipes.clone();
    let plans = use_cases.plans.clone();
    let evidence = use_cases.evidence.clone();
    let env_initial = use_cases.env_initial.unwrap_or(ArtifactMode::UseOriginalUnitypackage);
    let job_correlation = correlation_id.to_owned();
    let accepted = runtime.submit(vua_orchestrator::SubmitRequest {
        correlation_id: Some(correlation_id.to_owned()),
        timeout: None,
        job: Box::new(move |_| {
            let payload = run_local_resolution(
                &bdl,
                &recipes,
                &plans,
                &evidence,
                env_initial,
                &recipe_id,
                &job_correlation,
            )?;
            Ok(vua_orchestrator::TaskExit::Done(payload))
        }),
    });
    match accepted {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
                "operation": "recipe.resolve",
                "taskId": accepted.task_id,
                "correlationId": correlation_id,
            }),
        )),
        Err(_) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.recipe.store_failed",
            "errors.recipe.storeFailed",
            "internal",
        )),
    }
}

fn recipe_invalid_params(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.recipe.invalid_params",
        "errors.recipe.invalidParams",
        "validation",
    ))
}

fn recipe_store_failed(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.recipe.store_failed",
        "errors.recipe.storeFailed",
        "internal",
    ))
}

fn recipe_not_found(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.recipe.not_found",
        "errors.recipe.notFound",
        "validation",
    ))
}

fn recipe_save(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // Closed set: { recipeDocument, baseRevision }.
    let params = match request.get("params").and_then(Value::as_object) {
        Some(params) => params,
        None => return recipe_invalid_params(request_id, correlation_id),
    };
    if params.keys().any(|key| key != "recipeDocument" && key != "baseRevision") {
        return recipe_invalid_params(request_id, correlation_id);
    }
    let Some(recipe_document) = params.get("recipeDocument").filter(|value| value.is_object()) else {
        return recipe_invalid_params(request_id, correlation_id);
    };
    let Some(base_revision) = params.get("baseRevision").and_then(Value::as_u64) else {
        return recipe_invalid_params(request_id, correlation_id);
    };
    // The document identity must come from the body (single source of identity).
    let Some(recipe_id) =
        recipe_document.get("recipeId").and_then(Value::as_str).map(str::to_owned)
    else {
        return recipe_invalid_params(request_id, correlation_id);
    };
    match use_cases.recipes.save(&recipe_id, recipe_document, base_revision) {
        Ok(stored) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "recipeId": recipe_id,
                "revision": stored.revision,
                "updatedAt": stored.updated_at,
            }),
        )),
        Err(vua_orchestrator::RecipeSaveError::RevisionConflict { current_revision }) => {
            let mut envelope = application_error(
                request_id,
                correlation_id,
                "vua.recipe.revision_conflict",
                "errors.recipe.revisionConflict",
                "conflict",
            );
            if let Some(error_object) = envelope.get_mut("error") {
                error_object["currentRevision"] = json!(current_revision);
            }
            FrameOutcome::Response(envelope)
        }
        Err(_) => recipe_store_failed(request_id, correlation_id),
    }
}

fn recipe_get(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let params = request.get("params").cloned().unwrap_or(json!({}));
    if !params.as_object().map(|object| object.len()).map(|len| len == 1).unwrap_or(false) {
        return recipe_invalid_params(request_id, correlation_id);
    }
    let Some(recipe_id) = params.get("recipeId").and_then(Value::as_str) else {
        return recipe_invalid_params(request_id, correlation_id);
    };
    if recipe_id.is_empty() {
        return recipe_invalid_params(request_id, correlation_id);
    }
    match use_cases.recipes.get(recipe_id) {
        Ok(Some(stored)) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "recipeId": recipe_id,
                "revision": stored.revision,
                "updatedAt": stored.updated_at,
                "recipeDocument": stored.recipe,
            }),
        )),
        Ok(None) => recipe_not_found(request_id, correlation_id),
        Err(_) => recipe_store_failed(request_id, correlation_id),
    }
}

fn recipe_list(
    use_cases: Arc<ProductionUseCaseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // Closed set (catalog.list precedent): text/limit/offset; unknown keys
    // are contract errors (012 data stance).
    if let Some(Value::Object(params)) = request.get("params") {
        let allowed = ["text", "limit", "offset"];
        if params.keys().any(|key| !allowed.contains(&key.as_str())) {
            return recipe_invalid_params(request_id, correlation_id);
        }
    }
    let all = match use_cases.recipes.list() {
        Ok(all) => all,
        Err(_) => return recipe_store_failed(request_id, correlation_id),
    };
    let text_filter = request
        .get("params")
        .and_then(|params| params.get("text"))
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_lowercase();
    let limit = request
        .get("params")
        .and_then(|params| params.get("limit"))
        .and_then(Value::as_u64)
        .unwrap_or(50)
        .clamp(1, 200) as usize;
    let offset = request
        .get("params")
        .and_then(|params| params.get("offset"))
        .and_then(Value::as_u64)
        .unwrap_or(0) as usize;
    let filtered: Vec<_> = all
        .into_iter()
        .filter(|entry| {
            text_filter.is_empty() || entry.title.to_lowercase().contains(&text_filter)
        })
        .collect();
    let total = filtered.len();
    let page: Vec<Value> = filtered
        .into_iter()
        .skip(offset)
        .take(limit)
        .map(|entry| {
            json!({
                "recipeId": entry.recipe_id,
                "revision": entry.revision,
                "title": entry.title,
                "updatedAt": entry.updated_at,
            })
        })
        .collect();
    FrameOutcome::Response(application_success(
        request_id,
        json!({ "total": total, "entries": page }),
    ))
}

/// W12 closeout: the catalog read face (bdl-queries v0.3) — the three
/// cloud-catalog queries over the same BDL the warehouse surface serves.
/// The assembly (bdl-store) produces the result payload; this face wraps it
/// into the frozen `{ schemaVersion, operation, result }` document. Params
/// closed-set violations are contract errors, never silently empty answers;
/// a detail miss (tombstones included — they are observation-side data and
/// never catalog cards) is the application-face product_not_found.
fn catalog_request(
    state: &HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(warehouse) = state.warehouse.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.catalog.unavailable",
            "errors.catalog.unavailable",
            "unavailable",
        ));
    };
    match method {
        "catalog.list" => catalog_list(warehouse, request, request_id, correlation_id),
        "catalog.detail" => catalog_detail(warehouse, request, request_id, correlation_id),
        "catalog.status" => catalog_status(warehouse, request, request_id, correlation_id),
        _ => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.provider.unknown_method",
            "errors.provider.unknownMethod",
            "validation",
        )),
    }
}

/// The bdl-queries v0.3 envelope all read queries travel as: the frozen
/// `{ schemaVersion, operation, result }` document wrapped in the
/// application-contract success value.
fn bdl_query_success(request_id: &str, operation: &str, result: Value) -> FrameOutcome {
    FrameOutcome::Response(application_success(
        request_id,
        json!({
            "schemaVersion": BDL_QUERIES_SCHEMA_VERSION,
            "operation": operation,
            "result": result,
        }),
    ))
}

/// The `downloads.*` read face (bdl-queries v0.4): the adoptable
/// completed-delivery listing. Absent wiring answers a typed unavailable —
/// the frozen word list is never silently stubbed.
fn downloads_query_request(
    state: &HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(warehouse) = state.warehouse.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.downloads.unavailable",
            "errors.downloads.unavailable",
            "unavailable",
        ));
    };
    match method {
        "downloads.listCompleted" => {
            downloads_list_completed(warehouse, request, request_id, correlation_id)
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

/// `downloads.listCompleted` (bdl-queries v0.4, proposal 015 section-7):
/// the adoptable completed deliveries — the SAME server-side fact the
/// adoption guard consumes (event fold at a completed delivery, staging
/// file present at the reported size), so the list is the guard's mirror.
/// No params; paths never appear in the rows.
fn downloads_list_completed(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    if let Some(params) = request.get("params") {
        let empty = params.as_object().map(|object| object.is_empty()).unwrap_or(false);
        if !empty {
            return FrameOutcome::Response(application_error(
                request_id,
                correlation_id,
                "vua.downloads.invalid_params",
                "errors.downloads.invalidParams",
                "validation",
            ));
        }
    }
    match warehouse.bdl.list_adoptable_downloads() {
        Ok(rows) => {
            let downloads = serde_json::to_value(&rows).unwrap_or_else(|_| json!([]));
            bdl_query_success(
                request_id,
                "downloads.listCompleted",
                json!({ "downloads": downloads }),
            )
        }
        Err(_) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.warehouse.store_failed",
            "errors.warehouse.storeFailed",
            "internal",
        )),
    }
}

fn catalog_invalid_params(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.catalog.invalid_params",
        "errors.catalog.invalidParams",
        "validation",
    ))
}

fn catalog_store_failed(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.catalog.store_failed",
        "errors.catalog.storeFailed",
        "internal",
    ))
}

fn catalog_list(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // The closed-set parse is the data side's frozen one (reused, not
    // reimplemented): keys outside { text, availabilityStatus, limit,
    // offset } and out-of-vocabulary values are contract errors, never a
    // silently filtered answer.
    let params = match request.get("params") {
        Some(params) => match CatalogListParams::from_value(params) {
            Ok(params) => params,
            Err(CatalogParamsError::UnknownKey(_))
            | Err(CatalogParamsError::InvalidValue { .. }) => {
                return catalog_invalid_params(request_id, correlation_id);
            }
        },
        None => return catalog_invalid_params(request_id, correlation_id),
    };
    match warehouse.bdl.catalog_list(&params) {
        Ok(result) => match serde_json::to_value(&result) {
            Ok(result) => bdl_query_success(request_id, "catalog.list", result),
            Err(_) => catalog_store_failed(request_id, correlation_id),
        },
        Err(_) => catalog_store_failed(request_id, correlation_id),
    }
}

fn catalog_detail(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // The detail closed set is { productId }: a non-empty string. Any other
    // key, an explicit null, or an empty string is a contract error.
    let product_id = match request.get("params") {
        Some(Value::Object(params)) if params.keys().all(|key| key == "productId") => {
            params
                .get("productId")
                .and_then(Value::as_str)
                .map(str::to_owned)
                .filter(|id| !id.is_empty())
        }
        _ => None,
    };
    let Some(product_id) = product_id else {
        return catalog_invalid_params(request_id, correlation_id);
    };
    match warehouse.bdl.catalog_detail(&product_id) {
        Ok(Some(result)) => match serde_json::to_value(&result) {
            Ok(result) => bdl_query_success(request_id, "catalog.detail", result),
            Err(_) => catalog_store_failed(request_id, correlation_id),
        },
        // A miss (including a tombstone, which the assembly never serves as
        // a card) is the application-face not-found, never a fabricated
        // empty product.
        Ok(None) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.catalog.product_not_found",
            "errors.catalog.productNotFound",
            "validation",
        )),
        Err(_) => catalog_store_failed(request_id, correlation_id),
    }
}

fn catalog_status(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // The status closed set is {} — the health/revision snapshot takes no
    // filter; any key at all is a contract error.
    if !matches!(request.get("params"), Some(Value::Object(params)) if params.is_empty()) {
        return catalog_invalid_params(request_id, correlation_id);
    }
    match warehouse.bdl.catalog_status() {
        Ok(result) => match serde_json::to_value(&result) {
            Ok(result) => bdl_query_success(request_id, "catalog.status", result),
            Err(_) => catalog_store_failed(request_id, correlation_id),
        },
        Err(_) => catalog_store_failed(request_id, correlation_id),
    }
}

/// `warehouse.import` (bdl-commands v0.3, proposal 010/012): submits ONE
/// batch-import task over the given source folders (per-folder progress;
/// entry creation, guards and the audit trail stay inside the task). The
/// closed param set is `{ sourceFolders }` — kernel-resolved absolute
/// paths, non-empty. The acceptance is the frozen v0.3 task document. The
/// import-time generation hook (010 path A) lives inside the import task
/// itself (acquisition, data-domain slice) and needs no wire surface here.
fn warehouse_import_submit(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let source_folders = match request.get("params") {
        Some(Value::Object(params)) if params.keys().all(|key| key == "sourceFolders") => {
            match params.get("sourceFolders") {
                Some(Value::Array(folders)) if !folders.is_empty() => folders
                    .iter()
                    .map(|value| {
                        value
                            .as_str()
                            .filter(|raw| !raw.is_empty())
                            .map(PathBuf::from)
                    })
                    .collect::<Option<Vec<PathBuf>>>(),
                _ => None,
            }
        }
        _ => None,
    };
    let Some(source_folders) = source_folders else {
        return warehouse_invalid_params(request_id, correlation_id);
    };
    let accepted = vua_acquisition::submit_warehouse_import(
        &warehouse.runtime,
        warehouse.bdl.clone(),
        Arc::new(SystemClock),
        vua_acquisition::WarehouseImportTaskSpec {
            correlation_id: correlation_id.to_owned(),
            source_folders,
            warehouse_root: warehouse.warehouse_root.clone(),
            // The wire import face imports only; the auto-generation
            // injection lands with the core orchestration follow-up (010).
            auto_generate: None,
        },
        None,
    );
    match accepted {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
                "operation": "warehouse.import",
                "taskId": accepted.task_id,
                "correlationId": correlation_id,
            }),
        )),
        // Submission rejection is a persistence failure of the task authority.
        Err(_) => warehouse_store_failed(request_id, correlation_id),
    }
}

/// The `vua.project.*` word list (proposal 013/014): the write face is
/// `project.import-copy` alone. Absent wiring answers a typed unavailable —
/// the frozen word list is never silently stubbed.
fn project_request(
    state: &mut HostState,
    method: &str,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let Some(project_ops) = state.project_ops.clone() else {
        return FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.project.unavailable",
            "errors.project.unavailable",
            "unavailable",
        ));
    };
    match method {
        "project.import-copy" => {
            project_import_copy(project_ops, request, request_id, correlation_id)
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

fn project_invalid_params(request_id: &str, correlation_id: &str) -> FrameOutcome {
    FrameOutcome::Response(application_error(
        request_id,
        correlation_id,
        "vua.project.invalid_params",
        "errors.project.invalidParams",
        "validation",
    ))
}

/// `project.import-copy` (proposal 014, arbitrated): both phases run inside
/// the nine-state task — plan is the read-only confirmation face, apply
/// re-verifies the plan digest and executes the copy. A typed guard refusal
/// is a Done payload carrying the frozen `rejected` result document (the
/// task completed; the import was refused — the same discipline as the
/// warehouse generation guards), never a transport error.
fn project_import_copy(
    project_ops: Arc<ProjectOpsServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    // Closed param set (frozen project-ops v0.1 command schema).
    let Some(params) = request.get("params").and_then(Value::as_object) else {
        return project_invalid_params(request_id, correlation_id);
    };
    let allowed = ["phase", "sourcePath", "targetParentDirectory", "targetProjectName", "confirmedPlanDigest"];
    if params.keys().any(|key| !allowed.contains(&key.as_str())) {
        return project_invalid_params(request_id, correlation_id);
    }
    let text_param = |key: &str| {
        params
            .get(key)
            .and_then(Value::as_str)
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
    };
    let (Some(phase), Some(source_path), Some(target_parent), Some(name)) = (
        params.get("phase").and_then(Value::as_str),
        text_param("sourcePath"),
        text_param("targetParentDirectory"),
        text_param("targetProjectName"),
    ) else {
        return project_invalid_params(request_id, correlation_id);
    };
    if phase != "plan" && phase != "apply" {
        return project_invalid_params(request_id, correlation_id);
    }
    // apply must confirm the plan digest it executes; plan must not carry one.
    let confirmed_plan_digest = text_param("confirmedPlanDigest");
    if (phase == "apply" && confirmed_plan_digest.is_none())
        || (phase == "plan" && confirmed_plan_digest.is_some())
    {
        return project_invalid_params(request_id, correlation_id);
    }

    let job_correlation = correlation_id.to_owned();
    let is_apply = phase == "apply";
    let runtime = project_ops.runtime.clone();
    let accepted = runtime.submit(vua_orchestrator::SubmitRequest {
        correlation_id: Some(correlation_id.to_owned()),
        timeout: None,
        job: Box::new(move |_| {
            let import_request = ImportCopyRequest {
                source: Path::new(&source_path),
                target_parent: Path::new(&target_parent),
                name: &name,
                vcc_settings_candidates: &project_ops.vcc_settings_candidates,
                roots: &project_ops.manager_roots,
            };
            // A guard refusal is a result document, not an error: the task
            // honestly completed and its verdict is the frozen `rejected`
            // face. Only an unexpected internal failure fails the task.
            let result: Value = if is_apply {
                match apply_import_copy(
                    &import_request,
                    &confirmed_plan_digest.expect("apply requires the digest (checked above)"),
                    &job_correlation,
                    &SystemClock,
                ) {
                    Ok(receipt) => serde_json::to_value(receipt).unwrap_or_else(|_| {
                        json!({"kind": "rejected", "guard": "execution_failed"})
                    }),
                    Err(rejected) => serde_json::to_value(rejected).unwrap_or_else(|_| {
                        json!({"kind": "rejected", "guard": "execution_failed"})
                    }),
                }
            } else {
                match plan_import_copy(&import_request) {
                    Ok(plan) => serde_json::to_value(plan)
                        .unwrap_or_else(|_| json!({"kind": "rejected", "guard": "execution_failed"})),
                    Err(rejected) => serde_json::to_value(rejected).unwrap_or_else(|_| {
                        json!({"kind": "rejected", "guard": "execution_failed"})
                    }),
                }
            };
            Ok(vua_orchestrator::TaskExit::Done(json!({
                "schemaVersion": PROJECT_OPS_SCHEMA_VERSION,
                "operation": "project.import-copy",
                "result": result,
            })))
        }),
    });
    match accepted {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "schemaVersion": PROJECT_OPS_SCHEMA_VERSION,
                "operation": "project.import-copy",
                "taskId": accepted.task_id,
                "correlationId": correlation_id,
            }),
        )),
        // Submission rejection is a persistence failure of the task authority.
        Err(_) => FrameOutcome::Response(application_error(
            request_id,
            correlation_id,
            "vua.project.store_failed",
            "errors.project.storeFailed",
            "internal",
        )),
    }
}

/// `warehouse.importDownloads` (bdl-commands v0.4, IMP-3): submits one
/// download-adoption task over the given download ids. Identity only — the
/// staging path, size and file name are server-side facts read from BDL's
/// download-event log; a client-supplied path is a params violation by the
/// frozen closed set. The acceptance envelope matches the frozen v0.4
/// result vector shape.
fn warehouse_import_downloads_submit(
    warehouse: Arc<WarehouseServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
) -> FrameOutcome {
    let download_ids = match request.get("params") {
        Some(Value::Object(params)) if params.keys().all(|key| key == "downloadIds") => {
            match params.get("downloadIds") {
                Some(Value::Array(ids)) if !ids.is_empty() => ids
                    .iter()
                    .map(|value| {
                        value
                            .as_str()
                            .filter(|raw| !raw.is_empty())
                            .map(str::to_owned)
                    })
                    .collect::<Option<Vec<String>>>(),
                _ => None,
            }
        }
        _ => None,
    };
    let Some(download_ids) = download_ids else {
        return warehouse_invalid_params(request_id, correlation_id);
    };
    let accepted = vua_acquisition::submit_warehouse_import_downloads(
        &warehouse.runtime,
        warehouse.bdl.clone(),
        Arc::new(SystemClock),
        vua_acquisition::WarehouseDownloadAdoptTaskSpec {
            correlation_id: correlation_id.to_owned(),
            download_ids,
            warehouse_root: warehouse.warehouse_root.clone(),
        },
        None,
    );
    match accepted {
        Ok(accepted) => FrameOutcome::Response(application_success(
            request_id,
            json!({
                "schemaVersion": BDL_COMMANDS_SCHEMA_VERSION,
                "operation": "warehouse.importDownloads",
                "taskId": accepted.task_id,
                "correlationId": correlation_id,
            }),
        )),
        // Submission rejection is a persistence failure of the task authority.
        Err(_) => warehouse_store_failed(request_id, correlation_id),
    }
}

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
        != Some(vua_bdl_store::download_events::DOWNLOAD_EVENT_SCHEMA_VERSION)
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
        vua_bdl_store::download_events::DownloadEventKind::Started => {
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
        vua_bdl_store::download_events::DownloadEventKind::Progress => {
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
        vua_bdl_store::download_events::DownloadEventKind::Interrupted => {}
        vua_bdl_store::download_events::DownloadEventKind::Completed => {
            complete_download_task(
                state,
                &task_id,
                occurred_at,
                TaskState::Succeeded,
                None,
            )?;
        }
        vua_bdl_store::download_events::DownloadEventKind::Cancelled => {
            complete_download_task(
                state,
                &task_id,
                occurred_at,
                TaskState::Cancelled,
                None,
            )?;
        }
        vua_bdl_store::download_events::DownloadEventKind::Failed => {
            let failure_kind = event
                .failure_kind
                .map(|kind| match kind {
                    vua_bdl_store::download_events::DownloadFailureKind::Policy => "policy",
                    vua_bdl_store::download_events::DownloadFailureKind::Unknown => "unknown",
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
    use vua_orchestrator::Clock as _;
    vua_orchestrator::SystemClock.now_rfc3339()
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
    let vpm = match vua_project_manager::VrcGetLibBackend::with_environment_root(data.join("vpm-env"), false) {
        Ok(vpm) => Arc::new(vpm) as Arc<dyn vua_orchestrator::VpmBackend>,
        Err(_) => {
            eprintln!("VUA provider: vrc-get backend init failed; production stays unavailable");
            return None;
        }
    };
    let executor = Arc::new(MaterialExecutor::new(
        Arc::new(vua_unity_bridge::UnityBatchBridge::new(unity)),
        vua_orchestrator::FileSystemSnapshotStore,
        vpm,
        BuildRecordStore::new(data.join("records")),
        Arc::new(vua_orchestrator::SystemClock),
        data.join("temp"),
        "2022.3.22f1",
        vua_unity_bridge::LocalPackageIdentityStore::new(data.join("identities.json")),
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
        "production.getInspection" => get_domain_document(
            state,
            request,
            request_id,
            "inspection",
            "inspectionId",
        ),
        "production.requestPlan" => {
            request_plan(state, &services, request, request_id, correlation_id, command_id)
        }
        "production.getPlan" => get_domain_document(
            state,
            request,
            request_id,
            "plan",
            "planId",
        ),
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
    // v0.2: Kernel hands over the four-tuple ONCE — source and project paths
    // are bound here and never re-submitted by the renderer (M3/T1 ruling).
    let source_folder = param_str(request, "/params/sourceFolder").to_owned();
    let project_root = param_str(request, "/params/projectRoot").to_owned();
    let artifact_output_root = param_str(request, "/params/artifactOutputRoot").to_owned();
    let project_id = param_str(request, "/params/projectId").to_owned();
    if source_folder.is_empty()
        || project_root.is_empty()
        || artifact_output_root.is_empty()
        || project_id.is_empty()
    {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    let (task_id, replayed) = accept_production_task(
        state,
        "production.startInspection",
        command_id,
        &json!({
            "kind": "production.startInspection", "commandId": command_id,
            "sourceFolder": source_folder, "projectRoot": project_root,
            "artifactOutputRoot": artifact_output_root, "projectId": project_id
        }),
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

    // Issue the stable domain identity and bind the one-time Kernel handover.
    let inspection_id = issue_domain_id("insp");
    let binding = json!({
        "sourceFolder": source_folder,
        "projectRoot": project_root,
        "artifactOutputRoot": artifact_output_root,
        "projectId": project_id,
        "createdAt": now_rfc3339(),
    });
    state.store.put_domain_record(
        &inspection_id,
        "inspection",
        &task_id,
        &result.to_string(),
        &binding.to_string(),
        &now_rfc3339(),
    )?;

    advance_production_task(
        &state.store,
        &task_id,
        TaskMutation::Complete {
            state: TaskState::Succeeded,
            error: None,
            result: Some(json!({ "inspectionId": inspection_id })),
        },
    )?;
    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "task": task_snapshot(state, &state.store.task(&task_id)?.expect("task exists")),
            "inspectionId": inspection_id,
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
    // v0.2: {inspectionId, mode} — the project identity and every path come
    // from the inspection binding (mode is the only genuine user decision).
    let inspection_id = param_str(request, "/params/inspectionId").to_owned();
    let mode_raw = param_str(request, "/params/mode").to_owned();
    if inspection_id.is_empty() || mode_raw.is_empty() {
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

    let (_record_kind, _inspection_task_id, inspection_value, inspection_binding) =
        domain_record_checked(state, &inspection_id, "inspection")?;
    let source_folder = string_field(&inspection_binding, "sourceFolder");
    let project_root = string_field(&inspection_binding, "projectRoot");
    let project_id = string_field(&inspection_binding, "projectId");
    if source_folder.is_empty() || project_root.is_empty() || project_id.is_empty() {
        return Err(validation_error(
            "vua.production.record_invalid",
            "errors.production.recordInvalid",
        ));
    }
    // The fingerprint is computed at plan time from the bound project root —
    // drift between inspection and plan is therefore still detected.
    let project_fingerprint = vua_orchestrator::project_tree_fingerprint(
        Path::new(&project_root),
        &["Assets", "Packages", "ProjectSettings"],
    )
    .map_err(|error| {
        SqliteStoreError::CorruptValue { field: "project fingerprint", value: error.to_string() }
    })?
    .unwrap_or_default();

    let inspection: SourceFolderInspectionV01 = serde_json::from_value(inspection_value.clone())
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
            "inspectionId": inspection_id,
            "mode": mode_raw,
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
        TaskMutation::Complete { state: TaskState::Succeeded, error: None, result: Some(result.clone()) },
    )?;

    // Issue the plan domain identity, bound to the inspection and the plan
    // task's post-completion revision (the value confirmPlan validates).
    let plan_id = issue_domain_id("plan");
    let plan_revision = state.store.task(&task_id)?.expect("plan task exists").revision;
    let binding = json!({
        "inspectionId": inspection_id,
        "revision": plan_revision,
    });
    state.store.put_domain_record(
        &plan_id,
        "plan",
        &task_id,
        &result.to_string(),
        &binding.to_string(),
        &now_rfc3339(),
    )?;
    // Alias under the ENGINE plan id: build-record receipts reference the
    // engine id, and the recovery chain resolves receipts through it back
    // to this same plan record.
    let mut alias_binding = binding.clone();
    alias_binding["domainPlanId"] = json!(plan_id);
    state.store.put_domain_record(
        &plan.plan_id,
        "plan",
        &task_id,
        &result.to_string(),
        &alias_binding.to_string(),
        &now_rfc3339(),
    )?;

    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "task": task_snapshot(state, &state.store.task(&task_id)?.expect("task exists")),
            "planId": plan_id,
            "revision": plan_revision,
        }),
    )))
}

fn confirm_plan(
    state: &HostState,
    services: &Arc<ProductionServices>,
    request: &Value,
    request_id: &str,
    correlation_id: &str,
    command_id: &str,
    recovery: bool,
) -> Result<FrameOutcome, ProductionError> {
    // --- v0.2 sourcing: domain references + registry bindings (M3/T1) ---
    // Confirm face: {planId, observedRevision, riskChoice, rememberForSession?}
    // Recovery face: {taskId, decision, decisionId} — the registry chain
    // taskId -> receipt -> planId -> plan binding -> inspection binding
    // resolves every path; the renderer never re-submits one.
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
    // decisionId is issued by the Kernel at acceptance, bound to
    // taskId + revision + decision, and persisted with the recovery run.
    let decision_id = param_str(request, "/params/decisionId").to_owned();
    if recovery && decision_id.trim().is_empty() {
        return Err(validation_error(
            "vua.production.decision_id_required",
            "errors.production.decisionIdRequired",
        ));
    }
    let observed_revision = request
        .pointer("/params/observedRevision")
        .and_then(Value::as_u64);

    let (plan_id, original_task_id, user_decision_id, risk_choice, remember_for_session) =
        if recovery {
            let original_task_id = param_str(request, "/params/taskId").to_owned();
            if original_task_id.is_empty() {
                return Err(validation_error(
                    "vua.production.invalid_params",
                    "errors.production.invalidParams",
                ));
            }
            // Recovery binds the ORIGINAL failed run: only a terminal failed
            // or cancelled production task is a recovery source. The receipt
            // is required — an original without one is not recoverable
            // through this path (the Inspect-first discipline governs the
            // next fresh run instead).
            let original = state
                .store
                .task(&original_task_id)?
                .ok_or_else(|| validation_error("vua.task.not_found", "errors.task.notFound"))?;
            if !matches!(original.state, TaskState::Failed | TaskState::Cancelled) {
                return Err(not_recoverable_error());
            }
            // Plan linkage: the receipt's engine plan id resolves through
            // the registry alias when a receipt exists; a `continue` without
            // a receipt (refused before any mutation) carries the planId the
            // renderer held from the plan response. A rollback without a
            // receipt is refused — no run means no snapshot.
            let record_id = original
                .result
                .as_ref()
                .and_then(|result| result.get("buildRecordId"))
                .and_then(Value::as_str)
                .map(str::to_owned);
            let plan_link = match record_id {
                Some(record_id) => {
                    let record = services.records.read(&record_id).map_err(|_| {
                        validation_error(
                            "vua.production.not_recoverable",
                            "errors.production.notRecoverable",
                        )
                    })?;
                    record.plan_id
                }
                None if decision == "rollback" => return Err(not_recoverable_error()),
                None => param_str(request, "/params/planId").to_owned(),
            };
            if plan_link.is_empty() {
                return Err(not_recoverable_error());
            }
            (
                plan_link,
                original_task_id,
                decision_id.clone(),
                "not_required".to_owned(),
                false,
            )
        } else {
            let plan_id = param_str(request, "/params/planId").to_owned();
            if plan_id.is_empty() {
                return Err(validation_error(
                    "vua.production.invalid_params",
                    "errors.production.invalidParams",
                ));
            }
            let risk_choice = param_str(request, "/params/riskChoice").to_owned();
            if risk_choice.is_empty() {
                return Err(validation_error(
                    "vua.production.invalid_params",
                    "errors.production.invalidParams",
                ));
            }
            let remember_for_session = request
                .pointer("/params/rememberForSession")
                .and_then(Value::as_bool)
                .unwrap_or(false);
            (plan_id, String::new(), String::new(), risk_choice, remember_for_session)
        };

    // Registry chain: plan record -> its plan task and its inspection
    // binding (paths + project identity were handed over once at
    // startInspection).
    let (plan_task_id, plan_binding) =
        match state.store.domain_record(&plan_id)? {
            Some((kind, task_id, _document, binding)) if kind == "plan" => {
                (task_id, binding)
            }
            _ => {
                return Err(validation_error(
                    "vua.production.record_not_found",
                    "errors.production.recordNotFound",
                ))
            }
        };
    let inspection_id = string_field(&plan_binding, "inspectionId");
    if recovery {
        // The plan revision binds the confirmation: a recovery started from
        // a plan whose revision drifted is refused.
        if let Some(expected) = observed_revision {
            let plan_revision = plan_binding["revision"].as_u64().unwrap_or(0);
            if plan_revision != expected {
                return Err(validation_error(
                    "vua.production.plan_mismatch",
                    "errors.production.planMismatch",
                ));
            }
        }
    } else {
        let plan_revision = plan_binding["revision"].as_u64().unwrap_or(0);
        if observed_revision != Some(plan_revision) {
            return Err(validation_error(
                "vua.production.plan_mismatch",
                "errors.production.planMismatch",
            ));
        }
    }
    let (_kind, _inspection_task_id, _inspection_document, inspection_binding) =
        domain_record_checked(state, &inspection_id, "inspection")?;
    let source_folder = string_field(&inspection_binding, "sourceFolder");
    let project_root = string_field(&inspection_binding, "projectRoot");
    let artifact_output_root = string_field(&inspection_binding, "artifactOutputRoot");
    let confirmed_at = String::new();
    // Inspect-first applies to the WHOLE recovery: every recovery run
    // captures a project inspection before its mutation, whatever the
    // original failure was. ("No receipt" alone would prove nothing — a
    // crash after Unity mutated but before the record was written also has
    // no receipt — so the inspection, not the receipt, governs here.)
    let require_project_inspection = recovery;

    // What the worker will do. Built BEFORE accepting so a malformed plan
    // or an unreadable receipt is a validation error, never a half-created
    // task.
    enum Run {
        Execute(Box<MaterialIntakeConfirmationV01>),
        Rollback {
            snapshot_id: String,
            original_record: Box<vua_orchestrator::BuildRecordV01>,
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
        "planId": plan_id,
        "planTaskId": plan_task_id,
        "observedRevision": observed_revision,
        "riskChoice": risk_choice,
        "rememberForSession": remember_for_session,
        "originalTaskId": original_task_id,
        "decision": decision,
        "decisionId": decision_id,
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
                                vua_orchestrator::ParamValue::Text(report.plan_id.clone()),
                            )
                            .with_recoverable(true),
                        ),
                        result_value,
                    ),
                }
            }
            Run::Rollback { snapshot_id, original_record } => {
                let reference = vua_orchestrator::SnapshotRef {
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
                match vua_orchestrator::FileSystemSnapshotStore.restore_verified(&project, &reference) {
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
                        recovered.status = vua_orchestrator::BuildRecordStatus::Recovered;
                        recovered.task_id = worker_task_id.clone();
                        recovered.correlation_id = worker_correlation.clone();
                        recovered.started_at = recovery_started_at.clone();
                        recovered.completed_at = now_rfc3339();
                        recovered.recovered_from_record_id =
                            Some(original_record.record_id.clone());
                        recovered.recovery_decision_id =
                            Some(recovery_decision_id.clone());
                        recovered.snapshot = Some(vua_orchestrator::BuildSnapshotEvidenceV01 {
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
    Arc<dyn Fn(&ProjectRef) -> Result<String, vua_orchestrator::AppErrorV1> + Send + Sync>;

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
        .with_param("detail", vua_orchestrator::ParamValue::Text(format!("{error:?}")))
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
            .with_param("detail", vua_orchestrator::ParamValue::Text(error.to_string()))
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
                                vua_orchestrator::ParamValue::Text(error.to_string()),
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
                            vua_orchestrator::ParamValue::Text(
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
                                vua_orchestrator::ParamValue::Text(error.to_string()),
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
                        vua_orchestrator::ParamValue::Text(error.to_string()),
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
                    vua_orchestrator::ParamValue::Text(
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
                    vua_orchestrator::ParamValue::Text(lock_error.to_string()),
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
                        vua_orchestrator::ParamValue::Text(match finding {
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
                    vua_orchestrator::ParamValue::Text(marker_error.to_string()),
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

fn get_domain_document(
    state: &HostState,
    request: &Value,
    request_id: &str,
    kind: &str,
    param_name: &str,
) -> Result<FrameOutcome, ProductionError> {
    let domain_id = param_str(request, &format!("/params/{param_name}")).to_owned();
    if domain_id.is_empty() {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    let (record_kind, task_id, document, binding) =
        domain_record_checked(state, &domain_id, kind)?;
    let _ = record_kind;
    let task = state.store.task(&task_id)?;
    let document_value = if kind == "inspection" {
        let inspection: SourceFolderInspectionV01 = serde_json::from_value(document)
            .map_err(|_| {
                validation_error(
                    "vua.production.record_invalid",
                    "errors.production.recordInvalid",
                )
            })?;
        let inspected_at = string_field(&binding, "createdAt");
        serde_json::to_value(vua_unity_bridge::build_inspection_document(
            &domain_id,
            &inspected_at,
            &inspection,
        ))
        .map_err(|_| {
            validation_error(
                "vua.production.record_invalid",
                "errors.production.recordInvalid",
            )
        })?
    } else {
        let inspection_id = string_field(&binding, "inspectionId");
        let revision = binding["revision"].as_u64().unwrap_or(0);
        let plan: MaterialIntakePlanV01 = serde_json::from_value(document).map_err(|_| {
            validation_error(
                "vua.production.record_invalid",
                "errors.production.recordInvalid",
            )
        })?;
        let mut plan_document =
            vua_unity_bridge::build_plan_document(&inspection_id, revision, &plan);
        // The plan document's identity is the DOMAIN planId (the registry
        // id); the engine's internal plan id stays at the diagnostics
        // boundary.
        plan_document.plan_id = domain_id.clone();
        serde_json::to_value(&plan_document)
        .map_err(|_| {
            validation_error(
                "vua.production.record_invalid",
                "errors.production.recordInvalid",
            )
        })?
    };
    let mut payload = json!({
        "contractVersion": APPLICATION_CONTRACT_VERSION,
        "taskId": task_id,
        "state": task.map(|task| state_name(task.state)).unwrap_or("unknown"),
    });
    // The document rides under the record kind ("inspection" / "plan") —
    // inserted as a dynamic key, not a literal.
    payload
        .as_object_mut()
        .expect("payload object")
        .insert(kind.to_owned(), document_value);
    Ok(FrameOutcome::Response(application_success(
        request_id,
        payload,
    )))
}

/// Registry lookup that also enforces the expected record kind.
fn domain_record_checked(
    state: &HostState,
    domain_id: &str,
    expected_kind: &str,
) -> Result<(String, String, Value, Value), ProductionError> {
    match state.store.domain_record(domain_id)? {
        Some((kind, task_id, document, binding)) if kind == expected_kind => {
            Ok((kind, task_id, document, binding))
        }
        _ => Err(validation_error(
            "vua.production.record_not_found",
            "errors.production.recordNotFound",
        )),
    }
}

fn string_field(binding: &Value, key: &str) -> String {
    binding
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_owned()
}

/// Stable domain identities: a kind prefix plus nanos — unique per provider
/// process, stable across retries and recoveries.
fn issue_domain_id(prefix: &str) -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|value| value.as_nanos())
        .unwrap_or(0);
    format!("{prefix}-{nanos:016x}")
}

fn get_build_record(
    state: &HostState,
    request: &Value,
    request_id: &str,
) -> Result<FrameOutcome, ProductionError> {
    let services = state.production.as_ref().expect("checked by production_request");
    // v0.2: {buildRecordId} — the wire shape is the presentation-safe
    // projection (status, stages, evidenceSummary, restore fields); the raw
    // evidence sections stay in the stored record at the diagnostics
    // boundary.
    let record_id = param_str(request, "/params/buildRecordId").to_owned();
    if record_id.is_empty() {
        return Err(validation_error(
            "vua.production.invalid_params",
            "errors.production.invalidParams",
        ));
    }
    let record = services
        .records
        .read(&record_id)
        .map_err(|_| validation_error("vua.production.record_not_found", "errors.production.recordNotFound"))?;
    let build_record = serde_json::to_value(vua_orchestrator::wire_v02(&record)).map_err(|_| {
        validation_error("vua.production.record_invalid", "errors.production.recordInvalid")
    })?;
    Ok(FrameOutcome::Response(application_success(
        request_id,
        json!({
            "contractVersion": APPLICATION_CONTRACT_VERSION,
            "buildRecord": build_record,
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
    use vua_orchestrator::{NewTask, ProjectIdentity};
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
            warehouse: None,
            use_cases: None,
            project_ops: None,
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
