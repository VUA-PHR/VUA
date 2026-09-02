//! VPM dual backend (E-VPM-DUAL, ADR-0006): one port, two implementations --
//! the vrc-get library in-process (community, full capability) and the
//! official VCC CLI (`vpm`, .NET) for project creation and registry.
//!
//! Why the library: the vrc-get CLI has no project-creation command and its
//! install confirmation is an interactive prompt that deadlocks on closed
//! stdin (source-verified 2026-08-31). The library exposes the same logic as
//! structured data: `add_package_request` produces a `PendingProjectChanges`
//! (the preview we put into VUA plans) and `apply_pending_changes` applies
//! the exact confirmed set. The crate explicitly does NOT promise stable
//! APIs, so every call is confined to this one adapter and the version is
//! pinned exactly (`=0.0.16`).

use crate::contracts::{AppErrorV1, ErrorCategory, ParamValue};
use crate::process::{ProcessRunner, ProcessSpec};
use crate::time::Clock;
use crate::{FileSystemProjectStore, ProjectRef};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// Stable vpm backend error codes (ORC-ERR-001).
pub mod error_codes {
    pub const NO_MATCHING_PACKAGE: &str = "vua.vpm.no_matching_package";
    pub const PREVIEW_FAILED: &str = "vua.vpm.preview_failed";
    pub const APPLY_FAILED: &str = "vua.vpm.apply_failed";
    pub const PREVIEW_DRIFT: &str = "vua.vpm.preview_drift";
    pub const CAPABILITY_MISSING: &str = "vua.vpm.capability_missing";
    pub const TEMPLATE_MISSING: &str = "vua.vpm.template_missing";
    pub const BACKEND_UNAVAILABLE: &str = "vua.vpm.backend_unavailable";
    pub const LOCAL_PACKAGE_INVALID: &str = "vua.vpm.local_package_invalid";
    pub const LOCAL_PACKAGE_REGISTER_FAILED: &str = "vua.vpm.local_package_register_failed";
}

/// Which optional capabilities a backend actually provides (honest gating,
/// ORC-ADP-007): the frontend only renders entry points for true capabilities.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VpmCapabilities {
    pub create_project: bool,
    pub preview_install: bool,
    // resolve / project_registry（ADR-0006 能力表）在后端补上对应方法时
    // 才加入此结构——ORC-DEV-004 禁止预留无实现的能力位。
}

/// One entry of an install preview (ORC-WF-002: the plan must cover every
/// change the backend will make -- transitive deps, removals, conflicts).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeItemV1 {
    pub kind: ChangeKindV1,
    pub package_id: String,
    /// Target version for installs; None for removals.
    pub version: Option<String>,
    /// Machine reason, e.g. `transitive_dependency`, `conflict`.
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChangeKindV1 {
    Install,
    Remove,
}

/// The complete, digest-stamped change set of one atomic request batch
/// (ORC-WF-003: the user confirms exactly this content; the apply step
/// re-requests the preview and refuses to run on digest drift).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangePreviewV1 {
    pub items: Vec<ChangeItemV1>,
    pub conflicts: Vec<String>,
    pub remove_legacy_files: Vec<String>,
    pub remove_legacy_folders: Vec<String>,
    /// True when the change set contains conflicts or legacy removals --
    /// the confirm UI must warn (ADR-0006).
    pub destructive: bool,
    /// FNV-1a over the canonical item list; confirmed digest is bound to it.
    pub digest: String,
}

/// One package requested as part of an atomic VPM change calculation.
/// Multiple requests must be previewed together so dependency interactions,
/// upgrades and removals are represented by one confirmation digest.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageRequestV1 {
    pub package_id: String,
    pub version: Option<String>,
}

/// One VPM backend implementation.
pub trait VpmBackend: Send + Sync {
    /// Stable backend name, e.g. `vrc-get-lib`, `vcc-cli`.
    fn name(&self) -> &'static str;
    fn capabilities(&self) -> VpmCapabilities;
    /// Read-only preview of everything an install would change.
    fn preview_install(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
    ) -> Result<ChangePreviewV1, AppErrorV1>;
    /// Plans against the same baseline that project creation will produce.
    /// Most fakes and existing-project backends can use the default directly;
    /// template-aware backends override it for a not-yet-created target.
    fn preview_install_for_plan(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
        _template: Option<&str>,
    ) -> Result<ChangePreviewV1, AppErrorV1> {
        self.preview_install(project, packages)
    }
    /// Applies a previously previewed install. Re-requests the preview and
    /// refuses to run when its digest differs from the confirmed one
    /// (ORC-WF-003/004: same binding discipline as assembly plans).
    fn apply_install(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
        confirmed_digest: &str,
    ) -> Result<serde_json::Value, AppErrorV1>;
    /// Creates a project from a template; backends without the capability
    /// return a `capability_missing` error.
    fn create_project(
        &self,
        parent: &Path,
        name: &str,
        template: Option<&str>,
    ) -> Result<ProjectRef, AppErrorV1>;
}

