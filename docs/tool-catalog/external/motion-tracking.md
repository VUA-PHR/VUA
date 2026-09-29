---
catalog_schema: "vua.tool-entry/v3"
id: "external.motion-tracking"
boundary: "external"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "v0.7.1"
maintainer: "external-upstream"
distribution: "external-connection"
platforms: ["windows"]
capabilities: ["external.runtime.discover", "external.runtime.connect", "tracking.motion.status"]
---

# Motion Tracking


N2 selects only a derived [hyblocker/OpenVR-SpaceCalibrator](https://github.com/hyblocker/OpenVR-SpaceCalibrator)
with SimpleBLE and base-station BLE management removed, as specified in the development sequence.
It retains independent state and works
with devices, SteamVR, or VRChat through public boundaries, receiving no VUA internal service. Any
VUA-side connector is classified and authorized separately. No VRChat injection, graphics/OpenXR
hooks, or EAC modification; validate coordinates/units, calibration, versions, disconnect, and a
manual path.
