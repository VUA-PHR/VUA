# packages-repo-catalog protocol v0.1 (the packages.repoCatalog read face: the per-repository installable-package inventory)

> Document version: 0.1
> Status: Frozen (proposal 027 F2 core freeze batch, 2026-09-20)
> Authority pair: this file and `packages-repo-catalog-v0.1_ZH.md` (single meaning, two languages).
> Word-face authority: `schemas/packages-repo-catalog/v0.1/` (command + result schemas and the
> example vectors). This document explains; the schemas bind.

## What this face is

`packages.repoCatalog` answers one question: **for each repository the backend collection
serves, what packages are installable from it?** One row per repository (identity, cache-hit
fact, and that repository's own package rows); one method, no pagination, no projection
switches.

The family partition is the proposal 027 open-question-1 ruling (core stance `58d1a0c`):

- The frozen `packages-catalog` family deliberately excludes repo-scale projections
  ("NO full-catalog projection — thousands-scale caches never ride this face"). THIS family is
  the projection that ruling reserved: the repo-scale inventory lives here, so the frozen
  catalog word faces stay untouched.
- The frozen `packages-repos` family is the subscription configuration face ("the subscription
  face is the world — NOT the refresh-derived cache"). This family is the cache-inventory
  projection; the two views name different facts and never merge.
- The world of THIS face is the backend collection's repository set: the predefined
  official/curated repositories (unless ignored through their switches) plus every subscribed
  user repository. A package present in several repositories appears under EACH of them — this
  face never merges repositories. The cross-repository latest judgment stays the
  packages-catalog family's declared fact; the per-repo view here and the cross-repo view there
  are both honest and are never conflated (environment verification 3bd4f12 s2, boundary 1).

## The word list (machine-readable)

- Method: `packages.repoCatalog` (kind `query`).
- Envelope: `schemaVersion` const `"0.1"`; result family const
  `vua.packages-repo-catalog/v0.1` (two independent versions — the c914cf2 standing rule).
- Params (closed two-key REQUIRED-nullable set, the 026 A5 idiom):

| key | type | meaning |
| --- | --- | --- |
| `repoId` | `string \| null` | `null` = every repository of the collection world; a non-null id scopes the answer to that one repository row. An id not present in the collection world answers the REUSED `vua.vpm.repo_not_found` (the A4 removeRepo same-fact precedent) — never an invented empty-shaped success. |
| `packageIds` | `string[] \| null` | `null` = browse-all; a non-null array is the batch requirement-set filter (the Recipe automation shape, user ruling 4). Unique non-empty ids; an EMPTY array is a shape violation, not an empty filter (there is no third state next to `null`). |

- Result (family `vua.packages-repo-catalog/v0.1`):
  - `repos[]` — per-repository rows in the collection's own enumeration order (no invented
    sort keys; consumers impose their own presentation order and machine-read by `packageId`).
    Each row: `repoId` (nullable), `name` (nullable), `cached` (REQUIRED boolean),
    `packages[]`.
  - `packages[]` rows: `packageId`, `displayName` (nullable), `description` (nullable),
    `latestVersion` (nullable), `versionCount` (integer >= 0).
  - `cacheSourced` — REQUIRED informational disclosure (born with this v0.1, adopting the
    packages-catalog v0.2 precedent at birth per the 027 core ruling).
- An EMPTY `repos` array is a valid, honest answer (zero repository caches). An empty
  `packages` array on a `cached: false` row is the subscribed-never-refreshed honest state; an
  empty `packages` array on a cached row under a filter is the honest "nothing matches here" —
  the filter is a lens, never an existence assertion, so `vua.vpm.no_matching_package` has NO
  reach on this face (single-package existence assertions belong to the packages-catalog face).

## Field semantics (the frozen judgments)

- `latestVersion` — the frozen per-repo judgment: this repository's newest version that is
  neither yanked nor excluded by the user's `show_prerelease_packages` server-side setting
  (a NO-wire-switch behavior, same as the catalog face), evaluated with NO project Unity
  constraint (the library selector's unity filter passes all when unconstrained).
  `null` = no version qualifies under the current setting; absence is not "no packages" and
  never renders as an error.
- `versionCount` — the repository cache's own inventory count of the package's version
  entries, yanked included: the cache fact as counted, not an availability promise.
- `displayName` / `description` — nullable honest projections of the library Options; a null
  displayName renders the packageId as the display name (P1 ruling 3), never posing as field
  fact.
- `cached` — the REQUIRED per-repo cache-hit fact (the 025 repos-face law carried over):
  `false` = subscribed but never refreshed, rendered with an EMPTY `packages` array — its own
  honest state, never hidden, never an error.
- `cacheSourced` — `true` = THIS result was served through the cache-degradation path
  (offline -> load_cache, or an online load failed and degraded — the ORC-ADP-006 isomorphic
  precedent); `false` = served from an online-refreshed load. Informational, never an error;
  consumers annotate "cached data", they never render it as a failure.

## The field-ceiling decision (registered with this freeze batch)

The proposal F2 wording is "meta information at the library's actually-available ceiling". The
environment verification (3bd4f12 s1(b)) established that the library's `PackageManifest`
deserialization closed set carries NO `author` field: undeclared keys are dropped by serde, no
accessor exists, and the library's own test JSON containing `author` proves the field is common
in cache files yet unparsed. Three options were on the table:

1. upstream dependency extension (cross-version risk),
2. a second parsing surface over the raw cache JSON (one fact parsed in two places — drift
   risk),
3. honest absence at the v0.1 word face.

**This freeze batch rules option 3** (the environment's stated preference, the single-fact-
source discipline): `author` does not exist on this face, and a row carrying `author` (or
`license`, `changelogUrl`, `downloadCount`, or any other invented fact) is INVALID by schema —
the false-assertion guard, not a convention. A future face that needs author facts must first
settle the parsing-surface question in its own frozen batch.

For the same "a constant is not a fact" reason there is deliberately NO `compatible` fact on
this face: without a project context the compatibility judgment cannot execute, and a constant
null would be a non-fact occupying a wire key. Per-package version-level `compatible` remains
the packages-catalog face's project-bound frozen fact. A future project-bound repo-catalog
increment is a v0.2 row-directory question, never an in-place revision of this frozen v0.1.

## Error codes (zero new codes — the 027 stance item 6 direction held)

- Unknown `repoId` param: REUSED `vua.vpm.repo_not_found` (A4 removeRepo same fact). The
  core stance pre-registered `project_not_found` + `no_matching_package` as the F2 reuse
  candidates; the freeze batch settles the actual reach: this face has NO projectPath, so
  `project_not_found` has no subject here, and the batch filter is a lens (honest empty, never
  an error), so `no_matching_package` has no subject either. The one reuse the face actually
  needs is `repo_not_found`.
- Envelope face (unchanged standing set): capability absence answers the generic
  `vua.vpm.capability_missing` before submit; param shape violations answer
  `vua.packages.invalid_params`; an unwired route answers `vua.packages.unavailable`.
- Read-only by design: repository enable/disable and manual refresh are packages-ops (proposal
  027 F4) write faces and do not exist in this family.

## Capability gate

New defaulted accessor `VpmBackend::repo_catalog_capabilities() -> RepoCatalogCapabilities`
(one bit, `repo_catalog`), the 025 accessor law (ORC-DEV-004: default declared-none; a backend
overrides it exactly when it implements `repo_catalog`). The library backend has the
repo-scale listing and will declare true with its implementation-verification slice; the CLI
backend has no repo-scale package listing (environment verification 3bd4f12 s1) and stays
honestly false. Until a route is wired (the NEXT core wiring slice), the method does not exist
on the wire face and consumers render no entry.

## Backend-root-facts section (the 027 checkpoint — mandatory)

The 027 acceptance checkpoint (the 026 U14 lesson: schema word faces cannot pin "which root
does the backend point at") requires every filesystem-touching face to pin its roots. For this
face:

- **What the face reads.** The repository cache inventory of the backend's VPM environment:
  the shared `settings.json` (`userRepos` subscription entries — the subscription facts), the
  predefined cache files `Repos/vrc-official.json` and `Repos/vrc-curated.json` (relative to
  the environment root, subject to the `ignore_official_repository` /
  `ignore_curated_repository` switches), and each user repository's own cache file at
  `userRepos[i].localPath` (the `LocalCachedRepository` inventory: etag-carrying
  remote-repository caches). All paths are resolved under ONE environment root.
- **Production wiring face.** Since proposal 024 the provider's VPM environment root is wired
  to the user's real VCC settings directory (`%LOCALAPPDATA%\VRChatCreatorCompanion` — the
  VCC/ALCOM shared home; provider-host bin wiring, the 026 U14 registered fact). The F2 face is
  READ-ONLY over that shared root: it never writes settings.json, never writes cache files,
  never touches a project. The online-refresh path performs conditional (etag) network fetches
  of subscribed remote repositories and updates the shared cache files — the same behavior VCC
  and vrc-get themselves exhibit on refresh; the `cacheSourced` disclosure tells the consumer
  which path served THIS result.
- **Test isolation face.** All tests (consumer tests in this batch, the environment
  implementation slice, and any future fixtures) run against a TEMPORARY environment root
  injected via `VrcGetLibBackend::with_environment_root(temp_dir, offline)` — synthetic data
  only, never the user's real VCC/ALCOM home, never the developer's real caches. The
  production root appears in documentation and examples as literal placeholder text only.
- **The honest boundary this section pins.** The schema pins the wire shape; it cannot pin the
  root. The root fact above is the acceptance anchor: the environment implementation-
  verification slice and the integration acceptance re-derive it from the wiring code and
  check it against this section, item by item.

## Explicitly outside this word face

- Write faces: enable/disable, add/remove (frozen in packages-ops v0.4), manual refresh
  (proposal 027 F4 — the refresh face does not depend on the W25 key-name verification and may
  freeze with ops v0.6 in parallel).
- Per-package version lists and per-version `compatible`/`yanked` facts: the packages-catalog
  family (on-demand granularity). This face carries only `latestVersion` + `versionCount`.
- `author`, `license`, `changelogUrl`, `downloadCount`, health, lastRefreshed, and every other
  fact without a library producer: invalid by schema (ORC-DEV-004: no implementation, no
  reserved field).
- Pagination, sorting preferences, and any project-bound query key: not in v0.1.

## Honesty boundary

Zero end-to-end claims are made by this batch: the freeze batch is the word-list layer — the
wire route/served row/envelope assembly belong to the next core wiring slice, the library
implementation to the environment implementation-verification slice, desktop consumption to the
per-face upgrade program after shape approval. Real-machine walkthrough of the whole chain
stays in the W25 window (O-2, awaiting the user). The empty state is the final state: empty
repos arrays, empty packages arrays, and null latest/display/description facts render as
designed empties, never as guessed content.
