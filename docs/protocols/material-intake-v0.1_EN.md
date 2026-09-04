# AMF material-intake protocol v0.1

[English](material-intake-v0.1_EN.md) | [简体中文](material-intake-v0.1_ZH.md)

> Status: B3 implementation baseline
> Scope: direct `.unitypackage` import and `local-reusable` VPM creation/installation
> Updated: 2026-09-03

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

## Dual entry

- `direct_unity_package` imports every source package in plan order through the versioned Bridge after a verified
  target-project snapshot.
- `local_reusable_vpm` imports the whole batch in an isolated token-bound staging project, creates an Editor/Runtime
  layout and explicit dependency manifest, then uses VUA's `vrc-get` adapter to preview, install, and independently
  validate the target project.

## Staging project contract

The isolated staging project is built from a VUA-bundled minimal template — two text files plus an
empty `Assets/` folder; no DLLs and no source code:

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

Plans conform to `schemas/amf-production/v0.1/material-plan.schema.json`; immutable results conform to the sibling
`build-record.schema.json`. A completed Bridge mutation receipt binds `commandId` to the command digest. Interruption
before that receipt requires Inspect and cannot automatically replay an unknown side effect.
