//! Immutable local Build Record for the B3 production slice.

use crate::{Diagnostic, MaterialEntryMode, RiskDecisionChoice, SourceFolderInspectionV01};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::PathBuf;

pub const BUILD_RECORD_SCHEMA_VERSION: &str = "0.1";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BuildRecordStatus {
    Succeeded,
    SucceededWithWarnings,
    Failed,
    Cancelled,
    Recovered,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildSnapshotEvidenceV01 {
    pub snapshot_id: String,
    pub verified: bool,
    pub restore_attempted: bool,
    pub restore_succeeded: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeJobEvidenceV01 {
    pub command_id: String,
    pub operation: String,
    pub status: String,
    pub changed_paths: Vec<String>,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalVpmEvidenceV01 {
    pub package_id: String,
    pub display_name: String,
    pub version: String,
    pub manifest_sha256: String,
    pub tree_sha256: String,
    pub archive_sha256: String,
    pub installed_version: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildValidationEvidenceV01 {
    /// B3 deliberately claims only minimum structure, never Avatar semantics.
    pub level: String,
    pub unity_validated: bool,
    pub expected_assets_loaded: Vec<String>,
    pub diagnostic_codes: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildRecordV01 {
    pub schema_version: String,
    pub record_id: String,
    pub task_id: String,
    pub correlation_id: String,
    pub plan_id: String,
    pub plan_hash: String,
    pub mode: MaterialEntryMode,
    pub status: BuildRecordStatus,
    pub started_at: String,
    pub completed_at: String,
    pub source: SourceFolderInspectionV01,
    pub risk_choice: RiskDecisionChoice,
    pub project_id: String,
    /// Normalized digest of the project root the record belongs to.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub project_identity: Option<String>,
    /// Set on recovery receipts: the failed run's record this one
    /// supersedes, and the user decision that authorized the recovery.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recovered_from_record_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recovery_decision_id: Option<String>,
    pub initial_project_fingerprint: String,
    pub final_project_fingerprint: Option<String>,
    pub unity_editor_version: String,
    pub snapshot: Option<BuildSnapshotEvidenceV01>,
    pub bridge_jobs: Vec<BridgeJobEvidenceV01>,
    pub local_vpm: Option<LocalVpmEvidenceV01>,
    pub validation: Option<BuildValidationEvidenceV01>,
    pub result_code: String,
}

#[derive(Debug, Clone)]
pub struct BuildRecordStore {
    root: PathBuf,
}

impl BuildRecordStore {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn path_for(&self, record_id: &str) -> io::Result<PathBuf> {
        validate_id(record_id)?;
        Ok(self.root.join(format!("{record_id}.json")))
    }

    /// Publishes exactly once. A repeated production command must read and
    /// return the existing record; it cannot overwrite history.
    pub fn publish(&self, record: &BuildRecordV01) -> io::Result<PathBuf> {
        if record.schema_version != BUILD_RECORD_SCHEMA_VERSION {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "unsupported build record version",
            ));
        }
        let destination = self.path_for(&record.record_id)?;
        fs::create_dir_all(&self.root)?;
        let temporary = self.root.join(format!(".{}.tmp", record.record_id));
        let bytes = serde_json::to_vec_pretty(record)
            .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))?;
        {
            let mut output = OpenOptions::new()
                .create_new(true)
                .write(true)
                .open(&temporary)?;
            output.write_all(&bytes)?;
            output.write_all(b"\n")?;
            output.sync_all()?;
        }
        // A hard link publishes the fully synced inode without an empty-file
        // window and fails rather than replacing an immutable prior record.
        match fs::hard_link(&temporary, &destination) {
            Ok(()) => {
                fs::remove_file(&temporary)?;
                Ok(destination)
            }
            Err(error) => {
                let _ = fs::remove_file(&temporary);
                Err(error)
            }
        }
    }

    pub fn read(&self, record_id: &str) -> io::Result<BuildRecordV01> {
        let bytes = fs::read(self.path_for(record_id)?)?;
        serde_json::from_slice(&bytes)
            .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))
    }
}

fn validate_id(value: &str) -> io::Result<()> {
    if value.is_empty()
        || value.len() > 128
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "invalid build record id",
        ));
    }
    Ok(())
}
