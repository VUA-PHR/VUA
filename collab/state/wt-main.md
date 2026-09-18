---
worktree: wt-main
branch: main
role: 集成
baseline_commit: 7313364
updated: 2026-09-18
---
## 当前焦点
**处刑巡检落地批（2026-09-18 17:2x–18:2x，用户裁决直落 main，AGENTS 1.1.4 例外(b) 首例）：全仓审计（处刑人席位）呈报后用户裁定三修项照裁执行——①改 AGENTS.md 工作纪律 #7；②main 直修 poisoned 可见性；③修下载 ingest 重试驱动**：

- **审计结论（巡检报告已呈用户，17:2x）**：仓库总体工程质量高（process.rs 防御工程、SQLite 任务权威、U9 四分法导航、DEV 门控/leak 面均扎实）；查出 [中] poisoned 会话内不可见＝诚实纪律 #2 缺口、[中低] 下载 ingest 失败无自主重试、若干 [低] 卫生项与三处文档矛盾（AGENTS #7 字面与实践冲突、process.ts「唯一进程通道」绝对化声明未记 handoff detach 例外、产品边界 EAC 条款未标注实现面未接线）。
- **修复①（AGENTS.md 1.1.4，随本登记批落地）**：工作纪律 #7 显式声明两类例外——(a) 集成席位 collab 簿记批直落 main（机制见 collab/README.md）；(b) 用户显式裁决的直落；两类均要求登记背书（落库提交或 collab 条目点名权威来源）。此前每夜簿记批按旧字面均属技术性违规，规则文本现与实践及权威顺序（用户裁定优先）对齐；纯规则文本变更零行为变更。
- **修复②（代码批 7313364，核心域＋集成域＋契约面）**：orchestrator runtime——持久化失败瞬间广播**恰一条不落盘**的 PersistenceFailed 事件（revision 内存 bump 保事件流单调，重启按跳号规则回锚权威库）、TaskSnapshot 暴露 poisoned 且 disposition 呈 InspectRequired、污染任务 cancel 返回类型化 vua.task.journal_write_failed 不再假受理；五处 poison 位点（transition/progress/finish/cancel/timeout）全接线，TaskEventKind::PersistenceFailed 入闭集（今日不落盘，sqlite 词表对称收录备未来存储路径）。provider-host——帧循环排水 runtime 事件（warehouse＋project-ops 各一转发线程，use-case 复用 warehouse 实例）：既承载 PersistenceFailed 上 wire，也修复 warehouse/project-ops 任务生命周期通知从未到达 Gateway 的既有缺位（production/demo/download 各有原通道）；task.list/task.get 行对 runtime 持污染任务覆盖 recoveryDisposition=inspect_required（复用重启恢复呈现）；渲染层零改（事件触发既有重取路径即得覆盖呈现，无新文案面）。TS 契约 TaskEventV01 增 task.persistenceFailed{error?}（加法式成员，消费面按 kind 收窄无破坏）。
- **修复③（代码批 7313364，桌面域）**：download.ingest 投递泵自 main.ts 抽出 download-ingest.ts（依赖全注入可单测）；失败整批回灌后按指数退避**自主重试**（1s→×2→封顶 30s，成功一次归零）——回归点：旧实现失败后仅靠新下载事件触发重冲，provider 短暂不可达＋无后续下载＝缓冲无限期滞留、BDL 永不收到该批事实；握手门控/死信留痕/1000 上限/20 条或 1s 批量行为原样保留；8 测例含无新事件回归钉。
- **证据（本机本树 wt-main 直跑，18:0x–18:2x）**：df 实测 C 盘余 651G 后再全量；cargo test --workspace 0 失败（60 条 test-result 行全 ok，含 orchestrator 新增 2 例＋provider-host 新增 2 例）；cargo clippy --workspace --all-targets 0 警告；desktop 双 tsconfig 0＋vitest 79 文件 662/662（＋1 文件＋8 例）；contracts check 66/66；boundary＋i18n＋leak（155 指纹）全过。**如实申报未跑**：pnpm build/打包（provider release 产物被用户 dev 栈 PID 75416 文件锁占用，用户进程绝不动；渲染面由 check:leak 临时构建覆盖）；contrast/forest-leak 未重跑（本批零 CSS/fixture 面变更）；cargo fmt 漂移系全库既有（本批前 90+ 未触碰文件同列，非注册门），如实不动。
- **环境事实**：用户自起 dev 栈运行中（provider PID 75416）绝不动；全部 Rust 验证走 debug profile，不触碰 release 产物锁。
- 上批（终态收口 155ce23，09-18 08:4x）：#36–#39 修复链收束＋候验收队列归零登记；更早批次见本文件 git 历史。

## 阻塞
无。

## 下次合并意图
本批（用户裁决直落）main 两笔（代码批 7313364＋本 AGENTS/登记批）后推送一次，推送债归零。下窗恢复维护姿态：只收同窗新到（簿记/追平照先例随轮验收）；各树落后读数下轮 brief 复测，过 15 触发线照同则自理追平。
**等待项**：（沿用）**用户 #39 HMR 复测回填**（复测点三条见 git 历史登记）；**④′能力面对齐切片与包管理器写入口优先级候用户**；**磁盘清理方案 A/B/C 候用户裁决**（库内无方案文本，候操作者/用户落库）；#31/#32/#33 候用户复验回填；#30 行内剩余＝W25 端到端真机走查；#27/#28/#29 维持；#25/U5 跳过；W26 硬前置不开工；M6/M7/M8 候门序。**新增**：poisoned 可见性修复候操作者真机复验（复验面＝任一任务持久化失败时任务中心即呈 inspect_required 标注而非永久 running；注入手段属诊断切片，候操作者口径，闭环不代记）。

## 留言
- [→各树] **用户裁决直落批知会**：main 落 poisoned 可见性修复＋下载 ingest 自驱重试（AGENTS 1.1.4 例外(b) 首例，权威与本批登记见本文件当前焦点；代码批 7313364）。**注意两处行为变更**：①provider-host 帧循环现在为 warehouse/project-ops 任务发出事件帧——各树既有测试若按「帧数恰一」断言，照 warehouse_commands.rs 先例过滤 response 面；②TS 契约 TaskEventV01 增 task.persistenceFailed 加法变体。渲染层零改（事件触发既有重取，呈现走既有 inspect_required 通道）。各树下窗照常 brief。
- （历史留言已消化归档，在途事项以 BOARD 与本状态文件当前焦点为准。）
