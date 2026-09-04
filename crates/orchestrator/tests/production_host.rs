//! F2 acceptance: the production use-case surface is Gateway-callable over
//! the supervised Provider protocol — persisted tasks, commandId
//! idempotency, worker completion, restart recovery — with the real
//! material intake executor driven by a fake Bridge.

use std::fs;
use std::io::{BufRead, Read};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use flate2::write::GzEncoder;
use tar::{Builder, Header};

use serde_json::{json, Value};

use vua_orchestrator::{
    BuildRecordStore, FileSystemSnapshotStore, FixedClock, LocalPackageIdentityStore,
    MaterialExecutor, ProductionConfig, TaskState, UnityBridge, UnityCommand, UnityResult,
    VpmBackend, VpmCapabilities,
};

fn temp_root(label: &str) -> PathBuf {
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    std::env::temp_dir().join(format!("vua-prodhost-{label}-{nanos}"))
}

/// A fake Bridge: every command succeeds and reports a fresh fingerprint,
/// so a direct-mode confirmed run completes in milliseconds on a worker.
#[derive(Clone)]
struct FakeBridge {
    commands: Arc<Mutex<Vec<UnityCommand>>>,
}

impl UnityBridge for FakeBridge {
    fn execute(
        &self,
        _project: &vua_orchestrator::ProjectRef,
        command: &UnityCommand,
    ) -> Result<UnityResult, vua_orchestrator::BridgeError> {
        self.commands.lock().unwrap().push(command.clone());
        Ok(UnityResult {
            schema_version: 1,
            command_id: command.command_id.clone(),
            status: vua_orchestrator::ResultStatus::Succeeded,
            changed_paths: vec![],
            diagnostics: vec![],
            data: serde_json::json!({
                "projectFingerprint": format!("fp-{}", self.commands.lock().unwrap().len())
            }),
        })
    }
}

struct NoVpm;
impl VpmBackend for NoVpm {
    fn name(&self) -> &'static str {
        "none"
    }
    fn capabilities(&self) -> VpmCapabilities {
        VpmCapabilities { create_project: false, preview_install: false }
    }
    fn preview_install(
        &self,
        _: &vua_orchestrator::ProjectRef,
        _: &[vua_orchestrator::PackageRequestV1],
    ) -> Result<vua_orchestrator::ChangePreviewV1, vua_orchestrator::AppErrorV1> {
        unreachable!("direct mode never previews")
    }
    fn apply_install(
        &self,
        _: &vua_orchestrator::ProjectRef,
        _: &[vua_orchestrator::PackageRequestV1],
        _: &str,
    ) -> Result<serde_json::Value, vua_orchestrator::AppErrorV1> {
        unreachable!("direct mode never installs")
    }
    fn create_project(
        &self,
        _: &Path,
        _: &str,
        _: Option<&str>,
    ) -> Result<vua_orchestrator::ProjectRef, vua_orchestrator::AppErrorV1> {
        unreachable!("direct mode never creates projects")
    }
}

/// Feeds frames one at a time, pausing between frames so the production
/// worker (which finishes in milliseconds) reliably completes before the
/// host processes the next frame and drains its events.
struct Paced {
    inner: std::io::Cursor<Vec<u8>>,
}

impl Read for Paced {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        std::thread::sleep(Duration::from_millis(120));
        self.inner.read(buf)
    }
}

impl BufRead for Paced {
    fn fill_buf(&mut self) -> std::io::Result<&[u8]> {
        self.inner.fill_buf()
    }
    fn consume(&mut self, amount: usize) {
        self.inner.consume(amount);
    }
}

fn frames_input(frames: Vec<Value>) -> Paced {
    let mut bytes = Vec::new();
    for frame in frames {
        bytes.extend_from_slice(frame.to_string().as_bytes());
        bytes.push(b'\n');
    }
    Paced { inner: std::io::Cursor::new(bytes) }
}

fn frame(id: &str, payload: Value) -> Value {
    json!({
        "frameVersion": "0.1",
        "frameId": id,
        "kind": "request",
        "payload": payload,
    })
}

fn request(request_id: &str, method: &str, command_id: &str, params: Value) -> Value {
    json!({
        "contractVersion": "0.1",
        "requestId": request_id,
        "correlationId": "corr-prod",
        "kind": "command",
        "method": method,
        "commandId": command_id,
        "params": params,
    })
}

fn parse_frames(bytes: &[u8]) -> Vec<Value> {
    String::from_utf8_lossy(bytes)
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| serde_json::from_str(line).unwrap())
        .collect()
}

