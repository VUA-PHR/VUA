//! E-ENV integration tests: read-only environment detection against
//! synthetic roots, so no test depends on this machine's real installs.
//! Each test cites its ORC requirement (ORC-TST-006).

#![allow(clippy::result_large_err)]

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use vua_orchestrator::{
    env_error_codes, outcome_with_exit, CheckStatusV1, EnvironmentEngine, EnvironmentRoots,
    FakeProcessRunner, FixedClock, ProcessOutcome, Zone,
};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-env-{label}-{nanos}"))
}

fn synthetic_roots(base: &Path) -> EnvironmentRoots {
    EnvironmentRoots {
        steam_common: vec![base.join("steam/steamapps/common")],
        local_low: base.join("LocalLow"),
        unity_hub_exe: base.join("hub/Unity Hub.exe"),
        unity_editors_root: base.join("editors"),
        vrc_get_executable: "vrc-get".into(),
        disk_target: base.to_path_buf(),
        disk_warning_gib: 30.0,
        disk_error_gib: 10.0,
        network_probes: vec!["127.0.0.1:1".into()],
    }
}

fn engine_with(roots: EnvironmentRoots, runner: Arc<FakeProcessRunner>) -> EnvironmentEngine {
    EnvironmentEngine::new(
        runner,
        Arc::new(FixedClock::new(&["2026-08-30T09:00:00.000Z"])),
        roots,
    )
}

fn default_runner() -> Arc<FakeProcessRunner> {
    Arc::new(FakeProcessRunner::new())
}

fn find<'a>(
    items: &'a [vua_orchestrator::EnvironmentCheckItemV1],
    id: &str,
) -> &'a vua_orchestrator::EnvironmentCheckItemV1 {
    items
        .iter()
        .find(|item| item.id == id)
        .expect("check must exist")
}

