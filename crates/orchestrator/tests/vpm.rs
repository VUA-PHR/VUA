//! E-PKG integration tests: process runner discipline, verified scoped
//! snapshots, and the VPM install flow (plan → confirm → execute → verify →
//! rollback). Each test cites its ORC requirement (ORC-TST-006).
//!
//! CI and `cargo test` exercise the engine against a scripted fake backend.
//! The real-vrc-get smoke (a genuine open-source package install + rollback
//! on this machine) is documented in the agile plan and gated behind
//! `#[ignore]` because it needs the local vrc-get binary and network access.

// Matches the crate-level exception: engine results carry the fat envelope.
#![allow(clippy::result_large_err)]

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use vua_orchestrator::{
    outcome_with_exit, ErrorCategory, FakeProcessRunner, FileSystemSnapshotStore, FixedClock,
    FixedIdGenerator, InstallRequest, MemoryJournal, ParamValue, ProcessOutcome, ProcessSpec,
    ProjectRef, SnapshotRef, StdProcessRunner, SubmitRequest, SystemClock, TaskEventKind, TaskExit,
    TaskRuntime, TaskState, VpmEngine,
};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-vpm-{label}-{nanos}"))
}

/// A minimal fake Unity/VPM project: vpm-manifest.json + Packages/.
fn make_project(label: &str) -> (ProjectRef, PathBuf) {
    let root = unique_dir(label);
    fs::create_dir_all(root.join("Packages")).unwrap();
    fs::write(
        root.join("vpm-manifest.json"),
        r#"{"dependencies": {}, "locked": {}}"#,
    )
    .unwrap();
    (
        ProjectRef {
            id: format!("proj-{label}"),
            root: root.clone(),
        },
        root,
    )
}

fn engine_with(runner: Arc<FakeProcessRunner>) -> VpmEngine {
    VpmEngine::discover(
        runner,
        Arc::new(FixedClock::new(&["2026-08-30T00:00:00.000Z"])),
        PathBuf::from("C:/tools/vrc-get.exe"),
    )
    .unwrap()
}

fn install_request(root: &Path, package: &str) -> InstallRequest {
    InstallRequest {
        project: ProjectRef {
            id: "proj-1".into(),
            root: root.to_path_buf(),
        },
        package_id: package.into(),
        version: Some("1.2.3".into()),
    }
}

fn manifest_text(root: &Path) -> String {
    fs::read_to_string(root.join("vpm-manifest.json")).unwrap()
}

/// Side effect that simulates vrc-get adding the package to the manifest.
/// Only reacts to `install` invocations; discovery and other calls are
/// ignored.
fn fake_install_effect() -> impl Fn(&ProcessSpec) + Send + Sync {
    move |spec: &ProcessSpec| {
        if spec.args.first().map(String::as_str) != Some("install") {
            return;
        }
        let package = &spec.args[1];
        let version = if spec.args.len() > 3 && spec.args[2] != "-p" {
            spec.args[2].clone()
        } else {
            "9.9.9".into()
        };
        let root = PathBuf::from(&spec.args[spec.args.len() - 1]);
        fs::write(
            root.join("vpm-manifest.json"),
            format!(r#"{{"dependencies": {{ "{package}": {{"version": "{version}"}} }}, "locked": {{}}}}"#),
        )
        .unwrap();
    }
}

// --- discovery & capability (ORC-ADP-002, ORC-ADP-007) ---

#[test]
fn orc_adp_002_discovery_records_the_version_and_rejects_a_broken_backend() {
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(ProcessOutcome {
        exit_code: Some(0),
        timed_out: false,
        cancelled: false,
        process_tree_clean: true,
        stdout: "vrc-get 1.9.2 (abc123)\n".into(),
        stderr: String::new(),
        truncated: false,
    }));
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    assert_eq!(engine.version(), "vrc-get 1.9.2 (abc123)");

    let failing = Arc::new(FakeProcessRunner::new());
    failing.push(Err("binary vanished".into()));
    let error = VpmEngine::discover(
        failing,
        Arc::new(FixedClock::new(&["2026-08-30T00:00:00.000Z"])),
        PathBuf::from("C:/tools/vrc-get.exe"),
    )
    .expect_err("a broken backend must surface as unavailable");
    assert_eq!(error.code, "vua.vpm.executable_missing");
    assert_eq!(error.category, ErrorCategory::Unavailable);

    let exiting = Arc::new(FakeProcessRunner::new());
    exiting.push(Ok(outcome_with_exit(1, "")));
    let error = VpmEngine::discover(
        exiting,
        Arc::new(FixedClock::new(&["2026-08-30T00:00:00.000Z"])),
        PathBuf::from("C:/tools/vrc-get.exe"),
    )
    .expect_err("a non-zero --version must surface as unavailable");
    assert_eq!(error.code, "vua.vpm.executable_missing");
}

