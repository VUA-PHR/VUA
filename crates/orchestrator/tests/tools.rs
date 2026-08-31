//! E-TOOLS integration tests: registry-driven discovery over synthetic
//! roots, so no test depends on this machine. Each test cites its ORC
//! requirement (ORC-TST-006).

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use vua_orchestrator::{
    registry_ids, FakeProcessRunner, ProcessOutcome, ToolCardV1, ToolsEngine, ToolsRoots,
};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-tools-{label}-{nanos}"))
}

fn synthetic_roots(base: &std::path::Path) -> ToolsRoots {
    ToolsRoots {
        steam_common: vec![base.join("steam/steamapps/common")],
        local_app_data: base.join("LocalAppData"),
        extra_search_roots: vec![],
    }
}

fn engine_with(roots: ToolsRoots, runner: Arc<FakeProcessRunner>) -> ToolsEngine {
    ToolsEngine::new(runner, roots)
}

fn default_runner() -> Arc<FakeProcessRunner> {
    Arc::new(FakeProcessRunner::new())
}

/// A runner whose command probe fails: the tool binary is absent.
fn absent_runner() -> Arc<FakeProcessRunner> {
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Err("binary absent".into()));
    runner
}

fn find<'a>(cards: &'a [ToolCardV1], id: &str) -> &'a ToolCardV1 {
    cards
        .iter()
        .find(|card| card.id == id)
        .expect("registered tool must be reported")
}

#[test]
fn orc_adp_007_registry_is_the_only_source_and_cards_carry_the_four_elements() {
    assert_eq!(
        registry_ids(),
        vec![
            "openvr-space-calibrator",
            "vrcface-tracking",
            "openvr-input-emulator",
            "vrc-get",
        ]
    );
    let base = unique_dir("empty");
    fs::create_dir_all(&base).unwrap();
    let engine = engine_with(synthetic_roots(&base), absent_runner());
    let cards = engine.inspect();

    assert_eq!(cards.len(), 4, "exactly the registered tools, nothing else");
    for card in &cards {
        assert_eq!(card.schema_version, 1);
        assert!(!card.name.is_empty());
        assert!(!card.purpose.is_empty(), "四要素: purpose");
        assert!(!card.data_destination.is_empty(), "四要素: dataDestination");
        assert!(!card.maintainer.is_empty(), "四要素: maintainer");
        assert!(card.homepage.starts_with("https://"));
        // Nothing installed on synthetic roots: deterministic findings.
        assert!(!card.installed, "{} must be absent", card.id);
    }
    fs::remove_dir_all(&base).ok();
}

#[test]
fn orc_tst_002_owner_supplied_homepages_are_frozen() {
    let base = unique_dir("homepages");
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let cards = engine.inspect();
    assert_eq!(
        find(&cards, "openvr-space-calibrator").homepage,
        "https://github.com/pushrax/OpenVR-SpaceCalibrator"
    );
    assert_eq!(
        find(&cards, "vrcface-tracking").homepage,
        "https://store.steampowered.com/app/3329480/VRCFaceTracking/"
    );
    assert_eq!(
        find(&cards, "openvr-input-emulator").homepage,
        "https://github.com/matzman666/OpenVR-InputEmulator"
    );
    assert_eq!(
        find(&cards, "vrc-get").homepage,
        "https://github.com/vrc-get/vrc-get"
    );
    fs::remove_dir_all(&base).ok();
}

#[test]
fn orc_wf_001_steamvr_driver_probes_are_deterministic() {
    let base = unique_dir("drivers");
    let drivers = base.join("steam/steamapps/common/SteamVR/drivers");
    fs::create_dir_all(drivers.join("OpenVR-InputEmulator")).unwrap();

    let engine = engine_with(synthetic_roots(&base), default_runner());
    let cards = engine.inspect();
    let emulator = find(&cards, "openvr-input-emulator");
    assert!(emulator.installed);
    assert!(emulator.facts["foundPaths"]
        .as_array()
        .unwrap()
        .iter()
        .any(|path| path.as_str().unwrap().ends_with("OpenVR-InputEmulator")));

    // SpaceCalibrator stays absent on this synthetic machine, with the
    // portable-build boundary noted on the card (社区版绿色单文件).
    let calibrator = find(&cards, "openvr-space-calibrator");
    assert!(!calibrator.installed);
    assert!(calibrator.facts["portableNote"]
        .as_str()
        .unwrap()
        .contains("绿色单文件"));
    fs::remove_dir_all(&base).ok();
}

