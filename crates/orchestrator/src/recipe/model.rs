//! Serde types for the pre-alpha Recipe v0.2 test format and the private
//! Local Resolution v1 document. Shapes mirror
//! `schemas/recipe/v0.2/recipe.schema.json` / `local-resolution.schema.json`;
//! pattern and cross-field constraints that JSON Schema expresses with
//! regex/`anyOf` are enforced by `validate.rs` (ORC-TYP-007: structure alone
//! is not semantic validity).
//!
//! Strictness note: internally tagged `RelationV02` cannot combine serde's
//! `deny_unknown_fields` with tag discrimination, so unknown keys inside a
//! relation object are ignored until full JSON-Schema validation lands
//! (H-STATE). Every other struct rejects unknown fields.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

pub const RECIPE_FORMAT_VERSION: &str = "0.2";
pub const LOCK_SCHEMA_VERSION: u8 = 1;

// --- Recipe v0.2 document ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct RecipeV02 {
    pub format_version: String,
    pub recipe_id: String,
    pub revision: u64,
    pub title: String,
    #[serde(default)]
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
    pub environment: EnvironmentSpec,
    pub target: TargetSpec,
    pub assets: Vec<AssetV02>,
    pub instances: Vec<InstanceV02>,
    #[serde(default)]
    pub relations: Vec<RelationV02>,
    #[serde(default)]
    pub wardrobe_groups: Vec<WardrobeGroupV02>,
    #[serde(default)]
    pub dependencies: Vec<DependencyV02>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locked: Option<LockedV1>,
    #[serde(default, skip_serializing_if = "map_is_empty")]
    pub extensions: BTreeMap<String, Value>,
}

