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

# ALCOM / VCC (VRChat Creator Companion)


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
[product boundary](../../product-boundary.md) 1.5.0 "explicit boundary" section). The
read face and the settings face have landed with the proposal 024–027 chain (in the
development window; the release face awaits v0.7.0). The detection matrix and the
allow/forbidden lists are in the
[ALCOM/VCC project compatibility matrix](../../compatibility/alcom-vcc.md).
