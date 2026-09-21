# BDL Read-Model Protocol v0.5 (catalog + warehouse + completed downloads + dependency lookup and observation listing)

[English](bdl-queries-v0.5_EN.md) | [简体中文](bdl-queries-v0.5_ZH.md)

> Document version: 0.5
> Status: **Frozen (domain business vocabulary)** (2026-09-22, wt-5 data
> batch 168 = the freeze batch; the dependencies.* v0.5 implementation ring
> dispatched by the operator, per the proposal 030 §5.7 case-A ruling).
> The「Schema＋正负例向量＋至少一端消费测试」freeze triad landed together:
> - schemas: `schemas/bdl-queries/v0.5/query.schema.json` +
>   `result.schema.json` (the eight-member operation closed set, the
>   params/result shapes, the word-face enums);
> - vectors: `schemas/bdl-queries/v0.5/examples/` — four positives
>   (lookup/listByProduct request+result each) + five negatives;
> - consumer test: `crates/bdl-store/tests/dependencies_queries_v05.rs`
>   (8 cases green, local cargo run 2026-09-22; drives every vector file +
>   a verbatim closed-set comparison against the frozen BDL v0.2 + the
>   matching rule v1 / advisory rule v1 reference derivation).
> **Contract-first split (v0.4 precedent)**: the data seat freezes the
> domain vocabulary ahead of the wire — the provider-host route arms and
> the envelope version constant (`BDL_QUERIES_SCHEMA_VERSION` 0.4→0.5) rise
> with the core wiring batch; the renderer TS face belongs to the desktop
> role; the bdl-store v0.2 landing (migration registration to
> user_version=2 + write/read faces) is the production build slice. **This
> batch changes zero bdl-store code and lands zero wire — zero end-to-end
> claims.**
> Ordering dependency (registered honestly): the dependencies.* word faces
> ride the **FROZEN BDL v0.2 closed sets** (`schemas/bdl/v0.2`, frozen
> 2026-09-22 by wt-4 production batch 166 — before this vocabulary); the
> verbatim comparison against the v0.2 closed sets is pinned mechanically
> by the consumer test (word-face drift turns the test red).
> Upstream basis: proposal 030 §3.2 (the reverse-lookup interface sketch) +
> the data seat's inline candidate-vocabulary direction in 030 (batch-166
> section, frozen per that direction) + the operator's vector-file-form
> ruling (the frozen JSON form stands; this family's examples follow the
> bdl-queries four-version `examples/` precedent)

## v0.5 revision (relative to v0.4)

An additive expansion of the operation closed set (six → eight members);
the six v0.4 methods keep their params/fields/results identical to v0.4
(schemaVersion rises to "0.5" with the vocabulary):

