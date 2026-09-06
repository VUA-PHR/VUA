//! Material production domain types shared by the core (build records,
//! production documents) and the unity-bridge adapters (intake, execution).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MaterialEntryMode {
    DirectUnityPackage,
    LocalReusableVpm,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutableRiskKind {
    CSharpSource,
    ManagedAssembly,
    NativePlugin,
    EditorContent,
    BuildEntryPoint,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutableRiskEvidence {
    pub package_path: String,
    pub asset_path: String,
    pub kind: ExecutableRiskKind,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourcePackageEvidenceV01 {
    pub relative_path: String,
    pub size_bytes: u64,
    pub sha256: String,
    pub asset_paths: Vec<String>,
}

/// A user/Recipe-curated dependency declaration from the source folder's
/// optional `vua-dependencies.json`. Declarations travel with the source
/// fingerprint (edits between plan and execute are drift) and reach the
/// produced package's `package.json` verbatim — never auto-detected.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeclaredDependencyV01 {
    pub package_id: String,
    pub version_range: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceFolderInspectionV01 {
    pub schema_version: String,
    pub display_name: String,
    pub source_fingerprint: String,
    pub risk_fingerprint: String,
    pub packages: Vec<SourcePackageEvidenceV01>,
    pub executable_risks: Vec<ExecutableRiskEvidence>,
    pub declared_dependencies: Vec<DeclaredDependencyV01>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RiskDecisionChoice {
    SnapshotAndContinue,
    Continue,
    Cancel,
    NotRequired,
}
