# Production Use Case Protocol v0.2 (Recipe & AMF production mainline)

[简体中文](production-use-case-v0.2_ZH.md) | [English](production-use-case-v0.2_EN.md)

> Document version: 0.2
> Status: **Candidate** (2026-09-09) — the ten method schemas are in
> `methods/`; the positive/negative vectors and the full-route consumer
> tests complete the freeze prerequisites in the third cut (the v0.1
> lesson: never repeat a freeze in name only)
> Machine-readable vocabulary: `schemas/production-use-case/v0.2/methods/`
> (ten method schemas) and `schemas/recipe/v0.3/` (recipe / local-resolution /
> approved-plan / build-record documents)
> Scope: the M5 production mainline command face — recipe drafting and
> storage, Local Resolution, plan approval, job execution and Build Record
> reads. The M3 material-line commands (`production.*` v0.1) stay frozen and
> served unchanged: the two families coexist on the same provider.
> Ownership boundary: `docs/architecture/orchestrator_ZH.md` (the
> Orchestrator owns application use cases); evidence bodies live in the AMF
> production persistent domain (W23, `schemas/production-evidence/v0.1/`) —
> never BDL (011 convergence decision 1).
> Updated: 2026-09-08

## v0.2 revision (from v0.1)

v0.1 covered the M3 material intake line (inspect/plan/confirm/recover).
v0.2 adds the M5 production mainline as a NEW use-case family; the v0.1
family remains frozen and served (dual-family coexistence, 009 stance 3).
The task lifecycle is NOT re-invented: every tasked method reuses the
application-contract nine-state task surface; a new method is a new entry in
the command vocabulary, not a new state machine.

## Method face (ten methods; vocabulary is closed)

| Method | Semantics | Tasked | Consumed by |
| --- | --- | --- | --- |
| `recipe.save` | Whole-document save with optimistic concurrency (`baseRevision`; mismatch = `vua.recipe.revision_conflict` naming `currentRevision`) | sync (idempotent per base) | W24 workbench |
| `recipe.get` | One recipe document (latest revision) | sync | W24 |
| `recipe.list` | Identity listing (`text`/`limit`/`offset`; `updatedAt` desc) | sync | W24 |
| `recipe.resolve` | Runs Local Resolution over a recipe (tasked; may be heavy) | task (nine states) | W24 |
| `plan.approve` | User authorization act: `draft` -> `approved`, idempotent; `superseded` plans refuse (`vua.plan.not_approvable`) | sync (idempotent) | W24 |
| `plan.get` | One approved-plan document with `planStatus` | sync | W24 |
| `plan.list` | Identity listing over plans | — (next cut) | W24 |
| `job.execute` | Submits an APPROVED plan for execution (Bridge v2 `execute_production_job` inside the nine-state task) | task (nine states) | W24 |
| `record.get` | One Build Record v0.3 document | — (next cut) | W24 |
| `record.list` | Identity listing over Build Records | — (next cut) | W24 |

Vocabulary-external method names are `unknown_method` contract errors.
Vocabulary-internal methods that are not yet wired answer a typed
`unavailable` — the frozen vocabulary is never a silent stub.

## Document chain (011 section 2)

```text
Recipe v0.3 (intent; user-drafted, AMF persistent domain)
  -> Local Resolution v0.3 (facts; provider-side resolution)
  -> approved-plan v0.3 (authorization; user-approved execution plan)
  -> Bridge v2 jobs (execute_production_job)
  -> Build Record v0.3 (history; per-job receipts, recovery points, deviations)
```

The four artifacts are independently versioned and never inline each other
(reference, never copy). The plan carries authorization only — there is no
`executed` status on a plan; execution facts live in the Build Record.

## Document storage

All four artifacts live in the AMF production persistent domain as a
document store (BuildRecordStore precedent: whole-document read/write,
versioned, identity-addressed; 011 convergence decision 1). BDL is never a
store for them. Evidence documents (W23, `production-evidence` v0.1) are
referenced by identity (`evidenceIds`) — bodies stay in the W23 store.

## Optimistic concurrency and approval

- `recipe.save` requires `baseRevision`; a mismatch answers
  `vua.recipe.revision_conflict` carrying `currentRevision`. Each accepted
  save bumps `revision`.
- `plan.approve` fixes the user's authorization (`draft` -> `approved`) and
  is idempotent. `superseded` plans refuse approval.
- Fingerprint and version-lock prechecks (009 stance 4) run again at
  `job.execute` admission: version lock -> environment -> fingerprint
  precheck, then the Bridge-side optimistic lock as the final line.

## Error vocabulary (application face)

`vua.recipe.invalid_params` / `vua.recipe.revision_conflict` /
`vua.recipe.not_found` / `vua.recipe.store_failed` /
`vua.recipe.unavailable` / `vua.recipe.resolve_unavailable` /
`vua.plan.invalid_params` / `vua.plan.not_approvable` / `vua.plan.not_found`
/ `vua.plan.store_failed` / `vua.plan.unavailable` / `vua.job.unavailable` /
`vua.record.unavailable` — snake_case codes with camelCase message keys
(`errors.recipe.*`, `errors.plan.*`, `errors.job.*`, `errors.record.*`).
Vocabulary-internal not-yet-wired methods answer typed `unavailable`, never
a silent stub.

## Terminology note (user ruling 2026-09-08)

VPM = VRChat Package Manager; "VPM 包" = VPM package (the managed package).
This document uses the ruled forms throughout.