fn unsupported(capability: &str) -> AppErrorV1 {
    AppErrorV1::new(
        error_codes::CAPABILITY_MISSING,
        ErrorCategory::Unavailable,
        "errors.vpm.capabilityMissing",
        "corr-vpm-backend",
    )
    .with_param("capability", ParamValue::Text(capability.to_owned()))
}

// --- backend 1: vrc-get library (in-process) ---

/// The vrc-get library backend. Owns a dedicated tokio runtime (the library
/// is async; our engine is sync -- blocking calls happen on our worker
/// threads, never inside an async context).
pub struct VrcGetLibBackend {
    runtime: tokio::runtime::Runtime,
    http: reqwest::Client,
    environment_root: PathBuf,
    /// When true, repository listings are read from the local cache only
    /// (no network refresh) -- offline degradation path (ORC-ADP-006).
    offline: bool,
}

impl VrcGetLibBackend {
    /// VCC-compatible environment root by default (ALCOM/vrc-get/VCC all
    /// read the same settings location).
    pub fn new(offline: bool) -> Result<Self, AppErrorV1> {
        let runtime = tokio::runtime::Runtime::new().map_err(|error| {
            AppErrorV1::new(
                error_codes::BACKEND_UNAVAILABLE,
                ErrorCategory::Unavailable,
                "errors.vpm.backendUnavailable",
                "corr-vpm-lib-init",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))
        })?;
        Ok(Self {
            runtime,
            http: reqwest::Client::new(),
            environment_root: default_environment_root(),
            offline,
        })
    }

    pub fn with_environment_root(
        environment_root: PathBuf,
        offline: bool,
    ) -> Result<Self, AppErrorV1> {
        let backend = Self::new(offline)?;
        Ok(Self {
            environment_root,
            ..backend
        })
    }

    /// Registers one generated local package in this backend's environment.
    ///
    /// Spike/B3 callers provide a dedicated environment root so this never
    /// mutates the user's VCC or ALCOM settings. Registration is deliberately
    /// separate from preview/apply: the normal digest-bound install path still
    /// owns every project mutation.
    pub fn register_local_package(&self, package_root: &Path) -> Result<(), AppErrorV1> {
        let package_root = std::fs::canonicalize(package_root).map_err(|error| {
            AppErrorV1::new(
                error_codes::LOCAL_PACKAGE_INVALID,
                ErrorCategory::Validation,
                "errors.vpm.localPackageInvalid",
                "corr-vpm-local-package",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))
        })?;
        if !package_root.join("package.json").is_file() {
            return Err(AppErrorV1::new(
                error_codes::LOCAL_PACKAGE_INVALID,
                ErrorCategory::Validation,
                "errors.vpm.localPackageInvalid",
                "corr-vpm-local-package",
            )
            .with_param(
                "reason",
                ParamValue::Text("package.json is missing".to_owned()),
            ));
        }

        let environment_root = self.environment_root.clone();
        self.runtime.block_on(async move {
            let io = vrc_get_vpm::io::DefaultEnvironmentIo::new(environment_root.into_boxed_path());
            let mut settings = vrc_get_vpm::environment::Settings::load(&io)
                .await
                .map_err(map_local_package_io("loading isolated VPM settings"))?;
            match settings.add_user_package(&package_root, &io).await {
                vrc_get_vpm::environment::AddUserPackageResult::Success
                | vrc_get_vpm::environment::AddUserPackageResult::AlreadyAdded => {}
                vrc_get_vpm::environment::AddUserPackageResult::NonAbsolute => {
                    return Err(local_package_invalid("package path is not absolute"));
                }
                vrc_get_vpm::environment::AddUserPackageResult::BadPackage => {
                    return Err(local_package_invalid(
                        "package.json is not a valid local VPM package",
                    ));
                }
            }
            settings
                .save(&io)
                .await
                .map_err(map_local_package_io("saving isolated VPM settings"))?;
            Ok(())
        })
    }

    fn digest_of(
        items: &[ChangeItemV1],
        conflicts: &[String],
        legacy_files: &[String],
        legacy_folders: &[String],
    ) -> String {
        let canonical = json!({
            "items": items,
            "conflicts": conflicts,
            "legacyFiles": legacy_files,
            "legacyFolders": legacy_folders,
        });
        crate::vpm::fnv1a_hex(canonical.to_string().as_bytes())
    }
}

