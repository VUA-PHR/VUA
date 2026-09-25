# BDL Read-Model Protocol v0.4 (catalog + warehouse + completed-download queries)


> Document version: 0.4
> Status: **Frozen (domain business vocabulary)** (2026-09-10) — the
> provider-host `downloads.listCompleted` route has landed (2026-09-10
> core wire batch 389912e: route arm + envelope version constant
> BDL_QUERIES_SCHEMA_VERSION 0.3→0.4 + consumer tests; TS-face vocabulary
> rows/guards/routing in place; evidence chain in the BOARD frozen-contract
> row and REGISTRY line 43. Header note refreshed 2026-09-15, data-role
> protocol maintenance batch).
> Contract-first split on record: the data role froze the domain vocabulary
> ahead of the wire batch, and the envelope version constant rose with the
> core wiring batch (both fulfilled). End-to-end claims still require
> real-machine evidence — a landed wire is not an end-to-end verification
> Machine-readable vocabulary: `schemas/bdl-queries/v0.4/` (schema + positive/
> negative vectors; consumer test
> `crates/bdl-store/tests/downloads_list_serving.rs`; the v0.1–v0.3
> directories are kept, never rewritten)
> Scope: the five v0.3 methods (`catalog.list` / `catalog.detail` /
> `catalog.status` / `warehouse.listEntries` / `warehouse.entryDetail`) plus
> the M6 completed-download adoption-source read face
> (`downloads.listCompleted`, proposal 015 §7 data stance, accepted)
> Ownership boundaries: `docs/architecture/bdl.md` (BDL is an AMF-private
> local module; it stores only AMF-approved data and is exposed only through
> the narrow AMF application-service surface); `docs/architecture/desktop.md`
> (the renderer never holds Electron or BDL objects)
> Updated: 2026-09-10 (v0.4: completed-download adoption-source query
> added); 2026-09-15 header status-note refresh (route-landed verification,
> protocol body unchanged)

## v0.4 revision (relative to v0.3)

The read-face landing of the proposal 015 §7 adjudication (the
completed-download list is the IMP-2 batch-B adoption source; the data stance
— a read query face, not render-side aggregation — was accepted with the 015
reconciliation):

1. **`downloads.listCompleted` added** (no params). It lists the **adoptable
   completed deliveries**: a download lists only when
   - its BDL download-event fold sits at a completed delivery
     (`DownloadEventConsumer::staging_completion`), AND
   - the staging file is physically present at the size the completed
     delivery itself reported.
   The membership predicate is the **same server-side fact the
   `warehouse.importDownloads` adoption guard consumes** — the list is the
   guard's mirror: what the UI shows is adoptable. Deliveries whose staging
   file is gone or size-drifted are honestly absent, never listed.
2. **Row shape** (`downloadsListCompletedResult`): `downloadId` (the
   port-assigned identity; the adoption request field), `sourceUrl` (the
   completed delivery's transport fact), `suggestedFileName` (nullable),
   `receivedBytes`, `completedAt`, and `adoptedWarehouseItemIds` — the
   warehouse entries whose content rows carry the download correlation
   (`local_artifacts.download_id`); empty = not yet adopted. The write face
   does not prevent repeat adoption; the UI marks adopted downloads from this
   field. **Paths never appear** — storedPath semantics stop at AMF/BDL.
3. **Not a download-status presentation**: v0.3's principle stands — a
   download is a recoverable task and its status presentation follows the
   global task contract's nine states. `downloads.listCompleted` does not
   present download status; it lists the adoption source's adoptable facts.
   The v0.3 "no new download.* surface" statement is hereby scoped to status
   presentation; this read face is the adoption entry's data source, carried
   by this version's closed set.
4. **Existing method semantics unchanged**: the five v0.3 methods keep their
   params/fields/results identical to v0.3 (schemaVersion rises to "0.4" with
   the vocabulary).

## Frozen scope and division of labor

This protocol freezes the **operation vocabulary, the query closed set, the
field surfaces and the result shapes**. Error channels, request correlation
and the transport envelope belong to the versioned application contract; the
envelope version constant (`BDL_QUERIES_SCHEMA_VERSION`) and the
provider-host method routing rise with the core wiring batch. The renderer TS
face is registered by the desktop role. Any vocabulary change on either side
must bump this protocol version first.

## Method surface (six read-only methods)

| Method | Meaning | Consumer |
| --- | --- | --- |
| `catalog.list` | product card list by query (paginated) | cloud-track card wall |
| `catalog.detail` | single product detail | detail drawer |
| `catalog.status` | catalog health and revision snapshot | status line / degraded presentation |
| `warehouse.listEntries` | all material-package entry cards | local-track entry list |
| `warehouse.entryDetail` | per-artifact inspection facts of one entry | entry detail |
| `downloads.listCompleted` (new in v0.4) | adoptable completed deliveries, with adoption links | import page: completed-download list + adoption entry (IMP-2 batch B) |

Until the observation pipeline lands data, `catalog.list` returns an empty
set and `catalog.status.health = unknown`; until a download completes,
`downloads.listCompleted` returns an empty set — the empty state is the
terminal state.

## downloads.listCompleted semantics

- No params; the params face is closed (`additionalProperties: false`) — a
  client-supplied filter is a contract error, never a silently empty answer
  (the negative vector pins it);
- rows sort by `completedAt` ascending (deterministic order);
- the guard mirror property: a row listed ⇒ `warehouse.importDownloads`
  accepts that `downloadId` (barring the race window after the list returns);
  a row absent ⇒ the adoption task would refuse it
  (`downloadNotCompleted` / `stagingFileMissing`) — the UI never needs to
  assemble adoptability itself;
- repeat adoption remains possible on the write face (copy-in, no
  deduplication — identical to the batch import semantics); the
  `adoptedWarehouseItemIds` field is the honest mark the UI uses.

## Dependency direction

```text
React View (import page: completed-download list + adoption entry)
  → read-only narrow ports (acquire-port)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract
  → AMF application service (the provider of this protocol)
  → BDL local database (read-only)
```

## Machine-readable vocabulary

`schemas/bdl-queries/v0.4/`: `query.schema.json` + `result.schema.json` +
`examples/` (6 requests + 6 results + 5 negatives: the v0.3 trio carried over
— an entity filter param, a free-form availability filter value, an illegal
kind enum value — plus an out-of-closed-set params key and a v0.3-typed
replay; each must be rejected). Consumer test:
`crates/bdl-store/tests/downloads_list_serving.rs` (vector-driven real read
face; the guard-mirror property, the honest empty state, the adoption links
and the no-paths rule are pinned). Vocabulary or field changes must bump the
version, never rewrite in place.

## Open items

- Entity/relation areas and the entity-type vocabulary: with BDL v2 (V2-3/
  V2-4, pending product-owner adjudication);
- the `executables` list: with the inspection-hook slice;
- `catalogUpdatedSeq` bookkeeping: with the observation-pipeline slice;
- the task-level retry command shape: an application-contract evolution item;
- freshness (`stale`): with the G13 write path.
