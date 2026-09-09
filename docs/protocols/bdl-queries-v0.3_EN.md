# BDL Read-Model Protocol v0.3 (catalog and warehouse queries)

[English](bdl-queries-v0.3_EN.md) | [简体中文](bdl-queries-v0.3_ZH.md)

> **⚠️ SUPERSEDED by v0.4 (2026-09-10)**: new read query method
> `downloads.listCompleted` (proposal 015 §10 arbitration; the adoption-source
> read face). The current specification lives in
> [bdl-queries-v0.4_EN.md](bdl-queries-v0.4_EN.md); this document is kept for
> history only and maps to `schemas/bdl-queries/v0.3/` (do not modify).
> Document version: 0.3
> Status: **Superseded (→ v0.4)** (2026-09-10; originally: **Frozen**
> (2026-09-06) — supersedes v0.2 (the only change is the
> "v0.3 revision" below); machine-readable vocabulary in
> `schemas/bdl-queries/v0.3/`
> Scope: five read-only query methods served by AMF from the local BDL — the
> cloud-track trio (catalog.*) and the local-track pair (warehouse.*) — plus
> the three-state presentation mapping of LocalArtifact inspection verdicts
> Ownership boundaries: `docs/architecture/bdl_EN.md` (BDL is an AMF-private
> local module; it stores only AMF-approved data and is exposed only through
> the narrow AMF application-service surface); `docs/architecture/desktop_EN.md`
> (the renderer never holds Electron or BDL objects)
> Updated: 2026-09-06

## v0.3 revision

The read-face landing of the artifact-mode adjudication (six questions
adjudicated; see the coordination notes):

1. **Artifact-mode dual read fields**: entry cards and entry details gain
   `artifactMode` (`use_original_unitypackage` / `generate_vpm` / null — the
   per-entry override; null = follows the global default) and
   `effectiveArtifactMode` (dynamically resolved: override ?? the global
   default, which the serving layer injects per query — the shell setting
   never enters BDL, and resolution is a query-time fact, never an
   import-time snapshot).
2. **The mode is a consumption preference**: preferring VPM does not mean a
   VPM exists; until generation completes, the entry honestly presents
   "prefers VPM (not yet generated)" and the consumable artifact remains the
   original — no silent fallback. Mode setting (`warehouse.setArtifactMode`),
   generation (`warehouse.generateVpm`) and guarded deletion
   (`warehouse.deleteOriginals`) travel on the application-contract command
   surface (registered with the post-M3 contract evolution) — they are
   **not** part of this read-face protocol.
3. **Copy role bit**: artifact references and facts gain `role`
   (`original` / `generated_vpm`) — generated VPM packages and original
   materials are siblings within an entry (ruling 5); the delete-originals
   flow removes only `original` copies (rows and physical files) and keeps
   `generated_vpm`.
4. **Kind vocabulary closed**: entry `kind` closes to `imported_material` |
   `downloaded_material` (downloaded entries are the warehouse mapping
   destination already defined by the download-events protocol); anything
   else is a contract error.

Everything else is identical to v0.2; the v0.2 document remains as history
(do not edit `schemas/bdl-queries/v0.2/`).

## Dependency direction

```text
React View (WarehousePage dual track / G8 atlas components)
  → read-only narrow ports (catalog-browser-port / acquire-port)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract
  → AMF application service (the provider of this protocol)
  → BDL local database (read-only)
```

The renderer never touches BDL directly. Error channels, request correlation
and the transport envelope belong to the application contract; this protocol
freezes only the **operation vocabulary, the query closed set, the field
surfaces and the result shapes**.

## Method surface (five read-only methods)

| Method | Meaning | Consumer |
| --- | --- | --- |
| `catalog.list` | product card list by query (paginated) | cloud-track card wall |
| `catalog.detail` | single product detail | detail drawer |
| `catalog.status` | catalog health and revision snapshot | status line / degraded presentation |
| `warehouse.listEntries` | all material-package entry cards | local-track entry list |
| `warehouse.entryDetail` | per-artifact inspection facts of one entry | entry detail |

The catalog data source is the **local BDL, read offline**; until the
observation pipeline lands data, `catalog.list` returns an empty set and
`catalog.status.health = unknown` — the empty state is the terminal state.
The G13 write path (activation / online fallback / incremental sync) is not
part of this protocol.

## catalog query set and field surface

The `catalog.list` query closed set = `{ text, availabilityStatus, limit,
offset }` (all optional):

- `text`: case-insensitive substring over title and productId; absent = no
  filtering;
- `availabilityStatus`: exact match against the **derived stable enum**;
  absent = no filtering;
- `limit` (1–200, default 50) / `offset` (default 0): card-wall pagination;
- entry order = `productId` ascending (identity-derived, deterministic
  pagination);
- `entityType` / `relationKind` are **not in the closed set**: their presence
  is a contract error, never a silently empty answer;
- tombstone products (`status: missing`) are **not catalog cards**: list
  never returns them and detail never serves them.

`catalog.list` entry fields (`CatalogProductSummary`): `productId`
(`booth:<id>` namespace), `title`, `price` (`{amount, currency}` or null —
single-price products only; variant prices live in detail `subproducts`;
missing price / multi-currency is honestly null), `imageUrl` (always
`imageUrls[0]` or null), `imageUrls` (verbatim observed source URLs carried
by the vuaimg cache protocol — **AMF hands out URLs, never embedded handles
or local paths**), `availabilityRaw` / `availabilityStatus` (the v0.2 dual
field: raw evidence + the processor-derived stable enum under the versioned
rule table), `entityCount` (const `0`), `entityTypes` (const `[]` — honest
empty slots; entity storage belongs to BDL v2).

`catalog.detail` additional fields: `description`, `shopName` / `shopUrl`,
`ageRestriction`, `adult` (true only with the explicit BOOTH Adult badge),
`videoUrls`, `sourceCategory` (BOOTH display category, no inference),
`subproducts` (`variationId` / `name` / `price` / `availabilityRaw` /
`availabilityStatus`). The entity and relation areas are **not in v0.3**;
freezing the three relation words follows the V2-3 relation-edge vocabulary
when it is written. `compatibility_observations.raw_quote` does **not** enter
the catalog surface.

`catalog.status`: `health` (three states `unknown` / `ok` / `incompatible` —
the last being the BDL version fence rejecting the store; `corrupted` and
`stale` are renderer-reserved states that are never sent) plus `revision`
(`catalogUpdatedSeq`: number | null — always null until the
observation-pipeline bookkeeping counter exists; `datasetRevision`: string, =
the BDL format_version).

## warehouse entry surface

`warehouse.listEntries` entry card: `warehouseItemId` (VUA-generated identity)
+ `folderName` (folder under the warehouse root, the local identity) +
`displayName` + `kind` (closed: `imported_material` | `downloaded_material`)
+ `artifactMode` (override, nullable) + `effectiveArtifactMode` (dynamically
resolved) + `createdAt` + `artifacts` (each: `relativePath` +
`artifactSha256` + three-state `state` + `sizeBytes` + `role`).

`warehouse.entryDetail` per-artifact inspection facts: the fields above plus
`suggestedFileName`, `inspectedAt` (mechanical verdict time; null while
pending), `rejectionReason` (honest verdict text; non-null only when
quarantined), `sourceCorrelated` (existence of an `artifact_mappings` row),
`mappedProductIds` (list of mapped product identities) + `role`.

- **`storedPath` never enters the render surface** — path semantics stop at
  AMF/BDL and users do not browse the disk (ruling 3);
- artifacts present their presence facts by `role` (original present/deleted,
  VPM present/not-yet-generated); the deletion fact lives in the task-receipt
  audit, with no invented tombstone state;
- the **artifact-mode command surface** (`setArtifactMode` / `generateVpm` /
  `deleteOriginals`) travels on the application contract, registered with the
  post-M3 evolution — not part of this read-face protocol.

## LocalArtifact three-state mapping

| Wire three-state | BDL storage four-state |
| --- | --- |
| `pending` | `untrusted` (transfer done, not inspected) or `inspected` (mechanical checks passed, admission decision pending) |
| `clean` | `admitted` |
| `quarantined` | `rejected` (always carries an honest rejection reason) |

`executables` (detected executable-content list) is **always an empty array**
— inspection hooks are an interface placeholder in the download-events
protocol and land with the hook slice in a version bump. Download status
presentation **does not use this protocol**: a download is a recoverable task
and follows the global task contract's nine states; "retry" is a task-level
action adjudicated by AMF — no new download.* surface.

## Machine-readable vocabulary

`schemas/bdl-queries/v0.3/`: `query.schema.json` + `result.schema.json` +
`examples/` (5 requests + 5 results + 3 negatives: an entity filter param, a
free-form availability filter value and an illegal kind enum value must be
rejected). Dual-end fixtures: Rust side `contracts.rs` + `bdl_queries.rs` +
`bdl_store.rs` (the read-face aggregates ARE the wire shapes); the F side
registers its contracts with the freeze. Vocabulary or field changes must
bump the version, never rewrite in place.

## Open items

- Entity/relation areas and the entity-type vocabulary: with BDL v2 (V2-3/
  V2-4, pending product-owner adjudication);
- the `executables` list: with the inspection-hook slice;
- `catalogUpdatedSeq` bookkeeping: with the observation-pipeline slice;
- the artifact-mode command surface: with the post-M3 contract evolution
  (adjudicated and released; see the B reply);
- the task-level retry command shape: an application-contract evolution item;
- freshness (`stale`): with the G13 write path.
