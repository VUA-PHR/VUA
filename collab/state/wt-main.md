---
worktree: wt-main
branch: main
role: 集成
baseline_commit: db5348c
updated: 2026-09-08
---
## 当前焦点
**W20 冻结切片验收合并＋009 互审收口**：schemas/recipe/v0.3/ 三 Schema＋向量＋
消费测试入树（集成复跑 **367 通过 0 失败**＋clippy 零告警，0400bee）；009 互审点
1–5 全关＋核心确认 planRef 形态——**产线可冻结 v2 并开工 C# 侧**。proposal 012
（W22 Record 设计稿）已登记（产线互审三核验点确认＋两缺口建议）。
## 自基线交付（ef9854b..db5348c，本 tick）
- **验收合并核心 W20 冻结切片**（a3a6ce3 经 0400bee）：schemas/recipe/v0.3/
  三 Schema（recipe〔sourceRef warehouse 形态＋vpm_copy 锁对象〕/local-resolution
  〔sourceKind/fallbackUsed/evidenceIds〕/approved-plan〔planHash 锚＋jobs[]
  [.resolvedSource＋无 executed 态＋kind 闭集〕）＋3 正例＋4 负例＋5 项消费测试；
  验收证据（2026-09-08 本机）：**cargo workspace 367 通过 0 失败**（净增 5）＋
  clippy -D warnings 零告警；含 009 互审点 4/5 意见与 011 收敛决议内联；
- **带入产线 012 互审批**（157ffed，collab 免测）：三核验点全部确认＋两缺口建议
  （jobs[] 补 `commandId` 聚合源身份＋`replayed` 转抄）＋互审点 5 关闭（012 §3.1
  与 v2 快照机制一致）；核心已确认 planRef 形态（#14 ①）——**v2 侧无待审项**；
- **proposal 012 登记**（#15，W22 Build Record v0.3 设计稿：授权锚链/逐作业聚合/
  类型化偏差/恢复点/证据摘要；冻结门序＝recipe v0.3 套件收尾件交集成验收）；
- 契约表：unity-bridge 行注记 v2 草案验收合并；新增 schemas/recipe/v0.3 行
  （v0.3 已冻结，W20）。
## 阻塞
无。
## 下次合并意图
产线 v2 冻结批（互审收口后，交集成验收＋契约表升版）；核心 W22 冻结切片批（012
收敛后，套件收尾件）；数据 W23 批＋bdl-commands v0.3 桌面 TS 镜像（如未随批）；
核心 warehouse.import wire/挂点实现批（执行序②）；W18/W19 桌面呈现批；#7 残余
样本（再现即带全量日志）。
## 留言
- [→产线] **互审收口确认（#11/#14）**：核心已确认 planRef job 目录文件形态与
  rejected 豁免——v2 侧无待审项，**可冻结 v2 并开工 C# 侧**（BridgeCommandProcessor
  分发扩展）；冻结批交集成验收＋契约表 unity-bridge 升版随批；012 两缺口建议
  （commandId/replayed）已登记 #15 待核心吸收；
- [→核心] 012 已登记（#15）：产线两缺口建议（jobs[] 补 commandId＋replayed）
  请在 W22 冻结切片吸收；数据（evidenceIds 交界/Record 冻结不等 W23 确认）与
  桌面（recovered 呈现）表态请求维持；执行序②（warehouse.import wire/挂点）
  解锁，按 010 设计开工；
- [→数据] W23 开工条件维持达成（011 收敛＋§5 定稿）；Record 冻结不等 W23
  （evidenceIds 开放身份）的时序请表态确认（012 核验点路由）；
- [→桌面] v0.3 词表（含 importCorrelationId）与 W20 冻结（recipe/plan 读面闭集）
  两依赖均已定——呈现批（③）等核心执行序②落地后随批；
- [→操作者→用户] W25 真机窗口预约维持（等 W21 契约/实现就绪前确认即可）；
- [需用户] U5 维持暂缓（VUA-2/VUA-3 目录清理）。
