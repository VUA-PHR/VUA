//! W20 freeze consumer tests: the Recipe v0.3 suite (`schemas/recipe/v0.3/`)
//! — recipe, local-resolution, and the NEW approved-plan document
//! (proposal 011, the cross-review upstream of Unity Bridge v2 in 009).
//!
//! The frozen vectors drive a real JSON-Schema validation on this end:
//! positive examples validate, negative examples are rejected, and the
//! approved-plan semantics pinned here are the ones 009's Bridge v2
//! consumes — planHash as the integrity/idempotency anchor, the closed
//! job-kind vocabulary (unknown kind = contract error), and NO executed
//! status (execution facts live in the Build Record, never in the plan).

use jsonschema::Validator;
use serde_json::Value;
use std::path::PathBuf;

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/recipe/v0.3")
}

fn read_json(relative: &str) -> Value {
    let bytes = std::fs::read(schema_dir().join(relative)).expect("schema/vector must exist");
    serde_json::from_slice(&bytes).expect("schema/vector must be valid JSON")
}

fn validator_for(schema: &Value) -> Validator {
    jsonschema::validator_for(schema).expect("frozen schema must compile")
}

fn violations(validator: &Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

#[test]
fn positive_examples_validate_against_their_frozen_schemas() {
    for (schema_name, example_name) in [
        ("recipe.schema.json", "example.recipe.json"),
        ("local-resolution.schema.json", "example.local-resolution.json"),
        ("approved-plan.schema.json", "example.approved-plan.json"),
    ] {
        let schema = read_json(schema_name);
        let example = read_json(example_name);
        let validator = validator_for(&schema);
        let problems = violations(&validator, &example);
        assert!(
            problems.is_empty(),
            "{example_name} must validate: {problems:?}"
        );
    }
}

#[test]
fn recipe_v03_evolution_points_are_frozen_as_designed() {
    let schema = read_json("recipe.schema.json");
    // formatVersion pinned to 0.3 — the old 0.2 documents are retired, no
    // migrator (outline ruling).
    assert_eq!(schema["properties"]["formatVersion"]["const"], "0.3");
    // sourceRef gained the warehouse origin (010 path A: imported entries are
    // legal material sources).
    let source_ref = &schema["$defs"]["sourceRef"];
    let serialized = serde_json::to_string(source_ref).unwrap();
    assert!(serialized.contains("warehouseItemId"), "{serialized}");
    assert!(serialized.contains("generated_vpm"), "{serialized}");
    // Version lock learns the vpm_copy lock object (derived from a generated
    // copy, tied to its warehouse entry).
    let lps = serde_json::to_string(&schema["$defs"]["lockedPackageSource"]).unwrap();
    assert!(lps.contains("vpm_copy"), "{lps}");
}

#[test]
fn approved_plan_has_no_executed_state_and_a_closed_job_vocabulary() {
    let schema = read_json("approved-plan.schema.json");
    let status = &schema["properties"]["status"]["enum"];
    // The plan carries authorization only: execution facts live in the Build
    // Record (W22), so `executed` must never appear.
    assert_eq!(
        status,
        &serde_json::json!(["draft", "approved", "superseded"]),
        "the plan must never carry an executed state"
    );
    let kinds = schema["$defs"]["job"]["properties"]["kind"]["enum"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap().to_owned())
        .collect::<Vec<_>>();
    // Closed vocabulary projected from the Recipe v0.2 operation set; an
    // unknown kind is a contract error (009: typed rejection on dispatch).
    assert_eq!(
        kinds,
        [
            "install_modular_asset",
            "attach_to_bone",
            "exclude_object",
            "set_object_active"
        ]
    );
}

#[test]
fn negative_vectors_are_rejected() {
    let plan_validator = validator_for(&read_json("approved-plan.schema.json"));
    let resolution_validator = validator_for(&read_json("local-resolution.schema.json"));

    // No executed state — ever.
    let executed = read_json("examples/invalid-plan-executed-status.json");
    assert!(
        !plan_validator.is_valid(&executed),
        "executed status must not validate"
    );
    // planHash outside the sha256 vocabulary is a contract error.
    let bad_hash = read_json("examples/invalid-plan-hash.json");
    assert!(!plan_validator.is_valid(&bad_hash), "md5 hash must not validate");
    // Unknown job kind is a contract error.
    let bad_kind = read_json("examples/invalid-plan-kind.json");
    assert!(
        !plan_validator.is_valid(&bad_kind),
        "unknown job kind must not validate"
    );
    // Malformed recipe id in a resolution is a contract error.
    let bad_id = read_json("examples/invalid-resolution-recipe-id.json");
    assert!(
        !resolution_validator.is_valid(&bad_id),
        "malformed recipe id must not validate"
    );
}

#[test]
fn plan_hash_and_resolved_source_survive_a_round_trip() {
    // The approved plan is the Bridge v2 input: planHash (the integrity and
    // idempotency anchor) and per-job resolvedSource must survive a serde
    // round trip unchanged — the hash is computed over the canonical form,
    // so any silent reshaping would break Bridge-side local verification.
    let example = read_json("example.approved-plan.json");
    let text = serde_json::to_string(&example).expect("serialize");
    let parsed: Value = serde_json::from_str(&text).expect("deserialize");
    assert_eq!(parsed["planHash"], example["planHash"]);
    assert_eq!(parsed["jobs"][0]["inputs"]["resolvedSource"], example["jobs"][0]["inputs"]["resolvedSource"]);
    assert_eq!(parsed["status"], "approved");
}
