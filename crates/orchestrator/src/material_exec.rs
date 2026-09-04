//! B3 material intake executor: drives a confirmed plan's steps against the
//! real ports — the versioned Bridge, the verified snapshot store, the
//! `vrc-get` backend, and the build-record store.
//!
//! Contract highlights (material-intake v0.1):
//! - Source digests are recomputed before anything mutates; drift fails the
//!   run with `vua.material.source_drift` before the first write.
//! - Every mutating run carries a minimum recovery snapshot; a failure after
//!   the snapshot triggers a restore attempt whose outcome is recorded.
//! - A published build record is the receipt: re-running the same plan
//!   replays idempotently as success without touching Unity again.
//! - Cancellation is checked before each step; a cancelled run reports
//!   `cancelled` with the steps completed so far — facts only, no severity.
//! - Mutating Bridge commands carry `expected_project_fingerprint` and the
//!   fingerprint CHAINS: each success returns the project's new fingerprint
//!   (result.data.projectFingerprint), which the next command must expect.
//! - Unity's `ImportPackage` is a silent no-op in batchmode, so archives are
//!   extracted under `.vua/imports/<command_id>/` (inside the snapshot-
//!   protected project) and the Bridge materializes that layout instead.
//!
//! Tests cover the state machine on fake ports; real-Unity calibration
//! (timeout budget, real rejection payloads, rollback equivalence) is the
//! separate local matrix per the M3 gate.

