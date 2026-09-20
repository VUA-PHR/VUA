# packages-templates Protocol Document v0.1 (the packages.listTemplates read face: available template entries)

> Document version: 0.1.1
> Status: **FROZEN (proposal 027 F5 core freeze batch, 2026-09-20) and WIRED
> (the v0.1.1 core wiring batch, 2026-09-20): the `packages.listTemplates`
> route, the named envelope consts and the served row `packages.templatesOps`
> have landed — the library implementation belongs to the environment
> implementation-verification slice; desktop consumption follows the per-face
> program after shape approval; until then every wired backend stays on the
> honest absence arm (the trait default `template_capabilities -> NONE`, the
> served row honestly unavailable).**
> (Freeze provenance: proposal 027 F5 freeze batch — the U14 ruling (3)
> founding authority, the 027 core stance 5 three-domain convergence, the face
> order F2->F3->F5 registered by batches 121-130.)
> Authoritative pair: this file and `packages-templates-v0.1_ZH.md` (one
> semantics, bilingual mirror).
> Word-face authority: `schemas/packages-templates/v0.1/` (command + result
> schemas and the positive/negative example vectors). This document explains;
> the schemas bind.
> Core consumer tests: `crates/provider-host/tests/packages_templates_consumer_v01.rs`;
> wire route tests `crates/provider-host/tests/packages_templates_wire_v01.rs`
> [real frame loop].
> Updated: 2026-09-20 (the v0.1.1 wiring batch: the `packages.listTemplates`
> route arm + the named envelope consts `PACKAGES_TEMPLATES_ENVELOPE_SCHEMA_
> VERSION_V01`/`PACKAGES_TEMPLATES_SCHEMA_VERSION_V01` + the served row
> `packages.templatesOps` + wire tests 7 cases riding the real frame loop;
> word face ZERO change).

## What this face is

`packages.listTemplates` answers one question: **which templates are available
for project creation?** One row per template (machine identity + display
projection); one method, zero parameters, zero pagination, zero filtering.

Founding authority and family partition:

- U14 ruling (3) "agree the template-enumeration wire face" + the 027 core
  stance 5 (three-domain convergence: environment verification supports with
  zero divergence, desktop IA stance takes the F5 frozen word face as
  authoritative) = this family's founding basis. New read family
  `packages-templates` (schema row `schemas/packages-templates/v0.1/`), wire
  prefix stays `packages.*` and never splits into `templates.*` (the 026
  stance-2 law: a split prefix would fragment capability discovery); the
  family-name/prefix/code-family triple alignment (packages-templates family /
  `packages.*` prefix / `vua.packages.*` code family) is isomorphic with the
  standing families.
- Read/write separation (the 014 arbitration point-1 precedent):
  `createProject` lives in the packages-ops write family (026 A5); template
  enumeration is a pure read face and does NOT join ops (the family's
  all-tasks write shape has no pure-read precedent). The creation capability
  declaration remains `capabilities().create_project` (the 026 A5 five-bit
  closed-set member); this family's capability declaration is independent
  (see the capability-gating section).

## The enumeration-shape ruling (registered with this freeze batch — the operator-note declared ruling)

The environment verification (027 proposal s4) established: **vrc-get-vpm
0.0.16 ships NO template enumeration/listing API** (the repo-wide grep hits
exactly one resolve.rs comment; the lib.rs public export surface carries no
template types). Two candidate paths were on the table:

1. **Directory-scan enumeration** (this freeze batch's ruling): the
   enumeration IS a directory-entry scan over the two pinned directory roots —
   `<environment_root>/VRCTemplates` first, then `<environment_root>/Templates`,
   same roots and same order as `create_from_template`'s resolution (the 026
   A5 implementation cross-check direct-read anchor: project-manager
   `create_from_template`, explicit path -> VRCTemplates -> Templates).
2. Listing the face as a non-goal (not frozen in v0.1; wait for an upstream
   library enumeration API).

