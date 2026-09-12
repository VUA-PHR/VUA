# editor-verify Protocol v0.1 (user-picked editor path verification vocabulary row: environment.verifyEditor)

[English](editor-verify-v0.1_EN.md) | [简体中文](editor-verify-v0.1_ZH.md)

> Document version: 0.1
> Status: **FROZEN (U10 user-picked editor path verification vocabulary
> row)** (2026-09-13, fixed by the proposal 021 seven-point core ruling;
> freeze close-out itemized below)
> Machine-readable vocabulary: `schemas/editor-verify/v0.1/` (single-method
> Schema + 3 positive pairs + 3 negative vectors; environment-side anchor
> tests `crates/project-manager/tests/editor_verify_wire.rs`; frame-loop
> wire tests `crates/provider-host/tests/editor_verify_wire.rs`)
> Scope: `environment.verifyEditor` (parameterized read-only verification:
> a user-picked path in any of three layouts → identity / version /
> classification or a closed refusal code)
> Ownership boundary: the detection-domain fact primitive lives in
> `crates/project-manager` (environment domain); the environment-managers
> v0.1 detection snapshot (Hub enumeration) is untouched — this vocabulary
> row is the verification face of the manual-pick remediation path; it
> never mutates the snapshot and never predicts the selection outcome;
> the classification authority is the core `editor_targets` classifier
> (single classification authority, reused not copied)
> Updated: 2026-09-13 (v0.1 freeze batch: bilingual protocol document +
> REGISTRY registration + exemption-row removal request)

## Name mapping (row name vs family name, disambiguation)

The row name `environment.verifyEditor` faces consumer semantics — same
`environment.*` detection-domain fact family as `environment.getSnapshot`
(ruling point 1: implementation details never leak into the protocol
face). The directory / protocol-document family name `editor-verify`
anchors the implementation primitive (`crates/project-manager/src/
editor_verify.rs`) and the refusal-code family `vua.editor_verify.*`.
The two names each do their own job; the refusal-code family keeps
primitive traceability, not the row name.

## Freeze close-out (proposal 021 ruling sequence, itemized)

- **(1) Detection-domain primitive**: editor_verify v0.1 (3eef4e4) —
  identity established from the executable's own PE version resource
  (gate 1: never trust the path name) + core classifier produces
  classification and guidance code (gate 2: an off-target verdict is
  never silently used) + three-layout input normalization + the closed
  five-code refusal set;
- **(2) Vocabulary-row ruling**: the seven-point core ruling (proposal
  021 inline thread, 2026-09-13) fixed the row name / kind / params /
  result / absence code / vectors / sequencing — the row shape is frozen
  from that point;
- **(3) Draft face**: the method Schema + positive 3 / negative 3 vectors
  + the environment-side anchor consumer tests 8/8 (38af48c, accepted
  into main via 71c65d4; the SCHEMA_EXEMPT draft-exemption row ratified
  in the same batch);
- **(4) Core routing batch**: the provider-host route wiring + the
  `EDITOR_VERIFY_SCHEMA_VERSION` core-owned constant + the three
  implementation nails mapping + frame-loop consumer tests (deafe11 +
  adoption bbb6206 + hardening 373470c, accepted into main via a6585c2;
  capabilities declares `environment.verifyEditor = available`);
- **(5) Bilingual protocol document + REGISTRY row + exemption-removal
  request**: lands with this freeze batch (the `scripts/collab-brief.mjs`
  SCHEMA_EXEMPT `'editor-verify'` row is requested removed by the
  integration role at this batch's acceptance, dffb1e3 precedent; after
  removal the reverse blind-spot check is held by this registry row).

## Freeze scope and division of labor

This protocol freezes the **method vocabulary, the params closed set,
the field faces and the result shapes**. Error channels, request
correlation and the transport envelope belong to the versioned
application contract. The desktop TS face registration (`@vua/contracts`
vocabulary row + union + guards + positive/negative example tests) and
the settings-surface implementation (the "Browse" entry + in-place
verification-result rendering + gate-3 trust presentation + first-use
confirmation + choice provenance) belong to the desktop U10 settings
slice — the core routing batch is accepted, so the desktop start
condition is ready (proposal 021 sequencing: after the routing batch);
until it lands no end-to-end claim is made; real-machine walkthrough
belongs to the W25 real-machine window with evidence requirements not
relaxed. Gate 3 ("one confirmation before first actual use") is the
execution-release layer, decoupled from this verification face
(integration ruling: auto-selection handles resolve + present, gate-3
confirmation handles release, the confirmation counts once per choice).

