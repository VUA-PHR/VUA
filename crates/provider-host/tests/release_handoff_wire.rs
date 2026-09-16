//! `release.openForHandoff` wire tests (proposal 023 freeze batch): the
//! official-SDK upload-handoff tasked command. The consumer consumes the
//! frozen method schema from `schemas/release-handoff/v0.1`; changing the
//! handoff face without this consumer fails here first. The vectors
//! (3 valid + 3 invalid) drive JSON-Schema validation directly, and the
//! frame loop pins the unwired-route honest absence: the production-domain
//! process/window port and the core use case land in a later slice, so the
//! route answers `vua.release_handoff.unavailable` and never fabricates an
//! acceptance receipt or a handoff fact.

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

use serde_json::{json, Value};
use jsonschema::Validator;
use vua_provider_host::run_provider_host_full;

fn schemas_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/release-handoff/v0.1")
}

fn read_json_at(dir: &Path, relative: &str) -> Value {
    let bytes = fs::read(dir.join(relative)).expect("schema file must exist");
    serde_json::from_slice(&bytes).expect("schema file must be valid JSON")
}

/// Compiles one $defs entry of the method schema with the full $defs
/// re-attached, so nested $ref targets resolve (the editor-verify wire-test
/// compilation shape).
fn def_validator(def_name: &str) -> Validator {
    let schema = read_json_at(
        &schemas_dir().join("methods"),
        "release-open-for-handoff.schema.json",
    );
    let defs = schema.get("$defs").expect("method schema has $defs").clone();
    let sub = defs
        .get(def_name)
        .expect("sub schema exists")
        .clone();
    let combined = json!({ "allOf": [sub], "$defs": defs });
    jsonschema::validator_for(&combined).expect("sub schema compiles")
}

fn unique_root(label: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "vua-release-handoff-wire-{label}-{}-{nanos}",
        std::process::id()
    ));
    fs::create_dir_all(&dir).expect("root creates");
    dir
}

/// Sends one `release.openForHandoff` command frame through the real host
/// loop and returns the response payload.
fn run_handoff_frame(database: &Path, params: Value) -> Value {
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-release-handoff",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-release-handoff",
            "correlationId": "corr-release-handoff",
            "kind": "command",
            "commandId": "command-release-handoff",
            "method": "release.openForHandoff",
            "params": params,
        },
    });
    let mut output = Vec::new();
    run_provider_host_full(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        database,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect();
    frames[0]["payload"].clone()
}

#[test]
fn frozen_method_schema_compiles() {
    let schema = read_json_at(
        &schemas_dir().join("methods"),
        "release-open-for-handoff.schema.json",
    );
    jsonschema::validator_for(&schema).expect("frozen method schema must compile");
}

#[test]
fn valid_vectors_pass_their_frozen_defs() {
    // 正例 1:params 闭集 {buildId}
    let params = read_json_at(
        &schemas_dir().join("examples"),
        "release-open-for-handoff.request.json",
    );
    let params_validator = def_validator("release-openForHandoffParams");
    assert!(params_validator.is_valid(&params), "params vector must validate");

    // 正例 2:tasked 受理回执(inspection.requestRun 形状先例)
    let accepted = read_json_at(
        &schemas_dir().join("examples"),
        "release-open-for-handoff.accepted.json",
    );
    let accepted_validator = def_validator("release-openForHandoffAccepted");
    assert!(accepted_validator.is_valid(&accepted), "accepted vector must validate");

    // 正例 3:交接事实文档(无上传状态字段——形状即诚实纪律)
    let fact = read_json_at(
        &schemas_dir().join("examples"),
        "release-open-for-handoff.fact.json",
    );
    let fact_validator = def_validator("release-openForHandoffFact");
    assert!(fact_validator.is_valid(&fact), "fact vector must validate");
}

