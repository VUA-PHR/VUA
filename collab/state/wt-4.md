---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: ce4a1e1
updated: 2026-09-08
---
## 当前焦点
**W21 实现推进中**：C# 切片第一刀（协议层/分发/编排框架/restore）已交付待验收；
本轮追加 **Rust 执行器前置件**（production_job.rs：计划文件写入器＋哈希锚＋v2
收据投影）。v2 命令信封（UnityOperation/UnityPayload/UnityResult）在核心域，
两新操作的枚举/payload 扩展已留言请求核心配合；四个计划 kind 的执行语义规格
亦待核心 W20 实现切片。W25 真机窗口预约维持。承担 #7 瞬败样本观察义务。
## 自基线交付
- **Rust 执行器前置件**（production_job.rs，本轮，产线域）：write_plan_file
  （job 目录原子写入＋planRef 相对引用＋SHA-256 锚；写入前 planSchemaVersion
  闭集闸 "0.3"）＋read_plan_file（读回验证——provider 侧镜像 Bridge 本地哈希
  检查）＋ProductionJobReceipt 投影（v2 收据 typed 解析：executed() 按
  status∈{succeeded,failed}、verified_plan_hash 锚比对）。单元测试 5 项；
  全量 **375 通过 0 失败**＋clippy 零告警（2026-09-08 本机）。**边界如实**：
  命令信封组装等核心扩展 UnityOperation/UnityPayload 后接线。
- **unity-bridge v2 冻结批**（1a9cdf6，已集成验收合并，复跑 376/0）：Schema
  定稿＋协议双语 v2＋REGISTRY v2 行（v1 保持已接受，双族并存）＋BOARD 契约表。
- **C# 实现切片第一刀**（06802b9，待集成验收）：BridgeProtocol v2 协议层
  （payload 四字段＋BridgeResolvedSource/BridgeStep/BridgePlanDocument＋data
  七扩展＋operation 回显）；BridgeCommandProcessor（信封 1|2＋v1 禁 v2 操作＋
  分发扩展＋ExecuteProductionJob 编排框架〔计划读取/本地哈希校验/版本闸/
  steps 转抄/快照/fail-fast〕＋RestoreProject 完整实现〔文件级回退＋.replaced
  保留区＋Refresh〕＋ProjectSnapshot〔uuidV7＋三目录复制〕）；四个冻结 kind
  执行内核诚实缺口（job_kind_executor_missing，语义待核心）；Schema 条件 1
  边界修正（rejected 豁免）＋failed 向量。C# 待真机 EditMode 验证（如实声明）。
- 本轮合并 main（ce4a1e1 世代）追平。
- W1（I-1 真 Unity 矩阵）16/16 已验收合并（M3 关门）；amf-unity 1.0.1 批已合并。
## 阻塞
- v2 命令信封组装等核心对 UnityOperation（两变体）/UnityPayload（四字段）/
  UnityResult（收据字段）的扩展（009/协议 v2 已钉形状，核心按其节奏）。
- C# 执行内核接线等核心 W20 实现切片的执行语义规格（四 kind 的 selectorId
  解析/对象定位/MA 组件语义）——规格到达前不猜测执行。
- W25 等真机窗口与合法素材环境变量确认（C# EditMode 验证＋冒烟路径）。
## 下次合并意图
**W21 实现两批**：v2 冻结批（1a9cdf6，已验收）＋C# 第一刀（06802b9）＋本轮
Rust 前置件，请集成验收合并；Rust 全量 375/0＋clippy 零告警，C# 待真机验证
（如实声明）。
## 留言
- [→核心] **两件协作请求（W21 Rust 侧收口前置）**：① vua-orchestrator 的
  UnityOperation 增 ExecuteProductionJob/RestoreProject 两变体＋UnityPayload
  增 planHash/planSchemaVersion/planRef/snapshotId 四字段＋UnityResult 增 v2
  收据字段（steps/replayed/snapshotId/restoredFrom/projectFingerprintBefore）
  ——形状已由冻结的 schemas/unity-bridge/v2/ 与协议 v2 钉死；② 四个计划 kind
  的执行语义规格（install_modular_asset 的 selectorId 解析/assetId 来源、
  attach_to_bone 的 bone 约定、exclude_object 形态、set_object_active 生命
  周期）随 W20 实现切片给出。到达前产线不猜测、不越域改 orchestrator。
- [→集成] 三批请验收：v2 冻结批（1a9cdf6）＋C# 第一刀（06802b9）＋本轮 Rust
  前置件。Rust 全量 375/0＋clippy 零告警；C# 待真机验证（如实声明）。
- [→操作者→用户] W25 真机窗口预约维持（C# EditMode 验证＋冒烟路径执行）。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案/冻结批验收——均已闭环。）
