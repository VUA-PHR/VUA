# VUA Workspace Instructions

> Document version: 1.1.4
> Status: Accepted
> Authority: this file is the single-language authority for workspace instructions; it has no
> bilingual pair.

VUA is a Windows-first, local-first VRChat desktop production environment. This repository is the
current implementation authority.

## Read first

0. Before starting any work in any worktree, run `pnpm collab:brief` and read the blockers and
   messages routed to this worktree or your role. The mechanism is defined in `collab/README.md`.
1. Read `README.md`, then choose `docs/README_EN.md` or `docs/README_ZH.md` and follow the smallest
   task-specific reading path.
2. Read `docs/product-boundary_EN.md` or `docs/product-boundary_ZH.md` before changing product scope
   or module ownership.
3. Follow this authority order: current user ruling, product boundary, versioned protocols and tests,
   accepted decisions, architecture, design standards, then development plans.
4. Resolve conflicting normative sources before implementation.

## Collaboration and merge discipline

- `main` is the single integration branch. Work happens on short-lived vertical-slice branches named
  `slice/<slug>`: a slice lives at most 3 days and falls at most 15 commits behind `main`; reaching
  either limit first triggers a merge or rebase.
- A vertical slice carries everything one user-perceivable capability needs in a single branch:
  schema (when involved), Rust, TypeScript, tests, and documentation. The "three places in one
  batch" rule is structural, not a cross-branch procedure.
- Schemas and contracts align across work only through git merges. Manual byte-identical copying
  between branches or worktrees is forbidden.
- Worktrees are numbered, not role-bound. The `VUA` main checkout holds the `.git` directory, stays
  on the integration branch, and never moves; linked worktrees are named `VUA-2`, `VUA-3`, … and may
  host any slice.
- Coordination conclusions count only once they land in `collab/` (state files, proposals, BOARD;
  mechanism in `collab/README.md`). `docs/plans/` remains a local scratch area and carries no
  coordination authority.
- Standing processes: per-role bootstrap prompts live in `collab/roles/<role>.md`, and the shared
  periodic command lives in `collab/TICK.md`; worktree↔role assignments are recorded in
  `collab/BOARD.md` and mirrored in each `collab/state/wt-N.md` front-matter.
- Escalation beats stubbornness: a problem that cannot be solved honestly is escalated to the user
  (BOARD「待用户裁决」, tagged `[需用户]`) instead of being worked around by guessing, lowering the
  bar, or manufacturing consensus across processes. Rule text: `collab/README.md`.
- Execution uses six roles — Integration, Desktop, Core, Production, Data, and Environment —
  defined with code ownership in `docs/development-outline_ZH.md` ("执行角色（六角色）"). A role is
  a hat a session wears, not a branch or a worktree; within one slice the same session may hold
  several hats. Domain schemas are frozen by their owning role; Desktop registers the TS face of
  contracts; Integration arbitrates disputes.

## Honesty discipline

Each rule ships with its check. When a claim cannot be checked, report it conservatively.

1. **The empty state is the final state.** UI surfaces render only data the Gateway actually
   returned; an absent or empty result renders the designed empty state, never guessed or
   placeholder content. Check: renderer pages source every displayed value from Gateway snapshots,
   and the fixture-free production bundle still renders honest empty states.
2. **Failures are presented as failures.** A failed, partial, or simulated run is reported as such;
   mock or fixture outcomes are never presented as real results. Check: status surfaces,
   diagnostics, and release notes cite the actual run, and simulated peers are labeled as
   simulations in both UI and reports.
3. **Recovery never resumes implicitly.** A task found in a non-terminal state after restart or
   drift surfaces as `inspect_required` and waits for an explicit decision; it never silently
   continues. Check: recovery maps non-terminal tasks to `RecoveredDisposition::NeedsInspect` /
   `inspect_required`, and restart-recovery tests assert that no implicit resumption occurs.
4. **Mocks and fixtures never leave DEV.** Fixture gateways and demo data exist only behind
   development gates. Check: `import.meta.env.DEV` gating plus dead-code elimination in the
   production build, and `pnpm --filter @vua/desktop check:leak` fingerprint-scans the production
   bundle for fixture payloads.
