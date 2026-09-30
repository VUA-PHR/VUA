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


N2 selects [hyblocker/OpenVR-SpaceCalibrator](https://github.com/hyblocker/OpenVR-SpaceCalibrator)
as an independently installed official application. VUA guides Steam installation, discovers and
launches it and explains SteamVR prerequisites, device selection and calibration in its own UI.
The previous fork/BLE-removal plan is superseded; official features remain untouched. No upstream
code, driver or binary is bundled with VUA, and internal overlay/driver IPC is not a VUA API.
Process existence is distinct from actual mixed-space calibration; N2 requires real measured
calibration and disconnect/reconnect evidence. No VRChat injection, graphics/OpenXR hooks or EAC
modification. Later documented log/configuration diagnostics remain separate from first delivery.
See [third-party notices](../../../THIRD_PARTY_NOTICES.md).