fn response_frame<'a>(frames: &'a [Value], request_id: &str) -> &'a Value {
    frames
        .iter()
        .find(|frame| {
            frame["kind"] == "response" && frame["payload"]["requestId"] == request_id
        })
        .unwrap_or_else(|| panic!("no response for {request_id}: {frames:?}"))
}

/// The success envelope wraps the application payload under "value".
fn response_payload(frames: &[Value], request_id: &str) -> Value {
    response_frame(frames, request_id)["payload"]["value"].clone()
}

fn make_world(label: &str) -> (PathBuf, PathBuf, PathBuf) {
    let base = temp_root(label);
    let source = base.join("source");
    fs::create_dir_all(&source).unwrap();
    let package = source.join("pack.unitypackage");
    let file = fs::File::create(&package).unwrap();
    let mut builder = Builder::new(GzEncoder::new(file, flate2::Compression::default()));
    let mut header = Header::new_gnu();
    header.set_size(8);
    header.set_cksum();
    builder.append_data(&mut header, "Assets/Asset.prefab", &b"fixture!"[..]).unwrap();
    builder.finish().unwrap();

    let project_root = base.join("target");
    for dir in ["Assets", "Packages", "ProjectSettings"] {
        fs::create_dir_all(project_root.join(dir)).unwrap();
    }
    fs::write(project_root.join("vpm-manifest.json"), "{}").unwrap();
    (base, source, project_root)
}

fn production_config(base: &Path, _project_root: &Path) -> (ProductionConfig, FakeBridge) {
    let bridge = FakeBridge { commands: Arc::new(Mutex::new(Vec::new())) };
    let executor = Arc::new(MaterialExecutor::new(
        Arc::new(bridge.clone()),
        FileSystemSnapshotStore,
        Arc::new(NoVpm),
        BuildRecordStore::new(base.join("records")),
        Arc::new(FixedClock::new(&["2026-09-05T00:00:00Z"])),
        base.join("temp"),
        "2022.3.22f1",
        LocalPackageIdentityStore::new(base.join("identities.json")),
    ));
    (
        ProductionConfig {
            executor,
            records: Arc::new(BuildRecordStore::new(base.join("records"))),
        },
        bridge,
    )
}

fn plan_params(inspection_task_id: &str) -> Value {
    json!({
        "inspectionTaskId": inspection_task_id,
        "mode": "direct_unity_package",
        "projectId": "project",
        "projectFingerprint": "project-fingerprint",
    })
}

