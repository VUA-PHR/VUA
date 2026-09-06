//! B3 executor tests: the plan state machine against fake ports, with the
//! REAL verified-snapshot store so rollback semantics are proven against
//! actual file trees. Real-Unity calibration (timeout budget, rejection
//! payloads, restore equivalence) is the separate local matrix (M3 gate).

use flate2::write::GzEncoder;
use std::collections::VecDeque;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tar::{Builder, Header};

use vua_orchestrator::{
    BridgeError, BuildRecordStore, ChangePreviewV1, FileSystemSnapshotStore, FixedClock,
    MaterialEntryMode, PackageRequestV1, ProjectRef, ResultStatus, RiskDecisionChoice,
    SourceFolderInspectionV01, UnityBridge, UnityCommand, UnityResult, VpmBackend,
    VpmCapabilities,
};
use vua_unity_bridge::{
    LocalPackageIdentityStore, MaterialCancelToken, MaterialExecutionStatus, MaterialExecutor,
    MaterialIntakeConfirmationV01, MaterialIntakeEngine, MaterialIntakePlanV01, RiskDecisionV01,
    RollbackOutcome,
};

// --- fixtures ---

fn temp_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-mexec-{label}-{nanos}"))
}

fn append(builder: &mut Builder<GzEncoder<fs::File>>, path: &str, bytes: &[u8]) {
    let mut header = Header::new_gnu();
    header.set_size(bytes.len() as u64);
    header.set_mode(0o644);
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
        append(&mut builder, asset, b"synthetic asset bytes");
    }
    builder.finish().unwrap();
}

fn make_world(label: &str) -> (PathBuf, ProjectRef) {
    let base = temp_dir(label);
    let source = base.join("source");
    fs::create_dir_all(&source).unwrap();
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
    (base, project)
}

fn inspection(folder: &Path) -> SourceFolderInspectionV01 {
    MaterialIntakeEngine
        .inspect_folder(folder, "corr")
        .expect("source inspects")
}

fn plan(mode: MaterialEntryMode, folder: &Path) -> MaterialIntakePlanV01 {
    MaterialIntakeEngine
        .plan(mode, "project", "project-fingerprint", inspection(folder), "corr")
        .expect("plan builds")
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
        confirmed_at: "2026-09-04T00:00:00Z".into(),
        correlation_id: "corr".into(),
    }
}

// --- fake ports ---

struct FakeBridgeState {
    script: VecDeque<Result<UnityResult, BridgeError>>,
    commands: Vec<UnityCommand>,
}

#[derive(Clone)]
struct FakeBridge {
    state: Arc<Mutex<FakeBridgeState>>,
}

