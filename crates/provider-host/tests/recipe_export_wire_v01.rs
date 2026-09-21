//! recipe-export v0.1 wire tests (proposal 029 B-face wiring loop 2,
//! 2026-09-22): the `recipe.exportProjectDraft` read route rides the real
//! frame loop over the frozen `schemas/recipe-export/v0.1/` word list —
//! one method, the closed single-key params set {projectPath} (any extra
//! key, a missing key, an empty value or a non-object params answers
//! `vua.recipe_export.invalid_params` at the route layer, BEFORE the gate),
//! the port wiring answers its OWN family honest-absence code
//! `vua.recipe_export.unavailable` (never the document-face
//! `vua.recipe.unavailable` — the router dispatches the export face before
//! the use-case fold), the registration calibration rides the SAME 013
//! inspection aggregate `project.inspectProject` uses (same fact, same
//! code: `vua.project.project_not_found` — the 024 packages-query reuse
//! ruling; an off-aggregate path never reaches the port), the NEW defaulted
//! port accessor `export_capabilities` (default declared-none) gates the
//! route BEFORE the port call (the F5 `template_capabilities` law;
//! ORC-DEV-004: no implementation, no reservation — the route answers the
//! face's honest-absence code, and the served row
//! `recipe.exportProjectDraft` stays honestly unavailable until the
//! export-executor implementation slice overrides the accessor), the port's
//! typed refusals travel VERBATIM (the read-face pass-through discipline),
//! and the projection is pinned by the frozen schemas (the contract-side
//! consumer loop lives in `crates/orchestrator/tests/recipe_export.rs`).
//! Everything runs against synthetic values — no machine-specific facts, no
//! network, no user VCC home, no Bridge. The REAL export executor is the
//! NEXT loop's implementation slice; this suite pins the route contract
//! against fakes only.

#![allow(clippy::result_large_err)]

use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde_json::{json, Value};
use vua_orchestrator::{
    DraftDependencyV01, DraftEnvironmentV01, DraftOriginV01, MissingDimensionV01,
    ProjectDraftDocumentV01, ProjectDraftExportCapabilities, ProjectDraftExportPort,
    UnityBridge, UnityCommand, UnityResult, VuaIdentityStatusV01,
};
use vua_project_manager::ManagerRoots;
use vua_provider_host::{
    provider_host::{RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01, RECIPE_EXPORT_SCHEMA_VERSION_V01},
    ProductionUseCaseConfig, ProjectOpsConfig, run_provider_host_full,
};

fn read_export_schema(name: &str) -> Value {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let path = Path::new(manifest_dir)
        .join("../..")
        .join("schemas/recipe-export/v0.1")
        .join(name);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn export_result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_export_schema("result.schema.json")).unwrap()
}

fn schema_violations(validator: &jsonschema::Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

fn unique_root(label: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "vua-recipe-export-wire-v01-{label}-{}-{nanos}",
        std::process::id()
    ));
    fs::create_dir_all(&dir).expect("root creates");
    dir
}

