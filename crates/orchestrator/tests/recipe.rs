//! E-RECIPE integration tests against the pre-alpha v0.2 test fixtures
//! (`schemas/recipe/v0.2/example.*.json`). Each test cites its ORC requirement
//! (ORC-TST-006).

#![allow(clippy::result_large_err)]

use std::path::PathBuf;

use vua_orchestrator::{
    build_read_model, decode_share_code, derive_project_spec, document_digest, encode_share_code,
    has_blocking, validate_local_resolution, IssueSeverity, LocalResolutionV1, LockState,
    RecipeV02, ReproducibilityLevel, ResolutionState,
};

fn fixture_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/recipe/v0.2")
}

fn read_fixture(name: &str) -> serde_json::Value {
    let bytes = std::fs::read(fixture_dir().join(name)).expect("fixture must exist");
    serde_json::from_slice(&bytes).expect("fixture must be valid JSON")
}

fn parse_recipe(value: serde_json::Value) -> RecipeV02 {
    serde_json::from_value(value).expect("fixture must typecheck against RecipeV02")
}

fn example_recipe() -> RecipeV02 {
    parse_recipe(read_fixture("example.recipe.json"))
}

fn example_resolution() -> LocalResolutionV1 {
    serde_json::from_value(read_fixture("example.local-resolution.json"))
        .expect("fixture must typecheck against LocalResolutionV1")
}

fn mutate(recipe: &RecipeV02, edit: impl FnOnce(&mut serde_json::Value)) -> RecipeV02 {
    let mut value = serde_json::to_value(recipe).unwrap();
    edit(&mut value);
    serde_json::from_value(value).expect("mutation must stay type-valid")
}

fn codes_of(issues: &[vua_orchestrator::RecipeIssue]) -> Vec<&str> {
    issues.iter().map(|issue| issue.code.as_str()).collect()
}

// --- happy path over the v0.2 test fixtures ---

#[test]
fn orc_scp_002_example_recipe_validates_and_reads_as_version_locked() {
    let recipe = example_recipe();
    let issues = vua_orchestrator::validate_recipe(&recipe);
    assert!(
        !has_blocking(&issues),
        "the v0.2 fixture must be clean, got {:?}",
        codes_of(&issues)
    );

    let model = build_read_model(recipe, None);
    assert_eq!(model.lock_state, LockState::ValidComplete);
    assert_eq!(model.reproducibility, ReproducibilityLevel::VersionLocked);
    assert_eq!(model.resolution_state, ResolutionState::Resolved);
}

#[test]
fn orc_scp_002_local_resolution_lifts_the_read_model_to_ready() {
    let recipe = example_recipe();
    let resolution = example_resolution();
    let binding_issues = validate_local_resolution(&recipe, &resolution);
    assert!(
        !has_blocking(&binding_issues),
        "fixture bindings must be exact, got {:?}",
        codes_of(&binding_issues)
    );

    let model = build_read_model(recipe, Some(&resolution));
    assert_eq!(model.lock_state, LockState::ValidComplete);
    assert_eq!(
        model.reproducibility,
        ReproducibilityLevel::LocallyReproducible
    );
    assert_eq!(model.resolution_state, ResolutionState::Ready);
}

#[test]
fn orc_scp_002_invalid_recipe_or_resolution_identity_never_reports_ready() {
    let recipe = example_recipe();
    let mut bad_resolution = example_resolution();
    bad_resolution.environment_id.clear();
    let issues = validate_local_resolution(&recipe, &bad_resolution);
    assert!(codes_of(&issues).contains(&"recipe.local_resolution_identity_invalid"));
    let model = build_read_model(recipe.clone(), Some(&bad_resolution));
    assert_ne!(
        model.reproducibility,
        ReproducibilityLevel::LocallyReproducible
    );
    assert_eq!(model.resolution_state, ResolutionState::NeedsInput);

    let invalid_recipe = mutate(&recipe, |value| {
        value["target"]["avatarInstanceId"] = "missing_avatar".into();
    });
    let model = build_read_model(invalid_recipe, Some(&example_resolution()));
    assert_ne!(
        model.reproducibility,
        ReproducibilityLevel::LocallyReproducible
    );
    assert_eq!(model.resolution_state, ResolutionState::NeedsInput);
}

// --- invariant negatives retained from the v0.2 test format ---

