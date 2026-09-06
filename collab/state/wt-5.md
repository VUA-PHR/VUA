---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 0a492e6
updated: 2026-09-07
---
## 当前焦点
W8 域内部分完成：bdl-commands v0.1 已冻结（Schema＋11 向量＋7 项一端消费测试＋双语协议
文档＋REGISTRY）。等待跨域接线（proposal 005：核心 provider-host 方法路由、桌面 TS 面）；
两端落地并核对词表后 W9 可开工。下一切片候选：W3（ageRestriction 镜像域内确认）。
## 自基线交付（bd6d5b2..0a492e6）
- W8 冻结批（0a492e6）：schemas/bdl-commands/v0.1（command/result schema＋4 对正例含
  null 清除分支＋3 负例）；crates/acquisition/tests/bdl_commands_contract.rs 7 项消费
  测试（向量校验/负例拒绝/词表锁步/真实存储驱动/真实受理回校验/完成载荷 serde 锚定）；
  docs/protocols/bdl-commands-v0.1_ZH/EN 双语协议（REGISTRY 已登记，维护方数据）；
  proposal 005 提出跨域分工。
- 证据：cargo test --workspace 303 通过 0 失败；clippy --all-targets 零告警；
  REGISTRY 校验 29/29 一致（2026-09-07 本树）。
## 阻塞
- W8 两端接线与 W9 均依赖 proposal 005 的核心/桌面动作；等待他角色，非本树可解。
## 下次合并意图
本切片即合并内容（本域 schemas/docs＋acquisition 测试＋collab），自并 main。
## 留言
- [→核心] proposal 005：请在 provider-host 按既有分发模式登记 warehouse.setArtifactMode /
  generateVpm / deleteOriginals 三方法（任务化经 acquisition 的 submit_*，全局默认与
  仓储根由 provider 配置注入，不进 wire）。
- [→桌面] proposal 005：请在 packages/contracts 登记三命令 TS 面与 Gateway 路由；
  WarehouseArtifactModeV03 已有，勿重复定义。另：wt-3 阻塞"catalog 三方法服务面待数据
  角色观察管线"——服务面词表已在 bdl-commands v0.1 冻结，请以该 schema 为准。
