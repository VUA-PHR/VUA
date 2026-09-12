# Unity Bridge 协议 v3

[English](unity-bridge-v3_EN.md) | [简体中文](unity-bridge-v3_ZH.md)

> 文档版本：v3
> 状态：**已冻结**（2026-09-13，proposal 016 三树表态收口：核心 0:0x 五点、
> 数据 0:2x 四点、桌面 1:4x 三点均零修订意见；冻结批交集成验收）
> 协议版本：3
> 更新：2026-09-13
> 规范效力：有；JSON 结构以 `schemas/unity-bridge/v3/` 为机器可判定来源
> 来源决议：proposal 016（操作形状提案 2026-09-12 23:4x；核心/数据/桌面
> 表态收口，集成仲裁在案）

## 用途与边界

Unity Bridge v3 连接 Orchestrator 与全球版 Unity `2022.3.22f1` Editor Package。
v3 是 v2 的**冻结超集**（同面升版，v1→v2 先例复刻）：v2 的全部操作与字段保留
不变；v3 新增三个 M7 检查只读操作（检查证据五维的产出层）并合法化
`instanceGlobalObjectId` 收据字段。

三族并存（语义对齐不合并）：material 线继续消费 v1（production-use-case
v0.1）；生产作业线继续消费 v2（**v3 冻结不改变生产作业面——provider 生产
作业面迁移 v3 归后续切片，迁移前 v2 生产路径继续生效**）；检查读面消费 v3
（核心任务化 `inspection.requestRun` 驱动，证据转抄进 inspection-evidence
v0.1）。

## Editor 前置条件

沿用 v1/v2：只在 Editor 与项目精确匹配 `2022.3.22f1` 后接受 Bridge 用于生产
执行；版本不匹配以 `bridge.editor_version_unsupported` 拒绝，保持项目原状。

## 传输

沿用 v1/v2 job-directory 纪律（`.vua/bridge/` 原子写入＋
`BridgeEntryPoint.Run`）；v3 零传输面变更。

## 命令信封

请求必须符合
[`command.schema.json`](../../schemas/unity-bridge/v3/command.schema.json)
（`schemaVersion` const 3）。v3 操作全集＝v2 全集（见
[v2 协议](unity-bridge-v2_ZH.md)）＋★三个只读检查操作：

| operation | 模式 | 用途 |
| --- | --- | --- |
| ★ `inspect_avatar_references` | 只读（`dryRun` 恒 true） | Avatar 层级内资产引用完整性的确定性 Unity 观察：丢失网格、丢失材质槽、缺脚本组件（`m_Script` 空引用）——dependencies 维产出层 |
| ★ `inspect_lighting` | 只读（`dryRun` 恒 true） | 活动场景光照事实的确定性枚举：实时（未烘焙）光源存在性、烘焙状态、反射探针存在性——lighting 维产出层 |
| ★ `inspect_upload_readiness` | 只读（`dryRun` 恒 true） | SDK 上传前置的 Unity 侧可观察项：Avatar Descriptor 存在性、VRChat SDK 前置组件（未导入时 `upload_readiness.sdk_absent` 如实告知）、构建目标平台事实——upload_readiness 维产出层 |

三操作的 v3 增量纪律（016 操作形状提案，核心表态核可）：

- **只读**：`dryRun` 恒 `true`（照 v1 检查操作先例）；payload 仅
  `avatarGlobalObjectId`（照 `analyze_performance` 先例）。
- **发现走 diagnostics 类型化码**（点分命名空间，severity 闭集
  info|warning|error）：如 `references.missing_mesh|missing_material|
  missing_script`（error）、`references.clean`（info）、
  `lighting.realtime_lights_present`（warning）、
  `upload_readiness.descriptor_missing`（error）、
  `upload_readiness.sdk_absent`（warning）等。
- **只读观察纪律**：检查码只陈述确定性 Unity 观察事实，不发明主观好坏
  阈值、不冒充官方评级——`official_sdk_rating` 保留值纪律不变（官方 SDK
  交接切片落地前禁用）。
- **result data 零新字段**（`instanceGlobalObjectId` 合法化除外）；v1/v2
  文件零改动，v1/v2 全部向量保持有效；核心枚举 `UnityOperation` 的
  `is_mutating` 闭式列举不含三新操作（核心表态①预声明兑现）。

## 检查收据

结果必须符合
[`result.schema.json`](../../schemas/unity-bridge/v3/result.schema.json)
（`schemaVersion` const 3）。v3 收据＝v2 收据面全部保留＋一处合法化：

- `data.instanceGlobalObjectId`——proposal 011 预留字段自 aa2a9da 引入起
  零赋值的遗留缺陷在本版合法化兑现：`execute_production_job` 的
  `install_modular_asset` 收据写入实例根 GlobalObjectId（空串占位变事实
  转抄）。**v2 漂移声明**：C# 单实现的历史序列化行为（JsonUtility 将空串
  序列化进 v2 收据，与 v2 schema `additionalProperties:false` 冲突）随 v3
  迁移规避；v2 冻结文件零改动。
- 检查操作收据纪律：succeeded 检查收据至少携带一条 diagnostic（完成的
  检查必有结论）且 `changedPaths` 为空（只读操作不改变任何东西）。

## 版本规则

沿用 v2 全部规则；三族并存补充：v1（material 线）/v2（生产作业线）/v3
（检查读面）各自 Schema 冻结、语义对齐不合并；v2→v3 生产作业面迁移归
后续切片，迁移前不得引 v3 为生产作业面已完成。

## 文档变更日志

- v3（2026-09-13）：检查读面协议——`inspect_avatar_references`／
  `inspect_lighting`／`inspect_upload_readiness` 三只读操作（016 §7 硬
  前置①）＋`data.instanceGlobalObjectId` 合法化（011 遗留缺陷兑现）；
  proposal 016 三树表态收口（核心 0:0x／数据 0:2x／桌面 1:4x，零修订
  意见）后冻结。落库面先行先例：schema＋向量 11 件＋Rust 消费测试＋
  C# 实现随锚点实现批（7d63abe）落地，本批为契约面冻结补齐（协议本
  双语＋REGISTRY＋契约表）；C# EditMode 合同测试落地未运行验证（真机
  归 W25），零端到端宣称。
