# VUA — VRC Ultra Assistant

[English](README.md) | 简体中文 | [日本語](README_JA.md) | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

VUA 是以 Windows 为首要平台、本地优先的 VRChat 桌面生产环境。它把环境部署、授权素材获取、
Avatar 装配与检测、本地素材管理和可复现生产记录组织为一套连贯工作流。

> [!IMPORTANT]
> **当前产品版本为 v0.5.0（pre-alpha）。** 本仓库提供开发预览与早期试用版本；面向普通玩家的
> 稳定性承诺从 `1.0.0` 开始。

## 产品方向

VUA 从用户想得到的结果出发。用户选择目标，例如准备环境或用已选素材制作 Avatar；VUA 规划所需
步骤，通过 Unity Bridge 执行确定性 Unity 操作，验证结果，并保存可复查的 Build Record。

用户选择“终点”，VUA 处理依赖、项目准备、导入顺序、绑定、菜单、优化、验证与恢复等路线。

## 主要模块

- **桌面应用**：Electron、React、TypeScript 与 Vite；使用窄化的类型化 Gateway，并隔离远程网页。
- **Kernel 与应用宿主**：小型 Node.js Kernel 负责启动、桌面安全、Gateway 与 Orchestrator Provider
  生命周期；React UI 构成受控表现层。
- **环境与项目管理**：检测并引导配置 VR、Unity、VRChat 及相关工具；提供基于 `vrc-get` 的 VUA
  包管理器，并兼容 ALCOM 和 VCC 管理的项目。
- **Orchestrator**：Rust 应用核心，负责计划、批准、持久任务、取消、恢复、适配器和 Build Record，
  通过可替换的版本化 Provider 边界接入 Kernel。
- **Avatar MegaFactory（AMF）**：Recipe-first 的生产流程，包含 Warehouse、Recipe、Assembly、
  Inspection、Release 五个用户阶段。
- **BDL（Booth Database Local）**：AMF 私有的本地模块，管理目录、来源、协议、兼容性、搜索和
  Warehouse 映射元数据。
- **Unity Bridge**：面向全球版 Unity `2022.3.22f1` 执行确定性操作的版本化协议；历史项目通过
  已定义的迁移路径接入。
- **桌面与 VR Overlay**：基于稳定应用服务提供状态与引导。
- **插件协议**：计划中的能力声明式扩展边界；首轮交付覆盖协议与宿主安全模型，市场治理由后续
  发行决议安排。

SlimeVR Server、VRCFaceTracking 等运行时集成从 `1.0.0` 发布后开始实施。

## 架构边界

```text
React View
  -> 类型化前端 Feature / Gateway
  -> Electron Preload 与 Main 适配器
  -> 版本化应用契约
  -> Orchestrator 用例
  -> 领域端口
  -> 本地或第三方适配器
```

View 统一通过类型化 Gateway 使用本地能力。远程网页运行在只具备 Web 权限的隔离 Session 中。
AMF 独占 BDL 能力入口；确定性的 Unity 修改统一经过 Unity Bridge。

## 安全与分发边界

- 平台购买、付费、身份、年龄、认证与访问控制保持权威。
- BOOTH 会话、订单、下载、付费素材与生产状态保留在用户设备。
- 仓库与云端 CI 测试使用结构具有代表性、但不含真实商品或用户内容的合成数据；本地只读兼容性
  测试可以访问公开 BOOTH 页面。
- 开发者可以在本地使用自己合法取得的素材验证 Unity 工作流；付费素材、用户项目、凭据、网页
  捕获内容、生产数据和私人日志均保留在本地。
- 每个第三方二进制在随包分发前都必须单独审查许可证、再分发、更新、签名与 NOTICE 要求。

## 文档与贡献

- [Developer documentation — English](docs/README_EN.md)
- [开发文档 — 简体中文](docs/README_ZH.md)
- [Versioning policy — English](docs/release/versioning_EN.md)
- [版本政策 — 简体中文](docs/release/versioning_ZH.md)
- [Contributing — English](CONTRIBUTING_EN.md)
- [贡献指南 — 简体中文](CONTRIBUTING_ZH.md)

本仓库采用 [Apache License 2.0](LICENSE)。另见 [NOTICE](NOTICE)、[商标说明](TRADEMARKS_ZH.md)和
[第三方声明](THIRD_PARTY_NOTICES_ZH.md)。
产品发行遵循 Semantic Versioning 2.0.0；版本化协议和 Schema 仍保留独立兼容版本。

Copyright 2026 Aran52.
