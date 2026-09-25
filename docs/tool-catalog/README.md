# VUA Tool Catalog

> Status: Accepted catalog format  
> Catalog schema: `vua.tool-entry/v3`  
> Updated: 2026-09-25  
> Normative effect: Trust classification, entry metadata, and contribution rules only

This community-maintainable catalog classifies entries by contact with VUA data and authority.
Each entry explains its purpose in natural language. The physical structure is one category directory
plus individual entry files.

```text
tool-catalog/
├─ core/       # trusted built-in VUA behavior
├─ plugin/     # capability-bounded VUA plugins
└─ external/   # independent external software
```

| Boundary | Test | VUA authority |
| --- | --- | --- |
| [Core](core/README.md) | Is it repository-owned behavior built directly into VUA? | Trusted built-in behavior, but only through owned use cases and ports |
| [Plugin](plugin/README.md) | Does a separately packaged extension request VUA capabilities? | Explicit, deny-by-default grants |
| [External](external/README.md) | Does independent software own its state and public integration surface? | Independent authority; each VUA-side adapter is separately Core or Plugin |

Kernel and the local UI are stable host surfaces. Core is a trust and catalog classification, not a
runtime module or registration mechanism.

## Entry schema

```yaml
---
catalog_schema: "vua.tool-entry/v3"
id: "stable.unique-id"
boundary: "core | plugin | external"
status: "proposed | planned | experimental | supported | deprecated"
risk: "pending | low | medium | high"
risk_rule: "vua.risk-gate/v1"
delivery: "version, post-1.0, or unscheduled"
maintainer: "VUA-Project or community identity"
distribution: "core | plugin-package | managed-optional | external-connection"
platforms: ["windows"]
capabilities: ["declared.capability"]
---
```

Each entry body explains value, classification, included/excluded behavior, data flow,
permissions, failure/degradation, license/redistribution, warnings, acceptance, and removal. Add or
remove one file plus its category README link through an ordinary reviewed Git change. Keep IDs
stable and reserve removed IDs permanently. Supported entries are deprecated before removal when migration
is required.

Schema v3 is a pre-release normalization: v2 `built-in.*` IDs became `core.*`, and `vua-plugin.*`
became `plugin.*`. No v2 entry reached `supported`; the old prefixes are reserved and cannot be reused.

Entry files are single-language English (language policy, user ruling 2026-09-25; see
`docs/meta/documentation-governance.md`).

## Release risk gate

The release gate derives `risk`. Contributors declare complete capabilities and behavior; the
release check applies [`vua.risk-gate/v1`](risk-gate-v1.md), writes or
verifies the highest matching level, and fails on a mismatch. `pending`, unknown capabilities, or
incomplete data cannot enter a supported release.

A catalog entry records classification and evidence. Product boundary, architecture, security
review, distribution review, and release gates respectively authorize scope, implementation,
execution, bundling, and publication. Built-in Core behavior and the community plugin host retain
separate trust boundaries.
