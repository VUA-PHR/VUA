# ADR: Supervised independent-process Orchestrator Provider

[English](orchestrator-supervised-provider_EN.md) | [简体中文](orchestrator-supervised-provider_ZH.md)

> Status: Accepted
> Date: 2026-09-02
> Decider: Product owner
> Scope: B2 Orchestrator hosting

## Decision

Production uses a supervised independent Rust process connected to Electron Main by a versioned, bounded JSONL pipe.
The in-process native Provider remains an interface-replaceability description, not a current production
implementation; the comparison does not add a napi-rs dependency merely to remove it afterward.

Per-project exclusion uses a SHA-256 digest of the operating-system-resolved final path. Clear project paths cannot
be persisted as task-store lease keys.

## Production consequence comparison

| Option | Crash and shutdown | Packaging, debugging, latency | Product consequence |
| --- | --- | --- | --- |
| In-process native Provider | A Rust panic or memory fault can take down Electron Main; a native library cannot truly unload, so shutdown is logical only | One fewer process/frame, but adds Node ABI, napi-rs, DLL loading, and a combined signing surface; lowest per-call latency | Weakens recoverability for local long-running tasks and blurs lifecycle ownership |
| Supervised independent process | Isolates crashes; exit, handshake, restart, Job Object, and forced-shutdown recovery boundaries are observable | One separate EXE and bounded pipe; stderr diagnostics remain separate; pays process/serialization overhead | Matches authoritative SQLite recovery, replaceable hosting, and the Electron security boundary |

Unity, file, and network work dominates VUA's real workload, not small local control messages. Framing overhead does
not change the user-visible path, while crash isolation and a genuine stoppable boundary directly support the
product definition: recoverable tasks and no business core in the UI.

For identity, persisting a normalized clear path leaks usernames and asset-directory names into databases and
diagnostics. An in-project UUID mutates the user's project and does not exist at first inspection. Hashing an
unresolved user spelling allows relative-path, symlink, and alias duplication. The normalized-path digest neither
writes the project nor exposes the clear path, while reliably making one existing directory hit one lease. A moved
directory becomes a new identity; a fresh Inspect is the safe and truthful consequence.

## Verification and removal

B2 covers handshake, queries, post-commit events, durable cancellation idempotency, restart recovery, unexpected
exit, explicit restart, restricted environment, frame bounds, single-instance locking, wait/force shutdown, and
Windows Job Object initialization. A real development round trip runs from the TypeScript supervisor through the
Rust EXE into SQLite. On the same machine, 50 empty `task.list` round trips through a debug build measured a
0.155 ms median and 0.337 ms p95. This sample establishes only the scale of control-message overhead and is not a
release performance commitment. Release signing and installer verification belong to the B10/M10 artifact gate.

Removing independent-process hosting does not require an application-contract change. A replacement Provider must
implement the same `OrchestratorProviderV01`, pass the same Gateway/recovery behavioral tests, and swap only at an
idle safe boundary. The process framing and supervisor adapter can then be removed; the SQLite format and
application contract do not change with hosting shape.
