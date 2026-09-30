# VUA — VRC Ultra Assistant

[English](README.md) | 简体中文 | [日本語](README_JA.md) | [한국어](README_KO.md)

[![rust](https://github.com/VUA-Project/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-Project/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-Project/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-Project/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-Project/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-Project/VUA/actions/workflows/schema-vectors.yml)

**VUA（VRC Ultra Assistant）** 是面向 VRChat 玩家的 Windows 桌面生产环境——尤其面向
没接触过 Unity、甚至还不清楚自己需要什么的玩家。从目标和自有素材出发，由 VUA 引导
完成环境准备、工程准备、Avatar 装配、检测与恢复。

## VUA 的用途

### [1] 游戏助手

> **Materials checked and cleared.**

VUA 帮助玩家部署游玩所需的软件与设置，并学习移动、菜单、安全选项和设备使用等基本知识。根据用户的目标与硬件说明需要安装什么，并引导完成环境准备。

首轮账号引导在内建浏览器中打开官方注册页面：游玩路线涉及 Steam 与 VRChat，创作者路线可选 Unity 与 BOOTH。注册、Steam 入库和官方账号绑定由用户亲手完成。上传指引说明完整 VRChat 账号及 New User 等级要求；尚未取得上传资格时，玩家仍可进行本地 Avatar 制作准备。

首批两项可选外部连接为 VRCFaceTracking 与 hyblocker OpenVR Space Calibrator。计划由 VUA 检测、启动独立安装的上游软件，并引导用户在上游界面完成配置；安装与更新由 Steam 或上游负责。

### [2] Avatar 生产

> **Sugar, spice, and everything nice.**

玩家搭配自己拥有的素材，把选择与设置记录为 Recipe，分享给同样自行取得素材的玩家复现。目标是自动制作 Avatar，并通过检查与受控修改保护制作过程，再把成品交给官方 SDK；Recipe 分享来源引用与设置，不包含付费素材本体。

## 它如何工作

VUA 从用户的目标和现有素材出发，展示计划、执行步骤与结果。Build Record 将制作步骤、检查证据和错误汇集为制作记录，帮助用户了解做了什么、哪里需要处理。

项目与包管理负责准备所需的 Unity 环境和依赖，包括 VPM 仓库订阅、包的安装、更新与移除。已有 ALCOM/VCC 工程按只读方式检查；需要编辑时，由用户主动导入为 VUA 管理的副本。最终登录与上传仍由用户在 VRChat 官方 SDK 中完成。

## 安全边界

- VUA 是独立运行的第三方助手，与 VRChat Inc. 无官方隶属或背书关系；交互范围限定为公开支持的外部接口、OSC、启动参数、必要的本地日志和公开配置项，不注入、Hook、Patch VRChat 客户端或绕过 EAC。
- 首轮账号引导使用隔离的临时浏览器会话，VUA 应用功能不收集密码，也不把登录 Cookie、Token 提取到应用或 Agent 数据中；首轮不记住 VRChat 登录状态。后续网页读取与实验性持久化另行开发，不代表平台认可，详见[账号边界](docs/product-boundary.md#account-onboarding-user-ruling-2026-09-30)。
- 涉及账号修改的操作必须由用户通过允许的流程主动发起，VUA 不在云端代替用户控制账号，也不代替用户自动上传 Avatar。
- 仅保留功能所必需的数据，默认本地保存，不建立不必要的好友活动追踪或用户画像；付费素材留在本地，分享的 Recipe 不含素材本体。
- 未公开支持的客户端行为、隐藏配置项与不受控的 API 自动化不属于默认功能范围，技术检查通过也不保证外观、行为或生产安全性。

[VRChat Creator Guidelines](https://hello.vrchat.com/creator-guidelines) · [Configuration File](https://docs.vrchat.com/docs/configuration-file)

## 开发进度说明

当前已发布产物仍为 v0.6.0，历史发布标记为 pre-alpha。开发按 [N1–N7 序列](docs/development-outline.md) 推进：环境部署、两项指定游玩工具、复杂 Avatar 制作、Recipe 复现、经核查的素材管理重做、恢复，以及带截图操作指南的 Beta 安装包。

项目预期还将持续 Beta 状态很长一段时间。以上介绍表达产品方向，已有实现和自动化测试不代表完整真机流程已经通过；实际验收状态以开发序列和发行证据为准。

### 当前交付与开始入口

- 玩家可查看[已发布产物](https://github.com/VUA-Project/VUA/releases)及 [v0.6.0 验证记录与限制](docs/release/v0.6.0.md)。上文介绍的是产品方向，本 README 不宣称 N1–N7 流程已通过验收。
- 带截图的用户指南与经过验收的 Beta 安装包属于 N7 交付，目前不作为已有使用教程。使用问题可通过 [Issues](https://github.com/VUA-Project/VUA/issues/new/choose) 提出。
- 开发者可从[安装依赖、启动桌面应用与选择检查](apps/desktop/README.md#development-commands)开始，再阅读[贡献指南](CONTRIBUTING.md)。

## 文档

- [文档指南](docs/README.md)——每项任务的最小阅读路径
- [产品边界](docs/product-boundary.md)
- [系统架构](docs/architecture/system.md)
- [v0.6.0 发行说明](docs/release/v0.6.0.md)
- [贡献指南](CONTRIBUTING.md) · [安全策略](SECURITY.md)

## 许可证

VUA 采用 [Apache-2.0](LICENSE)。首批计划支持的外部连接包括 [VRCFaceTracking（Apache-2.0）](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE) 和 [Space Calibrator（MIT 主体及单独授权的第三方组件）](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE)。上游归属及未来再分发条件见[第三方声明](THIRD_PARTY_NOTICES.md)。

[NOTICE](NOTICE) · [Trademark guidance](TRADEMARKS.md)

Copyright 2026 Aran52.
