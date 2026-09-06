# VUA development plan outline

[English](development-outline_EN.md) | [简体中文](development-outline_ZH.md)

> Document version: 1.0.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors development-outline_ZH.md at 1.0.0)
> Scope: v0.4 rebuild baseline through stable `1.0.0`
> Normative effect: Schedules accepted work without expanding the product boundary

## Goal and baseline

Since 2026-09-06, work is organized as a **single integration branch plus vertical slices**
(structural ruling: governance reform §8; coordination mechanism: `collab/README.md`). The plan
keeps the M/F/B numbering as the gate sequence and role-responsibility split:

- **M (Main gate)** is the product gate sequence. It owns paired documentation, migration closure,
  frontend/backend integration, cross-component acceptance, release notes, and product-version
  updates. An M gate is a tag on the integration branch plus an acceptance checklist: once the gate
  checklist is green, the tag is cut and release notes are published. It is no longer a merge event
  across physical branches.
- **F (Frontend role)** owns Electron Main/Preload, React Renderer, the design system, remote web
  surfaces, and desktop overlay presentation.
- **B (Backend role)** owns Orchestrator, persistence, application contracts, BDL,
  project/environment adapters, and Unity Bridge.

F and B are roles, not physical lanes: the long-lived F-line/B-line branches were abolished on
2026-09-06. One vertical-slice branch carries the schema (when involved), Rust, TypeScript, tests,
and documentation together, with the same session wearing both the F and B hats; the B role keeps
schema-freeze responsibility and the F role keeps registration responsibility. M does not repeat
their internal implementation; it accepts slice outputs at the corresponding gate and updates the
single product version.

```text
F0 ─┐    F1 ─┐    F2 ─┐                      F10 ─┐
    ├→ M0    ├→ M1    ├→ M2 → ...                ├→ M10
B0 ─┘    B1 ─┘    B2 ─┘                      B10 ─┘
 v0.4.0   v0.4.1   v0.4.2                    v1.0.0
```

In the diagram, F/B feeding into M means role outputs are accepted at the gate, not that physical
branches merge. M gates close in order. Contracts and migration results accepted by one gate form
the next shared baseline. Unblocked work may start early inside slices, but it cannot create a
product release without its M gate.

The following is the starting-state snapshot taken when the plan was accepted (2026-09-04, the v0.4
rebuild baseline); see each gate section for the latest acceptance status:

- `_references/kimi-desktop-5870d0c` is a presentation-asset extraction source only.
- `unity/Packages/com.ph-r.vua`, `schemas/unity-bridge/v1`, and the Orchestrator Bridge adapter have a
  first migrated and locally verified baseline.
- `crates/orchestrator` is a testable Rust core; JSONL journal and StateFile remain transitional.
- The Electron shell, versioned Gateway, authoritative SQLite task state, and real vertical slices remain
  scheduled work.
- The backend worktree has completed a feasibility spike for converting `.unitypackage` inputs into
  local VPM packages. Isolated Unity conversion, clean-project package discovery, and loading one
  expected asset have evidence; installation through VUA's `vrc-get` package manager remains a pre-B3
  closure item.
- Runtime integrations, community-plugin execution, and a marketplace do not begin before `1.0.0`.

## Shared execution discipline

1. Accept a versioned application contract before the F/B roles implement a cross-boundary behavior
   inside the same slice.
2. F/B role tests may use a mock peer; an M gate uses the real artifacts from both ends.
3. Mutating slices cover applicable Inspect, Plan, Confirm, Snapshot, Execute, Validate, and Recover
   behavior, including cancellation, retry, drift, and restart recovery.
4. Every M gate synchronizes `_EN.md` / `_ZH.md` documentation, migration evidence, protocol or schema
   versions, release notes, and the single product-version source.
5. Repository and cloud-CI tests use structurally representative synthetic pages, projects, and files
   without real product or user content. Local read-only compatibility tests may access public BOOTH
   pages, and local Unity integration and smoke tests may use assets lawfully obtained by a developer.
   Real sessions, orders, paid assets, user projects, page captures, test configuration, and outputs do
   not enter the repository or cloud artifacts.
6. F/B numbers identify role-responsibility splits, not product versions. Only M gates update product
   SemVer and Git release state.
7. Coordination conclusions count only once they land in `collab/` (mechanism: `collab/README.md`).
   The paired-letter coordination mode under `docs/plans/` is abolished; plans/ remains a local
   scratch area with no coordination authority.

