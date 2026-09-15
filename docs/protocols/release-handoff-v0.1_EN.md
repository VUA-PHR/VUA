# release-handoff Protocol v0.1 (official-SDK upload handoff vocabulary row: release.openForHandoff)

[English](release-handoff-v0.1_EN.md) | [简体中文](release-handoff-v0.1_ZH.md)

> Document version: 0.1
> Status: **FROZEN (official-SDK upload handoff vocabulary row)** (2026-09-16,
> proposal 023 core freeze batch: desktop/production stance convergence plus
> the five-point core ruling — see "Freeze sequence")
> Machine-readable vocabulary: `schemas/release-handoff/v0.1/` (single-method
> Schema + 3 positive + 3 negative vectors; frame-loop wire tests
> `crates/provider-host/tests/release_handoff_wire.rs`; TS consumer tests
> `packages/contracts/src/application-contract.test.ts`)
> Scope: `release.openForHandoff` (tasked handoff command: buildId → task
> nine states → handoff fact document)
> Ownership boundary: the handoff implementation domain = the process/window
> face (production-domain port) plus the core use case (a later slice); this
> batch freezes the vocabulary-row CONTRACT face — the method vocabulary, the
> params closed set, the acceptance-receipt and handoff-fact shapes, the
> error-code closed set, and the honest-absence semantics
> Updated: 2026-09-16 (v0.1 freeze batch: bilingual protocol document +
> docs/REGISTRY.md registration)

## Handoff semantics (product boundary restated)

Handoff = **bringing the user to the START of the official SDK upload flow**,
not "uploading on the user's behalf". Product boundary (product-boundary,
"boundaries and commitments"): the final upload of a VRChat avatar continues
to use the official SDK flow; VUA provides preparation, verification, and
handoff — the upload itself never enters VUA: no proxy upload, no proxied
credentials, no upload-as-VUA-fact. Handoff completion is the VUA-side
terminal state; **upload progress/result are never VUA facts** — this row's
handoff fact document has NO upload-status field (`additionalProperties:
false` pinned by shape, guarded by the negative vector), so there is nothing
to guess at (honesty rules 1/2).

## Freeze sequence (proposal 023 hard preconditions, item by item)

- **① Desktop + production stance convergence**: the desktop stance (023
  inline "stance (desktop)" section, 469ef5c via the 52nd-wave merge d73fa10)
  — direction a is the action authority, direction b's receipt shape folds
  into a's result document, the Release-page entry lands on the Build Record
  browsing rows; the production stance (023 inline "stance (production)"
  section, wt-4 tree, five points, landing with its batch) — mechanism facts
  pinned: the Bridge command face (com.ph-r.vua) presumes an already-open
  project, so openForHandoff is editor-process lifecycle management,
  **implementation domain = the process/window face, unity-bridge v3 gains
  zero operations** (no deterministic Bridge operation exists, so the
  evolution clause is not triggered — hard precondition 5 is vacuous);
- **② Schema + positive/negative vectors**: `schemas/release-handoff/v0.1/`
  (this batch);
- **③ At least one consumer test**: frame-loop wire tests (provider-host
  `release_handoff_wire` 5/5) + TS contract consumer tests (`@vua/contracts`
  release-handoff section, 3 cases + the mock absence-branch test) — the
  desktop Release-page real-consumption slice follows (desktop stance: waits
  for the freeze batch + the TS face, no pre-wiring);
- **④ Bilingual protocol document revision record**: this file + the EN
  mirror + the application-contract protocol method-row + the revision entry
  (this batch);
- **⑤ unity-bridge evolution clause**: **vacuous** — the production stance
  pinned that the handoff never crosses the in-editor Bridge command face;
  v3 gains zero operations.

## The five-point core ruling (open question 3 closed + ① registered)

1. **Direction choice**: direction a (`release.openForHandoff`) is the action
   authority; direction b does not become a command — `release.handoffBundle`
   is NOT registered, its receipt shape (buildId + project identity) folds
   into a's result document (desktop stance adopted: two entrances carrying
   the same fact = zero IA gain).
2. **Vocabulary-row family boundary**: `release.*` = the product-action face
   (actions performed on a build outcome); `record.*` = the record read/write
   face (`record.get`/`record.list` and `production.getBuildRecord`) — the
   two families are cleanly separated with no overlap (production stance 5
   adopted); the directory/protocol family name `release-handoff` anchors the
   handoff semantics and the error-code family `vua.release_handoff.*`.
3. **Tasking**: the **unified task nine-state single form** (production
   stance 3 adopted) — opening a project under Unity 2022.3 is a
   minutes-scale long operation; the acceptance reply follows the
   tasked-command precedent (the `inspection.requestRun` shape): poll the
   application task face by taskId; **the completion judgment = the Bridge
   handshake arrival** (the 001 chain, the deterministic signal that the
   project finished loading) — "process started" is never a completion
   judgment; timeout fails honestly (timeout class) / inspect_required, never
   a guessed panel state (honesty rule 3); the already-open scenario reaches
   the terminal state immediately (single form, negligible cost); OS window
   focus is best-effort and enters **neither the completion judgment nor the
   receipt facts** (focus is not a stable fact). No sync/task dual-form fork.
4. **Params closed-set amendment**: the single-key `{ buildId }` (amending
   the 023 section-3 draft "buildId + project identity field") — the project
   identity's authority lives on the build-record face (projectId already
   travels on the frozen record), so repeating it in params creates a
   dual-source reconciliation face with zero gain; the desktop stance "the
   authoritative identity lives on the build-record face" taken to its
   conclusion; a legal desktop consumer flow launched from a Build Record row
   naturally holds only the buildId. Disagreement reopens the 023 thread
   (registering the ruling here does not soften the freeze; changes go
   through a version bump).