/// Seeds a minimal real Unity project plus the VCC settings.json that
/// registers it — the SAME 013 registration world `project.inspectProject`
/// reads, so the route calibration here is the same calibration verbatim.
/// Returns (project path, vcc settings path).
fn seed_registered_project(root: &Path) -> (PathBuf, PathBuf) {
    let project = root.join("export-source-project");
    fs::create_dir_all(project.join("Assets")).expect("Assets dir");
    fs::create_dir_all(project.join("ProjectSettings")).expect("ProjectSettings dir");
    fs::create_dir_all(project.join("Packages")).expect("Packages dir");
    fs::write(
        project.join("ProjectSettings").join("ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1",
    )
    .expect("project version");
    fs::write(
        project.join("Packages").join("vpm-manifest.json"),
        r#"{"dependencies": {}}"#,
    )
    .expect("vpm manifest");
    let vcc_settings = root.join("vcc-settings.json");
    fs::write(
        &vcc_settings,
        json!({"userProjects": [project.to_string_lossy()]}).to_string(),
    )
    .expect("vcc settings");
    (project, vcc_settings)
}

fn project_ops_config(vcc_settings: &Path) -> ProjectOpsConfig {
    ProjectOpsConfig {
        vcc_settings_candidates: vec![vcc_settings.to_path_buf()],
        manager_roots: ManagerRoots { alcom_settings_candidates: Vec::new() },
        editor_roots: Vec::new(),
    }
}

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

/// The nine CONSTANT missing dimensions of every v0.1 draft (the zero-bridge
/// ruling: the relation face is never scanned; the semantic four are never
/// asserted by an export).
const NINE_CONSTANT_MISSING: [MissingDimensionV01; 9] = [
    MissingDimensionV01::Assets,
    MissingDimensionV01::Instances,
    MissingDimensionV01::Relations,
    MissingDimensionV01::WardrobeGroups,
    MissingDimensionV01::TargetAvatar,
    MissingDimensionV01::AssetRoles,
    MissingDimensionV01::AssetLabels,
    MissingDimensionV01::SourceRefs,
    MissingDimensionV01::TitleSemantics,
];

/// A deterministic fake exporter implementing the frozen read face behind
/// the declared-none default. `export_cap: false` models the trait-default
/// declared-none port (the route must answer the gate BEFORE the port, so
/// the port body panics if it is ever reached with the bit false — and an
/// unregistered path must never reach the port either: the registration
/// calibration answers first). Per-case behavior injection pins the
/// verbatim pass-through and the honest empty/unreadable facts. The
/// synthetic draft mirrors the frozen positive example: three declared
/// dependencies (two locked pins, one unpinned), packageId ascending.
struct FakeExporter {
    export_cap: bool,
    draft: Option<ProjectDraftDocumentV01>,
    failure: Option<vua_orchestrator::AppErrorV1>,
}

impl FakeExporter {
    fn declaring() -> Self {
        Self {
            export_cap: true,
            draft: Some(ProjectDraftDocumentV01 {
                draft_id: "0197c0de-7a2b-7cd1-9f3a-4d8e21b90c99".into(),
                exported_at: "2026-09-22T01:52:00.123Z".into(),
                origin: DraftOriginV01 {
                    project_path: String::new(), // stamped per-call in the test
                    project_name: Some("Export Source Project".into()),
                    vua_identity_status: VuaIdentityStatusV01::Present,
                },
                environment: DraftEnvironmentV01 {
                    unity_version_constraint: Some("2022.3.22f1".into()),
                },
                dependencies: vec![
                    DraftDependencyV01 {
                        package_id: "com.vrchat.avatars".into(),
                        version_constraint: "3.7.x".into(),
                        locked_version: Some("3.7.12".into()),
                    },
                    DraftDependencyV01 {
                        package_id: "com.vrchat.base".into(),
                        version_constraint: "3.7.x".into(),
                        locked_version: None,
                    },
                    DraftDependencyV01 {
                        package_id: "dev.example.coolshader".into(),
                        version_constraint: "^1.2.0".into(),
                        locked_version: Some("1.2.7".into()),
                    },
                ],
                missing: NINE_CONSTANT_MISSING.to_vec(),
            }),
            failure: None,
        }
    }

    fn with_project_path(mut self, path: &str) -> Self {
        if let Some(draft) = self.draft.as_mut() {
            draft.origin.project_path = path.to_owned();
        }
        self
    }

    fn undeclaring() -> Self {
        let mut fake = Self::declaring();
        fake.export_cap = false;
        fake
    }

    fn honest_empty_and_unreadable(path: &str) -> Self {
        let mut fake = Self::declaring().with_project_path(path);
        let draft = fake.draft.as_mut().expect("draft present");
        draft.dependencies = vec![];
        draft.environment.unity_version_constraint = None;
        let mut missing = NINE_CONSTANT_MISSING.to_vec();
        missing.push(MissingDimensionV01::EnvironmentUnityVersion);
        draft.missing = missing;
        fake
    }

    fn failing_registered_drift(path: &str) -> Self {
        let mut fake = Self::declaring().with_project_path(path);
        fake.failure = Some(vua_orchestrator::AppErrorV1::new(
            "vua.project.project_not_found",
            vua_orchestrator::ErrorCategory::Validation,
            "errors.project.projectNotFound",
            "corr-fake-export",
        ));
        fake
    }
}

impl ProjectDraftExportPort for FakeExporter {
    fn export_capabilities(&self) -> ProjectDraftExportCapabilities {
        ProjectDraftExportCapabilities { export_project_draft: self.export_cap }
    }
    fn export_project_draft(
        &self,
        project_path: &str,
    ) -> Result<ProjectDraftDocumentV01, vua_orchestrator::AppErrorV1> {
        assert!(
            self.export_cap,
            "the route gate must answer the honest absence BEFORE the port"
        );
        if let Some(error) = &self.failure {
            return Err(error.clone());
        }
        let mut draft = self.draft.clone().expect("draft programmed");
        draft.origin.project_path = project_path.to_owned();
        Ok(draft)
    }
}

fn use_case_config(root: &Path, exporter: Option<Arc<dyn ProjectDraftExportPort>>) -> ProductionUseCaseConfig {
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
        editor_selection: vua_orchestrator::EditorSelection::Unavailable {
            reason: vua_orchestrator::EditorSelectionGap::NotDetected,
        },
        handoff: None,
        draft_exporter: exporter,
    }
}

