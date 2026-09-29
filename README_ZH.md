# VUA — VRC Ultra Assistant

[English](README.md) | 简体中文 | [日本語](README_JA.md) | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

**VUA（VRC Ultra Assistant）** 是面向 VRChat 玩家的 Windows 桌面生产环境——尤其面向
没接触过 Unity、甚至还不清楚自己需要什么的玩家。从目标和自有素材出发，由 VUA 引导
完成环境准备、工程准备、Avatar 装配、检测与恢复。

## 你可以用 VUA 做什么

### [1] 游戏助手

**Materials checked and cleared.**

部署游玩所需的软件与设置，学习移动、菜单、安全选项和设备使用等基本知识。根据你的目标与硬件说明需要安装什么，并引导完成环境准备。

### [2] Avatar 生产

**Sugar, spice, and everything nice.**

搭配你拥有的素材，把选择与设置记录为 Recipe，分享给同样自行取得素材的玩家复现。目标是自动制作 Avatar，并通过检查与受控修改保护制作过程，再把成品交给官方 SDK；Recipe 分享来源引用与设置，不包含付费素材本体。

## 它如何工作

从你的目标和现有素材出发，查看计划、执行步骤与结果。Build Record 将制作步骤、检查证据和错误汇集为制作记录，帮助你了解做了什么、哪里需要处理。

项目与包管理负责准备所需的 Unity 环境和依赖，包括 VPM 仓库订阅、包的安装、更新与移除。已有 ALCOM/VCC 工程按只读方式检查；需要编辑时，由你主动导入为 VUA 管理的副本。最终登录与上传仍由你在 VRChat 官方 SDK 中完成。

## 安全边界

- VUA 是独立运行的第三方助手，与 VRChat Inc. 无官方隶属或背书关系；交互范围限定为公开支持的外部接口、OSC、启动参数、必要的本地日志和公开配置项，不注入、Hook、Patch VRChat 客户端或绕过 EAC。
- VUA 不得请求、读取、保存或传输你的 VRChat 登录凭据，包括密码、认证 Token、Cookie 与 Session。
- 涉及账号修改的操作必须由你通过允许的流程主动发起，VUA 不在云端代替你控制账号，也不代替你自动上传 Avatar。
- 仅保留功能所必需的数据，默认本地保存，不建立不必要的好友活动追踪或用户画像；付费素材留在本地，分享的 Recipe 不含素材本体。
- 未公开支持的客户端行为、隐藏配置项与不受控的 API 自动化不属于默认功能范围，技术检查通过也不保证外观、行为或生产安全性。

[VRChat Creator Guidelines](https://hello.vrchat.com/creator-guidelines) · [Configuration File](https://docs.vrchat.com/docs/configuration-file)

## 开发进度说明

当前已发布产物仍为 v0.6.0，历史发布标记为 pre-alpha。开发按 [N1–N7 序列](docs/development-outline.md) 推进：环境部署、两项指定游玩工具、复杂 Avatar 制作、Recipe 复现、经核查的素材管理重做、恢复，以及带截图操作指南的 Beta 安装包。

项目预期还将持续 Beta 状态很长一段时间。以上介绍表达产品方向，已有实现和自动化测试不代表完整真机流程已经通过；实际验收状态以开发序列和发行证据为准。

## 文档

- [文档指南](docs/README.md)——每项任务的最小阅读路径
- [产品边界](docs/product-boundary.md)
- [系统架构](docs/architecture/system.md)
- [v0.6.0 发行说明](docs/release/v0.6.0.md)
- [贡献指南](CONTRIBUTING.md) · [安全策略](SECURITY.md)

## 许可证

VUA 采用 [Apache-2.0](LICENSE)。首批计划适配的游玩工具包括 [VRCFaceTracking（Apache-2.0）](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE) 和 [Space Calibrator 的 MIT 主体](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE)。计划中的空间校准修改版移除 SimpleBLE 与基站 BLE 管理；版权归属、其它依赖许可证及分发要求见[第三方声明](THIRD_PARTY_NOTICES.md)，这不代表修改版二进制已经交付。

[NOTICE](NOTICE) · [Trademark guidance](TRADEMARKS.md)

Copyright 2026 Aran52.
