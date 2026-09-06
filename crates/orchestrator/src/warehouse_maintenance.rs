//! Warehouse entry maintenance — the delete-originals flow (B4-7 artifact-
//! mode slice, adjudicated 2026-09-06).
//!
//! Deleting the originals of an entry is the audited destructive half of the
//! "use VPM package" mode (warehouse-layout ruling 5). The task runs ONLY
//! under the adjudicated guards:
//!
//! - **(c) effective mode**: the entry's resolved mode must be
//!   `generate_vpm` — otherwise `vua.warehouse.invalid_state`; a "mode says
//!   original, originals deleted" split state must never be creatable;
//! - **(a)/(b) generated artifact present and verified**: the entry holds at
//!   least one `generated_vpm` copy whose physical file exists and whose
//!   content digest matches its recorded identity — otherwise
//!   `vua.warehouse.generated_artifact_missing`;
//!
//! and the deletion itself is per-copy consistent: each physical file is
//! removed before its row, so an interrupted run leaves rows and files in
//! agreement and a retry resumes with the remaining originals. Generated VPM
//! copies and all content-keyed inspection facts survive. Every deletion is
//! reported in the task result — the audit trail the adjudication requires.

use crate::artifact_inspection::{hex_lower, sha256_file};
use crate::bdl_store::{
    ArtifactMode, BdlStore, BdlStoreError, CopyRole,
};
use crate::contracts::{ErrorCategory, ParamValue};
use crate::material_exec::{MaterialCancelToken, MaterialExecutor};
use crate::runtime::{SubmitRequest, TaskExit, TaskJob, TaskRuntime};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

#[derive(Debug)]
pub enum MaintenanceError {
    Store(BdlStoreError),
    Io(std::io::Error),
    UnknownEntry(String),
    /// Guard (c): the entry's effective mode is not generate_vpm.
    InvalidState {
        entry_id: String,
        effective_mode: ArtifactMode,
    },
    /// Guards (a)/(b): no generated VPM copy, or one whose file is missing
    /// or whose content no longer matches its recorded identity.
    GeneratedArtifactMissing {
        entry_id: String,
        reason: String,
    },
    /// Generate guard: the entry holds no original material to generate from.
    NoOriginalMaterial {
        entry_id: String,
    },
    /// Generate guard: a generated VPM artifact already exists — never
    /// silently replaced (delete the entry's VPM copy to regenerate).
    AlreadyGenerated {
        entry_id: String,
    },
    /// Generation failed inside the staging chain (staging/bridge/archive),
    /// carrying the stable intake-style code.
    GenerationFailed {
        code: String,
        message: String,
    },
}

impl From<BdlStoreError> for MaintenanceError {
    fn from(error: BdlStoreError) -> Self {
        Self::Store(error)
    }
}

impl From<std::io::Error> for MaintenanceError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error)
    }
}

impl std::fmt::Display for MaintenanceError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Store(error) => write!(formatter, "{error}"),
            Self::Io(error) => write!(formatter, "warehouse maintenance failed: {error}"),
            Self::UnknownEntry(entry_id) => {
                write!(formatter, "unknown warehouse entry {entry_id}")
            }
            Self::InvalidState {
                entry_id,
                effective_mode,
            } => write!(
                formatter,
                "entry {entry_id} is in mode {}; originals may only be deleted in mode generate_vpm",
                effective_mode.name()
            ),
            Self::GeneratedArtifactMissing { entry_id, reason } => {
                write!(
                    formatter,
                    "entry {entry_id}: the generated VPM artifact failed verification: {reason}"
                )
            }
            Self::NoOriginalMaterial { entry_id } => {
                write!(formatter, "entry {entry_id} holds no original material to generate from")
            }
            Self::AlreadyGenerated { entry_id } => {
                write!(formatter, "entry {entry_id} already has a generated VPM artifact")
            }
            Self::GenerationFailed { code, message } => {
                write!(formatter, "generation failed ({code}): {message}")
            }
        }
    }
}

impl std::error::Error for MaintenanceError {}

