# BDL architecture boundary

[English](bdl_EN.md) | [简体中文](bdl_ZH.md)

> Document version: 1.1.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors bdl_ZH.md at 1.1.0)
> Scope: AMF-owned BDL module
> Updated: 2026-09-08
> Last conformance review: 2026-09-08
> Normative effect: Yes

## Ownership

BDL (Booth Database Local) is an internal local AMF module. AMF application services are its sole
access path for the Renderer, other Orchestrator use cases, environment deployment, project
management, overlays, and plugins. Its internal model is designed from current AMF needs and real
vertical slices.

## Responsibilities

- Local products, subproducts, creators, files, terms, aliases, compatibility, and provenance.
- Mapping downloaded files and Warehouse assets to source products.
- Local search, filtering, deduplication, and human correction for AMF.
- Provenance for VN3 and ordinary terms-of-service observations and filters.
- Storage of source observations and download-result metadata already validated by AMF.

AMF acquisition owns the browser, Session, download task/transport, BLM/VAE adapters, and UI. BDL
stores the normalized metadata AMF decides to persist.

```text
AMF acquisition / content-management service
  ├─ native browser and authorized downloads
  ├─ BLM / VAE adapters
  └─ source validation and mapping decisions
          ↓ validated observations and result metadata
BDL application service
  ├─ normalization
  ├─ local identity and mapping
  ├─ search and filters
  └─ terms / compatibility evidence
          ↓
BDL-owned local database boundary
```

Remote DOM, page scripts, filenames, and third-party records are observations rather than canonical
entities. Identity, deduplication, and compatibility models follow a real page-and-file vertical
slice.

## Acquisition boundary

- Electron's isolated Session holds login, cookies, orders, and download tokens. AMF receives the
  normalized events, observations, and result metadata needed for the use case; BDL receives the
  approved persistent metadata subset.
- AMF owns task source, destination, progress, recovery, and validation.
- Downloads enter AMF as untrusted `LocalArtifact` values and require inspection before use.
- After inspection, AMF may submit source identity, file identity, check summary, and Warehouse
  mapping to BDL.
- BDL returns catalog, terms, and compatibility results; Electron and AMF retain session and download
  controls.

The native AMF path remains complete on its own. Optional BLM/VAE adapters use public, stable,
authorized boundaries, publish honest capability snapshots, keep third-party sessions and private
schemas within their owners, and submit data through AMF validation.

## Observation write face (W17, 2026-09-08)

The observation pipeline (the G13 write path, a future slice) is the intended caller that
writes observed facts into the BDL products table; its storage-side write face
(`record_product_observation` in `crates/bdl-store`) landed first with W17, with these
semantics:

- **Upsert**: one observation = one row of latest facts (`INSERT … ON CONFLICT DO UPDATE`,
  full-column overwrite); replaying the same observation is safe (same-content overwrite,
  never a second row). The API offers no delete — a row changes only through a newer
  observation; tombstones (`status: missing`, the 404/410 keepsakes) are legal observation
  results, are never physically deleted, and are never served as catalog cards.
- **Bookkeeping counter**: every successful write increments
  `bdl_meta.catalog_updated_seq` in the same transaction (first write initializes it to 1).
  `catalog.status` health turns from `unknown` to `ok` accordingly, and the counter travels
  the wire as `revision.catalogUpdatedSeq` (existing bdl-queries v0.3 semantics).
- **Write-face closed sets** (violations are rejected with `InvalidObservation`): identity =
  `booth:<native digits>` with both parts agreeing; `content_hash = sha256:<64 hex>`;
  `observed_at` and `processor_version` are required evidence; price amount/currency are
  admitted as a pair (main product and subproducts alike); `adult` is true only with the
  explicit BOOTH Adult badge.
- **Read-face consumption**: the catalog assembly now consumes the observed columns —
  `title`/`price`/`imageUrl` (always `imageUrls[0]`) and the availability dual field
  (`availabilityRaw` rides along verbatim; `availabilityStatus` is derived at read time per
  the versioned v0.2 rule table, never stored) reach cards and details; the `catalog.list`
  text filter = title + productId substring (the protocol surface unchanged). The honest
  empty-state semantics before any observation lands are unchanged (空态即终态).
- **Scope statement**: this write face serves the products table only.
  `term_observations` and `compatibility_observations` have no catalog consumer yet and
  stay with their own BDL v2 vocabulary slices; entity/relation storage (the
  `entityCount`/`entityTypes` honest empty slots) and freshness (`stale`) remain with BDL v2
  and the G13 write path, outside this face.

## Landing status (reviewed 2026-09-08)

The first persistent format and query contract landed with the B4 slice: `schemas/bdl/v0.1` (the
BDL SQLite persistent format) and `schemas/bdl-queries/` (the query contract, now at v0.3),
implemented in `crates/bdl-store` (moved out of `crates/orchestrator` in the crate split). The
catalog serving face (W12), the warehouse command face (W8/W14), and the provider routing (W12
closeout) closed within M4. The observation write face landed with W17 (see above). The surface
remains private to AMF application services; any later public read surface requires its own
accepted contract. Entity identity, terms representation, and compatibility evidence evolve with
future AMF+BDL vertical slices.

## Document changelog

- 1.1.0 (2026-09-08): added the "Observation write face" section (W17: upsert + bookkeeping
  counter + write-face closed sets + read-face consumption of the observed columns + scope
  statement); landing status re-reviewed with the corrected implementation location
  (`crates/bdl-store`).
- 1.0.0 (2026-09-06): entered version management; the "pending" closing section rewritten as the
  landing status (`schemas/bdl/v0.1` and the bdl-queries query contract v0.3 landed with B4); the
  header status updated to accepted to match reality.
