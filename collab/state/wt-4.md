---
worktree: wt-4
branch: slot/wt-4
role: 产线
baseline_commit: f496924
updated: 2026-09-07
---
## 当前焦点
W1（I-1 真机矩阵）准备就绪；开窗请求已升级 BOARD U6 [需用户]，待用户设置环境变量。
## 自基线交付
- 入职轮（2026-09-07）：collab:brief 四区已读；所有权域现状浏览完毕；main 并入（fast-forward 至 5d2d008）。
- W1 计划轮（2026-09-07，tick 1）：main 并入（d8e8748）；起草 W1 执行计划
  `docs/plans/m3-i1-real-matrix-plan_ZH.md`（该目录为 gitignore 的本地草稿区，文件保留
  本地、不入库、不产生协调效力）——16 格定义（P1/P2 × S1–S8，契约词汇锚定
  material_exec.rs）、既有 3 个 #[ignore] 测试覆盖 4 格的映射、12 格缺口与触发手法
  （S4 用 UnityBatchBridge::with_timeout、S7 用 execute 期间删快照 manifest 注入，
  均已核实可行、无需改 executor）、执行规程与证据格式。真机格遵循「窗口开后写一格
  跑一格校准一格」，本轮不盲写未验证测试。
- tick 2（2026-09-07）：无代码交付。W1 窗口三轮等待无变化（入职/tick1/tick2 环境
  变量均 unset），按升级规则写入 BOARD「待用户裁决」U6 [需用户]：开窗（设
  VUA_UNITY_EXECUTABLE / VUA_REAL_SOURCE_FOLDER 后通知产线）或明确暂缓/调整范围。
  另核实 amf-production v0.2 冻结硬前置已齐备（Rust 端 provider-host/tests/m3_vectors.rs
  与 TS 端 m3-vectors.test.ts 双端消费同一向量目录），协议本冻结无缺口、维持 M3 验收时点。
- tick 3（2026-09-07）：监视轮，无交付。U6 已由集成 --no-ff 带入 main（1cad93d），
  待用户裁决；W1 按规则跳过（[需用户] 不得代决，停止轮询环境变量）。main 合并维护：
  fast-forward 至 fe3195c（带入数据域 W4 测试批、Cargo.lock 补漏、桌面 F4-7/F4-8 批），
  合并后本树 cargo test --workspace 40 套件全绿、clippy 无告警。
- tick 4（2026-09-07）：监视轮，无交付。main 合并维护：fast-forward 至 f496924（带入核心
  W2 契约面：provider-process v0.2、handshake Schema+11 向量、bdl-commands v0.1、
  proposal 002/005 等）。合并后首轮全量跑出现 1 例瞬败（provider_host
  ph_010_mutation_gate_holds_lock_and_marker_during_the_run，14 passed/1 failed）；随即
  provider_host 单独重跑 4 次 + workspace 全量 2 次全绿（42 套件）——与 BOARD #7
  「偶发瞬败、疑似时序敏感」吻合，已留言 [→核心]。
## 阻塞
- W1 真机窗口未开：已升级 BOARD U6 [需用户]，等待用户开窗或裁决暂缓；产线不再重复轮询。
## 下次合并意图
首个切片（W1 执行批）完成并全绿后合并回 main；BOARD U6 行随下次合并由集成带入。
## 留言
- [→核心] BOARD #7 再添一次可考复现（2026-09-07 02:4x，本树 tick 4）：合并 f496924 后
  首轮 `cargo test --workspace` 中 provider_host `ph_010_mutation_gate_holds_lock_and_marker_during_the_run`
  瞬败一次；provider_host 单独 4 连跑与 workspace 全量 2 连跑均全绿。时序敏感疑点未变，
  是否立项由核心裁决（provider-host 属核心域，产线不代修）。
