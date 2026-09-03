# VUA product boundary

[English](product-boundary_EN.md) | [简体中文](product-boundary_ZH.md)

> Status: Accepted  
> Scope: Entire VUA product  
> Updated: 2026-09-03  
> Normative effect: Yes

## Product definition

VUA is a Windows-first, local VRChat desktop production environment for players who want to move
from asset discovery and environment preparation through Avatar production and runtime-tool setup.
It is Recipe-first, local-first, capability-aware, and designed for recoverable execution.

## Accepted product areas

1. **Electron desktop application:** React, TypeScript, and Vite renderer; isolated remote pages and
   sessions; download interaction; desktop windows; narrow Gateway.
2. **Orchestrator:** durable tasks, plans, approval, cancellation, recovery, Build Records, and
   adapter coordination behind a replaceable, versioned Provider boundary.
3. **Avatar MegaFactory:** owns Warehouse, Recipe, Assembly, Inspection, Release; native browsing,
   authorized downloads, content management, and external-source adapters; and **BDL**, its private
   local catalog, terms, compatibility, source, search, and mapping module.
4. **Environment deployment:** prerequisite detection, guided deployment, and bounded recovery for
   hardware, VR, Unity, VRChat, and related tools without which play or Avatar production is blocked.
5. **Project management:** VUA's `vrc-get`-based package manager plus capability-aware compatibility
   with ALCOM-managed and VCC-managed projects.
6. **Unity Bridge:** a versioned deterministic protocol whose production target is exactly global
   Unity `2022.3.22f1`; historical editor projects enter through the documented migration boundary.
7. **Desktop and VR overlays:** guidance, status, and runtime information through stable services.
8. **Integrated runtimes:** major optional native-feeling capabilities, including face tracking,
   motion tracking, and Avatar optimization, through managed or external-connection adapters.
   Implementation begins only after `1.0.0`.
9. **Community plugin interface:** a versioned protocol for optional enhancements and customization,
   with declared capabilities, lifecycle, tasks, permissions, and compatibility rules.

## Extension and integration trust boundary

VUA classifies extensibility by data access and trust:

| Boundary | Product meaning | Access rule |
| --- | --- | --- |
| Kernel and local UI | Stable application bootstrap, security authority, Gateway enforcement, and controlled presentation surface | Extensions consume their published surfaces |
| Core | Repository-owned, reviewed product behavior built directly into the trusted application and release | Uses owned Orchestrator application use cases and ports |
| Plugin | Separately packaged enhancement using the public, versioned capability boundary | Explicit grants define its complete authority |
| External | Independent software interacting with Unity, VRChat, SteamVR, devices, or another public external boundary | Maintains independent state; each VUA-side adapter is classified as Core or Plugin |

Environment deployment, tracking, optimization, accessibility, and appearance are described as
natural-language purposes inside each entry. The community-maintainable
[tool catalog](tool-catalog/README.md) records classification and evidence for individual entries.
The product boundary approves scope, architecture approves implementation ownership, and the release
gate derives risk from declared capabilities and behavior.

## Stable product principles

- **Recipe-first:** select assets and intent before creating or modifying a Unity project.
- **Local-first:** purchase sessions, orders, downloads, paid assets, and production state remain on
  the user's device.
- **Deterministic production:** normalizable Unity work is reproduced through Unity Bridge and Build
  Records.
- **Capability-aware:** official, open-source, and community tools coexist through adapters; the UI
  reports the actual available capability.
- **Recoverable:** long-running tasks define state, cancellation, retry, recovery, and manual handoff.
- **Least privilege:** remote content, plugins, and third-party components receive only required
  capabilities.

## Explicit boundaries

- BDL is AMF's private local data module in this repository; AMF provides its application services.
- Electron Main owns remote-page, Session, Cookie, permission, and download transport mechanisms and
  their desktop security enforcement. AMF owns acquisition intent, durable tasks, source validation,
  file inspection, and Warehouse mapping. Their boundary exchanges normalized application values.
- BOOTH sessions, orders, purchased files, and credentials stay on the user's device; platform
  purchase, payment, identity, age, and access controls remain authoritative.
- Repository and cloud-CI tests use synthetic fixtures that match production input structures without
  containing real product or user content.
- Local read-only compatibility tests may access public BOOTH pages through the platform's normal
  public entry points while respecting authentication, payment, age, and access controls. Page
  responses, screenshots, and product metadata are not committed as test fixtures.
- Developers may run local integration and smoke validation with Unity assets they lawfully obtained
  or purchased. Those assets, user projects, test configuration, and outputs stay local and do not
  enter the repository or cloud-CI artifacts.
- [Unity editor compatibility](compatibility/unity-editor_EN.md) defines global `2022.3.22f1` as the
  sole production target. `2019.4.31f1` and `2022.3.6f1` are migration sources. Other Unity versions
  report their exact difference from the production target while project files remain unchanged;
  Tuanjie Engine is currently unsupported.
- Every optionally bundled component requires an individual license, redistribution, update, and
  signature review.
- EAC process termination is an experimental high-risk recovery action, disabled by default and
  confirmed on every execution. It may cause game interruption, abnormal EAC state, or in extreme
  cases platform/account safety checks and account anomalies. It is limited to verified allowlisted
  user-mode residual processes and never disables services/drivers, modifies EAC/VRChat files, or
  bypasses anti-cheat.
- The first delivery phase supplies the capability protocol and security model; marketplace
  governance follows a later release decision.
- Final VRChat Avatar login and upload remain in the official SDK flow; VUA prepares and validates.

## Current stage

The project is in pre-alpha. Component ownership is effective now; versioned and locally tested
protocols govern implementation. Runtime-tool integration begins after `1.0.0`. The repository
license is Apache-2.0 and the public
contribution policy is defined in the root contribution guide. Release signing and update design
remain release-engineering decisions.
