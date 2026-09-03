# AMF and Unity Bridge architecture

[English](amf-unity_EN.md) | [简体中文](amf-unity_ZH.md)

> Status: Accepted
> Scope: AMF application services, Recipe, Build Record, `unity/`
> Updated: 2026-09-03
> Normative effect: Yes

## AMF production model

AMF treats Recipe as desired intent: the user first selects lawfully acquired assets and a target
combination, then the system resolves the project, dependencies, and execution steps.

```text
Warehouse → Recipe → Assembly → Inspection → Release
```

- **Warehouse** discovers, downloads with authorization, previews, identifies, and organizes assets
  through the native browser/content manager and optional adapters.
- **Recipe** describes project-independent asset identities, parameters, and intent; asset files stay
  in the user's local Warehouse.
- **Assembly** resolves local assets and capabilities into ProjectSpec, dependencies, and a reviewable
  plan, then Orchestrator performs project and Unity Bridge work. Prompts, progress, and recovery are
  represented as task states.
- **Inspection** reports function, performance, dependencies, lighting, and upload readiness.
- **Release** manages Build Records, snapshots, recovery, and handoff to the official SDK upload flow.

A Recipe is portable, declarative intent. Importing one always requires local resolution before a
plan can be produced.

## Warehouse, acquisition, and BDL

- **Electron desktop adapter** isolates pages, sessions, and download transport; enforces permission,
  navigation, origin, destination, and file restrictions; and returns normalized events. Cookies,
  tokens, and private Electron objects remain inside the desktop adapter.
- **AMF acquisition** owns browsing/download use cases, user intent, source correlation, durable
  tasks, retry/recovery, and file inspection. Desktop ports provide its complete Electron access.
- **Warehouse** owns the user-facing asset, source, preview, import, and correction experience.
- **BDL** stores AMF's normalized product, subproduct, file, terms, alias, compatibility, source,
  search, and mapping metadata.

Every module, plugin, and view reaches BDL-backed information through AMF use cases. AMF performs
authorization, semantic interpretation, and result shaping.

## Project compatibility

AMF uses three explicit project-management paths: VUA's own `vrc-get`-based package manager,
capability-aware management of ALCOM-managed projects, and capability-aware management of VCC-managed
projects. The latter two use documented project-compatibility boundaries for those applications.
Unknown format, lock, or capability means read-only inspection, conversion advice, or manual handoff.

## Build Record

Each production run retains an immutable record linking the Recipe version and fingerprint, resolved
local assets and provenance, Unity/VPM/tool versions, ProjectSpec, approved plan, initial/final project
fingerprints, Bridge requests/results/warnings/inspection summary, and snapshots/recovery points. Its
content is limited to reproducibility metadata and excludes session secrets, upload identity, and
redistribution-restricted asset contents.

## Unity editor compatibility

The production path uses global Unity `2022.3.22f1` exactly. Projects declaring `2019.4.31f1` or
`2022.3.6f1` enter the backup-and-migration path before Bridge work. Other Unity versions report their
exact difference from the production target and receive installation guidance; VUA keeps
`ProjectSettings/ProjectVersion.txt` unchanged. Tuanjie Engine is currently unsupported. The
[Unity editor compatibility policy](../compatibility/unity-editor_EN.md) owns the complete matrix and
promotion rules.

## Unity Bridge boundary

The Unity `2022.3.22f1` Editor package inspects projects and imported assets; uses stable GUID and
`GlobalObjectId` references; validates and dry-runs supported operations; performs bone, menu,
parameter, animation, material, and Modular Avatar component work through public APIs; and returns
structured changes, diagnostics, fingerprints, and retry information.

AMF and Orchestrator retain the user journey, Recipe, downloads, credentials, approvals, and project
history. Bridge requests and results use versioned schemas in a controlled `.vua` job directory. Project-fingerprint
mismatch rejects mutation. Repeated command IDs follow protocol idempotency. A valid snapshot or
provable compensation boundary precedes mutation. Repository and cloud-CI tests use structurally
equivalent synthetic projects and assets without real product or user content. Developers may use
lawfully obtained assets for local Unity integration and smoke validation; the assets, projects,
configuration, and outputs remain local. Deterministic operations use defined Bridge commands.
