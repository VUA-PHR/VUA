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
    /// A4 repository add/remove face (proposal 026 freeze batch): the add
    /// guard refused the row (duplicate url/name, official/curated guard,
    /// malformed shape).
    pub const REPO_INVALID: &str = "vua.vpm.repo_invalid";
    /// A4: remove_repo named a repoId absent from the subscription list.
    pub const REPO_NOT_FOUND: &str = "vua.vpm.repo_not_found";
    /// A4: the remote-repository manifest fetch failed (the add-remote
    /// network segment; the local-add and remove faces never answer this).
    pub const REPO_FETCH_FAILED: &str = "vua.vpm.repo_fetch_failed";
    /// A4: the isolated-environment settings write-back failed (save /
    /// atomic replace / backup maintenance).
    pub const REPO_WRITE_FAILED: &str = "vua.vpm.repo_write_failed";
}

/// Which optional capabilities a backend actually provides (honest gating,
/// ORC-ADP-007): the frontend only renders entry points for true capabilities.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VpmCapabilities {
    /// A5 (proposal 026 freeze batch): this EXISTING five-bit-closed-set
    /// member is the creation gate — no new accessor is frozen for A5 (the
    /// bit predates the batch and both in-repo backends already declare it
    /// honestly: the library backend true, the CLI backend true). The wire
    /// gate reads it before submit; a false bit answers the generic
    /// capability_missing and never reaches a task.
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

/// A3 write-face capability declaration (proposal 026 freeze batch,
/// 2026-09-19). Same shape law as `CatalogCapabilities` (the 025
/// precedent): a separate defaulted trait accessor instead of a new
/// `VpmCapabilities` field, so the five-bit closed set stays stable and
/// backends without the local-package registration face keep compiling
/// unchanged (ORC-DEV-004: no implementation, no reservation — the
/// default is declared-none; a backend overrides it exactly when it
/// implements `register_local_package`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterCapabilities {
    /// Covers the A3 write face (`packages.registerLocalPackage`):
    /// registering a generated local package in the backend's isolated
    /// environment.
    pub register_local_package: bool,
}

impl RegisterCapabilities {
    pub const NONE: Self = Self { register_local_package: false };
}

/// A4 write-face capability declaration (proposal 026 freeze batch,
/// 2026-09-19). Same shape law as `CatalogCapabilities` / `RegisterCapabilities`
/// (the 025 accessor precedent): a separate defaulted trait accessor instead
/// of a new `VpmCapabilities` field, so the five-bit closed set stays stable
/// and backends without the repo add/remove face keep compiling unchanged
/// (ORC-DEV-004: no implementation, no reservation — the default is
/// declared-none; a backend overrides it exactly when it implements the
/// `add_remote_repo` / `add_local_repo` / `remove_repo` methods). Three
/// INDEPENDENT bits on purpose: a backend may serve a subset of the face
/// (e.g. local-add only), and the honest gate is per method, never per face.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoWriteCapabilities {
    /// Covers `packages.addRemoteRepo`: subscribing a remote repository
    /// (the manifest-fetch network segment included).
    pub add_remote_repo: bool,
    /// Covers `packages.addLocalRepo`: subscribing a local directory
    /// repository.
    pub add_local_repo: bool,
    /// Covers `packages.removeRepo`: removing one subscription row by id.
    pub remove_repo: bool,
}