#[test]
fn ph_001_full_command_chain_runs_persists_and_replays() {
    let (base, source, project_root) = make_world("chain");
    let (config, _bridge) = production_config(&base, &project_root);

    // Run 1: Inspect. The fast stage drives inline to Succeeded.
    let output = {
        let mut output_buffer = Vec::new();
        vua_orchestrator::run_provider_host_with(
            frames_input(vec![frame(
                "f1",
                request(
                    "req-inspect-1",
                    "production.startInspection",
                    "cmd-inspect-1",
                    json!({ "sourceFolder": source.to_string_lossy() }),
                ),
            )]),
            &mut output_buffer,
            base.join("provider.db"),
            Some(config),
        )
        .unwrap();
        output_buffer
    };
    let frames = parse_frames(&output);
    let inspect = response_payload(&frames, "req-inspect-1");
    assert_eq!(inspect["task"]["state"], "succeeded", "inspect: {inspect}");
    let inspection_task_id = inspect["task"]["taskId"].as_str().unwrap().to_owned();

    // Run 2 (same store): Plan from the persisted inspection.
    let (config, _bridge) = production_config(&base, &project_root);
    let output = {
        let mut output_buffer = Vec::new();
        vua_orchestrator::run_provider_host_with(
            frames_input(vec![frame(
                "f1",
                request(
                    "req-plan-1",
                    "production.requestPlan",
                    "cmd-plan-1",
                    plan_params(&inspection_task_id),
                ),
            )]),
            &mut output_buffer,
            base.join("provider.db"),
            Some(config),
        )
        .unwrap();
        output_buffer
    };
    let frames = parse_frames(&output);
    let plan = response_payload(&frames, "req-plan-1");
    assert_eq!(plan["task"]["state"], "succeeded", "plan: {plan}");
    let plan_task_id = plan["task"]["taskId"].as_str().unwrap().to_owned();

    // Run 3: Confirm. The response carries Running; the worker completes
    // through the store afterwards.
    let (config, bridge) = production_config(&base, &project_root);
    let output = {
        let mut output_buffer = Vec::new();
        vua_orchestrator::run_provider_host_with(
            frames_input(vec![frame(
                "f1",
                request(
                    "req-confirm-1",
                    "production.confirmPlan",
                    "cmd-confirm-1",
                    confirm_params(&plan_task_id, &source, &project_root, &base),
                ),
            )]),
            &mut output_buffer,
            base.join("provider.db"),
            Some(config),
        )
        .unwrap();
        output_buffer
    };
    let frames = parse_frames(&output);
    let confirm = response_payload(&frames, "req-confirm-1");
    assert_eq!(confirm["task"]["state"], "running", "confirm: {confirm}");
    let confirm_task_id = confirm["task"]["taskId"].as_str().unwrap().to_owned();

    // Reopen: the authoritative terminal state was persisted by the worker.
    let store = vua_orchestrator::SqliteTaskStore::open(base.join("provider.db")).unwrap();
    let deadline = Instant::now() + Duration::from_secs(15);
    let task = loop {
        let task = store.task(&confirm_task_id).unwrap().expect("task persisted");
        if task.state.is_terminal() {
            break task;
        }
        assert!(Instant::now() < deadline, "worker never completed");
        std::thread::sleep(Duration::from_millis(20));
    };
    assert_eq!(task.state, TaskState::Succeeded, "{task:?}");
    let result = task.result.expect("result payload");
    assert_eq!(result["status"], "succeeded");
    assert_eq!(result["rollback"], "not_needed");
    assert_eq!(bridge.commands.lock().unwrap().len(), 2, "import + validation");

    // The published receipt is Gateway-readable via getBuildRecord.
    let record_id = result["buildRecordId"].as_str().unwrap().to_owned();
    let (config, _bridge) = production_config(&base, &project_root);
    let output = {
        let mut output_buffer = Vec::new();
        vua_orchestrator::run_provider_host_with(
            frames_input(vec![frame(
                "f1",
                request(
                    "req-record-1",
                    "production.getBuildRecord",
                    "",
                    json!({ "planId": record_id }),
                ),
            )]),
            &mut output_buffer,
            base.join("provider.db"),
            Some(config),
        )
        .unwrap();
        output_buffer
    };
    let frames = parse_frames(&output);
    let record = response_payload(&frames, "req-record-1");
    assert_eq!(record["buildRecord"]["recordId"], record_id.as_str());
    assert_eq!(record["buildRecord"]["status"], "succeeded");

    // commandId idempotency: re-sending confirm replays the same task and
    // never touches Unity again.
    let (config, bridge2) = production_config(&base, &project_root);
    let output = {
        let mut output_buffer = Vec::new();
        vua_orchestrator::run_provider_host_with(
            frames_input(vec![frame(
                "f1",
                request(
                    "req-confirm-2",
                    "production.confirmPlan",
                    "cmd-confirm-1",
                    confirm_params(&plan_task_id, &source, &project_root, &base),
                ),
            )]),
            &mut output_buffer,
            base.join("provider.db"),
            Some(config),
        )
        .unwrap();
        output_buffer
    };
    let frames = parse_frames(&output);
    let replay = response_payload(&frames, "req-confirm-2");
    assert_eq!(replay["task"]["taskId"], confirm_task_id.as_str(), "same task replays");
    assert_eq!(bridge2.commands.lock().unwrap().len(), 0, "replay touches no Unity");

    let _ = fs::remove_dir_all(&base);
}

fn confirm_params(plan_task_id: &str, source: &Path, project_root: &Path, base: &Path) -> Value {
    json!({
        "planTaskId": plan_task_id,
        "sourceFolder": source.to_string_lossy(),
        "projectRoot": project_root.to_string_lossy(),
        "artifactOutputRoot": base.join("artifacts").to_string_lossy(),
        "confirmedAt": "2026-09-05T00:00:00Z",
        "riskChoice": "continue",
        "rememberForSession": false,
    })
}

