# VUA Application Contract v0.1

[English](application-contract-v0.1_EN.md) | [简体中文](application-contract-v0.1_ZH.md)

> Document version: 0.1
> Status: **Frozen (M2, 2026-09-04) — stable Gateway v1**
> Scope: application semantics between the Electron Kernel and an Orchestrator Provider
> Updated: 2026-09-04
> Authority: binds Kernel, Provider, and Renderer implementations; breaking changes require a
> version bump, new methods follow the "Versioning and evolution" registration and the revision
> history

## Purpose and boundary

This contract defines application values independent of hosting, FFI, processes, and message transport.
Electron Main/Kernel maps allowed Gateway calls into this contract; a Provider explicitly maps the contract
into Rust application use cases. The Renderer consumes only the Gateway surface mapped by the Kernel and
never sees Provider lifecycle objects, Rust types, SQLite rows, journal payloads, or child-process messages.

The version value is the string `0.1`. Every request, response, event, handshake, and lifecycle result
carries it; unknown versions are rejected explicitly.

## Versioning and evolution

The method surface grows with vertical slices, and this document is the single registry: every new method
must be registered here with its owning use case, port, and capability gating. The contract was frozen as
stable Gateway v1 at M2 (2026-09-04): breaking changes now require a version bump; new methods continue to
be registered incrementally, recorded in the revision history with an explicit backward-compatibility
statement.

## Method surface

| Kind | Method | Semantics | Introduced |
| --- | --- | --- | --- |
| Query | `application.getSnapshot` | Returns the application revision and operation-level capabilities | B1 |
| Query | `task.list` | Returns the authoritative snapshots of currently visible tasks | B1 |
| Query | `task.get` | Returns one authoritative task snapshot | B1 |
| Command | `task.requestCancellation` | Submits a monotonic, idempotent cancellation intent for a stable task instance | B1 |
| Query | `environment.getSnapshot` | Returns the read-only environment presence snapshot for both zones | F2 |
| Command | `task.startDemo` | Capability-gated demonstration command: creates one observable, cancellable demo task | F2 |
| Command | `production.startInspection` | Starts Inspect for the first production use case (dual material intake; candidate) | B3/F3 |
| Query | `production.getInspection` | Reads an inspection result (compatibility/missing evidence) | B3/F3 |
| Command | `production.requestPlan` | Derives an execution plan from an inspection result | B3/F3 |
| Query | `production.getPlan` | Reads a plan for review | B3/F3 |
| Command | `production.confirmPlan` | Confirms the plan and enters the snapshot → execute → validate chain | B3/F3 |
| Command | `production.recover` | Recovers a failed/expired outcome (continue / rollback) | B3/F3 |
| Query | `production.getBuildRecord` | Reads the minimal Build Record | B3/F3 |
| Query | `overlay.getSnapshot` | Returns the overlay's one-glance read-only snapshot: task cards plus the production-status and download card projections | M7 |
| Command | `release.openForHandoff` | Official-SDK upload handoff (tasked): buildId → task nine states → handoff fact document (no upload-status field) | M7 |

The seven `production.*` methods are the registered surface of the
[Production Use-Case Contract v0.1](production-use-case-v0.1_EN.md) (B3 candidate draft):
lifecycle-to-task mapping, dual material intake, confirmation and recovery discipline, and
value-semantics seeds live there; until B3 freezes the implementation it constrains neither
side.

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