impl FakeBridge {
    fn new(script: Vec<Result<UnityResult, BridgeError>>) -> Self {
        Self {
            state: Arc::new(Mutex::new(FakeBridgeState {
                script: script.into(),
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
        project: &ProjectRef,
        command: &UnityCommand,
    ) -> Result<UnityResult, BridgeError> {
        let mut state = self.state.lock().unwrap();
        state.commands.push(command.clone());
        // The real Bridge produces the package layout inside the staging
        // project at Packages/<packageId>/; the fake reproduces just enough
        // of that side effect for the deterministic publication step.
        if command.operation == vua_orchestrator::UnityOperation::CreateLocalVpmPackage {
            let package_id = command.payload.package_id.clone().unwrap_or_default();
            let package_dir = project.root.join("Packages").join(&package_id);
            fs::create_dir_all(package_dir.join("Runtime")).unwrap();
            fs::write(
                package_dir.join("package.json"),
                serde_json::json!({ "name": "synthetic.local", "version": "0.1.0" }).to_string(),
            )
            .unwrap();
            // A loadable asset plus its .meta sidecar: the validation list
            // must carry the asset but never the sidecar (review P1: meta
            // files are not loadable assets).
            fs::write(package_dir.join("Runtime").join("Asset.prefab"), "synthetic").unwrap();
            fs::write(package_dir.join("Runtime").join("Asset.prefab.meta"), "meta").unwrap();
        }
        // The real Bridge materializes the extracted layout into Assets/;
        // the fake mirrors that side effect so restores are observable.
        if command.operation == vua_orchestrator::UnityOperation::ImportUnityPackage {
            if let Some(extracted) = &command.payload.source_package_path {
                for entry in fs::read_dir(Path::new(extracted)).into_iter().flatten() {
                    let guid_dir = entry.expect("dir entry").path();
                    let logical = match fs::read_to_string(guid_dir.join("pathname")) {
                        Ok(logical) => logical.trim().to_owned(),
                        Err(_) => continue,
                    };
                    let target = project.root.join(&logical);
                    if let Some(parent) = target.parent() {
                        fs::create_dir_all(parent).unwrap();
                    }
                    fs::copy(guid_dir.join("asset"), &target).unwrap();
                    let _ = fs::copy(guid_dir.join("asset.meta"), target.with_extension("meta"));
                }
            }
        }
        match state.script.pop_front() {
            Some(outcome) => outcome,
            None => Ok(UnityResult {
                schema_version: 1,
                command_id: command.command_id.clone(),
                status: ResultStatus::Succeeded,
                changed_paths: vec![],
                diagnostics: vec![],
                data: serde_json::json!({
                    "projectFingerprint": format!("fp-{}", state.commands.len())
                }),
            }),
        }
    }
}

struct FakeVpm {
    installs: AtomicUsize,
    registrations: AtomicUsize,
}

impl FakeVpm {
    fn new() -> Arc<Self> {
        Arc::new(Self {
            installs: AtomicUsize::new(0),
            registrations: AtomicUsize::new(0),
        })
    }
}

impl VpmBackend for FakeVpm {
    fn name(&self) -> &'static str {
        "fake-vpm"
    }

    fn capabilities(&self) -> VpmCapabilities {
        VpmCapabilities {
            create_project: false,
            preview_install: true,
            list_packages: false,
            remove_packages: false,
            project_registry: false,
        }
    }

    fn preview_install(
        &self,
        _project: &ProjectRef,
        packages: &[PackageRequestV1],
    ) -> Result<ChangePreviewV1, vua_orchestrator::AppErrorV1> {
        Ok(ChangePreviewV1 {
            items: vec![],
            conflicts: vec![],
            remove_legacy_files: vec![],
            remove_legacy_folders: vec![],
            destructive: false,
            digest: format!("digest-{}", packages.len()),
        })
    }

    fn apply_install(
        &self,
        _project: &ProjectRef,
        _packages: &[PackageRequestV1],
        confirmed_digest: &str,
    ) -> Result<serde_json::Value, vua_orchestrator::AppErrorV1> {
        self.installs.fetch_add(1, Ordering::SeqCst);
        assert_eq!(confirmed_digest, "digest-1", "apply binds the confirmed digest");
        Ok(serde_json::json!({ "installed": true }))
    }

    fn register_local_package(&self, _package_root: &Path) -> Result<(), vua_orchestrator::AppErrorV1> {
        self.registrations.fetch_add(1, Ordering::SeqCst);
        Ok(())
    }

    fn create_project(
        &self,
        _parent: &Path,
        _name: &str,
        _template: Option<&str>,
    ) -> Result<ProjectRef, vua_orchestrator::AppErrorV1> {
        // The bundled-template path never asks a backend to create projects.
        Err(vua_orchestrator::AppErrorV1::new(
            "vua.vpm.capability_missing",
            vua_orchestrator::ErrorCategory::Unavailable,
            "errors.vpm.capabilityMissing",
            "corr",
        ))
    }
}

fn executor(base: &Path, bridge: FakeBridge, vpm: Arc<FakeVpm>) -> MaterialExecutor {
    MaterialExecutor::new(
        Arc::new(bridge),
        FileSystemSnapshotStore,
        vpm,
        BuildRecordStore::new(base.join("records")),
        Arc::new(FixedClock::new(&["2026-09-04T00:00:00Z"])),
        base.join("temp"),
        "2022.3.22f1",
        LocalPackageIdentityStore::new(base.join("identities.json")),
    )
}

// --- the state machine ---

#[test]
fn b3_exec_001_direct_mode_happy_path_and_idempotent_replay() {
    let (base, project) = make_world("direct-happy");
    let source = base.join("source");
    let bridge = FakeBridge::new(vec![]);
    let vpm = FakeVpm::new();
    let executor = executor(&base, bridge.clone(), vpm.clone());

    let confirmation = confirmation(&plan(MaterialEntryMode::DirectUnityPackage, &source));
    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Succeeded);
    assert!(!report.replayed);
    assert_eq!(
        report.completed_steps,
        vec![
            vua_unity_bridge::MaterialIntakeStepKind::VerifySource,
            vua_unity_bridge::MaterialIntakeStepKind::CreateSnapshot,
            vua_unity_bridge::MaterialIntakeStepKind::ImportUnityPackages,
            vua_unity_bridge::MaterialIntakeStepKind::ValidateMinimumStructure,
            vua_unity_bridge::MaterialIntakeStepKind::WriteBuildRecord,
        ]
    );
    assert_eq!(report.rollback, RollbackOutcome::NotNeeded);

    // One import + one validation command; mutating command binds the
    // plan's project fingerprint and the package digests.
    assert_eq!(bridge.command_count(), 2);
    let commands = bridge.state.lock().unwrap().commands.clone();
    assert_eq!(commands[0].operation, vua_orchestrator::UnityOperation::MaterializeExtractedPackage);
    assert_eq!(
        commands[0].expected_project_fingerprint.as_deref(),
        Some("project-fingerprint")
    );
    assert_eq!(
        commands[0].payload.source_package_sha256.as_deref(),
        Some(inspection(&source).packages[0].sha256.as_str())
    );
    assert_eq!(commands[1].operation, vua_orchestrator::UnityOperation::ValidateAssetPaths);
    assert!(commands[1].dry_run);

    // The receipt replays idempotently: no further Unity traffic.
    let replay = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );
    assert!(replay.replayed);
    assert_eq!(replay.status, MaterialExecutionStatus::Succeeded);
    assert_eq!(bridge.command_count(), 2, "replay must not touch Unity");

    // The receipt record carries the final fingerprint the fake returned.
    let record = vua_orchestrator::BuildRecordStore::new(base.join("records"))
        .read(&format!("material-{}", confirmation.plan.plan_id))
        .expect("receipt published");
    assert_eq!(record.final_project_fingerprint.as_deref(), Some("fp-1"));
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_002_source_drift_fails_before_the_first_mutation() {
    let (base, project) = make_world("drift");
    let source = base.join("source");
    let bridge = FakeBridge::new(vec![]);
    let executor = executor(&base, bridge.clone(), FakeVpm::new());

    let plan = plan(MaterialEntryMode::DirectUnityPackage, &source);
    let confirmation = confirmation(&plan);
    // Drift: the source grows after Inspect/plan.
    unitypackage(&source.join("late.unitypackage"), &["Assets/Late.prefab"]);

    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Failed);
    assert!(
        report.error_code.as_deref().unwrap_or("").contains("source_drift"),
        "the drift code is the finding: {:?}",
        report.error_code
    );
    assert_eq!(bridge.command_count(), 0, "no Unity command may run on drift");
    assert_eq!(report.rollback, RollbackOutcome::NotNeeded, "nothing mutated yet");
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_003_cancellation_before_the_first_step_touches_nothing() {
    let (base, project) = make_world("cancel");
    let source = base.join("source");
    let bridge = FakeBridge::new(vec![]);
    let executor = executor(&base, bridge.clone(), FakeVpm::new());

    let confirmation = confirmation(&plan(MaterialEntryMode::DirectUnityPackage, &source));
    let token = MaterialCancelToken::new();
    token.cancel();
    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &token,
    );

    assert_eq!(report.status, MaterialExecutionStatus::Cancelled);
    assert_eq!(report.completed_steps, vec![]);
    assert_eq!(bridge.command_count(), 0);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_004_bridge_rejection_restores_the_verified_snapshot() {
    let (base, project) = make_world("reject");
    let source = base.join("source");
    // First command (the import) is rejected by the real Bridge semantics.
    let bridge = FakeBridge::new(vec![Ok(UnityResult {
        schema_version: 1,
        command_id: "rejected".into(),
        status: ResultStatus::Rejected,
        changed_paths: vec![],
        diagnostics: vec![],
        data: serde_json::json!({}),
    })]);
    let executor = executor(&base, bridge, FakeVpm::new());

    let manifest_before =
        fs::read_to_string(project.root.join("vpm-manifest.json")).unwrap();
    let confirmation = confirmation(&plan(MaterialEntryMode::DirectUnityPackage, &source));
    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Failed);
    assert_eq!(report.error_code.as_deref(), Some("vua.material.bridge_rejected"));
    assert_eq!(report.rollback, RollbackOutcome::Restored);

    // The receipt is published for the failed run too — it is what makes a
    // later re-run a replay instead of a blind second mutation.
    let record = vua_orchestrator::BuildRecordStore::new(base.join("records"))
        .read(&format!("material-{}", confirmation.plan.plan_id))
        .expect("failed runs are recorded");
    assert_eq!(record.status, vua_orchestrator::BuildRecordStatus::Failed);
    let snapshot = record.snapshot.expect("snapshot evidence");
    assert!(snapshot.restore_attempted);
    assert_eq!(snapshot.restore_succeeded, Some(true));

    // The restore must leave the project as it was.
    assert_eq!(
        fs::read_to_string(project.root.join("vpm-manifest.json")).unwrap(),
        manifest_before
    );
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_005_bridge_timeout_is_a_typed_failure_with_restore() {
    let (base, project) = make_world("timeout");
    let source = base.join("source");
    let bridge = FakeBridge::new(vec![Err(BridgeError::TimedOut)]);
    let executor = executor(&base, bridge, FakeVpm::new());

    let confirmation = confirmation(&plan(MaterialEntryMode::DirectUnityPackage, &source));
    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Failed);
    assert_eq!(report.error_code.as_deref(), Some("vua.material.bridge_timeout"));
    assert_eq!(report.rollback, RollbackOutcome::Restored);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_006_vpm_mode_runs_the_staging_contract_and_cleans_up() {
    let (base, project) = make_world("vpm-mode");
    let source = base.join("source");
    // Curated dependency declarations travel verbatim into the produced
    // package's package.json — never auto-detected.
    fs::write(
        source.join("vua-dependencies.json"),
        r#"{ "com.vrchat.avatars": "3.10.x", "nadena.dev.modular-avatar": "^1.13.0" }"#,
    )
    .unwrap();
    let vpm = FakeVpm::new();
    let bridge = FakeBridge::new(vec![]);
    let executor = executor(&base, bridge.clone(), vpm.clone());

    let confirmation = confirmation(&plan(MaterialEntryMode::LocalReusableVpm, &source));
    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Succeeded);
    let steps = &report.completed_steps;
    for expected in [
        vua_unity_bridge::MaterialIntakeStepKind::CreateLocalVpmPackage,
        vua_unity_bridge::MaterialIntakeStepKind::PreviewVpmInstall,
        vua_unity_bridge::MaterialIntakeStepKind::ApplyVpmInstall,
    ] {
        assert!(steps.contains(&expected), "missing {expected:?}");
    }

    // The Bridge command sequence inside staging: inspect → import →
    // create; all scoped to the staging project and token-bound. The final
    // validation then runs against the TARGET project.
    let commands = bridge.state.lock().unwrap().commands.clone();
    assert_eq!(commands.len(), 4);
    assert_eq!(commands[0].operation, vua_orchestrator::UnityOperation::InspectProject);
    assert_eq!(commands[1].operation, vua_orchestrator::UnityOperation::MaterializeExtractedPackage);
    assert_eq!(commands[2].operation, vua_orchestrator::UnityOperation::CreateLocalVpmPackage);
    for command in &commands[..3] {
        assert!(command.project_id.ends_with("-staging"));
    }
    assert_eq!(commands[3].operation, vua_orchestrator::UnityOperation::ValidateAssetPaths);
    assert_eq!(commands[3].project_id, "project");
    assert_eq!(
        commands[2].payload.staging_token.as_deref(),
        Some(confirmation.correlation_id.as_str())
    );
    // Declared dependencies reach the Bridge payload verbatim, sorted.
    let validated = &commands[3].payload.expected_asset_paths;
    assert!(
        validated.iter().any(|path| path.ends_with("Runtime/Asset.prefab")),
        "loadable assets are validated: {validated:?}"
    );
    assert!(
        validated.iter().all(|path| !path.ends_with(".meta")),
        "meta sidecars are never validated as assets: {validated:?}"
    );
    let declared: Vec<(String, String)> = commands[2]
        .payload
        .package_dependencies
        .iter()
        .map(|dependency| (dependency.package_id.clone(), dependency.version.clone()))
        .collect();
    assert_eq!(
        declared,
        vec![
            ("com.vrchat.avatars".to_owned(), "3.10.x".to_owned()),
            ("nadena.dev.modular-avatar".to_owned(), "^1.13.0".to_owned()),
        ]
    );
    // The staging import chained the staging fingerprint from the inspect
    // (the fake bridge numbers its returned fingerprints fp-1, fp-2, …).
    assert_eq!(commands[1].expected_project_fingerprint.as_deref(), Some("fp-1"));
    assert_eq!(commands[2].expected_project_fingerprint.as_deref(), Some("fp-2"));

    // The package was registered and installed with the bound digest.
    assert_eq!(vpm.registrations.load(Ordering::SeqCst), 1);
    assert_eq!(vpm.installs.load(Ordering::SeqCst), 1);

    // The staging directory is destroyed on the success path.
    let staging = vua_unity_bridge::staging_root(&base.join("temp"), "corr");
    assert!(!staging.exists(), "staging leftovers poison later runs");

    // The receipt carries the local VPM evidence.
    let record = vua_orchestrator::BuildRecordStore::new(base.join("records"))
        .read(&format!("material-{}", confirmation.plan.plan_id))
        .expect("receipt published");
    let local_vpm = record.local_vpm.expect("local vpm evidence");
    assert!(
        local_vpm.package_id.starts_with("com.ph-r.vua.local.source."),
        "machine id comes from the identity store: {}",
        local_vpm.package_id
    );
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

// --- review findings: failed receipts never replay as success; same-name
// sources get distinct machine identities ---

#[test]
fn b3_exec_007_failed_receipt_is_never_replayed_as_success() {
    let (base, project) = make_world("retry-after-failure");
    let source = base.join("source");

    // Attempt 1: the real Bridge rejects the import; the receipt records
    // the failure.
    let rejection = vec![Ok(UnityResult {
        schema_version: 1,
        command_id: "rejected".into(),
        status: ResultStatus::Rejected,
        changed_paths: vec![],
        diagnostics: vec![],
        data: serde_json::json!({}),
    })];
    let bridge = FakeBridge::new(rejection);
    let first_executor = executor(&base, bridge.clone(), FakeVpm::new());
    let confirmation = confirmation(&plan(MaterialEntryMode::DirectUnityPackage, &source));
    let first = first_executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );
    assert_eq!(first.status, MaterialExecutionStatus::Failed);
    let failed_record_id = first.build_record_id.expect("failed run records");

    // Attempt 2: a retry runs FRESH — Unity is invoked again, and the new
    // receipt is published under the next free attempt id without touching
    // the failed one.
    let bridge = FakeBridge::new(vec![]);
    let retry_executor = executor(&base, bridge.clone(), FakeVpm::new());
    let second = retry_executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );
    println!("second: {second:?}");

