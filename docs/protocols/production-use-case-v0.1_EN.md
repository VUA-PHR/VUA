# VUA Production Use-Case Contract v0.1

[English](production-use-case-v0.1_EN.md) | [简体中文](production-use-case-v0.1_ZH.md)

> Document version: 0.1
> Status: **Frozen (2026-09-07, at M3 acceptance)**. All four freeze preconditions are
> delivered and verified:
> ① precise per-method request/response Schemas (`schemas/amf-production/v0.2/methods/`,
> T1); ② shared TS/Rust fixture JSON vectors (`schemas/amf-production/v0.2/vectors/`,
> 5 positive / 3 negative); ③ bidirectional Provider/Gateway contract tests
> (`crates/provider-host/tests/m3_vectors.rs` and
> `apps/desktop/src/electron/m3-vectors.test.ts` consume the same vector directory);
> ④ a real Electron → Rust → Unity smoke run (I-1 real-machine matrix 16/16 cells
> passed, evidence `_local_w1/`; merged 5ccace6).
> History: on 2026-09-06 the 2026-09-05 freeze claim was withdrawn — review verified
> 6/7 mismatches between the real TS/Rust parameter surfaces, with no request/response
> JSON Schemas and no cross-language fixture vectors; "frozen" was not accurate, and
> returning to candidate is what the honesty discipline requires. The 2026-09-05
> vocabulary, lifecycle-to-task mapping and confirmation/recovery discipline remained
> as the candidate baseline and are verified into this freeze. The domain-reference
> shape (`planId`/`inspectionId`/`buildRecordId` over re-submitted paths) and the
> versioned BuildRecord evidence summary were revised in the T1 slice.
> Scope: the command and query surface of the first production vertical use case (one
> synthetic Avatar + one clothing item; dual material intake via direct `.unitypackage`
> import and local VPM build/install)
> Updated: 2026-09-07
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
[Material Intake Protocol v0.1](material-intake-v0.1_EN.md) schema `mode` enum:

- `direct_unity_package`: the source `.unitypackage` is imported into the target project
  as-is;
- `local_reusable_vpm`: a `local-reusable` VPM package built in an isolated Unity staging
  project, installed through the VUA `vrc-get` package manager.

(`unitypackage_direct` / `local_vpm` — the draft's provisional words — are retired;
GLM/frontend `b3318e0` aligned the port, fixtures, entry defaults, and i18n tables.)

Material file selection goes through an explicit Kernel file-dialog action (the
`vua:dialog:pick-material-source` preload surface); the Renderer holds no filesystem
handles, and the Kernel resolves the `source` reference before handing it to the Provider.

## Vocabulary freeze

### Build Record: authority and display are two vocabularies

- **Authority (contract fact)** — `BuildRecordAuthorityStatus`, the five states of
  `BuildRecordV01` (`build_record.rs` v0.1): `succeeded` / `succeeded_with_warnings` /
  `failed` / `cancelled` / `recovered`. The record also carries the structured fields
  `restoreAttempted: boolean` and `restoreSucceeded: boolean | null` (the latter present
  only when a restore was attempted).
- **Display (projection)** — `BuildRecordDisplayStatus`, four states:
  `completed` / `aborted` / `rolled_back` / `rollback_failed`, derived by the following
  frozen mapping:

| Authority status | Snapshot evidence (restoreAttempted / restoreSucceeded) | Display |
| --- | --- | --- |
| `succeeded` | — | `completed` |
| `succeeded_with_warnings` | — | `completed` (warnings surface through facts/diagnostics) |
| `failed` or `cancelled` | false / — (**aborted before any mutation**) | `aborted` |
| `failed` | true / true | `rolled_back` |
| `failed` | true / false | `rollback_failed` |
| `cancelled` | true / true | `rolled_back` (the cancellation fact travels via `run.cancelled`) |
| `recovered` | — | `completed` (completed after recovery) |

`aborted` (added at freeze, GLM/frontend `b3318e0`) honestly covers "inspected but
never executed — nothing mutated"; neither `completed` nor `rolled_back` would be true.

### Findings, plannability, and plan deltas

The B side adopts the Renderer wordlists: `InspectionFindingKind`
(`compat` / `missing` / `conflict`), `Plannability`
(`plannable` / `needs_attention` / `not_plannable`), and `PlanDiffKind`
(`added` / `changed` / `resolved`). Executable-risk evidence from the material-intake
inspection is reported as findings carrying `recoverable` / `retryable` marks.

