# BDL Persistent Format v0.2 (Product Dependency Observations) — Protocol

[English](bdl-dependency-observations-v0.2_EN.md) | [简体中文](bdl-dependency-observations-v0.2_ZH.md)

> Document version: 0.2
> Status: **FROZEN** (2026-09-22, frozen by wt-4 production, batch 166 — the
> freeze batch). The「Schema＋正负例向量＋至少一端消费测试」freeze triad landed
> together:
> - schema: `schemas/bdl/v0.2/schema.sql` (full readable authority,
>   standalone-executable) + `schemas/bdl/v0.2/002_dependency_
>   observations.sql` (v0.1→v0.2 incremental migration; STRICT +
>   bdl_meta.format_version + user_version discipline);
> - positive/negative vectors: `schemas/bdl/v0.2/vectors/` — exactly nine
>   accept vectors (P1–P9) and eight reject vectors (N1–N8), one JSON file
>   each (form frozen this batch, see the vector section);
> - consumer test: `crates/bdl-store/tests/dependency_observations_schema_
>   v02.rs` — 4 cases green this batch, driving every vector file.
> Zero end-to-end claims — no implementation or verification claim of any
> runtime, extraction, or consumption capability is made here. The bdl-store
> still runs format v0.1 (zero store code changed in the freeze batch); the
> v0.2 store landing is the NEXT slice.
> Freeze rulings registered this batch (operator-preauthorized direction
> finalized by the production seat): dep_kind = four values, no
> `unity_or_sdk_version`; the vector file form (registered in the
> collab/proposals/030 inline thread, data seat pinged — a form objection
> arriving after this freeze rides the errata batch, never an in-place
> reshape of the frozen word face).
> Ownership: 030 §5.1 ruling (2026-09-21 operator decision, recorded by
> Integration batch 163) = production seat owns the build; the data seat holds
> the consumption/query face downstream (the dependencies.* query family,
> 030 §5.7 case A). Drafted (batch 164) and frozen (batch 166) by production
> (wt-4).
> Upstream basis: proposal 030 §1 survey (2026-09-21, 9 read-only public-page
> accesses) + the data seat's inline stance on 030 (2026-09-22)

## Scope

This protocol freezes **BDL persistent format v0.2**:

1. `compatibility_observations.source_span` closed-set expansion (the two new
   members `title` and `description_link`) — a persistent-format migration
   obligation (SQLite cannot alter a CHECK in place; the table must be
   rebuilt);
2. the new table `dependency_observations` — the product-dependency
   declaration observation face (one declared dependency per row).

Not frozen and out of scope here: the bdl-queries `dependencies.*` query
vocabulary (the data seat's downstream consumption face, owned and delivered
by that seat); the extraction pipeline implementation; the U18 detection
segment; the body of any read-time confidence rule table (this document
freezes only the discipline that such a rule table exists and is versioned).

## v0.2 changes (relative to v0.1)

### 1. source_span closed-set expansion (compatibility_observations rebuild)

- The v0.1 closed set `('body','subproduct_name','image')` expands to
  `('body','subproduct_name','image','title','description_link')`.
- Survey evidence (030 §1): product titles carry compressed compatibility
  claims (sample 2「17アバター対応」), and description links form their own
  clue surface (sample 3).
- **SQLite cannot alter a CHECK in place**: expanding the set means REBUILDING
  the table (create new → copy every row → drop old → rename). This is a
  **persistent-format migration obligation**, not an add-a-column affair;
  `002_dependency_observations.sql` carries the migration, preserves every
  v0.1 row verbatim, and any data loss during migration is a failure.
- The v0.1 word face does not swing: v0.1 data survives unchanged in the new
  table; foreign words (synthetic negatives `heading`/`summary`/`prose`) keep
  being rejected (vectors P9/N2).

### 2. dependency_observations (new table)

One **declared dependency** per row, under the same observation paradigm as
`term_observations` / `compatibility_observations`: **verbatim evidence, zero
semantic rewriting, zero derived assertions**. Survey reality (030 §1):
dependency information lives only in author free text (headings,
version-pinned lines, one-line declarations, bullets, prose) — structured
BOOTH fields carry none of it — so every extraction lands as an EVIDENCED
OBSERVATION, never as a fact claim.

**Column law (frozen)**:

