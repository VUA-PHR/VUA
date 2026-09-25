# Documentation guide

> Status: Accepted  
> Scope: Public VUA repository  
> Updated: 2026-09-25
> Normative effect: Defines public documentation routes and authority

The public repository contains final product boundaries, architecture, versioned interfaces, release
policy, and community-maintainable catalogs. Each task starts with the smallest relevant set.

## Authority order

1. [Product boundary](product-boundary.md)
2. Versioned protocols, schemas, and fixed test vectors
3. Accepted architecture decision records under [`decisions/`](decisions/)
4. Module architecture
5. Release and compatibility policy
6. Tool-catalog rules for catalog entries

Higher layers own product meaning; lower layers supply implementation detail.

## Public directories

| Location | Public content | Authority |
| --- | --- | --- |
| `product-boundary.md` | Product goals, module ownership, delivery boundary | Product scope |
| `architecture/` | Module structure, dependency direction, adapters, data ownership | Implementation architecture |
| `compatibility/` | Verified production targets, migration inputs, and unsupported environments | Compatibility policy |
| `protocols/` and `schemas/` | Gateway, Recipe, Unity Bridge, plugin, and persistent formats | Versioned interfaces |
| `decisions/` | Accepted architecture decision records (ADRs) | Accepted decisions |
| `release/` | Product versions (Chinese changelogs), compatibility, tags, and artifacts | Release engineering |
| `tool-catalog/` | `core / plugin / external` entries and release-risk rules | Catalog classification and contribution |

Working decision history, migration evidence, plans, research, project handoff context, and
visual-design working material stay in the local workspace. Accepted architecture decision
records are published under `decisions/`; their outcomes are consolidated into the public
documents above.

Superseded protocol versions live under [`protocols/superseded/`](protocols/superseded/); the
current managed set with versions and status is indexed in [REGISTRY.md](REGISTRY.md).

## Reading routes

| Task | Required | Add as needed |
| --- | --- | --- |
| Electron / React | Product boundary, [desktop architecture](architecture/desktop.md) | Gateway contract and security tests |
| Orchestrator | Product boundary, [Orchestrator architecture](architecture/orchestrator.md) | State, recovery, and adapter protocols |
| AMF acquisition / BDL | Product boundary, [AMF](architecture/amf-unity.md), [BDL](architecture/bdl.md) | Session, download, and persistence contracts |
| AMF / Recipe / Unity | Product boundary, AMF architecture, [Unity editor compatibility](compatibility/unity-editor.md) | Recipe and [Unity Bridge v4 (current)](protocols/unity-bridge-v4.md) |
| Kernel / Provider hosting | Product boundary, [system architecture](architecture/system.md) | Desktop and Orchestrator architecture |
| Core tools | Product boundary, [integration architecture](architecture/integrations-and-overlays.md), [core catalog](tool-catalog/core/README.md) | Safety evidence and capability matrices |
| Plugins | Product boundary, integration architecture, [plugin catalog](tool-catalog/plugin/README.md) | Plugin protocol and compatibility tests |
| External integrations | Product boundary, integration architecture, [external catalog](tool-catalog/external/README.md) | Upstream audit and capability matrix |
| Release/version change | [Versioning policy](release/versioning.md) | Owning protocol or schema |

## Current entry points

- [Development outline (current window and batches)](development-outline.md)
- [Design standard](design/design-standard.md)
- [Cold-start primer (former handoff summary, U15 condensed)](project-context.md)
- [Managed-document registry](REGISTRY.md)
- [System architecture](architecture/system.md)
- [Electron desktop and presentation](architecture/desktop.md)
- [Orchestrator](architecture/orchestrator.md)
- [AMF and Unity Bridge](architecture/amf-unity.md)
- [Unity editor compatibility](compatibility/unity-editor.md)
- [BDL](architecture/bdl.md)
- [Core, plugins, external integrations, and overlays](architecture/integrations-and-overlays.md)
- [Unity Bridge v4 (current frozen; the v2 production path remains in effect)](protocols/unity-bridge-v4.md)
- [Application Contract v0.1](protocols/application-contract-v0.1.md)
- [Orchestrator Task Store Format v0.1](protocols/task-store-v0.1.md)
- [Supervised Provider Process Protocol v0.1](protocols/provider-process-v0.1.md)
- [Download Events Protocol v0.1](protocols/download-events-v0.1.md)
- [BDL Read-Model Protocol v0.5](protocols/bdl-queries-v0.5.md)
- [BDL Command Protocol v0.4](protocols/bdl-commands-v0.4.md)
- [BDL Dependency Observations v0.2](protocols/bdl-dependency-observations-v0.2.md)
- [Packages Query Protocol v0.2](protocols/packages-query-v0.2.md)
- [Packages Catalog Protocol v0.2](protocols/packages-catalog-v0.2.md)
- [Packages Ops Protocol v0.6](protocols/packages-ops-v0.6.md)
- [Packages Repos Protocol v0.2](protocols/packages-repos-v0.2.md)
- [Packages Repos Catalog Protocol v0.1](protocols/packages-repos-catalog-v0.1.md)
- [Repo-Level Package Catalog Protocol v0.1](protocols/packages-repo-catalog-v0.1.md)
- [Package Templates Protocol v0.1](protocols/packages-templates-v0.1.md)
- [Project Inspection Protocol v0.2](protocols/project-inspection-v0.2.md)
- [Project Ops Protocol v0.2](protocols/project-ops-v0.2.md)
- [Inspection Queries Protocol v0.1](protocols/inspection-queries-v0.1.md)
- [Inspection Evidence Protocol v0.1](protocols/inspection-evidence-v0.1.md)
- [Editor Verify Protocol v0.1](protocols/editor-verify-v0.1.md)
- [Production Use-Case Protocol v0.2](protocols/production-use-case-v0.2.md)
- [Production Evidence Protocol v0.1](protocols/production-evidence-v0.1.md)
- [Material Intake Protocol v0.2](protocols/material-intake-v0.2.md)
- [Recipe Export Protocol v0.1](protocols/recipe-export-v0.1.md)
- [SDK Handoff Protocol v0.2](protocols/release-handoff-v0.2.md)
- [ADR: Supervised independent-process Orchestrator Provider](decisions/orchestrator-supervised-provider.md)
- [Versioning policy](release/versioning.md)
- [v0.6.0 release notes (Chinese)](release/v0.6.0.md)
- [v0.5.0 release notes (Chinese)](release/v0.5.0.md)
- [v0.4.2 release notes (Chinese)](release/v0.4.2.md)
- [Community-maintainable tool catalog](tool-catalog/README.md)
- Collaborator entry point: the repository collaboration mechanism lives in
  [`collab/README.md`](../collab/README.md) (workspace instructions in the root `AGENTS.md`).

## Documentation rules

- Each fact has one normative owner; summaries link to that owner.
- Tracked documentation is single-language English (user ruling 2026-09-25). Changelogs under
  `release/` are single-language Chinese; the root README keeps English, Chinese, Japanese, and
  Korean editions. Chinese mirrors are maintained locally under the gitignored `docs-zh/` and
  carry no normative force.
- `tool-catalog/` uses one file per category and entry so each community change remains complete.
- Schemas, wire formats, source code, generated files, and official license texts remain single-source.
- Wire, schema, persistence, and plugin formats carry machine-readable versions.
- New public documents accompany real architecture, interfaces, or implemented module needs.
