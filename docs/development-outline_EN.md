# VUA development plan outline

[English](development-outline_EN.md) | [简体中文](development-outline_ZH.md)

> Document version: 2.0.9
> Status: Accepted
> Authority: Simplified Chinese (EN mirror, synced to 2.0.9)
> Scope: v0.4 rebuild baseline through stable `1.0.0`
> Normative effect: Schedules accepted work without expanding the product boundary

## Goal and baseline

Since 2026-09-06, work is organized as a **single integration branch plus vertical slices**
(structural ruling: governance-reform §8; coordination mechanism: `collab/README.md`). M is the
product gate sequence; on the execution side, 2.0.0 divides work into **six roles** (next section),
replacing the former M/F/B three lanes and the transitional F/B two-role arrangement.

An M gate is a tag on the integration branch plus an acceptance checklist: once the gate checklist
is green, the tag is cut and release notes are published. M gates close in order. Contracts and
migration results confirmed by a previous gate form the next shared baseline; work that does not
depend on an unsettled contract may proceed early inside slices, but it cannot create a product
release while bypassing its M gate.

The following is the starting-state snapshot taken when the plan was accepted (2026-09-04, the v0.4
rebuild baseline); see each gate section and `collab/BOARD.md` for the latest acceptance status:

- `_references/kimi-desktop-5870d0c` is a presentation-asset extraction source only.
- `unity/Packages/com.ph-r.vua`, `schemas/unity-bridge/v1`, and the Orchestrator Bridge adapter have
  completed the first round of migration and local validation.
- `crates/orchestrator` is a testable Rust application core; the JSONL journal and StateFile remain
  transitional implementations.
- The Electron shell, the versioned Gateway, authoritative SQLite task state, and real vertical
  slices still need to be completed per this plan.
- The backend worktree completed a feasibility spike converting `.unitypackage` inputs into local
  VPM packages: isolated Unity conversion, clean-project package discovery, and loading one expected
  asset have evidence; installation through VUA's `vrc-get` package manager remains a pre-B3
  closure item.
- Runtime-tool integration, community-plugin execution, and a marketplace are not implemented before
  stable `1.0.0`.

## Execution roles (six roles)

Roles are **responsibility and ownership splits**, not branches, not worktrees, and not fixed people
or sessions. One agent session may play several roles within a slice; behavior crossing role
boundaries still goes through versioned contracts. Role-to-code-ownership mapping (crate layout:
`docs/architecture/system_EN.md`):

| Role | Responsibility domain | Code / documentation ownership |
| --- | --- | --- |
| **Integration** | M-gate acceptance, releases and versions, governance documents, merge and conflict rulings, REGISTRY/BOARD maintenance, CI | `main` branch, `docs/`, `collab/`, `.github/` (once a remote exists) |
| **Desktop** | Electron Main/Preload, React Renderer, design system, remote web, desktop Overlay | `apps/desktop`, `packages/design-system`, `packages/contracts` (TS side) |
| **Core** | Task runtime, cancellation/recovery, application use cases, domain ports, application-contract types, Provider composition root | `crates/orchestrator`, `crates/provider-host`, `packages/orchestrator-provider`; application-contract, task-store, provider-process protocols |
| **Production** | Unity Bridge, material-entry execution, assembly, Build Record output, Unity-side C# packages | `crates/unity-bridge`, `unity/Packages`, `schemas/unity-bridge`, `schemas/amf-production` |
| **Data** | BDL, download events, warehouse import/maintenance, material inspection | `crates/bdl-store`, `crates/acquisition`, `schemas/bdl*`, `schemas/bdl-queries`, `schemas/download-events` |
| **Environment** | Project/environment adapters, `vrc-get`, ALCOM/VCC compatibility, environment detection | `crates/project-manager`, `environment*` inside the core (temporary, see `collab/proposals/004`) |

Responsibility rules:

1. **Schema-freeze responsibility belongs to the domain role**: the Data role freezes data-domain
   schemas, the Production role freezes production-domain schemas, and the Core role freezes
   cross-domain application contracts; disputes are arbitrated by the Integration role or escalated
   to a user ruling.
2. **The Desktop role owns TS-side registration**: once a contract lands, the Desktop role registers
   the contracts type surface and Gateway routes.
3. Every task has **exactly one owning role** in the documents (collaborators are listed
   separately); the owning role is accountable for the acceptance evidence.
