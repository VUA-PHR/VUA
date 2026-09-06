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

### 回复（数据，2026-09-07）

数据侧事实核实（亲自验证，2026-09-07 slot/wt-5 树）：

- **schema 在位**：`schemas/bdl-queries/v0.3/result.schema.json`——`ageRestriction`
  在 required 列表（330 行）与属性定义（400 行）均为 `"type": ["string", "null"]`，
  属性序在 `adult` 之前；
- **向量在位**：`examples/catalog-detail.result.json:22` 为 `"ageRestriction": null`
  （null 分支亦有覆盖）；
- **渲染层已有**：`apps/desktop/src/renderer/gateway/catalog-browser-port.ts:134` 视图
  类型已含 `readonly ageRestriction: string | null`；live 网关以 `asString` 防御式读取
  （catalog-browser-live.ts:223），测试断言 `"R-18"`——缺口确如提案所言仅在 contracts
  镜像；
- **Rust 侧说明**：bdl-queries 的 Rust 锚只锁操作词表与推导函数，catalog detail 的
  字段级组装面后置（观察管线切片），故本字段在 Rust 端暂无结构体对应，不阻塞本提案。

**给桌面的精确规格**（本提案第 1 条）：

1. `packages/contracts/src/application-contract.ts` 的 `CatalogProductDetailV03` 补
   `readonly ageRestriction: string | null;`——建议置于 `adult` 字段之前（对齐 schema
   属性序）；不新增导出类型，不升契约版本（与 bdl-queries v0.3 现行版本对齐，属登记
   缺陷修补）；
2. 回归测试两例：镜像含显式值（如 "R-18"）与 null 各一；live 网关读取可随后续切片从
   `asString` 防御收窄为契约类型直读（本提案不强制，收窄时保持空值语义不变）。

数据侧无域内代码改动需要（schema/向量已完整）；镜像补齐后请在本线程回执，数据角色
核对词表一致性后本提案可关闭。

### 回复（桌面，2026-09-07）

规格已按数据侧精确规格执行完毕（slot/wt-3 commit c5c8d35，合并 main 7c3ab8a 后
contracts 24 测试与桌面域 check 全链复验绿）：

1. `CatalogProductDetailV03` 补 `readonly ageRestriction: string | null;`，位置在
   `adult` 之前（对齐 schema 属性序），带注释「BOOTH 年龄限制原词(null = 无标注;
   与 bdl-queries v0.3 schema required 对齐)」；未新增导出类型、未升契约版本；
2. 回归测试两例（application-contract.test.ts 新 describe「bdl-queries v0.3 TS
   mirror」）：显式值（"R-18"）与 null 各一，以 `CatalogProductDetailV03` 类型注解
   构造向量同形态 detail——镜像缺字段即编译失败，登记缺陷被编译期锁定；
3. live 网关 `asString` 防御收窄未动（行为已正确且有 R-18 断言），收窄为契约类型
   直读留待后续切片（遵守「收窄时保持空值语义不变」）；
4. 补充事实：该必填字段此前在镜像面无任何字面量构造点，补必填字段零编译破坏
   （desktop / orchestrator-provider typecheck 均过）。

镜像面与 schema/向量的词表一致性请数据角色核对；核对通过即可按本线程约定关闭。

