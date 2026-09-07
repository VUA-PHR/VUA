//! BDL local database (v0.1) — the acquisition-pipeline persistence surface.
//!
//! BDL is an AMF-private local module (docs/architecture/bdl_ZH.md): AMF
//! decides what is persisted, BDL stores it. This store owns the B4
//! acquisition tables (download_events / local_artifacts / artifact_mappings)
//! with the durability discipline of the task store (WAL, synchronous FULL,
//! versioned migration). The observation tables belong to the observation
//! pipeline; the store only enforces that artifact mappings reference
//! OBSERVED products — the foreign key rejects every unobserved target,
//! which is the boundary itself.
//!
//! Inspection facts are idempotent per content (`artifact_sha256`);
//! re-downloading the same content never duplicates a row (warehouse-layout
//! ruling 2). Event ingestion is deduped on
//! (download_id, attempt, kind, occurred_at) because the port delivers
//! at-least-once.

use crate::bdl_queries::{
    AvailabilityStatus, CatalogDetailResult, CatalogHealth, CatalogListParams, CatalogListResult,
    CatalogProductDetail, CatalogProductSummary, CatalogRevision, CatalogStatusResult,
};
use crate::bdl_queries::ArtifactInspectionVerdict;
use crate::download_events::{DownloadEventKind, DownloadEventV01, DownloadFailureKind};
use rusqlite::{params, Connection, OptionalExtension, TransactionBehavior};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

pub const BDL_FORMAT_VERSION: &str = "0.1";
const BDL_MIGRATION_VERSION: i64 = 1;
const MIGRATION_001: &str = include_str!("../../../schemas/bdl/v0.1/001_initial.sql");

#[derive(Debug)]
pub enum BdlStoreError {
    Database(rusqlite::Error),
    Json(serde_json::Error),
    UnsupportedFormat(String),
    InvalidEvent(&'static str),
    UnknownArtifact(String),
    UnknownProduct(String),
    UnknownWarehouseItem(String),
    InvalidTransition {
        artifact_sha256: String,
        from: ArtifactInspectionState,
        to: ArtifactInspectionState,
    },
    CorruptValue {
        field: &'static str,
        value: String,
    },
}

impl std::fmt::Display for BdlStoreError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Database(error) => write!(formatter, "BDL store failed: {error}"),
            Self::Json(error) => write!(formatter, "BDL store JSON failed: {error}"),
            Self::UnsupportedFormat(version) => {
                write!(formatter, "unsupported BDL format {version}")
            }
            Self::InvalidEvent(reason) => write!(formatter, "invalid download event: {reason}"),
            Self::UnknownArtifact(artifact) => {
                write!(formatter, "unknown local artifact {artifact}")
            }
            Self::UnknownProduct(product) => write!(
                formatter,
                "artifact mapping target {product} was never observed by the pipeline"
            ),
            Self::UnknownWarehouseItem(item) => {
                write!(formatter, "unknown warehouse item {item}")
            }
            Self::InvalidTransition {
                artifact_sha256,
                from,
                to,
            } => write!(
                formatter,
                "artifact {artifact_sha256} cannot transition from {from} to {to}"
            ),
            Self::CorruptValue { field, value } => {
                write!(formatter, "invalid persisted {field}: {value}")
            }
        }
    }
}

impl std::error::Error for BdlStoreError {}

impl From<rusqlite::Error> for BdlStoreError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error)
    }
}

impl From<serde_json::Error> for BdlStoreError {
    fn from(error: serde_json::Error) -> Self {
        Self::Json(error)
    }
}

/// LocalArtifact inspection lifecycle. Mechanical checks (size/type/digest)
/// move untrusted → inspected; AMF's source/context decision moves
/// inspected → admitted. Any check failure rejects; rejected is terminal.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtifactInspectionState {
    Untrusted,
    Inspected,
    Admitted,
    Rejected,
}

impl ArtifactInspectionState {
    fn name(self) -> &'static str {
        match self {
            Self::Untrusted => "untrusted",
            Self::Inspected => "inspected",
            Self::Admitted => "admitted",
            Self::Rejected => "rejected",
        }
    }

    fn parse(value: &str) -> Result<Self, BdlStoreError> {
        match value {
            "untrusted" => Ok(Self::Untrusted),
            "inspected" => Ok(Self::Inspected),
            "admitted" => Ok(Self::Admitted),
            "rejected" => Ok(Self::Rejected),
            _ => Err(BdlStoreError::CorruptValue {
                field: "artifact inspection state",
                value: value.into(),
            }),
        }
    }

    fn can_transition(self, to: Self) -> bool {
        matches!(
            (self, to),
            (Self::Untrusted, Self::Inspected)
                | (Self::Untrusted, Self::Rejected)
                | (Self::Inspected, Self::Admitted)
                | (Self::Inspected, Self::Rejected)
        )
    }
}

impl std::fmt::Display for ArtifactInspectionState {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.name())
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StoredDownloadEvent {
    pub event_id: i64,
    pub download_id: String,
    pub attempt: u32,
    pub kind: DownloadEventKind,
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

#[derive(Debug, Clone, PartialEq)]
pub struct StoredArtifact {
    pub artifact_sha256: String,
    pub size_bytes: u64,
    pub suggested_file_name: Option<String>,
    pub inspection_state: ArtifactInspectionState,
    pub rejection_reason: Option<String>,
    pub inspected_at: Option<String>,
    pub download_id: Option<String>,
    pub first_seen_at: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct NewLocalArtifact {
    pub artifact_sha256: String,
    pub size_bytes: u64,
    pub suggested_file_name: Option<String>,
    pub download_id: Option<String>,
    pub first_seen_at: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EventAppendence {
    Inserted,
    Duplicate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtifactRecordingOutcome {
    Created,
    Existing,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArtifactMappingOutcome {
    Created,
    Existing,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ArtifactRecording {
    pub outcome: ArtifactRecordingOutcome,
    pub artifact: StoredArtifact,
}

/// The per-entry artifact-mode override (bdl-queries v0.3). Absent = the
/// entry follows the shell-level global default, resolved dynamically at
/// read time. A consumption preference — never a generation trigger, never
/// a statement that a VPM exists.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ArtifactMode {
    UseOriginalUnitypackage,
    GenerateVpm,
}

impl ArtifactMode {
    pub fn name(self) -> &'static str {
        match self {
            Self::UseOriginalUnitypackage => "use_original_unitypackage",
            Self::GenerateVpm => "generate_vpm",
        }
    }

    pub fn parse(value: &str) -> Result<Self, BdlStoreError> {
        match value {
            "use_original_unitypackage" => Ok(Self::UseOriginalUnitypackage),
            "generate_vpm" => Ok(Self::GenerateVpm),
            _ => Err(BdlStoreError::CorruptValue {
                field: "artifact mode",
                value: value.into(),
            }),
        }
    }
}

/// Role of a physical copy inside an entry: the material original, or a
/// generated VPM package (siblings per warehouse-layout ruling 5). The
/// delete-originals flow removes original rows and keeps generated_vpm.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CopyRole {
    Original,
    GeneratedVpm,
}

impl CopyRole {
    pub fn name(self) -> &'static str {
        match self {
            Self::Original => "original",
            Self::GeneratedVpm => "generated_vpm",
        }
    }

    pub fn parse(value: &str) -> Result<Self, BdlStoreError> {
        match value {
            "original" => Ok(Self::Original),
            "generated_vpm" => Ok(Self::GeneratedVpm),
            _ => Err(BdlStoreError::CorruptValue {
                field: "artifact copy role",
                value: value.into(),
            }),
        }
    }
}

/// The two legal entry kinds (bdl-queries v0.3 closed vocabulary).
pub const WAREHOUSE_ITEM_KINDS: [&str; 2] = ["imported_material", "downloaded_material"];

/// One material-package entry (warehouse_items row). The folder name is the
/// entry's VUA-generated local identity.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredWarehouseItem {
    pub warehouse_item_id: String,
    pub display_name: String,
    pub folder_name: String,
    pub kind: String,
    pub artifact_mode: Option<String>,
    pub created_at: String,
}

/// One physical copy of an artifact inside an entry (artifact_copies row).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredArtifactCopy {
    pub copy_id: String,
    pub warehouse_item_id: String,
    pub artifact_sha256: String,
    pub relative_path: String,
    pub stored_path: String,
    pub role: CopyRole,
    pub created_at: String,
}

