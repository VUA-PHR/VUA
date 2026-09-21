//! The recipe-export v0.1 core port face (proposal 029 B-face wiring loop 2,
//! core batch 2026-09-22). The frozen word-row `recipe.exportProjectDraft`
//! (`schemas/recipe-export/v0.1/`, freeze batch the same day) routes through
//! THIS trait — the synchronous read-only Query that derives a RECIPE DRAFT
//! (never a Recipe) from one registered Unity project. This module lands the
//! port face and the typed draft document; the REAL export executor (the
//! on-disk reader of the standing proposal-013 inspection aggregate: VPM
//! manifest declared dependencies + locked pins, the observed editor version,
//! the VUA-native identity tri-state) is the NEXT loop's implementation slice
//! and is deliberately absent here — the wire route and the wire tests pin
//! the contract against fakes before any implementation exists.
//!
//! Structure (three rulings of the freeze batch, 029 inline core section):
//!
//! 1. **Synchronous Query, no tasked face** (ruling 3): the scan touches
//!    local project files only — no Bridge, no network, nothing to cancel,
//!    nothing to recover. The port method returns the document directly;
//!    no nine-state task is minted (the packages-ops preview/query
//!    precedent).
//! 2. **Declared-none capability default** (the 025 `catalog_capabilities`
//!    accessor law, ORC-DEV-004: no implementation, no reservation): the
//!    defaulted `export_capabilities` accessor answers declared-none, so a
//!    wired-but-unimplemented port keeps the served capability row and the
//!    route honestly unavailable (`vua.recipe_export.unavailable`) until
//!    the implementing adapter overrides the accessor (the environment
//!    implementation-verification slice flips it — the F5
//!    `template_capabilities` law verbatim).
//! 3. **The draft is its own type** (ruling 2): [`ProjectDraftDocumentV01`]
//!    carries NO recipeId, NO title, NO assets/instances/relations/
//!    wardrobeGroups and NO locked block — `deny_unknown_fields` makes a
//!    draft claiming the Recipe face unrepresentable at the type level, and
//!    the family const is stamped by the wire route at envelope assembly
//!    (the P1 discipline: the route stamps the consts, the port facts stay
//!    verbatim), so the typed document carries exactly the six fact keys.
//!
//! The port's typed refusals travel verbatim through the wire route (the
//! read-face pass-through discipline — no read-face fold exists). The
//! reused registration refusal `vua.project.project_not_found` (024
//! packages-query ruling: same fact, same code) is answered by the ROUTE's
//! registration calibration over the same 013 aggregate
//! `project.inspectProject` uses — an off-aggregate path never reaches the
//! port. Zero new error codes: the face's closed set is
//! `vua.recipe_export.unavailable` / `vua.recipe_export.invalid_params` /
//! the reused `vua.project.project_not_found`.

use serde::{Deserialize, Serialize};

use crate::contracts::AppErrorV1;

/// Capability declaration for the project-draft export read face (proposal
/// 029 B-face loop 2). Same shape law as the packages-side
/// `TemplateCapabilities` / `RepoLifecycleCapabilities` accessors: a
/// separate defaulted trait accessor instead of a monolithic bit set, so
/// ports without the export face keep answering honestly unavailable
/// (ORC-DEV-004: no implementation, no reservation — the default is
/// declared-none; an adapter overrides it exactly when it implements
/// `export_project_draft`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDraftExportCapabilities {
    /// Covers the single `recipe.exportProjectDraft` read face: deriving a
    /// Recipe project draft from one registered Unity project.
    pub export_project_draft: bool,
}

impl ProjectDraftExportCapabilities {
    pub const NONE: Self = Self { export_project_draft: false };
}

impl Default for ProjectDraftExportCapabilities {
    fn default() -> Self {
        Self::NONE
    }
}

/// The VUA-native identity tri-state (`.vua/project.json`), verbatim from
/// the 013 inspection aggregate (v0.2 additive finding). An applicability
/// note only — never a gate in v0.1: whether an absent identity triggers a
/// desktop difference prompt is presentation, ruling still open (proposal
/// 029 open item 2).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VuaIdentityStatusV01 {
    Absent,
    Present,
    Unreadable,
}

/// The draft's missing-dimension closed set — the honesty core of the
/// export face. Nine dimensions are CONSTANT members of every v0.1 draft
/// (the relation-face five — assets, instances, relations, wardrobeGroups,
/// targetAvatar — plus the semantic four — assetRoles, assetLabels,
/// sourceRefs, titleSemantics: design intent, provenance and title
/// semantics are never asserted by an export, honesty rule 1); the
/// conditional tenth (`environmentUnityVersion`) joins exactly when the
/// editor version was unreadable — the route-level wire schema pins the
/// nine constant contains and the bidirectional iff against a null
/// `unityVersionConstraint`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MissingDimensionV01 {
    Assets,
    Instances,
    Relations,
    WardrobeGroups,
    TargetAvatar,
    AssetRoles,
    AssetLabels,
    SourceRefs,
    TitleSemantics,
    EnvironmentUnityVersion,
}

