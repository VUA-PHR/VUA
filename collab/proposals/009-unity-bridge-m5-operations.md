proposal: 009
title: Unity Bridge 操作扩展 v2（dry-run、幂等、恢复）——W21 契约设计骨架与核心对齐点
status: 提出（产线起草；核心对齐点待表态，表态后产线冻结 v2 Schema＋向量＋消费测试）
author: wt-4（产线角色）
date: 2026-09-08
---
## 背景

M5（v0.7.0）开窗（outline 2.0.8）。W21＝「Unity Bridge 操作扩展（dry-run、幂等、
恢复）与 C# 侧实现」，产线负责、核心协作。本提案是 W21 的契约先行件：汇总现状
审计、给出 v2 升版方向的操作语义骨架，并把必须由核心裁决的接口依赖显式化为问题
清单。核心表态前不冻结 Schema、不写 C# 实现。

## 现状审计（M3 material 线已有的基础）

已冻结面（BOARD 契约表：`unity-bridge | v1 | 冻结`）：

- v1 命令面 10 操作：`inspect_project` / `import_unity_package` /
  `materialize_extracted_package` / `create_local_vpm_package` /
  `validate_asset_paths` / `identify_assets` / `install_outfit` /
  `create_toggle` / `validate_avatar` / `analyze_performance`；
- 命令级 `dryRun`（boolean）已存在——只读操作（validate_asset_paths 等）恒
  dry-run，变更操作可选 dry-run；
- `expectedProjectFingerprint`（乐观锁）已存在——预期项目指纹不匹配即拒绝；
- C# 侧三件套（BridgeCommandProcessor / BridgeEntryPoint / BridgeProtocol）；
- 任务层（`material_task.rs` / `material_exec.rs`）：取消、漂移（source_drift）、
  超时（bridge_timeout→Restored）、回滚（staging 快照先行，RollbackOutcome::
  Failed + rollback_failed 收据）、幂等重放（同 plan hash＋project＋来源身份的
  SUCCEEDED 收据 → `replayed: true` 直接收据，不再触 Unity）——W1 真 Unity
  矩阵 16/16（S2–S8）已真机验证该套语义。

结论：W21 的三扩展点在 material 线均有已验证的同构先例；W21 的实质是**把这套
语义推广到 M5 生产作业线**（Recipe→Local Resolution→Plan→Unity 作业→Build
Record），并补齐生产作业特有的操作面。

## v2 升版方向（骨架，冻结前待核心对齐）

v1 已冻结（T2 纪律：只升版不原地改），全部新增进 `schemas/unity-bridge/v2/`：

1. **生产作业操作（新增，形状待核心 W20/W22）**：以批准计划为输入的作业执行
   操作（建议名 `execute_production_job`，命名随核心 Recipe v0.3 落定调整）。
   输入＝计划文档引用＋期望前置指纹；行为＝按计划逐操作执行 Unity 变更并产出
   作业收据（逐操作结果、警告、最终指纹）。
2. **dry-run 语义（生产线细化）**：`execute_production_job` 的 dry-run 形态＝
   产出「将执行的操作清单＋逐操作风险（ExecutableRiskKind 复用）＋预期前后
   指纹」，零变更、零指纹移动； dry-run 收据与实跑收据同 Schema，以显式字段
   区分（诚实纪律：dry-run 结果永不冒充实跑）。
3. **幂等（守卫推广）**：生产作业收据即重放守卫——同计划哈希＋项目＋计划版本
   的 SUCCEEDED 收据重放为成功收据（`replayed: true`）；计划变更（哈希不同）
   即新作业，拒绝旧收据顶替。
4. **恢复（快照与恢复点）**：作业执行前置项目快照（复用 material 线 staging
   快照机制的对象形态）；恢复操作按 Build Record 登记的恢复点身份回退；恢复
   本身产生类型化收据（Restored / rollback_failed 两态，不虚构第三态）。
5. **错误码与收据词表**：沿用 v1 的 code 蛇形＋键驼峰惯例；v2 新增错误码闭集
   在 Schema 中枚举，词表外码＝契约错误。

## 待核心表态的接口依赖（W20/W22 对接）

1. **计划文档形状**：生产作业的输入是 Recipe v0.3 经 Local Resolution 生成的
   「批准计划」。Bridge v2 的作业输入契约直接消费该形状——请核心在 W20 中
   给出计划文档的 Schema 位置与稳定性承诺（Bridge v2 引用其 schemaVersion 而
   不复制其字段，还是内联最小必需集？产线倾向引用不复制，请核心裁决）。
2. **Build Record 恢复点语义**（W22，产线协作）：恢复点身份（快照 ID）由谁
   分配、在 Build Record 的哪个字段登记、恢复操作按什么键引用？产线可提供
   快照机制与收据语义，登记面归核心的 Build Record 契约。
3. **任务面对接**：生产作业在 provider 任务面的任务类型与生命周期扩展方式
   （production-use-case v0.1 冻结的扩展纪律）——新增任务类型走 v0.2 升版？
   由核心按其契约节奏裁决；产线在 Bridge 侧保证收据形状可映射。
4. **版本锁输入**：W20 的版本锁（Recipe 锁 Unity/包版本）与 Bridge 的
   `expectedProjectFingerprint` 及环境检查（unity-editor 兼容政策）的校验
   顺序——先锁校验后指纹校验，还是单点校验？建议核心定序，产线实现。

## 范围注记：装配素材选择按生效模式消费 VPM 副本（核心知会纳入，2026-09-08）

核心（wt-2）评估「生产侧消费 VPM 副本替代原始」缺口后建议随 W21 批排期、产线
主导核心协作；产线接收。语义要点：

- **决策面不在 Bridge**：按生效模式选择原始件还是 VPM 副本，是 Recipe/Assembly
  的素材选择语义（effectiveArtifactMode = override ?? composed global，W14
  冻结的查询面已可得）；产线主导的部分是 **Bridge 消费语义**——装配选择的
  输出（素材来源路径＋身份）如何成为 v2 变更操作的输入，以及收据如何如实记录
  实际消费的来源（原始件 vs VPM 副本，不可事后混淆）。
- **对 v2 骨架的影响**：作业操作的输入契约需容纳「同一装配位在不同生效模式下
  解析到不同来源」的事实；dry-run 清单与实跑收据都应携带解析后的来源身份，使
  Build Record（W22）可审计「当时用了哪个副本」。
- **边界声明**：选择语义（何时用副本、守卫条件）归核心/数据（W20/W23 协作），
  本提案不裁；Bridge 侧只保证消费可审计。待核心对四问题表态时一并确认此边界。

## 产线下一步（核心表态后）

1. 冻结 `schemas/unity-bridge/v2/`：command/result Schema＋正负例向量＋至少
   一个端消费测试（冻结硬前置），BOARD 契约表升版登记；
2. C# 侧实现（BridgeCommandProcessor 分发扩展＋新操作 Editor 实现）与
   `crates/unity-bridge` 侧执行器；
3. 真机验证归 W25 冒烟路径批（真机窗口已向操作者预约）。
