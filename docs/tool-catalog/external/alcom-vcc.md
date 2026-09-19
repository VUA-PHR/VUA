---
catalog_schema: "vua.tool-entry/v3"
id: "external.alcom-vcc"
boundary: "external"
status: "experimental"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "v0.7.0"
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
显式选择「导入为 VUA 管理的副本」。**设置面例外（用户裁决 U14，2026-09-19）**：VPM
包管理设置（`settings.json` 的仓库订阅与本地包注册表面）与 VCC/ALCOM 共享同一文件，
VUA 经裁决读写该面且改动双方立即可见；`vcc.liteDb` 等其余存储面与项目文件面维持
禁止不变（权威措辞见[产品边界](../../product-boundary_ZH.md) 1.4.0「明确边界」节）。
读面与设置面已随提案 024–027 链落地（开发窗口内，发行面候 v0.7.0）。检测矩阵与
允许/禁止清单见[ALCOM/VCC 项目兼容矩阵](../../compatibility/alcom-vcc_ZH.md)。

## English

ALCOM and VCC are independently installed project managers owned by the user, with their
own settings, registries (VCC's `settings.json` / SQLite, ALCOM's `setting.json`), and
project folders. VUA is read-only toward the projects they manage: discovery,
identification, and reading versions/packages/SDKs/compatibility/environment state, plus
diagnostics and guidance. VUA never writes their registries, databases, settings, or
caches, and never installs or removes packages on their behalf; writes are handed over to
the owning manager, or the user explicitly chooses "import as a VUA-managed copy".
**Settings-face exception (user ruling U14, 2026-09-19):** the VPM package-management
settings (the repository-subscription and local-package-registry faces of `settings.json`)
are one file shared with VCC/ALCOM; VUA reads and writes that face by ruling, with changes
immediately visible to both sides. All other storage faces such as `vcc.liteDb`, and the
project files themselves, stay denied (authoritative wording in the
[product boundary](../../product-boundary_EN.md) 1.4.0 "explicit boundary" section). The
read face and the settings face have landed with the proposal 024–027 chain (in the
development window; the release face awaits v0.7.0). The detection matrix and the
allow/forbidden lists are in the
[ALCOM/VCC project compatibility matrix](../../compatibility/alcom-vcc_EN.md).
