//! Recipe v0.2 validation: pattern constraints the schema expresses with regex,
//! plus the eleven cross-field domain invariants from the proposal
//! ("Schema 之外的领域不变量"). Output is a list of typed issues with stable
//! codes — never bare strings (ORC-ERR-001, ORC-IPC-010).

use super::model::*;
use std::collections::{BTreeMap, HashMap, HashSet};

/// Whether any issue must gate saving, planning and sharing.
pub fn has_blocking(issues: &[RecipeIssue]) -> bool {
    issues
        .iter()
        .any(|issue| issue.severity == IssueSeverity::Blocking)
}

pub fn validate_recipe(recipe: &RecipeV02) -> Vec<RecipeIssue> {
    let mut collector = IssueCollector::new();
    validate_shapes(recipe, &mut collector);
    validate_invariants(recipe, &mut collector);
    collector.finish()
}

/// Validates the optional private Local Resolution against the recipe:
/// every entrypoint selector binds exactly one entrypoint, every object
/// selector exactly one object (invariant 6).
pub fn validate_local_resolution(
    recipe: &RecipeV02,
    resolution: &LocalResolutionV1,
) -> Vec<RecipeIssue> {
    let mut collector = IssueCollector::new();
    if resolution.schema_version != 1 {
        collector.push(
            "recipe.local_resolution_version",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.localResolutionVersion",
            vec![],
        );
        return collector.finish();
    }
    if resolution.recipe_id != recipe.recipe_id || resolution.recipe_revision != recipe.revision {
        collector.push(
            "recipe.local_resolution_stale",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.localResolutionStale",
            vec![],
        );
        return collector.finish();
    }
    if !is_uuid_v7(&resolution.environment_id) || resolution.resolved_at.trim().is_empty() {
        collector.push(
            "recipe.local_resolution_identity_invalid",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.localResolutionIdentityInvalid",
            vec![],
        );
    }

    let recipe_assets: HashMap<&str, &AssetV02> = recipe
        .assets
        .iter()
        .map(|asset| (asset.id.as_str(), asset))
        .collect();
    let instance_assets: HashMap<&str, &str> = recipe
        .instances
        .iter()
        .map(|instance| (instance.id.as_str(), instance.asset_id.as_str()))
        .collect();
    let entrypoint_owners: HashMap<&str, &str> = recipe
        .instances
        .iter()
        .map(|instance| {
            (
                instance.entrypoint.selector_id.as_str(),
                instance.asset_id.as_str(),
            )
        })
        .collect();
    let object_owners: HashMap<&str, &str> = recipe
        .relations
        .iter()
        .filter_map(|relation| match relation {
            RelationV02::ExcludeObject {
                target_instance_id,
                selector,
                ..
            }
            | RelationV02::SetObjectActive {
                target_instance_id,
                selector,
                ..
            } => instance_assets
                .get(target_instance_id.as_str())
                .map(|asset_id| (selector.selector_id.as_str(), *asset_id)),
            _ => None,
        })
        .collect();

    let mut asset_counts: HashMap<&str, usize> = HashMap::new();
    let mut entrypoint_counts: HashMap<&str, usize> = HashMap::new();
    let mut object_counts: HashMap<&str, usize> = HashMap::new();
    for asset in &resolution.assets {
        *asset_counts.entry(asset.asset_id.as_str()).or_default() += 1;
        if !recipe_assets.contains_key(asset.asset_id.as_str()) {
            collector.push(
                "recipe.local_asset_unknown",
                IssueSeverity::Blocking,
                IssueSubject::Asset {
                    id: asset.asset_id.clone(),
                },
                "errors.recipe.localAssetUnknown",
                vec![("assetId", asset.asset_id.clone())],
            );
        }
        if !is_uuid_v7(&asset.warehouse_asset_id)
            || !is_uuid_v7(&asset.artifact_id)
            || !is_sha256_text(&asset.artifact_fingerprint.value)
        {
            collector.push(
                "recipe.local_asset_identity_invalid",
                IssueSeverity::Blocking,
                IssueSubject::Asset {
                    id: asset.asset_id.clone(),
                },
                "errors.recipe.localAssetIdentityInvalid",
                vec![("assetId", asset.asset_id.clone())],
            );
        }
        for binding in &asset.entrypoints {
            *entrypoint_counts
                .entry(binding.selector_id.as_str())
                .or_default() += 1;
            let owner_matches = entrypoint_owners
                .get(binding.selector_id.as_str())
                .is_some_and(|owner| *owner == asset.asset_id);
            if !owner_matches || !is_unity_guid(&binding.unity_asset_guid) {
                collector.push(
                    "recipe.entrypoint_binding_invalid",
                    IssueSeverity::Blocking,
                    IssueSubject::Asset {
                        id: asset.asset_id.clone(),
                    },
                    "errors.recipe.entrypointBindingInvalid",
                    vec![("selectorId", binding.selector_id.clone())],
                );
            }
        }
        for binding in &asset.object_bindings {
            *object_counts
                .entry(binding.selector_id.as_str())
                .or_default() += 1;
            let object_owner_matches = object_owners
                .get(binding.selector_id.as_str())
                .is_some_and(|owner| *owner == asset.asset_id);
            let entrypoint_owner_matches = entrypoint_owners
                .get(binding.entrypoint_selector_id.as_str())
                .is_some_and(|owner| *owner == asset.asset_id);
            if !object_owner_matches || !entrypoint_owner_matches {
                collector.push(
                    "recipe.object_binding_invalid",
                    IssueSeverity::Blocking,
                    IssueSubject::Asset {
                        id: asset.asset_id.clone(),
                    },
                    "errors.recipe.objectBindingInvalid",
                    vec![("selectorId", binding.selector_id.clone())],
                );
            }
        }
    }

    for asset in &recipe.assets {
        let count = asset_counts.get(asset.id.as_str()).copied().unwrap_or(0);
        if count > 1 || (asset.required && count != 1) {
            collector.push_full(
                "recipe.local_asset_unresolved",
                IssueSeverity::Blocking,
                IssueSubject::Asset {
                    id: asset.id.clone(),
                },
                "errors.recipe.localAssetUnresolved",
                vec![("assetId", asset.id.clone()), ("count", count.to_string())],
                vec![IssueActionKind::LocateLocalAsset],
            );
        }
    }

    for instance in &recipe.instances {
        let count = entrypoint_counts
            .get(instance.entrypoint.selector_id.as_str())
            .copied()
            .unwrap_or(0);
        if count != 1 {
            collector.push_full(
                "recipe.entrypoint_unbound",
                IssueSeverity::Blocking,
                IssueSubject::Instance {
                    id: instance.id.clone(),
                },
                "errors.recipe.entrypointUnbound",
                vec![("selectorId", instance.entrypoint.selector_id.clone())],
                vec![IssueActionKind::ChooseCandidate],
            );
        }
    }
    for relation in &recipe.relations {
        let (relation_id, selector) = match relation {
            RelationV02::ExcludeObject { id, selector, .. }
            | RelationV02::SetObjectActive { id, selector, .. } => (id, selector),
            _ => continue,
        };
        let count = object_counts
            .get(selector.selector_id.as_str())
            .copied()
            .unwrap_or(0);
        if count != 1 {
            collector.push_full(
                "recipe.object_selector_unbound",
                IssueSeverity::Blocking,
                IssueSubject::Relation {
                    id: relation_id.clone(),
                },
                "errors.recipe.objectSelectorUnbound",
                vec![("selectorId", selector.selector_id.clone())],
                vec![IssueActionKind::ChooseCandidate],
            );
        }
    }
    collector.finish()
}

