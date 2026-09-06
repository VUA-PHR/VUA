# BDL Read-Model Protocol v0.2 (catalog and warehouse queries)

[English](bdl-queries-v0.2_EN.md) | [简体中文](bdl-queries-v0.2_ZH.md)

> **⚠️ Superseded by v0.3 (2026-09-06)**: artifact-mode dual read fields, the
> copy role bit and the closed entry-kind vocabulary. The current protocol is
> [bdl-queries-v0.3_EN.md](bdl-queries-v0.3_EN.md); this document remains as
> history only, matching `schemas/bdl-queries/v0.2/` (do not edit).
>
> Document version: 0.2
> Status: Superseded (2026-09-06, → bdl-queries-v0.3; history: superseded
> v0.1, see the "v0.2 revision" below); machine-readable vocabulary in
> `schemas/bdl-queries/v0.2/`
> Scope: five read-only query methods served by AMF from the local BDL — the
> cloud-track trio (catalog.*) and the local-track pair (warehouse.*) — plus
> the three-state presentation mapping of LocalArtifact inspection verdicts
> Ownership boundaries: `docs/architecture/bdl_EN.md` (BDL is an AMF-private
> local module; it stores only AMF-approved data and is exposed only through
> the narrow AMF application-service surface); `docs/architecture/desktop_EN.md`
> (the renderer never holds Electron or BDL objects)
> Updated: 2026-09-06

## v0.2 revision

availability is revised from a single field (verbatim observed word, filtered
by exact raw-word match) to a **dual field**:

- `availabilityRaw: string | null` — the verbatim observed page word, for
  evidence and detail display, never normalized;
- `availabilityStatus: available | unavailable | unknown` — derived by the
  AMF/BDL processor under a **versioned rule table**; UI badges and filters
  consume **only the stable enum**; the renderer never guesses and never
  derives.

Motivation: with pure verbatim filtering, `InStock`, full schema.org URLs and
case variants fragment into distinct filter values, and an internationalized
UI would leak platform-internal words. The deriving party is the data owner
(AMF/BDL), not the renderer — consistent with the "renderer does not guess"
discipline.

**Derivation rule table (v0.2, versioned with this protocol; changes bump the
version)**: compare the last path segment of the raw word, lowercased
(`https://schema.org/InStock` and `InStock` judge identically):

| Raw word (last segment, lowercased) | availabilityStatus |
| --- | --- |
| `instock`, `limitedavailability`, `instoreonly` | `available` |
| `outofstock`, `soldout`, `discontinued` | `unavailable` |
| everything else, null | `unknown` (raw preserved verbatim) |

Everything else is identical to v0.1; the v0.1 document remains as history
(do not edit `schemas/bdl-queries/v0.1/`).

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
- `entityType` / `relationKind` are **not in the closed set**: v0.2 has no
  entity or relation storage; their presence is a contract error, never a
  silently empty answer;
- tombstone products (`status: missing`, 404/410 kept as records) are **not
  catalog cards**: list never returns them and detail never serves them —
  tombstones are observation-side data.

`catalog.list` entry fields (`CatalogProductSummary`): `productId`
(`booth:<id>` namespace), `title`, `price` (`{amount, currency}` or null —
single-price products only; variant prices live in detail `subproducts`;
missing price / multi-currency is honestly null, never guessed or converted),
`imageUrl` (always `imageUrls[0]` or null), `imageUrls` (verbatim observed
source URLs carried by the vuaimg cache protocol — **AMF hands out URLs, never
embedded handles or local paths**), `availabilityRaw` / `availabilityStatus`
(dual field, see "v0.2 revision"), `entityCount` (const `0`), `entityTypes`
(const `[]` — honest empty slots; entity storage belongs to BDL v2).

`catalog.detail` additional fields: `description`, `shopName` / `shopUrl`,
`ageRestriction`, `adult` (true only with the explicit BOOTH Adult badge),
`videoUrls`, `sourceCategory` (BOOTH display category, no inference),
`subproducts` (`variationId` / `name` / `price` / `availabilityRaw` /
`availabilityStatus`). The entity and relation areas are **not in v0.2**; the
renderer keeps empty states at the not-connected level; freezing the three
relation words (`compatible_with/addon_for/requires`) follows the V2-3
relation-edge vocabulary when it is written. "null fallback for
out-of-library entity canonical names" is accepted as a v2 shape rule.
`compatibility_observations.raw_quote` does **not** enter the catalog
surface — unconfirmed semantics never enter a browsing UI (IN-3 data belongs
to the IN-3 surface).

