//! W21 draft consumer tests: unity-bridge v2 vectors (proposal 009).
//!
//! The v2 schema is a superset of v1: every v1 example still validates as a
//! v2 command with `schemaVersion` bumped, and the new production-job /
//! restore operations pin the proposal-009 rulings — the plan hash is the
//! completeness and idempotency anchor, the plan schemaVersion is checked
//! against an explicit supported set, real runs (dryRun=false) demand the
//! fingerprint lock, dry-run receipts carry `pending` step lists while real
//! runs carry executed lists plus the pre-job snapshot id, and restore
//! receipts are two-state (succeeded / failed) with `restoredFrom` identity.
//! These vectors pin the DRAFT for the three-way mutual review (production
//! v2 <-> core W20 plan <-> W22 record); the BOARD contract-table upgrade to
//! `v2 | frozen` happens only after that review, never before.

use serde_json::Value;
use std::path::PathBuf;

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/unity-bridge/v2")
}

fn read_json(relative: &str) -> Value {
    let bytes = std::fs::read(schema_dir().join(relative)).expect("schema/vector must exist");
    serde_json::from_slice(&bytes).expect("schema/vector must be valid JSON")
}

fn command_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("command.schema.json")).unwrap()
}

fn result_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("result.schema.json")).unwrap()
}

#[test]
fn w21_positive_vectors_validate_against_both_draft_schemas() {
    let command_validator = command_validator();
    let result_validator = result_validator();
    for name in [
        "examples/production-job-dryrun.request.json",
        "examples/production-job-run.request.json",
        "examples/restore-project.request.json",
    ] {
        let vector = read_json(name);
        assert!(
            command_validator.is_valid(&vector),
            "{name} must validate against the draft command schema"
        );
    }
    for name in [
        "examples/production-job-dryrun.result.json",
        "examples/production-job-run.result.json",
        "examples/production-job-replayed.result.json",
        "examples/production-job-rejected.result.json",
        "examples/production-job-failed.result.json",
        "examples/restore-project.result.json",
        "examples/restore-project-failed.result.json",
    ] {
        let vector = read_json(name);
        assert!(
            result_validator.is_valid(&vector),
            "{name} must validate against the draft result schema"
        );
    }
}

#[test]
fn w21_v1_operations_remain_valid_as_v2_superset() {
    // Same-face upgrade: a v1-shaped command (operation + payload) with
    // schemaVersion 2 must still validate — v2 adds operations, it does not
    // remove or re-shape v1 ones.
    let command_validator = command_validator();
    let v1_inspect: Value = serde_json::json!({
        "schemaVersion": 2,
        "commandId": "v1-compat-01",
        "operation": "inspect_project",
        "projectId": "proj",
        "dryRun": true,
        "payload": {}
    });
    assert!(
        command_validator.is_valid(&v1_inspect),
        "v1 inspect_project must remain valid under v2"
    );
    let v1_import: Value = serde_json::json!({
        "schemaVersion": 2,
        "commandId": "v1-compat-02",
        "operation": "import_unity_package",
        "projectId": "proj",
        "dryRun": false,
        "expectedProjectFingerprint": "fp-1",
        "payload": {
            "sourcePackagePath": "packages/fuku.unitypackage",
            "sourcePackageSha256": "sha256:1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809"
        }
    });
    assert!(
        command_validator.is_valid(&v1_import),
        "v1 import_unity_package must remain valid under v2"
    );
}

#[test]
fn w21_negative_command_vectors_are_rejected() {
    let command_validator = command_validator();
    for name in [
        "examples/invalid-operation.json",
        "examples/production-job-missing-plan-ref.json",
        "examples/production-job-real-run-missing-fingerprint.json",
        "examples/restore-missing-snapshot.json",
        "examples/invalid-plan-hash.json",
    ] {
        let vector = read_json(name);
        assert!(
            !command_validator.is_valid(&vector),
            "{name} must be rejected by the draft command schema"
        );
    }
}

#[test]
fn w21_negative_result_vectors_are_rejected() {
    let result_validator = result_validator();
    for name in [
        "examples/dryrun-missing-steps.result.json",
        "examples/realrun-missing-snapshot.result.json",
    ] {
        let vector = read_json(name);
        assert!(
            !result_validator.is_valid(&vector),
            "{name} must be rejected by the draft result schema"
        );
    }
}

#[test]
fn w21_dryrun_receipt_never_poses_as_a_real_run() {
    // Honesty rule (proposal 009): a dry-run receipt and a real-run receipt
    // share one schema but are distinguished by the explicit `dryRun` field;
    // a dry-run receipt must not carry the real-run-only snapshot identity.
    let result_validator = result_validator();
    let dryrun = read_json("examples/production-job-dryrun.result.json");
    assert!(result_validator.is_valid(&dryrun));
    assert_eq!(dryrun["data"]["dryRun"], serde_json::json!(true));
    assert!(dryrun["data"].get("snapshotId").is_none());

    let real = read_json("examples/production-job-run.result.json");
    assert!(result_validator.is_valid(&real));
    assert_eq!(real["data"]["dryRun"], serde_json::json!(false));
    assert!(real["data"].get("snapshotId").is_some());
}

#[test]
fn w21_plan_hash_is_the_replay_anchor() {
    // The plan hash appears identically in the request and in every receipt
    // of that job (dry-run, real run, replay) — it is the completeness and
    // idempotency anchor per the core ruling on proposal 009 question 1.
    let request = read_json("examples/production-job-run.request.json");
    let request_hash = request["payload"]["planHash"].as_str().unwrap();
    for name in [
        "examples/production-job-run.result.json",
        "examples/production-job-replayed.result.json",
    ] {
        let receipt = read_json(name);
        assert_eq!(
            receipt["data"]["planHash"].as_str().unwrap(),
            request_hash,
            "{name} must echo the plan hash"
        );
    }
}
