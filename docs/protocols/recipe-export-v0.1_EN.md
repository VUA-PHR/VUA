# recipe-export protocol v0.1 (Recipe export word-row: recipe.exportProjectDraft)

[English](recipe-export-v0.1_EN.md) | [简体中文](recipe-export-v0.1_ZH.md)

> Document version: 0.1.1
> Status: **FROZEN (proposal 029 B-face freeze loop 1, core batch,
> 2026-09-22; claimed after the desktop-side precondition landed — the
> wt-3 shape verdict merged into the 029 inline thread by integration
> batch 159; three rulings in "Core rulings") and WIRED (v0.1.1 core
> wiring loop 2, 2026-09-22): the `recipe.exportProjectDraft` route arm,
> the two envelope constants, the served row `recipe.exportProjectDraft`,
> and the port face (the core `ProjectDraftExportPort` trait) have
> landed — the export executor implementation belongs to loop 3; until
> its override flips the accessor, every wired answer stays on the honest
> absence arm (the port's defaulted `export_capabilities -> NONE`, the
> served row honestly unavailable).**
> Machine-readable word list: `schemas/recipe-export/v0.1/` (single-method
> schema + 5 positive + 8 negative vectors; core consumer test
> `crates/orchestrator/tests/recipe_export.rs`; wire route test
> `crates/provider-host/tests/recipe_export_wire_v01.rs` [real frame
> loop, 9 cases])
> Scope: `recipe.exportProjectDraft` (derive a **Recipe DRAFT** from one
> registered Unity project — the project→recipe reverse read-only
> derivation); the recipe-chain execution face stays in production-use-case
> v0.2 (zero touch)
> Ownership boundary: word-list freeze and wire routing = core domain;
> export executor implementation = core domain (reads the 013 inspection
> aggregate; zero new project-manager read faces); desktop consumption
> (recipe-page "import from project" entry + draft confirmation/completion
> flow) = desktop domain (the wt-3 shape verdict, 029 inline thread, is the
> consumption-shape input)
> Updated: 2026-09-22 (v0.1.1 wiring loop 2: the `recipe.exportProjectDraft`
> route arm + the two envelope constants
> `RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01`/`RECIPE_EXPORT_SCHEMA_VERSION_V01`
> + the served row `recipe.exportProjectDraft` + the port face
> `ProjectDraftExportPort` [declared-none default] + 9 wire tests riding the
> real frame loop; word face ZERO change. First updated 2026-09-22, v0.1
> freeze batch: bilingual protocol document + REGISTRY registration)

## B-face positioning (loop 1 of the 029 pipeline)

User ruling U16 (2026-09-21) companion feature: **export a Recipe (draft)
from an existing Unity project**. Honesty discipline first: **an export
never claims to recover design intent** — the facts actually on disk are
the dependency list, the editor version, and the project-identity note;
why a material was chosen (role/label semantics), where it came from
(source_ref), the assembly relations (relations/wardrobe_groups), and the
title semantics are not on disk. The export product is a **draft awaiting
explicit user confirmation and completion**, never a finished Recipe. Only
after the user confirms and completes it in the recipe-page draft
confirmation flow (desktop verdict shape: library selection = preview
subject, add-material = warehouse read-face projection picker, **the
single save chain recipe.save** — D5 dedup + busy guard + baseRevision
version chain) does it become an official Recipe; **a draft is never
silently promoted**. Zero end-to-end claims on this face; the real-machine
full chain (real project export → confirm → assemble → workshop status)
belongs to W25 (O-2).

## Freeze close-out (029 B-face loop 1 hard preconditions, item by item)

- **Desktop-side precondition**: the wt-3 shape verdict (029 inline
  thread, merged by integration batch 159 as 7aa3bbe5), sections ①②③ =
  the consumption-shape input — A4 selection fact-source action (chain
  identity keys {recipeId, revision} taken only from the recipe.get
  receipt document identity), A3 picker = read-face projection with no
  third import entry, A2/A1 single save chain with the same guard set.
  The A5 correction is adopted (see core ruling 4);
- **Schema + positive/negative vectors**: `schemas/recipe-export/v0.1/`
  (this batch, 5 positive + 8 negative);