#[test]
fn orc_wf_001_vrchat_detection_is_deterministic_for_present_and_missing() {
    let base = unique_dir("vrchat");
    let engine = engine_with(synthetic_roots(&base), default_runner());

    // Missing: a deterministic finding, not a detection error (验收 2).
    let items = engine.inspect_zone(Zone::Play);
    let vrchat = find(&items, "vrchat");
    assert_eq!(vrchat.status, CheckStatusV1::Error);
    assert_eq!(vrchat.title, "VRChat 本体");
    assert!(
        vrchat.error_code.is_none(),
        "missing is a finding, not a detection failure"
    );
    assert!(vrchat.description.contains("未找到 VRChat"));

    // Present: targeted path observation.
    let exe = base
        .join("steam/steamapps/common")
        .join("VRChat")
        .join("VRChat.exe");
    fs::create_dir_all(exe.parent().unwrap()).unwrap();
    fs::write(&exe, "binary").unwrap();
    let items = engine.inspect_zone(Zone::Play);
    let vrchat = find(&items, "vrchat");
    assert_eq!(vrchat.status, CheckStatusV1::Ok);
    assert_eq!(vrchat.facts["exe"], exe.to_string_lossy().to_string());
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn orc_wf_001_steamvr_absence_is_a_warning_not_a_blocker() {
    let base = unique_dir("steamvr");
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let items = engine.inspect_zone(Zone::Play);
    assert_eq!(find(&items, "steamvr").status, CheckStatusV1::Warning);

    fs::create_dir_all(base.join("steam/steamapps/common/SteamVR")).unwrap();
    let items = engine.inspect_zone(Zone::Play);
    let steamvr = find(&items, "steamvr");
    assert_eq!(steamvr.status, CheckStatusV1::Ok);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn orc_adp_006_network_probe_reports_deterministic_unreachability() {
    // 127.0.0.1:1 refuses connections quickly: the result is "unreachable"
    // with a stable shape. No test asserts that the real internet is up.
    let base = unique_dir("network");
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let items = engine.inspect_zone(Zone::Play);
    let network = find(&items, "network");
    assert_eq!(network.status, CheckStatusV1::Error);
    assert_eq!(network.error_code, None, "unreachable is a finding");
    assert_eq!(
        network.facts["unreachable"],
        serde_json::json!(["127.0.0.1:1"])
    );
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn orc_wf_001_unity_editors_enumerate_versions_and_ignore_junk() {
    let base = unique_dir("editors");
    let editors_root = base.join("editors");
    for version in ["2022.3.22f1", "2019.4.31f1", "not-a-version", "999.9"] {
        fs::create_dir_all(editors_root.join(version).join("Editor")).unwrap();
    }
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let items = engine.inspect_zone(Zone::Create);
    let editors = find(&items, "unity_editors");
    assert_eq!(editors.status, CheckStatusV1::Ok);
    assert_eq!(editors.facts["editors"].as_array().unwrap().len(), 2);
    assert_eq!(
        editors.facts["editors"][0]["version"], "2022.3.22f1",
        "sorted newest first"
    );

    // "999.9" has an Editor dir but no patch component → ignored.
    // Detection failure path: editors root is a file, not a directory.
    let base2 = unique_dir("editors-file");
    fs::create_dir_all(&base2).unwrap();
    fs::write(base2.join("editors"), "not a dir").unwrap();
    let engine = engine_with(synthetic_roots(&base2), default_runner());
    let items = engine.inspect_zone(Zone::Create);
    let editors = find(&items, "unity_editors");
    assert_eq!(editors.status, CheckStatusV1::Error);
    assert_eq!(
        editors.error_code.as_deref(),
        Some(env_error_codes::READ_FAILED),
        "a detection failure carries a stable code"
    );
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
    if base2.exists() {
        fs::remove_dir_all(&base2).unwrap();
    }
}

#[test]
fn orc_adp_003_vpm_cli_probe_maps_backend_failures_honestly() {
    let base = unique_dir("vpmcli");

    // Probe succeeds → ok with the version fact.
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(ProcessOutcome {
        exit_code: Some(0),
        timed_out: false,
        stdout: "vrc-get 1.9.2\n".into(),
        stderr: String::new(),
        truncated: false,
    }));
    let engine = engine_with(synthetic_roots(&base), runner);
    let items = engine.inspect_zone(Zone::Create);
    let vpm = find(&items, "vpm_cli");
    assert_eq!(vpm.status, CheckStatusV1::Ok);
    assert_eq!(vpm.facts["version"], "vrc-get 1.9.2");

    // Spawn failure (binary absent) → normal missing finding, no error code.
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Err("binary absent".into()));
    let engine = engine_with(synthetic_roots(&base), runner);
    let items = engine.inspect_zone(Zone::Create);
    let vpm = find(&items, "vpm_cli");
    assert_eq!(vpm.status, CheckStatusV1::Error);
    assert_eq!(vpm.error_code, None);
    assert!(vpm.description.contains("未找到"));

    // Timed-out probe → detection failure with a stable code.
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(ProcessOutcome {
        exit_code: None,
        timed_out: true,
        stdout: String::new(),
        stderr: String::new(),
        truncated: false,
    }));
    let engine = engine_with(synthetic_roots(&base), runner);
    let items = engine.inspect_zone(Zone::Create);
    let vpm = find(&items, "vpm_cli");
    assert_eq!(vpm.status, CheckStatusV1::Error);
    assert_eq!(
        vpm.error_code.as_deref(),
        Some(env_error_codes::PROBE_FAILED)
    );

    // Non-zero exit without timeout → normal missing finding.
    let runner = Arc::new(FakeProcessRunner::new());
    runner.push(Ok(outcome_with_exit(1, "")));
    let engine = engine_with(synthetic_roots(&base), runner);
    let items = engine.inspect_zone(Zone::Create);
    let vpm = find(&items, "vpm_cli");
    assert_eq!(vpm.status, CheckStatusV1::Error);
    assert_eq!(vpm.error_code, None);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[cfg(windows)]
#[test]
fn orc_env_disk_space_reads_real_free_bytes_via_kernel32() {
    let base = unique_dir("disk");
    fs::create_dir_all(&base).unwrap();
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let items = engine.inspect_zone(Zone::Create);
    let disk = find(&items, "disk_space");
    assert_eq!(disk.status, CheckStatusV1::Ok);
    let free = disk.facts["freeBytes"].as_u64().expect("freeBytes fact");
    assert!(free > 0, "a normal machine has free space: {free}");
    assert!(disk.facts["totalBytes"].as_u64().unwrap() >= free);
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[cfg(not(windows))]
#[test]
fn orc_env_disk_space_reports_unsupported_platform_honestly() {
    let base = unique_dir("disk");
    fs::create_dir_all(&base).unwrap();
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let items = engine.inspect_zone(Zone::Create);
    let disk = find(&items, "disk_space");
    assert_eq!(disk.status, CheckStatusV1::Error);
    assert_eq!(
        disk.error_code.as_deref(),
        Some(env_error_codes::UNSUPPORTED_PLATFORM)
    );
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn orc_env_disk_thresholds_make_conclusions_deterministic() {
    // Enormous error threshold forces the error branch on any machine.
    let base = unique_dir("disk-threshold");
    fs::create_dir_all(&base).unwrap();
    let mut roots = synthetic_roots(&base);
    roots.disk_error_gib = f64::MAX / (1024.0 * 1024.0 * 1024.0);
    roots.disk_warning_gib = roots.disk_error_gib;
    let engine = engine_with(roots, default_runner());
    #[cfg(windows)]
    {
        let items = engine.inspect_zone(Zone::Create);
        let disk = find(&items, "disk_space");
        assert_eq!(disk.status, CheckStatusV1::Error);
    }
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn orc_ipc_002_full_snapshot_has_all_checks_with_stable_ids_and_zones() {
    let base = unique_dir("all");
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let snapshot = engine.inspect_all();
    assert_eq!(snapshot.schema_version, 1);
    assert_eq!(snapshot.captured_at, "2026-08-30T09:00:00.000Z");

    let ids: Vec<&str> = snapshot.items.iter().map(|item| item.id.as_str()).collect();
    assert_eq!(
        ids,
        vec![
            "vrchat",
            "steamvr",
            "network",
            "unity_hub",
            "unity_editors",
            "vpm_cli",
            "disk_space"
        ]
    );
    for item in &snapshot.items {
        assert_eq!(item.schema_version, 1);
        assert!(!item.title.is_empty());
        assert!(!item.description.is_empty());
        let expected_zone = matches!(item.id.as_str(), "vrchat" | "steamvr" | "network");
        assert_eq!(
            item.zone == Zone::Play,
            expected_zone,
            "{} must sit in the right zone",
            item.id
        );
    }
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

#[test]
fn orc_wf_001_inspection_writes_nothing_to_the_observed_roots() {
    let base = unique_dir("readonly");
    let exe = base.join("steam/steamapps/common/VRChat/VRChat.exe");
    fs::create_dir_all(exe.parent().unwrap()).unwrap();
    fs::write(&exe, "binary").unwrap();
    fs::create_dir_all(base.join("steam/steamapps/common/SteamVR")).unwrap();
    fs::create_dir_all(base.join("editors/2022.3.22f1/Editor")).unwrap();
    fs::create_dir_all(base.join("hub")).unwrap();
    fs::write(base.join("hub/Unity Hub.exe"), "hub").unwrap();

    let fingerprint_before = tree_fingerprint(&base);
    let engine = engine_with(synthetic_roots(&base), default_runner());
    let _ = engine.inspect_all();
    let fingerprint_after = tree_fingerprint(&base);
    assert_eq!(
        fingerprint_before, fingerprint_after,
        "inspect must be strictly read-only (ORC-WF-001)"
    );
    if base.exists() {
        fs::remove_dir_all(&base).unwrap();
    }
}

fn tree_fingerprint(root: &Path) -> Vec<(String, u64)> {
    let mut entries: Vec<(String, u64)> = Vec::new();
    fn walk(root: &Path, prefix: &Path, entries: &mut Vec<(String, u64)>) {
        for entry in fs::read_dir(root.join(prefix)).unwrap().flatten() {
            let relative = prefix.join(entry.file_name());
            if entry.file_type().unwrap().is_dir() {
                walk(root, &relative, entries);
            } else {
                let size = entry.metadata().map(|metadata| metadata.len()).unwrap_or(0);
                entries.push((relative.to_string_lossy().into_owned(), size));
            }
        }
    }
    walk(root, Path::new(""), &mut entries);
    entries.sort();
    entries
}

// --- manual smoke against this machine (E-ENV acceptance) ---

/// E-ENV manual acceptance (agile plan): prints the default-root snapshot of
/// THIS machine so a human can compare each finding against reality. Never
/// runs in CI (depends on the real desktop environment and network):
///
///   cargo test -p vua-orchestrator --test environment manual_real -- --ignored --nocapture
#[test]
#[ignore = "manual acceptance only: compares findings against this real machine"]
fn manual_real_machine_environment_snapshot() {
    let engine = EnvironmentEngine::new(
        Arc::new(vua_orchestrator::StdProcessRunner),
        Arc::new(vua_orchestrator::SystemClock),
        EnvironmentRoots::default(),
    );
    let snapshot = engine.inspect_all();
    for item in &snapshot.items {
        println!(
            "[{:>6}] {} — {} — {}{}",
            format!("{:?}", item.status).to_uppercase(),
            item.title,
            item.description,
            item.facts,
            item.error_code
                .as_ref()
                .map(|code| format!(" (code: {code})"))
                .unwrap_or_default(),
        );
    }
}