/// One delete-originals task binding. The shell-level global mode default
/// rides along for guard (c)'s dynamic resolution.
#[derive(Debug, Clone)]
pub struct DeleteOriginalsTaskSpec {
    pub correlation_id: String,
    pub warehouse_item_id: String,
    pub global_default: ArtifactMode,
}

/// Audit payload (Done exit): what was deleted, what was kept.
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteOriginalsResult {
    pub correlation_id: String,
    pub warehouse_item_id: String,
    pub deleted_count: u64,
    pub deleted_relative_paths: Vec<String>,
    pub kept_generated_sha256: Option<String>,
}

fn maintenance_error_to_app(error: MaintenanceError, correlation_id: &str) -> crate::AppErrorV1 {
    let (code, category, params): (String, ErrorCategory, Vec<(String, String)>) = match &error {
        MaintenanceError::Store(_) => (
            "vua.warehouse.storeFailed".to_owned().to_owned(),
            ErrorCategory::Internal,
            Vec::new(),
        ),
        MaintenanceError::Io(_) => (
            "vua.warehouse.maintenanceIoFailed".to_owned(),
            ErrorCategory::ExternalFailure,
            Vec::new(),
        ),
        MaintenanceError::UnknownEntry(entry_id) => (
            "vua.warehouse.entry_not_found".to_owned(),
            ErrorCategory::Validation,
            vec![("warehouseItemId".to_owned(), entry_id.clone())],
        ),
        MaintenanceError::InvalidState {
            entry_id,
            effective_mode,
        } => (
            "vua.warehouse.invalid_state".to_owned(),
            ErrorCategory::Conflict,
            vec![
                ("warehouseItemId".to_owned(), entry_id.clone()),
                ("effectiveMode".to_owned(), effective_mode.name().to_string()),
            ],
        ),
        MaintenanceError::GeneratedArtifactMissing { entry_id, reason } => (
            "vua.warehouse.generated_artifact_missing".to_owned(),
            ErrorCategory::Conflict,
            vec![
                ("warehouseItemId".to_owned(), entry_id.clone()),
                ("reason".to_owned(), reason.clone()),
            ],
        ),
        MaintenanceError::NoOriginalMaterial { entry_id } => (
            "vua.warehouse.no_original_material".to_owned(),
            ErrorCategory::Conflict,
            vec![("warehouseItemId".to_owned(), entry_id.clone())],
        ),
        MaintenanceError::AlreadyGenerated { entry_id } => (
            "vua.warehouse.already_generated".to_owned(),
            ErrorCategory::Conflict,
            vec![("warehouseItemId".to_owned(), entry_id.clone())],
        ),
        MaintenanceError::GenerationFailed { code, message } => (
            "vua.warehouse.generation_failed".to_owned().to_owned(),
            ErrorCategory::ExternalFailure,
            vec![
                ("code".to_owned(), code.clone()),
                ("reason".to_owned(), message.clone()),
            ],
        ),
    };
    let mut app = crate::AppErrorV1::new(
        &code,
        category,
        "errors.warehouse.maintenanceFailed",
        correlation_id,
    )
    .with_recoverable(true);
    for (name, value) in params {
        app = app.with_param(name.as_str(), ParamValue::Text(value));
    }
    app
}

/// Guards (a)/(b): the entry holds generated VPM copies and every one of
/// them physically exists with content matching its recorded identity.
fn verify_generated_copies(
    copies: &[crate::bdl_store::StoredArtifactCopy],
    entry_id: &str,
) -> Result<Option<String>, MaintenanceError> {
    let generated: Vec<&crate::bdl_store::StoredArtifactCopy> = copies
        .iter()
        .filter(|copy| copy.role == CopyRole::GeneratedVpm)
        .collect();
    let Some(first) = generated.first() else {
        return Err(MaintenanceError::GeneratedArtifactMissing {
            entry_id: entry_id.to_string(),
            reason: "the entry holds no generated VPM artifact".into(),
        });
    };
    for copy in &generated {
        let path = PathBuf::from(&copy.stored_path);
        let digest = sha256_file(&path).map_err(|error| {
            MaintenanceError::GeneratedArtifactMissing {
                entry_id: entry_id.to_string(),
                reason: format!("{} is unreadable: {}", copy.stored_path, error),
            }
        })?;
        let identity = format!("sha256:{}", hex_lower(&digest));
        if identity != copy.artifact_sha256 {
            return Err(MaintenanceError::GeneratedArtifactMissing {
                entry_id: entry_id.to_string(),
                reason: format!(
                    "{} hashes to {}, the generation receipt recorded {}",
                    copy.stored_path, identity, copy.artifact_sha256
                ),
            });
        }
    }
    Ok(Some(first.artifact_sha256.clone()))
}