1. **`dependencies.lookup` added** (the dependency reverse lookup, directly
   required by the U18 supply chain's reverse-lookup segment);
2. **`dependencies.listByProduct` added** (all dependency observations of
   one product — the unfiltered observation face).

Both are **read-only**. The human-confirmation write action (the
`confirmed_by_human` flip) belongs to the build slice's (production seat)
store write face; this family carries zero write operations — the
vocabulary deliberately contains no write words.

## Frozen scope and division of labor

This protocol freezes the **operation vocabulary, the query closed set,
the field surfaces, the result shapes, and the v1 bodies of the two
read-time rule tables** (the matching rule and the advisory rule — the
rule tables are versioned with this protocol; a rule change must bump this
protocol version first, never rewrite in place). Error channels, request
correlation and the transport envelope belong to the versioned application
contract; the envelope version constant and the provider-host method
routing rise with the core wiring batch. The renderer TS face is
registered by the desktop role.

## Method surface (eight read-only methods)

| Method | Meaning | Consumer |
| --- | --- | --- |
| `catalog.list` | product card list by query (paginated) | cloud-track card wall |
| `catalog.detail` | single product detail | detail drawer |
| `catalog.status` | catalog health and revision snapshot | status line / degraded presentation |
| `warehouse.listEntries` | all material-package entry cards | local-track entry list |
| `warehouse.entryDetail` | per-artifact inspection facts of one entry | entry detail |
| `downloads.listCompleted` | adoptable completed deliveries, with adoption links | import page: completed-download list + adoption entry |
| `dependencies.lookup` (new in v0.5) | dependency reverse lookup (the suggestion face) | U18 supply chain, reverse-lookup segment (AMF use case) |
| `dependencies.listByProduct` (new in v0.5) | all dependency observations of one product (the clue face) | resolution-confirmation workflow read face + future detail enrichment |

Until the observation pipeline lands data, `dependencies.lookup` returns
an empty set and `dependencies.listByProduct` an empty observation list —
the empty state is the terminal state.

## dependencies.lookup semantics (the suggestion face)

**Params closed set**: `name` (required, minLength 1 — the dependency
nominal produced by the detection segment, as the caller holds it),
`depKind` (optional, the enum rides the FROZEN BDL v0.2 four-value
`dep_kind` closed set `shader|tool_package|avatar_base|other`;
null/absent = no filtering), `limit` (1–200, default 50) / `offset`
(default 0) per the catalog.list pagination law. The params face is closed
(`additionalProperties: false`) — an out-of-vocabulary key is a contract
error, never a silently empty answer (the negative vectors pin it,
including a `fuzzy` key: this vocabulary deliberately carries no fuzzy or
equivalence switch).

**Matching rule v1 (a read-time versioned rule table; this protocol
freezes its v1 body)**:

- **Case-insensitive EXACT match over `dep_name`** (the executing engine's
  ASCII case-fold scope; non-ASCII nominals have no case and reduce to
  verbatim equality). Stored nominals stay **verbatim and unnormalized** —
  matching is not normalization, and storage is never rewritten by it.
- **No substring, no fuzzy, no equivalence** (prefer omission over error):
  a package-form input (`com.lilxyzw.liltoon`) that is not literally
  present as any dep_name returns an **honest empty set**. Nominal-to-
  packageId identity is never guessed (the 030 §3 honesty boundary);
  equivalence matching may only enter through a rule-table revision (v2+)
  once confirmed observations accumulate — the vocabulary itself carries
  no equivalence logic.

**Result shape**: top level `{ total, matches[] }` — total is computed
before pagination (the catalog.list law); rows sort by productId ascending
then observation identity ascending (identity-derived, deterministic
pagination). Each match's key closed set:

- `productId` (booth: identity) + `productTitle` (null = honest absence);
- `availabilityRaw` + `availabilityStatus` — the **dual-field law reused
  whole** (from the declaring product's row; raw is verbatim evidence,
  status is the stable enum derived at read time — the renderer consumes
  only status);
- `depKind` / `depName` / `versionHint` (nullable) — the verbatim evidence
  face, zero normalization; `versionHint` carries ALL version constraints
  (engine/SDK pins are stored in BDL v0.2 as `dep_kind='other'` + the pin,
  and surface here as-is);
- `rawQuote` (required, verbatim) + `sourceSpan` + `extractionMethod`
  (both closed sets ride BDL v0.2's five/six values) — the evidence body
  of a "suggestion with evidence";
- `resolvedProductId` (nullable) — **surfaces ONLY for human-confirmed
  resolutions (confirmed_by_human = 1)**; unconfirmed resolutions never
  enter the suggestion face (the read-time derivation law landed as a
  wire-face law); null = no resolution, or an unconfirmed one (no
  distinction is revealed);
- `advisory` (object | null) — see below.

**Advisory rule v1 (a read-time versioned rule table; this protocol
freezes its v1 body)**: an observation carries a suggestion (advisory
non-null) if and only if —

1. the layout is a **deliberate declaration**: `extraction_method ∈
   {explicit_heading, one_line, bullet}` (prose/title/link forms are
   incidental mentions, below the suggestion line); AND
2. the install source is provable: the row carries a **human-confirmed**
   resolution (no VPM-repo fact lives in the store, so rule v1 never
   guesses an install source from a nominal; an unconfirmed resolution is
   a clue and never turns into a suggestion).

When non-null: `installSource` derives from the **resolution target's**
source host — a booth.pm host = `booth_page`, any other host =
`external_page`; `vpm` and `unknown` stay in the frozen enum but **v1
never emits them** (vpm derivation awaits a rule revision backed by a
VPM-repo reconciliation fact — claiming vpm without one would be a
guess). `confidence` has two tiers over the layout dimension only —
`strong` = explicit_heading/one_line (the author declares in a dedicated
heading or one-line statement), `weak` = bullet (a listed line, real but
compressed). The output is ever a **suggestion with evidence**, never a
fact claim.

**Deliberate omissions (admission rule)**: `extractedBy` stays off the
lookup wire (the user-facing evidence is rawQuote + sourceSpan + the
declaring product); `observedAt` stays off lookup (the suggestion face
does not judge freshness); paths never appear (the house rule); lookup
does **not** filter on the declaring product's tombstone state — a
declaration's evidentiary force does not die with its page
(listByProduct carries the explicit `productStatus`).

**Empty-state honesty**: `total:0 + matches:[]` = "no matching nominal"
(under the current rule table), NOT "no such dependency" — observations
below the suggestion gates stay in the library, still valid, and
listByProduct is the unfiltered face. The protocol states this
distinction explicitly; consumers must never render the empty set as
"this dependency does not exist".

## dependencies.listByProduct semantics (the clue face)

**Params closed set**: `productId` (required, `^booth:[0-9]+$`, same as
catalog.detail). No name/filter keys exist — a client-supplied filter is
a contract error (the negative vector pins it).

**Absence and tombstone semantics**: an unknown productId is the
application-face not-found (aligned with catalog.detail's existing
absence semantics: a store-level None maps to the application contract's
not-found code, never a fabricated empty answer); a **tombstoned product
(`status='missing'`; 404/410 kept, never deleted) is NOT refused** — it
answers with `productStatus:'missing'` and its observations stay
readable, because the confirmation workflow must still see a dead page's
declarations and clues (this is exactly where it diverges from
catalog.detail's "tombstones are never served as cards" rule — this face
is an observation read face, not a catalog card face).

**Result shape**: `{ productId, productStatus, observations[] }`;
`productStatus ∈ {complete, missing}` (the tombstone honesty face);
observation rows sort by observation identity ascending (insertion order,
deterministic). Each observation's key closed set = the lookup evidence
keys carried whole (`depKind`/`depName`/`versionHint`/`rawQuote`/
`sourceSpan`/`extractionMethod`) + `extractedBy` (the extractor identity —
the confirmation workflow must know who extracted; the admission consumer
is explicit) + `observedAt` (the confirmer judges freshness) +
`resolution` (null | `{productId, confirmed, evidence[]}`). **No
advisory** — the suggestion derivation is lookup's job; this face lists
observations as they are (low-confidence rows included) with no
suggestion filter; `evidence[]` elements reuse the FROZEN BDL v0.2
four-key shape (`{linkText, linkUrl, span, note}`) verbatim; a
`confirmed:false` resolution surfaces here **as a labeled clue** (the
landing point of the proposal 030 §1 sample-3 mislink evidence).

**The two-face contrast IS the clues-not-conclusions law**: lookup
surfaces only confirmed resolutions (the resolvedProductId gate and the
advisory gate); listByProduct lists every clue with its confirmation
state labeled. Both faces share one library and one source of truth —
the contrast is the honesty.

## The listByProduct keep ruling (batch 168, data-seat decision)

The operator's batch-168 dispatch left the candidate-cut listByProduct's
fate to this seat. **Ruling: KEEP**, for four reasons:

1. **The clues-not-conclusions law needs the two-face contrast to hold** —
   with lookup alone, unconfirmed clues would have no query that can read
   them (library rows invisible to every query face are near-dead data)
   and the law's honesty fails; the two members are one design unit,
   and cutting one cripples the other.
2. **The consumer is real and scheduled** — the extraction-pipeline slice
   of the 030 execution order includes the human-confirmation face; its
   write side (the confirmed_by_human flip) belongs to the production
   build slice, and its read side must land first or in the same batch.
   This face IS that read side.
3. **The cost is bounded** — one param (riding catalog.detail's existing
   pattern); row keys are isomorphic with lookup's evidence body (delta =
   +extractedBy/observedAt/resolution, − pagination/suggestion-derivation
   keys); every key maps one-to-one onto a frozen BDL v0.2 column; zero
   speculative fields.
4. **Not hard-fitted** — the admission rule holds: every key answers
   "which column and which consumer needs it"; no key entered the table
   because it might be useful someday.

## Dependency direction

```text
AMF use case (U18 supply chain, reverse-lookup segment / the confirmation workflow)
  → this protocol's provider (the AMF application service, read-only)
  → the BDL local database (read-only; the v0.2 landing is the production build slice)
(application-contract egress and desktop presentation belong to the core/desktop
wiring batches; this protocol does not presume their shapes)
```

BDL is an AMF-private local module: rawQuote/sourceSpan/extractionMethod
and the other private observation semantics stop at the AMF use case and
never rise to the application contract's public face (030 §5.7 case A,
reason 1).