/// `warehouse.listEntries` card (bdl-queries v0.3 wire shape).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseEntryCard {
    pub warehouse_item_id: String,
    pub folder_name: String,
    pub display_name: String,
    pub kind: String,
    /// Per-entry override; null = follows the global default.
    pub artifact_mode: Option<ArtifactMode>,
    /// Dynamically resolved: override ?? the injected global default.
    pub effective_artifact_mode: ArtifactMode,
    pub created_at: String,
    pub artifacts: Vec<WarehouseArtifactRef>,
}

/// Light artifact reference on an entry card.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseArtifactRef {
    pub relative_path: String,
    pub artifact_sha256: String,
    pub state: ArtifactInspectionVerdict,
    pub size_bytes: u64,
    pub role: CopyRole,
}

/// `warehouse.entryDetail` payload (bdl-queries v0.3 wire shape).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseEntryDetail {
    pub warehouse_item_id: String,
    pub folder_name: String,
    pub display_name: String,
    pub kind: String,
    pub artifact_mode: Option<ArtifactMode>,
    pub effective_artifact_mode: ArtifactMode,
    pub created_at: String,
    pub artifacts: Vec<WarehouseArtifactFact>,
}

/// Per-artifact inspection facts with source-correlation existence.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseArtifactFact {
    pub relative_path: String,
    pub artifact_sha256: String,
    pub state: ArtifactInspectionVerdict,
    pub size_bytes: u64,
    pub suggested_file_name: Option<String>,
    pub inspected_at: Option<String>,
    pub rejection_reason: Option<String>,
    pub source_correlated: bool,
    pub mapped_product_ids: Vec<String>,
    pub role: CopyRole,
}

fn effective_mode(artifact_mode: Option<String>, global_default: ArtifactMode) -> ArtifactMode {
    artifact_mode
        .as_deref()
        .map(|mode| ArtifactMode::parse(mode).unwrap_or(global_default))
        .unwrap_or(global_default)
}

fn warehouse_card(
    item: StoredWarehouseItem,
    global_default: ArtifactMode,
    artifacts: Vec<WarehouseArtifactRef>,
) -> WarehouseEntryCard {
    WarehouseEntryCard {
        effective_artifact_mode: effective_mode(item.artifact_mode.clone(), global_default),
        artifact_mode: item
            .artifact_mode
            .as_deref()
            .map(|mode| ArtifactMode::parse(mode).expect("stored mode is enum-validated")),
        warehouse_item_id: item.warehouse_item_id,
        folder_name: item.folder_name,
        display_name: item.display_name,
        kind: item.kind,
        created_at: item.created_at,
        artifacts,
    }
}

pub struct BdlStore {
    path: Option<PathBuf>,
    connection: Mutex<Connection>,
}

