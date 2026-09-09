# VUA Project Inspection Read Contract v0.2

[English](project-inspection-v0.2_EN.md) | [简体中文](project-inspection-v0.2_ZH.md)

> Document version: 0.2
> Status: **Frozen (2026-09-09)** — v0.1 frozen (integration ruling announced
> alongside the 014 acceptance) plus the v0.2 additive family bump (one added
> field; zero consumers at freeze time: provider routing unimplemented,
> desktop TS face unregistered — declared in the proposal 013 inline note).
> Machine-readable vocabulary: `schemas/project-inspection/v0.2/`
> (command / result / snapshot schemas + 8 positive + 2 negative vectors +
> 2 fixtures)
> Scope: M6 T-A/T-B read face — the read-only inspection aggregate over the
> manager-registered project paths (general `vrc-get` project path + ALCOM/VCC
> capability-detection compatibility matrix). The write path lives in the
> project-ops family (`project.import-copy`); the read/write lines stay
> separate (proposal 013/014 arbitration).
> Ownership boundary: the inspection aggregate lives in
> `crates/project-manager` (`project_inspection` / `environment_managers` /
> `vua_identity`); provider routing belongs to the core domain; the desktop TS
> face registration belongs to the desktop domain.
> Updated: 2026-09-09

## Method face (closed set of four queries)

| Method | Semantics | Params |
| --- | --- | --- |
| `project.listProjects` | Full `ProjectInspectionSnapshotV02` (discovery + per-project inspection) | none |
| `project.inspectProject` | One `ProjectInspectionV02` for a registered path | `projectPath` |
| `project.environmentManagers` | `EnvironmentManagersSnapshotV01` (ALCOM/VCC manager capability face, proposal 004 artifact) | none |
| `project.lockStatus` | The pending-mutation marker tri-state for one path (`none`/`leftover`/`unreadable`) | `projectPath` |

An out-of-vocabulary method name is a contract error; every query is
read-only — the inspection face never writes, never takes a lock, and never
scans the filesystem beyond the registered paths.

## Snapshot semantics (honesty rules)

- **Only manager-registered paths are inspected** (VCC
  `userProjects`/`localProjectFolders`, ALCOM `userProjects`); when several
  managers registered the same path, the associations union
  (`vcc_registered`/`alcom_registered` may coexist).
- **Absence is honest**: a registered path that does not exist stays visible
  (`pathPresent: false` + a warning diagnostic) and is never silently
  dropped; a manifest that fails to parse is a warning finding, never an
  invented package list.
- **Determinism**: snapshots are byte-deterministic for a given tree (sorted
  maps, sorted paths); only a failed *observation* produces a diagnostic.
- Unity version classification shares the editor-matrix policy
  (`production_target` = 2022.3.22f1); VRChat SDK packages are reported as
  seen by the `com.vrchat.*` prefix, with the `locked` pin winning over the
  `dependencies` declaration — no invented product semantics.

## v0.2 addition: the `vuaIdentity` tri-state finding

Each project gains `vuaIdentity` (tagged; derived from user rulings
2026-09-09 items 7/9/12):

| status | semantics |
| --- | --- |
| `absent` | no `.vua/project.json` — not a VUA-native project |
| `present` | the VUA-native declaration; carries `markedAt` (RFC 3339) and `note` (user note; ruling 12: **project-list display only**) |
| `unreadable` | the file exists but cannot be parsed (or carries an unknown version) — itself evidence, never silently reported as absent |

The identity document lives at `.vua/project.json` (beside `project.lock`,
`pending-mutation.json`, `source.json`). Notes attach to the VUA-native
declaration: setting a note on a project without an identity file is refused
(`SetNoteError::NotVuaNative`) — the semantic boundary is confirmed with the
core routing batch. `unreadable` applies to the inspection face as well: a
corrupt identity file is a finding, not "not native".

## Envelope

`result.schema.json` constrains at envelope strength only: the payload
branches per operation and is pinned by `snapshot.schema.json` (v0.2) and
`schemas/environment-managers/v0.1/` (not bumped with this family) — the two
constraint sources can never drift.

## Document changelog

- 0.2 (2026-09-09): the additive `projectInspection` field `vuaIdentity`
  (tagged tri-state); command/result shapes unchanged, bumped with the
  family; vectors and fixtures updated (derived from user rulings 7/9/12,
  proposal 013 inline note on file).
- 0.1 (2026-09-09): initial freeze — the four-query closed set + 8 positive
  + 2 negative vectors + consumer tests
  (`crates/project-manager/tests/project_queries.rs`: positives pass the
  frozen Schema, negatives are refused, the read/write separation is
  asserted in both directions).