- **At-least-one-end consumer test**:
  `crates/orchestrator/tests/recipe_export.rs` (6 cases: vector
  acceptance/rejection, word-row identity and closed-set introspection
  pins, typed serde dual-carrier negative rejection
  [deny_unknown_fields], packageId-ascending determinism pin, honesty
  marker iff pin); the wire frame-loop test landed with the v0.1.1
  wiring batch (`crates/provider-host/tests/recipe_export_wire_v01.rs`,
  9 cases);
- **Bilingual protocol document + REGISTRY**: this file + EN mirror + two
  REGISTRY rows (this batch).

## Core rulings (029 open items converged)

1. **Relation-face two-option ruling (029 open item 4 CLOSED) = option B:
   zero-bridge skeleton + user click-completion.** Five reasons:
   ①**Honesty law** — even a new read-only Bridge scan yields only
   "structure candidates" carrying no semantic roles, sources, or design
   intent; user confirmation is mandatory under both options, and option
   B creates no illusion of recovered structure — the missing list makes
   "not automatically exportable" a type-level fact;
   ②**Frozen-surface discipline** — Bridge v4 is frozen; a new read-only
   scan operation is a protocol-version decision (v4 addition or v5)
   touching the production-domain C# face and requiring its own freeze
   loop (vectors + dual-end contract tests + real machine); coupling the
   user-ruled export feature to a cross-domain protocol bump it does not
   require would be self-manufactured blocking;
   ③**The consumption shape already exists** — the desktop verdict's
   draft confirmation/completion flow (the A-face hub) IS the existing
   main path for click-completion; completion is not a degradation;
   ④**Asymmetric marginal value** — the scan option buys only
   avatar/outfit structure-candidate enumeration and cannot buy the two
   genuinely missing dimensions (design intent role/label, source_ref);
   ⑤**Upgradeable** — the closed missing list leaves option A a
   type-level path: a v0.2 that shrinks the list is a machine-detectable
   honest increment if a scan lands later.
   **Option A is REGISTERED, NOT IMPLEMENTED** (candidate = a
   unity-bridge read-only scene-structure discovery operation, touching
   the production-domain C# face; its own freeze loop after the W25
   real-machine walk-through ruling; zero protocol-bump action in this
   batch).
2. **Carrier ruling = a standalone export face (new family
   recipe-export/v0.1).** Code fact: the recipe v0.3 document face has
   `assets`/`instances` minItems 1 and asset rows under
   anyOf(entityRef|sourceRef) (`schemas/recipe/v0.3/recipe.schema.json`,
   read) — **an honest empty skeleton cannot exist as a Recipe document**:
   without fabricating entityRef/sourceRef it fails the schema, and
   fabricating them violates honesty rules 1–3. Extending recipe.save
   (accepting draft state) would change the frozen save-chain semantics
   and open a silent-promotion channel (forbidden); an in-document
   provenance block fails on the same minItems fact. A standalone face
   makes the draft/official boundary a **type-level fact**: the draft type
   has no path into resolve/assembly; the only promotion path is the
   user's explicit confirmation through the existing save chain.
3. **Use-case ruling = new word-row family + single method + synchronous
   read-only query.** Not into production-use-case: that family is the
   recipe-chain execution family (recipe-list/get/save/resolve,
   plan/job/record); the export is a project→recipe reverse read-only
   derivation, not the same shape; extending the family means a v0.3 bump
   of a frozen face for no reason. Synchronous query per the packages-ops
   preview precedent: a local-files read-only scan (zero Bridge, zero
   network, zero mutation), **no nine-state task** — cancellability and
   recovery faces are not invented for a pure read with nothing to
   recover. params closed set, single key `projectPath` (the 013
   registered identity); an unregistered path reuses
   `vua.project.project_not_found` (024 packages-query precedent: same
   fact, same code).
4. **The lexical correction is adopted**: the risk-decision-bearing
   confirm-plan is the amf-production **v0.2** method face with four keys
   {planId, observedRevision, riskChoice, rememberForSession} (riskChoice
   added at the v0.2 registration face; no v0.1 confirm-plan method
   schema exists; build-record v0.1 only persists the riskChoice value).
   **This face has NO risk decision and NO plan face**: draft
   confirmation/promotion goes through the recipe.save version chain and
   has zero intersection with plan approval or risk decisions; if the
   recipe-chain plan approval ever needs a risk decision, that is a
   production-use-case v0.2→v0.3 bump matter (its own freeze loop) — no
   field is reserved here.
