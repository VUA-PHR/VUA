//! Project and environment adapters: the concrete VPM backends behind the
//! core VpmBackend port, the read-only project-inspection aggregate (M6
//! T-A/T-B), and the cross-profile project mutation lock.

// AppErrorV1-carrying results are deliberately fat value types shared with
// the core contract; boxed errors would not change the wire surface.
#![allow(clippy::result_large_err)]

pub mod environment_managers;
pub mod project_inspection;
pub mod project_lock;
pub mod vpm_backend;

pub use environment_managers::{
    collect_environment_managers_snapshot, AlcomCapability, EditorFinding,
    EnvironmentManagersSnapshotV01, ManagerRoots, ProjectAssociation, ProjectFinding,
    VccSettingsFileReader, ENV_MANAGERS_SNAPSHOT_SCHEMA_VERSION,
};
pub use project_inspection::{
    collect_project_inspections, ManifestPackage, MutationStatus, ProjectInspectionSnapshotV01,
    ProjectInspectionV01, VrchatSdkFinding, PROJECT_INSPECTION_SCHEMA_VERSION,
};
pub use project_lock::{
    acquire_project_lock, begin_mutation, read_pending_mutation, LockEnvelopeV1, LockHolder,
    MutationMarkerGuard, MutationMarkerV1, PendingMutation, ProjectLockError, ProjectLockGuard,
    MUTATION_MARKER_SCHEMA_VERSION, PROJECT_LOCK_SCHEMA_VERSION, LOCK_FILE_NAME,
    MARKER_FILE_NAME,
};
pub use vpm_backend::{backends_summary, create_from_template, VccCliBackend, VrcGetLibBackend};