4. Historical F/B numbers in older documents are kept for reference: F≈Desktop; B splits by domain
   into Core/Production/Data/Environment.

## Shared execution discipline

1. Settle a versioned application contract before the roles implement and test cross-frontend/
   backend behavior inside the same slice.
2. Each role's tests may use a mock peer; an M gate must complete integration verification with the
   real artifacts from both ends of that stage.
3. Mutating slices cover the applicable Inspect, Plan, Confirm, Snapshot, Execute, Validate, and
   Recover behavior and verify cancellation, retry, drift, and restart recovery.
4. Every M gate synchronizes matching `_EN.md` / `_ZH.md` documentation, migration evidence, protocol
   or schema versions, release notes, and the single product-version source.
5. Repository and cloud-CI tests use structurally representative synthetic pages, projects, and files
   without real product or user content. Local read-only compatibility tests may access public BOOTH
   pages, and local Unity integration and smoke tests may use assets lawfully obtained by a
   developer. Real sessions, orders, paid assets, user projects, page captures, test configuration,
   and outputs never enter the repository or cloud artifacts.
6. F/B historical numbers and task breakdowns do not update the product version; only M gates update
   product SemVer and Git release state.
7. Coordination conclusions count only once they land in `collab/` (mechanism: `collab/README.md`).
   The paired-letter coordination mode under `docs/plans/` is abolished; plans/ is a local scratch
   area only and carries no coordination authority.

## Current window (M5: Recipe and the AMF production mainline, v0.7.0)

> Snapshot date: 2026-09-08 (2.0.8 update: **M4 closed (v0.6.0, 2026-09-08)** — W12–W17
> delivered across the chain, W15 re-review passed + both fix items landed + user
> confirmation; M5 opens, the M4 task table is fully settled in the M4 section).
> Every task
> in this window is decomposed to a role; once complete, the
> Integration role accepts them and advances the M5 gate.

| # | Task | Owning role | Collaborators | Anchor / acceptance |
| --- | --- | --- | --- | --- |
| W18 | **M5 first batch**: proposal 008 path-a wiring — the "delete original material after generation" toggle = a desktop local preference; after the generate Done receipt, call the existing `warehouse.deleteOriginals` entry by entry (each deletion an independently audited task) | Desktop | Core, Data | proposal 008 accepted (integration ruling, 2026-09-08); authority boundary = desktop holds only the initiation timing, execution/guards/audit stay in the provider task face |
| W19 | **M5 first batch (merged design)**: import-time automatic-generation hook and orchestration semantics (the semantics of starting the generate task inside the import flow; desktop presentation + core/data task-face semantics designed in one batch) | Desktop | Core, Data | product-boundary 1.2.1 trigger-timing semantics; honest labeling removed when wired |
| W20 | Recipe v0.3, Local Resolution, version locks | Core | Data | existing M5 table row |
| W21 | Unity Bridge operation extensions (dry-run, idempotency, recovery) and the C# implementation | Production | Core | existing M5 table row |
| W22 | Full Build Record (plan diff, evidence digest) | Core | Production | existing M5 table row |
| W23 | Compatibility/missing-evidence model | Data | Core | existing M5 table row |
| W24 | Recipe/Assembly workbench (shared selection and domain semantics across three views) | Desktop | Core | existing M5 table row |
| W25 | Lawful self-owned asset smoke path and reproducibility | Production | Integration | existing M5 table row; real-machine window and lawful-asset environment variables |
| W26 | Gate acceptance and release (v0.7.0) | Integration | All | per the M4 closure precedent: document review → gate-item verification → version/release/push |

## M sequence: Main integration and delivery

### M0 — v0.4.0: Rebuild baseline closure

> Acceptance: **Passed (2026-09-04)**. Unity `2022.3.22f1` EditMode 14/14, idempotent assembly,
> Batchmode `inspect_project`, 187 Rust workspace tests, Clippy, TypeScript checks/tests/production
> builds, and relative-link checks across 78 Markdown files all passed; the product version remains
> `0.4.0`.

- **Documentation:** freeze the product boundary, the non-modular host shape,
  Electron/Orchestrator/Unity ownership, the Unity `2022.3.22f1` compatibility policy, and the
  migration authority order.
- **Migration:** complete the Unity Bridge v1 and presentation-asset classification ledgers, stating
  retained behavior, rejected assumptions, licenses, and evidence.
- **Integration:** confirm that the current C# package, schema, Rust adapter, and Electron assets do
  not depend on old worktrees or machine-absolute paths.
