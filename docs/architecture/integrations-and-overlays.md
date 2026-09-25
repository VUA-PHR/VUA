# Core, plugin, external integration, and overlay architecture


> Document version: 1.0.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors integrations-and-overlays.md at 1.0.0)
> Scope: Environment deployment, project management, integrated runtimes, plugin host, desktop/VR overlays
> Updated: 2026-09-06
> Last conformance review: 2026-09-06
> Normative effect: Yes

## Trust classes

Classification follows data contact and authority. Environment, tracking, optimization,
accessibility, and appearance appear as natural-language purpose descriptions in each entry.

| Class | Runs/exists | VUA access | Failure containment |
| --- | --- | --- | --- |
| Core | Trusted product behavior built directly into VUA | Internal application services through owned use cases and ports | The capability rejects or degrades; durable work remains recoverable |
| Plugin | Separate community extension host defined by a public versioned capability protocol | Explicit grants define its complete authority | Failure is contained to the plugin and its granted task |
| External | Independent application, Unity package, runtime, or device service | Retains independent authority; a VUA-side adapter is separately Core or Plugin | External capability degrades and preserves a manual path |

Kernel and local UI are stable host surfaces. Core catalog entries use owned application contracts
for database and private-state access; catalog classification does not create a runtime module system.
The [tool catalog](../tool-catalog/README.md) stores classification
and evidence; the owning reviews authorize scope, protocol, trust, distribution, and execution.

## Unified adapter model

External tools connect through replaceable adapters behind domain ports. Every integration records its
upstream and license, user problem and capabilities, discovery, managed/external modes, supported
versions and data boundary, lifecycle ownership, permissions/credentials/logs, and degradation/manual
path. Prefer official APIs, CLIs, OSC, configuration, and import/export formats. Do not depend on
unauthorized private databases, copied sessions, reflected internals, or UI automation presented as a
stable interface.

## External-integration modes

- **Optional managed:** when licensing permits, VUA uses official distribution, verifies, installs,
  updates, launches, and monitors the component.
- **External connection:** VUA discovers the user's independent installation and connects through a
  public boundary without taking over accounts or private state.

Each mode reports capabilities independently. Recipes, local projects, and recovery retain native
paths across external capability changes. Accepted post-`1.0.0` directions include face tracking through
VRCFaceTracking, motion tracking through SlimeVR Server and OpenVR Space Calibrator, and an Avatar
optimizer through a reviewed public boundary. Project-management, AMF-source, and overlay adapters
use the same inward dependency direction but retain their own product ownership.

## Environment mutation and EAC recovery

Environment tools start with read-only inspection and return evidence, readiness, and a manual path.
Downloads, installer launches, writes, elevation, and process actions are explicit planned steps with
user confirmation and post-action verification.

EAC conflict detection is read-only by default. Terminating an EAC- or VRChat-related residual
process is a disabled-by-default, experimental, high-risk last resort with an account-anomaly warning
and confirmation on every execution. It is limited to allowlisted user-mode residual processes after
verifying and displaying name, PID, path, signer/publisher, and reason; it refuses while gameplay is
active. It never stops services or kernel drivers, changes EAC/VRChat files or configuration,
injects/hooks/hides processes, bypasses anti-cheat, or exposes termination to web content, overlays,
or plugins. Unknown evidence permits diagnosis only.

## Community plugin host

Community plugins use a versioned protocol. Manifests declare identity, version, entry point, compatibility,
and capabilities. The host owns lifecycle, timeout, cancellation, resource budgets, logs, and
permissions. Plugins never directly access application SQLite, BDL, Electron sessions/cookies,
private types, or Unity objects. Sensitive capability is granted individually and denied by default.
Unknown protocol or insufficient capability rejects loading. There is initially no hosted marketplace
or automatic execution of unknown plugins. Plugins run in the separate community host with the
authority granted by their manifest. Process, Wasm, or trusted-native execution requires a separate security ADR.

Community enhancements such as VR sleep brightness, live UI translation, voice changing, and VUA
skins belong here only when they can remain capability-bounded and independently removable. A
catalog entry records its classification and evidence; release review grants distribution and trust.

Catalog authors declare capabilities and behavior, not their own risk conclusion. Before release,
`vua.risk-gate/v1` derives the highest applicable level, rejects unknown or incomplete capabilities,
and applies the corresponding warning, confirmation, refusal tests, and security approval.

## Three project-management paths

| Path | VUA responsibility | Compatibility target |
| --- | --- | --- |
| VUA package manager | Maintain the complete native `vrc-get`-based path | VUA-created and managed projects |
| ALCOM project compatibility | Read and manage where demonstrated safe | ALCOM-managed projects, not the ALCOM app |
| VCC project compatibility | Use public project formats and supported boundaries | VCC-managed projects, not private VCC internals |

All paths detect format, version, locks, and capability before writing. Discovery alone is never
described as complete compatibility; unsafe writes become read-only, conversion advice, or handoff.

## Overlay boundary

Desktop and VR overlays consume the same versioned display snapshot and return semantic actions.
The application core owns task and business state.

> Scope ruling (2026-09-06): the desktop overlay stays in the `1.0.0` product composition; the VR
> overlay is removed from `1.0.0` and kept as a post-`1.0.0` direction anchor (the v1.1 outlook —
> see item 7 of the [product boundary](../product-boundary.md) and the
> [development plan outline](../development-outline.md)). The VR path described below is the
> accepted design constraint set for when that direction starts; it is not a `1.0.0` scope
> commitment.

The first VR path is a separately built, explicitly started
SteamVR Dashboard helper using public `IVROverlay`. It receives display snapshots and returns actions
such as `next`, `back`, `dismiss`, and `open_on_desktop`; receives no assets, projects, credentials, or
general file capability; and uses bounded messages, version handshake, current-user restriction, and
process supervision. Unsupported runtime falls back to desktop.

Overlays never inject into VRChat, hook graphics/OpenXR, install VRChat-affecting API layers, inspect
VRChat process memory, modify EAC, or confirm account, safety, or upload UI. Public OSC input is
untrusted and cannot authorize local mutation.

## Document changelog

- 1.0.0 (2026-09-06): entered version management; added the scope-ruling note to the overlay
  boundary section (VR overlay removed from `1.0.0`, pointing to product boundary item 7 and the
  development outline v1.1 outlook); header normalized.