fn local_package_invalid(reason: &str) -> AppErrorV1 {
    AppErrorV1::new(
        error_codes::LOCAL_PACKAGE_INVALID,
        ErrorCategory::Validation,
        "errors.vpm.localPackageInvalid",
        "corr-vpm-local-package",
    )
    .with_param("reason", ParamValue::Text(reason.to_owned()))
}

fn map_local_package_io(context: &'static str) -> impl Fn(std::io::Error) -> AppErrorV1 {
    move |error| {
        AppErrorV1::new(
            error_codes::LOCAL_PACKAGE_REGISTER_FAILED,
            ErrorCategory::ExternalFailure,
            "errors.vpm.localPackageRegisterFailed",
            "corr-vpm-local-package",
        )
        .with_param("reason", ParamValue::Text(format!("{context}: {error}")))
    }
}

fn default_environment_root() -> PathBuf {
    // Mirrors DefaultEnvironmentIo::new_default: the VRChat CreatorCompanion
    // directory is the shared, VCC-compatible configuration home.
    let local = std::env::var("LOCALAPPDATA")
        .or_else(|_| {
            std::env::var("USERPROFILE")
                .or_else(|_| std::env::var("HOME"))
                .map(|profile| format!("{profile}\\AppData\\Local"))
        })
        .unwrap_or_default();
    PathBuf::from(local).join("VRChatCreatorCompanion")
}