## Machine-readable vocabulary

`schemas/bdl-queries/v0.5/`: `query.schema.json` + `result.schema.json` +
`examples/` (4 positives: lookup/listByProduct request+result each;
5 negatives: an empty name, an out-of-vocabulary depKind [pinning the
five-value draft's `unity_or_sdk_version` member as rejected — the same
ruling face as BDL v0.2's N1], an out-of-vocabulary `fuzzy` key, an
out-of-vocabulary filter key on listByProduct, and a v0.4-typed replay;
each must be rejected). Consumer test:
`crates/bdl-store/tests/dependencies_queries_v05.rs` (vector-driven + a
verbatim closed-set comparison against the frozen `schemas/bdl/v0.2`
schema.sql CHECK lists + the matching rule v1 / advisory rule v1
reference derivation over the frozen 001+002 migration chain + the
mechanical two-face pins + the no-path-key scan). Vocabulary or rule
changes must bump the version, never rewrite in place.

## Open items

- The bdl-store v0.2 landing (migration registration to user_version=2 +
  write/read faces + this family's executable read face): the production
  build ring awaits dispatch; when it lands, this test's reference
  derivation is superseded by the store implementation (the test stays as
  the vocabulary anchor).
- The envelope version constant 0.4→0.5 + provider-host route arms + the
  TS face: the core/desktop wiring batches.
- Equivalence matching rules (v2+): await accumulated confirmed
  observations and a VPM-repo reconciliation fact, entering through a
  protocol revision; the vocabulary itself carries zero equivalence
  logic.
- The `vpm` installSource derivation: awaits a VPM-repo reconciliation
  fact (a rule revision — never guessed from a nominal).
- U18 final ruling (real machine + BOOTH statistics) linkage: before it,
  this family supplies data only and never rules feasibility; zero
  end-to-end claims hold.