// --- plan & confirm (ORC-WF-001..003) ---

#[test]
fn orc_wf_002_plan_is_read_only_hash_stable_and_step_ordered() {
    let runner = Arc::new(FakeProcessRunner::new());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (_project, root) = make_project("plan");
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();

    assert_eq!(runner.call_count(), 0, "plan must not spawn anything");
    assert_eq!(plan.steps.len(), 3);
    assert_eq!(plan.steps[0].operation, "snapshot");
    assert_eq!(plan.steps[1].operation, "vpm_install");
    assert!(plan.steps[1].mutates_project);
    assert_eq!(plan.steps[2].operation, "verify_manifest");

    let again = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    assert_eq!(plan.plan_hash, again.plan_hash, "same input, same hash");
    assert_eq!(plan.plan_id, format!("plan-{}", plan.plan_hash));
}

#[test]
fn orc_adp_004_invalid_package_or_version_is_rejected_before_any_io() {
    let runner = Arc::new(FakeProcessRunner::new());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (_project, root) = make_project("validate");
    for package in ["", "../evil", "a/b", "com.test pack", "com.^evil"] {
        let error = engine
            .plan_install(&install_request(&root, package))
            .expect_err("invalid package id must be rejected");
        assert_eq!(error.code, "vua.vpm.package_invalid", "{package:?}");
    }
    let error = engine
        .plan_install(&InstallRequest {
            project: ProjectRef {
                id: "p".into(),
                root: root.clone(),
            },
            package_id: "com.test.pack".into(),
            version: Some("1.2.3; rm -rf /".into()),
        })
        .expect_err("shell-flavored version must be rejected");
    assert_eq!(error.code, "vua.vpm.package_invalid");
    assert_eq!(runner.call_count(), 0);
}

#[test]
fn orc_wf_011_already_installed_plan_is_an_explicit_noop() {
    let runner = Arc::new(FakeProcessRunner::new());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (_project, root) = make_project("noop");
    fs::write(
        root.join("vpm-manifest.json"),
        r#"{"dependencies": {"com.test.pack": {"version": "1.2.3"}}}"#,
    )
    .unwrap();
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    assert!(plan.noop);
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    let payload = engine.execute(&confirmation, None).unwrap();
    assert_eq!(payload["noop"], true);
    assert_eq!(runner.call_count(), 0, "no-op must not spawn vrc-get");
}