impl BdlStore {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, BdlStoreError> {
        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|error| {
                BdlStoreError::Database(rusqlite::Error::ToSqlConversionFailure(Box::new(error)))
            })?;
        }
        let connection = Connection::open(&path)?;
        let store = Self {
            path: Some(path),
            connection: Mutex::new(connection),
        };
        store.configure_and_migrate()?;
        Ok(store)
    }

    pub fn open_in_memory() -> Result<Self, BdlStoreError> {
        let store = Self {
            path: None,
            connection: Mutex::new(Connection::open_in_memory()?),
        };
        store.configure_and_migrate()?;
        Ok(store)
    }

    pub fn path(&self) -> Option<&Path> {
        self.path.as_deref()
    }

    fn configure_and_migrate(&self) -> Result<(), BdlStoreError> {
        let mut connection = self.connection.lock().expect("SQLite connection poisoned");
        connection.busy_timeout(std::time::Duration::from_secs(5))?;
        connection.pragma_update(None, "foreign_keys", "ON")?;
        if self.path.is_some() {
            let mode: String =
                connection.pragma_query_value(None, "journal_mode", |row| row.get(0))?;
            if !mode.eq_ignore_ascii_case("wal") {
                connection.pragma_update(None, "journal_mode", "WAL")?;
            }
        }
        connection.pragma_update(None, "synchronous", "FULL")?;

        let migration: i64 =
            connection.pragma_query_value(None, "user_version", |row| row.get(0))?;
        if migration > BDL_MIGRATION_VERSION {
            return Err(BdlStoreError::UnsupportedFormat(format!(
                "migration-{migration}"
            )));
        }
        if migration == 0 {
            let transaction =
                connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
            transaction.execute_batch(MIGRATION_001)?;
            transaction.pragma_update(None, "user_version", BDL_MIGRATION_VERSION)?;
            transaction.commit()?;
        }
        let format: String = connection
            .query_row(
                "SELECT value FROM bdl_meta WHERE key = 'format_version'",
                [],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| BdlStoreError::UnsupportedFormat("missing".into()))?;
        if format != BDL_FORMAT_VERSION {
            return Err(BdlStoreError::UnsupportedFormat(format));
        }
        Ok(())
    }

    /// Append one normalized port event. Deduped on the persisted unique key
    /// — a redelivered event returns `Duplicate` with the original row id
    /// instead of inserting a second fact.
    pub fn append_download_event(
        &self,
        event: &DownloadEventV01,
    ) -> Result<(EventAppendence, StoredDownloadEvent), BdlStoreError> {
        if !event.schema_version_valid() {
            return Err(BdlStoreError::InvalidEvent("schema version"));
        }
        if event.download_id.trim().is_empty() {
            return Err(BdlStoreError::InvalidEvent("download id"));
        }
        if event.attempt == 0 {
            return Err(BdlStoreError::InvalidEvent("attempt"));
        }
        if event.source_url.trim().is_empty() || event.occurred_at.trim().is_empty() {
            return Err(BdlStoreError::InvalidEvent("source url or timestamp"));
        }
        let url_chain = match &event.url_chain {
            Some(chain) => Some(serde_json::to_string(chain)?),
            None => None,
        };
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let inserted = connection.execute(
            "INSERT INTO download_events(
                download_id, attempt, kind, source_url,
                initiated_from_page_url, url_chain, suggested_file_name,
                stored_path, expected_bytes, received_bytes, resumable,
                failure_kind, occurred_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                event.download_id,
                to_i64(u64::from(event.attempt), "attempt")?,
                download_event_kind_name(event.kind),
                event.source_url,
                event.initiated_from_page_url,
                url_chain,
                event.suggested_file_name,
                event.stored_path,
                event.expected_bytes.map(|v| to_i64(v, "expected bytes")).transpose()?,
                event.received_bytes.map(|v| to_i64(v, "received bytes")).transpose()?,
                i64::from(event.resumable),
                event.failure_kind.map(failure_kind_name),
                event.occurred_at,
            ],
        );
        match inserted {
            Ok(_) => {}
            Err(rusqlite::Error::SqliteFailure(failure, _))
                if failure.code == rusqlite::ErrorCode::ConstraintViolation =>
            {
                let stored = select_download_events(&connection, &event.download_id)?
                    .into_iter()
                    .find(|stored| {
                        stored.attempt == event.attempt
                            && stored.kind == event.kind
                            && stored.occurred_at == event.occurred_at
                    })
                    .ok_or(BdlStoreError::InvalidEvent(
                        "duplicate event not found under its own identity",
                    ))?;
                return Ok((EventAppendence::Duplicate, stored));
            }
            Err(error) => return Err(error.into()),
        }
        let event_id = connection.last_insert_rowid();
        Ok((
            EventAppendence::Inserted,
            StoredDownloadEvent {
                event_id,
                download_id: event.download_id.clone(),
                attempt: event.attempt,
                kind: event.kind,
                source_url: event.source_url.clone(),
                initiated_from_page_url: event.initiated_from_page_url.clone(),
                url_chain: event.url_chain.clone(),
                suggested_file_name: event.suggested_file_name.clone(),
                stored_path: event.stored_path.clone(),
                expected_bytes: event.expected_bytes,
                received_bytes: event.received_bytes,
                resumable: event.resumable,
                failure_kind: event.failure_kind,
                occurred_at: event.occurred_at.clone(),
            },
        ))
    }

    /// All persisted events of one download in delivery order — the input the
    /// consumer folds into lifecycle state after a restart.
    pub fn download_events(
        &self,
        download_id: &str,
    ) -> Result<Vec<StoredDownloadEvent>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        select_download_events(&connection, download_id)
    }

    /// Distinct download identities with persisted events — the enumeration
    /// the crash-recovery path folds to find non-terminal (orphaned) work.
    pub fn download_ids(&self) -> Result<Vec<String>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let mut statement =
            connection.prepare("SELECT DISTINCT download_id FROM download_events ORDER BY download_id")?;
        let rows = statement.query_map([], |row| row.get::<_, String>(0))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(BdlStoreError::from)
    }

    /// First sight of a content: the untrusted row. Idempotent per content —
    /// re-downloads and batch-import sightings return `Existing`; a size
    /// disagreement under the same sha256 is corruption, never a silent keep.
    pub fn record_untrusted_artifact(
        &self,
        artifact: &NewLocalArtifact,
    ) -> Result<ArtifactRecording, BdlStoreError> {
        if !is_sha256_identity(&artifact.artifact_sha256) {
            return Err(BdlStoreError::CorruptValue {
                field: "artifact identity",
                value: artifact.artifact_sha256.clone(),
            });
        }
        let mut connection = self.connection.lock().expect("SQLite connection poisoned");
        let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let existing = select_artifact(&transaction, &artifact.artifact_sha256)?;
        if let Some(existing) = existing {
            if existing.size_bytes != artifact.size_bytes {
                return Err(BdlStoreError::CorruptValue {
                    field: "artifact size",
                    value: format!(
                        "sha256 {} recorded {} bytes, sighting reports {}",
                        artifact.artifact_sha256, existing.size_bytes, artifact.size_bytes
                    ),
                });
            }
            return Ok(ArtifactRecording {
                outcome: ArtifactRecordingOutcome::Existing,
                artifact: existing,
            });
        }
        transaction.execute(
            "INSERT INTO local_artifacts(
                artifact_sha256, size_bytes, suggested_file_name,
                inspection_state, download_id, first_seen_at
             ) VALUES (?1, ?2, ?3, 'untrusted', ?4, ?5)",
            params![
                artifact.artifact_sha256,
                to_i64(artifact.size_bytes, "artifact size")?,
                artifact.suggested_file_name,
                artifact.download_id,
                artifact.first_seen_at,
            ],
        )?;
        let stored = select_artifact(&transaction, &artifact.artifact_sha256)?
            .expect("artifact row was inserted in this transaction");
        transaction.commit()?;
        Ok(ArtifactRecording {
            outcome: ArtifactRecordingOutcome::Created,
            artifact: stored,
        })
    }

    /// Move one artifact along the inspection lifecycle, enforcing the legal
    /// transitions. `rejection_reason` is only legal on rejection and is the
    /// honest user-facing verdict. `inspected_at` records when the verdict
    /// concluded (inspected/rejected); admission keeps the original value.
    pub fn transition_artifact(
        &self,
        artifact_sha256: &str,
        to: ArtifactInspectionState,
        inspected_at: &str,
        rejection_reason: Option<&str>,
    ) -> Result<StoredArtifact, BdlStoreError> {
        if to == ArtifactInspectionState::Rejected && rejection_reason.is_none() {
            return Err(BdlStoreError::InvalidEvent(
                "rejection without a reason is not an honest verdict",
            ));
        }
        if to != ArtifactInspectionState::Rejected && rejection_reason.is_some() {
            return Err(BdlStoreError::InvalidEvent(
                "rejection reason only applies to rejections",
            ));
        }
        let verdict_at = match to {
            ArtifactInspectionState::Inspected | ArtifactInspectionState::Rejected => {
                Some(inspected_at)
            }
            ArtifactInspectionState::Untrusted | ArtifactInspectionState::Admitted => None,
        };
        let mut connection = self.connection.lock().expect("SQLite connection poisoned");
        let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let current = select_artifact(&transaction, artifact_sha256)?
            .ok_or_else(|| BdlStoreError::UnknownArtifact(artifact_sha256.to_string()))?;
        if !current.inspection_state.can_transition(to) {
            return Err(BdlStoreError::InvalidTransition {
                artifact_sha256: artifact_sha256.to_string(),
                from: current.inspection_state,
                to,
            });
        }
        transaction.execute(
            "UPDATE local_artifacts SET
                inspection_state = ?1,
                rejection_reason = ?2,
                inspected_at = COALESCE(?3, inspected_at)
             WHERE artifact_sha256 = ?4",
            params![
                to.name(),
                rejection_reason,
                verdict_at,
                artifact_sha256,
            ],
        )?;
        let stored = select_artifact(&transaction, artifact_sha256)?
            .expect("artifact row remains present after transition");
        transaction.commit()?;
        Ok(stored)
    }

    pub fn artifact(&self, artifact_sha256: &str) -> Result<Option<StoredArtifact>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        select_artifact(&connection, artifact_sha256)
    }

    /// Submit the source-correlation fact (artifact content → observed
    /// product). Idempotent by primary key; the target product must have been
    /// observed by the pipeline — the FK is the boundary, surfaced here as
    /// `UnknownProduct`.
    pub fn record_artifact_mapping(
        &self,
        artifact_sha256: &str,
        product_id: &str,
        native_subproduct_id: Option<&str>,
        channel: Option<&str>,
        mapped_at: &str,
    ) -> Result<ArtifactMappingOutcome, BdlStoreError> {
        let mut connection = self.connection.lock().expect("SQLite connection poisoned");
        let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let artifact_known: bool = transaction
            .query_row(
                "SELECT 1 FROM local_artifacts WHERE artifact_sha256 = ?1",
                [artifact_sha256],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        if !artifact_known {
            return Err(BdlStoreError::UnknownArtifact(artifact_sha256.to_string()));
        }
        let product_known: bool = transaction
            .query_row(
                "SELECT 1 FROM products WHERE product_id = ?1",
                [product_id],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        if !product_known {
            return Err(BdlStoreError::UnknownProduct(product_id.to_string()));
        }
        let inserted = transaction.execute(
            "INSERT INTO artifact_mappings(
                artifact_sha256, product_id, native_subproduct_id, channel, mapped_at
             ) VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(artifact_sha256, product_id) DO NOTHING",
            params![
                artifact_sha256,
                product_id,
                native_subproduct_id,
                channel,
                mapped_at,
            ],
        )?;
        transaction.commit()?;
        Ok(if inserted == 1 {
            ArtifactMappingOutcome::Created
        } else {
            ArtifactMappingOutcome::Existing
        })
    }

    pub fn checkpoint(&self) -> Result<(), BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        connection.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;
        Ok(())
    }

    /// Create one material-package entry. The VUA-generated identity is the
    /// entry's folder name under the warehouse root — stable, never derived
    /// from display names (warehouse-layout ruling 2).
    pub fn create_warehouse_item(
        &self,
        display_name: &str,
        kind: &str,
        created_at: &str,
    ) -> Result<StoredWarehouseItem, BdlStoreError> {
        if display_name.trim().is_empty() {
            return Err(BdlStoreError::InvalidEvent("warehouse display name"));
        }
        if !WAREHOUSE_ITEM_KINDS.contains(&kind) {
            return Err(BdlStoreError::InvalidEvent("warehouse item kind"));
        }
        let warehouse_item_id = format!(
            "whi-{:016x}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|error| {
                    BdlStoreError::Database(rusqlite::Error::ToSqlConversionFailure(
                        Box::new(error),
                    ))
                })?
                .as_nanos()
        );
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        connection.execute(
            "INSERT INTO warehouse_items(
                warehouse_item_id, display_name, folder_name, kind, created_at
             ) VALUES (?1, ?2, ?1, ?3, ?4)",
            params![warehouse_item_id, display_name, kind, created_at],
        )?;
        Ok(StoredWarehouseItem {
            warehouse_item_id: warehouse_item_id.clone(),
            display_name: display_name.to_string(),
            folder_name: warehouse_item_id,
            kind: kind.to_string(),
            artifact_mode: None,
            created_at: created_at.to_string(),
        })
    }

    /// Record one physical copy inside an entry. The referenced artifact must
    /// exist in any inspection state — a copy is physical reality, and a
    /// later admission rejection legitimately turns an already-copied
    /// artifact quarantined (that is the quarantine card's origin).
    pub fn record_artifact_copy(
        &self,
        warehouse_item_id: &str,
        artifact_sha256: &str,
        relative_path: &str,
        stored_path: &str,
        role: CopyRole,
        created_at: &str,
    ) -> Result<StoredArtifactCopy, BdlStoreError> {
        if relative_path.trim().is_empty() || stored_path.trim().is_empty() {
            return Err(BdlStoreError::InvalidEvent("artifact copy path"));
        }
        let mut connection = self.connection.lock().expect("SQLite connection poisoned");
        let transaction = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let item_known: bool = transaction
            .query_row(
                "SELECT 1 FROM warehouse_items WHERE warehouse_item_id = ?1",
                [warehouse_item_id],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        if !item_known {
            return Err(BdlStoreError::UnknownWarehouseItem(
                warehouse_item_id.to_string(),
            ));
        }
        let artifact_known: bool = transaction
            .query_row(
                "SELECT 1 FROM local_artifacts WHERE artifact_sha256 = ?1",
                [artifact_sha256],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        if !artifact_known {
            return Err(BdlStoreError::UnknownArtifact(artifact_sha256.to_string()));
        }
        let copy_id = format!(
            "cpy-{:016x}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map_err(|error| {
                    BdlStoreError::Database(rusqlite::Error::ToSqlConversionFailure(
                        Box::new(error),
                    ))
                })?
                .as_nanos()
        );
        let inserted = transaction.execute(
            "INSERT INTO artifact_copies(
                copy_id, artifact_sha256, warehouse_item_id,
                relative_path, stored_path, role, created_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                copy_id,
                artifact_sha256,
                warehouse_item_id,
                relative_path,
                stored_path,
                role.name(),
                created_at,
            ],
        );
        if let Err(rusqlite::Error::SqliteFailure(failure, _)) = &inserted {
            if failure.code == rusqlite::ErrorCode::ConstraintViolation {
                return Err(BdlStoreError::CorruptValue {
                    field: "artifact copy",
                    value: format!("{warehouse_item_id}:{relative_path}"),
                });
            }
        }
        inserted?;
        transaction.commit()?;
        Ok(StoredArtifactCopy {
            copy_id,
            warehouse_item_id: warehouse_item_id.to_string(),
            artifact_sha256: artifact_sha256.to_string(),
            relative_path: relative_path.to_string(),
            stored_path: stored_path.to_string(),
            role,
            created_at: created_at.to_string(),
        })
    }

    /// Set (or clear) the per-entry artifact-mode override. `None` = follow
    /// the global default again; resolution stays dynamic at read time.
    pub fn set_artifact_mode(
        &self,
        warehouse_item_id: &str,
        mode: Option<ArtifactMode>,
    ) -> Result<(), BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let changed = connection.execute(
            "UPDATE warehouse_items SET artifact_mode = ?1 WHERE warehouse_item_id = ?2",
            params![mode.map(ArtifactMode::name), warehouse_item_id],
        )?;
        if changed != 1 {
            return Err(BdlStoreError::UnknownWarehouseItem(
                warehouse_item_id.to_string(),
            ));
        }
        Ok(())
    }

    /// The persisted global default mode (U8 two-level options, global
    /// level): `None` = not persisted yet — the provider's
    /// environment-injected initial default rules until the first write.
    /// The entry level lives in `warehouse_items.artifact_mode`; resolution
    /// stays `override ?? global default`, read-time, never a snapshot.
    pub fn global_default_mode(&self) -> Result<Option<ArtifactMode>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let persisted: Option<String> = connection
            .query_row(
                "SELECT value FROM bdl_meta WHERE key = 'warehouse_global_default_mode'",
                [],
                |row| row.get(0),
            )
            .optional()?;
        drop(connection);
        persisted
            .map(|value| ArtifactMode::parse(&value))
            .transpose()
    }

    /// Persists the global default mode (bdl_meta) and reads it back — the
    /// write never echoes the request; the stored fact is the answer. The
    /// environment-injected initial default remains the provider's fallback
    /// only until the first write replaces it here.
    pub fn set_global_default_mode(
        &self,
        mode: ArtifactMode,
    ) -> Result<ArtifactMode, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        connection.execute(
            "INSERT INTO bdl_meta(key, value) VALUES ('warehouse_global_default_mode', ?1)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            params![mode.name()],
        )?;
        drop(connection);
        Ok(mode)
    }

    /// Raw copy rows of one entry, all roles, including `storedPath` — the
    /// AMF-side view for maintenance flows (the wire read face never carries
    /// paths).
    pub fn entry_copies(
        &self,
        warehouse_item_id: &str,
    ) -> Result<Vec<StoredArtifactCopy>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let mut statement = connection.prepare(
            "SELECT copy_id, warehouse_item_id, artifact_sha256,
                    relative_path, stored_path, role, created_at
             FROM artifact_copies
             WHERE warehouse_item_id = ?1
             ORDER BY relative_path",
        )?;
        let rows = statement
            .query_map([warehouse_item_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                ))
            })?
            .collect::<Result<Vec<_>, _>>()?;
        rows.into_iter()
            .map(
                |(
                    copy_id,
                    warehouse_item_id,
                    artifact_sha256,
                    relative_path,
                    stored_path,
                    role,
                    created_at,
                )| {
                    Ok(StoredArtifactCopy {
                        copy_id,
                        warehouse_item_id,
                        artifact_sha256,
                        relative_path,
                        stored_path,
                        role: CopyRole::parse(&role)?,
                        created_at,
                    })
                },
            )
            .collect()
    }

    /// Delete one copy row (the maintenance flow removes the physical file
    /// first, then the row — per-copy consistency, resumable on retry).
    /// Returns false when the row was already gone.
    pub fn delete_artifact_copy(&self, copy_id: &str) -> Result<bool, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let deleted = connection.execute("DELETE FROM artifact_copies WHERE copy_id = ?1", [
            copy_id,
        ])?;
        Ok(deleted == 1)
    }

    /// Delete the ORIGINAL copy rows of one entry (the delete-originals
    /// task removes the physical files around this call). Generated VPM
    /// rows and every inspection fact are kept.
    pub fn delete_entry_originals(&self, warehouse_item_id: &str) -> Result<u64, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let item_known: bool = connection
            .query_row(
                "SELECT 1 FROM warehouse_items WHERE warehouse_item_id = ?1",
                [warehouse_item_id],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        if !item_known {
            return Err(BdlStoreError::UnknownWarehouseItem(
                warehouse_item_id.to_string(),
            ));
        }
        let deleted = connection.execute(
            "DELETE FROM artifact_copies
             WHERE warehouse_item_id = ?1 AND role = 'original'",
            [warehouse_item_id],
        )?;
        Ok(deleted as u64)
    }

    /// The `warehouse.listEntries` read face: every entry card with its
    /// light artifact references, wire shapes per bdl-queries v0.3. The
    /// shell-level global mode default is injected per query — resolution
    /// stays dynamic (override ?? default), never an import-time snapshot.
    pub fn warehouse_entry_cards(
        &self,
        global_default: ArtifactMode,
    ) -> Result<Vec<WarehouseEntryCard>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let mut statement = connection.prepare(
            "SELECT warehouse_item_id, display_name, folder_name, kind,
                    artifact_mode, created_at
             FROM warehouse_items ORDER BY warehouse_item_id",
        )?;
        let items = statement
            .query_map([], |row| {
                Ok(StoredWarehouseItem {
                    warehouse_item_id: row.get(0)?,
                    display_name: row.get(1)?,
                    folder_name: row.get(2)?,
                    kind: row.get(3)?,
                    artifact_mode: row.get::<_, Option<String>>(4)?,
                    created_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        let mut cards = Vec::with_capacity(items.len());
        for item in items {
            let artifacts =
                self.warehouse_artifact_refs(&connection, &item.warehouse_item_id)?;
            cards.push(warehouse_card(item, global_default, artifacts));
        }
        Ok(cards)
    }

    /// The `warehouse.entryDetail` read face: per-artifact inspection facts
    /// plus source-correlation existence.
    pub fn warehouse_entry_detail(
        &self,
        warehouse_item_id: &str,
        global_default: ArtifactMode,
    ) -> Result<Option<WarehouseEntryDetail>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let item = connection
            .query_row(
                "SELECT warehouse_item_id, display_name, folder_name, kind,
                        artifact_mode, created_at
                 FROM warehouse_items WHERE warehouse_item_id = ?1",
                [warehouse_item_id],
                |row| {
                    Ok(StoredWarehouseItem {
                        warehouse_item_id: row.get(0)?,
                        display_name: row.get(1)?,
                        folder_name: row.get(2)?,
                        kind: row.get(3)?,
                        artifact_mode: row.get::<_, Option<String>>(4)?,
                        created_at: row.get(5)?,
                    })
                },
            )
            .optional()?;
        let Some(item) = item else {
            return Ok(None);
        };
        let mut statement = connection.prepare(
            "SELECT c.relative_path, a.artifact_sha256, a.inspection_state, a.size_bytes,
                    a.suggested_file_name, a.inspected_at, a.rejection_reason, c.role
             FROM artifact_copies c
             JOIN local_artifacts a ON a.artifact_sha256 = c.artifact_sha256
             WHERE c.warehouse_item_id = ?1
             ORDER BY c.relative_path",
        )?;
        let rows = statement
            .query_map([warehouse_item_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, String>(7)?,
                ))
            })?
            .collect::<Result<Vec<_>, _>>()?;
        let mut artifacts = Vec::with_capacity(rows.len());
        for (
            relative_path,
            artifact_sha256,
            inspection_state,
            size_bytes,
            suggested_file_name,
            inspected_at,
            rejection_reason,
            role,
        ) in rows
        {
            let mapped_product_ids = self.mapped_product_ids(&connection, &artifact_sha256)?;
            artifacts.push(WarehouseArtifactFact {
                relative_path,
                artifact_sha256,
                state: ArtifactInspectionVerdict::from_storage_state(
                    ArtifactInspectionState::parse(&inspection_state)?,
                ),
                size_bytes: to_u64(size_bytes, "artifact size")?,
                suggested_file_name,
                inspected_at,
                rejection_reason,
                source_correlated: !mapped_product_ids.is_empty(),
                mapped_product_ids,
                role: CopyRole::parse(&role)?,
            });
        }
        Ok(Some(WarehouseEntryDetail {
            warehouse_item_id: item.warehouse_item_id,
            folder_name: item.folder_name,
            display_name: item.display_name,
            kind: item.kind,
            artifact_mode: item
                .artifact_mode
                .as_deref()
                .map(|mode| ArtifactMode::parse(mode).expect("stored mode is enum-validated")),
            effective_artifact_mode: effective_mode(item.artifact_mode, global_default),
            created_at: item.created_at,
            artifacts,
        }))
    }

    fn warehouse_artifact_refs(
        &self,
        connection: &Connection,
        warehouse_item_id: &str,
    ) -> Result<Vec<WarehouseArtifactRef>, BdlStoreError> {
        let mut statement = connection.prepare(
            "SELECT c.relative_path, a.artifact_sha256, a.inspection_state, a.size_bytes, c.role
             FROM artifact_copies c
             JOIN local_artifacts a ON a.artifact_sha256 = c.artifact_sha256
             WHERE c.warehouse_item_id = ?1
             ORDER BY c.relative_path",
        )?;
        let rows = statement
            .query_map([warehouse_item_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, String>(4)?,
                ))
            })?
            .collect::<Result<Vec<_>, _>>()?;
        rows.into_iter()
            .map(
                |(relative_path, artifact_sha256, inspection_state, size_bytes, role)| {
                    Ok(WarehouseArtifactRef {
                        relative_path,
                        artifact_sha256,
                        state: ArtifactInspectionVerdict::from_storage_state(
                            ArtifactInspectionState::parse(&inspection_state)?,
                        ),
                        size_bytes: to_u64(size_bytes, "artifact size")?,
                        role: CopyRole::parse(&role)?,
                    })
                },
            )
            .collect()
    }

    fn mapped_product_ids(
        &self,
        connection: &Connection,
        artifact_sha256: &str,
    ) -> Result<Vec<String>, BdlStoreError> {
        let mut statement = connection.prepare(
            "SELECT product_id FROM artifact_mappings
             WHERE artifact_sha256 = ?1 ORDER BY product_id",
        )?;
        let rows = statement.query_map([artifact_sha256], |row| row.get::<_, String>(0))?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(BdlStoreError::from)
    }

    #[cfg(test)]
    fn pragma_i64(&self, name: &str) -> Result<i64, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        Ok(connection.pragma_query_value(None, name, |row| row.get(0))?)
    }

    /// Seed one minimal synthetic observed-product row (boundary IN-1). The
    /// real row belongs to the observation pipeline; tests need it only so
    /// artifact mappings can reference a product that was "observed".
    pub fn seed_product(
        &self,
        product_id: &str,
        native_product_id: &str,
    ) -> Result<(), BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        connection.execute(
            "INSERT INTO products(
                product_id, native_product_id, source_url, status,
                content_hash, observed_at, processor_version
             ) VALUES (?1, ?2, ?3, 'complete', ?4, ?5, 'synthetic-test')",
            params![
                product_id,
                native_product_id,
                format!("https://booth.example.com/items/{native_product_id}"),
                "sha256:0000000000000000000000000000000000000000000000000000000000000000",
                "2026-09-06T00:00:00.000Z",
            ],
        )?;
        Ok(())
    }

    // --- catalog serving face (W12; docs/protocols/bdl-queries-v0.3) ---

    /// `catalog.list`: assembles the v0.3 card list from the observation
    /// products table. Tombstones (`status = 'missing'`, 404/410 keepsakes)
    /// are never cards. Until the observation pipeline writes, the table is
    /// empty and this answers the honest empty set — 空态即终态. Presentation
    /// fields assemble as the schema's honest empty shapes (null / [] /
    /// derived-unknown) until observation rows carry them; the availability
    /// filter therefore matches only `unknown` rows today, and `available`/
    /// `unavailable` filters answer an empty set (never a fabricated match).
    pub fn catalog_list(
        &self,
        params: &CatalogListParams,
    ) -> Result<CatalogListResult, BdlStoreError> {
        if params.availability_status == Some(AvailabilityStatus::Available)
            || params.availability_status == Some(AvailabilityStatus::Unavailable)
        {
            // No observation row carries a derived available/unavailable
            // status yet: the filter is honest, the empty set is the answer.
            return Ok(CatalogListResult { total: 0, entries: Vec::new() });
        }
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let mut statement = connection.prepare(
            "SELECT product_id FROM products
             WHERE status = 'complete'
             ORDER BY product_id",
        )?;
        let ids: Vec<String> = statement
            .query_map([], |row| row.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?;
        drop(statement);

        let needle = params.text.as_ref().map(|text| text.to_ascii_lowercase());
        let matched: Vec<&String> = ids
            .iter()
            .filter(|product_id| match &needle {
                // text is a case-insensitive substring over title and
                // productId; titles are not observed yet, so productId alone
                // is the honest match surface.
                Some(needle) => product_id.to_ascii_lowercase().contains(needle),
                None => true,
            })
            .collect();

        let total = matched.len() as i64;
        let entries = matched
            .iter()
            .skip(params.offset as usize)
            .take(params.limit as usize)
            .map(|product_id| CatalogProductSummary {
                product_id: (*product_id).clone(),
                title: None,
                price: None,
                image_url: None,
                image_urls: Vec::new(),
                availability_raw: None,
                availability_status: AvailabilityStatus::Unknown,
                entity_count: 0,
                entity_types: Vec::new(),
            })
            .collect();
        Ok(CatalogListResult { total, entries })
    }

    /// `catalog.detail`: assembles one v0.3 product detail. Unknown ids and
    /// tombstones answer `None` (the application face owns the miss code);
    /// presentation fields assemble as the honest empty shapes until the
    /// observation pipeline carries them.
    pub fn catalog_detail(
        &self,
        product_id: &str,
    ) -> Result<Option<CatalogDetailResult>, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let known: bool = connection
            .query_row(
                "SELECT 1 FROM products WHERE product_id = ?1 AND status = 'complete'",
                [product_id],
                |_| Ok(()),
            )
            .optional()?
            .is_some();
        drop(connection);
        if !known {
            return Ok(None);
        }
        Ok(Some(CatalogDetailResult {
            product: CatalogProductDetail {
                product_id: product_id.to_owned(),
                title: None,
                price: None,
                image_url: None,
                image_urls: Vec::new(),
                availability_raw: None,
                availability_status: AvailabilityStatus::Unknown,
                entity_count: 0,
                entity_types: Vec::new(),
                description: None,
                shop_name: None,
                shop_url: None,
                age_restriction: None,
                adult: false,
                video_urls: Vec::new(),
                source_category: None,
                subproducts: Vec::new(),
            },
        }))
    }

    /// `catalog.status`: health and revision snapshot. The health is
    /// `unknown` until the observation-pipeline bookkeeping counter exists
    /// in `bdl_meta` (protocol v0.3: 观察管线未落数据前 health = unknown —
    /// 空态即终态); `datasetRevision` is the BDL format_version.
    pub fn catalog_status(&self) -> Result<CatalogStatusResult, BdlStoreError> {
        let connection = self.connection.lock().expect("SQLite connection poisoned");
        let catalog_updated_seq: Option<i64> = connection
            .query_row(
                "SELECT value FROM bdl_meta WHERE key = 'catalog_updated_seq'",
                [],
                |row| row.get::<_, String>(0),
            )
            .optional()?
            .and_then(|value| value.parse().ok());
        let dataset_revision: String = connection
            .query_row(
                "SELECT value FROM bdl_meta WHERE key = 'format_version'",
                [],
                |row| row.get(0),
            )
            .optional()?
            .ok_or_else(|| BdlStoreError::UnsupportedFormat("missing".into()))?;
        drop(connection);
        Ok(CatalogStatusResult {
            health: if catalog_updated_seq.is_some() {
                CatalogHealth::Ok
            } else {
                CatalogHealth::Unknown
            },
            revision: CatalogRevision { catalog_updated_seq, dataset_revision },
        })
    }
}

