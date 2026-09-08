//! M6 EAC package (proposal 006 R2/R3) tests: the allowlist data face and
//! the candidate re-verification primitive. The allowlist loader runs on
//! the frozen schema fixtures + negative documents; verification runs on
//! synthetic process fixtures (R8) with the honestly-Refused v0.1
//! signature state asserted; the real-machine re-verification is the
//! explicitly ignored manual test.

use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use vua_project_manager::{
    find_entry, load_allowlist, path_pattern_matches, verify_candidate, AllowlistEntryV01,
    ProcessSnapshotSource, SignatureState, Verdict, EAC_ALLOWLIST_SCHEMA_VERSION,
};

fn unique_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    std::env::temp_dir().join(format!("vua-eac-allowlist-{label}-{nanos}"))
}

fn cleanup(base: &Path) {
    if base.exists() {
        fs::remove_dir_all(base).unwrap();
    }
}

fn read_repo_json(relative: &str) -> Value {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let path = Path::new(manifest_dir).join("../..").join(relative);
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}

fn allowlist_validator() -> jsonschema::Validator {
    jsonschema::validator_for(&read_repo_json(
        "schemas/eac-allowlist/v0.1/allowlist.schema.json",
    ))
    .unwrap()
}

fn violations(validator: &jsonschema::Validator, instance: &Value) -> Vec<String> {
    validator
        .iter_errors(instance)
        .map(|error| format!("{}: {error}", error.instance_path()))
        .collect()
}

fn entry(name: &str) -> AllowlistEntryV01 {
    AllowlistEntryV01 {
        process_name: name.to_owned(),
        expected_path_pattern: "C:\\Program Files (x86)\\EasyAntiCheat\\".to_owned(),
        publisher_evidence: "Signer: Easy Anti-Cheat Pty Ltd (verified)".to_owned(),
        reason: "residual user-mode loader".to_owned(),
        evidence_ref: "real-machine pack".to_owned(),
        added_at: "2026-09-09T00:00:00.000Z".to_owned(),
        release_notes: "v0.8.0".to_owned(),
    }
}

#[test]
fn allowlist_fixtures_are_schema_valid_and_loader_accepted() {
    for name in ["allowlist.empty.json", "allowlist.example-entry.json"] {
        let fixture = read_repo_json(&format!(
            "schemas/eac-allowlist/v0.1/fixtures/{name}"
        ));
        let problems = violations(&allowlist_validator(), &fixture);
        assert!(problems.is_empty(), "{name}: {problems:#?}");

        let serialized = serde_json::to_string_pretty(&fixture).unwrap();
        let loaded = load_allowlist(&serialized)
            .unwrap_or_else(|error| panic!("{name}: loader refused: {:?}", error));
        assert_eq!(loaded.schema_version, EAC_ALLOWLIST_SCHEMA_VERSION);
    }

    // The empty list is the designed initial state.
    let empty = load_allowlist(
        &serde_json::to_string(&json!({
            "schemaVersion": EAC_ALLOWLIST_SCHEMA_VERSION,
            "entries": [],
        }))
        .unwrap(),
    )
    .unwrap();
    assert!(empty.entries.is_empty());
    assert!(find_entry(&empty, "easyanticheat.exe").is_none());

    cleanup(&unique_dir("unused"));
}