## M sequence: Main integration and delivery

### M0 — v0.4.0: Rebuild baseline closure

> Acceptance: **Passed (2026-09-04)**. Unity `2022.3.22f1` EditMode 14/14, idempotent assembly,
> Batchmode `inspect_project`, 187 Rust workspace tests, Clippy, TypeScript checks/tests/production builds,
> and relative-link checks across 78 Markdown files all passed. Product version remains `0.4.0`.

- **Documentation:** freeze product boundaries, the non-modular host shape, Electron/Orchestrator/Unity
  ownership, Unity `2022.3.22f1` compatibility, and migration authority.
- **Migration:** close the Unity Bridge v1 and presentation-asset ledgers with retained behavior,
  rejected assumptions, licenses, and evidence.
- **Integration:** prove that the C# package, schema, Rust adapter, and Electron assets have no old-tree
  or machine-absolute dependency.
- **Delivery:** pass local EditMode, idempotent assembly, Batchmode `inspect_project`, and documentation
  link checks; synchronize product version `0.4.0`.

### M1 — v0.4.1: Electron and backend migration baseline

> Acceptance: **Passed (2026-09-04)**. Electron Main starts and invokes a controlled Mock Provider through
> the Gateway, with capability values derived from the Provider report. Twenty-four TypeScript tests,
> the production build, Electron process lifecycle, and the real remote-permission smoke pass; product
> version and paired release notes are updated to `0.4.1`.

- **Documentation:** accept the Electron security baseline, design standard v0.6.1, minimal Gateway
  boundary, and backend migration inventory.
- **Migration:** combine F1's minimum shell with B1's Orchestrator/Unity baseline without Tauri-private
  mechanisms.
- **Integration:** start Main, Preload, and Renderer and verify the Gateway through a controlled test
  Provider.
- **Delivery:** pass type, unit, production-build, Electron lifecycle, and remote-permission smoke checks;
  publish version and notes for `0.4.1`.

### M2 — v0.4.2: Application contract and durable-task loop

> Acceptance: **Passed (2026-09-04)**. Electron drives the supervised real Provider process through the Gateway (frame protocol v0.1, single-instance lock, Windows process-tree containment, SQLite authoritative task state); the five deliverables — reload, multi-window, temporary disconnection, process shutdown, restart recovery — passed with 11/11 checks in `smoke:m2-deliverables` (evidence kept locally); the application contract v0.1 was frozen as stable Gateway v1; 302 TypeScript and 48 Rust tests (6 real-asset manual tests ignored by design), strict Clippy, and all quality gates pass; the product version is 0.4.2 with bilingual release notes.

- **Documentation:** freeze Gateway v1, Provider lifecycle, authoritative SQLite state, and the accepted
  Orchestrator-hosting ADR.
- **Migration:** convert JSONL/StateFile behavior into SQLite characterization and migration tests.
- **Integration:** connect F2 task interaction to B2's real Provider, task, cancellation, and recovery.
- **Delivery:** pass Renderer reload, multi-window, transient disconnect, shutdown, and restart recovery;
  publish version and notes for `0.4.2`.

The standalone `v0.4.3` architecture spike is removed. The core-composition framework no longer enters
the product. B2 performs the Orchestrator-hosting comparison; M2 accepts its result and M3 consumes it.

### Pre-B3 spike (no product version): VPM asset-package creation and installation path

This spike adds a parallel path beside importing a `.unitypackage` directly into a VUA-controlled Unity
project: preserve the source artifact, create a local VPM package in an isolated Unity `2022.3.22f1`
staging project, then install it into the target project through VUA's `vrc-get` package manager. Package
creation, installation, and public publication are separate use cases. M3 accepts only `local-reusable`
creation and installation; `publishable` validation and repository publication remain separately
scheduled.

Review of the backend worktree's `_local_b3/vpm-spike/SPIKE_FINDINGS.md` accepts this feasibility evidence:

- conversion in a new process after Unity finishes source-package import creates an observable phase
  boundary;
- the generated package has a root `package.json`, and a separate validation project discovers it and
  loads one expected asset;
- offline reconstruction can produce a candidate package but lacks Unity import, compilation,
  serialized-reference, and semantic validation, so it remains an experimental degraded result;
- a disposable project protects user-project state, while imported Editor scripts still execute with
  the developer's Windows authority.