fn select_download_events(
    connection: &Connection,
    download_id: &str,
) -> Result<Vec<StoredDownloadEvent>, BdlStoreError> {
    let mut statement = connection.prepare(
        "SELECT event_id, download_id, attempt, kind, source_url,
                initiated_from_page_url, url_chain, suggested_file_name,
                stored_path, expected_bytes, received_bytes, resumable,
                failure_kind, occurred_at
         FROM download_events
         WHERE download_id = ?1
         ORDER BY attempt, event_id",
    )?;
    let rows = statement.query_map([download_id], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, String>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, Option<String>>(6)?,
            row.get::<_, Option<String>>(7)?,
            row.get::<_, Option<String>>(8)?,
            row.get::<_, Option<i64>>(9)?,
            row.get::<_, Option<i64>>(10)?,
            row.get::<_, i64>(11)?,
            row.get::<_, Option<String>>(12)?,
            row.get::<_, String>(13)?,
        ))
    })?;
    let mut events = Vec::new();
    for row in rows {
        let (
            event_id,
            download_id,
            attempt,
            kind,
            source_url,
            initiated_from_page_url,
            url_chain,
            suggested_file_name,
            stored_path,
            expected_bytes,
            received_bytes,
            resumable,
            failure_kind,
            occurred_at,
        ) = row?;
        events.push(StoredDownloadEvent {
            event_id,
            download_id,
            attempt: to_u64(attempt, "attempt")? as u32,
            kind: parse_download_event_kind(&kind)?,
            source_url,
            initiated_from_page_url,
            url_chain: url_chain
                .map(|json| serde_json::from_str(&json))
                .transpose()?,
            suggested_file_name,
            stored_path,
            expected_bytes: expected_bytes
                .map(|v| to_u64(v, "expected bytes"))
                .transpose()?,
            received_bytes: received_bytes
                .map(|v| to_u64(v, "received bytes"))
                .transpose()?,
            resumable: resumable != 0,
            failure_kind: failure_kind.as_deref().map(parse_failure_kind).transpose()?,
            occurred_at,
        });
    }
    Ok(events)
}

