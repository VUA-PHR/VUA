# Orchestrator Migration Asset Record

> Status: B0 migration inventory complete; later slices are not yet formal implementations
> Legacy source: `GLM/orchestrator` and its early vertical slices
> Current owner: `crates/orchestrator`
> Updated: 2026-09-02
> Authority: migration work record; product semantics remain owned by the product boundary, accepted architecture, and versioned protocols

This record distinguishes existing behavior that passes tests from a product implementation that has been finalized. The
current Rust crate is an executable and testable migration baseline, but it is not the formal Gateway, Provider, SQLite
persistence layer, or complete production vertical slice. Passing tests proves that legacy behavior is characterized; it
does not automatically grant that behavior contract authority, module ownership, or release compatibility.

## Rulings for this inventory

- `schemas/orchestrator/envelope-v1`, the matching Rust types, and fixtures remain as a **B1 contract candidate**. B1
  may revise the wire shape with an explicit change record and must decouple Gateway DTOs, Rust-private types, and the
  transitional journal;
- Recipe v0.2 has reproduced a production result on one project, so its behavior remains useful research evidence.
  There are no actual users, and the single sample risks encoding incidental project structure as a general model.
  Recipe v0.2 stops growing; B5 uses more complex synthetic projects to produce Recipe v0.3;
- Recipe v0.3 retires the complete v0.2 file format, reader, and share code when it is finalized; no v0.2-to-v0.3
  migrator is built. Format fields use `formatVersion: "0.2"` / `"0.3"`; the test share prefix is `vuar0.2.`, and
  the old `vuar2.` prefix is explicitly rejected;
- the JSONL journal and StateFile are transitional persistence. Their recovery semantics can migrate, but their file
  formats do not become the formal SQLite schema or Gateway contract;
- the Orchestrator Bridge adapter is only a first-migration reference implementation. Unity Bridge B0 closure is not
  rejected because this adapter or the Orchestrator prototype fails.

## Asset classification

| Asset group | Current evidence | Behavior to preserve | Explicitly excluded from the formal implementation | Owning later slice |
| --- | --- | --- | --- | --- |
| `contracts.rs`, `schemas/orchestrator/envelope-v1` | Rust/schema fixture tests | Stable error codes, localization keys and params, separate recoverable/retryable flags, correlation IDs, task revisions, rejection of unknown enums | Treating existing fields as frozen; one serialized type serving simultaneously as Gateway DTO, Rust application type, and persistence record | B1 |
| `runtime.rs` | Transition, cancellation, timeout, event, and recovery tests | Persist before reporting acceptance, terminal-state finality, cancellation request distinct from cancellation result, safe-boundary cancellation, monotonic per-task revision, no success event after persistence failure | One OS thread per task, in-process subscribers, the in-memory map, global JSONL sequence, and current lock granularity as product invariants | B2 |
| `journal.rs` | Complete, interrupted, corrupt, and unknown-version replay tests | Never guess across an unknown version, retain corrupt evidence, distinguish terminal tasks from interrupted tasks needing inspection, preserve stable task identity across recovery | JSONL as authoritative state, line/fsync layout, and journal payload as the external event format | B2 SQLite migration tests |
| `state_file.rs` | Atomic replacement, corrupt archive, and unknown-version tests | Atomic replacement for small non-authoritative files and retention of corrupt originals | Authoritative tasks, Recipes, Build Records, projects, or adapter state in StateFile; Orchestrator ownership of frontend window/tutorial state | B2; non-authoritative settings remain with their owner |
| `capability.rs` | Ready/unavailable aggregation tests | Capabilities originate in real adapters, missing reasons are structured, output order is stable, unavailable actions never pretend to be executable | Promoting current string names and two-state model directly to Gateway v1; Renderer inference from error prose | B1/B6 |
| `process.rs`, `time.rs` | No-shell arguments, timeout, output bound, credential stripping, and deterministic tests | Argument arrays, allowlists, timeouts, bounded output, structured exit results, replaceable clocks and IDs, wall-clock-independent tests | Treating parent-process termination as complete Windows lifecycle control; treating the current removed-variable list as a complete security policy | B2/B6 |
| `bridge.rs` and Bridge types in `model.rs` | Bridge v1 fixtures, job-directory, and process-invocation tests | Schema-driven commands/results, controlled `.vua` paths, atomic requests, fixed arguments, timeout, and distinct missing/invalid results | Rust types becoming a separate wire format; the adapter deciding product support; string object hints replacing GUID/`GlobalObjectId` | B3 under Unity Bridge v1 |
| `filesystem.rs` | Traversal, manifest, tamper, and rollback tests | Verified pre-mutation snapshots, bounded scopes, manifests and digests, verification before restore, restoration of absent scopes | Unmanifested whole-directory copy prototype; treating snapshot existence as recoverability; undefined retention and cleanup | B2/B3 |
| `workflow.rs` | Early workflow characterization | Inspect/Plan/Confirm/Snapshot/Execute/Validate/Recover order, stage gates, command/result correlation, recovery after rejection | Shipping this in-memory state machine beside `assembly.rs` as a second formal use case; human labels as stable protocol values | Extract in B3, then remove duplicate implementation |
| `assembly.rs` | Synthetic Avatar/outfit, drift, rollback, idempotency, and task-event tests | Confirmation bound to plan content, pre-execution fingerprint check, pre-mutation snapshot, Bridge result validation, failure recovery, separate rollback-failure reporting, idempotent replay | `.done.json` as a Build Record; `label`/`nameHint` as precise Unity binding; the present single-project step set as complete AMF | B3/B5 |
| `recipe/`, `schemas/recipe/v0.2` | One-project reproduction, schemas, fixtures, validation, and share-code tests | Research behavior for identity/reference/cycle/capability/lock validation, Recipe/Local Resolution separation, and deterministic digest | Extending or retaining compatibility with v0.2 files; treating single-project fields as a general production model; putting machine-local resolution into shareable Recipe data | B5: complex-fixture-driven v0.3; remove the full v0.2 format implementation after finalization |
| `vpm.rs` | Read-only plan, confirmation, drift, snapshot, validation, rollback, and idempotency tests | Joint dependency plans, confirmation binding, drift checks, post-success domain verification, honest offline capability | Vendor/CLI structures in domain or Gateway types; process success treated as installation success | B3/B6 |
| `vpm_backend.rs`, `provision.rs` | Synthetic `vrc-get` library and VCC CLI tests | Shared project capability port, `vrc-get` resolution/application experience, argument validation, credential stripping, replaceable test backend | VCC CLI project creation as the VUA default; confusing ALCOM/VCC compatibility with ownership of VUA use cases | B6: VUA `vrc-get` primary path and ALCOM/VCC capability adapters |
| `environment.rs` | Synthetic root, network/disk/version, and read-only tests | Targeted capability detection, distinction between absence and probe failure, no writes during inspection, injectable roots, stable check IDs | Final player prose from the backend; current thresholds/directories as product promises before B6; broad user-disk scanning | B6 |
| `tools.rs` | Synthetic tool-discovery tests | Allowlisting, targeted detection, absence as a normal result, publisher and entry-point evidence | Enabling face/motion tracking or optimizer runtime integrations before `1.0.0`; legacy tool registry as plugin or execution authority | Separate post-`1.0.0` plan |
| Flat exports from `lib.rs` | Whole-crate compilation and tests | Replaceable ports and pure rules can be extracted | Direct Gateway consumption of the flat Rust API; current file layout treated as the accepted layering | Organize domain/application/ports/adapters/bootstrap from B1 onward |

