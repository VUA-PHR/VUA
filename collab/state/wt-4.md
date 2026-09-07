---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 6a570be
updated: 2026-09-08
---
## 当前焦点
**W21 v2 契约草案就绪，三契约互审已开**（产线 v2↔核心 W20↔W22 Record，互审收敛
后各自冻结，禁止单方先冻）。v2 草案（schemas/unity-bridge/v2/）＋16 向量＋6 消费
测试全绿；009 内联「草案就绪知会」列 5 个互审点待审。W25 真机窗口预约维持（等
W21 契约/实现就绪前确认）。承担 #7 瞬败样本观察义务（无瞬败不空跑）。
## 自基线交付
- **unity-bridge v2 契约草案**（2026-09-08，本域）：响应核心对 proposal 009 四问
  表态（引用不复制＋计划哈希锚＋schemaVersion 兼容检查；recoveryPoints[] 方向；
  production-use-case v0.2 升版＋九态复用；受理预检＋指纹乐观锁双保险）：
  - `schemas/unity-bridge/v2/command.schema.json`：v1 超集（10 操作与字段全保留、
    条件逐条同构）＋新操作 `execute_production_job` / `restore_project`；作业输入
    ＝计划引用三件（planHash 锚／planSchemaVersion 支持闭集 ["0.3"]／planRef），
    不内联计划字段；实跑（dryRun=false）强制 expectedProjectFingerprint（v1 变更
    操作纪律复刻并扩展到新操作）；
  - `schemas/unity-bridge/v2/result.schema.json`：v1 全字段保留＋顶层 operation
    回显＋data 扩展（dryRun 显式区分 dry-run/实跑收据——诚实纪律；steps[] 逐操作
    清单，kind 词表归计划 Schema W20；replayed 幂等重放标记；snapshotId/
    projectFingerprintBefore/restoredFrom）；
  - `examples/` 16 向量（正例 9＋命令负例 5＋结果负例 2）；
  - 消费测试 `crates/unity-bridge/tests/bridge_v2_vectors.rs` 6 测试（正例双
    Schema、v1 超集兼容、负例拒绝、dry-run 诚实区分、计划哈希锚回显）；
  - **草案阶段的语义发现**：rejected 收据（计划版本不支持）未执行任何变更，不携带
    快照——「快照＋前置指纹」是「执行了变更」的证据而非「dryRun=false」的证据，
    Schema 条件按 status∈{succeeded,failed} 收窄（已列入 009 互审点 4）；
  - 证据：cargo test --workspace **356 通过 0 失败**（净增 6）＋clippy
    --all-targets 零告警（2026-09-08 本机）。
- **009 内联「草案就绪知会」**：5 个互审点（planSchemaVersion 闭集对齐、planRef
  形态、steps[].kind 词表收窄与否、rejected 收据语义、恢复操作乐观锁扩展）；
  提案 status 更新为互审中。
- 本轮合并 main（6a570be，009 核心表态＋010 收口批）追平。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- W21 v2 冻结等互审收敛：核心 W20 计划 Schema 草案（planSchemaVersion/planRef/
  steps[].kind 的对齐输入）与 W22 Record 草案（recoveryPoints[] 形状），及 009
  五互审点意见；互审前不冻结、不写 C# 实现。
- W25 等真机窗口与合法素材环境变量确认（预约已转操作者）。
## 下次合并意图
本批（v2 草案＋向量＋消费测试＋009/状态，产线域＋collab）请集成随轮带入；本批
测试全绿（356/0＋clippy 零告警），合并验收请复跑确认。
## 留言
- [→核心] **v2 草案就绪，互审开**（009 内联「草案就绪知会」节）：请随 W20/W22
  设计稿起草时对照 5 个互审点给出意见（planSchemaVersion 闭集/planRef 形态/
  steps[].kind 词表/rejected 收据语义/恢复乐观锁）；互审收敛即冻结 v2 并开工
  C# 侧（BridgeCommandProcessor 分发扩展）。
- [→集成] 本批（v2 草案，产线域）随轮带入；BOARD 契约表 unity-bridge 行升版登记
  等互审收敛后随冻结批走，本批不动契约表。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009 登记与 W25
  预约转操作者——均已闭环。）
