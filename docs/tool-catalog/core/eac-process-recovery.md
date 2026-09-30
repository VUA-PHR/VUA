---
catalog_schema: "vua.tool-entry/v3"
id: "core.eac-process-recovery"
boundary: "core"
status: "experimental"
risk: "high"
risk_rule: "vua.risk-gate/v1"
delivery: "unscheduled"
maintainer: "VUA-Project"
distribution: "core"
platforms: ["windows"]
capabilities: ["process.inspect", "process.terminate.allowlisted"]
---

# EAC Conflict Detection and Residual-Process Recovery

> **Experimental high-risk feature: terminating EAC- or VRChat-related processes can interrupt the
> game or leave EAC in an abnormal state. In extreme cases it may trigger platform or account safety
> checks and account anomalies. VUA cannot guarantee platform-side outcomes. It is disabled by
> default and requires explicit opt-in and confirmation on every execution.**


It uses a high-risk Orchestrator system capability to recover conflicts that prevent VRChat launch,
so it can only be a core module and is never exposed to web content, overlays, or community plugins.
Diagnose read-only first and prefer normal exit, restart, official EAC repair, and support. Process
termination is a user-expanded last-resort experiment.

Only a reviewed allowlist of user-mode residual processes is eligible. Verify and display process
name, PID, absolute path, available signer/publisher, and reason; refuse during active gameplay.
Never stop services/drivers, change EAC/VRChat files/configuration, inject/hook/hide processes,
bypass anti-cheat, or terminate by broad name matching. Unknown evidence permits diagnosis only.
