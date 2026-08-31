use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WorkflowStage {
    Inspect,
    Plan,
    AwaitConfirmation,
    Snapshot,
    Execute,
    Validate,
    Completed,
    Recover,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRef {
    pub id: String,
    pub root: PathBuf,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AvatarSetupRequest {
    pub workflow_id: String,
    pub project: ProjectRef,
    pub avatar_global_object_id: String,
    pub avatar_armature_global_object_id: String,
    pub outfit_global_object_id: String,
    pub outfit_armature_global_object_id: String,
    pub toggle_name: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UnityOperation {
    InspectProject,
    IdentifyAssets,
    InstallOutfit,
    CreateToggle,
    ValidateAvatar,
    AnalyzePerformance,
}

impl UnityOperation {
    pub fn is_mutating(self) -> bool {
        matches!(self, Self::InstallOutfit | Self::CreateToggle)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnityPayload {
    pub avatar_global_object_id: String,
    pub avatar_armature_global_object_id: String,
    pub outfit_global_object_id: String,
    pub outfit_armature_global_object_id: String,
    pub toggle_name: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnityCommand {
    pub schema_version: u8,
    pub command_id: String,
    pub operation: UnityOperation,
    pub project_id: String,
    pub dry_run: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_project_fingerprint: Option<String>,
    pub payload: UnityPayload,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResultStatus {
    Succeeded,
    Failed,
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticSeverity {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub code: String,
    pub severity: DiagnosticSeverity,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnityResult {
    pub schema_version: u8,
    pub command_id: String,
    pub status: ResultStatus,
    pub changed_paths: Vec<String>,
    pub diagnostics: Vec<Diagnostic>,
    #[serde(default)]
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanStep {
    pub operation: UnityOperation,
    pub label: String,
    pub mutates_project: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowPlan {
    pub workflow_id: String,
    pub project: ProjectRef,
    pub steps: Vec<PlanStep>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowReport {
    pub workflow_id: String,
    pub stage: WorkflowStage,
    pub completed_operations: Vec<UnityOperation>,
    pub diagnostics: Vec<Diagnostic>,
    pub performance: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotRef {
    pub id: String,
    pub path: PathBuf,
}

pub trait SnapshotStore {
    type Error;

    fn create(&self, project: &ProjectRef, snapshot_id: &str) -> Result<SnapshotRef, Self::Error>;
    fn restore(&self, project: &ProjectRef, snapshot: &SnapshotRef) -> Result<(), Self::Error>;
}

impl std::fmt::Display for UnityOperation {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = serde_json::to_value(self)
            .ok()
            .and_then(|value| value.as_str().map(str::to_owned))
            .unwrap_or_else(|| "unknown".into());
        formatter.write_str(&name)
    }
}