## Transitional persistence debt

The following items must close in B2 and must not be expanded as the foundation of new features:

1. the JSONL journal carries command acceptance, state, cancellation, terminal results, and recovery without a SQLite
   transaction boundary;
2. authoritative task state is split between memory and replay output, without database revision/CAS, leases, or
   cross-process ownership;
3. event publication relies on local “journal first” ordering rather than one SQLite transaction plus a proven
   post-commit outbox/publication boundary;
4. interrupted tasks can only become `needs_inspect`; persisted intent, external-effect result, recovery point, and
   adapter execution state are absent;
5. StateFile archives corrupt or foreign versions and falls back to defaults. That policy is unsuitable for authoritative
   production data; SQLite corruption, migration failure, backup, and manual recovery need separate semantics;
6. current concurrency uses in-process locks and worker threads, without per-Unity-project mutation exclusion, complete
   Windows process-tree supervision, or Provider-restart takeover proof;
7. `.vua/assembly/*.done.json` is only an idempotency marker, without a formal Build Record, transaction relation, or
   retention policy;
8. shared types couple journal entries, task events, and candidate Gateway envelopes, preventing independent evolution
   of database schema, domain state, and external DTOs.

## Extraction order

1. **B1:** use the tested semantics as input to an independent application contract, Provider interface, and mock
   adapter; do not publish Rust types directly;
2. **B2:** establish storage-independent feature tests for the recovery semantics, implement authoritative SQLite state,
   then remove JSONL as the authority path;
3. **B3:** extract the first formal Orchestrator–Unity use case from `assembly.rs`, `workflow.rs`, snapshots, and the
   Bridge adapter;
4. **B5:** validate the model with multi-project, multi-asset, and complex-relation synthetic fixtures, then define
   Recipe v0.3 and retire v0.2 without a compatibility reader or migrator;
5. **B6 and later:** rebuild project/environment adapters; runtime tool implementation continues to wait for the
   post-`1.0.0` plan.

## B0 verification

- `cargo test --locked -p vua-orchestrator`: passed; 138 tests passed and three manual tests were ignored by design;
- `cargo fmt --all -- --check` and
  `cargo clippy --locked -p vua-orchestrator --all-targets -- -D warnings`: passed;
- ignored tests depend respectively on the real machine environment, real tool installation, and local
  `vrc-get`/network access and remain manual acceptance checks;
- the only warnings were Rust forwarding localized MSVC linker status messages; there was no compilation or test
  failure;
- Unity 2022.3.22f1 EditMode, idempotent assembly, and Batchmode `inspect_project` evidence is recorded in
  `docs/migration/asset-ledger.md` and remains independent of whether this Orchestrator prototype passes.

## B0 completion meaning

This record closes the B0 backend inventory; it does not claim that B1 through B6 are implemented. B1 must not place
items listed as explicitly excluded into the Gateway or Provider contract. When a real production scenario exposes a
new product-semantic ambiguity, the alternatives and their consequences are documented before a recommendation is made
under the product definition and submitted for a ruling.
