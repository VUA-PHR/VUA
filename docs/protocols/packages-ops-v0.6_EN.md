# packages-ops protocol v0.6 (packages P3 write face, sixth frozen slice F4 = repository lifecycle: packages.enableRepo / packages.disableRepo / packages.refreshRepo)

[English](packages-ops-v0.6_EN.md) | [简体中文](packages-ops-v0.6_ZH.md)

> Document version: 0.6.1
> Status: **FROZEN (packages-ops word-list row v0.6, the F4
> repository-lifecycle word face = the enable/disable method pair + the
> refresh method; the v0.1 A1 removal row, the v0.2 A2 install/upgrade row,
> the v0.3 A3 registration row, the v0.4 A4 repository add/remove row and the
> v0.5 A5 project-creation row stay frozen and served untouched — v0.6 is a
> separate row directory per the packages-catalog v0.2 increment precedent.)
> and WIRED (at the F4 wiring batch, 2026-09-21: the three route arms, the
> `packages.repoLifecycleOps` served row and the named dual constants landed
> on the core wire face. NOT CONSUMED: the desktop surface and the VrcGetLib
> override wait for their own slices)**
> (2026-09-20, proposal 027 face order F2→F3→F5→F4; unfreeze authority = the
> W25 read-only evidence record ruling (c) [proposal 027 s6, 2026-09-20
> environment seat: VCC 2.4.5 carries NO enable/disable state anywhere —
> settings.json full scan, vcc.liteDb collections, Repos cache shapes all zero
> hits] + core stances 4/6/7/8; the operator note dispatched this batch as "the
> F4 repository-face freeze batch")
> Machine-readable word list: `schemas/packages-ops/v0.6/` (row-level dual
> schemas + 5 positive / 10 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_ops_consumer_v06.rs` 4 cases; TS guard
> tests `packages/contracts/src/application-contract.test.ts`; wire tests
> `crates/provider-host/tests/packages_ops_wire_v06.rs` 11 cases +
> `packages_repos_wire_v02.rs` 3 cases)
> Scope: `packages.enableRepo` / `packages.disableRepo` /
> `packages.refreshRepo` (nine-state task-driven write commands for
> subscription-row enable/disable and cache refresh)
> Ownership boundary: word-list freeze + port face (`RepoLifecycleCapabilities`
> three independent bits + `enable_repo` / `disable_repo` / `refresh_repo` +
> `RepoRefreshOutcomeV01` + the defaulted accessor, all default declared-none)
> = core domain; wire routes (the `packages.repoLifecycleOps` served row, the
> route arms, envelope assembly) = core domain, LANDED at the F4 wiring batch
> (2026-09-21); dual implementations (the library-path VUA-owned-storage
> toggles + the library's etag-conditional refresh) = environment domain
> (implementation-verification slice per the 024/025 program — the served row
> stays honestly unavailable until then); desktop consumption = desktop domain
> (the subscription-row toggle + refresh button, after shape approval per the
> per-face program)
> Updated: 2026-09-21 (v0.6.1 wiring batch: the three route arms + the served
> row + the named dual constants + the packages-repos v0.2 negotiation route
> arm + the wire tests; WORD FACE ZERO CHANGE — this document version records
> the wire landing only. Previous: 2026-09-20 v0.6 freeze batch: dual schemas
> + vectors + core consumer tests + TS face + mock constant-absence arms +
> bilingual protocol doc + REGISTRY + the packages-repos v0.2 read-back
> increment frozen in the same batch)

## THE A4 EXPLICITLY-OUTSIDE PREVIEW RESOLVED (the ruling-(c) unfreeze record)

- The v0.4 freeze batch's explicitly-outside section previewed: the
  enable/disable word face waits for the W25 real-machine verification of the
  VCC disabled-list key name. That verification has now completed per the 027
  core-stance-7 three-stage program — the environment seat executed the
  STATIC-FORENSICS SUBSET of the s3(b) eight-step method in the W25 window
  (read-only throughout: root location / family inventory + SHA-256 + mtime /
  verdict / record), with the evidence record filed as proposal 027 s6.
- **The four-way conclusion = (c) VCC has NO enable/disable state**:
  settings.json top level carries exactly 18 keys all accountable as known,
  the four userRepos elements carry the exact vrc-get five-key closed set with
  zero foreign keys, a whole-file recursive scan for
  enabl/disabl/activ/disabled patterns hits ZERO, vcc.liteDb carries exactly
  the projects + unityVersions collections with no repo table, and the Repos
  cache-face LocalCachedRepository shape carries no enable state — positive
  evidence across all three storage locations, zero enable semantics.
- **Consequence**: repository enable/disable is **VUA-OWNED semantics with no
  shared counterpart**. The source-fact-4 "write-face key-stripping
  interoperability risk" (if VCC stored its enable bit inside userRepos[i]
  elements, any VUA write-face save would strip it) has **nothing to strip**
  in the observed machine shape — the 026 A4 enable/disable split ruling's
  retroactive risk surface is settled with real-machine evidence; **the F4
  enable/disable freeze hard precondition is achieved**. The ALCOM-side
  isomorphic comparison was not executable (not installed on the machine —
  capability honestly registered).

## THE STORAGE RULING (settled by this batch as the word-face authority — the operator note's "environment design hint" adopted with reasoning)

- **The VUA disable set lives in VUA-OWNED STORAGE**: a VUA-dedicated state
  file under the `.vua/` convention directory of the environment root
  (`<environment_root>/.vua/vpm-repo-state.json`), a disable set keyed by
  repoId; **an absent file = all enabled** (the honest empty state, never an
  error).
- **NEVER inside userRepos[i] elements**: vrc-get's `UserRepoSetting` carries
  exactly the five-key closed set with NO flatten — unknown element keys are
  dropped on deserialize and never written back on serialize (source fact 3).
  ALL of VUA's write faces ride `Settings::load` → modify → `save` (source
  fact 4), so a VUA-owned key inside an element would be stripped by VUA's own
  next repository write.
- **NEVER a new top-level key inside the shared settings.json**: vrc-get's
  `AsJson` `#[serde(flatten)] rest` round-trips unknown top-level keys without
  loss (source fact 2) — but the **VCC/ALCOM writers' tolerance for unknown
  top-level keys is UNVERIFIED on the real machine** (the observed 18 keys are
  all known = an unknown key has never been observed surviving). Writing
  VUA-only state into a shared file other tools own and rewrite would expose
  it to the exact same silent-strip risk class. The shared file carries shared
  facts only (the F1 honesty direction); enable/disable has no shared
  semantics, so it lives in VUA's own house.
- **Honest UI-copy rule (the F1 discipline)**: the enable/disable face does
  NOT write the shared settings.json — "repository enable/disable is VUA's own
  setting, stored in VUA's own storage; it never modifies your VCC/ALCOM
  settings"; the refresh face honestly declares it writes the shared cache
  file (see the backend-root-facts section).

## F4 WORD-FACE SEMANTICS

- **Three methods, NO preview arm — the A3/A4 law, honestly rooted.**
  Enable/disable is an atomic single-row state toggle: no pre-existing state
  summary to diff, no digest to bind, and ADR-0006's destructive-warning path
  has nothing to warn about (a toggle touches no package file, no project
  content, no subscription row itself); refresh IS the network act (a preview
  cannot verify reachability without doing the same network work — the A4
  add-remote law). The user's explicit submission IS the confirmation; a
  carried `confirmedDigest` = shape violation (negative vector).
- **No method param names a `projectPath`.** The lifecycle face addresses
  subscription rows only (the 013 `project_not_found` reuse does not apply; a
  carried `projectPath` = shape violation, negative vector).
- **The closed single-key set `{repoId}`.** The repository id = the stable row
  handle (the A4 removeRepo same handle; index addressing is NOT frozen — an
  index drifts under concurrent writers). An unknown repoId answers the REUSED
  code `vua.vpm.repo_not_found` at execution time (the A4 removeRepo same
  fact); id-absent rows (repoId null on the read face) are OUTSIDE this face's
  reach (the protocol-document honest boundary).
- **Enable/disable semantics (frozen word-face fact).** Disabling EXCLUDES the
  row from the backend's package-collection world: the enumeration and
  resolution faces (the packages-repo-catalog listing, the packages-query
  latest-version judgment, the A2 install resolver) never see its packages;
  the subscription face KEEPS LISTING the row — packages-repos v0.2 (frozen in
  the same batch) projects the state back through the REQUIRED `enabled` bit,
  so disabling hides nothing from the configuration view. A newly added
  subscription row is always enabled (the add faces reset any stale state
  entry for the id — a fresh subscription starts fresh); removing a row leaves
  no state residue (an implementation-verification-slice duty, declared here).
- **Refresh semantics (frozen word-face fact).** The etag-conditional refresh
  of the row's OWN cache file (settings `userRepos[i].localPath`) — same
  origin and same write as vrc-get's own refresh (If-None-Match, written back
  to localPath); the official/curated predefined caches have NO repoId in the
  subscription world and are unreachable by this face (the honest boundary).
  The refreshed receipt carries the REQUIRED `cacheUpdated` — the library's
  own update_cache two-arm outcome: true = the fetch wrote a new cache; false
  = etag unchanged, "already up to date". **BOTH arms are success** — "no new
  data" is a refresh outcome, never an error; the receipt never carries byte
  counts or package lists (invention is INVALID by schema).
- **Nine-state task-driven write commands (the family-consistent shape).**
  `commandId` idempotency, cancellable (the refresh network segment makes
  cancellation substantive), events + revision; recovery maps non-terminal
  residue to `inspect_required` and NEVER resumes implicitly (honesty rule 3).

## ERROR CODES (zero new codes — the 027 stance-6 F4 direction settled)

- **The F4 port-code closed set is THREE EXISTING codes (all minted with the
  A4 batch, zero minted here)**: `vua.vpm.repo_not_found` (an unknown repoId),
  `vua.vpm.repo_write_failed` (the state-file write-back failed for
  enable/disable, or the cache write-back failed for refresh),
  `vua.vpm.repo_fetch_failed` (the refresh network segment failed).
- **The fold discipline (the A1/A2 standing law)**: every port refusal folds
  into a rejected `execution_failed` carrying the original code in detail; the
  reused `vua.vpm.*` codes NEVER travel in the rejected `code` key (the pattern
  stays locked to `^vua\.packages\.`, negative vector pinned); the guard closed
  set preview_drift / package_not_found / execution_failed stands unchanged.
- **The envelope error face (zero new codes)**: a backend without the
  capability bit answers the generic `vua.vpm.capability_missing` (the wire
  gate answers BEFORE submit — capability absence never reaches a task); a
  params violation answers `vua.packages.invalid_params`; an unwired engine
  answers the honest-absence arm `vua.packages.unavailable`.

## CAPABILITY GATING (named and routed at the F4 wiring batch, 2026-09-21)

- The new defaulted accessor `VpmBackend::repo_lifecycle_capabilities() ->
  RepoLifecycleCapabilities` carries **three INDEPENDENT bits**
  (`enable_repo` / `disable_repo` / `refresh_repo` — a backend may serve a
  subset of the face; the honest gate is per method, never per face; default
  declared-none, the 025 `catalog_capabilities` law, ORC-DEV-004). The three
  port methods carry default bodies this batch (declared-none answers
  `capability_missing`) — the trait default IS the absence arm, and the wire
  gate answers the same code: one code, two absence mechanisms, both honest
  (the A3/A4 isomorph).
- The served row **`packages.repoLifecycleOps`** serves the three methods on
  one row (the repoOps one-row-serves-three precedent): row availability = the
  backend declares ANY of the bits; each route independently reads ITS OWN
  method's bit before submit and answers the generic `capability_missing` on
  absence. ROUTED at the F4 wiring batch: the three route arms live in the
  standing `packages_request` word list (`packages.enableRepo` /
  `packages.disableRepo` / `packages.refreshRepo`), each the same task-driven
  shape — the closed single-key `{repoId}` shape verdict FIRST
  (`vua.packages.invalid_params` at the route layer), then the per-method gate
  BEFORE submit, then the ONE port method inside the nine-state task; every
  port refusal folds into the frozen `execution_failed` guard stamped with the
  v0.6 family const (the A4 fold law, the original port code travels inside
  detail). The VrcGetLib override lands with the environment
  implementation-verification slice — the row stays honestly unavailable until
  then; the CLI backend has no lifecycle face and stays honestly false.
- **The named dual constants** (the A3/A4/A5/F2/F3 precedent, closed at the
  wiring batch; published from `vua_provider_host::provider_host` — consumers
  key on the core-owned constants, never private literals):
  `PACKAGES_OPS_ENVELOPE_SCHEMA_VERSION_V06` = `"0.6"` (the frozen v0.6
  command schema locks this envelope generation) and
  `PACKAGES_OPS_SCHEMA_VERSION_V06` = `"vua.packages-ops/v0.6"` (the frozen
  v0.6 result schema locks this family const — the c914cf2 standing rule:
  every wire row carries a version constant of its own, independent of the
  envelope const). The five predecessor rows keep serving through their own
  consts untouched — six separate word-face generations side by side, pinned
  by the wire tests.
- **The packages-repos v0.2 negotiation route arm** (the same wiring batch):
  `packages.listRepos` now negotiates the read-back increment additively (the
  `catalog_v02`/`query_v02` law) — a backend declaring `repos_v02` answers the
  v0.2 result family (rows carry the REQUIRED `enabled` bit) through
  `list_repos_v02`, every other backend keeps answering the frozen v0.1
  family; the command face stays byte-for-byte the v0.1 face (envelope
  `"0.1"`), the stamped family const
  (`PACKAGES_REPOS_SCHEMA_VERSION_V02` = `"vua.packages-repos/v0.2"`) tells
  the consumer which word face answered, never a guess.

## BACKEND-ROOT-FACTS SECTION (the 027 checkpoint — mandatory)

- **The enable/disable state root**: `<environment_root>/.vua/vpm-repo-state.json`
  — VUA-owned storage (this batch's storage ruling), a disable set keyed by
  repoId; an absent file = all enabled.
- **Production wiring**: environment_root = the user's real VCC shared home
  `%LOCALAPPDATA%\VRChatCreatorCompanion\` (the 026 U14 wiring fact). This
  face NEVER reads or writes the shared settings.json (the toggle state lives
  in VUA's own file; refresh writes the subscription's own cache). The `.vua/`
  state file is a VUA-dedicated NEW file — the real-machine family inventory
  (027 s6(a)) proves the production root carries no `.vua` entry today (absent
  = the default state), the same coexistence pattern as the tool-owned
  Logs/, Updater/ directories.
- **The refresh write root**: the subscription row's OWN cache file (settings
  `userRepos[i].localPath`, inside the shared root) — **same origin and same
  write as vrc-get's own refresh** (etag-conditional), not a new file class;
  the official/curated predefined caches (`Repos/vrc-official.json` /
  `vrc-curated.json`) are unreachable.
- **Test isolation**: the `with_environment_root` temp-root injection (the
  standing convention), synthetic-only data; the implementation-verification
  slice accounts for it with temp-root unit tests (state-file read/write, the
  two refresh arms, the disable filter).

## EXPLICITLY OUTSIDE THIS WORD FACE

- **Reordering**: not on this face (standing since 026 A4 — waits for a
  consumer need).
- **add-remote HTTP headers/credential transport**: not carried (the 026 A4
  ruling stands; a future face that carries credentials needs its own accepted
  security decision).
- **official/curated enable/disable and refresh**: the predefined caches have
  no repoId in the subscription world — unreachable (the honest boundary; any
  ignore-switch face waits for its own proposal).
- **Bulk / all-rows toggles**: not frozen (one row per command; bulk waits for
  a consumer need).
- **Background / automatic refresh**: not frozen (refresh is user-initiated
  only; proactive background network behavior needs its own task and boundary
  ruling).
- **Sharing enable state with VCC/ALCOM**: impossible (ruling (c) — they have
  no such concept; and VUA keys never enter the shared settings.json — the
  storage ruling above).

## HONESTY BOUNDARY

Zero end-to-end claims maintained — this word face is FROZEN and **WIRED, NOT
CONSUMED** (the route arms, the served row and the dual constants landed on
the core wire face at the 2026-09-21 F4 wiring batch — against FAKE backends
in the wire tests; the desktop subscription-row toggle and refresh button
wait for shape approval; the VrcGetLib override waits for the environment
implementation-verification slice — until then the served row stays honestly
unavailable on any real engine and no real backend can answer these routes);
the real-machine walkthrough stays W25 (O-2, waiting for the user window).
This batch and the packages-repos v0.2 read-back increment froze in the same
batch (without the read-back bit the toggle face could not be consumed
honestly — the F3 increment precedent, same path); the v0.2 negotiation
route arm landed with the wiring batch.
