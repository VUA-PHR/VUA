//! BDL read-model query vocabulary v0.2 (frozen 2026-09-06).
//!
//! Rust anchor for `schemas/bdl-queries/v0.2` (docs/protocols/
//! bdl-queries-v0.2): the five read-only operations, the wire three-state
//! LocalArtifact verdict, the catalog health vocabulary and the availability
//! derivation function — the executable form of the protocol's versioned
//! rule table. The serving face lands later — warehouse queries with B4-7,
//! catalog queries with the observation-pipeline slice — but the vocabulary
//! is frozen now so the F side registers its contracts against a stable
//! shape. Any vocabulary change must bump the schema version, never rewrite
//! in place.

use crate::bdl_store::ArtifactInspectionState;
use serde::{Deserialize, Serialize};

pub const BDL_QUERIES_SCHEMA_VERSION: &str = "0.2";

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

/// Catalog health, v0.2. `incompatible` is the BDL version fence rejecting
/// the store; `corrupted` and `stale` are renderer-reserved display states
/// that v0.2 never sends.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CatalogHealth {
    Unknown,
    Ok,
    Incompatible,
}

/// The stable availability enum (v0.2 dual field): UI badges and filters
/// consume only this; the raw observed word rides along as
/// `availabilityRaw` evidence.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AvailabilityStatus {
    Available,
    Unavailable,
    Unknown,
}

/// Derives `availabilityStatus` from the verbatim observed word, per the
/// v0.2 rule table in the protocol (last path segment, lowercased;
/// `https://schema.org/InStock` and `InStock` judge identically; everything
/// unrecognized or missing is unknown with the raw preserved by the caller).
pub fn availability_status(raw: Option<&str>) -> AvailabilityStatus {
    let Some(raw) = raw else {
        return AvailabilityStatus::Unknown;
    };
    let word = raw
        .rsplit('/')
        .next()
        .unwrap_or(raw)
        .trim()
        .to_ascii_lowercase();
    match word.as_str() {
        "instock" | "limitedavailability" | "instoreonly" => AvailabilityStatus::Available,
        "outofstock" | "soldout" | "discontinued" => AvailabilityStatus::Unavailable,
        _ => AvailabilityStatus::Unknown,
    }
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

    #[test]
    fn availability_derivation_matches_the_v0_2_rule_table() {
        use AvailabilityStatus::*;
        // The whole rule table, including the URL-normalized forms.
        assert_eq!(availability_status(Some("InStock")), Available);
        assert_eq!(
            availability_status(Some("https://schema.org/InStock")),
            Available
        );
        assert_eq!(
            availability_status(Some("https://schema.org/LimitedAvailability")),
            Available
        );
        assert_eq!(availability_status(Some("SoldOut")), Unavailable);
        assert_eq!(
            availability_status(Some("https://schema.org/OutOfStock")),
            Unavailable
        );
        assert_eq!(availability_status(Some("Discontinued")), Unavailable);
        // Unrecognized words and absence stay honest unknowns.
        assert_eq!(availability_status(Some("PreOrder")), Unknown);
        assert_eq!(
            availability_status(Some("https://example.com/whatever")),
            Unknown
        );
        assert_eq!(availability_status(None), Unknown);
    }
}
