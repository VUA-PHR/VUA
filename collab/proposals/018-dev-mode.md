---
proposal: "018"
title: 开发模式基建提案（DEV-only per-port 连接目标——裁决 13 备稿）
status: 草案（裁决 13 方向认可下的备稿；实现排期待集成仲裁）
author: wt-3（桌面）
date: 2026-09-10
---

## 1. 背景与授权链

- 用户 W15 条目 9（C1）：「取消 DEV 场景条，设置-实验性功能选项卡内增加
  『开发模式』打开后可选择单独切换前端各 Provider 状态（而不是现在的按
  套装改状态）」；
- 裁决 13（2026-09-09）：开发模式方向认可——**DEV-only＋切换真实连接目标
  ＋演示徽标恒显**；基建提案可备稿；
- 桌面立场澄清（wt-3 已交）：用户本意是**切换连接目标**（per-port 的
  fixture/live 网关选择粒度，DEV 场景条使用史即场景→网关套装切换的细粒度
  化），**不是前端伪造状态**——后者违反诚实纪律，桌面不会实现。

## 2. 现状（代码实态）

- 装配：`gateway/create.ts` 硬防线——生产构建恒 emptyGateway(not-run) 或
  electron live（window.vua 在位）；DEV 分支按场景名装配 fixture Gateway
  （**套装粒度**：一个场景名决定全部端口的 fixture 数据形态）；
- 入口：`DevScenarioBar`（DEV-only 渲染，生产 Tree-shaking 剔除）——20 个
  场景套装的切换条，整页重载生效；
- 徽标：`gateway.dataSource()` 已有 DataSource 机制（「演示数据」徽标按
  数据源呈现，原则①）；
- 硬防线三件套：`import.meta.env.DEV` 分支＋Rollup 剔除 fixture 模块
  ＋`check:leak` 指纹扫描（159 条，生产构建零命中）。

## 3. 目标形态（方向；细节允许先粗后细，U7① 冲刺授权语)

### 3.1 入口与门控

- **设置-实验性页新增「开发模式」区，仅 DEV 构建渲染**（生产构建零存在，
  三件套防线不变）；
- 开发模式开启（会话级偏好）后呈现 **per-port 连接目标选择**：各领域端口
  独立选 fixture/live——即 C1 的「单独切换前端各 Provider 状态」的合规
  读法＝**切换连接目标**（live=真实 Electron Gateway 链路；fixture=演示
  端口），非伪造运行时状态；
- **DevScenarioBar 退役**：场景套装切换移除（C1 原文「取消 DEV 场景条」）；
  演示数据的快速预览由 per-port 选择覆盖（常用组合可在后续批加预设）。

### 3.2 装配参数化

- `createGatewayState` 增 per-port 选择参数（会话级存储）；
  `fixtureGateway` 演进为**按端口装配**（混合形态：部分端口 live、部分
  端口 fixture——此前套装模式不可表达的组合）；
- live/fixture 边界纪律不变：fixture 端口只提供演示事实，不触发真实
  wire；live 端口走真实 Electron 链路；
- **混合装配的徽标纪律（原则①）**：任一端口 fixture＝页面「演示数据」
  徽标恒显（dataSource 聚合语义：任一演示即演示），per-port 明细在开发
  模式区可见。

### 3.3 端口清单（映射既有 VuaGateway 领域端口）

environment / tutorial / modelProduction / toolCatalog / task / settings /
acquire / warehouseCommands / projectOps / packages——十端口逐一可选
（fixture 数据形态映射既有场景资产，拆套装为端口档位）。

## 4. 纪律与不变项

1. **DEV-only 硬防线三件套全数保留**：生产构建无开发模式 UI、无 per-port
   选择状态、fixture 装配路径不可达（leak 指纹扩展 per-port 选择键）；
2. **诚实纪律全效**：fixture 端口徽标恒显；live 端口失败如实呈现——
   开发模式不是「让一切变绿」的开关，是连接目标选择器；
3. **应用契约零变更**：纯渲染层装配面（contracts/preload/Main 不动）——
   连接目标选择发生在 Gateway 装配点，不新增 wire 词表；
4. **场景资产迁移**：现有 fixture 数据形态按端口拆档保留，不删除已验收
   演示能力。

## 5. 实现批建议与验收

- **批 1**：per-port 装配参数化＋开发模式区 UI（设置-实验性内）＋
  DevScenarioBar 退役＋混合装配测试＋leak 指纹扩展；
- **批 2**（视需要）：常用组合预设＋场景资产按端口拆档补全；
- 验收：check 全链（typecheck/vitest/build/boundary/i18n/contrast/leak）
  ＋「生产构建零开发模式痕迹」的 leak 专项断言；不宣称端到端（连接目标
  切换的开发体验本身即验证对象）。

## 6. 表态请求

- **核心**：确认纯渲染层装配面（contracts/preload/Main 零变更）与既有
  表态一致（017 §11 同型判断——连接目标属桌面域）；
- **集成**：实现排期与验收口径（check 全链＋leak 专项）；
- **数据/环境/产线**：无涉（渲染层装配面）。
