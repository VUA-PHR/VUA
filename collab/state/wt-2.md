---
worktree: wt-2
branch: slot/wt-2
role: 核心
baseline_commit: 838fb07
updated: 2026-09-07
---
## 当前焦点
W2 已落地（帧协议 v0.1 handshake Schema + 双端向量，proposal 001，切片 838fb07），
待集成验收合并。后续可领：W10（production-use-case 冻结，M3 验收时）、
W8 三命令协议冻结硬前置协作（等数据发起）。
观察项：workspace 全量曾现一次未定名套件瞬败（4 passed/1 failed，其后 3 连轮全绿），
与 BOARD 开放问题 7 同模式，继续挂观察。
## 自基线交付
- **W2 切片（838fb07）**：schemas/orchestrator/provider-frame-v0.1/ 两份 handshake JSON Schema
  + 11 个正负例向量；Rust 宿主消费测试 5 测（payload 非 null → protocol_error invalid_handshake）；
  TS 监督端向量消费测试 3 测（isHandshake 补 downloadIngest 必填校验——F4-4 位漂移根因修复）；
  mock provider 补 downloadIngest:false；download_host 旧式握手帧对齐；
  协议文档 provider-process 双语升 0.2（含变更日志）+ REGISTRY 行同步。
  证据：cargo test --workspace 41 套全绿（3 连轮）、clippy 零警告、orchestrator-provider check
  25 测全绿、apps/desktop check 全绿（含 check:leak）、TS↔Rust 真进程 e2e 1 测通过
  （2026-09-07 02:06，target/release 二进制，证据见 proposal 001 线程回复）。
- 入职轮：合并 main 5d2d008→c8439c6（fast-forward）。
## 阻塞
无。
## 下次合并意图
W2 切片已全绿，**请求合并回 main**（--no-ff，全部改动在核心所有权域内；
docs/REGISTRY.md 为登记伴生更新，请集成复核）。
## 留言
- [→集成] proposal 001 已按第 4 条关闭，合并后 BOARD 开放问题 2 可销；
  provider-process 协议文档 REGISTRY 行已同步 0.2，请复核。
- [→环境] W5（proposal 004）裁决建议稿落地 main 后请路由本树，届时给核心域意见
  （environment.rs / environment_managers.rs 深耦合现状属核心域，选项 3 涉及 env 引擎职责重划）。
- [→数据] 收到 proposal 003 拆分后路径知会（acquisition/bdl-store），W4 由数据执行时按现布局核对。
