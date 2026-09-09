//! M6 T-A (proposal 014) tests: the import-as-VUA-copy write path. The
//! five guards, the double-summary discipline, the exclusion list, the
//! source link, and the re-inspection all run against synthetic trees; the
//! wire shapes are the frozen `schemas/project-ops/v0.1/` schemas, which
//! the positive/negative example vectors are validated against here.

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{json, Value};
use vua_orchestrator::FixedClock;
use vua_project_manager::{
    apply_import_copy, plan_import_copy, ImportCopyRequest, ImportRejected, ManagerRoots,
    RejectionGuard,
};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-import-copy-{label}-{nanos}"))
}

fn cleanup(base: &Path) {
    if base.exists() {
        fs::remove_dir_all(base).unwrap();
    }
}

fn roots(base: &Path) -> ManagerRoots {
    ManagerRoots {
        alcom_settings_candidates: vec![base.join("alcom/setting.json")],
    }
}

fn vcc_candidates(base: &Path) -> Vec<PathBuf> {
    vec![base.join("vcc/settings.json")]
}

fn clock() -> FixedClock {
    FixedClock::new(&["2026-09-09T03:40:00.000Z"])
}

fn request<'a>(
    source: &'a Path,
    target_parent: &'a Path,
    name: &'a str,
    vcc: &'a [PathBuf],
    manager_roots: &'a ManagerRoots,
) -> ImportCopyRequest<'a> {
    ImportCopyRequest {
        source,
        target_parent,
        name,
        vcc_settings_candidates: vcc,
        roots: manager_roots,
    }
}

/// Installs a real VPM project (manifest + Unity version + one excluded
/// regenerable directory) and registers it with BOTH managers.
fn install_source(base: &Path, name: &str) -> PathBuf {
    let project = base.join("projects").join(name);
    fs::create_dir_all(project.join("Assets")).unwrap();
    fs::create_dir_all(project.join("Packages")).unwrap();
    fs::create_dir_all(project.join("ProjectSettings")).unwrap();
    fs::create_dir_all(project.join("Library")).unwrap(); // regenerable
    fs::create_dir_all(project.join(".vua")).unwrap(); // old task state
    fs::write(project.join("Assets").join("scene.unity"), "dummy scene").unwrap();
    fs::write(
        project.join("Packages").join("vpm-manifest.json"),
        r#"{ "dependencies": { "com.vrchat.base": "3.7.x" } }"#,
    )
    .unwrap();
    fs::write(
        project.join("ProjectSettings").join("ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1\n",
    )
    .unwrap();
    fs::write(project.join("ProjectSettings").join("ProjectSettings.asset"), "productName: Old\n").unwrap();
    fs::write(project.join("Library").join("big-cache.bin"), "regenerable").unwrap();
    register_vcc(base, &[&project]);
    register_alcom(base, &[&project]);
    project
}

fn write_settings(path: PathBuf, projects: &[&Path]) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    let listed: Vec<String> = projects
        .iter()
        .map(|project| project.to_string_lossy().into_owned())
        .collect();
    fs::write(
        &path,
        serde_json::to_string(&json!({ "userProjects": listed })).unwrap(),
    )
    .unwrap();
}

fn register_vcc(base: &Path, projects: &[&Path]) {
    write_settings(base.join("vcc/settings.json"), projects);
}

fn register_alcom(base: &Path, projects: &[&Path]) {
    write_settings(base.join("alcom/setting.json"), projects);
}

fn read_repo_json(relative: &str) -> Value {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let path = Path::new(manifest_dir).join("../..").join(relative);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json("schemas/project-ops/v0.1/result.schema.json")).unwrap()
}

fn command_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json("schemas/project-ops/v0.1/command.schema.json")).unwrap()
}

