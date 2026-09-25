# VUA Project Operations Write Contract v0.1


> **⚠️ Superseded by v0.2 (2026-09-12)**: the `project.setNote` note write
> command (D-6 desktop confirmation ruling A, proposal 013 inline thread)
> was frozen with the core upgrade batch. The current specification is
> [project-ops-v0.2.md](../project-ops-v0.2.md); this document is kept
> for history only and maps to `schemas/project-ops/v0.1/` (do not edit;
> the import-copy shape is unchanged in v0.2).
> Document version: 0.1
> Status: **Superseded (→ v0.2)** (2026-09-12; previously: Frozen
> 2026-09-09 — the vocabulary row is the standalone
> project-ops family (`project.` prefix; parallel to the proposal 013
> inspection read face, read/write lines separate); the implementation batch
> was accepted and merged by integration (226dd41, rerun 428/0) plus the
> seven-refusal-code closed-set arbitration confirmation).
> Machine-readable vocabulary: `schemas/project-ops/v0.1/` (command / result
> schemas + 2 positive + 2 negative vectors; implementation tests
> `crates/project-manager/tests/import_copy.rs`)
> Scope: the M6 T-A extension — the taskified write path "import as a
> VUA-managed copy" (user ruling 2026-09-09 item 9: engineering = a copied
> import, user experience = migrated to VUA; coexists with the item 6
> migration semantics, BOARD U8 question ④ closed).
> Ownership boundary: the crate implementation lives in
> `crates/project-manager` (`import_copy`); provider routing belongs to the
> core domain; the desktop T-C confirmation-chain interaction belongs to the
> desktop domain.
> Updated: 2026-09-09

## Operation face (one vocabulary row, two phases)

| Operation | Semantics | Extra params |
| --- | --- | --- |
| `project.import-copy` | **Copy** one manager-registered project into a new VUA-managed project; the original stays read-only, unlocked, and unmarked throughout | `phase`: `plan` / `apply` |

Common params: `sourcePath` (a registered path; unregistered = refused),
`targetParentDirectory`, `targetProjectName`. `phase=apply` additionally
requires `confirmedPlanDigest` — binding the user's confirmation to the exact
plan state.

- **plan**: measures the copy scope (actual disk usage `estimatedBytes` +
  `excludedEntries` + `targetPath`) and produces a `planDigest`. Five guards
  are pre-checked item by item (target exists / target inside source /
  source not registered / source invalid / insufficient disk space).
- **apply**: re-computes the plan and **refuses on digest drift**
  (`plan_drift` — when the source changed after confirmation, executing a
  stale confirmation is refused and the confirmation chain restarts); copies
  under the NEW project's mutation lock (excluding the six entries
  `Library/Temp/Logs/obj/Builds/.vua`); the copy takes its own Unity-facing
  identity (productName rewritten); the `.vua/source.json` source link is
  written (sourcePath/associations/importedAt/taskCorrelation); **the
  VUA-native identity file `.vua/project.json` is written** (user rulings
  7/9/12: the copy is first-marked VUA-native, the note stays empty —
  marking never invents a note; the original project is never marked); the
  copy is re-inspected into the receipt (confirmations and snapshots are
  never inherited).

## Task and recovery semantics

- Reuses the application contract's nine-state task face; **no implicit
  resumption**: a half-done copy = `inspect_required`; clean-up, giving up,
  and retrying are all explicit user actions — the provider never auto-deletes
  leftovers (a leftover is evidence).
- The receipt `ImportReceiptV01`: the actually copied top levels, `bytesCopied`,
  the source link, and the copy's re-inspection (Unity version / manifest
  state). The original's confirmations and snapshots are never inherited.

## Refusal-code closed set (seven items)

| guard | code |
| --- | --- |
| target exists | `vua.project.target_exists` |
| target inside source | `vua.project.target_inside_source` |
| source not registered | `vua.project.source_not_registered` |
| source invalid | `vua.project.source_invalid` |
| insufficient disk space | `vua.project.insufficient_disk_space` |
| plan drift | `vua.project.plan_drift` |
| execution failed | `vua.project.execution_failed` |

The closed-set arbitration confirmation is on file (integration acceptance
batch); out-of-vocabulary refusal codes never appear.

## Separation from the read face

`project.import-copy` is refused by the inspection-read vocabulary
(project-inspection) and read-face requests are refused by this family's
vocabulary — asserted in both directions in `tests/project_queries.rs`. The
inspection and write families version independently.

## Document changelog

- 0.1 (2026-09-09): initial freeze — `project.import-copy` plan/apply phases +
  the seven-refusal-code closed set + task/recovery semantics; the
  implementation batch 226dd41 accepted and merged by integration. The
  execution-face enhancement (apply writes the VUA-native identity, wire
  vocabulary unchanged) is recorded in the proposal 014 inline note
  (2026-09-09 late-night batch).
