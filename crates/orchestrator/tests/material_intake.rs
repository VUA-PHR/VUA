use flate2::write::GzEncoder;
use flate2::Compression;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tar::{Builder, Header};
use vua_orchestrator::{
    MaterialEntryMode, MaterialIntakeEngine, RiskDecisionChoice, RiskDecisionV01,
};

static NEXT: AtomicU64 = AtomicU64::new(1);

fn temp_dir(label: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!(
        "vua-b3-{label}-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    fs::create_dir_all(&path).unwrap();
    path
}

fn append(builder: &mut Builder<GzEncoder<fs::File>>, path: &str, bytes: &[u8]) {
    let mut header = Header::new_gnu();
    header.set_size(bytes.len() as u64);
    header.set_mode(0o644);
    header.set_cksum();
    builder.append_data(&mut header, path, bytes).unwrap();
}

fn unitypackage(path: &Path, assets: &[&str]) {
    let file = fs::File::create(path).unwrap();
    let encoder = GzEncoder::new(file, Compression::default());
    let mut builder = Builder::new(encoder);
    for (index, asset) in assets.iter().enumerate() {
        append(
            &mut builder,
            &format!("guid{index}/pathname"),
            asset.as_bytes(),
        );
        append(&mut builder, &format!("guid{index}/asset"), b"fixture");
    }
    builder.into_inner().unwrap().finish().unwrap();
}

#[test]
fn b3_folder_batch_includes_every_unitypackage_and_binds_one_risk_decision() {
    let root = temp_dir("all-packages").join("Cute Outfit");
    fs::create_dir_all(root.join("variants")).unwrap();
    unitypackage(
        &root.join("base.unitypackage"),
        &["Assets/Outfit/base.prefab"],
    );
    unitypackage(
        &root.join("variants/extra.unitypackage"),
        &["Assets/Outfit/Editor/Setup.cs", "Assets/Outfit/plugin.dll"],
    );

    let engine = MaterialIntakeEngine;
    let inspection = engine.inspect_folder(&root, "corr-inspect").unwrap();
    assert_eq!(inspection.display_name, "Cute Outfit");
    assert_eq!(inspection.packages.len(), 2);
    assert_eq!(inspection.packages[0].relative_path, "base.unitypackage");
    assert_eq!(
        inspection.packages[1].relative_path,
        "variants/extra.unitypackage"
    );
    assert!(inspection.executable_risks.len() >= 3);

    let plan = engine
        .plan(
            MaterialEntryMode::LocalReusableVpm,
            "project-1",
            "sha256:project",
            inspection.clone(),
            "corr-plan",
        )
        .unwrap();
    assert!(plan.risk_decision_required);
    let schema_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../schemas/amf-production/v0.1/material-plan.schema.json");
    let schema: serde_json::Value =
        serde_json::from_slice(&fs::read(schema_path).unwrap()).unwrap();
    let validator = jsonschema::validator_for(&schema).unwrap();
    let plan_value = serde_json::to_value(&plan).unwrap();
    let errors = validator
        .iter_errors(&plan_value)
        .map(|error| error.to_string())
        .collect::<Vec<_>>();
    assert!(errors.is_empty(), "{errors:?}");
    let missing = engine
        .confirm(
            &plan,
            &plan.plan_hash,
            RiskDecisionV01 {
                choice: RiskDecisionChoice::NotRequired,
                source_fingerprint: inspection.source_fingerprint.clone(),
                risk_fingerprint: inspection.risk_fingerprint.clone(),
                remember_for_session: false,
            },
            "2026-09-03T00:00:00Z",
            "corr-confirm",
        )
        .unwrap_err();
    assert_eq!(missing.code, "vua.material.risk_decision_required");

    let confirmation = engine
        .confirm(
            &plan,
            &plan.plan_hash,
            RiskDecisionV01 {
                choice: RiskDecisionChoice::SnapshotAndContinue,
                source_fingerprint: inspection.source_fingerprint.clone(),
                risk_fingerprint: inspection.risk_fingerprint.clone(),
                remember_for_session: true,
            },
            "2026-09-03T00:00:00Z",
            "corr-confirm",
        )
        .unwrap();
    assert_eq!(confirmation.plan.source.packages.len(), 2);
    assert!(confirmation.snapshot_scopes().contains(&"UserSettings"));
    fs::remove_dir_all(root.parent().unwrap()).ok();
}

#[test]
fn b3_source_or_inventory_drift_invalidates_confirmation() {
    let base = temp_dir("drift");
    let root = base.join("Asset Folder");
    fs::create_dir_all(&root).unwrap();
    unitypackage(&root.join("asset.unitypackage"), &["Assets/Asset.prefab"]);
    let engine = MaterialIntakeEngine;
    let inspected = engine.inspect_folder(&root, "corr").unwrap();

    unitypackage(
        &root.join("asset.unitypackage"),
        &["Assets/Asset.prefab", "Assets/Editor/New.cs"],
    );
    let error = engine
        .verify_source_unchanged(&root, &inspected, "corr")
        .unwrap_err();
    assert_eq!(error.code, "vua.material.source_drift");
    fs::remove_dir_all(base).ok();
}

#[test]
fn b3_direct_and_vpm_plans_have_distinct_mutation_paths() {
    let base = temp_dir("modes");
    let root = base.join("Asset");
    fs::create_dir_all(&root).unwrap();
    unitypackage(&root.join("asset.unitypackage"), &["Assets/Asset.prefab"]);
    let engine = MaterialIntakeEngine;
    let source = engine.inspect_folder(&root, "corr").unwrap();
    let direct = engine
        .plan(
            MaterialEntryMode::DirectUnityPackage,
            "project",
            "project-fingerprint",
            source.clone(),
            "corr",
        )
        .unwrap();
    let vpm = engine
        .plan(
            MaterialEntryMode::LocalReusableVpm,
            "project",
            "project-fingerprint",
            source,
            "corr",
        )
        .unwrap();
    assert_ne!(direct.plan_hash, vpm.plan_hash);
    assert_eq!(
        direct
            .steps
            .iter()
            .filter(|step| step.mutates_target_project)
            .count(),
        1
    );
    assert_eq!(
        vpm.steps
            .iter()
            .filter(|step| step.mutates_target_project)
            .count(),
        1
    );
    fs::remove_dir_all(base).ok();
}