#[test]
fn half_valid_entries_are_load_errors_never_weakened_entries() {
    let base = json!({
        "schemaVersion": EAC_ALLOWLIST_SCHEMA_VERSION,
        "entries": [serde_json::to_value(entry("easyanticheat.exe")).unwrap()],
    });

    // Missing a required element (the reason — R2 element 4).
    let mut broken = base.clone();
    broken["entries"][0]
        .as_object_mut()
        .unwrap()
        .remove("reason");
    let text = serde_json::to_string(&broken).unwrap();
    let error = load_allowlist(&text).unwrap_err();
    assert_eq!(error.code, "vua.eac_allowlist.element_incomplete");

    // Non-lower-case name.
    let mut broken = base.clone();
    broken["entries"][0]["processName"] = json!("EasyAntiCheat.exe");
    let error = load_allowlist(&serde_json::to_string(&broken).unwrap()).unwrap_err();
    assert_eq!(error.code, "vua.eac_allowlist.name_not_lower_case");

    // Wildcard pattern.
    let mut broken = base.clone();
    broken["entries"][0]["expectedPathPattern"] = json!("C:\\**\\EasyAntiCheat\\");
    let error = load_allowlist(&serde_json::to_string(&broken).unwrap()).unwrap_err();
    assert_eq!(error.code, "vua.eac_allowlist.pattern_invalid");

    // Wrong schema version.
    let mut broken = base;
    broken["schemaVersion"] = json!("vua.eac-allowlist/v0.2");
    let error = load_allowlist(&serde_json::to_string(&broken).unwrap()).unwrap_err();
    assert_eq!(error.code, "vua.eac_allowlist.schema_version_mismatch");

    cleanup(&unique_dir("unused"));
}

#[test]
fn path_patterns_match_case_insensitively_prefix_or_literal() {
    // Prefix pattern (ends with a separator), case-insensitive.
    assert_eq!(
        path_pattern_matches(
            "C:\\Program Files (x86)\\EasyAntiCheat\\",
            "c:\\program files (x86)\\easyanticheat\\easyanticheat.exe"
        ),
        Some(())
    );
    // A lookalike prefix must not match.
    assert_eq!(
        path_pattern_matches(
            "C:\\Program Files (x86)\\EasyAntiCheat\\",
            "c:\\program files (x86)\\easyanticheat_evil\\easyanticheat.exe"
        ),
        None
    );
    // Literal full-path pattern matches exactly (case-insensitive).
    assert_eq!(
        path_pattern_matches(
            "C:\\Tools\\cleanup.exe",
            "c:\\tools\\CLEANUP.EXE"
        ),
        Some(())
    );
    assert_eq!(
        path_pattern_matches("C:\\Tools\\cleanup.exe", "C:\\Tools\\other.exe"),
        None
    );
}

struct FixtureSource {
    entries: Vec<vua_project_manager::ProcessEntry>,
}

impl vua_project_manager::ProcessSnapshotSource for FixtureSource {
    fn snapshot(&self) -> std::io::Result<Vec<vua_project_manager::ProcessEntry>> {
        Ok(self.entries.clone())
    }
}

fn snapshot_entry(pid: u32, name: &str, path: Option<&str>) -> vua_project_manager::ProcessEntry {
    vua_project_manager::ProcessEntry {
        image_name: name.to_owned(),
        pid,
        path: path.map(str::to_owned),
    }
}

#[test]
fn verification_refuses_when_the_signature_check_fails() {
    let allowlist = load_allowlist(
        &serde_json::to_string(&json!({
            "schemaVersion": EAC_ALLOWLIST_SCHEMA_VERSION,
            "entries": [serde_json::to_value(entry("easyanticheat.exe")).unwrap()],
        }))
        .unwrap(),
    )
    .unwrap();
    let entry = find_entry(&allowlist, "easyanticheat.exe").unwrap();

    // The candidate still exists, the name matches, and the snapshot
    // carries the path (so no OS query is needed): name + path pass, but
    // the v0.1 signature state is honestly Unverified → Refused.
    let source = FixtureSource {
        entries: vec![snapshot_entry(
            39_012,
            "easyanticheat.exe",
            Some("C:\\Program Files (x86)\\EasyAntiCheat\\EasyAntiCheat.exe"),
        )],
    };
    let report = verify_candidate(39_012, entry, &source);
    assert_eq!(report.verdict, Verdict::Refused);
    assert_eq!(report.signature_state, SignatureState::Unverified);
    let name_check = report
        .checks
        .iter()
        .find(|check| check.code == "vua.eac_verify.name_mismatch")
        .expect("the name check always reports");
    assert!(name_check.passed, "the name matches the entry");
    assert!(report
        .checks
        .iter()
        .any(|check| check.code == "vua.eac_verify.signature_unverified"
            && !check.passed));
    let path_check = report
        .checks
        .iter()
        .find(|check| check.code == "vua.eac_verify.path_mismatch")
        .unwrap();
    assert!(path_check.passed, "the path matches the entry pattern");

    cleanup(&unique_dir("unused"));
}