/// Sends one query frame through the real host loop and returns the
/// response payload.
fn run_query_frame(
    database: &Path,
    use_cases: Option<ProductionUseCaseConfig>,
    project_ops: Option<ProjectOpsConfig>,
    method: &str,
    params: Value,
) -> Value {
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-recipe-export-v01",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-recipe-export-v01",
            "correlationId": "corr-recipe-export-v01",
            "kind": "query",
            "method": method,
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
        use_cases,
        project_ops,
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

/// Sends `application.getSnapshot` and extracts the
/// `recipe.exportProjectDraft` capability row.
fn export_capability_row(
    database: &Path,
    use_cases: Option<ProductionUseCaseConfig>,
) -> Value {
    let payload = run_query_frame(
        database,
        use_cases,
        None,
        "application.getSnapshot",
        json!({}),
    );
    payload["value"]["capabilities"]["operations"]
        .as_array()
        .expect("operations array")
        .iter()
        .find(|row| row["operationId"] == "recipe.exportProjectDraft")
        .cloned()
        .expect("the recipe.exportProjectDraft capability row exists")
}

#[test]
fn absent_export_wiring_answers_the_typed_honest_absence_and_unavailable_row() {
    let root = unique_root("absent");
    let database = root.join("tasks.sqlite");

    let payload = run_query_frame(
        &database,
        None,
        None,
        "recipe.exportProjectDraft",
        json!({"projectPath": "C:/some/project"}),
    );
    assert_eq!(payload["ok"], false, "absence is a typed failure");
    assert_eq!(payload["error"]["code"], "vua.recipe_export.unavailable");
    assert_eq!(payload["error"]["category"], "unavailable");
    assert!(
        payload.get("result").is_none(),
        "absence never carries a fabricated draft"
    );

    let row = export_capability_row(&database, None);
    assert_eq!(row["availability"], "unavailable");
    fs::remove_dir_all(&root).ok();
}

#[test]
fn wired_declared_port_projects_the_frozen_word_face_over_the_real_frame_loop() {
    let validator = export_result_validator();
    let root = unique_root("wired");
    let database = root.join("tasks.sqlite");
    let (project, vcc_settings) = seed_registered_project(&root);

    let payload = run_query_frame(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::declaring().with_project_path(
                project.to_string_lossy().as_ref(),
            ))),
        )),
        Some(project_ops_config(&vcc_settings)),
        "recipe.exportProjectDraft",
        json!({"projectPath": project.to_string_lossy()}),
    );
    assert_eq!(payload["ok"], true, "wired + declared must succeed: {payload}");
    let value = &payload["value"];
    assert_eq!(value["schemaVersion"], RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01);
    assert_eq!(value["operation"], "recipe.exportProjectDraft");
    assert!(
        validator.is_valid(value),
        "the frozen v0.1 result schema must admit the response: {:?} {value}",
        schema_violations(&validator, value)
    );
    let result = &value["result"];
    assert_eq!(result["schemaVersion"], RECIPE_EXPORT_SCHEMA_VERSION_V01);
    // The frozen seven-key draft closed set — nothing invented, nothing
    // dropped (the route stamps ONLY the family const; the six fact keys
    // are the port's verbatim facts). Key ORDER is not a fact: the set is.
    let keys: Vec<&str> = result.as_object().unwrap().keys().map(String::as_str).collect();
    let mut sorted_keys = keys.clone();
    sorted_keys.sort_unstable();
    assert_eq!(
        sorted_keys,
        ["dependencies", "draftId", "environment", "exportedAt", "missing", "origin", "schemaVersion"],
        "no invented fields at the v0.1 draft face"
    );
    assert_ne!(result["draftId"], "", "the draft instance identity is minted");
    assert!(
        !result.as_object().unwrap().contains_key("recipeId")
            && !result.as_object().unwrap().contains_key("title"),
        "a draft never carries the Recipe face"
    );
    // packageId ascending — the frozen deterministic presentation fact.
    let ids: Vec<&str> = result["dependencies"]
        .as_array()
        .expect("dependency rows")
        .iter()
        .map(|row| row["packageId"].as_str().unwrap())
        .collect();
    assert_eq!(ids, ["com.vrchat.avatars", "com.vrchat.base", "dev.example.coolshader"]);
    // The locked pin rides only where one exists — absence, not null.
    let rows = result["dependencies"].as_array().unwrap();
    assert_eq!(rows[0]["lockedVersion"], "3.7.12");
    assert!(
        rows[1].get("lockedVersion").is_none(),
        "an unpinned declaration carries NO lockedVersion key"
    );
    // The nine constant missing dimensions — the honesty core over the wire.
    let missing: Vec<&str> = result["missing"]
        .as_array()
        .expect("missing list")
        .iter()
        .map(|value| value.as_str().unwrap())
        .collect();
    assert_eq!(
        missing,
        ["assets", "instances", "relations", "wardrobeGroups", "targetAvatar", "assetRoles", "assetLabels", "sourceRefs", "titleSemantics"],
    );

    let row = export_capability_row(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::declaring())),
        )),
    );
    assert_eq!(row["availability"], "available");
    fs::remove_dir_all(&root).ok();
}

