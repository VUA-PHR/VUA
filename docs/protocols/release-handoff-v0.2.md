# release-handoff protocol v0.2 (official-SDK handoff + independent inspection entry: the U19 admission-gate batch)


> Document version: 0.2
> Status: **Frozen (U19 handoff admission gate + independent inspection
> entry)** (2026-09-21, core-domain version bump batch: the user ruling U19
> is the normative source, recorded verbatim in the BOARD U19 row)
> Machine-readable vocabulary: `schemas/release-handoff/v0.2/` (two method
> schemas + 5 valid + 6 invalid vectors; frame-loop wire tests
> `crates/provider-host/tests/release_handoff_wire.rs`, 20 cases —
> including every status enum value driven through the real loop)
> Scope: `release.openForHandoff` (the v0.1 row bumped: the admission
> sequence gains the record-state gate) + the family's new
> `release.openForInspection` (the independent "open in Unity to
> inspect/fix" entry)
> Ownership boundary: unchanged from v0.1 — the handoff/inspection
> implementation domain = the process/window face (production-domain port)
> + the core use case (core domain); this batch changes ZERO port/trait
> shapes (both entries reuse the same `ReleaseHandoffPort` mechanics; the
> operation semantics live in the route), unity-bridge gains zero
> operations
> Updated: 2026-09-21 (v0.2 bump batch: the U19 state whitelist gate + two
> typed rejection codes + the independent inspection entry + the error
> envelope params face; the v0.1 vocabulary/vectors stay byte-frozen, see
> git history)

## Normative source (user ruling U19, 2026-09-21)

The user ruling **adopts option 3, scoped to the production-result handoff
admission**; the full text is recorded verbatim in the BOARD U19 row. Its
points and where this protocol lands them:

1. **Opening the project to troubleshoot must never be forbidden** — keep
   the explicit independent "open in Unity to inspect/fix" path (opening
   the editor is neither recovery-execution nor upload permission) → the
   new method `release.openForInspection`, NOT gated by the record state
   (see "The inspection entry").
2. **The state whitelist (normative table; the words ARE the build-record
   v0.3 status enum words)**:
   - `succeeded`, `succeeded_with_warnings` → **pass**, preserving the
     warning presentation (presentation is the desktop face's job; the
     backend never rewrites the record nor hides the warning);
   - `failed`, `cancelled`, `rolled_back` → **block**, offering the
     diagnostic / recovery / re-production entry (`record_state_blocked`,
     carrying the `state` param = the record's original state value);
   - `recovered` → **block**, inspection and the subsequent production
     flow must complete first (same code, same param);
   - missing, unknown state → **reject**, explaining the record cannot be
     confirmed (`record_state_unknown`).
3. **Three correction rationales on record**: (a) this is a product-policy
   choice, not just objective fact validation — the state is the fact,
   "which states may hand off" is the policy (hence the blocked class's
   category is permission, not validation); (b) `recovered` is not the
   task-face `inspect_required` — the build-record Schema already contains
   `recovered`, the two state sets are never mixed, and completing an
   inspection never rewrites a failed history record to success (this
   protocol and its implementation have zero state-rewrite surface);
   (c) a succeeded record does not guarantee the project still matches it
   — this gate prevents obviously wrong handoffs and **never claims to
   remove the whole "upload the wrong avatar" risk** (this protocol makes
   no such claim).
4. **Implementation requirements (same-batch delivery)**:
   backend-authoritative judgment (the gate sits in the provider_host
   admission sequence, never in a UI) + typed rejection reasons (the two
   new codes) + four-language explanations (the two messageKeys
   `errors.releaseHandoff.stateBlocked` / `errors.releaseHandoff.
   stateUnknown`; the four-language wording belongs to the desktop seat's
   parallel batch) + direct-call tests bypassing the UI (the wire tests'
   full state coverage) + full state coverage (aligned against the actual
   build-record v0.3 Schema enum, including the missing state).

## Method face

| Method | Kind | Semantics | State gate |
| --- | --- | --- | --- |
| `release.openForHandoff` | Command (tasked) | The official-SDK upload handoff: opens/focuses the target project with the verified editor identity so the official SDK upload panel is ready; completion = Bridge handshake arrival (v0.1 ruling 3 unchanged) | **Yes** (new in this batch, next section) |
| `release.openForInspection` | Command (tasked) | The independent "open in Unity to inspect/fix": same mechanics (open/focus + handshake wait); the completion fact carries the explicit `operation` wording and **never reads as a handoff completion** | **None** (never state-gated) |

Both methods share the single-key params closed set `buildId`
(`minLength 1`; the frozen build-record v0.3 face, the same identity family
as `record.get`); `additionalProperties: false` — an out-of-set param is a
`vua.release_handoff.invalid_params` validation envelope.

## The handoff admission sequence (v0.2, backend-authoritative)

The `release.openForHandoff` admission order (ordering preserved; the gate
sits after record existence, before identity resolution):

```text
params closed set → invalid_params (validation)
unwired faces (use case / task runtime / production port) → unavailable (honest absence)
record read failure → unavailable (existence undeterminable, retryable, never "unknown")
buildId with no record → build_unknown (validation)
★ record-state gate (new; product policy, decided backend-side):
    succeeded / succeeded_with_warnings → pass
    failed / cancelled / rolled_back / recovered
        → record_state_blocked (permission, params.state = verbatim original value)
    status missing / non-string / out-of-enum → record_state_unknown (validation)
missing project identity / editor resolution failure → editor_unresolved (dependency)
all passed → task acceptance (the nine states carry only the long-running part)
```

The decision surface lives in the core use-case classification function
(`classify_handoff_record_state`, unit-tested over the whole enum) and
executes in the provider_host admission sequence — **no UI takes part in
the pass/block decision**; the desktop only consumes the typed rejection
wording (the `state` param carries the record's original value; the
diagnostic / recovery / re-production entry wording belongs to the
desktop's four-language tables). A blocked record accepts NO task (zero
task-store writes, the port is never reached — pinned case by case in the
wire tests).

## The inspection entry (`release.openForInspection`)

- **Never gated by the record state**: any record state (blocked, missing,
  or out-of-enum words included) may open for inspection — opening the
  editor is neither recovery-execution nor upload permission (U19 1);
- Admission validates exactly: the params closed set, the record existence
  (`build_unknown` still answered), and the editor resolution
  (`editor_unresolved` still answered) — i.e. the handoff admission MINUS
  the state gate;
- **Completion-fact wording**: the inspection fact document's six-key
  closed set = the handoff fact's five keys + the explicit `operation` key
  (const `"release.openForInspection"`) — the wording is pinned by shape,
  and no consumer may present an inspection completion as a "handoff
  completion" (the negative vector guards it: a fact carrying the handoff
  operation wording is invalid against the inspection def);
- Same tasked shape as the handoff (acceptance → taskId polling → the
  succeeded snapshot's result carries the inspection fact); the mechanism
  port is the reused `ReleaseHandoffPort` (zero trait-shape change; the
  operation semantics live in the route — the port only knows "open the
  editor + wait for the handshake", not handoff-vs-inspection).

## Error-code closed set and absence semantics

The six-code closed set (the `vua.release_handoff.*` family, v0.2; the
handoff route may answer all six, the inspection route only four — the two
state codes are deliberately absent there):

| Code | Category | Semantics |
| --- | --- | --- |
| `vua.release_handoff.unavailable` | unavailable | the route / production port is unwired = honest absence (v0.1 semantics unchanged) |
| `vua.release_handoff.invalid_params` | validation | params closed-set violation |
| `vua.release_handoff.build_unknown` | validation | the buildId has no corresponding build record (admission-time validation) |
| `vua.release_handoff.record_state_blocked` | **permission** | the record's status sits outside the handoff whitelist (failed/cancelled/rolled_back/recovered) — a **policy block**; `params.state` carries the record's original value verbatim; messageKey = `errors.releaseHandoff.stateBlocked` |
| `vua.release_handoff.record_state_unknown` | validation | status missing / non-string / out-of-enum — the record cannot be confirmed; messageKey = `errors.releaseHandoff.stateUnknown` |
| `vua.release_handoff.editor_unresolved` | dependency | editor identity resolution failed (v0.1 ruling 5 semantics unchanged) |

Error-envelope params face (the ORC-ERR-001 shape): the `params` object
appears **only when non-empty** (every pre-existing code keeps its exact
wire shape byte for byte); `record_state_blocked` is the first
admission-time emitter with params. Task-runtime failures (handshake
timeout and the like) still travel the task nine states, not this set.

## Fact documents (the succeeded snapshot's result)

- **Handoff fact** (`release.openForHandoff`): the frozen five-key closed
  set unchanged (schemaVersion bumped to `"0.2"` / buildId / projectId /
  editor{exePath, version} / occurredAt), `additionalProperties: false`
  with no upload-status field — every v0.1 honesty shape holds;
- **Inspection fact** (`release.openForInspection`): the six-key closed
  set = the five keys + `operation` (const inspection wording) — an
  inspection completion is never misread as a handoff completion; equally
  without an upload-status field.

## Machine-readable vocabulary and consumer tests

`schemas/release-handoff/v0.2/`: `methods/release-open-for-handoff.
schema.json` + `methods/release-open-for-inspection.schema.json` +
`examples/` (valid 5 — both methods' request / both methods' accepted /
the inspection fact; plus the blocked-params valid example; invalid 6 —
the params closed-set violation / the handoff fact carrying an upload
state / an out-of-set error code / blocked params missing the state / the
inspection fact carrying an upload state / the inspection fact carrying
the handoff operation wording). Consumer tests =
`crates/provider-host/tests/release_handoff_wire.rs`, 20 cases (real
frame-loop wiring, bypassing any UI): every status enum value driven
through the real loop (six states + missing + non-string + out-of-enum +
empty), the blocked triple assertion (code + category + params.state
verbatim), blocked records accept no task and never reach the port, the
admission-order pin (existence → state gate → identity resolution), the
inspection entry ungated over every state + the wording pin + its three
validations intact. The v0.1 family documents stay byte-frozen (the
historical frozen face) with their compile pin kept.

## Verification boundary (honesty discipline)

Zero end-to-end claims in this batch: all evidence is fake-port /
temp-store frame-loop evidence (ruling 15 local-first); the real machine
(real records → real launch → handshake → fact reflux, the blocked-state
desktop presentation chain) belongs to the W25 real-machine window (O-2)
with no relaxed evidence requirements.

## Dependency direction

Same as v0.1 (React View → Gateway → Electron adapters → application
contract → provider-host route → core use case → `ReleaseHandoffPort` →
`EditorHandoffAdapter` → production-domain mechanism primitives); the gate
and the inspection split both live inside the provider-host route
admission sequence — the dependency direction is unchanged. The desktop TS
contract face (the row bumped to 0.2 + the `release.openForInspection`
method face + the two four-language keys + the independent-open entry
confirmation) belongs to the desktop seat's parallel batch (the next ring
of the pipeline).

## Open items

- The desktop consumer batch (TS face + the four-language tables + the
  Release page's independent-open entry confirmation): the desktop seat,
  wt-3, next ring of the pipeline;
- The end-to-end real-machine walkthrough (both entries' real-machine
  split and the blocked-state presentation chain): W25 (O-2), zero
  end-to-end claims.
