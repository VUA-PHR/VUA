# BDL architecture boundary


> Document version: 1.2.1
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors bdl.md at 1.2.1)
> Scope: AMF-owned BDL module
> Updated: 2026-09-23
> Last conformance review: 2026-09-08
> Normative effect: Yes

## Ownership

BDL (Booth Database Local) is an internal local AMF module. AMF application services are its sole
access path for the Renderer, other Orchestrator use cases, environment deployment, project
management, overlays, and plugins. Its internal model is designed from current AMF needs and real
vertical slices.

## Responsibilities

**Base responsibilities, retained unconditionally (user ruling, 2026-09-22):**

- Local products, subproducts, creators, files, terms, aliases, compatibility relations, and
  provenance records.
- Asset identity, and the local mapping (source correlation) between downloaded files, Warehouse
  assets, and source products.
- Local search, filtering, deduplication, and catalog capabilities for AMF.
- Provenance for VN3 and ordinary terms-of-service observations and filters.
- Storage of source observations and download-result metadata already validated by AMF.

**Experimental automatic compatibility forensics (off by default, user ruling 2026-09-22):**

- Automatic compatibility-evidence collection is experimental and off by default; when enabled it
  tries to collect evidence from the user's actual BOOTH browsing and Unity usage. It does not
  revive the abandoned whole-site cloud-collection direction.
- Turning automatic collection off never disables base storage, ordinary import, or Recipe source
  supplementation.

AMF acquisition owns the browser, Session, download task/transport, BLM/VAE adapters, and UI. BDL
stores the normalized metadata AMF decides to persist.

## Evidence semantics and human correction (user ruling, 2026-09-22)

- **No evidence means unknown:** when compatibility, dependency, or provenance lacks evidence, the
  state is unknown and must not be treated as resolved, compatible, or verified.
- **Human correction: direction retained, not yet frozen.** The product direction of local evidence
  viewing and correction is retained, but the concrete UI, editable scope, and permissions still
  need definition. This section grants no arbitrary-database-edit authority, and implementations
  must not silently widen the editable surface.
- **Degradation path undecided:** how dependency completion is accomplished when automatic forensics
  is off or resolution fails still needs a concrete flow (see the to-be-verified list in the
  [product boundary](../product-boundary.md)).
- This section does not change the existing persistence format or query contracts — the frozen
  faces of `schemas/bdl/` and `schemas/bdl-queries/` do not automatically move because of it.

## Layering

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

## External tool data

The native AMF browser and content manager are the complete path. Tools such as BLM and VAE
coexist as optional AMF adapters:

- Prefer public, stable, clearly authorized APIs or import/export formats;
- third-party login sessions and private credentials stay inside their original owner's boundary;
- third-party private database schemas stay inside the adapter;
- the native path completes the core flows on its own;
- each adapter publishes an honest capability snapshot;
- adapter data enters BDL only after AMF validation.

## Landing status (reviewed 2026-09-08)

The first persistent format and query contract landed with the B4 slice: `schemas/bdl/v0.1` (the
BDL SQLite persistent format) and `schemas/bdl-queries/` (the query contract, now at v0.3),
implemented in `crates/bdl-store` (moved out of `crates/orchestrator` in the crate split). The
catalog serving face (W12), the warehouse command face (W8/W14), and the provider routing (W12
closeout) closed within M4. The observation write face landed with W17 (see above). The surface
remains private to AMF application services; any later public read surface requires its own
accepted contract. Entity identity, terms representation, and compatibility evidence evolve with
future AMF+BDL vertical slices. The 2026-09-22 user ruling confirms that base storage, asset
identity, source correlation, and catalog capabilities are retained unconditionally, and sets
automatic compatibility-evidence collection as an experimental feature off by default (not yet
implemented; semantics under "Responsibilities" and "Evidence semantics and human correction").

## Document changelog

- 1.2.1 (2026-09-23): structure aligned with the authoritative ZH edition — the acquisition/BDL
  ownership paragraph moved back to the end of "Responsibilities"; the layering diagram regained
  its own "Layering" section; the condensed adapter paragraph unfolded into a full "External tool
  data" section mirroring the ZH six-bullet list. The authoritative ZH text is unchanged.
- 1.2.0 (2026-09-22): user ruling of 2026-09-22 landed — "Responsibilities" split into base
  storage/asset identity/source correlation/catalog capabilities retained unconditionally, and
  experimental automatic compatibility forensics off by default; new "Evidence semantics and human
  correction" section (no evidence = unknown, correction direction retained but not frozen,
  degradation path undecided); the merge does not change the frozen faces of `schemas/bdl/` and
  `schemas/bdl-queries/`. Mirrors the ZH edition.
- 1.1.0 (2026-09-08): added the "Observation write face" section (W17: upsert + bookkeeping
  counter + write-face closed sets + read-face consumption of the observed columns + scope
  statement); landing status re-reviewed with the corrected implementation location
  (`crates/bdl-store`).
- 1.0.0 (2026-09-06): entered version management; the "pending" closing section rewritten as the
  landing status (`schemas/bdl/v0.1` and the bdl-queries query contract v0.3 landed with B4); the
  header status updated to accepted to match reality.