#[test]
fn ph_002_unavailable_when_production_is_not_wired() {
    let (base, source, _project_root) = make_world("unavailable");
    let mut output_buffer = Vec::new();
    vua_orchestrator::run_provider_host(
        frames_input(vec![frame(
            "f1",
            request(
                "req-inspect-x",
                "production.startInspection",
                "cmd-inspect-x",
                json!({ "sourceFolder": source.to_string_lossy() }),
            ),
        )]),
        &mut output_buffer,
        base.join("provider.db"),
    )
    .unwrap();
    let frames = parse_frames(&output_buffer);
    let error = response_frame(&frames, "req-inspect-x")["payload"]["error"].clone();
    assert_eq!(error["code"], "vua.production.unavailable");
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn ph_003_interrupted_production_tasks_fail_as_recoverable_on_restart() {
    let (base, _source, _project_root) = make_world("interrupted");
    let path = base.join("provider.db");
    {
        let store = vua_orchestrator::SqliteTaskStore::open(&path).unwrap();
        store
            .accept_task(&vua_orchestrator::NewTask {
                task_id: "prod-deadbeef0001".into(),
                correlation_id: "corr-dead".into(),
                occurred_at: "2026-09-05T00:00:00Z".into(),
            })
            .unwrap();
        // Simulate a worker that died mid-run: the task is left in Running.
        store
            .mutate_task(
                "prod-deadbeef0001",
                1,
                "2026-09-05T00:00:01Z",
                vua_orchestrator::TaskMutation::Transition {
                    state: TaskState::Preparing,
                    payload: json!({}),
                },
            )
            .unwrap();
        store
            .mutate_task(
                "prod-deadbeef0001",
                2,
                "2026-09-05T00:00:02Z",
                vua_orchestrator::TaskMutation::Transition {
                    state: TaskState::Running,
                    payload: json!({}),
                },
            )
            .unwrap();
        store.checkpoint().unwrap();
    }

    let (config, _bridge) = production_config(&base, &base.join("target"));
    let mut output_buffer = Vec::new();
    vua_orchestrator::run_provider_host_with(
        frames_input(vec![frame("f1", request("req-list", "task.list", "", json!({})))]),
        &mut output_buffer,
        &path,
        Some(config),
    )
    .unwrap();

    let store = vua_orchestrator::SqliteTaskStore::open(&path).unwrap();
    let task = store.task("prod-deadbeef0001").unwrap().expect("task persists");
    assert_eq!(task.state, TaskState::Failed);
    let error = task.error.expect("interrupted run carries the typed error");
    assert_eq!(error.code, "vua.task.interrupted");
    let _ = fs::remove_dir_all(&base);
}

// --- dynamic harness: the host runs on a thread; the test feeds frames
// interactively so a cancel request can land while a worker is running ---

struct ChannelReader {
    receiver: std::sync::mpsc::Receiver<Vec<u8>>,
    buffer: Vec<u8>,
    position: usize,
    done: bool,
}

impl Read for ChannelReader {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        if self.position >= self.buffer.len() {
            if self.done {
                return Ok(0);
            }
            match self.receiver.recv() {
                Ok(frame) => {
                    self.buffer = frame;
                    self.position = 0;
                }
                Err(_) => {
                    self.done = true;
                    return Ok(0);
                }
            }
        }
        let remaining = self.buffer.len() - self.position;
        let amount = remaining.min(buf.len());
        buf[..amount].copy_from_slice(&self.buffer[self.position..self.position + amount]);
        self.position += amount;
        Ok(amount)
    }
}

impl BufRead for ChannelReader {
    fn fill_buf(&mut self) -> std::io::Result<&[u8]> {
        if self.position >= self.buffer.len() && !self.done {
            match self.receiver.recv() {
                Ok(frame) => {
                    self.buffer = frame;
                    self.position = 0;
                }
                Err(_) => self.done = true,
            }
        }
        Ok(&self.buffer[self.position..])
    }
    fn consume(&mut self, amount: usize) {
        self.position += amount;
    }
}

#[derive(Clone)]
struct SharedWriter(Arc<Mutex<Vec<u8>>>);

impl std::io::Write for SharedWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.0.lock().unwrap().extend_from_slice(buf);
        Ok(buf.len())
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}

fn wait_for_response(buffer: &Arc<Mutex<Vec<u8>>>, request_id: &str) -> Value {
    let deadline = Instant::now() + Duration::from_secs(15);
    loop {
        let bytes = buffer.lock().unwrap().clone();
        let frames = parse_frames(&bytes);
        let hit = frames
            .iter()
            .find(|frame| {
                frame["kind"] == "response" && frame["payload"]["requestId"] == request_id
            });
        if let Some(frame) = hit {
            return frame["payload"]["value"].clone();
        }
        assert!(Instant::now() < deadline, "no response for {request_id}");
        std::thread::sleep(Duration::from_millis(10));
    }
}

