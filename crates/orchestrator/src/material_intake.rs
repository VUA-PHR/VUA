//! B3 material-intake contract: one source folder becomes one reviewed batch.
//!
//! The user-visible name comes from the folder. By product-owner ruling every
//! `.unitypackage` below that folder is included, so inspection, risk consent,
//! and drift binding cover exactly the bytes that may later reach Unity.

use crate::{AppErrorV1, ErrorCategory, ParamValue};
use flate2::read::GzDecoder;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{self, Read};
use std::path::{Component, Path, PathBuf};

pub const MATERIAL_INTAKE_SCHEMA_VERSION: &str = "0.1";
const MAX_PATHNAME_BYTES: u64 = 64 * 1024;

pub mod error_codes {
    pub const SOURCE_INVALID: &str = "vua.material.source_invalid";
    pub const SOURCE_EMPTY: &str = "vua.material.source_empty";
    pub const SOURCE_UNREADABLE: &str = "vua.material.source_unreadable";
    pub const ARCHIVE_INVALID: &str = "vua.material.archive_invalid";
    pub const PLAN_HASH_MISMATCH: &str = "vua.material.plan_hash_mismatch";
    pub const SOURCE_DRIFT: &str = "vua.material.source_drift";
    pub const RISK_DECISION_REQUIRED: &str = "vua.material.risk_decision_required";
    pub const RISK_DECISION_STALE: &str = "vua.material.risk_decision_stale";
    pub const CANCELLED: &str = "vua.material.cancelled";
}

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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceFolderInspectionV01 {
    pub schema_version: String,
    pub display_name: String,
    pub source_fingerprint: String,
    pub risk_fingerprint: String,
    pub packages: Vec<SourcePackageEvidenceV01>,
    pub executable_risks: Vec<ExecutableRiskEvidence>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MaterialIntakeStepKind {
    VerifySource,
    CreateSnapshot,
    ImportUnityPackages,
    CreateLocalVpmPackage,
    PreviewVpmInstall,
    ApplyVpmInstall,
    ValidateMinimumStructure,
    WriteBuildRecord,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterialIntakeStepV01 {
    pub kind: MaterialIntakeStepKind,
    pub mutates_target_project: bool,
    pub safe_boundary_after: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaterialIntakePlanV01 {
    pub schema_version: String,
    pub plan_id: String,
    pub plan_hash: String,
    pub mode: MaterialEntryMode,
    pub project_id: String,
    pub project_fingerprint: String,
    pub source: SourceFolderInspectionV01,
    pub risk_decision_required: bool,
    pub steps: Vec<MaterialIntakeStepV01>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RiskDecisionChoice {
    SnapshotAndContinue,
    Continue,
    Cancel,
    NotRequired,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RiskDecisionV01 {
    pub choice: RiskDecisionChoice,
    pub source_fingerprint: String,
    pub risk_fingerprint: String,
    /// UI session state only. This flag is recorded in the confirmation but
    /// must never be persisted as a cross-session preference.
    pub remember_for_session: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MaterialIntakeConfirmationV01 {
    pub plan: MaterialIntakePlanV01,
    pub risk_decision: RiskDecisionV01,
    pub confirmed_at: String,
    pub correlation_id: String,
}

impl MaterialIntakeConfirmationV01 {
    pub fn snapshot_scopes(&self) -> Vec<&'static str> {
        let mut scopes = vec!["Assets", "Packages", "ProjectSettings", "vpm-manifest.json"];
        if self.risk_decision.choice == RiskDecisionChoice::SnapshotAndContinue {
            scopes.push("UserSettings");
        }
        scopes
    }
}

#[derive(Debug, Default, Clone, Copy)]
pub struct MaterialIntakeEngine;

impl MaterialIntakeEngine {
    pub fn inspect_folder(
        &self,
        source_folder: &Path,
        correlation_id: &str,
    ) -> Result<SourceFolderInspectionV01, AppErrorV1> {
        let canonical = source_folder
            .canonicalize()
            .map_err(|error| source_error(error_codes::SOURCE_INVALID, correlation_id, error))?;
        if !canonical.is_dir() {
            return Err(simple_error(
                error_codes::SOURCE_INVALID,
                ErrorCategory::Validation,
                "errors.material.sourceInvalid",
                correlation_id,
            ));
        }
        let display_name = canonical
            .file_name()
            .and_then(|value| value.to_str())
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| {
                simple_error(
                    error_codes::SOURCE_INVALID,
                    ErrorCategory::Validation,
                    "errors.material.sourceInvalid",
                    correlation_id,
                )
            })?
            .to_owned();

        let mut paths = Vec::new();
        collect_packages(&canonical, &canonical, &mut paths)
            .map_err(|error| source_error(error_codes::SOURCE_UNREADABLE, correlation_id, error))?;
        paths.sort_by(|left, right| {
            normalized_relative(&canonical, left).cmp(&normalized_relative(&canonical, right))
        });
        if paths.is_empty() {
            return Err(simple_error(
                error_codes::SOURCE_EMPTY,
                ErrorCategory::Validation,
                "errors.material.sourceEmpty",
                correlation_id,
            ));
        }

        let mut packages = Vec::with_capacity(paths.len());
        let mut risks = Vec::new();
        for path in paths {
            let relative_path = normalized_relative(&canonical, &path);
            let (size_bytes, sha256) = hash_file(&path).map_err(|error| {
                source_error(error_codes::SOURCE_UNREADABLE, correlation_id, error)
            })?;
            let mut asset_paths = Vec::new();
            scan_unitypackage(&path, &relative_path, &mut risks, &mut asset_paths).map_err(
                |error| source_error(error_codes::ARCHIVE_INVALID, correlation_id, error),
            )?;
            asset_paths.sort();
            asset_paths.dedup();
            packages.push(SourcePackageEvidenceV01 {
                relative_path,
                size_bytes,
                sha256,
                asset_paths,
            });
        }
        risks.sort();
        risks.dedup();
        let source_fingerprint = digest_json(&packages, correlation_id)?;
        let risk_fingerprint = digest_json(&risks, correlation_id)?;
        Ok(SourceFolderInspectionV01 {
            schema_version: MATERIAL_INTAKE_SCHEMA_VERSION.to_owned(),
            display_name,
            source_fingerprint,
            risk_fingerprint,
            packages,
            executable_risks: risks,
        })
    }

    pub fn plan(
        &self,
        mode: MaterialEntryMode,
        project_id: impl Into<String>,
        project_fingerprint: impl Into<String>,
        source: SourceFolderInspectionV01,
        correlation_id: &str,
    ) -> Result<MaterialIntakePlanV01, AppErrorV1> {
        let mut steps = vec![step(MaterialIntakeStepKind::VerifySource, false)];
        // Package installation always mutates the target. Direct import also
        // needs target protection. The actual snapshot may be reused when the
        // batch risk choice explicitly requests it.
        steps.push(step(MaterialIntakeStepKind::CreateSnapshot, false));
        match mode {
            MaterialEntryMode::DirectUnityPackage => {
                steps.push(step(MaterialIntakeStepKind::ImportUnityPackages, true));
            }
            MaterialEntryMode::LocalReusableVpm => {
                steps.push(step(MaterialIntakeStepKind::ImportUnityPackages, false));
                steps.push(step(MaterialIntakeStepKind::CreateLocalVpmPackage, false));
                steps.push(step(MaterialIntakeStepKind::PreviewVpmInstall, false));
                steps.push(step(MaterialIntakeStepKind::ApplyVpmInstall, true));
            }
        }
        steps.push(step(
            MaterialIntakeStepKind::ValidateMinimumStructure,
            false,
        ));
        steps.push(step(MaterialIntakeStepKind::WriteBuildRecord, false));
        let mut plan = MaterialIntakePlanV01 {
            schema_version: MATERIAL_INTAKE_SCHEMA_VERSION.to_owned(),
            plan_id: String::new(),
            plan_hash: String::new(),
            mode,
            project_id: project_id.into(),
            project_fingerprint: project_fingerprint.into(),
            risk_decision_required: !source.executable_risks.is_empty(),
            source,
            steps,
        };
        let hash = plan_digest(&plan, correlation_id)?;
        plan.plan_id = format!("material-{}", &hash[7..23]);
        plan.plan_hash = hash;
        Ok(plan)
    }

    pub fn confirm(
        &self,
        plan: &MaterialIntakePlanV01,
        expected_plan_hash: &str,
        decision: RiskDecisionV01,
        confirmed_at: impl Into<String>,
        correlation_id: impl Into<String>,
    ) -> Result<MaterialIntakeConfirmationV01, AppErrorV1> {
        let correlation_id = correlation_id.into();
        let actual = plan_digest(plan, &correlation_id)?;
        if plan.plan_hash != actual || expected_plan_hash != actual {
            return Err(simple_error(
                error_codes::PLAN_HASH_MISMATCH,
                ErrorCategory::Conflict,
                "errors.material.planHashMismatch",
                &correlation_id,
            ));
        }
        if decision.source_fingerprint != plan.source.source_fingerprint
            || decision.risk_fingerprint != plan.source.risk_fingerprint
        {
            return Err(simple_error(
                error_codes::RISK_DECISION_STALE,
                ErrorCategory::Conflict,
                "errors.material.riskDecisionStale",
                &correlation_id,
            ));
        }
        if decision.choice == RiskDecisionChoice::Cancel {
            return Err(simple_error(
                error_codes::CANCELLED,
                ErrorCategory::Cancelled,
                "errors.material.cancelled",
                &correlation_id,
            ));
        }
        if plan.risk_decision_required && decision.choice == RiskDecisionChoice::NotRequired {
            return Err(simple_error(
                error_codes::RISK_DECISION_REQUIRED,
                ErrorCategory::Validation,
                "errors.material.riskDecisionRequired",
                &correlation_id,
            ));
        }
        if !plan.risk_decision_required && decision.choice != RiskDecisionChoice::NotRequired {
            return Err(simple_error(
                error_codes::RISK_DECISION_STALE,
                ErrorCategory::Conflict,
                "errors.material.riskDecisionStale",
                &correlation_id,
            ));
        }
        Ok(MaterialIntakeConfirmationV01 {
            plan: plan.clone(),
            risk_decision: decision,
            confirmed_at: confirmed_at.into(),
            correlation_id,
        })
    }

    pub fn verify_source_unchanged(
        &self,
        source_folder: &Path,
        expected: &SourceFolderInspectionV01,
        correlation_id: &str,
    ) -> Result<(), AppErrorV1> {
        let current = self.inspect_folder(source_folder, correlation_id)?;
        if current.source_fingerprint != expected.source_fingerprint
            || current.risk_fingerprint != expected.risk_fingerprint
        {
            return Err(simple_error(
                error_codes::SOURCE_DRIFT,
                ErrorCategory::Conflict,
                "errors.material.sourceDrift",
                correlation_id,
            )
            .with_recoverable(true));
        }
        Ok(())
    }
}

fn step(kind: MaterialIntakeStepKind, mutates_target_project: bool) -> MaterialIntakeStepV01 {
    MaterialIntakeStepV01 {
        kind,
        mutates_target_project,
        safe_boundary_after: true,
    }
}

fn collect_packages(root: &Path, current: &Path, output: &mut Vec<PathBuf>) -> io::Result<()> {
    let mut entries = std::fs::read_dir(current)?.collect::<Result<Vec<_>, _>>()?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let file_type = entry.file_type()?;
        if file_type.is_symlink() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "symlink in source folder",
            ));
        }
        let path = entry.path();
        if file_type.is_dir() {
            collect_packages(root, &path, output)?;
        } else if file_type.is_file()
            && path
                .extension()
                .and_then(|value| value.to_str())
                .is_some_and(|value| value.eq_ignore_ascii_case("unitypackage"))
        {
            path.strip_prefix(root)
                .map_err(|_| io::Error::new(io::ErrorKind::InvalidInput, "file outside source"))?;
            output.push(path);
        }
    }
    Ok(())
}