fn run_delete_originals(
    store: &BdlStore,
    spec: &DeleteOriginalsTaskSpec,
    ctx: &crate::runtime::TaskContext,
) -> Result<TaskExit, MaintenanceError> {
    let detail = store
        .warehouse_entry_detail(&spec.warehouse_item_id, spec.global_default)?
        .ok_or_else(|| MaintenanceError::UnknownEntry(spec.warehouse_item_id.clone()))?;

    // Guard (c): only the generate_vpm mode may lose its originals.
    if detail.effective_artifact_mode != ArtifactMode::GenerateVpm {
        return Err(MaintenanceError::InvalidState {
            entry_id: spec.warehouse_item_id.clone(),
            effective_mode: detail.effective_artifact_mode,
        });
    }

    let copies = store.entry_copies(&spec.warehouse_item_id)?;
    let kept_generated = verify_generated_copies(&copies, &spec.warehouse_item_id)?;

    let originals: Vec<&crate::bdl_store::StoredArtifactCopy> = copies
        .iter()
        .filter(|copy| copy.role == CopyRole::Original)
        .collect();
    let mut deleted_paths = Vec::new();
    for copy in originals {
        if ctx.check_cancel() {
            ctx.emit_progress(serde_json::json!({
                "kind": "warehouse.deleteOriginals.cancelled",
                "deletedCount": deleted_paths.len(),
            }));
            return Ok(TaskExit::Cancelled);
        }
        // A vanished file is drift, and deleting the row is the repair; any
        // other removal failure fails the task with the row kept for retry.
        match std::fs::remove_file(&copy.stored_path) {
            Ok(()) => {}
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(MaintenanceError::Io(error)),
        }
        store.delete_artifact_copy(&copy.copy_id)?;
        deleted_paths.push(copy.relative_path.clone());
        ctx.emit_progress(serde_json::json!({
            "kind": "warehouse.deleteOriginals.originalDeleted",
            "relativePath": copy.relative_path,
            "deletedCount": deleted_paths.len(),
        }));
    }

    let result = DeleteOriginalsResult {
        correlation_id: spec.correlation_id.clone(),
        warehouse_item_id: spec.warehouse_item_id.clone(),
        deleted_count: deleted_paths.len() as u64,
        kept_generated_sha256: kept_generated,
        deleted_relative_paths: deleted_paths,
    };
    let payload = serde_json::to_value(&result).unwrap_or(serde_json::Value::Null);
    Ok(TaskExit::Done(payload))
}

/// Assemble the delete-originals task closure. Cancellation is checked at
/// per-copy boundaries; each completed copy is already consistent on disk
/// and in BDL, so a cancelled or failed run resumes with the remaining
/// originals.
pub fn delete_originals_job(store: Arc<BdlStore>, spec: Arc<DeleteOriginalsTaskSpec>) -> TaskJob {
    Box::new(move |ctx| {
        match run_delete_originals(&store, &spec, ctx) {
            Ok(exit) => Ok(exit),
            Err(error) => Err(maintenance_error_to_app(error, &spec.correlation_id)),
        }
    })
}

/// Convenience submission: the correlation id binds the audited deletion.
pub fn submit_delete_originals(
    runtime: &TaskRuntime,
    store: Arc<BdlStore>,
    spec: DeleteOriginalsTaskSpec,
    timeout: Option<Duration>,
) -> Result<crate::CommandAcceptedV1, crate::AppErrorV1> {
    let correlation_id = spec.correlation_id.clone();
    runtime.submit(SubmitRequest {
        correlation_id: Some(correlation_id),
        timeout,
        job: delete_originals_job(store, Arc::new(spec)),
    })
}

