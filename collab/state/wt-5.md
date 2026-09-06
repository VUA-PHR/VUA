---
worktree: wt-5
branch: slot/wt-5
role: 数据
baseline_commit: 3f0ff94
updated: 2026-09-07
---
## 当前焦点
W8 域内部分完成并已并入 main（合并 47d716e）。等待 proposal 005 跨域接线
（核心 provider-host 方法路由、桌面 contracts TS 面）；两端落地并核对词表后 W9 可开工。
下一切片候选：W3（ageRestriction 镜像域内确认）。
## 自基线交付（fe3195c 前后，经 47d716e 并入 main）
- W8 冻结批（0a492e6）：schemas/bdl-commands/v0.1（command/result schema＋4 对正例含
  null 清除分支＋3 负例）；crates/acquisition/tests/bdl_commands_contract.rs 7 项消费
  测试；docs/protocols/bdl-commands-v0.1_ZH/EN 双语协议（REGISTRY 已登记）；
  proposal 005 提出跨域分工。
- 证据：本树 cargo test --workspace 303 通过 0 失败、clippy 零告警、REGISTRY 29/29；
  合并后主库复跑 303 通过 0 失败、clippy 零告警（2026-09-07）。
## 阻塞
- W8 两端接线与 W9 依赖 proposal 005 的核心/桌面动作；等待他角色，非本树可解。
## 下次合并意图
无在途切片；本状态文件随下一切片合并传播。
## 留言
- [→核心] proposal 005：请在 provider-host 登记三方法路由（任务化经 acquisition 的
  submit_*，全局默认与仓储根由 provider 配置注入，不进 wire）。
- [→桌面] proposal 005：请在 packages/contracts 登记三命令 TS 面；另 wt-3 阻塞的
  "catalog 三方法服务面"词表已在 bdl-commands v0.1 冻结，请以该 schema 为准。
- [→集成] 合并后主库首次全量出现 1 例 warehouse_import::tests::task::
  import_task_runs_folders_in_order_and_reports_each 失败（warehouse_import.rs:633，
  "a completed event with the batch result"），单独重跑 5 连绿、全量复跑 303 全绿——
  疑似高负载时序敏感（与 BOARD #7 production_host 同模式）。建议并入 #7 观察面，
  复现即立项。
