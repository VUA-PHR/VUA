# BDL architecture boundary

[English](bdl_EN.md) | [简体中文](bdl_ZH.md)

> Document version: 1.0.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors bdl_ZH.md at 1.0.0)
> Scope: AMF-owned BDL module
> Updated: 2026-09-06
> Last conformance review: 2026-09-06
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

## Landing status (reviewed 2026-09-06)

The first persistent format and query contract landed with the B4 slice: `schemas/bdl/v0.1` (the
BDL SQLite persistent format) and `schemas/bdl-queries/` (the query contract, now at v0.3),
implemented in the `bdl_store` / `bdl_queries` modules of `crates/orchestrator`. The surface remains
private to AMF application services; any later public read surface requires its own accepted
contract. Entity identity, observation formats, terms representation, and compatibility evidence
evolve with future AMF+BDL vertical slices.

## Document changelog

- 1.0.0 (2026-09-06): entered version management; the "pending" closing section rewritten as the
  landing status (`schemas/bdl/v0.1` and the bdl-queries query contract v0.3 landed with B4); the
  header status updated to accepted to match reality.
