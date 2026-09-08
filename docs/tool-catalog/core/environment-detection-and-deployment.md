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

项目管理器检测覆盖 ALCOM/VCC 的只读发现、项目识别与 VPM 包声明面检视（含 VRChat SDK
识别与未完成变更标记），矩阵与允许/禁止清单见
[ALCOM/VCC 项目兼容矩阵](../../compatibility/alcom-vcc_ZH.md)；外部工具边界见
[ALCOM / VCC 条目](../external/alcom-vcc.md)。对原项目的写能力在 `1.0.x` 边界内一律
false，唯一写路径是用户显式选择的「导入为 VUA 管理的副本」。

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

Project-manager detection covers read-only ALCOM/VCC discovery, project identification, and the
VPM package declared-face inspection (including VRChat SDK spotting and the pending-mutation
marker); the matrix and the allow/forbidden lists are in the
[ALCOM/VCC project compatibility matrix](../../compatibility/alcom-vcc_EN.md); the external-tool
boundary is in the [ALCOM / VCC entry](../external/alcom-vcc.md). The write capability toward the
original project is always false inside the `1.0.x` boundary; the only write path is the
user-chosen "import as a VUA-managed copy".
