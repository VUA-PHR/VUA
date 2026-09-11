# VUA Project Operations Write Contract v0.2

[English](project-ops-v0.2_EN.md) | [简体中文](project-ops-v0.2_ZH.md)

> Document version: 0.2
> Status: **Frozen (2026-09-12)** — an incremental-family upgrade from v0.1:
> the `project.setNote` note command is added (the condition of the core
> 013 stance "conditional go-ahead" became true when the desktop D-6
> confirmation landed ruling A "list inline view + inline light editing";
> frozen with the core upgrade batch). The v0.1 frozen artifacts stay
> archived as superseded (the import-copy shape is unchanged).
> Machine-readable vocabulary: `schemas/project-ops/v0.2/` (command / result
> schemas + 8 positive + 5 negative vectors + 1 guard-refusal vector;
> consumer tests `crates/provider-host/tests/project_ops_wire.rs`, 13 items —
> vector-driven validation plus the real frame-loop wire chain)
> Scope: the M6 T-A write-face extension — the project-list note (user
> ruling 12 "list display only" plus the B4 CJK-character make-up motive;
> the D-6 "inline view + light editing" presentation belongs to the desktop
> wiring batch).
> Ownership boundary: the identity primitive lives in
> `crates/project-manager` (`vua_identity`, delivered by the environment
> role); provider routing belongs to the core domain; the desktop list
> inline-editing interaction belongs to the desktop domain.
> Updated: 2026-09-12

## Operation face (two vocabulary rows in v0.2)

| Operation | Semantics | Params |
| --- | --- | --- |
| `project.import-copy` | (v0.1 unchanged) **Copy** one manager-registered project into a new VUA-managed project; the original stays read-only, unlocked, and unmarked throughout | `phase`: `plan` / `apply`; see v0.1 |
| `project.setNote` | Set (or clear, with a `null` note) the user note of one **VUA-native** project | `projectPath`, `note` |

`project.setNote` semantics in detail:

- **`projectPath` is the only project-identity form in this word-list
  family** — same shape and source as the proposal-013 read face
  (`inspectProject`/`lockStatus`, the registered path). The core 09-10
  draft said `projectId`; the upgrade freeze corrects that to `projectPath`
  (`projectId` has no standing definition in this family; identities inside
  one family must share one shape, and the guard semantics anchor on the
  registered path). The desktop wiring batch consumes per this protocol.
- **`note` is single-line plain text**: non-empty, at most 2000 characters,
  no line breaks; `null` = clear the note; the empty string is not a note
  (refused) — clearing uses `null`, an honest two-value face.
- **The note attaches to the VUA-native declaration** (user ruling 12): the
  note lives inside the `.vua/project.json` identity document (that
  document is the only note store); writing never changes `markedAt`
  (setting a note never re-marks the project).
- Tasked like the import-copy precedent (accepted over the nine-state task
  face); a note write is a momentary single-file rewrite — the task
  finishes right after acceptance, with no long-operation cancel face.

## Guard closed set (server-side, item by item; frozen in v0.2)

Guards are evaluated inside the task; a guard refusal is the `rejected`
result document inside the Done payload (the task honestly completed and
its verdict is the refusal — the import-copy discipline), never a transport
error. v0.2 extends the v0.1 seven guards with three setNote guards:

| guard | code | semantics |
| --- | --- | --- |
| project not found | `vua.project.project_not_found` | no registered manager lists the path — the detection face's registry is the writable world (the same set `inspectProject` answers over) |
| not VUA-native | `vua.project.not_vua_native` | no identity file: the note presupposes the VUA-native declaration, nothing to attach to without it |
| identity unreadable | `vua.project.identity_unreadable` | the identity file exists but cannot be parsed — unreadable evidence is never overwritten by a blind rewrite; resolve it first |
| execution failed | `vua.project.execution_failed` | (already in v0.1, reused) the identity-file write itself failed |

The result `kind=note` projection shares its shape with the
project-inspection v0.2 `vuaIdentity` present face (the same `markedAt` /
`note` field names) — the list read face and the write face see the same
note fact.

## Task and recovery semantics

- Reuses the application contract's nine-state task face; no implicit
  resumption (the v0.1 discipline applies in full).
- Acceptance envelope: `schemaVersion`="0.2" + `operation` + `taskId` +
  `correlationId`.

## Separation from the read face (v0.1 discipline maintained)

The inspection and write families version independently; read requests on
the `project.*` write vocabulary row and write requests on the read
vocabulary row are refused in both directions, pinned in the consumer
tests.

## Document changelog

- 0.2 (2026-09-12): incremental freeze — `project.setNote` added
  (`projectPath` + `note`/null; single-line plain text, at most 2000
  characters) + the guard closed set extended by three
  (project_not_found / not_vua_native / identity_unreadable) + the
  `kind=note` completion face (same shape as the vuaIdentity present
  projection); the draft word `projectId` corrected to `projectPath` at
  freeze (one identity shape per family). Consumer tests 13 green
  (vector-driven + wire chain). The D-6 desktop confirmation (ruling A)
  lives in the proposal 013 inline "Stance (desktop)" section.
- 0.1 (2026-09-09): initial freeze — `project.import-copy` plan/apply
  phases + the seven-refusal-code closed set + task/recovery semantics;
  implementation batch 226dd41 accepted and merged by integration.
