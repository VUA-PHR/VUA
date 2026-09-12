//! Local-first VUA application core for Recipe-first AMF workflows.

// AppErrorV1 is a deliberately fat value type: it carries the localization
// key, params and redacted context through IPC, events and the journal. Boxed
// errors would leak through serde shapes for no wire benefit.
#![allow(clippy::result_large_err)]

mod assembly;
mod booth_extraction;
mod build_record;
mod inspection_evidence;
mod plan_documents;
mod production_evidence;
mod recipe_documents;
mod recipe_records;
mod capability;
mod contracts;
mod editor_targets;
mod editor_selection;
mod environment;
mod filesystem;
mod journal;
mod material_types;
mod model;
mod overlay_surface;
mod process;
mod project_identity;
mod provision;
mod recipe;
mod runtime;
mod sqlite_task_store;
mod state_file;
mod time;
mod tools;
mod vpm;
mod vpm_backend;
mod win_registry;
mod workflow;

pub use assembly::{
    error_codes as assembly_error_codes, AssemblyConfirmation, AssemblyEngine, AssemblyOperation,
    AssemblyPlanV1, AssemblyStepV1, BridgeError, UnityBridge,
};
pub use booth_extraction::{
    extract_product_page, ExtractedProduct, ExtractedSubproduct, ExtractionError,
};
pub use plan_documents::{ApproveOutcome, PlanDocumentStore, APPROVED_PLAN_SCHEMA_VERSION};
pub use inspection_evidence::{
    aggregate_overall_status, build_inspection_command, operation_status, producing_operations,
    transcribe_dimension, InspectionDimension, InspectionEvidenceStore,
    INSPECTION_EVIDENCE_SCHEMA_VERSION,
};
pub use recipe_records::RecipeRecordStore;
pub use recipe_documents::{RecipeDocumentStore, RecipeListEntry, RecipeSaveError, StoredRecipeDocument};
pub use production_evidence::{
    EvidenceKind, EvidenceResolution, EvidenceSourceRef, EvidenceStore, EvidenceSubject,
    ProductionEvidenceV01, PRODUCTION_EVIDENCE_SCHEMA_VERSION,
};
pub use build_record::{
    wire_v02, BridgeJobEvidenceV01, BridgeSummary, BuildRecordStatus, BuildRecordStore,
    BuildRecordV01, BuildRecordWireV02, BuildSnapshotEvidenceV01, BuildValidationEvidenceV01,
    EvidenceSummary, LocalVpmEvidenceV01, LocalVpmSummary, SnapshotSummary, ValidationSummary,
    BUILD_RECORD_SCHEMA_VERSION, PRODUCTION_STAGES,
};
pub use capability::{
    CapabilityRegistry, CapabilityReport, CapabilitySource, CapabilityState, UnavailableSource,
};
pub use contracts::{
    AppErrorV1, CommandAcceptedV1, ErrorCategory, ParamValue, TaskEventKind, TaskEventV1,
    TaskState, ENVELOPE_SCHEMA_VERSION,
};
pub use editor_targets::{
    classify_editor, classify_version_string, codes as editor_target_codes, editor_version_from_path,
    parse_editor_version, EditorClass, ParsedEditorVersion, MIGRATION_SOURCES, PRODUCTION_TARGET,
};
pub use editor_selection::{select_editor, EditorSelection, EditorSelectionGap};
pub use environment::{
    codes as env_managers_codes, error_codes as env_error_codes, installed_unity_editors,
    EditorInstallObservation, InstalledUnityEditor, EnvironmentCheckItemV1, EnvironmentEngine,
    EnvironmentPresence, EnvironmentRoots, EnvironmentSnapshotV1, FindingSeverity,
    ManagerDiagnostic, ManagerPresence, VccCapability, VccSettingsReader, VrRuntimeRoots, Zone,
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
pub use material_types::{
    DeclaredDependencyV01, ExecutableRiskEvidence, ExecutableRiskKind, MaterialEntryMode,
    RiskDecisionChoice, SourceFolderInspectionV01, SourcePackageEvidenceV01,
};
pub use model::*;
pub use overlay_surface::{
    OverlayPlanSummary, OverlayProductionCard, OverlayReadModel, OverlayRecordSummary,
    OverlayTaskCard, StoreOverlayReadModel,
};
pub use process::{
    outcome_with_exit, FakeProcessRunner, ProcessError, ProcessOutcome, ProcessRunner, ProcessSpec,
    StdProcessRunner, CREDENTIAL_ENV_REMOVALS,
};
pub use project_identity::{ProjectIdentity, ProjectIdentityError};
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
pub use vpm::{fnv1a_hex, InstallConfirmation, InstallPlanV1, InstallRequest, PlanStepV1, VpmEngine};
pub use vpm_backend::{
    error_codes as vpm_backend_error_codes, ChangeItemV1, ChangeKindV1, ChangePreviewV1,
    InstalledPackageV1, PackageRequestV1, RegisteredProjectV1, VpmBackend, VpmCapabilities,
};
pub use workflow::{AvatarSetupWorkflow, WorkflowError};
pub use win_registry::{FakeRegistrySource, RegistryHive, RegistrySource, WindowsRegistrySource};
