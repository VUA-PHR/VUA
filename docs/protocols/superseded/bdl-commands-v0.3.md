# BDL warehouse write-command protocol v0.3 (artifact-mode trio + global-default write + batch import)


> **⚠️ Superseded by v0.4 (2026-09-09)**: the download-adoption command
> `warehouse.importDownloads` (M6 added scope, user ruling U7-③). The current
> normative text is [bdl-commands-v0.4.md](../bdl-commands-v0.4.md); this
> document is kept as history, matching `schemas/bdl-commands/v0.3/`
> (never rewritten).
> Document version: 0.3
> Status: **Superseded (→ v0.4)** (2026-09-09; original status: Frozen
> (domain business vocabulary) 2026-09-08 — the provider-host
> `warehouse.import` route and the `importCorrelationId` orchestration wiring
> have since landed with execution phase ② closeout; the v0.3 vocabulary is
> carried into the v0.4 closed set intact)
> Machine-readable vocabulary: `schemas/bdl-commands/v0.3/` (schema + positive/
> negative vectors; consumer test `crates/acquisition/tests/import_contract_v03.rs`;
> the v0.1/v0.2 directories are kept, never rewritten)
> Scope: four of the v0.2 commands (`warehouse.setArtifactMode` /
> `warehouse.generateVpm` / `warehouse.deleteOriginals` /
> `warehouse.setGlobalDefaultMode`) plus the M5 batch import
> (`warehouse.import`, proposal 010 ruling path A)
> Ownership boundary: `docs/architecture/bdl.md` (BDL is an AMF-private local
> module); the server-side facts of the write commands (guards, tasking, audit)
> live in `crates/acquisition` (maintenance and import flows) and
> `crates/bdl-store` (storage face)
> Updated: 2026-09-08 (v0.3: batch import added; generation audit-chain field;
> terminology ruling applied)

## v0.3 revision (relative to v0.2)

The protocol face of the proposal 010 ruling (path A: provider orchestration at
the import-entry landing point; W18/W19 in one batch):

1. **`warehouse.import` added** (tasked): batch import of material-package
   folders. `params: { sourceFolders }` — Kernel-resolved absolute paths
   (minItems 1), one folder = one material package; one command = one
   batch-import task (per-folder progress, cancel at folder boundaries,
   fail-fast keeping already-imported entries). Acceptance payload isomorphic
   with the tasked commands: `{ taskId, correlationId }`. The warehouse root is
   provider environment configuration, **never a request field**; entry identity
   and display-name rules belong to the importer (identical to the offline
   import pipeline). The Done payload (per-folder reports with the created
   entry identities) travels the application-contract task surface.
2. **`warehouse.generateVpm` gains the optional `importCorrelationId`** (the
   wire carrier of proposal 010 commitment 6): present only when the generation
   task was orchestrated by a batch import — the audit-chain link back to the
   source import task; a manually initiated generation never carries it. The
   acceptance receipt optionally echoes the field. Unknown keys remain contract
   errors (additionalProperties: false).
3. **Terminology ruling applied** (W15 walkthrough hard ruling, BOARD #9): the
   protocol's "VPM copy" wording is corrected to "**generated VPM package
   copy**" (VPM = VRChat Package Manager; VPM package = the managed package).
   The frozen v0.2 text is not retroactively edited.
4. **Existing command semantics unchanged**: the entry-level trio and the
   global-default write keep their params/acceptance/completion payloads,
   guards and audit identical to v0.2 (schemaVersion rises to "0.3" with the
   vocabulary).

## Frozen scope and division of labor

This protocol freezes the commands' **business vocabulary**: the operation
closed set, params, acceptance payloads, task completion payload shapes and
stable error codes. The transport envelope (requestId / commandId / task
events) belongs to the versioned application contract, registered as method
routes by the core role in provider-host; the renderer TS face is registered by
the desktop role. Any vocabulary change on either side must bump this protocol
version first.

## Command semantics

1. **`warehouse.setArtifactMode`** (synchronous): per-entry override set/clear.
   `params: { warehouseItemId, mode }`, null = clear (falls back to
   `override ?? global default`). Acceptance payload is the result:
   `{ warehouseItemId, effectiveMode }` — a query-time fact.
2. **`warehouse.setGlobalDefaultMode`** (synchronous): persists the global
   level of the two-level options (bdl_meta); entry overrides take precedence.
3. **`warehouse.generateVpm`** (tasked, params extended in v0.3): `params:
   { warehouseItemId, importCorrelationId? }`. Guards, audit and completion
   payload (delivered on the task surface) identical to v0.2;
   `importCorrelationId` is filled only by the import orchestration (see
   revision 2).
4. **`warehouse.deleteOriginals`** (tasked): identical to v0.2.
5. **`warehouse.import`** (tasked, new in v0.3): `params: { sourceFolders }`.
   The importer copies each material package into the warehouse semantic tree
   (originals untouched — copy-in import semantics) with per-folder progress
   events; cancel at folder boundaries (Cancelled exit; the durable partial
   state is queryable through `warehouse.listEntries`); fail-fast keeps the
   already-imported entries. Done payload = per-folder reports (created entry
   identities, skipped source files). Import guards below.

## Server-side guards (server facts, never client assertions)

- Generation runs only in the `generate_vpm` effective mode, with original
  material present and no generated VPM package copy yet (a generated copy is
  never silently replaced — its VPM package copy must be deleted before a
  regeneration);
- Deletion runs only in the `generate_vpm` effective mode with a physically
  present generated VPM package copy that passes the content-identity check;
  per copy the file is deleted before the row, interruptions are retryable;
- Cancellation is observed at copy boundaries; a global-default write never
  touches in-flight tasks;
- **Import guards (new in v0.3)**: the source folder must have a name (not a
  root/drive — `invalidSource`) and must not sit inside the warehouse root
  (`invalidSource`); copies are size-checked file by file
  (`copySizeMismatch`); source-folder name collisions are resolved by the
  importer into stable entry identities, never derived from display names.

## Stable error codes

The same eight-code table as v0.2 (`invalid_state` / `generated_artifact_missing` /
`no_original_material` / `already_generated` / `entry_not_found` / `generation_failed` /
`storeFailed` / `maintenanceIoFailed`), semantics unchanged. Application-face code
annotations (`unavailable` / `invalid_params` transport-face only; `entry_not_found` /
`storeFailed` reused) follow the v0.1.1 split. v0.3 adds the import error codes:
`vua.warehouse.importIoFailed` (ExternalFailure), `vua.warehouse.invalidSource`
(Validation), `vua.warehouse.copySizeMismatch` (ExternalFailure) — each carries
folder and reason parameters, `recoverable=true`.

## Dependency direction

```text
React View (warehouse acquire area "Import material packages" / settings-experimental / entry drawer)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (method routes: core registers)
  → AMF application service (this protocol's provider; crates/acquisition / crates/bdl-store)
  → BDL local database (bdl_meta persists the global default; warehouse_items and entry facts)
```
