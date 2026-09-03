use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use vua_orchestrator::LocalPackageIdentityStore;

static NEXT: AtomicU64 = AtomicU64::new(1);

#[test]
fn b3_visible_name_collisions_use_parenthesized_numbers_and_ids_stay_hidden_stable() {
    let root = std::env::temp_dir().join(format!(
        "vua-identity-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ));
    let first = root.join("a/Same Name");
    let second = root.join("b/Same Name");
    fs::create_dir_all(&first).unwrap();
    fs::create_dir_all(&second).unwrap();
    let store = LocalPackageIdentityStore::new(root.join("identities.json"));
    let one = store.resolve(&first, "Same Name").unwrap();
    let two = store.resolve(&second, "Same Name").unwrap();
    let repeated = store.resolve(&first, "Changed visible input").unwrap();
    assert_eq!(one.display_name, "Same Name");
    assert_eq!(two.display_name, "Same Name (2)");
    assert_ne!(one.package_id, two.package_id);
    assert_eq!(one, repeated);
    assert!(one.package_id.starts_with("com.ph-r.vua.local."));
    fs::remove_dir_all(root).ok();
}
