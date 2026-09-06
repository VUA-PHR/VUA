use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use vua_unity_bridge::publish_local_vpm_artifact;

static NEXT: AtomicU64 = AtomicU64::new(1);

#[test]
fn b3_local_vpm_publication_is_deterministic_and_never_overwrites() {
    let base = std::env::temp_dir().join(format!(
        "vua-vpm-artifact-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    let source = base.join("source");
    fs::create_dir_all(source.join("Runtime/Sub")).unwrap();
    fs::write(
        source.join("package.json"),
        "{\"name\":\"com.example.fixture\",\"version\":\"0.0.1\"}\n",
    )
    .unwrap();
    fs::write(source.join("Runtime/Sub/asset.txt"), "fixture").unwrap();
    let first =
        publish_local_vpm_artifact(&source, &base.join("out-a"), "com.example.fixture", "0.0.1")
            .unwrap();
    let second =
        publish_local_vpm_artifact(&source, &base.join("out-b"), "com.example.fixture", "0.0.1")
            .unwrap();
    assert_eq!(first.manifest_sha256, second.manifest_sha256);
    assert_eq!(first.tree_sha256, second.tree_sha256);
    assert_eq!(first.archive_sha256, second.archive_sha256);
    assert!(first.package_root.join("Runtime/Sub/asset.txt").is_file());
    assert!(publish_local_vpm_artifact(
        &source,
        &base.join("out-a"),
        "com.example.fixture",
        "0.0.1"
    )
    .is_err());
    fs::remove_dir_all(base).ok();
}
