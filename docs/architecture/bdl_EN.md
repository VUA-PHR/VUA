# BDL architecture boundary

[English](bdl_EN.md) | [简体中文](bdl_ZH.md)

> Status: Module boundary accepted; internal model pending  
> Scope: AMF-owned BDL module  
> Updated: 2026-09-01  
> Normative effect: Module boundary authority; data model pending

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

Entity identity, SQLite schema, observation format, terms representation, compatibility evidence, and
Warehouse mapping remain to be frozen by the first new AMF+BDL vertical slice. The first BDL surface
is private to AMF application services; later public read surfaces require their own accepted
contract.
