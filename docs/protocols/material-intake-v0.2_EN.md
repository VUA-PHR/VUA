# AMF material-intake protocol v0.2

[English](material-intake-v0.2_EN.md) | [简体中文](material-intake-v0.2_ZH.md)

> Document version: 0.2.1
> Status: FROZEN (B3 baseline v0.2 provisioning-step increment, batch 141,
> 2026-09-21; W25 real-machine finding fix; 0.2.1 provision dependency-resolution
> annotation, batch 146, 2026-09-21)
> Scope: direct `.unitypackage` import and `local-reusable` VPM creation/installation
> Updated: 2026-09-21
> Previous: [v0.1](material-intake-v0.1_EN.md) (2026-09-05, kept as history)

The ONLY word-face change in v0.2 versus v0.1: the closed step-kind set gains
`provision_project` (plan schema promoted to
`schemas/amf-production/v0.2/material-plan.schema.json`, `plan.schemaVersion = "0.2"`).
The inspection (source) word face stays v0.1; the `source` embedding inside a Build
Record is therefore unaffected.

v0.2.1 (batch 146, user ruling "finish the SDK import before real-machine
acceptance"): annotation only — the provision step's execution semantics widen to
"create AND resolve-and-download the project's declared SDK dependencies (a network
operation)"; the plan schema's step-kind closed set is unchanged (still the one
`provision_project` kind), the wire/provider-host face is untouched, and
`resolve_project` is an internal supply-step fact never exposed through the desktop
gateway.

## Batch and naming

The user selects one source folder. Its folder name becomes the visible package name; collisions are shown as
`Name (2)`, `Name (3)`. VUA generates and persists a valid local VPM machine ID without asking the user to see or
enter it.

Every `.unitypackage` below the folder, including descendants, enters one batch in normalized relative-path order.
Inspect records each package's relative path, size, SHA-256, and archived asset paths, then digests the complete
source and executable-risk inventory. Execution recomputes both; any addition, removal, replacement, or risk change
returns `vua.material.source_drift`.

## Risk decision

VUA scans C#, managed assemblies, native plugins, `Editor` content, and likely build entry points. One batch receives
one choice: create a full project protection point and continue, ignore the risk and continue (optionally remembered
for this session only), or cancel. The second choice skips the extra full protection point but every B3 mutation still
gets a minimum recovery snapshot of `Assets`, `Packages`, `ProjectSettings`, and the VPM manifest; the first also
includes `UserSettings`. The decision binds both digests, and session memory is not persisted. VUA does not claim
that a project snapshot prevents code execution or reverses effects outside the project.

## Dependency declarations

The source folder may carry an optional `vua-dependencies.json` — a JSON object mapping
package id to version range, e.g. `{ "com.vrchat.avatars": "3.10.x" }`. Declarations are
curated by the user/Recipe and **never auto-detected**: Inspect reads them into the source
fingerprint (editing the file after planning is refused as `vua.material.source_drift`);
`local-reusable` package production writes them verbatim into the produced package's
`dependencies`, where `vrc-get` resolves and installs them in the target project. A missing
file means "no declarations"; an unparseable file fails as `vua.material.deps_invalid` —
never a silent empty.

## Dual entry

- `direct_unity_package` imports every source package in plan order through the versioned Bridge after a verified
  target-project snapshot.
- `local_reusable_vpm` imports the whole batch in an isolated token-bound staging project, creates an Editor/Runtime
  layout and explicit dependency manifest, then uses VUA's `vrc-get` adapter to preview, install, and independently
  validate the target project.

## Project provisioning (v0.2 addition)

When the target project carries no `ProjectSettings/ProjectVersion.txt`, the plan inserts a
`provision_project` step — the same conditional and honest model as the recipe chain
(the assembly plan):

- **Conditional**: an already-provisioned project plans EXACTLY the v0.1 step set (zero word-face
  change); the condition's presence is plan content, so the two plan hashes differ (the assembly
  conditional-plan precedent).
- **Executed only after confirmation**: the provision step runs after the user confirms the plan
  review — never a silent project creation.
- **Step order**: provisioning sits AFTER the recovery snapshot and BEFORE the first project
  mutation (import/install). The snapshot precedes every mutation.
- **Execution routing**: creation goes through the standing VPM backend port
  `VpmBackend::create_project` (E-VPM-DUAL: the vrc-get library template copy, or VCC
  `vpm new`). The vrc-get CLI has no creation command (provision.rs Fix 4); no new CLI
  dependency. The executor re-checks the condition at execution time (the assembly run-step
  idempotence): a project that appears between plan review and execution skips creation and the
  plan-time fingerprint chain continues.
