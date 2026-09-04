//! B3 executor as a TaskRuntime task type: submitted through the frozen
//! v0.4.2 runtime (nine states, commandId idempotency). All ports are
//! fakes; the snapshot store is real.

use flate2::write::GzEncoder;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tar::{Builder, Header};

use vua_orchestrator::{
    BridgeError, BuildRecordStore, BuildRecordStatus, FileSystemSnapshotStore, FixedClock,
    LocalPackageIdentityStore, MaterialEntryMode, MaterialExecutor,
    MaterialIntakeConfirmationV01, MaterialIntakeEngine, MaterialIntakePlanV01,
    MaterialIntakeTaskSpec, ProjectRef, ResultStatus,
    RiskDecisionChoice, RiskDecisionV01, TaskRuntime, TaskState, UnityBridge, UnityCommand,
    UnityResult, VpmBackend, VpmCapabilities,
};

fn temp_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-mtask-{label}-{nanos}"))
}

fn append(builder: &mut Builder<GzEncoder<fs::File>>, path: &str, bytes: &[u8]) {
    let mut header = Header::new_gnu();
    header.set_size(bytes.len() as u64);
    header.set_cksum();
    builder.append_data(&mut header, path, bytes).unwrap();
}

fn unitypackage(path: &Path, assets: &[&str]) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).unwrap();
    }
    let file = fs::File::create(path).unwrap();
    let mut builder = Builder::new(GzEncoder::new(file, flate2::Compression::default()));
    for asset in assets {
        append(&mut builder, asset, b"fixture");
    }
    builder.finish().unwrap();
}

fn make_world(label: &str) -> (PathBuf, ProjectRef, PathBuf) {
    let base = temp_dir(label);
    let source = base.join("source");
    unitypackage(&source.join("pack.unitypackage"), &["Assets/Asset.prefab"]);
    let project_root = base.join("target");
    fs::create_dir_all(project_root.join("Assets")).unwrap();
    fs::create_dir_all(project_root.join("Packages")).unwrap();
    fs::create_dir_all(project_root.join("ProjectSettings")).unwrap();
    fs::write(project_root.join("vpm-manifest.json"), "{}").unwrap();
    let project = ProjectRef {
        id: "project".into(),
        root: project_root,
    };
    (base, project, source)
}

fn confirmation(plan: &MaterialIntakePlanV01) -> MaterialIntakeConfirmationV01 {
    MaterialIntakeConfirmationV01 {
        plan: plan.clone(),
        risk_decision: RiskDecisionV01 {
            choice: RiskDecisionChoice::Continue,
            source_fingerprint: plan.source.source_fingerprint.clone(),
            risk_fingerprint: plan.source.risk_fingerprint.clone(),
            remember_for_session: false,
        },
        confirmed_at: "2026-09-05T00:00:00Z".into(),
        correlation_id: "corr".into(),
    }
}

struct NoVpm;

impl VpmBackend for NoVpm {
    fn name(&self) -> &'static str {
        "none"
    }

    fn capabilities(&self) -> VpmCapabilities {
        VpmCapabilities {
            create_project: false,
            preview_install: false,
        }
    }

    fn preview_install(
        &self,
        _project: &ProjectRef,
        _packages: &[vua_orchestrator::PackageRequestV1],
    ) -> Result<vua_orchestrator::ChangePreviewV1, vua_orchestrator::AppErrorV1> {
        panic!("the direct path must not reach the vpm backend")
    }

    fn apply_install(
        &self,
        _project: &ProjectRef,
        _packages: &[vua_orchestrator::PackageRequestV1],
        _confirmed_digest: &str,
    ) -> Result<serde_json::Value, vua_orchestrator::AppErrorV1> {
        panic!("the direct path must not reach the vpm backend")
    }

    fn create_project(
        &self,
        _parent: &Path,
        _name: &str,
        _template: Option<&str>,
    ) -> Result<ProjectRef, vua_orchestrator::AppErrorV1> {
        panic!("the direct path must not reach the vpm backend")
    }
}

// --- fake bridge (test double for UnityBridge) ---

struct FakeBridgeState {
    commands: Vec<UnityCommand>,
}

#[derive(Clone)]
struct FakeBridge {
    state: Arc<Mutex<FakeBridgeState>>,
}

impl FakeBridge {
    fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(FakeBridgeState {
                commands: Vec::new(),
            })),
        }
    }

    fn command_count(&self) -> usize {
        self.state.lock().unwrap().commands.len()
    }
}