fn normalized_relative(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .expect("collected paths stay below root")
        .components()
        .filter_map(|component| match component {
            Component::Normal(value) => Some(value.to_string_lossy()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("/")
}

fn hash_file(path: &Path) -> io::Result<(u64, String)> {
    let mut file = File::open(path)?;
    let mut digest = Sha256::new();
    let mut size = 0_u64;
    let mut buffer = [0_u8; 64 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        size += read as u64;
        digest.update(&buffer[..read]);
    }
    Ok((size, sha256_text(digest.finalize().as_ref())))
}

fn scan_unitypackage(
    path: &Path,
    package_path: &str,
    output: &mut Vec<ExecutableRiskEvidence>,
    asset_paths: &mut Vec<String>,
) -> io::Result<()> {
    let file = File::open(path)?;
    let decoder = GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    for entry in archive.entries()? {
        let mut entry = entry?;
        let entry_path = entry.path()?.to_string_lossy().replace('\\', "/");
        if !entry_path.ends_with("/pathname") && entry_path != "pathname" {
            continue;
        }
        if entry.size() > MAX_PATHNAME_BYTES {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                "pathname record too large",
            ));
        }
        let mut logical_path = String::new();
        entry.read_to_string(&mut logical_path)?;
        let logical_path = logical_path.trim().replace('\\', "/");
        validate_asset_path(&logical_path)?;
        classify_risks(package_path, &logical_path, output);
        asset_paths.push(logical_path);
    }
    Ok(())
}

fn validate_asset_path(path: &str) -> io::Result<()> {
    if path.is_empty()
        || path.starts_with('/')
        || path.contains(':')
        || path.split('/').any(|part| part == ".." || part.is_empty())
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "unsafe asset pathname",
        ));
    }
    Ok(())
}

