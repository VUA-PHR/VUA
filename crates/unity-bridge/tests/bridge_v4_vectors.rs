//! Bake-preview slice consumer tests: unity-bridge v4 vectors
//! (slice/production-nav-bake-preview, user ruling 2026-09-20).
//!
//! v4 is a same-face superset of v3: every v3 operation and field is
//! preserved unchanged; v4 adds exactly one operation, `build_preview`.
//! The ruling classifies it mutating — the artifacts are written into the
//! project directory (`.vua/bridge/preview/<commandId>/`) — so a real run
//! (`dryRun` false) requires `expectedProjectFingerprint` under the
//! existing envelope discipline, while `dryRun=true` resolves the avatar
//! and reports structure statistics only, producing no images. The payload
//! reuses `avatarGlobalObjectId` optionally (empty = active-scene
//! auto-detection, the ported reference semantics); no new payload field
//! is introduced. Receipts reuse the existing data face (statistics +
//! `basis: local_estimate`, never an official rating) and record the
//! artifact directory in `changedPaths`.

use serde_json::Value;
use std::path::PathBuf;

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/unity-bridge/v4")
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
fn bake_preview_positive_vectors_validate_against_v4_schemas() {
    let command_validator = command_validator();
    let result_validator = result_validator();
    for name in [
        "examples/build-preview-dryrun.request.json",
        "examples/build-preview-run.request.json",
    ] {
        let vector = read_json(name);
        assert!(
            command_validator.is_valid(&vector),
            "{name} must validate against the v4 command schema"
        );
    }
    let receipt = read_json("examples/build-preview-dryrun.result.json");
    assert!(
        result_validator.is_valid(&receipt),
        "dry-run receipt must validate against the v4 result schema"
    );
    // A dry-run bake resolves the avatar and reports statistics but changes
    // nothing: the receipt carries the stats in data and an empty
    // changedPaths.
    assert!(receipt["changedPaths"].as_array().unwrap().is_empty());
    assert_eq!(
        receipt["data"]["basis"],
        serde_json::json!("local_estimate")
    );
}

#[test]
fn bake_preview_v4_negative_vectors_are_rejected() {
    let command_validator = command_validator();
    for name in [
        "examples/invalid-schema-version.json",
        "examples/invalid-operation.json",
    ] {
        let vector = read_json(name);
        assert!(
            !command_validator.is_valid(&vector),
            "{name} must be rejected by the v4 command schema"
        );
    }
}

#[test]
fn bake_preview_real_run_requires_fingerprint_and_v4_label() {
    let command_validator = command_validator();
    // Mutating ruling: a real run without expectedProjectFingerprint is
    // rejected by the envelope discipline (same rule family as the v2
    // materialize/install mutations).
    let real_run: Value = serde_json::json!({
        "schemaVersion": 4,
        "commandId": "preview-run-neg",
        "operation": "build_preview",
        "projectId": "proj",
        "dryRun": false,
        "payload": {
            "avatarGlobalObjectId": "GlobalObjectId_V1-2-00000000000000000000000000000000-100000-0"
        }
    });
    assert!(
        !command_validator.is_valid(&real_run),
        "build_preview real run without expectedProjectFingerprint must be rejected"
    );
    // The v3 label must not carry the v4 operation: schemaVersion 3 with
    // build_preview is rejected (frozen v3 files are untouched).
    let v3_labeled: Value = serde_json::json!({
        "schemaVersion": 3,
        "commandId": "preview-v3-neg",
        "operation": "build_preview",
        "projectId": "proj",
        "dryRun": true,
        "payload": {}
    });
    assert!(
        !command_validator.is_valid(&v3_labeled),
        "build_preview under the frozen v3 label must be rejected"
    );
}

#[test]
fn v3_operations_remain_valid_as_v4_superset() {
    // Same-face upgrade: a v3-shaped command (inspection read face) with
    // schemaVersion 4 must still validate — v4 adds build_preview, it does
    // not remove or re-shape v3 ones.
    let command_validator = command_validator();
    let v3_inspection: Value = serde_json::json!({
        "schemaVersion": 4,
        "commandId": "v3-compat-01",
        "operation": "inspect_lighting",
        "projectId": "proj",
        "dryRun": true,
        "payload": {
            "avatarGlobalObjectId": "GlobalObjectId_V1-2-00000000000000000000000000000000-100000-0"
        }
    });
    assert!(
        command_validator.is_valid(&v3_inspection),
        "v3 inspection command must remain valid under v4"
    );
    // A v3 production-face command shape also stays valid under the v4 label.
    let v3_job: Value = serde_json::json!({
        "schemaVersion": 4,
        "commandId": "v3-compat-02",
        "operation": "execute_production_job",
        "projectId": "proj",
        "dryRun": true,
        "payload": {
            "planHash": "sha256:1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809",
            "planSchemaVersion": "0.3",
            "planRef": "recipe/plans/plan-0001.json"
        }
    });
    assert!(
        command_validator.is_valid(&v3_job),
        "v3 execute_production_job must remain valid under v4"
    );
    // The v3 result face stays valid with the v4 label, including the
    // proposal-011 instanceGlobalObjectId legalization inherited from v3.
    let result_validator = result_validator();
    let v3_receipt: Value = serde_json::json!({
        "schemaVersion": 4,
        "commandId": "job-run-02",
        "operation": "execute_production_job",
        "status": "rejected",
        "changedPaths": [],
        "diagnostics": [
            { "code": "plan_schema_version_unsupported", "severity": "error", "message": "outside the supported set" }
        ],
        "data": {
            "dryRun": false,
            "replayed": false,
            "planHash": "sha256:9a8b7c6d5e4f302918a7b6c5d4e3f2091a8b7c6d5e4f302918a7b6c5d4e3f209",
            "steps": []
        }
    });
    assert!(
        result_validator.is_valid(&v3_receipt),
        "v3 receipt shape must remain valid under v4"
    );
}

/// Validate actual C# wire output, not hand-written vectors. Run after EditMode:
/// VUA_BRIDGE_V4_RECEIPTS=<project>/.vua/bridge/v4-test-receipts cargo test ... -- --ignored
#[test]
#[ignore = "requires local Unity EditMode serialized receipts"]
fn actual_unity_v4_public_exit_receipts_validate() {
    let root = PathBuf::from(std::env::var("VUA_BRIDGE_V4_RECEIPTS").expect("receipt directory"));
    let validator = result_validator();
    let mut count = 0;
    for entry in std::fs::read_dir(root).unwrap() {
        let path = entry.unwrap().path();
        if path.extension().is_none_or(|ext| ext != "json") {
            continue;
        }
        let receipt: Value = serde_json::from_slice(&std::fs::read(&path).unwrap()).unwrap();
        let errors: Vec<_> = validator
            .iter_errors(&receipt)
            .map(|error| error.to_string())
            .collect();
        assert!(errors.is_empty(), "{}: {errors:?}", path.display());
        count += 1;
    }
    assert!(
        count >= 23,
        "expected all operation/editor and public failure exits, got {count}"
    );
}
