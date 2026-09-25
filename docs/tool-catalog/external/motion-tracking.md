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

# Motion Tracking


Independent upstreams such as SlimeVR Server and OpenVR Space Calibrator own their state and work
with devices, SteamVR, or VRChat through public boundaries, receiving no VUA internal service. Any
VUA-side connector is classified and authorized separately. No VRChat injection, graphics/OpenXR
hooks, or EAC modification; validate coordinates/units, calibration, versions, disconnect, and a
manual path.
