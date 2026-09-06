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

use vua_orchestrator::{
    BridgeJobEvidenceV01, BuildRecordStatus, BuildRecordStore, BuildRecordV01,
    BuildSnapshotEvidenceV01, BuildValidationEvidenceV01,
};
use vua_orchestrator::{FileSystemSnapshotStore, VerifiedSnapshot};
use crate::material_intake::{
    error_codes as intake_codes, MaterialIntakeConfirmationV01, MaterialIntakeEngine,
    MaterialIntakeStepKind,
};
use vua_orchestrator::MaterialEntryMode;
use crate::material_identity::LocalPackageIdentityStore;
use crate::material_staging::StagingProject;
use vua_orchestrator::{
    ProjectRef, ResultStatus, UnityCommand, UnityOperation, UnityPayload, UnityResult,
};
use vua_orchestrator::Clock;
use vua_orchestrator::{PackageRequestV1, VpmBackend};
use vua_orchestrator::UnityBridge;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::io::Read as _;
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
/// One warehouse original offered to [`MaterialExecutor::generate_vpm_only`].
#[derive(Debug, Clone)]
pub struct GenerateSourcePackage {
    pub archive_path: PathBuf,
    pub sha256: String,
}

/// The outcome of a successful generate-only run: the published VPM
/// artifact (package tree + archive) in the caller's output root.
#[derive(Debug, Clone)]
pub struct GeneratedVpm {
    pub package_id: String,
    pub artifact: crate::local_vpm_artifact::PublishedLocalVpmArtifact,
}

pub type StepFailure = (String, MaterialExecutionStatus);

/// Per-execution cancellation flag. Ownership lives at the submission layer
/// (task spec), never in the executor: a shared executor must not let one
/// run's cancellation leak into later or concurrent runs, and a cancelled
/// token is never reset — it is simply not reused.
#[derive(Clone, Default, Debug)]
pub struct MaterialCancelToken(Arc<AtomicBool>);

impl MaterialCancelToken {
    pub fn new() -> Self {
        Self(Arc::new(AtomicBool::new(false)))
    }

    /// Requests cancellation; observed at the executor's step boundaries.
    pub fn cancel(&self) {
        self.0.store(true, Ordering::SeqCst);
    }

    fn is_cancelled(&self) -> bool {
        self.0.load(Ordering::SeqCst)
    }
}

