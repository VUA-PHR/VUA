---
catalog_schema: "vua.tool-entry/v3"
id: "external.face-tracking"
boundary: "external"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "post-1.0"
maintainer: "external-upstream"
distribution: "external-connection"
platforms: ["windows"]
capabilities: ["external.runtime.discover", "external.runtime.connect", "tracking.face.status"]
---

# Face Tracking


Independent upstreams such as VRCFaceTracking connect devices and interact with VRChat through their
own public boundaries, receiving no VUA internal capability. A post-`1.0.0` VUA discovery/status/
diagnostic adapter is reviewed separately as Core behavior or a VUA plugin. No private databases, copied
sessions, or VRChat injection; managed delivery requires separate license, redistribution,
signature, and update review.