5. **No end-to-end claim without real-machine evidence.** Declaring a flow verified end-to-end
   requires citing the real run (date, environment, artifacts, evidence location); otherwise report
   exactly what was and was not exercised. Check: gate acceptances and release notes name their
   evidence, and "evidence kept locally" entries point to real local output.

## Architecture constraints

- The desktop shell is Electron. The local UI uses React, TypeScript, and Vite.
- Renderer views use a narrow typed preload/Gateway API. They never call Electron, Node.js, SQLite,
  Unity, Orchestrator internals, or operating-system APIs directly.
- Remote web content is isolated from local privileges and never receives Node.js, preload,
  filesystem, credential, Orchestrator, or plugin-host access.
- The Orchestrator owns application use cases and recoverable tasks independently of the renderer.
  Its language, hosting model, and transport are replaceable implementation decisions.
- AMF is Recipe-first and owns Warehouse, Recipe, Assembly, Inspection, Release, and BDL access.
  BDL is an AMF-private local module, not a VUA-wide data service.
- Unity changes cross the versioned Unity Bridge whenever a deterministic Bridge operation can
  exist. Do not substitute unversioned UI clicking.
- Unity production workflows use global `2022.3.22f1` exactly. `2019.4.31f1` and `2022.3.6f1` are
  migration inputs. Unity China `2022.3.22f1c1` and Tuanjie Engine receive unsupported-environment
  diagnosis and global-editor guidance; project-version edits remain user-controlled.
- Project management has three distinct paths: VUA's `vrc-get`-based package manager, compatibility
  with ALCOM-managed projects, and compatibility with VCC-managed projects.
- Desktop and VR overlays consume stable application services and never become business-logic hosts.
- Kernel and the local React UI are stable host surfaces. Trusted core modules use minimal explicit
  VUA-owned composition; community extensions use the separate Plugin capability boundary.
- Rust Orchestrator hosting and transport remain replaceable. In-process native and
  supervised-process Providers must implement the same versioned application contract; neither
  napi-rs nor a sidecar is a product invariant.
- Current code reality: the Cargo workspace splits the Orchestrator into `crates/orchestrator`
  (core: task runtime, recovery, use cases, domain ports, contract types) plus `bdl-store`,
  `unity-bridge`, `provider-host`, `acquisition`, and `project-manager` (layout table in
  `docs/architecture/system_ZH.md`). `environment_managers` moved to `project-manager` behind the
  core-owned `VccSettingsReader` port (proposal 004, option 3, landed 2026-09-07); wire face and
  core port contracts are unchanged. New modules land in their owning crate from the start; the
  core must not grow adapter code.
- Community plugins never join the trusted in-process composition context or receive Electron
  Main/Orchestrator Provider authority. Their execution requires a separately accepted isolation and
  security decision.
- Classify catalog entries only by core, plugin, or external trust boundary. Purpose belongs in
  natural-language descriptions, not secondary labels. Catalog risk is derived by the release gate,
  never self-assigned; registration grants no implementation, distribution, trust, or execution
  authority.
- Runtime integrations begin after `1.0.0`; a marketplace or untrusted execution needs a separate
  accepted decision.
- Proposed ADRs are study material without normative effect until explicitly accepted.

## Dependency direction

```text
React View
  -> typed frontend feature/Gateway
  -> Electron preload and main-process adapter
  -> versioned application contract
  -> Orchestrator use case
  -> domain port
  -> local or third-party adapter
```

Framework and vendor types stay in adapters. Business decisions do not belong in React components,
Electron handlers, Unity callbacks, or third-party wrappers.

## Security and legal boundaries

- Never commit paid assets, paid `.unitypackage` content, user Unity projects, cookies, tokens,
  order data, production databases, private logs, credentials, or `.env` files.
- BOOTH access uses the user's own local session and authorization. Do not bypass purchase, payment,
  age, authentication, or access controls.
- Credentials and purchased files remain local and are never relayed through project-operated
  servers.
