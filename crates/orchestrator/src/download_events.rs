//! Download-events protocol v0.1 wire vocabulary (frozen 2026-09-06).
//!
//! Rust mirror of `schemas/download-events/v0.1/event.schema.json`. The F4
//! download port reports transport facts only: content identity (SHA-256),
//! inspection verdicts, source correlation and Warehouse decisions are AMF's.
//! Events never carry cookies, download tokens or credentials, and
//! `stored_path` is the only path field. Any vocabulary change must bump the
//! schema version — never rewrite in place.

use serde::{Deserialize, Serialize};

pub const DOWNLOAD_EVENT_SCHEMA_VERSION: &str = "0.1";

/// Closed six-event vocabulary (`download.*`). Interrupted is the resumable
/// candidate; cancelled and failed are terminal.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DownloadEventKind {
    #[serde(rename = "download.started")]
    Started,
    #[serde(rename = "download.progress")]
    Progress,
    #[serde(rename = "download.interrupted")]
    Interrupted,
    #[serde(rename = "download.completed")]
    Completed,
    #[serde(rename = "download.cancelled")]
    Cancelled,
    #[serde(rename = "download.failed")]
    Failed,
}

/// Failure attribution, failed events only. The port cannot honestly
/// distinguish network, disk or server causes on the Electron event surface,
/// so `unknown` is the honest default; `policy` is the port's own
/// allowlist denial at `will-download`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DownloadFailureKind {
    Policy,
    Unknown,
}

/// One normalized transport event. Serde shape matches the JSON Schema
/// document field for field, including `deny_unknown_fields` — a port that
/// smuggles extra fields (e.g. a user-chosen path) fails the contract here
/// first.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DownloadEventV01 {
    pub schema_version: String,
    pub kind: DownloadEventKind,
    pub download_id: String,
    pub attempt: u32,
    pub source_url: String,
    pub initiated_from_page_url: Option<String>,
    pub url_chain: Option<Vec<String>>,
    pub suggested_file_name: Option<String>,
    pub stored_path: Option<String>,
    pub expected_bytes: Option<u64>,
    pub received_bytes: Option<u64>,
    pub resumable: bool,
    pub failure_kind: Option<DownloadFailureKind>,
    pub occurred_at: String,
}

impl DownloadEventV01 {
    pub fn schema_version_valid(&self) -> bool {
        self.schema_version == DOWNLOAD_EVENT_SCHEMA_VERSION
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn examples_dir() -> std::path::PathBuf {
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../schemas/download-events/v0.1/examples")
    }

    fn read_example(name: &str) -> DownloadEventV01 {
        let bytes = std::fs::read(examples_dir().join(format!("{name}.json"))).expect("example must exist");
        serde_json::from_slice(&bytes).expect("example must deserialize")
    }

    #[test]
    fn every_frozen_example_deserializes_and_roundtrips() {
        for name in [
            "started",
            "progress",
            "interrupted",
            "completed",
            "cancelled",
            "failed-policy",
            "failed-unknown",
        ] {
            let event = read_example(name);
            assert!(event.schema_version_valid(), "{name}: schema version");
            let roundtrip: DownloadEventV01 =
                serde_json::from_value(serde_json::to_value(&event).unwrap()).unwrap();
            assert_eq!(event, roundtrip, "{name}: serde roundtrip");
        }
    }

    #[test]
    fn policy_failure_carries_no_stored_path_and_unknown_does() {
        let policy = read_example("failed-policy");
        assert_eq!(policy.failure_kind, Some(DownloadFailureKind::Policy));
        assert_eq!(policy.stored_path, None, "policy denial happens before any file exists");
        let unknown = read_example("failed-unknown");
        assert_eq!(unknown.failure_kind, Some(DownloadFailureKind::Unknown));
        assert!(unknown.stored_path.is_some(), "partial file stays reportable");
    }

    #[test]
    fn network_attribution_is_rejected_and_extra_fields_never_ride_along() {
        let bytes = std::fs::read(examples_dir().join("invalid-failed-network.json")).unwrap();
        assert!(
            serde_json::from_slice::<DownloadEventV01>(&bytes).is_err(),
            "the port cannot honestly report network/disk/server attribution"
        );
        let bytes = std::fs::read(examples_dir().join("invalid-user-chosen-path.json")).unwrap();
        assert!(
            serde_json::from_slice::<DownloadEventV01>(&bytes).is_err(),
            "stored_path is the only path field; port-invented fields are rejected"
        );
    }
}
