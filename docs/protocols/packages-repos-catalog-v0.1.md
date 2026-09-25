# packages-repos / packages-catalog protocol v0.1 (packages P2 read-face word-list rows: packages.listRepos + packages.packageCatalog)


> Document version: 0.1
> Status: **Frozen (package-management P2 read-only word-list rows)**
> (2026-09-17, proposal 025 P2 core freeze batch: stance program converged
> — environment proposal 64bfe58, integration stances 7a50ce9, desktop
> stance 0031004, core direction rulings bf78368; this batch settles the
> authoritative word face)
> Machine-readable word list: `schemas/packages-repos/v0.1/` +
> `schemas/packages-catalog/v0.1/` (per-method schemas + 3 positive/3
> negative and 4 positive/4 negative vectors; core consumer test
> `crates/provider-host/tests/packages_p2_consumer.rs`; TS consumer test
> `packages/contracts/src/application-contract.test.ts`)
> Scope: `packages.listRepos` (repo subscription list, the subscription
> face as the world) and `packages.packageCatalog` (per-package catalog
> facts in one registered project's context, on-demand granularity)
> Ownership boundary: word-list freeze, port face (`VpmBackend` catalog
> accessor + methods), and wire routing = core domain; the `VpmBackend`
> library implementation (project-manager) = environment domain (its
> implementation slice follows this freeze batch); desktop consumption =
> desktop domain (stance 0031004: P2 consumption slice hard prerequisites
> = word face frozen + TS face registered + shape approval, per the P1
> full-chain procedure)
> Updated: 2026-09-17 (v0.1 freeze batch: dual schemas + vectors + core
> consumer tests + TS face + bilingual protocol doc + REGISTRY registration)

## P2 read-face semantics (phasing and what P2 deliberately is not)

Proposal 024/025 phasing: P1 read face (frozen, `packages.listInstalled`),
P2 repo/catalog face (this batch), P3 change face (per proposal 013 R5,
separate per-face proposals). The converged open-question-4 ruling keeps
the same discipline here: **repository enable/disable, add/remove, and the
proactive network refresh (`update_cache`) are WRITE faces — they do not
exist in this family** and follow the 013 R5 per-face independent-proposal
path (task nine-states, confirmation chain, audit, recovery semantics each
required). P2 is read-only by design.

The health face is a **P2 non-goal**: the library carries no health fact
carrier (`VrcGetMeta` is etag-only — no timestamps, no error state, no
reachability), so no health/status/lastRefreshed word exists and a result
carrying one is INVALID by schema, not merely discouraged. Per-repo
cache-existence is covered honestly by the required `cached` fact.

## Core rulings (open question 1, settled in the freeze batch)

1. **Repo-list world = the subscription face** (the user's configuration
   fact, settings `userRepos` projected verbatim, array order preserved).
   The refresh-derived cache face appears only as the per-row `cached`
   fact. "Subscribed but never refreshed" is an honest listed row
   (`cached=false`), never hidden, never rendered as an empty catalog.
2. **Catalog granularity = per-query on demand.** No full-catalog
   projection, no pagination semantics — thousands-scale caches never ride
   this face; more packages means more queries.
3. **updateAvailable judgment (P1 desktop header-note leftover carried).**
   Conclusion-only: this project's installed version vs the latest
   compatible version (`find_package_by_name` +
   `VersionSelector::latest_for`); compared in the implementation domain;
   prerelease inclusion reads the user's `show_prerelease_packages`
   setting — no wire switch exists. `null` = judgment not executed (not
   installed in this project, or project Unity version unknown) —
   **absence is not "no update"**; consumers keep the P1 defense (no
   update UI rendered on null, never a default false).
4. **Capability declaration = one separate defaulted accessor**
   (`VpmBackend::catalog_capabilities() -> CatalogCapabilities`, default
   declared-none). The five-bit `VpmCapabilities` closed set stays stable;
   a backend overrides the default exactly when it implements the P2
   methods (ORC-DEV-004: no implementation, no reservation). The wire
   `served_capabilities` rows (`packages.listRepos` /
   `packages.packageCatalog`) flip with assembly and this declaration.
5. **Error codes: reuse only.** No new code is coined; the closed set for
   P2 reuses `vua.project.project_not_found` (unregistered path, same fact
   same code as 013), `vua.vpm.no_matching_package` (package absent from
   both repository caches and the local set — the consumer renders it as
   its own empty state, not an error page), `vua.vpm.project_load_failed`,
   `vua.vpm.capability_missing`, `vua.vpm.backend_unavailable`, and the
   transport-face `vua.packages.invalid_params` / `vua.packages.
   unavailable`.
6. **Stale disclosure adopted (implementation-slice face).** The offline
   degradation path (ORC-ADP-006 precedent) may stamp its cache-sourced
   results; whether and how that annotation rides the wire is settled with
   the environment implementation slice so the page never self-annotates
   freshness it does not have (desktop stance: no fact, no render).

## Method faces

- `packages.listRepos` — `kind: "query"`, params closed empty set (the
  subscription face is global configuration). Result family const
  `vua.packages-repos/v0.1`; rows carry four nullable identifier/location
  facts (null = the library Option projected verbatim; a local-directory
  repo has `url=null`) plus the REQUIRED `cached` boolean. Row order is
  the subscription face's own order (a frozen presentation fact; the
  consumer never re-sorts). An empty `repos` array is a valid, honest
  answer (zero subscriptions).