#[test]
fn invalid_vectors_are_refused_by_their_frozen_defs() {
    // 负例 1:params 闭集外键(工程身份字段不进 params——单一事实源)
    let extra_param = read_json_at(
        &schemas_dir().join("examples"),
        "invalid-release-open-for-handoff-unknown-param.request.json",
    );
    let params_validator = def_validator("release-openForHandoffParams");
    assert!(
        !params_validator.is_valid(&extra_param),
        "closed-set violation must be refused"
    );

    // 负例 2:交接事实携带上传状态字段——诚实纪律 1/2 由形状钉死
    // (上传在官方 SDK 中完成,绝非 VUA 可猜事实)
    let upload_state = read_json_at(
        &schemas_dir().join("examples"),
        "invalid-release-open-for-handoff-upload-state.fact.json",
    );
    let fact_validator = def_validator("release-openForHandoffFact");
    assert!(
        !fact_validator.is_valid(&upload_state),
        "an upload-status field must never enter the handoff fact"
    );

    // 负例 3:错误码闭集外(上传类错误码永不进入本词表——任务运行期失败
    // 走任务面九态)
    let unknown_code = read_json_at(
        &schemas_dir().join("examples"),
        "invalid-release-open-for-handoff-unknown-error-code.json",
    );
    let code_validator = def_validator("errorCode");
    assert!(
        !code_validator.is_valid(&unknown_code),
        "out-of-set error codes must be refused"
    );
}

#[test]
fn unwired_route_answers_the_honest_absence_never_a_fabricated_acceptance() {
    // 实现域(产线进程/窗口 port＋核心 use case)未接线:诚实缺席——
    // 绝不伪造受理回执/任务快照/交接事实
    let root = unique_root("absence");
    let payload = run_handoff_frame(&root.join("host.sqlite"), json!({ "buildId": "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99" }));
    fs::remove_dir_all(&root).ok();

    assert_eq!(payload["ok"], json!(false));
    let error = &payload["error"];
    assert_eq!(error["code"], json!("vua.release_handoff.unavailable"));
    assert_eq!(error["category"], json!("unavailable"));
    assert_eq!(error["messageKey"], json!("errors.releaseHandoff.unavailable"));
    // 缺席响应绝不携带任务面事实(taskId/task 字段缺位——伪造受理即撒谎)
    assert!(payload.get("task").is_none(), "absence must not fabricate a task snapshot");
    assert!(payload.get("schemaVersion").is_none(), "absence must not fabricate an acceptance");
}

#[test]
fn params_closed_set_violations_answer_validation_not_absence() {
    let root = unique_root("params");
    let database = root.join("host.sqlite");

    // 词表外键(projectPath):validation,不冒充缺席
    let payload = run_handoff_frame(
        &database,
        json!({ "buildId": "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99", "projectPath": "C:/Projects/X" }),
    );
    assert_eq!(payload["error"]["code"], json!("vua.release_handoff.invalid_params"));
    assert_eq!(payload["error"]["category"], json!("validation"));

    // 缺 buildId
    let payload = run_handoff_frame(&database, json!({}));
    assert_eq!(payload["error"]["code"], json!("vua.release_handoff.invalid_params"));

    // 空 buildId(minLength 1)
    let payload = run_handoff_frame(&database, json!({ "buildId": "" }));
    assert_eq!(payload["error"]["code"], json!("vua.release_handoff.invalid_params"));

    // buildId 非字符串
    let payload = run_handoff_frame(&database, json!({ "buildId": 17 }));
    assert_eq!(payload["error"]["code"], json!("vua.release_handoff.invalid_params"));

    fs::remove_dir_all(&root).ok();
}

// ---- Implementation-domain wiring (023 follow-up slice 2: the core use
// case + the frozen `ReleaseHandoffPort` trait, driven here through a fake
// port — ruling-15 local-first; the real process/window adapter belongs to
// the production-domain slice and real-machine evidence belongs to W25) ----

use std::sync::Arc;
use std::time::{Duration, Instant};

use vua_bdl_store::{ArtifactMode, BdlStore};
use vua_orchestrator::{
    EditorSelection, HandoffLaunch, HandoffOutcome, HandoffPortError, ReleaseHandoffPort,
    UnityBridge, UnityCommand, UnityResult,
};
use vua_provider_host::{ProductionUseCaseConfig, WarehouseConfig};
use vua_project_manager::{EditorPathIdentity, EditorPathVerdict};

struct NoBridge;