// --- issue collector ---

struct IssueCollector {
    issues: Vec<RecipeIssue>,
    counter: usize,
}

impl IssueCollector {
    fn new() -> Self {
        Self {
            issues: Vec::new(),
            counter: 0,
        }
    }

    fn push(
        &mut self,
        code: &str,
        severity: IssueSeverity,
        subject: IssueSubject,
        message_key: &str,
        parameters: Vec<(&str, String)>,
    ) {
        self.push_full(code, severity, subject, message_key, parameters, Vec::new());
    }

    fn push_full(
        &mut self,
        code: &str,
        severity: IssueSeverity,
        subject: IssueSubject,
        message_key: &str,
        parameters: Vec<(&str, String)>,
        actions: Vec<IssueActionKind>,
    ) {
        let mut params = BTreeMap::new();
        for (key, value) in parameters {
            params.insert(key.to_owned(), value);
        }
        self.counter += 1;
        self.issues.push(RecipeIssue {
            issue_id: format!("iss-{:04}", self.counter),
            code: code.to_owned(),
            severity,
            subject,
            message_key: message_key.to_owned(),
            parameters: params,
            actions: actions
                .into_iter()
                .enumerate()
                .map(|(index, kind)| IssueAction {
                    action_id: format!("act-{:04}-{}", self.counter, index),
                    kind,
                    label_key: label_key(kind),
                })
                .collect(),
        });
    }

