# Orchestrator architecture

[English](orchestrator_EN.md) | [简体中文](orchestrator_ZH.md)

> Status: Accepted
> Scope: Orchestrator application core and local adapters
> Updated: 2026-09-02
> Normative effect: Yes

## Responsibility

Orchestrator owns command, query, task, and capability use cases; the
Inspect/Plan/Confirm/Snapshot/Execute/Validate/Recover workflow; revision, idempotency, cancellation,
recovery, and per-project mutation exclusion; Recipe-to-ProjectSpec, plan, and Build Record
coordination; ports for persistence, files, processes, networks, projects, future runtime tools, and
Unity Bridge; and structured privacy-filtered diagnostics.

React owns pages, Electron owns windows and remote rendering, Unity Bridge owns Unity objects, and
third-party applications own their user interfaces.

```text
Orchestrator
├─ domain         pure rules, state, value objects
├─ application    use cases, workflows, authorization boundaries
├─ ports          required input/output capabilities
├─ adapters       SQLite, files, processes, HTTP, Unity, vendors
└─ bootstrap      fixed startup wiring and configuration
```

The accepted implementation keeps the Orchestrator in Rust and uses a supervised independent-process
Provider. Gateway DTOs map explicitly to Rust application types; transport types stay at the Provider
boundary. See [ADR: Supervised independent-process Orchestrator Provider](../decisions/orchestrator-supervised-provider_EN.md)
for the selection and removal path.

## Hosting and Gateway

Electron Main hosts or supervises one trusted Orchestrator Provider through the Kernel. The Provider
converts values, coordinates lifecycle, and forwards Orchestrator
use cases. The contract owns request/correlation IDs, cancellation, stable errors, task
operations, events, and capability snapshots independently of FFI, pipes, or another transport.
Recovery comes from persistence. All windows share one authoritative core.

The Provider closes admission, then waits for in-flight mutations to reach a recoverable boundary.
After timeout the user chooses whether to keep waiting or force exit. The supervised implementation
proves handshake, crash detection, explicit restart, process-tree cleanup, and recovery from
authoritative persistence. Provider replacement occurs only at an idle shutdown boundary.

The transport-independent B1 request, task, cancellation, operation-level Capability, and safe
shutdown semantics are defined by [Application Contract v0.1](../protocols/application-contract-v0.1_EN.md).
This candidate is not stable Gateway v1 before real M2 integration.

B2 SQLite tables, transactions, idempotency, durability, and restart semantics are defined by
[Task Store Format v0.1](../protocols/task-store-v0.1_EN.md). Process framing, handshake, supervision,
single-instance, and shutdown semantics are defined by the
[Supervised Provider Process Protocol v0.1](../protocols/provider-process-v0.1_EN.md).

## State and concurrency

- SQLite is authoritative persistent state.
- Authoritative writes use revision/CAS and return recoverable conflicts.
- Only one mutating workflow runs against a Unity project at a time.
- External intent is recorded before a side effect and its outcome after the safety boundary.
- Events publish only after commit and carry the corresponding revision.
- Idempotency records can recognize repeated commands and reuse results.

The database driver, leases, recovery tables, Provider transport, supervision, and shutdown behavior
are fixed by the B2 implementation and tests. B3 continues complete panic-to-stable-application-error
coverage with the first real use case.

## External processes

Adapters pass argument arrays, filter inherited secrets, declare minimal environment/workdir/timeout/
cancellation/exit semantics per tool, execute allowlisted programs from trusted installation sources,
supervise Windows process trees, and redact and truncate logs.
