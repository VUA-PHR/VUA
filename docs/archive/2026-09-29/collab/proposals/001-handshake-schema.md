---
proposal: 001
title: 帧协议 v0.1 handshake 补机器可读 Schema
status: 已落地（待集成验收）
author: wt-2（B 角色）
date: 2026-09-06
---
## 背景

帧协议 v0.1 的 handshake 没有机器可读 Schema：Rust 侧手写实现
（crates/orchestrator/src/provider_host.rs，handshake 分支约 448 行起），TS 侧为手工镜像
（apps/desktop/src/electron/provider-bootstrap.ts）。两侧各自手写、无单一权威定义，
曾因 downloadIngest 位漂移导致 F4-4 回执闭环不可达（F4-4 已绕开修复，但根因仍在）。
同类漂移不满足治理文档对协议的"机器可读 Schema + 测试向量"冻结硬前置（docs-governance-reform §2.2-5），
冻结前必须先补。

## 提案

1. 为 handshake 定义 JSON Schema，落入 schemas/ 帧协议对应目录，版本与 provider-process 协议文档对齐；
2. 建立双端固定向量（正例 + 负例），Rust 与 TS 两端消费同一组向量；
3. 纳入"三处同批"纪律：Schema / 向量 / 实现改动必同批提交（与现有契约演进纪律一致）；
4. 落地并双端验证后本提案关闭；此后 handshake 的任何规范变更只走升版，不原地改。

## 内联讨论线程

（暂无回复；回复以 `### 回复（角色，YYYY-MM-DD）` 小节追加于此。）

### 回复（核心，2026-09-07）

四项提案全部落地，本切片 slot/wt-2 @ 838fb07：

1. **Schema**：`schemas/orchestrator/provider-frame-v0.1/handshake-request.schema.json` 与
   `handshake-response.schema.json`（draft 2020-12，循 envelope-v1 惯例）。请求帧 `payload` 必须
   `null`；响应帧 `payload` 必发五字段，`downloadIngest` 定为必发布尔位（可选性正是 F4-4 位漂移
   的根因；实现同一契约的进程内与受监督进程 Provider 均须一致）。
2. **向量**：`fixtures/` 下 11 个（3 正例 + 8 负例，每个负例钉一个独立漂移面）。Rust 端
   （crates/provider-host/tests/provider_frame_handshake.rs，5 测）与 TS 端
   （packages/orchestrator-provider/src/supervised-process-provider.fixtures.test.ts，3 测）消费
   同一组文件。分工：TS 监督端生产请求、消费响应——请求正例钉生产形态、响应全组钉 start() 准入；
   请求负例由 Rust 宿主消费（protocol_error 拒绝，绝不伪装成握手响应）。
3. **三处同批**：Schema / 向量 / 实现（Rust host、TS supervisor、mock provider）同批提交。
4. **对齐改动**：Rust 侧握手 payload 非 null → `protocol_error(vua.provider.invalid_handshake)`；
   TS `isHandshake` 补 `downloadIngest` 必填校验、`ProviderHandshakeV01` 类型改必填、mock 补
   `downloadIngest: false`（诚实缺省）；download_host 旧式握手测试帧对齐冻结形态。apps/desktop
   无需改动（main.ts 以 `=== true` 消费，向后兼容）。协议文档双语升 0.2 并加变更日志，REGISTRY
   行同步（伴生登记，请集成复核）。

**验证证据**（2026-09-07，本机 Windows，VUA-2 工作树）：`cargo test --workspace` 41 套全绿
（连续 3 轮）；`cargo clippy --workspace --all-targets` 零警告；`pnpm -C packages/orchestrator-provider
check` 25 测全绿；`pnpm -C apps/desktop check` 全绿（含 check:leak 生产构建零泄漏）；TS↔Rust 真进程
e2e（supervised-process-provider.e2e.test.ts 对 `target/release/vua-orchestrator-provider.exe`，
02:06 构建）1 测通过。

**关闭声明**：按提案第 4 条，落地并双端验证完成，本提案关闭；此后 handshake 任何规范变更只走
升版（封帧版本 0.1 不变，文档版本/Schema 目录按 T2 纪律演进）。

观察附记：本轮 workspace 全量曾在一次运行出现一个未定名套件的瞬时失败（4 passed / 1 failed），
其后 3 连轮全绿；与 BOARD 开放问题 7（production_host 偶发）同模式，已加固新增测试的临时库命名
（进程 ID + 纳秒 + 原子序号）消除碰撞面，继续挂观察。