#[test]
fn orc_adp_003_command_probe_maps_backend_failures_honestly() {
    let base = unique_dir("cmd");

    // Probe succeeds → installed with the version fact.
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(ProcessOutcome {
        exit_code: Some(0),
        timed_out: false,
        stdout: "vrc-get 1.9.2\n".into(),
        stderr: String::new(),
        truncated: false,
    }));
    let engine = engine_with(synthetic_roots(&base), runner);
    let cards = engine.inspect();
    let vrc_get = find(&cards, "vrc-get");
    assert!(vrc_get.installed);
    assert_eq!(vrc_get.facts["version"], "vrc-get 1.9.2");

    // Binary absent → deterministic "not installed", never an error state.
    let engine = engine_with(synthetic_roots(&base), absent_runner());
    let cards = engine.inspect();
    let vrc_get = find(&cards, "vrc-get");
    assert!(!vrc_get.installed);
    let probed = vrc_get.facts["probed"].as_array().unwrap();
    assert_eq!(probed[0]["available"], false);
    fs::remove_dir_all(&base).ok();
}

#[test]
fn orc_adp_007_extra_roots_surface_portable_builds_without_default_scans() {
    // A portable SpaceCalibrator build dropped in a user-chosen folder is
    // found only through that folder — VUA never scans the desktop on its
    // own (targeted observation only).
    let base = unique_dir("portable");
    let tools_folder = base.join("my-tools");
    fs::create_dir_all(&tools_folder).unwrap();
    fs::write(tools_folder.join("OpenVR-SpaceCalibrator.exe"), "binary").unwrap();

    let mut roots = synthetic_roots(&base);
    assert!(roots.extra_search_roots.is_empty(), "no default scan roots");
    roots.extra_search_roots = vec![tools_folder.clone()];
    let engine = engine_with(roots, default_runner());
    let cards = engine.inspect();
    let calibrator = find(&cards, "openvr-space-calibrator");
    assert!(calibrator.installed);
    assert!(calibrator.facts["foundPaths"]
        .as_array()
        .unwrap()
        .iter()
        .any(|path| path
            .as_str()
            .unwrap()
            .ends_with("OpenVR-SpaceCalibrator.exe")));
    fs::remove_dir_all(&base).ok();
}

// --- manual smoke against this machine (E-TOOLS acceptance) ---

/// E-TOOLS manual acceptance: prints this machine's tool cards for human
/// comparison. Portable tool folders can be injected without touching the
/// repository (e.g. a community SpaceCalibrator build on the desktop):
///
///   VUA_TOOLS_EXTRA_ROOTS="C:/some/folder" \
///     cargo test -p vua-orchestrator --test tools manual_real -- --ignored --nocapture
#[test]
#[ignore = "manual acceptance only: compares findings against this real machine"]
fn manual_real_machine_tool_cards() {
    let mut roots = ToolsRoots::default();
    if let Ok(extra) = std::env::var("VUA_TOOLS_EXTRA_ROOTS") {
        roots.extra_search_roots = std::env::split_paths(&extra).collect();
    }
    let engine = ToolsEngine::new(Arc::new(vua_orchestrator::StdProcessRunner), roots);
    for card in engine.inspect() {
        println!(
            "[{:>8}] {} — installed: {} — {}{}\n    homepage: {}\n    facts: {}",
            card.category,
            card.name,
            card.installed,
            card.purpose,
            card.facts["version"]
                .as_str()
                .map(|version| format!("（{version}）"))
                .unwrap_or_default(),
            card.homepage,
            card.facts,
        );
    }
}
