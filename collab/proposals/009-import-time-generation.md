proposal: 009
title: 素材导入时自动生成的挂点与编排语义（W19 合并设计的任务面裁决）
status: 提出（核心起草；请数据/桌面表态，集成仲裁）
author: wt-2（核心角色）
date: 2026-09-08
---
## 背景（W19；product-boundary 1.2.1 触发时机语义）

product-boundary 1.2.1（集成关门批落账）：「生成 VPM 包替代」的触发时机＝素材
导入时；未接线如实标注（generateNotWired），手动发起仍可用，M5 接线。桌面 W15
二轮修正批（2fa260d）已按导入时语义呈现并如实标注未接线，同时路由跨域需求：
条目落成时若 composed global default = generate_vpm 且守卫允许（有原始件、无
生成副本），自动提交生成任务（仍任务化+审计）；挂点位置与编排语义归核心/数据
裁决。008 不变式继续约束本提案（逐条目/独立审计/高危确认不弱化）。

## 前置事实核实（核心，2026-09-08 本机代码审计）

设计必须建立在以下代码事实上（与桌面核实互补——桌面查的是"生成挂点"，本审计
查的是"导入面本身"）：

1. **导入管线是完整的域内能力，但生产调用面为零**。`WarehouseImporter` →
   `warehouse_import_job` → `submit_warehouse_import`
   （crates/acquisition/src/warehouse_import.rs）已任务化（TaskRuntime 内执行、
   逐 folder 进度事件、folder 边界取消、失败快停保留已导入条目）并有测试；
   **但全仓库无任何生产调用点**：provider-host 无 wire 路由、Electron Main 无
   触发、桌面不调用。
2. **当前生产中 warehouse_items 条目没有任何创建路径**。`create_warehouse_item`
   （bdl_store.rs:1118 唯一 INSERT）的调用方只有导入管线（未接线）与测试
   fixture；`download.ingest` 折叠写 download_events（下载账本）与
   local_artifacts/artifact_mappings（工件与商品映射），不建仓储条目。真实
   产品里仓储条目至今为空（各 UI 的诚实空态一直如实呈现这一点）。
3. 生成挂点已接：`warehouse.generateVpm` wire 路由（核心 10325cd）+ 任务化 +
   桌面 TS 面；生成守卫（有原始件/无生成副本/格式）在任务内评估。
4. composed global default 在 provider 内可得：`store.global_default_mode()`
   （W14）＋ WarehouseConfig.global_default（环境初值）。

**推论：W19 的真正前置是导入面接线本身**——没有 `warehouse.import` 的生产路径，
"导入时"无从谈起。本提案把导入面接线与自动生成挂点作为一体设计；导入面接线
的呈现层归桌面，wire/任务面归核心。

## 待裁决：挂点位置（两路径）

### 路径 A（核心推荐）：provider 编排——挂点在导入任务内的条目落成点

`warehouse_import_job` 的 `import_folder` 成功返回处（`report.entry.
warehouse_item_id` 落库的精确时刻，同线程同闭包）评估：composed global default
= generate_vpm 时，立即以既有 `submit_generate_vpm` 提交独立生成任务（同一
TaskRuntime）。导入与生成是两个独立审计任务；生成守卫照常在生成任务内评估；
生成任务的 correlation 携带来源导入任务标识（审计链关联）。

- 支持：触发时机（导入落库）发生在 provider 任务面**内部**——provider 天然
  在场，编排窗口是同线程紧邻提交，无跨进程等待；"必生成"不依赖桌面在场；
  008 路径 a 的核心优势（高危动作要求用户在场确认）在此**不成立**——生成不
  删除任何东西、不可逆性无关，服务端自动触发无高危确认负担；重复导入→生成
  任务守卫拒绝→独立审计回执如实记录，语义干净。
- 代价：warehouse.import 的 wire 命令面是**新命令面**（导入从未进任何协议——
  需随接线定义并冻结：命令词表+任务规格 Schema+正负例向量+消费测试，按冻结
  硬前置）；导入任务规格扩展（composed global 注入或提交时读取——倾向后者，
  读时求值避免装配期快照）；编排窗口需要与本提案同步的语义定义（见下）。

### 路径 B（备选）：桌面编排——导入 Done 回执后逐条提交 generateVpm

与 008 路径 a 同构：导入回执含 `reports[].entryId`，桌面逐条提交生成。零新增
协议面（除导入面本身），但"导入时自动生成"依赖桌面在场——把一个 provider
内部即可完成的编排强加给桌面，且桌面离线导入（若未来存在后台导入形态）语义
破裂。核心不推荐；若产品侧确认导入永远由用户当面发起，B 可作为低成本替代。

## 编排语义（路径 A 的硬承诺清单；与"绝不隐式续跑"纪律对齐）

1. **独立性**：生成任务提交失败**不影响导入任务的 Done**（导入事实已成立）；
   失败以类型化错误进导入任务的进度/回执注记（`generationSubmitFailed`），
   可手动补发起——不静默、不重试风暴。
2. **逐条目**：每落库一个条目至多提交一个生成任务；守卫拒绝（如无原始件）是
   该生成任务自身的 Failed 审计回执，不回滚导入。
3. **取消边界**：导入批量在 folder 边界取消时，已落库条目已提交的生成任务
   **独立存续**（不随导入取消而取消——它们是独立任务，用户可在任务中心单独
   取消）；未落库 folder 不触发生成。
4. **恢复纪律**：provider 重启后未完成的导入任务→`inspect_required`，不自动
   续导入、不自动补生成（"绝不隐式续跑"）；已提交的生成任务同既有恢复语义。
5. **读时求值**：composed global default 在每个条目落成点读取（persisted ??
   环境初值），不用装配期快照——用户在导入中途改全局默认，后续 folder 按新值。
6. **审计链**：生成任务 correlation 携带 `importCorrelationId` 与
   `warehouseItemId`，任务中心可追溯"这条生成来自哪次导入"。

## 表态请求

- [→数据] 任务规格/协议面：warehouse.import 新命令面的 Schema+向量+消费测试
  冻结硬前置由数据主导（同 bdl-commands 惯例；导入命令归属 bdl-commands 还是
  新词表由数据裁决）；composed global 读时求值点意见；
- [→桌面] 呈现面：导入 UI 形态（拖拽/选择 folder 批）与任务中心呈现；
  generateNotWired 标注的移除时点=本提案接线落账后；
- [→集成] 仲裁与排期：路径 A/B 裁决；导入面接线（wire+任务面）与 W18（008
  接线，桌面）的门序关系——建议同批（导入面是 W18 演示闭环的前置事实）；
- [→产线]（知会）关联缺口评估：生产侧消费 VPM 副本替代原始（装配素材选择按
  生效模式）——属 Unity 生产管线素材选择语义，与 W21（Unity Bridge 操作扩展）
  强相关；建议随 W21 批排期、产线主导核心协作（生效模式查询面
  `effectiveArtifactMode` 已冻结可得），不在本提案范围内设计。

## 表态（数据，2026-09-08）

（待数据表态）

## 表态（桌面，2026-09-08）

（待桌面表态）

## 仲裁（集成，2026-09-08）

（待集成仲裁）
