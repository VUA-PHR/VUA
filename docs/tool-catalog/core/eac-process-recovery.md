---
catalog_schema: "vua.tool-entry/v3"
id: "core.eac-process-recovery"
boundary: "core"
status: "experimental"
risk: "high"
risk_rule: "vua.risk-gate/v1"
delivery: "v0.8.0"
maintainer: "VUA-Project"
distribution: "core"
platforms: ["windows"]
capabilities: ["process.inspect", "process.terminate.allowlisted"]
---

# EAC Conflict Detection and Residual-Process Recovery / EAC 冲突侦测与残留进程恢复

> **实验性高风险功能：终止 EAC 或 VRChat 相关进程可能导致游戏中断、EAC 状态异常；极端情况下
> 可能触发平台或账号安全检查并出现账号异常。VUA 无法保证平台侧结果。功能默认关闭，每次执行
> 都必须由用户明确选择并再次确认。**

> **Experimental high-risk feature: terminating EAC- or VRChat-related processes can interrupt the
> game or leave EAC in an abnormal state. In extreme cases it may trigger platform or account safety
> checks and account anomalies. VUA cannot guarantee platform-side outcomes. It is disabled by
> default and requires explicit opt-in and confirmation on every execution.**

## 中文

它通过 Orchestrator 的高风险系统能力处理阻止 VRChat 启动的冲突，因此只能作为 Core 本体模块，
不能向网页、Overlay 或社区插件开放。默认先只读侦测，优先提供正常退出、重启、官方 EAC repair
和支持路径；终止进程只是用户主动展开的末级实验选项。

只能处理审核过的用户态残留进程允许清单。执行前核验并展示进程名、PID、绝对路径、可用签名/
发布者和判定原因；有活跃 VRChat 会话时拒绝。不得停止服务或驱动、修改 EAC/VRChat 文件或配置、
注入/挂钩/隐藏进程、规避反作弊或按模糊名称批量结束进程。证据不明时只诊断。

## English

It uses a high-risk Orchestrator system capability to recover conflicts that prevent VRChat launch,
so it can only be a core module and is never exposed to web content, overlays, or community plugins.
Diagnose read-only first and prefer normal exit, restart, official EAC repair, and support. Process
termination is a user-expanded last-resort experiment.

Only a reviewed allowlist of user-mode residual processes is eligible. Verify and display process
name, PID, absolute path, available signer/publisher, and reason; refuse during active gameplay.
Never stop services/drivers, change EAC/VRChat files/configuration, inject/hook/hide processes,
bypass anti-cheat, or terminate by broad name matching. Unknown evidence permits diagnosis only.
