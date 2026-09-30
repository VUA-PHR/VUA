---
catalog_schema: "vua.tool-entry/v3"
id: "external.face-tracking"
boundary: "external"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "v0.7.1"
maintainer: "external-upstream"
distribution: "external-connection"
platforms: ["windows"]
capabilities: ["external.runtime.discover", "external.runtime.connect", "tracking.face.status"]
---

# Face Tracking


N2 selects [benaclejames/VRCFaceTracking](https://github.com/benaclejames/VRCFaceTracking)
as an independently installed external application. VUA guides official Steam installation,
discovers and launches it, reports observed process status and explains hardware-module/OSC setup.
VRCFT owns modules and tracking; VUA does not vendor, build or bundle its code or binaries.
Unknown status is not a successful face-tracking result. N2 requires actual tracking/OSC evidence.
No copied sessions, private-database access or VRChat injection. Later diagnostics/configuration
automation need a scoped adapter; no stable third-party status API is assumed. Upstream distribution
and license terms apply; see [third-party notices](../../../THIRD_PARTY_NOTICES.md).
