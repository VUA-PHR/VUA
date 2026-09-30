# Unity deployment without Hub

> Document version: 1.0.0
> Status: Accepted
> Last conformance review: 2026-09-30

For people: VUA should install the VRChat-compatible Unity Editor using Unity's official
standalone CLI. Installing Unity Hub is optional. Users still choose their license, accept
agreements and complete official account authorization themselves.

For Agents: read the [deployment contract](../protocols/environment-deployment-v0.1.md) for
wire behavior and the [N1 outcomes](../development-outline.md#n1-purpose-driven-deployment)
for acceptance. This direction does not claim that Editor installation, licensing or a real
SDK/MA project has passed. Keep acquisition, installation, licensing and functional checks distinct.

## User path and implementation ownership

1. Select PC or Quest Avatar editing. Inspect existing tools and the requested Editor root.
2. Prefer a supported, Unity-signed Unity CLI. If absent, show a plan to download the reviewed
   Windows x64 CLI directly from Unity into VUA's local data directory. Check size, SHA-256
   and Windows Authenticode before publishing or running it. Do not execute an installation script.
3. After acquiring CLI, generate a fresh plan. This new confirmation authorizes Editor/module
   installation; the acquisition confirmation alone does not. Existing supported Hub CLI is an
   optional fallback when no eligible standalone CLI is found.
4. Install exactly global Unity `2022.3.22f1`, changeset `887be4894c44`. Quest adds Android Build
   Support, SDK/NDK tools and OpenJDK. Retain existing installations; do not request latest,
   force replacement, uninstallation or downgrade through this Candidate family.
5. Guide the user through Unity's own browser authorization and license choice. The official
   CLI provides `unity auth login` and `unity license activate --personal`; Personal eligibility
   is the user's decision. Any agreement acceptance must be explicit. VUA does not silently pass
   `--accept-eula`, select a paid plan or read Unity's stored credentials.
6. Reinspect Editor identity and modules, then launch a disposable project with actual SDK/MA
   packages. Installed files, an active license and a working project are separate evidence.

The Orchestrator owns purpose policy, plan confirmation and durable tasks. Project-manager owns
[CLI acquisition](../../crates/project-manager/src/unity_cli_bootstrap.rs),
[installer discovery/commands](../../crates/project-manager/src/unity_install.rs),
and [Windows installation verification](../../crates/project-manager/src/deployment_adapter.rs).
The Provider composes these adapters. The renderer only displays validated plans and task facts;
it cannot provide executable paths, command arguments, download URLs or license acceptance flags.

## Selected official artifact and path behavior

The first supported standalone CLI is experimental `1.0.0-beta.11`, Windows x64. Its fixed
[official manifest](https://public-cdn.cloud.unity3d.com/hub/prod/cli/1.0.0-beta.11/latest.json)
and executable were checked on 2026-09-30. The adapter pins the source, exact size and digest;
only the fixed global URL and Unity’s fixed regional CDN URL are accepted for redirects. Both
serve the same pinned CLI artifact; this does not change the required global Editor distribution.
Upgrades require a reviewed adapter change. A floating latest pointer is not capability evidence.
Existing official CLI locations and VUA's managed slot are checked without searching PATH.
An unsupported/foreign file in the managed slot requires inspection rather than overwrite.

The Editor root must match `unity install-path --get`. This setting can be shared with Hub;
`UNITY_CLI_HOME` only chooses where the CLI executable lives. This increment does not mutate
the shared Editor root. A mismatch requires the user to review/configure it with the official
tool and prepare a fresh plan. Explicit, backed-up configuration changes remain N1 follow-up.

Each confirmed plan binds the installer kind, executable path, version, binary digest and Editor
root. Recheck the same authority at mutation boundaries. Acquisition is bounded to ten minutes;
Editor/module commands are bounded to two hours. Cancellation waits for a safe step boundary;
there is no promise of OS rollback. Errors remain visible and never become successful readiness.
Vendor output is bounded and does not enter task logs. Do not start cloud project creation or
service-account authentication; future local CLI project creation must explicitly disable cloud.

## Source and policy reasoning

Unity documents [standalone installation without Hub](https://docs.unity.com/en-us/unity-cli/unity-cli),
[official acquisition](https://docs.unity.com/en-us/unity-cli/use-unity-cli),
[commands](https://docs.unity.com/en-us/unity-cli/unity-cli-reference) and
[license-command releases](https://docs.unity.com/en-us/unity-cli/release-notes).
VRChat specifies [global Unity 2022.3.22f1](https://creators.vrchat.com/sdk/upgrade/current-unity-version/).
The CLI's experimental status requires capability checks and explicit fallback, not a universal
compatibility promise. Legacy [Hub CLI is deprecated](https://docs.unity.com/en-us/hub/hub-cli-reference).

The chosen route uses Unity's own download/automation tool on the user's machine. VUA does not
bundle, mirror or relicense Unity CLI/Editor, and the user remains subject to
[Unity terms](https://unity.com/legal/terms-of-service) and
[Editor software terms](https://unity.com/legal/editor-terms-of-service/software).
This is an engineering interpretation of the documented route, not a claim of Unity endorsement
or a replacement for the user's license conditions. Official authorization can leave the built-in
registration browser; credentials stay in Unity's own tooling, outside VUA/Agent state.

## Evidence and open work

On this workstation, the pinned official CLI passed digest and signature checks and reported
`1.0.0-beta.11`. Its help exposed Editor installation, module installation, browser login and
Personal activation. Help is capability evidence, not completed login or license activation.
Raw downloads and machine observations stay under ignored `_local_real_machine/` directories.

The real Provider subsequently downloaded and verified that artifact, completed acquisition with
`manual_required`, and produced a fresh plan using `unity_cli` plus automatic `install_editor`,
without requiring Hub. Executing that fresh plan returned `vua.deployment.install_failed`; the
following inspection kept prerequisites unready. A separate CLI JSON diagnostic returned exit
code `6` and upstream error `INSTALL_FAILED`. The official error-level log then identified
an Editor-file checksum mismatch against the release manifest. The CLI reports that the file
length matches the server response and suggests stale release data as a possible cause; that
inference has not been independently proved. No permission/terms prompt was reported by the user. The dry-run returned zero without diagnostic data, so it does not
establish a successful preflight. No Editor/license/SDK success is claimed.

Automated tests cover Hub-independent planning, fresh consent after bootstrap, installer drift,
fixed command families, redirect restrictions, untrusted bytes and existing-file preservation.
Android modules, licensing, SDK/MA project launch and human UI review remain pending. Actual
installation remains blocked until the exact target can be downloaded with matching official
metadata and verified identity. Do not skip checksum validation, edit vendor manifests or select a
newer incompatible Editor to pass acceptance. Synthetic tests cannot close N1.

## Document changelog

- 1.0.0 (2026-09-30): define the official standalone CLI direction, bounded acquisition/installation slice and separate license/functional evidence.
