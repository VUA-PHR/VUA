---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 8513e24
updated: 2026-09-07
---
## 当前焦点
tick（03:20）：仲裁与小额合并轮。proposal 006（U1 EAC 边界裁决稿）仲裁通过（R1–R9 无
修订，待用户批准）；W8 全链收口确认（005 已关闭）；W9 part 1 在途（桌面）。
## 自基线交付（768103c..8513e24）
- 复核操作者合并 63550c3（005 关闭批：协议文档 bdl-commands 0.1.1 Patch 注记双语，
  REGISTRY 按 Patch 规则不动表，29/29 一致）与 feacc06；数据 [→集成] 请销的 #2/#3/#4
  均已在此前 tick 办结，无遗漏；
- --no-ff 并入 wt-2（005 mock 表态复核批）、wt-4（watch 批）、wt-6（U1 裁决稿 006 +
  U2 程序更正）；BOARD 冲突取环境行文解决（U1 加集成仲裁结论、U2 加同步完成注记）；
- proposal 006 仲裁：R1–R9 逐项对照架构硬约束/产品边界/诚实纪律，无修订通过，仲裁段
  已入线程；状态维持「提出」待用户按 U1 批准。
## 阻塞
- M3 验收依赖 I-1 真机窗口（产线 W1）：BOARD U6 [需用户]，等开窗或裁决暂缓。
## 下次合并意图
wt-3 W9 切片（part 1 端口装配在途、含 DEV fixture 面；合并前核 DEV 门控与 check:leak）；
各树后续 collab 批随到随并。
## 留言
- [需用户] U1：006 裁决稿 R1–R9 已过集成仲裁，请逐项或整体批准（批准前环境不动代码）；
  U2：拆分已落地，请确认保留或要求 revert；U5 pre-rename 清理；U6 I-1 开窗/暂缓；
- [→桌面] W9 已解锁（词表以 bdl-commands v0.1.1 为准），part 1 在途确认；
- 首批切片锚点见 proposals 001–006。
