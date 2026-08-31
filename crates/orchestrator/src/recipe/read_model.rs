//! Recipe read model and pure ProjectSpec derivation (proposal "UI 最小读
//! 模型" and "Orchestrator 用例 DTO"): the UI consumes these — it never
//! interprets `locked` completeness, compares package versions, or derives
//! Bridge commands itself.

use super::model::*;
use super::validate::{has_blocking, validate_local_resolution, validate_recipe};
use std::collections::BTreeMap;

/// Builds the UI read model. `local_resolution` is the machine-local private
/// document when one exists; its presence lifts entrypoint/object binding
/// issues from "needs input" to resolvable-or-blocking.
pub fn build_read_model(
    recipe: RecipeV2,
    local_resolution: Option<&LocalResolutionV1>,
) -> RecipeReadModel {
    let mut issues = validate_recipe(&recipe);
    let resolution_issues = local_resolution
        .map(|resolution| validate_local_resolution(&recipe, resolution))
        .unwrap_or_default();
    let local_resolution_valid =
        local_resolution.is_some() && !has_blocking(&issues) && !has_blocking(&resolution_issues);
    issues.extend(resolution_issues);
    let blocking = has_blocking(&issues);
    let (lock_state, reproducibility, resolution_state) = classify(&recipe, local_resolution_valid);
    let resolution_state = if blocking {
        ResolutionState::NeedsInput
    } else {
        resolution_state
    };
    RecipeReadModel {
        recipe,
        resolution_state,
        reproducibility,
        lock_state,
        issues,
    }
}

fn classify(
    recipe: &RecipeV2,
    local_resolution_valid: bool,
) -> (LockState, ReproducibilityLevel, ResolutionState) {
    let Some(locked) = &recipe.locked else {
        return (
            LockState::Missing,
            ReproducibilityLevel::IntentOnly,
            ResolutionState::Unresolved,
        );
    };
    if locked.recipe_revision != recipe.revision {
        return (
            LockState::Stale,
            ReproducibilityLevel::IntentOnly,
            ResolutionState::LockStale,
        );
    }
    match locked.status {
        LockStatus::Complete => {
            if local_resolution_valid {
                (
                    LockState::ValidComplete,
                    ReproducibilityLevel::LocallyReproducible,
                    ResolutionState::Ready,
                )
            } else {
                (
                    LockState::ValidComplete,
                    ReproducibilityLevel::VersionLocked,
                    ResolutionState::Resolved,
                )
            }
        }
        LockStatus::Partial => (
            LockState::ValidPartial,
            ReproducibilityLevel::VersionLocked,
            ResolutionState::NeedsInput,
        ),
    }
}

// --- ProjectSpec derivation ---

/// Pure derivation result consumed by Assembly planning (O5). Everything is
/// resolved data — no Unity paths, no Bridge commands.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DerivedProjectSpecV1 {
    pub schema_version: u8,
    pub recipe_id: String,
    pub recipe_revision: u64,
    pub document_digest: String,
    pub title: String,
    pub platforms: Vec<Platform>,
    pub unity: UnityTarget,
    pub required_capabilities: Vec<String>,
    pub optional_capabilities: Vec<String>,
    pub packages: Vec<PackageSpec>,
    pub avatar_entry: Option<AvatarEntry>,
    pub counts: SpecCounts,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnityTarget {
    /// Desired-state constraint from the recipe.
    pub constraint: String,
    /// Exact version once locked; absent means the lock is missing or stale.
    pub locked_version: Option<String>,
    pub locked_revision: Option<String>,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageSpec {
    pub package_id: String,
    pub version_constraint: String,
    pub optional: bool,
    /// Exact version from the lock when present and fresh.
    pub locked_version: Option<String>,
    pub locked_source_restorable: bool,
}

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AvatarEntry {
    pub instance_id: String,
    pub asset_id: String,
    pub selector_id: String,
    pub entrypoint_kind: EntrypointKind,
    pub catalog_entry_id: Option<String>,
    pub name_hint: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecCounts {
    pub assets: usize,
    pub instances: usize,
    pub relations: usize,
    pub wardrobe_groups: usize,
}

/// Derives the ProjectSpec draft. Returns the blocking issues when the recipe
/// is not yet plannable; a stale lock degrades locked versions to floating
/// constraints instead of failing (ADR-0005: a stale lock is never silently
/// used, but the intent stays plannable).
pub fn derive_project_spec(
    recipe: &RecipeV2,
    document_digest: &str,
) -> Result<DerivedProjectSpecV1, Vec<RecipeIssue>> {
    let issues = validate_recipe(recipe);
    if has_blocking(&issues) {
        return Err(issues);
    }

    let lock_fresh = recipe
        .locked
        .as_ref()
        .map(|locked| locked.recipe_revision == recipe.revision)
        .unwrap_or(false);
    let locked = if lock_fresh {
        recipe.locked.as_ref()
    } else {
        None
    };
    let package_locks: BTreeMap<&str, &LockedPackage> = locked
        .map(|locked| {
            locked
                .packages
                .iter()
                .map(|package| (package.package_id.as_str(), package))
                .collect()
        })
        .unwrap_or_default();

    let avatar_entry = recipe
        .instances
        .iter()
        .find(|instance| instance.id == recipe.target.avatar_instance_id)
        .map(|instance| AvatarEntry {
            instance_id: instance.id.clone(),
            asset_id: instance.asset_id.clone(),
            selector_id: instance.entrypoint.selector_id.clone(),
            entrypoint_kind: instance.entrypoint.kind,
            catalog_entry_id: instance.entrypoint.catalog_entry_id.clone(),
            name_hint: instance.entrypoint.name_hint.clone(),
        });

    Ok(DerivedProjectSpecV1 {
        schema_version: 1,
        recipe_id: recipe.recipe_id.clone(),
        recipe_revision: recipe.revision,
        document_digest: document_digest.to_owned(),
        title: recipe.title.clone(),
        platforms: recipe.target.platforms.clone(),
        unity: UnityTarget {
            constraint: recipe.environment.unity_version_constraint.clone(),
            locked_version: locked.map(|locked| locked.unity.version.clone()),
            locked_revision: locked.and_then(|locked| locked.unity.revision.clone()),
        },
        required_capabilities: recipe
            .environment
            .capabilities
            .iter()
            .filter(|capability| capability.required)
            .map(|capability| capability.id.clone())
            .collect(),
        optional_capabilities: recipe
            .environment
            .capabilities
            .iter()
            .filter(|capability| !capability.required)
            .map(|capability| capability.id.clone())
            .collect(),
        packages: recipe
            .dependencies
            .iter()
            .map(|dependency| {
                let lock = package_locks.get(dependency.package_id.as_str());
                PackageSpec {
                    package_id: dependency.package_id.clone(),
                    version_constraint: dependency.version_constraint.clone(),
                    optional: dependency.optional,
                    locked_version: lock.map(|package| package.version.clone()),
                    locked_source_restorable: lock
                        .map(|package| package.source.restorable)
                        .unwrap_or(false),
                }
            })
            .collect(),
        avatar_entry,
        counts: SpecCounts {
            assets: recipe.assets.len(),
            instances: recipe.instances.len(),
            relations: recipe.relations.len(),
            wardrobe_groups: recipe.wardrobe_groups.len(),
        },
    })
}
