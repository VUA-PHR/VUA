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
