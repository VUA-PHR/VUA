# VUA — VRC Ultra Assistant

[English](README.md) | 简体中文 | [日本語](README_JA.md) | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

> 「Packed up and ready！（整装待发！）」——《红色警戒》MCV 基地车

**VUA（VRC Ultra Assistant）** 是面向 VRChat 玩家的 Windows 桌面生产环境——尤其面向
没接触过 Unity、甚至还不清楚自己需要什么的玩家。从目标和自有素材出发，由 VUA 引导
完成环境准备、工程准备、Avatar 装配、检测与恢复。

> [!IMPORTANT]
> **当前产物：v0.6.0（历史发布标记为 pre-alpha）。** 开发现按 N 序列推进，在作者明确要求前
> 持续处于 Beta，不安排 v1.0.0，也不保证生产安全性。已有实现和自动化测试不代表完整用户
> 流程已经通过；素材管理先进行能力核查，再按实际缺口重做。

## 你可以用 VUA 做什么

- **部署环境。** VUA 检查硬件、软件与网络，按你的目标生成安装方案：只为你的头显
  实际需要的 VR 运行时与驱动、Unity `2022.3.22f1`、VRChat SDK，以及你选用的追踪
  工具。账号注册与授权始终留在官方页面——VUA 负责引导，绝不替你完成认证。
- **学习游戏。** 五页内置教程覆盖入门准备、移动与菜单、值得调整的安全设置
  （`Personal Space`、`Allow Untrusted URLs`、Avatar 显示限制）和你的设备。
  SteamVR 覆盖教程暂未排期，不属于当前 N 序列验收范围。
- **生产 Avatar。** 从仓储挑选素材或导入你拥有的素材，组合成 Recipe，由 VUA 通过
  确定性的版本化 Bridge 在 Unity 内执行装配——导入顺序、绑定、菜单、参数——每步
  都有快照与恢复路径。
- **检测并留存记录。** 每次生产运行都留下一份 Build Record，附检测证据与日志。
  问题同时出现在通知中心与运行记录里；关掉通知不会让问题消失。
- **管理项目与包。** 内置包管理器（基于 `vrc-get`）处理 VPM 仓库订阅、包的
  安装/升级/移除、本地包与新建项目——并与 ALCOM 或官方 VCC 管理的项目保持兼容。
- **分享 Recipe，而不是文件。** Recipe 是一份可分享的文本声明：BOOTH 素材引用加
  明确受支持的选项（颜色、开关、位置旋转缩放等）。它不包含付费素材、自定义贴图
  或网格——复现者通过自己的 BOOTH 权限重新获取素材。

## 它如何工作

VUA 目标先行：你选目的地，它规划路线。向导按你的目标、设备与当前状态选择路径，
不要求所有玩家走完同一条大流程。所有 Unity 改动都经过版本化 Unity Bridge——绝不
用无协议的界面点击代替——有风险的操作必须显式确认，并备有回滚路径。

底层结构：Electron 桌面壳、走窄类型化 Gateway 的 React 界面、拥有用例/持久任务/
恢复的 Rust Orchestrator。详见[架构文档](docs/architecture/system.md)。

## VUA、AMF 与 BDL

| 名称 | 定义 |
| --- | --- |
| **VUA** | Windows 桌面客户端本体——本仓库 |
| **AMF**（Avatar MegaFactory） | VUA 的生产域：Warehouse 仓储、Recipe 配方、Assembly 装配、Inspection 检测、Release 出厂 |
| **BDL**（Booth Database Local） | AMF 私有的本地目录：素材、来源与兼容性记录——在你的磁盘上，不是云服务 |

## 安全边界

- 付费素材只在你的电脑上处理，绝不上传到任何服务器、仓库或诊断链路。
- VUA 不收集 VRChat、BOOTH 或 Unity 的密码、Cookie 与两步验证码，不绕过购买、
  支付、年龄、认证或访问控制。
- VUA 不注入、不修改 VRChat 客户端。登录与最终上传留在 VRChat 官方流程——上传
  按钮由你在官方 SDK 中按下。
- 分享的 Recipe 只含结构、来源引用与设置。
- 技术检查报告事实而非品味：它不能保证 Avatar 的外观与行为符合你的预期。

## VUA 的方向

- 按 [N1–N7 开发序列](docs/development-outline.md) 推进：环境部署、两项指定游玩工具、复杂
  Avatar 制作、Recipe 复现、经核查的素材管理重做、恢复，以及带截图操作指南的 Beta 安装包。
- v0.9.1 及后续版本在作者明确要求前持续为 Beta。N2 包含 VRCFaceTracking 和修改后的
  hyblocker Space Calibrator；不据此扩大到其它工具、VR 叠加层教程或社区插件执行。
- 已接受但未实现的方向：向导路径选择、Recipe 叠加语义与显式冲突选项、分享时再
  补来源、检测完全收进制作记录。默认关闭的实验性兼容性取证可能随后到来；无论
  开关与否，BDL 的本地存储都不受影响。
- 独立轻量 UI（egui/Slint）无限期延后；Electron 资源节约模式保留。

## 文档

- [文档指南](docs/README.md)——每项任务的最小阅读路径
- [产品边界](docs/product-boundary.md)
- [系统架构](docs/architecture/system.md)
- [v0.6.0 发行说明](docs/release/v0.6.0.md)
- [贡献指南](CONTRIBUTING.md) · [安全策略](SECURITY.md)

## 许可证

本仓库采用 [Apache License 2.0](LICENSE)。另见 [NOTICE](NOTICE)、
[商标指引](TRADEMARKS.md) 与[第三方声明](THIRD_PARTY_NOTICES.md)。产品版本遵循
Semantic Versioning 2.0.0；版本化协议与 Schema 保留各自独立的兼容性版本。

Copyright 2026 Aran52.