// --- B4 artifact-mode: the generate-VPM task ---

/// One generate-VPM task binding. The effective mode guard (generate_vpm)
/// is enforced inside the job against `global_default`.
#[derive(Debug, Clone)]
pub struct GenerateVpmTaskSpec {
    pub correlation_id: String,
    pub warehouse_item_id: String,
    pub warehouse_root: PathBuf,
    pub global_default: ArtifactMode,
}

/// Audit payload (Done exit).
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateVpmResult {
    pub correlation_id: String,
    pub warehouse_item_id: String,
    pub package_id: String,
    pub archive_relative_path: String,
    pub archive_sha256: String,
}

fn generate_error_to_app(error: MaintenanceError, correlation_id: &str) -> crate::AppErrorV1 {
    let (code, category, params): (String, ErrorCategory, Vec<(String, String)>) = match &error {
        MaintenanceError::Store(_) => (
            "vua.warehouse.storeFailed".to_owned(),
            ErrorCategory::Internal,
            Vec::new(),
        ),
        MaintenanceError::Io(_) => (
            "vua.warehouse.maintenanceIoFailed".to_owned(),
            ErrorCategory::ExternalFailure,
            Vec::new(),
        ),
        MaintenanceError::UnknownEntry(entry_id) => (
            "vua.warehouse.entry_not_found".to_owned(),
            ErrorCategory::Validation,
            vec![("warehouseItemId".to_owned(), entry_id.clone())],
        ),
        MaintenanceError::InvalidState {
            entry_id,
            effective_mode,
        } => (
            "vua.warehouse.invalid_state".to_owned(),
            ErrorCategory::Conflict,
            vec![
                ("warehouseItemId".to_owned(), entry_id.clone()),
                ("effectiveMode".to_owned(), effective_mode.name().to_owned()),
            ],
        ),
        MaintenanceError::GeneratedArtifactMissing { entry_id, reason } => (
            "vua.warehouse.generated_artifact_missing".to_owned(),
            ErrorCategory::Conflict,
            vec![
                ("warehouseItemId".to_owned(), entry_id.clone()),
                ("reason".to_owned(), reason.clone()),
            ],
        ),
        MaintenanceError::NoOriginalMaterial { entry_id } => (
            "vua.warehouse.no_original_material".to_owned(),
            ErrorCategory::Conflict,
            vec![("warehouseItemId".to_owned(), entry_id.clone())],
        ),
        MaintenanceError::AlreadyGenerated { entry_id } => (
            "vua.warehouse.already_generated".to_owned(),
            ErrorCategory::Conflict,
            vec![("warehouseItemId".to_owned(), entry_id.clone())],
        ),
        MaintenanceError::GenerationFailed { code, message } => (
            "vua.warehouse.generation_failed".to_owned(),
            ErrorCategory::ExternalFailure,
            vec![
                ("code".to_owned(), code.clone()),
                ("reason".to_owned(), message.clone()),
            ],
        ),
    };
    let mut app = crate::AppErrorV1::new(
        &code,
        category,
        "errors.warehouse.maintenanceFailed",
        correlation_id,
    )
    .with_recoverable(true);
    for (name, value) in &params {
        app = app.with_param(name.as_str(), ParamValue::Text(value.clone()));
    }
    app
}