The spike closes these gaps before B3 production implementation begins:

1. install the generated package into a clean validation project through the minimum VUA `vrc-get`
   adapter; direct copying into `Packages/` remains creation-feasibility evidence only;
2. repeat conversion in two clean run roots and compare normalized package manifests and archive digests,
   while also comparing the source-file digest before and after execution;
3. define per-process timeout, cancellation, exit-code, residual-process cleanup, disk-interruption
   recovery, a versioned result schema, and stable result codes;
4. decide scanning, warning, per-execution consent, and rejection policy for script-bearing inputs;
5. define package-ID ownership, dependency declarations, Editor/Runtime layout, hard-coded `Assets/`
   paths, and license evidence. Loading one expected asset proves minimum structure, not the semantic
   correctness of an entire Avatar or outfit.

### M3 — v0.5.0: First Electron–Orchestrator–Unity vertical delivery

- **Documentation:** record the first end-to-end use case, error/recovery semantics, minimal Build Record,
  Bridge operation coverage, and contracts for direct import and local VPM creation/installation.
- **Migration:** extract only the legacy page behavior and Unity semantics required by this slice.
- **Integration:** combine F3 and B3 and run Inspect through Recover with a synthetic Avatar, outfit, and
  global Unity `2022.3.22f1` project through both direct `.unitypackage` import and local VPM creation
  followed by installation through VUA's package manager.
- **Delivery:** both paths pass success, cancellation, drift, timeout, Bridge rejection,
  successful/failed rollback, and idempotent replay. VPM results distinguish `unityValidated` from
  experimental offline output; publish `0.5.0`.

> Progress note (2026-09-06): T1 (the M3 revision path), T2 (production surface v0.2 registration),
> and I-3 (branch integration — the three lanes were unified into the integration branch `main`) are
> complete; the remaining gate item is I-1, the real Unity matrix.

### M4 — v0.6.0: Warehouse, acquisition, and BDL

- **Documentation:** freeze remote-content, session, download-port, LocalArtifact, and minimal BDL formats.
- **Migration:** close browser, download, Warehouse-page, and source-data migration entries.
- **Integration:** connect F4 isolated browse/download UI with B4 acquisition, inspection, and BDL mapping.
- **Delivery:** make an authorized download enter Warehouse through a recoverable inspected task; publish
  `0.6.0`.

### M5 — v0.7.0: Recipe and AMF production path

- **Documentation:** freeze Recipe, Local Resolution, Build Record, and added Unity Bridge operations.
- **Migration:** close Recipe/Warehouse presentation and lawfully held local-test migrations.
- **Integration:** connect F5 workbenches with B5 resolution, planning, Unity jobs, validation, and recovery.
- **Delivery:** reproduce a lawfully held local Avatar-plus-outfit smoke path; publish `0.7.0`.

### M6 — v0.8.0: Project management and environment deployment

- **Documentation:** freeze `vrc-get`, ALCOM/VCC compatibility, environment diagnosis, and experimental
  EAC recovery boundaries.
- **Migration:** close retained environment-check, project-detection, and deployment-guidance behavior.
- **Integration:** connect F6 guidance/plan/confirmation UI with B6 project, environment, network, disk,
  and process adapters.
- **Delivery:** report all three project paths honestly and prepare a minimum production environment;
  publish `0.8.0`.

### M7 — v0.9.0: Inspection, Release, and the desktop overlay

- **Documentation:** freeze evidence, Release/Build Record browsing, official SDK handoff, and desktop
  overlay snapshot boundaries.
- **Migration:** close report, result-presentation, and desktop-overlay migration entries.
- **Integration:** connect F7 Inspection/Release/desktop-overlay surfaces with B7 reports, snapshots,
  and read-only services.
- **Delivery:** make results reviewable, recoverable, and transferable to official upload while desktop
  overlay failure remains non-blocking; publish `0.9.0`.

The VR Dashboard/VR Overlay does not enter this gate or `1.0.0` (user ruling, 2026-09-06); see the
v1.1 anchor in "After `1.0.0`".

### M8 — v0.10.0: Beta 1 feature and contract freeze

- **Documentation:** freeze the `1.0.0` feature set, public contracts, compatibility, and catalog risk gate.
- **Migration:** complete every schema, database, and configuration path required by `1.0.0`.
- **Integration:** combine F8/B8 closure, performance baselines, and Provider lifecycle soak tests.
- **Delivery:** boot, degrade, shut down, and recover the full product with no pending catalog risk;
  publish `0.10.0`.