| Column | Law | Basis |
| --- | --- | --- |
| `dep_kind` | NOT NULL, frozen closed set `('shader','tool_package','avatar_base','other')` | see "dep_kind granularity" below |
| `dep_name` | NOT NULL, the dependency's name AS WRITTEN (`lilToon`); no normalization, no equivalence guessing | the reverse-lookup search column; name→package identity is the hard problem and the library does not fabricate it |
| `raw_quote` | **NOT NULL**, verbatim quote, zero semantic rewriting | compatibility_observations `raw_quote TEXT NOT NULL` precedent (001_initial.sql:69; spike schema.sql:64 comment "verbatim quote, no semantic rewriting") |
| `source_span` | NOT NULL, same five-value closed set as the compat table v0.2 | same observation paradigm |
| `version_hint` | nullable, the version string AS WRITTEN (`2.3.2~`); no normalization; carries ALL version constraints (engine/SDK pins included) | 030 §2; dep_kind ruling below |
| `resolved_ref_product_id` | nullable, FK→products | 030 §2 |
| `resolution_evidence` | nullable; **hard law: NOT NULL whenever resolved_ref_product_id is NOT NULL** (CHECK) | sample-3 mislink evidence — a resolution must carry evidence |
| `confirmed_by_human` | NOT NULL DEFAULT 0, CHECK (0,1) | unconfirmed by default; BDL human-revision precedent |
| `extraction_method` | NOT NULL, closed set `('explicit_heading','bullet','one_line','prose','title','link')` | confidence dimension 1: page-layout form |
| `extracted_by` | NOT NULL, open vocabulary (`human` precedent) | confidence dimension 2: extractor identity; deliberately not closed |
| `observed_at` / `processor_version` / `content_hash` | evidence columns, aligned with the products write-face closed set; `content_hash` nullable (honestly absent when carried across observations) | 030 §2 |

**Two confidence dimensions, two columns, never merged**: `extraction_method`
(WHICH page layout) and `extracted_by` (WHO extracted) are orthogonal
dimensions in separate columns. The data seat's inline reminder on 030 is
adopted verbatim: do not reuse the `term_observations.extracted_by` word face
to carry layout form (vector P8 pins the two-independence; N7 pins that an
identity word like `manual` is not a layout form).

**dep_kind granularity — FROZEN (four values)**: the draft's open item is
ruled. `dep_kind` is the DEPENDENT-THING type, single choice, four values
`'shader' | 'tool_package' | 'avatar_base' | 'other'`; there is no
`unity_or_sdk_version` member; EVERY version constraint rides `version_hint`;
an engine/SDK pin (`- Unity 2022.3.22f1`, sample 3) lands as
`dep_kind='other'` + `version_hint='2022.3.22f1'` (vector P7; its rejection is
pinned by N1).

**No-information-loss argument (frozen with the ruling)**: the five-value
draft put two orthogonal dimensions into one single-choice field — WHAT is
depended upon (thing type) and WHAT constraint attaches (a version). The
single-choice set already forces the sample-1 row (「liltoon＋2.3.2~」: a
shader pin WITH a version) to pick `shader` and carry the version in
`version_hint` anyway. Conversely, a bare engine pin keeps every surveyed byte
under four values: the thing type in `dep_kind='other'` (the depended-upon
thing is the runtime/tool itself), the name as written in `dep_name='Unity'`,
the verbatim line in `raw_quote`, the version string as written in
`version_hint`. Nothing queryable is lost: thing type by `dep_kind`,
constraint by `version_hint`, evidence by `raw_quote`/`source_span`/
`extraction_method`. What is no longer expressible is only the redundant
stored tag "this row's constraint is a version constraint" — derivable at
read time from `version_hint IS NOT NULL`, a read-time derivation (the
`availabilityRaw→availabilityStatus` precedent), never a stored fact. The
narrowing also keeps the closed set single-grained: a mixed-grain field would
push every future member (any new thing type vs. any new constraint kind)
into the wrong dimension.

**Resolution and evidence (resolution_evidence shape, frozen)**: the shape is
a JSON array with a closed element set:

```json
[{"linkText": "<string>", "linkUrl": "<string>", "span": "<source_span member>",
  "note": "<string|null>"}]
```

- Exactly one store-level hard law: `resolved_ref_product_id` NOT NULL ⇒
  `resolution_evidence` NOT NULL (evidence must accompany resolution; CHECK;
  vector N4).
- A resolution with `confirmed_by_human=0` (the default) is a CLUE, not a
  conclusion: read-side derivation law — unconfirmed resolutions never enter
  suggestion output; the rule table is versioned (the
  `availabilityRaw→availabilityStatus` precedent), and its body belongs to the
  consumption face (data seat).
- Under the sample-3 mislink evidence, identity resolution (title/shop
  reconciliation) waits for human confirmation by default; confirmation is an
  explicit, recorded write action (flip `confirmed_by_human` to 1; vector
  P4), never automatic.

## Observation-paradigm red lines (inherited)

- No semantic-rewritten dependency-graph assertions; no inferred package-name
  equivalences stored as facts; interpretation is always read-time derivation
  plus a versioned rule table.
- Low-confidence observations stay in the library and surface no suggestion;
  reverse-lookup output is always an EVIDENCED SUGGESTION, never a fact claim
  (030 §3 honesty boundary).
- The empty state is the final state: no placeholder fabrication; refusals and
  pages gone private land honestly (tombstone semantics, v0.1 products
  precedent).
- The public-surface coverage gap stands: paid package contents (README /
  manifests) are not in the public cataloging source (030 §4/§5.5);
  "own-file observation" needs a separate decision and is NOT started here.

## Positive/negative vectors (FROZEN: `schemas/bdl/v0.2/vectors/`)