**Ruling: path 1, for five reasons.** (i) The founding authority stands — the
U14 ruling (3) and the 027 stance-5 three-domain convergence are not voided by
the library's missing API; (ii) the fact source is pinned — the two directory
roots are an existing frozen implementation fact of `create_from_template`,
VUA's self-implemented template creation has already landed, and the
enumeration face sharing those roots IS the same fact source; (iii) word-face
symmetry — "can create but cannot enumerate" leaves the 026 A5 consumer "no
invented enumeration" blank spot idle, and the desktop new-project template
dropdown (the formal fill of the 026 A5 stance) needs the enumeration face;
(iv) the no-invention discipline holds — the directory name IS the id (a
fact), no metadata producer means no metadata field (see the field-ceiling
ruling), a missing directory IS the honest empty state (never an error, the
R4 precedent); (v) path 2 would regress the converged face order (F3->F5->F4,
registered by integration batches 121/130) and keep the blank spot idle — a
bar-lowering of an already-converged ruling.

**Three boundaries pinned with the ruling.** First, the **explicit-path leg**
of create's three-candidate resolution is a per-create argument shape (the
`template` argument may be a path), NOT a directory root, and has no reach on
this face — the enumeration world is the library-path default-resolution leg's
two directory roots. Second, **duplicate-name deduplication**: a directory name
present under both roots enumerates EXACTLY ONCE, resolved to the root the
creation resolution order would pick (VRCTemplates first) — the enumeration
never diverges from what create would actually copy (every enumerated id handed
to `createProject` necessarily resolves to the template as enumerated);
skipping the dedup would create a "two same-name ids enumerated, create
resolves only one" word-face drift. Third, **zero-network face**: a directory
scan carries no cache-degradation semantics, so this face has NO
`cacheSourced` field — a constant informational field is not a fact (the
packages-repos v0.1 law).

## Word list (machine-readable)

- Method: `packages.listTemplates` (kind `query`).
- Envelope: `schemaVersion` const `"0.1"`; result family const
  `vua.packages-templates/v0.1` (two independent versions — the c914cf2
  standing rule).
