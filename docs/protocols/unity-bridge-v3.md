# Unity Bridge protocol v3


> Document version: v3
> Status: **Frozen** (2026-09-13, proposal 016 three-tree stance closure:
> core 0:0x five points, data 0:2x four points, desktop 1:4x three points,
> all zero revision opinions; the freeze batch goes to integration
> acceptance)
> Protocol version: 3
> Updated: 2026-09-13
> Normative force: yes; the JSON structures in `schemas/unity-bridge/v3/`
> are the machine-decidable source of truth
> Source rulings: proposal 016 (operation-shape proposal 2026-09-12 23:4x;
> core/data/desktop stances closed, integration arbitration on record)

## Purpose and boundary

Unity Bridge v3 connects the Orchestrator with the global Unity `2022.3.22f1`
Editor Package. v3 is a **frozen superset of v2** (same-face upgrade, the
v1→v2 precedent repeated): all v2 operations and fields are preserved
unchanged; v3 adds the three M7 read-only inspection operations (the
producing layer of the five inspection-evidence dimensions) and legalizes
the `instanceGlobalObjectId` receipt field.

Three families coexist (semantically aligned, never merged): the material
line keeps consuming v1 (production-use-case v0.1); the production job line
keeps consuming v2 (**the v3 freeze does not switch the production job face
— the provider production-job-face migration to v3 belongs to a later slice;
until that migration the v2 production path remains in effect**); the
inspection read face consumes v3 (driven by the core task-based
`inspection.requestRun`, transcribed into inspection-evidence v0.1).

## Editor precondition

Inherited from v1/v2: the Bridge is accepted for production execution only
when the editor and project match `2022.3.22f1` exactly; a mismatch is
rejected typed as `bridge.editor_version_unsupported` with the project left
untouched.

## Transport

Inherited from v1/v2 job-directory discipline (atomic writes under
`.vua/bridge/` + `BridgeEntryPoint.Run`); v3 changes nothing on the
transport face.

## Command envelope

Requests must conform to
[`command.schema.json`](../../schemas/unity-bridge/v3/command.schema.json)
(`schemaVersion` const 3). The full v3 operation set = the full v2 set (see
the [v2 protocol](unity-bridge-v2.md)) + ★ the three read-only inspection
operations:

| operation | mode | purpose |
| --- | --- | --- |
| ★ `inspect_avatar_references` | read-only (`dryRun` forced true) | Deterministic Unity observation of asset-reference integrity inside the Avatar hierarchy: missing meshes, missing material slots, missing script components (empty `m_Script` references) — the dependencies-dimension producing layer |
| ★ `inspect_lighting` | read-only (`dryRun` forced true) | Deterministic enumeration of active-scene lighting facts: realtime (unbaked) light presence, baking state, reflection-probe presence — the lighting-dimension producing layer |
| ★ `inspect_upload_readiness` | read-only (`dryRun` forced true) | Unity-side observable prerequisites for SDK upload: Avatar Descriptor presence, VRChat SDK prerequisite components (`upload_readiness.sdk_absent` stated honestly when the SDK is not imported), build-target facts — the upload-readiness-dimension producing layer |

The v3 increment discipline for the three operations (proposal 016
operation-shape proposal, core stance accepted):

- **Read-only**: `dryRun` forced `true` (v1 check-operation precedent);
  the payload takes only `avatarGlobalObjectId` (the `analyze_performance`
  precedent).
- **Findings travel as typed diagnostics codes** (dot-namespaced, severity
  closed set info|warning|error): e.g. `references.missing_mesh|
  missing_material|missing_script` (error), `references.clean` (info),
  `lighting.realtime_lights_present` (warning),
  `upload_readiness.descriptor_missing` (error),
  `upload_readiness.sdk_absent` (warning).
- **Read-only observation discipline**: check codes state deterministic
  Unity-observed facts only — no invented subjective quality thresholds,
  never posing as official ratings; the `official_sdk_rating` reserved-value
  discipline is unchanged (disabled until the official SDK handoff slice
  lands).
- **Zero new result-data fields** (except the `instanceGlobalObjectId`
  legalization); the v1/v2 files are untouched and all v1/v2 vectors remain
  valid; the core `UnityOperation` `is_mutating` closed listing does not
  include the three new operations (core stance 1 pre-declaration honored).

## Inspection receipts

Results must conform to
[`result.schema.json`](../../schemas/unity-bridge/v3/result.schema.json)
(`schemaVersion` const 3). A v3 receipt = the full v2 receipt face + one
legalization:

- `data.instanceGlobalObjectId` — the proposal-011 reserved field that had
  zero assignment since its aa2a9da introduction is legalized and honored in
  this version: the `install_modular_asset` receipt of
  `execute_production_job` writes the instance-root GlobalObjectId (empty
  placeholder becomes factual transcription). **v2 drift declaration**: the
  historical serialization behavior of the single C# implementation
  (JsonUtility serializing the empty string into v2 receipts, conflicting
  with the v2 schema `additionalProperties:false`) is routed around by the
  v3 migration; the frozen v2 files are untouched.
- Inspection-receipt discipline: a succeeded inspection receipt carries at
  least one diagnostic (a completed check always has a conclusion) and an
  empty `changedPaths` (read-only operations change nothing).

## Version rules

All v2 rules carry over; the three-family coexistence adds: v1 (material
line) / v2 (production job line) / v3 (inspection read face) each keep their
own frozen schema, semantically aligned and never merged; the v2→v3
production-job-face migration belongs to a later slice — until it lands, v3
must not be cited as done on the production job face.

## Document changelog

- v3 (2026-09-13): the inspection read-face protocol — the three read-only
  operations `inspect_avatar_references` / `inspect_lighting` /
  `inspect_upload_readiness` (proposal 016 §7 hard precondition 1) + the
  `data.instanceGlobalObjectId` legalization (proposal-011 legacy defect
  honored); frozen after the proposal 016 three-tree stance closure (core
  0:0x / data 0:2x / desktop 1:4x, zero revision opinions). Landed-material
  precedent: the schema + 11 vectors + Rust consumer tests + the C#
  implementation landed with the anchor implementation batch (7d63abe);
  this batch completes the contract-face freeze (bilingual protocol +
  REGISTRY + contract table). The C# EditMode contract tests are landed but
  never run on a real machine (W25) — zero end-to-end claim.
