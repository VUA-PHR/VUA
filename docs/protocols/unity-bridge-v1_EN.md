# Unity Bridge protocol v1

[English](unity-bridge-v1_EN.md) | [简体中文](unity-bridge-v1_ZH.md)

> Status: Accepted
> Protocol version: 1
> Updated: 2026-09-02
> Normative effect: Yes; `schemas/unity-bridge/v1/` is authoritative for machine structure

## Purpose and boundary

Unity Bridge v1 connects Orchestrator to the global Unity `2022.3.22f1` Editor package. Orchestrator
owns user intent, planning, approval, snapshots, and recovery. Bridge validates and performs allowed
Unity operations only. It accepts no arbitrary script and owns no login, download, or VRChat upload.

## Editor precondition

The M0 gate accepts Bridge v1 for production execution only after both the selected Editor and the
project after migration match `2022.3.22f1` as complete strings. Orchestrator must check the installed
Editor and `ProjectSettings/ProjectVersion.txt` before launch; Bridge must independently check its
running `Application.unityVersion` before inspection or mutation.

`2019.4.31f1` and `2022.3.6f1` are migration sources and reach Bridge only after a backed-up project
copy is upgraded. Other Unity versions, Tuanjie Engine, and all other variants are outside v1
execution; no particular Unity distribution suffix receives a separate execution branch. A mismatch
is rejected before project inspection or mutation with `bridge.editor_version_unsupported`, keeps the
project unchanged, and returns remediation through the application
boundary. VUA leaves `ProjectVersion.txt` edits under explicit user control. The
[Unity editor compatibility policy](../compatibility/unity-editor_EN.md) is authoritative for the
support matrix.

## Transport

Orchestrator atomically writes a request under the target project's `.vua/bridge/`, then launches:

```text
-batchmode -quit -projectPath <project>
-executeMethod Vua.Editor.Bridge.BridgeEntryPoint.Run
-vuaRequest <absolute-request-path>
-vuaResult <absolute-result-path>
```

Both paths resolve inside that project's `.vua/bridge/`. Unity writes the complete result to a
temporary sibling and atomically replaces the agreed result path. Standard output is diagnostic only,
not a machine interface.

## Command envelope

Requests conform to [`command.schema.json`](../../schemas/unity-bridge/v1/command.schema.json).

| operation | Mode | Purpose |
| --- | --- | --- |
| `inspect_project` | `dryRun: true` required | Check current Scene readability and return fingerprint |
| `identify_assets` | `dryRun: true` required | Resolve Avatar/outfit `GlobalObjectId` values |
| `install_outfit` | inspect or mutate | Build hierarchy and configure MA Merge Armature |
| `create_toggle` | inspect or mutate | Create/update MA menu entry and object toggle |
| `validate_avatar` | `dryRun: true` required | Validate outfit hierarchy and MA components |
| `analyze_performance` | `dryRun: true` required | Return a local structural estimate, never an official rating |

Mutation is `dryRun: false` and requires the latest successful `data.projectFingerprint` as
`expectedProjectFingerprint`. Mismatch rejects execution. `commandId` correlates request and result.
Current mutations are idempotent on their target structure: repeated outfit installation does not
stack Merge Armatures, and repeated same-name toggle creation updates the existing object. New
operations define repeat semantics before entering the schema. Executable synthetic examples live in
`schemas/unity-bridge/v1/examples/`.

## Result

Results conform to [`result.schema.json`](../../schemas/unity-bridge/v1/result.schema.json):

- `succeeded`: operation completed; mutations were saved.
- `rejected`: request, selection, precondition, or fingerprint failed before effective mutation.
- `failed`: execution or saving faulted; the caller decides recovery from the Build Record/snapshot.

Every success returns the post-operation fingerprint. `changedPaths` lists affected Unity hierarchy
paths. Diagnostics use stable code and severity plus a user-facing message; Orchestrator branches on
stable fields/codes, never localized prose.

## Versioning

- v1 enumerates implemented operations only.
- Backward-ignorable optional fields may remain v1; semantic, required-field, or execution-guarantee
  changes require a new protocol version.
- Orchestrator models, JSON Schema, C# DTOs, and fixed tests change together.
- Package and protocol versions are independent.
- Editor-target changes require compatibility-policy promotion and a new tested VUA/Bridge package
  release; they do not silently broaden Bridge v1.