impl RepoWriteCapabilities {
    pub const NONE: Self = Self {
        add_remote_repo: false,
        add_local_repo: false,
        remove_repo: false,
    };
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

/// P2 v0.2 increment (proposal 025 inline ruling, 2026-09-17): the catalog
/// facts of `PackageCatalogV01` plus the REQUIRED informational
/// `cache_sourced` disclosure fact. true = THIS result was served through
/// the cache-degradation path (offline → load_cache, or an online load
/// failed and degraded — the ORC-ADP-006 isomorphic precedent); false =
/// served from an online-refreshed load. Cache sourcing is not an error:
/// consumers render it as an informational "cached data" annotation, never
/// a failure. The `packages-repos` family has NO such field: `list_repos`
/// is a zero-network face, where the fact would be a permanent constant —
/// a constant informational field is not a fact and gets no wire key.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageCatalogV02 {
    pub project_path: String,
    pub package_id: String,
    pub display_name: Option<String>,
    pub source: PackageSourceV01,
    pub installed: bool,
    pub update_available: Option<bool>,
    pub versions: Vec<CatalogVersionV01>,
    pub cache_sourced: bool,
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
    /// A3 (proposal 026 freeze batch): capability declaration for the
    /// local-package registration write face. The default is
    /// declared-none; a backend overrides it exactly when it implements
    /// `register_local_package` (the 025 accessor law — the VrcGetLib
    /// override lands with the environment implementation-verification
    /// slice, the same honest-absence discipline: the served wire row
    /// stays unavailable until the override flips it).
    fn register_capabilities(&self) -> RegisterCapabilities {
        RegisterCapabilities::NONE
    }
    /// A4 (proposal 026 freeze batch): capability declaration for the
    /// repository add/remove write face. The default is declared-none; a
    /// backend overrides it exactly when it implements the three repo
    /// write methods (the 025 accessor law — the VrcGetLib override lands
    /// with the environment implementation-verification slice, the same
    /// honest-absence discipline: the served wire row stays unavailable
    /// until the override flips it).
    fn repo_write_capabilities(&self) -> RepoWriteCapabilities {
        RepoWriteCapabilities::NONE
    }
    /// A4 (proposal 026 freeze batch): subscribe one REMOTE repository in
    /// this backend's isolated environment. The backend fetches the remote
    /// manifest (the network segment is inherent to the face — a preview
    /// cannot verify reachability without doing the same network work, so
    /// the face has NO preview arm), then adds the subscription row. The
    /// user-supplied `name` is required (the subscription list presents it;
    /// the read face `RepoInfoV01.name` Option projects EXISTING rows
    /// verbatim, it does not imply new rows may go nameless). Guard
    /// refusals (duplicate url/name, official/curated guard, malformed
    /// shape) answer `vua.vpm.repo_invalid`; fetch failures answer
    /// `vua.vpm.repo_fetch_failed`; settings write-back failures answer
    /// `vua.vpm.repo_write_failed`.
    fn add_remote_repo(&self, _url: &str, _name: &str) -> Result<(), AppErrorV1> {
        Err(unsupported("add_remote_repo"))
    }
    /// A4 (proposal 026 freeze batch): subscribe one LOCAL directory
    /// repository in this backend's isolated environment. No network
    /// segment. The same required-`name` and guard disciplines as
    /// `add_remote_repo`; guard refusals answer `vua.vpm.repo_invalid`,
    /// settings write-back failures answer `vua.vpm.repo_write_failed`.
    fn add_local_repo(&self, _path: &Path, _name: &str) -> Result<(), AppErrorV1> {
        Err(unsupported("add_local_repo"))
    }
    /// A4 (proposal 026 freeze batch): remove ONE subscription row by its
    /// repository id. Id-addressed on purpose (an index drifts under
    /// concurrent writers; an id is the row's stable handle). Rows whose
    /// id is absent (the read face projects `RepoInfoV01.repo_id` as an
    /// honest Option) are OUTSIDE this word face's remove reach — the
    /// honest boundary is declared in the protocol document, not papered
    /// over with index or url addressing. An unknown repoId answers
    /// `vua.vpm.repo_not_found`; settings write-back failures answer
    /// `vua.vpm.repo_write_failed`.
    fn remove_repo(&self, _repo_id: &str) -> Result<(), AppErrorV1> {
        Err(unsupported("remove_repo"))
    }
    /// P2 (proposal 025 freeze batch): the repository subscription list —
    /// the subscription face is the world (settings userRepos projected
    /// verbatim, array order preserved), each row carrying the REQUIRED
    /// per-repo cache-hit fact. Read-only: the add/remove write faces are
    /// frozen as proposal 026 A4 (`add_remote_repo` / `add_local_repo` /
    /// `remove_repo` + `repo_write_capabilities`); enable/disable stays
    /// outside every frozen word face until the VCC disabled-list key name
    /// is verified on a real machine (the W25 window item).
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
    /// P2 v0.2 increment (proposal 025 inline ruling): declaration that
    /// this backend serves the catalog face at the v0.2 word face (the
    /// result carries the `cacheSourced` disclosure). The default is
    /// false — the frozen v0.1 word face stays served; a backend overrides
    /// this exactly when it implements `package_catalog_v02`
    /// (ORC-DEV-004: no implementation, no reservation).
    fn catalog_v02(&self) -> bool {
        false
    }
    /// P2 v0.2 increment (proposal 025 inline ruling): the catalog facts
    /// at the v0.2 word face — same shape as `package_catalog` plus the
    /// REQUIRED `cache_sourced` disclosure fact. Backends keep serving
    /// v0.1 through `package_catalog` until they adopt this; the wire
    /// route negotiates the family version by `catalog_v02`.
    fn package_catalog_v02(
        &self,
        _project: &ProjectRef,
        _package_id: &str,
    ) -> Result<PackageCatalogV02, AppErrorV1> {
        Err(unsupported("package_catalog_v02"))
    }
    /// A5 (proposal 026 freeze batch, packages-ops v0.5): creates a project
    /// from a template. REQUIRED method (no default body): a backend without
    /// the creation capability declares it honestly through
    /// `capabilities().create_project == false` and the wire gate answers
    /// `capability_missing` BEFORE submit — capability absence never reaches
    /// a task. THE PORT HAS NO CREATE-PREVIEW COUNTERPART (the A5 word face
    /// is the second no-preview-pair member, rooted here): a brand-new
    /// project directory has no pre-existing state to diff, so no digest
    /// binds and the user's explicit form submission IS the confirmation.
    /// `template: None` = the backend's default template resolution (the
    /// library path: the Avatar template, VRCTemplates/<t> ->
    /// Templates/<t> -> explicit-path order — a frozen word-face FACT, not
    /// a picker: the first face has zero new read faces). SUCCESS ANSWERS
    /// `ProjectRef` — the one packages-ops face with an actual-result
    /// payload — AND REGISTERS THE NEW PROJECT IN VUA's in-store project
    /// storage (the `FileSystemProjectStore::initialize` tail call on both
    /// backends' success paths): a created project IS a registered project.
    /// Refusal faces are backend-honest and DIVERGE by backend (the wire
    /// word face folds them all into `execution_failed` carrying the
    /// original code in detail; the protocol document declares the
    /// difference): the library path answers `vua.vpm.template_missing`
    /// for all four refusal keys (projectExists / projectNameInvalid /
    /// templateMissing / templateCopyFailed — the i18n message key and the
    /// port code are two layers); the CLI path answers
    /// `vua.vpm.apply_failed` (timeout / non-zero exit, carrying the
    /// exitCode) and `vua.vpm.backend_unavailable` (runner-spawn failure).
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

