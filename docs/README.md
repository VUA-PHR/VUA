# Documentation guide

> Status: Accepted
> Updated: 2026-09-28
> Scope: Current documentation routes for ordinary single-line N-sequence development

Collab is now **archived and retired**, superseding the prior freeze. Historical files stay at
their paths for provenance; future collaboration requires a fresh design. The
[repository PR policy](meta/protected-main.md) continues independently.

## Start here

1. Read [the N1-N7 sequence](development-outline.md) for the next user outcome and acceptance.
2. Read [product boundaries](product-boundary.md) for scope and ownership.
3. Use [the system map](architecture/system.md) to find the current code owner, then follow the
   shortest task route below. Do not read every protocol before starting a small slice.

[AGENTS.md](../AGENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md) define repository work.
Collab is frozen and unmaintained since the 2026-09-28 N-sequence adoption. Its entries remain
historical/reactivation references. **[collab/PROTECTED_MAIN.md](../collab/PROTECTED_MAIN.md)
continues in force for all work.** The collab:brief script and report-only CI stay; no bootstrap,
ticks, proposals, or BOARD maintenance are required. The [cold-start primer](project-context.md)
is optional context, not a second schedule.

## Read by task

| Task | Read next | Add only when needed |
| --- | --- | --- |
| N1 deployment / N2 tools | [System map](architecture/system.md), [integration boundaries](architecture/integrations-and-overlays.md), [incremental evolution](architecture/evolution.md) | Environment/editor compatibility, relevant Gateway contract, selected upstream adapter |
| N3 production / N4 Recipe | [AMF and Unity](architecture/amf-unity.md), [Orchestrator](architecture/orchestrator.md) | Production/material/Recipe/SDK handoff contracts and real-run evidence |
| N5 material audit/rework | [BDL](architecture/bdl.md), [AMF](architecture/amf-unity.md) | Current UI/Gateway/code/tests; account listing, selective download and import contracts |
| UI changes | [Desktop](architecture/desktop.md), [design standard](design/design-standard.md) | Relevant feature and human UI acceptance |
| Recovery | [Orchestrator](architecture/orchestrator.md) | Task store, operation-specific failure/retry format and tests |
| Versions / N7 distribution | [Version policy](release/versioning.md), N7 acceptance | Installer, actual-build screenshots and user-provided guide reference |
| Contract change | [Protocol guide](protocols/README.md) | Specific schema and consumer tests; do not assume highest version replaces all older faces |
| Document cleanup | [Audit/disposition](meta/document-audit-2026-09-28.md), [governance](meta/documentation-governance.md) | [Registry](REGISTRY.md) and [archive index](archive/README.md) |

## Directory roles

| Location | Role |
| --- | --- |
| Root product-boundary/development-outline | What the product does; what is delivered next |
| `architecture/` | Current code/ownership; explicitly marked proposals for incremental evolution |
| `protocols/`, repository `schemas/` | Exact wire/storage behavior, with active/coexisting/historical status |
| `compatibility/` | Supported targets and evidence limits, not universal Windows guarantees |
| `design/` | Current UI acceptance authority; refine relevant sections with actual UI work |
| `decisions/` | Accepted decisions retained with historical rationale; supersede explicitly, never silently rewrite |
| `release/` | Version policy and immutable historical Chinese release notes |
| `tool-catalog/` | Core/plugin/external classification; a catalog entry is not implemented capability |
| `meta/` | Small documentation maintenance rules and this migration's audit |
| `research/` | Retained extraction/boundary research pending owning-domain review, not a new feature roadmap |
| `archive/` | Outdated snapshots and completed spike evidence, excluded from the current reading path |

Current authority: user ruling, product boundary, versioned contracts/tests, accepted decisions,
architecture, design, then plans. A Draft proposal does not override an accepted contract.
A source review does not establish runtime acceptance. M history does not close N gates.

Tracked docs are English except Chinese release notes and the four-language root README.
Local Chinese mirrors under docs-zh are optional and non-authoritative. Each fact has one owning
document; navigation links to it instead of copying detailed rules. Raw real-machine artifacts
remain local. Registry and document changes ride with the feature, not a separate paperwork cycle.