fn run_generate_vpm(
    store: &BdlStore,
    executor: &MaterialExecutor,
    spec: &GenerateVpmTaskSpec,
    ctx: &crate::runtime::TaskContext,
) -> Result<TaskExit, MaintenanceError> {
    let detail = store
        .warehouse_entry_detail(&spec.warehouse_item_id, spec.global_default)?
        .ok_or_else(|| MaintenanceError::UnknownEntry(spec.warehouse_item_id.clone()))?;

    // Guard: generation runs only in the generate_vpm mode.
    if detail.effective_artifact_mode != ArtifactMode::GenerateVpm {
        return Err(MaintenanceError::InvalidState {
            entry_id: spec.warehouse_item_id.clone(),
            effective_mode: detail.effective_artifact_mode,
        });
    }

    let copies = store.entry_copies(&spec.warehouse_item_id)?;
    let originals: Vec<&crate::bdl_store::StoredArtifactCopy> = copies
        .iter()
        .filter(|copy| copy.role == CopyRole::Original)
        .collect();
    if originals.is_empty() {
        return Err(MaintenanceError::NoOriginalMaterial {
            entry_id: spec.warehouse_item_id.clone(),
        });
    }
    if copies.iter().any(|copy| copy.role == CopyRole::GeneratedVpm) {
        return Err(MaintenanceError::AlreadyGenerated {
            entry_id: spec.warehouse_item_id.clone(),
        });
    }

    let sources: Vec<crate::material_exec::GenerateSourcePackage> = originals
        .iter()
        .map(|copy| crate::material_exec::GenerateSourcePackage {
            archive_path: PathBuf::from(&copy.stored_path),
            sha256: copy.artifact_sha256.clone(),
        })
        .collect();

    let publish_root = std::env::temp_dir().join(format!(
        "vua-genpub-{}-{}",
        spec.warehouse_item_id,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));

    let token = MaterialCancelToken::new();
    let generated = executor
        .generate_vpm_only(
            &sources,
            &detail.display_name,
            &spec.warehouse_root.join(&detail.folder_name),
            &publish_root,
            &spec.correlation_id,
            &token,
        )
        .map_err(|(code, status)| {
            if status == crate::MaterialExecutionStatus::Cancelled {
                MaintenanceError::GenerationFailed {
                    code: "vua.warehouse.generation_cancelled".into(),
                    message: "cancelled at a package boundary".into(),
                }
            } else {
                MaintenanceError::GenerationFailed {
                    code,
                    message: "the staging chain refused the generation".into(),
                }
            }
        })?;

    // Copy the published archive into the entry as a generated_vpm copy.
    let relative_path = format!(
        "vpm/{}",
        generated
            .artifact
            .archive_path
            .file_name()
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_default()
    );
    let destination = entry_folder_path(&spec.warehouse_root, &detail.folder_name)
        .join(&relative_path);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::copy(&generated.artifact.archive_path, &destination)?;
    let archive_sha256 = sha256_file(&destination)?;
    let archive_sha = format!("sha256:{}", hex_lower(&archive_sha256));
    if archive_sha != generated.artifact.archive_sha256 {
        return Err(MaintenanceError::GenerationFailed {
            code: "vua.warehouse.copy_drift".into(),
            message: format!("the copied archive {archive_sha} != published {}", generated.artifact.archive_sha256),
        });
    }

    store.record_artifact_copy(
        &spec.warehouse_item_id,
        &archive_sha,
        &relative_path,
        &destination.to_string_lossy(),
        CopyRole::GeneratedVpm,
        &now_rfc3339(),
    )?;

    let result = GenerateVpmResult {
        correlation_id: spec.correlation_id.clone(),
        warehouse_item_id: spec.warehouse_item_id.clone(),
        package_id: generated.package_id.clone(),
        archive_relative_path: relative_path,
        archive_sha256: archive_sha,
    };
    let payload = serde_json::to_value(&result).unwrap_or(serde_json::Value::Null);
    ctx.emit_progress(payload.clone());
    Ok(TaskExit::Done(payload))
}

fn entry_folder_path(warehouse_root: &Path, folder_name: &str) -> PathBuf {
    warehouse_root.join(folder_name)
}

pub fn generate_vpm_job(
    store: Arc<BdlStore>,
    executor: Arc<MaterialExecutor>,
    spec: Arc<GenerateVpmTaskSpec>,
) -> crate::runtime::TaskJob {
    Box::new(move |ctx| match run_generate_vpm(&store, executor.as_ref(), &spec, ctx) {
        Ok(exit) => Ok(exit),
        Err(error) => Err(generate_error_to_app(error, &spec.correlation_id)),
    })
}

