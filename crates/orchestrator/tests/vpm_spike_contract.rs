use std::path::PathBuf;

#[test]
fn b3_spike_result_fixture_conforms_to_versioned_schema() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let schema: serde_json::Value = serde_json::from_slice(
        &std::fs::read(root.join("schemas/vpm-package-spike/v0.1/result.schema.json")).unwrap(),
    )
    .unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    for name in ["result.valid.json", "risk-decision-required.valid.json"] {
        let fixture: serde_json::Value = serde_json::from_slice(
            &std::fs::read(
                root.join("schemas/vpm-package-spike/v0.1/fixtures")
                    .join(name),
            )
            .unwrap(),
        )
        .unwrap();
        let errors: Vec<_> = validator.iter_errors(&fixture).collect();
        assert!(errors.is_empty(), "{name}: {errors:#?}");
    }
}

#[test]
#[ignore = "manual local evidence paths are supplied through VUA_SPIKE_RESULTS"]
fn manual_local_spike_results_conform_to_versioned_schema() {
    let paths = std::env::var_os("VUA_SPIKE_RESULTS").expect("VUA_SPIKE_RESULTS is required");
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let schema: serde_json::Value = serde_json::from_slice(
        &std::fs::read(root.join("schemas/vpm-package-spike/v0.1/result.schema.json")).unwrap(),
    )
    .unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    for path in std::env::split_paths(&paths) {
        let fixture: serde_json::Value =
            serde_json::from_slice(&std::fs::read(&path).unwrap()).unwrap();
        let errors: Vec<_> = validator.iter_errors(&fixture).collect();
        assert!(errors.is_empty(), "{}: {errors:#?}", path.display());
    }
}
