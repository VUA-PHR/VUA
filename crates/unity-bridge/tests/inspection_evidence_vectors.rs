//! BG-4 draft vector tests: the inspection-evidence v0.1 DRAFT vectors
//! (`schemas/inspection-evidence/v0.1/examples/`) drive JSON-Schema
//! validation over the draft schema. Positive vectors validate; negative
//! vectors (unknown dimension kind, unknown severity, unavailable-with-basis
//! contradiction, missing inspectionId, unknown overallStatus) are rejected.
//! The schema itself stays a DRAFT (proposal 016): these tests prove vector/
//! schema coherence only — no producer or consumer route exists yet, so no
//! freeze is claimed (BOARD ticket BG-4 acceptance criteria).

use jsonschema::Validator;
use serde_json::Value;
use std::path::PathBuf;

fn schema_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../schemas/inspection-evidence/v0.1/inspection-evidence.schema.json")
}

fn examples_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/inspection-evidence/v0.1/examples")
}

fn read_json(path: &PathBuf) -> Value {
    let bytes = std::fs::read(path).expect("file must exist");
    serde_json::from_slice(&bytes).expect("valid JSON")
}

fn violations(validator: &Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

fn draft_validator() -> Validator {
    let schema = read_json(&schema_path());
    jsonschema::validator_for(&schema).expect("draft schema compiles")
}

const POSITIVE: [&str; 2] = [
    "full-five-dimensions.inspection.json",
    "minimal-with-unavailable.inspection.json",
];

const NEGATIVE: [&str; 5] = [
    "invalid-unknown-kind.inspection.json",
    "invalid-severity.inspection.json",
    "invalid-unavailable-with-basis.inspection.json",
    "missing-inspection-id.inspection.json",
    "invalid-unknown-overall.inspection.json",
];

#[test]
fn positive_draft_vectors_validate() {
    let validator = draft_validator();
    for name in POSITIVE {
        let instance = read_json(&examples_dir().join(name));
        let errors = violations(&validator, &instance);
        assert!(
            errors.is_empty(),
            "positive vector {name} must validate against the draft schema, got: {errors:?}"
        );
    }
}

#[test]
fn negative_draft_vectors_are_rejected() {
    let validator = draft_validator();
    for name in NEGATIVE {
        let instance = read_json(&examples_dir().join(name));
        let errors = violations(&validator, &instance);
        assert!(
            !errors.is_empty(),
            "negative vector {name} must be rejected by the draft schema"
        );
    }
}

#[test]
fn draft_vector_dimensions_use_the_closed_vocabulary_without_duplicates() {
    // JSON Schema cannot enforce uniqueness by key across the dimensions
    // array; the vector suite carries that consumer convention until a
    // consuming route lands (M7 slice).
    let kinds = [
        "functional",
        "performance",
        "dependencies",
        "lighting",
        "upload_readiness",
    ];
    let validator = draft_validator();
    for name in POSITIVE {
        let instance = read_json(&examples_dir().join(name));
        assert!(
            violations(&validator, &instance).is_empty(),
            "vector {name} must be schema-clean before the convention check"
        );
        let mut seen: Vec<&str> = Vec::new();
        for dimension in instance["dimensions"].as_array().expect("dimensions array") {
            let kind = dimension["kind"].as_str().expect("kind string");
            assert!(
                kinds.contains(&kind),
                "vector {name}: kind {kind} is outside the closed vocabulary"
            );
            assert!(
                !seen.contains(&kind),
                "vector {name}: dimension kind {kind} appears more than once"
            );
            seen.push(kind);
        }
    }
}

#[test]
fn aggregation_rule_holds_across_positive_vectors() {
    // Declared aggregation (proposal 016): fail if any dimension is fail;
    // else warn if any dimension is warn or unavailable; else pass.
    for name in POSITIVE {
        let instance = read_json(&examples_dir().join(name));
        let mut overall = "pass";
        for dimension in instance["dimensions"].as_array().expect("dimensions array") {
            match dimension["status"].as_str().expect("status string") {
                "fail" => overall = "fail",
                "warn" | "unavailable" if overall != "fail" => overall = "warn",
                _ => {}
            }
        }
        assert_eq!(
            instance["overallStatus"].as_str().expect("overall string"),
            overall,
            "vector {name}: overallStatus must follow the declared aggregation rule"
        );
    }
}
