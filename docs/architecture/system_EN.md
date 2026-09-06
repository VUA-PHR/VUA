# VUA system architecture

[English](system_EN.md) | [简体中文](system_ZH.md)

> Document version: 1.0.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors system_ZH.md at 1.0.0)
> Scope: Entire VUA system
> Last conformance review: 2026-09-06
> Normative effect: Yes

## Shape

VUA is a local-first desktop application in one monorepo. A small Node.js Kernel owns Electron
bootstrap, security enforcement, Gateway, and Orchestrator Provider lifecycle; the local React UI is
the controlled presentation surface. Trusted product behavior is compiled and wired directly into
its owning application layer without a generic module registry, dependency graph, or runtime
composition framework. Community extensions use the future Plugin capability boundary, and external
integrations use reviewed public interfaces.

```text
Electron Renderer (local React UI)
        ↓ restricted contextBridge
Electron Main / Preload
        └─ Kernel (bootstrap, security, Gateway, Provider hosting, diagnostics)
        ↓ versioned application Gateway
Rust Orchestrator Provider (replaceable hosting; use cases, durable tasks and ports)
        ├─ AMF application services
        │      ├─ BDL
        │      ├─ acquisition ports
        │      └─ Unity Bridge jobs
        ├─ built-in project / environment / future runtime adapters
        ├─ capability-enforced community plugin host
        └─ overlay services
```

The Kernel owns bootstrap, Gateway, Provider lifecycle, and desktop security enforcement; it does
not own a generic business-module system. Product rules reside in application and domain layers.
Orchestrator is the business-state authority for recoverable workflows; AMF owns Avatar production
and exclusively reaches BDL; Unity Bridge executes already approved Unity work.

## Code-structure reality (reviewed 2026-09-06)

The Cargo workspace currently has a single member: `crates/orchestrator` (about 26.8k lines of
Rust). Every Orchestrator module hangs off `src/lib.rs` as a `mod`; the six empty placeholder crate
directories were deleted on 2026-09-06, so the structure no longer pretends a multi-crate shape.
Modules, grouped by domain:

- **Application core and runtime:** `runtime`, `workflow`, `model`, `contracts` (application
  contract types and errors), `capability`, `time`;
- **Persistence and recovery:** `sqlite_task_store` (authoritative task state), `journal`,
  `state_file` (transitional format), `filesystem` (project/snapshot stores);
- **Provider process boundary:** `provider_host`, `process`, `provider_job` (Windows Job Object),
  plus the supervised Provider binary `src/bin/vua-orchestrator-provider.rs`;
- **AMF production:** `recipe/` (model/read_model/share/validate), `assembly`, `build_record`,
  `production_documents`, `editor_targets`, `project_identity`, `project_lock`, `provision`,
  `staging_scaffold`;
- **Material and Unity Bridge:** `bridge`, `material_intake`, `material_exec`, `material_staging`,
  `material_identity`, `material_task`, `local_vpm_artifact`, `artifact_inspection`;
- **Acquisition and BDL:** `download_events`, `booth_extraction`, `warehouse_import`,
  `warehouse_maintenance`, `bdl_store`, `bdl_queries`;
- **Project and environment:** `vpm`, `vpm_backend`, `environment`, `environment_managers`,
  `win_registry`, `tools`.

"BDL is AMF-private" has had structural enforcement through the `bdl-store` crate since the crate
split landed on 2026-09-06 (previously upheld by calling discipline alone).

## Provider process boundary

The accepted hosting decision is a **supervised independent-process Provider** (ADR:
[Supervised independent-process Orchestrator Provider](../decisions/orchestrator-supervised-provider_EN.md)):

- the Provider runs as the separate `vua-orchestrator-provider` binary, started, supervised, and
  shut down by the Kernel inside Electron Main;
- inter-process communication uses the versioned frame protocol
  ([Supervised Provider Process Protocol v0.1](../protocols/provider-process-v0.1_EN.md)) with
  handshake, version negotiation, a single-instance lock, and explicit shutdown semantics;
- the Windows child process tree is contained in a Job Object (`provider_job`), so a Provider crash
  cannot take down the desktop process;
- authoritative task state lives in SQLite ([Task Store Format v0.1](../protocols/task-store-v0.1_EN.md));
  after a Provider restart, recovery reads persistent state and non-terminal tasks surface as
  `inspect_required` awaiting an explicit decision;
- Provider replacement happens only at an idle shutdown boundary. In-process native and
  supervised-process Providers implement the same versioned application contract; the hosting model
  is replaceable and is not a product invariant.

## Crate layout (split landed 2026-09-06)

The split ruled by the user is complete (slice/crate-split, merge `a261393`; one purely mechanical
move commit per crate, sources and tests moved together, behavior unchanged, full tests and Clippy
green):

