---
catalog_schema: "vua.tool-entry/v3"
id: "external.alcom-vcc"
boundary: "external"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "v0.8.0"
maintainer: "external-upstream"
distribution: "external-connection"
platforms: ["windows"]
capabilities: ["external.project-manager.detect", "external.vpm-registry.read"]
---

# ALCOM / VCC (VRChat Creator Companion) / ALCOM 与 VCC

## 中文

ALCOM 与 VCC 是用户自行安装的独立项目管理器，拥有自己的设置、注册表（VCC 的
`settings.json` / SQLite，ALCOM 的 `setting.json`）与项目目录。VUA 对它们管理的项目
只读：发现、识别、读取版本/包/SDK/兼容性/环境状态，并给出诊断与建议。VUA 不写入其
注册表、数据库、设置或缓存，不代其安装或移除包；写操作交接给对应管理器，或由用户
显式选择「导入为 VUA 管理的副本」。检测矩阵与允许/禁止清单见
[ALCOM/VCC 项目兼容矩阵](../../compatibility/alcom-vcc_ZH.md)。

## English

ALCOM and VCC are independently installed project managers owned by the user, with their
own settings, registries (VCC's `settings.json` / SQLite, ALCOM's `setting.json`), and
project folders. VUA is read-only toward the projects they manage: discovery,
identification, and reading versions/packages/SDKs/compatibility/environment state, plus
diagnostics and guidance. VUA never writes their registries, databases, settings, or
caches, and never installs or removes packages on their behalf; writes are handed over to
the owning manager, or the user explicitly chooses "import as a VUA-managed copy". The
detection matrix and the allow/forbidden lists are in the
[ALCOM/VCC project compatibility matrix](../../compatibility/alcom-vcc_EN.md).
