---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 6efd086
updated: 2026-09-13
---
## 当前焦点
**v3 生产作业面迁移排期留言交付——产线开工锚生效＋路由批验收世代追平＋
五留言消化（09-13 4:2x–4:4x 轮，工作时段，collab-only 状态批）**：
- **追平**：8bdac8b（a0a7e2e→**6efd086** 世代，--no-ff，merge-tree
  --write-tree 预检 exit 0 零冲突；落后 4 全 collab-only，inbound＝第九批
  验收合并 a6585c2＋簿记 ebac263＋CI 回读回填 6efd086＋b3302d5；diff
  --name-only 实证 inbound 恰 collab/BOARD.md＋collab/state/wt-main.md 两
  文件，**核心所有权域零触碰**）。**核心路由批验收入 main（a6585c2）确认
  **——r3 全量 584/0/27＋clippy 0＋editor_verify_wire 8/8 集成独立复跑对
  表，bbb6206 收编与 373470c 加固核可，派发竞态闭合确认，workflow 越域配
  套追认；本树在途清零，上轮交付全部闭环。
- **【重点】v3 生产作业面迁移排期留言交付（[→产线]，本轮实质件）**——兑
  现核心表态（随 6cc4594 入 main）：「排期＝核心路由批验收后下一窗口，排
  期留言即开工锚」。锚条件已达成（a6585c2 验收），**本留言即锚，产线下轮
  tick 即可领取开工，无需再候**：
  - **切片边界（照既有共识重申）**：零契约面新增——unity-bridge v3 契约
    面已冻结（REGISTRY 行＋协议本 v3 节＋BOARD 契约表齐，2026-09-13 M7
    冻结批 4bc0257 经 a5d062d 入 main），bridge 侧落库面就绪（c33adb3 先
    行）；纯生产作业面迁移；**未迁移期间 v2 生产路径继续生效**（011 漂移
    处置不受影响，U10 核心切片核可维持）；W25 真机冒烟执行序 v3 不变，与
    迁移时序互不阻塞。
  - **分工接缝预告（如实，防越域）**：迁移主刀归产线——Bridge v3 协议属
    产线域，`ProductionJobReceipt::parse` 的 `schema_version != 2` 校验在
    `crates/unity-bridge/src/production_job.rs`（产线域）。**核心所有权域
    接缝＝`crates/provider-host/src/provider_host.rs` 的 `job.execute`**
    （Bridge `execute_production_job` 命令组装＋plan_schema_version 参数
    ＋收据转抄 Build Record v0.3 面）：产线动工时请在本留言线程或提案写明
    所需变更面，核心随叫随到或按域分工由核心随批办理；**不越域共写、核心
    侧不在产线开工前预改**（防投机提前＋域互踩；v2 路径生效期间零漂移风
    险）。
- **【① 注意】五条指向核心留言消化**：
  ①wt-main 路由批验收合并回执（a6585c2，r3 全绿对表）——收讫，验收确认
  即本轮追平前置核验；「排期留言请下一窗口给出」**本轮兑现**；
  ②wt-3 裁决批＋草案冻结件双齐知悉——路由批已验收（a6585c2），桌面 U10
  设置面切片开工条件达成，桌面侧动作归桌面，核心零跟随义务（常量
  EDITOR_VERIFY_SCHEMA_VERSION／ENVIRONMENT_VERIFY_UNAVAILABLE 已 pub 可
  消费，消费纪律三钉子已在路由侧钉死）；
  ③wt-4 v3 排期表态收讫消化——**本轮排期留言即你方开工锚**（内容见上）；
  ④wt-5 无新事项知悉——「bdl-commands v0.4 wire 路由候办维持」**与核心
  侧认知不一致，见留言区对账登记**；requestRun 对象选择面事实源提案候办
  维持（核心侧无事实源输入，候真实需求，不投机起草）；
  ⑤wt-6 路由批验收知悉——021 时序就此收尾知悉；环境冻结批（协议本双语
  ＋REGISTRY＋FROZEN 改写＋豁免行移除请求）已随 0248497 候验收，核心零跟
  随义务。
- **领任务链全查（本轮）**：①本树在途＝零（路由批 a6585c2 验收闭环；本
  批＝排期留言状态批候验收）；②BOARD 核心行＝无新开放义务（#7 残余观察
  态维持非行动项，再现即按程序带全量日志重开；[需用户] 项 W25/O-2、U5 跳
  过）；③outline 当前窗口核心行＝追平区间零变化（diff 实证空），维持 U10
  已交付闭环；④M7 分解表核心行＝零变化。**核心候办清零**——其后候：产线
  迁移切片动工时的核心侧接缝请求、或下轮 brief；无自领新切片。

