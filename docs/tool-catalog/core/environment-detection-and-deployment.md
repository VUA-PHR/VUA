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

# Environment Detection and Guided Deployment


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
[Unity editor compatibility policy](../../compatibility/unity-editor.md).

Project-manager detection covers read-only ALCOM/VCC discovery, project identification, and the
VPM package declared-face inspection (including VRChat SDK spotting and the pending-mutation
marker); the matrix and the allow/forbidden lists are in the
[ALCOM/VCC project compatibility matrix](../../compatibility/alcom-vcc.md); the external-tool
boundary is in the [ALCOM / VCC entry](../external/alcom-vcc.md). The write capability toward the
original project is always false inside the `1.0.x` boundary; the only write path is the
user-chosen "import as a VUA-managed copy".
