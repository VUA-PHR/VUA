# VUA Production Use-Case Contract v0.1 (B3/F3 candidate draft)

[English](production-use-case-v0.1_EN.md) | [简体中文](production-use-case-v0.1_ZH.md)

> Status: **B3 candidate draft** — until aligned with the B side and frozen with the first
> use-case implementation, it constrains neither side
> Scope: the command and query surface of the first production vertical use case (one
> synthetic Avatar + one clothing item; dual material intake via direct `.unitypackage`
> import and local VPM build/install)
> Updated: 2026-09-04
> Authority: the alignment baseline for the F3 presentation layer and the B3 application
> implementation; method names are registered in the application-contract v0.1 method table
> (introduced = B3/F3), with value semantics defined here

## Lifecycle and task machinery

Workflow stages reuse the existing vocabulary: `inspect → plan → await_confirmation →
snapshot → execute → validate → completed`, with anomalies landing in `recover` / `failed` /
`failed_recoverable` / `expired`. Every production command creates a standard task (nine
states, commandId idempotency, events + revision, cancellable) — the task center and the
workshop track need no special-casing. Stage vocabulary stays aligned with the Renderer's
`strings.workflowStage` and Unity Bridge v1; drift and timeout are runtime facts mapped to
the `failed_recoverable` / `expired` run-states, never new states.

## Dual material intake

`source.intake` has two values, aligned with the
[Material Intake Protocol v0.1](material-intake-v0.1_EN.md):

- `unitypackage_direct`: the source `.unitypackage` is imported into the target project
  as-is;
- `local_vpm`: a `local-reusable` VPM package built in an isolated Unity staging project,
  installed through the VUA `vrc-get` package manager.

Material file selection goes through an explicit Kernel file-dialog action (a new preload
surface designed with the F3 slice); the Renderer holds no filesystem handles, and the
Kernel resolves the `source` reference before handing it to the Provider.

## Method surface (all idempotent by commandId; all but queries create tasks)

| Kind | Method | Semantics |
| --- | --- | --- |
| Command | `production.startInspection` | Starts Inspect for a material + target combination, producing compatibility/missing evidence |
| Query | `production.getInspection` | Reads one inspection result (evidence, plannability verdict) |
| Command | `production.requestPlan` | Derives an execution plan from an inspection result (stages, risks, estimates) |
| Query | `production.getPlan` | Reads one plan for review |
| Command | `production.confirmPlan` | The user confirms the plan; enters the snapshot → execute → validate chain |
| Command | `production.recover` | Recovers a `failed_recoverable` / `expired` outcome (continue / rollback, carrying a user decision ID) |
| Query | `production.getBuildRecord` | Reads the minimal Build Record (outcome, stages, evidence) |

## Value semantics (seeded from existing Rust types)

- **Build Record**: mirrors `BuildRecordV01` from
  `crates/orchestrator/src/build_record.rs` — `recordId`, `status` (`BuildRecordStatus`),
  and the four evidence kinds (snapshot / Bridge job / local VPM / validation) travel as
  opaque `facts` payloads whose field names match the camelCase serialization of the Rust
  structs;
- **Inspection results**: findings such as compatibility claims, missing assets, and
  dependency conflicts (aligned with the material-intake vocabulary), each carrying
  `recoverable` / `retryable` marks;
- **Plan**: a staged action list whose stages reference the workflow stage vocabulary;
  user-visible deltas (plan vs inspection findings) are expressed as structured fields and
  never inferred by the frontend.

## Confirmation and recovery discipline

- Plan review before `confirmPlan` is a distinct user stage: the confirmation binds the plan
  revision, and a changed plan invalidates it (the `expired` run-state) — the frontend
  presents "confirmation expired" honestly and never re-confirms automatically;
- Both `continue` and `rollback` in `recover` must carry a Kernel-generated user decision ID
  (the same discipline as the Provider shutdown protocol); recovery is a task, not an
  instant action;
- Cancellation semantics follow the global task contract: requesting cancellation is not
  cancellation — the UI shows cancellation as complete only after the task ends at a safe
  boundary.

## Capability and verification gates

- Every method is gated per operation under `production.*` capabilities; unavailable entries
  do not render;
- The mock Provider must be able to script all five lifecycle presentations: success,
  cancellation, drift (`failed_recoverable`), timeout (`expired`), and rollback
  (recover → rollback success/failure);
- F3 acceptance = the presentation layer covers all five presentations against the mock
  Provider, and the real two ends re-verify them at the M3 integration gate;
- Before B3 freezes this document, field-level adjustments do not require a version bump
  (register them in the revision history).

## Revision history

- 2026-09-04: B3/F3 candidate draft. Seven-method surface, lifecycle-to-task mapping, dual
  material intake, confirmation and recovery discipline, value-semantics seeds
  (BuildRecordV01 / material-intake / workflow stage vocabulary).