impl UnityBridge for FakeBridge {
    fn execute(
        &self,
        _project: &ProjectRef,
        command: &UnityCommand,
    ) -> Result<UnityResult, BridgeError> {
        self.state.lock().unwrap().commands.push(command.clone());
        Ok(UnityResult {
            schema_version: 1,
            command_id: command.command_id.clone(),
            status: ResultStatus::Succeeded,
            changed_paths: vec![],
            diagnostics: vec![],
            data: serde_json::json!({
                "projectFingerprint": format!("fp-{}", self.command_count())
            }),
        })
    }
}

fn build_executor(
    base: &Path,
    bridge: FakeBridge,
) -> (Arc<MaterialExecutor>, Arc<FakeBridge>) {
    let bridge = Arc::new(bridge);
    let identity_store = LocalPackageIdentityStore::new(base.join("identities.json"));
    let clock = Arc::new(FixedClock::new(&["2026-09-05T00:00:00Z"]));
    let executor = Arc::new(MaterialExecutor::new(
        bridge.clone(),
        FileSystemSnapshotStore,
        Arc::new(NoVpm),
        BuildRecordStore::new(base.join("records")),
        clock,
        base.join("temp"),
        String::from("2022.3.22f1"),
        identity_store,
    ));
    (executor, bridge)
}

fn runtime() -> TaskRuntime {
    TaskRuntime::new(
        Arc::new(vua_orchestrator::MemoryJournal::default()),
        Arc::new(vua_orchestrator::SystemClock),
        Arc::new(vua_orchestrator::FixedIdGenerator::default()),
    )
}

fn wait_for_terminal(
    runtime: &TaskRuntime,
    task_id: &str,
) -> vua_orchestrator::TaskSnapshot {
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        let snapshot = runtime.snapshot(task_id).expect("task must exist");
        if snapshot.state.is_terminal() {
            return snapshot;
        }
        assert!(Instant::now() < deadline, "task did not finish in time");
        std::thread::sleep(Duration::from_millis(5));
    }
}

#[test]
fn b3_task_001_material_intake_runs_as_a_runtime_task_and_replays() {
    let (base, project, source) = make_world("task-happy");
    let inspection = MaterialIntakeEngine
        .inspect_folder(&source, "corr")
        .unwrap();
    let plan = MaterialIntakeEngine
        .plan(
            MaterialEntryMode::DirectUnityPackage,
            project.id.clone(),
            "project-fingerprint",
            inspection,
            "corr",
        )
        .unwrap();
    let confirmation = confirmation(&plan);

    let (executor, bridge) = build_executor(&base, FakeBridge::new());
    let rt = runtime();
    let accepted = vua_orchestrator::submit_material_intake(
        &rt,
        executor.clone(),
        MaterialIntakeTaskSpec {
            confirmation: confirmation.clone(),
            source_folder: source.clone(),
            project: project.clone(),
            artifact_output_root: base.join("artifacts"),
        },
        Some(Duration::from_secs(120)),
    )
    .unwrap();

    let snapshot = wait_for_terminal(&rt, &accepted.task_id);
    assert_eq!(snapshot.state, TaskState::Succeeded);

    let record = BuildRecordStore::new(base.join("records"))
        .read(&format!("material-{}", plan.plan_id))
        .expect("receipt published");
    assert_eq!(record.status, BuildRecordStatus::Succeeded);

    let second = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
    );
    assert!(second.replayed, "second execute must be a replay");
    assert_eq!(bridge.command_count(), 2, "replay must not touch Unity");
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_task_002_cancelled_run_records_cancelled_receipt() {
    let (base, project, source) = make_world("task-cancel");
    let inspection = MaterialIntakeEngine
        .inspect_folder(&source, "corr")
        .unwrap();
    let plan = MaterialIntakeEngine
        .plan(
            MaterialEntryMode::DirectUnityPackage,
            project.id.clone(),
            "project-fingerprint",
            inspection,
            "corr",
        )
        .unwrap();
    let confirmation = confirmation(&plan);

    let (executor, _) = build_executor(&base, FakeBridge::new());
    executor.cancel();

    let rt = runtime();
    let accepted = vua_orchestrator::submit_material_intake(
        &rt,
        executor,
        MaterialIntakeTaskSpec {
            confirmation: confirmation.clone(),
            source_folder: source.clone(),
            project: project.clone(),
            artifact_output_root: base.join("artifacts"),
        },
        None,
    )
    .unwrap();

    let snapshot = wait_for_terminal(&rt, &accepted.task_id);
    assert_eq!(snapshot.state, TaskState::Cancelled);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}
