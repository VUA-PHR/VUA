# Unity Bridge protocol v1


> Document version: v1
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
[Unity editor compatibility policy](../compatibility/unity-editor.md) is authoritative for the
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
| `import_unity_package` | inspect or mutate | Verify the source digest and import one `.unitypackage` from the reviewed batch |
| `materialize_extracted_package` | inspect or modify | Materializes the caller-extracted guid layout (first verifies the command's `manifestSha256` against the manifest itself, then verifies each entry against `manifest.sha256` — the manifest lives in the same editable directory as its files, so without binding its own digest the check-then-swap window stays open). batchmode fact (2026-09-04): Unity's `ImportPackage` is a silent no-op under `-batchmode`; batchmode execution must use this operation; `import_unity_package` keeps its file+digest semantics |
| `create_local_vpm_package` | inspect or mutate | Create the Editor/Runtime local-package layout only inside a token-bound VUA staging project |
| `validate_asset_paths` | `dryRun: true` required | Confirm planned paths load through AssetDatabase; proves minimum structure only |
| `identify_assets` | `dryRun: true` required | Resolve Avatar/outfit `GlobalObjectId` values |
| `install_outfit` | inspect or mutate | Build hierarchy and configure MA Merge Armature |
| `create_toggle` | inspect or mutate | Create/update MA menu entry and object toggle |
| `validate_avatar` | `dryRun: true` required | Validate outfit hierarchy and MA components |
| `analyze_performance` | `dryRun: true` required | Return a local structural estimate, never an official rating |

The two material operations form B3's versioned dual-entry execution surface. Every source package in the folder
batch executes in normalized relative-path order. `create_local_vpm_package` must match the one-time token stored
in `.vua/staging.json` and cannot run against an ordinary user project. Dependencies are explicit Orchestrator
inputs; the Bridge neither guesses nor removes them.

Mutation is `dryRun: false` and requires the latest successful `data.projectFingerprint` as
`expectedProjectFingerprint`. Mismatch rejects execution. `commandId` binds request, result, and a completion
receipt under `.vua/bridge/completed/`; replay of a completed command returns that result without importing or
moving assets again. Interruption before the receipt is an unknown outcome that requires Inspect rather than
automatic replay. Assembly mutations are also idempotent on their target structure: repeated outfit installation
does not stack Merge Armatures, and repeated same-name toggle creation updates the existing object. New
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
