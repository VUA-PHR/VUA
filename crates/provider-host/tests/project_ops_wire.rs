//! Project-ops wire tests (proposal 014, `project.import-copy` v0.1): the
//! tasked two-phase import rides the real frame loop over the frozen
//! project-ops word list — plan/apply against a real VCC-registered source
//! project, typed guard refusals as Done-payload result documents, and the
//! closed-set/unavailable faces. The consumer consumes the environment-side
//! frozen schemas from `schemas/project-ops/v0.1`; changing that word list
//! without this consumer fails here first.

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

use std::time::{Duration, Instant};

use serde_json::{json, Value};
use vua_orchestrator::SqliteTaskStore;
use vua_project_manager::ManagerRoots;
use vua_provider_host::{run_provider_host_full, ProjectOpsConfig};

fn command_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/project-ops/v0.1")
}

fn result_validator() -> jsonschema::Validator {
    let bytes = fs::read(command_dir().join("result.schema.json")).expect("result schema exists");
    let schema: Value = serde_json::from_slice(&bytes).expect("result schema is valid JSON");
    jsonschema::validator_for(&schema).expect("frozen result schema must compile")
}

fn command_validator() -> jsonschema::Validator {
    let bytes = fs::read(command_dir().join("command.schema.json")).expect("command schema exists");
    let schema: Value = serde_json::from_slice(&bytes).expect("command schema is valid JSON");
    jsonschema::validator_for(&schema).expect("frozen command schema must compile")
}

/// A unique per-test root (temp dir + label + pid + nanos).
fn unique_root(label: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "vua-project-ops-{label}-{}-{nanos}",
        std::process::id()
    ));
    fs::create_dir_all(&dir).expect("root creates");
    dir
}

/// Seeds a minimal real Unity project (Assets / Packages + manifest /
/// ProjectSettings) plus a VCC settings.json that registers it. Returns
/// (source path, target parent, vcc settings path).
fn seed_registered_source(root: &Path) -> (PathBuf, PathBuf, PathBuf) {
    let source = root.join("source-project");
    fs::create_dir_all(source.join("Assets")).expect("Assets dir");
    fs::create_dir_all(source.join("ProjectSettings")).expect("ProjectSettings dir");
    fs::create_dir_all(source.join("Packages")).expect("Packages dir");
    fs::write(source.join("Assets").join("avatar.fbx"), b"fb fixture").expect("asset file");
    fs::write(
        source.join("ProjectSettings").join("ProjectSettings.asset"),
        "productName: Source Project",
    )
    .expect("project settings");
    fs::write(
        source.join("ProjectSettings").join("ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1",
    )
    .expect("project version");
    fs::write(
        source.join("Packages").join("manifest.json"),
        r#"{"dependencies": {"com.unity.render-pipelines.universal": "14.0.0"}}"#,
    )
    .expect("manifest");
    fs::write(
        source.join("Packages").join("vpm-manifest.json"),
        r#"{"dependencies": {}}"#,
    )
    .expect("vpm manifest");

    let vcc_settings = root.join("vcc-settings.json");
    fs::write(
        &vcc_settings,
        json!({"userProjects": [source.to_string_lossy()]}).to_string(),
    )
    .expect("vcc settings");

    let target_parent = root.join("targets");
    fs::create_dir_all(&target_parent).expect("target parent");
    (source, target_parent, vcc_settings)
}

fn project_ops_config(vcc_settings: &Path) -> ProjectOpsConfig {
    ProjectOpsConfig {
        vcc_settings_candidates: vec![vcc_settings.to_path_buf()],
        manager_roots: ManagerRoots { alcom_settings_candidates: Vec::new() },
    }
}

/// Runs one frame through the real host loop with the project-ops wiring.
fn run_frames(
    database_path: &Path,
    config: Option<&ProjectOpsConfig>,
    requests: &[Value],
) -> Vec<Value> {
    let mut input = String::new();
    for (index, request) in requests.iter().enumerate() {
        let frame = json!({
            "frameVersion": "0.1",
            "frameId": format!("frame-{index}"),
            "kind": "request",
            "payload": {
                "contractVersion": "0.1",
                "requestId": format!("req-{index}"),
                "correlationId": format!("corr-{index}"),
                "kind": "command",
                "method": request["method"],
                "params": request["params"],
            },
        });
        input.push_str(&frame.to_string());
        input.push('\n');
    }
    let mut output = Vec::new();
    run_provider_host_full(
        Cursor::new(input),
        &mut output,
        database_path,
        None,
        None,
        None,
        None,
        config.cloned(),
    )
    .expect("frame loop runs");
    String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect()
}

/// Polls the tasked command to its terminal state and returns the Done
/// payload (the frozen result document travels inside it).
fn wait_done(database_path: &Path, task_id: &str) -> Value {
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        let store = SqliteTaskStore::open(database_path).expect("store opens");
        let task = store.task(task_id).expect("store readable").expect("task exists");
        if task.state.is_terminal() {
            assert_eq!(
                serde_json::to_value(task.state).unwrap(),
                "succeeded",
                "a typed guard refusal still completes the task: {:?}",
                task.error
            );
            return task.result.expect("done payload");
        }
        assert!(Instant::now() < deadline, "the import-copy task did not finish");
        drop(store);
        std::thread::sleep(Duration::from_millis(20));
    }
}

