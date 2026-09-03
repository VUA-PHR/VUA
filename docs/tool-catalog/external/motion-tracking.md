---
catalog_schema: "vua.tool-entry/v3"
id: "external.motion-tracking"
boundary: "external"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "post-1.0"
maintainer: "external-upstream"
distribution: "external-connection"
platforms: ["windows"]
capabilities: ["external.runtime.discover", "external.runtime.connect", "tracking.motion.status"]
---

# Motion Tracking / 动作捕捉

## 中文

SlimeVR Server、OpenVR Space Calibrator 等独立上游拥有自身状态，并通过公开边界与设备、SteamVR
或 VRChat 工作，不获得 VUA 内部服务。VUA 侧连接器另行分类和授权。不得注入 VRChat、挂钩图形/
OpenXR 或修改 EAC；需要验证坐标/单位、校准、版本、断连和人工路径。

## English

Independent upstreams such as SlimeVR Server and OpenVR Space Calibrator own their state and work
with devices, SteamVR, or VRChat through public boundaries, receiving no VUA internal service. Any
VUA-side connector is classified and authorized separately. No VRChat injection, graphics/OpenXR
hooks, or EAC modification; validate coordinates/units, calibration, versions, disconnect, and a
manual path.
