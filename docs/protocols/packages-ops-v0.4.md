# packages-ops Protocol v0.4 (packages P3 write face, fourth frozen slice A4 = repository add/remove: packages.addRemoteRepo / packages.addLocalRepo / packages.removeRepo)


> Document version: 0.4.1
> Status: **Frozen (packages-ops word-list row v0.4, slice A4
> repository add/remove word face; the v0.1 A1 removal row, the v0.2
> A2 install/upgrade row and the v0.3 A3 registration row stay frozen
> and served untouched — v0.4 is a separate row directory per the
> packages-catalog v0.2 increment precedent; the word face IS wired:
> the wire routes and the served row are in tree — desktop consumption
> rides the per-face upgrade, until it lands the methods have no
> desktop entry point)**
> (2026-09-19, proposal 026 face order A1→A2→A3→A4, the batch-98
> word-face bisection ruling: add/remove freeze first, enable/disable
> wording waits for the W25 VCC key-name real-machine verification)
> Machine-readable word list: `schemas/packages-ops/v0.4/` (per-row
> dual schemas + 6 positive / 11 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_ops_consumer_v04.rs`; wire
> route tests `crates/provider-host/tests/packages_ops_wire_v04.rs`;
> TS guard tests `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.addRemoteRepo` / `packages.addLocalRepo` /
> `packages.removeRepo` (nine-state task-driven writes of the repo
> subscription list in the backend's isolated environment)
> Ownership boundary: word-list freeze, port face (the NEW defaulted
> accessor `VpmBackend::repo_write_capabilities` ->
> `RepoWriteCapabilities` with THREE independent bits, default
> declared-none, plus the NEW port methods `add_remote_repo` /
> `add_local_repo` / `remove_repo`) = core domain; wire route (the
> `packages.repoOps` served row gated on the accessor, the route arms,
> the envelope assembly) = core domain, **landed with this batch**;
> the `VrcGetLibBackend::repo_write_capabilities`
> override and the three implementations over the library's Settings
> add/remove = environment domain (the implementation-verification
> slice, the 024/025 procedure — the served row stays honestly
> unavailable until that override flips it); desktop consumption =
> desktop domain (per-face upgrade, `blocks` evolution per desktop
> stance)
> Updated: 2026-09-19 (v0.4.1 wiring batch: the route arms
> `packages.addRemoteRepo` / `packages.addLocalRepo` /
> `packages.removeRepo` + the served row `packages.repoOps` gated on
> the accessor's three independent bits + envelope assembly +
> closed-set projection + wire tests + this document NAMES the wire
> envelope constants — word face ZERO change); 2026-09-19 (v0.4
> freeze batch: dual schemas + vectors + core consumer tests + TS
> face + mock constant-absence arms + bilingual protocol doc +
> REGISTRY)

## A4 word-face semantics (subscription writes are deliberately NOT a preview/apply pair)

- **Three methods, no preview arm — the A3 law again.** The ports are
  exactly `add_remote_repo(&self, url: &str, name: &str)`,
  `add_local_repo(&self, path: &Path, name: &str)` and
  `remove_repo(&self, repo_id: &str)`, each answering
  `Result<(), AppErrorV1>`; no preview method exists and none is
  invented. Adding a REMOTE repository inherently contains a
  manifest-fetch network segment: a preview cannot verify reachability
  without doing the same network work, so a preview arm would be a
  second network round-trip pretending to be a safer first one — not
  frozen. No method on this face has a pre-existing state digest to
  bind: the subscription list may drift between two reads, and the
  honest failure mode is the port answering
  `vua.vpm.repo_not_found` at execution time, never a digest ritual
  (ORC-WF-003/004 has no purchase here). Adding or removing one
  subscription row deletes no package file and no project content, so
  ADR-0006's destructive-warning path has nothing to warn about and
  the face invents no destructive fact.
- **The user's explicit submission IS the confirmation** (the A3/A5
  stance). A request carrying a `confirmedDigest` is a shape violation
  (negative vector).
- **Idempotence is NOT claimed on the add face.** Unlike the A3
  registration (where the library's `AlreadyAdded` collapses first and
  repeat into one success fact), the library's add guards answer
  refusal on a duplicate url/name: the wire face answers that refusal
  honestly as `vua.vpm.repo_invalid` folded into a rejected document —
  no idempotent success is invented where the backend refuses.
- **Nine-state task-driven write commands (the family-consistent
  shape).** applyRemove, applyInstall, registerLocalPackage and
  project.setNote all ride the task surface; all three A4 methods do
  too: `commandId` idempotency, cancellable — material on the remote
  face whose network segment can hang — events + revision, and
  recovery maps non-terminal residue to `inspect_required` and never
  resumes implicitly (honesty rule 3).

## Method face

- **packages.addRemoteRepo**: `{url, name}` — the closed two-key
  params. `url` is the remote repository URL (non-empty; no tighter
  pattern is frozen: the word list transports facts, it does not
  re-litigate upstream URL grammar). `name` is the REQUIRED
  user-supplied display name (the subscription list presents it; the
  read face `RepoInfoV01.name` Option projects EXISTING rows verbatim,
  it does not imply new rows may go nameless). The first frozen slice
  takes NO HTTP headers and NO credential transport — a future face
  that does needs its own accepted security decision.
- **packages.addLocalRepo**: `{path, name}` — the closed two-key
  params, no network segment.
- **packages.removeRepo**: `{repoId}` — the closed single-key params.
  The repository id is the stable row handle; INDEX addressing is NOT
  frozen (an index drifts under concurrent writers). An unknown
  `repoId` answers `vua.vpm.repo_not_found` at execution time. Rows
  whose id is absent are OUTSIDE this face's remove reach (the honest
  boundary; a future word face may address them, none is invented
  here).
- **NO method takes a `projectPath`.** The subscription face writes
  the backend's ISOLATED environment only (the same fact A3 froze) —
  never the user's VCC or ALCOM settings, never a project. The
  registered-project gate (the 013 `project_not_found` reuse) does not
  apply to this face.
- **Result (Done payload), kind=repoReceipt (the add arms)**: the
  minimal honest audit shape, oneOf two mutually exclusive variants
  keyed by `repoType` — remote: `{schemaVersion:
  "vua.packages-ops/v0.4", kind: "repoReceipt", repoType: "remote",
  url, name}`; local: `{..., repoType: "local", path, name}`. The
  ports answer `Result<(), _>`: there is NO actual-result payload, so
  each variant carries exactly the request echo (`additionalProperties:
  false` forbids inventing more — subscription timestamps, row
  positions and fetched-manifest contents are INVALID by schema).
- **Result, kind=removed (the remove arm)**:
  `{schemaVersion: "vua.packages-ops/v0.4", kind: "removed", repoId}` —
  the removed row's id echoed, the one fact the face has (the echo IS
  the audit link; no removed-row snapshot is invented: a row may carry
  absent-id facts this face never round-trips). Key sets of
  repoReceipt/removed are mutually exclusive with each other and with
  every prior receipt arm (removeReceipt/installReceipt/registerReceipt).
- **Result, kind=rejected**: the guard closed set stands at the
  A1/A2 three values — A4 adds NO guard. Every port refusal folds into
  `execution_failed` carrying the ORIGINAL port code inside detail as
  honest provenance: `vua.vpm.repo_invalid` (duplicate url/name,
  official/curated guard, malformed shape), `vua.vpm.repo_not_found`
  (unknown repoId), `vua.vpm.repo_fetch_failed` (the remote manifest
  fetch failed — the add-remote network segment only),
  `vua.vpm.repo_write_failed` (the isolated-environment settings
  write-back). The reused `vua.vpm.*` codes never travel inside the
  `code` key (the 013 reuse-code law; the pattern stays locked to
  `^vua\.packages\.`, negative vector pins it).
- **Envelope-error face (zero new codes)**: a backend without the
  specific capability bit answers the generic
  `vua.vpm.capability_missing` (the trait default's `unsupported`
  fact; the wire gate answers it BEFORE submit — capability absence
  never reaches a task); parameter violations answer
  `vua.packages.invalid_params`; an unwired engine answers the
  honest-absence arm `vua.packages.unavailable`.
- **Serving gate (wired, landed)**: the NEW defaulted accessor
  `VpmBackend::repo_write_capabilities() -> RepoWriteCapabilities`
  with THREE INDEPENDENT bits (`add_remote_repo` / `add_local_repo` /
  `remove_repo` — a backend may serve a subset of the face; the gate
  is per method, never per face; default declared-none; the 025
  `catalog_capabilities` law, ORC-DEV-004). The served row
  `packages.repoOps` serves the three methods (the
  removeOps/installOps/registerOps one-row precedent): the row answers
  available when the backend declares ANY of the three independent
  bits (a partially-overriding backend must not have its served
  methods hidden behind a face-level row), while each route
  independently reads the method's OWN bit BEFORE submit, answering the
  generic `capability_missing` on absence — capability absence never
  reaches a task. The VrcGetLib override lands with the environment
  implementation-verification slice — until then the row is honestly
  unavailable.
- **Port-code mapping declared with this batch** (the full per-code
  alignment declaration rides the environment implementation-
  verification slice, the A1/A2/A3 same path): `repo_invalid` /
  `repo_not_found` / `repo_fetch_failed` / `repo_write_failed` →
  rejected `execution_failed` with the original code in detail;
  capability absence → generic `capability_missing` (envelope error,
  pre-submit).

## Explicitly OUTSIDE this word face

- **Enable/disable (start/stop)**: the library's `UserRepoSetting` has
  no enabled field and the settings model has no disabled-list
  modeling — the VCC disabled-list key name and semantics must be
  verified on a real machine (the W25 window item, the 024 (b)
  `vcc.liteDb` verification can ride the same window) before any
  start/stop word face is frozen. Until then enable/disable is in NO
  frozen word face and no wire method exists for it.
- **Reorder**: the library surface is complete, but the batch-98
  bisection ruling froze "add/remove first"; reorder is not in this
  word face and may be frozen with a later slice if a consumer need
  lands.
- **HTTP headers / credential transport on add-remote**: not taken by
  this word face (see above).

## Envelope, versions, and dependency direction

The wire envelope is the standing shape (the `schemaVersion` envelope
const `"0.4"` + `operation` + `result`); the result document carries
its own family const (`vua.packages-ops/v0.4`) — the two versions are
independent (the c914cf2 standing rule: every wire row carries a
version constant of its own). All three methods stamp the envelope
const `"0.4"` on both the task acceptance and the Done payload. The
v0.1 removal methods keep answering at the v0.1 word face, the v0.2
install methods at the v0.2 word face and the v0.3 registration at the
v0.3 word face; a v0.4 request is only the three A4 methods (the
v0.2/v0.3/v0.4 `changePlan` shapes share the same key set — consumers
narrow by the `schemaVersion` literal, not by keys alone). Dependency
direction unchanged: renderer → typed Gateway → Electron main
(verbatim pass-through) → versioned application contract → provider
wire face → the `VpmBackend` port → the project-manager adapter.
Framework and vendor types stay in adapters; the word list transports
facts.

## Honesty boundary

- **The word face is wired, not consumed.** The wire routes (three
  arms), the `packages.repoOps` served row and the envelope assembly
  landed with the v0.4.1 wiring batch — the three methods exist on the
  wire face as of this batch. Desktop renders no entry point yet
  (consumption rides the per-face upgrade); the environment
  `VrcGetLibBackend::repo_write_capabilities` override and the three
  implementations have not landed (the served row answers honestly
  unavailable until they do); the real backend consumption is the
  environment implementation-verification slice. The wire tests ride
  the real frame loop and fake backends; the end-to-end walkthrough
  stays with W25 (pending the user opening window O-2). Nothing here
  claims real-machine behavior.