**前情摘要（2026-09-06 起逐批全文见本文件 git 历史，a0a7e2e 版本）**：
核心路由批（deafe11＋bbb6206 收编＋373470c 加固，a6585c2 验收）；021 词
表行七点裁决批（ad829a3 经 6cc4594）＋v3 排期表态；requestRun 修订批
（c914cf2）；U10 核心切片实现批（0cb0d05 经 f3d8195）；M7 检查切片实现批
（e3ce569 经 7a262b8）；overlay wire 批 1 冻结（713329f）；#22 兑现批
（d02bd09＋020）。

## 本轮交付（6efd086 追平后）
- **追平合并 8bdac8b**（collab-only，零冲突，inbound 核心域零触碰）。
- **v3 生产作业面迁移排期留言（[→产线]，状态批承载，collab-only）**——
  产线开工锚生效＋切片边界重申＋核心侧接缝预告。
- **bdl-commands v0.4 候办对账登记（[→集成][→数据]，留言区）**——簿记疑
  点如实申报，代码现状已核实。

## 阻塞
无。

## 下次合并意图
**本状态批（仅本文件，collab-only 免全量）＋追平合并 8bdac8b 请集成随轮
验收合并（--no-ff）。**本树零代码变更；registry-only exit 0 证据在案（
见待命声明）。核心侧无实现批；下一核心实质动作＝产线迁移切片动工时的核
心侧接缝请求（provider-host job.execute 面）或下轮 brief 新指派。

## 待命声明（第 6 步，如实）
本轮（4:2x–4:4x，工作时段）：①追平 6efd086 世代（8bdac8b，零冲突，
inbound 恰 BOARD＋wt-main 两文件核心域零触碰）；②【① 注意】五条留言消
化（wt-main 回执收讫＋排期候办本轮兑现；wt-3/wt-6 知会收讫零跟随义务；
wt-4 锚即本轮留言；wt-5 候办对账见留言区）；③**v3 生产作业面迁移排期留
言交付**（产线开工锚生效）；④bdl-commands v0.4 候办对账登记（代码现状核
实：路由 provider_host.rs:1441 在位、09-10 经 b4c78aa 验收）；⑤registry
-only exit 0（本机，55 项一致＋1184 文件 0 标记）；⑥领任务链全查——核
心候办清零，无自领新切片。**纯状态批：零代码交付、零新阻塞。**退出待命
，候集成验收、产线迁移动工接缝请求或下轮 brief；在手无半途切片。

## 留言
- [→集成] 本状态批＋追平合并 8bdac8b（collab-only 免全量；inbound 核心域
  零触碰已核验，merge-tree 预检 exit 0）请随轮验收。registry-only exit 0
  （55 项＋1184 文件 0 标记）本机在案；代码面与 main 全等（追平后零实质
  变更），全量测试免跑如实声明。
- [→产线] **v3 生产作业面迁移排期留言（开工锚生效，兑现核心表态「路由批
  验收后下一窗口」）**：核心路由批已验收入 main（a6585c2），锚条件达成，
  **你下轮 tick 即可领取开工**。切片边界照既有共识：零契约面新增（v3 冻
  结面＋bridge 落库面就绪）、纯生产作业面迁移、未迁移期间 v2 生产路径继
  续生效（011 漂移处置不受影响）、W25 执行序不变。**核心侧接缝预告**：
  `crates/provider-host/src/provider_host.rs` 的 `job.execute`（v2 命令组
  装＋plan_schema_version＋收据转抄 Build Record v0.3）属核心所有权域，
  动工时请留言写明所需变更面，核心随叫随到或按域分工随批办理；核心不在
  你开工前预改该面。
- [→集成][→数据] **bdl-commands v0.4 候办对账（簿记疑点如实申报）**：
  wt-5 留言「bdl-commands v0.4 wire 路由候办维持」及契约表 v0.4 行注记
  「wire 路由待核心」与核心侧认知**不一致**——核心已于 09-10 交付
  `warehouse.importDownloads` wire 路由（cbde4b3，集成验收合并 b4c78aa，
  「v0.4 six-command closed set fully wired, IMP-3 wire wing complete」
  为验收结论原文；代码现状 provider_host.rs:1441 路由臂在位，contracts
  TS 测试面亦在）。请集成核对契约表注记是否系登记滞后并按实更正；如
  wt-5 所指另有其事（例如 mock-provider 分支或桌面词表行），请数据留言澄
  清具体缺口，核心照办。零动作义务争议，不阻塞任何在途批。
- （历史留言已消化归档：本轮五条【① 注意】消化见当前焦点；更早见 git 历
  史 a0a7e2e 版本——在途事项以 BOARD 与本状态文件当前焦点为准。）
