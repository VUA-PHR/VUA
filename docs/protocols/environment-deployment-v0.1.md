# Environment deployment v0.1

> Document version: 0.1
> Status: Candidate
> Updated: 2026-09-30
> Scope: Additive purpose-plan and confirmed-execution family under Gateway v1 / application 0.1

## Reading context and ownership

For people: select a purpose, inspect the plan, follow official installation handoffs and inspect
again. A completed prerequisite task does not establish a working headset or Avatar project.

For Agents: this is one executable N1 slice, not gate closure. Planning/use-case coordination lives
in [orchestrator](../../crates/orchestrator/src/deployment.rs), Windows vendor commands in
[project-manager](../../crates/project-manager/src/deployment_adapter.rs), and decoding/composition
in [Provider](../../crates/provider-host/src/deployment_routes.rs). The renderer presents backend
facts through [DeploymentPort](../../apps/desktop/src/renderer/gateway/environment-port.ts),
implemented by the [live wire adapter](../../apps/desktop/src/renderer/gateway/live-deployment-port.ts).
The [N sequence](../development-outline.md#n1-purpose-driven-deployment) owns product acceptance.

## Operations and closed input

| Application method | Kind | Params | Result |
| --- | --- | --- | --- |
| `environment.planDeployment` | query | `{intent}` | `{deploymentPlan}` |
| `environment.executeDeployment` | command | `{intent, confirmedDigest}` | `{schemaVersion, operation, taskId, correlationId}` |

`intent` is `{purposes, editorRoot}`. Purposes are a nonempty unique array drawn from
`desktop_play`, `pico_pcvr`, `pc_avatar`, `quest_avatar`; multiple purposes are supported.
`editorRoot` is a drive-absolute Windows installation root, 4–240 UTF-8 bytes. Reject device/UNC
paths, traversal, empty segments, trailing dot/space aliases, reserved DOS device names, control
characters, wildcards and alternate data streams. No executable, command text, extra arguments,
credentials, `force`, selected latest version or uninstall instruction is accepted.

Both operations use the existing closed application envelope. Execution requires a nonempty
`commandId` of at most 128 UTF-8 bytes with no control characters at application-envelope level;
the Desktop Gateway carries it in params and the Kernel moves it to that level. The confirmed
digest is exactly 64 lowercase hexadecimal characters. The schema tag in family values is
`vua.environment-deployment/v0.1`; the surrounding application contract remains `0.1`.

[Parameter schema](../../schemas/environment-deployment/v0.1/request.schema.json) checks structure;
the shared Rust/TypeScript intent validators additionally enforce Windows spelling and byte
bounds. [Positive/negative intent vectors](../../schemas/environment-deployment/v0.1/intent-vectors.json)
are consumed by both implementations. This is Candidate while real installation/functional
acceptance and UI human review remain pending; no existing frozen method changes meaning.

## Plan and observed prerequisites

The plan has `schemaVersion`, normalized `intent`, ordered `steps`, `digest` and
`prerequisitesReady`. A step has `component`, `action`, `reason`, nullable `location`, nullable
`version` and nullable backend-owned `officialUrl`. Returned URLs are from the family's closed
official-destination list; the renderer rejects arbitrary destinations.

| Purpose | Required observations |
| --- | --- |
| Desktop play | Steam, VRChat; no Unity or SteamVR requirement |
| PICO PCVR | Steam, VRChat, SteamVR, PICO Connect |
| PC Avatar editing | Unity Hub, exact global Unity 2022.3.22f1 |
| Quest Avatar editing | Same creator prerequisites plus Android support, SDK/NDK and OpenJDK |

Observations distinguish `verified`, `missing`, `unsuitable`, `detection_failed`. For play tools,
verified means the entry-point files were observed, not launched. Empty directories are
unsuitable. Editor verification reads the executable version resource, not a version-shaped
directory name. Android detection requires Editor identity and four expected module files;
it does not replace an actual Android build test. Other supported Editor locations are not
silently moved or overwritten: this slice inspects the explicitly chosen Hub root.

Actions are `retain`, `manual_install`, `inspect`, `install_editor`, `add_android_modules`.
Verified facts are retained. Unknown/failed/unsuitable facts require inspection. Missing
components use official handoffs unless an exact supported Unity Hub installation path and
trusted CLI permit one of the two automatic actions. `prerequisitesReady` is true only when
all steps retain verified facts. Accounts, SDK/MA package resolution and device behavior are
not inferred from that boolean.

The digest is SHA-256 over compact serde JSON serialization of the normalized intent and
ordered steps. Purpose order is normalized; timestamps are excluded. No consumer computes
consent independently: send the returned digest unchanged. Missing/duplicate contradictory
facts do not authorize installation. Before writes, reobserve and compare the entire digest;
changed consent fails with `vua.deployment.plan_changed`.

## Execution, evidence and recovery

Acceptance atomically stores command ID, canonical request fingerprint and task receipt in the
existing SQLite idempotency table before a worker starts. Same ID + same request returns the
original task, including after completion/restart; changed input with the same ID conflicts.
Replay occurs before freshness checking, so an uncertain reply cannot duplicate an installer.
Preparing/failed/cancelled/completed state comes from the normal task runtime and `task.get`.

Execution is sequential. A second live deployment task fails busy; a Windows session-wide named
mutex also prevents two VUA instances from running installation steps simultaneously. Live
queued/running deployment tasks block a `safe_to_stop` Provider shutdown response. A recovered
nonterminal task is `inspect_required`, never silently resumed or automatically retried.

Progress uses the frozen task-progress envelope: `completed`/`total` count prerequisite steps,
`messageKey` is localized, and params contain the closed operation/component/action/phase facts.
`started` is distinct from `verified`; these are not fabricated download percentages. Failed
automatic steps include `component` in the error params. Progress and final results are durable;
the current panel consumes live progress and authoritative task snapshots. Reopening a page may
miss earlier live progress; the task list and final state remain authoritative, not guessed.

Automatic actions reverify Hub trust/capability at the mutation boundary. Trust uses Windows
Authenticode plus an exact allowlisted Unity signer common name, without a shell. Certificate
retrieval is cache-only; unavailable cached trust data refuses automation instead of blocking a
plan on certificate-network access. Commands use
fixed argument arrays, stripped credential environment variables, bounded output and a two-hour
installer timeout. VUA never changes Hub's global installation path or the active VR runtime.
Unsupported CLI/trust/path observations fall back to the official UI; they are not permission
to download or execute another installer. [Hub CLI is deprecated](https://docs.unity.com/en-us/hub/hub-cli-reference);
new Unity CLI support is a separate adapter increment, not assumed equivalent.

Cancellation is cooperative before/after an installer boundary, not forced interruption of a
shared application or OS rollback. Timeout/Provider interruption can leave partial files;
reinspect and repair manually before preparing fresh consent. Existing install-root ancestors
must be ordinary readable directories; junctions/symlinks are refused. These checks reduce
accidental redirection, but do not promise an OS transaction or protection from another process
maliciously replacing files between inspection and execution. A lost durable progress write
freezes further mutations. The shared SQLite cancellation revision is reconciled with worker
progress so an accepted cancellation does not corrupt task state.

A manual step finishes with warnings and `{outcome:"manual_required", nextStep,
prerequisitesReady:false, functionalVerification:"not_run"}`. The user completes the upstream
step, then prepares a fresh plan. Automatic completion requires reinspection of all selected
prerequisites and returns `{outcome:"prerequisites_verified", prerequisitesReady:true,
functionalVerification:"not_run"}`. A successful exit code alone never produces that result.

Errors use the existing application error envelope: invalid input is `validation`, stale/busy
or ambiguous observations are `conflict`, missing/unsupported Hub is `dependency`, and installer
or verification failures are `external_failure`. UI keeps errors visible and offers reinspection;
there is no universal resume, uninstall or downgrade command in this family.

## Verification and remaining N1 work

Synthetic [domain/recovery tests](../../crates/orchestrator/tests/deployment.rs),
[cancellation-race regression](../../crates/orchestrator/tests/sqlite_runtime.rs),
[wire tests](../../crates/provider-host/tests/environment_snapshot_wire.rs),
[consumer guard tests](../../packages/contracts/src/environment-deployment.test.ts) and
[desktop port tests](../../apps/desktop/src/renderer/gateway/electron-gateway.test.ts) cover this
slice without user assets/accounts. Adapter tests refuse unsigned/missing programs and incomplete
directories and check the fixed command vocabulary and cross-thread installation lock.

On 2026-09-30, a real local Provider smoke observed the existing Steam/VRChat/SteamVR/PICO
entry-point files and the absent Hub/Editor at the selected default roots. All four purposes
returned appropriate plans; confirmed creator execution returned `manual_required` with warnings,
and replay returned the same task. Raw observations remain local under
`_local_real_machine/n1-2026-09-30/`. This exercised presence/plan/task handoff, not installation,
game launch, hardware behavior or cross-Windows compatibility.

N1 remains open: actual Hub/Editor installation and Android module addition, disposable Unity
project launch with real SDK/MA, play/device checks, account guidance, software update/removal,
configuration backup/repair and human UI acceptance are not completed by these tests. Public
evidence must distinguish synthetic coverage from dated real-machine runs kept locally.

## Document changelog

- 0.1 (2026-09-30): introduce the additive executable N1 planning/confirmation slice and its safety/verification limits.
