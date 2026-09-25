# packages-ops Protocol v0.2 (packages P3 write face, second frozen slice A2 = install/upgrade: packages.previewInstall + packages.applyInstall)


> Document version: 0.2.2
> Status: **Frozen (packages-ops word-list row v0.2, slice A2
> install/upgrade word face; the v0.1 A1 removal row stays frozen and
> served untouched) — the word face is WIRED (wire routes in the tree;
> this revision honestly updates the wiring status, the word face
> itself is zero-change)**
> (2026-09-19, proposal 026 face order, core ruling 82a39c4 point 1:
> upgrade = the same family as install, version-selection semantics
> land with THIS freeze batch — the proposal pre-note honored)
> Machine-readable word list: `schemas/packages-ops/v0.2/` (per-row
> dual schemas + 4 positive / 9 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_ops_consumer_v02.rs`; wire
> route tests
> `crates/provider-host/tests/packages_ops_wire_v02.rs`; TS guard
> tests `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.previewInstall` (synchronous read-only install/
> upgrade change preview, dependency-resolving, possibly network-
> touching) and `packages.applyInstall` (nine-state task-driven install
> write command under the double-digest guard)
> Ownership boundary: word-list freeze, port face (`VpmBackend`
> `preview_install`/`apply_install` already in the tree), and wire
> routing = core domain (WIRED: both route arms + the
> `packages.installOps` served row in the tree); the
> `VpmBackend` library implementation (project-manager,
> `preview_install` :528 / `apply_install` :757 already in the tree) =
> environment domain (implementation verification slice per the
> 024/025 procedure); desktop consumption = desktop domain (per-face
> upgrade, `blocks.changes` evolution per desktop stance 93752d5
> item 3)
> Updated: 2026-09-19 (v0.2 freeze batch: dual schemas + vectors +
> core consumer tests + TS face + bilingual protocol doc + REGISTRY);
> 2026-09-19 (v0.2.1 wiring batch: both wire route arms + the served
> row landed, the honesty-boundary section honestly updated, the word
> face zero-change); 2026-09-19 (v0.2.2 shape-approval pin-gap
> closure: the per-id uniqueness rule now honestly described as pinned
> in three layers — a new exactly-repeated-row negative vector, the TS
> guard narrowing with its tests, and the wire-layer request check;
> the previous wording overstated what the negative-vector set and the
> TS narrowing covered)

## A2 word-face semantics (install/upgrade = one family, no upgrade verb)

- **One preview/apply pair serves install AND upgrade.** The port has
  exactly `preview_install`/`apply_install`; the wire face invents no
  second verb. Upgrading is installing a (usually newer) version of an
  already-installed package; downgrading shares the same pin syntax.
  No `upgrade` change-kind is invented: the port's `ChangeKindV1`
  closed set is `install|remove`, and the v0.1 `changeItem` row
  already projected both (the A1 negative vector `kind=upgrade` was
  outside the word face then; the install face puts `install` rows to
  work, it does not add words).
- **Version-selection semantics (frozen here).** Each request row is
  `{packageId, version}` with `version` REQUIRED and nullable:
  `null` = install the version the resolver picks (the port's
  `VersionSelector::latest_for` — latest stable; prereleases are never
  auto-selected); a string = pin exactly that version. An
  unresolvable pin answers `package_not_found`. A repeated `packageId`
  across rows is a word-face violation even when the versions differ.
  Pinned in three layers (v0.2.2 honest correction): the schema
  `uniqueItems` pins exactly repeated rows (a dedicated negative
  vector rides this batch; cross-row id comparison is beyond JSON
  Schema's expressiveness and is NOT schema-pinned), the TS guard
  narrowing refuses any repeated id with its own tests, and the
  wire-layer request check refuses it at serving time.
- **preview = synchronous read-only query, dependency-resolving.**
  Unlike A1 (no network, no dependency resolution), the A2 preview
  resolves dependencies against the registered repositories and MAY
  hit the network. The online repository refresh degrades to the
  package cache on failure (the ORC-ADP-006 isomorphic precedent).
  The preview carries NO cache-sourcing disclosure field: the port's
  `ChangePreviewV1` has no carrier for it, and bolting one on would
  break the frozen A1 plan shape (`additionalProperties:false`);
  a future disclosure, if a user-harm fact demands it, follows the
  025 `cacheSourced` v0.2-increment precedent as its own word-face
  increment. The plan's `items` may contain install rows AND remove
  rows (conflict-triggered removals are port facts — ORC-WF-002: the
  plan must cover every change the backend will make);
  `destructive=true` when conflicts or legacy cleanups exist (the
  confirm UI must warn, ADR-0006).
- **apply = the nine-state task-driven write command.**
  `packages.applyInstall` must carry `confirmedDigest` (the preview
  digest the user confirmed); the server re-computes the preview at
  apply time and refuses on any drift (ORC-WF-003/004; the
  authoritative verdict lives server-side — proposal-014 arbitration
  point 2; the backend's own second comparison — Fix R2-7, legacy
  folders count into the digest — stays as defense in depth). The
  apply phase's repository load does NOT degrade: an online load
  failure fails the task honestly (ExternalFailure), it never
  silently executes against a possibly stale cache. Nine-state task
  semantics (`commandId` idempotency, cancellable, events + revision)
  ride the application contract's task surface, not this word list.
- **Recovery = re-inspect, never implicit resumption (honesty rule
  3).** Non-terminal residue of an interrupted/failed apply task
  re-inspects to `inspect_required`; the retry semantics = the user
  explicitly re-previews and re-confirms (the 014 "clean-then-redo"
  precedent), never a silent resumption. Digest-drift refusal is a
  recoverable conflict (the port implementation's `PREVIEW_DRIFT`
  `.with_recoverable(true)` is on record).
- **Closed params.** `projectPath` = the proposal-013 registered
  identity (an unregistered path answers the typed code
  `vua.project.project_not_found` — same fact, same code, 024 P1
  precedent); `packages` = the explicit non-empty closed list; the
  preview params carry NO digest slot (carrying one is a shape
  violation).

## The audit receipt (the A2 installReceipt variant)

`kind=receipt` on the install face = the proposal-014 import-receipt
precedent (change list + actual result) in the A2 variant:
`confirmedDigest` (echoed — the audit link) + `requestedPackages` (the
request rows verbatim, version-selection semantics included: a
resolver-picked request transports its `null`) + `appliedItems` (the
port's `apply_install` `{applied: items}` projected verbatim; no
minimum is invented — an honestly empty array transports as an empty
array). The receipt key sets are disjoint between the variants
(`requestedPackageIds`/`removedItems` vs
`requestedPackages`/`appliedItems`); task correlation lives on the
task surface (`taskId`/`revision`), this document is a reflux payload,
not a persisted link. Invented facts with no port carrier
(post-install re-inspection, download byte counts, timestamps,
resolution trees) are INVALID by schema — the false-assertion guard.

## The vua.packages.* error-code family (v0.2 increment)

**One new envelope-face code, zero new guards:**

| face | code | fact |
| --- | --- | --- |
| envelope error | `vua.packages.preview_failed` | the preview/query phase failed (repository resolution, IO, external failure class) |

The rejected-arm guard closed set stands at the A1 three values —
`preview_drift` / `package_not_found` / `execution_failed` (guard
value = code suffix, frozen schema pattern `^vua\.packages\.`). A2
adds no fourth guard: inside an apply task, drift answers
`preview_drift`, a package not resolvable answers `package_not_found`,
and every other port refusal folds into `execution_failed` with the
original port code inside `detail` as honest provenance.

Reused, zero new (declared): `vua.project.project_not_found`
(unregistered projectPath), `vua.packages.invalid_params` (request
shape violation), `vua.packages.unavailable` (honest absence of an
unwired engine). Port-level mapping as declared by this freeze batch
(full per-code declaration rides the environment
implementation-verification slice): `vua.vpm.preview_failed` →
`vua.packages.preview_failed`; `vua.vpm.apply_failed` →
`vua.packages.execution_failed`; `vua.vpm.no_matching_package` →
`vua.packages.package_not_found` (same fact: the requested
package/version is not obtainable); `vua.vpm.preview_drift` →
`vua.packages.preview_drift`; capability absence → the generic
`capability_missing`. The port-level `vua.vpm.*` family keeps existing
as an implementation-layer fact; the frozen
`vua.vpm.no_matching_package` (catalog face) stays untouched (core
ruling 82a39c4 point 4).

## Method faces

- `packages.previewInstall` — `kind: "query"`, two-key closed params
  `{ projectPath, packages }`. Result family const
  `vua.packages-ops/v0.2`; exactly the `kind=plan` arm (the
  `changePlan` shape: `items` with install and remove rows,
  `conflicts`, `removeLegacyFiles`/`removeLegacyFolders`,
  `destructive`, `digest`). Failures travel as wire-envelope errors,
  never result arms.
- `packages.applyInstall` — `kind: "command"` (`commandId`
  idempotency), three-key closed params (adds `confirmedDigest`).
  The task-terminal reflux answers exactly one of two arms:
  `kind=receipt` (the installReceipt variant, above) or
  `kind=rejected` (the typed guard refusal). Operation/kind lock:
  previewInstall answers plan only, applyInstall answers
  receipt/rejected only (machine-checkable at the schema layer).
- **The served capability row (wired, landed)**: one row,
  `packages.installOps`, serves both methods; its
  availability gates on the port's `VpmCapabilities.preview_install`
  bit (the frozen command schema's serving gate — one bit serving
  both A2 methods, the `packages.removeOps` A1 precedent). An engine
  wired without the install capability declared keeps the row
  honestly unavailable; an unwired engine answers
  `vua.packages.unavailable`. The `vua.project.project_not_found`
  reuse answers at the route layer as the envelope error (the
  rejected arm's code schema locks `^vua\.packages\.` — a reused 013
  code never enters a rejected document). The wire-route projection
  rules follow the A1 same path: the envelope-error face projects the
  known mappings (`package_not_found` / `preview_failed`) and passes
  word-out port codes through verbatim (the P1 discipline); the
  task face projects the known guards (`preview_drift` /
  `package_not_found`) and folds `apply_failed` plus every word-out
  port code into `execution_failed` carrying the original code inside
  `detail` as honest provenance (no invented fourth guard); the
  double-digest guard is enforced at the wire layer (the server
  re-computes the preview before execution — the authoritative
  verdict lives server-side, proposal-014 arbitration point 2; the
  backend's second comparison stays as defense in depth).

## Envelope, versions, and dependency direction

The wire envelope is the standing shape (the `schemaVersion` envelope
const `"0.2"` + `operation` + `result`); the result document carries
its own family const (`vua.packages-ops/v0.2`) — the two versions are
independent (the c914cf2 standing rule). The v0.1 removal methods
keep answering at the v0.1 word face; a v0.2 request is only the two
install methods (the v0.1 and v0.2 plan shapes share the same key
set — consumers narrow by the `schemaVersion` literal, not by keys
alone). Dependency direction unchanged: renderer → typed Gateway →
Electron main (verbatim pass-through) → versioned application
contract → provider wire face → the `VpmBackend` port → the
project-manager adapter. Framework and vendor types stay in adapters;
the word list transports facts.

## Machine-readable word list

- `schemas/packages-ops/v0.2/command.schema.json` +
  `result.schema.json` + `examples/` (4 positive / 9 negative)
- Consumer tests:
  `crates/provider-host/tests/packages_ops_consumer_v02.rs`
  (schema vectors + the port→wire projection loop incl. the
  conflict-triggered remove row + the capability-absence word face +
  the drift-recoverable word face pinned);
  `crates/provider-host/tests/packages_ops_wire_v02.rs` (11 wire
  route cases riding the real frame loop: honest absence / the plan
  envelope projection / the reused 013 code / the closed param
  violations / capability absence / the two-code envelope projection /
  the receipt Done payload / the drift refusal / the
  execution_failed provenance / the route-layer refusal);
  `packages/contracts/src/application-contract.test.ts` (TS narrowing
  of the closed request rows); the `packages/orchestrator-provider`
  mock constant-absence arms (the simulation never simulates wire
  write receipts)

## Honesty boundaries and open items

- **The word face is wired (v0.2.1 honest update).** Both wire route
  arms + the `packages.installOps` served row are in the tree:
  `packages.previewInstall`/`packages.applyInstall` exist on the wire
  face, and the route behavior is pinned by the 11
  `packages_ops_wire_v02.rs` cases riding the real frame loop. The
  pre-wiring honest-absence rules still serve engines that do not
  declare the `preview_install` capability (the served row honestly
  unavailable, the methods answering `vua.packages.unavailable` /
  `capability_missing` — the capability face never lies). Desktop
  `blocks.changes` write entries upgrade per the A2 consumption slice
  (fixture shapes are never moved into live — the #22/#36 lessons,
  twice on record); wired is not end-to-end: the real-machine
  walkthrough stays with W25 (awaiting the user window
  O-2).
- **Cache degradation is a documented behavior, not a transported
  fact (this face).** The preview may be computed against the package
  cache after a failed online refresh; the digest binding and the
  server-side re-computation keep execution safe (drift refuses). The
  apply phase does not degrade. A transported disclosure, if ever
  needed, follows the 025 `cacheSourced` increment precedent.
- The environment implementation-verification slice
  (`VrcGetLibBackend` `preview_install`/`apply_install` already in the
  tree, per the 024/025 procedure: implementation + targeted tests +
  wire-alignment evidence) lands after the wiring batch; the full
  port-code → closed-set projection mapping declaration rides that
  slice.
- Desktop consumption follows the per-face upgrade procedure (stance
  93752d5 item 3); A3 `register_local_package` is the next face in
  the frozen order (A1 → A2 → A3 → A4 add/remove first → A5 last per
  the A5 start ruling 8afde3f).