### M9 — v0.11.0: Beta 2 recovery, security, and release validation

- **Documentation:** complete install, update, rollback, diagnostic-redaction, security, compatibility,
  and support guidance.
- **Migration:** rehearse upgrade, downgrade, backup, uninstall retention, and corruption recovery.
- **Integration:** combine F9/B9 accessibility, performance, security, recovery, and lawfully held smoke
  matrices.
- **Delivery:** leave release-candidate defects only; publish `0.11.0` and optionally `1.0.0-rc.1`.

### M10 — v1.0.0: Stable release

- **Documentation:** complete four-language READMEs, paired developer docs, Release Notes,
  Apache-2.0/NOTICE, contribution, and support entry points.
- **Migration:** verify every supported old-version path to `1.0.0`.
- **Integration:** lock F10/B10 artifacts, installer, Provider, Unity package, protocols, and diagnostics.
- **Delivery:** pass Windows CI, signing, install, update, rollback, license, and full smoke gates; publish
  `v1.0.0`.

## F sequence: Frontend / Electron

The F sequence is the Frontend role's responsibility split, executed as vertical slices; it no longer
corresponds to physical branches.

### F0: Presentation asset classification

Extract React page models, i18n, accessibility, tokens, and primitives. Register shell, remote-page,
image, tutorial, and task-interaction targets while rejecting Tauri windows, IPC, permissions, and old
data contracts.

### F1: Electron desktop baseline

Establish Main, Preload, React Renderer, Vite, design system, and minimum navigation shell; pin runtime
versions; expose only an explicit Gateway; deny Node and local Gateway access to remote test content.

### F2: Gateway client and task experience

Implement the typed client, read-only environment snapshot, task center, submit/observe/cancel, reload
recovery, multi-window synchronization, and explicit disconnect state, independently tested with a mock
Provider.

### F3: First production vertical page

Implement inspection, plan review, confirmation, live progress, structured diagnostics, recovery result,
and minimal Build Record presentation across success, cancellation, drift, timeout, and rollback states.

### F4: Remote acquisition and Warehouse

Implement Main-managed `WebContentsView`, isolated sessions, permission/navigation/download interaction,
Warehouse list/filter/detail, and LocalArtifact state without exposing cookies, tokens, or Electron objects.

### F5: Recipe and Assembly workbenches

Implement asset choice, compatibility evidence, missing assets, version locks, manual correction, plan
diffs, Assembly tasks, recovery, and three Recipe views sharing selection and domain semantics.

### F6: Project and environment pages

Implement VUA/ALCOM/VCC capability presentation, diagnosis, deployment plan, confirmation, manual paths,
and per-execution warning and consent for the experimental high-risk EAC action.

### F7: Inspection, Release, and the desktop overlay

Implement reports, official/local conclusion distinctions, versions, snapshots, Build Records, SDK handoff,
and desktop overlay presentation over stable snapshots and semantic actions. The VR Dashboard/VR Overlay
does not enter `1.0.0`; see "After `1.0.0`".

### F8: Beta 1 frontend freeze

Close page-flow, error/empty, internationalization, and performance gaps; freeze the `1.0.0` Gateway usage
surface and design-system public surface.

### F9: Beta 2 frontend validation

Complete keyboard, screen-reader, zoom, high-contrast, DPI, minimum-window, remote-content security, and
installer/update UI validation.

### F10: Stable frontend artifacts

Freeze Electron/Chromium/Node/Vite/packaging dependencies, produce signed installer/update artifacts,
and prove production builds contain no fixtures, debug entries, credentials, or private logs.

## B sequence: Backend / Orchestrator / Unity

The B sequence is the Backend role's responsibility split, executed as vertical slices; it no longer
corresponds to physical branches.

### B0: Unity Bridge and Orchestrator migration closure

Establish Bridge v1 schema, C# package, synthetic fixtures, local EditMode, idempotent assembly, and
Batchmode `inspect_project`; inventory retained Rust behavior and transitional persistence debt.

### B1: Backend application-contract baseline

Organize Command, Query, Event, Task, Capability, error, revision, cancellation, and use-case boundaries;
establish a replaceable Provider interface and mock adapter without leaking FFI, transport, or Rust types.

### B2: Durable tasks and Orchestrator-hosting decision

