# Provider lifecycle stress-test spike notes (BG-6)

> Historical spike, not a deliverable. This explored the former M8 performance/lifecycle work.
> The script and notes have no contract authority and establish no end-to-end acceptance.
> The original exercise was timeboxed to one session and made no product-code changes.

- Work item: BG-6, activated from the idle-work backlog on 2026-09-10 at 01:30.
- Historical executor: wt-2 (Core), 2026-09-10, 03:31–04:00.
- Environment: local Windows, Git Bash, Node 24 and a workspace-built debug
  `vua-orchestrator-provider` executable.

## Script

The script can be rerun with:

```text
cargo build -p vua-provider-host --bin vua-orchestrator-provider
node scripts/spikes/provider-lifecycle/spike.mjs [--rounds 20]
```

Scenario A starts the real Provider with temporary SQLite storage, performs the handshake, then
measures p50/p95/max latency over N `application.getSnapshot` calls.

Scenario B accepts a long-running `task.startDemo` task (idempotency `commandId` at the frame's
 top level), waits for running state, forcibly kills the process with SIGKILL, restarts against the
same database, and observes the interrupted task through `task.list`.

## Recorded local results (2026-09-10, 03:50; debug build)

- Scenario A: cold process start plus handshake took approximately 51 ms. Twenty snapshot calls
  measured p50 approximately 0.26 ms and p95 approximately 0.53 ms. The recorded service-side
  latency supported the feasibility of on-demand overlay polling discussed in proposal 017 §4;
  this was not a complete rendering or real-machine performance benchmark.
- Scenario B: after termination and restart, `task.list` still returned `running` for the demo
  task, reflecting the state left in SQLite.

## Findings and follow-up at the time

1. Recovery presentation gap: nonterminal tasks should require explicit inspection after restart,
   with no implicit resumption. The observed restart cleanup (`mark_other_owners_interrupted`
   and the `prod-` interruption batch) covered production tasks but left nonterminal demo tasks
   unchanged. A dead process's task therefore appeared to be running. Demo tasks contain no
   production data, but truthful status presentation must cover them too. The candidate defect
   was referred to Core/Integration for scheduling and a decision between cleanup and an explicit
   inspection-required mapping; this spike did not implement a fix.
2. The sub-millisecond debug read latency was only a baseline. The former M8 benchmark design
   still needed to distinguish debug/release builds, cold/warm paths and actual smoke-test load.
3. Event frames (`task.accepted`) and response frames share the output stream. The demo's
   idempotency `commandId` is at frame level, not inside params. The script captured that observed
   shape; formal tests must follow the versioned contract, not treat this script as authority.

These results have not been rerun as part of the documentation language cleanup.
