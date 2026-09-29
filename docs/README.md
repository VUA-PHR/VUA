# Documentation guide

> Status: Accepted
> Updated: 2026-09-28
> Scope: Current documentation routes for ordinary single-line N-sequence development

## Choose your reading context

**For people:** start with the project README and the questions below. For contributions, read
the human introduction in CONTRIBUTING; translation and usability feedback are welcome without
learning the full architecture. Follow only the detail needed for your change.

**If you are an Agent:** read AGENTS.md and the Agent introduction in CONTRIBUTING first, then
identify the owning product/contract document and N acceptance row for the actual user request.
Check branch and working-tree state before edits; old checkouts may still contain active-looking
collab files. Current user rulings retire that mechanism regardless of the checkout's age. Do not
run archived role prompts, ticks or autonomous work queues. Report evidence and unverified gaps
separately, and preserve the organizational-transfer review hold.

Both readers use the same definitions below; these introductions change navigation, not policy.

## Start here

| Question | One owning document |
| --- | --- |
| What is VUA and where do I start? | [Project README](../README.md) |
| How do I develop and submit changes? | [Contributing](../CONTRIBUTING.md) |
| What does the product include? | [Product boundary](product-boundary.md) |
| What comes next and what counts as passing? | [N sequence](development-outline.md) |
| Where does each responsibility live? | [System map](architecture/system.md) |
| Which exact contract do I need? | [Protocol guide](protocols/README.md) |

Read only the owning documents needed for the task. Collab is [archived and retired](archive/2026-09-29/README.md).
[PR protection](meta/protected-main.md) continues independently; the retained brief and report-only
CI perform documentation checks, not coordination.

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