    fn finish(self) -> Vec<RecipeIssue> {
        self.issues
    }
}

fn label_key(kind: IssueActionKind) -> String {
    format!(
        "actions.recipe.{}",
        match kind {
            IssueActionKind::LocateLocalAsset => "locate_local_asset",
            IssueActionKind::ChooseCandidate => "choose_candidate",
            IssueActionKind::RefreshLock => "refresh_lock",
            IssueActionKind::InspectSource => "inspect_source",
            IssueActionKind::EditRecipe => "edit_recipe",
            IssueActionKind::Retry => "retry",
        }
    )
}

// --- shape checks (schema regex/min-max equivalents) ---

fn validate_shapes(recipe: &RecipeV02, collector: &mut IssueCollector) {
    if recipe.format_version != RECIPE_FORMAT_VERSION {
        collector.push(
            "recipe.format_version",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.formatVersion",
            vec![],
        );
    }
    if !is_uuid_v7(&recipe.recipe_id) {
        collector.push(
            "recipe.pattern_invalid",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.patternInvalid",
            vec![("field", "recipeId".to_owned())],
        );
    }
    if recipe.title.is_empty() || recipe.title.chars().count() > 120 {
        collector.push(
            "recipe.pattern_invalid",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.patternInvalid",
            vec![("field", "title".to_owned())],
        );
    }
    if recipe.description.chars().count() > 2000 {
        collector.push(
            "recipe.pattern_invalid",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.patternInvalid",
            vec![("field", "description".to_owned())],
        );
    }
    if !(1..=256).contains(&recipe.assets.len())
        || !(1..=512).contains(&recipe.instances.len())
        || recipe.relations.len() > 1024
        || recipe.wardrobe_groups.len() > 64
        || recipe.dependencies.len() > 128
        || recipe.extensions.len() > 32
    {
        collector.push(
            "recipe.array_size",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.arraySize",
            vec![],
        );
    }

    for capability in &recipe.environment.capabilities {
        if !is_capability_id(&capability.id) {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                IssueSubject::Environment {
                    id: capability.id.clone(),
                },
                "errors.recipe.patternInvalid",
                vec![("field", "capabilityId".to_owned())],
            );
        }
    }

    for asset in &recipe.assets {
        let subject = || IssueSubject::Asset {
            id: asset.id.clone(),
        };
        if !is_local_id(&asset.id) {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.patternInvalid",
                vec![("field", "assetId".to_owned())],
            );
        }
        if let Some(label) = &asset.label {
            if label.is_empty() || label.chars().count() > 120 {
                collector.push(
                    "recipe.pattern_invalid",
                    IssueSeverity::Blocking,
                    subject(),
                    "errors.recipe.patternInvalid",
                    vec![("field", "label".to_owned())],
                );
            }
        }
        if asset.entity_ref.is_none() && asset.source_ref.is_none() {
            collector.push(
                "recipe.origin_missing",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.originMissing",
                vec![],
            );
        }
        if let Some(entity_ref) = &asset.entity_ref {
            if !is_uuid_v1_to_8(&entity_ref.entity_id) {
                collector.push(
                    "recipe.pattern_invalid",
                    IssueSeverity::Blocking,
                    subject(),
                    "errors.recipe.patternInvalid",
                    vec![("field", "entityId".to_owned())],
                );
            }
        }
        if let Some(source_ref) = &asset.source_ref {
            if !is_provider(&source_ref.provider)
                || source_ref.product_id.is_empty()
                || source_ref.product_id.chars().count() > 128
            {
                collector.push(
                    "recipe.pattern_invalid",
                    IssueSeverity::Blocking,
                    subject(),
                    "errors.recipe.patternInvalid",
                    vec![("field", "sourceRef".to_owned())],
                );
            }
        }
        if let Some(selection) = &asset.selection {
            if selection.release_id.is_none()
                && selection.release_label.is_none()
                && selection.distribution_label.is_none()
            {
                collector.push_full(
                    "recipe.selection_missing",
                    IssueSeverity::Warning,
                    subject(),
                    "errors.recipe.selectionMissing",
                    vec![],
                    vec![IssueActionKind::InspectSource],
                );
            }
        }
        if asset.requires_asset_ids.len() > 32 {
            collector.push(
                "recipe.array_size",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.arraySize",
                vec![("field", "requiresAssetIds".to_owned())],
            );
        }
    }

    for instance in &recipe.instances {
        let subject = || IssueSubject::Instance {
            id: instance.id.clone(),
        };
        if !is_local_id(&instance.id) || !is_local_id(&instance.asset_id) {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.patternInvalid",
                vec![("field", "instanceId".to_owned())],
            );
        }
        let selector = &instance.entrypoint;
        if !is_local_id(&selector.selector_id) {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.patternInvalid",
                vec![("field", "selectorId".to_owned())],
            );
        }
        if selector.catalog_entry_id.is_none() && selector.name_hint.is_none() {
            collector.push_full(
                "recipe.entrypoint_hint_missing",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.entrypointHintMissing",
                vec![],
                vec![IssueActionKind::EditRecipe],
            );
        }
    }

    for group in &recipe.wardrobe_groups {
        if !is_local_id(&group.id) {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                IssueSubject::Recipe,
                "errors.recipe.patternInvalid",
                vec![("field", "wardrobeGroupId".to_owned())],
            );
        }
    }

    for dependency in &recipe.dependencies {
        if !is_package_id(&dependency.package_id)
            || dependency.version_constraint.is_empty()
            || dependency.version_constraint.chars().count() > 120
        {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                IssueSubject::Dependency {
                    id: dependency.package_id.clone(),
                },
                "errors.recipe.patternInvalid",
                vec![("field", "dependency".to_owned())],
            );
        }
    }

    if let Some(locked) = &recipe.locked {
        validate_lock_shapes(locked, collector);
    }
}