#[test]
fn orc_wf_004_noop_replay_is_refused_when_the_premise_no_longer_holds() {
    // Fix 6: noop 重放之前必须过漂移门——确认后包被删除，重放不能
    // 假装成功。
    let runner = Arc::new(FakeProcessRunner::new());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (_project, root) = make_project("noop-drift");
    fs::write(
        root.join("vpm-manifest.json"),
        r#"{"dependencies": {"com.test.pack": {"version": "1.2.3"}}}"#,
    )
    .unwrap();
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    assert!(plan.noop);
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();

    fs::write(root.join("vpm-manifest.json"), r#"{"dependencies": {}}"#).unwrap();
    let error = engine
        .execute(&confirmation, None)
        .expect_err("premise gone");
    assert_eq!(error.code, "vua.vpm.manifest_drift");
    assert_eq!(runner.call_count(), 0);
}

#[test]
fn orc_sto_006_retrying_the_same_plan_after_a_failed_attempt_works() {
    // Fix 6: 失败尝试留下的快照目录不得让同一计划的重试撞上
    // AlreadyExists。
    let discovery_ok = ProcessOutcome {
        exit_code: Some(0),
        timed_out: false,
        cancelled: false,
        process_tree_clean: true,
        stdout: "vrc-get 1.9.2
"
        .into(),
        stderr: String::new(),
        truncated: false,
    };
    let (_project, root) = make_project("retry");
    let runner = Arc::new(FakeProcessRunner::new());
    // 第一次 install 超时且**无副作用**（真实超时语义：后端没来得及写），
    // 第二次 install 才落 manifest——否则部分变更后的重试走漂移门
    // （那是正确行为，需重新计划而非原样重试）。
    let install_calls = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let calls_for_effect = install_calls.clone();
    runner.on_run(move |spec: &ProcessSpec| {
        if spec.args.first().map(String::as_str) == Some("install")
            && calls_for_effect.fetch_add(1, std::sync::atomic::Ordering::SeqCst) >= 1
        {
            fake_install_effect()(spec);
        }
    });
    runner.push(Ok(discovery_ok.clone()));
    runner.push(Ok(ProcessOutcome {
        exit_code: None,
        timed_out: true,
        cancelled: false,
        process_tree_clean: true,
        stdout: String::new(),
        stderr: String::new(),
        truncated: false,
    }));
    runner.push(Ok(discovery_ok));
    let engine = engine_with(runner);
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();

    let first = engine.execute(&confirmation, None).unwrap_err();
    assert_eq!(first.code, "vua.vpm.install_timeout");

    // 同一确认直接重试：新的尝试拿到新的快照 id，正常走完全程。
    let payload = engine.execute(&confirmation, None).unwrap();
    assert_eq!(payload["noop"], false);
    assert!(manifest_text(&root).contains("com.test.pack"));
}

#[test]
fn orc_wf_003_confirm_binds_the_plan_hash_and_rejects_tampering() {
    let engine = engine_with(Arc::new(FakeProcessRunner::new()));
    let (_project, root) = make_project("confirm");
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();

    let error = engine
        .confirm(&plan, "deadbeefdeadbeef")
        .expect_err("a mismatched hash must be rejected");
    assert_eq!(error.code, "vua.vpm.plan_hash_mismatch");
    assert_eq!(error.category, ErrorCategory::Conflict);

    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    assert_eq!(confirmation.confirmed_at, "2026-08-30T00:00:00.000Z");

    // A tampered plan (same hash string) is caught because the recorded hash
    // no longer matches the tampered content.
    let mut tampered = plan.clone();
    tampered.package_id = "com.other.pack".into();
    let error = engine
        .confirm(&tampered, &plan.plan_hash)
        .expect_err("content-hash mismatch must be rejected");
    assert_eq!(error.code, "vua.vpm.plan_hash_mismatch");
}

// --- execute (ORC-WF-004/005/009, ORC-ADP-001/003, ORC-CON-004) ---

#[test]
fn orc_wf_005_happy_path_snapshots_runs_and_verifies() {
    let runner = Arc::new(FakeProcessRunner::new());
    runner.on_run(fake_install_effect());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (_project, root) = make_project("happy");
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();

    let payload = engine.execute(&confirmation, None).unwrap();
    assert_eq!(payload["noop"], false);
    assert_eq!(payload["version"], "1.2.3");
    assert!(payload["snapshotId"].is_string());

    // Typed invocation, no shell: install <pkg> 1.2.3 -p <root>.
    assert_eq!(runner.call_count(), 1);
    let spec = runner.calls()[0].clone();
    assert_eq!(spec.executable, PathBuf::from("C:/tools/vrc-get.exe"));
    assert_eq!(
        spec.args,
        vec![
            "install".to_owned(),
            "com.test.pack".to_owned(),
            "1.2.3".to_owned(),
            "-p".to_owned(),
            root.to_string_lossy().into_owned(),
        ]
    );
    // The verified snapshot exists and contains the manifest.
    let snapshot_dir = root
        .join(".vua/snapshots")
        .join(payload["snapshotId"].as_str().unwrap());
    assert!(snapshot_dir.join("manifest.json").is_file());
    assert!(snapshot_dir.join("vpm-manifest.json").is_file());
    assert!(snapshot_dir.join("Packages").is_dir());
}

#[test]
fn orc_wf_004_manifest_drift_between_plan_and_execute_refuses_to_run() {
    let runner = Arc::new(FakeProcessRunner::new());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (_project, root) = make_project("drift");
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();

    // The project changes after confirmation.
    fs::write(
        root.join("vpm-manifest.json"),
        r#"{"dependencies": {"other": {"version": "0.1"}}}"#,
    )
    .unwrap();

    let error = engine
        .execute(&confirmation, None)
        .expect_err("drifted project must refuse execution");
    assert_eq!(error.code, "vua.vpm.manifest_drift");
    assert_eq!(error.category, ErrorCategory::Conflict);
    assert_eq!(
        runner.call_count(),
        0,
        "nothing may run past the drift gate"
    );
}

#[test]
fn orc_adp_003_backend_failures_map_to_stable_typed_errors() {
    let discovery_ok = ProcessOutcome {
        exit_code: Some(0),
        timed_out: false,
        cancelled: false,
        process_tree_clean: true,
        stdout: "vrc-get 1.9.2\n".into(),
        stderr: String::new(),
        truncated: false,
    };

    // Timeout → timeout category, retryable.
    let (_project, root) = make_project("failures-timeout");
    let runner = Arc::new(FakeProcessRunner::new());
    runner.on_run(fake_install_effect());
    runner.push(Ok(discovery_ok.clone()));
    runner.push(Ok(ProcessOutcome {
        exit_code: None,
        timed_out: true,
        cancelled: false,
        process_tree_clean: true,
        stdout: String::new(),
        stderr: String::new(),
        truncated: false,
    }));
    let engine = engine_with(runner);
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    let error = engine.execute(&confirmation, None).unwrap_err();
    assert_eq!(error.code, "vua.vpm.install_timeout");
    assert_eq!(error.category, ErrorCategory::Timeout);
    assert!(error.retryable);

    // Non-zero exit → external failure with exit code param.
    let (_project, root) = make_project("failures-exit");
    let runner = Arc::new(FakeProcessRunner::new());
    runner.on_run(fake_install_effect());
    runner.push(Ok(discovery_ok.clone()));
    runner.push(Ok(outcome_with_exit(2, "resolution failed")));
    let engine = engine_with(runner);
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    let error = engine.execute(&confirmation, None).unwrap_err();
    assert_eq!(error.code, "vua.vpm.install_failed");
    assert_eq!(
        error.params.as_ref().unwrap()["exitCode"],
        ParamValue::Number(2.0)
    );

    // Spawn failure (Io) → external failure, recoverable.
    let (_project, root) = make_project("failures-io");
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(discovery_ok));
    runner.push(Err("access denied".into()));
    let engine = engine_with(runner);
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    let error = engine.execute(&confirmation, None).unwrap_err();
    assert_eq!(error.code, "vua.vpm.install_failed");
    assert!(error.recoverable);
}

