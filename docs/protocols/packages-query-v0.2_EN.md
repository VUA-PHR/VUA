# packages-query Protocol v0.2 (the packages.listInstalled result family: installed-set update-awareness increment)

[English](packages-query-v0.2_EN.md) | [简体中文](packages-query-v0.2_ZH.md)

> Document version: 0.2.1
> Status: **Frozen (the packages-query result family v0.2 increment,
> 2026-09-20) and WIRED (the v0.2.1 core wiring batch, 2026-09-20): the
> route dual-arm negotiation and the named family constants are in tree —
> desktop consumption rides the per-face program after shape approval; the
> library implementation is the environment implementation-verification
> slice; until that lands every wired backend keeps answering the frozen
> v0.1 family (the trait-default `query_v02 -> false`).**
> (Freeze provenance: proposal 027 F3 freeze batch — core stance 3
> converged with environment verification s2 and desktop IA stance 3, face
> order F2->F3 registered at batches 121/122; the F2 freeze + wiring both
> in-library = the claim condition achieved [verified at batches 124/126].)
> Machine-readable word list: `schemas/packages-query/v0.2/` (command
> byte-for-byte identical to v0.1; result = v0.1 plus exactly three facts
> + 4 positive / 7 negative vectors; core consumer test
> `crates/provider-host/tests/packages_query_consumer_v02.rs`; wire route
> tests `crates/provider-host/tests/packages_query_wire_v02.rs` [the real
> frame loop]; TS face
> `packages/contracts/src/application-contract.ts`)
> Scope: only the **result family** of `packages.listInstalled` bumps to
> `vua.packages-installed/v0.2`. The command face is unchanged; the frozen
> v0.1 word face is never revised in place
> Ownership boundary: word-list freeze, port face, wire routing = core;
> the `VpmBackend` library implementation (project-manager) = environment
> (implementation-verification slice: `list_packages_v02` + the `query_v02`
> override); desktop consumption = desktop (shape approval + consumption
> batch: dual family-const admission + honest "updatable" column)
> Updated: 2026-09-20 (v0.2.1 wiring batch: route dual-arm negotiation +
> named family constants `PACKAGES_INSTALLED_SCHEMA_VERSION_V01/_V02` +
> wire tests 6 riding the real frame loop; word face ZERO change)

## Increment content (exactly three new facts)

The v0.2 result = the frozen v0.1 result **plus exactly three REQUIRED
facts**; nothing else moved (packageId-ascending order, the honest empty
listing, and the whole error face all continue per the frozen v0.1 word
face):

