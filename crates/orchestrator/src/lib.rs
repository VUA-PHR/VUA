//! Local-first VUA application core for Recipe-first AMF workflows.

// AppErrorV1 is a deliberately fat value type: it carries the localization
// key, params and redacted context through IPC, events and the journal. Boxed
// errors would leak through serde shapes for no wire benefit.
#![allow(clippy::result_large_err)]

mod assembly;
mod booth_extraction;
mod bridge;
mod build_record;
mod capability;
mod contracts;
mod download_events;
mod editor_targets;
mod environment;
mod environment_managers;
mod filesystem;
mod journal;
mod local_vpm_artifact;
mod material_identity;
mod material_intake;
mod material_task;
mod material_exec;
mod material_staging;
mod model;
mod process;
mod project_identity;
mod project_lock;
mod provider_host;
#[cfg(windows)]
mod provider_job;
mod provision;
mod recipe;
mod runtime;
mod sqlite_task_store;
mod staging_scaffold;
mod state_file;
mod time;
mod tools;
mod vpm;
mod vpm_backend;
mod win_registry;
mod workflow;

pub use assembly::{
    error_codes as assembly_error_codes, AssemblyConfirmation, AssemblyEngine, AssemblyOperation,
    AssemblyPlanV1, AssemblyStepV1, UnityBridge,
};
pub use booth_extraction::{
    extract_product_page, ExtractedProduct, ExtractedSubproduct, ExtractionError,
};
pub use bridge::{BridgeError, UnityBatchBridge};
pub use build_record::{
    BridgeJobEvidenceV01, BuildRecordStatus, BuildRecordStore, BuildRecordV01,
    BuildSnapshotEvidenceV01, BuildValidationEvidenceV01, LocalVpmEvidenceV01,
    BUILD_RECORD_SCHEMA_VERSION,
};
pub use capability::{
    CapabilityRegistry, CapabilityReport, CapabilitySource, CapabilityState, UnavailableSource,
};
pub use contracts::{
    AppErrorV1, CommandAcceptedV1, ErrorCategory, ParamValue, TaskEventKind, TaskEventV1,
    TaskState, ENVELOPE_SCHEMA_VERSION,
};
pub use download_events::{
    DownloadEventV01, DownloadEventKind, DownloadFailureKind, DOWNLOAD_EVENT_SCHEMA_VERSION,
};
pub use editor_targets::{
    classify_editor, classify_version_string, codes as editor_target_codes, parse_editor_version,
    EditorClass, ParsedEditorVersion, MIGRATION_SOURCES, PRODUCTION_TARGET,
};
pub use environment::{
    error_codes as env_error_codes, EnvironmentCheckItemV1, EnvironmentEngine, EnvironmentPresence,
    EnvironmentRoots, EnvironmentSnapshotV1, VrRuntimeRoots, Zone,
};
pub use environment_managers::{
    codes as env_spike_codes, collect_environment_spike_snapshot, AlcomCapability, EditorFinding,
    EnvironmentSpikeSnapshotV01, ManagerPresence, ManagerRoots, ProjectAssociation,
    ProjectFinding, SpikeDiagnostic, SpikeSeverity, VccCapability,
    ENV_SPIKE_SNAPSHOT_SCHEMA_VERSION,
};
pub use filesystem::{
    project_tree_fingerprint, FileSystemProjectStore, FileSystemSnapshotStore,
    SnapshotManifestEntry, SnapshotManifestV1, VerifiedSnapshot,
};
pub use journal::{
    recover_from_journal, JournalEntryKind, JournalEntryV1, JournalError, JournalPayload,
    JournalSink, JournalWriter, MemoryJournal, RecoveredDisposition, RecoveredTask, RecoveryReport,
    JOURNAL_SCHEMA_VERSION,
};
pub use local_vpm_artifact::{publish_local_vpm_artifact, PublishedLocalVpmArtifact};
pub use material_identity::{LocalPackageIdentity, LocalPackageIdentityStore};
pub use material_intake::{
    error_codes as material_intake_error_codes, ExecutableRiskEvidence, ExecutableRiskKind,
    MaterialEntryMode, MaterialIntakeConfirmationV01, MaterialIntakeEngine, MaterialIntakePlanV01,
    MaterialIntakeStepKind, MaterialIntakeStepV01, RiskDecisionChoice, RiskDecisionV01,
    SourceFolderInspectionV01, SourcePackageEvidenceV01,
};
pub use material_exec::{
    error_codes as material_exec_error_codes, MaterialCancelToken, MaterialExecutionReport,
    MaterialExecutionStatus, MaterialExecutor, RollbackOutcome,
};
pub use material_task::{
    material_intake_job, submit_material_intake, MaterialIntakeTaskSpec, MaterialTaskResult,
};
pub use material_staging::{
    staging_root, StagingProject, STAGING_MANIFEST_JSON, STAGING_PROJECT_VERSION_TXT,
    STAGING_TEMPLATE_VERSION, STAGING_UNITY_VERSION,
};
pub use model::*;
pub use process::{
    outcome_with_exit, FakeProcessRunner, ProcessError, ProcessOutcome, ProcessRunner, ProcessSpec,
    StdProcessRunner, CREDENTIAL_ENV_REMOVALS,
};
pub use project_identity::{ProjectIdentity, ProjectIdentityError};
pub use project_lock::{
    acquire_project_lock, begin_mutation, read_pending_mutation, LockEnvelopeV1, LockHolder,
    MutationMarkerGuard, MutationMarkerV1, PendingMutation, ProjectLockError, ProjectLockGuard,
    MUTATION_MARKER_SCHEMA_VERSION, PROJECT_LOCK_SCHEMA_VERSION, LOCK_FILE_NAME,
    MARKER_FILE_NAME,
};
pub use provider_host::{
    production_config_from_env, run_provider_host, run_provider_host_with, ProductionConfig,
    ProviderHostError, PROVIDER_FRAME_VERSION,
};
#[cfg(windows)]
pub use provider_job::ProviderJobGuard;
pub use provision::{ProjectProvisionError, VpmProjectProvisioner};
pub use recipe::*;
pub use runtime::{
    recovery_dispositions, SubmitRequest, TaskContext, TaskExit, TaskJob, TaskRecoveryDisposition,
    TaskRuntime, TaskSnapshot,
};
pub use staging_scaffold::{
    MA_STUB_ASMDEF, MA_STUB_COMPONENTS_CS, MA_STUB_PACKAGE_ID, MA_STUB_PACKAGE_JSON,
};
pub use sqlite_task_store::{
    IdempotentCancellation, IdempotentTaskAcceptance, NewTask, ProjectMutationLease,
    SqliteStoreError, SqliteTaskStore, StoredCancellationOutcome, StoredCancellationResult,
    StoredTask, StoredTaskEvent, TaskMutation,
};
pub use state_file::{
    StateFile, StateFileError, StateLoad, StateRecoveryReason, STATE_FILE_SCHEMA_VERSION,
};
pub use time::{
    Clock, FixedClock, FixedIdGenerator, NanosTaskIdGenerator, SystemClock, TaskIdGenerator,
};
pub use tools::{
    registry_ids, ProbeRoot, ToolCardV1, ToolProbe, ToolRegistration, ToolsEngine, ToolsRoots,
    TOOL_REGISTRY,
};
pub use vpm::{InstallConfirmation, InstallPlanV1, InstallRequest, PlanStepV1, VpmEngine};
pub use vpm_backend::{
    backends_summary, create_from_template, error_codes as vpm_backend_error_codes, ChangeItemV1,
    ChangeKindV1, ChangePreviewV1, PackageRequestV1, VccCliBackend, VpmBackend, VpmCapabilities,
    VrcGetLibBackend,
};
pub use workflow::{AvatarSetupWorkflow, WorkflowError};
pub use win_registry::{FakeRegistrySource, RegistryHive, RegistrySource, WindowsRegistrySource};
