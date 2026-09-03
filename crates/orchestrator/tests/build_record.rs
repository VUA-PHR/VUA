use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use vua_orchestrator::{
    BuildRecordStatus, BuildRecordStore, BuildRecordV01, BuildValidationEvidenceV01,
    MaterialEntryMode, RiskDecisionChoice, SourceFolderInspectionV01, SourcePackageEvidenceV01,
};

static NEXT: AtomicU64 = AtomicU64::new(1);

fn fixture() -> BuildRecordV01 {
    BuildRecordV01 {
        schema_version: "0.1".into(),
        record_id: "build-fixture-1".into(),
        task_id: "task-1".into(),
        correlation_id: "corr-1".into(),
        plan_id: "plan-1".into(),
        plan_hash: format!("sha256:{}", "1".repeat(64)),
        mode: MaterialEntryMode::DirectUnityPackage,
        status: BuildRecordStatus::Succeeded,
        started_at: "2026-09-03T00:00:00Z".into(),
        completed_at: "2026-09-03T00:01:00Z".into(),
        source: SourceFolderInspectionV01 {
            schema_version: "0.1".into(),
            display_name: "Synthetic".into(),
            source_fingerprint: format!("sha256:{}", "2".repeat(64)),
            risk_fingerprint: format!("sha256:{}", "3".repeat(64)),
            packages: vec![SourcePackageEvidenceV01 {
                relative_path: "synthetic.unitypackage".into(),
                size_bytes: 42,
                sha256: format!("sha256:{}", "6".repeat(64)),
                asset_paths: vec!["Assets/Synthetic.prefab".into()],
            }],
            executable_risks: Vec::new(),
        },
        risk_choice: RiskDecisionChoice::NotRequired,
        project_id: "project-1".into(),
        initial_project_fingerprint: format!("sha256:{}", "4".repeat(64)),
        final_project_fingerprint: Some(format!("sha256:{}", "5".repeat(64))),
        unity_editor_version: "2022.3.22f1".into(),
        snapshot: None,
        bridge_jobs: Vec::new(),
        local_vpm: None,
        validation: Some(BuildValidationEvidenceV01 {
            level: "minimum_structure".into(),
            unity_validated: true,
            expected_assets_loaded: vec!["synthetic-guid".into()],
            diagnostic_codes: Vec::new(),
        }),
        result_code: "vua.production.succeeded".into(),
    }
}

#[test]
fn b3_build_record_is_immutable_and_roundtrips() {
    let root = std::env::temp_dir().join(format!(
        "vua-build-record-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    let store = BuildRecordStore::new(&root);
    let record = fixture();
    store.publish(&record).unwrap();
    assert_eq!(store.read(&record.record_id).unwrap(), record);
    let error = store.publish(&record).unwrap_err();
    assert_eq!(error.kind(), std::io::ErrorKind::AlreadyExists);
    fs::remove_dir_all(root).ok();
}

#[test]
fn b3_build_record_fixture_conforms_to_versioned_schema() {
    let schema_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../schemas/amf-production/v0.1/build-record.schema.json");
    let schema: serde_json::Value =
        serde_json::from_slice(&fs::read(schema_path).unwrap()).unwrap();
    let value = serde_json::to_value(fixture()).unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    let errors = validator
        .iter_errors(&value)
        .map(|error| error.to_string())
        .collect::<Vec<_>>();
    assert!(errors.is_empty(), "{errors:?}");
}

#[test]
fn b3_build_record_id_cannot_escape_store() {
    let store = BuildRecordStore::new(std::env::temp_dir());
    assert!(store.path_for("../escape").is_err());
}