- `packages.packageCatalog` — `kind: "query"`, params closed two-key set
  `{ projectPath, packageId }` (projectPath = the 013 registered identity;
  the compatible judgment context — never a cross-project assertion).
  Result family const `vua.packages-catalog/v0.1`; body: `displayName`
  (nullable; null renders packageId as the display name per P1 ruling 3),
  `source` (`"repo" | "local"` two-state origin), `installed` (project
  fact; the desktop three-state presentation composes source × installed
  — the word face never merges origin and installation),
  `updateAvailable` (conclusion-or-null per ruling 3), `versions`
  (repository-cache versions ascending by semver; EMPTY for a local-source
  package — an honest empty, not an error; each row `version` verbatim +
  `yanked` cache-carried fact + `compatible` boolean-or-null evaluated
  against the selected project's Unity version, null = version unknown,
  null is not incompatibility).

## Envelope, versions, and dependency direction

The wire envelope is the standing shape (`schemaVersion` envelope const
`"0.1"` + `operation` + `result`); each result document carries its own
family const (`vua.packages-repos/v0.1`, `vua.packages-catalog/v0.1`) —
the two versions are independent (c914cf2 standing rule). Dependency
direction is unchanged: renderer → typed Gateway → Electron main
(verbatim pass-through) → versioned application contract → provider wire
face → `VpmBackend` port → project-manager adapter. Framework and vendor
types stay in adapters; the word list transports facts.

## Machine-readable word list

- `schemas/packages-repos/v0.1/command.schema.json` +
  `result.schema.json` + `examples/` (3 positive, 3 negative)
- `schemas/packages-catalog/v0.1/command.schema.json` +
  `result.schema.json` + `examples/` (4 positive, 4 negative)
- Consumer tests: `crates/provider-host/tests/packages_p2_consumer.rs`
  (schema vectors + port→wire projection loop + trait-default absence
  arms); `packages/contracts/src/application-contract.test.ts` (TS guard
  closed sets)

## Honest boundaries and open items

- Real-backend consumption (`VrcGetLibBackend` implementing the two
  methods) is the environment implementation slice, landing AFTER this
  freeze batch with its own tests; until then `VccCliBackend` and every
  non-implementing backend answer `capability_missing` (honest absence,
  declared-none capability).
- The stale/cache-sourced wire annotation is settled with the environment
  implementation slice (ruling 6) — the word face above reserves no field
  for it.
- Desktop P2 consumption follows the P1 full-chain procedure (word face →
  TS face → shape approval → consumption slice); until the consumption
  batch lands and the user restarts the dev stack, the package-manager
  page holds its P1 intermediate honest state. No end-to-end claim is
  made: the real-machine walkthrough remains W25 (user-gated window O-2).