fn select_artifact(
    connection: &Connection,
    artifact_sha256: &str,
) -> Result<Option<StoredArtifact>, BdlStoreError> {
    let row = connection
        .query_row(
            "SELECT artifact_sha256, size_bytes, suggested_file_name,
                    inspection_state, rejection_reason, inspected_at,
                    download_id, first_seen_at
             FROM local_artifacts WHERE artifact_sha256 = ?1",
            [artifact_sha256],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, Option<String>>(6)?,
                    row.get::<_, String>(7)?,
                ))
            },
        )
        .optional()?;
    row.map(
        |(
            artifact_sha256,
            size_bytes,
            suggested_file_name,
            inspection_state,
            rejection_reason,
            inspected_at,
            download_id,
            first_seen_at,
        )| {
            Ok(StoredArtifact {
                artifact_sha256,
                size_bytes: to_u64(size_bytes, "artifact size")?,
                suggested_file_name,
                inspection_state: ArtifactInspectionState::parse(&inspection_state)?,
                rejection_reason,
                inspected_at,
                download_id,
                first_seen_at,
            })
        },
    )
    .transpose()
}

fn is_sha256_identity(value: &str) -> bool {
    let Some(hex) = value.strip_prefix("sha256:") else {
        return false;
    };
    hex.len() == 64 && hex.bytes().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}

