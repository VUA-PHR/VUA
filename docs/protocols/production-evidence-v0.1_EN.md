# Production evidence entry protocol v0.1 (compatibility/missing evidence model, W23)

[English](production-evidence-v0.1_EN.md) | [简体中文](production-evidence-v0.1_ZH.md)

> Document version: 0.1
> Status: **Frozen** (2026-09-08, proposal 011 convergence review; the storage
> implementation lands with the W20 implementation slice)
> Machine-readable vocabulary: `schemas/production-evidence/v0.1/` (schema +
> positive/negative vectors; consumer test
> `crates/acquisition/tests/production_evidence_contract.rs` — including a
> real cross-vocabulary check against the frozen
> `schemas/recipe/v0.3/local-resolution.schema.json`)
> Scope: honest evidence entries for missing/unsatisfied facts discovered
> while preparing or running production
> Ownership boundary: `docs/architecture/bdl_ZH.md` (BDL does not store
> production orchestration documents — data-side stance in proposal 011);
> evidence body persistence lives in the AMF production persistence domain
> (shape defined by the core W20 freeze slice)
> Updated: 2026-09-08

## Semantics

- **One evidence = one document**: `{ schemaVersion, evidenceId, kind,
  subject, observedAt, detail, sourceRef, resolution }`.
- **kind closed set** (v0.1): `missing_asset` (a Recipe-referenced asset is
  absent) / `missing_package` (a declared dependency package is absent) /
  `version_mismatch` (an observed Unity/package version contradicts the
  constraint or lock) / `guard_denied` (a server-side guard refused an action
  and the refusal itself is the evidence).
- **Identity**: `evidenceId` is a uuid v7 (isomorphic with the recipe v0.3
  vocabulary identity conventions); the Local Resolution document's
  `assetResolution.evidenceIds[]` references it — **reference, never copy**:
  the honest detail lives only in the evidence body; the resolution/record
  faces never inline it.
- **sourceRef**: at least one producing context (`localResolutionId` or the
  task `taskCorrelation`) — an evidence without a producing context is
  inadmissible.
- **resolution lifecycle**: `null` = unresolved (the evidence stands);
  attaching `{ resolvedAt, resolutionRef, note? }` = the fact was satisfied
  later — resolving **never rewrites** the observed content, it only appends
  the resolution reference.

## Producers and consumers

- Producers: Local Resolution (missing assets / version mismatches), task
  guards (denial evidence);
- Consumers: the Local Resolution document (`evidenceIds[]`), the Build
  Record evidence summary (W22: `evidenceSummary.evidenceIds`, also an
  identity reference), the desktop surfacing;
- **The Record freeze does not wait for this vocabulary** (proposal 012
  closure ruling): `evidenceIds` are open string identities; the Record
  vocabulary never consumes the evidence body shapes.

## Boundary with BDL

BDL (bdl v0.1) does not store production evidence — its admission rule is
material-acquisition observation facts (data-side stance ① in proposal 011).
Evidence body persistence lives in the AMF production persistence domain
(shape lands with the W20 implementation slice).

## Stable error codes

This protocol has no command face and adds no error codes; a producer's
failure semantics travel its own command/task protocol (bdl-commands v0.3,
production-use-case v0.2, …).