- **Delivery:** close the baseline with local Unity EditMode, idempotent assembly, Batchmode
  `inspect_project`, and documentation-link checks; unify the product version at `0.4.0`.

### M1 — v0.4.1: Electron and backend migration baseline

> Acceptance: **Passed (2026-09-04)**. Electron Main starts and invokes a controlled Mock Provider
> through the Gateway, with capability values derived from the Provider report. Twenty-four
> TypeScript tests, the production build, Electron process lifecycle, and the real remote-permission
> smoke pass; the product version and paired release notes are updated to `0.4.1`.

- **Documentation:** accept the Electron security baseline, design standard v0.6.1, the minimal
  Gateway boundary, and the backend migration inventory.
- **Migration:** combine F1's minimum application shell with B1's Orchestrator/Unity baseline
  cleanup without carrying Tauri-private mechanisms.
- **Integration:** start Main, Preload, and Renderer and verify the Gateway boundary through a
  controlled test Provider.
- **Delivery:** pass type, unit, production-build, Electron lifecycle, and remote-permission smoke
  checks; update the version and release notes to `0.4.1`.

### M2 — v0.4.2: Application contract and durable-task loop

> Acceptance: **Passed (2026-09-04)**. Electron drives the supervised real Provider process through
> the Gateway (frame protocol v0.1, single-instance lock, Windows process-tree containment, SQLite
> authoritative task state); the five deliverables — reload, multi-window, temporary disconnection,
> process shutdown, restart recovery — passed with 11/11 checks in `smoke:m2-deliverables`
> (evidence kept locally); the application contract v0.1 was frozen as stable Gateway v1; 302
> TypeScript and 48 Rust tests (6 real-asset manual tests ignored by design), strict Clippy, and all
> quality gates pass; the product version is 0.4.2 with bilingual release notes.

- **Documentation:** freeze Gateway v1, Provider lifecycle, authoritative SQLite state, and the
  accepted Orchestrator-hosting ADR.
- **Migration:** convert the JSONL/StateFile behavior into SQLite characterization and migration
  tests instead of extending the transitional formats into contracts.
- **Integration:** connect F2's task interaction to B2's real Provider, task, cancellation, and
  recovery capability.
- **Delivery:** pass Renderer reload, multi-window, transient disconnect, process shutdown, and
  restart recovery; update the version and release notes to `0.4.2`.

The standalone `v0.4.3` architecture spike is cancelled. The core-composition framework no longer
enters the product; the Orchestrator-hosting comparison is performed by B2, its result accepted by
M2, and consumed by M3.

### Pre-B3 spike (no product version): VPM package creation and installation path

This spike adds a parallel path beside importing a `.unitypackage` directly into a VUA-controlled
Unity project: preserve the source artifact, create a local VPM package in an isolated Unity
`2022.3.22f1` staging project, then install it into the target project through VUA's `vrc-get`
package manager. Package creation, installation, and public publication are separate use cases; M3
accepts only `local-reusable` creation and installation, while `publishable` validation and
repository publication remain separately scheduled.

Review of the backend worktree's `_local_b3/vpm-spike/SPIKE_FINDINGS.md` accepts this feasibility
evidence:

- converting in a new process after Unity finishes the source-package import creates an observable
  phase boundary;
- the generated package has a root `package.json`, and a separate validation project discovers the
  package and loads one expected asset;
- offline reconstruction can produce a candidate package but lacks Unity import, compilation,
  serialized-reference, and semantic validation, so it remains an experimental degraded result;
- a disposable project protects user-project state, while its Editor scripts still execute with the
  developer's Windows authority.

The spike closes the following gaps before B3 production implementation:

1. install the generated package into a clean validation project through the minimum VUA `vrc-get`
   adapter; direct copying into `Packages/` remains creation-feasibility evidence only;
2. repeat conversion in two clean run roots and compare normalized package manifests and archive
   digests, while also comparing source-file digests before and after execution;
3. define per-process timeout, cancellation, exit code, residual-process cleanup, disk-interruption
   recovery, a versioned result Schema, and stable result codes;
4. decide the scanning, warning, per-execution consent, and rejection policy for script-bearing
   inputs;
5. define package-ID ownership, dependency declarations, Editor/Runtime layout, hard-coded
   `Assets/` paths, and license evidence. Loading one expected asset proves minimum structure only,
   not the semantic correctness of an entire Avatar or outfit.

