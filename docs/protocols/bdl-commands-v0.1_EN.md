# BDL Warehouse Write-Command Protocol v0.1 (artifact-mode trio)

[English](bdl-commands-v0.1_EN.md) | [简体中文](bdl-commands-v0.1_ZH.md)

> Document version: 0.1.1
> Status: **Frozen** (2026-09-07) — both ends wired (proposal 005, data-side two-end
> verification passed)
> Machine-readable vocabulary: `schemas/bdl-commands/v0.1/` (schema + positive/negative
> vectors; two-end consumer tests `crates/acquisition/tests/bdl_commands_contract.rs`
> and `crates/provider-host/tests/warehouse_commands.rs`)
> Scope: the three warehouse write commands reserved by revision 2 of
> `docs/protocols/bdl-queries-v0.3_EN.md` — `warehouse.setArtifactMode`,
> `warehouse.generateVpm`, `warehouse.deleteOriginals`
> Ownership boundaries: `docs/architecture/bdl_EN.md` (BDL is an AMF-private local
> module); the server-side facts (guards, tasking, audit) live in `crates/acquisition`
> (maintenance flows) and `crates/bdl-store` (storage)
> Updated: 2026-09-07 (0.1.1: application-face code annotation; business vocabulary
> unchanged)

## Frozen scope and division of labor

This protocol freezes the **business vocabulary** of the three commands: the operation
closed set, params, acceptance payloads, task completion payload shapes, and stable
error codes. The transport envelope (requestId / commandId / task events) belongs to
the versioned application contract (`docs/protocols/application-contract-v0.1_EN.md`);
the core role registers the method routes in the provider host, and the desktop role
registers the renderer TS face. A vocabulary change on either side must bump this
protocol version first.

## Command semantics

1. **`warehouse.setArtifactMode`** (synchronous): sets or clears the per-entry
   artifact-mode override. `params: { warehouseItemId, mode }`,
   `mode ∈ { use_original_unitypackage, generate_vpm, null }` (null = clear the
   override; dynamic resolution falls back to `override ?? global default`, the global
   default being injected by the service layer, never stored in BDL). The acceptance
   payload is the result: `{ warehouseItemId, effectiveMode }` — effectiveMode is a
   query-time fact.
2. **`warehouse.generateVpm`** (tasked): generates a local VPM package for the entry
   from its `original`-role copies. `params: { warehouseItemId }`. Acceptance payload:
   `{ taskId, correlationId }`. Completion payload (task surface):
   `{ correlationId, warehouseItemId, packageId, archiveRelativePath, archiveSha256 }`
   — archiveSha256 is the published archive's content identity (`sha256:…`).
3. **`warehouse.deleteOriginals`** (tasked): deletes the entry's original material
   under guards (the audited destructive half; warehouse-layout ruling 5).
   `params: { warehouseItemId }`. Acceptance payload as above. Completion payload
   (task surface): `{ correlationId, warehouseItemId, deletedCount, deletedRelativePaths,
   keptGeneratedSha256 }`.

## Server-side guards (server facts, never client assertions)

- Generation runs only in the `generate_vpm` effective mode, with original material,
  and with no existing generated copy (a generated copy is never silently replaced —
  delete the entry's VPM copy to regenerate);
- Deletion runs only in the `generate_vpm` effective mode with a generated copy that
  physically exists and passes its content-identity verification; each copy's file is
  removed before its row, so an interrupted run resumes with the remaining originals;
- Cancellation is observed at copy boundaries; completed copies stay consistent and a
  retry processes only the remaining originals.

## Stable error codes

| Code | Category | Scenario |
| --- | --- | --- |
| `vua.warehouse.invalid_state` | Conflict | effective mode is not `generate_vpm` |
| `vua.warehouse.generated_artifact_missing` | Conflict | generated copy missing, unreadable, or content identity mismatch |
| `vua.warehouse.no_original_material` | Conflict | entry holds no original material to generate from |
| `vua.warehouse.already_generated` | Conflict | a generated copy exists; regeneration refused |
| `vua.warehouse.entry_not_found` | Validation | unknown entry |
| `vua.warehouse.generation_failed` | ExternalFailure | staging chain failure (carries the underlying code and reason) |
| `vua.warehouse.storeFailed` | Internal | BDL store failure |
| `vua.warehouse.maintenanceIoFailed` | ExternalFailure | maintenance-flow filesystem failure |

All maintenance failures are recoverable errors (`recoverable: true`); the task row
enters the failed state awaiting an explicit user retry — recovery never resumes
implicitly.

## Application-face code annotation (0.1.1)

Beyond the business guards, the provider transport layer uses four application-face
codes; two reuse table names (same code, same semantics — the transport side
intercepts the same business fact earlier), two are transport-specific and are **not**
part of the eight-code table:

| Code | Layer | Scenario |
| --- | --- | --- |
| `vua.warehouse.unavailable` | transport-specific | warehouse face not wired / generate without a Unity executor (honest absence) |
| `vua.warehouse.invalid_params` | transport-specific | params outside the closed set, mode outside the vocabulary, mode missing (application-side enforcement of the schema closed set) |
| `vua.warehouse.entry_not_found` | table reuse | unknown entry (validation) |
| `vua.warehouse.storeFailed` | table reuse | BDL store failure (internal) |

messageKey mapping: `errors.warehouse.unavailable / invalidParams / entryNotFound /
storeFailed`. The warehouse root and the global default mode are provider runtime
configuration (environment-injected), never on the wire; `effectiveMode` is always
read back from the store (override ?? global default), never echoed from the request.

## Dependency direction

```text
React View (WarehousePage artifact-mode actions)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (method routes: registered by core)
  → AMF application service (this protocol's provider; crates/acquisition)
  → BDL local database (crates/bdl-store)
```
