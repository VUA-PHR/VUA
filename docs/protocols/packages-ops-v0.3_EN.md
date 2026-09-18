# packages-ops Protocol v0.3 (packages P3 write face, third frozen slice A3 = register_local_package: packages.registerLocalPackage)

[English](packages-ops-v0.3_EN.md) | [简体中文](packages-ops-v0.3_ZH.md)

> Document version: 0.3.1
> Status: **Frozen (packages-ops word-list row v0.3, slice A3
> local-package registration word face; the v0.1 A1 removal row and the
> v0.2 A2 install/upgrade row stay frozen and served untouched — v0.3
> is a separate row directory per the packages-catalog v0.2 increment
> precedent; the word face is WIRED: the wire route and the served row
> are in the tree — desktop consumption follows the per-face upgrade,
> and until that lands the method has no desktop entry point)**
> (2026-09-19, proposal 026 face order A1→A2→A3)
> Machine-readable word list: `schemas/packages-ops/v0.3/` (per-row
> dual schemas + 2 positive / 7 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_ops_consumer_v03.rs`; wire route
> tests `crates/provider-host/tests/packages_ops_wire_v03.rs`; TS guard
> tests `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.registerLocalPackage` (nine-state task-driven
> registration of one generated local package into the backend's
> isolated environment)
> Ownership boundary: word-list freeze, port face (the NEW defaulted
> accessor `VpmBackend::register_capabilities` -> `RegisterCapabilities`,
> default declared-none, plus the already-in-tree
> `register_local_package` port method and the VrcGetLib implementation)
> = core domain; wire route (the `packages.registerOps` served row gated
> on the accessor, the route arm, the envelope assembly) = core domain,
> LANDED with this batch; the `VrcGetLibBackend::register_capabilities`
> override = environment domain (the implementation-verification slice,
> the 024/025 procedure — the served row stays honestly unavailable
> until that override flips it); desktop consumption = desktop domain
> (per-face upgrade, `blocks.changes` evolution per desktop stance)
> Updated: 2026-09-19 (v0.3.1 wiring batch: the route arm
> `packages.registerLocalPackage` + the served row `packages.registerOps`
> gated on the accessor + the envelope assembly + the closed-set
> projection + the wire tests + this document names the wire envelope
> const — word face ZERO change); 2026-09-19 (v0.3 freeze batch: dual
> schemas + vectors + core consumer tests + TS face + bilingual protocol
> doc + REGISTRY)

## A3 word-face semantics (registration is deliberately NOT a preview/apply pair)

- **One method, no preview arm — the only such face in the family.**
  The port has exactly `register_local_package(&self, package_root:
  &Path) -> Result<(), AppErrorV1>`; no preview method exists and none
  is invented. The implementation documents the fact: "Registration is
  deliberately separate from preview/apply: the normal digest-bound
  install path still owns every project mutation." Registration adds
  one user-package row to the backend's ISOLATED environment; it
  removes and rewrites nothing (non-destructive), so ADR-0006's
  destructive-warning path has nothing to warn about and the face
  invents no destructive fact.
- **Idempotence is a success fact, not a variant.** The library's
  `AddUserPackageResult::AlreadyAdded` answers success exactly like
  `Success`. First registration and re-registration are ONE success
  fact on the wire face: the receipt carries no `added` boolean and no
  first-vs-repeat distinction (a negative vector invalidates an
  invented one).
- **No digest, no confirmation chain.** There is no pre-existing state
  to drift and no resolver to miss: the double-digest guard
  (ORC-WF-003/004) has no purchase here. The user's explicit submission
  IS the confirmation (the same direction as the A5 create-project
  stance: a form submission is an explicit confirmation). A request
  carrying a `confirmedDigest` is a shape violation (negative vector).
- **Nine-state task-driven write command (the family-consistent
  shape).** applyRemove, applyInstall and project.setNote all ride the
  task surface; registration does too: `commandId` idempotency,
  cancellable, events + revision, and recovery maps non-terminal
  residue to `inspect_required` and never resumes implicitly (honesty
  rule 3). Task correlation lives on the task surface (taskId/
  revision); the result document is a reflux payload.

## Method face

- **Request**: `{packageRoot}` — the closed single-key params.
  `packageRoot` is the local package root directory (containing the
  package `package.json`), the port's `package_root` projected verbatim
  (camelCase), non-empty. NO `projectPath` is taken: registration never
  touches a project and never mutates the user's VCC or ALCOM settings
  (the port signature takes no project).
- **Result (Done payload), kind=registered**: the minimal honest audit
  shape — `{schemaVersion: "vua.packages-ops/v0.3", kind: "registered",
  packageRoot}`. The port answers `Result<(), _>`: there is NO
  actual-result payload to project, so the document carries exactly the
  request echo and nothing else (`additionalProperties:false` forbids
  inventing more — registration timestamps, package.json contents and
  environment file paths are INVALID by schema).
- **Result, kind=rejected**: the guard closed set stands at the A1/A2
  three values — A3 adds NO guard. Registration has no preview to drift
  and no resolver to miss, so every port refusal folds into
  `execution_failed` carrying the ORIGINAL port code inside detail as
  honest provenance (`vua.vpm.local_package_invalid` for the path/
  package-shape refusals — nonexistent path, missing package.json,
  non-absolute path, malformed package; `vua.vpm.local_package_register_
  failed` for the isolated-settings load/save I/O). The reused
  `vua.vpm.*` codes never travel inside the `code` key (the 013
  reuse-code law; the pattern stays locked to `^vua\.packages\.`,
  negative vector pins it).
- **Envelope-error face (zero new codes)**: a backend without the
  capability answers the generic `vua.vpm.capability_missing` (the
  trait default's `unsupported` fact; the wire gate answers it BEFORE
  submit — capability absence never reaches a task); parameter
  violations answer `vua.packages.invalid_params`; an unwired engine
  answers the honest-absence arm `vua.packages.unavailable`.
- **Serving gate**: the NEW defaulted accessor
  `VpmBackend::register_capabilities() -> RegisterCapabilities`
  (default declared-none; the 025 `catalog_capabilities` law — a
  separate accessor instead of a `VpmCapabilities` field keeps the
  five-bit closed set stable and non-implementing backends compiling
  unchanged, ORC-DEV-004). One served row `packages.registerOps` serves
  the one method (the removeOps/installOps one-row precedent). The
  VrcGetLib override lands with the environment
  implementation-verification slice — until then the row is honestly
  unavailable.
- **Port-code mapping declared with this batch** (the full per-code
  alignment declaration rides the environment implementation-
  verification slice, the A1/A2 same path):
  `local_package_invalid` → rejected `execution_failed` with the
  original code in detail; `local_package_register_failed` → rejected
  `execution_failed` with the original code in detail; capability
  absence → generic `capability_missing` (envelope error, pre-submit).
- **The served capability row (wired, landed)**: one row,
  `packages.registerOps`, serves the one method; its availability
  gates on the NEW defaulted accessor
  `register_capabilities().register_local_package` (the frozen v0.3
  command schema's serving gate — the removeOps/installOps one-row
  precedent). An engine wired without the registration capability
  declared keeps the row honestly unavailable; an unwired engine
  answers `vua.packages.unavailable`. There is NO registered-project
  check on this route (no `projectPath` is taken — registration never
  touches a project), so the 013 `project_not_found` reuse does not
  apply to this face. The wire-route projection follows the A1/A2
  discipline narrowed to this face: the task face folds EVERY port
  refusal (`local_package_invalid`, `local_package_register_failed`,
  the trait default's `capability_missing`, and every word-out code)
  into `execution_failed` carrying the original code inside `detail`
  as honest provenance — no invented fourth guard; the capability
  gate answers the generic `capability_missing` at the route layer
  BEFORE submit — capability absence never reaches a task.

## Envelope, versions, and dependency direction

The wire envelope is the standing shape (the `schemaVersion` envelope
const `"0.3"` + `operation` + `result`); the result document carries
its own family const (`vua.packages-ops/v0.3`) — the two versions are
independent (the c914cf2 standing rule: every wire row carries a
version constant of its own). The task acceptance and the Done payload
both stamp the `"0.3"` envelope const. The v0.1 removal methods keep
answering at the v0.1 word face and the v0.2 install methods at the
v0.2 word face; a v0.3 request is only `packages.registerLocalPackage`
(the v0.2 and v0.3 `changePlan` shapes share the same key set —
consumers narrow by the `schemaVersion` literal, not by keys alone).
Dependency direction unchanged: renderer → typed Gateway → Electron
main (verbatim pass-through) → versioned application contract →
provider wire face → the `VpmBackend` port → the project-manager
adapter. Framework and vendor types stay in adapters; the word list
transports facts.

## Honesty boundary

- **The word face is wired (v0.3.1 wiring batch); consumption is not.**
  The wire route, the `packages.registerOps` served row, the envelope
  assembly and the wire tests are in the tree — the method exists on
  the wire face as of this batch. Desktop still renders no entry point
  (consumption follows the per-face upgrade, the A1/A2 same program),
  the environment `VrcGetLibBackend::register_capabilities` override
  has not landed (the served row answers honestly unavailable until it
  does), and the real backend consumption is the environment
  implementation-verification slice. The consumer and wire tests ride
  schema vectors and fake backends; the end-to-end walkthrough stays
  with W25 (pending the user opening window O-2). Nothing here claims
  runtime behavior beyond the wire face this batch landed.