impl UnityBridge for NoBridge {
    fn execute(
        &self,
        _project: &vua_orchestrator::ProjectRef,
        command: &UnityCommand,
    ) -> Result<UnityResult, vua_orchestrator::BridgeError> {
        Err(vua_orchestrator::BridgeError::Io(std::io::Error::new(
            std::io::ErrorKind::Unsupported,
            format!("this fixture bridge must not run ({})", command.command_id),
        )))
    }
}

/// The fake production-domain port: it returns the preprogrammed outcome
/// and records the launch it received, so the tests can pin that the route
/// hands the RESOLVED identity (ruling 5) to the port and that the port
/// outcome alone decides the task's terminal state (ruling 3).
struct FakePort {
    outcome: Result<HandoffOutcome, HandoffPortError>,
    seen: std::sync::Mutex<Option<HandoffLaunch>>,
}

impl FakePort {
    fn arriving() -> Self {
        Self {
            outcome: Ok(HandoffOutcome::HandshakeArrived),
            seen: std::sync::Mutex::new(None),
        }
    }
    fn timing_out() -> Self {
        Self {
            outcome: Ok(HandoffOutcome::HandshakeTimeout),
            seen: std::sync::Mutex::new(None),
        }
    }
    fn launch_failed() -> Self {
        Self {
            outcome: Err(HandoffPortError {
                detail: "editor executable vanished".to_owned(),
            }),
            seen: std::sync::Mutex::new(None),
        }
    }
    fn observed_launch(&self) -> HandoffLaunch {
        self.seen
            .lock()
            .expect("lock")
            .clone()
            .expect("the port must have been called")
    }
}

impl ReleaseHandoffPort for FakePort {
    fn open_for_handoff(
        &self,
        launch: &HandoffLaunch,
    ) -> Result<HandoffOutcome, HandoffPortError> {
        *self.seen.lock().expect("lock") = Some(launch.clone());
        self.outcome.clone()
    }
}

const BUILD_ID: &str = "019513e7-7a2b-7cd1-9f3a-4d8e21b90c99";
const PROJECT_ID: &str = "proj-synthetic-avatar-a";

fn seed_build_record(config: &ProductionUseCaseConfig, editor_version: &str) {
    config
        .records
        .publish(
            BUILD_ID,
            &json!({
                "schemaVersion": "0.3",
                "buildId": BUILD_ID,
                "projectId": PROJECT_ID,
                "unityEditorVersion": editor_version,
                "status": "succeeded",
            }),
        )
        .expect("record seeds");
}

fn handoff_config(
    root: &std::path::Path,
    port: Option<Arc<dyn ReleaseHandoffPort>>,
    selection: EditorSelection,
) -> ProductionUseCaseConfig {
    let production_root = root.join("production");
    ProductionUseCaseConfig {
        recipes: Arc::new(vua_orchestrator::RecipeDocumentStore::new_with_system_clock(
            production_root.join("recipes"),
        )),
        plans: Arc::new(vua_orchestrator::PlanDocumentStore::new(
            production_root.join("plans"),
        )),
        evidence: Arc::new(vua_orchestrator::EvidenceStore::new(
            production_root.join("evidence"),
        )),
        records: Arc::new(vua_orchestrator::RecipeRecordStore::new(
            production_root.join("records"),
        )),
        inspections: Arc::new(vua_orchestrator::InspectionEvidenceStore::new(
            production_root.join("inspections"),
        )),
        editor_version: "2022.3.22f1".to_owned(),
        bridge: Arc::new(NoBridge),
        project_root: root.join("project"),
        editor_selection: selection,
        handoff: port,
    }
}

fn auto_selected(version: &str) -> EditorSelection {
    EditorSelection::AutoSelected {
        editor: vua_orchestrator::InstalledUnityEditor {
            parsed: vua_orchestrator::parse_editor_version(version)
                .expect("fixture version parses"),
            path: std::path::PathBuf::from(format!("C:/Unity/{version}/Editor/Unity.exe")),
        },
    }
}

