---
catalog_schema: "vua.tool-entry/v3"
id: "external.avatar-optimizer"
boundary: "external"
status: "planned"
risk: "medium"
risk_rule: "vua.risk-gate/v1"
delivery: "post-1.0"
maintainer: "external-upstream"
distribution: "external-connection"
platforms: ["windows"]
capabilities: ["external.unity-package.detect", "avatar.optimize.plan", "avatar.optimize.validate"]
---

# Avatar Optimizer


An Avatar optimizer works as an independent Unity package/upstream tool at the Unity build boundary
and receives no VUA internal capability. A post-`1.0.0` adapter that plans and invokes its public API
is classified separately; VUA owns confirmation, Build Record, and validation while upstream owns
the algorithm. No silent project mutation, copied private implementation, or local estimate
presented as an official VRChat result.
