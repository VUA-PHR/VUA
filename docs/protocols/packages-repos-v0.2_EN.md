# packages-repos protocol v0.2 (the packages.listRepos read-face increment: the subscription-row enable/disable state bit)

[English](packages-repos-v0.2_EN.md) | [简体中文](packages-repos-v0.2_ZH.md)

> Document version: 0.2.1
> Status: **FROZEN (packages-repos word-list row v0.2 = the
> subscription-row state increment; the v0.1 row stays frozen and served
> untouched — a backend that has not adopted v0.2 keeps answering the v0.1
> family; v0.2 is a separate row directory per the packages-catalog v0.2 /
> packages-query v0.2 increment precedent.) and WIRED (the v0.2 negotiation
> route arm landed at the F4 wiring batch, 2026-09-21: a backend declaring `repos_v02`
> answers the v0.2 family through `packages.listRepos`, every other backend
> keeps answering the v0.1 family. NOT CONSUMED: the desktop toggle rendering
> waits for shape approval)**
> (2026-09-20, a same-batch product of the proposal 027 F4 freeze batch —
> without the read-back bit the toggle write face could not be consumed
> honestly; the unfreeze authority and the storage ruling live in the
> packages-ops v0.6 protocol document)
> Machine-readable word list: `schemas/packages-repos/v0.2/` (row-level dual
> schemas + 3 positive / 4 negative vectors; core consumer tests
> `crates/provider-host/tests/packages_repos_consumer_v02.rs` 3 cases; wire
> tests `crates/provider-host/tests/packages_repos_wire_v02.rs` 3 cases)
> Scope: the `packages.listRepos` result face gains EXACTLY one REQUIRED
> row-level fact, `enabled`
> Ownership boundary: word-list freeze + port face (`RepoInfoV02` + the
> defaulted accessor `repos_v02` + `list_repos_v02`, default
> declared-false/absent) = core domain; the negotiation route arm = core
> domain, LANDED at the F4 wiring batch (2026-09-21, the family const
> `PACKAGES_REPOS_SCHEMA_VERSION_V02` stamped by the route); dual
> implementation (VrcGetLib projecting the state bit from VUA-owned storage)
> = environment domain, implementation-verification slice; desktop
> consumption = desktop domain (the subscription-row toggle rendering, after
> shape approval)
> Updated: 2026-09-21 (v0.2.1 wiring batch: the packages.listRepos
> negotiation route arm landed — WORD FACE ZERO CHANGE, this document
> version records the route landing only. Previous: 2026-09-20 v0.2 freeze
> batch: dual schemas + vectors + core consumer tests + TS face + bilingual
> protocol doc + REGISTRY; the command face is byte-for-byte the frozen
> v0.1 face, zero change)

## INCREMENT SEMANTICS (the v0.1 word list is never revised in place)

- **v0.2 = the frozen v0.1 result plus EXACTLY one REQUIRED row-level fact,
  nothing else moved**: the row closed set = the v0.1 five keys (repoId /
  name / url / localPath nullable strings + the REQUIRED cached boolean) +
  the REQUIRED boolean `enabled`. Row order = the subscription face's own
  order (the settings userRepos configuration fact, verbatim) unchanged; the
  honest empty-array answer unchanged; the health face stays a non-goal.
- **The command face is byte-for-byte the frozen v0.1 face** (the F3 increment
  precedent): the envelope const stays "0.1", the closed-empty params set
  unchanged, zero parameters unchanged; the `PackagesListReposQueryV01` TS
  type has zero change and the request union gains zero members.
- **Dual-version negotiation (additive, the catalog_v02 / query_v02
  precedent)**: the defaulted accessor `repos_v02() -> bool` (default false —
  ORC-DEV-004: no implementation, no reservation) + `list_repos_v02() ->
  Result<Vec<RepoInfoV02>, AppErrorV1>` (the default absence arm answers
  `capability_missing`). A backend overrides the accessor exactly when it
  implements `list_repos_v02`; the route serves v0.2 exactly when declared,
  and every other backend keeps answering the frozen v0.1 family — **the
  stamped family const tells the consumer which word face answered, never a
  guess**; a v0.1-shaped row is INVALID under the v0.2 schema (missing
  REQUIRED keys) = the version increment machine-detectable (negative vector
  pinned).

## THE enabled BIT SEMANTICS (frozen ruling)

- **`enabled` = the VUA-OWNED enable/disable state bit** (the packages-ops
  v0.6 `enableRepo` / `disableRepo` write faces' read-back): true = the row
  is active in the package-collection world (enumeration and resolution see
  its packages); false = disabled — **still subscribed and still listed**
  (the subscription face is the configuration fact; disabling hides nothing
  from the configuration view), but its packages are excluded from
  enumeration and resolution.
- **VUA-owned semantics with no shared counterpart**: the W25 read-only
  evidence record ruling (c) (proposal 027 s6) — VCC 2.4.5 carries no
  enable/disable state in any of the three storage locations. The bit
  projects VUA's OWN storage (the `.vua/` convention state file under the
  environment root), **never a settings.json key** and never a userRepos[i]
  element key (the full storage ruling lives in the packages-ops v0.6
  protocol document).
- **The id-absent-row law**: a row whose repoId is null projects `enabled:
  true` ALWAYS — id-absent rows are outside the toggle faces' reach (the A4
  removeRepo same boundary: the id IS the row handle), so true is its honest
  permanent fact.
- **The false-assertion guard**: health / status / lastRefreshed /
  disabledAt and every other port-carrier-less fact is INVALID by schema
  (additionalProperties:false, negative vector pinned) — the P2 frozen
  word-face discipline.

## ERROR CODES (zero new codes)

- The read-face error face is identical to v0.1, zero change: the envelope
  shape violation `vua.packages.invalid_params`, capability absence
  `vua.vpm.capability_missing`, unwired `vua.packages.unavailable` — the
  v0.2 increment moves no error face.

## BACKEND-ROOT-FACTS SECTION (the 027 checkpoint — mandatory)

- **The state-bit fact source**: the same storage as the packages-ops v0.6
  toggle write face — `<environment_root>/.vua/vpm-repo-state.json`
  (VUA-owned storage, a disable set keyed by repoId; an absent file = all
  enabled, i.e. every row true).
- **Production wiring**: environment_root = the user's real VCC shared home
  (the 026 U14 wiring fact); **this face is READ-ONLY** — it never writes
  settings.json, never writes the shared caches, never writes the state file
  (the write path belongs to the toggle write faces only).
- **Test isolation**: the `with_environment_root` temp-root injection,
  synthetic data; the implementation-verification slice accounts for it with
  temp-root unit tests (the state-file projection, the absent-file default
  state, the id-absent-row always-true law).

## HONESTY BOUNDARY

Zero end-to-end claims maintained — this increment is FROZEN and **WIRED,
NOT CONSUMED** (the v0.2 negotiation route arm landed at the 2026-09-21 F4
wiring batch — against FAKE backends in the wire tests; the VrcGetLib state
projection waits for the environment implementation-verification slice —
until then real backends honestly keep answering the v0.1 family; the
desktop toggle rendering waits for shape approval); the real-machine
walkthrough stays W25 (O-2). Frozen in the same batch as packages-ops v0.6:
the write face and its read-back bit deliver as one — without the read-back
bit the toggle face could not be consumed honestly.