fn validate_lock_shapes(locked: &LockedV1, collector: &mut IssueCollector) {
    if locked.lock_version != LOCK_SCHEMA_VERSION {
        collector.push(
            "recipe.lock_version",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.lockVersion",
            vec![],
        );
    }
    if !is_unity_version(&locked.unity.version) {
        collector.push(
            "recipe.pattern_invalid",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.patternInvalid",
            vec![("field", "locked.unity.version".to_owned())],
        );
    }
    if locked.packages.len() > 512 || locked.assets.len() > 256 {
        collector.push(
            "recipe.array_size",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.arraySize",
            vec![],
        );
    }
    for package in &locked.packages {
        let subject = || IssueSubject::Dependency {
            id: package.package_id.clone(),
        };
        if !is_package_id(&package.package_id) {
            collector.push(
                "recipe.pattern_invalid",
                IssueSeverity::Blocking,
                subject(),
                "errors.recipe.patternInvalid",
                vec![("field", "locked.packageId".to_owned())],
            );
        }
        if let Some(digest) = &package.source.artifact_digest {
            if !is_sha256_text(digest) {
                collector.push(
                    "recipe.pattern_invalid",
                    IssueSeverity::Blocking,
                    subject(),
                    "errors.recipe.patternInvalid",
                    vec![("field", "artifactDigest".to_owned())],
                );
            }
        }
    }
}

// --- cross-field invariants (proposal §"Schema 之外的领域不变量") ---