- **Dependency resolution (v0.2.1 addition, batch 146)**: the creation template only DECLARES
  the SDK dependencies in `Packages/vpm-manifest.json` (`com.vrchat.base` /
  `com.vrchat.avatars`) — the pure template copy does not vendor the package bodies. After
  creation succeeds and BEFORE the baseline re-read, the executor resolves the project's
  declared dependencies through the backend port `VpmBackend::resolve_project` — resolved from
  the ENABLED repositories (the disabled-set semantics are the F4 collection-world law),
  installed into `Packages/`, with the locked section written back. This is a NETWORK
  operation, and the honest word face says so: "resolve and download the project's declared
  SDK dependencies". Only the fresh-creation path resolves (an already-provisioned target
  skips both creation and resolution — the idempotent re-check status quo); resolution is
  idempotent itself (locked requirements already satisfied answer `already_satisfied`). A
  backend without the face (the VCC CLI stays honestly declared-none) is refused through the
  trait-default absence arm with the `capability_missing` family — never a guessed success.
  The resolve receipt (`vua.vpm-resolve-receipt/v0.1`: resolved / already_satisfied / failed)
  is an internal supply-step fact, never exposed through the desktop gateway.
- **Baseline re-read**: the brand-new project's state is not the plan-time state. After a
  successful provision the executor re-reads the Unity-side baseline fingerprint through a
  read-only Inspect (the staging chain's inspect-first discipline) and binds subsequent mutating
  commands to it — the plan-time project-tree digest is never carried into the new project's
  fingerprint chain. The re-read is pinned AFTER dependency resolution: the baseline covers the
  final post-resolve state, never a pre-resolve intermediate.
- **Compensation**: a failed provision rolls the pre-provision snapshot back. For an
  unprovisioned target that snapshot IS the empty state: the restore moves half-initialized
  creation content into the recovery quarantine (`.vua/recovery/`) — equivalent to the assembly's
  "delete the half-initialized project and replan" semantics.
- **Error face**: a failed provision reports `vua.material.provision_failed` (the
  `vua.material.*` family rule) with the backend's original code and reason carried inside the
  message (the dependency-resolution arm folds in the same wrapper: a receipt whose `failed`
  set is non-empty carries the first dependency's reason code and id, reusing the standing
  codes — zero new codes); the failure still publishes its Build Record and never bypasses the
  receipt.

## Workflow stage mapping

| B step kind (`MaterialIntakeStepKind`) | Workflow stage |
| --- | --- |
| `verify_source` | `inspect` |
| `create_snapshot` | `snapshot` |
| `provision_project` | `execute` |
| `import_unity_packages` | `execute` |
| `create_local_vpm_package` | `execute` |
| `preview_vpm_install` | `execute` |
| `apply_vpm_install` | `execute` |
| `validate_minimum_structure` | `validate` |
| `write_build_record` | `completed` |

Desktop note: the desktop currently renders the AMF coarse stage track
(warehouse/recipe/assembly/production/inspection/release) and does not render plan step
kinds individually; the desktop presentation of the provision step belongs to a desktop
consumption slice, not this word-face batch.

## Staging project contract

The isolated staging project is built from a VUA-bundled template — two text files, an
empty `Assets/` folder, plus the embedded **Bridge scaffold** (the `com.ph-r.vua` package
and a `nadena.dev.modular-avatar.core` compile stub, both VUA-authored code embedded at
client compile time; a staging project without the Bridge can execute no Bridge command at
all):

- `ProjectSettings/ProjectVersion.txt` — the baseline-locked Unity version (`2022.3.22f1`);
- `Packages/manifest.json` — the fixed VPM dependency lock (e.g. `com.vrchat.avatars` / `com.vrchat.base`
  `3.10.11`, `com.unity.textmeshpro` `3.0.6`) plus the `VRChat` scoped registry
  (`https://packages.vrchat.com`).

The template versions live as constants in the orchestrator; a VRChat SDK deprecation ships a small
client update of these two text files. At run time the client unpacks the template into the staging
directory and calls the `vrc-get` lib backend to resolve and install the manifest dependencies
(first resolution needs network access; the vrc-get package cache serves later runs). The staging
project then holds the same SDK base VCC would produce, with nothing preinstalled on the user
machine.

Operational rules:

- The staging directory lives at `%TEMP%\VUA_Staging_{session_id}` — never under user-visible
  folders such as Downloads or Desktop, where real-time antivirus scanning produces file locks.
- The staging project serves exactly one atomic task: producing the local VPM package. Once the
  package file has been moved into the user-designated local-reusable directory, the staging
  project is destroyed immediately (`remove_dir_all`) on success, failure, and panic paths alike;
  leftovers would poison later runs through path conflicts and lock files.

Both paths use `validate_asset_paths` to prove only `minimum_structure`. AssetDatabase loading does not establish
Avatar, outfit, material, animation, or Modular Avatar semantics.

Plans conform to `schemas/amf-production/v0.2/material-plan.schema.json`; immutable results conform to
`schemas/amf-production/v0.1/build-record.schema.json`. A completed Bridge mutation receipt binds
`commandId` to the command digest. Interruption before that receipt requires Inspect and cannot
automatically replay an unknown side effect.

## Positive and negative vectors

`schemas/amf-production/v0.2/vectors/material-plan/`: two positives — the unprovisioned-target
plan (with `provision_project` sitting after the snapshot and before the import) and the
provisioned-target plan (the unchanged v0.1 step set) — plus one negative pinning the closed
step-kind set (an invented kind must not validate). The consumption test lives in
`crates/unity-bridge/tests/material_intake.rs`.