5. **Editor identity resolution order** (semantic face; implementation lands
   in a later slice): explicit injection (the 021 assembly-face selection
   authority, the `VUA_UNITY_EDITOR` manual channel) > the build record's
   carried identity (`unityEditorVersion`/`projectId` — the production
   stance's default adopted: take the build-time editor identity by default,
   guarding against version-mismatch upgrade side effects) > the typed error
   `vua.release_handoff.editor_unresolved` (whose diagnosis reuses the
   `environment.verifyEditor` semantics, never a new vocabulary).

## Method face

| Method | Kind | Semantics | Consumer |
| --- | --- | --- | --- |
| `release.openForHandoff` | Command (tasked) | Requests opening/focusing the target Unity editor on the target project by the verified editor identity, so the official SDK upload panel becomes ready; after acceptance, poll the task face by taskId — the succeeded snapshot's result carries the handoff fact document | Release page Build Record row "handoff" primary action (desktop slice awaits this freeze batch) |

Params closed single key: `buildId` (`minLength 1`; keyed to the frozen
build-record v0.3 face, the same identity family as `record.get`);
`additionalProperties: false` — out-of-vocabulary params answer a
`vua.release_handoff.invalid_params` validation error envelope (a shape
violation never masquerades as an absence).

## The handoff fact document (the succeeded snapshot's result)

- Closed five keys: `schemaVersion` (const `"0.1"` = the family-owned
  constant `RELEASE_HANDOFF_SCHEMA_VERSION`, never another family's version),
  `buildId` (direction b's receipt shape folded in: the SDK-side cross-check
  anchor), `projectId` (project identity resolved from the build record —
  never a filesystem path), `editor` (`exePath`/`version` editor identity
  facts, the frozen editor-verify v0.1 fact family — identity, not storage
  paths), `occurredAt` (RFC 3339, the VUA-side terminal instant);
- `additionalProperties: false` — **no upload-status field**: the upload
  completes in the official SDK and is never a VUA fact to guess at (guarded
  by the negative vector
  `invalid-release-open-for-handoff-upload-state.fact.json`);
- storedPath discipline (authority anchor 6): artifact physical paths never
  enter the handoff fact.

## Error-code closed set and absence semantics

Closed four codes (the `vua.release_handoff.*` family):

| Code | Category | Semantics |
| --- | --- | --- |
| `vua.release_handoff.unavailable` | unavailable | The route / the production-domain process-window port is unwired = **honest absence** — never folded into a fabricated acceptance, a fabricated task snapshot, or a fabricated handoff fact |
| `vua.release_handoff.invalid_params` | validation | Params closed-set violation (a shape violation never masquerades as an absence) |
| `vua.release_handoff.build_unknown` | validation | The buildId has no corresponding build record (checked at acceptance time) |
| `vua.release_handoff.editor_unresolved` | dependency | Editor identity failed to resolve (diagnosis reuses the environment.verifyEditor semantics) |

Task-run failures (a handshake timeout and the like) travel the ordinary task
nine-state semantics, not this set. At this time the implementation domain is
unwired: the route answers the honest absence `unavailable` (the wire test
pins that the absence never carries a task/acceptance shape); once the
desktop/production implementation slices land, the absence path collapses to
the exceptional path.

## Real-machine precondition and verification boundary

The freeze batch sets **no new real-machine precondition** (production stance
4): every stance cites in-repo code or real-machine evidence already on
record; the process-face launch + handshake-wait implementation tests go
local-first per ruling 15 with the evidence reusable at W25; the end-to-end
claim awaits the W25 real-machine window (O-2) — this batch claims zero
end-to-end verification.

## Dependency direction

```text
React View (Release page Build Record row "handoff" action, desktop slice
  awaits this freeze batch)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (release.openForHandoff row)
  → provider-host route (core domain, wired this batch = honest absence)
  → production-domain process/window port (production domain, later slice)
  → core use case (handoff task orchestration + handshake completion
    judgment, later slice)
```

## Machine-readable vocabulary

`schemas/release-handoff/v0.1/`:
`methods/release-open-for-handoff.schema.json` + `examples/` (3 positive —
the request's closed single key / the accepted receipt / the handoff fact;
3 negative — a params closed-set violation (project-identity fields stay out
of params) / a handoff fact carrying an upload state (honesty rules 1/2
pinned by shape) / an out-of-set error code (upload-class error codes never
enter this vocabulary)). Consumer tests in two carriers:
`crates/provider-host/tests/release_handoff_wire.rs` (real frame loop: the
absence-code triple assertion + the absence never fabricating an acceptance
shape + four params violations) + `packages/contracts/src/
application-contract.test.ts` (TS guard closed-set positive/negative cases +
the fact runtime guard + the error-code closed-set table) +
`packages/orchestrator-provider/src/mock-provider.test.ts` (the mock
absence branch shaped identically to the real route). Vocabulary or field
changes must bump the version, never rewrite in place.

## Open items

- The production-domain process/window port + the core use case (handoff
  task orchestration, handshake completion judgment, build_record/editor
  identity resolution wiring): a later slice; the production collaboration
  face is on call (ruling 15 local-first);
- The desktop Release-page consumption slice (the Build Record row "handoff"
  primary action + the "handed off" fact + the upload_readiness evidence
  summary + the honest "final upload completes in the official SDK"
  statement): awaits this freeze batch's acceptance into main + the TS face
  (landed with this batch);
- The end-to-end real-machine walkthrough: belongs to the W25 real-machine
  window (O-2 awaits the user opening it), evidence requirements not
  relaxed.
