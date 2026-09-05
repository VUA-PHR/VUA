# Documentation guide

[English](README_EN.md) | [简体中文](README_ZH.md)

> Status: Accepted  
> Scope: Public VUA repository  
> Updated: 2026-09-04
> Normative effect: Defines public documentation routes and authority

The public repository contains final product boundaries, architecture, versioned interfaces, release
policy, and community-maintainable catalogs. Each task starts with the smallest relevant set.

## Authority order

1. [Product boundary](product-boundary_EN.md)
2. Versioned protocols, schemas, and fixed test vectors
3. Accepted architecture decision records under [`decisions/`](decisions/)
4. Module architecture
5. Release and compatibility policy
6. Tool-catalog rules for catalog entries

Higher layers own product meaning; lower layers supply implementation detail.

## Public directories

| Location | Public content | Authority |
| --- | --- | --- |
| `product-boundary_EN.md` / `_ZH.md` | Product goals, module ownership, delivery boundary | Product scope |
| `architecture/` | Module structure, dependency direction, adapters, data ownership | Implementation architecture |
| `compatibility/` | Verified production targets, migration inputs, and unsupported environments | Compatibility policy |
| `protocols/` and `schemas/` | Gateway, Recipe, Unity Bridge, plugin, and persistent formats | Versioned interfaces |
| `decisions/` | Accepted architecture decision records (ADRs) | Accepted decisions |
| `release/` | Product versions, compatibility, tags, and artifacts | Release engineering |
| `tool-catalog/` | `core / plugin / external` entries and release-risk rules | Catalog classification and contribution |

Working decision history, migration evidence, plans, research, project handoff context, and
visual-design working material stay in the local workspace. Accepted architecture decision
records are published under `decisions/`; their outcomes are consolidated into the public
documents above.

## Reading routes

| Task | Required | Add as needed |
| --- | --- | --- |
| Electron / React | Product boundary, [desktop architecture](architecture/desktop_EN.md) | Gateway contract and security tests |
| Orchestrator | Product boundary, [Orchestrator architecture](architecture/orchestrator_EN.md) | State, recovery, and adapter protocols |
| AMF acquisition / BDL | Product boundary, [AMF](architecture/amf-unity_EN.md), [BDL](architecture/bdl_EN.md) | Session, download, and persistence contracts |
| AMF / Recipe / Unity | Product boundary, AMF architecture, [Unity editor compatibility](compatibility/unity-editor_EN.md) | Recipe and [Unity Bridge](protocols/unity-bridge-v1_EN.md) |
| Kernel / Provider hosting | Product boundary, [system architecture](architecture/system_EN.md) | Desktop and Orchestrator architecture |
| Core tools | Product boundary, [integration architecture](architecture/integrations-and-overlays_EN.md), [core catalog](tool-catalog/core/README.md) | Safety evidence and capability matrices |
| Plugins | Product boundary, integration architecture, [plugin catalog](tool-catalog/plugin/README.md) | Plugin protocol and compatibility tests |
| External integrations | Product boundary, integration architecture, [external catalog](tool-catalog/external/README.md) | Upstream audit and capability matrix |
| Release/version change | [Versioning policy](release/versioning_EN.md) | Owning protocol or schema |

## Current entry points

- [System architecture](architecture/system_EN.md)
- [Electron desktop and presentation](architecture/desktop_EN.md)
- [Orchestrator](architecture/orchestrator_EN.md)
- [AMF and Unity Bridge](architecture/amf-unity_EN.md)
- [Unity editor compatibility](compatibility/unity-editor_EN.md)
- [BDL](architecture/bdl_EN.md)
- [Core, plugins, external integrations, and overlays](architecture/integrations-and-overlays_EN.md)
- [Unity Bridge v1](protocols/unity-bridge-v1_EN.md)
- [Application Contract v0.1](protocols/application-contract-v0.1_EN.md)
- [Orchestrator Task Store Format v0.1](protocols/task-store-v0.1_EN.md)
- [Supervised Provider Process Protocol v0.1](protocols/provider-process-v0.1_EN.md)
- [Download Events Protocol v0.1](protocols/download-events-v0.1_EN.md)
- [BDL Read-Model Protocol v0.1](protocols/bdl-queries-v0.1_EN.md)
- [ADR: Supervised independent-process Orchestrator Provider](decisions/orchestrator-supervised-provider_EN.md)
- [Versioning policy](release/versioning_EN.md)
- [v0.4.1 release notes](release/v0.4.1_EN.md)
- [Community-maintainable tool catalog](tool-catalog/README.md)

## Documentation rules

- Each fact has one normative owner; summaries link to that owner.
- Active public developer documents maintain matching `_EN.md` and `_ZH.md` versions.
- `tool-catalog/` uses one bilingual file per category and entry so each community change remains complete.
- Schemas, wire formats, source code, generated files, and official license texts remain single-source.
- Wire, schema, persistence, and plugin formats carry machine-readable versions.
- New public documents accompany real architecture, interfaces, or implemented module needs.