When a task completes normally (`succeeded` / `succeeded_with_warnings`), the snapshot carries an
optional `result` field: the Done payload the task actually handed back, **verbatim**, with the same
value the `task.completed` event publishes (both project the single stored task result, so the snapshot
and event channels can never disagree). Frozen invariants: `failed` / `cancelled` / non-terminal /
`inspect_required` snapshots **never** carry a `result` (the failure fact travels the `error` field);
`result` is always an object — a null result is projected as field-absent, never as a `null` value.
The snapshot face makes no structural promise about the payload's internal shape — the shape is owned
by the word list of the operation that produced the task (`project-ops` payloads self-describe via
`schemaVersion`/`operation`; production-family payloads follow the production use-case word list), so
this face and the operation word lists evolve independently. The field is a backward-compatible,
additive increment (2026-09-12, BOARD #22 result-reflux ruling, proposal 020); the machine-readable
face and positive/negative vectors live in `schemas/application-contract/v0.1/`.

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

## Overlay read-face semantics

`overlay.getSnapshot` (M7, proposal 017 batches 1–2) is the desktop overlay's on-demand polling
query: one call returns the read-only projections an overlay's one-glance surface renders —
the **task cards** (a projection of the task store, oldest first: taskId/state/correlationId),
the **production-status card** (a field-trimmed projection of the production-use-case
v0.2 plan/record faces: the current plan is the document with the newest `createdAt`, the
latest Build Record is the document with the newest `finishedAt`; the "current/latest"
semantics are defined on the core service-authority side, and the two halves are
independently nullable — when the authority holds no fact the half is `null`, never a
synthesized row), and the **download card** (batch 2: a field-trimmed projection of the
non-terminal `dl-` prefixed attempts in the task store — downloadId/state/updatedAt,
enqueue order; the presentation stance is "rendered while items are in flight", an empty
set is the honest empty card; no byte progress — progress travels the task-event channel
and the snapshot never invents it, the same baseline as the main-line TaskSnapshot;
completed deliveries keep their authoritative consumer, the import page's
`downloads.listCompleted` face, and stay off the overlay glance). The projection is a pure
function: it carries **no query instant and no
aggregate revision** — two unchanged queries observe the same payload, and polling never
changes what it observes. Card vocabularies (the nine task states, the plan lifecycle, the
record statuses, the download attempt states) pass through verbatim from their owning frozen
faces and are deliberately
not re-enumerated here. `downloadCard` is a backward-compatible optional increment (a
batch-1-generation snapshot without the field stays valid). The overlay carries **zero
session identity**: its queries are
indistinguishable from the main line's; semantic actions travel the existing command face
(the same acceptance path and the same nine-state discipline) — no overlay-specific write
vocabulary is added. When the production read face is not wired, the method answers a typed
`vua.overlay.unavailable` — honest absence, never a silent empty snapshot. The
machine-readable face and the positive/negative vectors live in
`schemas/application-contract/v0.1/overlay-snapshot.schema.json`.

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
- 2026-09-04: **M2 freeze**. After the B1/F2 surface passed the real integration acceptance
  (supervised provider process, SQLite authoritative state, five delivery evidences), it is
  promoted to stable Gateway v1; the `production.*` surface remains a B3/F3 candidate draft.
- 2026-09-04: Registered the production use-case surface (B3/F3 candidate draft). The seven
  `production.*` methods; lifecycle, dual material intake, and value semantics live in the
  [Production Use-Case Contract v0.1](production-use-case-v0.1_EN.md).
- 2026-09-12: Task-snapshot `result` reflux increment (BOARD #22 attribution ruling, option 1
  adopted; proposal 020). The task snapshot gains an **optional** `result` field: on normal completion
  the snapshot channel refluxes the Done payload verbatim, same-source and same-value as the
  `task.completed` event payload; failed / cancelled / non-terminal snapshots never carry it.
  Backward-compatible increment: the frozen snapshot shape, invariants, and the six positive/negative
  vectors (`schemas/application-contract/v0.1/`) are frozen by Core with this batch; the
  `task.get`/`task.list` projection consumer tests and the demo-task cancellation negative ride the
  same batch (provider-host `task_snapshot_wire`). Background: the import-copy renderer narrowed
  result-document shapes while the live wire only ever showed the task acceptance receipt — the result
  document had no channel to the renderer (a cross-batch seam; F6 live degrades honestly).
- 2026-09-12: Registered the overlay read face (M7, proposal 017 batch 1, claimed by Core once the
  desktop §4 three-stance set landed). New `overlay.getSnapshot` query: an on-demand polling, read-only
  projection of the task cards plus the production-status card — a pure-function face (no query instant,
  no aggregate revision), zero overlay session identity, semantic actions stay on the existing command
  face; an unwired production face answers a typed `vua.overlay.unavailable` (honest absence).
  Backward-compatible increment (new-method registration, existing faces unchanged): the machine-readable
  face and the six vectors (`overlay-snapshot.schema.json`, 3 valid + 3 invalid) are frozen by Core with
  this batch; consumer tests ride the same batch (provider-host `overlay_wire` frame loop +
  `@vua/contracts` guards).
- 2026-09-15: Overlay read face batch 2 (M7, proposal 017 batch 2; trigger = the desktop consuming
  batch 1 is on record — DesktopOverlaySurface consumes `overlay.getSnapshot`, so the 017
  "await-consumption" condition is cleared). The `overlay.getSnapshot` result face gains an
  **optional** `downloadCard` field: a field-trimmed projection of the non-terminal `dl-` prefixed
  attempts in the task store (downloadId/state/updatedAt, enqueue order), presentation stance =
  "rendered while items are in flight"; no byte progress (progress travels the task-event channel and
  the snapshot never invents it — pinned by a negative vector); completed deliveries keep their
  authoritative consumer `downloads.listCompleted` (the import page) and stay off the overlay glance.
  Backward-compatible increment (existing faces unchanged; a batch-1-generation snapshot without the
  field stays valid): the machine-readable face and the eight vectors (`overlay-snapshot.schema.json`,
  4 valid + 4 invalid) are frozen by Core with this batch; consumer tests ride the same batch
  (provider-host `overlay_wire` frame loop + `@vua/contracts` guards). The inspection card stays off
  the overlay first screen per the desktop stance (017 §5 reference-not-copy) and is not delivered in
  this batch.
- 2026-09-16: registered `release.openForHandoff` (M7, proposal 023 core freeze batch; hard
  precondition 1 closed with both halves on record — the desktop stance 469ef5c via the 52nd
  wave + the production stance's five points (landing with the wt-4 batch), ②③④ with this
  batch, ⑤ vacuous — the Bridge command face presumes an already-open project, so the handoff
  is editor-process lifecycle management, implementation domain = the process/window face,
  unity-bridge v3 gains zero operations). The official-SDK upload handoff tasked command:
  params closed single key `{buildId}` (core ruling amending the 023 section-3 draft — the
  project identity's authority lives on the build-record face, repeating it in params creates
  a dual-source reconciliation face with zero gain); the acceptance reply follows the
  `inspection.requestRun` shape; the completion judgment = the Bridge handshake arrival (the
  001 chain), focus never enters the contract facts, the unified task nine-state single form;
  the succeeded snapshot's result carries the handoff fact document (closed five keys
  schemaVersion/buildId/projectId/editor/occurredAt, **no upload-status field** — honesty
  rules 1/2 pinned by shape, guarded by the negative vector); closed four-code error set
  `vua.release_handoff.*` (unavailable/invalid_params/build_unknown/editor_unresolved).
  Backward-compatible increment (a new method registration, the existing face zero-changed):
  the machine-readable face and six vectors (`schemas/release-handoff/v0.1/`, 3 positive
  3 negative) are frozen by Core with this batch; consumer tests ride the same batch
  (provider-host `release_handoff_wire` frame loop + `@vua/contracts` guards + the mock
  absence branch). Unwired route = the `vua.release_handoff.unavailable` honest absence (the
  implementation domain — production port + core use case — lands in a later slice), never a
  fabricated acceptance/handoff fact. Vocabulary in the
  [release-handoff protocol v0.1](release-handoff-v0.1_EN.md).