5. **Non-VUA projects (029 open item 2 stays OPEN)**: this face carries
   the VUA-native identity tri-state (absent/present/unreadable)
   verbatim as an origin fact (the 013 aggregate's v0.2 additive
   finding); **absent is not a gate on this face**; whether an absent
   identity triggers a desktop difference prompt for registered manual
   VCC/ALCOM projects is a presentation ruling awaiting the user (029
   open item 2 remains open; this face is its fact source). Zero product
   boundary change: the export is a derived projection of the 013
   read-only inspection facts over registered projects — same world as
   the 013 inspection face.

## Method face

| Method | Kind | Semantics | Consumer |
| --- | --- | --- | --- |
| `recipe.exportProjectDraft` | Query (read-only, synchronous) | Export a Recipe project draft from one registered project: read the VPM manifest's declared dependencies and locked pins, the observed editor version, and the VUA-native identity tri-state through the 013 inspection aggregate, projected as the draft document | Recipe-page "import from project" + draft confirmation flow (desktop consumption batch after wiring/implementation) |

params closed set, single key: `projectPath` (`minLength 1`; the 013
registered identity, same family as `project.inspectProject`);
`additionalProperties: false` — out-of-vocabulary params answer a
`vua.recipe_export.invalid_params` validation error envelope (a shape
violation never masquerades as absence).

## Result document (Recipe project draft v0.1 closed set)

- Envelope per the standing command-face precedent: `schemaVersion`
  (const `"0.1"` = the word-list-row family version constant) +
  `operation` + `result`; the result body carries its own family const
  `vua.recipe-export/v0.1` — the two versions are independent (c914cf2
  standing rule);
- **The draft document's closed seven keys**: `schemaVersion` (family
  const), `draftId` (uuidv7 — the **draft instance identity** minted per
  export; **NOT a recipeId**: the Recipe identity is minted only by the
  save chain when the user explicitly confirms and saves), `exportedAt`
  (RFC 3339), `origin`, `environment`, `dependencies`, `missing`;
- `origin` closed three keys: `projectPath` (013 identity echo),
  `projectName` (the name as the inspection aggregate observed it,
  verbatim, nullable), `vuaIdentityStatus` (absent/present/unreadable).
  The project name is a source fact only — the draft has **no title
  field**; whether the confirmation flow prefills a title input from it
  is a desktop presentation decision;
- `environment`, single key: `unityVersionConstraint` — the observed
  editor version verbatim (no version migration, proposal 029 boundary
  2); **null = an honest absence when unreadable on disk**; no
  capabilities key (no producer fact in v0.1, ORC-DEV-004);
- `dependencies` row closed three keys: `packageId` (manifest key
  verbatim), `versionConstraint` (declaration verbatim, e.g. `3.7.x`),
  `lockedVersion` (the locked map's exact pin for the same id, absent
  when unpinned). **The mapping determinism is frozen**: the row set =
  the manifest's declared `dependencies`; rows sorted by `packageId`
  ascending (a frozen deterministic presentation fact consumers may rely
  on — packages-query precedent); locked-only entries (in locked but
  never declared) produce no rows (transitive resolution facts, not
  user-declared intents — see "Out of this face's vocabulary"); **an
  empty array is a valid, honest answer** (manifest absent or zero
  declared dependencies);
- **The `missing` list is the draft's honesty core**: a closed
  ten-value enum {assets, instances, relations, wardrobeGroups,
  targetAvatar, assetRoles, assetLabels, sourceRefs, titleSemantics,
  environmentUnityVersion}; the first nine are **constant members of
  every v0.1 draft** (the relation-face five = the zero-scan ruling of
  option B; the semantic four = design intent/sources/title semantics
  are never asserted by an export), each pinned present via `contains`;
  `environmentUnityVersion` is iff-bound to
  `unityVersionConstraint: null` (both implications pinned). The
  confirmation flow must render "project-exported draft + missing
  dimension list" from this list verbatim (029 B-face definition).

## Draft definition (honesty rules pinned by shape)

1. **Never claims to recover design intent** (honesty rule 1):
   roles/labels/title semantics/sources are always listed in missing; a
   draft carrying invented fields is INVALID by schema
   (additionalProperties:false as the false-assertion guard), never
   merely discouraged;