#[test]
fn verification_refuses_name_mismatch_and_vanished_candidates() {
    let allowlist = load_allowlist(
        &serde_json::to_string(&json!({
            "schemaVersion": EAC_ALLOWLIST_SCHEMA_VERSION,
            "entries": [serde_json::to_value(entry("easyanticheat.exe")).unwrap()],
        }))
        .unwrap(),
    )
    .unwrap();
    let entry = find_entry(&allowlist, "easyanticheat.exe").unwrap();

    // Name mismatch at the same pid (pid reuse after exit).
    let source = FixtureSource {
        entries: vec![snapshot_entry(39_012, "totally-other.exe", None)],
    };
    let report = verify_candidate(39_012, entry, &source);
    assert_eq!(report.verdict, Verdict::Refused);
    assert!(report
        .checks
        .iter()
        .any(|check| check.code == "vua.eac_verify.name_mismatch" && !check.passed));

    // The candidate vanished from the table entirely.
    let source = FixtureSource { entries: vec![] };
    let report = verify_candidate(39_012, entry, &source);
    assert_eq!(report.verdict, Verdict::Refused);
    assert!(report
        .checks
        .iter()
        .any(|check| check.code == "vua.eac_verify.process_not_found"));

    cleanup(&unique_dir("unused"));
}

#[cfg(windows)]
#[test]
fn winverifytrust_refuses_an_unsigned_or_missing_file() {
    // A nonexistent path must come back Unverified with a typed detail,
    // never a guess or a panic.
    let report = vua_project_manager::eac_verify_windows_signature_for_test(
        r"C:\definitely\not\a\real\file.exe",
    );
    assert_eq!(report.0, SignatureState::Unverified);
    assert!(report.1.contains("0x"), "detail carries the status code");

    // The test executable itself is (typically) unsigned — still Unverified,
    // still a clean typed result.
    let self_path = std::env::current_exe().unwrap();
    let report = vua_project_manager::eac_verify_windows_signature_for_test(
        &self_path.to_string_lossy(),
    );
    assert_eq!(report.0, SignatureState::Unverified);
}

/// Real-machine re-verification (ignored): enumerate a real EAC/VRChat
/// pid, then verify. Run locally with `--ignored`.
#[test]
#[ignore = "real-machine re-verification: needs a real process table; CI runs synthetic fixtures only"]
fn real_machine_verification_records_the_actual_checks() {
    let allowlist = load_allowlist(
        &serde_json::to_string(&json!({
            "schemaVersion": EAC_ALLOWLIST_SCHEMA_VERSION,
            "entries": [serde_json::to_value(entry("easyanticheat.exe")).unwrap()],
        }))
        .unwrap(),
    )
    .unwrap();
    let entry = find_entry(&allowlist, "easyanticheat.exe").unwrap();
    // Real-machine callers substitute the Toolhelp source from eac_probe.
    let source = vua_project_manager::eac_probe::os_source::ToolhelpProcessSource;
    // Find the first easyanticheat pid from the real table (if present).
    let table = source.snapshot().expect("real process table");
    let Some(pid) = table
        .iter()
        .find(|candidate| candidate.image_name.eq_ignore_ascii_case("easyanticheat.exe"))
        .map(|candidate| candidate.pid)
    else {
        println!("no easyanticheat.exe on this machine — nothing to verify");
        return;
    };
    let report = verify_candidate(pid, entry, &source);
    println!(
        "real-machine verification: verdict={:?}, checks={}",
        report.verdict,
        serde_json::to_string_pretty(&serde_json::to_value(&report.checks).unwrap()).unwrap()
    );
    assert_eq!(report.verdict, Verdict::Refused); // v0.1: signature unverified
}
