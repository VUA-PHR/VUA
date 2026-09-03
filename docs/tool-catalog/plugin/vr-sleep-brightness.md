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

# VR Sleep Brightness / VR 睡眠亮度调整

## 中文

按用户明确选择的 VR 睡眠状态降低或恢复显示亮度。插件只使用获批的 Overlay、运行状态只读和亮度
请求能力；不得注入 VRChat、挂钩图形/OpenXR 或未经确认修改系统全局亮度。故障、卸载或宿主退出
必须恢复原值，且持续显示生效状态。

## English

Reduce and restore brightness for explicit VR sleep states. Use only granted overlay, read-only
runtime-state, and brightness-request capabilities; never inject into VRChat, hook graphics/OpenXR,
or change system-wide brightness without confirmation. Failure, uninstall, or host exit restores the
prior value, with a persistent active indicator.
