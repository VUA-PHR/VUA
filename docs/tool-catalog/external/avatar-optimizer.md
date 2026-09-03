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

# Avatar Optimizer / Avatar 优化器

## 中文

Avatar 优化器作为独立 Unity Package/上游工具在 Unity 构建边界工作，不获得 VUA 内部能力。
`1.0.0` 后若 VUA 规划和调用其公开 API，VUA 侧适配器另行归类；VUA 负责确认、Build Record 与
验证，上游拥有优化算法。不得静默修改项目、复制私有实现或把本地估算冒充 VRChat 官方结论。

## English

An Avatar optimizer works as an independent Unity package/upstream tool at the Unity build boundary
and receives no VUA internal capability. A post-`1.0.0` adapter that plans and invokes its public API
is classified separately; VUA owns confirmation, Build Record, and validation while upstream owns
the algorithm. No silent project mutation, copied private implementation, or local estimate
presented as an official VRChat result.