#[test]
fn orc_tst_002_duplicate_ids_and_missing_references_are_blocking() {
    let recipe = example_recipe();
    let duplicated = mutate(&recipe, |value| {
        value["instances"][1]["id"] = "avatar_root".into();
    });
    let issues = vua_orchestrator::validate_recipe(&duplicated);
    assert!(codes_of(&issues).contains(&"recipe.id_duplicate"));

    let dangling = mutate(&recipe, |value| {
        value["instances"][1]["assetId"] = "ghost_asset".into();
    });
    let issues = vua_orchestrator::validate_recipe(&dangling);
    assert!(codes_of(&issues).contains(&"recipe.instance_asset_missing"));

    let missing_avatar = mutate(&recipe, |value| {
        value["target"]["avatarInstanceId"] = "nope".into();
    });
    let issues = vua_orchestrator::validate_recipe(&missing_avatar);
    assert!(codes_of(&issues).contains(&"recipe.avatar_instance_missing"));
}

#[test]
fn orc_tst_002_asset_requirement_cycles_are_detected() {
    let recipe = example_recipe();
    let cyclic = mutate(&recipe, |value| {
        value["assets"][0]["requiresAssetIds"] = serde_json::json!(["outfit_asset"]);
    });
    let issues = vua_orchestrator::validate_recipe(&cyclic);
    assert!(codes_of(&issues).contains(&"recipe.asset_cycle"));
}

#[test]
fn orc_scp_002_stale_lock_is_a_warning_that_degrades_reproducibility() {
    let recipe = example_recipe();
    let stale = mutate(&recipe, |value| {
        value["revision"] = 4.into();
    });
    let issues = vua_orchestrator::validate_recipe(&stale);
    assert!(codes_of(&issues).contains(&"recipe.lock_stale"));
    let lock_issue = issues
        .iter()
        .find(|issue| issue.code == "recipe.lock_stale")
        .unwrap();
    assert_eq!(lock_issue.severity, IssueSeverity::Warning);
    assert!(lock_issue
        .actions
        .iter()
        .any(|action| action.kind == vua_orchestrator::IssueActionKind::RefreshLock));

    let model = build_read_model(stale, None);
    assert_eq!(model.lock_state, LockState::Stale);
    assert_eq!(model.reproducibility, ReproducibilityLevel::IntentOnly);
    assert_eq!(model.resolution_state, ResolutionState::LockStale);
}

#[test]
fn orc_tst_002_relation_roles_and_self_install_are_blocked() {
    let recipe = example_recipe();
    let self_install = mutate(&recipe, |value| {
        value["relations"][0]["assetInstanceId"] = "avatar_root".into();
    });
    let issues = vua_orchestrator::validate_recipe(&self_install);
    assert!(codes_of(&issues).contains(&"recipe.relation_self_install"));

    let bad_role = mutate(&recipe, |value| {
        // Install the avatar instance as the asset side.
        value["relations"][0]["assetInstanceId"] = "avatar_root".into();
        value["relations"][0]["avatarInstanceId"] = "outfit_blue".into();
    });
    let issues = vua_orchestrator::validate_recipe(&bad_role);
    assert!(codes_of(&issues).contains(&"recipe.relation_role_invalid"));
}

#[test]
fn orc_tst_002_wardrobe_defaults_must_satisfy_the_selection_mode() {
    let recipe = example_recipe();
    // exactly_one with no default violates the mode.
    let no_default = mutate(&recipe, |value| {
        value["wardrobeGroups"][0]["selectionMode"] = "exactly_one".into();
        value["wardrobeGroups"][0]["defaultInstanceIds"] = serde_json::json!([]);
    });
    let issues = vua_orchestrator::validate_recipe(&no_default);
    assert!(codes_of(&issues).contains(&"recipe.wardrobe_default_invalid"));

    // zero_or_one tolerates an empty default, so only a foreign default breaks.
    let foreign_default = mutate(&recipe, |value| {
        value["wardrobeGroups"][0]["defaultInstanceIds"] = serde_json::json!(["avatar_root"]);
    });
    let issues = vua_orchestrator::validate_recipe(&foreign_default);
    assert!(codes_of(&issues).contains(&"recipe.wardrobe_default_invalid"));
}