#[test]
fn trait_default_declared_none_port_answers_absence_before_the_port_and_row_stays_unavailable() {
    // The gate reads the NEW defaulted accessor BEFORE the port call —
    // default declared-none keeps the route on the honest-absence arm (the
    // face's OWN code, the F5 structural law: the port method HAS a default
    // body, so a declared-but-unimplemented port CAN exist at the type
    // level — the route gate simply answers first and the port is never
    // reached; the fake's port body panics if it ever is).
    let root = unique_root("undeclared");
    let database = root.join("tasks.sqlite");
    let (project, vcc_settings) = seed_registered_project(&root);
    let exporter = Arc::new(FakeExporter::undeclaring());

    let payload = run_query_frame(
        &database,
        Some(use_case_config(&root, Some(exporter.clone()))),
        Some(project_ops_config(&vcc_settings)),
        "recipe.exportProjectDraft",
        json!({"projectPath": project.to_string_lossy()}),
    );
    assert_eq!(payload["ok"], false);
    assert_eq!(payload["error"]["code"], "vua.recipe_export.unavailable");
    assert_eq!(payload["error"]["category"], "unavailable");
    assert!(
        payload.get("result").is_none(),
        "a gated face never carries a fabricated draft"
    );

    let row = export_capability_row(
        &database,
        Some(use_case_config(&root, Some(exporter))),
    );
    assert_eq!(row["availability"], "unavailable");
    fs::remove_dir_all(&root).ok();
}

