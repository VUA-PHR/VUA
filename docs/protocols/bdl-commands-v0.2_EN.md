# BDL Warehouse Write-Command Protocol v0.2 (artifact-mode trio + global-default write)

[English](bdl-commands-v0.2_EN.md) | [简体中文](bdl-commands-v0.2_ZH.md)

> **⚠️ Superseded by v0.3 (2026-09-08)**: the batch-import command
> `warehouse.import`, the generation audit-chain field `importCorrelationId`,
> and the terminology ruling (VPM package). The current normative text is
> [bdl-commands-v0.3_EN.md](bdl-commands-v0.3_EN.md); this document is kept as
> history only, matching `schemas/bdl-commands/v0.2/` (never edited).
> Document version: 0.2
> Status: **Superseded (→ v0.3)** (2026-09-08; formerly Frozen 2026-09-07 —
> the v0.2 vocabulary shipped with the M4 full shape and was verified through
> the provider-host routes)
> Machine-readable vocabulary: `schemas/bdl-commands/v0.2/` (schema +
> positive/negative vectors; consumer test
> `crates/bdl-store/tests/global_default_v02.rs`; the v0.1 directory is
> kept, never edited)
> Scope: the v0.1 trio (`warehouse.setArtifactMode` / `warehouse.generateVpm`
> / `warehouse.deleteOriginals`) plus the U8-ruled global-default write
> (`warehouse.setGlobalDefaultMode`, the global level of the two-level
> options)
> Ownership boundaries: `docs/architecture/bdl_EN.md` (BDL is an AMF-private
> local module); the server-side facts (guards, tasking, audit) live in
> `crates/acquisition` (maintenance flows) and `crates/bdl-store` (storage)
> Updated: 2026-09-07 (v0.2: global-default write added; two-level options +
> persistence-location decision landed)

## v0.2 revision (relative to v0.1)

The two-level options semantics of the U8 user ruling (the full experimental
settings shape lands with M4):

1. **`warehouse.setGlobalDefaultMode` added** (synchronous): persists the
   global level of the two-level options. `params: { mode }`,
   `mode ∈ { use_original_unitypackage, generate_vpm }` — **no null**: the
   global default always has a value (the provider's environment-injected
   initial default rules until the first write). The acceptance payload is
   the result: `{ globalDefaultMode }` — the persisted fact read back from
   BDL, never echoed from the request.
2. **Persistence-location decision (closing the 007 note)**: the global
   default persists in **BDL `bdl_meta`** (key
   `warehouse_global_default_mode`) — the mode is an AMF warehouse-domain
   business fact and BDL is AMF's private persistence layer; the provider
   environment variable is demoted to the initial default before the first
   write. The persisted value survives a reopened store; resolution stays
   `entry override ?? global default`, dynamic at read time, never a
   snapshot.
3. **The entry-level trio is unchanged**: params/acceptance/completion
   payloads are identical to v0.1 (including the null clear semantics).

## Frozen scope and division of labor

This protocol freezes the command **business vocabulary**: the operation
closed set, params, acceptance payloads, task completion payload shapes, and
stable error codes. The transport envelope (requestId / commandId / task
events) belongs to the versioned application contract; the core role
registers the method routes in the provider host, and the desktop role
registers the renderer TS face. A vocabulary change on either side must bump
this protocol version first.

## Command semantics

1. **`warehouse.setArtifactMode`** (synchronous): sets or clears the
   per-entry override. `params: { warehouseItemId, mode }`, null = clear
   (falls back to `override ?? global default`). The acceptance payload is
   the result: `{ warehouseItemId, effectiveMode }` — a query-time fact.
2. **`warehouse.setGlobalDefaultMode`** (synchronous, new in v0.2): see
   revision 1. The global level of the two-level options persists here; the
   entry override rules over it.
3. **`warehouse.generateVpm`** (tasked) / **`warehouse.deleteOriginals`**
   (tasked): identical to v0.1 — guards, audit, and completion payloads
   (delivered on the task surface) are unchanged.

## Server-side guards (server facts, never client assertions)

- Generation runs only in the `generate_vpm` effective mode, with original
  material, and with no existing generated copy (a generated copy is never
  silently replaced — delete the entry's VPM copy to regenerate);
- Deletion runs only in the `generate_vpm` effective mode with a generated
  copy that physically exists and passes its content-identity verification;
  each copy's file is removed before its row, so an interrupted run resumes
  with the remaining originals;
- Cancellation is observed at copy boundaries; a global-default write never
  affects in-flight tasks.

## Stable error codes

The same eight-code table as v0.1 (`invalid_state` /
`generated_artifact_missing` / `no_original_material` / `already_generated`
/ `entry_not_found` / `generation_failed` / `storeFailed` /
`maintenanceIoFailed`), semantics unchanged. The application-face code
annotation (`unavailable` / `invalid_params` transport-specific;
`entry_not_found` / `storeFailed` reused) carries over from v0.1.1 —
`setGlobalDefaultMode` out-of-vocabulary modes likewise map to
`invalid_params` (transport face).

## Dependency direction

```text
React View (settings experimental full shape / entry drawer)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (method routes: registered by core)
  → AMF application service (this protocol's provider; crates/acquisition /
    crates/bdl-store)
  → BDL local database (bdl_meta persists the global default)
```
