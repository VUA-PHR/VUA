//! M6 T-A/T-B tests: the read-only project-inspection aggregate. Everything
//! runs against synthetic directory trees, so no test depends on this
//! machine's real installs. The snapshot shape is pinned by
//! `schemas/project-inspection/v0.1/snapshot.schema.json` and validated
//! here; the wire vocabulary that will expose the aggregate is proposed in
//! `collab/proposals/013` and deliberately absent from this crate.

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use vua_orchestrator::{FixedClock, ManagerPresence};
use vua_project_manager::{
    collect_project_inspections, MutationStatus, ProjectAssociation, ProjectInspectionSnapshotV01,
    ManagerRoots, PROJECT_INSPECTION_SCHEMA_VERSION,
};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-project-inspection-{label}-{nanos}"))
}

fn cleanup(base: &Path) {
    if base.exists() {
        fs::remove_dir_all(base).unwrap();
    }
}

fn synthetic_managers(base: &Path) -> ManagerRoots {
    ManagerRoots {
        alcom_settings_candidates: vec![base.join("alcom/setting.json")],
    }
}

fn synthetic_vcc_candidates(base: &Path) -> Vec<PathBuf> {
    vec![base.join("vcc/settings.json")]
}

fn probe(base: &Path) -> ProjectInspectionSnapshotV01 {
    collect_project_inspections(
        &synthetic_vcc_candidates(base),
        &synthetic_managers(base),
        &FixedClock::new(&["2026-09-09T02:00:00.000Z"]),
    )
}

fn install_vpm_project(
    base: &Path,
    name: &str,
    editor_version: &str,
    manifest: Option<&str>,
) -> PathBuf {
    let project = base.join("projects").join(name);
    fs::create_dir_all(project.join("Packages")).unwrap();
    fs::create_dir_all(project.join("ProjectSettings")).unwrap();
    fs::write(
        project.join("ProjectSettings").join("ProjectVersion.txt"),
        format!("m_EditorVersion: {editor_version}\n"),
    )
    .unwrap();
    if let Some(manifest) = manifest {
        fs::write(project.join("Packages").join("vpm-manifest.json"), manifest).unwrap();
    }
    project
}

fn vcc_settings(base: &Path, projects: &[PathBuf]) {
    let settings = base.join("vcc/settings.json");
    fs::create_dir_all(settings.parent().unwrap()).unwrap();
    let listed: Vec<String> = projects
        .iter()
        .map(|path| path.to_string_lossy().into_owned())
        .collect();
    fs::write(
        &settings,
        serde_json::to_string(&json!({ "userProjects": listed })).unwrap(),
    )
    .unwrap();
}

fn alcom_settings(base: &Path, projects: &[PathBuf]) {
    let settings = base.join("alcom/setting.json");
    fs::create_dir_all(settings.parent().unwrap()).unwrap();
    let listed: Vec<String> = projects
        .iter()
        .map(|path| path.to_string_lossy().into_owned())
        .collect();
    fs::write(
        &settings,
        serde_json::to_string(&json!({ "userProjects": listed })).unwrap(),
    )
    .unwrap();
}

const HEALTHY_MANIFEST: &str = r#"{
  "dependencies": {
    "com.vrchat.avatars": "3.7.x",
    "com.vrchat.base": "3.7.x",
    "dev.onevr.vrmtoolkit": "3.x.x"
  },
  "locked": {
    "com.vrchat.avatars": "3.7.4",
    "com.vrchat.base": "3.7.4",
    "dev.onevr.vrmtoolkit": "3.4.2"
  }
}"#;

fn snapshot_validator() -> jsonschema::Validator {
    let schema = read_repo_json("schemas/project-inspection/v0.1/snapshot.schema.json");
    jsonschema::validator_for(&schema).unwrap()
}