impl VpmBackend for VrcGetLibBackend {
    fn name(&self) -> &'static str {
        "vrc-get-lib"
    }

    fn capabilities(&self) -> VpmCapabilities {
        VpmCapabilities {
            create_project: true,
            preview_install: true,
        }
    }

    fn preview_install(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
    ) -> Result<ChangePreviewV1, AppErrorV1> {
        let environment_root = self.environment_root.clone();
        let offline = self.offline;
        let project_root = project.root.clone();
        let packages = packages.to_vec();
        let http = self.http.clone();

        self.runtime.block_on(async move {
            let io = vrc_get_vpm::io::DefaultEnvironmentIo::new(
                environment_root.clone().into_boxed_path(),
            );
            let settings = vrc_get_vpm::environment::Settings::load(&io)
                .await
                .map_err(map_io("loading VPM settings"))?;
            // 在线刷新仓库清单失败时降级到缓存（ORC-ADP-006）。
            let collection = if offline {
                vrc_get_vpm::environment::PackageCollection::load_cache(&settings, &io)
                    .await
                    .map_err(map_io("loading package cache"))?
            } else {
                match vrc_get_vpm::environment::PackageCollection::load(&settings, &io, Some(&http))
                    .await
                {
                    Ok(collection) => collection,
                    Err(_) => {
                        vrc_get_vpm::environment::PackageCollection::load_cache(&settings, &io)
                            .await
                            .map_err(map_io("loading package cache"))?
                    }
                }
            };
            let project_io =
                vrc_get_vpm::io::DefaultProjectIo::new(project_root.clone().into_boxed_path());
            let unity_project = vrc_get_vpm::UnityProject::load(project_io)
                .await
                .map_err(map_io("loading project"))?;

            use vrc_get_vpm::PackageCollection as _;
            let parsed_versions: Vec<Option<vrc_get_vpm::version::Version>> = packages
                .iter()
                .map(|request| {
                    request
                        .version
                        .as_ref()
                        .map(|version| version.parse())
                        .transpose()
                        .map_err(|_| {
                            AppErrorV1::new(
                                error_codes::NO_MATCHING_PACKAGE,
                                ErrorCategory::Validation,
                                "errors.vpm.versionInvalid",
                                "corr-vpm-preview",
                            )
                            .with_param(
                                "version",
                                ParamValue::Text(request.version.clone().unwrap_or_default()),
                            )
                        })
                })
                .collect::<Result<_, _>>()?;
            let mut selected = Vec::with_capacity(packages.len());
            for (request, parsed_version) in packages.iter().zip(parsed_versions.iter()) {
                let selector = match parsed_version.as_ref() {
                    Some(parsed) => vrc_get_vpm::VersionSelector::specific_version(parsed),
                    None => vrc_get_vpm::VersionSelector::latest_for(None, false),
                };
                let package = collection
                    .find_package_by_name(&request.package_id, selector)
                    .ok_or_else(|| {
                        AppErrorV1::new(
                            error_codes::NO_MATCHING_PACKAGE,
                            ErrorCategory::Dependency,
                            "errors.vpm.noMatchingPackage",
                            "corr-vpm-preview",
                        )
                        .with_param("package", ParamValue::Text(request.package_id.clone()))
                    })?;
                selected.push(package);
            }

            let changes = unity_project
                .add_package_request(
                    &collection,
                    &selected,
                    vrc_get_vpm::unity_project::AddPackageOperation::InstallToDependencies,
                    false,
                )
                .await
                .map_err(|error| {
                    AppErrorV1::new(
                        error_codes::PREVIEW_FAILED,
                        ErrorCategory::ExternalFailure,
                        "errors.vpm.previewFailed",
                        "corr-vpm-preview",
                    )
                    .with_param("reason", ParamValue::Text(error.to_string()))
                })?;

            let mut items: Vec<ChangeItemV1> = Vec::new();
            for (name, change) in changes.package_changes() {
                match change {
                    vrc_get_vpm::unity_project::pending_project_changes::PackageChange::Install(
                        install,
                    ) => {
                        let version = install
                            .install_package()
                            .map(|package| package.version().to_string());
                        items.push(ChangeItemV1 {
                            kind: ChangeKindV1::Install,
                            package_id: name.to_string(),
                            version,
                            reason: None,
                        });
                    }
                    vrc_get_vpm::unity_project::pending_project_changes::PackageChange::Remove(
                        remove,
                    ) => {
                        items.push(ChangeItemV1 {
                            kind: ChangeKindV1::Remove,
                            package_id: name.to_string(),
                            version: None,
                            reason: Some(format!("{:?}", remove.reason())),
                        });
                    }
                }
            }
            items.sort_by(|left, right| left.package_id.cmp(&right.package_id));
            let mut conflicts: Vec<String> = changes
                .conflicts()
                .keys()
                .map(|key| key.to_string())
                .collect();
            conflicts.sort();
            let mut remove_legacy_files: Vec<String> = changes
                .remove_legacy_files()
                .iter()
                .map(|(path, _)| path.to_string_lossy().into_owned())
                .collect();
            remove_legacy_files.sort();
            let mut remove_legacy_folders: Vec<String> = changes
                .remove_legacy_folders()
                .iter()
                .map(|(path, _)| path.to_string_lossy().into_owned())
                .collect();
            remove_legacy_folders.sort();
            let destructive = !conflicts.is_empty()
                || !remove_legacy_files.is_empty()
                || !remove_legacy_folders.is_empty();

            let digest = VrcGetLibBackend::digest_of(
                &items,
                &conflicts,
                &remove_legacy_files,
                &remove_legacy_folders,
            );
            Ok(ChangePreviewV1 {
                items,
                conflicts,
                remove_legacy_files,
                remove_legacy_folders,
                destructive,
                digest,
            })
        })
    }

    fn preview_install_for_plan(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
        template: Option<&str>,
    ) -> Result<ChangePreviewV1, AppErrorV1> {
        if project
            .root
            .join("ProjectSettings/ProjectVersion.txt")
            .is_file()
        {
            return self.preview_install(project, packages);
        }

        // A fresh-project plan must include the dependencies already present
        // in the selected VCC/ALCOM template. Preview in an isolated copy of
        // that exact template; never calculate against an empty directory.
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|value| value.as_nanos())
            .unwrap_or(0);
        let parent =
            std::env::temp_dir().join(format!("vua-vpm-preview-{}-{nonce}", std::process::id()));
        std::fs::create_dir_all(&parent).map_err(|error| {
            AppErrorV1::new(
                error_codes::PREVIEW_FAILED,
                ErrorCategory::ExternalFailure,
                "errors.vpm.previewFailed",
                "corr-vpm-preview",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))
        })?;
        let staged = match create_from_template(
            &self.environment_root,
            &parent,
            "preview-project",
            template,
        ) {
            Ok(project) => project,
            Err(error) => {
                let _ = std::fs::remove_dir_all(&parent);
                return Err(error);
            }
        };
        let result = self.preview_install(&staged, packages);
        let cleanup = std::fs::remove_dir_all(&parent);
        match (result, cleanup) {
            (Ok(preview), Ok(())) => Ok(preview),
            (Err(error), _) => Err(error),
            (Ok(_), Err(error)) => Err(AppErrorV1::new(
                error_codes::PREVIEW_FAILED,
                ErrorCategory::ExternalFailure,
                "errors.vpm.previewFailed",
                "corr-vpm-preview",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))),
        }
    }

    fn apply_install(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
        confirmed_digest: &str,
    ) -> Result<serde_json::Value, AppErrorV1> {
        // 重算预览并比对摘要（ORC-WF-003/004）：预览之后项目或仓库变了，
        // 拒绝应用而不是盲目执行旧确认。
        let preview = self.preview_install(project, packages)?;
        if preview.digest != confirmed_digest {
            return Err(AppErrorV1::new(
                error_codes::PREVIEW_DRIFT,
                ErrorCategory::Conflict,
                "errors.vpm.previewDrift",
                "corr-vpm-apply",
            )
            .with_recoverable(true));
        }
        let environment_root = self.environment_root.clone();
        let project_root = project.root.clone();
        let packages = packages.to_vec();
        let http = self.http.clone();

        self.runtime.block_on(async move {
            let io = vrc_get_vpm::io::DefaultEnvironmentIo::new(
                environment_root.clone().into_boxed_path(),
            );
            let settings = vrc_get_vpm::environment::Settings::load(&io)
                .await
                .map_err(map_io("loading VPM settings"))?;
            let collection = if self.offline {
                vrc_get_vpm::environment::PackageCollection::load_cache(&settings, &io)
                    .await
                    .map_err(map_io("loading package cache"))?
            } else {
                vrc_get_vpm::environment::PackageCollection::load(&settings, &io, Some(&http))
                    .await
                    .map_err(map_io("loading package collection"))?
            };
            let project_io =
                vrc_get_vpm::io::DefaultProjectIo::new(project_root.clone().into_boxed_path());
            // apply 会更新锁定状态（apply_pending_changes 需要可变借用）
            let mut unity_project = vrc_get_vpm::UnityProject::load(project_io)
                .await
                .map_err(map_io("loading project"))?;

            use vrc_get_vpm::PackageCollection as _;
            let parsed_versions: Vec<Option<vrc_get_vpm::version::Version>> = packages
                .iter()
                .map(|request| {
                    request
                        .version
                        .as_ref()
                        .map(|version| version.parse())
                        .transpose()
                        .map_err(|_| {
                            AppErrorV1::new(
                                error_codes::NO_MATCHING_PACKAGE,
                                ErrorCategory::Validation,
                                "errors.vpm.versionInvalid",
                                "corr-vpm-apply",
                            )
                            .with_param(
                                "version",
                                ParamValue::Text(request.version.clone().unwrap_or_default()),
                            )
                        })
                })
                .collect::<Result<_, _>>()?;
            let mut selected = Vec::with_capacity(packages.len());
            for (request, parsed_version) in packages.iter().zip(parsed_versions.iter()) {
                let selector = match parsed_version.as_ref() {
                    Some(parsed) => vrc_get_vpm::VersionSelector::specific_version(parsed),
                    None => vrc_get_vpm::VersionSelector::latest_for(None, false),
                };
                let package = collection
                    .find_package_by_name(&request.package_id, selector)
                    .ok_or_else(|| {
                        AppErrorV1::new(
                            error_codes::NO_MATCHING_PACKAGE,
                            ErrorCategory::Dependency,
                            "errors.vpm.noMatchingPackage",
                            "corr-vpm-apply",
                        )
                        .with_param("package", ParamValue::Text(request.package_id.clone()))
                    })?;
                selected.push(package);
            }
            let changes = unity_project
                .add_package_request(
                    &collection,
                    &selected,
                    vrc_get_vpm::unity_project::AddPackageOperation::InstallToDependencies,
                    false,
                )
                .await
                .map_err(|error| {
                    AppErrorV1::new(
                        error_codes::APPLY_FAILED,
                        ErrorCategory::ExternalFailure,
                        "errors.vpm.applyFailed",
                        "corr-vpm-apply",
                    )
                    .with_param("reason", ParamValue::Text(error.to_string()))
                })?;
            // 第二道摘要核对（Fix R2-7：legacy folders 也计入摘要）：以
            // 重算的 changes 为准，第一道是调用方传入的确认摘要，双保险
            // 防任何窗口期的竞态变更。
            let (items, conflicts, legacy_files, legacy_folders) = summarize_changes(&changes);
            let digest =
                VrcGetLibBackend::digest_of(&items, &conflicts, &legacy_files, &legacy_folders);
            if digest != confirmed_digest {
                return Err(AppErrorV1::new(
                    error_codes::PREVIEW_DRIFT,
                    ErrorCategory::Conflict,
                    "errors.vpm.previewDrift",
                    "corr-vpm-apply",
                )
                .with_recoverable(true));
            }

            let installer = vrc_get_vpm::environment::PackageInstaller::new(&io, Some(&http));
            unity_project
                .apply_pending_changes(&installer, changes)
                .await
                .map_err(|error| {
                    AppErrorV1::new(
                        error_codes::APPLY_FAILED,
                        ErrorCategory::ExternalFailure,
                        "errors.vpm.applyFailed",
                        "corr-vpm-apply",
                    )
                    .with_param("reason", ParamValue::Text(error.to_string()))
                })?;

            Ok(json!({
                "applied": items,
            }))
        })
    }

    fn create_project(
        &self,
        parent: &Path,
        name: &str,
        template: Option<&str>,
    ) -> Result<ProjectRef, AppErrorV1> {
        let environment_root = self.environment_root.clone();
        let template = template.map(str::to_owned);
        create_from_template(&environment_root, parent, name, template.as_deref())
    }
}