### M3 — v0.5.0: First Electron–Orchestrator–Unity vertical delivery

- **Documentation:** record the first end-to-end use case, error/recovery semantics, minimal Build
  Record, Bridge operation coverage, and the two material-entry contracts — direct import and local
  VPM package creation/installation.
- **Migration:** extract only the legacy page behavior and Unity semantics required by this slice
  and close the matching migration ledger.
- **Integration:** combine F3 and B3 and run Inspect through Recover with a synthetic Avatar, one
  synthetic outfit, and a global Unity `2022.3.22f1` project through both the direct
  `.unitypackage` import path and the local VPM package path (creation, then installation through VUA's
  package manager).
- **Delivery:** both paths pass success, cancellation, drift, timeout, Bridge rejection,
  successful/failed rollback, and idempotent replay; VPM package results clearly distinguish
  `unityValidated` from experimental offline output; update the version and release notes to
  `0.5.0`.

> Progress note (2026-09-06): T1 (the M3 revision path), T2 (the production-surface v0.2
> registration batch), and I-3 (the unified merge of the three lanes into `main`) are all complete;
> this gate has only I-1, the real Unity matrix, left — it is window W1, after which the gate closes
> per W11.

Task breakdown (everything except W1 is complete; history in `collab/BOARD.md` and the commit
history):

| Task | Owning role | Status |
| --- | --- | --- |
| T1 Seven-method Schema + fixed vectors (amf-production v0.2) | Production | ✅ Delivered |
| T2 production-surface v0.2 TS registration batch | Desktop | ✅ Delivered |
| I-3 branch integration | Integration | ✅ Completed 2026-09-06 |
| I-1 real Unity matrix | Production | ✅ Completed 2026-09-07 (16/16 cells on real Unity, merged 5ccace6; evidence `_local_w1/`) |

### M4 — v0.6.0: Warehouse, acquisition, and BDL

- **Documentation:** freeze the remote-content, session, download-port, LocalArtifact, and minimal
  BDL persistence formats.
- **Migration:** close the migration entries for asset browsing, downloading, the Warehouse page,
  and source data.
- **Integration:** connect F4's isolated browse/download UI with B4's AMF asset acquisition,
  inspection, and BDL mapping.
- **Delivery:** make an authorized download enter Warehouse through a recoverable task and local
  inspection; update the version and release notes to `0.6.0`.

Task breakdown (M4 allocation audit 2026-09-07: historical progress verified item-by-item
before updating; settled at closure, 2026-09-08):

| Task | Owning role | Collaborators | Status |
| --- | --- | --- | --- |
| Remote content / Session / download port and isolated browse UI | Desktop | — | ✅ Delivered (F4-2/3/4/6), walkthroughs closed (W6/W7) |
| Warehouse list / filter / detail / inspection-state presentation | Desktop | Data | ✅ Delivered (F4-5/6), walkthrough closed; layout rework in W13 |
| Minimal BDL persistence format and Warehouse mapping | Data | Core | ✅ Delivered (bdl/v0.1, bdl-queries v0.3) |
| Download-event consumption, retry/recovery, and task closure | Data | Core | ✅ Delivered (incl. W4 test coverage) |
| Asset-acquisition use cases and the LocalArtifact inspection pipeline | Data | Core | ✅ Delivered (artifact_inspection) |
| Generation stream (generate-VPM etc.) and the three-command protocol | Data | Core | ✅ Delivered (W8/W9: bdl-commands v0.1.1 full chain) |
| Catalog observation-pipeline service face | Data | Desktop | ✅ Closed across the full chain (W12: service face 6062a13 + routes 80ad6e7 + consumer 5fd8c6b) |
| Observation-pipeline write side (products-table writes) + surfacing | Data | Desktop | ✅ Delivered across the chain (W17: write face 73cae1b + surfacing c93ac5e) |
| Warehouse layout rework (adaptive columns + right-side details) | Desktop | — | ✅ Merged (W13, 88b4551); confirmed by the user with the M4 closure (2026-09-08) |
| bdl-commands v0.2 upgrade (two-option semantics + persistence-location decision) | Data | Desktop | ✅ Delivered and frozen (W14, bdl-commands v0.2); provider route registration complete (core 10325cd) |
| Settings-Experimental full form (two-option entry) | Desktop | Data | ✅ **Closed (W15)**: first walkthrough failed → reworked per the user sketch (global-toggle form, 4fb6411) + fix batch (trigger timing = material-import semantics + "VPM package replacement" wording + honest not-wired labeling, 2fa260d) → second-round re-review passed + user confirmation closed the gate (2026-09-08) |
| Design-standard sync (notification center / warehouse layout / experimental semantics) | Desktop | — | ✅ Delivered (W16, design standard v0.6.2; 0.6.3 reworked with the W15 redo) |
| Gate acceptance and release | Integration | All | ✅ **M4 closed (v0.6.0, 2026-09-08)**: W12–W17 full-chain evidence + CI/full-suite green + 008 ruling path a + re-review passed + user confirmation |

