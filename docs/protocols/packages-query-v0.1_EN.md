# packages-query protocol v0.1 (packages read-face word-list row: packages.listInstalled)

[English](packages-query-v0.1_EN.md) | [简体中文](packages-query-v0.1_ZH.md)

> Document version: 0.1
> Status: **Frozen (package-management P1 read-only word-list row)**
> (2026-09-17, proposal 024 P1 core freeze batch: three-domain stance
> convergence + core rulings, see "Freeze close-out")
> Machine-readable word list: `schemas/packages-query/v0.1/` (single-method
> schemas + 3 positive + 3 negative vectors; library-level consumer test
> `crates/provider-host/tests/packages_query_consumer.rs`; TS consumer test
> `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.listInstalled` (read-only installed-package listing of
> one project); the project list reuses the 013 face `project.listProjects`
> (one registered-fact source, no second word list)
> Ownership boundary: word-list freeze and wire routing = core domain;
> the `VpmBackend` library implementation (project-manager) = environment
> domain; desktop consumption (PackagesPort P1 projection) = desktop domain
> (stance ab02215: consumption batch follows the freeze batch, notRun
> presentation holds until the implementation slice lands)
> Updated: 2026-09-17 (v0.1 freeze batch: bilingual protocol doc + REGISTRY
> registration)

## P1 read-face semantics (phasing)

Proposal 024 has three phases: P1 read face (this batch), P2 repo/catalog
face (awaiting the environment backend-extension proposal — environment
stance 62b4989 confirmed feasible and pickup-ready), P3 change face (per
proposal 013 R5, separate per-face proposals). After P1 the package-manager
page settles into the desktop-stanced **intermediate honest state**:
"installed packages visible, change face unavailable" — the project list
and installed packages are real data; repo lists, version enumerations,
update semantics, and the two-phase change flow stay honestly unavailable,
unusable entry points are not rendered, and no empty repo list is invented.

## Freeze close-out (proposal 024 preconditions, item by item)

- **Three-domain stance convergence**: desktop (024 inline "desktop stance"
  section, wt-3 ab02215 — phasing picks the P1 intermediate honest state +
  PackageRow degraded-projection false-assertion guard + error-code reuse);
  environment (62b4989 landed via 0f82da3, inline section mirrored on its
  tree — P2 feasible and pickup-ready + registry **not the same store**
  [vcc.liteDb vs settings.json/ALCOM] + P1 list reuses the 013 aggregate +
  validation same-caliber as inspectProject); integration (70th batch
  ae6eca6 — gate sequence within T-A authorization, 014 precedent +
  registration as bidirectional references + dead anchor issue #25 not
  created);
- **Schema + positive/negative vectors**: `schemas/packages-query/v0.1/`
  (this batch);
- **At least one consumer test**: the core-domain consumer test
  `crates/provider-host/tests/packages_query_consumer.rs` (4 cases: frozen vectors
  drive both schemas + library projection against the result schema +
  honest empty listing + typed failure on a broken manifest) + the TS
  contract guard (`@vua/contracts` packages.listInstalled closed-set
  positive/negative cases); the wire frame-loop test follows with the
  implementation slice;
- **Bilingual protocol doc + REGISTRY**: this file + EN mirror + two
  REGISTRY rows (this batch).

## Core rulings (open questions, settled)

1. **No second project-list word list**: the P1 project list reuses 013
   `project.listProjects` (the VCC+ALCOM aggregate, schema frozen);
   `packages.listInstalled` validates `projectPath` same-caliber as
   `project.inspectProject` — the 013 aggregate face IS this word list's
   world; an off-aggregate path answers the typed not-found. **Honest
   registration of registry non-identity** (environment code facts):
   `VpmBackend::project_registry` reads `vcc.liteDb` while the 013
   aggregate reads VCC `settings.json` + ALCOM settings — same environment
   root, different files; a path registered only in liteDb may be invisible
   to the 013 face (vrc-get 0.0.16 source note vpm_settings.rs:25–33 says
   userProjects will migrate away). Actual divergence is a real-machine
   fact, read-only check due in W25; convergence, if needed, goes through
   a separate 013 version-up proposal (an environment-domain file, **not
   piggybacked on P1**).
2. **Error-code reuse**: an unregistered projectPath reuses
   `vua.project.project_not_found` (same-fact-same-code principle first:
   this word list's registration validation IS the 013 aggregate semantics;
   two codes for one fact add nothing); `vua.vpm.capability_missing` stays
   as-is in the port; the `vua.packages.*` family starts in P1 with only
   the absence arm and the params arm — packages-specific fact codes (repo
   health, digest-guard refusals) belong to P2/P3 with their own freeze
   batches, avoiding a code family that idles forever (desktop stance
   adopted).
3. **Zero P2 fact fields in the P1 word face**: no `source`/`versions`/
   `compatible`/`updateAvailable`/`latestVersion`/`changelogUrl`/
   `displayName` — the first six are P2 repo/catalog facts; displayName
   exists in each package's package.json, but the port projection type
   (core domain) and the producer implementation (environment domain,
   project-manager) live in two ownership domains, so the P1 word list
   reserves **no field without a producer** (the field-face analogue of
   the ORC-DEV-004 discipline); P1 desktop consumption renders packageId
   as the display name (its stated reading is self-consistent). The row's
   `additionalProperties: false` is the **false-assertion guard**: a result
   carrying invented fields is INVALID by schema, not merely discouraged.
4. **Honest empty listing**: a registered project with zero installed
   packages answers an empty `packages` array — valid and honest; a broken
   or unreadable manifest answers the typed failure
   (`vua.vpm.project_load_failed`), never an empty list masquerading as a
   successful read (honesty discipline 1/2).

## Method face

| Method | Kind | Semantics | Consumer |
| --- | --- | --- | --- |
| `packages.listInstalled` | Query (read-only) | Returns the installed package set of one registered project — the row projection the backend reconciles from its VPM manifest + lock against the Packages tree (packageId ascending) | Package-manager page P1 intermediate honest state (desktop consumption batch awaits the implementation slice) |

params closed set, single key: `projectPath` (`minLength 1`; the 013
registered identity, same family as `project.inspectProject`);
`additionalProperties: false` — an off-word-list parameter answers the
`vua.packages.invalid_params` validation envelope (a shape violation never
masquerades as an absence).

## Result document

- The envelope follows the standing command-face shape: `schemaVersion`
  (const `"0.1"`, the word-list-row family version constant) +
  `operation` + `result`; the `result` body carries its own family const
  `vua.packages-installed/v0.1` — the two versions are independent (the
  c914cf2 standing rule: every wire row cites a version constant of its
  own);
- `result` closed set, three keys: `schemaVersion` (family const),
  `projectPath` (echoed), `packages` (the row array);
- Row closed set, three keys: `packageId`, `version`, `dependencies`
  (direct-dependency id array) — sorted by `packageId` ascending (a frozen
  deterministic presentation fact consumers may rely on; deterministic,
  not semantic).

## Error-code closed set and absence semantics

| Code | Category | Semantics |
| --- | --- | --- |
| `vua.packages.unavailable` | unavailable | Route/VpmBackend unwired = **honest absence** — never folds into a fabricated listing or a fabricated empty array |
| `vua.packages.invalid_params` | validation | params closed-set violation (a shape violation never masquerades as an absence) |
| `vua.project.project_not_found` | validation | projectPath not on the 013 aggregate registered face (**reuses the 013 code**: one fact, one code; same caliber as `project.inspectProject`) |
| `vua.vpm.capability_missing` | unavailable | The wired backend does not declare the `list_packages` capability bit (existing port code maintained) |
| `vua.vpm.project_load_failed` | external_failure | The backend failed to load the project (broken/unreadable manifest) — a typed failure, never an empty list masquerade |

Capability row: `served_capabilities` gains a `packages.query` row whose
availability flips with the presence of an assembled `VpmBackend` instance
(no assembly = honest absence, `5eeec28` same caliber) — landing with the
implementation slice.

## Dependency direction

```text
React View (package-manager page P1 intermediate honest state, desktop consumption batch)
  -> typed feature/Gateway (PackagesPort)
  -> Electron preload and main-process adapter
  -> versioned application contract (packages.listInstalled row + packages.query capability row)
  -> provider-host routing (core domain, implementation slice)
  -> VpmBackend port (core domain, orchestrator)
  -> VrcGetLibBackend library implementation (environment domain, project-manager; the list_packages fact source)
```

## Machine-readable word list

`schemas/packages-query/v0.1/`: `command.schema.json` +
`result.schema.json` + `examples/` (positive 3 — request closed single key
/ a three-package result / the honest empty-listing result; negative 3 —
missing projectPath / empty projectPath / an off-word-list params key [the
prerelease toggle is P2 semantics] / a row carrying the invented field
`updateAvailable` [the false-assertion guard, pinned]). Consumer tests on
two carriers: `crates/provider-host/tests/packages_query_consumer.rs` (4 cases) +
`packages/contracts/src/application-contract.test.ts` (TS guard closed-set
cases, 3 assertions). Any word-list or field change must bump the version;
in-place rewriting is never allowed.

## Open items

- Wire routing + capability row + bin assembly (core-domain implementation
  slice): immediately follows this freeze batch;
- Desktop consumption batch (PackagesPort P1 projection + the
  PackagesView block-availability annotation shape for desktop review):
  awaits the implementation slice;
- The environment-domain `list_packages` projection slice (displayName, if
  P2 needs it, enters formally with the PackageCollection port upgrade);
- The read-only real-machine check of vcc.liteDb vs the 013 aggregate
  registered-set divergence: due in W25 (O-2);
- P2 repo/catalog face: awaits the environment backend-extension proposal
  (the environment stance confirmed pickup-ready); P3 write faces follow
  proposal 013 R5, separate per-face proposals. The end-to-end claim stays
  at zero — this batch promises no runtime behavior change until the
  implementation slice is accepted.