/// Runs one handoff command frame through the real host loop with the
/// use-case face wired (the given config), returning the response payload.
fn run_handoff_frame_wired(
    database: &std::path::Path,
    config: &ProductionUseCaseConfig,
    params: Value,
) -> Value {
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-release-handoff-wired",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-release-handoff-wired",
            "correlationId": "corr-release-handoff-wired",
            "kind": "command",
            "commandId": "command-release-handoff-wired",
            "method": "release.openForHandoff",
            "params": params,
        },
    });
    // The task authority rides the warehouse wiring (the same shared
    // SQLite runtime the inspection tasked face consumes).
    let bdl_root = database.parent().unwrap_or(database).join("bdl");
    let warehouse = WarehouseConfig {
        bdl: Arc::new(BdlStore::open(bdl_root.join("bdl.db")).expect("BDL opens")),
        warehouse_root: database.parent().unwrap_or(database).join("warehouse"),
        global_default: ArtifactMode::UseOriginalUnitypackage,
        executor: None,
    };
    let mut output = Vec::new();
    run_provider_host_full(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        database,
        None,
        None,
        Some(warehouse),
        Some(config.clone()),
        None,
        None,
        None,
        None,
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect();
    frames[0]["payload"].clone()
}

/// Polls the store until the task reaches a terminal state (the task
/// snapshot wire face projects this single stored authority).
fn wait_terminal(database: &std::path::Path, task_id: &str) -> vua_orchestrator::StoredTask {
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        let store = vua_orchestrator::SqliteTaskStore::open(database).expect("store opens");
        let task = store
            .task(task_id)
            .expect("store readable")
            .expect("task exists");
        if task.state.is_terminal() {
            return task;
        }
        assert!(Instant::now() < deadline, "the task did not finish");
        drop(store);
        std::thread::sleep(Duration::from_millis(20));
    }
}

#[test]
fn wired_route_accepts_the_task_and_the_succeeded_snapshot_carries_the_fact() {
    let root = unique_root("wired");
    let database = root.join("host.sqlite");
    let port = Arc::new(FakePort::arriving());
    let selection = auto_selected("2022.3.22f1");
    let config = handoff_config(&root, Some(port.clone()), selection);
    seed_build_record(&config, "2022.3.22f1");

    let payload = run_handoff_frame_wired(&database, &config, json!({ "buildId": BUILD_ID }));
    // 受理回执照 inspection.requestRun 形状（冻结批文本）
    assert_eq!(payload["ok"], json!(true));
    let value = &payload["value"];
    assert_eq!(value["schemaVersion"], json!("0.1"));
    assert_eq!(value["operation"], json!("release.openForHandoff"));
    let task_id = value["taskId"]
        .as_str()
        .expect("acceptance carries a taskId")
        .to_owned();
    assert_eq!(value["correlationId"], json!("corr-release-handoff-wired"));

    // The task reaches Succeeded ONLY via the handshake (ruling 3); the
    // succeeded snapshot's result is the frozen five-key fact.
    let task = wait_terminal(&database, &task_id);
    assert!(matches!(task.state, vua_orchestrator::TaskState::Succeeded));
    let result = task.result.expect("a succeeded handoff refluxes its fact");
    let fact_validator = def_validator("release-openForHandoffFact");
    assert!(
        fact_validator.is_valid(&result),
        "the refluxed fact must satisfy the frozen fact def: {result}"
    );
    assert_eq!(result["schemaVersion"], json!("0.1"));
    assert_eq!(result["buildId"], json!(BUILD_ID));
    assert_eq!(result["projectId"], json!(PROJECT_ID));
    assert_eq!(
        result["editor"]["exePath"],
        json!("C:/Unity/2022.3.22f1/Editor/Unity.exe")
    );
    assert_eq!(result["editor"]["version"], json!("2022.3.22f1"));
    assert!(
        result["occurredAt"].as_str().is_some(),
        "occurredAt is a fact key"
    );
    let fact_object = result.as_object().expect("fact is an object");
    assert_eq!(fact_object.len(), 5, "five-key closed set");
    assert!(fact_object.get("uploadStatus").is_none());

    // The port received the RESOLVED identity and the trusted-side project
    // root (never a wire fact) — ruling 5 tier 2 + boundary 6.
    let launch = port.observed_launch();
    assert_eq!(launch.build_id, BUILD_ID);
    assert_eq!(launch.project_id, PROJECT_ID);
    assert_eq!(launch.editor_version, "2022.3.22f1");
    assert_eq!(
        launch.editor_exe,
        std::path::PathBuf::from("C:/Unity/2022.3.22f1/Editor/Unity.exe")
    );

    fs::remove_dir_all(&root).ok();
}