### M5 — v0.7.0: Recipe and the AMF production line

- **Documentation:** freeze Recipe, Local Resolution, Build Record, and the added Unity Bridge
  operations.
- **Migration:** close the migration of the Recipe/Warehouse presentation models and lawful local
  asset test paths.
- **Integration:** connect F5 workbenches with B5 resolution, planning, Unity jobs, validation, and
  recovery.
- **Delivery:** reproduce a lawfully held local smoke path of one Avatar plus one outfit; update the
  version and release notes to `0.7.0`.

Task breakdown (M5 opened 2026-09-08: historical progress verified — no pre-deliveries —
then landed into the current window as W18–W26; the desktop M5 first batch is the proposal
008 wiring plus the import-time hook merged design):

| Task | Owning role | Collaborators | Current-window row |
| --- | --- | --- | --- |
| Recipe v0.3, Local Resolution, version locks | Core | Data | W20 |
| Unity Bridge operation expansion (dry-run, idempotency, recovery) with the C#-side implementation | Production | Core | W21 |
| Complete Build Record (plan diffs, evidence summary) | Core | Production | W22 |
| Compatibility / missing-evidence model | Data | Core | W23 |
| Recipe/Assembly workbench (shared selection and domain semantics across three views) | Desktop | Core | W24 |
| Lawful self-owned asset smoke path and reproducibility | Production | Integration | W25 |
| 008 path-a wiring (delete originals after generation) + import-time automatic-generation hook and orchestration semantics (merged design, M5 first batch) | Desktop | Core, Data | W18/W19 |
| Gate acceptance and release | Integration | All | W26 |

### M6 — v0.8.0: Project management and environment deployment

- **Documentation:** freeze `vrc-get`, the ALCOM/VCC project compatibility matrix, environment
  diagnosis, and the experimental EAC recovery boundary.
- **Migration:** close the retained behavior of the legacy environment checks, project
  identification, and deployment guidance.
- **Integration:** connect F6's guidance/plan/confirmation pages with B6's project, environment,
  network, disk, and process adapters.
- **Delivery:** report all three project paths honestly, and let a new user prepare a minimal
  production environment; update the version and release notes to `0.8.0`.

Task breakdown (**project-management portion opens early** — user ruling, late
2026-09-08, relayed by the operator; Environment/Desktop already dispatched,
**out of gate order** but gate acceptance and release still follow gate order
after M5 closes. Governance note: the T-A project-management command wire
vocabulary is a **new protocol face** — desktop proposal → core ruling flow
unchanged; the early-open authorization is recorded on the BOARD M6 row):

| Package | Task | Owning role | Collaborators | Anchor / notes |
| --- | --- | --- | --- | --- |
| T-A | General `vrc-get` project and package-management path (incl. the project-management command wire vocabulary — new protocol face, desktop proposal → core ruling) | Environment | Core | governance note above; wire-vocabulary proposal drafted by Desktop, ruled by Core |
| T-B | ALCOM/VCC capability detection and compatibility matrix | Environment | Desktop | U3 read-only compatibility semantics, authority = product-boundary 1.2.0 |
| T-C | F6 guidance/plan/confirmation pages with per-action warning consent (incl. the U3 read-only compatibility surface: write handoff and the "import as a VUA-managed copy" entry) | Desktop | Environment | authority = product-boundary 1.2.0; W24 read-face prerequisite rides the M5 production-use-case v0.2 |
| EAC | Experimental EAC recovery adapter (R1–R9 approved by the user, proposal 006 accepted; implementation slice opens per the R9 sequence) | Environment | Integration (ruling) | eight-point approval semantics in the 006 inline thread |
| ENV | Unity/VRChat/SteamVR environment checks; network/disk/residual-process failure handling | Environment | Core | included in the early-open scope |
| — | Gate acceptance and release (**not** in the early-open scope) | Integration | All | follows gate order after M5 closes |

