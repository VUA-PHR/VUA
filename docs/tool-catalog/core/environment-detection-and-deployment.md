---
catalog_schema: "vua.tool-entry/v3"
id: "core.environment-detection-and-deployment"
boundary: "core"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "v0.8.0"
maintainer: "VUA-Project"
distribution: "core"
platforms: ["windows"]
capabilities: ["environment.inspect", "environment.plan", "installer.launch.official"]
---

# Environment Detection and Guided Deployment / 环境侦测与引导式部署

## 中文

侦测硬件、Windows、VR 运行环境、Steam/SteamVR、VRChat、Unity 与制作链路前置条件，并提供
可解释就绪报告和官方来源引导。它需要通过 Orchestrator 计划、确认、执行与复检系统动作，因此是
Core 本体模块。默认只读；下载、写入、提权或启动外部程序逐项确认。不绕过安装器、许可证、登录、
EAC 或系统安全，也不把可选增强伪装成必需依赖。

验收要求每个检查项具有稳定 ID、证据、严重度、自动或人工修复路径和复检结果；版本未知时保守
降级，来源、许可证和签名可审计。

Unity 检查按完整版本字符串和分发类型分类。全球版 `2022.3.22f1` 是当前生产目标；
`2019.4.31f1` 与 `2022.3.6f1` 进入迁移引导；其他 Unity 版本统一报告与生产目标的差异，VUA
保持项目文件原状；团结引擎报告为当前暂不支持。完整规则见
[Unity Editor 兼容政策](../../compatibility/unity-editor_ZH.md)。

## English

Detect hardware, Windows, VR runtime, Steam/SteamVR, VRChat, Unity, and production prerequisites,
then provide explainable readiness and official-source guidance. It plans, confirms, executes, and
verifies system actions through Orchestrator, so it is a core module. Start read-only; confirm each
download, write, elevation, or external launch. Never bypass installers, licenses, login, EAC, or
system security, or present optional enhancements as requirements.

Each check has a stable ID, evidence, severity, automated or manual remediation, and verification.
Unknown versions degrade conservatively; sources, licenses, and signatures are auditable.

Unity checks classify the complete version string and distribution. Global `2022.3.22f1` is the
current production target; `2019.4.31f1` and `2022.3.6f1` enter migration guidance; other Unity
versions uniformly report their difference from the production target while VUA leaves project files
unchanged; Tuanjie Engine is reported as currently unsupported. See the
[Unity editor compatibility policy](../../compatibility/unity-editor_EN.md).