fn map_is_empty(map: &BTreeMap<String, Value>) -> bool {
    map.is_empty()
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct EnvironmentSpec {
    pub unity_version_constraint: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub capabilities: Vec<CapabilityRequirement>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct CapabilityRequirement {
    pub id: String,
    pub required: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Platform {
    Windows,
    Android,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PerformanceTarget {
    Auto,
    Excellent,
    Good,
    Medium,
    Poor,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct TargetSpec {
    pub platforms: Vec<Platform>,
    pub avatar_instance_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub performance_target: Option<PerformanceTarget>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AssetRole {
    AvatarBase,
    AvatarProfile,
    Body,
    Outfit,
    Hair,
    Accessory,
    Prop,
    ExpressionPack,
    AnimationPack,
    Shader,
    TexturePack,
    MaterialPack,
    ToolDependency,
    Other,
}

impl AssetRole {
    pub fn is_avatar(self) -> bool {
        matches!(self, Self::AvatarBase | Self::AvatarProfile)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct AssetV02 {
    pub id: String,
    pub role: AssetRole,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub entity_ref: Option<EntityRef>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_ref: Option<SourceRef>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub selection: Option<PublicSelection>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub requires_asset_ids: Vec<String>,
    #[serde(default = "default_true")]
    pub required: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extensions: Option<BTreeMap<String, Value>>,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct EntityRef {
    pub entity_id: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct SourceRef {
    pub provider: String,
    pub product_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct PublicSelection {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release_label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub distribution_label: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EntrypointKind {
    AvatarPrefab,
    ModularAvatarPrefab,
    Prefab,
    Asset,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct InstanceV02 {
    pub id: String,
    pub asset_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub variant: Option<String>,
    pub entrypoint: EntrypointSelector,
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub extensions: Option<BTreeMap<String, Value>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct EntrypointSelector {
    pub selector_id: String,
    pub kind: EntrypointKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub catalog_entry_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub name_hint: Option<String>,
}

/// Discriminated by the `kind` tag (schema `oneOf`). Unknown keys inside a
/// relation are ignored by serde (see module docs).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum RelationV02 {
    #[serde(rename_all = "camelCase")]
    InstallModularAsset {
        id: String,
        asset_instance_id: String,
        avatar_instance_id: String,
        mode: InstallMode,
    },
    #[serde(rename_all = "camelCase")]
    AttachToBone {
        id: String,
        asset_instance_id: String,
        avatar_instance_id: String,
        bone: HumanoidBone,
        local_transform: TransformV02,
    },
    #[serde(rename_all = "camelCase")]
    ExcludeObject {
        id: String,
        target_instance_id: String,
        selector: ObjectSelector,
    },
    #[serde(rename_all = "camelCase")]
    SetObjectActive {
        id: String,
        target_instance_id: String,
        selector: ObjectSelector,
        active: bool,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstallMode {
    ConsumeAuthoredSetup,
    GenerateSetup,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HumanoidBone {
    Hips,
    Spine,
    Chest,
    UpperChest,
    Neck,
    Head,
    LeftEye,
    RightEye,
    Jaw,
    LeftShoulder,
    LeftUpperArm,
    LeftLowerArm,
    LeftHand,
    RightShoulder,
    RightUpperArm,
    RightLowerArm,
    RightHand,
    LeftUpperLeg,
    LeftLowerLeg,
    LeftFoot,
    LeftToes,
    RightUpperLeg,
    RightLowerLeg,
    RightFoot,
    RightToes,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct TransformV02 {
    pub position: Vector3,
    pub rotation: Quaternion,
    pub scale: Vector3,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Vector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Quaternion {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub w: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ObjectSelector {
    pub selector_id: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub catalog_entry_id: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub path_hint: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SelectionMode {
    ExactlyOne,
    ZeroOrOne,
    Any,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct WardrobeGroupV02 {
    pub id: String,
    pub label: String,
    pub member_instance_ids: Vec<String>,
    pub selection_mode: SelectionMode,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub default_instance_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct DependencyV02 {
    pub package_id: String,
    pub version_constraint: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub requested_by_asset_ids: Vec<String>,
    #[serde(default)]
    pub optional: bool,
}

// --- locked (public resolution lock) ---

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LockStatus {
    Complete,
    Partial,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct LockedV1 {
    pub lock_version: u8,
    pub recipe_revision: u64,
    pub generated_at: String,
    pub status: LockStatus,
    pub unity: LockedUnity,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub packages: Vec<LockedPackage>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub assets: Vec<LockedAsset>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct LockedUnity {
    pub version: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub revision: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct LockedPackage {
    pub package_id: String,
    pub version: String,
    pub depth: u64,
    pub source: LockedPackageSource,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct LockedPackageSource {
    pub kind: PackageSourceKind,
    pub restorable: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub repository_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub repository_revision: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub artifact_digest: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PackageSourceKind {
    Vpm,
    UnityRegistry,
    Builtin,
    Embedded,
    Local,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LockedResolution {
    Exact,
    LabelOnly,
    Unverifiable,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct LockedAsset {
    pub asset_id: String,
    pub resolution: LockedResolution,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub release_label: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub distribution_label: Option<String>,
}

// --- Local Resolution v1 (private, machine-local; never shareable) ---

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct LocalResolutionV1 {
    pub schema_version: u8,
    pub recipe_id: String,
    pub recipe_revision: u64,
    pub environment_id: String,
    pub resolved_at: String,
    pub assets: Vec<AssetResolution>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct AssetResolution {
    pub asset_id: String,
    pub warehouse_asset_id: String,
    pub artifact_id: String,
    pub artifact_fingerprint: Fingerprint,
    #[serde(default)]
    pub entrypoints: Vec<EntrypointBinding>,
    #[serde(default)]
    pub object_bindings: Vec<ObjectBinding>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Fingerprint {
    pub algorithm: FingerprintAlgorithm,
    pub value: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FingerprintAlgorithm {
    #[serde(rename = "sha256-archive-v1")]
    Sha256ArchiveV1,
    #[serde(rename = "sha256-tree-v1")]
    Sha256TreeV1,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct EntrypointBinding {
    pub selector_id: String,
    pub unity_asset_guid: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub local_file_id: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ObjectBinding {
    pub selector_id: String,
    pub entrypoint_selector_id: String,
    pub local_file_id: i64,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub hierarchy_path_hint: Vec<String>,
}

// --- Issue model (proposal "UI 最小读模型") ---

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IssueSeverity {
    Notice,
    Warning,
    Blocking,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum IssueSubject {
    Recipe,
    Environment { id: String },
    Asset { id: String },
    Instance { id: String },
    Relation { id: String },
    Dependency { id: String },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IssueActionKind {
    LocateLocalAsset,
    ChooseCandidate,
    RefreshLock,
    InspectSource,
    EditRecipe,
    Retry,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IssueAction {
    pub action_id: String,
    pub kind: IssueActionKind,
    pub label_key: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeIssue {
    pub issue_id: String,
    pub code: String,
    pub severity: IssueSeverity,
    pub subject: IssueSubject,
    pub message_key: String,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub parameters: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub actions: Vec<IssueAction>,
}

// --- read model (proposal "UI 最小读模型") ---

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResolutionState {
    Unresolved,
    NeedsInput,
    Resolved,
    LockStale,
    Ready,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReproducibilityLevel {
    IntentOnly,
    VersionLocked,
    LocallyReproducible,
    RebuildVerified,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LockState {
    Missing,
    ValidPartial,
    ValidComplete,
    Stale,
    Invalid,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeReadModel {
    pub recipe: RecipeV02,
    pub resolution_state: ResolutionState,
    pub reproducibility: ReproducibilityLevel,
    pub lock_state: LockState,
    pub issues: Vec<RecipeIssue>,
}