    assert_eq!(second.status, MaterialExecutionStatus::Succeeded);
    assert!(!second.replayed, "a failed receipt must never replay as success");
    assert_eq!(bridge.command_count(), 2, "the retry really executed");
    assert_ne!(second.build_record_id.as_deref(), Some(failed_record_id.as_str()));

    let store = vua_orchestrator::BuildRecordStore::new(base.join("records"));
    let failed = store.read(&failed_record_id).expect("failed receipt intact");
    assert_eq!(failed.status, vua_orchestrator::BuildRecordStatus::Failed);
    let retried = store.read(second.build_record_id.as_deref().unwrap()).unwrap();
    assert_eq!(retried.status, vua_orchestrator::BuildRecordStatus::Succeeded);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_008_same_name_sources_resolve_distinct_machine_identities() {
    let base = temp_dir("identity");
    let source_one = base.join("one").join("source");
    let source_two = base.join("two").join("source");
    for folder in [&source_one, &source_two] {
        fs::create_dir_all(folder).unwrap();
        unitypackage(&folder.join("pack.unitypackage"), &["Assets/Asset.prefab"]);
    }
    let store = LocalPackageIdentityStore::new(base.join("identities.json"));

    let identity_one = store.resolve(&source_one, "source").expect("identity one");
    let identity_two = store.resolve(&source_two, "source").expect("identity two");

    assert_ne!(identity_one.package_id, identity_two.package_id);
    assert_eq!(identity_one.display_name, "source");
    assert_eq!(identity_two.display_name, "source (2)");
    // Stable across repeat resolution.
    let again = store.resolve(&source_one, "source").unwrap();
    assert_eq!(again.package_id, identity_one.package_id);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

/// Simulates the worst production failure: the recovery point vanishes
/// between CreateSnapshot and the restore attempt (e.g. disk loss under
/// `.vua/`). The first command fails AND takes the snapshot with it, so the
/// executor's restore itself errors — the receipt must still be published.
struct SnapshotDestroyingBridge {
    inner: FakeBridge,
}

impl UnityBridge for SnapshotDestroyingBridge {
    fn execute(
        &self,
        project: &ProjectRef,
        command: &UnityCommand,
    ) -> Result<UnityResult, BridgeError> {
        let snapshots = project.root.join(".vua/snapshots");
        if snapshots.is_dir() {
            for entry in fs::read_dir(&snapshots).into_iter().flatten() {
                let _ = fs::remove_dir_all(entry.expect("dir entry").path());
            }
        }
        self.inner.execute(project, command)
    }
}

#[test]
fn b3_exec_007_restore_failure_still_publishes_the_receipt() {
    let (base, project) = make_world("restore-fail");
    let source = base.join("source");
    let bridge = FakeBridge::new(vec![Err(BridgeError::TimedOut)]);
    let executor = MaterialExecutor::new(
        Arc::new(SnapshotDestroyingBridge { inner: bridge }),
        FileSystemSnapshotStore,
        FakeVpm::new(),
        BuildRecordStore::new(base.join("records")),
        Arc::new(FixedClock::new(&["2026-09-04T00:00:00Z"])),
        base.join("temp"),
        "2022.3.22f1",
        LocalPackageIdentityStore::new(base.join("identities.json")),
    );

    let confirmation = confirmation(&plan(MaterialEntryMode::DirectUnityPackage, &source));
    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Failed);
    assert!(
        report
            .error_code
            .as_deref()
            .unwrap_or("")
            .starts_with("vua.material.rollback_failed"),
        "the rollback_failed code is the finding: {:?}",
        report.error_code
    );
    assert_eq!(report.rollback, RollbackOutcome::Failed);

    // The worst outcome is precisely when an immutable receipt matters: the
    // record must carry restore_attempted=true, restore_succeeded=false.
    let record = vua_orchestrator::BuildRecordStore::new(base.join("records"))
        .read(&format!("material-{}", confirmation.plan.plan_id))
        .expect("a failed restore must still be recorded");
    assert_eq!(record.status, vua_orchestrator::BuildRecordStatus::Failed);
    let snapshot = record.snapshot.expect("snapshot evidence");
    assert!(snapshot.restore_attempted);
    assert_eq!(snapshot.restore_succeeded, Some(false));
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn b3_exec_008_editing_the_declarations_after_planning_is_drift() {
    let (base, project) = make_world("deps-drift");
    let source = base.join("source");
    fs::write(
        source.join("vua-dependencies.json"),
        r#"{ "com.vrchat.avatars": "3.10.x" }"#,
    )
    .unwrap();
    let bridge = FakeBridge::new(vec![]);
    let executor = executor(&base, bridge.clone(), FakeVpm::new());

    let plan = plan(MaterialEntryMode::LocalReusableVpm, &source);
    let confirmation = confirmation(&plan);

    // The user edits the declarations after planning: the produced
    // package.json would differ from what was confirmed, so the run must
    // refuse before the first mutation.
    fs::write(
        source.join("vua-dependencies.json"),
        r#"{ "com.vrchat.avatars": "3.12.x" }"#,
    )
    .unwrap();

    let report = executor.execute(
        &confirmation,
        &source,
        &project,
        &base.join("artifacts"),
        &MaterialCancelToken::new(),
    );

    assert_eq!(report.status, MaterialExecutionStatus::Failed);
    assert!(
        report.error_code.as_deref().unwrap_or("").contains("source_drift"),
        "declaration edits are source drift: {:?}",
        report.error_code
    );
    assert_eq!(bridge.command_count(), 0, "no Unity command may run on drift");
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}