## Method face

| Method | Semantics | Consumer |
| --- | --- | --- |
| `environment.verifyEditor` | Verifies one user-picked Unity editor path: reads the executable's own version resource to establish identity (gate 1), parses the version and hands it to the core classifier for classification and compatibility-policy guidance code (gate 2); the result is a two-state tagged union discriminated by `verdict`, envelope `schemaVersion` = this row's version `"0.1"` | Settings surface "Environment & Paths" manual-pick entry |

Honest absence discipline: route-not-wired / primitive-unreachable =
the typed absence code `vua.environment.verify_unavailable` (reserved
semantics — this route is a stateless direct call, always wired, with
no absence path today; consumer tests pin that it never appears as a
verification refusal); a verification refusal is the in-result `refused`
normal finding state (closed `vua.editor_verify.*` five-code set) and
never surfaces as an application error envelope — a refusal is a
finding, not a failure.

## params and semantics

- Closed single-key params: `path` (`minLength 1`; **deliberately no
  maxLength** — a user-supplied filesystem path is verbatim carry and
  the write side invents no exclusive bound);
- The three accepted input layouts (the executable itself / the
  versioned Hub root / the Editor directory) are normalized by the
  primitive; the wire and desktop layers do zero processing and zero
  normalization guessing;
- `additionalProperties: false` — out-of-vocabulary params answer the
  `vua.environment.invalid_params` validation error envelope (a shape
  violation never impersonates a verification refusal — a refusal
  requires the primitive to have actually run; the six-violation
  negative assertions are pinned by the core frame-loop consumer tests);
- Three implementation nails: (1) `refused` never surfaces as an
  application error envelope (a normal result state inside an ok
  envelope); (2) `detail` carries the primitive's raw resource text
  verbatim, never re-interpreted; (3) the envelope `schemaVersion` const
  `"0.1"` is the core-owned `EDITOR_VERIFY_SCHEMA_VERSION` constant
  (never a borrowed family version);
- The `classification` four-value closed set and the `guidanceCode`
  pattern (`^vua\.env_managers\.`) are byte-identical to the frozen
  environment-managers v0.1 face (zero invention; diff-check point
  verified at the freeze batch).

## Dependency direction

```text
React View (settings surface "Environment & Paths" section)
  → typed feature/Gateway
  → Electron preload and main-process adapter
  → versioned application contract (environment.verifyEditor vocabulary row)
  → provider-host route (core domain, live)
  → editor_verify primitive (crates/project-manager, environment domain)
  → core classifier editor_targets (single classification authority, reused not copied)
```

## Machine-readable vocabulary

`schemas/editor-verify/v0.1/`: `methods/` (single-method Schema) +
`examples/` (positive 3 pairs — exe-direct 2022.3.22f1 →
production_target / versioned root 2022.3.22f1c1 → other_unity_version
with chinaDistribution true / Editor directory 2019.4.31f1 →
migration_source, one per normalize branch; negative 3 —
`target_missing` / `not_an_editor` [gate-1 counterexample: the
directory name claims 2022.3.22f1 but the identity reads 7.7.7x9] /
`exe_missing`, all three being valid refused result-state vectors, not
schema violations). Consumer tests in two carriers:
`crates/project-manager/tests/editor_verify_wire.rs` (environment-side
anchor: per-vector classification re-derived from the core classifier
with zero drift + three-branch normalize shapes + closed-set /
pattern / absence-code overload negatives) +
`crates/provider-host/tests/editor_verify_wire.rs` (frame-loop real
wiring: the verified mapping checked field-by-field against this
vocabulary Schema via jsonschema validation + nail 1 pinned through the
real system wiring + detail verbatim + request path verbatim carry +
six params violations + absence-code non-reuse + the constant anchor +
the capabilities row). Any vocabulary or field change must bump the
version; in-place rewrites are forbidden.

## Open items

- Desktop U10 settings slice (TS face registration + settings UI +
  gate-3 presentation and provenance): the core routing batch is
  accepted; the desktop batch follows (proposal 021 sequencing);
- Real-machine walkthrough (pick → verify → activate full chain):
  belongs to the W25 real-machine window;
- Source field (`probed`/`user_selected`/`follows_manager`): candidate
  shelved, v0.1 maintained (proposal 021 ruling 2: drafted with a real
  need only when a second real source actually appears).
