# Unity Editor deployment

> Document version: 2.2.0
> Status: Accepted
> Last conformance review: 2026-10-02

For people: choose Avatar editing, review the version, download order and destination, and let VUA
download and install Unity Editor. VUA prefers global `2022.3.22f1`, then tries China
`2022.3.22f1c1` if global acquisition or installation fails, and offers Unity Hub if both fail.
Within each edition, mainland-China networks start with [NoUnityCN](https://www.nounitycn.top/);
other networks start with Unity's official source, followed by the other enabled source.
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
3. For PC Avatar editing, show the global → China edition order and source order for changeset
   `887be4894c44`. Edition order, region and mirror preference are part of the confirmed plan.
4. Download the original installer into VUA's local cache. Try each enabled source in the
   displayed order. Compare the edition's pinned MD5 and expected Unity publisher signature.
   Record the local SHA-256 and actual version. Exhaust global attempts before China; exhaust
   both editions before a Unity Hub handoff.
5. Run the original installer at the displayed destination. Windows presents its own UAC prompt
   when elevated rights are needed. Preserve the unquoted final `/D=` directory argument required
   by the installer, including installation directories containing spaces.
6. On installation or inspection failure, try the next edition in its own directory. Cancellation,
   declined elevation or a changed destination stops execution. Inspect the installed
   `Editor/Unity.exe`, then use the official CLI's `editors add` command
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

The following source order is tried for each edition. The author's 2026-10-02 ruling makes
global → China the outer order; Unity Hub is offered only after both editions fail.

| Download-network region | Mirror switch on | Mirror switch off |
| --- | --- | --- |
| Mainland China (`CN`) | NoUnityCN → Unity official | Unity official |
| Other or unknown | Unity official → NoUnityCN | Unity official |

[RegionProbe](../../crates/project-manager/src/unity_download_region.rs) makes one bounded HTTPS
request to Cloudflare's public trace endpoint and reads only the country category. This observes
the exit used for that probe, including a user's proxy; individual vendor hosts may use different
routes. It supplies an initial source-order hint rather than physical residence. Hong Kong
and Taiwan are outside the mainland category. Only the category is cached in memory for ten
minutes; IP addresses, trace bodies and location history are not retained. Probe failure gives
`unknown` and starts with the official source.

The mirror entry is
[NoUnityCN's exact-version download page](https://www.nounitycn.top/download?v=unityhub%3A%2F%2F2022.3.22f1%2F887be4894c44).
The adapter reads the fixed target's Windows-button href and requests that exact URL with the
page as its referrer. The official route directly requests Unity's original download URL.
Turning mirrors off excludes NoUnityCN requests. A verified completed local cache may still be reused.
The current global Windows artifact is:

- Version / changeset: `2022.3.22f1` / `887be4894c44`.
- Original filename: `UnitySetup64-2022.3.22f1.exe`.
- Official manifest MD5: `4b5bcea63f3de8377e69d127d3ce4c1d`.
- Cache: `environment/unity-editor/2022.3.22f1/` beneath VUA's local data directory.

The China fallback uses the corresponding regional download entry and original filename on
`download.unitychina.cn`. The requested global entry is `887be4894c44`; the observed installed
c1 product resource identifies its own build as `c3cbd310e76e`.
Its observed complete artifact has MD5 `9aa1b61f75fc6ad3fe8025bbb7265b64` and a valid signature
from `优三缔科技（上海）有限公司`. This publisher is admitted only for the pinned China Editor,
not for CLI/Hub acquisition. Its cache and installation subdirectory is `2022.3.22f1c1`.
N1 accepts the [development compatibility pair](../compatibility/unity-editor.md) by actual
executable version, independently of the frozen inspection classifier. Existing global
installations take priority over c1; an existing usable c1 installation is retained.

VUA continues to use the original Unity executable. Source acquisition is a replaceable adapter.
Improve its retry, routing and
progress behavior from actual download runs rather than introducing a general mirror framework
before the first installation works. During global acquisition, regional redirects switch
sources before a large download begins. The China attempt admits the regional CDN and checks
the c1 artifact. Failed source attempts advance within that edition; failed installation
advances to the next edition. After both editions fail, the task returns `manual_required`
with `handoff: "unity_hub"`. The panel offers
`unityhub://2022.3.22f1/887be4894c44` and the official Hub download page. The deep link opens only
after the user clicks and confirms the external protocol. The user completes Hub installation,
then prepares a fresh VUA plan. This is an installation handoff, not an automatic success claim.

In a debug build, `VUA_DEV_EDITOR_INSTALLER` can point to an already downloaded local installer.
This lets the real Provider/task path reuse a browser download during development, with the same
file checks and edition order. A local c1 artifact is used only at the China attempt. It is a
process-local development option, separate from renderer inputs. Release
builds use the confirmed source policy. Interrupted downloads use uniquely named staging files;
a completed valid cache is reused. An invalid managed cache is retained under a unique rejected
filename, freeing the download slot for another attempt.

## Progress and actionable failures

Each Editor step reports source resolution, downloading, file verification, installation,
inspection and CLI registration through the existing durable task events. Download and hash
verification report actual completed/total bytes at most once per second, plus stage boundaries.
Known-length transfers have a byte progress bar; the native installer has a stage and elapsed
time while ProcessRunner waits for completion. A timer is not an installer percentage.

The transfer allows two hours overall, with a 30-second connection timeout and 60-second read
timeout; resolving the mirror page has a 30-second total timeout. Cancellation and failed durable
progress writes stop at the next acquisition reporting boundary. During native installation,
cancellation takes effect when the installer returns.

Progress identifies the actual edition being attempted. Each failed source retains a bounded cause: source-page change, regional redirect, other redirect,
HTTP failure, timeout, transfer failure or file-integrity failure. The Hub handoff includes these
source failures and versioned installation failures, and the panel exposes them in attempt details. Raw response bodies, vendor logs
and credentials remain outside task messages.

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

On 2026-10-02, the corrected exact-button route ran through the real Provider. The official and
NoUnityCN requests both reached a regional CDN redirect on this network. The task now retains
two `editor_regional_redirect` source failures in its Hub handoff. Evidence is in
`_local_real_machine/n1-direct-button-2026-10-02/`. The author's later October 2 ruling admits
the c1 artifact and changes the next run to global → China → Hub; earlier rejection outcomes
describe the earlier policy only.

After the first installation, record the actual installed version, registration result and
destination, then run license/project checks and an Android-module attempt. Follow N1's remaining
play, account-guide, update/removal, configuration and UI scenarios in small increments.

## Document changelog

- 2.2.0 (2026-10-02): accept global/China edition fallback, separate artifact/destination identity,
  and version installation failures and successful task results.

- 2.1.0 (2026-10-02): follow the actual mirror button, report stage/byte activity and source-specific failures, and make invalid managed caches retryable.
- 2.0.0 (2026-10-01): select region-aware official/NoUnityCN priority, an enabled-by-default mirror setting and Unity Hub handoff; implement the original-installer/official-CLI path and a debug local-file option.
- 1.1.0 (2026-10-01): identify the regional artifact mismatch and require structured CLI installation results.
- 1.0.0 (2026-09-30): define official standalone CLI acquisition and separate licensing and functional checks.