pub fn submit_generate_vpm(
    runtime: &TaskRuntime,
    store: Arc<BdlStore>,
    executor: Arc<MaterialExecutor>,
    spec: GenerateVpmTaskSpec,
    timeout: Option<Duration>,
) -> Result<crate::CommandAcceptedV1, crate::AppErrorV1> {
    let correlation_id = spec.correlation_id.clone();
    runtime.submit(SubmitRequest {
        correlation_id: Some(correlation_id),
        timeout,
        job: generate_vpm_job(store, executor, Arc::new(spec)),
    })
}

fn now_rfc3339() -> String {
    "2026-09-06T00:00:00.000Z".to_owned()
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::bdl_store::NewLocalArtifact;
    use crate::contracts::TaskState;
    use crate::runtime::TaskSnapshot;
    use crate::time::{FixedIdGenerator, SystemClock};
    use std::path::Path;
    use std::time::{Duration, Instant};

    fn unique_dir(tag: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "vua-maint-{tag}-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn runtime() -> TaskRuntime {
        TaskRuntime::new(
            Arc::new(crate::journal::MemoryJournal::default()),
            Arc::new(SystemClock),
            Arc::new(FixedIdGenerator::default()),
        )
    }

    fn wait_for_terminal(rt: &TaskRuntime, task_id: &str) -> TaskSnapshot {
        let deadline = Instant::now() + Duration::from_secs(30);
        loop {
            let snapshot = rt.snapshot(task_id).expect("task must exist");
            if snapshot.state.is_terminal() {
                return snapshot;
            }
            assert!(Instant::now() < deadline, "task did not finish");
            std::thread::sleep(Duration::from_millis(10));
        }
    }

    /// Builds an entry with one original and (optionally) one generated VPM
    /// copy whose physical files and content identities are consistent.
    struct World {
        store: Arc<BdlStore>,
        entry_id: String,
        original_path: PathBuf,
        generated_path: PathBuf,
    }

    fn make_world(parent: &Path, with_generated: bool) -> World {
        let store = Arc::new(BdlStore::open_in_memory().unwrap());
        let entry_folder = parent.join("entry");
        std::fs::create_dir_all(entry_folder.join("original")).unwrap();
        std::fs::create_dir_all(entry_folder.join("vpm")).unwrap();
        let entry_id = store
            .create_warehouse_item(
                "Fixture Pack",
                "imported_material",
                "2026-09-06T09:00:00.000Z",
            )
            .unwrap()
            .warehouse_item_id;

        let original_path = entry_folder.join("original").join("pack.unitypackage");
        std::fs::write(&original_path, b"PK original fixture").unwrap();
        let original_sha = format!("sha256:{}", hex_lower(&sha256_file(&original_path).unwrap()));
        store
            .record_untrusted_artifact(&NewLocalArtifact {
                artifact_sha256: original_sha.clone(),
                size_bytes: std::fs::metadata(&original_path).unwrap().len(),
                suggested_file_name: Some("pack.unitypackage".into()),
                download_id: None,
                first_seen_at: "2026-09-06T09:00:00.000Z".into(),
            })
            .unwrap();
        store
            .record_artifact_copy(
                &entry_id,
                &original_sha,
                "original/pack.unitypackage",
                &original_path.to_string_lossy(),
                CopyRole::Original,
                "2026-09-06T09:00:00.000Z",
            )
            .unwrap();

        let generated_path = entry_folder.join("vpm").join("pack.vpack");
        if with_generated {
            std::fs::write(&generated_path, b"PK generated vpm fixture").unwrap();
            let generated_sha =
                format!("sha256:{}", hex_lower(&sha256_file(&generated_path).unwrap()));
            store
                .record_untrusted_artifact(&NewLocalArtifact {
                    artifact_sha256: generated_sha.clone(),
                    size_bytes: std::fs::metadata(&generated_path).unwrap().len(),
                    suggested_file_name: Some("pack.vpack".into()),
                    download_id: None,
                    first_seen_at: "2026-09-06T09:00:00.000Z".into(),
                })
                .unwrap();
            store
                .record_artifact_copy(
                    &entry_id,
                    &generated_sha,
                    "vpm/pack.vpack",
                    &generated_path.to_string_lossy(),
                    CopyRole::GeneratedVpm,
                    "2026-09-06T09:00:01.000Z",
                )
                .unwrap();
        }

        World {
            store,
            entry_id,
            original_path,
            generated_path,
        }
    }

    fn run_and_wait(world: &World) -> TaskSnapshot {
        let rt = runtime();
        let accepted = submit_delete_originals(
            &rt,
            world.store.clone(),
            DeleteOriginalsTaskSpec {
                correlation_id: "corr-delete".into(),
                warehouse_item_id: world.entry_id.clone(),
                global_default: ArtifactMode::UseOriginalUnitypackage,
            },
            None,
        )
        .unwrap();
        wait_for_terminal(&rt, &accepted.task_id)
    }

    #[test]
    fn delete_originals_removes_only_originals_under_all_guards() {
        let parent = unique_dir("happy");
        let world = make_world(&parent, true);
        world
            .store
            .set_artifact_mode(&world.entry_id, Some(ArtifactMode::GenerateVpm))
            .unwrap();

        let snapshot = run_and_wait(&world);
        assert_eq!(snapshot.state, TaskState::Succeeded);
        assert!(!world.original_path.exists(), "originals are gone on disk");
        assert!(world.generated_path.exists(), "the generated VPM survives");
        let copies = world.store.entry_copies(&world.entry_id).unwrap();
        assert_eq!(copies.len(), 1);
        assert_eq!(copies[0].role, CopyRole::GeneratedVpm);
        std::fs::remove_dir_all(&parent).ok();
    }

    #[test]
    fn guard_c_refuses_deletion_outside_the_generate_vpm_mode() {
        let parent = unique_dir("guardc");
        let world = make_world(&parent, true);
        // No override, global default = use_original_unitypackage.

        let snapshot = run_and_wait(&world);
        assert_eq!(snapshot.state, TaskState::Failed);
        assert!(
            world.original_path.exists(),
            "originals survive a refused deletion"
        );
        assert_eq!(world.store.entry_copies(&world.entry_id).unwrap().len(), 2);
        std::fs::remove_dir_all(&parent).ok();
    }

    #[test]
    fn guards_a_and_b_refuse_deletion_without_a_verified_generated_artifact() {
        // No generated copy at all.
        let parent = unique_dir("guardab1");
        let world = make_world(&parent, false);
        world
            .store
            .set_artifact_mode(&world.entry_id, Some(ArtifactMode::GenerateVpm))
            .unwrap();
        let snapshot = run_and_wait(&world);
        assert_eq!(snapshot.state, TaskState::Failed);
        assert_eq!(world.store.entry_copies(&world.entry_id).unwrap().len(), 1);
        std::fs::remove_dir_all(&parent).ok();

        // A generated copy whose content no longer matches its recorded
        // identity is tampering, not a deletable state.
        let parent = unique_dir("guardab2");
        let world = make_world(&parent, true);
        std::fs::write(&world.generated_path, b"tampered content").unwrap();
        world
            .store
            .set_artifact_mode(&world.entry_id, Some(ArtifactMode::GenerateVpm))
            .unwrap();
        let snapshot = run_and_wait(&world);
        assert_eq!(snapshot.state, TaskState::Failed);
        assert!(world.original_path.exists());
        std::fs::remove_dir_all(&parent).ok();
    }

    #[test]
    fn unknown_entries_are_rejected_not_deleted_blindly() {
        let store = Arc::new(BdlStore::open_in_memory().unwrap());
        let rt = runtime();
        let accepted = submit_delete_originals(
            &rt,
            store.clone(),
            DeleteOriginalsTaskSpec {
                correlation_id: "corr-x".into(),
                warehouse_item_id: "whi-nope".into(),
                global_default: ArtifactMode::GenerateVpm,
            },
            None,
        )
        .unwrap();
        let snapshot = wait_for_terminal(&rt, &accepted.task_id);
        assert_eq!(snapshot.state, TaskState::Failed);
    }
}
