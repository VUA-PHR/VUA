# N-sequence architecture evolution

> Document version: 1.4.0
> Status: Accepted
> Updated: 2026-10-02
> Scope: Incremental software and documentation structure for N1-N7
> Normative effect: Accepted incremental direction; existing wire/storage contracts remain authoritative

## Accepted direction

Keep Electron/React, the supervised Rust Provider, SQLite task persistence, and Unity Bridge.
Organize new work around user use cases inside the existing six-crate workspace. Start with the
N1 deployment path; do not make a repository-wide rewrite, new plugin framework, new transport,
or full environment version manager a prerequisite for installing Unity on the current machine.

This design distinguishes a logical responsibility from a crate, process, or user-facing page.
A new capability normally starts as a small module in an existing owner. Extract a crate only
when a measured dependency, build, packaging, or independent lifecycle problem justifies it.

## User-facing capabilities and implementation owners

| Capability | Application responsibility | Existing implementation to reuse | Increment to build |
| --- | --- | --- | --- |
| Deploy environment (N1) | Turn goal + observations into actions; execute and verify them | Environment facts, project-manager adapters, task runtime, deployer UI | Purpose-based planner and actual install/configuration adapters |
| Deploy tools (N2) | Discover/launch/guide exactly the two approved external tools | Existing discovery and supported launch paths | Thin status/setup adapters; Steam/upstream owns installation, updates and calibration |
| Produce Avatar (N3) | Resolve materials, dependencies and objects; execute and hand off to SDK | AMF use cases, project creation/resolution, Bridge, records | Complex 1+2+6 path and fixes found by real runs |
| Reproduce Recipe (N4) | Save, resolve, apply and compare supported intent | Recipe formats/use cases and production path | Measured gaps in reapply/conflicts/reproduction |
| Manage materials (N5) | Audit, enumerate account materials, catalog, download selectively, import | Acquisition, BDL, Electron session/download transport | Only capabilities missing after audit; separate listing from file acquisition |
| Recover and maintain (N6) | Inspect interrupted work; explicit retry/repair/update/uninstall | Existing durable tasks, leases and recovery records | Capability-specific repair and configuration restoration |
| Distribute and explain (N7) | Package tested capabilities and explain their actual UI | Existing build pipeline and user-facing pages | Installer regression and screenshot guide |

## Deployment architecture: first slice

### Flow

1. The user chooses a purpose, location and, for headset play, brand/model. Derive the official
   model route and ask cable/wireless details only when needed. UI sends intent, not shell commands.
2. The application asks existing inspection services for observations, including unknown/failure.
3. A small planner compares those observations with the selected purpose's requirements.
4. The UI shows resulting retain/install/add-component/configuration/manual actions and reasons.
5. On confirmation the application starts a normal durable task and runs adapter steps.
6. Each completed step is followed by an appropriate observation or functional check.
7. Failures retain the failed step and next action. Restart uses the existing inspect-required path.

The first executable path is the current machine's existing play environment to a working Unity
2022.3.22f1 project with real SDK/MA. Purpose plans for other declared N1 targets follow the same
pattern once their prerequisites are available. Successful installation is not inferred from an
installer process starting or exiting alone.

### Account guidance alongside deployment

Use the existing Wizard and isolated browser for the base play/creator accounts and the selected
device/streaming/accelerator accounts in the product boundary. Start with an ordered guide step,
official destination, phone/headset/client handoff, user-declared progress
and explicit handoff/resume. Do not build a multi-platform Auth Broker, account database or token
vault. Browser session state is not task state; no passwords, cookies or authentication URLs with
secrets enter the deployment journal. A user declaration is not a detected account fact.

Keep registration, Steam library/link guidance, headset activation and regional connectivity in
N1; BOOTH acquisition remains N5. The [N1 delivery plan](../development/n1-delivery-plan.md)
contains the concrete official-first routes and investigation order.
Add VRChat web-information reading only after the first usable delivery, with its own minimal
versioned data contract. Experimental persistence is a separate deferred slice, not implied by
opening a registration guide or reusing the BOOTH acquisition session.

### Small data model, not a framework

Proposed application concepts (names are illustrative, not frozen DTOs):

- Goal: requested purpose, brand/model, model-relevant connection choice, installation/project locations.
- Observation: component identity, detected version/location, result, observation time.
- Plan: selected goal, required versions/components, relevant baseline, ordered actions and reasons.
- Step: action kind, target, prerequisite, adapter, verification and recovery capability.
- Step result: actual outcome, actual version/location, next action, local evidence reference.
- Step activity: actual phase/byte counts, observed installer activity and required user action;
  elapsed time and monitoring refresh remain distinct from observed installation progress.

Keep the initial plan ordered. Add only concrete dependencies required by the first use case;
do not introduce a universal DAG scheduler or software catalog language. Internal structs need
not become public protocols. Before a new value crosses Gateway or persists, define the smallest
versioned contract and its meaningful positive/negative tests in the same vertical slice.

Recovery capability is per action: reobserve/retry, remove a newly installed component, restore
specific owned settings, or manual repair. Do not promise all-or-nothing OS transactions or
universal rollback. Back up only settings the action owns; detect conflicting later edits before
restoration. Do not use Unity-project snapshots as if they were machine snapshots.

### Where code belongs

- `crates/orchestrator`: goal/planning rules, use-case coordination, domain port types and task use.
- `crates/project-manager`: installation discovery, official installer/CLI adapters, component
  verification and scoped configuration changes. New vendor code starts here, not in React.
