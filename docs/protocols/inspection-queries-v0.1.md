# inspection-queries Protocol v0.1 (inspection read vocabulary row: get + list + requestRun)


> Document version: 0.1
> Status: **FROZEN (inspection read vocabulary row)** (2026-09-13, proposal
> 016 arbitration point 2 independent vocabulary row; freeze
> hard-precondition close-out itemized below)
> Machine-readable vocabulary: `schemas/inspection-queries/v0.1/` (three
> method Schemas + positive/negative vectors; contract anchor
> `crates/acquisition/tests/inspection_queries_contract.rs`; frame-loop
> wire tests `crates/provider-host/tests/inspection_queries.rs`)
> Scope: `inspection.get` (identity-addressed single evidence document),
> `inspection.list` (identity listing, newest first),
> `inspection.requestRun` (task-driven write command, job.execute-shaped
> taskId polling)
> Ownership boundary: the evidence document body belongs to
> `schemas/inspection-evidence/v0.1` (production domain, the AMF production
> persistence domain's fifth document store, never passes through BDL —
> proposal 016 §5, 011 §5); this vocabulary row carries only the read/write
> method faces; the read face returns the evidence body verbatim — never
> inlined, never re-derived
> Updated: 2026-09-13 (v0.1 freeze batch: all three methods frozen in one batch)

## Freeze close-out (proposal 016 §7 hard preconditions, itemized)

- **(1) Producing operations**: the Bridge five-dimension producing
  operations landed and accepted (v1 `validate_avatar` typed checks +
  `analyze_performance` local structural estimate, v3 three read-only
  inspection operations `inspect_avatar_references` / `inspect_lighting` /
  `inspect_upload_readiness`; merge 7d63abe, anchor slice c33adb3);
- **(2) Store + routes**: the core `InspectionEvidenceStore` (append-only,
  hard_link exactly-once, `{inspectionId}.json` identity addressing,
  absent root = honest empty state) + the `inspection.get` /
  `inspection.list` read routes (implemented verbatim from this vocabulary
  row) + the task-driven `inspection.requestRun` landed and accepted
  (merge 7a262b8); followed by the data-review revision batch (c914cf2)
  unifying the family-owned version constant — every reply of this row
  cites `INSPECTION_QUERIES_SCHEMA_VERSION = "0.1"`, never the evidence
  body version, never the bdl-commands family version (data ratification
  on record);
- **(3) Vectors + consumer tests**: positive 3 pairs (request + result for
  get/list/requestRun) + negative 3 (get and requestRun unknown params +
  list limit out of range 201) all green; dual carriers in-tree (the
  acquisition contract anchor, vector-driven, plus the provider-host frame
  loop over the real routes covering zero-receipt-no-publish and unwired
  honest absence);
- **(4) Bilingual protocol document + (5) docs/REGISTRY.md row**: land with
  this freeze batch.

## Frozen scope and division of labor

This protocol freezes the **method vocabulary, parameter closed sets,
field faces and result shapes**. The error channel, request correlation
and transport envelope belong to the versioned application contract; the
renderer TS face was registered by the core with the implementation batch
in `@vua/contracts` (types + guards + consumer tests), and the desktop
page consumption (the desktop half of M7 "Inspection/Release pages and
official SDK handover") awaits wiring — end-to-end must not be claimed
before that wiring lands. The evidence document body's shape and semantics
belong to inspection-evidence v0.1 (production-domain freeze batch); this
vocabulary row is decoupled from it: a body version bump does not
automatically move this row.

## Method faces (two reads, one write)

| Method | Semantics | Consumer |
| --- | --- | --- |
| `inspection.get` | Returns the evidence document body verbatim by `inspectionId` identity addressing (the body is fully validated by inspection-evidence v0.1; the result `schemaVersion` is this row's own `"0.1"`) | Inspection detail view |
| `inspection.list` | Identity summary rows, `performedAt` descending newest first; optional filters = exact-match `avatarRef` + `overallStatus` closed set `pass\|warn\|fail`; bounded `limit(1..200)`/`offset` paging; summary rows never inline dimensions/checks (reference, do not copy, 012 evidenceIds discipline) | Inspection history list |
| `inspection.requestRun` | Task-driven: drives the five producing operations → transcription → aggregation → publishes exactly one evidence document (fresh uuid-v7 `inspectionId`); acceptance reply `{schemaVersion, operation, taskId, correlationId}` follows the job.execute shape, the caller polls the application task face by `taskId` | Inspection trigger entry |

Honest-absence discipline: an unwired read face answers the typed
`vua.inspection.unavailable`; an empty store's `list` returns an empty set
— the empty state is the final state; a `requestRun` run with zero
receipts (an empty operation evidence bundle) is a typed failure and
publishes nothing — a document is never fabricated.

## requestRun params and semantics

- Closed two-key params: `avatarGlobalObjectId` (the Unity scene target
  identity, `minLength 1, maxLength 512` — a command payload shape
  constraint) + `avatarRef` (the inspected avatar's verbatim identity:
  `ref` required `minLength 1` with no upper bound, `label` nullable —
  same shape as the evidence body's verbatim carry, read/write symmetric;
  revision batch c914cf2 dropped the write-side-only maxLength, data
  ratification on record);
- `additionalProperties: false` — an out-of-vocabulary parameter is a
  contract error (pinned by negative vectors);
- Paths are provider-bound configuration and never travel the wire (M3/T1
  ruling);
- All five producing operations run with `dry_run: true` (read-only
  observation, zero project changes);
- `overallStatus` aggregation = `fail` (including unavailable dimensions)
  > `warn` > `pass` (proposal 016 §4 rule, mechanical mapping, never
  interpreted).

## Dependency direction

```text
React View (inspection detail / history / trigger entry)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (inspection.* vocabulary row)
  → AMF application service (provider-host routes, live)
  → InspectionEvidenceStore (AMF production persistence domain's fifth
    document store, never passes through BDL)
```

## Machine-readable vocabulary

`schemas/inspection-queries/v0.1/`: `methods/` (three method Schemas) +
`examples/` (3 requests + 3 results + 3 negatives: get and requestRun
unknown params, list limit out of range 201 — all must be rejected).
Consumer tests in two carriers:
`crates/acquisition/tests/inspection_queries_contract.rs` (the vector
contract anchor) + `crates/provider-host/tests/inspection_queries.rs`
(the frame-loop wire tests: get identity addressing and honest not_found,
list ordering/filtering/paging, requestRun full-chain single publish,
zero-receipt no-publish, unwired unavailability, closed-set parameter
rejection). Any vocabulary or field change must bump the version, never
rewrite in place.

## Open items

- Desktop page consumption (M7 breakdown-table desktop row): the BG-15
  skeleton is in-tree awaiting wiring;
- Real-machine walkthrough (inspection runs against a live Unity
  production environment): belongs to the W25 real-machine window;
- The `official_sdk_rating` reserved value: disabled until the SDK
  handover slice lands (016 arbitration, a production-domain obligation —
  this vocabulary row transcribes it, never interprets it).