fn download_event_kind_name(kind: DownloadEventKind) -> &'static str {
    match kind {
        DownloadEventKind::Started => "started",
        DownloadEventKind::Progress => "progress",
        DownloadEventKind::Interrupted => "interrupted",
        DownloadEventKind::Completed => "completed",
        DownloadEventKind::Cancelled => "cancelled",
        DownloadEventKind::Failed => "failed",
    }
}

fn parse_download_event_kind(value: &str) -> Result<DownloadEventKind, BdlStoreError> {
    match value {
        "started" => Ok(DownloadEventKind::Started),
        "progress" => Ok(DownloadEventKind::Progress),
        "interrupted" => Ok(DownloadEventKind::Interrupted),
        "completed" => Ok(DownloadEventKind::Completed),
        "cancelled" => Ok(DownloadEventKind::Cancelled),
        "failed" => Ok(DownloadEventKind::Failed),
        _ => Err(BdlStoreError::CorruptValue {
            field: "download event kind",
            value: value.into(),
        }),
    }
}

fn failure_kind_name(kind: DownloadFailureKind) -> &'static str {
    match kind {
        DownloadFailureKind::Policy => "policy",
        DownloadFailureKind::Unknown => "unknown",
    }
}

fn parse_failure_kind(value: &str) -> Result<DownloadFailureKind, BdlStoreError> {
    match value {
        "policy" => Ok(DownloadFailureKind::Policy),
        "unknown" => Ok(DownloadFailureKind::Unknown),
        _ => Err(BdlStoreError::CorruptValue {
            field: "download failure kind",
            value: value.into(),
        }),
    }
}

fn to_i64(value: u64, field: &'static str) -> Result<i64, BdlStoreError> {
    i64::try_from(value).map_err(|_| BdlStoreError::CorruptValue {
        field,
        value: value.to_string(),
    })
}