/// The draft origin face: the registered project identity echoed verbatim
/// from the 013 inspection aggregate. `project_name` is a source fact only
/// — the draft has NO title field (ruling 2); `None` serializes as the
/// honest `null` the frozen schema requires.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct DraftOriginV01 {
    /// The registered project path (proposal-013 identity), echoed
    /// verbatim.
    pub project_path: String,
    /// The project name as the 013 aggregate observed it, verbatim; null
    /// when no name fact is readable.
    pub project_name: Option<String>,
    pub vua_identity_status: VuaIdentityStatusV01,
}

/// The draft environment face: the observed editor version, recorded
/// verbatim (proposal 029 boundary 2 — no version migration); `None`
/// serializes as the honest `null`, which the wire schema iff-binds to the
/// `environmentUnityVersion` missing marker. No capabilities field: no
/// producer fact exists in v0.1 (ORC-DEV-004).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct DraftEnvironmentV01 {
    pub unity_version_constraint: Option<String>,
}

/// One declared-dependency row of the draft. Rows are the manifest's
/// DECLARED dependencies (locked-only entries are transitive resolution
/// facts, not user intents — out of this face's vocabulary), sorted by
/// `package_id` ascending (the frozen deterministic presentation fact —
/// the packages-query precedent). `locked_version` carries the exact
/// locked pin for the same id when one exists; it is ABSENT from the
/// serialization when `None` (the frozen schema forbids a null member —
/// absence, not null, is the honest no-pin shape).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct DraftDependencyV01 {
    /// The VPM package identifier (the manifest key), verbatim.
    pub package_id: String,
    /// The declared version constraint, verbatim from the manifest
    /// declaration.
    pub version_constraint: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locked_version: Option<String>,
}

/// The Recipe project DRAFT document (the frozen v0.1 closed set MINUS the
/// family const, which the wire route stamps at envelope assembly — the
/// repoCatalog P1 discipline). A draft-seed document, NEVER a Recipe: no
/// recipeId (minted only by the save chain when the user explicitly
/// confirms), no title, no relation face, no locked block — and
/// `deny_unknown_fields` keeps every one of those unrepresentable here
/// (the draft/Recipe boundary is a type fact, ruling 2). `draft_id` is a
/// uuidv7 DRAFT INSTANCE identity minted per export call, never a Recipe
/// identity.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ProjectDraftDocumentV01 {
    /// uuidv7 draft instance identity, minted per export call.
    pub draft_id: String,
    /// The instant the export scan completed (RFC 3339, VUA-side fact).
    pub exported_at: String,
    pub origin: DraftOriginV01,
    pub environment: DraftEnvironmentV01,
    /// The manifest's declared dependencies, packageId ascending; an EMPTY
    /// vec is the valid, honest answer (manifest absent or zero declared
    /// dependencies) — absence is never padded with guesses.
    pub dependencies: Vec<DraftDependencyV01>,
    /// The missing-dimension list: nine constant members plus the
    /// conditional tenth (see [`MissingDimensionV01`]).
    pub missing: Vec<MissingDimensionV01>,
}

/// The project-draft export port (proposal 029 B-face loop 2): the core
/// cross-domain contract the wire route serves
/// `recipe.exportProjectDraft` through. The implementing adapter (the
/// real 013-aggregate reader) lands with the NEXT loop's implementation
/// slice; until then the declared-none default keeps every answer honestly
/// unavailable. Errors travel verbatim through the route (the read-face
/// pass-through discipline); zero new error codes — the face's closed set
/// is `vua.recipe_export.unavailable` / `vua.recipe_export.invalid_params`
/// / the reused `vua.project.project_not_found`.
pub trait ProjectDraftExportPort: Send + Sync {
    /// Capability declaration for the export face. Default declared-none
    /// (ORC-DEV-004; the 025 accessor law): the served capability row and
    /// the route stay honestly unavailable until an implementing adapter
    /// overrides this exactly when it implements `export_project_draft`.
    fn export_capabilities(&self) -> ProjectDraftExportCapabilities {
        ProjectDraftExportCapabilities::NONE
    }

    /// Derives the Recipe project draft for ONE registered Unity project
    /// (the proposal-013 registered-path identity). Synchronous read-only:
    /// local project files only, no Bridge, no network, no mutation, no
    /// tasked face — the port returns the document directly. A failed
    /// on-disk observation is NOT an error of this face: an absent manifest
    /// yields the honest empty dependencies vec and an unreadable
    /// ProjectVersion.txt yields a null constraint plus the
    /// environmentUnityVersion marker — honesty rules 1/2, never padded,
    /// never guessed. The default body answers the face's honest-absence
    /// code so a declared-but-unimplemented adapter CAN exist at the type
    /// level (the F5 structural law — the route gate answers first, the
    /// default body is the second honest layer).
    fn export_project_draft(
        &self,
        _project_path: &str,
    ) -> Result<ProjectDraftDocumentV01, AppErrorV1> {
        Err(AppErrorV1::new(
            "vua.recipe_export.unavailable",
            crate::contracts::ErrorCategory::Unavailable,
            "errors.recipeExport.unavailable",
            "corr-recipe-export-port",
        ))
    }
}
