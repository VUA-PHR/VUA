use crate::process::{ProcessOutcome, ProcessRunner, ProcessSpec, StdProcessRunner};
use crate::{FileSystemProjectStore, ProjectRef, UnityCommand, UnityResult};
use std::fmt::{Display, Formatter};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

const DEFAULT_BRIDGE_TIMEOUT: Duration = Duration::from_secs(1200);
const OUTPUT_LIMIT: usize = 256 * 1024;

#[derive(Debug)]
pub enum BridgeError {
    Io(io::Error),
    UnityFailed(Option<i32>),
    /// The Unity process hit its wall-clock budget and was killed.
    TimedOut,
    MissingResult,
    InvalidResult(serde_json::Error),
}

impl Display for BridgeError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io(_) => write!(formatter, "bridge file operation failed"),
            Self::UnityFailed(code) => write!(formatter, "Unity exited unsuccessfully ({code:?})"),
            Self::TimedOut => write!(formatter, "Unity did not finish within the budget"),
            Self::MissingResult => write!(formatter, "Unity did not write a bridge result"),
            Self::InvalidResult(_) => write!(formatter, "Unity wrote an invalid bridge result"),
        }
    }
}

impl std::error::Error for BridgeError {}

impl From<io::Error> for BridgeError {
    fn from(value: io::Error) -> Self {
        Self::Io(value)
    }
}

/// Executes Unity Bridge commands through the shared process runner port:
/// fixed executable, typed arguments, mandatory timeout and bounded output
/// (ORC-ADP-005, O6 "Unity 都通过该端口执行").
pub struct UnityBatchBridge {
    runner: Arc<dyn ProcessRunner>,
    executable: PathBuf,
    timeout: Duration,
}

impl UnityBatchBridge {
    pub fn new(executable: impl Into<PathBuf>) -> Self {
        Self {
            runner: Arc::new(StdProcessRunner),
            executable: executable.into(),
            timeout: DEFAULT_BRIDGE_TIMEOUT,
        }
    }

    pub fn with_runner(executable: impl Into<PathBuf>, runner: Arc<dyn ProcessRunner>) -> Self {
        Self {
            runner,
            executable: executable.into(),
            timeout: DEFAULT_BRIDGE_TIMEOUT,
        }
    }

    pub fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = timeout;
        self
    }
}

impl UnityBatchBridge {
    pub fn execute(
        &self,
        project: &ProjectRef,
        command: &UnityCommand,
    ) -> Result<UnityResult, BridgeError> {
        let request =
            FileSystemProjectStore::write_bridge_command(project, &command.command_id, command)?;
        let result_path = project
            .root
            .join(".vua/bridge")
            .join(format!("{}.result.json", command.command_id));
        if result_path.exists() {
            fs::remove_file(&result_path)?;
        }
        let spec = ProcessSpec {
            executable: self.executable.clone(),
            args: Self::invocation_args(&project.root, &request, &result_path),
            working_dir: None,
            timeout: self.timeout,
            output_limit: OUTPUT_LIMIT,
            // R2-2: Unity 子进程同样剥离凭据基线。
            removals: crate::process::CREDENTIAL_ENV_REMOVALS
                .iter()
                .map(|key| key.to_string())
                .collect(),
            ..Default::default()
        };
        let outcome = self.runner.run(&spec).map_err(|error| match error {
            crate::process::ProcessError::Io(io) => BridgeError::Io(io),
        })?;
        Self::collect(&outcome, &result_path)
    }

    /// Maps a process outcome plus the expected result file into a bridge
    /// result. Shared with tests through the runner port.
    fn collect(outcome: &ProcessOutcome, result_path: &Path) -> Result<UnityResult, BridgeError> {
        if outcome.timed_out {
            return Err(BridgeError::TimedOut);
        }
        if !outcome.success() && !result_path.exists() {
            return Err(BridgeError::UnityFailed(outcome.exit_code));
        }
        if !result_path.exists() {
            return Err(BridgeError::MissingResult);
        }
        let bytes = fs::read(result_path)?;
        serde_json::from_slice(&bytes).map_err(BridgeError::InvalidResult)
    }

    pub fn invocation_args(project: &Path, request: &Path, result: &Path) -> Vec<String> {
        vec![
            "-batchmode".into(),
            "-quit".into(),
            "-projectPath".into(),
            project.to_string_lossy().into_owned(),
            "-executeMethod".into(),
            "Vua.Editor.Bridge.BridgeEntryPoint.Run".into(),
            "-vuaRequest".into(),
            request.to_string_lossy().into_owned(),
            "-vuaResult".into(),
            result.to_string_lossy().into_owned(),
        ]
    }
}
