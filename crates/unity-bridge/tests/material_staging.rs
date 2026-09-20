
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

    // Every Bridge source and GUID must reach staging, including helper files
    // referenced by the entry point/processor. A partial package cannot compile.
    let source = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../unity/Packages/com.ph-r.vua/Editor/Bridge");
    for entry in std::fs::read_dir(source).unwrap() {
        let path = entry.unwrap().path();
        if path.is_file() {
            let bundled = packages.join("com.ph-r.vua/Editor/Bridge").join(path.file_name().unwrap());
            assert_eq!(std::fs::read(&bundled).expect("complete Bridge scaffold"),
                std::fs::read(&path).unwrap(), "{}", bundled.display());
        }
    }

    staging.destroy().unwrap();
    let _ = std::fs::remove_dir_all(&temp);
}
