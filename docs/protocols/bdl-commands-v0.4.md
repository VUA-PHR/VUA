# BDL warehouse write-command protocol v0.4 (v0.3 + download adoption)


> Document version: 0.4
> Status: **Frozen (domain business vocabulary)** (2026-09-09) — the provider-host
> `warehouse.importDownloads` route is pending core execution (C-1 split: the
> data role freezes the domain vocabulary, the core role owns the wire routing,
> the integration role arbitrates cross-role disputes); the renderer TS face is
> registered by the desktop role. Until wired, the adoption command must not be
> claimed end-to-end
> Machine-readable vocabulary: `schemas/bdl-commands/v0.4/` (schema + positive/
> negative vectors; consumer test
> `crates/acquisition/tests/import_downloads_contract_v04.rs`; the v0.1–v0.3
> directories are kept, never rewritten)
> Scope: all five v0.3 commands (`warehouse.setArtifactMode` /
> `warehouse.generateVpm` / `warehouse.deleteOriginals` /
> `warehouse.setGlobalDefaultMode` / `warehouse.import`) plus the M6 download
> adoption (`warehouse.importDownloads`, user ruling U7-③ / IMP-3
> contract-first)
> Ownership boundary: `docs/architecture/bdl.md` (BDL is an AMF-private local
> module); the server-side facts of the write commands (guards, tasking, audit)
> live in `crates/acquisition` (adoption, maintenance and import flows) and
> `crates/bdl-store` (storage face)
> Updated: 2026-09-09 (v0.4: download adoption added)

## v0.4 revision (relative to v0.3)

The protocol face of the M6-added-scope ruling (user ruling U7-③: the
download-to-warehouse landing belongs to the data domain as a new bdl-commands
contract; IMP-3 contract-first, freeze hard prerequisites not waived):

1. **`warehouse.importDownloads` added** (tasked): batch adoption of completed
   downloads into the warehouse. `params: { downloadIds }` — port-assigned
   download identities (minItems 1), one id = one completed download = one
   `downloaded_material` entry; one command = one adoption task (per-download
   progress, cancel at download boundaries, fail-fast keeping already-adopted
   entries). Acceptance payload isomorphic with the tasked commands:
   `{ taskId, correlationId }`. **Identity only**: the request never carries
   paths, sizes, file names or any client assertion about the download — every
   delivery fact (staging path, reported size, suggested file name) is resolved
   server-side from BDL's own download-event log
   (`DownloadEventConsumer::staging_completion`). The warehouse root is
   provider environment configuration, **never a request field**. The Done
   payload (per-download reports with the created entry identities) travels the
   application-contract task surface.
2. **Adoption semantics (copy-in)**: the staging file is copied into the entry
   and left untouched — staging cleanup is NOT this command's semantics and is
   not frozen here. Content identity is AMF-computed (SHA-256 over the copy,
   the same pipeline as the batch import); the transport correlation closes via
   `local_artifacts.download_id`. The content→product source mapping
   (`artifact_mappings`, boundary IN-4) stays an AMF source-resolution decision
   and is deliberately not part of this command: a request that asserted a
   product would be a client assertion over an AMF fact.
3. **Entry kind**: adopted downloads land as `downloaded_material` — the value
   the frozen BDL v0.1 vocabulary (`warehouse_items.kind`) already reserves.
   The display name is the delivery's suggested file name stem (falling back to
   the staging file name stem, then the download id); the entry identity stays
   VUA-generated, never derived from the display name.
4. **Auto-generation orchestration deliberately absent**: whether a download
   adoption triggers the same import-time generation hook (proposal 010 path A)
   is undecided and NOT frozen by v0.4; the v0.4 adoption face is the manual
   face only. A future orchestration decision must bump this protocol version.
5. **Host allowlists are runtime policy, never contract**: this schema stays
   host-agnostic (C-3 ruling) — download-domain admission is the runtime
   policy that follows the verify-on-real-machine → per-domain proposal →
   user-approval procedure (user ruling U7-②), never a field of this contract.
6. **Existing command semantics unchanged**: the five v0.3 commands keep their
   params/acceptance/completion payloads, guards and audit identical to v0.3
   (schemaVersion rises to "0.4" with the vocabulary).

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
3. **`warehouse.generateVpm`** (tasked): `params: { warehouseItemId,
   importCorrelationId? }`. Guards, audit and completion payload identical to
   v0.3; `importCorrelationId` is filled only by the import orchestration.
4. **`warehouse.deleteOriginals`** (tasked): identical to v0.3.
5. **`warehouse.import`** (tasked): identical to v0.3 (batch import of
   material-package folders, copy-in, per-folder progress).
6. **`warehouse.importDownloads`** (tasked, new in v0.4): `params:
   { downloadIds }`. The task resolves each download against BDL's event log,
   copies the staging file into a fresh `downloaded_material` entry, hashes the
   copy, and records the content row with the download correlation
   (`local_artifacts.download_id`). Per-download progress events; cancel at
   download boundaries (Cancelled exit; the durable partial state is queryable
   through `warehouse.listEntries`); fail-fast keeps the already-adopted
   entries. Done payload = per-download reports (created entry identities,
   file names, content identities). Guards below.

## Server-side guards (server facts, never client assertions)

- The v0.3 guards stay in force unchanged (generation/deletion effective-mode
  guards; import source-name and inside-warehouse guards; copy size checks).
- **Adoption guards (new in v0.4)**:
  - The download id must have an event history in BDL
    (`vua.warehouse.downloadNotCompleted` covers "never seen" and "fold is not
    a completed delivery" with an honest reason string);
  - the event fold must sit at a completed delivery (started + completed) —
    in-flight, interrupted, cancelled and failed downloads are refused;
  - the staging file must be physically present
    (`vua.warehouse.stagingFileMissing`) and its size must equal the completed
    delivery's own reported size (`vua.warehouse.copySizeMismatch`); the copy
    is size-checked against the staging file (same code);
  - adoption never mutates or deletes the staging file;
  - the request cannot smuggle paths or delivery facts: the params face is
    closed (`additionalProperties: false`), and the negative vector
    `invalid-import-downloads-client-path.json` pins that a client-supplied
    path is a contract error.

## Stable error codes

The v0.3 code table stays in force
(`invalid_state` / `generated_artifact_missing` / `no_original_material` /
`already_generated` / `entry_not_found` / `generation_failed` / `storeFailed` /
`maintenanceIoFailed` / `importIoFailed` / `invalidSource` /
`copySizeMismatch`). Application-face code annotations (`unavailable` /
`invalid_params` transport-face only) follow the v0.1.1 split. v0.4 adds the
adoption error codes:

- `vua.warehouse.downloadNotCompleted` (Validation) — the download id has no
  history or its fold is not a completed delivery; carries `downloadId` and
  `reason`;
- `vua.warehouse.stagingFileMissing` (ExternalFailure) — the completed
  delivery's staging file is physically absent; carries `downloadId` and
  `reason`;
- `vua.warehouse.adoptIoFailed` (ExternalFailure) — an I/O failure during the
  adoption copy; carries `downloadId` and `reason`.

Each new code carries `recoverable=true`; `copySizeMismatch` and `storeFailed`
are reused with their v0.3 semantics (parameters name the download instead of
the folder when raised from the adoption task).

## Dependency direction

```text
React View (warehouse acquire area "From cloud downloads" landing queue)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (method routes: core registers)
  → AMF application service (this protocol's provider; crates/acquisition / crates/bdl-store)
  → BDL local database (download_events facts, warehouse_items and entry facts)
```