#[test]
fn ph_004_cancel_request_reaches_the_running_worker_token() {
    use std::sync::atomic::{AtomicBool, Ordering};

    // Blocks inside the FIRST Bridge command until released, so the run can
    // only move forward once the host bridges the cancel request to the
    // per-execution token.
    struct BlockingBridge {
        released: Arc<AtomicBool>,
    }
    impl UnityBridge for BlockingBridge {
        fn execute(
            &self,
            _project: &vua_orchestrator::ProjectRef,
            command: &UnityCommand,
        ) -> Result<UnityResult, vua_orchestrator::BridgeError> {
            let deadline = Instant::now() + Duration::from_secs(10);
            while !self.released.load(Ordering::SeqCst) && Instant::now() < deadline {
                std::thread::sleep(Duration::from_millis(5));
            }
            Ok(UnityResult {
                schema_version: 1,
                command_id: command.command_id.clone(),
                status: vua_orchestrator::ResultStatus::Succeeded,
                changed_paths: vec![],
                diagnostics: vec![],
                data: serde_json::json!({"projectFingerprint": "fp-blocked"}),
            })
        }
    }

    let (base, source, project_root) = make_world("cancel");
    let released = Arc::new(AtomicBool::new(false));
    let executor = Arc::new(MaterialExecutor::new(
        Arc::new(BlockingBridge { released: Arc::clone(&released) }),
        FileSystemSnapshotStore,
        Arc::new(NoVpm),
        BuildRecordStore::new(base.join("records")),
        Arc::new(FixedClock::new(&["2026-09-05T00:00:00Z"])),
        base.join("temp"),
        "2022.3.22f1",
        LocalPackageIdentityStore::new(base.join("identities.json")),
    ));
    let config = ProductionConfig {
        executor,
        records: Arc::new(BuildRecordStore::new(base.join("records"))),
    };

    let (sender, receiver) = std::sync::mpsc::channel::<Vec<u8>>();
    let output_buffer = Arc::new(Mutex::new(Vec::new()));
    let writer = SharedWriter(Arc::clone(&output_buffer));
    let path = base.join("provider.db");
    let host = std::thread::spawn(move || {
        let _ = vua_orchestrator::run_provider_host_with(
            ChannelReader { receiver, buffer: Vec::new(), position: 0, done: false },
            writer,
            path,
            Some(config),
        );
    });

    // Inspect + plan (fast stages, inline).
    let send = |frame_value: Value| {
        let mut bytes = frame_value.to_string().into_bytes();
        bytes.push(b'\n');
        sender.send(bytes).unwrap();
    };
    send(frame(
        "f1",
        request(
            "req-inspect",
            "production.startInspection",
            "cmd-inspect",
            json!({ "sourceFolder": source.to_string_lossy() }),
        ),
    ));
    let inspect = wait_for_response(&output_buffer, "req-inspect");
    let inspection_task_id = inspect["task"]["taskId"].as_str().unwrap().to_owned();
    send(frame(
        "f2",
        request("req-plan", "production.requestPlan", "cmd-plan", plan_params(&inspection_task_id)),
    ));
    let plan = wait_for_response(&output_buffer, "req-plan");
    let plan_task_id = plan["task"]["taskId"].as_str().unwrap().to_owned();

    // Confirm: the worker enters the blocking Bridge command.
    send(frame(
        "f3",
        request(
            "req-confirm",
            "production.confirmPlan",
            "cmd-confirm-cancel",
            confirm_params(&plan_task_id, &source, &project_root, &base),
        ),
    ));
    let confirm = wait_for_response(&output_buffer, "req-confirm");
    assert_eq!(confirm["task"]["state"], "running", "confirm: {confirm}");
    let confirm_task_id = confirm["task"]["taskId"].as_str().unwrap().to_owned();

    // The cancel request arrives while the worker sits inside the Bridge
    // command: the host bridges it to the token, the command returns, and
    // the run cancels at the next step boundary.
    send(frame(
        "f4",
        request("req-cancel", "task.requestCancellation", "cmd-cancel", {
            json!({ "taskId": confirm_task_id })
        }),
    ));
    let _cancel = wait_for_response(&output_buffer, "req-cancel");
    released.store(true, Ordering::SeqCst);

    // Pump one frame so the completion event drains, then close stdin.
    send(frame("f5", request("req-pump", "task.list", "", json!({}))));
    drop(sender);
    host.join().unwrap();

    let store = vua_orchestrator::SqliteTaskStore::open(base.join("provider.db")).unwrap();
    let deadline = Instant::now() + Duration::from_secs(15);
    let task = loop {
        let task = store.task(&confirm_task_id).unwrap().expect("task persists");
        if task.state.is_terminal() {
            break task;
        }
        assert!(Instant::now() < deadline, "worker never completed the cancel");
        std::thread::sleep(Duration::from_millis(20));
    };
    assert_eq!(task.state, TaskState::Cancelled, "cancellation completed: {task:?}");
    assert!(task.cancel_requested);
    let _ = fs::remove_dir_all(&base);
}
