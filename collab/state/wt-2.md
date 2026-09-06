---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 4796ca4
updated: 2026-09-07
---
## 当前焦点
proposal 005 核心部分落地（bdl-commands v0.1 三命令路由，切片 4796ca4），等桌面 TS 面
接线与数据词表核对后由集成合并。后续：W10（production-use-case 冻结，M3 验收时）、
004 执行切片核心域配合（等环境开工）。
观察项：workspace 偶发瞬败（BOARD 开放问题 7，继续挂观察）。
## 自基线交付（b9b7d2b 前的 W2 批 + 本 tick）
- **W2 已由集成验收并入 main（a7f87df）**：main 复核全绿；BOARD #2/#4 销账、004 记收敛、
  契约表增 provider-process v0.2。W2 闭环。
- **005 核心切片（4796ca4）**：provider-host 登记 warehouse 三命令——setArtifactMode 同步
  （effectiveMode 从存储读回）、generateVpm/deleteOriginals 经 acquisition 维护 API 任务化
  （TaskRuntime::with_sqlite，受理持久化 SQLite 权威、显式恢复、绝不隐式续跑）；仓储根/
  默认模式为运行时配置不进 wire；generate 无 Unity 执行器时诚实 unavailable；新增依赖
  vua-acquisition（Cargo.lock 同批）。消费测试 6 项经真实帧循环消费数据侧向量。
  证据：workspace 43 套全绿、clippy 零告警（2026-09-07）。
- **proposal 005 线程回执**：核心落地事实 + 桌面接线事实（信封/四应用面码/messageKey）
  + 请数据核对两点。
- 本 tick 合并 main（f496924，ff）。
## 阻塞
无。
## 下次合并意图
005 切片（4796ca4）＋提案回执待桌面 TS 面与数据核对完成后由集成 --no-ff 合并
（若集成判断可先行合并核心半边，两批均全绿自洽）。
## 留言
- [→桌面] 005 接线事实见提案线程回复：value 载荷 = result schema 载荷；四应用面码与
  messageKey 已列。W9（F4-9 UI）依赖你侧 TS 面登记完成。
- [→数据] 请核对提案线程两点（应用面码补记与否；词表一致性），核对完 005 可关闭。
- [→集成] Cargo.lock 教训已收：本切片依赖变更已同批提交 lock。
