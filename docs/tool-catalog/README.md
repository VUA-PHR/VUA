# VUA Tool Catalog / VUA 工具目录

> Status / 状态: Accepted catalog format / 已接受目录格式  
> Catalog schema / 目录 Schema: `vua.tool-entry/v3`  
> Updated / 更新: 2026-09-02  
> Normative effect / 规范效力: Trust classification, entry metadata, and contribution rules only / 只约束信任分类、条目元数据与贡献规则

This community-maintainable catalog classifies entries by contact with VUA data and authority.
Each entry explains its purpose in natural language. The physical structure is one category directory
plus individual entry files.

本目录面向社区维护，按条目接触 VUA 数据和权威的方式分类。用途由各条目正文以自然语言说明，
实体结构为类别目录加单项条目文件。

```text
tool-catalog/
├─ core/       # trusted built-in VUA behavior / 可信 VUA 内置行为
├─ plugin/     # capability-bounded VUA plugins / 能力受限的 VUA 插件
└─ external/   # independent external software / 独立外部软件
```

| Boundary / 边界 | Test / 判定 | VUA authority / VUA 权限 |
| --- | --- | --- |
| [Core / 本体](core/README.md) | Is it repository-owned behavior built directly into VUA? / 是否是由仓库拥有并直接构建进 VUA 的产品行为？ | Trusted built-in behavior, but only through owned use cases and ports / 可信内置行为，但仍只能走所属用例与端口 |
| [Plugin / VUA 插件](plugin/README.md) | Does a separately packaged extension request VUA capabilities? / 独立扩展包是否请求 VUA 能力？ | Explicit, deny-by-default grants / 显式、默认拒绝的能力授权 |
| [External / 外部集成](external/README.md) | Does independent software own its state and public integration surface? / 独立软件是否拥有自身状态与公开集成表面？ | Independent authority; each VUA-side adapter is separately Core or Plugin / 独立权威；VUA 侧适配器另行归类 |

Kernel and the local UI are stable host surfaces. Core is a trust and catalog classification, not a
runtime module or registration mechanism.

Kernel 与本地 UI 是稳定宿主表面。Core 是信任与目录分类，不是运行时模块或注册机制。

## Entry schema / 条目格式

```yaml
---
catalog_schema: "vua.tool-entry/v3"
id: "stable.unique-id"
boundary: "core | plugin | external"
status: "proposed | planned | experimental | supported | deprecated"
risk: "pending | low | medium | high"
risk_rule: "vua.risk-gate/v1"
delivery: "version, post-1.0, or unscheduled"
maintainer: "VUA-Project or community identity"
distribution: "core | plugin-package | managed-optional | external-connection"
platforms: ["windows"]
capabilities: ["declared.capability"]
---
```

Each bilingual body explains value, classification, included/excluded behavior, data flow,
permissions, failure/degradation, license/redistribution, warnings, acceptance, and removal. Add or
remove one file plus its category README link through an ordinary reviewed Git change. Keep IDs
stable and reserve removed IDs permanently. Supported entries are deprecated before removal when migration
is required.

每份双语正文说明价值、分类、包含/排除行为、数据流、权限、故障降级、许可证/再分发、警告、验收
和移除。社区通过普通 Git 评审变更新增或删除单项文件及类别 README 链接。ID 保持稳定且删除后不得
复用；需要迁移的已支持条目先弃用再移除。

Schema v3 is a pre-release normalization: v2 `built-in.*` IDs became `core.*`, and `vua-plugin.*`
became `plugin.*`. No v2 entry reached `supported`; the old prefixes are reserved and cannot be reused.

Schema v3 是发布前的一次规范化：v2 的 `built-in.*` ID 改为 `core.*`，`vua-plugin.*` 改为
`plugin.*`。v2 条目均处于发布前阶段；旧前缀永久保留。

## Release risk gate / 发布风险门

The release gate derives `risk`. Contributors declare complete capabilities and behavior; the
release check applies [`vua.risk-gate/v1`](risk-gate-v1.md), writes or
verifies the highest matching level, and fails on a mismatch. `pending`, unknown capabilities, or
incomplete data cannot enter a supported release.

发布门派生 `risk`。贡献者完整声明能力和行为，由发布检查应用
[`vua.risk-gate/v1`](risk-gate-v1.md)，写入或核验命中的最高等级；结果不一致即失败。`pending`、
未知能力或资料不全的条目不得进入 supported 发行。

A catalog entry records classification and evidence. Product boundary, architecture, security
review, distribution review, and release gates respectively authorize scope, implementation,
execution, bundling, and publication. Built-in Core behavior and the community plugin host retain
separate trust boundaries.

目录条目记录分类与证据。产品边界、架构、安全评审、分发评审和发布门分别批准范围、实现、执行、
捆绑与发布。内置 Core 行为和社区插件宿主保持独立信任边界。
