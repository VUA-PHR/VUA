# packages-ops Protocol v0.1 (packages P3 write face, first frozen slice A1 = removal: packages.previewRemove + packages.applyRemove)


> Document version: 0.1.1
> Status: **Frozen (packages P3 write face, A1 removal word-list row;
> v0.1.1 wiring batch landed, zero word-face change)**
> (2026-09-19, proposal 026 A1 core freeze batch: stance-program
> convergence — core ruling 82a39c4 five points, environment library
> study 4a0f02f zero implementation gap, desktop stance 93752d5 three
> items; this batch lands the authoritative word face)
> Machine-readable word list: `schemas/packages-ops/v0.1/` (per-row
> dual schemas + 4 positive / 8 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_ops_consumer.rs`; TS guard
> tests `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.previewRemove` (synchronous read-only change
> preview) and `packages.applyRemove` (nine-state task-driven removal
> write command under the double-digest guard)
> Ownership boundary: word-list freeze, port face (`VpmBackend` write
> method family already in the tree), and wire routing = core domain
> (wiring slice landed as v0.1.1); the `VpmBackend` library
> implementation (project-manager, `preview_remove`/`apply_remove`
> already in the tree) = environment domain (implementation
> verification slice per the 024/025 procedure); desktop consumption =
> desktop domain (per-face upgrade, `blocks.changes` evolution per
> desktop stance 93752d5 item 3)
> Updated: 2026-09-19 (v0.1 freeze batch: dual schemas + vectors +
> core consumer tests + TS face + bilingual protocol doc + REGISTRY)
> Updated: 2026-09-19 (v0.1.1 wiring batch: the two wire route arms +
> the `served_capabilities` row `packages.removeOps` + the port-code
> projection landed; zero word-face change — word list, schemas,
> vectors, TS face untouched; route/projection tests
> `crates/provider-host/tests/packages_ops_wire.rs` 10 cases)

## A1 write-face semantics (the two-verb pair and the nine-state task)

Face-order authority (core ruling 82a39c4 point 1): A1 removal → A2
install/upgrade → A3 register_local_package → A4 repo-subscription
writes last. A1 is the smallest-risk face of the write family (no
network, no dependency resolution, double-digest guard already in the
tree) and sets the program template: the per-face landing shapes of
task nine-stateness, the confirmation chain, the audit receipt, the
recovery semantics, and the error-code family all follow this batch
(014 import-copy precedent, isomorphic).

- **preview = synchronous read-only query.** `packages.previewRemove`
  computes every change the removal would make (`items` covers
  transitive dependency removals — ORC-WF-002: the plan must cover
  every change the backend will make) and produces the digest
  fingerprint (`digest`, FNV-1a over the canonical item list). The
  preview never mutates anything; its failures travel as wire-envelope
  errors (not result arms).
- **apply = the nine-state task-driven write command.**
  `packages.applyRemove` must carry `confirmedDigest` (the preview
  digest the user confirmed); the server re-computes the preview at
  apply time and refuses on any drift (ORC-WF-003/004 double-digest
  discipline; the desktop may pre-hint but the authoritative verdict
  lives server-side — proposal-014 arbitration point 2 precedent).
  Nine-state task semantics (`commandId` idempotency, cancellable,
  events + revision, `waiting_for_input` parked on
  "preview-complete-awaiting-confirmation") ride the application
  contract's task surface, not this word list.
- **Recovery = re-inspect, never implicit resumption (honesty rule
  3).** Non-terminal residue of an interrupted/failed apply task is
  re-inspected and surfaces as `inspect_required`; the retry semantics
  = the user explicitly re-previews and re-confirms (the 014
  "clean-then-redo" precedent, on the removal face = redo the
  confirmation chain), never a silent resumption. Digest-drift refusal
  is a recoverable conflict (the port implementation's `PREVIEW_DRIFT`
  `.with_recoverable(true)` is on record).
- **Closed params.** `projectPath` = the proposal-013 registered
  identity (an unregistered path answers the typed code
  `vua.project.project_not_found` — same fact, same code, 024 P1
  precedent); `packageIds` = the explicit non-empty closed list
  (`minItems 1` + `uniqueItems`) — no wildcard, no "remove everything"
  shorthand; the preview params carry NO digest slot (the digest is
  the preview's product; carrying one is a shape violation).

## The audit receipt (core ruling point 3, frozen with this batch)

`kind=receipt` follows the proposal-014 import-receipt precedent =
change list + actual result: `confirmedDigest` (the user-confirmed
digest echoed back — the audit link between the confirmation face and
the executed result) + `requestedPackageIds` (the explicit request
list, verbatim) + `removedItems` (the change items the backend
actually removed, the port's `apply_remove` `{removed: items}`
projected verbatim). Task correlation lives on the task surface
(`taskId`/`revision`); the receipt is a reflux payload, not a
persisted link. Invented facts with no port carrier (post-removal
re-inspection, byte counts, timestamps) are INVALID by schema — the
false-assertion guard, not merely discouraged.

## The vua.packages.* error-code family (A1 first face, closed set stands as written)

Three new codes (guard value = code suffix, frozen schema pattern
`^vua\.packages\.`; the closed set lands with this batch, A2+ faces
extend it through their own freeze batches):

| guard | code | fact |
| --- | --- | --- |
| `preview_drift` | `vua.packages.preview_drift` | double-digest guard refusal (confirmed digest ≠ server re-computation; recoverable conflict) |
| `package_not_found` | `vua.packages.package_not_found` | a requested package is not in the project's installed set |
| `execution_failed` | `vua.packages.execution_failed` | the apply phase failed (ExternalFailure class) |

Reused, zero new (declared): `vua.project.project_not_found`
(unregistered projectPath), `vua.packages.invalid_params` (request
shape violation), `vua.packages.unavailable` (honest absence of an
unwired engine) — all already in the tree (013/024). The port-level
code family `vua.vpm.*` (`PREVIEW_DRIFT`/`APPLY_FAILED`/
`PACKAGE_NOT_INSTALLED` etc.) is an implementation-layer fact and
keeps existing; the projection of those onto this closed set is
declared with the environment implementation-verification slice. The
existing frozen code `vua.vpm.no_matching_package` (consumed by the
catalog face) stays untouched (core ruling 82a39c4 point 4).

## Method faces

- `packages.previewRemove` — `kind: "query"`, two-key closed params
  `{ projectPath, packageIds }`. Result family const
  `vua.packages-ops/v0.1`; exactly the `kind=plan` arm: `items`
  (change rows, closed set `kind`/`packageId`/`version`/`reason` —
  `version`/`reason` nullable, null = the port Option projected
  verbatim), `conflicts` (free-text dependency-breakage warnings —
  the confirm UI must warn), `removeLegacyFiles`/
  `removeLegacyFolders` (legacy files/folders the removal would
  sweep), `destructive` (true when conflicts or legacy cleanups are
  non-empty, ADR-0006), `digest`.
- `packages.applyRemove` — `kind: "command"` (`commandId`
  idempotency), three-key closed params (adds `confirmedDigest`).
  Result family const as above; the task-terminal reflux answers
  exactly one of two arms: `kind=receipt` (the audit receipt, above)
  or `kind=rejected` (a typed guard refusal: the three-value `guard`
  closed set + `code` + `detail`). Operation/kind lock:
  previewRemove answers plan only, applyRemove answers
  receipt/rejected only (machine-checkable at the schema layer).
- **The served capability row (v0.1.1 wiring batch)**: one row,
  `packages.removeOps`, serves both methods; its availability gates on
  the port's `VpmCapabilities.remove_packages` bit (the frozen command
  schema's serving gate). An engine wired without the removal
  capability declared keeps the row honestly unavailable; an unwired
  engine answers `vua.packages.unavailable`. Preview-phase failures
  travel as wire-envelope errors (the one known port fact projects onto
  the closed set: `package_not_installed` →
  `vua.packages.package_not_found`; unknown port codes pass through
  verbatim per the P1 read-face precedent); every refusal inside the
  apply task projects onto the rejected closed set (unknown port codes
  fold into `execution_failed` with the original port code inside
  `detail` as honest provenance — never a fabricated fourth guard);
  the reused `vua.project.project_not_found` code answers at the route
  layer as the envelope error (the rejected arm's code schema locks
  `^vua\.packages\.` — a reused 013 code never enters a rejected
  document).

## Envelope, versions, and dependency direction

The wire envelope is the standing shape (the `schemaVersion` envelope
const `"0.1"` + `operation` + `result`); the result document carries
its own family const (`vua.packages-ops/v0.1`) — the two versions are
independent (the c914cf2 standing rule). Dependency direction
unchanged: renderer → typed Gateway → Electron main (verbatim
pass-through) → versioned application contract → provider wire face →
the `VpmBackend` port → the project-manager adapter. Framework and
vendor types stay in adapters; the word list transports facts.

## Machine-readable word list

- `schemas/packages-ops/v0.1/command.schema.json` +
  `result.schema.json` + `examples/` (4 positive / 8 negative)
- Consumer tests: `crates/provider-host/tests/packages_ops_consumer.rs`
  (schema vectors + the port→wire projection loop + trait default
  absence arms + the drift-recoverable word face pinned);
  `packages/contracts/src/application-contract.test.ts` (TS guard
  closed set); the `packages/orchestrator-provider` mock
  constant-absence arms (the simulation never simulates wire write
  receipts)

## Honesty boundaries and open items

- **The wire routes are wired (v0.1.1 wiring batch, 2026-09-19).**
  The route arms for `packages.previewRemove`/`packages.applyRemove`,
  the `served_capabilities` row (`packages.removeOps`, gated on
  `remove_packages`), and the envelope assembly have landed
  (`crates/provider-host/src/provider_host.rs`; route/projection tests
  `crates/provider-host/tests/packages_ops_wire.rs` 10 cases, run
  green). The desktop consumption side still follows the per-face
  upgrade procedure: until its consumption slice lands, the
  `blocks.changes` write entries stay type-level invisible (fixture
  shapes are never moved into live — the #22/#36 lessons, twice on
  record). Zero end-to-end claim maintained: the wiring batch is the
  wire face inside the provider process; the real-machine walkthrough
  stays with W25 (awaiting the user window O-2).
- The environment implementation-verification slice
  (`VrcGetLibBackend` `preview_remove`/`apply_remove` already in the
  tree, per the 024/025 procedure: implementation + targeted tests +
  wire-alignment evidence) lands after the wiring batch; the full
  port-code → closed-set projection mapping declaration rides that
  slice.
- Desktop consumption follows the per-face upgrade procedure (stance
  93752d5 item 3: the A1 freeze batch unlocks the matching write
  entries; the freeze batch is the single authority for that face's
  live shape); zero end-to-end claim: real-machine walkthrough stays
  with W25 (awaiting the user window O-2).
- `create_project` is not in the P3 face order (core ruling 82a39c4
  point 5: reserved as A5, start condition = a desktop entry-point
  demand; the A5 start ruling has landed — see the per-tree state
  files and BOARD row #40); A4 repo-subscription writes await the
  add/remove vs enable/disable split convergence (environment leans
  add/remove first; enable/disable awaits real-machine verification of
  the VCC key name).