// --- backend 2: official VCC CLI (`vpm`) ---

/// The official VCC CLI backend (`.NET` global tool `vrchat.vpm.cli`).
/// Strengths: template-based project creation and the project registry.
/// It has no change preview, so it must not be used for plan-confirmed
/// destructive installs (ADR-0006).
pub struct VccCliBackend {
    runner: Arc<dyn ProcessRunner>,
    clock: Arc<dyn Clock>,
    executable: String,
}

impl VccCliBackend {
    pub fn new(
        runner: Arc<dyn ProcessRunner>,
        clock: Arc<dyn Clock>,
        executable: impl Into<String>,
    ) -> Self {
        Self {
            runner,
            clock,
            executable: executable.into(),
        }
    }

    fn spec(&self, args: Vec<String>) -> ProcessSpec {
        ProcessSpec {
            executable: PathBuf::from(&self.executable),
            args,
            working_dir: None,
            timeout: std::time::Duration::from_secs(1200),
            output_limit: 256 * 1024,
            // R2-2: 凭据剥离基线；代理变量保留（vpm 下载可能需要）。
            removals: crate::process::CREDENTIAL_ENV_REMOVALS
                .iter()
                .map(|key| key.to_string())
                .collect(),
            ..Default::default()
        }
    }
}

impl VpmBackend for VccCliBackend {
    fn name(&self) -> &'static str {
        "vcc-cli"
    }

    fn capabilities(&self) -> VpmCapabilities {
        VpmCapabilities {
            create_project: true,
            preview_install: false,
        }
    }

    fn preview_install(
        &self,
        _project: &ProjectRef,
        _packages: &[PackageRequestV1],
    ) -> Result<ChangePreviewV1, AppErrorV1> {
        Err(unsupported("preview_install"))
    }

    fn apply_install(
        &self,
        project: &ProjectRef,
        packages: &[PackageRequestV1],
        _confirmed_digest: &str,
    ) -> Result<serde_json::Value, AppErrorV1> {
        // 无预览能力的后端不承担计划确认过的安装（ADR-0006）。
        let _ = (project, packages);
        Err(unsupported("preview_install"))
    }

    fn create_project(
        &self,
        parent: &Path,
        name: &str,
        template: Option<&str>,
    ) -> Result<ProjectRef, AppErrorV1> {
        validate_vpm_project_name(name)?;
        // vpm new <projectName> [template] -p <path>（官方文档 vpm/cli.md）
        let mut args = vec!["new".to_owned(), name.to_owned()];
        if let Some(template) = template {
            args.push(template.to_owned());
        }
        args.push("-p".to_owned());
        args.push(parent.to_string_lossy().into_owned());
        let outcome = self.runner.run(&self.spec(args)).map_err(|error| {
            AppErrorV1::new(
                error_codes::BACKEND_UNAVAILABLE,
                ErrorCategory::Unavailable,
                "errors.vpm.backendUnavailable",
                "corr-vcc-cli",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))
        })?;
        if outcome.timed_out || !outcome.success() {
            return Err(AppErrorV1::new(
                error_codes::APPLY_FAILED,
                ErrorCategory::ExternalFailure,
                "errors.vpm.applyFailed",
                "corr-vcc-cli",
            )
            .with_param(
                "exitCode",
                ParamValue::Number(outcome.exit_code.unwrap_or(-1) as f64),
            ));
        }
        let target = parent.join(name);
        let project = ProjectRef {
            id: format!("vcc-{}", name),
            root: target,
        };
        FileSystemProjectStore::initialize(&project).map_err(|error| {
            AppErrorV1::new(
                error_codes::APPLY_FAILED,
                ErrorCategory::ExternalFailure,
                "errors.vpm.applyFailed",
                "corr-vcc-cli",
            )
            .with_param("reason", ParamValue::Text(error.to_string()))
        })?;
        let _ = self.clock.now_rfc3339();
        Ok(project)
    }
}

