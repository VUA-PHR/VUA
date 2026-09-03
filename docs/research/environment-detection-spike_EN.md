# Environment detection spike

[English](environment-detection-spike_EN.md) | [简体中文](environment-detection-spike_ZH.md)

> Status: Evidence collected; findings accepted as B6 planning input
> Scope: Unity editor classification, VCC/ALCOM capability detection, project-manager path recognition
> Updated: 2026-09-04
> Normative effect: None. Research material; the support matrix stays in
> `docs/compatibility/unity-editor_EN.md`.

## Purpose

Close the detection unknowns in front of B6 (project and environment
adapters) without waiting for B3: can VUA classify installed editors
against the support matrix, and can it see the same projects the user's
current managers see — read-only, without admin rights, and without
inventing a configuration schema?

## What was built

- `crates/orchestrator/src/editor_targets.rs` — version-string parsing
  (release kind, China `c<n>` suffix) and support-matrix classification
  with stable guidance codes.
- `crates/orchestrator/src/environment_managers.rs` — read-only probe of
  configured VCC/ALCOM settings roots, registered-project discovery
  (explicit `userProjects` paths; legacy folder scan fallback), and the
  versioned `EnvironmentSpikeSnapshotV01` payload.
- `schemas/environment-spike/v0.1/snapshot.schema.json` + fixture, pinned
  by contract tests (`tests/environment_spike.rs`, 9 synthetic tests).
- `examples/environment_probe.rs` — local evidence runner; its output
  stays local and is schema-validated through the ignored manual test.

## Evidence (live Windows machine, 2026-09-04)

1. **VCC resolves its data under `%LOCALAPPDATA%\VRChatCreatorCompanion`**
   — the documented `%APPDATA%` (Roaming) location was absent while VCC
   was installed system-wide and running. `settings.json` keys observed:
   `userProjects` (array of absolute project-path strings), `pathToUnityExe`,
   `pathToUnityHub`, `unityEditors`, `userPackageFolders`, `userRepos`, and
   a `vcc.liteDb` store.
2. **`vrc-get-vpm` 0.0.16 — VUA's package backend — reads the same
   LOCALAPPDATA location, understands `userProjects`, and performs the
   LiteDB migration dance itself.** VUA's vrc-get path therefore sees the
   same project set as VCC with no extra bookkeeping.
3. **Probe results on the evidence machine**: editor root held exactly
   `2022.3.22f1` (classified `production_target`) plus both migration
   sources `2019.4.31f1` / `2022.3.6f1` (classified `migration_source`);
   VCC found with 18 registered projects, all 18 discovered with valid
   `m_EditorVersion` markers and zero diagnostics; ALCOM deterministically
   `not_found`. The real snapshot passed the versioned schema contract.
4. No Tuanjie installation was present; the `t` release-letter mapping
   remains a documented assumption, and no Tuanjie Hub root path was
   verified.

## Spike closure answers

1. *Can exact-editor detection be reliable without admin rights?* Yes for
   Unity Hub-managed roots: targeted enumeration with an `Editor`
   subdirectory check succeeded on the evidence machine with zero
   diagnostics. Roots stay injectable; custom install locations are
   visible only once configured.
2. *What identifiers can manager detection rely on?* VCC: `settings.json`
   `userProjects` (explicit absolute paths; legacy `localProjectFolders`
   kept as fallback format). The classic Roaming path is now a fallback,
   not the default. ALCOM: presence only — its format is still an open
   question.
3. *What can be auto-fixed vs user-guided?* Nothing observed requires a
   write; the whole probe is read-only (fingerprint-proven in tests).
   Deployment automation (installing Hub, editors, or vrc-get) remains
   user-guided for the B6 design and is out of this spike's scope.
4. *Does the snapshot cover what an environment page needs?* Yes at spike
   fidelity: editor version + classification + guidance code, manager
   presence/format/counts, per-project path + association + Unity
   classification, and diagnostics. Renderer-facing titles and localized
   descriptions stay with the frontend (F2), matching the existing
   `EnvironmentCheckItemV1` split.

## Open questions

- VCC environments where `vcc.liteDb` is the single source of truth
  (`userProjects` absent): the spike reports `found` with an
  unexpected-schema warning. Decision pending on whether VUA reads the
  LiteDB directly or simply follows `vrc-get-vpm`'s view (which already
  migrates it).
- ALCOM settings format and project registration model; requires a
  machine that runs ALCOM.
- Tuanjie Hub root path and the `t` release-letter assumption; requires a
  real Tuanjie install.
- VCC's `unityEditors` array was empty on the evidence machine; whether
  it is a useful cross-check for editor detection is unverified.
- Project discovery depth: `userProjects` is explicit, so no scanning is
  needed today; the legacy folder scan reads immediate subdirectories
  only.

## Next steps toward B6

Promote the snapshot shape to a production protocol document, wire the
probe into the `EnvironmentEngine` create zone as new stable check ids,
decide the LiteDB strategy, and re-run the ALCOM/Tuanjie probes on
machines that have them.
