# VUA Application Contract v0.1

[English](application-contract-v0.1_EN.md) | [简体中文](application-contract-v0.1_ZH.md)

> Status: B1/F2 candidate development contract
> Scope: application semantics between the Electron Kernel and an Orchestrator Provider
> Updated: 2026-09-04
> Authority: constrains B1/F2 implementation and tests; not stable Gateway v1 before real M2 integration

## Purpose and boundary

This contract defines application values independent of hosting, FFI, processes, and message transport.
Electron Main/Kernel maps allowed Gateway calls into this contract; a Provider explicitly maps the contract
into Rust application use cases. The Renderer consumes only the Gateway surface mapped by the Kernel and
never sees Provider lifecycle objects, Rust types, SQLite rows, journal payloads, or child-process messages.

The version value is the string `0.1`. Every request, response, event, handshake, and lifecycle result
carries it; unknown versions are rejected explicitly.

## Versioning and evolution

The method surface grows with vertical slices, and this document is the single registry: every new method
must be registered here with its owning use case, port, and capability gating. Incremental registration
within the same candidate version is allowed (both implementations evolve in sync inside this repository);
at the M2 freeze the contract is promoted to stable Gateway v1 as a whole, and only later breaking changes
require a version bump.

## Method surface

| Kind | Method | Semantics | Introduced |
| --- | --- | --- | --- |
| Query | `application.getSnapshot` | Returns the application revision and operation-level capabilities | B1 |
| Query | `task.list` | Returns the authoritative snapshots of currently visible tasks | B1 |
| Query | `task.get` | Returns one authoritative task snapshot | B1 |
| Command | `task.requestCancellation` | Submits a monotonic, idempotent cancellation intent for a stable task instance | B1 |
| Query | `environment.getSnapshot` | Returns the read-only environment presence snapshot for both zones | F2 |
| Command | `task.startDemo` | Capability-gated demonstration command: creates one observable, cancellable demo task | F2 |

`task.startDemo` is the end-to-end demonstration channel for the task experience (submit → observe →
cancel), gated by an operation-level capability (such as `demo.task`); production builds may declare it
unavailable. Once the first real use-case command lands (the F3 inspection page), it demotes to a test
fixture and leaves the production capability table.

## Identifiers

- `requestId` identifies one call; `correlationId` links one user intent with its subsequent tasks and
  diagnostics;
- Mutating commands carry a stable `commandId`: for a repeated ID the Provider returns the existing result
  or an explicit conflict, never a repeated side effect.

## Errors

`AppErrorV01` uses stable error codes, localization keys, and parameters, and marks `recoverable` and
`retryable`. An error payload is interface data, not a diagnostic dump: credentials, SQL, stack traces,
cookies, tokens, full user paths, and paid-asset file names never enter an error payload.

## Revision and events

- Queries return an authoritative snapshot revision; per-task event revisions increase monotonically
  within the task. When events repeat or skip, consumers re-fetch the snapshot via `task.get` or
  `task.list`;
- Events are notifications of fact, not authoritative state copies; authoritative state comes from
  queries only.

## Task semantics

The external task states are nine: `queued`, `preparing`, `running`, `waiting_for_input`, `paused`,
`succeeded`, `succeeded_with_warnings`, `failed`, `cancelled`; the last four are terminal, and terminal
states are never overwritten by cancellation, timeouts, or late results.

A task snapshot carries `recoveryDisposition`: `none` for normal tasks; a non-terminal task left behind
by a process restart keeps its last real state and is marked `inspect_required` — this does not mean it
is still executing. Inspect the external project again first, then let the recovery use case decide
whether to continue or roll back.

`task.requestCancellation` binds `taskId` and `commandId` and may carry the `observedRevision` the user
saw when clicking (diagnostic only; normal progress that changed the revision does not reject the
cancellation). The response distinguishes `requested` / `already_requested` / `already_terminal`.
Requesting cancellation is not cancellation: the UI may show cancellation as complete only after the task
has ended at a safe boundary and committed the `cancelled` terminal state.

A task created by `task.startDemo` follows exactly the same nine states, events, and cancellation
semantics as a real task; the only difference is that its payload is a demonstration and carries no user
data.

## Environment snapshot semantics

`environment.getSnapshot` returns **presence facts** for the two zones (`play` / `create`) and makes no
severity ruling: each check carries a stable `checkId`, `zone`, `presence` (`detected` /
`not_detected` / `detection_failed`), `capturedAt`, and engineering `facts` (raw observations such as
paths, versions, byte counts). `errorCode` is set only when the observation itself failed; a missing
component is a normal finding, not an error. Whether an absence constitutes a problem, and with what
severity it is presented, is decided by the consumer (presentation layer, fix plans). The vocabulary
stays aligned with the B6 environment detection spike (`EnvironmentSnapshotV1` in
`crates/orchestrator/src/environment.rs`).

## Operation-level capability

Capability reports `available` / `unavailable` per operation under a stable `operationId`, with a
structured reason for unavailable entries. Module-level "ready / degraded / unavailable" is only a
presentation-side derivation of the operation entries and never overrides a concrete operation verdict.
For example, a wrong Unity version can keep environment diagnostics available while rejecting project
mutation; offline package management can allow cache reads while refusing refresh.

## Provider interface

The Provider is a trusted Kernel-internal interface providing:

1. `start()`: returns the supported application contract version, Provider build identity, and instance
   identity;
2. `invoke()`: accepts only the explicit application request union — no generic channel and no arbitrary
   method names;
3. `subscribe()`: subscribes to typed application events; unsubscribing affects only the observer and
   never the task lifecycle;
4. `prepareShutdown()`: closes the entry for new calls first, then waits for in-flight mutating tasks to
   reach a safe boundary within a bounded, explicit timeout;
5. `continueShutdown()`: after the timeout accepts only `wait` or a `force` carrying a user decision ID;
   a Provider never equates a timeout with a forced exit on its own.

A normal shutdown returns `safe_to_stop`; exceeding the limit returns `needs_user_choice` with a summary
of still-blocking tasks. The Provider's hosting form, handshake framing, crash supervision, and process
tree policy are defined by the
[Supervised Provider Process Protocol v0.1](provider-process-v0.1_EN.md).

## Presentation projection

The presentation layer may project contract vocabulary for display (state names, groupings, copy keys),
but projections must be total: when the contract adds a state that a projection does not cover, tests
fail rather than the code silently falling into a default branch. Projections never alter contract facts —
caches, display, and diagnostics always reference the original contract values.

## Verification gates

- TypeScript types and runtime checks reject unknown versions, unknown methods, and mixed
  Command/Query shapes;
- The mock Provider verifies read-only queries, command idempotency, terminal-state priority,
  operation-level capability, and snapshot re-fetch after event gaps;
- The mock Provider verifies that the demo task walks the full nine-state chain and is cancellable;
- Stopping new calls, safe shutdown, post-timeout choices, and forced exit all require a user decision ID;
- Mapping tests between the contract and presentation projections stay total;
- Tests do not depend on Rust, Electron, FFI, network, SQLite, or real Unity.

## Revision history

- 2026-09-02: B1 candidate contract. Four-method minimal surface: `application.getSnapshot`,
  `task.list`, `task.get`, `task.requestCancellation`.
- 2026-09-04: F2 extension. Added `environment.getSnapshot` (aligned with the presence-fact vocabulary
  of the B6 environment detection spike) and `task.startDemo` (capability-gated demo task command);
  replaced the former "B1 does not add …" restriction paragraph with the "Versioning and evolution"
  growth model; added "Presentation projection" and the corresponding verification gates.