fn read_repo_json(relative: &str) -> Value {
    // Tests run from the crate directory; the schemas live at the repo root.
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let path = Path::new(manifest_dir)
        .join("../..")
        .join(relative);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn violations(validator: &jsonschema::Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

#[test]
fn healthy_snapshot_passes_the_pinned_schema() {
    let base = unique_dir("schema");
    let project = install_vpm_project(&base, "World A", "2022.3.22f1", Some(HEALTHY_MANIFEST));
    vcc_settings(&base, std::slice::from_ref(&project));
    alcom_settings(&base, std::slice::from_ref(&project));

    let snapshot = probe(&base);
    let instance = serde_json::to_value(&snapshot).unwrap();
    assert_eq!(
        instance["schemaVersion"],
        json!(PROJECT_INSPECTION_SCHEMA_VERSION)
    );
    let problems = violations(&snapshot_validator(), &instance);
    assert!(problems.is_empty(), "schema violations: {problems:#?}");

    cleanup(&base);
}

#[test]
fn dual_registration_unions_associations_and_reads_the_manifest() {
    let base = unique_dir("dual");
    let project = install_vpm_project(&base, "World A", "2022.3.22f1", Some(HEALTHY_MANIFEST));
    vcc_settings(&base, std::slice::from_ref(&project));
    alcom_settings(&base, std::slice::from_ref(&project));

    let snapshot = probe(&base);
    assert_eq!(snapshot.projects.len(), 1, "one path, one finding");
    let finding = &snapshot.projects[0];
    assert_eq!(
        finding.associations,
        vec![
            ProjectAssociation::VccRegistered,
            ProjectAssociation::AlcomRegistered
        ]
    );
    assert!(finding.path_present);
    assert_eq!(
        finding.unity_version.as_deref(),
        Some("2022.3.22f1")
    );
    assert!(matches!(
        finding.unity_classification,
        Some(vua_orchestrator::EditorClass::ProductionTarget)
    ));
    assert!(finding.manifest_present && finding.manifest_schema_ok);

    // Sorted by package id, versions exactly as declared.
    let dependency_ids: Vec<&str> = finding
        .dependencies
        .iter()
        .map(|package| package.package_id.as_str())
        .collect();
    assert_eq!(
        dependency_ids,
        vec![
            "com.vrchat.avatars",
            "com.vrchat.base",
            "dev.onevr.vrmtoolkit"
        ]
    );
    let locked: Vec<(&str, &str)> = finding
        .locked
        .iter()
        .map(|package| (package.package_id.as_str(), package.version.as_str()))
        .collect();
    assert_eq!(
        locked,
        vec![
            ("com.vrchat.avatars", "3.7.4"),
            ("com.vrchat.base", "3.7.4"),
            ("dev.onevr.vrmtoolkit", "3.4.2")
        ]
    );

    // SDK detection: locked wins over dependencies; the non-VRChat package
    // is never reported as an SDK.
    let sdks: Vec<(&str, &str, &str)> = finding
        .vrchat_sdks
        .iter()
        .map(|finding| {
            (
                finding.package_id.as_str(),
                finding.source,
                finding.version.as_str(),
            )
        })
        .collect();
    assert_eq!(
        sdks,
        vec![
            ("com.vrchat.avatars", "locked", "3.7.4"),
            ("com.vrchat.base", "locked", "3.7.4"),
        ]
    );
    assert_eq!(finding.mutation_status, MutationStatus::None);
    assert!(finding.diagnostics.is_empty());
    assert!(snapshot.diagnostics.is_empty());

    cleanup(&base);
}

#[test]
fn dependency_only_sdk_falls_back_to_the_declared_version() {
    let base = unique_dir("dep-only");
    let manifest = r#"{ "dependencies": { "com.vrchat.base": "3.7.x" } }"#;
    let project = install_vpm_project(&base, "Solo", "2022.3.22f1", Some(manifest));
    vcc_settings(&base, &[project]);

    let snapshot = probe(&base);
    let finding = &snapshot.projects[0];
    assert_eq!(finding.locked.len(), 0);
    assert_eq!(finding.vrchat_sdks.len(), 1);
    assert_eq!(finding.vrchat_sdks[0].source, "dependencies");
    assert_eq!(finding.vrchat_sdks[0].version, "3.7.x");

    cleanup(&base);
}

#[test]
fn stale_registration_stays_visible_with_a_warning() {
    let base = unique_dir("stale");
    let gone = base.join("projects").join("Moved Away");
    vcc_settings(&base, &[gone]); // never created on disk

    let snapshot = probe(&base);
    assert_eq!(snapshot.projects.len(), 1, "stale entries stay visible");
    let finding = &snapshot.projects[0];
    assert!(!finding.path_present);
    assert_eq!(finding.associations, vec![ProjectAssociation::VccRegistered]);
    assert_eq!(finding.unity_version, None);
    assert!(!finding.manifest_present);
    assert_eq!(finding.mutation_status, MutationStatus::None);
    assert_eq!(finding.diagnostics.len(), 1);
    assert_eq!(
        finding.diagnostics[0].code,
        vua_orchestrator::env_managers_codes::PROJECT_PATH_MISSING
    );
    assert!(matches!(
        finding.diagnostics[0].severity,
        vua_orchestrator::FindingSeverity::Warning
    ));

    let problems = violations(&snapshot_validator(), &serde_json::to_value(&snapshot).unwrap());
    assert!(problems.is_empty(), "schema violations: {problems:#?}");

    cleanup(&base);
}

#[test]
fn broken_manifest_is_an_honest_warning_never_an_invented_list() {
    let base = unique_dir("broken");
    let project = install_vpm_project(&base, "Broken", "2019.4.31f1", Some("{ not json"));
    vcc_settings(&base, &[project]);

    let snapshot = probe(&base);
    let finding = &snapshot.projects[0];
    assert!(finding.manifest_present);
    assert!(!finding.manifest_schema_ok);
    assert!(finding.dependencies.is_empty());
    assert!(finding.locked.is_empty());
    assert!(finding.vrchat_sdks.is_empty());
    assert_eq!(finding.diagnostics.len(), 1);
    assert_eq!(
        finding.diagnostics[0].code,
        "vua.project_inspection.manifest_schema_unexpected"
    );
    // The Unity classification still works — the manifest failure does not
    // erase the other honest findings.
    assert!(matches!(
        finding.unity_classification,
        Some(vua_orchestrator::EditorClass::MigrationSource)
    ));

    cleanup(&base);
}

#[test]
fn mutation_marker_states_are_reported_read_only() {
    let base = unique_dir("mutation");

    // A parseable leftover marker.
    let leftover = install_vpm_project(&base, "Leftover", "2022.3.22f1", Some("{}"));
    let vua_dir = leftover.join(".vua");
    fs::create_dir_all(&vua_dir).unwrap();
    fs::write(
        vua_dir.join("pending-mutation.json"),
        r#"{ "markerVersion": 1, "mutationKind": "material_intake", "holder": { "channel": "desktop", "profile": "default", "pid": 1234, "instanceId": "i-1", "acquiredAt": "2026-09-09T00:00:00.000Z" } }"#,
    )
    .unwrap();

    // An unreadable (half-written) marker.
    let unreadable = install_vpm_project(&base, "Unreadable", "2022.3.22f1", Some("{}"));
    let vua_dir = unreadable.join(".vua");
    fs::create_dir_all(&vua_dir).unwrap();
    fs::write(vua_dir.join("pending-mutation.json"), "{ truncated").unwrap();

    // A clean project.
    let clean = install_vpm_project(&base, "Clean", "2022.3.22f1", Some("{}"));

    vcc_settings(&base, &[leftover, unreadable, clean]);

    let snapshot = probe(&base);
    assert_eq!(snapshot.projects.len(), 3);
    let status_of = |name: &str| {
        snapshot
            .projects
            .iter()
            .find(|finding| finding.name == name)
            .unwrap()
            .mutation_status
    };
    assert_eq!(status_of("Leftover"), MutationStatus::Leftover);
    assert_eq!(status_of("Unreadable"), MutationStatus::Unreadable);
    assert_eq!(status_of("Clean"), MutationStatus::None);

    cleanup(&base);
}

#[test]
fn snapshot_is_deterministic_for_a_given_tree() {
    let base = unique_dir("determinism");
    let first = install_vpm_project(&base, "World A", "2022.3.22f1", Some(HEALTHY_MANIFEST));
    let second = install_vpm_project(&base, "World B", "2019.4.31f1", Some("{}"));
    vcc_settings(&base, &[first, second.clone()]);
    alcom_settings(&base, &[second]);

    let one = probe(&base);
    let two = probe(&base);
    let mut left = serde_json::to_value(&one).unwrap();
    let mut right = serde_json::to_value(&two).unwrap();
    left["capturedAt"] = json!("");
    right["capturedAt"] = json!("");
    assert_eq!(left, right, "everything but capturedAt must be stable");

    cleanup(&base);
}

#[test]
fn settings_findings_are_shared_not_duplicated() {
    let base = unique_dir("presence");
    // No settings files at all: managers not found, zero projects, and the
    // snapshot stays schema-valid with the designed empty state.
    let snapshot = probe(&base);
    assert!(snapshot.projects.is_empty());
    // The managers' presence lives on the environment-managers snapshot;
    // this aggregate only reports projects, so an absent manager is simply
    // no projects and no diagnostics — never a fabricated entry.
    let instance = serde_json::to_value(&snapshot).unwrap();
    let problems = violations(&snapshot_validator(), &instance);
    assert!(problems.is_empty(), "schema violations: {problems:#?}");
    assert_eq!(instance["projects"], json!([]));

    // Silence a warning about the unused import path when the reader
    // presence enums are referenced through this test surface only.
    let _ = ManagerPresence::NotFound;

    cleanup(&base);
}