#[test]
fn orc_ipc_010_unknown_required_capabilities_block_and_optional_warn() {
    let recipe = example_recipe();
    let unknown_required = mutate(&recipe, |value| {
        value["environment"]["capabilities"][0]["id"] = "mystery.capability.x".into();
    });
    let issues = vua_orchestrator::validate_recipe(&unknown_required);
    let issue = issues
        .iter()
        .find(|issue| issue.code == "recipe.capability_unknown")
        .expect("unknown capability must be reported");
    assert_eq!(issue.severity, IssueSeverity::Blocking);

    let mut optional_value = serde_json::to_value(&recipe).unwrap();
    optional_value["environment"]["capabilities"]
        .as_array_mut()
        .unwrap()[0]["id"] = serde_json::Value::String("mystery.capability.x".into());
    optional_value["environment"]["capabilities"]
        .as_array_mut()
        .unwrap()[0]["required"] = serde_json::Value::Bool(false);
    let optional = serde_json::from_value::<RecipeV02>(optional_value).unwrap();
    let issues = vua_orchestrator::validate_recipe(&optional);
    let issue = issues
        .iter()
        .find(|issue| issue.code == "recipe.capability_unknown")
        .expect("unknown optional capability must be reported");
    assert_eq!(issue.severity, IssueSeverity::Warning);
}

#[test]
fn orc_ipc_010_duplicate_dependencies_are_blocked() {
    let recipe = example_recipe();
    let duplicated = mutate(&recipe, |value| {
        let dependency = value["dependencies"][0].clone();
        value["dependencies"]
            .as_array_mut()
            .unwrap()
            .push(dependency);
    });
    let issues = vua_orchestrator::validate_recipe(&duplicated);
    assert!(codes_of(&issues).contains(&"recipe.dependency_duplicate"));
}

// --- local resolution binding rules (invariant 6) ---

#[test]
fn orc_tst_002_local_resolution_demands_exactly_one_binding() {
    let recipe = example_recipe();
    let empty = LocalResolutionV1 {
        schema_version: 1,
        recipe_id: recipe.recipe_id.clone(),
        recipe_revision: recipe.revision,
        environment_id: "019e0000-0000-7000-8000-000000000100".into(),
        resolved_at: "2026-08-29T08:35:00Z".into(),
        assets: vec![],
    };
    let issues = validate_local_resolution(&recipe, &empty);
    let codes = codes_of(&issues);
    assert!(codes.contains(&"recipe.entrypoint_unbound"));
    assert!(codes.contains(&"recipe.local_asset_unresolved"));
    let model = build_read_model(recipe.clone(), Some(&empty));
    assert_eq!(model.resolution_state, ResolutionState::NeedsInput);
    assert_eq!(model.reproducibility, ReproducibilityLevel::VersionLocked);

    // Zero bindings are "needs input"; two bindings for one selector are
    // ambiguous and blocking (不能静默选第一个).
    let mut doubled = example_resolution();
    let outfit = doubled.assets.last().unwrap().clone();
    doubled.assets.push(outfit);
    let issues = validate_local_resolution(&recipe, &doubled);
    let issue = issues
        .iter()
        .find(|issue| issue.code == "recipe.entrypoint_unbound")
        .expect("duplicated binding must be reported");
    assert_eq!(issue.severity, IssueSeverity::Blocking);
}

#[test]
fn orc_scp_002_local_resolution_rejects_cross_asset_and_unknown_bindings() {
    let recipe = example_recipe();
    let mut resolution = example_resolution();
    resolution.assets[0].asset_id = "missing_asset".into();
    let issues = validate_local_resolution(&recipe, &resolution);
    let codes = codes_of(&issues);
    assert!(codes.contains(&"recipe.local_asset_unknown"));
    assert!(codes.contains(&"recipe.entrypoint_binding_invalid"));
    let model = build_read_model(recipe, Some(&resolution));
    assert_eq!(model.resolution_state, ResolutionState::NeedsInput);
    assert_ne!(
        model.reproducibility,
        ReproducibilityLevel::LocallyReproducible
    );
}

// --- digest & share code ---

#[test]
fn orc_typ_005_document_digest_is_stable_and_prefixed() {
    let recipe = example_recipe();
    let left = document_digest(&recipe).unwrap();
    let right = document_digest(&recipe).unwrap();
    assert_eq!(left, right);
    assert!(left.starts_with("sha256:"));
    assert_eq!(left.len(), 71);

    // A revision bump changes the digest (并发控制的事实基础).
    let bumped = mutate(&recipe, |value| {
        value["revision"] = 9.into();
    });
    assert_ne!(
        document_digest(&recipe).unwrap(),
        document_digest(&bumped).unwrap()
    );
}