// --- shared: template-based project creation (ADR-0006 §4) ---

/// Creates a project by copying a template directory (the documented VCC
/// behavior: create dir -> copy template -> set productName -> validate).
/// Template resolution order: explicit path -> VCC installed templates
/// (`VRCTemplates`) -> user templates (`Templates`).
pub fn create_from_template(
    environment_root: &Path,
    parent: &Path,
    name: &str,
    template: Option<&str>,
) -> Result<ProjectRef, AppErrorV1> {
    validate_vpm_project_name(name)?;
    let target = parent.join(name);
    if target.exists() {
        return Err(AppErrorV1::new(
            error_codes::TEMPLATE_MISSING,
            ErrorCategory::Validation,
            "errors.vpm.projectExists",
            "corr-vpm-create",
        )
        .with_param("name", ParamValue::Text(name.to_owned())));
    }

    let template_name = template.unwrap_or("Avatar");
    let candidates = [
        environment_root.join("VRCTemplates").join(template_name),
        environment_root.join("Templates").join(template_name),
        PathBuf::from(template_name),
    ];
    let template_dir = candidates
        .iter()
        .find(|candidate| candidate.is_dir())
        .ok_or_else(|| {
            AppErrorV1::new(
                error_codes::TEMPLATE_MISSING,
                ErrorCategory::Dependency,
                "errors.vpm.templateMissing",
                "corr-vpm-create",
            )
            .with_param("template", ParamValue::Text(template_name.to_owned()))
        })?;

    copy_tree(template_dir, &target).map_err(|error| {
        AppErrorV1::new(
            error_codes::TEMPLATE_MISSING,
            ErrorCategory::ExternalFailure,
            "errors.vpm.templateCopyFailed",
            "corr-vpm-create",
        )
        .with_param("reason", ParamValue::Text(error.to_string()))
    })?;

    // productName 更新（ProjectSettings.asset 是带缩进的 YAML 文本）。
    // JSON 字符串也是合法 YAML 标量，借此保留 Unicode 并避免 `#` 等
    // 字符把项目名解释成注释或结构语法。
    let settings_path = target.join("ProjectSettings").join("ProjectSettings.asset");
    if let Ok(content) = std::fs::read_to_string(&settings_path) {
        let mut updated = String::with_capacity(content.len());
        let mut replaced = false;
        for line in content.lines() {
            let trimmed = line.trim_start();
            if trimmed.starts_with("productName:") {
                let indentation = &line[..line.len() - trimmed.len()];
                let escaped_name = serde_json::to_string(name).map_err(|error| {
                    AppErrorV1::new(
                        error_codes::TEMPLATE_MISSING,
                        ErrorCategory::Internal,
                        "errors.vpm.templateCopyFailed",
                        "corr-vpm-create",
                    )
                    .with_param("reason", ParamValue::Text(error.to_string()))
                })?;
                updated.push_str(indentation);
                updated.push_str("productName: ");
                updated.push_str(&escaped_name);
                replaced = true;
            } else {
                updated.push_str(line);
            }
            updated.push('\n');
        }
        if replaced {
            std::fs::write(&settings_path, updated).map_err(|error| {
                AppErrorV1::new(
                    error_codes::TEMPLATE_MISSING,
                    ErrorCategory::ExternalFailure,
                    "errors.vpm.templateCopyFailed",
                    "corr-vpm-create",
                )
                .with_param("reason", ParamValue::Text(error.to_string()))
            })?;
        }
    }

    if !target.join("ProjectSettings/ProjectVersion.txt").is_file() {
        return Err(AppErrorV1::new(
            error_codes::TEMPLATE_MISSING,
            ErrorCategory::ExternalFailure,
            "errors.vpm.templateCopyFailed",
            "corr-vpm-create",
        )
        .with_param(
            "reason",
            ParamValue::Text("template is not a Unity project".to_owned()),
        ));
    }

    let project = ProjectRef {
        id: format!("proj-{name}"),
        root: target,
    };
    FileSystemProjectStore::initialize(&project).map_err(|error| {
        AppErrorV1::new(
            error_codes::TEMPLATE_MISSING,
            ErrorCategory::ExternalFailure,
            "errors.vpm.templateCopyFailed",
            "corr-vpm-create",
        )
        .with_param("reason", ParamValue::Text(error.to_string()))
    })?;
    Ok(project)
}