2. **A draft is never silently promoted** (isomorphic to honesty rule 3):
   no recipeId = no chain identity; the only promotion path is the
   recipe.save version chain after the user's explicit confirmation; the
   export action itself lands nothing in the recipe store;
3. **Missing sources are never disguised** (honesty rule 2): this face
   does not carry source_ref at all — source tracing for non-VUA-channel
   materials is out of this face's vocabulary (file-fingerprint identity
   comparison belongs to the material-identity domain, not the export
   face).

## Error-code closed set and absence semantics

| Code | Category | Semantics |
| --- | --- | --- |
| `vua.recipe_export.unavailable` | unavailable | Route/executor not wired = **honest absence** — never folded into a fabricated draft |
| `vua.recipe_export.invalid_params` | validation | params closed-set violations (a shape violation never masquerades as absence) |
| `vua.project.project_not_found` | validation | projectPath not on the 013 aggregate registration face (**reuses the 013 code**: same fact, same code; judged with the same semantics as `project.inspectProject`) |

Failed observations carry no error code: an absent manifest = an honest
empty `dependencies` array; an unreadable editor version =
`unityVersionConstraint: null` plus environmentUnityVersion in missing —
presented honestly, never padded into a fake read success, and never
misreported as a failure when an honest empty state exists (honesty rules
1/2).

## Capability row and wire routing (landed with the v0.1.1 wiring loop 2)

- **Named constants** (published from `vua_provider_host::provider_host`;
  consumers key on the core-owned constants, never private literals): the
  envelope constant `RECIPE_EXPORT_ENVELOPE_SCHEMA_VERSION_V01` = `"0.1"`
  and the family constant `RECIPE_EXPORT_SCHEMA_VERSION_V01` =
  `vua.recipe-export/v0.1` — the two versions are independent (c914cf2
  standing rule); the word face is ZERO byte change, the constants lock
  exactly the strings the frozen schemas carry;
- **Route arm order** (the packages.packageCatalog isomorph): (1) absent
  export-port wiring (no use-case services or no `draft_exporter`)
  answers the family's OWN honest-absence code
  `vua.recipe_export.unavailable` — the router dispatches this face
  BEFORE the document-face fold inside the recipe.* branch, so the
  absence never masquerades as `vua.recipe.unavailable`; (2) the closed
  single-key params shape verdict precedes the gate (extra key / missing
  key / empty value / non-string / non-object =
  `vua.recipe_export.invalid_params`, a pure shape verdict, never a
  default); (3) the registration calibration rides the SAME 013
  inspection aggregate `project.inspectProject` uses (same fact, same
  code `vua.project.project_not_found` — the 024 packages-query reuse
  ruling; an off-aggregate path never reaches the port; absent
  project-ops wiring means the calibration face does not exist, so the
  whole face stays honestly absent); (4) the capability gate reads the
  NEW defaulted port accessor `export_capabilities` (default
  declared-none — the F5 `template_capabilities` accessor law;
  ORC-DEV-004) BEFORE the port call, answering the same honest-absence
  code; (5) the port's typed refusals travel VERBATIM (the read-face
  pass-through discipline — no read-face fold exists), and an OK
  projection = the port's `ProjectDraftDocumentV01` facts through serde
  stamped with the family const at envelope assembly (the P1 discipline:
  the route stamps the consts, the port facts stay verbatim — the
  packageId-ascending order and the missing closed set are PRODUCER
  contracts of the frozen word face, pinned by the wire tests, never
  route rewrites);
- **The served row** `recipe.exportProjectDraft` (the one-row-one-method
  precedent): availability = the use-case wiring AND the port's
  `export_capabilities`.`export_project_draft` bit — the declared-none
  default keeps the row honestly unavailable until the loop-3 export
  executor implementation slice flips it with the real adapter's
  override;
- **Port face**: the core `ProjectDraftExportPort` trait (orchestrator
  domain, `crates/orchestrator/src/recipe_export.rs`) = the frozen
  cross-domain contract: the defaulted accessor answers declared-none,
  and the `export_project_draft` default body answers the family's
  absence code (a declared-but-unimplemented port CAN exist at the type
  level — the F5 structural law; the route gate answers first), and the
  synchronous read-only signature returns the draft document directly
  (zero nine-state tasks);
