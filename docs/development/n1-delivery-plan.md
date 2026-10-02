# N1 delivery plan: from a device choice to a working environment

> Document version: 1.2.0
> Status: Accepted
> Updated: 2026-10-02
> Scope: Implementation of the user's September 30–October 2 N1 rulings

For people: choose what to do and which headset to use. VUA prepares the required software,
connections and account/device guidance until play or local Avatar editing works. Existing
installations are reused, and the player can add another purpose later.

For Agents: implement the first unfinished usable path, run it, fix the observed failure and
repeat that same path. Work in one feature checkout. The [product boundary](../product-boundary.md#n1-device-and-network-onboarding)
owns scope; the [N1 acceptance rows](../development-outline.md#n1-purpose-driven-deployment)
own completion. This plan organizes delivery without replacing contracts or the N5 plan.

## Intended experience

1. Choose desktop play, headset play, PC Avatar editing or Quest Avatar editing; allow combinations.
2. For headset play, select **brand, then exact model**. Offer detected devices as suggestions,
   allow correction, and recommend the first supported official route for that model.
3. Inspect installed software, versions, locations, relevant hardware and service connectivity.
   Explain which parts can be reused and which need installation or attention.
4. Review the component, reason, source, destination, disk requirement, optional choices and
   required user actions. Allow supported location/options changes before execution.
5. Download, install and configure with visible progress. Hand over individual user actions,
   then return to the remaining plan.
6. Launch and verify the chosen use: a working play connection, or a real Unity project with
   the required SDK/MA dependencies. Present useful next actions such as opening the project.
7. On later visits, inspect current state and offer missing components, appropriate updates,
   removal, repair or retry while reusing satisfied prerequisites.

Use the existing English, Simplified Chinese, Japanese and Korean i18n system. The main flow
explains the next action; detailed technical diagnostics are expandable.

## Devices and official-first routes

The first device pool is Meta Quest, Oculus Rift S, PICO, HTC VIVE, Valve Index and Sony PS VR2.
WMR is an investigation candidate whose first-delivery inclusion follows the cost assessment
below. Bigscreen and Varjo follow the first pool. Steam hardware share informs priority.

Deliver **one complete recommended route per supported model first**, preferentially the
manufacturer's official route. Reuse adapters across models with matching requirements while
retaining each model's ports, firmware, controllers and runtime requirements.

| Device family | First route to implement and exercise | Relevant model-specific preparation |
| --- | --- | --- |
| Meta Quest (start with 2, 3, 3S) | Official Quest Link or Air Link, then game launch | Meta account, headset/phone activation, USB or wireless setup |
| Oculus Rift S | Exact-model official PC runtime and wired setup | DisplayPort/USB and controller checks; a separate route from Quest streaming |
| PICO (start with PICO 4) | Model-appropriate official PICO connection software | USB/wireless options, supported firmware, consumer/enterprise edition |
| HTC VIVE | Exact-model official setup and SteamVR integration | Separate entries for VIVE, Pro and Focus-family requirements |
| Valve Index | Steam/SteamVR and official connection/room setup | DisplayPort/USB, controllers and base stations |
| Sony PS VR2 | Official PC setup, PlayStation VR2 App and SteamVR | PC adapter, DisplayPort, USB and controller Bluetooth requirements |
| WMR | Investigate legacy Microsoft runtime and the third-party Oasis driver | Windows/GPU compatibility, driver setup and access to test hardware |

Transport is an internal adapter detail: direct video connection, USB streaming or wireless
streaming. Most users need only their model and a plain-language cable/wireless choice. Show
direct-link versus streaming options only for an exact model with both routes. The user's
Focus Vision and PICO Neo3 enterprise examples require checking the precise SKU; do not assign
dual connectivity to an entire brand.

Add manufacturer software, ALVR, Virtual Desktop and Steam Link as model-specific streaming
choices are delivered. Show supported models, PC/headset installations, required accounts/store
entitlements and paid/free status. Preserve a working existing choice. Add devices such as
Steam Frame from their actual upstream setup instructions.

## Silent installation with visible activity

Prefer upstream-supported unattended installation. The task remains understandable while the
installer has no window:

- Show component and stage: source resolution, download, verification, installation, user
  interaction, result inspection and ready.
- Use actual byte counts/total size. Show installation percentages only when provided by the
  installer; otherwise show the current stage, elapsed time and observed activity.
- Distinguish monitoring refresh from installer activity. An elapsed-time display says how
  long the task has run; it does not prove installation progress.
- Follow the actual installer and relevant child processes, including bootstrapper handoffs.
- Explain extended inactivity and provide details, continued waiting and supported cancellation.
- Surface UAC, license and other required interaction. When unattended mode is unavailable,
  retain the VUA task while using the visible upstream installer.
- Reinspect the installed application and perform the use-specific check after completion.

Leaving a page preserves its accepted task. Application exit uses the existing shutdown policy.
Crash/restart recovery inspects recorded work and requires an explicit decision before continuing
side effects. Keep capability-specific cancellation and retry behavior in the owning contract.

## Account, activation and network guidance

### Accounts follow the selected route

Steam and VRChat serve play; Unity and BOOTH/pixiv are optional creator steps. Add manufacturer,
headset-store, streaming or accelerator account guidance when the selected route needs it.
Reuse the existing isolated temporary browser and official destinations. Keep registration,
login, store entitlement, device pairing and license selection as separate steps.

Support existing accounts, saved progress, interruption and return from a phone/headset/client.
Provide a link/QR or exact instructions for the other device. Save guide progress and whether a
result was observed or user-reported. Passwords and authentication state do not enter task data.
Users complete account submissions, CAPTCHA, purchases, agreements and license selection.

### Quest activation in mainland China

Target activation without requiring the player to configure a general-purpose VPN. Evaluate
dedicated acceleration/activation services and their hotspot or gateway instructions. The real
trial covers headset update, phone/Meta account access and device pairing separately.

NetEase UU and the independently operated Meta/Oculus Helper are research candidates; the latter
is not a Meta product. Follow the selected service's actual instructions and record tool version,
headset/firmware, network method and result. A working route becomes an N1 guide with explicit
fees and user actions. Independent installation work can continue while an account step waits.

### Regional connectivity belongs to N1

Offer mainland-China guidance such as NetEase UU, with existing-service and skip options.
Disclose that VUA has no financial relationship with the suggested provider; the provider
operates and charges for its service independently.

Region is a default recommendation hint which the user can correct. Inspect the actual target
service: Steam, Meta, VRChat and Unity may follow different network routes. Distinguish local
computer/headset connectivity from Internet access before recommending a remedy.

## Unity: first working creator environment

The [Unity deployment architecture](../architecture/unity-deployment.md) owns acquisition and
installation. Use Unity CLI release lookup and the official download route first in every region.
Identify the actual payload as global `2022.3.22f1` or China `2022.3.22f1c1`; the global entry can
return c1 directly. Try China after global installation failure and offer Hub after alternatives fail.
Keep the enabled-by-default mirror switch in Settings. During development the author accepts
this exact f1/c1 pair as equivalent; retain the full observed identity and fix concrete
compatibility issues through real project trials.

Keep NoUnityCN only as an optional backup after official download failure. Report CLI release
lookup, received bytes, file identity, installer exit, Editor inspection and registration
separately. Inspect the actual accepted Editor version and retain a valid cache; CLI registration
can normalize c1 to f1, so it is not the authority for the observed version.

First local completion path:

> Select PC Avatar editing -> reuse the existing play environment -> obtain the global
> `2022.3.22f1` installer (China `2022.3.22f1c1` fallback) -> install at the confirmed destination -> inspect/register the Editor ->
> complete official Unity authorization/licensing -> prepare real SDK/MA dependencies ->
> open and compile a disposable project successfully.

Editor installation can proceed without Hub. Quest creation adds the Android components after
the PC path works. Existing external-manager projects retain their read-only/copy boundary.

## Small implementation slices

| Order | Concrete deliverable | First check |
| --- | --- | --- |
| 1 | Complete CLI-led official acquisition, actual-edition checks and long-task activity | Obtain the official payload, identify f1/c1 and exercise the product installer path |
| 2 | Complete Editor registration, license handoff and SDK/MA preparation | Open/compile the real project; a repeated plan reuses the installation |
| 3 | Brand/model selection and one official play route at a time | Selected model produces actual prerequisites, then reaches game launch and device verification |
| 4 | Add account, activation and connectivity steps where the route needs them | Complete phone/headset/client handoffs and resume an interrupted guide |
| 5 | Component additions, maintenance and alternative streaming choices | Keep working components, change only selected items and verify the result |

These are delivery slices, not new release gates. Account/network work moves forward when it
becomes the first blocker in a selected route. Retain the legacy `pico_pcvr` wire value while
introducing a typed brand/model intent with its contract, Rust, TypeScript and consumer checks.
UI wording changes do not silently rename a serialized enum.

## WMR investigation and first-delivery decision

Source review on 2026-10-02 found two routes: Microsoft's legacy stack on older Windows, and
Oasis on newer Windows 11 with its documented GPU requirements. Further investigation must
identify exact setup/unlock steps, existing discovery code to reuse, required privileges and a
repeatable headset/controller check using available hardware.

Estimate adapter and validation work after that review. If a large separate driver/recovery
effort is needed, record WMR as deferred for first delivery under the user's explicit permission.
Its status stays visible and the other routes continue. Prefer the upstream installation and
guide over writing a WMR driver in VUA. The current source review identifies a candidate route;
the implementation-cost decision remains pending.

## Integration with N5 development

PR #60 supplies the N1 baseline on main. N5 rebases its own branch onto that baseline. Preserve
both additions in export lists, capability arrays, Gateway interfaces, registry rows and locales.
This task does not dispatch agents or rewrite N5's plan.

N1's `provider_host.rs` changes concern environment-service construction, event subscription,
shutdown blocking, request dispatch, capability generation and helper visibility. N5 catalog
handlers occupy separate areas. Both change `served_capabilities`: retain deployment and
catalog-sync entries. Use semantic anchors rather than historical line numbers. Resolve the
combined Cargo dependency graph and inspect the lockfile rather than taking one side wholesale.

## Sources for adapter research

- [Steam hardware survey](https://store.steampowered.com/hwsurvey/us/?l=english).
- [Steam Link setup](https://help.steampowered.com/en/faqs/view/0E2C-406B-9135-38A4).
- [PICO Connect](https://www.picoxr.com/global/software/pico-connect).
- [Virtual Desktop](https://www.vrdesktop.net/) and [ALVR](https://github.com/alvr-org/ALVR).
- [PS VR2 PC preparation](https://www.playstation.com/en-us/support/hardware/pc-prepare-ps-vr2/).
- [Microsoft WMR](https://learn.microsoft.com/en-us/windows/mixed-reality/enthusiast-guide/mixed-reality-software)
  and [Oasis](https://store.steampowered.com/app/3824490/Oasis_Driver_for_Windows_Mixed_Reality/).
- [NetEase UU](https://uu.163.com/console/) and [third-party Meta Helper](https://ochelper.xlemon.cn/home.html).

## Document changelog

- 1.2.0 (2026-10-02): prioritize CLI-led official acquisition and actual-version inspection; keep the mirror as an optional backup.
- 1.1.0 (2026-10-02): apply the accepted development f1/c1 pair and global → China → Hub installation order.

- 1.0.0 (2026-10-02): record model-first official routes, visible silent installation,
  account/activation/network guidance, Unity first-run work and N5 integration.