### Stage mapping (B step kinds → workflow stages)

| B step kind (`MaterialIntakeStepKind`) | Workflow stage |
| --- | --- |
| `verify_source` | `inspect` |
| `create_snapshot` | `snapshot` |
| `import_unity_packages` | `execute` |
| `create_local_vpm_package` | `execute` |
| `preview_vpm_install` | `execute` |
| `apply_vpm_install` | `execute` |
| `validate_minimum_structure` | `validate` |
| `write_build_record` | `completed` |

### Facts are opaque

`BuildRecordFacts` (snapshot / bridgeJob / localVpm / validation) travel as opaque JSON
serializations of the corresponding Rust evidence sections; `bridgeJob` serializes **all**
Bridge jobs of the run, not only the last. The Renderer displays them verbatim.

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

## Confirmation and recovery discipline

- Plan review before `confirmPlan` is a distinct user stage: the confirmation binds the plan
  revision, and a changed plan invalidates it (the `expired` run-state) — the frontend
  presents "confirmation expired" honestly and never re-confirms automatically;
- Both `continue` and `rollback` in `recover` must carry a Kernel-generated user decision ID
  (the same discipline as the Provider shutdown protocol); recovery is a task, not an
  instant action;
- Cancellation semantics follow the global task contract: requesting cancellation is not
  cancellation — the UI shows cancellation as complete only after the task ends at a safe
  boundary;
- Receipts replay only when they SUCCEEDED for the same plan hash, project, and source
  identity; failed and cancelled runs retry fresh under attempt-suffixed record ids with
  attempt-unique recovery snapshots (B3 executor contract, material-intake v0.1).

## Capability and verification gates

- Every method is gated per operation under `production.*` capabilities; unavailable entries
  do not render;
- The mock Provider must be able to script all five lifecycle presentations: success,
  cancellation, drift (`failed_recoverable`), timeout (`expired`), and rollback
  (recover → rollback success/failure);
- F3 acceptance = the presentation layer covers all five presentations against the mock
  Provider, and the real two ends re-verify them at the M3 integration gate;
- Real-machine status at freeze: the direct path and the stale-fingerprint rejection have
  passed against real Unity 2022.3.22f1; the local-reusable slice has passed end to end
  (staging template + Bridge materialize + deterministic publish + real vrc-get install +
  target validation).

## Revision history

- 2026-09-07: **Frozen (at M3 acceptance).** All four freeze preconditions delivered and
  verified (seven-method Schemas, shared fixture vectors, bidirectional contract tests,
  I-1 real-machine matrix 16/16 cells); status moves to Frozen. The withdrawal history is
  preserved in the status block (honesty discipline), not deleted.
- 2026-09-06: **M3 revision (T1 landed).** The seven-method parameter face
  moves to domain-reference shapes: `startInspection` takes the four-tuple
  (paths bound once), `requestPlan = {inspectionId, mode}`, `confirmPlan =
  {planId, observedRevision, riskChoice, rememberForSession?}`, `recover =
  {taskId, decision, decisionId}`, and the query faces address records by
  domain identity; `getBuildRecord` responds with the v0.2 projection
  (evidenceSummary replacing the opaque facts JSON); the `inspectionId`/
  `planId` domain registry and the `riskChoice` enum
  (snapshot_and_continue/continue/cancel/not_required) are pinned by
  `schemas/amf-production/v0.2/` with fixed vectors. This lands the cosigned
  main draft (`m3-production-revision-b-draft` + F cosign); the status
  remains M3 candidate until acceptance freezes it.
- 2026-09-05: **Frozen.** Vocabulary rulings from the B-line reply and the F-line
  confirmations (`b3318e0`): BuildRecord authority/display dual vocabulary with the
  `aborted` display state and the snapshot-evidence mapping; `SourceIntake` aligned to the
  material-intake schema enum (`direct_unity_package` / `local_reusable_vpm`); stage
  mapping table added; facts defined as opaque JSON with `bridgeJob` carrying all jobs;
  batchmode `ImportPackage` no-op documented — batchmode execution uses the
  `materialize_extracted_package` Bridge operation (unity-bridge v1).
- 2026-09-04: B3/F3 candidate draft. Seven-method surface, lifecycle-to-task mapping, dual
  material intake, confirmation and recovery discipline, value-semantics seeds
  (BuildRecordV01 / material-intake / workflow stage vocabulary).