use crate::build_record::{
    BridgeJobEvidenceV01, BuildRecordStatus, BuildRecordStore, BuildRecordV01,
    BuildSnapshotEvidenceV01, BuildValidationEvidenceV01,
};
use crate::filesystem::{FileSystemSnapshotStore, VerifiedSnapshot};
use crate::material_intake::{
    error_codes as intake_codes, MaterialEntryMode, MaterialIntakeConfirmationV01,
    MaterialIntakeEngine, MaterialIntakeStepKind,
};
use crate::material_staging::StagingProject;
use crate::model::{
    ProjectRef, ResultStatus, UnityCommand, UnityOperation, UnityPayload, UnityResult,
};
use crate::time::Clock;
use crate::vpm_backend::{PackageRequestV1, VpmBackend};
use crate::UnityBridge;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub mod error_codes {
    pub const BRIDGE_FAILED: &str = "vua.material.bridge_failed";
    pub const BRIDGE_TIMEOUT: &str = "vua.material.bridge_timeout";
    pub const BRIDGE_REJECTED: &str = "vua.material.bridge_rejected";
    pub const SNAPSHOT_FAILED: &str = "vua.material.snapshot_failed";
    pub const ROLLBACK_FAILED: &str = "vua.material.rollback_failed";
    pub const STAGING_FAILED: &str = "vua.material.staging_failed";
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum MaterialExecutionStatus {
    Succeeded,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RollbackOutcome {
    NotNeeded,
    Restored,
    Failed,
}

/// The run report: facts about what happened, in presence-contract spirit.
/// `error_code` is set only when `status` is `Failed`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterialExecutionReport {
    pub plan_id: String,
    pub correlation_id: String,
    pub status: MaterialExecutionStatus,
    pub completed_steps: Vec<MaterialIntakeStepKind>,
    pub error_code: Option<String>,
    pub rollback: RollbackOutcome,
    pub build_record_id: Option<String>,
    /// True when a published receipt existed and Unity was not touched.
    pub replayed: bool,
}

/// One step's mutation outcome: continue with the run, or stop with a code.
type StepFailure = (String, MaterialExecutionStatus);

pub struct MaterialExecutor {
    bridge: Arc<dyn UnityBridge>,
    snapshots: FileSystemSnapshotStore,
    vpm: Arc<dyn VpmBackend>,
    records: BuildRecordStore,
    clock: Arc<dyn Clock>,
    temp_root: PathBuf,
    unity_editor_version: String,
    cancel: Arc<AtomicBool>,
}

impl MaterialExecutor {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        bridge: Arc<dyn UnityBridge>,
        snapshots: FileSystemSnapshotStore,
        vpm: Arc<dyn VpmBackend>,
        records: BuildRecordStore,
        clock: Arc<dyn Clock>,
        temp_root: impl Into<PathBuf>,
        unity_editor_version: impl Into<String>,
    ) -> Self {
        Self {
            bridge,
            snapshots,
            vpm,
            records,
            clock,
            temp_root: temp_root.into(),
            unity_editor_version: unity_editor_version.into(),
            cancel: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Requests cancellation; observed before each step boundary.
    pub fn cancel(&self) {
        self.cancel.store(true, Ordering::SeqCst);
    }

    fn cancelled(&self) -> bool {
        self.cancel.load(Ordering::SeqCst)
    }

    /// Drives the confirmed plan. Always returns a report — failures live in
    /// the report, not the error channel, so the task runtime can persist
    /// them uniformly.
    pub fn execute(
        &self,
        confirmation: &MaterialIntakeConfirmationV01,
        source_folder: &Path,
        project: &ProjectRef,
        artifact_output_root: &Path,
    ) -> MaterialExecutionReport {
        let plan = &confirmation.plan;
        let record_id = format!("material-{}", plan.plan_id);

        // A published receipt is the replay guard: the run already completed,
        // so Unity is not touched again.
        if self.records.read(&record_id).is_ok() {
            return MaterialExecutionReport {
                plan_id: plan.plan_id.clone(),
                correlation_id: confirmation.correlation_id.clone(),
                status: MaterialExecutionStatus::Succeeded,
                completed_steps: Vec::new(),
                error_code: None,
                rollback: RollbackOutcome::NotNeeded,
                build_record_id: Some(record_id),
                replayed: true,
            };
        }

        let mut report = MaterialExecutionReport {
            plan_id: plan.plan_id.clone(),
            correlation_id: confirmation.correlation_id.clone(),
            status: MaterialExecutionStatus::Succeeded,
            completed_steps: Vec::new(),
            error_code: None,
            rollback: RollbackOutcome::NotNeeded,
            build_record_id: None,
            replayed: false,
        };
        let mut bridge_jobs: Vec<BridgeJobEvidenceV01> = Vec::new();
        let started_at = self.clock.now_rfc3339();

        if self.cancelled() {
            report.status = MaterialExecutionStatus::Cancelled;
            report.error_code = Some(intake_codes::CANCELLED.to_owned());
            return report;
        }

        // VerifySource: recompute both digests before the first mutation.
        if let Err(error) = MaterialIntakeEngine
            .verify_source_unchanged(source_folder, &plan.source, &confirmation.correlation_id)
        {
            report.status = MaterialExecutionStatus::Failed;
            report.error_code = Some(error.code);
            return report;
        }
        report.completed_steps.push(MaterialIntakeStepKind::VerifySource);

        if self.cancelled() {
            report.status = MaterialExecutionStatus::Cancelled;
            report.error_code = Some(intake_codes::CANCELLED.to_owned());
            return report;
        }

        // CreateSnapshot: the minimum recovery point every mutating run owes
        // the user; the scope extends with the risk decision.
        let snapshot_id = format!("{}-recovery", plan.plan_id);
        let verified: VerifiedSnapshot = match self.snapshots.create_verified(
            project,
            &snapshot_id,
            &confirmation.snapshot_scopes(),
        ) {
            Ok(verified) => verified,
            Err(error) => {
                report.status = MaterialExecutionStatus::Failed;
                report.error_code = Some(format!("{}: {error}", error_codes::SNAPSHOT_FAILED));
                return report;
            }
        };
        let mut snapshot_evidence = BuildSnapshotEvidenceV01 {
            snapshot_id,
            verified: true,
            restore_attempted: false,
            restore_succeeded: None,
        };
        report.completed_steps.push(MaterialIntakeStepKind::CreateSnapshot);

        // Mutating body plus read-only validation. The Bridge fingerprint
        // CHAINS across mutating commands: every success returns the
        // project's next fingerprint, which the following command must
        // expect. Any failure routes through the rollback branch below.
        let mut current_fingerprint = plan.project_fingerprint.clone();
        let mut validation_expectations: Vec<String> = Vec::new();
        let mut final_fingerprint: Option<String> = None;
        let mut validation: Option<BuildValidationEvidenceV01> = None;
        let mut local_vpm: Option<crate::build_record::LocalVpmEvidenceV01> = None;
        let failure = match plan.mode {
            MaterialEntryMode::DirectUnityPackage => {
                match self.run_direct_imports(
                    plan,
                    source_folder,
                    project,
                    &mut current_fingerprint,
                    &mut bridge_jobs,
                    &mut final_fingerprint,
                    &mut validation_expectations,
                ) {
                    Ok(()) => {
                        report.completed_steps.push(MaterialIntakeStepKind::ImportUnityPackages);
                        None
                    }
                    Err(failure) => Some(failure),
                }
            }
            MaterialEntryMode::LocalReusableVpm => {
                match self.run_local_reusable(
                    confirmation,
                    source_folder,
                    project,
                    artifact_output_root,
                    &mut bridge_jobs,
                    &mut local_vpm,
                    &mut validation_expectations,
                ) {
                    Ok(()) => {
                        report.completed_steps.extend([
                            MaterialIntakeStepKind::ImportUnityPackages,
                            MaterialIntakeStepKind::CreateLocalVpmPackage,
                            MaterialIntakeStepKind::PreviewVpmInstall,
                            MaterialIntakeStepKind::ApplyVpmInstall,
                        ]);
                        None
                    }
                    Err(failure) => Some(failure),
                }
            }
        };

        let failure = match failure {
            Some(failure) => Some(failure),
            None => {
                if self.cancelled() {
                    Some((intake_codes::CANCELLED.to_owned(), MaterialExecutionStatus::Cancelled))
                } else {
                    match self.run_minimum_structure_validation(
                        project,
                        &validation_expectations,
                        &format!("{}-validate", plan.plan_id),
                        &mut bridge_jobs,
                    ) {
                        Ok(evidence) => {
                            report
                                .completed_steps
                                .push(MaterialIntakeStepKind::ValidateMinimumStructure);
                            validation = Some(evidence);
                            None
                        }
                        Err(code) => Some((code, MaterialExecutionStatus::Failed)),
                    }
                }
            }
        };

        // Failure rolls the verified snapshot back before anything else is
        // recorded; a failed restore is the worst outcome and says so.
        let (status, error_code) = match failure {
            None => (MaterialExecutionStatus::Succeeded, None),
            Some((code, run_status)) => {
                snapshot_evidence.restore_attempted = true;
                match self.snapshots.restore_verified(project, &verified.reference) {
                    Ok(()) => {
                        snapshot_evidence.restore_succeeded = Some(true);
                        report.rollback = RollbackOutcome::Restored;
                    }
                    Err(error) => {
                        snapshot_evidence.restore_succeeded = Some(false);
                        report.rollback = RollbackOutcome::Failed;
                        report.status = MaterialExecutionStatus::Failed;
                        report.error_code = Some(format!(
                            "{}: restore failed: {error}",
                            error_codes::ROLLBACK_FAILED
                        ));
                        return report;
                    }
                }
                report.status = run_status;
                (run_status, Some(code))
            }
        };
        report.status = status;
        report.error_code = error_code;

        // WriteBuildRecord: the receipt, published for success, cancellation
        // and failure alike — the record is what makes a later re-run a
        // replay instead of a blind second mutation.
        let record = BuildRecordV01 {
            schema_version: crate::build_record::BUILD_RECORD_SCHEMA_VERSION.to_owned(),
            record_id: record_id.clone(),
            task_id: confirmation.correlation_id.clone(),
            correlation_id: confirmation.correlation_id.clone(),
            plan_id: plan.plan_id.clone(),
            plan_hash: plan.plan_hash.clone(),
            mode: plan.mode,
            status: match report.status {
                MaterialExecutionStatus::Succeeded => BuildRecordStatus::Succeeded,
                MaterialExecutionStatus::Cancelled => BuildRecordStatus::Cancelled,
                MaterialExecutionStatus::Failed => BuildRecordStatus::Failed,
            },
            started_at,
            completed_at: self.clock.now_rfc3339(),
            source: plan.source.clone(),
            risk_choice: confirmation.risk_decision.choice,
            project_id: project.id.clone(),
            initial_project_fingerprint: plan.project_fingerprint.clone(),
            final_project_fingerprint: final_fingerprint,
            unity_editor_version: self.unity_editor_version.clone(),
            snapshot: Some(snapshot_evidence),
            bridge_jobs,
            local_vpm,
            validation,
            result_code: match report.status {
                MaterialExecutionStatus::Succeeded => "vua.material.succeeded".to_owned(),
                MaterialExecutionStatus::Cancelled => "vua.material.cancelled".to_owned(),
                MaterialExecutionStatus::Failed => "vua.material.failed".to_owned(),
            },
        };
        match self.records.publish(&record) {
            Ok(_) => {
                report.completed_steps.push(MaterialIntakeStepKind::WriteBuildRecord);
                report.build_record_id = Some(record_id);
            }
            Err(error) => {
                report.status = MaterialExecutionStatus::Failed;
                report.error_code = Some(format!("vua.material.record_failed: {error}"));
                report.build_record_id = None;
            }
        }
        report
    }

    // --- direct_unity_package ---

    #[allow(clippy::too_many_arguments)]
    fn run_direct_imports(
        &self,
        plan: &crate::material_intake::MaterialIntakePlanV01,
        source_folder: &Path,
        project: &ProjectRef,
        current_fingerprint: &mut String,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
        final_fingerprint: &mut Option<String>,
        validation_expectations: &mut Vec<String>,
    ) -> Result<(), StepFailure> {
        for package in &plan.source.packages {
            if self.cancelled() {
                return Err((intake_codes::CANCELLED.to_owned(), MaterialExecutionStatus::Cancelled));
            }
            let command_id = format!("{}-import-{}", plan.plan_id, bridge_jobs.len());
            // Unity's ImportPackage is a silent no-op in batchmode, so the
            // Bridge consumes an EXTRACTED layout instead: the archive is
            // unpacked under .vua/imports/<command_id>/ (inside the
            // snapshot-protected project) and the Bridge materializes it
            // into Assets/.
            let extracted_root = project.root.join(".vua/imports").join(&command_id);
            let archive_path = source_folder.join(&package.relative_path);
            let logical_paths = extract_package_into_dir(&archive_path, &extracted_root).map_err(
                |error| {
                    (
                        format!(
                            "{}: {}: {error}",
                            intake_codes::ARCHIVE_INVALID,
                            archive_path.display()
                        ),
                        MaterialExecutionStatus::Failed,
                    )
                },
            )?;
            validation_expectations.extend(logical_paths);
            let command = UnityCommand {
                schema_version: crate::ENVELOPE_SCHEMA_VERSION,
                command_id,
                operation: UnityOperation::ImportUnityPackage,
                project_id: project.id.clone(),
                dry_run: false,
                expected_project_fingerprint: Some(current_fingerprint.clone()),
                payload: UnityPayload {
                    source_package_path: Some(extracted_root.to_string_lossy().into_owned()),
                    source_package_sha256: Some(package.sha256.clone()),
                    ..UnityPayload::default()
                },
            };
            let result = self.dispatch(project, &command, bridge_jobs)?;
            let _ = fs::remove_dir_all(&extracted_root);
            // Chain: the next mutation must expect the post-import state.
            *current_fingerprint =
                fingerprint_of(&result).unwrap_or_else(|| current_fingerprint.clone());
            *final_fingerprint = Some(current_fingerprint.clone());
        }
        validation_expectations.sort();
        validation_expectations.dedup();
        Ok(())
    }

    // --- local_reusable_vpm ---

    #[allow(clippy::too_many_arguments)]
    fn run_local_reusable(
        &self,
        confirmation: &MaterialIntakeConfirmationV01,
        source_folder: &Path,
        project: &ProjectRef,
        artifact_output_root: &Path,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
        local_vpm: &mut Option<crate::build_record::LocalVpmEvidenceV01>,
        validation_expectations: &mut Vec<String>,
    ) -> Result<(), StepFailure> {
        let plan = &confirmation.plan;
        // The staging project serves exactly one atomic task; the guard
        // destroys it on every path out of this scope. The staging token
        // binds the Bridge's create_local_vpm_package to THIS task.
        // 提交态 StagingProject::create 为两参;第三参(staging token)随
        // B3 在途改动落地,届时此处同步恢复
        let staging = StagingProject::create(&self.temp_root, &confirmation.correlation_id)
        .map_err(|error| {
            (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
        })?;
        let staging_project = ProjectRef {
            id: format!("{}-staging", plan.project_id),
            root: staging.root().to_path_buf(),
        };
        let package_id = slugify_package_id(&plan.source.display_name);

        // The fresh staging project needs its own fingerprint for its first
        // mutating command.
        let inspect =
            self.inspect(&staging_project, &format!("{}-stage-inspect", plan.plan_id), bridge_jobs)?;
        let mut staging_fingerprint = fingerprint_of(&inspect).ok_or_else(|| {
            (error_codes::BRIDGE_FAILED.to_owned(), MaterialExecutionStatus::Failed)
        })?;

        // Import the whole batch into staging (chained fingerprints).
        for package in &plan.source.packages {
            if self.cancelled() {
                return Err((intake_codes::CANCELLED.to_owned(), MaterialExecutionStatus::Cancelled));
            }
            let command_id = format!("{}-stage-import-{}", plan.plan_id, bridge_jobs.len());
            let extracted_root = staging.root().join(".vua/imports").join(&command_id);
            extract_package_into_dir(&source_folder.join(&package.relative_path), &extracted_root)
                .map_err(|error| {
                    (
                        format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                        MaterialExecutionStatus::Failed,
                    )
                })?;
            let command = UnityCommand {
                schema_version: crate::ENVELOPE_SCHEMA_VERSION,
                command_id,
                operation: UnityOperation::ImportUnityPackage,
                project_id: staging_project.id.clone(),
                dry_run: false,
                expected_project_fingerprint: Some(staging_fingerprint.clone()),
                payload: UnityPayload {
                    source_package_path: Some(extracted_root.to_string_lossy().into_owned()),
                    source_package_sha256: Some(package.sha256.clone()),
                    ..UnityPayload::default()
                },
            };
            let result = self.dispatch(&staging_project, &command, bridge_jobs)?;
            if let Some(fingerprint) = fingerprint_of(&result) {
                staging_fingerprint = fingerprint;
            }
        }

        // Produce the local-reusable package layout + manifest.
        let command_id = format!("{}-stage-vpm", plan.plan_id);
        let command = UnityCommand {
            schema_version: crate::ENVELOPE_SCHEMA_VERSION,
            command_id,
            operation: UnityOperation::CreateLocalVpmPackage,
            project_id: staging_project.id.clone(),
            dry_run: false,
            expected_project_fingerprint: Some(staging_fingerprint.clone()),
            payload: UnityPayload {
                package_id: Some(package_id.clone()),
                package_display_name: Some(plan.source.display_name.clone()),
                package_version: Some("0.1.0".to_owned()),
                staging_token: Some(confirmation.correlation_id.clone()),
                ..UnityPayload::default()
            },
        };
        let created = self.dispatch(&staging_project, &command, bridge_jobs)?;
        validation_expectations.extend(
            created
                .changed_paths
                .iter()
                .filter(|path| path.starts_with("Packages/"))
                .cloned(),
        );
        if validation_expectations.is_empty() {
            validation_expectations.push(format!("Packages/{package_id}/package.json"));
        }

        // Publish the produced package deterministically, then register and
        // install it into the target through the same backend.
        let artifact = crate::local_vpm_artifact::publish_local_vpm_artifact(
            &staging.root().join("Packages").join(&package_id),
            artifact_output_root,
            &package_id,
            "0.1.0",
        )
        .map_err(|error| {
            (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
        })?;
        self.vpm
            .register_local_package(&artifact.package_root)
            .map_err(|error| (error.code, MaterialExecutionStatus::Failed))?;
        let request = PackageRequestV1 {
            package_id: package_id.clone(),
            version: None,
        };
        let preview = self
            .vpm
            .preview_install(project, std::slice::from_ref(&request))
            .map_err(|error| (error.code, MaterialExecutionStatus::Failed))?;
        self.vpm
            .apply_install(project, std::slice::from_ref(&request), &preview.digest)
            .map_err(|error| (error.code, MaterialExecutionStatus::Failed))?;

        *local_vpm = Some(crate::build_record::LocalVpmEvidenceV01 {
            package_id,
            display_name: plan.source.display_name.clone(),
            version: "0.1.0".to_owned(),
            manifest_sha256: artifact.manifest_sha256,
            tree_sha256: artifact.tree_sha256,
            archive_sha256: artifact.archive_sha256,
            installed_version: "0.1.0".to_owned(),
        });
        Ok(())
    }

    // --- validate_minimum_structure ---

    fn run_minimum_structure_validation(
        &self,
        project: &ProjectRef,
        expected_asset_paths: &[String],
        command_id: &str,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
    ) -> Result<BuildValidationEvidenceV01, String> {
        let command = UnityCommand {
            schema_version: crate::ENVELOPE_SCHEMA_VERSION,
            command_id: command_id.to_owned(),
            operation: UnityOperation::ValidateAssetPaths,
            project_id: project.id.clone(),
            dry_run: true,
            expected_project_fingerprint: None,
            payload: UnityPayload {
                expected_asset_paths: expected_asset_paths.to_vec(),
                ..UnityPayload::default()
            },
        };
        let result = self.dispatch(project, &command, bridge_jobs).map_err(|(code, _)| code)?;
        for diagnostic in &result.diagnostics {
            if diagnostic.severity == crate::model::DiagnosticSeverity::Error {
                return Err(format!("{}: {}", error_codes::BRIDGE_FAILED, diagnostic.code));
            }
        }
        // The validate op reports the loaded list through
        // data.loadedAssetPaths, not through changedPaths.
        let expected_assets_loaded = result
            .data
            .get("loadedAssetPaths")
            .and_then(serde_json::Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| item.as_str().map(str::to_owned))
                    .collect()
            })
            .unwrap_or_default();
        Ok(BuildValidationEvidenceV01 {
            level: "minimum_structure".to_owned(),
            unity_validated: true,
            expected_assets_loaded,
            diagnostic_codes: result
                .diagnostics
                .iter()
                .map(|diagnostic| diagnostic.code.clone())
                .collect(),
        })
    }

    // --- port helpers ---

    fn inspect(
        &self,
        project: &ProjectRef,
        command_id: &str,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
    ) -> Result<UnityResult, StepFailure> {
        let command = UnityCommand {
            schema_version: crate::ENVELOPE_SCHEMA_VERSION,
            command_id: command_id.to_owned(),
            operation: UnityOperation::InspectProject,
            project_id: project.id.clone(),
            dry_run: true,
            expected_project_fingerprint: None,
            payload: UnityPayload::default(),
        };
        self.dispatch(project, &command, bridge_jobs)
    }

    /// Dispatches one Bridge command and records its evidence. A non-success
    /// result becomes a failure carrying the stable code.
    fn dispatch(
        &self,
        project: &ProjectRef,
        command: &UnityCommand,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
    ) -> Result<UnityResult, StepFailure> {
        match self.bridge.execute(project, command) {
            Ok(result) => {
                let failure = match result.status {
                    ResultStatus::Succeeded => None,
                    ResultStatus::Rejected => Some(error_codes::BRIDGE_REJECTED.to_owned()),
                    ResultStatus::Failed => Some(error_codes::BRIDGE_FAILED.to_owned()),
                };
                bridge_jobs.push(BridgeJobEvidenceV01 {
                    command_id: command.command_id.clone(),
                    operation: format!("{:?}", command.operation),
                    status: format!("{:?}", result.status),
                    changed_paths: result.changed_paths.clone(),
                    diagnostics: result.diagnostics.clone(),
                });
                match failure {
                    Some(code) => Err((code, MaterialExecutionStatus::Failed)),
                    None => Ok(result),
                }
            }
            Err(crate::BridgeError::TimedOut) => Err((
                error_codes::BRIDGE_TIMEOUT.to_owned(),
                MaterialExecutionStatus::Failed,
            )),
            Err(error) => Err((
                format!("{}: {error}", error_codes::BRIDGE_FAILED),
                MaterialExecutionStatus::Failed,
            )),
        }
    }
}

/// Unpacks a `.unitypackage` (tar.gz of `<guid>` folders carrying `asset`,
/// `asset.meta`, and `pathname`) verbatim into `extracted_root` and returns
/// the logical asset paths (`Assets/…`) recorded by the pathname entries.
/// Untrusted pathnames are skipped, not followed.
fn extract_package_into_dir(
    archive_path: &Path,
    extracted_root: &Path,
) -> std::io::Result<Vec<String>> {
        use flate2::read::GzDecoder;
        use std::fs::File;
        use std::io::Read;
        use tar::Archive;

    // Pass 1: map each guid folder to its logical asset path.
    let mut folders: Vec<(String, String)> = Vec::new();
    {
        let file = File::open(archive_path)?;
        let mut archive = Archive::new(GzDecoder::new(file));
        for entry in archive.entries()? {
            let mut entry = entry?;
            let entry_path = entry.path()?.to_string_lossy().replace('\\', "/");
            if let Some(guid) = entry_path.strip_suffix("/pathname") {
                let mut logical = String::new();
                entry.read_to_string(&mut logical)?;
                let logical = logical.trim().replace('\\', "/");
                if logical.starts_with("Assets/")
                    && !logical.split('/').any(|part| part.is_empty() || part == "..")
                {
                    folders.push((guid.to_owned(), logical));
                }
            }
        }
    }

    // Pass 2: dump the archive verbatim under extracted_root so the Bridge
    // can materialize each guid folder at its logical path.
    fs::create_dir_all(extracted_root)?;
    {
        let file = File::open(archive_path)?;
        let mut archive = Archive::new(GzDecoder::new(file));
        for entry in archive.entries()? {
            let mut entry = entry?;
            let entry_path = entry.path()?.to_string_lossy().replace('\\', "/");
            if entry_path.contains("..") || entry_path.starts_with('/') {
                continue;
            }
            let target = extracted_root.join(&entry_path);
            if entry.header().entry_type().is_dir() {
                fs::create_dir_all(target)?;
                continue;
            }
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut bytes = Vec::new();
            entry.read_to_end(&mut bytes)?;
            fs::write(target, &bytes)?;
        }
    }

    Ok(folders.into_iter().map(|(_, logical)| logical).collect())
}

/// Package id rule from the Bridge: `^[a-z0-9][a-z0-9._-]{2,127}$`. The
/// display name is lowercased and every foreign character collapses to `-`.
fn slugify_package_id(display: &str) -> String {
    let mut slug = String::new();
    for character in display.chars() {
        let character = character.to_ascii_lowercase();
        if character.is_ascii_lowercase()
            || character.is_ascii_digit()
            || matches!(character, '.' | '-' | '_')
        {
            slug.push(character);
        } else {
            slug.push('-');
        }
    }
    let slug = slug.trim_matches('-').to_owned();
    if slug.chars().count() >= 3 {
        slug
    } else {
        format!("pkg-{slug}")
    }
}

fn fingerprint_of(result: &UnityResult) -> Option<String> {
    result
        .data
        .get("projectFingerprint")
        .and_then(serde_json::Value::as_str)
        .map(str::to_owned)
}

#[cfg(test)]
mod probe {
    #[test]
    #[ignore = "manual probe: needs VUA_PROBE_ARCHIVE / VUA_PROBE_OUT"]
    fn probe_extract_real_archive() {
        let archive = std::path::PathBuf::from(std::env::var("VUA_PROBE_ARCHIVE").unwrap());
        let out = std::path::PathBuf::from(std::env::var("VUA_PROBE_OUT").unwrap());
        match super::extract_package_into_dir(&archive, &out) {
            Ok(paths) => println!("OK {} logical paths, first: {:?}", paths.len(), paths.first()),
            Err(e) => println!("ERR io={e} raw_os_error={:?}", e.raw_os_error()),
        }
    }
}