fn to_u64(value: i64, field: &'static str) -> Result<u64, BdlStoreError> {
    u64::try_from(value).map_err(|_| BdlStoreError::CorruptValue {
        field,
        value: value.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::download_events::DOWNLOAD_EVENT_SCHEMA_VERSION;

    const SHA_A: &str = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const SHA_B: &str = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    fn started_event(download_id: &str, occurred_at: &str) -> DownloadEventV01 {
        DownloadEventV01 {
            schema_version: DOWNLOAD_EVENT_SCHEMA_VERSION.into(),
            kind: DownloadEventKind::Started,
            download_id: download_id.into(),
            attempt: 1,
            source_url: "https://booth.example.com/download/1000001/fixture".into(),
            initiated_from_page_url: Some("https://booth.example.com/items/1000001".into()),
            url_chain: Some(vec![
                "https://booth.example.com/download/1000001/fixture".into(),
                "https://cdn.example.com/materials/pack.zip".into(),
            ]),
            suggested_file_name: Some("pack.zip".into()),
            stored_path: Some("C:\\staging\\dl-1-pack.zip".into()),
            expected_bytes: Some(1024),
            received_bytes: Some(0),
            resumable: true,
            failure_kind: None,
            occurred_at: occurred_at.into(),
        }
    }

    #[test]
    fn migration_creates_explicit_format_and_full_durability() {
        let store = BdlStore::open_in_memory().unwrap();
        assert_eq!(store.pragma_i64("synchronous").unwrap(), 2);
        let connection = store.connection.lock().unwrap();
        let format: String = connection
            .query_row(
                "SELECT value FROM bdl_meta WHERE key = 'format_version'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(format, "0.1");
    }

    #[test]
    fn download_events_are_deduped_on_the_unique_delivery_key() {
        let store = BdlStore::open_in_memory().unwrap();
        let event = started_event("dl-1", "2026-09-06T08:15:00.000Z");
        let (first_outcome, first) = store.append_download_event(&event).unwrap();
        assert_eq!(first_outcome, EventAppendence::Inserted);
        assert_eq!(first.event_id, 1);

        let redelivered = started_event("dl-1", "2026-09-06T08:15:00.000Z");
        let (second_outcome, second) = store.append_download_event(&redelivered).unwrap();
        assert_eq!(second_outcome, EventAppendence::Duplicate);
        assert_eq!(second.event_id, first.event_id);
        assert_eq!(store.download_events("dl-1").unwrap().len(), 1);

        let next_attempt =
            started_event("dl-1", "2026-09-06T08:16:00.000Z");
        let (third_outcome, _) = store.append_download_event(&next_attempt).unwrap();
        assert_eq!(third_outcome, EventAppendence::Inserted);
        assert_eq!(store.download_events("dl-1").unwrap().len(), 2);
    }

    #[test]
    fn download_events_roundtrip_every_transport_fact() {
        let store = BdlStore::open_in_memory().unwrap();
        store.append_download_event(&started_event("dl-1", "2026-09-06T08:15:00.000Z")).unwrap();
        let stored = &store.download_events("dl-1").unwrap()[0];
        assert_eq!(stored.kind, DownloadEventKind::Started);
        assert_eq!(stored.attempt, 1);
        assert_eq!(
            stored.url_chain.as_deref(),
            Some(&[
                "https://booth.example.com/download/1000001/fixture".to_string(),
                "https://cdn.example.com/materials/pack.zip".to_string(),
            ][..])
        );
        assert_eq!(stored.expected_bytes, Some(1024));
        assert!(stored.resumable);

        let failure = DownloadEventV01 {
            kind: DownloadEventKind::Failed,
            attempt: 3,
            stored_path: None,
            received_bytes: None,
            resumable: false,
            failure_kind: Some(DownloadFailureKind::Unknown),
            initiated_from_page_url: None,
            url_chain: None,
            suggested_file_name: None,
            expected_bytes: None,
            ..started_event("dl-2", "2026-09-06T08:20:00.000Z")
        };
        store.append_download_event(&failure).unwrap();
        let stored = &store.download_events("dl-2").unwrap()[0];
        assert_eq!(stored.failure_kind, Some(DownloadFailureKind::Unknown));
        assert_eq!(stored.stored_path, None);
        assert!(!stored.resumable);
    }

    #[test]
    fn mechanically_invalid_events_never_reach_the_database() {
        let store = BdlStore::open_in_memory().unwrap();
        let mut event = started_event("dl-1", "2026-09-06T08:15:00.000Z");
        event.schema_version = "9.9".into();
        assert!(matches!(
            store.append_download_event(&event),
            Err(BdlStoreError::InvalidEvent("schema version"))
        ));
        let mut event = started_event("dl-1", "2026-09-06T08:15:00.000Z");
        event.attempt = 0;
        assert!(matches!(
            store.append_download_event(&event),
            Err(BdlStoreError::InvalidEvent("attempt"))
        ));
    }

    #[test]
    fn artifact_lifecycle_enforces_the_legal_transitions() {
        let store = BdlStore::open_in_memory().unwrap();
        let recording = store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: SHA_A.into(),
                size_bytes: 4096,
                suggested_file_name: Some("pack.zip".into()),
                download_id: Some("dl-1".into()),
                first_seen_at: "2026-09-06T08:15:00.000Z".into(),
            })
            .unwrap();
        assert_eq!(recording.outcome, ArtifactRecordingOutcome::Created);
        assert_eq!(recording.artifact.inspection_state, ArtifactInspectionState::Untrusted);

        // The same content sighted again (re-download) never duplicates a row.
        let again = store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: SHA_A.into(),
                size_bytes: 4096,
                suggested_file_name: None,
                download_id: Some("dl-2".into()),
                first_seen_at: "2026-09-06T09:00:00.000Z".into(),
            })
            .unwrap();
        assert_eq!(again.outcome, ArtifactRecordingOutcome::Existing);
        assert_eq!(
            again.artifact.download_id.as_deref(),
            Some("dl-1"),
            "the original sighting row stays"
        );

        // A size disagreement under one content identity is corruption.
        let conflicting = store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: SHA_A.into(),
                size_bytes: 8192,
                suggested_file_name: None,
                download_id: None,
                first_seen_at: "2026-09-06T09:00:01.000Z".into(),
            })
            .unwrap_err();
        assert!(matches!(conflicting, BdlStoreError::CorruptValue { field: "artifact size", .. }));

        store
            .transition_artifact(SHA_A, ArtifactInspectionState::Inspected, "2026-09-06T08:16:00.000Z", None)
            .unwrap();
        store
            .transition_artifact(SHA_A, ArtifactInspectionState::Admitted, "2026-09-06T08:17:00.000Z", None)
            .unwrap();
        let admitted = store.artifact(SHA_A).unwrap().unwrap();
        assert_eq!(admitted.inspection_state, ArtifactInspectionState::Admitted);
        assert_eq!(admitted.inspected_at.as_deref(), Some("2026-09-06T08:16:00.000Z"));
        assert!(matches!(
            store.transition_artifact(SHA_A, ArtifactInspectionState::Rejected, "2026-09-06T08:18:00.000Z", Some("late")),
            Err(BdlStoreError::InvalidTransition { to: ArtifactInspectionState::Rejected, .. })
        ));
    }

    #[test]
    fn rejection_is_terminal_and_always_carries_a_reason() {
        let store = BdlStore::open_in_memory().unwrap();
        store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: SHA_B.into(),
                size_bytes: 1,
                suggested_file_name: Some("setup.exe".into()),
                download_id: Some("dl-3".into()),
                first_seen_at: "2026-09-06T08:15:00.000Z".into(),
            })
            .unwrap();
        assert!(matches!(
            store.transition_artifact(SHA_B, ArtifactInspectionState::Rejected, "2026-09-06T08:15:01.000Z", None),
            Err(BdlStoreError::InvalidEvent(_))
        ));
        store
            .transition_artifact(
                SHA_B,
                ArtifactInspectionState::Rejected,
                "2026-09-06T08:15:01.000Z",
                Some("extension not in the allowed list"),
            )
            .unwrap();
        let rejected = store.artifact(SHA_B).unwrap().unwrap();
        assert_eq!(rejected.inspection_state, ArtifactInspectionState::Rejected);
        assert_eq!(
            rejected.rejection_reason.as_deref(),
            Some("extension not in the allowed list")
        );
        assert!(matches!(
            store.transition_artifact(SHA_B, ArtifactInspectionState::Inspected, "2026-09-06T08:16:00.000Z", None),
            Err(BdlStoreError::InvalidTransition { .. })
        ));
    }

    #[test]
    fn mapping_requires_an_observed_product_and_is_idempotent() {
        let store = BdlStore::open_in_memory().unwrap();
        store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: SHA_A.into(),
                size_bytes: 4096,
                suggested_file_name: None,
                download_id: None,
                first_seen_at: "2026-09-06T08:15:00.000Z".into(),
            })
            .unwrap();
        assert!(
            matches!(
                store.record_artifact_mapping(SHA_A, "booth:9999999", None, None, "2026-09-06T08:20:00.000Z"),
                Err(BdlStoreError::UnknownProduct(product)) if product == "booth:9999999"
            ),
            "the mapping target must have been observed by the pipeline"
        );
        store.seed_product("booth:1000001", "1000001").unwrap();
        assert_eq!(
            store
                .record_artifact_mapping(SHA_A, "booth:1000001", Some("2000001"), Some("download"), "2026-09-06T08:20:00.000Z")
                .unwrap(),
            ArtifactMappingOutcome::Created
        );
        assert_eq!(
            store
                .record_artifact_mapping(SHA_A, "booth:1000001", None, None, "2026-09-06T08:21:00.000Z")
                .unwrap(),
            ArtifactMappingOutcome::Existing
        );
        assert!(matches!(
            store.record_artifact_mapping(SHA_B, "booth:1000001", None, None, "2026-09-06T08:22:00.000Z"),
            Err(BdlStoreError::UnknownArtifact(_))
        ));
    }

    #[test]
    fn warehouse_items_and_copies_support_the_v0_3_read_face() {
        let store = BdlStore::open_in_memory().unwrap();
        let item = store
            .create_warehouse_item("Fixture Material Pack", "imported_material", "2026-09-06T08:20:00.000Z")
            .unwrap();
        assert!(item.warehouse_item_id.starts_with("whi-"));
        assert_eq!(
            item.folder_name, item.warehouse_item_id,
            "the generated identity is the entry's folder name"
        );
        assert!(matches!(
            store.record_artifact_copy(&item.warehouse_item_id, SHA_A, "original/pack.zip", "C:\\wh\\pack.zip", CopyRole::Original, "t"),
            Err(BdlStoreError::UnknownArtifact(_))
        ));
        assert!(matches!(
            store.record_artifact_copy("whi-nope", SHA_A, "original/pack.zip", "C:\\wh\\pack.zip", CopyRole::Original, "t"),
            Err(BdlStoreError::UnknownWarehouseItem(_))
        ));

        store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: SHA_A.into(),
                size_bytes: 4096,
                suggested_file_name: Some("pack.zip".into()),
                download_id: None,
                first_seen_at: "2026-09-06T08:20:00.000Z".into(),
            })
            .unwrap();
        store
            .transition_artifact(SHA_A, ArtifactInspectionState::Inspected, "2026-09-06T08:21:00.000Z", None)
            .unwrap();
        store
            .record_artifact_copy(
                &item.warehouse_item_id,
                SHA_A,
                "original/pack.zip",
                "C:\\warehouse\\original\\pack.zip",
                CopyRole::Original,
                "2026-09-06T08:22:00.000Z",
            )
            .unwrap();
        assert!(matches!(
            store.record_artifact_copy(&item.warehouse_item_id, SHA_A, "original/pack.zip", "again", CopyRole::Original, "t"),
            Err(BdlStoreError::CorruptValue { field: "artifact copy", .. })
        ));

        let cards = store.warehouse_entry_cards(ArtifactMode::UseOriginalUnitypackage).unwrap();
        assert_eq!(cards.len(), 1);
        assert_eq!(cards[0].artifacts.len(), 1);
        assert_eq!(cards[0].artifacts[0].state, ArtifactInspectionVerdict::Pending);
        assert_eq!(cards[0].artifacts[0].role, CopyRole::Original);
        assert_eq!(cards[0].artifact_mode, None, "no override = follows global");
        assert_eq!(
            cards[0].effective_artifact_mode,
            ArtifactMode::UseOriginalUnitypackage
        );
        let wire = serde_json::to_value(&cards[0]).unwrap();
        assert_eq!(wire["warehouseItemId"], item.warehouse_item_id);
        assert_eq!(wire["artifacts"][0]["sizeBytes"], 4096);
        assert_eq!(wire["artifacts"][0]["role"], "original");

        // The override is a preference: set it and dynamic resolution follows;
        // clear it and the entry follows the global default again.
        store
            .set_artifact_mode(&item.warehouse_item_id, Some(ArtifactMode::GenerateVpm))
            .unwrap();
        let cards = store.warehouse_entry_cards(ArtifactMode::UseOriginalUnitypackage).unwrap();
        assert_eq!(cards[0].artifact_mode, Some(ArtifactMode::GenerateVpm));
        assert_eq!(cards[0].effective_artifact_mode, ArtifactMode::GenerateVpm);
        store.set_artifact_mode(&item.warehouse_item_id, None).unwrap();
        let cards = store.warehouse_entry_cards(ArtifactMode::GenerateVpm).unwrap();
        assert_eq!(cards[0].artifact_mode, None);
        assert_eq!(cards[0].effective_artifact_mode, ArtifactMode::GenerateVpm);
        assert!(matches!(
            store.set_artifact_mode("whi-nope", Some(ArtifactMode::GenerateVpm)),
            Err(BdlStoreError::UnknownWarehouseItem(_))
        ));

        // delete-originals removes only original rows — exercised after the
        // mapping assertions below, since it empties the entry's artifacts.
        assert!(matches!(
            store.delete_entry_originals("whi-nope"),
            Err(BdlStoreError::UnknownWarehouseItem(_))
        ));

        let detail = store.warehouse_entry_detail(&item.warehouse_item_id, ArtifactMode::UseOriginalUnitypackage).unwrap().unwrap();
        assert!(!detail.artifacts[0].source_correlated);
        store.seed_product("booth:1000001", "1000001").unwrap();
        store
            .record_artifact_mapping(SHA_A, "booth:1000001", None, None, "2026-09-06T08:23:00.000Z")
            .unwrap();
        let detail = store.warehouse_entry_detail(&item.warehouse_item_id, ArtifactMode::UseOriginalUnitypackage).unwrap().unwrap();
        assert!(detail.artifacts[0].source_correlated);
        assert_eq!(detail.artifacts[0].mapped_product_ids, vec!["booth:1000001"]);
        assert_eq!(store.warehouse_entry_detail("whi-nope", ArtifactMode::UseOriginalUnitypackage).unwrap(), None);

        let deleted = store.delete_entry_originals(&item.warehouse_item_id).unwrap();
        assert_eq!(deleted, 1);
        let cards = store.warehouse_entry_cards(ArtifactMode::UseOriginalUnitypackage).unwrap();
        assert_eq!(cards[0].artifacts.len(), 0, "generated_vpm copies would survive");
    }

    #[test]
    fn persisted_facts_survive_a_restart() {
        let path = std::env::temp_dir().join(format!(
            "vua-bdl-restart-{}.db",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        {
            let store = BdlStore::open(&path).unwrap();
            store
                .append_download_event(&started_event("dl-1", "2026-09-06T08:15:00.000Z"))
                .unwrap();
            store
                .record_untrusted_artifact(&NewLocalArtifact {
                    artifact_sha256: SHA_A.into(),
                    size_bytes: 4096,
                    suggested_file_name: None,
                    download_id: Some("dl-1".into()),
                    first_seen_at: "2026-09-06T08:15:00.000Z".into(),
                })
                .unwrap();
            store.checkpoint().unwrap();
        }
        let reopened = BdlStore::open(&path).unwrap();
        assert_eq!(reopened.download_events("dl-1").unwrap().len(), 1);
        assert_eq!(
            reopened.artifact(SHA_A).unwrap().unwrap().inspection_state,
            ArtifactInspectionState::Untrusted
        );
        drop(reopened);
        std::fs::remove_file(&path).ok();
    }
}
