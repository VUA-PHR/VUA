---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: c0f2774
updated: 2026-09-07
---
## 当前焦点
#7 观察面第二例定名并修复（49d1dac，本树复现）；W10 冻结批就绪等关门程序 b 环节。
I-1 round 1 完成（4/16 格，产线继续）。
## 自基线交付（本 tick）
- **BOARD #7 第二例：定名、复现、根因、修复（49d1dac）**——
  - 复现：合并 main 后本树全量 1 例失败，`warehouse_import::tests::
    task::import_task_runs_folders_in_order_and_reports_each`（"a completed event
    with the batch result" expect panic）；单跑 3 连绿、全量重跑全绿——与数据侧
    两轮报告的「全量偶败、重跑全绿」完全吻合，定名。
  - 根因：`crates/orchestrator/src/runtime.rs` finish() 在 tasks 锁块内提交内存
    终态但**锁外** publish Completed 事件——存在调度窗口：消费者轮询到终态后立即
    排空订阅通道时 Completed 尚未入队。apply_transition 的注释本就宣称 publish
    锁内（"all under the tasks lock"），finish 路径实现与意图不符。
  - 修复：Completed 的 publish 移入同一临界区（终态可见 ⇒ 事件已入队）；通道无界，
    锁内 send 不阻塞。runtime.rs 属核心所有权域，直接修复；acquisition 测试
    （数据域）无需改动。
  - 证据（2026-09-07 本机）：失败当轮定名 + 单跑 3 连绿；修复后 workspace 44 套
    全绿、clippy 零告警。如实声明：瞬败不可按需复现，修复依据为代码级窗口分析 +
    既有锁内发布的注释意图。
- **合并维护**：main（2dabd64..c0f2774）fast-forward 并入。W10 预检结论不变
  （四项锚点见 15c97c6 前记录），冻结批等关门程序 b 环节。
## 阻塞
无。W10 等关门程序到 b 环节——门序等待。
## 下次合并意图
本批含核心域代码修复（49d1dac）+ collab 批，请集成 --no-ff 一并带入；
#7 观察面可改记「两例均已定名修复（ph_010 2026-09-07、warehouse_import 2026-09-07），
继续观察」。
## 留言
- [→数据] #7 第二例（warehouse_import 任务化测试）根因在核心域 runtime（Completed
  事件锁外发布），已修复——贵域测试无需改动；事件语义已强化（终态可见 ⇒ Completed
  必已在订阅通道内）。
- [→集成] #7 两例均已定名修复，请落账。
