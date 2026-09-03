//! Prints the environment detection spike snapshot as JSON — the
//! local-evidence companion to the environment spike tests.
//!
//! Usage: cargo run -p vua-orchestrator --example environment_probe [-- <output-path>]
//!
//! The snapshot reflects this machine's real installs. Keep it local:
//! real project paths never enter the repository (they flow through the
//! ignored `VUA_ENV_SPIKE_SNAPSHOTS` manual test for schema validation).

use std::path::PathBuf;

fn main() {
    let roots = vua_orchestrator::ManagerRoots::default();
    let editor_roots = vec![PathBuf::from("C:\\Program Files\\Unity\\Hub\\Editor")];
    let snapshot = vua_orchestrator::collect_environment_spike_snapshot(
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