- Repository and cloud-CI tests use structurally representative synthetic data without real product
  or user content. Local read-only compatibility tests may access public BOOTH pages. Local Unity
  integration and smoke tests may use assets lawfully obtained by the developer; assets, projects,
  page captures, configuration, logs, and outputs remain local.
- Before bundling a third-party binary, audit its license, redistribution terms, update source,
  signatures, notices, and removal path.

## Working discipline

1. Define or update the owning contract before implementing cross-module behavior.
2. Keep Electron handlers and vendor adapters thin; test application behavior below them.
3. Add regression tests for correctness and recovery defects.
4. Make long-running operations cancellable, observable, recoverable, and safe to retry where the
   contract permits.
5. Prefer capability detection over assumptions about installed software or upstream versions.
6. Add dependencies only with a clear owner, purpose, license, and removal path.
7. Preserve unrelated worktree changes. Never work directly on `main` — with two declared
   exceptions: (a) the Integration seat's collab bookkeeping batches (state files, BOARD,
   proposals) land on `main` directly, per `collab/README.md`; (b) an explicit user ruling may
   direct a change onto `main` outside the slice flow. Both exceptions are registration-backed:
   the landing commit or its collab entry must name the authority (standing mechanism or user
   ruling) that sanctioned the direct landing.
8. Do not add `Co-authored-by: Codex` trailers.

## Documentation discipline

- Managed documents carry a version header and are registered in `docs/REGISTRY.md`; the layering,
  internal SemVer, and registry rules live in `docs/meta/documentation-governance_ZH.md` (EN mirror
  alongside).
- Product scope belongs in the matching `docs/product-boundary_EN.md` and
  `docs/product-boundary_ZH.md` pair.
- Dependency direction and ownership belong in architecture documents.
- Interaction and visual acceptance belong in the accepted design standard.
- Wire and persistent formats require explicit machine-readable versions.
- Plans schedule accepted work; they do not create product requirements.
- Product releases and Git tags follow `docs/release/versioning_*`; product SemVer does not replace
  protocol, schema, persistence, or plugin-contract versions.
- Reference and research material does not become implementation authority by implication.
- Active developer documentation keeps matching `_EN.md` and `_ZH.md` versions. The bilingual
  single-file entries under `docs/tool-catalog/` are the explicit exception. Schemas, source,
  generated files, and official license text remain single-source.

## Document changelog

- 1.1.4 (2026-09-18): working-discipline rule 7 now declares its two standing exceptions —
  Integration-seat collab bookkeeping batches on `main` (per `collab/README.md`) and explicit
  user-ruled direct landings — closing the gap where every nightly bookkeeping batch
  technically violated the rule as previously worded. No behavioral change; the rule text now
  matches established practice and the authority order (user ruling first).
- 1.1.3 (2026-09-07): code-reality bullet updated — `environment_managers` moved to
  `project-manager` behind the core-owned `VccSettingsReader` port (proposal 004 option 3
  landed); the deferred-extraction exception is closed.
- 1.1.2 (2026-09-07): added the escalation rule — unsolvable problems go to the user
  (BOARD「待用户裁决」, `[需用户]`) instead of consensus-manufacturing or bar-lowering.
- 1.1.1 (2026-09-07): added the standing-process pointers (`collab/roles/`, `collab/TICK.md`,
  worktree↔role assignment in BOARD).
- 1.1.0 (2026-09-06): six execution roles (Integration / Desktop / Core / Production / Data /
  Environment) replace the transitional F/B role pair; schema-freeze responsibility moves to the
  domain-owning role. See `docs/development-outline_ZH.md` 2.0.0.
- 1.0.1 (2026-09-06): crate split landed (merge `a261393`) — the code-reality bullet now describes
  the six-crate layout; the `environment_managers` exception is registered as proposal 004.
- 1.0.0 (2026-09-06): entered version management. Added the collab-first read step, the
  collaboration/merge discipline (single integration branch, vertical slices, numbered worktrees),
  the codified honesty discipline with checks, and the single-crate reality with the accepted
  crate-split target layout; F/B lanes redefined as roles.
