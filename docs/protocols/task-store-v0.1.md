# Orchestrator Task Store Format v0.1


> Document version: 0.1
> Status: Frozen (M2, 2026-09-04) — SQLite authoritative task state
> Owner: Orchestrator persistence adapter
> Updated: 2026-09-02
> Format version: `0.1`

## Boundary

SQLite is authoritative for tasks, task revisions, cancellation intent, terminal results, task events, and command
idempotency results. Database rows are not Gateway DTOs. A Provider maps them explicitly to
[Application Contract v0.1](application-contract-v0.1.md).

The old JSONL journal and StateFile were migration-stage implementations with no real users. They are not imported
into format `0.1` and create no compatibility commitment. Tests restate retained behavior; a first launch creates an
empty database.

## Machine format and migration

The executable initial migration is `schemas/orchestrator-task-store/v0.1/001_initial.sql`.
`vua_metadata.format_version` is the string `0.1`. SQLite `user_version = 1` is only an internal migration sequence,
not a product or protocol version. The implementation refuses a migration sequence above its supported range and a
missing or unknown format version instead of guessing writes.

| Table | Authoritative content |
| --- | --- |
| `tasks` | Current state, revision, cancellation intent, error, result, and timestamps |
| `task_events` | Replayable event facts committed with task state |
| `command_idempotency` | `commandId`, request fingerprint, stable task identity, and existing response |
| `project_lease_generations` | A never-decreasing fencing generation for each project |
| `project_mutation_leases` | Current mutation owner, task, heartbeat, and recovery/Inspect evidence |
| `vua_metadata` | Independent persistence format version |

## Transactions and events

- Acceptance succeeds only after `tasks` and `task_events` commit in one transaction.
- State, progress, cancellation, and completion compare the expected revision and write the next revision.
- A task-row update and its event insertion succeed or fail together; subscribers are notified only after commit.
- `(task_id, revision)` is unique for task events. A consumer that observes a gap reloads an authoritative snapshot.
- The same `commandId` and request fingerprint replay the existing result; reuse with a different fingerprint is an
  explicit conflict.
- Terminal state and existing cancellation intent win over late or duplicate commands without another side effect.

## Durability and files

The production database uses `rusqlite 0.40.1` with bundled SQLite, `journal_mode=WAL`, `synchronous=FULL`, foreign
keys, and a five-second busy timeout. Once VUA confirms a transaction, the durability target includes process crash
and power loss. Under WAL, the database and its colocated `-wal` and `-shm` files together form active state; copying
only the main file while the store is live is invalid. Clean shutdown may run a truncating checkpoint. B9 separately
freezes backup, corruption recovery, and downgrade drills.

## Restart recovery

Terminal tasks reopen unchanged. A nonterminal task left by a restart keeps its last truthful state and maps
`recoveryDisposition: "inspect_required"` into the application contract. The runtime never silently resumes it,
pauses it, or declares failure. A later recovery use case must Inspect the external project before offering continue
or rollback.

A project mutation lease never releases merely because its heartbeat is old. Provider interruption marks the lease
as requiring recovery. Only a recovery action with an explicit `inspection_id` may take it over at a higher
generation. The old holder's heartbeat and release are rejected by the generation fence. `project_identity` is a
`sha256:<64 lowercase hexadecimal digits>` digest of the operating-system-resolved final path of an existing project
directory. The database and lease value object retain only the digest, never the clear path. Different relative
spellings of the same path therefore share one identity. Moving a directory creates a new identity and requires a
fresh Inspect; the implementation does not guess equivalence with the old path.

Format `0.1` tests transaction atomicity, illegal transitions, revision conflicts, progress revision after restart,
durable cancellation, idempotent replay, unknown tasks, terminal priority, WAL/FULL configuration, normalized-path
digests, and fenced lease takeover after Inspect. Provider hosting and shutdown are defined by the
[Supervised Provider Process Protocol v0.1](provider-process-v0.1.md).
