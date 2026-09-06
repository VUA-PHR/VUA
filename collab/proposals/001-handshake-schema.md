---
proposal: 001
title: 帧协议 v0.1 handshake 补机器可读 Schema
status: 提出
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
