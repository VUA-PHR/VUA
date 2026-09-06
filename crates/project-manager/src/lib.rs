//! Project and environment adapters: the concrete VPM backends behind the
//! core VpmBackend port and the cross-profile project mutation lock.

// AppErrorV1-carrying results are deliberately fat value types shared with
// the core contract; boxed errors would not change the wire surface.
#![allow(clippy::result_large_err)]

pub mod project_lock;
pub mod vpm_backend;

pub use project_lock::{
    acquire_project_lock, begin_mutation, read_pending_mutation, LockEnvelopeV1, LockHolder,
    MutationMarkerGuard, MutationMarkerV1, PendingMutation, ProjectLockError, ProjectLockGuard,
    MUTATION_MARKER_SCHEMA_VERSION, PROJECT_LOCK_SCHEMA_VERSION, LOCK_FILE_NAME,
    MARKER_FILE_NAME,
};
pub use vpm_backend::{backends_summary, create_from_template, VccCliBackend, VrcGetLibBackend};