#[test]
fn orc_wf_009_success_without_manifest_change_fails_domain_verification() {
    // The backend reports success but the manifest did not change: the
    // domain-level verify must reject it (a snapshot exists for rollback).
    let runner = Arc::new(FakeProcessRunner::new());
    let engine = engine_with(runner.clone());
    runner.clear_calls();
    let (project, root) = make_project("verify");
    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();

    let error = engine.execute(&confirmation, None).unwrap_err();
    assert_eq!(error.code, "vua.vpm.verify_failed");
    assert!(error.recoverable);
    assert_eq!(runner.call_count(), 1);

    // The snapshot left behind restores the pre-run state.
    let snapshots = root.join(".vua/snapshots");
    let entry = fs::read_dir(&snapshots).unwrap().next().unwrap().unwrap();
    let snapshot = SnapshotRef {
        id: entry.file_name().into_string().unwrap(),
        path: entry.path(),
    };
    engine.rollback(&project, &snapshot).unwrap();
    assert!(!manifest_text(&root).contains("com.test.pack"));
}

#[test]
fn orc_sto_006_rollback_restores_the_exact_pre_install_manifest() {
    let runner = Arc::new(FakeProcessRunner::new());
    runner.on_run(fake_install_effect());
    let engine = engine_with(runner);
    let (project, root) = make_project("rollback");
    let original = manifest_text(&root);

    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    let payload = engine.execute(&confirmation, None).unwrap();
    assert!(
        manifest_text(&root).contains("com.test.pack"),
        "install must have landed"
    );

    let snapshot = SnapshotRef {
        id: payload["snapshotId"].as_str().unwrap().to_owned(),
        path: root
            .join(".vua/snapshots")
            .join(payload["snapshotId"].as_str().unwrap()),
    };
    engine.rollback(&project, &snapshot).unwrap();
    assert_eq!(
        manifest_text(&root),
        original,
        "rollback must restore exactly"
    );
    // Quarantine keeps the mutated state for diagnosis.
    assert!(root.join(".vua/recovery").read_dir().unwrap().count() >= 1);
}

