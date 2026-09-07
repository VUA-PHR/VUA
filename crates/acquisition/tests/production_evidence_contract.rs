//! Contract anchor for `schemas/production-evidence/v0.1` (W23 — the
//! compatibility/missing evidence model, proposal 011 convergence).
//!
//! DRAFT status: the evidence bodies live in the AMF production persistence
//! domain whose storage shape the core W20 freeze slice defines — this file
//! anchors the document vocabulary (schema/vector self-consistency, the kind
//! closed set, the source-reference rule, the resolution lifecycle) and the
//! reference semantics the Local Resolution document will carry
//! (evidenceIds[] referencing these bodies, never inlining them).
//! Freeze follows the proposal 011 convergence review.

use serde_json::{json, Value};
use std::path::PathBuf;

fn schema_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../schemas/production-evidence/v0.1")
}

fn read_json(relative: &str) -> Value {
    let bytes = std::fs::read(schema_dir().join(relative)).expect("schema/vector must exist");
    serde_json::from_slice(&bytes).expect("schema/vector must be valid JSON")
}

fn validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_json("evidence.schema.json")).unwrap()
}

const POSITIVE_VECTORS: &[&str] = &[
    "examples/missing-asset.evidence.json",
    "examples/version-mismatch.evidence.json",
    "examples/guard-denied.evidence.json",
    "examples/resolution-attached.evidence.json",
];

const NEGATIVE_VECTORS: &[&str] = &[
    "examples/invalid-kind.evidence.json",
    "examples/missing-observed-at.evidence.json",
    "examples/invalid-sourceref.evidence.json",
];

#[test]
fn evidence_positive_vectors_validate_against_the_schema() {
    let validator = validator();
    for name in POSITIVE_VECTORS {
        let vector = read_json(name);
        let errors: Vec<String> = validator
            .iter_errors(&vector)
            .map(|error| format!("{}: {error}", error.instance_path()))
            .collect();
        assert!(errors.is_empty(), "{name} must validate: {errors:?}");
    }
}

#[test]
fn evidence_negative_vectors_are_rejected() {
    let validator = validator();
    for name in NEGATIVE_VECTORS {
        let vector = read_json(name);
        assert!(
            !validator.is_valid(&vector),
            "{name} is a negative vector and must not validate"
        );
    }
}

#[test]
fn kind_vocabulary_is_the_frozen_closed_set() {
    let schema = read_json("evidence.schema.json");
    let kinds: Vec<String> = schema["properties"]["kind"]["enum"]
        .as_array()
        .unwrap()
        .iter()
        .map(|value| value.as_str().unwrap().to_owned())
        .collect();
    assert_eq!(
        kinds,
        vec![
            "missing_asset",
            "missing_package",
            "version_mismatch",
            "guard_denied",
        ]
    );
}

#[test]
fn source_ref_requires_at_least_one_producing_context() {
    let validator = validator();
    let base = json!({
        "schemaVersion": "0.1",
        "evidenceId": "0198a7b3-8d9e-7faf-8b2c-0d1e2f3a4b5c",
        "kind": "missing_package",
        "subject": { "ref": "pkg:jp.example.dep" },
        "observedAt": "2026-09-08T06:36:00.000Z",
        "detail": "Declared dependency absent at resolution time.",
        "sourceRef": {},
        "resolution": null
    });
    assert!(!validator.is_valid(&base), "an empty sourceRef is inadmissible");

    let mut with_resolution = base.clone();
    with_resolution["sourceRef"]["localResolutionId"] = json!("0198a7b3-9f8e-7d6c-5b4a-321098765432");
    assert!(validator.is_valid(&with_resolution));

    let mut with_task = base.clone();
    with_task["sourceRef"]["taskCorrelation"] = json!("corr-import-1");
    assert!(validator.is_valid(&with_task));
}

#[test]
fn resolution_lifecycle_goes_from_null_to_attached_without_rewriting() {
    let validator = validator();
    let mut evidence = read_json("examples/missing-asset.evidence.json");
    assert_eq!(evidence["resolution"], Value::Null);

    // A later fact satisfies the evidence: attach the resolution reference.
    evidence["resolution"] = json!({
        "resolvedAt": "2026-09-08T07:40:00.000Z",
        "resolutionRef": "0198a7c9-1122-7334-4556-677889900011"
    });
    assert!(
        validator.is_valid(&evidence),
        "attaching a resolution keeps the document valid"
    );

    // An attached resolution without its timestamp is inadmissible.
    let mut broken = evidence.clone();
    broken["resolution"] = json!({ "resolutionRef": "0198a7c9-1122-7334-4556-677889900011" });
    assert!(!validator.is_valid(&broken));
}

/// The reference semantics the Local Resolution document will carry once
/// recipe v0.3 freezes (core W20): the resolution carries evidenceIds[], the
/// bodies live here — the ids must match exactly, never inline the bodies.
#[test]
fn resolution_document_references_evidence_ids_not_bodies() {
    let missing = read_json("examples/missing-asset.evidence.json");
    let mismatch = read_json("examples/version-mismatch.evidence.json");

    // The prospective §5 shape (core W20 freezes the exact document): the
    // resolution result carries the ids; the bodies stay in this vocabulary.
    let resolution_view = json!({
        "localResolutionId": "0198a7b3-9f8e-7d6c-5b4a-321098765432",
        "evidenceIds": [missing["evidenceId"], mismatch["evidenceId"]],
        "fallbackUsed": false
    });
    let referenced_ids: Vec<&str> = resolution_view["evidenceIds"]
        .as_array()
        .unwrap()
        .iter()
        .map(|value| value.as_str().unwrap())
        .collect();

    for (body, view_id) in [
        (&missing, referenced_ids[0]),
        (&mismatch, referenced_ids[1]),
    ] {
        assert_eq!(body["evidenceId"].as_str().unwrap(), view_id);
        // The body carries what the reference must not: the honest detail.
        assert!(!body["detail"].as_str().unwrap().is_empty());
        assert!(resolution_view.get("detail").is_none(), "bodies are referenced, never inlined");
    }
}