#[test]
fn handshake_timeout_fails_the_task_honestly_with_no_result() {
    let root = unique_root("timeout");
    let database = root.join("host.sqlite");
    let port = Arc::new(FakePort::timing_out());
    let config = handoff_config(&root, Some(port.clone()), auto_selected("2022.3.22f1"));
    seed_build_record(&config, "2022.3.22f1");

    let payload = run_handoff_frame_wired(&database, &config, json!({ "buildId": BUILD_ID }));
    let task_id = payload["value"]["taskId"]
        .as_str()
        .expect("accepted")
        .to_owned();
    let task = wait_terminal(&database, &task_id);
    // 裁决③:超时如实失败,绝不伪装成功;快照绝不携带交接事实
    assert!(matches!(task.state, vua_orchestrator::TaskState::Failed));
    let error = task.error.expect("honest failure carries its error");
    assert_eq!(error.code, "vua.task.timeout");
    assert!(task.result.is_none(), "a failed task never refluxes a fact");

    fs::remove_dir_all(&root).ok();
}

#[test]
fn port_launch_failure_fails_the_task_as_an_external_failure() {
    let root = unique_root("launchfailed");
    let database = root.join("host.sqlite");
    let port = Arc::new(FakePort::launch_failed());
    let config = handoff_config(&root, Some(port.clone()), auto_selected("2022.3.22f1"));
    seed_build_record(&config, "2022.3.22f1");

    let payload = run_handoff_frame_wired(&database, &config, json!({ "buildId": BUILD_ID }));
    let task_id = payload["value"]["taskId"]
        .as_str()
        .expect("accepted")
        .to_owned();
    let task = wait_terminal(&database, &task_id);
    assert!(matches!(task.state, vua_orchestrator::TaskState::Failed));
    let error = task.error.expect("honest failure carries its error");
    // 任务运行期失败走任务面/执行族码,不进 vua.release_handoff.* 闭集
    assert_eq!(error.code, "vua.job.handoff_launch_failed");
    assert!(task.result.is_none());

    fs::remove_dir_all(&root).ok();
}

#[test]
fn unknown_build_id_answers_build_unknown_without_accepting_a_task() {
    let root = unique_root("buildunknown");
    let database = root.join("host.sqlite");
    let port = Arc::new(FakePort::arriving());
    let config = handoff_config(&root, Some(port.clone()), auto_selected("2022.3.22f1"));

    let payload = run_handoff_frame_wired(&database, &config, json!({ "buildId": BUILD_ID }));
    assert_eq!(payload["ok"], json!(false));
    assert_eq!(payload["error"]["code"], json!("vua.release_handoff.build_unknown"));
    assert_eq!(payload["error"]["category"], json!("validation"));
    // 受理期校验失败不受理任务——库里零任务
    let store = vua_orchestrator::SqliteTaskStore::open(&database).expect("store opens");
    assert!(store.tasks().expect("tasks readable").is_empty());
    assert!(
        port.seen.lock().expect("lock").is_none(),
        "the port is never reached"
    );

    fs::remove_dir_all(&root).ok();
}

#[test]
fn record_version_mismatch_answers_editor_unresolved() {
    let root = unique_root("unresolved");
    let database = root.join("host.sqlite");
    let port = Arc::new(FakePort::arriving());
    let config = handoff_config(&root, Some(port.clone()), auto_selected("2021.3.5f1"));
    seed_build_record(&config, "2022.3.22f1");

    let payload = run_handoff_frame_wired(&database, &config, json!({ "buildId": BUILD_ID }));
    assert_eq!(payload["ok"], json!(false));
    assert_eq!(
        payload["error"]["code"],
        json!("vua.release_handoff.editor_unresolved")
    );
    // 依赖类:身份解析依赖环境事实(协议本冻结错误码表 category=dependency)
    assert_eq!(payload["error"]["category"], json!("dependency"));
    let store = vua_orchestrator::SqliteTaskStore::open(&database).expect("store opens");
    assert!(store.tasks().expect("tasks readable").is_empty());
    assert!(port.seen.lock().expect("lock").is_none());

    fs::remove_dir_all(&root).ok();
}

