# ALCOM/VCC Project Compatibility Matrix

[English](alcom-vcc_EN.md) | [简体中文](alcom-vcc_ZH.md)

> Document version: 1.0.0  
> Status: Accepted  
> Scope: read-only compatibility detection and the capability matrix for ALCOM/VCC-managed projects  
> Updated: 2026-09-09  
> Authority: `docs/product-boundary_EN.md` 1.2.0 (user ruling U3, 2026-09-08)

## Authority and hard boundary

This matrix elaborates product-boundary 1.2.0 and introduces no new semantics. VUA is
**read-only** toward projects managed by ALCOM/VCC; the only write path is the
user-chosen "import as a VUA-managed copy" (new project path and identity, disk usage
stated up front, no copying of regenerable directories or old task state, re-Inspect
after import, source link kept). Inside the `1.0.x` boundary the write capability toward
the original project is always false; any future opening requires a new user ruling.

**Allowed** (every check in this matrix is inside this list):

- discovering and identifying ALCOM/VCC-managed projects;
- reading versions, packages, SDKs, compatibility, and environment state;
- producing diagnostics, plans, and remediation guidance;
- handing write operations over to the owning manager (presentation-level guidance;
  VUA never writes on the user's behalf).

**Forbidden**: installing/removing packages inside the original project; modifying its
manifest, project configuration, assets, or `.vua` job files; writing ALCOM/VCC
registries, databases, settings, or caches; silently re-labeling the original project as
VUA-managed.

## Detection matrix

| Check | ALCOM | VCC | Method (read-only) | Presentation |
| --- | --- | --- | --- | --- |
| Manager presence | Yes | Yes | Read the known settings paths (`%APPDATA%\alcom\setting.json`; `%LOCALAPPDATA%\VRChatCreatorCompanion\settings.json` with the legacy `%APPDATA%` fallback) | found / not_found / read_failed — an absent manager is a normal finding, not an error |
| Project discovery | `userProjects` | `userProjects` (modern) or `localProjectFolders` (legacy) | Read the settings file only; never sweep user folders | Project list = the union of both managers' registered paths |
| Dual-manager association | Yes | Yes | One path registered by both managers → one finding with both associations | Sorted, de-duplicated association list |
| Unity version and classification | Yes | Yes | Read `ProjectSettings/ProjectVersion.txt` | Full version string + classification (production target `2022.3.22f1` / migration sources `2019.4.31f1`, `2022.3.6f1` / other / Tuanjie), same rules as the [Unity editor compatibility policy](unity-editor_EN.md) |
| VPM packages (declared face) | Yes | Yes | Read the `dependencies` and `locked` maps of `Packages/vpm-manifest.json` | Declared/locked versions sorted by packageId; a parse failure is an honest warning + empty list, never an invented entry |
| VRChat SDK | Yes | Yes | Spot `com.vrchat.*`-prefixed packages among those maps | `locked` wins over `dependencies`; report what is seen, no invented product semantics |
| Pending-mutation marker | `.vua/pending-mutation.json` | Same | Read-only observation (report it honestly; never acquire the lock — acquiring is a write) | none / leftover / unreadable |
| Stale registry entries | Yes | Yes | Registered path no longer exists | The entry stays visible with a warning (`path_present: false`), never silently dropped |

## Honest presentation of capability conclusions

- A failed check produces a warning diagnostic on that project only; other findings are
  unaffected;
- A settings file that exists but has an unrecognized shape (e.g. no `userProjects`) is
  presence-with-warning; fields are never guessed;
- VUA does not claim a compatible transaction/recovery mechanism with ALCOM/VCC —
  understanding the VPM format on both sides does not make writes coordinable
  (1.2.0 rationale);
- Writes are always handed over: the UI offers "operate in ALCOM/VCC" or "import as a
  VUA-managed copy"; VUA never writes the original project.

## Machine-readable faces

- Detection snapshot: `EnvironmentManagersSnapshotV01`
  (`schemas/environment-managers/v0.1/snapshot.schema.json`);
- Project inspection: `ProjectInspectionSnapshotV01`
  (`schemas/project-inspection/v0.1/snapshot.schema.json` — the package/SDK/lock rows of
  this matrix);
- Command-face wire vocabulary: see `collab/proposals/013` (pending the core ruling;
  unfrozen and unwired until then).