fn classify_risks(package_path: &str, asset_path: &str, output: &mut Vec<ExecutableRiskEvidence>) {
    let lower = asset_path.to_ascii_lowercase();
    let extension = Path::new(&lower)
        .extension()
        .and_then(|value| value.to_str());
    let mut push = |kind| {
        output.push(ExecutableRiskEvidence {
            package_path: package_path.to_owned(),
            asset_path: asset_path.to_owned(),
            kind,
        });
    };
    if extension == Some("cs") {
        push(ExecutableRiskKind::CSharpSource);
    }
    if extension == Some("dll") {
        push(ExecutableRiskKind::ManagedAssembly);
        push(ExecutableRiskKind::NativePlugin);
    } else if matches!(extension, Some("so" | "dylib" | "bundle")) {
        push(ExecutableRiskKind::NativePlugin);
    }
    if lower.split('/').any(|part| part == "editor") {
        push(ExecutableRiskKind::EditorContent);
    }
    if extension == Some("cs")
        && (lower.contains("build")
            || lower.contains("postprocess")
            || lower.contains("preprocess"))
    {
        push(ExecutableRiskKind::BuildEntryPoint);
    }
}

fn plan_digest(plan: &MaterialIntakePlanV01, correlation_id: &str) -> Result<String, AppErrorV1> {
    let mut content = plan.clone();
    content.plan_id.clear();
    content.plan_hash.clear();
    digest_json(&content, correlation_id)
}

fn digest_json(value: &impl Serialize, correlation_id: &str) -> Result<String, AppErrorV1> {
    let bytes = serde_json::to_vec(value).map_err(|_| {
        simple_error(
            error_codes::SOURCE_UNREADABLE,
            ErrorCategory::Internal,
            "errors.material.internal",
            correlation_id,
        )
    })?;
    Ok(sha256_text(Sha256::digest(bytes).as_ref()))
}

fn sha256_text(bytes: &[u8]) -> String {
    let mut output = String::with_capacity(7 + bytes.len() * 2);
    output.push_str("sha256:");
    for byte in bytes {
        use std::fmt::Write as _;
        write!(&mut output, "{byte:02x}").expect("writing to String");
    }
    output
}

fn source_error(code: &str, correlation_id: &str, error: io::Error) -> AppErrorV1 {
    simple_error(
        code,
        ErrorCategory::Validation,
        "errors.material.sourceUnreadable",
        correlation_id,
    )
    .with_param("reason", ParamValue::Text(error.kind().to_string()))
}

fn simple_error(
    code: &str,
    category: ErrorCategory,
    message_key: &str,
    correlation_id: &str,
) -> AppErrorV1 {
    AppErrorV1::new(code, category, message_key, correlation_id.to_owned())
}
