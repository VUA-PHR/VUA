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


N2 selects [benaclejames/VRCFaceTracking](https://github.com/benaclejames/VRCFaceTracking), which connects devices and interacts with VRChat through its
own public boundaries, receiving no VUA internal capability. The N2 VUA deployment/discovery/status/
diagnostic adapter is reviewed separately as Core behavior or a VUA plugin. No private databases, copied
sessions, or VRChat injection; managed delivery requires separate license, redistribution,
signature, and update review.