- `crates/provider-host`: explicit service construction and dispatch. It should delegate use cases,
  not become the deployment engine.
- `packages/contracts` and Electron preload: only the required typed operation/data surface.
- `apps/desktop/.../deployer`: goal selection, plan review, task display and explicit user handoffs.

Current detection/process/registry implementations partly live in the core. Treat that as existing
coupling, not a model for new adapter code. Extract a touched adapter with its tests when a slice
needs the seam; do not relocate every legacy module before delivering the first installer flow.

### Execution and state

Use the existing task runtime and SQLite authority. Start with sequential deployment on one
machine; do not add concurrent installers until a demonstrated use case and a conflict policy
exist. Existing per-project exclusion still applies to Unity/project mutations. The application
owns plan freshness and decisions; adapters return facts and supported actions. Credentials and
remote Electron objects remain in the desktop/session boundary.

New journal/step persistence must be designed against the current task-store format, not assumed
available. Use the existing revision, cancellation, waiting-for-input and inspect-required semantics
where they fit; version a persistence change if the first concrete slice requires it.

### Implemented N1 increment

The [deployment v0.1 family](../protocols/environment-deployment-v0.1.md) now connects purpose
selection and plan review to durable confirmed execution. Reuse the existing filesystem/registry
discovery as hints, then strengthen prerequisite checks in project-manager. Core planning does
not depend on Hub syntax or Windows handles. The Provider only constructs/delegates these services.

The [Unity deployment direction](unity-deployment.md) uses the original installer for the exact
global Editor and the official Unity CLI for registration and Android modules. Hub is the fallback.
Reviewed CLI acquisition and
Editor installation use separate confirmed plans; unsupported capabilities or paths require
explicit handoff. There is no shared install-path mutation, VR runtime replacement or floating
version selection. The contract owns confirmation, idempotency, cancellation and verification.
Actual installation, licensing, SDK/MA project launch and human UI review remain distinct evidence.

## Material and production evolution

Retain AMF/BDL ownership. BOOTH account enumeration, selective file download and import are distinct
operations even if one UI joins them. A catalog entry need not have a downloaded file; a downloaded
file need not already be valid production input. N5 audits existing code/UI/data before deciding
on migration or replacement. Do not design an all-purpose asset database replacement in N1.

Use actual complex N3 runs to drive object-location, dependency and conflict changes. Preserve
existing data and version/reject incompatible input explicitly. Required SDK handoff is an actual
SDK-recognized result, not a request to broaden VUA into account-upload automation.

## Documentation structure

Keep stable root paths to avoid churn. Give each question one entry point:

| Reader question | Owner |
| --- | --- |
| What is being delivered next, and what counts as done? | `development-outline.md` |
| What is allowed and who owns it? | `product-boundary.md` |
| What exists and where does code go? | `architecture/system.md` and domain documents |
| What is a proposed implementation change? | This accepted direction; concrete contracts land with each slice |
| What exact data crosses a boundary? | `protocols/` plus schemas and consumer tests |
| What was actually decided? | Accepted immutable `decisions/`; current consequences summarized in owning docs |
| What is verified on which environment? | Compatibility docs and local run evidence; release conclusions |
| Where does outdated material go? | `archive/` with reasons, replacements, and preserved history |

`docs/README.md` is the short navigation page, not a second protocol registry. A protocol guide
must explain that older numbered faces can coexist; never archive by highest-version heuristic.
The large design standard remains the current UI authority while focused parts are checked during
actual UI work. Splitting it is not required to implement N1.

## Incremental rollout

1. Correct demonstrably false architecture descriptions and mark source review versus runtime proof.
2. Establish short documentation routes, a protocol coexistence guide, and archive only confirmed
   historical/non-current material. Preserve contract bodies and schema paths.
3. Finalize the first deployment contract from one actual installer path; implement one complete
   inspect-plan-confirm-execute-verify flow in the existing owners.
4. Reuse the flow for component additions and the two N2 adapters only when that reuse is real.
5. Fix production/material gaps using N3/N5 evidence. Extract shared code when duplicated behavior
   or coupling warrants it, not because a diagram has an empty box.

## Decisions to resolve through implementation

The exact Unity install adapter, installer acquisition method, requested privilege scope, timeout,
and retry behavior need a capability check on this machine before being specified as supported.
Exercise each adapter against the chosen software. The accepted Unity mirror switch and source
order belong to the current slice. Universal version switching and OS snapshots remain later work.

The user confirmed on 2026-09-28: keep Electron + Rust + Unity Bridge and progressively adjust
responsibilities while reorganizing docs. This direction is accepted. Illustrative DTO names and
installer choices above are not frozen interfaces; define them from the first executable N1 slice.

## Document changelog

- 1.4.0 (2026-10-02): route model-first play, observable silent installation and account/network
  guidance through existing owners; align the current Unity installer/source policy.

- 1.3.0 (2026-09-30): prefer official standalone Unity CLI deployment; retain existing Hub only as optional fallback.

- 1.2.0 (2026-09-30): link the implemented purpose-plan/confirmation slice and distinguish remaining N1 functional acceptance.

- 1.1.0 (2026-09-30): add minimal account-guide state and external-only N2 adapter responsibilities.

- 1.0.0 (2026-09-28): user accepted retaining the stack and incrementally reorganizing software responsibilities and documentation for N1-N7.
