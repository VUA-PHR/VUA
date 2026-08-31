use crate::process::{ProcessRunner, StdProcessRunner};
use crate::ProjectRef;
use std::fmt::{Display, Formatter};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;

#[derive(Debug)]
pub enum ProjectProvisionError {
    InvalidName,
    ParentMissing,
    TargetExists,
    Io(io::Error),
    VpmFailed(Option<i32>),
    /// The vrc-get process hit its wall-clock budget.
    VpmTimedOut,
    /// vrc-get CLI has no project-creation command (verified against the
    /// upstream source, Fix 4). Creation lives in the vrc-get GUI library
    /// (ALCOM) and the official VCC CLI (`vpm new`). See ADR-0006 draft.
    Unsupported(&'static str),
    InvalidProject,
}

impl Display for ProjectProvisionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidName => write!(formatter, "project name is invalid"),
            Self::ParentMissing => write!(formatter, "project parent directory does not exist"),
            Self::TargetExists => write!(formatter, "project target already exists"),
            Self::Io(_) => write!(formatter, "project filesystem operation failed"),
            Self::VpmFailed(code) => write!(formatter, "VPM project creation failed ({code:?})"),
            Self::VpmTimedOut => write!(formatter, "VPM project creation timed out"),
            Self::Unsupported(reason) => write!(formatter, "{reason}"),
            Self::InvalidProject => write!(formatter, "VPM did not create a valid Unity project"),
        }
    }
}

impl std::error::Error for ProjectProvisionError {}

impl From<io::Error> for ProjectProvisionError {
    fn from(value: io::Error) -> Self {
        Self::Io(value)
    }
}

/// Creates VPM projects through the shared process runner port (typed args,
/// mandatory timeout, no shell).
pub struct VpmProjectProvisioner {
    runner: Arc<dyn ProcessRunner>,
    /// E-VPM-DUAL 恢复创建能力时使用；CLI-only 现状下暂不读取。
    #[allow(dead_code)]
    executable: PathBuf,
}

impl VpmProjectProvisioner {
    pub fn new(executable: impl Into<PathBuf>) -> Self {
        Self {
            runner: Arc::new(StdProcessRunner),
            executable: executable.into(),
        }
    }

    pub fn with_runner(executable: impl Into<PathBuf>, runner: Arc<dyn ProcessRunner>) -> Self {
        Self {
            runner,
            executable: executable.into(),
        }
    }

    /// Project creation via the vrc-get CLI is **not possible** (Fix 4):
    /// the upstream CLI command enum (verified against the vrc-get source)
    /// has install/remove/upgrade/search/repo/migrate but no `new`. The
    /// prototype's `vrc-get new <name> Avatar -p` was the VCC CLI syntax
    /// (`vpm new`) misattributed to vrc-get. Creation therefore stays
    /// honestly unsupported here until the dual-backend slice lands
    /// (ADR-0006 draft): VCC CLI `vpm new`, ALCOM, or Unity Hub all create
    /// compatible projects. Input validation still runs first so callers
    /// get the same early errors as before.
    pub fn create_avatar_project(
        &self,
        parent: &Path,
        project_name: &str,
        project_id: impl Into<String>,
    ) -> Result<ProjectRef, ProjectProvisionError> {
        let _ = self.runner;
        validate_project_name(project_name)?;
        if !parent.is_dir() {
            return Err(ProjectProvisionError::ParentMissing);
        }
        let target = parent.join(project_name);
        if target.exists() {
            return Err(ProjectProvisionError::TargetExists);
        }
        let _ = project_id;
        Err(ProjectProvisionError::Unsupported(
            "vrc-get CLI has no project-creation command; create the project with ALCOM, VCC (`vpm new`) or Unity Hub, then retry",
        ))
    }
}

fn validate_project_name(value: &str) -> Result<(), ProjectProvisionError> {
    if value.trim().is_empty()
        || value != value.trim()
        || value == "."
        || value == ".."
        || value.chars().any(|character| {
            matches!(
                character,
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'
            )
        })
    {
        return Err(ProjectProvisionError::InvalidName);
    }
    Ok(())
}
