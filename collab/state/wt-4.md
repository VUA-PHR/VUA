---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: ecfc51d
updated: 2026-09-08
---
## 当前焦点
**W21 实现切片第一刀已交付**：v2 冻结批（上轮）＋C# 侧实现（协议层 v2＋分发扩展
＋execute_production_job 编排框架＋restore_project 完整实现＋项目快照机制）；四个
计划 kind 的 Unity 执行内核诚实缺口（执行语义待核心 W20 实现切片定义，未知语义
不猜测——known kind 失败返回类型化 job_kind_executor_missing，词表外返回
job_kind_unknown）。C# 无法本机编译验证（无 Unity 窗口），待 W25 真机窗口
EditMode 验证。承担 #7 瞬败样本观察义务（无瞬败不空跑）。
## 自基线交付
- **v2 冻结批**（1a9cdf6，上轮）：Schema 定稿＋协议双语 v2 三件＋REGISTRY v2 行
  （v1 保持已接受，双族并存）＋BOARD 契约表升版；367/0＋clippy 零告警。
- **C# 实现切片第一刀**（本轮，unity/Packages/com.ph-r.vua 本域）：
  - `BridgeProtocol.cs`：payload 增 planHash/planSchemaVersion/planRef/snapshotId；
    新增 BridgeResolvedSource/BridgeStep/BridgePlanJob/BridgePlanDocument（计划
    文档只映射 Bridge 消费面，引用不复制）；BridgeData 增 replayed/dryRun/
    planHash/steps/snapshotId/projectFingerprintBefore/restoredFrom；BridgeResult
    增 operation 回显；
  - `BridgeCommandProcessor.cs`：信封校验接受 schemaVersion 1|2（v1 禁用 v2
    操作）；允许表/变更表/分发扩展两操作；**ExecuteProductionJob**：计划引用
    三件校验→planSchemaVersion 闭集（"0.3"）→planRef 解析（限 .vua/bridge/
    目录内）→**SHA-256 本地校验**（plan_hash_mismatch 拒绝，完整性不依赖
    provider 单方诚实）→计划解析→steps 组装（resolvedSource 转抄）→dry-run
    收据（pending 清单＋预检时点指纹）／实跑（pre_job 快照→逐 job 分发→
    fail-fast 中断）；**RestoreProject**：快照可达性校验→文件级回退（被替换
    内容移入 .replaced 保留区）→AssetDatabase.Refresh→restoredFrom 收据；
    **ProjectSnapshot**：uuidV7 身份（build-record recoveryPoints 惯例）＋
    Assets/Packages/ProjectSettings 三目录复制；
  - **诚实缺口（显式声明，非 stub 冒充）**：四个冻结 kind
    （install_modular_asset/attach_to_bone/exclude_object/set_object_active）
    的 Unity 执行器未接线——其执行语义（selectorId→场景对象解析规则等）由
    核心 W20 实现切片定义；当前实跑遇任何已知 kind 返回
    job_kind_executor_missing 类型化失败（无该作业副作用），词表外返回
    job_kind_unknown；
  - **草案→冻结边界修正**：result Schema 条件 1 按 status∈{succeeded,failed}
    收窄（rejected 收据豁免 dryRun/planHash/steps——计划文件不可读时无合法
    planHash 可回显；与互审点 4「快照是执行了变更的证据」同源）；补 failed
    收据正例向量；快照创建失败改为前置拒绝（snapshot_failed，无快照可引用
    时不得出 failed 收据）；
  - 证据：cargo test --workspace **370 通过 0 失败**（向量 17/6 测试全绿）＋
    clippy 零告警；C# 侧待真机 EditMode 验证（W25 窗口）。
- 本轮合并 main（ecfc51d，W22 冻结切片＋012 收口批；BOARD 冲突融合：本树
  unity-bridge v2 冻结行＋recipe 套件四件全冻结行）。
## 阻塞
- C# 执行内核接线等核心 W20 实现切片的执行语义规格（四个 kind 的 selectorId
  解析/对象定位/MA 组件语义）——规格到达前不猜测执行。
- W25 等真机窗口与合法素材环境变量确认（C# EditMode 验证＋冒烟路径执行）。
## 下次合并意图
**W21 实现切片第一刀**（C# 协议层＋编排框架＋restore 实现＋Schema 边界修正＋
向量，产线域）＋上轮 v2 冻结批（1a9cdf6）请集成验收合并；本批 Rust 全量 370/0
＋clippy 零告警，C# 待真机验证（如实声明）。
## 留言
- [→核心] **执行语义规格请求（W21 执行内核接线的前置）**：四个计划 kind 的
  Unity 执行语义请随 W20 实现切片定义——① install_modular_asset：selectorId
  如何解析为场景对象（选择器注册表在哪个文档/命令面）＋assetId 的来源路径
  解析；② attach_to_bone：bone 命名约定与挂接语义（父子变换即可还是需 MA
  组件）；③ exclude_object：排除的形态（MA ExcludeObject 组件？菜单屏蔽？）；
  ④ set_object_active：objectPath 解析与 active 生命周期（计划执行时一次还是
  持久声明）。规格到达前产线不猜测执行语义。
- [→集成] 两批请验收：v2 冻结批（1a9cdf6：Schema 定稿＋协议双语＋REGISTRY＋
  契约表）＋本批（C# 实现第一刀＋Schema 边界修正＋failed 向量）。C# 无本机
  编译环境，真机 EditMode 验证在 W25 窗口执行（如实声明，不宣称已验证）。
- [→操作者→用户] W25 真机窗口预约维持（C# 实现＋Rust 执行器就绪后执行
  EditMode 验证与冒烟路径）。
- 备忘（维持）：#7 样本协议——遇套件瞬败保留完整 panic 输出回传 [→核心]；
  无瞬败不专门加压空跑。
- （历史留言已消化：#7 抖动数据、W1 脚手架事实、amf-unity 批、009/011/012
  互审批、v2 草案与冻结批验收——均已闭环。）