- **Wire tests**:
  `crates/provider-host/tests/recipe_export_wire_v01.rs`, 9 cases riding
  the real frame loop (absent wiring = the typed honest absence + the row
  unavailable / the wired declared port answers at the frozen word face
  [real schema validation + the seven-key closed set + packageId
  ascending + lockedVersion absent-not-null + the nine constant
  dimensions] / the trait-default declared-none port = the absence arm
  first [the port body panics if ever reached] + the row honestly
  unavailable / an off-aggregate path = the reused not_found before the
  port / an absent calibration face = the honest absence / port refusals
  travel verbatim / honest empty dependencies + unreadable version = a
  SUCCESS carrying the environmentUnityVersion marker [the iff enforced
  by the real validator] / params violations before the gate / the two
  envelope constants detectable and pinned against the frozen schema
  consts).

## Dependency direction

```text
React View (recipe-page "import from project" + draft confirmation flow, desktop consumption batch)
  -> typed feature/Gateway (recipe-export word-row projection)
  -> Electron preload and main-process adapter
  -> versioned application contract (recipe.exportProjectDraft word-row)
  -> provider-host routing (core domain, wiring batch)
  -> export executor (core domain use case, reads the 013 inspection aggregate — zero new project-manager read faces)
  -> promotion after confirmation/completion = the existing recipe.save version chain (zero second save chain)
```

## Machine-readable word list

`schemas/recipe-export/v0.1/`: `command.schema.json` +
`result.schema.json` + `examples/` (5 positives — the closed single-key
request / the full draft [VUA-native + two declared dependencies with one
locked pin + readable version] / a non-VUA project [identity absent +
projectName null] / unreadable version [constraint null + ten-value
missing] / honest empty dependencies; 8 negatives — an out-of-vocabulary
params key / an empty projectPath / an invented `optional` field on a
dependency row [the false-assertion guard pinned] / missing lacking a
constant dimension / missing carrying an out-of-vocabulary dimension /
null without the marker [iff arm one] / marker without null [iff arm
two] / a draft carrying the relation face + recipeId + title [the type
boundary pinned]). Consumer test:
`crates/orchestrator/tests/recipe_export.rs` (6 cases) + the wire route
test `crates/provider-host/tests/recipe_export_wire_v01.rs` (9 cases,
real frame loop). Any word-list or
field change must bump the version; in-place rewrites are forbidden.

## Out of this face's vocabulary

- **Locked-only dependencies** produce no rows (transitive resolution
  facts; presenting them belongs to the inspection read path, not this
  word list);
- **The read-only Bridge scan (option A)** is not chartered or scheduled —
  registered candidate = a unity-bridge read-only scene-structure
  discovery operation, touching the production-domain C# face and a
  protocol-version decision; its own freeze loop after the W25
  real-machine walk-through; zero protocol-bump action in this batch;
- **Non-VUA project difference prompting** (029 open item 2) = a
  presentation ruling awaiting the user; this face carries only the
  tri-state fact;
- **capabilities / performance target / asset list / instances /
  relations / wardrobe groups / title / recipeId / locked block /
  extensions** all have no producer fact or are deliberately not faced
  (ORC-DEV-004: no implementation, no reserved field);
- **Multi-project batch export, export history, draft persistence**
  (pre-confirmation draft residency belongs to the desktop confirmation
  flow's state, its implementation decision) are all out.

## Open items

- ~~Wire routing + capability row + port face (core wiring slice)~~:
  landed with the v0.1.1 wiring loop 2 (2026-09-22);
- Export executor implementation (core domain, reads the 013 inspection
  aggregate; 029 B-face loop 3) — overrides `export_capabilities` and
  flips the served row; until then every wired answer stays on the
  honest absence arm;
- Desktop consumption batch (recipe-page "import from project" entry +
  draft confirmation/completion flow consuming the A-face hub shape;
  029 B-face loop 4) after its shape verdict;
- Non-VUA project applicability presentation (029 open item 2): awaiting
  the user;
- Option A (read-only Bridge scan) candidate registration: its own freeze
  loop after the W25 real-machine walk-through;
- The real-machine full chain (real project export → confirm → assemble
  → workshop status) belongs to W25 (O-2). End-to-end claims stay at
  zero — this batch promises zero runtime behavior change until the
  implementation slice's acceptance.
