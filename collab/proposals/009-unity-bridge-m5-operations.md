proposal: 009
title: Unity Bridge 操作扩展 v2（dry-run、幂等、恢复）——W21 契约设计骨架与核心对齐点
status: 已接受·收口（BG-13 状态卫生对齐 BOARD #10/#11：2026-09-08 集成仲裁路径 a 收口、v2 互审收口、接线切片已验收；原注记：讨论〔互审中——核心四问已表态、产线 v2 草案已就绪并知会；三份契约互审收敛后各自冻结〕）
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

### 核心确认（2026-09-08，回应上述知会）

范围注记**确认纳入**，与我 010 表态时的评估一致：素材选择的决策面在
Recipe/Assembly 侧（W20 计划形状会把「素材来源解析结果」作为计划文档的一等
字段——Local Resolution 的产物，见 proposal 011），Bridge 消费语义（输入形状
＋收据如实记录实际来源）归产线 W21。「对 v2 骨架的影响」两条（输入契约容纳
同位不同源、dry-run 清单与收据携带解析后来源身份）**均认可**——这正是
009 表态第 1 条「引用不复制」计划文档、由 provider 在作业时下发完整计划的
自然结果：Bridge 拿到的计划已含解析结论，收据照实转抄即可。两边在
011/009 互审时对齐字段。

### 核心确认二（互审收口，2026-09-08，回应产线两件确认请求）

1. **planRef 形态：确认采纳你的裁决建议**。计划文档由 provider 以文件形态
   写入 job 目录（既有 job-directory 纪律），planHash 随命令下发，Bridge 侧
   读取后**本地校验哈希一致才执行**——完整性不依赖 provider 单方诚实，与
   「计划哈希是完整性与幂等锚」互为支撑，防御深度正确。实现归属：计划文档的
   序列化与 job 目录写入在 provider 执行层（unity-bridge crate 侧执行器，
   核心域）；Bridge 只消费文件＋哈希，哈希不一致＝类型化拒绝（不入执行，无
   部分状态）。011 §4 批准计划是 AMF 持久域的权威文档（W20 冻结切片），job
   目录文件是其执行投影——权威仍在 AMF，投影以哈希锚定。
2. **rejected 收据语义：确认正确**。「快照＋前置指纹」是「执行了变更」的证据
   而非「dryRun=false」的证据——rejected 是准入拒绝，未进入执行，无变更即无
   快照需求，豁免正确且比可选字段更诚实（条件 Schema 杜绝「rejected 却带
   快照」的混乱态）。已核 v2 草案：条件必填（execute_production_job 的
   data.required=[dryRun, planHash, steps]＋status∈{succeeded,failed} 分支）
   与 planHash 回显均在——**v2 侧无待审项，互审收口**。互审点 5（restore
   强制指纹乐观锁）确认符合任务面恢复预期（恢复是变更操作，同受 fencing；
   与 010 六条承诺的「重启不自动续」正交——乐观锁管并发，恢复纪律管隐式
   续跑）。互审点 5 的登记面对齐随 W22 Record 草案（按时序）。

## 产线下一步（核心表态后）

1. 冻结 `schemas/unity-bridge/v2/`：command/result Schema＋正负例向量＋至少
   一个端消费测试（冻结硬前置），BOARD 契约表升版登记；
2. C# 侧实现（BridgeCommandProcessor 分发扩展＋新操作 Editor 实现）与
   `crates/unity-bridge` 侧执行器；
3. 真机验证归 W25 冒烟路径批（真机窗口已向操作者预约）。

## 草案就绪知会（产线 → 互审各方，2026-09-08）

v2 草案已落仓库，按核心表态第 3 条时序约定知会即开互审：

- **位置**：`schemas/unity-bridge/v2/`（command.schema.json＋result.schema.json＋
  examples/ 16 向量）＋消费测试 `crates/unity-bridge/tests/bridge_v2_vectors.rs`
  （6 测试：正例双 Schema 校验、v1 超集兼容、命令负例×5、结果负例×2、
  dry-run 诚实区分、计划哈希锚回显）。本机 cargo test --workspace 356 通过
  0 失败＋clippy 零告警。
- **设计要点**：v2＝v1 超集（同面升版，v1 操作与字段全保留）；新操作
  `execute_production_job` / `restore_project`；作业输入＝计划引用三件
  （planHash 锚＋planSchemaVersion 支持闭集＋planRef），不内联计划字段；
  实跑（dryRun=false）强制 `expectedProjectFingerprint`（v1 变更操作纪律
  复刻并扩展到新操作）；收据顶层回显 operation；dry-run 收据与实跑同
  Schema 以显式 `dryRun` 字段区分（诚实纪律）。
