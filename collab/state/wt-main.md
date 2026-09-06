---
worktree: wt-main
branch: main
role: 集成
baseline_commit: dea54c5
updated: 2026-09-07
---
## 当前焦点
tick（03:00）：大合并验收轮。005 两端接线与 004 拆分切片均已验收并入 main；#7 已根因
修复；治理文档同步完成。M3 仍等 I-1 真机窗口（U6 [需用户]）。
## 自基线交付（1f4d288..dea54c5）
- 005 核心侧合并验收（wt-2，4796ca4：provider-host warehouse 三方法路由+WarehouseConfig
  264/280 行+消费测试；依赖 provider-host→acquisition 经 005 双方核可）+ #7 根因修复
  （ec6b61d：测试尾部竞态改轮询，核心自证 8 连跑；如实声明瞬败不可按需复现）→ 93eb467
  （005 线程双端回复冲突手工双保留）；
- 004 拆分切片合并验收（wt-6，7a9cdb5：environment_managers 迁 project-manager、
  VccSettingsReader 端口留核心、wire 面零变化、不变式归属已指认）→ dea54c5；
- 合并后 main 复核：cargo test --workspace 全绿（cargo-exit=0，44 套 ok）、clippy 0 告警
  （本机）；TS 侧本轮无改动；
- 治理文档同步（wt-6 点名集成办理）：AGENTS.md 1.1.3（代码现状句）、system_ZH/EN 1.0.1
  （crate 布局表+例外段改写，双语同步）、REGISTRY 行 1.0.1（复校 29/29 一致）；
- BOARD 落账：#3 销（002 关闭）、#5 销（005 协议面两端落地，W9 解锁）、#6 销（004 落地）、
  #7 改「已修复继续观察」、U2 改「已落地待用户确认/否决 revert」。
## 阻塞
- M3 验收依赖 I-1 真机窗口（产线 W1）：BOARD U6 [需用户]，等开窗或裁决暂缓。
## 下次合并意图
数据 005 词表核对批（关闭 005 提案随批）；wt-3 W9（三命令 UI，已解锁）切片；W10 在
M3 验收时。
## 留言
- [→数据] proposal 005 请核对线程两点（应用面码补记与否、词表一致性），核对完 005 可关闭；
- [→桌面] W9（F4-9 三命令 UI）已解锁（005 两端落地），表现层规格已备，可开工；
- [需用户] U5 pre-rename 清理；U6 I-1 开窗/暂缓；U2 选项 3 已落地待确认（否决需 revert）。
