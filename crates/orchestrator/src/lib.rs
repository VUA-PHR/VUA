//! Local-first VUA application core for Recipe-first AMF workflows.

// AppErrorV1 is a deliberately fat value type: it carries the localization
// key, params and redacted context through IPC, events and the journal. Boxed
// errors would leak through serde shapes for no wire benefit.
#![allow(clippy::result_large_err)]

mod assembly;
mod bridge;
mod build_record;
mod capability;
mod contracts;
mod environment;
mod filesystem;
mod journal;
mod local_vpm_artifact;
mod material_identity;
mod material_intake;
mod model;
mod process;
mod project_identity;
mod provider_host;
#[cfg(windows)]
mod provider_job;
mod provision;
mod recipe;
mod runtime;
mod sqlite_task_store;
mod state_file;
mod time;
mod tools;
mod vpm;
mod vpm_backend;
mod workflow;

pub use assembly::{
    error_codes as assembly_error_codes, AssemblyConfirmation, AssemblyEngine, AssemblyOperation,
    AssemblyPlanV1, AssemblyStepV1, UnityBridge,
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
pub use environment::{
    error_codes as env_error_codes, CheckStatusV1, EnvironmentCheckItemV1, EnvironmentEngine,
    EnvironmentRoots, EnvironmentSnapshotV1, Zone,
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
pub use model::*;
pub use process::{
    outcome_with_exit, FakeProcessRunner, ProcessError, ProcessOutcome, ProcessRunner, ProcessSpec,
    StdProcessRunner, CREDENTIAL_ENV_REMOVALS,
};
pub use project_identity::{ProjectIdentity, ProjectIdentityError};
pub use provider_host::{run_provider_host, ProviderHostError, PROVIDER_FRAME_VERSION};
#[cfg(windows)]
pub use provider_job::ProviderJobGuard;
pub use provision::{ProjectProvisionError, VpmProjectProvisioner};
pub use recipe::*;
pub use runtime::{
    recovery_dispositions, SubmitRequest, TaskContext, TaskExit, TaskJob, TaskRecoveryDisposition,
    TaskRuntime, TaskSnapshot,
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