Establish authoritative SQLite tasks, cancellation, idempotency, post-commit events, and restart recovery.
Compare in-process native and supervised-process Providers with the same Gateway/recovery suite across
packaging, signing, crash isolation, handshake/callback, shutdown, process tree, latency, debugging, and
removal. Produce an accepted hosting ADR. This backend spike does not consume a product version.

### B3: First Orchestrator–Unity use case and dual asset inputs

Implement fingerprint, plan, snapshot, versioned Bridge jobs, validation, recovery, and a minimal Build
Record with synthetic Recipe/Avatar/outfit/project fixtures. Retain direct `.unitypackage` import and add
a parallel path with an immutable source, isolated Unity staging, `local-reusable` VPM creation, minimum
`vrc-get` installation, and clean-project validation. Model creation, installation, and publication
separately; keep offline conversion as an experimental risk result; cover cancellation, drift, timeout,
rejection, rollback, and idempotent replay.

### B4: Acquisition and BDL

Implement acquisition use cases, normalized download events, source correlation, retry/recovery,
LocalArtifact inspection, Warehouse mapping, and minimal BDL SQLite schema. Repository and cloud-CI
tests use structurally equivalent synthetic pages and files. Local read-only compatibility tests access
public BOOTH pages through normal public entry points without persisting page responses, screenshots,
or product metadata as fixtures.

### B5: Recipe and production expansion

Implement Recipe v0.3, Local Resolution, compatibility/missing evidence, locks, plans, and complete
Build Records. Recipe v0.2 remains only until v0.3 is finalized and is then retired in full without a
migrator. Expand Unity Bridge schema, dry-run, idempotency, recovery, and C#/application tests per
operation. Cloud matrices use synthetic projects. Local integration and smoke matrices may use Avatar,
outfit, and related Unity assets lawfully obtained by a developer; assets, projects, configuration, and
outputs remain local.

### B6: Project and environment adapters

Generalize the minimum local VPM installation slice from B3 into VUA's complete `vrc-get` project and
package-management path. Implement ALCOM/VCC capability detection, Unity/VRChat/SteamVR checks,
network/disk/residual-process failures, and the tightly bounded experimental EAC recovery adapter.

### B7: Inspection, Release, and desktop overlay services

Implement functional, performance, dependency, lighting, and upload-readiness evidence plus project
versions, snapshots, Build Records, SDK handoff, and read-only desktop overlay surface services. The
overlay owns no tasks or sensitive data.

### B8: Beta 1 backend freeze

Freeze `1.0.0` application contracts, schemas, and database migrations; soak Provider lifecycle, task
recovery, concurrency, performance, and disk behavior; apply `vua.risk-gate/v1` to release catalog entries.

### B9: Beta 2 backend validation

Complete upgrade/downgrade/corruption recovery, Provider startup/handshake failures, diagnostic redaction,
compatibility, security review, and lawfully held smoke validation.

### B10: Stable backend artifacts

Freeze Rust, Provider, SQLite, Unity package, and third-party dependencies; generate or validate version
metadata, license inventory, signing/update artifacts, and uninstall-retention behavior.

## After `1.0.0` (non-committal outlook)

The following directions are anchors only and **none of them is a commitment**. Before any direction
starts, it must establish its own independent M/slice plan and acceptance decision under the standing
discipline; this table creates no product requirements.

| Version anchor | Direction |
| --- | --- |
| v1.1 | Overlays (VR Overlay and the overlay system) |
| v1.2 | Native integrations (face tracking, motion tracking, and other integrated runtimes) |
| v1.3 | Plugin system (execution, catalog/marketplace governance) |
| v1.4 | Avatar VN3 screening and cataloging |
| v1.5 | Avatar compatibility screening and cataloging |

Runtime-tool integration, community-plugin execution, and a plugin marketplace do not begin before
stable `1.0.0` (standing product boundary).

## Document changelog

- 1.0.0 (2026-09-06): moved into version control. Coordination switched to collab/ (the plans/ letter
  mode is abolished); M gates redefined as integration-branch tags plus acceptance checklists; F/B
  changed from physical lanes to role responsibilities; M7/F7/B7 narrowed with the VR Dashboard/VR
  Overlay removed from `1.0.0`; "After `1.0.0`" rewritten as the non-committal v1.1–v1.5 outlook; M3
  progress note appended; the starting baseline marked as the 2026-09-04 snapshot.
