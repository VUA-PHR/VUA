//! VPM backend port (E-VPM-DUAL, ADR-0006): the dual-backend contract
//! consumed by the assembly engine and the material executor. The
//! concrete vrc-get-library and VCC CLI implementations live in
//! vua-project-manager.

use crate::contracts::{AppErrorV1, ErrorCategory, ParamValue};
use crate::ProjectRef;
use serde::{Deserialize, Serialize};
use std::path::Path;

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
    pub const PACKAGE_NOT_INSTALLED: &str = "vua.vpm.package_not_installed";
    pub const PROJECT_LOAD_FAILED: &str = "vua.vpm.project_load_failed";
}

/// Which optional capabilities a backend actually provides (honest gating,
/// ORC-ADP-007): the frontend only renders entry points for true capabilities.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VpmCapabilities {
    pub create_project: bool,
    pub preview_install: bool,
    /// B6: read the installed package set of one project.
    pub list_packages: bool,
    /// B6: digest-bound removal preview + apply on one project.
    pub remove_packages: bool,
    /// B6: enumerate the manager's registered project paths.
    pub project_registry: bool,
    // resolve（ADR-0006 能力表）在后端补上对应方法时才加入此结构——
    // ORC-DEV-004 禁止预留无实现的能力位。
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

/// One installed package of a project, as resolved from its VPM manifest
/// and lock by the backend.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledPackageV1 {
    pub package_id: String,
    pub version: String,
    /// Direct dependencies the installed package declares.
    pub dependencies: Vec<String>,
}

/// One project registered in the manager's project registry (the
/// VCC-compatible database VUA shares with VCC/ALCOM/vrc-get).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisteredProjectV1 {
    pub path: String,
    pub name: String,
}

/// P2 read-family capability declaration (proposal 025 freeze batch,
/// 2026-09-17). Declared as a separate defaulted trait accessor instead of
/// a new `VpmCapabilities` field so the five-bit closed set stays stable
/// and backends that do not implement the catalog faces keep compiling
/// unchanged (ORC-DEV-004: no implementation, no reservation — the default
/// is declared-none; a backend overrides it exactly when it implements
/// `list_repos` / `package_catalog`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogCapabilities {
    /// Covers both P2 read faces (`packages.listRepos` /
    /// `packages.packageCatalog`): the repo subscription list and the
    /// per-package catalog facts share one backend capability.
    pub catalog: bool,
}

impl CatalogCapabilities {
    pub const NONE: Self = Self { catalog: false };
}

/// P2: one repository subscription row (proposal 025 freeze batch). The
/// subscription face is the world (the user's configuration fact), so the
/// row projects the settings userRepos entry verbatim: every
/// identifier/location fact is an Option and `None` is projected as an
/// honest absence — never padded, never guessed. `cached` is the REQUIRED
/// per-repo cache-hit fact: false = subscribed but never refreshed, its own
/// honest state (never hidden, never rendered as an empty catalog).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoInfoV01 {
    pub repo_id: Option<String>,
    pub name: Option<String>,
    pub url: Option<String>,
    pub local_path: Option<String>,
    pub cached: bool,
}

/// P2: the resolved origin of a catalog package (proposal 025 freeze
/// batch). The desktop three-state presentation composes this with the
/// separate `installed` fact of `PackageCatalogV01`; the word face never
/// merges origin and installation into one word.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PackageSourceV01 {
    /// Resolved from a repository cache.
    Repo,
    /// User-local package (no repository).
    Local,
}

/// P2: one repository-cache version row (proposal 025 freeze batch).
/// `yanked` is the repo-cache-carried yank fact; `compatible` is evaluated
/// against the selected project's Unity version and is `None` exactly when
/// that version is unknown (absence is not incompatibility).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogVersionV01 {
    pub version: String,
    pub yanked: bool,
    pub compatible: Option<bool>,
}

/// P2: per-package catalog facts for one package in one registered
/// project's context (proposal 025 freeze batch). `update_available` is
/// the frozen judgment CONCLUSION (a strictly newer compatible version
/// exists vs this project's installed version); `None` = judgment not
/// executed (package not installed here, or project Unity version
/// unknown) — absence is never "no update". `versions` is empty for a
/// local-source package (honest empty, not an error).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageCatalogV01 {
    pub project_path: String,
    pub package_id: String,
    pub display_name: Option<String>,
    pub source: PackageSourceV01,
    pub installed: bool,
    pub update_available: Option<bool>,
    pub versions: Vec<CatalogVersionV01>,
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
    /// Registers a generated local package in this backend's isolated
    /// environment.
    fn register_local_package(&self, _package_root: &Path) -> Result<(), AppErrorV1> {
        Err(unsupported("register_local_package"))
    }
    /// B6: read the installed package set of one project (manifest + lock).
    fn list_packages(&self, _project: &ProjectRef) -> Result<Vec<InstalledPackageV1>, AppErrorV1> {
        Err(unsupported("list_packages"))
    }
    /// B6: read-only removal preview — what disappears, what breaks.
    fn preview_remove(
        &self,
        _project: &ProjectRef,
        _package_ids: &[String],
    ) -> Result<ChangePreviewV1, AppErrorV1> {
        Err(unsupported("preview_remove"))
    }
    /// B6: apply a confirmed removal under the same digest discipline as
    /// installs.
    fn apply_remove(
        &self,
        _project: &ProjectRef,
        _package_ids: &[String],
        _confirmed_digest: &str,
    ) -> Result<serde_json::Value, AppErrorV1> {
        Err(unsupported("preview_remove"))
    }
    /// B6: enumerate the manager's registered project paths.
    fn project_registry(&self) -> Result<Vec<RegisteredProjectV1>, AppErrorV1> {
        Err(unsupported("project_registry"))
    }
    /// P2 (proposal 025 freeze batch): capability declaration for the
    /// catalog read faces. The default is declared-none; a backend
    /// overrides it exactly when it implements `list_repos` and
    /// `package_catalog`.
    fn catalog_capabilities(&self) -> CatalogCapabilities {
        CatalogCapabilities::NONE
    }
    /// P2 (proposal 025 freeze batch): the repository subscription list —
    /// the subscription face is the world (settings userRepos projected
    /// verbatim, array order preserved), each row carrying the REQUIRED
    /// per-repo cache-hit fact. Read-only: enable/disable and add/remove
    /// are write faces under the 013 R5 per-face path, not here.
    fn list_repos(&self) -> Result<Vec<RepoInfoV01>, AppErrorV1> {
        Err(unsupported("list_repos"))
    }
    /// P2 (proposal 025 freeze batch): per-package catalog facts for one
    /// package in one registered project's context. On-demand granularity
    /// only — no full-catalog projection, no pagination. An unknown
    /// package (in neither repository caches nor the local set) answers
    /// `vua.vpm.no_matching_package` (reused code, same fact); the
    /// compatible judgment binds to this project's Unity version.
    fn package_catalog(
        &self,
        _project: &ProjectRef,
        _package_id: &str,
    ) -> Result<PackageCatalogV01, AppErrorV1> {
        Err(unsupported("package_catalog"))
    }
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

