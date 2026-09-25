---
catalog_schema: "vua.tool-entry/v3"
id: "plugin.vr-sleep-brightness"
boundary: "plugin"
status: "proposed"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "unscheduled"
maintainer: "community"
distribution: "plugin-package"
platforms: ["windows"]
capabilities: ["overlay.display", "runtime.state.read", "display.brightness.request"]
---

# VR Sleep Brightness


Reduce and restore brightness for explicit VR sleep states. Use only granted overlay, read-only
runtime-state, and brightness-request capabilities; never inject into VRChat, hook graphics/OpenXR,
or change system-wide brightness without confirmation. Failure, uninstall, or host exit restores the
prior value, with a persistent active indicator.