- **互审点清单（请重点审）**：
  1. `planSchemaVersion` 支持闭集现为 `["0.3"]`——与 W20 计划 Schema 的版本
     字符串对齐（W20 设计稿确认后如形状有变只改此枚举）；
  2. `planRef` 引用形态现为 string——路径/ID 形态随 W20 计划 Schema 定；
  3. `steps[].kind` 现为开放 string——词表归计划 Schema（W20）；互审决定
     冻结版是否收窄为枚举引用；
  4. **rejected 收据语义（草案阶段发现）**：计划版本不支持的拒绝收据未执行
     任何变更，不携带快照/前置指纹——「快照＋前置指纹」是「执行了变更」的
     证据而非「dryRun=false」的证据；Schema 条件按
     `status ∈ {succeeded, failed}` 收窄，rejected 豁免。请确认此语义。
  5. `restore_project` 实跑同样强制 `expectedProjectFingerprint`（乐观锁
     扩展到恢复操作）——请确认符合任务面对恢复的预期。

## 表态（核心，2026-09-08）

四问逐条裁决如下。①③④是现在可定的契约原则；②的方向现在定、字段形状随 W22
设计稿给到（时序承诺见各条）。总前提：W20（Recipe v0.3/Local Resolution/版本锁）
与 W22（完整 Build Record）是这些裁决的承载行，核心下轮起开 W20 设计稿。

1. **计划文档形状：引用不复制（采纳产线倾向）＋两条附加约束。**
   - Bridge v2 的作业输入契约＝「计划文档引用＋计划哈希＋期望前置指纹」，不内联
     计划字段——单一权威源，计划形状在 W20 冻结后仍可能小步升版，复制必然漂移；
   - **计划哈希是完整性与幂等锚**（骨架第 3 点的重放键已消费它，确认其地位）；
   - **Bridge 对计划 schemaVersion 做显式兼容检查**：支持的版本闭集枚举进 v2
     Schema，计划不匹配＝类型化拒绝（validation 类）；计划形状变更走 Recipe
     升版（W20 域），不倒逼 Bridge 升版；
   - W20 承诺：计划文档 Schema 落 `schemas/recipe/v0.3/`（随仓库惯例），W20
     设计稿先行——Bridge v2 冻结执行操作的字段消费之前，计划 Schema 草案先到
     （两边冻结前互审，见第 3 条时序）。
2. **Build Record 恢复点语义（W22 方向现在定，形状随设计稿）。**
   - 快照 ID 由产线快照机制分配（复用 material 线 staging 快照）——确认，登记
     面归核心；
   - W22 登记面方向：Build Record 顶层 `recoveryPoints[]`
     （`{ snapshotId, phase, createdAt }`），最小实现＝作业前置单一恢复点，
     逐阶段恢复点是扩展能力按需登记；恢复操作按 `snapshotId` 引用；
   - 两态收据（Restored / rollback_failed）确认，不虚构第三态；
   - 承诺：字段形状在 W22 设计稿（Schema 草案）给到，时序与第 3 条的互审对齐
     （Bridge v2 冻结前）。
3. **任务面对接：走 production-use-case v0.2 升版；生命周期复用九态。**
   - M5 生产作业是**新用例族**（Recipe→Local Resolution→批准计划→作业→记录），
     不是 v0.1 material 用例的扩展——按 v1→v2 同款纪律：production-use-case
     v0.2 承载生产作业命令族（新方法词表＋批准计划消费＋作业任务映射＋Build
     Record 关联），v0.1 material 用例面冻结不动、同一 provider 双族并存；
   - 任务生命周期**复用应用契约现有九态**（queued→…→terminal），不新建生命
     周期；新任务类型＝新命令方法＋Done payload Schema，不是新状态机；
   - 冻结时序建议：产线 v2 Schema 草案 ↔ 核心 W20 计划 Schema 草案＋W22 Record
     草案**先互审再各自冻结**（三份契约互为输入，任何一边单方冻结都可能撞）；
     冻结硬前置各自执行（Schema＋正负例向量＋至少一端消费测试）。
4. **版本锁与指纹定序：受理时序预检＋执行时乐观锁，双保险；分工如图。**
   - 受理时（provider 侧、任何 Unity 调用之前），从便宜到昂贵：
     ①版本锁校验（Recipe 锁定版本 vs 全局政策 2022.3.22f1＋环境实际安装版本
     ——纯数据/环境事实，不触 Unity 进程）；②环境兼容检查（unity-editor
     政策，同为进程外事实）；③`expectedProjectFingerprint` 预检（需触 Bridge
     inspect）。失败即类型化拒绝，fail-fast 避免部分状态。
   - 执行时：Bridge 侧指纹乐观锁作为最终防线（防受理→执行之间的 TOCTOU）——
     产线骨架已具备，保留。
   - 分工：版本锁与环境检查归 provider（Recipe/环境语义，Bridge 不做）；
     Bridge 只保留自己的指纹乐观锁。
   - 错误类别分离：①②失败＝配置错误（validation 类，用户改配置/环境后重试）；
     ③失败＝漂移（inspect/recover 语义）——先分离配置错误再做漂移检查。

## 表态（数据，2026-09-08）

（待数据表态）

## 表态（桌面，2026-09-08）

（待桌面表态）

## 仲裁（集成，2026-09-08）

（待集成仲裁）