fn validate_vpm_project_name(name: &str) -> Result<(), AppErrorV1> {
    if name.trim().is_empty()
        || name != name.trim()
        || name == "."
        || name == ".."
        || name.starts_with('-')
        || name.chars().any(|character| {
            matches!(
                character,
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|'
            )
        })
    {
        return Err(AppErrorV1::new(
            error_codes::TEMPLATE_MISSING,
            ErrorCategory::Validation,
            "errors.vpm.projectNameInvalid",
            "corr-vpm-create",
        )
        .with_param("name", ParamValue::Text(name.to_owned())));
    }
    Ok(())
}

fn copy_tree(source: &Path, target: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(target)?;
    for entry in std::fs::read_dir(source)? {
        let entry = entry?;
        let destination = target.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_tree(&entry.path(), &destination)?;
        } else if entry.file_type()?.is_file() {
            std::fs::copy(entry.path(), destination)?;
        }
    }
    Ok(())
}

/// 把库的 PendingProjectChanges 折算成 (items, conflicts, legacyFiles,
/// legacyFolders) 四元组，全部排序保证摘要稳定。
fn summarize_changes(
    changes: &vrc_get_vpm::unity_project::PendingProjectChanges<'_>,
) -> (Vec<ChangeItemV1>, Vec<String>, Vec<String>, Vec<String>) {
    let mut items: Vec<ChangeItemV1> = Vec::new();
    for (name, change) in changes.package_changes() {
        match change {
            vrc_get_vpm::unity_project::pending_project_changes::PackageChange::Install(
                install,
            ) => {
                items.push(ChangeItemV1 {
                    kind: ChangeKindV1::Install,
                    package_id: name.to_string(),
                    version: install
                        .install_package()
                        .map(|package| package.version().to_string()),
                    reason: None,
                });
            }
            vrc_get_vpm::unity_project::pending_project_changes::PackageChange::Remove(remove) => {
                items.push(ChangeItemV1 {
                    kind: ChangeKindV1::Remove,
                    package_id: name.to_string(),
                    version: None,
                    reason: Some(format!("{:?}", remove.reason())),
                });
            }
        }
    }
    items.sort_by(|left, right| left.package_id.cmp(&right.package_id));
    let mut conflicts: Vec<String> = changes
        .conflicts()
        .keys()
        .map(|key| key.to_string())
        .collect();
    conflicts.sort();
    let mut legacy_files: Vec<String> = changes
        .remove_legacy_files()
        .iter()
        .map(|(path, _)| path.to_string_lossy().into_owned())
        .collect();
    legacy_files.sort();
    let mut legacy_folders: Vec<String> = changes
        .remove_legacy_folders()
        .iter()
        .map(|(path, _)| path.to_string_lossy().into_owned())
        .collect();
    legacy_folders.sort();
    (items, conflicts, legacy_files, legacy_folders)
}

fn map_io(context: &'static str) -> impl Fn(std::io::Error) -> AppErrorV1 {
    move |error: std::io::Error| {
        AppErrorV1::new(
            error_codes::PREVIEW_FAILED,
            ErrorCategory::ExternalFailure,
            "errors.vpm.previewFailed",
            "corr-vpm-lib",
        )
        .with_param("reason", ParamValue::Text(format!("{context}: {error}")))
    }
}

/// Registry of the two backends for capability aggregation.
pub fn backends_summary(backends: &[&dyn VpmBackend]) -> BTreeMap<String, VpmCapabilities> {
    backends
        .iter()
        .map(|backend| (backend.name().to_owned(), backend.capabilities()))
        .collect()
}