### M7 — v0.9.0: Inspection, Release, and the desktop overlay

- **Documentation:** freeze inspection evidence, Release/Build Record browsing, official SDK
  handoff, and desktop-overlay snapshot boundaries.
- **Migration:** close the report, result-presentation, and desktop-overlay migration entries.
- **Integration:** connect F7's Inspection/Release/desktop-overlay surfaces with B7's report,
  snapshot, and read-only services.
- **Delivery:** make production results reviewable and recoverable and hand them over to official
  upload, while desktop-overlay failure does not block the desktop main line; update the version to
  `0.9.0`.

The VR Dashboard/VR Overlay does not enter this gate or `1.0.0` (user ruling, 2026-09-06); see the
v1.1 anchor in "After `1.0.0`".

Task breakdown:

| Task | Owning role | Collaborators |
| --- | --- | --- |
| Inspection evidence (functional, performance, dependency, lighting, upload readiness) | Production | Core |
| Reports, snapshots, and read-only services (desktop Overlay surface) | Core | Desktop |
| Inspection/Release pages and official SDK handoff | Desktop | Production |
| Desktop-overlay closure (consumes stable snapshots and semantic actions only) | Desktop | Core |
| Gate acceptance and release | Integration | All |

### M8 — v0.10.0: Beta 1 feature and contract freeze

- **Documentation:** freeze the `1.0.0` feature set, public contracts, compatibility scope, and the
  catalog risk gate.
- **Migration:** complete every schema, database, and configuration migration path entering
  `1.0.0`.
- **Integration:** combine F8/B8 feature closure, performance baselines, and Provider lifecycle soak
  tests.
- **Delivery:** boot, degrade, shut down, and recover the full product path with no pending catalog
  risk; update the version to `0.10.0`.

Task breakdown:

| Task | Owning role | Collaborators |
| --- | --- | --- |
| Per-domain schema/database/config migration-path freezes | Data, Production, Environment (by domain) | Core |
| `1.0.0` application-contract freeze | Core | Desktop |
| Page-path, error/empty-state, internationalization, and performance gap closure | Desktop | — |
| Provider lifecycle soak tests and performance baselines | Core | Production |
| Execute the catalog risk gate `vua.risk-gate/v1` | Integration | All |
| Gate acceptance and release | Integration | All |

### M9 — v0.11.0: Beta 2 recovery, security, and release validation

- **Documentation:** complete install, update, rollback, diagnostic-redaction, security,
  compatibility, and support guidance.
- **Migration:** rehearse upgrade, downgrade, backup, uninstall retention, and corruption recovery.
- **Integration:** combine F9/B9 accessibility, performance, security, recovery, and lawfully held
  smoke matrices.
- **Delivery:** leave release-candidate defects only; publish `1.0.0-rc.1` when needed, and update
  the product version to `0.11.0`.

Task breakdown:

| Task | Owning role | Collaborators |
| --- | --- | --- |
| Upgrade/downgrade/backup/corruption-recovery rehearsal | Core | Environment |
| Accessibility, keyboard, screen-reader, zoom, and DPI validation | Desktop | Integration |
| Diagnostic redaction and security audit | Core | Integration |
| Lawfully held asset smoke matrix | Production | Integration |
| Install/update/rollback and uninstall retention | Integration | Environment |
| Gate acceptance and release | Integration | All |

### M10 — v1.0.0: Stable release

- **Documentation:** complete the four-language READMEs, bilingual developer documentation, Release
  Notes, Apache-2.0/NOTICE, and contribution and support entry points.
- **Migration:** verify the data, configuration, and project migrations of every supported old
  version to `1.0.0`.
- **Integration:** lock the F10/B10 artifacts, installer, Provider, Unity package, protocol, and
  diagnostic versions.
- **Delivery:** pass the Windows CI, signing, install, update, rollback, license, and full smoke
  gates; publish `v1.0.0`.

Task breakdown:

| Task | Owning role | Collaborators |
| --- | --- | --- |
| Dependency and artifact locking (Electron/Rust/Unity Package/third-party) | Integration | All |
| Signed installer and update artifacts, CI smoke gate | Integration | Core |
| Four-language README and Release Notes | Integration | — |
| Supported old-version migration validation | Core | Data |
| Publish `v1.0.0` | Integration | All |

## Historical slice record (F/B sequence)