fn validate_invariants(recipe: &RecipeV02, collector: &mut IssueCollector) {
    // 1. namespace uniqueness
    check_unique(
        recipe.assets.iter().map(|asset| asset.id.as_str()),
        "asset",
        collector,
    );
    check_unique(
        recipe.instances.iter().map(|instance| instance.id.as_str()),
        "instance",
        collector,
    );
    check_unique(
        recipe.relations.iter().map(relation_id),
        "relation",
        collector,
    );
    check_unique(
        recipe
            .instances
            .iter()
            .map(|instance| instance.entrypoint.selector_id.as_str()),
        "selector",
        collector,
    );
    check_unique(
        recipe.wardrobe_groups.iter().map(|group| group.id.as_str()),
        "wardrobeGroup",
        collector,
    );

    let assets: HashMap<&str, &AssetV02> = recipe
        .assets
        .iter()
        .map(|asset| (asset.id.as_str(), asset))
        .collect();
    let instances: HashMap<&str, &InstanceV02> = recipe
        .instances
        .iter()
        .map(|instance| (instance.id.as_str(), instance))
        .collect();

    // 2. target avatar instance exists with an avatar role
    match instances.get(recipe.target.avatar_instance_id.as_str()) {
        None => collector.push_full(
            "recipe.avatar_instance_missing",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.avatarInstanceMissing",
            vec![("instanceId", recipe.target.avatar_instance_id.clone())],
            vec![IssueActionKind::EditRecipe],
        ),
        Some(instance) => match assets.get(instance.asset_id.as_str()) {
            Some(asset) if asset.role.is_avatar() => {}
            Some(_) => collector.push_full(
                "recipe.avatar_role_invalid",
                IssueSeverity::Blocking,
                IssueSubject::Instance {
                    id: recipe.target.avatar_instance_id.clone(),
                },
                "errors.recipe.avatarRoleInvalid",
                vec![],
                vec![IssueActionKind::EditRecipe],
            ),
            None => collector.push_full(
                "recipe.instance_asset_missing",
                IssueSeverity::Blocking,
                IssueSubject::Instance {
                    id: recipe.target.avatar_instance_id.clone(),
                },
                "errors.recipe.instanceAssetMissing",
                vec![("assetId", instance.asset_id.clone())],
                vec![IssueActionKind::EditRecipe],
            ),
        },
    }

    // 3. instance → asset references
    for instance in &recipe.instances {
        if !assets.contains_key(instance.asset_id.as_str()) {
            collector.push_full(
                "recipe.instance_asset_missing",
                IssueSeverity::Blocking,
                IssueSubject::Instance {
                    id: instance.id.clone(),
                },
                "errors.recipe.instanceAssetMissing",
                vec![("assetId", instance.asset_id.clone())],
                vec![IssueActionKind::EditRecipe],
            );
        }
    }

    // 4. requiresAssetIds exist and are acyclic
    for asset in &recipe.assets {
        for required in &asset.requires_asset_ids {
            if !assets.contains_key(required.as_str()) {
                collector.push_full(
                    "recipe.requires_missing",
                    IssueSeverity::Blocking,
                    IssueSubject::Asset {
                        id: asset.id.clone(),
                    },
                    "errors.recipe.requiresMissing",
                    vec![("assetId", required.clone())],
                    vec![IssueActionKind::EditRecipe],
                );
            }
        }
    }
    if let Some(cycle_start) = find_asset_cycle(&assets) {
        collector.push_full(
            "recipe.asset_cycle",
            IssueSeverity::Blocking,
            IssueSubject::Asset { id: cycle_start },
            "errors.recipe.assetCycle",
            vec![],
            vec![IssueActionKind::EditRecipe],
        );
    }

    // 5. relation subjects/targets exist, roles match, no self-install
    for relation in &recipe.relations {
        match relation {
            RelationV02::InstallModularAsset {
                id,
                asset_instance_id,
                avatar_instance_id,
                ..
            }
            | RelationV02::AttachToBone {
                id,
                asset_instance_id,
                avatar_instance_id,
                ..
            } => {
                check_pair_relation(
                    id,
                    asset_instance_id,
                    avatar_instance_id,
                    &instances,
                    &assets,
                    collector,
                );
            }
            RelationV02::ExcludeObject {
                id,
                target_instance_id,
                ..
            }
            | RelationV02::SetObjectActive {
                id,
                target_instance_id,
                ..
            } => {
                if !instances.contains_key(target_instance_id.as_str()) {
                    collector.push_full(
                        "recipe.relation_target_missing",
                        IssueSeverity::Blocking,
                        IssueSubject::Relation { id: id.clone() },
                        "errors.recipe.relationTargetMissing",
                        vec![("instanceId", target_instance_id.clone())],
                        vec![IssueActionKind::EditRecipe],
                    );
                }
            }
        }
    }

    // 6. transform sanity for attach_to_bone: finite values, non-zero scale
    for relation in &recipe.relations {
        if let RelationV02::AttachToBone {
            id,
            local_transform,
            ..
        } = relation
        {
            let transform_ok = local_transform.scale.x != 0.0
                && local_transform.scale.y != 0.0
                && local_transform.scale.z != 0.0
                && [
                    local_transform.position.x,
                    local_transform.position.y,
                    local_transform.position.z,
                ]
                .iter()
                .all(|value| value.is_finite());
            if !transform_ok {
                collector.push_full(
                    "recipe.transform_invalid",
                    IssueSeverity::Blocking,
                    IssueSubject::Relation { id: id.clone() },
                    "errors.recipe.transformInvalid",
                    vec![],
                    vec![IssueActionKind::EditRecipe],
                );
            }
        }
    }

    // 7. wardrobe groups: members are instances, defaults belong and fit mode
    for group in &recipe.wardrobe_groups {
        for member in &group.member_instance_ids {
            if !instances.contains_key(member.as_str()) {
                collector.push_full(
                    "recipe.wardrobe_member_missing",
                    IssueSeverity::Blocking,
                    IssueSubject::Recipe,
                    "errors.recipe.wardrobeMemberMissing",
                    vec![("group", group.id.clone()), ("instanceId", member.clone())],
                    vec![IssueActionKind::EditRecipe],
                );
            }
        }
        for default_instance in &group.default_instance_ids {
            if !group.member_instance_ids.contains(default_instance) {
                collector.push_full(
                    "recipe.wardrobe_default_invalid",
                    IssueSeverity::Blocking,
                    IssueSubject::Recipe,
                    "errors.recipe.wardrobeDefaultInvalid",
                    vec![
                        ("group", group.id.clone()),
                        ("instanceId", default_instance.clone()),
                    ],
                    vec![IssueActionKind::EditRecipe],
                );
            }
        }
        let defaults = group.default_instance_ids.len();
        let valid = match group.selection_mode {
            SelectionMode::ExactlyOne => defaults == 1,
            SelectionMode::ZeroOrOne => defaults <= 1,
            SelectionMode::Any => true,
        };
        if !valid {
            collector.push_full(
                "recipe.wardrobe_default_invalid",
                IssueSeverity::Blocking,
                IssueSubject::Recipe,
                "errors.recipe.wardrobeDefaultInvalid",
                vec![("group", group.id.clone())],
                vec![IssueActionKind::EditRecipe],
            );
        }
    }

    // 8. dependency package ids unique
    let mut seen_packages: HashSet<&str> = HashSet::new();
    for dependency in &recipe.dependencies {
        if !seen_packages.insert(dependency.package_id.as_str()) {
            collector.push_full(
                "recipe.dependency_duplicate",
                IssueSeverity::Blocking,
                IssueSubject::Dependency {
                    id: dependency.package_id.clone(),
                },
                "errors.recipe.dependencyDuplicate",
                vec![],
                vec![IssueActionKind::EditRecipe],
            );
        }
    }

    // 9./10. lock freshness and restorability
    if let Some(locked) = &recipe.locked {
        if locked.recipe_revision != recipe.revision {
            collector.push_full(
                "recipe.lock_stale",
                IssueSeverity::Warning,
                IssueSubject::Recipe,
                "errors.recipe.lockStale",
                vec![
                    ("lockedRevision", locked.recipe_revision.to_string()),
                    ("revision", recipe.revision.to_string()),
                ],
                vec![IssueActionKind::RefreshLock],
            );
        }
        for package in &locked.packages {
            if !package.source.restorable {
                collector.push_full(
                    "recipe.lock_incomplete_restorable",
                    IssueSeverity::Warning,
                    IssueSubject::Dependency {
                        id: package.package_id.clone(),
                    },
                    "errors.recipe.lockIncompleteRestorable",
                    vec![],
                    vec![IssueActionKind::RefreshLock],
                );
            }
        }
    }

    // 11. extensions: unknown namespaces never gain execution power
    for namespace in recipe.extensions.keys() {
        if !is_known_extension_namespace(namespace) {
            collector.push(
                "recipe.extension_unknown",
                IssueSeverity::Warning,
                IssueSubject::Recipe,
                "errors.recipe.extensionUnknown",
                vec![("namespace", namespace.clone())],
            );
        }
    }

    // environment capabilities: unknown required ids block production,
    // unknown optional ids warn (proposal §"顶层结构").
    for capability in &recipe.environment.capabilities {
        if !is_known_capability(&capability.id) {
            collector.push_full(
                "recipe.capability_unknown",
                if capability.required {
                    IssueSeverity::Blocking
                } else {
                    IssueSeverity::Warning
                },
                IssueSubject::Environment {
                    id: capability.id.clone(),
                },
                "errors.recipe.capabilityUnknown",
                vec![("capabilityId", capability.id.clone())],
                vec![],
            );
        }
    }
}