#[test]
fn unregistered_path_answers_the_reused_not_found_before_the_port() {
    // The 024 packages-query reuse ruling over the wire: an off-aggregate
    // path answers `vua.project.project_not_found` — same fact, same code,
    // the `project.inspectProject` calibration — and NEVER reaches the
    // port (the fake's port body panics if it ever is reached with the
    // capability declared; here the declared exporter proves the guard
    // answers first, not the gate).
    let root = unique_root("unregistered");
    let database = root.join("tasks.sqlite");
    let (_project, vcc_settings) = seed_registered_project(&root);

    let payload = run_query_frame(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::declaring())),
        )),
        Some(project_ops_config(&vcc_settings)),
        "recipe.exportProjectDraft",
        json!({"projectPath": "C:/elsewhere/not-a-registered-project"}),
    );
    assert_eq!(payload["ok"], false, "the reuse ruling is a typed validation failure");
    assert_eq!(payload["error"]["code"], "vua.project.project_not_found");
    assert_eq!(payload["error"]["messageKey"], "errors.project.projectNotFound");
    assert_eq!(payload["error"]["category"], "validation");
    assert!(
        payload.get("result").is_none(),
        "a refusal never carries a fabricated draft"
    );
    fs::remove_dir_all(&root).ok();
}

#[test]
fn absent_registration_calibration_answers_the_honest_absence() {
    // Without the 013 aggregate the not-found calibration does not exist —
    // the whole face stays honestly absent (the packageCatalog same-face
    // discipline), even with the export port wired and declared.
    let root = unique_root("no-calibration");
    let database = root.join("tasks.sqlite");

    let payload = run_query_frame(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::declaring())),
        )),
        None,
        "recipe.exportProjectDraft",
        json!({"projectPath": "C:/some/project"}),
    );
    assert_eq!(payload["ok"], false);
    assert_eq!(payload["error"]["code"], "vua.recipe_export.unavailable");
    assert_eq!(payload["error"]["category"], "unavailable");
    fs::remove_dir_all(&root).ok();
}

#[test]
fn port_refusals_travel_verbatim() {
    // The read-face pass-through discipline: no read-face fold exists — a
    // typed port refusal (here: the registered-path drift fact, a project
    // that vanishes between the calibration scan and the port call) travels
    // verbatim as code + messageKey + category, never a fabricated draft.
    let root = unique_root("verbatim");
    let database = root.join("tasks.sqlite");
    let (project, vcc_settings) = seed_registered_project(&root);

    let payload = run_query_frame(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::failing_registered_drift(
                project.to_string_lossy().as_ref(),
            ))),
        )),
        Some(project_ops_config(&vcc_settings)),
        "recipe.exportProjectDraft",
        json!({"projectPath": project.to_string_lossy()}),
    );
    assert_eq!(payload["ok"], false, "the refusal travels as a typed failure");
    assert_eq!(payload["error"]["code"], "vua.project.project_not_found");
    assert_eq!(payload["error"]["messageKey"], "errors.project.projectNotFound");
    assert_eq!(payload["error"]["category"], "validation");
    assert!(
        payload.get("result").is_none(),
        "a refusal never carries a fabricated result"
    );
    fs::remove_dir_all(&root).ok();
}

#[test]
fn honest_empty_dependencies_and_unreadable_unity_ride_as_success_facts() {
    // Observation failure sets NO error code: an absent manifest is the
    // honest empty dependencies array and an unreadable editor version is
    // the null constraint plus its environmentUnityVersion marker — a
    // SUCCESS carrying the facts, never a failure masquerade, never padded
    // guesses (honesty rules 1/2). The frozen schema's iff implications
    // hold over the wire (the real validator enforces them).
    let validator = export_result_validator();
    let root = unique_root("honest-empty");
    let database = root.join("tasks.sqlite");
    let (project, vcc_settings) = seed_registered_project(&root);

    let payload = run_query_frame(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::honest_empty_and_unreadable(
                project.to_string_lossy().as_ref(),
            ))),
        )),
        Some(project_ops_config(&vcc_settings)),
        "recipe.exportProjectDraft",
        json!({"projectPath": project.to_string_lossy()}),
    );
    assert_eq!(payload["ok"], true, "an honest empty state is a real answer: {payload}");
    assert!(
        validator.is_valid(&payload["value"]),
        "{:?}",
        schema_violations(&validator, &payload["value"])
    );
    let result = &payload["value"]["result"];
    assert_eq!(result["dependencies"], json!([]));
    assert_eq!(result["environment"]["unityVersionConstraint"], Value::Null);
    let missing: Vec<&str> = result["missing"]
        .as_array()
        .expect("missing list")
        .iter()
        .map(|value| value.as_str().unwrap())
        .collect();
    assert_eq!(missing.len(), 10, "the conditional tenth marker joined");
    assert!(missing.contains(&"environmentUnityVersion"));
    fs::remove_dir_all(&root).ok();
}

