//! Environment snapshot wire tests (BG-16 wiring): the
//! `environment.getSnapshot` handler consumes the real detection engine
//! (`EnvironmentEngine::inspect_all()`) over synthetic roots — the items
//! ARE the frozen check vocabulary (checkId/zone/presence/errorCode/facts),
//! and without the environment configuration the snapshot answers the
//! honest empty items list (never a fabricated probe result).

use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use serde_json::{json, Value};
use vua_orchestrator::{EnvironmentRoots, FakeRegistrySource};
use vua_provider_host::{run_provider_host_full, EnvironmentConfig};

fn unique_root(label: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "vua-env-snapshot-{label}-{}-{nanos}",
        std::process::id()
    ));
    std::fs::create_dir_all(&dir).expect("root creates");
    dir
}

/// Synthetic probe targets (mirrors the orchestrator environment-suite
/// synthetic tree): nothing real is probed, every absence is a normal
/// finding, and the fake editors root carries one complete install.
fn synthetic_roots(base: &Path) -> EnvironmentRoots {
    EnvironmentRoots {
        steam_common: vec![base.join("steam/steamapps/common")],
        local_low: base.join("LocalLow"),
        unity_hub_exe: base.join("hub/Unity Hub.exe"),
        unity_editors_root: base.join("editors"),
        vrc_get_executable: "vrc-get".into(),
        disk_target: base.to_path_buf(),
        network_probes: vec!["127.0.0.1:1".into()],
        registry: Arc::new(FakeRegistrySource::new()),
        steam_install_candidates: vec![base.join("steam")],
        vr_runtime_roots: vua_orchestrator::VrRuntimeRoots {
            oculus: vec![base.join("vr/Oculus")],
            pico: vec![base.join("vr/PICO Connect")],
            vive: vec![base.join("vr/VIVE")],
            virtual_desktop: vec![base.join("vr/VirtualDesktop")],
            alvr: vec![base.join("vr/alvr")],
        },
        vcc_settings_candidates: vec![base.join("vcc/settings.json")],
    }
}

fn run_snapshot(database: &Path, environment: Option<EnvironmentConfig>) -> Value {
    let frame = json!({
        "frameVersion": "0.1",
        "frameId": "frame-env",
        "kind": "request",
        "payload": {
            "contractVersion": "0.1",
            "requestId": "req-env",
            "correlationId": "corr-env",
            "kind": "query",
            "method": "environment.getSnapshot",
            "params": {},
        },
    });
    let mut output = Vec::new();
    run_provider_host_full(
        Cursor::new(format!("{frame}\n")),
        &mut output,
        database,
        None,
        None,
        None,
        None,
        None,
        environment,
        None,
        None,
    )
    .expect("frame loop runs");
    let frames: Vec<Value> = String::from_utf8(output)
        .expect("output is UTF-8")
        .lines()
        .map(|line| serde_json::from_str(line).expect("output lines are frames"))
        .collect();
    // The frozen snapshot document travels inside the response value.
    frames[0]["payload"]["value"].clone()
}

#[test]
fn environment_snapshot_consumes_the_real_detection_engine() {
    let base = unique_root("synthetic");
    let roots = synthetic_roots(&base);
    // One complete editor install under the synthetic editors root.
    std::fs::create_dir_all(roots.unity_editors_root.join("2022.3.22f1").join("Editor"))
        .expect("fake editor layout");

    let database = base.join("tasks.sqlite");
    let payload = run_snapshot(
        &database,
        Some(EnvironmentConfig {
            roots,
            vcc_settings_candidates: vec![base.join("vcc/settings.json")],
        }),
    );

    // The envelope keeps the application-contract face the desktop
    // consumes (contractVersion/revision/capturedAt/items).
    assert_eq!(payload["contractVersion"], "0.1");
    assert!(payload["revision"].is_u64());
    assert!(payload["capturedAt"].is_string());

    // The items ARE the engine output: both zones ran, every item carries
    // the frozen check vocabulary, and the synthetic editor install is
    // honestly detected.
    let items = payload["items"].as_array().expect("items array");
    assert!(!items.is_empty(), "synthetic roots must produce findings");
    for item in items {
        // The engine's own serde shape (EnvironmentCheckItemV01): each
        // item carries its schemaVersion, the stable check id, the zone,
        // the presence enum, and the engineering facts object.
        assert!(item["id"].is_string(), "id: {item}");
        assert!(item["zone"].is_string(), "zone: {item}");
        assert!(item["presence"].is_string(), "presence: {item}");
        assert!(item["facts"].is_object(), "facts: {item}");
    }
    let ids: Vec<&str> = items
        .iter()
        .map(|item| item["id"].as_str().expect("id"))
        .collect();
    assert!(ids.contains(&"unity_editors"), "editors check ran: {ids:?}");
    assert!(ids.contains(&"steam"), "steam check ran: {ids:?}");
    assert!(ids.contains(&"network"), "network check ran: {ids:?}");
    assert!(ids.contains(&"disk_space"), "disk check ran: {ids:?}");
    let editors = items
        .iter()
        .find(|item| item["id"] == "unity_editors")
        .expect("unity_editors item");
    assert_eq!(editors["presence"], "detected");
}

#[test]
fn environment_snapshot_without_wiring_is_the_honest_empty() {
    let root = unique_root("unwired");
    let database = root.join("tasks.sqlite");

    // Without the environment configuration the detection face is not
    // wired: the empty items list is the honest empty (frozen by the B6
    // spike — an empty list is never a ready verdict), never a fabricated
    // probe result.
    let payload = run_snapshot(&database, None);
    assert_eq!(payload["contractVersion"], "0.1");
    assert_eq!(payload["items"], json!([]));
    assert!(payload["capturedAt"].is_string());
}