The F/B sequence is the responsibility record from before the six-role system; the physical lanes
were abolished on 2026-09-06. F0–F4 and B0–B4 are delivered (they correspond to the M0–M2 gates and
the in-flight M3/M4 work); the F5–F10 and B5–B10 content is folded into the M5–M10 task tables
above, and the original text below is kept for reference. Role mapping: F≈Desktop; B splits by
domain into Core/Production/Data/Environment.

### F sequence (F ≈ Desktop role)

- **F0 Presentation-layer asset classification** (delivered): extract React page models, i18n,
  accessibility, tokens, and base components; register migration targets and reject Tauri windows,
  IPC, permissions, and legacy data contracts.
- **F1 Electron desktop baseline** (delivered): Electron Main, Preload, React Renderer, Vite, design
  system, and minimum navigation shell; Preload exposes only the explicit Gateway; remote test pages
  cannot obtain Node.js or the local Gateway.
- **F2 Gateway client and task experience** (delivered): typed Gateway client, read-only environment
  snapshot, task center, submit/observe/cancel, reload recovery, multi-window synchronization, and
  explicit disconnect state.
- **F3 First production vertical page** (delivered): inspection results, plan review, confirmation,
  live progress, structured diagnostics, recovery results, and minimal Build Record presentation.
- **F4 Remote assets and Warehouse** (mostly delivered; wrap-up in window W6–W9): Main-managed
  `WebContentsView`, isolated sessions, permission/navigation/download interaction, Warehouse list
  and LocalArtifact inspection state; the Renderer holds no cookies, tokens, or Electron-private
  objects.
