# Supervised Provider Process Protocol v0.1

[English](provider-process-v0.1_EN.md) | [简体中文](provider-process-v0.1_ZH.md)

> Status: B2 implementation baseline  
> Owner: Electron Kernel and Orchestrator Provider adapters  
> Updated: 2026-09-02  
> Frame version: `0.1`

## Boundary and artifact

The production hosting shape is an independent Rust executable supervised by Electron Main:
`vua-orchestrator-provider.exe`. Renderer code cannot start or access it directly. Its only startup argument is
`--database <absolute path>`; no shell is used, the working directory is the executable directory, and only
`SystemRoot/WINDIR/TEMP/TMP` are inherited. The development build validates a single-EXE artifact shape. B10/M10
performs release signing, exact dependency inventory, and installer pinning with the release certificate; B2 does
not claim that a development binary is signed.

On Windows the Provider joins itself to a Job Object with `KILL_ON_JOB_CLOSE`, so future descendants are collected
after an abnormal Provider exit. An adjacent `.provider.lock` holds an exclusive operating-system file lock for one
database. A second Provider must fail startup rather than create two authoritative writers. The lock file may remain;
authority comes from the live file lock, not file existence.

## Transport and handshake

stdin/stdout carries UTF-8 JSON Lines with a one-MiB maximum per frame. stdout is protocol-only and diagnostics use
stderr; the supervisor retains at most 64 KiB of stderr. Both sides frame `frameVersion: "0.1"`, a nonempty
`frameId`, `kind`, and `payload`. Requests and responses share a frame ID; events have independent IDs. Unknown or
invalid frames are explicitly rejected.

After spawn, the supervisor completes `handshake`, verifies Application Contract `0.1` and supported versions, and
only then admits calls. Request and event payloads follow
[Application Contract v0.1](application-contract-v0.1_EN.md) without exposing private Rust types. Unexpected exit
moves the Provider to `failed` and rejects pending calls. Restart is explicit at the higher layer; there is no
unbounded automatic restart loop.

## Recovery and shutdown

Every start creates a new `providerInstanceId`. Active project leases owned by an older instance are marked
`recovery_required` and are never taken over by elapsed time. Nonterminal tasks retain their last truthful state and
report `inspect_required`.

Shutdown proceeds as follows:

1. The supervisor closes admission and sends `prepare_shutdown` with a positive integer `timeoutMs`.
2. The Provider waits within that bound for project-mutation leases owned by its instance to clear. With no blocker,
   it checkpoints, replies `safe_to_stop`, and exits.
3. At timeout it replies `needs_user_choice` with each blocking task's `taskId/revision/state` and stays alive.
4. Waiting repeats the check with a new timeout. Force requires a nonempty `userDecisionId`.
5. Force first marks current-instance leases as requiring recovery, replies `forced` with affected tasks, then
   checkpoints and exits.

Force therefore never presents unknown project state as success, failure, or immediately retryable work. A later
mutation must Inspect first and explicitly take over at a higher generation.
