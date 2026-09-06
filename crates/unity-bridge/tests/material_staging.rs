
#[test]
fn staged_project_bundles_the_bridge_scaffold_by_default() {
    let temp = std::env::temp_dir().join(format!(
        "vua-staging-scaffold-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let staging = vua_unity_bridge::StagingProject::create(&temp, "sess", "token")
        .expect("staging creates");
    let packages = staging.root().join("Packages");

    // The production default must be able to execute Bridge commands: the
    // entry point package and the MA compile stub its asmdef references
    // are both present without any harness override.
    assert!(packages.join("com.ph-r.vua/package.json").is_file());
    assert!(
        packages
            .join("com.ph-r.vua/Editor/Bridge/BridgeEntryPoint.cs")
            .is_file()
    );
    assert!(packages.join("nadena.dev.modular-avatar.core/package.json").is_file());
    let stub: String =
        std::fs::read_to_string(packages.join("nadena.dev.modular-avatar.core/package.json")).unwrap();
    assert!(stub.contains("0.0.0-stub"));

    staging.destroy().unwrap();
    let _ = std::fs::remove_dir_all(&temp);
}