`catalog.status`: `health` (three states `unknown` / `ok` / `incompatible` —
the last being the BDL version fence rejecting the store; `corrupted` and
`stale` are renderer-reserved states that v0.2 never sends) plus `revision`
(`catalogUpdatedSeq`: number | null — always null until the
observation-pipeline bookkeeping counter exists; `datasetRevision`: string, =
the BDL format_version). `sourceUpdatedSeq` was deleted permanently: it
originated from the G13-era freshness question, which only exists once a
refresh path exists; when G13 lands, its own sync bookkeeping answers it —
the dead column name is not revived.

## warehouse entry surface

`warehouse.listEntries` entry card: `warehouseItemId` (VUA-generated identity)
+ `folderName` (folder under the warehouse root, the local identity) +
`displayName` + `kind` (entry artifact family) + `createdAt` + `artifacts`
(each: `relativePath` + `artifactSha256` + three-state `state` +
`sizeBytes`).

`warehouse.entryDetail` per-artifact inspection facts: the fields above plus
`suggestedFileName`, `inspectedAt` (mechanical verdict time; null while
pending), `rejectionReason` (honest verdict text; non-null only when
quarantined), `sourceCorrelated` (existence of an `artifact_mappings` row),
`mappedProductIds` (list of mapped product identities).

- **`storedPath` never enters the render surface** — path semantics stop at
  AMF/BDL and users do not browse the disk (ruling 3);
- the copy list carries **no role annotation** (original vs generated
  package): the role bit lands with a B4-7 version bump;
- the **artifact-mode setting (write path) is outside this protocol** — it is
  an audited destructive setting (delete originals after generation), belongs
  to a later slice, and is frozen separately then.

## LocalArtifact three-state mapping

| Wire three-state | BDL storage four-state |
| --- | --- |
| `pending` | `untrusted` (transfer done, not inspected) or `inspected` (mechanical checks passed, admission decision pending) |
| `clean` | `admitted` |
| `quarantined` | `rejected` (always carries an honest rejection reason) |

`executables` (detected executable-content list) is **always an empty array**
— inspection hooks (archive content scanning) are an interface placeholder in
the download-events protocol and land with the hook slice in a version bump.
Size is null only while the transfer is incomplete; unextracted previews are
empty arrays. Download status presentation **does not use this protocol**: a
download is a recoverable task and follows the global task contract's nine
states; "retry" is presented as a task-level action adjudicated by AMF (the
application-contract retry command is defined by the B side, idempotency
fingerprinting modeled on production.*) — no new download.* surface.

## Alignment with the seed allowlist

The isolated-session base (`https://booth.pm`) is re-checked: every URL
carried by v0.2 catalog fields is a verbatim observed URL of a BOOTH page or
its embedded media; embedded-media hostnames (image CDNs) follow real
observations and are enumerated by the F-side security layer before F4-5 goes
live — this protocol does not hard-code a hostname list.

## Machine-readable vocabulary

`schemas/bdl-queries/v0.2/`: `query.schema.json` (operation vocabulary +
query closed set), `result.schema.json` (the five result shapes),
`examples/` (5 requests + 5 results + 2 negatives: an entity filter param and
an illegal availabilityStatus enum value must be rejected). Dual-end
fixtures: Rust side `contracts.rs` + `bdl_queries.rs` (operation enum,
three-state mapping and the **availability derivation function** — the
executable form of the rule table); the F side registers its contracts types
and Kernel router arms with the freeze (modeled on the production.* two
steps). Vocabulary or field changes must bump the version, never rewrite in
place.

## Open items

- Entity/relation areas and the entity-type vocabulary: with BDL v2 (V2-3/
  V2-4, pending product-owner adjudication);
- the `executables` list: with the inspection-hook slice;
- `catalogUpdatedSeq` bookkeeping: with the observation-pipeline slice;
- the copy role bit (original vs generated package): with B4-7;
- freshness (`stale`): with the G13 write path, answered by its own sync
  bookkeeping;
- the task-level retry command shape: an application-contract evolution item,
  defined by the B side.
