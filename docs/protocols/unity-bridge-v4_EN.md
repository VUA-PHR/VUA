# Unity Bridge protocol v4

[English](unity-bridge-v4_EN.md) | [简体中文](unity-bridge-v4_ZH.md)

> Document version: v4
> Status: **Frozen** (2026-09-20, user ruling slice/production-nav-bake-preview)
> Protocol version: 4
> Updated: 2026-09-20
> Normative force: yes; the JSON structures in `schemas/unity-bridge/v4/`
> are the machine-decidable source of truth
> Source rulings: user ruling 2026-09-20 (slice/production-nav-bake-preview
> port slice; no proposal number — the ruling itself is the registering
> authority)

## Purpose and boundary

Unity Bridge v4 connects the Orchestrator with the global Unity `2022.3.22f1`
Editor Package. v4 is a **frozen superset of v3** (same-face upgrade, the
v1→v2→v3 precedent repeated): all v3 operations, fields, and receipt
semantics are preserved unchanged; v4 adds exactly one operation,
`build_preview` (the Release bake-preview turntable, ported from the
reference implementation BridgePreviewBake).

Existing consumption faces keep their version labels (material line v1;
production job and inspection read faces v2/v3); `build_preview` is the
only new v4 consumption face — older labels must not carry the operation
(a v3-labeled `build_preview` is rejected).

## Editor precondition

Inherited from v1/v2/v3: the Bridge is accepted for production execution
only when the editor and project match `2022.3.22f1` exactly; a mismatch
is rejected typed as `bridge.editor_version_unsupported` with the project
left untouched.

## Transport

Inherited from v1/v2/v3 job-directory discipline (atomic writes under
`.vua/bridge/` + `BridgeEntryPoint.Run`); v4 changes nothing on the
transport face. This slice does not port the reference implementation's
LiveBridgeWatcher queue polling and adds no desktop trigger chain — the
trigger chain keeps the existing one-batchmode-process-per-command shape.

## Command envelope

Requests must conform to
[`command.schema.json`](../../schemas/unity-bridge/v4/command.schema.json)
(`schemaVersion` const 4). The full v4 operation set = the full v3 set (see
the [v3 protocol](unity-bridge-v3_EN.md)) + ★ one mutating operation:

| operation | mode | purpose |
| --- | --- | --- |
| ★ `build_preview` | mutating (artifacts land in the project directory; `dryRun=true` = statistics only) | Release bake-preview turntable: instantiates an Avatar copy in an isolated preview scene and renders a 60-frame orbit of 1024×1024 transparent-background PNGs + cover.png + manifest.json into `.vua/bridge/preview/<commandId>/` |

The v4 increment discipline for `build_preview` (user ruling 2026-09-20):

- **Mutating classification**: writing artifacts into the project directory
  is a side effect, so the operation falls under the existing envelope
  discipline — no third category is invented. A real run (`dryRun` false or
  absent) must carry `expectedProjectFingerprint`; `dryRun=true` resolves
  the avatar and reports structure statistics only, producing **no
  images**.
- **Zero new payload fields**: reuses the optional `avatarGlobalObjectId`;
  when empty the Bridge auto-detects the best-scoring Avatar root in the
  active scene (VRC_AvatarDescriptor / Animator / mesh-count scoring, the
  reference ResolveAvatar semantics). Frame count and size are deliberately
  not parameterized (shipped constants: 60 frames at 1024×1024).
- **Statistics caliber** matches `analyze_performance` (a local structure
  estimate, never an official VRChat rating): statistics travel in
  `data.triangles/materialSlots/skinnedMeshRenderers/bones`, `data.basis`
  is always `local_estimate`, and `data.avatarName` names the resolved
  avatar.
- **Typed diagnostic codes**: `preview.no_avatar` (no previewable avatar,
  rejected), `preview.dry_run` (checks passed, no images yet),
  `preview.baked` (baked, with the artifact relative directory),
  `preview.bake_failed` (exception, with a truncated stack).
- **Zero user-scene change**: the bake runs entirely inside a
  `NewPreviewScene` isolation; the user scene is never dirtied by the
  operation, and the mutating epilogue **skips the scene save** for
  `build_preview` (even if the user scene carries its own unsaved changes,
  a preview operation never saves on the user's behalf). Receipts are still
  written to `.vua/bridge/completed/<commandId>.json`, and idempotent
  replay stays bound by commandFingerprint (existing discipline).
- **Receipt version echoes the command protocol version** (the
  execute_production_job precedent): a v4 command's build_preview receipt
  is labeled 4.
- **Zero new result-data fields**: the artifact directory is recorded in
  `changedPaths` (relative path `.vua/bridge/preview/<commandId>/`), and
  statistics use the existing data face.

## Artifact directory convention

A real run lands its artifacts under the project root:

```text
.vua/bridge/preview/<commandId>/
  frames/frame_00.png … frame_59.png   (60 frames, 1024×1024, transparent)
  cover.png                            (copy of frame_00)
  manifest.json                        (manifest's own schemaVersion 1)
```

**Manifest shape** (manifest v1, the desktop TurntablePlayer consumption
contract): `schemaVersion` 1, `commandId`, `avatarName`, `bakedAt` (ISO
8601), `basis` ("vua-unity-editor-bake"), `frames`/`width`/`height`,
`framePattern` ("frames/frame_{0:D2}.png"), `cover` ("cover.png"),
`triangles`/`materialSlots`/`skinnedMeshRenderers`/`bones` (same caliber as
the receipt statistics). The manifest is a private format of the preview
directory; its schemaVersion is unrelated to the unity-bridge protocol
version.

## Receipts

Results must conform to
[`result.schema.json`](../../schemas/unity-bridge/v4/result.schema.json)
(`schemaVersion` const 4). A v4 receipt = the v3 receipt face with only the
operation enum gaining `build_preview`; a succeeded build_preview receipt
carries at least one diagnostic (a completed run always has a conclusion).

## Version rules

The v1/v2/v3 frozen files are untouched byte for byte; every v3 shape
remains valid under the v4 label (with `schemaVersion` raised to 4) — v4
only adds, never reshapes (pinned by the Rust consumer tests). The desktop
consumption half addresses artifacts as
`<projectRoot>/.vua/bridge/preview/<commandId>/` (the VUA bridge-directory
convention, replacing the reference implementation's
`.vrcua/bridge/preview`).

## Document changelog

- v4 (2026-09-20): the Release bake-preview protocol — exactly one new
  operation `build_preview` (user ruling slice/production-nav-bake-preview:
  mutating classification, statistics-only dryRun, preview-scene isolation,
  zero user-scene change, artifact-directory and manifest shape). Schema +
  5 vectors (dry-run request / real-run request / dry-run receipt /
  wrong-version negative / unenumerated-operation negative) + Rust consumer
  tests (bridge_v4_vectors, 4 cases) + core `UnityOperation::BuildPreview`
  (included in `is_mutating`) + C# implementation (BridgePreviewBake +
  processor wiring) + C# EditMode contract tests landed. The C# EditMode
  tests have not been run on a real machine — zero end-to-end claim.
