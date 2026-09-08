---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 348d87b
updated: 2026-09-09
---
## 当前焦点
**M5 关键路径里程碑：核心 W20 第二刀验收合并**（4849958：production-use-case
**v0.2 十方法 Schema 冻结件**＋RecipeDocumentStore〔baseRevision 乐观并发〕＋
provider-host recipe 命令面〔save/get/list 三路由〕；集成复跑 **401 通过 0 失败**
＋clippy 零告警）。**注记**：协议本 v0.2 文档与 REGISTRY 升版未随批（待核心批）；
resolve/plan/job/record 路由第三刀随锚点。W25 前置②已落地，①推进中、③待①。
## 自基线交付（f38cbaa..HEAD，本 tick）
- **验收合并核心 W20 第二刀**（4849958，核心/provider-host 域 1496 行）：十方法
  Schema 冻结件（schemas/production-use-case/v0.2/methods/：recipe-save
  baseRevision 乐观并发/get/list〔catalog 先例闭集〕/resolve 任务化九态/
  plan.approve 幂等/plan.get/list/job.execute 仅 approved＋009 预检/record.get/
  list 六态含 recovered）＋RecipeDocumentStore（AMF 生产持久域文档库，stale
  base＝vua.recipe.revision_conflict 信封携 currentRevision）＋recipe 命令面三
  路由＋production.recipes capability＋wire 正例驱动真实批量导入两 folder 测试；
  011 §7 收敛决议抽查落地（baseRevision＋读面闭集）；
  验收证据（2026-09-09 本机）：合并尖 **cargo workspace 401 通过 0 失败**（净增
  5）＋clippy -D warnings 零告警；
- **带入产线 W21 备案批**（a2ad25e，collab 免测）：W21 code side fully accepted
  ＋W25 前置 1/3 状态备案；
- **带入桌面状态刷新批**（247c0fc 经 aba7b52，collab 免测）；wt-5 兼容确认批
  已并入。
## 阻塞
无。
## 下次合并意图
核心 W20 第三刀批（resolve/plan/job/record 路由＋Local Resolution 执行器）；核心
production-use-case 协议本 v0.2 批（文档＋REGISTRY——时点请声明）；W22 实现切片
批（前置③）；W23 数据批；W18/W19/W24 桌面批；exclude_object 接线批；#7 残余
样本（再现即带全量日志）。
## 留言
- [→核心] **W20 第二刀验收合并（复跑 401/0 确认）——关键路径里程碑**；两件请
  声明时点：①production-use-case **协议本 v0.2 文档＋REGISTRY 行**未随本批
  （Schema 冻结件已入树，协议本待批——第三刀后随批或另行，请知会）；②第三刀
  （resolve/plan/job/record 路由＋Local Resolution 执行器）随锚点的预期；
- [→数据] RecipeDocumentStore 落地（AMF 生产持久域文档库形态，011 收敛决议①
  兑现）——W23 evidenceIds 引用的持久交界已就绪；
- [→产线] W21 code side accepted 备案已入（#11）；executors 接线前置（四语义
  ＋信封 93f841c）就绪；W22 实现切片（recoveryPoints 拍摄＋收据转抄）与核心
  第三刀对齐；
- [→桌面] W24 门控＝production-use-case v0.2 命令面（你方刷新批已入）——第二
  刀 recipe 命令面已落（save/get/list），resolve/plan 第三刀后 W24 开工；
- [→操作者→用户] W25 前置①推进中（第二刀已验收，第三刀随锚点）；②已落地；
  ③待①；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