| Crate | Contents | Notes |
| --- | --- | --- |
| `orchestrator` (core) | task runtime, cancellation/recovery, use cases, domain ports, application contract types, `material_types` leaf types, `vpm_backend` port trait | single application core |
| `bdl-store` | `bdl_store`, `bdl_queries`, `download_events`, BDL SQLite schema/migration consumption | "AMF-private" gains structural enforcement |
| `unity-bridge` | `bridge`, `material_intake`/`material_exec`/`material_staging`/`material_task`, `staging_scaffold`, `local_vpm_artifact`, `production_documents` | same lifecycle as the C# package and Bridge schemas |
| `provider-host` | `provider_host`, `process`, `provider_job` + the `vua-orchestrator-provider` binary | separate process boundary; composition root |
| `acquisition` | `warehouse_import`, `warehouse_maintenance`, `artifact_inspection` | download/warehouse domain |
| `project-manager` | `vpm_backend` implementation, `project_lock` | external tool adapters |

Dependency direction: domain types and ports stay in the core; adapter crates depend on the core;
`provider-host` is the composition root depending on all; cargo enforces acyclicity. **Exception**:
`environment_managers` remains in the core for now due to deep coupling with the core environment
engine — see `collab/proposals/004-environment-managers-split.md`. New modules land in their owning
crate from the start; the core must not grow adapter code.

## Collaboration and worktrees

The coordination substrate is version-controlled at the repository root in `collab/` (mechanism:
`collab/README.md`):

- `collab/BOARD.md`: global board (M-gate status, frozen-contract table, cross-tree open questions),
  maintained by the integration tree after gates and merges;
- `collab/state/wt-N.md`: one overwrite-style state file per active worktree;
- `collab/proposals/`: single-file proposals for contract changes and cross-tree needs, with the
  discussion thread inline.

Worktrees are numbered, not role-bound. The `VUA` main checkout holds the `.git` directory, stays on
the integration branch `main`, and never moves; linked worktrees are named `VUA-2`, `VUA-3`, … and
may host any slice. Work proceeds in vertical slices on `slice/<slug>` branches (lifetime ≤3 days,
≤15 commits behind `main`); schemas and contracts align only through git merges — manual copying is
forbidden. Run `pnpm collab:brief` before starting work to read blockers and messages routed to this
worktree or your role. Coordination conclusions count only in `collab/`; `docs/plans/` is a local
scratch area.

## Dependency direction

```text
View
  → presentation model
  → typed Gateway
  → application use case
  → domain rule / outbound port
  ← adapter implementation
```

| Layer | Owns | Delegates through |
| --- | --- | --- |
| View | components, layout, accessibility, input binding | presentation models and typed Gateway |
| Presentation | page state, navigation, display validation, intent mapping | Gateway commands, queries, and tasks |
| Kernel/Gateway | bootstrap, Provider lifecycle, security enforcement, typed commands, queries, events, capability snapshots | application use cases |
| Application | use cases, workflows, approval, recovery, coordination | domain rules and ports |
| Domain | Recipe, plans, state transitions, invariants | abstract ports |
| Ports | capabilities the application needs | adapter implementations |
| Adapters | Electron, SQLite, files, processes, Unity, third parties | owned application and domain contracts |

Cross-module data uses versioned DTOs. Views receive presentation-safe values while database,
Electron, Orchestrator, and Unity implementation objects stay with their owners.

## Interaction model

- **Command:** intent that may change state.
- **Query:** read-only snapshot with a revision.
- **Event:** fact published after a committed transaction.
- **Task/Channel:** progress for cancellable long work, independent of component lifetime.
- **Capability:** what is actually available with the current machine, version, and authorization.

```text
Inspect → Plan → Confirm → Snapshot → Execute → Validate
                                      ↘ Recover / Manual handoff
```

Privileged changes require stable identifiers, idempotency boundaries, stale-input checks, and
recoverable records. Commands carry intent; events report committed facts through typed channels.

## Data ownership and degradation

- Orchestrator persistence owns tasks, Recipes, Build Records, projects, and adapter execution state.
- BDL owns AMF catalog, terms, compatibility, source, search, and Warehouse mapping tables and writes,
  even if a physical SQLite file is shared.
- The file system stores lawfully acquired assets, Unity projects, snapshots, and immutable jobs.
- Electron's isolated sessions hold remote cookies, orders, and download credentials locally.
- Core catalog entries are trusted product behavior built directly into VUA and use their owned Orchestrator use cases and ports.
- Community plugins operate entirely through approved versioned capabilities in the isolated plugin host.

Offline mode preserves local recovery and Unity work. Missing or incompatible tools produce a
capability result and manual path. Accepted tasks survive UI, browser, and overlay reloads. Unknown
protocol versions enter read-only inspection or manual handoff. Diagnostics redact accounts, home
paths, tokens, cookies, and paid-asset filenames by default.

## Document changelog

- 1.0.0 (2026-09-06): entered version management and was rewritten against reality. Added the
  code-structure reality section (single-crate module inventory), the Provider process boundary
  section, the target crate layout (accepted split decision), and the collaboration/worktree
  numbering section; removed the structural fiction left after the empty placeholder crate
  directories were deleted; the existing component-boundary, dependency-direction,
  interaction-model, data-ownership, and degradation sections are retained.