#[test]
fn import_copy_plan_and_apply_run_the_full_two_phase_chain() {
    let validator = result_validator();
    let command_validator = command_validator();
    let root = unique_root("full-chain");
    let (source, target_parent, vcc_settings) = seed_registered_source(&root);
    let database = root.join("tasks.sqlite");
    let config = project_ops_config(&vcc_settings);

    // The command we send must match the frozen command schema.
    let plan_command = json!({
        "schemaVersion": "0.1",
        "operation": "project.import-copy",
        "params": {
            "phase": "plan",
            "sourcePath": source.to_string_lossy(),
            "targetParentDirectory": target_parent.to_string_lossy(),
            "targetProjectName": "Copied Project",
        }
    });
    assert!(command_validator.is_valid(&plan_command),
        "the request must match the frozen command schema: {plan_command}");
    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({
            "method": "project.import-copy",
            "params": plan_command["params"].clone(),
        })],
    );
    let acceptance = &frames[0]["payload"]["value"];
    assert_eq!(acceptance["operation"], "project.import-copy");
    let task_id = acceptance["taskId"].as_str().expect("taskId").to_owned();

    // The plan face: measured bytes, exclusions, transparency list, digest.
    let payload = wait_done(&database, &task_id);
    assert_eq!(payload["schemaVersion"], "0.1");
    // The frozen result schema describes the whole envelope
    // (schemaVersion/operation/result) — exactly the Done payload.
    assert!(validator.is_valid(&payload), "plan must match the frozen result schema: {payload}");
    let plan = &payload["result"];
    assert_eq!(plan["kind"], "plan");
    assert!(plan["estimatedBytes"].as_u64().expect("bytes") > 0);
    let excluded = plan["excludedEntries"].as_array().expect("exclusions");
    assert!(excluded.contains(&json!("Library")), "Unity regenerables are excluded: {excluded:?}");
    let top_levels = plan["sourceTopLevels"].as_array().expect("top levels");
    assert!(top_levels.contains(&json!("Assets")) && top_levels.contains(&json!("Packages")));
    let plan_digest = plan["planDigest"].as_str().expect("planDigest").to_owned();

    // The apply face: drift-checked copy + receipt + the recorded source link.
    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({
            "method": "project.import-copy",
            "params": {
                "phase": "apply",
                "sourcePath": source.to_string_lossy(),
                "targetParentDirectory": target_parent.to_string_lossy(),
                "targetProjectName": "Copied Project",
                "confirmedPlanDigest": plan_digest,
            }
        })],
    );
    let task_id = frames[0]["payload"]["value"]["taskId"].as_str().expect("taskId").to_owned();
    let payload = wait_done(&database, &task_id);
    assert!(validator.is_valid(&payload), "receipt must match the frozen result schema: {payload}");
    let receipt = &payload["result"];
    assert_eq!(receipt["kind"], "receipt");
    assert!(receipt["copiedTopLevels"].as_array().expect("copied").contains(&json!("Assets")));
    assert_eq!(receipt["sourceLink"]["sourceAssociations"], json!(["vcc_registered"]));
    assert!(
        !receipt["sourceLink"]["taskCorrelation"].as_str().unwrap_or_default().is_empty(),
        "the audit chain carries the originating correlation: {receipt}"
    );

    // The copy really landed: Assets exists, Library does not, and the
    // source link is recorded inside the new project's .vua.
    let target = target_parent.join("Copied Project");
    assert!(target.join("Assets").exists(), "Assets copied");
    assert!(!target.join("Library").exists(), "regenerables are not copied");
    assert!(target.join(".vua").join("source.json").exists(), "source link recorded");
}