// --- verified scoped snapshot store (ORC-STO-006/009) ---

#[test]
fn orc_sto_009_verified_snapshot_rejects_traversal_scopes_and_tampered_files() {
    let store = FileSystemSnapshotStore;
    let (project, root) = make_project("scopes");

    for scope in ["../escape", "/abs", "a\\b", "C:evil", "dir/../.."] {
        let error = store
            .create_verified(&project, "snap-x", &[scope])
            .expect_err("unsafe scope must be rejected");
        assert_eq!(error.kind(), std::io::ErrorKind::InvalidInput, "{scope:?}");
    }

    let verified = store
        .create_verified(&project, "snap-ok", &["Packages", "vpm-manifest.json"])
        .unwrap();
    assert!(verified.reference.path.join("manifest.json").is_file());
    assert!(verified
        .entries
        .iter()
        .any(|entry| entry.path == "vpm-manifest.json"));

    // Tamper with the snapshot, then restore must refuse without mutating.
    fs::write(
        verified.reference.path.join("vpm-manifest.json"),
        "tampered",
    )
    .unwrap();
    fs::write(root.join("vpm-manifest.json"), r#"{"dependencies": {}}"#).unwrap();
    let error = store
        .restore_verified(&project, &verified.reference)
        .expect_err("a tampered snapshot must be refused");
    assert_eq!(error.kind(), std::io::ErrorKind::InvalidData);
    assert_eq!(
        manifest_text(&root),
        r#"{"dependencies": {}}"#,
        "no mutation happened"
    );
}

#[test]
fn orc_sto_006_rollback_removes_scopes_absent_at_snapshot_time() {
    let store = FileSystemSnapshotStore;
    let (project, root) = make_project("absent-scope");
    let assets = root.join("Assets");
    if assets.exists() {
        fs::remove_dir_all(&assets).unwrap();
    }

    let verified = store
        .create_verified(&project, "snap-absent", &["Assets", "Packages"])
        .unwrap();
    fs::create_dir_all(&assets).unwrap();
    fs::write(assets.join("Generated.asset"), "created after snapshot").unwrap();

    store
        .restore_verified(&project, &verified.reference)
        .unwrap();
    assert!(
        !assets.exists(),
        "rollback must restore absence, not only overwrite recorded files"
    );
}

// --- manual smoke against the real backend (E-PKG acceptance) ---

/// E-PKG manual acceptance (agile plan): installs a real open-source VPM
/// package into a throwaway project and rolls it back. Requires a local
/// `vrc-get` (or `VRC_GET_EXE`) and network access, so it never runs in CI:
///
///   cargo test -p vua-orchestrator --test vpm manual_real -- --ignored
#[test]
#[ignore = "requires a local vrc-get binary and network; manual acceptance only"]
fn manual_real_vrc_get_install_and_rollback_smoke() {
    let executable = std::env::var("VRC_GET_EXE").unwrap_or_else(|_| "vrc-get".to_owned());
    let runner = Arc::new(StdProcessRunner);
    let engine = VpmEngine::discover(runner, Arc::new(SystemClock), executable)
        .expect("vrc-get must be discoverable for the manual smoke");
    println!("discovered: {}", engine.version());

    let (project, root) = make_project("real-smoke");
    let request = InstallRequest {
        project: project.clone(),
        package_id: "com.vrcfud.vrcfud".into(),
        version: None,
    };
    let plan = engine.plan_install(&request).unwrap();
    assert!(!plan.noop);
    let confirmation = engine.confirm(&plan, &plan.plan_hash).unwrap();
    let payload = engine.execute(&confirmation, None).unwrap();
    println!("install payload: {payload}");
    assert!(manifest_text(&root).contains("com.vrcfud.vrcfud"));

    let snapshot = SnapshotRef {
        id: payload["snapshotId"].as_str().unwrap().to_owned(),
        path: root
            .join(".vua/snapshots")
            .join(payload["snapshotId"].as_str().unwrap()),
    };
    engine.rollback(&project, &snapshot).unwrap();
    assert!(
        !manifest_text(&root).contains("com.vrcfud.vrcfud"),
        "rollback must remove the package from the manifest"
    );
    let _ = fs::remove_dir_all(&root);
}

// --- task runtime integration (ORC-CON-001, ORC-IPC-003, ORC-STA-003) ---

#[test]
fn orc_con_001_install_runs_as_a_runtime_task_with_monotonic_events() {
    let runner = Arc::new(FakeProcessRunner::new());
    runner.on_run(fake_install_effect());
    let engine = Arc::new(engine_with(runner));
    let (_project, root) = make_project("runtime");

    let runtime = TaskRuntime::new(
        Arc::new(MemoryJournal::new()),
        Arc::new(FixedClock::new(&["2026-08-30T00:00:00.000Z"])),
        Arc::new(FixedIdGenerator::default()),
    );
    let receiver = runtime.subscribe();

    let plan = engine
        .plan_install(&install_request(&root, "com.test.pack"))
        .unwrap();
    let confirmation = Arc::new(engine.confirm(&plan, &plan.plan_hash).unwrap());
    let engine_for_job = engine.clone();
    let accepted = runtime
        .submit(SubmitRequest {
            correlation_id: Some(confirmation.correlation_id.clone()),
            timeout: Some(Duration::from_secs(30)),
            job: Box::new(move |context| {
                engine_for_job
                    .execute(&confirmation, Some(context))
                    .map(TaskExit::Done)
            }),
        })
        .unwrap();

    let deadline = Instant::now() + Duration::from_secs(10);
    let mut last_revision = 0;
    let mut completed = false;
    while !completed {
        let budget = deadline.saturating_duration_since(Instant::now());
        let event = receiver
            .recv_timeout(budget.max(Duration::from_millis(1)))
            .expect("events must arrive");
        assert_eq!(event.task_id, accepted.task_id);
        assert!(event.revision > last_revision, "revisions stay monotonic");
        last_revision = event.revision;
        if event.kind == TaskEventKind::Completed {
            completed = true;
            assert_eq!(event.state, TaskState::Succeeded);
            assert_eq!(event.payload["package"], "com.test.pack");
        }
    }
    assert!(manifest_text(&root).contains("com.test.pack"));
}