fn check_pair_relation(
    relation_id: &str,
    asset_instance_id: &str,
    avatar_instance_id: &str,
    instances: &HashMap<&str, &InstanceV02>,
    assets: &HashMap<&str, &AssetV02>,
    collector: &mut IssueCollector,
) {
    if asset_instance_id == avatar_instance_id {
        collector.push_full(
            "recipe.relation_self_install",
            IssueSeverity::Blocking,
            IssueSubject::Relation {
                id: relation_id.to_owned(),
            },
            "errors.recipe.relationSelfInstall",
            vec![],
            vec![IssueActionKind::EditRecipe],
        );
        return;
    }
    for instance_id in [asset_instance_id, avatar_instance_id] {
        if !instances.contains_key(instance_id) {
            collector.push_full(
                "recipe.relation_target_missing",
                IssueSeverity::Blocking,
                IssueSubject::Relation {
                    id: relation_id.to_owned(),
                },
                "errors.recipe.relationTargetMissing",
                vec![("instanceId", instance_id.to_owned())],
                vec![IssueActionKind::EditRecipe],
            );
            return;
        }
    }
    let asset_ok = instances
        .get(asset_instance_id)
        .and_then(|instance| assets.get(instance.asset_id.as_str()))
        .map(|asset| !asset.role.is_avatar())
        .unwrap_or(false);
    let avatar_ok = instances
        .get(avatar_instance_id)
        .and_then(|instance| assets.get(instance.asset_id.as_str()))
        .map(|asset| asset.role.is_avatar())
        .unwrap_or(false);
    if !asset_ok || !avatar_ok {
        collector.push_full(
            "recipe.relation_role_invalid",
            IssueSeverity::Blocking,
            IssueSubject::Relation {
                id: relation_id.to_owned(),
            },
            "errors.recipe.relationRoleInvalid",
            vec![],
            vec![IssueActionKind::EditRecipe],
        );
    }
}

