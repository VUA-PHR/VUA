//! Warehouse command face wire tests (proposal 005; bdl-commands v0.2).
//!
//! The host consumes the data-side frozen vectors from
//! `schemas/bdl-commands/v0.2/examples` through the real frame loop:
//! `warehouse.setArtifactMode` applies synchronously and reports the
//! entry's effective mode read back from the store (override ?? composed
//! global default); `warehouse.setGlobalDefaultMode` persists the global
//! level and reports the stored fact read back; the tasked commands
//! return a task acceptance that validates against the frozen result
//! schema and persists on the SQLite task authority. Guards fire inside
//! the tasks, never at admission; generation without a Unity executor is
//! an honest typed unavailable. Changing the wire vocabulary without
//! updating schema, vectors and this consumer fails here first.

use std::fs;
use std::io::Cursor;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use serde_json::{json, Value};
use vua_bdl_store::{ArtifactMode, BdlStore};
use vua_provider_host::{run_provider_host_with_services, WarehouseConfig};

fn command_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/bdl-commands/v0.2")
}

fn read_json(relative: &str) -> Value {
    let bytes = fs::read(command_dir().join(relative)).expect("schema/vector must exist");
    serde_json::from_slice(&bytes).expect("schema/vector must be valid JSON")
}

fn result_validator() -> jsonschema::Validator {
    let schema = read_json("result.schema.json");
    jsonschema::validator_for(&schema).expect("frozen result schema must compile")
}

static SEQUENCE: AtomicU32 = AtomicU32::new(0);

struct World {
    base: PathBuf,
    database_path: PathBuf,
    bdl: Arc<BdlStore>,
    warehouse_item_id: String,
}

impl Drop for World {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.base);
    }
}

fn make_world(label: &str) -> World {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let serial = SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let base = std::env::temp_dir().join(format!(
        "vua-provider-warehouse-{label}-{}-{nanos}-{serial}",
        std::process::id()
    ));
    fs::create_dir_all(base.join("bdl")).expect("temp layout");
    let bdl = Arc::new(BdlStore::open(base.join("bdl").join("bdl.db")).expect("BDL opens"));
    let item = bdl
        .create_warehouse_item("vector entry", "imported_material", "2026-09-07T00:00:00.000Z")
        .expect("seed entry");
    World {
        database_path: base.join("tasks.db"),
        warehouse_item_id: item.warehouse_item_id,
        bdl,
        base,
    }
}

/// Wraps a frozen command payload into a v0.1 request envelope and runs it
/// through the real frame loop with the warehouse wired.
fn run_frames(world: &World, correlation_id: &str, commands: &[Value]) -> Vec<Value> {
    let mut input = String::new();
    for command in commands {
        let frame = json!({
            "frameVersion": "0.1",
            "frameId": format!("frame-{}", commands.iter().position(|c| c == command).unwrap_or_default()),
            "kind": "request",
            "payload": {
                "contractVersion": "0.1",
                "requestId": "req-1",
                "correlationId": correlation_id,
                "kind": "command",
                "method": command["operation"],
                "params": command["params"],
            },
        });
        input.push_str(&frame.to_string());
        input.push('\n');
    }
    let warehouse = WarehouseConfig {
        bdl: world.bdl.clone(),
        warehouse_root: world.base.join("warehouse"),
        global_default: ArtifactMode::UseOriginalUnitypackage,
        executor: None,
    };
    let mut output = Vec::new();
    run_provider_host_with_services(
        Cursor::new(input),
        &mut output,
        &world.database_path,
        None,
        None,
        Some(warehouse),
    )
    .expect("the frame loop must stay alive for warehouse vectors");
    String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect()
}

/// Rewrites a request vector's params onto the seeded entry id.
fn reworded(request: &Value, warehouse_item_id: &str) -> Value {
    let mut command = request.clone();
    command["params"]["warehouseItemId"] = json!(warehouse_item_id);
    command
}

/// Rewrites a result vector's entry id (result vectors carry no params).
fn reworded_result(result: &Value, warehouse_item_id: &str) -> Value {
    let mut command = result.clone();
    command["warehouseItemId"] = json!(warehouse_item_id);
    command
}

