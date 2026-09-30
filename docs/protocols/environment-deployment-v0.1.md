# Environment deployment v0.1

> Document version: 0.1
> Status: Candidate
> Updated: 2026-10-01
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

The plan has `schemaVersion`, normalized `intent`, ordered `steps`, nullable `installer`, `digest` and
`prerequisitesReady`. A step has `component`, `action`, `reason`, nullable `location`, nullable
`version` and nullable backend-owned `officialUrl`. Returned URLs are from the family's closed
official-destination list; the renderer rejects arbitrary destinations.

| Purpose | Required observations |
| --- | --- |
| Desktop play | Steam, VRChat; no Unity or SteamVR requirement |
| PICO PCVR | Steam, VRChat, SteamVR, PICO Connect |
| PC Avatar editing | Supported standalone Unity CLI (or existing supported Hub fallback), exact global Unity 2022.3.22f1 |
| Quest Avatar editing | Same creator prerequisites plus Android support, SDK/NDK and OpenJDK |

Observations distinguish `verified`, `missing`, `unsuitable`, `detection_failed`. For play tools,
verified means the entry-point files were observed, not launched. Empty directories are
unsuitable. Editor verification reads the executable version resource, not a version-shaped
directory name. Android detection requires Editor identity and four expected module files;
it does not replace an actual Android build test. Other supported Editor locations are not
silently moved or overwritten: this slice inspects the explicitly chosen Editor root.

Actions are `retain`, `manual_install`, `inspect`, `install_unity_cli`, `install_editor`,
`add_android_modules`.
Verified facts are retained. Unknown/failed/unsuitable facts require inspection. Missing
components use official handoffs unless a trusted supported installer and matching Editor root
permit automatic installation. Missing CLI may be acquired from a reviewed, fixed official artifact.
Its acquisition plan never includes automatic Editor/module installation: prepare fresh consent
after the tool is verified. The [standalone deployment direction](../architecture/unity-deployment.md)
owns artifact/source, path semantics and account/license handoff. `prerequisitesReady` is true only when
all steps retain verified facts. Accounts, SDK/MA package resolution and device behavior are
not inferred from that boolean.

The digest is SHA-256 over compact serde JSON serialization of the normalized intent and
ordered steps and nullable installer identity. `installer` has `kind` (`unity_cli`, `hub_cli`,
`unity_cli_bootstrap`), `location`, `version`, `fileSha256` and `editorRoot`. Bootstrap identifies a
reviewed artifact to acquire; other kinds identify an observed executable. The root equals intent;
the file digest is 64 lowercase hexadecimal characters. Purpose order is normalized; timestamps are excluded. No consumer computes
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

Automatic actions reverify installer trust, binary digest, capabilities and destination at the
mutation boundary. Trust uses Windows Authenticode plus an exact allowlisted Unity signer common
name, without a shell. Certificate retrieval is cache-only; unavailable trust data refuses
automation. CLI acquisition verifies pinned size/hash/signature and publishes into an absent managed
slot without replacement. It makes no PATH/registry writes and refuses redirected ancestors.
Editor commands use fixed argument arrays, stripped service credentials, bounded output and a
two-hour timeout. VUA never changes the shared Unity installation root or active VR runtime.
Unsupported observations require inspection or an explicit official-tool handoff, never silent
upgrade, agreement acceptance or authorization. Hub is optional; installer kind selects the exact
command family.
Standalone CLI mutations explicitly request JSON and disable proxy request logging. They require
both a clean process completion and a successful result for the requested command, followed by
the normal file inspection. `vua.deployment.vendor_install_failed` reports Unity's structured
`INSTALL_FAILED` without guessing its cause; `vua.deployment.vendor_result_unreadable` reports an
unverifiable result. Both are `external_failure`, keep readiness false and trigger no automatic
retry. Raw vendor messages and shared logs are not copied into application errors.

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
or ambiguous observations are `conflict`, unavailable installer/platform is `dependency`, and installer
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

A subsequent standalone-CLI run on the same date actually acquired and verified the fixed official
CLI, then required fresh consent before Editor installation. The fresh Editor task failed with
`vua.deployment.install_failed`; readiness remained false. Official CLI error logs reported a
checksum mismatch for the exact target. A follow-up download and signature inspection identified
the regional CDN returning `2022.3.22f1c1` under the global-version filename. That artifact was not
executed. Validation was retained, with no forced install or version substitution. This is distinct from the earlier manual
handoff smoke; details and local evidence are linked from the [deployment direction](../architecture/unity-deployment.md).

N1 remains open: actual Editor installation and licensing and Android module addition, disposable Unity
project launch with real SDK/MA, play/device checks, account guidance, software update/removal,
configuration backup/repair and human UI acceptance are not completed by these tests. Public
evidence must distinguish synthetic coverage from dated real-machine runs kept locally.

## Document changelog

- 0.1 Candidate update (2026-10-01): require structured CLI completion and add bounded vendor-failure guidance; record the regional artifact mismatch.
- 0.1 Candidate update (2026-09-30): add fixed official CLI acquisition, Hub-independent installation authority and consent-bound executable identity; retain existing frozen methods.

- 0.1 (2026-09-30): introduce the additive executable N1 planning/confirmation slice and its safety/verification limits.
