# Unity Editor deployment

> Document version: 2.0.0
> Status: Accepted
> Last conformance review: 2026-10-01

For people: choose Avatar editing, review the version, download order and destination, and let VUA
download and install the global Unity Editor. Mainland-China download networks start with
[NoUnityCN](https://www.nounitycn.top/); other networks start with Unity's official source. If a
source fails, VUA tries the other enabled source, then offers installation through Unity Hub.
Settings → Environment & paths contains an enabled-by-default mirror switch. Unity's original
installer performs installation; the official Unity CLI registers the Editor and handles licensing.

For Agents: implement and exercise the small path below. Use the
[deployment contract](../protocols/environment-deployment-v0.1.md) for wire behavior and
[N1 outcomes](../development-outline.md#n1-purpose-driven-deployment) for acceptance.
Keep development experiments moving, record concrete results, and fix failures in the owning
adapter. A source review is supporting work; the deliverable is a working installation.

## First usable path

1. Inspect the selected purposes, existing software, Editor installation root and download region.
2. Acquire the reviewed official Unity CLI when missing. After acquisition, prepare a fresh plan.
3. For PC Avatar editing, show the source order for global Windows x64 Unity `2022.3.22f1`,
   changeset `887be4894c44`. Region and the mirror preference are part of the confirmed plan.
4. Download the original installer into VUA's local cache. Try each enabled source in the
   displayed order. Compare Unity's published MD5 and the global Unity signature. Record the
   local SHA-256 so the acquired bytes can be identified again. If acquisition fails across the
   enabled sources, finish with a Unity Hub handoff and keep prerequisite readiness false.
5. Run the original installer at the displayed destination. Windows presents its own UAC prompt
   when elevated rights are needed. Preserve the unquoted final `/D=` directory argument required
   by the installer, including installation directories containing spaces.
6. Inspect the installed `Editor/Unity.exe`, then use the official CLI's `editors add` command
   to register the installation. Refresh the environment panel from the resulting observations.
7. Guide the user through official account authorization and license choice, then launch an
   actual disposable SDK/MA project. These follow installation as separately observable steps.

For Quest editing, the existing official CLI module path adds Android Build Support, SDK/NDK and
OpenJDK. The first direct-installer real-machine run concentrates on PC Editor installation;
exercise module management next against that registered Editor.

## Responsibilities and implementation

The Orchestrator owns purpose selection, the visible source/destination, confirmed plans and
durable tasks. Project-manager owns the concrete download, installer and Editor checks:

- [Editor acquisition and native installation](../../crates/project-manager/src/unity_editor_install.rs)
- [Official CLI discovery, registration and module commands](../../crates/project-manager/src/unity_install.rs)
- [Official CLI acquisition](../../crates/project-manager/src/unity_cli_bootstrap.rs)
- [Windows composition and reinspection](../../crates/project-manager/src/deployment_adapter.rs)

The renderer displays the backend plan and task result. Its download-source button opens the
selected entry; it does not construct installer commands. The existing Candidate `install_editor`
action now uses this source-policy/native-installer path when its installation authority is the
standalone CLI. An existing supported Hub CLI keeps its command family.

[ProcessRunner](../../crates/orchestrator/src/process.rs) owns process invocation and the
Windows-specific NSIS directory tail. On an elevation-required response, it opens the original
installer through Windows' `runas` mechanism and waits for that process. The elevated process is
OS-owned rather than captured by the ordinary job/output pipes; installation succeeds after
the native installer finishes and the target Editor passes reinspection.

## Download entry and original artifact

The source order follows the author's 2026-10-01 ruling:

| Download-network region | Mirror switch on | Mirror switch off |
| --- | --- | --- |
| Mainland China (`CN`) | NoUnityCN → Unity official → Unity Hub | Unity official → Unity Hub |
| Other or unknown | Unity official → NoUnityCN → Unity Hub | Unity official → Unity Hub |

[RegionProbe](../../crates/project-manager/src/unity_download_region.rs) makes one bounded HTTPS
request to Cloudflare's public trace endpoint and reads only the country category. This measures
the current download exit, including a user's proxy, rather than physical residence. Hong Kong
and Taiwan are outside the mainland category. Only the category is cached in memory for ten
minutes; IP addresses, trace bodies and location history are not retained. Probe failure gives
`unknown` and starts with the official source.

The mirror entry is
[NoUnityCN's exact-version download page](https://www.nounitycn.top/download?v=unityhub%3A%2F%2F2022.3.22f1%2F887be4894c44).
The adapter reads the fixed target's href from that page and carries the page as its referrer;
its published `pd.zwc365.com/seturl/` transfer service is the current mirror route. The official
route directly requests Unity's original download URL. Turning mirrors off excludes requests
to both NoUnityCN and its transfer service. A verified completed local cache may still be reused.
The current global Windows artifact is:

- Version / changeset: `2022.3.22f1` / `887be4894c44`.
- Original filename: `UnitySetup64-2022.3.22f1.exe`.
- Official manifest MD5: `4b5bcea63f3de8377e69d127d3ce4c1d`.
- Cache: `environment/unity-editor/2022.3.22f1/` beneath VUA's local data directory.

VUA continues to use the original Unity executable. Source acquisition is a replaceable adapter.
Improve its retry, routing and
progress behavior from actual download runs rather than introducing a general mirror framework
before the first installation works. Regional replacement redirects switch sources before a
large download begins; invalid file checks also advance to the next source. After all enabled
sources fail, the task returns `manual_required` with `handoff: "unity_hub"`. The panel offers
`unityhub://2022.3.22f1/887be4894c44` and the official Hub download page. The deep link opens only
after the user clicks and confirms the external protocol. The user completes Hub installation,
then prepares a fresh VUA plan. This is an installation handoff, not an automatic success claim.

In a debug build, `VUA_DEV_EDITOR_INSTALLER` can point to an already downloaded local installer.
This lets the real Provider/task path reuse a browser download during development, with the same
file checks. It is a process-local development option, separate from renderer inputs. Release
builds use the confirmed source policy. Interrupted downloads use uniquely named staging files;
a completed cache is reused.

## Official tooling and user choices

Unity documents [local command-line installation](https://docs.unity3d.com/2022.3/Documentation/Manual/InstallingUnity.html)
and [CLI Editor registration](https://docs.unity.com/en-us/unity-cli/unity-cli-reference).
VRChat specifies the [global production Editor](https://creators.vrchat.com/sdk/upgrade/current-unity-version/).
Installing from a local file does not require rewriting hosts or impersonating Unity's HTTPS site.

The pinned standalone CLI is Windows x64 `1.0.0-beta.11`, acquired directly from Unity and checked
by size, SHA-256 and Windows Authenticode. The adapter also verifies the CLI's capabilities and
configured Editor root before confirmation. This increment keeps the existing shared install-root
setting; explicit root changes remain a later deployment operation.

Unity tools retain their own [terms](https://unity.com/legal/terms-of-service) and
[Editor software terms](https://unity.com/legal/editor-terms-of-service/software).
VUA downloads them onto the user's machine. It does not include them in its distribution or
operate its own Unity mirror. Users complete account authorization and choose their license in
Unity's tooling. VUA does not handle Unity credentials or select a paid license.

## Real-machine development and next checks

The official standalone CLI has already been acquired and verified through the real Provider.
Real Provider trials exercised the NoUnityCN download route. The first obtained a regional
`2022.3.22f1c1` replacement and rejected it before execution; the next switched routes at the
redirect boundary without downloading the replacement again. On 2026-10-01, real Provider runs
with mirrors both enabled and disabled classified the current download exit as `other`. The
enabled plan used official → NoUnityCN; the disabled plan used official only. Both completed
with warnings and the exact-version Unity Hub handoff. Native Editor installation remains the
next step on this machine. Raw downloads and observations stay in ignored
`_local_real_machine/` directories.

After the first installation, record the actual installed version, registration result and
destination, then run license/project checks and an Android-module attempt. Follow N1's remaining
play, account-guide, update/removal, configuration and UI scenarios in small increments.

## Document changelog

- 2.0.0 (2026-10-01): select region-aware official/NoUnityCN priority, an enabled-by-default mirror setting and Unity Hub handoff; implement the original-installer/official-CLI path and a debug local-file option.
- 1.1.0 (2026-10-01): identify the regional artifact mismatch and require structured CLI installation results.
- 1.0.0 (2026-09-30): define official standalone CLI acquisition and separate licensing and functional checks.
