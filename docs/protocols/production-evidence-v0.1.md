# Production evidence entry protocol v0.1 (compatibility/missing evidence model, W23)


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
> Ownership boundary: `docs/architecture/bdl.md` (BDL does not store
> production orchestration documents — data-side stance in proposal 011);
> evidence body persistence lives in the AMF production persistence domain
> (shape defined by the core W20 freeze slice)
> Updated: 2026-09-08
> Erratum (2026-10-02): stale citations repaired.
> (1) "Boundary with BDL" cited "BDL (bdl v0.1)" — no document by that name
> exists; the BDL persistent-format family's current document is
> [bdl-dependency-observations-v0.2.md](bdl-dependency-observations-v0.2.md)
> (format v0.2 over `schemas/bdl/`; v0.1 survives as the v0.1→v0.2 migration
> base).
> (2) "Stable error codes" cited "bdl-commands v0.3" as a live carrier —
> v0.3 is superseded ([superseded/bdl-commands-v0.3.md](superseded/bdl-commands-v0.3.md));
> the current version is [bdl-commands-v0.4.md](bdl-commands-v0.4.md).
> Protocol version and normative content unchanged.

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

BDL (the persistent format — currently v0.2, see
[bdl-dependency-observations-v0.2.md](bdl-dependency-observations-v0.2.md);
formerly cited as "bdl v0.1", an unresolvable reference — Erratum 2026-10-02)
does not store production evidence — its admission rule is
material-acquisition observation facts (data-side stance ① in proposal 011).
Evidence body persistence lives in the AMF production persistence domain
(shape lands with the W20 implementation slice).

## Stable error codes

This protocol has no command face and adds no error codes; a producer's
failure semantics travel its own command/task protocol (bdl-commands —
currently [v0.4](bdl-commands-v0.4.md); the citation previously read v0.3,
now superseded — Erratum 2026-10-02,
production-use-case v0.2, …).
