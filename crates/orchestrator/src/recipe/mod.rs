//! Recipe v2 engine (E-RECIPE smoke, based on proposal `2.0.0-draft.1` and
//! ADR-0005, per user adjudication 2026-08-30): typed document model, schema
//! and invariant validation, UI read model, pure ProjectSpec derivation,
//! document digest and the `vuar2.` share codec. `vuar1` keeps meaning only
//! v1; importers never guess the major version from JSON content.
//!
//! # 中文逐段讲解（E-RECIPE 审阅）
//!
//! 配方引擎负责"可分享、可复现的 Avatar 搭配"这一层的数据处理。四个
//! 子文件各管一段：
//!
//! `model.rs`（数据模型）——RecipeV2 文档的完整 Rust 类型。核心概念：
//! Asset 回答"素材是什么"（来源引用 entityRef/sourceRef + 角色 avatar_
//! base/outfit/hair…），Instance 回答"这次用素材里的哪个入口"（selector +
//! 变体），Relation 声明"入口之间怎么组合"（四种：MA 安装/挂骨骼/
//! 排除对象/设置启用态）。`locked` 是"某次解析的固化结果"——Unity 版本、
//! 精确包版本、来源快照，由引擎生成、随 Recipe 保存，但它是观测不是
//! 第二份期望态（ADR-0005 的四层模型：Intent 与 locked 可分享，
//! Local Resolution 与 Build Record 留在本机）。所有结构都
//! `deny_unknown_fields`：多一个不认识的字段直接拒收，不做兼容性猜测。
//!
//! `validate.rs`（校验）——两层：形状层（schema 里的正则/长度/数量限制，
//! 手写实现：localId、UUIDv7、sha256 文本、包 ID、能力 ID、Unity 版本号）
//! 加 eleven 条跨字段不变量（命名空间 ID 唯一、avatar 实例存在且角色对、
//! instance→asset 引用、requiresAssetIds 无环（DFS 找回边）、关系主体
//! 存在且角色匹配且不自装、变换有限且缩放非零、wardrobe 默认值满足
//! 选择模式、依赖去重、lock 新鲜度、未知能力/扩展降级）。输出是带稳定
//! 错误码的 `RecipeIssue` 列表——每条带 subject（哪个资产/实例/关系
//! 出的问题）、messageKey（前端本地化钥匙）、actions（用户能做什么）。
//!
//! `read_model.rs`(读模型与派生) —— `build_read_model` 把"校验结果 +
//! locked 状态 + 本机解析有无"折算成前端直接渲染的四元组
//! （resolutionState/reproducibility/lockState/issues），复现等级从
//! intent_only 到 locally_reproducible 逐级判定，partial lock 绝不冒充
//! "已完全固化"。`derive_project_spec` 是纯函数：Recipe → 装配计划引擎
//! 的输入（Unity 目标、能力清单、包约束+锁定版本、avatar 入口），
//! 阻断性 issue 存在就拒绝派生；stale lock 降级成浮动约束而不是报错。
//!
//! `share.rs`（分享与摘要）—— digest：JSON 键排序（serde_json 默认
//! BTreeMap）后 SHA-256（`sha2` crate，ORC-DEV-005 登记），产出
//! `sha256:<64hex>`，作为保存冲突检测与计划绑定的文档指纹；
//! `vuar2.` 分享码：JSON → 无填充 base64url（手写 60 行，含 RFC 向量
//! 测试，拒绝填充和标准字母表变体），256KiB 硬上限，前缀/填充/损坏/
//! 版本错误各有稳定错误码。

pub(crate) mod model;
pub(crate) mod read_model;
pub(crate) mod share;
pub(crate) mod validate;

pub use model::{
    AssetResolution, AssetRole, AssetV2, CapabilityRequirement, DependencyV2, EntrypointBinding,
    EntrypointKind, EntrypointSelector, EnvironmentSpec, Fingerprint, FingerprintAlgorithm,
    HumanoidBone, InstallMode, InstanceV2, IssueAction, IssueActionKind, IssueSeverity,
    IssueSubject, LocalResolutionV1, LockState, LockStatus, LockedAsset, LockedPackage,
    LockedPackageSource, LockedResolution, LockedUnity, LockedV1, ObjectBinding, ObjectSelector,
    PackageSourceKind, PerformanceTarget, Platform, PublicSelection, Quaternion, RecipeIssue,
    RecipeReadModel, RecipeV2, RelationV2, ReproducibilityLevel, ResolutionState, SelectionMode,
    SourceRef, TargetSpec, TransformV2, Vector3, WardrobeGroupV2, LOCK_SCHEMA_VERSION,
    RECIPE_SCHEMA_VERSION,
};
pub use read_model::{
    build_read_model, derive_project_spec, AvatarEntry, DerivedProjectSpecV1, PackageSpec,
    SpecCounts, UnityTarget,
};
pub use share::{
    base64_url_decode, base64_url_encode, canonical_json, decode_share_code, document_digest,
    encode_share_code, MAX_DECODED_BYTES, RECOMMENDED_MAX_BYTES, SHARE_PREFIX,
};
pub use validate::{has_blocking, validate_local_resolution, validate_recipe};