fn check_unique<'a, Ids>(ids: Ids, scope: &str, collector: &mut IssueCollector)
where
    Ids: Iterator<Item = &'a str>,
{
    let mut seen: HashSet<&str> = HashSet::new();
    let mut duplicates: Vec<String> = Vec::new();
    for id in ids {
        if !seen.insert(id) && !duplicates.iter().any(|duplicate| duplicate == id) {
            duplicates.push(id.to_owned());
        }
    }
    for id in duplicates {
        collector.push_full(
            "recipe.id_duplicate",
            IssueSeverity::Blocking,
            IssueSubject::Recipe,
            "errors.recipe.idDuplicate",
            vec![("scope", scope.to_owned()), ("id", id)],
            vec![IssueActionKind::EditRecipe],
        );
    }
}

fn relation_id(relation: &RelationV02) -> &str {
    match relation {
        RelationV02::InstallModularAsset { id, .. }
        | RelationV02::AttachToBone { id, .. }
        | RelationV02::ExcludeObject { id, .. }
        | RelationV02::SetObjectActive { id, .. } => id,
    }
}

/// Iterative DFS with colors; returns the first node found on a back edge.
///
/// 经典三色环检测：White=没访问过、Grey=正在访问的路径上（当前的祖先链）、
/// Black=已完成。走到 Grey 节点 = 出现回边 = 有环（例如 A requires B、
/// B requires A——装配会死循环，必须在计划前拦下）。用显式栈而不是递归：
/// 配方最多 256 个资产、依赖链可能很深，避免栈溢出；`stack.push((node,
/// index+1))` 是迭代版 DFS 的"回来继续"手法——记下进度再深入下一个分支。
fn find_asset_cycle(assets: &HashMap<&str, &AssetV02>) -> Option<String> {
    #[derive(Clone, Copy, PartialEq)]
    enum Color {
        White,
        Grey,
        Black,
    }
    let mut colors: HashMap<&str, Color> = assets.keys().map(|key| (*key, Color::White)).collect();
    for start in assets.keys() {
        if colors.get(start) == Some(&Color::Black) {
            continue;
        }
        let mut stack: Vec<(&str, usize)> = vec![(start, 0)];
        colors.insert(start, Color::Grey);
        while let Some((node, index)) = stack.pop() {
            let requires = assets
                .get(node)
                .map(|asset| asset.requires_asset_ids.as_slice())
                .unwrap_or(&[]);
            if index < requires.len() {
                stack.push((node, index + 1));
                let next = requires[index].as_str();
                match colors.get(next).copied().unwrap_or(Color::White) {
                    Color::Grey => return Some(next.to_owned()),
                    Color::White => {
                        colors.insert(next, Color::Grey);
                        stack.push((next, 0));
                    }
                    Color::Black => {}
                }
            } else {
                colors.insert(node, Color::Black);
            }
        }
    }
    None
}

fn is_known_extension_namespace(namespace: &str) -> bool {
    // v0 registry: namespaces reviewed with the v0.2 test format. Unknown
    // namespaces produce a warning and never gain execution power.
    matches!(namespace, "vua.ui" | "vua.warehouse" | "vua.testing")
}

