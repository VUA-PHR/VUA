# VUA system architecture

[English](system_EN.md) | [简体中文](system_ZH.md)

> Status: Accepted  
> Scope: Entire VUA system  
> Updated: 2026-09-02  
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
