# Unity Bridge Protocol v2

[English](unity-bridge-v2_EN.md) | [简体中文](unity-bridge-v2_ZH.md)

> Document version: v2
> Status: Frozen
> Protocol version: 2
> Updated: 2026-09-08
> Normative effect: Yes; JSON structures are machine-adjudicated by `schemas/unity-bridge/v2/`
> Source rulings: proposal 009 (mutual review closed: review points 1–5 all closed + core
> confirmation of the planRef form)

## Purpose and boundary

Unity Bridge v2 connects the Orchestrator with the global Unity `2022.3.22f1` Editor Package
and serves the M5 production line (Recipe → Local Resolution → approved plan → job execution
→ Build Record). The Orchestrator owns user intent, resolution, approval, version-lock
checks, snapshot and recovery orchestration; the Bridge only validates and executes Unity
operations from an approved plan. The Bridge accepts no arbitrary scripts and owns no account
login, asset download, source selection, or VRChat upload.

v2 is a **frozen superset of v1** (same-face upgrade): all v1 operations and fields are
preserved; the material line (production-use-case v0.1) keeps consuming v1. The two families
coexist with aligned semantics and are not merged.

## Editor preconditions

Same as v1: the Bridge is accepted for production execution only when the Editor and the
project match `2022.3.22f1` exactly; a mismatch is rejected with
`bridge.editor_version_unsupported`, leaving the project untouched. The support matrix is
owned by the [Unity editor compatibility policy](../compatibility/unity-editor_EN.md).

## Transport

The v1 job-directory discipline carries over: the Orchestrator atomically writes the request
file under `.vua/bridge/` of the target project, then launches Unity
(`-executeMethod Vua.Editor.Bridge.BridgeEntryPoint.Run` with `-vuaRequest`/`-vuaResult`);
results are atomically switched via a same-directory temp file.

**v2 addition (file form of the approved plan, 009 ruling)**: for `execute_production_job`
the plan document is written by the provider into the job directory as a file, referenced by
`payload.planRef`; `payload.planHash` travels with the command. **After reading the plan
file the Bridge must locally verify its SHA-256 against planHash; on mismatch it rejects
with a typed error (`plan_hash_mismatch`) — no execution, no partial state.** Plan
integrity does not depend on provider honesty alone.

## Command envelope

Requests must conform to
[`command.schema.json`](../../schemas/unity-bridge/v2/command.schema.json). The v2 operation
set (the ten v1 operations keep their semantics, see the
[v1 protocol](unity-bridge-v1_EN.md); ★ = new in v2):

| operation | mode | purpose |
| --- | --- | --- |
| ★ `execute_production_job` | inspect or modify | Execute the ordered job sequence of an approved plan; input = the plan reference triple (`planHash` / `planSchemaVersion` (supported closed set, outside = rejection) / `planRef`), no inlined plan fields |
| ★ `restore_project` | inspect or modify | Roll the project back to a registered recovery point by `payload.snapshotId`; real runs demand the optimistic lock |

The ten v1 operations (`inspect_project`, `import_unity_package`,
`materialize_extracted_package`, `create_local_vpm_package`, `validate_asset_paths`,
`identify_assets`, `install_outfit`, `create_toggle`, `validate_avatar`,
`analyze_performance`) keep their modes, required payloads, and fingerprint constraints
verbatim in v2.

**Modify mode and optimistic lock**: modifying operations (`dryRun: false`), including both
new v2 operations, must carry `expectedProjectFingerprint`; on mismatch the Bridge rejects.
Acceptance-side version-lock and environment pre-checks belong to the provider (cheap to
expensive: version lock → environment → fingerprint); the Bridge fingerprint lock is the
final execution-time defense (TOCTOU between acceptance and execution).

**Plan hash and idempotency**: the job replay key = `planHash` + project +
`planSchemaVersion`. A `succeeded` receipt under the same key replays as an existing receipt
with `replayed: true` without re-execution; a different plan hash is a new job. The
`commandId` association follows v1 (receipts persisted under `.vua/bridge/completed/`; an
interrupted process means unknown result — re-Inspect, never auto-replay).

Executable fixed examples live in `schemas/unity-bridge/v2/examples/`. Examples contain
synthetic identifiers and fingerprints only.

## Job receipts

Results must conform to
[`result.schema.json`](../../schemas/unity-bridge/v2/result.schema.json). On top of the v1
result face (`status` / `changedPaths` / `diagnostics` / `data.projectFingerprint` etc.), an
`execute_production_job` receipt adds:

- `operation` echo and `data.dryRun` — **dry-run and real-run receipts share one schema,
  distinguished by the explicit `dryRun` field; a dry-run receipt never poses as a real
  run**;
- `data.steps[]` — the per-operation list: the to-be-executed list (`pending`) for dry-runs,
  the executed list (`executed`/`failed`/`skipped`) for real runs; the `kind` vocabulary is
  owned by the approved-plan schema (recipe v0.3, outside = contract error), transcribed
  verbatim by the Bridge;
- `data.steps[].resolvedSource` — the per-operation actually-consumed source
  (`sourceKind: original | generated_vpm`, `artifactSha256`, nullable `warehouseItemId`),
  **transcribed from the plan declaration, selection semantics never re-interpreted**
  (selection belongs to Local Resolution), so the Build Record can audit "which copy was
  actually used";
- `data.replayed` — the idempotent-replay marker;
- `data.snapshotId` and `data.projectFingerprintBefore` — the pre-job snapshot and
  before-fingerprint of real runs (**a rejected receipt carries neither: they are evidence
  of executed change, not of dryRun=false**).

The `restore_project` receipt: two states — `status: succeeded` (restored) or `failed` (with
`code=restore_failed`), with `data.restoredFrom` referencing the rollback target snapshot;
no third state is invented.

## Recovery point registration

Snapshot identity is assigned by the Bridge-side snapshot mechanism; the registration face
is the Build Record's `recoveryPoints[]` (proposal 012: `{ snapshotId, phase, createdAt }`,
minimal implementation = a single `pre_job` point; the `post_job:<jobId>` vocabulary is
reserved and not shot in M5). Recovery authorization and decision records belong to the
Orchestrator.

## Version rules

- The v2 schema allows implemented operations only; planned operations never enter the enum
  early.
- Optional additive fields that old consumers can ignore may keep the protocol version;
  changed field semantics, requiredness, or execution guarantees publish a new version.
- The Orchestrator model, JSON Schemas, C# DTOs, and fixed tests must update in the same
  change.
- Package version is independent of protocol version.
- v1 and v2 coexist: the material line keeps consuming v1, the production line consumes v2;
  both schema sets are frozen separately with aligned semantics, not merged.

## Document changelog

- v2 (2026-09-08): production-line protocol — `execute_production_job` / `restore_project`
  operations, the job-directory file form of the approved plan with Bridge-side local hash
  verification, job receipts (explicit dry-run split + per-step source transcription +
  replay echo + snapshot identity), recovery-point registration face; frozen after proposal
  009 mutual review closed (review points 1–5 all closed).
