# 检查证据文档协议 v0.1（五维检查证据束，M7/BG-4）

[English](inspection-evidence-v0.1_EN.md) | [简体中文](inspection-evidence-v0.1_ZH.md)

> 文档版本：0.1
> 状态：**已冻结**（2026-09-13，proposal 016 §7 冻结硬前置收口：①Bridge 五维
> 产出操作落地并验收〔合并 7d63abe〕＋②核心存储/读路由/任务化驱动落地并验收
> 〔合并 7a262b8〕＋③向量全绿＋消费测试在库；④本协议本双语＋⑤REGISTRY 登记
> 随本冻结批办理）
> 机器可读词表：`schemas/inspection-evidence/v0.1/`（Schema＋正例 2＋负例 5；
> 校验测试 `crates/unity-bridge/tests/inspection_evidence_vectors.rs`；核心
> 消费实现＝InspectionEvidenceStore 第五文档库＋`inspection.get`/`inspection.list`
> 读路由＋任务化 `inspection.requestRun`，proposal 016 硬前置②）
> 范围：一次 Avatar 检查运行跨五个 M7 维度的证据束（功能/性能/依赖/光照/
> 上传准备度）
> 所有权边界：检查证据**不进 BDL**（016 §5／011 §5 收敛决议；与 production-
> evidence 同构）——证据本体持久化于 AMF 生产持久域（核心第五文档库）
> 维护方：产线（BG-4 工单主导；协作核心、环境、数据表态，集成仲裁照单采纳）
> 更新：2026-09-13

## 语义

- **一次检查运行＝一份文档**：`{ schemaVersion, inspectionId, avatarRef,
  performedAt, bridge, dimensions[], overallStatus, notes? }`。
- **五维闭集**（v0.1）：`functional`／`performance`／`dependencies`／
  `lighting`／`upload_readiness`。每维：`status`（pass|warn|fail|
  unavailable）＋`basis`＋`checks[]`。
- **身份**：`inspectionId` 为 uuid v7（AMF 侧生成；与 production-evidence
  的 `evidenceId` 身份惯例同构）。消费方引用之，绝不重推导。
- **basis 诚实纪律**：`bridge_typed_checks`＝Bridge 类型化检查回执；
  `bridge_local_estimate`＝Bridge 本地结构估算（analyze_performance 纪律：
  明示**不是 VRChat 官方性能等级**）；`official_sdk_rating`＝**保留值**——
  官方 SDK 交接切片落地前禁用（schema 不禁、向量与评审禁）；
  `static_analysis`＝无 Bridge 运行的静态分析；`none`＝本运行不可观察。
- **unavailable 维钉死**：schema if/then 强制 `status=unavailable` ⇒
  `basis=none` 且 `checks` 空——无产出操作的维度必须如实缺席，
  **缺席即证据，绝不伪造检查**。
- **聚合规则（声明于实现前，016 §4）**：任一维 fail → `overallStatus=fail`；
  否则任一维 warn 或 unavailable → `warn`；否则 `pass`。
  **unavailable 降级为 warn——不完整的检查不得读作干净通过**。
  规则由向量测试断言。
- **bridge 转抄纪律**：`bridge.editorVersion`／`bridge.bridgeSchemaVersion`
  〔1|2|3〕／`bridge.operations[]`（operation＋commandId＋status）为运行
  环境的**转抄不解释**（照 Build Record jobs[] 纪律；commandId 是收据
  身份/比对键）。checks 的 `code` 为点分命名空间类型化码（同 Bridge
  diagnostics 惯例）；`metrics` 只转抄观察数值，绝不发明推导值。
- **dependencies 维单层裁决**（016 仲裁第 4 点定义权行使，写入冻结件）：
  本维语义＝**Avatar 资产引用完整性**（`inspect_avatar_references` 产出，
  basis=`bridge_typed_checks`）。**manifest 声明完整性不并入**——它是项目级
  事实，由 project-inspection v0.2 承载；需要并读两事实的消费方按各自词表
  分线取数，**引用不复制**（012 `evidenceIds` 先例）。

## 产生方与消费方

- 产生方：Bridge 检查操作（v1 `validate_avatar` 类型化检查＝functional、
  v1 `analyze_performance` 本地估算＝performance、v3 只读
  `inspect_avatar_references`／`inspect_lighting`／`inspect_upload_readiness`
  ＝dependencies/lighting/upload_readiness）——经核心任务化
  `inspection.requestRun` 驱动，逐字转抄、机械聚合、append-only 发布
  exactly-once（`{inspectionId}.json` 身份寻址）；**零操作证据束＝类型化
  失败且不发布**（诚实缺席纪律）。
- 消费方：`inspection.get`（身份寻址返回证据本体原样）／`inspection.list`
  （身份摘要行，**绝不内联 dimensions/checks**——012 引用不复制），
  词表行 `schemas/inspection-queries/v0.1/`（数据域，独立冻结批办理）；
  桌面呈现随 M7 Inspection 页面消费切片。
- 本协议不预设 resolution 生命周期（与 production-evidence 的 resolution
  字段不同构）：检查证据是**不可变观察事实**，后发处理事实引用它，
  不改写它。

## 与 BDL 的边界

BDL（bdl v0.1）不收纳检查证据——其准入规则是素材获取观察事实（011 数据
表态①；016 §5 三方一致）。证据本体持久化在 AMF 生产持久域第五文档库
（InspectionEvidenceStore：append-only、hard_link exactly-once、身份寻址、
缺席根＝诚实空态）。

## 稳定错误码

本协议无命令面，无新增错误码；检查运行的失败语义随任务面
（`inspection.requestRun` 受理形态照 job.execute；零收据＝类型化失败且
不发布），读面错误码随 inspection-queries v0.1 词表行（如
`vua.inspection.unavailable` 诚实缺席）。
