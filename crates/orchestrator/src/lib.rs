//! Local-first VUA application core for Recipe-first AMF workflows.

// AppErrorV1 is a deliberately fat value type: it carries the localization
// key, params and redacted context through IPC, events and the journal. Boxed
// errors would leak through serde shapes for no wire benefit.
#![allow(clippy::result_large_err)]

mod assembly;
mod bridge;
mod capability;
mod contracts;
mod environment;
mod filesystem;
mod journal;
mod model;
mod process;
mod provision;
mod recipe;
mod runtime;
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
    FileSystemProjectStore, FileSystemSnapshotStore, SnapshotManifestEntry, SnapshotManifestV1,
    VerifiedSnapshot,
};
pub use journal::{
    recover_from_journal, JournalEntryKind, JournalEntryV1, JournalError, JournalPayload,
    JournalSink, JournalWriter, MemoryJournal, RecoveredDisposition, RecoveredTask, RecoveryReport,
    JOURNAL_SCHEMA_VERSION,
};
pub use model::*;
pub use process::{
    outcome_with_exit, FakeProcessRunner, ProcessError, ProcessOutcome, ProcessRunner, ProcessSpec,
    StdProcessRunner, CREDENTIAL_ENV_REMOVALS,
};
pub use provision::{ProjectProvisionError, VpmProjectProvisioner};
pub use recipe::*;
pub use runtime::{
    recovery_dispositions, SubmitRequest, TaskContext, TaskExit, TaskJob, TaskRuntime, TaskSnapshot,
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