**Frozen form**: one JSON file per registered vector, seventeen files (nine
accept + eight reject). The file name IS the vector name —
`<face>.<valid|invalid>.<id>.<slug>.json` — and carries the fields:
`vector` (P1–P9 / N1–N8), `name` (the file stem), `basis` (the law or the 030
§1 survey sample cited), `expect` (`accept` | `reject`), `reject_law` (reject
vectors only), `cases` (array of `{table, values}`; one INSERT per case,
`values` holding string/int/null only). The form follows the production
seat's amf-production v0.2 `vectors/` precedent (same freeze-triad
discipline, same owning seat); the data seat was pinged in the 030 inline
thread this batch — the downstream `dependencies.*` work can machine-read the
closed sets from these files — and a form objection arriving after this
freeze rides the errata batch.

Positive vectors (accepted; wording from the 030 §1 survey archetypes):

| # | File | Pins |
| --- | --- | --- |
| P1 | `dependency-observations.valid.p01.explicit-heading-version-pin.json` | explicit heading + version-pinned line (sample 1); `extraction_method='explicit_heading'` |
| P2 | `dependency-observations.valid.p02.one-line-declaration.json` | one-line declaration `Shader: Liltoon` (sample 2); `one_line` |
| P3 | `dependency-observations.valid.p03.title-carried.json` | title-carried declaration (sample 5); `source_span='title'`, `extraction_method='title'` |
| P4 | `dependency-observations.valid.p04.confirmed-resolution-with-evidence.json` | resolved ref + non-empty evidence array + `confirmed_by_human=1` |
| P5 | `dependency-observations.valid.p05.prose-declaration.json` | prose (sample 5); `prose` |
| P6 | `dependency-observations.valid.p06.bullet-line.json` | bullet (sample 6); `bullet`; no version string ⇒ `version_hint` NULL (honest absence) |
| P7 | `dependency-observations.valid.p07.engine-pin-as-other.json` | engine pin (sample 3) as `dep_kind='other'` + `version_hint` |
| P8 | `dependency-observations.valid.p08.confidence-two-dimensions.json` | `extraction_method` and `extracted_by` independent in one row |
| P9 | `compatibility-observations.valid.p09.new-spans-no-swing.json` | compat table: `title`/`description_link` accepted AND the old three still accepted |

Negative vectors (rejected):

| # | File | Law |
| --- | --- | --- |
| N1 | `dependency-observations.invalid.n01.dep-kind-foreign.json` | `dep_kind` foreign: `unity_or_sdk_version` (the five-value draft member — rejection pins the freeze ruling), `engine`, empty string |
| N2 | `dependency-observations.invalid.n02.source-span-foreign-both-tables.json` | `source_span` foreign `heading` on BOTH tables |
| N3 | `dependency-observations.invalid.n03.raw-quote-null.json` | `raw_quote` NOT NULL |
| N4 | `dependency-observations.invalid.n04.resolution-without-evidence.json` | resolved ref without evidence (CHECK hard law) |
| N5 | `dependency-observations.invalid.n05.dangling-resolved-reference.json` | dangling resolved ref / dangling owning product (FK) |
| N6 | `dependency-observations.invalid.n06.confirmed-flag-strict-zero-one.json` | `confirmed_by_human` strict 0/1 |
| N7 | `dependency-observations.invalid.n07.extraction-method-foreign.json` | `extraction_method` foreign (`manual` — an identity word, not a layout form) |
| N8 | `dependency-observations.invalid.n08.not-null-laws.json` | `dep_name` / `extraction_method` / `extracted_by` NOT NULL |

## Migration and version discipline

- `bdl_meta.format_version`: `'0.1'`→`'0.2'` (UPDATE inside the migration
  file); `user_version` 1→2 is set by the host migrator after the batch
  commits (v0.1 host precedent).
- v0.1 row preservation is a precondition of migration success; any loss is a
  migration failure.
- When the NEXT slice lands the store, the `bdl-store` migration registry
  advances and opening newer formats keeps the existing `UnsupportedFormat`
  discipline — this freeze batch touched no store code.

## Consumer test (freeze-batch facts)

`crates/bdl-store/tests/dependency_observations_schema_v02.rs` 4/4 green
(2026-09-22, cargo run in this tree): migration preservation / vector-set
direction (17 files = 9 accept + 8 reject; file-name convention pinned; N1
pins `unity_or_sdk_version` rejected) / every vector case driven (accepts
insert, rejects violate; omitted `confirmed_by_human` defaults to 0; P4's
evidence array carries the frozen element keys) / authority-vs-chain shape
equality. The same batch ran the full bdl-store crate: 60 cases green,
clippy all-targets zero warnings. **This test consumes the frozen schema and
vector files, not store behavior; store v0.2 behavior acceptance belongs to
the next slice. Zero end-to-end claims.**

## Open items (honest list)

1. **Public-surface coverage gap** (030 §5.5) and **U18 final-ruling
   linkage** (030 §5.6) stay open, out of scope here.
2. The consumption face (bdl-queries `dependencies.*`) is claimed by the data
   seat itself; this document does not ghost-write it.
3. The store landing (migration registry v0.1→v0.2, write/read faces) is the
   next slice and carries its own acceptance.
