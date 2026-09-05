//! BDL read-model query vocabulary v0.1 (frozen 2026-09-06).
//!
//! Rust anchor for `schemas/bdl-queries/v0.1` (docs/protocols/
//! bdl-queries-v0.1): the five read-only operations, the wire three-state
//! LocalArtifact verdict and the catalog health vocabulary. The serving face
//! lands later — warehouse queries with B4-7, catalog queries with the
//! observation-pipeline slice — but the vocabulary is frozen now so the F
//! side registers its contracts against a stable shape. Any vocabulary
//! change must bump the schema version, never rewrite in place.

use crate::bdl_store::ArtifactInspectionState;
use serde::{Deserialize, Serialize};

pub const BDL_QUERIES_SCHEMA_VERSION: &str = "0.1";

/// The five read-only operations. Transport envelopes belong to the
/// application contract; this enum pins the operation vocabulary only.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BdlQueryOperation {
    #[serde(rename = "catalog.list")]
    CatalogList,
    #[serde(rename = "catalog.detail")]
    CatalogDetail,
    #[serde(rename = "catalog.status")]
    CatalogStatus,
    #[serde(rename = "warehouse.listEntries")]
    WarehouseListEntries,
    #[serde(rename = "warehouse.entryDetail")]
    WarehouseEntryDetail,
}

/// UI-facing LocalArtifact verdict (the wire three-state). The storage
/// lifecycle keeps its own four states; this mapping is the protocol's
/// presentation contract.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ArtifactInspectionVerdict {
    /// Storage `untrusted` (transfer done, not inspected) or `inspected`
    /// (mechanical checks passed, admission decision pending).
    Pending,
    /// Storage `admitted`.
    Clean,
    /// Storage `rejected` — always carries an honest rejection reason on
    /// the wire.
    Quarantined,
}

impl ArtifactInspectionVerdict {
    pub fn from_storage_state(state: ArtifactInspectionState) -> Self {
        match state {
            ArtifactInspectionState::Untrusted | ArtifactInspectionState::Inspected => {
                Self::Pending
            }
            ArtifactInspectionState::Admitted => Self::Clean,
            ArtifactInspectionState::Rejected => Self::Quarantined,
        }
    }
}

/// Catalog health, v0.1. `incompatible` is the BDL version fence rejecting
/// the store; `corrupted` and `stale` are renderer-reserved display states
/// that v0.1 never sends.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CatalogHealth {
    Unknown,
    Ok,
    Incompatible,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn schema_dir() -> std::path::PathBuf {
        std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../schemas/bdl-queries/v0.1")
    }

    #[test]
    fn operation_enum_matches_the_frozen_schema_vocabulary() {
        let bytes = std::fs::read(schema_dir().join("query.schema.json")).unwrap();
        let schema: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        let schema_operations = schema["properties"]["operation"]["enum"].as_array().unwrap();
        let rust_operations = [
            BdlQueryOperation::CatalogList,
            BdlQueryOperation::CatalogDetail,
            BdlQueryOperation::CatalogStatus,
            BdlQueryOperation::WarehouseListEntries,
            BdlQueryOperation::WarehouseEntryDetail,
        ]
        .map(|operation| serde_json::to_value(operation).unwrap());
        assert_eq!(schema_operations, &rust_operations);
    }

    #[test]
    fn wire_verdict_and_health_serialize_to_the_stable_names() {
        assert_eq!(
            serde_json::to_value(ArtifactInspectionVerdict::from_storage_state(
                ArtifactInspectionState::Inspected
            ))
            .unwrap(),
            "pending"
        );
        assert_eq!(
            serde_json::to_value(ArtifactInspectionVerdict::from_storage_state(
                ArtifactInspectionState::Rejected
            ))
            .unwrap(),
            "quarantined"
        );
        assert_eq!(
            serde_json::to_value(CatalogHealth::Incompatible).unwrap(),
            "incompatible"
        );
    }
}