- **Wire consts (named at this v0.1.1 wiring batch, the A3/A4/A5/F2/F3
  precedent — closing the desktop checkpoint ahead of time)**: the envelope
  const `PACKAGES_TEMPLATES_ENVELOPE_SCHEMA_VERSION_V01 = "0.1"` and the
  result family const `PACKAGES_TEMPLATES_SCHEMA_VERSION_V01 =
  "vua.packages-templates/v0.1"` are published from
  `vua_provider_host::provider_host` — consumers key on the core-owned
  constants, never private literals; the route stamps both consts onto the
  response at envelope assembly (the envelope `schemaVersion` + the result
  document's `schemaVersion`), never the backend, never literals. The
  word-list bytes are unchanged — the constants lock exactly the same strings
  this frozen schema carries (the c914cf2 rule: every wire row carries a
  version constant of its own, the envelope version independent of the family
  version).
- params: **closed empty set** (the `packages.listRepos` zero-parameter
  precedent) — the template face is environment-level configuration, not
  per-project; any key is a `vua.packages.invalid_params` shape violation,
  never a default.
- result (family `vua.packages-templates/v0.1`):
  - `templates[]` — **id-ascending** (the frozen presentation fact; a raw
    directory scan order is platform-unstable, the presentation fact keeps
    desktop dropdown consumption deterministic — the F3 packageId-ascending
    precedent). Each row: `id`, `name`.
- An empty `templates` array is a valid, honest answer: a missing root or an
  empty pair of roots is a fact, never an error (the R4 precedent).

## Field semantics (frozen rulings)

- `id` — the template directory name: the machine identity handed to
  `packages.createProject`'s `template` argument.
- `name` — the frozen **same-value display projection** of `id`: v0.1 has no
  independent display-name fact source, the projection states the identity
  verbatim, putting the display semantics into the word face and barring
  consumers from fabricating a friendlier label. The same-value lock is a
  producer contract pinned by the core consumer tests (JSON Schema draft-07
  cannot express it across keys); a producer implementation never carries a
  row with `name != id`.
- **`description` and every metadata field deliberately absent** — see the
  next section's ruling.
- **`sourceRoot` deliberately absent** — which root serves an id is create's
  frozen resolution order (not a per-row fact); consumers invoke the creation
  face machine-readably with zero root knowledge.

## Field-ceiling ruling (registered with this freeze batch)

The environment verification (027 proposal s4, closing note) established:
template metadata (display name/description) has **zero library-face support**
— whether a `package.json` exists inside a template directory and its shape
are unverified (the VCC template spec file is not on this machine; a W25
real-machine read-only item). Two candidate shapes were on the table:

1. Rows carry `description: string | null` (required nullable — the literal
   "metadata honestly null" shape);
2. Metadata fields **absent entirely** (the v0.1 row = exactly `id` + `name`).

**This freeze batch rules shape 2** (the P1 displayName precedent + the F2
author precedent law): v0.1 has NO description producer (the template
metadata-file shape is unverified), and a required-null field is a constant
null occupying a wire key — a constant is not a fact (the F2 compatible law);
ORC-DEV-004: no implementation, no reservation. A row carrying `description`
(or `author`, `license`, `sourceRoot`, `version`, or any invented fact) is
INVALID by schema — the negative vectors pin it: a false-assertion guard, not
a convention. Once the W25 real-machine verification establishes template
metadata facts, metadata fields go through a v0.2 row-directory increment —
never an in-place revision of this frozen v0.1.

Why the `name` same-value projection stays while description does not: the
directory name itself IS a fact, and the `name` key freezes that fact's display
aspect into the word face — it makes "display name = directory name" a
word-face-declared frozen fact rather than a consumer-side by-convention
substitution (the P1 ruling-3 packageId substitution is a consumer convention;
this face, on the environment-verification s4 predicted direction "directory
name = template id and name same value", settles that semantics INTO the word
face, and when a real display-name fact emerges the `name` key position stays
stable for the version bump with zero consumer word-face migration).

## Error codes (zero new codes — the 027 stance-item-6 F5 direction held)

- Unreachable template roots / both roots missing: the **honest empty state**
  (an empty `templates` array) — never an error, never an exception; the 027
  stance-6 predicted direction settled as ruled (the R4 precedent); zero new
  error codes.
- Envelope face (the standing closed set unchanged): capability absence
  answers the generic `vua.vpm.capability_missing` BEFORE the call; parameter
  shape violations answer `vua.packages.invalid_params`; unwired answers
  `vua.packages.unavailable`; backend typed refusals pass through verbatim
  (code + messageKey + category).
- Read-only by design: project creation is the packages-ops `createProject`
  (026 A5) write face and does not belong to this family; this face never
  carries a create/preview/write method.

## Capability gating (named and routed, landed at the v0.1.1 wiring batch)

New defaulted accessor `VpmBackend::template_capabilities() ->
TemplateCapabilities` (one bit `list_templates`), the 025 accessor law
(ORC-DEV-004: default declared-none; a backend overrides it exactly when it
implements `list_templates`). The environment VrcGetLib override lands with
its implementation-verification slice (a self-implemented two-root directory
scan, same roots and order as `create_from_template`); the CLI backend has no
directory-root scan face and stays honestly false.

Wiring facts (landed at this batch):

- **Served row `packages.templatesOps`** (the A3/A4/A5/F2 one-row-one-method
  precedent — the packages-templates family projects onto the served row name
  isomorphically with the F2 repo-catalog): available exactly when a wired
  backend's `template_capabilities().list_templates` is true; the default
  declared-none keeps the row honestly unavailable until the environment
  override flips it.
- **Route arm order (the F2/F3 isomorph)**: the closed-empty-params shape
  validation PRECEDES the capability gate — any key or a non-object params
  answers `vua.packages.invalid_params` (a pure shape verdict, before the
  gate); the gate (`template_capabilities().list_templates`) PRECEDES the
  port call — absence answers the generic `vua.vpm.capability_missing` and
  never reaches a backend method (the port method HAS a default body, so a
  declared-but-unimplemented backend CAN exist at the type level — both
  layers answer `capability_missing`, the route gate first); the port's typed
  refusals pass through verbatim (code + messageKey + category, no read-face
  fold); at envelope assembly the route stamps both consts (envelope +
  family), the backend facts stay verbatim — id-ascending and the name===id
  same-value projection are PRODUCER contracts of the frozen word face
  (pinned by the core consumer tests), never route rewrites.
- **Wire route tests**: `packages_templates_wire_v01.rs` 7 cases riding the
  real frame loop (the frozen word face fully pinned + the absence arm + the
  gate-before-port pin + the verbatim pass-through pin + the honest empty
  listing + the shape violations before the gate + the detectability of both
  consts against the frozen schema consts).

## Backend-root-facts section (027 checkpoint — mandatory)

The 027 acceptance checkpoint (the 026 U14 lesson: a schema word face cannot
pin "which root the backend points at") requires every file-system face to pin
its roots. This face:

- **What this face reads.** The two template directory roots under the
  environment root: `<environment_root>/VRCTemplates` (first) and
  `<environment_root>/Templates` (second) — the same pair of roots as
  `create_from_template`'s library-path default-resolution leg (the 026 A5
  implementation cross-check direct-read anchor). The enumeration = a
  directory-entry scan over both roots (directories only, files excluded);
  the scan covers VRCTemplates fully first, then Templates as the difference
  set (the duplicate-name dedup rule, see the enumeration-shape ruling).
  Zero network, zero writes.
