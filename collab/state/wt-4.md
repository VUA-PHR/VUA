---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: 20ca54c
updated: 2026-09-07
---
## 当前焦点
W1（I-1 真 Unity 矩阵）执行完成：16/16 格全部真机通过（证据在本地 _local_w1/），
请求集成验收并合并 W1 执行批回 main。
## 自基线交付
- 入职与准备轮（2026-09-07 tick 1–8 前半，细节见 git 历史与本树提交 1415625..131fc4d）：
  域现状浏览、main 常备同步、U6 开窗请求升级 BOARD [需用户]、W1 执行计划起草
  （本地 docs/plans/m3-i1-real-matrix-plan_ZH.md：16 格定义+触发手法核实）、
  BOARD #7 ph_010 瞬败复现上报（核心已根因修复）、监视轮维护。
- W1 执行轮一（提交 fb8935e）：窗口前置验证；既有 3 个 #[ignore] 真机测试真机通过
  （P1×S1/S5/S6、P2×S1，4 格）；脚手架升级为复制用户 VCC 项目真实 Modular Avatar 1.11.6
  + NDMF 栈（stub 仅回退），修复真实 NDMF 插件素材编译失败；S1 校准：成功格用自包含
  子集（55MB 成套包），整目录 fuku 两轮真实失败留作 S5/S6 变体证据。
- W1 执行轮二（提交 efd2c3f + 20ca54c）：新增 11 个真机测试，16/16 格全部真机通过。
  P1×S2（边界取消+cancelled 码+收据）、S3（source_drift 首写前）、S4（1s 预算
  bridge_timeout+Restored）、S7（快照损失注入→RollbackOutcome::Failed+rollback_failed
  收据）、S8（重放 351µs 零 Unity）；P2×S2/S3/S4/S5/S6/S7/S8 对应通过（S5 注入为篡改
  第 2 个 import 的 manifest.sha256 触发真实 C# 校验拒绝——事件驱动注入；C# 指纹只追踪
  活动场景层级，Assets 文件注入不影响）。每格 Unity 真实运行，证据 log 在 _local_w1/
  （本地，gitignore）。执行中发现并修复：p2_harness 缺 SDK 种子（NDMF 编译失败）；
  测试清理曾误删本地子集副本（自建副本，原件与备份完好；已移除一切源目录删除行——
  测试永不删源）。另：ph_004 再现一次 #7 型瞬败（重跑全绿，留言报核心）。
## 阻塞
- 无。
## 下次合并意图
**请求集成 --no-ff 合并本树 W1 执行批**（fb8935e、efd2c3f、20ca54c：全部在
crates/unity-bridge/tests 本域 + collab 状态），合并前请复核 _local_w1/ 证据清单与本
状态文件。I-1 门项证据已齐，M3 可验收。
## 留言
- [→核心] BOARD #7 补充：2026-09-07 ~05:15 本树全量跑中 provider_host
  `ph_004_cancel_request_reaches_the_running_worker_token` 瞬败一次（14 passed/1 failed），
  随后 production_host 单独 2 连跑全绿。与已修复的 ph_010 同套件同类时序敏感形态，
  请核心评估是否纳入同一根因修复面。
- [→集成] W1 执行中发现的测试脚手架事实（供验收参考）：staging 模板必须种子 SDK
  （其内嵌 Managed dll 提供 NDMF 编译所需的 System.Collections.Immutable）；C# 指纹
  只追踪活动场景层级。均已固化在 material_exec_real.rs 注释中。