#[test]
fn import_copy_apply_refuses_on_plan_drift() {
    let validator = result_validator();
    let root = unique_root("drift");
    let (source, target_parent, vcc_settings) = seed_registered_source(&root);
    let database = root.join("tasks.sqlite");
    let config = project_ops_config(&vcc_settings);

    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({
            "method": "project.import-copy",
            "params": {
                "phase": "apply",
                "sourcePath": source.to_string_lossy(),
                "targetParentDirectory": target_parent.to_string_lossy(),
                "targetProjectName": "Copied Project",
                "confirmedPlanDigest": "stale-digest",
            }
        })],
    );
    let task_id = frames[0]["payload"]["value"]["taskId"].as_str().expect("taskId").to_owned();
    let payload = wait_done(&database, &task_id);
    assert!(validator.is_valid(&payload), "rejection must match the frozen schema: {payload}");
    let rejected = &payload["result"];
    assert_eq!(rejected["kind"], "rejected");
    assert_eq!(rejected["guard"], "plan_drift");
    assert_eq!(rejected["code"], "vua.project.plan_drift");
    // Nothing was copied behind a refused confirmation.
    assert!(!target_parent.join("Copied Project").exists());
}

#[test]
fn import_copy_refuses_sources_no_manager_registers() {
    let validator = result_validator();
    let root = unique_root("unregistered");
    let (source, target_parent, vcc_settings) = seed_registered_source(&root);
    // A second project that no manager registers.
    let stranger = root.join("stranger-project");
    fs::create_dir_all(stranger.join("Assets")).expect("stranger Assets");
    let database = root.join("tasks.sqlite");
    let config = project_ops_config(&vcc_settings);

    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({
            "method": "project.import-copy",
            "params": {
                "phase": "plan",
                "sourcePath": stranger.to_string_lossy(),
                "targetParentDirectory": target_parent.to_string_lossy(),
                "targetProjectName": "Stranger Copy",
            }
        })],
    );
    let task_id = frames[0]["payload"]["value"]["taskId"].as_str().expect("taskId").to_owned();
    let payload = wait_done(&database, &task_id);
    assert!(validator.is_valid(&payload), "rejection must match the frozen schema: {payload}");
    let rejected = &payload["result"];
    assert_eq!(rejected["kind"], "rejected");
    assert_eq!(rejected["guard"], "source_not_registered");
    assert_eq!(rejected["code"], "vua.project.source_not_registered");
    let _ = source;
}

#[test]
fn import_copy_wire_guards_and_honest_absence() {
    let root = unique_root("guards");
    let (source, target_parent, vcc_settings) = seed_registered_source(&root);
    let database = root.join("tasks.sqlite");
    let config = project_ops_config(&vcc_settings);

    // Unknown params key: a contract error (closed set), never ignored.
    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({
            "method": "project.import-copy",
            "params": {
                "phase": "plan",
                "sourcePath": source.to_string_lossy(),
                "targetParentDirectory": target_parent.to_string_lossy(),
                "targetProjectName": "Copied Project",
                "extra": true,
            }
        })],
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.project.invalid_params");

    // apply without the confirmed digest: a params violation.
    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({
            "method": "project.import-copy",
            "params": {
                "phase": "apply",
                "sourcePath": source.to_string_lossy(),
                "targetParentDirectory": target_parent.to_string_lossy(),
                "targetProjectName": "Copied Project",
            }
        })],
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.project.invalid_params");

    // An unknown project.* method is a contract error (the write word list
    // is project.import-copy alone).
    let frames = run_frames(
        &database,
        Some(&config),
        &[json!({"method": "project.delete", "params": {}})],
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.provider.unknown_method");

    // Without the project-ops wiring the face is honestly unavailable.
    let frames = run_frames(
        &database,
        None,
        &[json!({
            "method": "project.import-copy",
            "params": {
                "phase": "plan",
                "sourcePath": source.to_string_lossy(),
                "targetParentDirectory": target_parent.to_string_lossy(),
                "targetProjectName": "Copied Project",
            }
        })],
    );
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.project.unavailable");
}