#[test]
fn orc_ipc_010_share_code_roundtrips_through_vuar0_2() {
    let recipe = example_recipe();
    let code = encode_share_code(&recipe).unwrap();
    assert!(code.starts_with("vuar0.2."));
    assert!(
        !code["vuar0.2.".len()..].contains('='),
        "payload carries no padding"
    );
    let (decoded, issues) = decode_share_code(&code).unwrap();
    assert!(!has_blocking(&issues));
    assert_eq!(decoded, recipe);
}

#[test]
fn orc_ipc_010_share_code_rejects_foreign_prefixes_and_corruption() {
    let recipe = example_recipe();
    let code = encode_share_code(&recipe).unwrap();

    // vuar1 keeps meaning only v1 — never guessed from content.
    let v1_style = format!("vuar1.{}", &code["vuar0.2.".len()..]);
    let error = decode_share_code(&v1_style).unwrap_err();
    assert_eq!(error.code, "vua.recipe.share_prefix_invalid");

    let former_v2_style = format!("vuar2.{}", &code["vuar0.2.".len()..]);
    let error = decode_share_code(&former_v2_style).unwrap_err();
    assert_eq!(error.code, "vua.recipe.share_prefix_invalid");

    let padded = format!("vuar0.2.{}=", &code["vuar0.2.".len()..]);
    let error = decode_share_code(&padded).unwrap_err();
    assert_eq!(error.code, "vua.recipe.share_payload_invalid");

    let garbage = "vuar0.2.!!!not-base64!!!";
    let error = decode_share_code(garbage).unwrap_err();
    assert_eq!(error.code, "vua.recipe.share_payload_invalid");

    let oversized = format!(
        "vuar0.2.{}",
        vua_orchestrator::base64_url_encode(&vec![7u8; 300 * 1024])
    );
    let error = decode_share_code(&oversized).unwrap_err();
    assert_eq!(error.code, "vua.recipe.share_too_large");

    // A wrong format version inside an otherwise valid payload is refused.
    let mut wrong = recipe.clone();
    wrong.format_version = "0.1".into();
    let code = encode_share_code(&wrong).unwrap();
    let error = decode_share_code(&code).unwrap_err();
    assert_eq!(error.code, "vua.recipe.share_version_invalid");
}

// --- ProjectSpec derivation ---

#[test]
fn orc_scp_002_project_spec_derivation_resolves_locks_and_entrypoints() {
    let recipe = example_recipe();
    let digest = document_digest(&recipe).unwrap();
    let spec = derive_project_spec(&recipe, &digest).expect("fixture must derive");

    assert_eq!(spec.recipe_id, recipe.recipe_id);
    assert_eq!(spec.document_digest, digest);
    assert_eq!(spec.unity.constraint, "2022.3.22f1");
    assert_eq!(spec.unity.locked_version.as_deref(), Some("2022.3.22f1"));
    assert_eq!(spec.required_capabilities, vec!["vrchat.avatar.pc"]);
    assert_eq!(spec.packages.len(), 1);
    assert_eq!(spec.packages[0].locked_version.as_deref(), Some("1.4.0"));
    assert!(spec.packages[0].locked_source_restorable);
    let entry = spec.avatar_entry.expect("avatar entry");
    assert_eq!(entry.instance_id, "avatar_root");
    assert_eq!(entry.selector_id, "avatar_prefab");
    assert_eq!(spec.counts.instances, 2);

    // Stale lock: locked versions degrade to floating constraints.
    let stale = mutate(&recipe, |value| {
        value["revision"] = 7.into();
    });
    let stale_spec = derive_project_spec(&stale, &document_digest(&stale).unwrap())
        .expect("stale still derives");
    assert_eq!(stale_spec.unity.locked_version, None);
    assert_eq!(stale_spec.packages[0].locked_version, None);

    // Blocking recipes refuse to derive.
    let broken = mutate(&recipe, |value| {
        value["instances"][1]["assetId"] = "ghost".into();
    });
    let issues = derive_project_spec(
        &broken,
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    )
    .expect_err("blocking issues must stop derivation");
    assert!(has_blocking(&issues));
}