- The per-row judgment pair (REQUIRED, nullable, on every installed row):
  - `latestVersion` (string | null) = the latest-version fact found by the
    frozen selector. **Cross-repo max**: the judgment merges across the
    collection's WHOLE repository set taking the highest qualifying version
    (the library's `find_package_by_name` semantics) — deliberately NOT
    the F2 per-repo view (per-repo grouping is the packages-repo-catalog
    family's declared fact); the two views are different facts, declared in
    their own word faces, **never conflated**. null = no qualifying latest
    under the current setting (a local-source package sits in no repository
    cache, or every candidate is yanked/excluded by the user's setting) —
    **absence is never "no update"**.
  - `updateAvailable` (boolean | null) = the frozen judgment **CONCLUSION**
    (a strictly newer version matching the current filter exists). null =
    the judgment was NOT executed (no qualifying latest, or the project's
    Unity version is unknown) — **null is never rendered as "already
    latest"** (the 024 stance-2 false-assertion line, reaffirmed by the
    user ruling 2026-09-20), never filled with a default false.
- The document-level disclosure: `cacheSourced` (boolean, REQUIRED) = the
  packages-catalog v0.2 precedent (the ORC-ADP-006 isomorphic shape):
  true = this listing's judgment rode the **cache-degradation path**
  (offline -> `load_cache`, or an online load failed and degraded); false =
  served from an online-refreshed load. Informational, never an error;
  consumers render a "cached data" annotation and never fabricate the
  annotation for a v0.1 answer that carries no such field.

## Judgment semantics (the two semantic boundaries, settled)

The selector **reuses verbatim** the packages-catalog family's frozen
semantics: `latest_for(project Unity version, show_prerelease user
setting)`, zero wire switch (the setting is server-side user config; no
invented preference field). The two semantic boundaries settle per the
environment verification (027 research section s2):

1. **Cross-repo max vs the per-repo view**: this face's judgment merges
   across repositories taking the highest version; when the same package
   lives in several repositories, the latest may come from a different
   repository than the F2 per-repo view shows. The F2 word face declares
   "per-repo grouping, never a cross-repo merge"; this word face declares
   the symmetric "cross-repo merge, highest wins" — two separate views,
   not conflicting, never conflated.
2. **Installed prerelease + setting off — the `false` semantics**: when
   the installed version is itself a prerelease and
   `show_prerelease_packages=false`, the qualifying latest comes from the
   stable set only. `updateAvailable:false` then means exactly "no
   strictly newer version matching the CURRENT filter exists" — **not** a
   generalized "no update exists"; consumers must not read `false` as any
   assertion beyond the filter's own scope. latestVersion and
   updateAvailable travel as a pair, keeping the judgment boundary always
   readable.

## Determination cost and latest_for reuse (settled with this batch)

The judgment is pure in-memory and **batch-feasible** (027 research s2
cost conclusion): the whole table's judgments ride **ONE** collection load
(the same cache face and fact source as the F2/catalog judgment); **per-row
collection reloads are not a legal implementation shape of this face**.
The latest_for selector reuse degree = **full reuse** (the selector, the
prerelease-setting read, and the Unity-version binding are verbatim the
same source as the catalog judgment); no second judgment semantics is
created.

## Dual-version negotiation (purely additive, zero breakage)

- The port face gains **defaulted members** (zero compile ripple):
  `VpmBackend::query_v02() -> bool` (default false — overridden exactly
  when the v0.2 method is implemented, ORC-DEV-004: no implementation, no
  reservation) and `list_packages_v02(...) -> Result<InstalledListingV02,
  AppErrorV1>` (default absence arm `capability_missing`);
  `InstalledPackageV02` = all `InstalledPackageV1` keys +
  `latest_version` + `update_available`; `InstalledListingV02` = the rows
  + `cache_sourced`.
- The wire route **negotiates two arms (wired, landed with the v0.2.1
  wiring batch)**: a backend declaring v0.2 answers the
  `vua.packages-installed/v0.2` family; any other backend keeps answering
  the frozen `vua.packages-installed/v0.1` family. The face-level gate
  (`capabilities().list_packages`) precedes the negotiation — without the
  face there is no word face at all, whatever its generation; the shared
  P1 preconditions (013 registration reuse, closed params, verbatim typed
  refusals) likewise precede and serve both arms unchanged. The family
  const and projectPath are stamped by the route at envelope assembly (the
  P1 discipline: envelope facts are the route's, backend facts verbatim) —
  the consumer reads the family const to know which word face answered,
  **never a guess**. A v0.1-shaped row is INVALID under the v0.2 schema
  (missing REQUIRED keys) — the version increment is machine-detectable
  (pinned by the consumer test and the wire tests).
- **Wire family constants (named at the v0.2.1 wiring batch, the
  A3/A4/A5/F2 precedent)**: the result family consts
  `PACKAGES_INSTALLED_SCHEMA_VERSION_V01 = "vua.packages-installed/v0.1"`
  and `PACKAGES_INSTALLED_SCHEMA_VERSION_V02 = "vua.packages-installed/v0.2"`
  are published from `vua_provider_host::provider_host` — consumers key on
  the core-owned constants, never private literals; the route stamps the
  family const on the result document at envelope assembly, never the
  backend. The envelope stays on the standing shared const
  `PACKAGES_QUERY_SCHEMA_VERSION = "0.1"` (the catalog v0.2 precedent:
  only the result family moved; the frozen v0.2 command schema locks the
  same envelope generation).
- The standing envelope shape is unchanged (the `schemaVersion` envelope
  const `"0.1"` + `operation` + `result`; the c914cf2 rule: the family
  version is independent of the envelope version).
- **Zero new error codes**: registration validation reuses
  `vua.project.project_not_found`, shape violations
  `vua.packages.invalid_params`, capability absence
  `vua.vpm.capability_missing`, backend typed failures travel verbatim —
  all per the frozen v0.1 face; the negotiation adds no error code.

## Backend-root facts (the 027 checkpoint 8)

- **Installed-set fact root**: the target project's
  `Packages/vpm-manifest.json` + lock (the frozen P1 fact source,
  unchanged).
- **Latest-judgment data-source root**: the repository-cache collection
  face under ONE environment root — settings.json `userRepos` +
  `Repos/vrc-official.json` + `Repos/vrc-curated.json` (subject to their
  ignore switches) + each `userRepos[i].localPath` cache; the prerelease
  toggle reads the same settings.json `show_prerelease_packages`.
- **Production wiring** = the user's real VCC shared home (the
  024/026-U14 registered fact); the face is READ-ONLY over it (never
  writes settings/caches/projects; the online refresh is an
  etag-conditional fetch, same-origin as VCC/vrc-get themselves).
- **Test isolation** = the `VrcGetLibBackend::with_environment_root` temp
  root, synthetic data only (the implementation-verification slice's
  acceptance anchor follows the F2 precedent: re-derivable from the
  wiring code).

## Explicitly outside

- **No upgrade verb** (the 026 ruling stands): the update path is the A2
  install face's version=null resolver semantics; this face carries
  judgment facts only, never an execution verb.
- **No auto-update / no background refresh**: a read-only query that
  triggers no write; the refresh write face belongs to packages-ops (F4).
- **Zero wire switch**: prerelease inclusion follows the user's setting;
  no preference key is invented on the word face (the catalog frozen
  semantics continue).
- **The field ceiling holds**: source / versions / compatible /
  changelogUrl / displayName stay off this face (the per-package versions
  enumeration is the packages-catalog face's on-demand fact — a constant
  per-row repetition of the whole version table would defeat that
  granularity ruling; the displayName absence is the P1 ruling,
  ORC-DEV-004). An installed row carrying them is INVALID by schema (the
  false-assertion guard, pinned by negative vectors).

## Machine-readable word list

- `schemas/packages-query/v0.2/command.schema.json` (byte-for-byte
  identical to v0.1) + `result.schema.json` + `examples/` (4 positive /
  7 negative: positives cover the judged-true / judged-false /
  judgment-not-executed arms and the cache-degradation disclosure;
  negatives cover invented fields, missing REQUIRED keys, missing
  disclosure, and type violations)
- Consumer test: `crates/provider-host/tests/packages_query_consumer_v02.rs`
  (vector admission/refusal + trait-default absence arms + the fake
  backend port->wire projection with exact-key pins [all judgment arms +
  the ascending-order pin + the no-invented-fields pin] + the
  "v0.1 rows are invalid under the v0.2 schema" version-detectability pin)
- TS face: `packages/contracts/src/application-contract.ts`
  (`PackagesInstalledItemV02` + `PackagesListInstalledResultV02`; the
  command guard face is unchanged)

## Honest boundaries and open items

- **Core wiring slice (DONE, this v0.2.1 batch)**: the
  `packages.listInstalled` route dual-arm negotiation is in tree behind
  the named family constants; wire tests 6 ride the real frame loop
  (v0.2-family answer with every judgment arm pinned + the v0.1
  zero-regression family pin + the face-gate-before-negotiation pin +
  verbatim refusals on both arms + the shared P1 preconditions under a
  v0.2 backend + the const-detectability pin against the frozen schema
  consts).
- **Environment implementation-verification slice**: the
  `VrcGetLibBackend` `list_packages_v02` + `query_v02` override + the
  one-collection-load batch judgment + the offline-degradation
  cacheSourced arm + unit tests; the acceptance anchor = this protocol
  doc's backend-root-facts section, checked item by item.
- **Desktop shape approval + consumption batch**: the installed table's
  "updatable" column — the judgment facts come only from this word face;
  **no judgment fact (null) never renders "already latest", the column
  renders an honest empty**; cacheSourced renders a "cached data"
  informational annotation; the inline update key reuses the A2 install
  face's version=null semantics (desktop IA stance 3, as ruled).
- Zero end-to-end claims maintained: the route is wired, **not consumed**
  — no desktop surface reads the v0.2 family until the shape-approval +
  consumption batch lands, and the real-machine walkthrough stays W25
  (the user window O-2 pending).
