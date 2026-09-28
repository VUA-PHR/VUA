# Protocol reading guide

> Document version: 1.0.0
> Status: Accepted
> Updated: 2026-09-28
> Scope: Navigation and retention guidance; no wire-format changes

Choose the operations your slice uses, then read their schema and consumer tests. A document's
number is not sufficient to decide whether it can be archived. Some version directories describe
separate concurrently served operations, and some newer documents extend an earlier baseline.

| Area | Entry | Retention rule |
| --- | --- | --- |
| Gateway/tasks | [Application](application-contract-v0.1.md), [task store](task-store-v0.1.md), [Provider](provider-process-v0.1.md) | Current shared boundaries; document version and wire version may differ |
| Environment/projects | [Inspection](project-inspection-v0.2.md), [project operations](project-ops-v0.2.md), [editor verification](editor-verify-v0.1.md) | Preserve current guards and external-project read-only policy |
| Package reads | [Query](packages-query-v0.2.md), [catalog](packages-catalog-v0.2.md), repository/template protocols | Check method consumers before retiring an older face |
| Package writes | packages-ops v0.1 through v0.6 | Concurrent faces: provider constants and TS types use all six; v0.6 is not blanket replacement of v0.1-v0.5 |
| Materials/production | [Material v0.2](material-intake-v0.2.md), [production v0.2](production-use-case-v0.2.md), [evidence](production-evidence-v0.1.md) | Earlier baselines may be needed for incremental definitions and tests; not archived by date |
| Recipe/SDK | [Recipe export](recipe-export-v0.1.md), [handoff v0.2](release-handoff-v0.2.md) | Check stored-format and consumer compatibility before retiring the earlier handoff face |
| BDL/acquisition | [Queries v0.5](bdl-queries-v0.5.md), [commands v0.4](bdl-commands-v0.4.md), [observations](bdl-dependency-observations-v0.2.md), [downloads](download-events-v0.1.md) | Follow actual schema/route versions; N5 audit is still required |
| Unity | [v4](unity-bridge-v4.md), [v3](unity-bridge-v3.md), [v2](unity-bridge-v2.md), [v1](unity-bridge-v1.md) | Newest frozen operation set does not prove every production path migrated; inspect actual command consumers |
| Previously superseded | [superseded/](superseded/) | Historical version lookup only; retaining these files does not reactivate their implementation |

Source review on 2026-09-28 found package-operation version constants v0.1-v0.6 in
crates/provider-host/src/provider_host.rs and matching TS types in packages/contracts. This is
retention evidence, not proof that every path was executed. Body histories such as M/W/proposal
labels are historical provenance, not active work assignments.

Keep contract bodies/schema paths stable during navigation cleanup. Any behavioral change follows
its version/migration rules in the same implementation slice. Inspect direct and inherited
references before moving a baseline. Record replacement, reason and remaining consumers for any
retirement, then update the registry and links.

For upstream-driven changes, follow the [third-party compatibility and licensing policy](../release/versioning.md#third-party-changes-and-compatibility).

## Document changelog

- 1.0.0 (2026-09-28): add task-based protocol navigation and explicit coexistence/retention guidance.
