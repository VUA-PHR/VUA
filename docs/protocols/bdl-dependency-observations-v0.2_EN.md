# BDL Persistent Format v0.2 (Product Dependency Observations) — Protocol Draft

[English](bdl-dependency-observations-v0.2_EN.md) | [简体中文](bdl-dependency-observations-v0.2_ZH.md)

> Document version: 0.2 (draft)
> Status: **DRAFT, freeze pending** (2026-09-22, drafted by wt-4 production,
> batch 164) — this is the schema-design ring product after the
> collab/proposals/030 (BOARD #46) seat ruling and before the freeze slice.
> **NOT frozen**: the freeze slice must pass freeze acceptance with the
> "Schema + positive/negative vectors + at least one consumer test" triad;
> this document and its machine-readable face remain revisable until then.
> Zero end-to-end claims — no implementation or verification claim of any
> runtime, extraction, or consumption capability is made here.
> Machine-readable face (draft): `schemas/bdl/v0.2/schema.sql` (full readable
> authority, standalone-executable) + `schemas/bdl/v0.2/002_dependency_
> observations.sql` (v0.1→v0.2 incremental migration; STRICT +
> bdl_meta.format_version + user_version discipline)
> Consumer test (draft batch): `crates/bdl-store/tests/dependency_observations_schema_v02.rs`
> (5 cases, vector consumption, zero bdl-store code changes; the store itself
> still runs format v0.1 — the v0.2 store landing belongs to the freeze slice)
> Ownership: 030 §5.1 ruling (2026-09-21 operator decision, recorded by
> Integration batch 163) = production seat owns the build; the data seat holds
> the consumption/query face downstream (the dependencies.* query family,
> 030 §5.7 case A). Drafted by production (wt-4).
> Upstream basis: proposal 030 §1 survey (2026-09-21, 9 read-only public-page
> accesses) + the data seat's inline stance on 030 (2026-09-22)

## Scope

This protocol (when frozen) freezes **BDL persistent format v0.2**:

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
  being rejected.

### 2. dependency_observations (new table)

One **declared dependency** per row, under the same observation paradigm as
`term_observations` / `compatibility_observations`: **verbatim evidence, zero
semantic rewriting, zero derived assertions**. Survey reality (030 §1):
dependency information lives only in author free text (headings,
version-pinned lines, one-line declarations, bullets, prose) — structured
BOOTH fields carry none of it — so every extraction lands as an EVIDENCED
OBSERVATION, never as a fact claim.

**Column law (draft; the freeze batch confirms or amends)**:

| Column | Law | Basis |
| --- | --- | --- |
| `dep_kind` | NOT NULL, draft closed set `('shader','tool_package','avatar_base','other')` | see "dep_kind granularity" below |
| `dep_name` | NOT NULL, the dependency's name AS WRITTEN (`lilToon`); no normalization, no equivalence guessing | the reverse-lookup search column; name→package identity is the hard problem and the library does not fabricate it |
| `raw_quote` | **NOT NULL**, verbatim quote, zero semantic rewriting | compatibility_observations `raw_quote TEXT NOT NULL` precedent (001_initial.sql:69; spike schema.sql:64 comment "verbatim quote, no semantic rewriting") |
| `source_span` | NOT NULL, same five-value closed set as the compat table v0.2 | same observation paradigm |
| `version_hint` | nullable, the version string AS WRITTEN (`2.3.2~`); no normalization | 030 §2 |
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
to carry layout form.

**dep_kind granularity (freeze-batch pending item A)**: the data seat noted
inline that among the 030 §2 draft five values, `unity_or_sdk_version` has a
different granularity (a version constraint, where the others are
dependent-thing types), while one declaration can carry both (sample 1
「liltoon＋2.3.2~」). **This draft proposes**: dep_kind narrows to the
dependent-thing type (four values, no `unity_or_sdk_version`), with version
constraints carried exclusively by `version_hint`; engine/SDK pins
(`- Unity 2022.3.22f1`) land as `dep_kind='other'` + `version_hint`.
**Alternative** (keep the five values) stays open for the freeze batch; if it
amends the set, this document and the vectors follow. The negative vector
`unity_or_sdk_version` pins the current draft direction and is marked as
contested during the draft period — the freeze batch must rule.

**Resolution and evidence (resolution_evidence shape — the mandatory
freeze-batch item, now filled)**: the shape is a JSON array with a closed
element set:

```json
[{"linkText": "<string>", "linkUrl": "<string>", "span": "<source_span member>",
  "note": "<string|null>"}]
```

- Exactly one store-level hard law: `resolved_ref_product_id` NOT NULL ⇒
  `resolution_evidence` NOT NULL (evidence must accompany resolution; CHECK).
- A resolution with `confirmed_by_human=0` (the default) is a CLUE, not a
  conclusion: read-side derivation law — unconfirmed resolutions never enter
  suggestion output; the rule table is versioned (the
  `availabilityRaw→availabilityStatus` precedent), and its body belongs to the
  consumption face (data seat).
- Under the sample-3 mislink evidence, identity resolution (title/shop
  reconciliation) waits for human confirmation by default; confirmation is an
  explicit, recorded write action (flip `confirmed_by_human` to 1), never
  automatic.

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

## Positive/negative vector direction (the freeze batch lands vector files along these lines)

Positive vectors (accepted; wording from the 030 §1 survey archetypes, same
shapes embedded in the test):

- P1 explicit heading + version-pinned line: `dep_kind='shader'`,
  `dep_name='liltoon'`, `raw_quote='・liltoon 2.3.2~'`,
  `version_hint='2.3.2~'`, `extraction_method='explicit_heading'` (sample 1).
- P2 one-line declaration: `raw_quote='Shader: Liltoon'`,
  `extraction_method='one_line'` (sample 2).
- P3 title-carried: `source_span='title'`, `extraction_method='title'`
  (sample 5 title suffix【liltoon】).
- P4 confirmed resolution: `resolved_ref_product_id` set + non-empty
  `resolution_evidence` array + `confirmed_by_human=1`.
- P5 prose: `extraction_method='prose'` (sample 5).
- P6 bullet: `extraction_method='bullet'` (sample 6「●最新verのliltoonを
  使用してください。」).
- P7 engine pin as other: `dep_kind='other'` + `version_hint='2022.3.22f1'`.
- P8 two dimensions independent: `extraction_method='prose'` alongside
  `extracted_by='pipeline:dep-0.1'` in one row.
- P9 compat-table new spans: `source_span='title'` / `'description_link'`
  rows accepted; the old three values do not swing.

Negative vectors (rejected):

- N1 `dep_kind` foreign words: `'unity_or_sdk_version'` (pins the current
  draft direction), `'engine'`, empty string.
- N2 `source_span` foreign word: `'heading'` (both tables).
- N3 `raw_quote` NULL (NOT NULL law).
- N4 `resolved_ref_product_id` set while `resolution_evidence` NULL (evidence
  hard law).
- N5 dangling `resolved_ref_product_id` (FK, no such product).
- N6 `confirmed_by_human=2` (strict 0/1).
- N7 `extraction_method` foreign word: `'manual'`.
- N8 `dep_name` / `extraction_method` / `extracted_by` NULL (NOT NULL laws).

The vector file form (JSON example sets per the bdl-queries examples/
convention, or test-embedded — placed by the freeze slice) converges at the
freeze batch with the data seat's stance on form.

## Migration and version discipline

- `bdl_meta.format_version`: `'0.1'`→`'0.2'` (UPDATE inside the migration
  file); `user_version` 1→2 is set by the host migrator after the batch
  commits (v0.1 host precedent).
- v0.1 row preservation is a precondition of migration success; any loss is a
  migration failure.
- When the freeze slice lands the store, the `bdl-store` migration registry
  advances and opening newer formats keeps the existing `UnsupportedFormat`
  discipline — this draft batch touches no store code (no store landing).

## Consumer test (draft-batch facts)

`crates/bdl-store/tests/dependency_observations_schema_v02.rs` 5/5 green
(2026-09-22, cargo run in this tree; migration preservation / expansion
positive+negative / new-table positive+negative / authority-vs-chain shape
equality). The same batch ran the full bdl-store crate: 61 cases green,
clippy all-targets clean. **This test consumes the draft schema files, not
store behavior; store v0.2 behavior acceptance belongs to the freeze slice.
Zero end-to-end claims.**

## Open items (honest list)

1. **dep_kind granularity** (pending item A above): narrowed four values vs
   five values — the freeze batch must rule.
2. **Vector file form**: JSON example sets vs test-embedded — converges at
   the freeze batch with the data seat.
3. **Public-surface coverage gap** (030 §5.5) and **U18 final-ruling
   linkage** (030 §5.6) stay open, out of scope here.
4. The consumption face (bdl-queries `dependencies.*`) is claimed by the data
   seat itself; this document does not ghost-write it.