fn violations(validator: &jsonschema::Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

#[test]
fn plan_and_apply_happy_path_copies_with_exclusions_and_records_the_source() {
    let base = unique_dir("happy");
    let source = install_source(&base, "My World");
    let target_parent = base.join("imports");
    fs::create_dir_all(&target_parent).unwrap();

    // PLAN: guards pass, the scope is measured, the exclusions are listed.
    let vcc = vcc_candidates(&base);
    let manager_roots = roots(&base);
    let plan = plan_import_copy(&request(&source, &target_parent, "My World Copy", &vcc, &manager_roots))
        .expect("plan must pass for a registered healthy project");
    assert_eq!(plan.kind, "plan");
    assert_eq!(
        plan.excluded_entries,
        vec![".vua", "Builds", "Library", "Logs", "Temp", "obj"]
    );
    assert!(plan.estimated_bytes > 0);
    assert!(plan.source_top_levels.contains(&"Assets".to_owned()));
    assert!(!plan.source_top_levels.contains(&"Library".to_owned()));

    let plan_json = serde_json::to_value(&plan).unwrap();
    let problems = violations(&result_validator(), &enveloped(plan_json.clone()));
    assert!(problems.is_empty(), "plan schema violations: {problems:#?}");

    // APPLY: the copy runs, the exclusions hold, the identity is new, the
    // source link is recorded, and the re-inspection reads the copy.
    let receipt = apply_import_copy(
        &request(&source, &target_parent, "My World Copy", &vcc, &manager_roots),
        &plan.plan_digest,
        "cmd-test-import-1",
        &clock(),
    )
    .expect("apply must succeed right after a passing plan");

    assert_eq!(receipt.kind, "receipt");
    let target = PathBuf::from(&receipt.target_path);
    assert!(target.is_dir());
    assert!(target.join("Assets").join("scene.unity").is_file());
    assert!(target.join("Packages").join("vpm-manifest.json").is_file());
    assert!(!target.join("Library").exists(), "regenerable dirs are excluded");
    assert!(!target.join(".vua").join("pending-mutation.json").exists());

    // New Unity-facing identity: productName rewritten to the new name.
    let settings = fs::read_to_string(target.join("ProjectSettings").join("ProjectSettings.asset")).unwrap();
    assert!(settings.contains("productName: \"My World Copy\""), "settings: {settings}");

    // Source link recorded inside the new project's .vua.
    let source_doc = fs::read_to_string(target.join(".vua").join("source.json")).unwrap();
    let source_value: Value = serde_json::from_str(&source_doc).unwrap();
    assert_eq!(
        source_value["sourceLink"]["sourcePath"],
        json!(source.to_string_lossy().into_owned())
    );
    assert_eq!(source_value["sourceLink"]["taskCorrelation"], json!("cmd-test-import-1"));
    assert_eq!(
        source_value["sourceLink"]["sourceAssociations"],
        json!(["vcc_registered", "alcom_registered"])
    );

    // Re-inspection reads the COPY, not the original.
    assert_eq!(receipt.re_inspection.unity_version.as_deref(), Some("2022.3.22f1"));
    assert!(receipt.re_inspection.manifest_present && receipt.re_inspection.manifest_schema_ok);
    assert!(receipt.bytes_copied > 0);
    assert!(receipt.copied_top_levels.contains(&"Assets".to_owned()));

    // VUA-native identity (rulings items 7/9/12): the copy is first-marked
    // on apply; the original stays unmarked.
    assert!(matches!(
        vua_project_manager::read_identity(&target),
        vua_project_manager::VuaIdentity::Present(_)
    ));
    assert_eq!(
        vua_project_manager::read_identity(&source),
        vua_project_manager::VuaIdentity::Absent,
        "the original project is never marked"
    );

    // The ORIGINAL project is untouched (1.2.0 read-only ruling): its .vua
    // still holds exactly what the fixture put there — no source.json.
    assert!(!source.join(".vua").join("source.json").exists());
    assert!(source.join("Library").exists());

    let receipt_json = serde_json::to_value(&receipt).unwrap();
    let problems = violations(&result_validator(), &enveloped(receipt_json));
    assert!(problems.is_empty(), "receipt schema violations: {problems:#?}");

    cleanup(&base);
}

/// Wraps a result document (which carries its own `kind`) into the
/// project-ops result envelope, exactly as the provider face will.
fn enveloped(result: Value) -> Value {
    json!({
        "schemaVersion": "0.1",
        "operation": "project.import-copy",
        "result": result,
    })
}

#[test]
fn apply_refuses_plan_drift_instead_of_executing_a_stale_confirmation() {
    let base = unique_dir("drift");
    let source = install_source(&base, "Drifty");
    let target_parent = base.join("imports");
    fs::create_dir_all(&target_parent).unwrap();

    let vcc = vcc_candidates(&base);
    let manager_roots = roots(&base);
    let plan = plan_import_copy(&request(&source, &target_parent, "Drifty Copy", &vcc, &manager_roots)).unwrap();

    // The source changes after the user confirmed the plan.
    fs::write(source.join("Assets").join("new-file.txt"), "changed").unwrap();

    let rejected = apply_import_copy(
        &request(&source, &target_parent, "Drifty Copy", &vcc, &manager_roots),
        &plan.plan_digest,
        "cmd-drift",
        &clock(),
    )
    .expect_err("drifted plan must be refused");
    assert_eq!(rejected.guard, RejectionGuard::PlanDrift);
    assert_eq!(rejected.code, "vua.project.plan_drift");
    assert!(!target_parent.join("Drifty Copy").exists(), "a refused import writes nothing");

    cleanup(&base);
}

#[test]
fn the_five_guards_refuse_typecally() {
    let base = unique_dir("guards");
    let source = install_source(&base, "Guarded");
    let target_parent = base.join("imports");
    fs::create_dir_all(&target_parent).unwrap();

    // Guard: source not registered (no settings mention it).
    let stranger = base.join("projects").join("Stranger");
    fs::create_dir_all(stranger.join("Packages")).unwrap();
    fs::create_dir_all(stranger.join("ProjectSettings")).unwrap();
    fs::write(stranger.join("Packages").join("vpm-manifest.json"), "{}").unwrap();
    fs::write(
        stranger.join("ProjectSettings").join("ProjectVersion.txt"),
        "m_EditorVersion: 2022.3.22f1\n",
    )
    .unwrap();
    let vcc = vcc_candidates(&base);
    let manager_roots = roots(&base);
    let rejected =
        plan_import_copy(&request(&stranger, &target_parent, "Stranger Copy", &vcc, &manager_roots))
            .expect_err("an unregistered source must be refused");
    assert_eq!(rejected.guard, RejectionGuard::SourceNotRegistered);

    // Guard: source invalid (registered but no VPM markers).
    let incomplete = base.join("projects").join("Incomplete");
    fs::create_dir_all(&incomplete).unwrap();
    register_vcc(&base, &[&source, &incomplete]);
    let rejected =
        plan_import_copy(&request(&incomplete, &target_parent, "Incomplete Copy", &vcc, &manager_roots))
            .expect_err("a marker-less source must be refused");
    assert_eq!(rejected.guard, RejectionGuard::SourceInvalid);

    // Guard: target exists.
    let existing_target = target_parent.join("Taken");
    fs::create_dir_all(&existing_target).unwrap();
    let rejected = plan_import_copy(&request(&source, &target_parent, "Taken", &vcc, &manager_roots))
        .expect_err("an existing target must be refused");
    assert_eq!(rejected.guard, RejectionGuard::TargetExists);

    // Guard: target inside the source tree.
    let inside = source.join("nested");
    fs::create_dir_all(&inside).unwrap();
    let rejected = plan_import_copy(&request(&source, &inside, "Nested Copy", &vcc, &manager_roots))
        .expect_err("a target inside the source must be refused");
    assert_eq!(rejected.guard, RejectionGuard::TargetInsideSource);

    // Guard: invalid project name (validated before anything else).
    let rejected = plan_import_copy(&request(&source, &target_parent, "bad/name", &vcc, &manager_roots))
        .expect_err("an invalid name must be refused");
    assert_eq!(rejected.guard, RejectionGuard::SourceInvalid);

    cleanup(&base);
}

#[test]
fn example_vectors_match_the_frozen_schemas() {
    // Positive vectors validate.
    let command = read_repo_json("schemas/project-ops/v0.1/examples/project-import-copy-plan.request.json");
    assert!(violations(&command_validator(), &command).is_empty());
    let command = read_repo_json("schemas/project-ops/v0.1/examples/project-import-copy-apply.request.json");
    assert!(violations(&command_validator(), &command).is_empty());

    let plan = read_repo_json("schemas/project-ops/v0.1/examples/project-import-copy-plan.result.json");
    assert!(violations(&result_validator(), &plan).is_empty());
    let receipt = read_repo_json("schemas/project-ops/v0.1/examples/project-import-copy-apply.result.json");
    assert!(violations(&result_validator(), &receipt).is_empty());

    // Negative vectors are refused by the command schema.
    let bad_phase = read_repo_json("schemas/project-ops/v0.1/examples/invalid-phase.json");
    assert!(!violations(&command_validator(), &bad_phase).is_empty());
    let missing_digest = read_repo_json("schemas/project-ops/v0.1/examples/apply-missing-digest.json");
    assert!(!violations(&command_validator(), &missing_digest).is_empty());
    let bad_operation = read_repo_json("schemas/project-ops/v0.1/examples/invalid-operation.json");
    assert!(!violations(&command_validator(), &bad_operation).is_empty());
}

#[test]
fn rejected_documents_validate_with_the_frozen_guard_closed_set() {
    let rejection = ImportRejected {
        kind: "rejected",
        guard: RejectionGuard::InsufficientDiskSpace,
        code: "vua.project.insufficient_disk_space",
        detail: "demo".to_owned(),
    };
    let enveloped = json!({
        "schemaVersion": "0.1",
        "operation": "project.import-copy",
        "result": rejection,
    });
    let problems = violations(&result_validator(), &enveloped);
    assert!(problems.is_empty(), "violations: {problems:#?}");
    assert_eq!(enveloped["result"]["code"], json!("vua.project.insufficient_disk_space"));
}