- **F5 Recipe and Assembly workbench**: see the M5 task table.
- **F6 Project and environment pages**: see the M6 task table; includes the U3 read-only
  compatibility surface for ALCOM/VCC (write handoff and the explicit "import as a VUA-managed
  copy" entry; product-boundary 1.2.0).
- **F7 Inspection, Release, and desktop Overlay**: see the M7 task table.
- **F8 Beta 1 frontend freeze**: see the M8 task table.
- **F9 Beta 2 frontend validation**: see the M9 task table.
- **F10 Stable frontend artifacts**: see the M10 task table.

### B sequence (split by domain into Core/Production/Data/Environment)

- **B0 Unity Bridge and Orchestrator migration closure** (delivered): Bridge v1 Schema, C# package,
  synthetic fixed fixtures, local EditMode, idempotent assembly, and Batchmode `inspect_project`.
- **B1 Backend application-contract baseline** (delivered): Command/Query/Event/Task/Capability,
  error, revision, and cancellation boundaries; replaceable Provider interface and mock adapter.
- **B2 Durable tasks and hosting decision** (delivered): authoritative SQLite task state,
  cancellation, idempotency, post-commit events, and restart recovery; supervised-process hosting
  ADR.
- **B3 First Orchestrator–Unity use case and dual material entries** (delivered; verification
  wrap-up in W1): fingerprint, plan, snapshot, versioned Bridge jobs, validation, recovery, and
  minimal Build Record; dual material entries.
- **B4 Asset acquisition and BDL** (mostly delivered; wrap-up in W4/W8): AMF acquisition use cases,
  download-event normalization, source correlation, retry/recovery, LocalArtifact inspection,
  Warehouse mapping, and the minimal BDL SQLite Schema.
- **B5 Recipe and production expansion**: see the M5 task table (once Recipe v0.3 lands, v0.2 is
  retired in full without a migrator).
- **B6 Project and environment adapters**: see the M6 task table.
- **B7 Inspection, Release, and desktop-overlay services**: see the M7 task table.
- **B8 Beta 1 backend freeze**: see the M8 task table.
- **B9 Beta 2 backend validation**: see the M9 task table.
- **B10 Stable backend artifacts**: see the M10 task table.

## After `1.0.0` (non-committal outlook)

The following directions are anchors only and **none of them is a commitment**. Before any direction
starts, it must establish its own independent M/slice plan and acceptance decision under the
standing discipline; this table creates no product requirements.

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

- 2.0.9 (late 2026-09-08 / recorded early 09-09): **M6 project-management portion
  opens early, landed** (user ruling, late 2026-09-08, relayed by the operator) —
  the M6 task table is refined by package (T-A general vrc-get path / T-B
  ALCOM/VCC capability detection / T-C F6 pages with the U3 anchor and the
  product-boundary 1.2.0 authority reference / EAC adapter [R1–R9 approved] /
  environment-check rows); governance note: the T-A wire vocabulary is a new
  protocol face (desktop proposal → core ruling flow unchanged); gate acceptance
  and release are not in the early-open scope (gate order after M5 closes);
  bilingual sync.
- 2.0.8 (2026-09-08): **M4 closure + M5 opening landed** — the current window is rewritten as
  M5 (W18–W26: desktop M5 first batch = 008 path-a wiring + import-time hook merged design;
  core Recipe v0.3/Local Resolution/version locks/full Build Record; production Bridge
  operation extensions/lawful asset smoke path; data compatibility/missing-evidence model);
  the M4 task table is fully settled (W15 closed: rework → re-review passed → fix batch →
  user confirmation; W13 confirmed by the user with the closure; W14 route-registration note);
  the trigger-timing semantics (at material import) landed in product-boundary 1.2.1 with the
  re-review fixes; bilingual sync.
- 2.0.7 (2026-09-08): U3 ruling anchors landed — the M6 table row for F6 and the F6 reference
  line now note the ALCOM/VCC read-only compatibility surface (write handoff and the explicit
  "import as a VUA-managed copy" entry; authoritative semantics in product-boundary 1.2.0;
  further task-row breakdown happens when M6 opens); bilingual sync.
- 2.0.6 (2026-09-08): terminology fix (hard user ruling, 2026-09-08) — VPM = VRChat Package
  Manager (the manager), VPM package = the managed package; "VPM asset-package", "local VPM
  creation", and "VPM results" in the Pre-B3 spike heading and the M3 documentation/integration/
  delivery items unified to the "VPM package" form; operation/proposal identifiers such as
  `generate-VPM` stay as proper names; bilingual sync.
- 2.0.5 (2026-09-08): W17 delivered across the chain — data write face (full-column products
  upsert + catalog_updated_seq bookkeeping + catalog consumption of observation columns,
  73cae1b) + desktop surfacing (error pass-through whitelist + live-acquire stale-code fix,
  c93ac5e); badge-all-green note added to W11; bilingual sync.
- 2.0.4 (2026-09-08): W12 closed across the full chain (service face + provider routes +
  consumer alignment 5fd8c6b, where the consumer found and fixed a dishonest mapping of
  detail misses to not-connected); added W17, the observation-pipeline write side (with
  errors.catalog.* surfacing, Data+Desktop) — third data-side scheduling request, ruled
  into the window by Integration (the M4 closing batch or the first M5 batch); bilingual sync.
- 2.0.3 (2026-09-07): first M4 progress landed — W11 executed (three CI workflows, tag
  backfill, Release, historical-branch cleanup; red rust/ts badges = BOARD #7/#8 in-domain
  defects under tracking), W12/W14 delivered (6062a13), W13/W16 merged (88b4551), W15
  unlocked; current-window and M4 tables synced (data request; Integration verified the
  merges and test evidence before updating).
- 2.0.2 (2026-09-07): M3 closure update — I-1 completed (16/16 real-Unity cells), current
  window progress note, W10/production-use-case v0.1 and amf-production v0.2 frozen at M3
  acceptance; M4 allocation audit and assignment (W12–W16: six delivered items verified,
  catalog observation pipeline, warehouse layout rework, bdl-commands v0.2,
  Settings-Experimental full form, design-standard sync).
- 2.0.1 (2026-09-07): the current window gains W12 (catalog observation-pipeline service face,
  owned by Data, executed when the M4 window opens) — making the desktop W6/W7 walkthrough's
  implicit wait on the data-side observation pipeline an explicit M4-prerequisite schedule
  (data request, integration ruling).
- 2.0.0 (2026-09-06): the six-role system replaces the three lanes and the two-role split
  (Integration/Desktop/Core/Production/Data/Environment, with the code-ownership mapping); adds the
  "current window" task table (W1–W11); M4–M10 each gain a role-based task table; the F/B sequence
  is demoted to a historical record and mapped item-by-item onto the gate task tables; the M3
  progress note is updated.
- 1.0.0 (2026-09-06): moved into version control. Coordination switched to collab/ (the plans/ letter
  mode is abolished); M gates redefined as integration-branch tags plus acceptance checklists; F/B
  changed from physical lanes to role responsibilities; M7/F7/B7 narrowed with the VR Dashboard/VR
  Overlay removed from `1.0.0`; "After `1.0.0`" rewritten as the non-committal v1.1–v1.5 outlook; M3
  progress note appended; the starting baseline marked as the 2026-09-04 snapshot.