pub struct MaterialExecutor {
    bridge: Arc<dyn UnityBridge>,
    snapshots: FileSystemSnapshotStore,
    vpm: Arc<dyn VpmBackend>,
    records: BuildRecordStore,
    clock: Arc<dyn Clock>,
    temp_root: PathBuf,
    unity_editor_version: String,
    identity_store: LocalPackageIdentityStore,
    staging_template_override: Option<PathBuf>,
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
        identity_store: LocalPackageIdentityStore,
    ) -> Self {
        Self {
            bridge,
            snapshots,
            vpm,
            records,
            clock,
            temp_root: temp_root.into(),
            unity_editor_version: unity_editor_version.into(),
            identity_store,
            staging_template_override: None,
        }
    }

    /// 本地真机 Harness 接缝:以指定目录作为暂存项目骨架(含 Bridge 包与
    /// 编译脚手架)。生产路径不设置,使用捆绑模板。
    pub fn with_staging_template_override(mut self, dir: impl Into<PathBuf>) -> Self {
        self.staging_template_override = Some(dir.into());
        self
    }

    /// Read-only project inspection — the recovery credential source. The
    /// returned fingerprint, bound to the project's normalized identity and
    /// the lease generation, is what authorizes a lease takeover; nothing
    /// is mutated.
    pub fn inspect_project(
        &self,
        project: &ProjectRef,
        correlation_id: &str,
    ) -> Result<String, vua_orchestrator::AppErrorV1> {
        let command = UnityCommand {
            schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
            command_id: format!("project-inspect-{}", self.clock.now_rfc3339()),
            operation: UnityOperation::InspectProject,
            project_id: project.id.clone(),
            dry_run: true,
            expected_project_fingerprint: None,
            payload: UnityPayload::default(),
        };
        let mut jobs = Vec::new();
        let result = self
            .dispatch(project, &command, &mut jobs)
            .map_err(|(code, _)| {
                vua_orchestrator::AppErrorV1::new(
                    code,
                    vua_orchestrator::ErrorCategory::ExternalFailure,
                    "errors.material.executionFailed",
                    correlation_id,
                )
                .with_recoverable(true)
            })?;
        fingerprint_of(&result).ok_or_else(|| {
            vua_orchestrator::AppErrorV1::new(
                error_codes::BRIDGE_FAILED.to_owned(),
                vua_orchestrator::ErrorCategory::ExternalFailure,
                "errors.material.executionFailed",
                correlation_id,
            )
            .with_recoverable(true)
        })
    }

    /// Drives the confirmed plan. Always returns a report — failures live in
    /// the report, not the error channel, so the task runtime can persist
    /// them uniformly. Cancellation is observed from `token` at each step
    /// boundary; the token is the caller's, one per execution.
    pub fn execute(
        &self,
        confirmation: &MaterialIntakeConfirmationV01,
        source_folder: &Path,
        project: &ProjectRef,
        artifact_output_root: &Path,
        token: &MaterialCancelToken,
    ) -> MaterialExecutionReport {
        let plan = &confirmation.plan;
        // The receipt is the replay guard — but only a SUCCEEDED receipt for
        // the same plan hash, project, and source identity replays as
        // success. Failed and cancelled receipts do not get to lie: a retry
        // runs fresh and publishes under the next free attempt id, leaving
        // the prior receipt untouched as audit history.
        let mut record_id = format!("material-{}", plan.plan_id);
        let mut attempt: u32 = 1;
        loop {
            match self.records.read(&record_id) {
                Err(_) => break,
                Ok(prior) => {
                    let same_identity = prior.plan_hash == plan.plan_hash
                        && prior.project_id == project.id
                        && prior.source.source_fingerprint == plan.source.source_fingerprint
                        && prior.source.risk_fingerprint == plan.source.risk_fingerprint;
                    if prior.status == vua_orchestrator::BuildRecordStatus::Succeeded
                        && same_identity
                    {
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
                    attempt += 1;
                    record_id = format!("material-{}-attempt{}", plan.plan_id, attempt);
                }
            }
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

        if token.is_cancelled() {
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

        if token.is_cancelled() {
            report.status = MaterialExecutionStatus::Cancelled;
            report.error_code = Some(intake_codes::CANCELLED.to_owned());
            return report;
        }

        // CreateSnapshot: the minimum recovery point every mutating run owes
        // the user; the scope extends with the risk decision.
        // Attempt-unique: a prior failed attempt's recovery point must
        // stay on disk as its own audit trail.
        let snapshot_id = format!("{record_id}-recovery");
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
        let mut local_vpm: Option<vua_orchestrator::LocalVpmEvidenceV01> = None;
        let failure = match plan.mode {
            MaterialEntryMode::DirectUnityPackage => {
                match self.run_direct_imports(
                    plan,
                    source_folder,
                    project,
                    token,
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
                    token,
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
                if token.is_cancelled() {
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
        // recorded; a failed restore is the worst outcome and STILL gets a
        // receipt — it must never bypass WriteBuildRecord.
        let failure = match failure {
            None => None,
            Some((code, run_status)) => {
                snapshot_evidence.restore_attempted = true;
                match self.snapshots.restore_verified(project, &verified.reference) {
                    Ok(()) => {
                        snapshot_evidence.restore_succeeded = Some(true);
                        report.rollback = RollbackOutcome::Restored;
                        Some((code, run_status))
                    }
                    Err(error) => {
                        snapshot_evidence.restore_succeeded = Some(false);
                        report.rollback = RollbackOutcome::Failed;
                        Some((
                            format!("{}: restore failed: {error}", error_codes::ROLLBACK_FAILED),
                            MaterialExecutionStatus::Failed,
                        ))
                    }
                }
            }
        };
        let (status, error_code) = match failure {
            None => (MaterialExecutionStatus::Succeeded, None),
            Some((code, run_status)) => (run_status, Some(code)),
        };
        report.status = status;
        report.error_code = error_code;

        // WriteBuildRecord: the receipt, published for success, cancellation
        // and failure alike — the record is what makes a later re-run a
        // replay instead of a blind second mutation.
        let record = BuildRecordV01 {
            schema_version: vua_orchestrator::BUILD_RECORD_SCHEMA_VERSION.to_owned(),
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
            project_identity: vua_orchestrator::ProjectIdentity::from_existing_path(&project.root)
                .ok()
                .map(|identity| identity.as_str().to_owned()),
            recovered_from_record_id: None,
            recovery_decision_id: None,
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
        token: &MaterialCancelToken,
        current_fingerprint: &mut String,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
        final_fingerprint: &mut Option<String>,
        validation_expectations: &mut Vec<String>,
    ) -> Result<(), StepFailure> {
        for package in &plan.source.packages {
            if token.is_cancelled() {
                return Err((intake_codes::CANCELLED.to_owned(), MaterialExecutionStatus::Cancelled));
            }
            let command_id = format!("{}-import-{}", plan.plan_id, bridge_jobs.len());
            // Unity's ImportPackage is a silent no-op in batchmode, so the
            // Bridge consumes an EXTRACTED layout instead: the archive is
            // unpacked under .vua/imports/<command_id>/ (inside the
            // snapshot-protected project) and the Bridge materializes it
            // into Assets/.
            let archive_path = source_folder.join(&package.relative_path);
            let archive_digest = sha256_file(&archive_path).map_err(|error| {
                (
                    format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                    MaterialExecutionStatus::Failed,
                )
            })?;
            if archive_digest != package.sha256 {
                return Err((intake_codes::SOURCE_DRIFT.to_owned(), MaterialExecutionStatus::Failed));
            }
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
            // Bind the manifest's OWN digest into the command: the manifest
            // lives in the same editable directory as the files it describes,
            // so without this a files+manifest swap survives verification.
            let manifest_digest =
                sha256_file(&extracted_root.join("manifest.sha256")).map_err(|error| {
                    (
                        format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                        MaterialExecutionStatus::Failed,
                    )
                })?;
            let command = UnityCommand {
                schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
                command_id,
                operation: UnityOperation::MaterializeExtractedPackage,
                project_id: project.id.clone(),
                dry_run: false,
                expected_project_fingerprint: Some(current_fingerprint.clone()),
                payload: UnityPayload {
                    source_package_path: Some(extracted_root.to_string_lossy().into_owned()),
                    source_package_sha256: Some(package.sha256.clone()),
                    manifest_sha256: Some(manifest_digest),
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
        token: &MaterialCancelToken,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
        local_vpm: &mut Option<vua_orchestrator::LocalVpmEvidenceV01>,
        validation_expectations: &mut Vec<String>,
    ) -> Result<(), StepFailure> {
        let plan = &confirmation.plan;
        // The staging project serves exactly one atomic task; the guard
        // destroys it on every path out of this scope. The staging token
        // binds the Bridge's create_local_vpm_package to THIS task.
        // 暂存项目骨架:生产默认用捆绑模板;本地真机 Harness 可通过
        // with_staging_template_override 注入含 Bridge 包与编译脚手架的
        // 覆盖模板。staging token 始终绑定本任务。
        let staging = match &self.staging_template_override {
            Some(template) => StagingProject::create_from_template(
                template,
                &self.temp_root,
                &confirmation.correlation_id,
                &confirmation.correlation_id,
            ),
            None => StagingProject::create(
                &self.temp_root,
                &confirmation.correlation_id,
                &confirmation.correlation_id,
            ),
        }
        .map_err(|error| {
            (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
        })?;
        let staging_project = ProjectRef {
            id: format!("{}-staging", plan.project_id),
            root: staging.root().to_path_buf(),
        };
        // 用户裁定：包机器 ID 走持久身份库（同目录稳定、同名文件夹自动
        // `名称 (2)`），而不是从显示名重新 slug。
        let identity = self
            .identity_store
            .resolve(source_folder, &plan.source.display_name)
            .map_err(|error| {
                (
                    format!("{}: {error}", error_codes::STAGING_FAILED),
                    MaterialExecutionStatus::Failed,
                )
            })?;
        let package_id = identity.package_id;

        // The fresh staging project needs its own fingerprint for its first
        // mutating command.
        let inspect =
            self.inspect(&staging_project, &format!("{}-stage-inspect", plan.plan_id), bridge_jobs)?;
        let mut staging_fingerprint = fingerprint_of(&inspect).ok_or_else(|| {
            (error_codes::BRIDGE_FAILED.to_owned(), MaterialExecutionStatus::Failed)
        })?;

        // Import the whole batch into staging (chained fingerprints).
        for package in &plan.source.packages {
            if token.is_cancelled() {
                return Err((intake_codes::CANCELLED.to_owned(), MaterialExecutionStatus::Cancelled));
            }
            let command_id = format!("{}-stage-import-{}", plan.plan_id, bridge_jobs.len());
            let archive_path = source_folder.join(&package.relative_path);
            let archive_digest = sha256_file(&archive_path).map_err(|error| {
                (
                    format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                    MaterialExecutionStatus::Failed,
                )
            })?;
            if archive_digest != package.sha256 {
                return Err((intake_codes::SOURCE_DRIFT.to_owned(), MaterialExecutionStatus::Failed));
            }
            let extracted_root = staging.root().join(".vua/imports").join(&command_id);
            extract_package_into_dir(&source_folder.join(&package.relative_path), &extracted_root)
                .map_err(|error| {
                    (
                        format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                        MaterialExecutionStatus::Failed,
                    )
                })?;
            let manifest_digest =
                sha256_file(&extracted_root.join("manifest.sha256")).map_err(|error| {
                    (
                        format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                        MaterialExecutionStatus::Failed,
                    )
                })?;
            let command = UnityCommand {
                schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
                command_id,
                operation: UnityOperation::MaterializeExtractedPackage,
                project_id: staging_project.id.clone(),
                dry_run: false,
                expected_project_fingerprint: Some(staging_fingerprint.clone()),
                payload: UnityPayload {
                    source_package_path: Some(extracted_root.to_string_lossy().into_owned()),
                    source_package_sha256: Some(package.sha256.clone()),
                    manifest_sha256: Some(manifest_digest),
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
            schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
            command_id,
            operation: UnityOperation::CreateLocalVpmPackage,
            project_id: staging_project.id.clone(),
            dry_run: false,
            expected_project_fingerprint: Some(staging_fingerprint.clone()),
            payload: UnityPayload {
                package_id: Some(package_id.clone()),
                package_display_name: Some(identity.display_name.clone()),
                package_version: Some("0.1.0".to_owned()),
                staging_token: Some(confirmation.correlation_id.clone()),
                // Declarations flow verbatim from the plan's source
                // (vua-dependencies.json); the Bridge never guesses and the
                // executor never invents a dependency.
                package_dependencies: plan
                    .source
                    .declared_dependencies
                    .iter()
                    .map(|dependency| vua_orchestrator::UnityPackageDependency {
                        package_id: dependency.package_id.clone(),
                        version: dependency.version_range.clone(),
                    })
                    .collect(),
                ..UnityPayload::default()
            },
        };
        self.dispatch(&staging_project, &command, bridge_jobs)?;
        // The Bridge's changedPaths are TOP-LEVEL entries (Runtime/<name>,
        // Editor, package.json); a directory existing proves nothing about
        // the files inside it. The validation list below is therefore built
        // per-file from the published package tree instead.

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

        // Every file the produced package carries must load in the target
        // after install — nested prefabs, materials, textures included.
        collect_package_files(&artifact.package_root, &package_id, validation_expectations)
            .map_err(|error| {
                (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
            })?;
        validation_expectations.sort();
        validation_expectations.dedup();

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

        *local_vpm = Some(vua_orchestrator::LocalVpmEvidenceV01 {
            package_id,
            display_name: identity.display_name.clone(),
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
            schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
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
            if diagnostic.severity == vua_orchestrator::DiagnosticSeverity::Error {
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

    // --- B4 artifact-mode: generate-only VPM production ---

    /// Generates a local VPM package from a warehouse entry's original
    /// `.unitypackage` copies — the same staging → materialize → create →
    /// publish chain as `run_local_reusable`, minus the target install and
    /// validation (there is no target project: the warehouse entry IS the
    /// destination). Staging serves one atomic call (the guard destroys it
    /// on exit); the published artifact is deterministic and survives
    /// staging teardown. Cancellation is observed at package boundaries.
    pub fn generate_vpm_only(
        &self,
        originals: &[GenerateSourcePackage],
        display_name: &str,
        entry_folder: &Path,
        artifact_output_root: &Path,
        correlation_id: &str,
        token: &MaterialCancelToken,
    ) -> Result<GeneratedVpm, StepFailure> {
        let staging = StagingProject::create(&self.temp_root, correlation_id, correlation_id)
            .map_err(|error| {
                (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
            })?;
        let staging_project = ProjectRef {
            id: format!("{correlation_id}-staging"),
            root: staging.root().to_path_buf(),
        };
        // 用户裁定:包机器 ID 走持久身份库——入口文件夹即身份来源,同条目
        // 稳定、同名自动去重。
        let identity = self
            .identity_store
            .resolve(entry_folder, display_name)
            .map_err(|error| {
                (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
            })?;
        let package_id = identity.package_id;

        // The fresh staging project needs its own fingerprint for its first
        // mutating command (same chained-fingerprint discipline as intake).
        let inspect = self.inspect(
            &staging_project,
            &format!("{correlation_id}-stage-inspect"),
            &mut Vec::new(),
        )?;
        let mut staging_fingerprint = fingerprint_of(&inspect).ok_or_else(|| {
            (error_codes::BRIDGE_FAILED.to_owned(), MaterialExecutionStatus::Failed)
        })?;

        for (index, package) in originals.iter().enumerate() {
            if token.is_cancelled() {
                return Err((intake_codes::CANCELLED.to_owned(), MaterialExecutionStatus::Cancelled));
            }
            // Drift check against the copy row's recorded identity: the
            // warehouse original must be byte-identical to what BDL inspected.
            let archive_digest = sha256_file(&package.archive_path).map_err(|error| {
                (
                    format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                    MaterialExecutionStatus::Failed,
                )
            })?;
            if archive_digest != package.sha256 {
                return Err((intake_codes::SOURCE_DRIFT.to_owned(), MaterialExecutionStatus::Failed));
            }
            let command_id = format!("{correlation_id}-stage-import-{index}");
            let extracted_root = staging.root().join(".vua/imports").join(&command_id);
            extract_package_into_dir(&package.archive_path, &extracted_root).map_err(|error| {
                (
                    format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                    MaterialExecutionStatus::Failed,
                )
            })?;
            let manifest_digest =
                sha256_file(&extracted_root.join("manifest.sha256")).map_err(|error| {
                    (
                        format!("{}: {error}", intake_codes::ARCHIVE_INVALID),
                        MaterialExecutionStatus::Failed,
                    )
                })?;
            let command = UnityCommand {
                schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
                command_id,
                operation: UnityOperation::MaterializeExtractedPackage,
                project_id: staging_project.id.clone(),
                dry_run: false,
                expected_project_fingerprint: Some(staging_fingerprint.clone()),
                payload: UnityPayload {
                    source_package_path: Some(extracted_root.to_string_lossy().into_owned()),
                    source_package_sha256: Some(package.sha256.clone()),
                    manifest_sha256: Some(manifest_digest),
                    ..UnityPayload::default()
                },
            };
            let result = self.dispatch(&staging_project, &command, &mut Vec::new())?;
            if let Some(fingerprint) = fingerprint_of(&result) {
                staging_fingerprint = fingerprint;
            }
        }

        // Produce the local-reusable package layout + manifest.
        let command_id = format!("{correlation_id}-stage-vpm");
        let command = UnityCommand {
            schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
            command_id,
            operation: UnityOperation::CreateLocalVpmPackage,
            project_id: staging_project.id.clone(),
            dry_run: false,
            expected_project_fingerprint: Some(staging_fingerprint.clone()),
            payload: UnityPayload {
                package_id: Some(package_id.clone()),
                package_display_name: Some(display_name.to_owned()),
                package_version: Some("0.1.0".to_owned()),
                staging_token: Some(correlation_id.to_owned()),
                ..UnityPayload::default()
            },
        };
        self.dispatch(&staging_project, &command, &mut Vec::new())?;

        // Publish deterministically into the caller's output root; the
        // artifact survives staging teardown (publish copies the tree out).
        let artifact = crate::local_vpm_artifact::publish_local_vpm_artifact(
            &staging.root().join("Packages").join(&package_id),
            artifact_output_root,
            &package_id,
            "0.1.0",
        )
        .map_err(|error| {
            (format!("{}: {error}", error_codes::STAGING_FAILED), MaterialExecutionStatus::Failed)
        })?;

        Ok(GeneratedVpm { package_id, artifact })
    }

    // --- port helpers ---

    fn inspect(
        &self,
        project: &ProjectRef,
        command_id: &str,
        bridge_jobs: &mut Vec<BridgeJobEvidenceV01>,
    ) -> Result<UnityResult, StepFailure> {
        let command = UnityCommand {
            schema_version: vua_orchestrator::ENVELOPE_SCHEMA_VERSION,
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
            Err(vua_orchestrator::BridgeError::TimedOut) => Err((
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
    let mut manifest_lines: Vec<String> = Vec::new();
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
            let mut hasher = Sha256::new();
            hasher.update(&bytes);
            let mut digest = String::new();
            for byte in hasher.finalize() {
                use std::fmt::Write as _;
                write!(&mut digest, "{byte:02x}").expect("writing to String");
            }
            manifest_lines.push(format!("sha256:{digest}  {entry_path}"));
            fs::write(target, &bytes)?;
        }
    }

    fs::write(
        extracted_root.join("manifest.sha256"),
        manifest_lines.join("
") + "
",
    )?;

    Ok(folders.into_iter().map(|(_, logical)| logical).collect())
}

/// SHA-256 of a file on disk — binds the extracted layout to the
/// digest-verified archive before any content reaches the Bridge.
/// Collects every file under the produced package as a project-relative
/// validation expectation (`Packages/<id>/<relative path>`), so the target
/// project's minimum-structure validation proves the INSTALLED TREE, not
/// just its top-level directories.
fn collect_package_files(
    package_root: &Path,
    package_id: &str,
    out: &mut Vec<String>,
) -> std::io::Result<()> {
    fn walk(dir: &Path, relative: &str, package_id: &str, out: &mut Vec<String>) -> std::io::Result<()> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            let path = entry.path();
            let relative = if relative.is_empty() { name } else { format!("{relative}/{name}") };
            if path.is_dir() {
                walk(&path, &relative, package_id, out)?;
            } else if !relative.ends_with(".meta") {
                // .meta sidecars are not loadable assets — their integrity is
                // covered by the publish-time archive/tree digests, while
                // this list proves AssetDatabase loadability (F6 review: a
                // per-file list including .meta would always fail).
                out.push(format!("Packages/{package_id}/{relative}"));
            }
        }
        Ok(())
    }
    walk(package_root, "", package_id, out)
}

fn sha256_file(path: &Path) -> std::io::Result<String> {
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(crate::material_intake::sha256_text(hasher.finalize().as_ref()))
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