/// Capability ids the engine can map to environment detection/deployment
/// use cases today. New ids join this registry with their engine slice.
fn is_known_capability(id: &str) -> bool {
    matches!(id, "vrchat.avatar.pc" | "vrcft.runtime.general-purpose")
}

// --- pattern helpers (schema regex equivalents) ---

fn is_local_id(value: &str) -> bool {
    let mut chars = value.chars();
    match chars.next() {
        Some(first) if first.is_ascii_lowercase() => {}
        _ => return false,
    }
    value.len() <= 64
        && chars.all(|character| {
            character.is_ascii_lowercase()
                || character.is_ascii_digit()
                || matches!(character, '_' | '-')
        })
}

fn is_hex_lower(byte: u8) -> bool {
    byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte)
}

fn is_uuid(value: &str, version: fn(u8) -> bool) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 36 {
        return false;
    }
    for (index, byte) in bytes.iter().enumerate() {
        match index {
            8 | 13 | 18 | 23 => {
                if *byte != b'-' {
                    return false;
                }
            }
            14 => {
                if !version(*byte) {
                    return false;
                }
            }
            19 => {
                if !matches!(byte, b'8' | b'9' | b'a' | b'b') {
                    return false;
                }
            }
            _ => {
                if !is_hex_lower(*byte) {
                    return false;
                }
            }
        }
    }
    true
}

fn is_uuid_v7(value: &str) -> bool {
    is_uuid(value, |byte| byte == b'7')
}

fn is_uuid_v1_to_8(value: &str) -> bool {
    is_uuid(value, |byte| (b'1'..=b'8').contains(&byte))
}

fn is_sha256_text(value: &str) -> bool {
    let Some(hex) = value.strip_prefix("sha256:") else {
        return false;
    };
    hex.len() == 64 && hex.bytes().all(is_hex_lower)
}

fn is_unity_guid(value: &str) -> bool {
    value.len() == 32 && value.bytes().all(is_hex_lower)
}

fn is_provider(value: &str) -> bool {
    let mut chars = value.chars();
    match chars.next() {
        Some(first) if first.is_ascii_lowercase() => {}
        _ => return false,
    }
    value.len() <= 32
        && chars.all(|character| {
            character.is_ascii_lowercase()
                || character.is_ascii_digit()
                || matches!(character, '_' | '-')
        })
}

fn is_package_id(value: &str) -> bool {
    let mut chars = value.chars();
    match chars.next() {
        Some(first) if first.is_ascii_alphanumeric() => {}
        _ => return false,
    }
    value.len() <= 128
        && chars.all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '.' | '_' | '-')
        })
}

fn is_capability_id(value: &str) -> bool {
    // ^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$
    let bytes = value.as_bytes();
    if bytes.is_empty() || !bytes[0].is_ascii_lowercase() {
        return false;
    }
    let mut segments = 1;
    let mut segment_has_body = false;
    for (index, byte) in bytes.iter().enumerate() {
        if index == 0 {
            continue;
        }
        match byte {
            b'.' | b'-' => {
                if !segment_has_body {
                    return false;
                }
                segments += 1;
                segment_has_body = false;
            }
            b'a'..=b'z' | b'0'..=b'9' => segment_has_body = true,
            _ => return false,
        }
    }
    segments >= 2 && segment_has_body
}

fn is_unity_version(value: &str) -> bool {
    // ^20[0-9]{2}\.[0-9]+\.[0-9]+[abfp][0-9]+$
    let bytes = value.as_bytes();
    if bytes.len() < 11 || &bytes[..2] != b"20" {
        return false;
    }
    let mut index = 2;
    while index < 4 && bytes[index].is_ascii_digit() {
        index += 1;
    }
    if index != 4 || bytes.get(index) != Some(&b'.') {
        return false;
    }
    index += 1;
    let start = index;
    while index < bytes.len() && bytes[index].is_ascii_digit() {
        index += 1;
    }
    if index == start || bytes.get(index) != Some(&b'.') {
        return false;
    }
    index += 1;
    let start = index;
    while index < bytes.len() && bytes[index].is_ascii_digit() {
        index += 1;
    }
    if index == start || !matches!(bytes.get(index), Some(b'a' | b'b' | b'f' | b'p')) {
        return false;
    }
    index += 1;
    let start = index;
    while index < bytes.len() && bytes[index].is_ascii_digit() {
        index += 1;
    }
    index > start
}
