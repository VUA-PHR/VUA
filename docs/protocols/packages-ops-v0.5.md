# packages-ops Protocol v0.5 (packages P3 write face, fifth frozen slice A5 = project creation: packages.createProject)


> Document version: 0.5.1
> Status: **Frozen (packages-ops word-list row v0.5, slice A5
> project-creation word face; the v0.1 A1 removal row, the v0.2 A2
> install/upgrade row, the v0.3 A3 registration row and the v0.4 A4
> repository add/remove row stay frozen and served untouched — v0.5 is
> a separate row directory per the packages-catalog v0.2 increment
> precedent; the word face IS wired: the wire route and the served row
> are in tree — desktop consumption rides the per-face upgrade, until
> it lands the method has no desktop entry point)**
> (2026-09-19, proposal 026 face order A1→A2→A3→A4→A5; the A5 start
> ruling = core, 2026-09-19 01:3x — start granted / timing last /
> word-face direction six points / carrier declaration, recorded in the
> wt-2 state file at generation 8afde3f; the desktop entry-need five
> points = the 026 inline desktop stance section a4c74a7)
> Machine-readable word list: `schemas/packages-ops/v0.5/` (per-row
> dual schemas + 3 positive / 10 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_ops_consumer_v05.rs`; wire
> route tests `crates/provider-host/tests/packages_ops_wire_v05.rs`;
> TS guard tests `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.createProject` (the nine-state task-driven write
> command creating a new project)
> Ownership boundary: word-list freeze + port-face documentation
> comments (this batch mints ZERO new port codes and ZERO new
> capability accessor — the create capability bit = the EXISTING
> five-bit member `VpmCapabilities.create_project`, the bit predates
> this batch and both in-repo backends already declare it honestly) =
> core domain; wire route (the `packages.createOps` served row, the
> route arm, the envelope assembly) = core domain, **landed with the
> v0.5.1 wiring batch**; the dual implementations (the library path
> `create_from_template` / the CLI path `vpm new`) are already in tree
> = environment domain (the implementation-verification slice per the
> 024/025 procedure); desktop consumption = desktop domain (per-face
> upgrade, the create capability presentation must be NEWLY declared —
> reusing `blocks` is not available: its semantics = change-preview
> availability, a different fact from "can create projects")
> Updated: 2026-09-19 (v0.5.1 wiring batch: the route arm
> `packages.createProject` + the served row `packages.createOps`
> gated on the existing `capabilities().create_project` bit + envelope
> assembly + all-refusals-fold projection + wire tests + this document
> NAMES the wire envelope constants — word face ZERO change);
> 2026-09-19 (v0.5 freeze batch: dual schemas + vectors + core
> consumer tests + TS face + mock constant-absence arm + bilingual
> protocol doc + REGISTRY)

## A5 word-face semantics (project creation is deliberately NOT a preview/apply pair — the second no-pair member)

- **One method, no preview arm — the port fact, honestly faced.** The
  port is exactly `create_project(&self, parent: &Path, name: &str,
  template: Option<&str>) -> Result<ProjectRef, AppErrorV1>`; no
  create-preview counterpart exists and none is invented: a preview arm
  would put a method on the wire face with no port method behind it. A
  brand-new project directory has NO pre-existing state to diff — no
  change set to preview, no digest to bind (the 026 A5 core stance and
  the desktop entry-need stance agree); ORC-WF-003/004 has no purchase
  here.
- **The user's explicit form submission IS the confirmation** (the
  desktop A5 point 2: the form submit itself is the explicit
  confirmation; the creation does not enter the double-summary confirm
  chain). A request carrying a `confirmedDigest` is a shape violation
  (negative vector). Creating a new directory touches no existing
  registered project, no package file, and no other project's content —
  ADR-0006's destructive-warning path has nothing to warn about and the
  face invents no destructive fact.
- **No `projectPath` param.** Creation addresses no registered project
  (the 013 `project_not_found` reuse does not apply); `parent` is a
  path fact, not a project identity (a carried `projectPath` = shape
  violation, negative vector).
- **Nine-state task-driven write command (the family-consistent
  shape).** applyRemove, applyInstall, registerLocalPackage and the
  three A4 methods all ride the task surface; A5 is isomorphic:
  `commandId` idempotency, cancellable, events + revision. The template
  directory copy can run long and the `copy_tree` segment carries no
  progress callback — observability rides the task-state face (nine
  states), recoverability rides the recovery discipline: recovery maps
  non-terminal residue to `inspect_required` and NEVER resumes
  implicitly (honesty rule 3).
- **The template param is REQUIRED-nullable (the A2 version-selection
  isomorph).** `null` = the backend's default template resolution — the
  port `Option None` fact: the library path defaults to the Avatar
  template with the `VRCTemplates/<t>` → `Templates/<t>` →
  explicit-path resolution order (a frozen word-face FACT, not a
  picker); a non-empty string = that template name/path passed verbatim.
  **The first face has ZERO new read faces**: the `templates.*`
  enumeration family is not in A5 (a later need takes its own face
  program); the desktop presents the template actually used and invents
  NO dropdown picker (honesty rule 1).
- **Created = registered (the frozen port fact, honestly declared).**
  Both backends' success paths tail-call
  `FileSystemProjectStore::initialize`: a successful creation REGISTERS
  the new project in VUA's in-store project storage — **creation
  success = registration success**, and the registered-project list
  shows the new project on its next refresh. The word face never
  invents a "directory-only, unregistered" shape. An existing target
  path is refused at execution by the backend guard (the library path's
  `projectExists` key); idempotence is NOT claimed.

## Method face

- **packages.createProject**: `{parent, name, template}` — the
  three-key closed set. `parent` is the parent directory the new
  project directory is created under (the port's `parent`, verbatim
  camelCase; a path fact, not a registered-project identity). `name` is
  the new project name (the port's `name` verbatim; the backend's name
  validation is the execution-time authority — whitespace /
  leading-trailing whitespace / `.` `..` `-` prefixes / the nine
  filesystem-forbidden characters are refused on the library path; the
  wire face does not re-litigate upstream name grammar, the form
  pre-validation mirrors the backend rule as UI guidance with the
  frozen word face staying authoritative). `template` as above
  (REQUIRED-nullable).
- **Result (Done payload), kind=created (the creation arm)**:
  `{schemaVersion: "vua.packages-ops/v0.5", kind: "created",
  projectId, projectPath}`. **The ONE packages-ops receipt with an
  actual-result payload** (unlike the unit-answering A3/A4 faces): the
  port answers `Result<ProjectRef, _>` and the receipt IS that
  projection — `projectId` = the port `ProjectRef.id` echo (the
  creation fact the backend minted, an informational identifier; **NOT
  the 013 project identity key**, the project identity stays the path);
  `projectPath` = the port `ProjectRef.root` echo (the new project's
  root directory = its registered-project path identity; the
  registers-in-store side effect as above — the receipt and the
  "visible on next list refresh" fact align). `additionalProperties:
  false` forbids inventing created-at timestamps / copy statistics /
  package lists. The created key set is disjoint from every prior
  receipt arm (removeReceipt / installReceipt / registerReceipt /
  repoReceipt / removed).
- **Result, kind=rejected**: the guard closed set stands at the A1/A2
  three values — A5 adds NO guard. Every port refusal folds into
  `execution_failed` carrying the ORIGINAL port code in detail as
  honest provenance. **The A5 port-code closed set is THREE EXISTING
  codes, ZERO new** (the port method and both implementations predate
  this batch — the freeze transports their honest faces, it mints no
  code):
  - `vua.vpm.template_missing` — the shared carrier for ALL FOUR i18n
    message keys of the library path: `errors.vpm.projectExists`
    (existing target, Validation) / `errors.vpm.projectNameInvalid`
    (invalid name, Validation) / `errors.vpm.templateMissing` (missing
    template, Dependency) / `errors.vpm.templateCopyFailed` (copy
    failure / not a Unity project / registration failure,
    ExternalFailure). **The i18n message key and the port error code
    are TWO layers**, both declared honestly on this face: the desktop
    four-language copy rides the consumption slice by message key (the
    four keys are absent from the desktop four-language tables today —
    the desktop A5 point 5①).
  - `vua.vpm.apply_failed` — the CLI path: a `vpm new` timeout or
    non-zero exit (carrying the `exitCode`) and the registration leg.
  - `vua.vpm.backend_unavailable` — the CLI path runner-spawn failure
    (the library path never answers this).
  The reused `vua.vpm.*` codes never travel in the `code` key (the 013
  reuse-code law; the pattern stays locked to `^vua\\.packages\\.`,
  negative vector).
- **The two backends' refusal shapes DIVERGE (declared honestly, no
  unified shape invented).** The library path's four key semantics
  share one port code, tiered by category (Validation / Dependency /
  ExternalFailure); the CLI path's error shapes are the two codes
  apply_failed + exitCode / backend_unavailable. Desktop consumption
  presents by the detail's original code and never merges the words.
- **Envelope-error face (zero new codes)**: a backend with the create
  bit false answers the generic `vua.vpm.capability_missing` (the wire
  gate reads the EXISTING `VpmCapabilities.create_project` member
  before submit — capability absence never reaches a task; A5 freezes
  no new accessor, unlike A3/A4: the bit predates this batch and both
  in-repo backends already declare it honestly); param violations
  answer `vua.packages.invalid_params`; unwired engines answer the
  honest-absence arm `vua.packages.unavailable`.
- **Serving gate (wired, landed)**: the served row `packages.createOps`
  serves the one method (the registerOps / removeOps / repoOps one-row
  precedent); row availability = the backend's
  `capabilities().create_project` bit (the EXISTING five-bit member — no
  new accessor exists on this face, so unlike the A4 row there is no
  declared-none default waiting for an environment override: a wired
  backend with the bit true answers available as of this wiring batch);
  the wire route reads the same bit before submit, a false bit answers
  the generic `capability_missing` and never reaches a task. Because the
  port method is REQUIRED with no default body, the gate IS the absence
  arm — a declared-but-unimplemented backend cannot exist at the type
  level.

## Explicitly outside this word face

- **The template enumeration read face (the templates.* family)**: the
  first face has zero new read faces — the port has no template
  enumeration method and this face freezes no picker word list; a later
  need takes its own face program.
- **The project identity key (projectId as a param)**: the 013 ruling
  "this word-list family has no independent project id" is unchanged by
  A5 — the created receipt's `projectId` is the echo of a port-minted
  fact, not an identity param; the project identity stays the path.
- **Parent-directory browsing / filesystem read faces**: the `parent`
  selection UI belongs to the desktop consumption slice (the
  design-standard §8.7 addition rides that slice); the word face
  freezes no filesystem read face.

## Envelope, versions and dependency direction

The wire envelope is the standing shape (the `schemaVersion` envelope
const `"0.5"` + `operation` + `result`); the result document carries
its own family const (`vua.packages-ops/v0.5`) — the two versions are
independent (the c914cf2 standing rule: every wire row carries its own
version constant). All the method's wire outcomes stamp the envelope
const `"0.5"` on both the task acceptance answer and the Done payload,
and the receipt stamps the family const `vua.packages-ops/v0.5` — the
constants are named and pinned by the v0.5.1 wiring batch (the A3/A4
precedent: the freeze-batch document registers the row, the wiring
batch names the constants in a 0.5.x revision — consumers align
against the landed face, never a guess). The v0.1 removal methods keep
answering in the v0.1
word face, the v0.2 install methods in the v0.2 word face, the v0.3
registration in the v0.3 word face, the v0.4 subscription three
methods in the v0.4 word face; the v0.5 request is the A5 method only
(the plan/receipt shapes share the same key sets across generations —
consumers narrow by the `schemaVersion` literal, never by keys alone).
The dependency direction is unchanged: renderer → typed Gateway →
Electron main (verbatim pass-through) → versioned application contract
→ provider wire face → the `VpmBackend` port → the project-manager
adapter. Framework and vendor types stay in adapters; the word list
transports facts.

## Honesty boundary

- **The word face is wired, not consumed.** The wire route (the
  `packages.createOps` served row and the route arm) and the envelope
  assembly landed with the v0.5.1 wiring batch — the method exists on
  the wire face as of this batch. Desktop renders no entry point yet
  (consumption rides the per-face upgrade after the shape approval);
  both implementations are in tree (the library path / the CLI path) and
  the environment implementation-verification slice follows per the
  024/025 procedure. Wire tests riding the real frame loop with fake
  backends landed with the wiring batch
  (`packages_ops_wire_v05.rs`); the end-to-end walkthrough stays W25
  (waiting for the user to open O-2). This document claims no
  real-machine behavior.
