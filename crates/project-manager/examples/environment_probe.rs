//! Prints the environment detection spike snapshot as JSON — the
//! local-evidence companion to the environment spike tests. Moved from the
//! core with the module (proposal 004).
//!
//! Usage: cargo run -p vua-project-manager --example environment_probe [-- <output-path>]
//!
//! The snapshot reflects this machine's real installs. Keep it local:
//! real project paths never enter the repository (they flow through the
//! ignored `VUA_ENV_SPIKE_SNAPSHOTS` manual test for schema validation).

use std::path::PathBuf;

fn main() {
    let roots = vua_project_manager::ManagerRoots::default();
    // The VCC settings resolution-order invariant lives in the core
    // `EnvironmentRoots::default()` (proposal 004); reuse it here.
    let vcc_candidates = vua_orchestrator::EnvironmentRoots::default().vcc_settings_candidates;
    let editor_roots = vec![PathBuf::from("C:\\Program Files\\Unity\\Hub\\Editor")];
    let snapshot = vua_project_manager::collect_environment_managers_snapshot(
        &vcc_candidates,
        &roots,
        &editor_roots,
        &vua_orchestrator::SystemClock,
    );
    let payload = serde_json::to_string_pretty(&snapshot).expect("snapshot serializes");
    match std::env::args().nth(1) {
        Some(path) => std::fs::write(path, payload).expect("write snapshot"),
        None => println!("{payload}"),
    }
}
