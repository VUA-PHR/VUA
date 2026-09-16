# packages-catalog protocol v0.2 (the packages.packageCatalog result family: the cacheSourced disclosure increment)

[English](packages-catalog-v0.2_EN.md) | [简体中文](packages-catalog-v0.2_ZH.md)

> Document version: 0.2
> Status: **Frozen (packages-catalog result-family v0.2 increment)**
> (2026-09-17, proposal 025 inline ruling: stance convergence —
> environment shape proposal A [implementation-slice declaration node],
> desktop stance clause 5 disclosure branch [0031004], core direction
> ruling 6 [bf78368], all three disclosure-ward; the core stance node and
> the freeze batch landed in the same round, stance first)
> Machine-readable word list: `schemas/packages-catalog/v0.2/` (command
> byte-identical to v0.1; result = v0.1 plus exactly one new REQUIRED key,
> with 4 positive and 5 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_p2_consumer.rs`; TS face
> `packages/contracts/src/application-contract.ts`)
> Scope: ONLY the `packages.packageCatalog` **result family** bumps to
> `vua.packages-catalog/v0.2`. The command face is unchanged; the
> `packages.listRepos` `vua.packages-repos/v0.1` family is unchanged (no
> field there, deliberately — see below); the frozen v0.1 word face is
> never revised in place
> Ownership boundary: word-list freezing, the port face, and the wire
> route = core domain; the `VpmBackend` library implementation
> (project-manager) = environment domain (incremental adaptation batch);
> desktop consumption = desktop domain (consumption-update batch:
> dual-family-const acceptance + the cacheSourced annotation)
> Updated: 2026-09-17 (v0.2 increment freeze batch: Schema + vectors +
> core consumer tests + TS face + bilingual protocol text + REGISTRY)

## The increment (exactly one new key)

The v0.2 result = the frozen v0.1 result **plus exactly one new REQUIRED
key, `cacheSourced`** (boolean); nothing else moved:

- `true` = THIS result was served through the **cache-degradation path**
  (offline → `load_cache`, or an online `load` failed and degraded — the
  ORC-ADP-006 isomorphic precedent);
- `false` = served from an online-refreshed load.
- **Informational, never an error**: cache sourcing is not a failure;
  consumers render an informational "cached data" annotation, never a
  failure state.
- **Zero-fabrication defense**: a v0.1 answer carries no such field —
  consumers never annotate cache sourcing on an answer that lacks the
  field (no fact, no render; desktop stance clause 5, second branch).
- `updateAvailable` is a judgment conclusion whose fact source can be
  affected by cache staleness — this disclosure exists exactly for that
  honest gap (the conclusion field itself is unchanged from v0.1).

## Dual-version negotiation (purely additive, zero breakage)

- The port face gains **defaulted trait items** (zero compile impact):
  `VpmBackend::catalog_v02() -> bool` (default false — overridden exactly
  when the v0.2 method is implemented; ORC-DEV-004: no implementation, no
  reservation) and
  `package_catalog_v02(...) -> Result<PackageCatalogV02, AppErrorV1>`
  (default absence arm `capability_missing`); `PackageCatalogV02` =
  every `PackageCatalogV01` key plus `cache_sourced`.
- The wire route **negotiates additively**: a backend declaring v0.2
  answers the `vua.packages-catalog/v0.2` family; a backend that has not
  adopted v0.2 keeps answering the frozen `vua.packages-catalog/v0.1`
  family. The family const is stamped by the route at envelope assembly
  (P1 discipline: envelope facts are the route's, backend facts travel
  verbatim) — consumers read the const to know which word face answered
  and **never guess**. A v0.1-shaped result is INVALID against the v0.2
  schema (missing the required key) — the version bump is
  machine-detectable, which is the very reason the increment versions the
  family instead of revising v0.1 in place.
- The standing envelope shape is unchanged (envelope const `"0.1"` +
  `operation` + `result`; the c914cf2 standing rule: family versions are
  independent of the envelope version).

## Why the repos family deliberately gets no field

`packages.listRepos` (the `vua.packages-repos/v0.1` family, untouched) is
a **zero-network read face** (subscription-face projection + per-repo
cache-hit checks, all local facts) — `cacheSourced` would be a permanent
false constant there. A constant informational field is not a fact and
gets no wire key (the honesty discipline of the health/status precedent:
fields without information are not invented).

## compatible semantics clarification (registered with this batch)

The `compatible` semantics (frozen in v0.1, carried into v0.2) = the
library's own full `unity_compatible` (vrc-get-vpm, the behavioral
authority) — **not** a reduced general branch (proposal 025 inline core
stance, caliber 2: within one response updateAvailable rides the
`latest_for` full-semantics chain, so the per-version field must share
the definition; Unity 6000 counterexample and the SDK 3.0–3.4 /
resolver ≤0.1.26 divergence cases live in the stance node). Zero
word-face change (the semantics were frozen as the library's full
semantics all along); the implementation face is corrected by the
environment incremental batch replicating all four branches with
divergence unit tests.

## Machine-readable word list

- `schemas/packages-catalog/v0.2/command.schema.json` (byte-identical to
  v0.1) + `result.schema.json` + `examples/` (4 positive incl. the honest
  cacheSourced=true degraded answer; 5 negative incl. the wrong-typed
  cacheSourced)
- Consumer tests: `crates/provider-host/tests/packages_p2_consumer.rs`
  (v0.2 schema vectors + the V02 port→wire projection loop + the
  declaration/default absence arms + the "v0.1-shaped result is invalid
  against the v0.2 schema" version-detectability pin)
- TS face: `packages/contracts/src/application-contract.ts`
  (`PackagesPackageCatalogResultV02`; the command guard face is
  unchanged)

## Honesty boundary and open items

- Environment incremental batch (project-manager): replicate the full
  `unity_compatible` four branches + divergence unit tests +
  `catalog_v02`/`package_catalog_v02` adaptation + the one-line
  cacheSourced fact contribution.
- Desktop consumption-update batch: dual-family-const acceptance in the
  live layer (currently pinned strictly to v0.1, packages-live.ts:149) +
  the cacheSourced=true "cached data" informational annotation + shape
  approval (the P1 full-chain procedure). Interim: the user dev stack has
  not been restarted (user window pending on record) — no real-machine
  exposure window.
- Zero end-to-end claim maintained: the real-machine walkthrough stays
  W25 (user window O-2 pending).
