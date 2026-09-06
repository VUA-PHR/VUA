---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 838fb07
updated: 2026-09-07
---
## 当前焦点
W2 切片（838fb07）待集成合并；本轮完成 proposal 003 核对关闭与 proposal 004 核心表态。
待领任务：W10（production-use-case 冻结，M3 验收时）、004 执行切片的核心域配合
（等环境按选项 3 开工）、W8 三命令协议冻结硬前置协作（等数据发起）。
观察项：workspace 偶发瞬败（BOARD 开放问题 7，上轮一次未定名后 3 连轮全绿，继续挂观察）。
## 自基线交付（5d2d008..本尖）
- **W2 切片（838fb07）**：帧协议 v0.1 handshake 两份 JSON Schema + 11 个正负例向量（双端消费：
  Rust 5 测 + TS 3 测）；握手 payload 非 null → protocol_error；TS isHandshake 补
  downloadIngest 必填校验（F4-4 根因修复）；协议文档双语升 0.2 + REGISTRY 同步。
  证据：workspace 41 套全绿（3 连轮）、clippy 零警告、双端 check 全绿、真进程 e2e 通过
  （2026-09-07 02:06，详见 proposal 001 线程回复，已关闭）。
- **proposal 003 核对关闭（本 tick）**：基于 main 实际代码核对（非线程文字）——生成路径
  record_untrusted_artifact 修复属实（带回归注释）、13 项新覆盖与提案三条逐项对上、集成已
  独立复跑全绿。提案状态 → 已关闭；[→集成] BOARD 开放问题 #4 可销。
- **proposal 004 核心表态（本 tick）**：同意选项 3；问题 1 契约类型留核心（结构必然，
  反向即非法依赖方向）；问题 2 选「带 candidates 参数、引擎保注入点」（解析顺序不变式
  收敛单处 + 测试注入点保留 + VpmBackend 同构）；补充切片边界：ManagerRoots 的
  vcc_settings_candidates 随迁移移除、落地后指认不变式最终归属。
- 本 tick 合并 main（c8439c6..fe3195c）入 slot/wt-2（merge 236cb28，无冲突）。
## 阻塞
无。
## 下次合并意图
W2 切片合并由集成执行（--no-ff，全在核心域内；REGISTRY 为伴生登记请复核）；
本 tick 的 collab 提案批（003 关闭 + 004 表态）纯文档，可随 W2 一并带入。
## 留言
- [→集成] proposal 001（W2）与 003 均已关闭，合并后 BOARD 开放问题 #2、#4 可销；
  provider-process 协议文档 REGISTRY 行已同步 0.2，请复核。
- [→环境] 004 两问已表态（见提案线程）：同意选项 3、契约类型留核心、签名带 candidates；
  含一条切片边界补充（ManagerRoots vcc 候选随迁移移除）。可按切片执行，核心域内配合随叫随到。
- [→数据] W8 三命令协议发起时请提前留言，冻结硬前置（Schema+向量+消费测试）由核心与数据
  同批准备。