- **The production wiring face.** The environment root = the user's real VCC
  settings directory (`%LOCALAPPDATA%\VRChatCreatorCompanion` — the VCC/ALCOM
  shared home; the provider-host bin wiring fact registered by 024/026-U14).
  The F5 face is READ-ONLY over that shared root: never writes either root,
  never moves/renames/deletes any template entry, never touches a project.
  The real-machine incidental observation is on file (the W25 read-only
  evidence record, 027 proposal s6(f)): the real `VRCTemplates/` holds
  exactly 5 directories (Avatar / Avatar 2019 / Base / World / World 2019,
  directory-name readings), metadata-file shape unverified (a W25 incidental
  item).
- **The test isolation face.** All tests (this batch's consumer tests, the
  environment implementation-verification slice, and any future fixture) run
  exclusively on a **temporary environment root** injected via
  `VrcGetLibBackend::with_environment_root(temp_dir, offline)` — synthetic
  data only, never pointing at the user's real VCC/ALCOM home. The production
  root appears in documents and examples as placeholder literals only.
- **The honest boundary pinned by this section.** The schemas pin the wire
  shape; they cannot pin the roots. The root facts above ARE the acceptance
  anchor: the environment implementation-verification slice and integration
  acceptance re-derive the facts from the wiring code and reconcile them
  against this section item by item.

## Explicitly outside this word face

- Project creation: the packages-ops `createProject` (026 A5) write face; this
  face carries zero create/preview/write methods.
- Template metadata (description/author/license/versions etc.): no v0.1
  producer, invalid by schema (ORC-DEV-004: no implementation, no reserved
  field); a v0.2 row-directory increment once W25 establishes the facts.
- Per-row `sourceRoot` root disclosure: no consumer need, create's resolution
  order is already the frozen fact; invention is invalid.
- `cacheSourced`: a zero-network face has no cache-degradation semantics, a
  constant is not a fact (the packages-repos v0.1 law).
- Pagination, sort preferences, filter keys, per-project query keys: none in
  v0.1 (the template face is an environment-level global fact).

## Honest boundary

The core wiring slice is **complete (this v0.1.1 batch)**: the
`packages.listTemplates` route arm has landed riding the named envelope
consts; wire tests 7 cases ride the real frame loop. The route is wired and
**NOT consumed** — desktop consumption (the new-project template dropdown:
falling back to the current manual input when the enumeration is absent or
the creation capability is unavailable, with an empty value = the backend
default resolution semantics kept verbatim) follows the per-face program
after shape approval; the library implementation (the two-root directory scan
+ the capability override) belongs to the environment
implementation-verification slice, and until it lands every wired backend
stays on the honest absence arm (the served row honestly unavailable); the
full-chain real-machine walkthrough stays in the W25 window (O-2, waiting for
the user to open the window). The empty state is the final state: an empty
templates array renders as the designed empty state, never filled with
guessed content; unavailable metadata means no metadata key, never invented.
