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

# Face Tracking / 面部捕捉

## 中文

VRCFaceTracking 等独立上游通过自身公开边界连接设备并与 VRChat 交互，不获得 VUA 内部能力。
`1.0.0` 后若 VUA 提供发现、状态或诊断，其适配器另行作为 Core 行为或 VUA 插件评审。不得读取上游
私有数据库、复制会话或注入 VRChat；托管安装需要单独许可证、再分发、签名和更新审计。

## English

Independent upstreams such as VRCFaceTracking connect devices and interact with VRChat through their
own public boundaries, receiving no VUA internal capability. A post-`1.0.0` VUA discovery/status/
diagnostic adapter is reviewed separately as Core behavior or a VUA plugin. No private databases, copied
sessions, or VRChat injection; managed delivery requires separate license, redistribution,
signature, and update review.