#[test]
fn wired_store_without_a_port_keeps_the_honest_absence() {
    // use-case 面已装配但产线 port 缺省(生产装配现状):诚实缺席语义
    // 维持——模拟 Provider 缺席三元与真实缺省装配同形(023 冻结批声明)
    let root = unique_root("noport");
    let database = root.join("host.sqlite");
    let config = handoff_config(&root, None, auto_selected("2022.3.22f1"));
    seed_build_record(&config, "2022.3.22f1");

    let payload = run_handoff_frame_wired(&database, &config, json!({ "buildId": BUILD_ID }));
    assert_eq!(payload["ok"], json!(false));
    let error = &payload["error"];
    assert_eq!(error["code"], json!("vua.release_handoff.unavailable"));
    assert_eq!(error["category"], json!("unavailable"));
    assert_eq!(error["messageKey"], json!("errors.releaseHandoff.unavailable"));

    fs::remove_dir_all(&root).ok();
}

#[test]
fn explicit_injection_short_circuits_and_reaches_the_port() {
    // 裁决⑤第一级:显式注入(021 权威)优先于构建记录身份——版本与记录
    // 不同仍按显式注入执行(021 手选权威,不再对账)
    let root = unique_root("explicit");
    let database = root.join("host.sqlite");
    let port = Arc::new(FakePort::arriving());
    let selection = EditorSelection::Explicit {
        path: std::path::PathBuf::from("C:/Unity/2019.4.31f1/Editor/Unity.exe"),
    };
    let config = handoff_config(&root, Some(port.clone()), selection);
    seed_build_record(&config, "2022.3.22f1");

    // The route resolves the explicit injection through the editor-verify
    // face; this fixture injects the verifier so identity comes from the
    // "executable" without a real PE version resource.
    let verifier: vua_provider_host::EditorPathVerifier =
        Arc::new(|path: &std::path::Path| {
            EditorPathVerdict::Verified(EditorPathIdentity {
                editor_root: "C:/Unity/2019.4.31f1".to_owned(),
                exe_path: path.to_string_lossy().to_string(),
                version: "2019.4.31f1".to_owned(),
                classification: vua_orchestrator::EditorClass::MigrationSource,
                guidance_code: "vua.env_managers.editor_migration_source",
                china_distribution: false,
            })
        });

    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-release-handoff-explicit",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-release-handoff-explicit",
            "correlationId": "corr-release-handoff-explicit",
            "kind": "command",
            "commandId": "command-release-handoff-explicit",
            "method": "release.openForHandoff",
            "params": { "buildId": BUILD_ID },
        },
    });
    let bdl_root = database.parent().unwrap_or(&database).join("bdl");
    let warehouse = WarehouseConfig {
        bdl: Arc::new(BdlStore::open(bdl_root.join("bdl.db")).expect("BDL opens")),
        warehouse_root: database.parent().unwrap_or(&database).join("warehouse"),
        global_default: ArtifactMode::UseOriginalUnitypackage,
        executor: None,
    };
    let mut output = Vec::new();
    run_provider_host_full(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        &database,
        None,
        None,
        Some(warehouse),
        Some(config.clone()),
        None,
        None,
        Some(verifier),
        None,
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect();
    let payload = frames[0]["payload"].clone();
    assert_eq!(payload["ok"], json!(true), "explicit injection accepts: {payload}");
    let task_id = payload["value"]["taskId"]
        .as_str()
        .expect("accepted")
        .to_owned();
    let task = wait_terminal(&database, &task_id);
    assert!(matches!(task.state, vua_orchestrator::TaskState::Succeeded));

    // The port got the EXPLICIT identity (tier 1 wins over the record's
    // 2022.3.22f1), and the fact carries it verbatim.
    let launch = port.observed_launch();
    assert_eq!(launch.editor_version, "2019.4.31f1");
    let result = task.result.expect("succeeded handoff refluxes its fact");
    assert_eq!(result["editor"]["version"], json!("2019.4.31f1"));
    assert_eq!(result["projectId"], json!(PROJECT_ID));

    fs::remove_dir_all(&root).ok();
}
