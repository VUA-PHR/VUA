# ADR: VUA instance identity and multi-instance boundaries


> Document version: ADR
> Status: Accepted
> Date: 2026-09-05 (product-owner ruling; supersedes the 2026-09-04 Proposed text)
> Scope: desktop shell bootstrap/path resolution, environment detection, installer/updater
> (M9/M10), B-line executors

## Context

Pre-alpha VUA ships without an installer, so portable copies and parallel development
builds make multiple instances likely. Unmanaged, they collide four ways: concurrent
operation on one project, updates against running executables, version-skewed writes to
shared local state, and ambiguous custom-protocol/file-association handoff.

**Corrected premise (2026-09-05 ruling):** per-project mutation fencing through
`ProjectIdentity` leases holds **only within one task database** — `project_mutation_leases`
and the fencing generations live in each data profile's own SQLite file, so `stable.db` and
`beta.db` can each hold a lease on the same project and neither would know. Ecosystem
evidence: VCC ships stable and beta side-by-side with separate data directories
(`VRChatCreatorCompanion` / `VRChatCreatorCompanion-Beta`, observed on a live machine).

## Decision

1. **Channels: `stable` / `beta` / `dev`.** They solve update sourcing, data namespacing,
   and risk isolation — they are not SemVer stage names (`0.10.0 Beta 1` is a product
   stage; `beta` is an install channel; the two are independent and do not conflict with
   the versioning policy). The channel is compiled into the artifact and enters the
   signing/release metadata.
2. **Instance identity = (channel, install form, profile).** Install form: `installed` /
   `portable`.
3. **Data layout: install-form-aware Profile model.**

   | Form | Data root |
   | --- | --- |
   | installed stable | `%LOCALAPPDATA%\VUA\stable\default` |
   | installed beta | `%LOCALAPPDATA%\VUA\beta\default` |
   | dev | `%LOCALAPPDATA%\VUA\dev\<profile-id>` |
   | portable | `<portable-root>\Data` |

   Rationale: installed updates must retain data across versions, so a channel shares one
   Profile; `stable` and `beta` must be physically isolated; a portable build writing to
   global AppData would not be portable; dev must not let different worktrees and
   experiment branches migrate the same dev database in turn; a user explicitly choosing
   an independent Profile expects the state split — that is by design, not an accident.
   A one-time copy from `stable` to `beta` may be offered as an explicit operation; the
   two channels never share one SQLite in real time and beta data is never merged back
   automatically.
4. **The data directory carries its own marker:** `productId`, `channel`, `profileId`,
   `formatVersion`, `migrationSequence`, `lastWriterProductVersion`. The install-root
   marker file is for discovery and verification only — it is never the sole trust
   boundary (the channel is also compiled into the binary and enters the signed release
   metadata; an edited marker cannot grant another channel's data access).
5. **Version gate: strict refuse-to-mount.** An instance that does not support a data
   format refuses to mount it. The desktop shell still starts: it does not connect the
   Provider for that database, states which product version / format wrote the data, and
   offers remediation entries (install a compatible version, choose another Profile,
   restore from backup, export diagnostics). Never best-effort reading, never downgrade
   writes. The gate keys on the persisted `formatVersion` and `migrationSequence` — not
   merely "a newer product version wrote it": two product versions can share one database
   format.
6. **App lock: keyed on the hash of the canonical data root** (`AppLock =
   hash(canonicalDataRoot)`), not on the channel alone. Two instances pointing at one data
   root: the second focuses the first and exits. `stable` and `beta`, two dev Profiles,
   and portable/installed combinations can run in parallel. The provider's existing
   database sidecar lock stays as defense in depth.
7. **Cross-profile project mutation lock (new prerequisite gate).** Because leases do not
   cross data directories, enabling multi-channel parallelism requires a per-
   `ProjectIdentity` runtime exclusion — a Windows named mutex or an in-project exclusive
   lock file — plus a versioned unfinished-mutation marker in the project's `.vua`; any
   channel finding a leftover marker runs Inspect before mutating. SQLite leases continue
   to own tasks, generations, and recovery records within one profile. **This gate is a
   prerequisite for turning multi-channel parallelism on; it must not stay open until the
   installer lands.** It does not block current single-profile B3/M3 work.
8. **`vua_instances` detection (unchanged):** reads install-root markers and lock
   presence, only after this contract and the installer exist.
9. **Bootstrap/path resolver:** a unified bootstrap/path resolver owns the layout
   constants. Code facts: `LocalPackageIdentityStore` already receives its path via its
   constructor (follows the selected Data Profile); the Electron Main currently assembles
   the provider database path from `app.getPath("userData")` — that assembly is the
   migration point into the resolver.

## Consequences

- Installed upgrades keep data within the channel; `stable` and `beta` never mix; portable
  builds are genuinely portable; dev worktrees never migrate each other's databases.
- Downgrades hit the version gate with the shell explaining — the data is untouched, not
  silently re-read.
- Multi-channel parallelism is gated on the cross-profile project lock landing first
  (B-line work, before the installer needs it).
- The bootstrap/path resolver becomes the single owner of layout constants; the identity
  store follows the selected Data Profile.
- Local evidence at acceptance: all 18 local VCC projects carry the SDK, and the VCC
  stable/beta side-by-side was observed live.

## Alternatives considered

- Pure channel lock for the app mutex: rejected — channel identity and actual state
  ownership diverge for portable builds and dev profiles.
- A single shared data directory across installs and versions: rejected — version-skew
  writes are the corruption mode this ADR exists to prevent.
- Detecting other installs by scanning common paths before any installer exists:
  rejected — detection without a contract detects assumptions.
- Per-project leases alone (status quo at Proposed time): rejected — the leases are valid
  only within one task database; they fence project mutation but leave app-level
  exclusion, updates, and protocol handoff undefined across data directories.
