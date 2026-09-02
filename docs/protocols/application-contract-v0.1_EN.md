# VUA Application Contract v0.1

[English](application-contract-v0.1_EN.md) | [简体中文](application-contract-v0.1_ZH.md)

> Status: B1 candidate development contract
> Scope: application semantics between the Electron Kernel and an Orchestrator Provider
> Updated: 2026-09-02
> Authority: constrains B1 implementation and tests; not stable Gateway v1 before real M2 integration

## Purpose and boundary

This contract defines application values independent of hosting, FFI, processes, and message transport. Electron
Main/Kernel maps allowed Gateway calls into this contract; a Provider explicitly maps the contract into Rust application
use cases. Renderer code never sees Provider lifecycle objects, Rust types, SQLite rows, journal payloads, native
handles, or child-process messages.

The version value is the string `0.1`. Every request, response, event, handshake, and lifecycle result carries it.
Unknown versions are rejected explicitly and are never inferred from the product version or payload shape.

## Minimal B1 use-case surface

| Kind | Method | Semantics |
| --- | --- | --- |
| Query | `application.getSnapshot` | Returns the application revision and operation-level capabilities |
| Query | `task.list` | Returns the authoritative snapshots of currently visible tasks |
| Query | `task.get` | Returns one authoritative task snapshot |
| Command | `task.requestCancellation` | Submits a monotonic, idempotent cancellation intent for a stable task instance |

B1 does not add Recipe, Assembly, environment deployment, or Unity mutation commands. Later vertical slices may add
them only after their owning use cases and ports are defined.

## Identity, errors, and revision

- `requestId` identifies a call; `correlationId` links a user intent with its later task and diagnostics.
- A mutation command carries a stable `commandId`. Duplicate IDs return the existing result or an explicit conflict
  and never repeat side effects.
- `AppErrorV01` uses a stable code, localization key and params, with separate `recoverable` and `retryable` flags. It
  never carries SQL, stack traces, cookies, tokens, full user paths, or paid-asset filenames.
- Queries return authoritative snapshot revisions. Task event revisions increase monotonically within a task. After a
  duplicate or gap, consumers reload through `task.get` or `task.list`.
- An Event reports a post-commit fact and is not an authoritative state replica. The B1 mock proves the semantic shape;
  B2 proves publication after a SQLite transaction.

## Tasks and cancellation

The candidate outward task states are `queued`, `preparing`, `running`, `waiting_for_input`, `paused`, `succeeded`,
`succeeded_with_warnings`, `failed`, and `cancelled`. The final four are terminal and cannot be overwritten by
cancellation, timeout, or a late result.

Every task snapshot carries `recoveryDisposition`. Normal tasks use `none`. A nonterminal task left by a process
restart keeps its last truthful `state` and uses `inspect_required`. This does not claim that the task is still
executing, and it must not be silently converted to paused or failed. The recovery use case must Inspect the external
project before it offers continue or rollback.

`task.requestCancellation` binds `taskId` and `commandId` and may carry the `observedRevision` visible when the user
clicked. Normal progress does not reject cancellation when the revision has advanced; the observed value is diagnostic.
The response distinguishes:

- `requested`: cancellation intent was accepted for the first time;
- `already_requested`: the task already has a cancellation intent;
- `already_terminal`: the task has ended and its original terminal state remains unchanged.

A cancellation request is not completed cancellation. The UI reports completion only after the task reaches a safe
boundary and commits the `cancelled` terminal state.

## Operation-level Capability

A Capability reports `available` or `unavailable` for each stable `operationId`, with a structured reason when
unavailable. Module-level ready/degraded/unavailable is presentation derived from operation entries and cannot override
the conclusion for a specific operation.

For example, a wrong Unity version can leave environment diagnosis available while blocking project mutation; offline
package management can read cache while blocking refresh; a VCC/ALCOM project can support inspection without claiming
VUA-native creation.

## Provider interface

The Provider is a trusted Kernel-internal interface and supplies:

1. `start()`, returning supported application-contract versions, Provider build identity, and instance identity;
2. `invoke()`, accepting only the explicit application request union, with no generic channel, reflection call, or
   arbitrary method name;
3. `subscribe()`, observing typed events; unsubscribing affects only the observer, never task lifetime;
4. `prepareShutdown()`, first closing admission and then waiting for mutating tasks to reach a safe boundary for a
   bounded duration;
5. `continueShutdown()`, accepting only `wait` or `force` after timeout. `force` requires a user decision ID, and a
   Provider never treats timeout itself as authorization to force stop.

Normal shutdown returns `safe_to_stop`. A timeout returns `needs_user_choice` plus summaries of blocking tasks. Waiting
starts another bounded interval. Force stop carries a Kernel-generated `userDecisionId` for diagnostics and recovery.

Provider hosting shape, handshake framing, crash supervision, SQLite leases, and Windows process-tree policy are
fixed by B2's [Supervised Provider Process Protocol v0.1](provider-process-v0.1_EN.md) and are not v0.1 application
values.

## B1 verification gate

- TypeScript types and runtime checks reject unknown versions, unknown methods, and mixed Command/Query shapes.
- A mock Provider verifies read-only queries, idempotent cancellation, terminal-state priority, operation-level
  Capability, and snapshot reload after an event gap.
- A mock Provider verifies admission closure, safe shutdown, timeout choice, and the user-decision requirement for
  force stop.
- Tests have no dependency on Rust, Electron, FFI, network, SQLite, or real Unity.
