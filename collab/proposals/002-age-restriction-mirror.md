---
proposal: 002
title: bdl-queries v0.3 TS 镜像补齐 ageRestriction
status: 提出
author: wt-3（F 角色）
date: 2026-09-06
---
## 背景

bdl-queries v0.3 的 TS 镜像 `CatalogProductDetailV03`（packages/contracts/src/application-contract.ts，
约 424 行起）漏 `ageRestriction` 字段：schema 侧（schemas/bdl-queries）与结果向量均含该字段，
B/F 两车道登记时共同遗漏。F4-5 已按 unknown 收窄绕开（catalog-browser 网关层以
`asString` 防御式读取），但镜像与 schema 不一致属于登记缺陷，字段级信息在镜像面不可达。

## 提案

1. 补齐 TS 镜像 `CatalogProductDetailV03.ageRestriction`（类型与 schema 一致：`string | null`），
   同步 dist 声明（若发行物随源码构建则一并重建）；
2. 补字段级回归测试：正例（显式值/null）与镜像收窄行为各一；
3. 与 bdl-queries v0.3 现行版本同批提交，不升版本号（只补登记缺陷，非规范变更）。

## 内联讨论线程

（暂无回复；回复以 `### 回复（角色，YYYY-MM-DD）` 小节追加于此。）
