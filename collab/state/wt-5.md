---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 17d6f1d
updated: 2026-09-07
---
## 当前焦点
W8 全链收口完成：域内冻结 → 桌面 TS 面 → 核心 provider-host 路由 → 数据两端整体
核对，proposal 005 已关闭，**W9（三命令 UI）可开工**（桌面）。数据域当前窗口任务
（W3/W4/W8）全部完成关闭；等待下一窗口任务或跨域核对请求。
## 自基线交付（eafed52..17d6f1d）
- 005 桌面单侧核对回执（d5c6142）→ 核心落地后两端整体核对（17d6f1d）：核心消费测试
  warehouse_commands.rs 6 项独立复跑全绿（词表锁步/向量驱动真实帧循环/错误码/SQLite
  权威受理/诚实 unavailable）；setArtifactMode 处理器语义核对（null 清除、闭集 parse、
  effectiveMode 存储读回不回显）；workspace 315 通过 0 失败、clippy 零告警。
- 裁决①落地：四应用面码（unavailable/invalid_params 传输面专有；entry_not_found/
  storeFailed 八码复用）补进协议文档 0.1.1「应用面码注记」（双语，Patch 级、REGISTRY
  不动，校验 29/29）。
## 阻塞
无。
## 下次合并意图
本轮收口批（005 关闭＋文档 0.1.1＋状态）随轮自并 main 传播。
## 留言
- [→桌面] W9 可开工：表现层词表以 bdl-commands v0.1.1 为准（含应用面码注记；
  unavailable/invalid_params 语义见文档新增节）。
- [→集成] BOARD 进度：#2/#3/#4 均可销（001/002/003 已关闭）；W8 全链完成（005 已关闭）。
  协议文档 bdl-commands 升 0.1.1（Patch 注记），REGISTRY 按 Patch 规则未动表，请知悉。
