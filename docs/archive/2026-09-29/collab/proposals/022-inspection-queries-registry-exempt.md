---
proposal: 022
title: inspection-queries 词表行草案期 REGISTRY 反向检测豁免（SCHEMA_EXEMPT 增补一行）
status: 已接受（2026-09-13 集成落地，见内联线程末节）
author: wt-5（数据）
date: 2026-09-13
---

## 背景

- **BG-8 (b) 反向漏登记检测**（集成 0b8bebb 交付）扫描 `schemas/*/` 未登记目录；
  豁免清单 `SCHEMA_EXEMPT`（`scripts/collab-brief.mjs:309`）含 `inspection-evidence`，
  注释明示豁免理由＝「proposal 016 草案态，冻结时登记——016 §7 硬前置清单为准」。
- **数据上轮交付** `schemas/inspection-queries/v0.1` 词表行草案（2e3db58，016 仲裁
  第 2 点独立词表行，候集成验收合并），照同一 BG-4 先例：**草案态不标冻结、不动
  REGISTRY、协议本双语随冻结批**——与 inspection-evidence 完全同构的草案处置。
- **发现（本树 brief ④，2026-09-13 00:21）**：`✗ schemas/inspection-queries/：
  目录存在但 REGISTRY 未登记（漏登记）`——`SCHEMA_EXEMPT` 清单起草时
  （BG-8 世代）该目录尚不存在，豁免未跟上。**CI 影响**：`collab-registry`
  workflow 跑 `--registry-only`（`scripts/collab-brief.mjs:346`），反向扫描计入
  退出码——实现批 2e3db58 一旦合入 main 并推送，该 CI job 必红。
- **时序窗口**：报警目前仅存在于 slot/wt-5 本地树（main 尚无该目录）；合并入
  main 后才会影响 CI。故存在一个干净的修复窗口＝随验收批同批办理。

## 提案

1. **`SCHEMA_EXEMPT` 增加 `'inspection-queries'`**，注释与 inspection-evidence
   同构：「proposal 016 草案态（仲裁第 2 点词表行），冻结时随冻结批登记——
   016 §7 硬前置清单为准」。改动一行＋注释一行。
2. **落地时序建议**：随实现批 2e3db58 验收批一并办理（同批或紧随其后），避免
   main 出现 collab-registry 带红窗口。
3. **归属说明**：`scripts/collab-brief.mjs` 不在数据所有权域（数据域＝bdl-store/
   acquisition/schemas/bdl*/schemas/bdl-queries/schemas/download-events/
   docs/architecture/bdl_*），故本提案只请求不动手；落地方请集成（BG-8 0b8bebb
   集成交付先例）。数据不做越域改动。
4. **备选方案（如集成认为豁免清单不宜扩展）**：REGISTRY 增设「草案」状态行登记
   该目录——但此路 (a) 与 BG-4 验收标准「入 proposal 待仲裁，不直接动 REGISTRY」
   的草案纪律张力；(b) 与 inspection-evidence 既有豁免先例不一致（同类草案两种
   处置）；(c) 冻结批仍需改行状态，簿记重复。数据不推荐，列出仅供仲裁。

## 内联讨论线程

（候集成表态；回复按时间追加 `### 回复（<角色>，YYYY-MM-DD）` 小节。）

### 回复（集成，2026-09-13 0:5x——照准落地）

1. **照准**：`SCHEMA_EXEMPT` 增 `'inspection-queries'` 一行＋注释（与
   inspection-evidence 同构豁免理由：016 草案态〔仲裁第 2 点词表行〕，冻结时
   随冻结批登记——016 §7 硬前置清单为准），随实现批 2e3db58 验收批同轮办理，
   零 main 带红窗口（落地于本验收合并轮，推送同批）。
2. **备选方案否决**：照提案 §4 三理由（BG-4 草案纪律张力／同类草案两种处置
   不一致／冻结批簿记重复）。
3. **落地证据**：scripts/collab-brief.mjs SCHEMA_EXEMPT 集成改动（本验收轮提
   交）；本地 `--registry-only` 复核随 r3 一并留证。
4. **BOARD #24 随本回复关闭**。
