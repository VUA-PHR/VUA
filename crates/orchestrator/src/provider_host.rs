//! Transport adapter for the supervised Orchestrator Provider process.

use crate::{
    IdempotentCancellation, IdempotentTaskAcceptance, NewTask, SqliteStoreError,
    SqliteTaskStore, StoredTask, StoredTaskEvent, TaskEventKind, TaskMutation, TaskState,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::HashSet;
use std::fs::{File, OpenOptions};
use std::io::{BufRead, Write};
use std::path::{Path, PathBuf};
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
    store: SqliteTaskStore,
    provider_instance_id: String,
    recovered_nonterminal_tasks: HashSet<String>,
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
    mut input: impl BufRead,
    mut output: impl Write,
    database_path: impl AsRef<Path>,
) -> Result<(), ProviderHostError> {
    let database_path = database_path.as_ref();
    let _instance_lock = ProviderInstanceLock::acquire(database_path)?;
    let store = SqliteTaskStore::open(database_path)?;
    let provider_instance_id = provider_instance_id();
    let recovered_nonterminal_tasks = store
        .tasks()?
        .into_iter()
        .filter(|task| !task.state.is_terminal())
        .map(|task| task.task_id)
        .collect();
    store.mark_other_owners_interrupted(&provider_instance_id, &now_rfc3339())?;
    let mut state = HostState {
        store,
        provider_instance_id,
        recovered_nonterminal_tasks,
    };

    loop {
        let mut line = Vec::new();
        let mut limited = std::io::Read::take(&mut input, MAX_FRAME_BYTES + 1);
        let read = limited.read_until(b'\n', &mut line)?;
        if read == 0 {
            break;
        }
        if line.len() as u64 > MAX_FRAME_BYTES {
            return Err(ProviderHostError::OversizedFrame);
        }
        while matches!(line.last(), Some(b'\n' | b'\r')) {
            line.pop();
        }

        // demo.task deterministic progression: one stage per received frame,
        // holding at running awaiting cancellation; events are written before
        // this frame's response (notifications of fact, queries stay authoritative)
        for event in advance_demo_tasks(&mut state)? {
            let event_id = format!("sqlite-{}-{}", event.task_id, event.revision);
            write_frame(&mut output, &event_id, "event", task_event(&event_id, &event))?;
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
    let outcome = (|| -> Result<FrameOutcome, SqliteStoreError> {
        match method {
            "application.getSnapshot" => Ok(FrameOutcome::Response(application_success(
                request_id,
                json!({
                    "contractVersion": APPLICATION_CONTRACT_VERSION,
                    "revision": state.store.application_revision()?,
                    "capabilities": {"revision": 0, "operations": served_capabilities()},
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
fn served_capabilities() -> Value {
    json!([
        {"operationId": "task.list", "availability": "available"},
        {"operationId": "environment.getSnapshot", "availability": "available"},
        {"operationId": "demo.task", "availability": "available"},
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
            store,
            provider_instance_id: "provider-test".into(),
            recovered_nonterminal_tasks: HashSet::new(),
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
