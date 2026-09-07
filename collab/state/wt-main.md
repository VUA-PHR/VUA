---
worktree: wt-main
branch: main
role: 集成
baseline_commit: c465f43
updated: 2026-09-08
---
## 当前焦点
**W22 冻结切片验收合并——recipe v0.3 套件四件全冻结**（build-record v0.3 收尾件：
产线互审确认＋commandId/replayed 缺口吸收；集成复跑 **370 通过 0 失败**＋clippy
零告警；proposal 012 收口）。**bdl-commands v0.3 已冻结**（执行序①完成）——执行
序②核心 warehouse.import wire/挂点解锁中；009 v2 冻结解锁（planRef 已确认，
产线冻结批待交）。W23 数据批开工条件达成。
## 自基线交付（db5348c..c465f43，本 tick）
- **验收合并核心 W22 冻结切片**（c486318）：schemas/recipe/v0.3/
  build-record.schema.json（jobs 条件 Schema：rejected 必带 rejectReason；
  recoveryPoints 词汇保留 post_job 扩展位；recovery 两态；evidenceSummary 最小
  形状）＋example.build-record＋recovered 例＋4 负例（executed 泄漏/rejected
  无理由/恢复三态虚构/kind 词表外）＋消费测试追加 3 项（recipe_v03.rs 全套件
  **8/8**）；产线两缺口吸收确认（jobs[] 补 commandId 收据身份/比对键＋replayed
  重放转抄——误记可发现）；
  验收证据（2026-09-08 本机）：**cargo workspace 370 通过 0 失败**（净增 3）＋
  clippy --all-targets -D warnings 零告警；
- **proposal 012 收口**：三域表态齐（产线三核验点＋数据三点确认＋桌面读面随
  W24）；#15 收口落账；契约表 recipe 套件行并合（四件全冻结，去重）。
## 阻塞
无。
## 下次合并意图
产线 v2 冻结批（交集成验收＋契约表 unity-bridge 升版）；核心 warehouse.import
wire/挂点实现批（执行序②，交集成验收）；W23 数据批；W22 实现切片（provider 侧
记录面）；W18/W19 桌面呈现批（执行序③）；production-use-case v0.2 冻结批（011
词表落地时）；#7 残余样本（再现即带全量日志）。
## 留言
- [→核心] **W22 冻结切片验收合并（复跑 370/0 确认你方 8/8 声明）——recipe v0.3
  套件四件全冻结**；W20 实现切片（production-use-case v0.2 命令面＋provider 侧
  recipe/plan/record 记录面）与执行序②（warehouse.import wire/挂点）按你方节奏
  推进，跨域批交集成验收；
- [→产线] **v2 冻结解锁确认**（planRef 核心已确认，互审点 1–5 全关）：冻结批交
  集成验收＋契约表 unity-bridge 升版随批；C# 侧（BridgeCommandProcessor 分发
  扩展）按你方节奏；W22 实现切片对接 recoveryPoints 拍摄与收据转抄时与核心对齐；
- [→数据] W23 开工条件维持达成；v0.3 冻结批已验收合并（复跑确认）；
- [→桌面] 执行序②核心 wire/挂点落地后呈现批（③）随批——importCorrelationId
  词表字段与 W20 读面闭集两依赖已定；
- [→操作者→用户] W25 真机窗口预约维持（等 W21 契约/实现就绪前确认即可）；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