#[test]
fn warehouse_commands_match_the_frozen_operation_vocabulary() {
    let schema = read_json("command.schema.json");
    let operations = schema["properties"]["operation"]["enum"].as_array().unwrap();
    // These are exactly the methods the host routes (warehouse_request).
    let routed = [
        json!("warehouse.setArtifactMode"),
        json!("warehouse.generateVpm"),
        json!("warehouse.deleteOriginals"),
        json!("warehouse.setGlobalDefaultMode"),
    ];
    assert_eq!(operations, &routed);
}

#[test]
fn set_artifact_mode_vectors_drive_the_host_and_read_back_the_effective_mode() {
    let world = make_world("mode");
    let validator = result_validator();

    // The positive vector (override -> generate_vpm) must round-trip and
    // match the frozen result shape.
    let request = reworded(&read_json("examples/warehouse-set-artifact-mode.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-mode-1", &[request]);
    assert_eq!(frames.len(), 1);
    assert_eq!(frames[0]["kind"], "response");
    let value = &frames[0]["payload"]["value"];
    assert!(
        validator.is_valid(value),
        "the host answer must match the frozen result schema: {value}"
    );
    let expected = reworded_result(&read_json("examples/warehouse-set-artifact-mode.result.json"), &world.warehouse_item_id);
    assert_eq!(value, &expected);

    // The clear vector drops the override: the effective mode falls back to
    // the shell default and is read back from the store, never echoed.
    let clear = reworded(&read_json("examples/warehouse-set-artifact-mode-clear.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-mode-2", &[clear]);
    let value = &frames[0]["payload"]["value"];
    assert!(validator.is_valid(value), "{value}");
    let expected = reworded_result(&read_json("examples/warehouse-set-artifact-mode-clear.result.json"), &world.warehouse_item_id);
    assert_eq!(value, &expected);
}

#[test]
fn set_artifact_mode_rejects_invalid_vocabulary_and_unknown_entries() {
    let world = make_world("mode-guards");
    let validator = result_validator();

    // A mode outside the frozen closed set is a params violation, never a
    // silent store write (invalid-mode vector, reworded entry id included).
    let invalid = reworded(&read_json("examples/invalid-mode.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-mode-invalid", &[invalid]);
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.invalid_params");

    // An unknown entry is the frozen validation code.
    let request = read_json("examples/warehouse-set-artifact-mode.request.json");
    let frames = run_frames(&world, "corr-mode-unknown", &[request]);
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.entry_not_found");

    // Every error path stays an application error: it never validates as a
    // frozen result.
    assert!(!validator.is_valid(&frames[0]["payload"]["error"]));
}

#[test]
fn tasked_commands_submit_audited_tasks_on_the_sqlite_authority() {
    let world = make_world("tasked");
    let validator = result_validator();

    // The tasked pair shares one handler and one persistence path; the
    // delete vector needs no Unity executor, so it pins the whole acceptance
    // flow end to end. Guards fire inside the task, never at admission.
    let request = reworded(&read_json("examples/warehouse-delete-originals.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-delete-vector", &[request]);
    assert_eq!(frames.len(), 1);
    let value = &frames[0]["payload"]["value"];
    assert!(
        validator.is_valid(value),
        "the acceptance must match the frozen result schema: {value}"
    );
    assert_eq!(value["operation"], "warehouse.deleteOriginals");
    assert_eq!(value["correlationId"], "corr-delete-vector");
    let task_id = value["taskId"].as_str().expect("taskId is a string").to_owned();
    assert!(!task_id.is_empty());

    // The acceptance is durable on the SQLite task authority (task.list can
    // see it), and the in-task guard drives the task to a truthful terminal
    // state — the seeded entry has no verified generated artifact.
    let deadline = Instant::now() + Duration::from_secs(30);
    let state = loop {
        let store = vua_orchestrator::SqliteTaskStore::open(&world.database_path).expect("store opens");
        let task = store.task(&task_id).expect("store readable").expect("accepted task is durable");
        if task.state.is_terminal() {
            break task.state;
        }
        assert!(Instant::now() < deadline, "the task did not finish");
        drop(store);
        std::thread::sleep(Duration::from_millis(20));
    };
    assert_eq!(serde_json::to_value(state).unwrap(), "failed");
}

#[test]
fn generate_without_a_unity_executor_is_honestly_unavailable() {
    let world = make_world("no-executor");
    let request = reworded(&read_json("examples/warehouse-generate-vpm.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-generate-unavailable", &[request]);
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.unavailable");
    // The rest of the trio keeps working without the executor.
    let mode = reworded(&read_json("examples/warehouse-set-artifact-mode-clear.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-mode-still-works", &[mode]);
    assert_eq!(frames[0]["payload"]["ok"], true);
}

#[test]
fn warehouse_commands_are_unavailable_without_wiring() {
    let world = make_world("unwired");
    let request = reworded(&read_json("examples/warehouse-set-artifact-mode.request.json"), &world.warehouse_item_id);
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-unwired",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-unwired",
            "correlationId": "corr-unwired",
            "kind": "command",
            "method": request["operation"],
            "params": request["params"],
        },
    });
    let mut output = Vec::new();
    run_provider_host_with_services(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        &world.database_path,
        None,
        None,
        None,
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.unavailable");
}

#[test]
fn set_global_default_mode_vector_drives_the_persisted_global_level() {
    let world = make_world("global-default");
    let validator = result_validator();

    // Before any write the global level is not persisted: the environment
    // initial default rules, and the clear vector's read-back reports it.
    let clear = reworded(&read_json("examples/warehouse-set-artifact-mode-clear.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-global-before", &[clear]);
    assert_eq!(frames[0]["payload"]["value"]["effectiveMode"], "use_original_unitypackage");
    assert_eq!(world.bdl.global_default_mode().unwrap(), None);

    // The frozen positive vector drives the wire write; the acceptance is
    // the frozen result document with the stored fact read back.
    let request = read_json("examples/warehouse-set-global-default.request.json");
    let frames = run_frames(&world, "corr-global-write", &[request]);
    assert_eq!(frames[0]["kind"], "response");
    let value = &frames[0]["payload"]["value"];
    assert!(
        validator.is_valid(value),
        "the acceptance must match the frozen result schema: {value}"
    );
    let expected = read_json("examples/warehouse-set-global-default.result.json");
    assert_eq!(value, &expected);
    // The persisted fact (not an echo path) now rules the global level.
    assert_eq!(world.bdl.global_default_mode().unwrap(), Some(ArtifactMode::GenerateVpm));

    // Two-level resolution follows the persisted global: the same clear
    // vector now reports generate_vpm for the override-less entry.
    let clear = reworded(&read_json("examples/warehouse-set-artifact-mode-clear.request.json"), &world.warehouse_item_id);
    let frames = run_frames(&world, "corr-global-after", &[clear]);
    assert_eq!(frames[0]["payload"]["value"]["effectiveMode"], "generate_vpm");

    // The entry level still wins over the persisted global default.
    let mut override_request = reworded(&read_json("examples/warehouse-set-artifact-mode.request.json"), &world.warehouse_item_id);
    override_request["params"]["mode"] = json!("use_original_unitypackage");
    let frames = run_frames(&world, "corr-global-entry-wins", &[override_request]);
    assert_eq!(frames[0]["payload"]["value"]["effectiveMode"], "use_original_unitypackage");
}

#[test]
fn set_global_default_mode_rejects_null_missing_and_unknown_modes() {
    let world = make_world("global-default-guards");
    let validator = result_validator();

    // The frozen negative vector: the global level has no null — the default
    // always has a value, so an explicit null is a params violation.
    let null_mode = read_json("examples/invalid-global-default-mode.json");
    let frames = run_frames(&world, "corr-global-null", &[null_mode]);
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.invalid_params");

    // A missing mode is likewise a params violation, not a no-op.
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-global-missing",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-global-missing",
            "correlationId": "corr-global-missing",
            "kind": "command",
            "method": "warehouse.setGlobalDefaultMode",
            "params": {},
        },
    });
    let mut output = Vec::new();
    run_provider_host_with_services(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        &world.database_path,
        None,
        None,
        Some(WarehouseConfig {
            bdl: world.bdl.clone(),
            warehouse_root: world.base.join("warehouse"),
            global_default: ArtifactMode::UseOriginalUnitypackage,
            executor: None,
        }),
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(frames[0]["payload"]["error"]["code"], "vua.warehouse.invalid_params");

    // Nothing was persisted along the failure paths.
    assert_eq!(world.bdl.global_default_mode().unwrap(), None);
    // Every error path stays an application error: it never validates as a
    // frozen result.
    assert!(!validator.is_valid(&frames[0]["payload"]["error"]));
}