#[test]
fn param_violations_answer_invalid_params_before_the_gate() {
    let root = unique_root("params");
    let database = root.join("tasks.sqlite");
    let (project, vcc_settings) = seed_registered_project(&root);
    // The shape check precedes the gate: even a declared-none port gets the
    // params verdict first (a pure shape verdict).
    let use_cases = Some(use_case_config(
        &root,
        Some(Arc::new(FakeExporter::undeclaring())),
    ));

    let violations: Vec<Value> = vec![
        // An extra key breaks the closed single-key set (never a default).
        json!({ "projectPath": project.to_string_lossy(), "extra": true }),
        json!({ "unexpected": true }),
        // A missing key, an empty path, a non-string path.
        json!({}),
        json!({ "projectPath": "" }),
        json!({ "projectPath": 17 }),
        // A non-object params is a violation.
        json!(null),
        json!(""),
        json!([1, 2]),
    ];
    for params in violations {
        let payload = run_query_frame(
            &database,
            use_cases.clone(),
            Some(project_ops_config(&vcc_settings)),
            "recipe.exportProjectDraft",
            params.clone(),
        );
        assert_eq!(payload["ok"], false, "violations are typed failures");
        assert_eq!(
            payload["error"]["code"], "vua.recipe_export.invalid_params",
            "{params}: {payload}"
        );
        assert_eq!(payload["error"]["category"], "validation");
    }
    fs::remove_dir_all(&root).ok();
}

#[test]
fn envelope_consts_are_detectable_and_match_the_frozen_schema_consts() {
    // The A3/A4/A5/F2/F3 precedent closed at the wiring batch: the envelope
    // const and the family const are named HERE and pinned against the
    // frozen schema consts — a consumer can detect the row version from the
    // wire alone (the route stamps both consts verbatim, never literals).
    let command = read_export_schema("command.schema.json");
    let result = read_export_schema("result.schema.json");
    assert_eq!(
        command["properties"]["schemaVersion"]["const"],
        json!(RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01),
        "the envelope const equals the frozen command schema's const"
    );
    assert_eq!(RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01, "0.1");
    assert_eq!(
        result["$defs"]["projectDraft"]["properties"]["schemaVersion"]["const"],
        json!(RECIPE_EXPORT_SCHEMA_VERSION_V01),
        "the family const equals the frozen result def's const"
    );
    assert_eq!(RECIPE_EXPORT_SCHEMA_VERSION_V01, "vua.recipe-export/v0.1");

    // The live stamp: the one response carries both consts (pinned against
    // the constants, not against string literals).
    let root = unique_root("envelope");
    let database = root.join("tasks.sqlite");
    let (project, vcc_settings) = seed_registered_project(&root);
    let payload = run_query_frame(
        &database,
        Some(use_case_config(
            &root,
            Some(Arc::new(FakeExporter::declaring().with_project_path(
                project.to_string_lossy().as_ref(),
            ))),
        )),
        Some(project_ops_config(&vcc_settings)),
        "recipe.exportProjectDraft",
        json!({"projectPath": project.to_string_lossy()}),
    );
    assert_eq!(payload["value"]["schemaVersion"], RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01);
    assert_eq!(
        payload["value"]["result"]["schemaVersion"],
        RECIPE_EXPORT_SCHEMA_VERSION_V01
    );
    fs::remove_dir_all(&root).ok();
}
