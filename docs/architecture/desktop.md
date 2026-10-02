# Electron desktop and presentation architecture


> Document version: 1.5.0
> Status: Accepted
> Scope: `apps/desktop`, `packages/design-system`, frontend Gateway
> Updated: 2026-10-02
> Last conformance review: 2026-09-06
> Normative effect: Yes

## Technology decision

The desktop shell uses Electron; presentation uses React, TypeScript, and Vite. Electron Main hosts a
small Node.js Kernel. Kernel owns bootstrap, desktop security, Gateway, and Orchestrator Provider
lifecycle; React UI provides the controlled presentation surface, and Orchestrator, AMF, BDL, and
Unity Bridge retain their defined ownership. Built-in behavior wires directly to its owning
application use cases without a generic module registry or runtime composition framework.

## Process responsibilities

### Renderer

- Renders the local UI and owns temporary page/input state.
- Uses only the injected typed Gateway for commands, queries, and task actions.
- Imports presentation packages and the injected Gateway contract.
- Reads authoritative task, Recipe, and recovery state from Orchestrator snapshots.

### Preload

- Exposes a minimal explicit versioned API through `contextBridge`.
- Validates channel, request size, and caller origin.
- Exposes allowlisted application calls with typed request and response values.
- Gives remote pages an empty VUA capability surface.

### Main

- Owns windows, lifecycle, deep links, and updates.
- Separates local UI from Main-managed remote `WebContentsView` instances.
- Owns purpose-partitioned sessions and desktop enforcement for cookies, permissions, navigation,
  download transport, origins, destinations, types, and external protocols.
- Owns Kernel bootstrap, security policy, Provider hosting/supervision,
  diagnostics, and community-plugin host boundary.
- Hosts or supervises the selected Rust Orchestrator Provider and maps allowed calls to the versioned
  application contract without exposing its transport to the Renderer.
- Delegates AMF, Recipe, recovery, and compatibility behavior to application use cases.

Core catalog entries represent trusted behavior built directly into VUA and gain no authority through
runtime registration. The future community plugin host provides a separate capability context.

Main returns normalized navigation/download events through narrow ports and retains `Session`,
`WebContents` and `DownloadItem` handles. Browser storage owns cookies/tokens; they are not copied
into Main application state, Gateway, Orchestrator or Agent inputs. AMF owns acquisition intent, task and source
correlation, post-download inspection, and Warehouse/BDL decisions.

## Account-guide browser

The account guide opens official Steam/VRChat registration pages and optional Unity/BOOTH pages,
plus manufacturer, headset-store, streaming or accelerator pages required by the selected route.
Use the existing isolated built-in browser, with phone/headset/native-client handoff and saved
guide progress where needed. Reuse security enforcement; do not create an
Auth Broker service. Separate temporary account-guide partitions from AMF's BOOTH acquisition
profile and from one another except for required in-flow identity-provider navigation. Do not
persist these guide partitions; dispose/clear them when the guide session ends. Do not scrape
forms, intercept credentials, copy cookies, or log credential-bearing URLs/page content.

Main owns creating/discarding views and enforcing navigation, not an application credential store.
This responsibility split does not claim Electron Main is technically incapable of session access.
The local UI receives guide progress and user-declared completion only, not authenticated page data.
Official client or external-browser handoffs retain the existing per-action protocol confirmation.
If embedding fails, explain the fallback instead of bypassing platform restrictions. Users perform
registration, CAPTCHA, terms acceptance and account linking themselves. UI human acceptance covers
the flow and the distinction between opened, user-confirmed and actually detected outcomes.

The product boundary records later web-reading and experimental persistence intent; neither is
enabled by this first slice. Any future persisted profile needs explicit consent, local browser
storage and tested clearing/logout semantics, without secrets in application or Agent data paths.
This is intended architecture, not evidence that existing browser code already meets these cases.

## Deployment presentation

The [N1 delivery plan](../development/n1-delivery-plan.md) starts headset selection with brand and
model. The backend resolves official route requirements. Present cable/wireless questions only
where they affect the selected model, and keep optional alternative streaming choices explicit.

Silent installations retain a visible task. Render component, phase, real progress when exposed,
elapsed time, observed activity and required interaction. A UI timer is not installer evidence.
Extended inactivity exposes details and next actions. Reopening the page reads the existing task;
application restart uses the existing inspect-required recovery behavior. All copy uses i18n.

## Remote content isolation

Remote content uses `nodeIntegration: false`, `contextIsolation: true`, sandboxing, an isolated
session partition, and origin-scoped permission grants. Navigation and new windows follow the U9
four-way rule (user ruling 2026-09-09; browsing and downloads are separate tracks): navigation
inside the browsing allowlist proceeds directly; off-allowlist http/https navigation shows a
blocking confirmation first and then opens in the current embedded view (per-attempt confirmation,
no exempt-from-confirmation memory at any level); new windows are always denied, with http/https
popup targets redirected into the current embedded view (directly when allowlisted, after
confirmation otherwise); pseudo-protocol (`javascript:`, `data:`, `blob:`, `file:`, …) windows are
denied unconditionally; external protocols (`mailto:`, `steam:`, `vrchat:`, `discord:` and
`unityhub:` for the N1 installation handoff) go through a per-attempt dedicated confirmation before the system handler opens them —
the window-open details expose no gesture field, so the confirmation click itself is the explicit
user gesture and automatically triggered openings never execute without confirmation (a stricter
equivalent of the literal rule) — and unknown schemes are denied by default. The browsing allowlist and the
download host allowlist are strictly separate: browsing is lenient (off-allowlist content remains
reachable after confirmation; the list width only affects prompt frequency), downloads are strict
(download-host admission follows the "real-machine verification → per-domain proposal → user
approval" procedure; the download port filters by origin, and size, type, and source validation
belong to the AMF material-acquisition boundary). The capability surface contains standard web
APIs. AMF validates observed page data for type, size, and source before persistence.
Main-managed `WebContentsView` is the remote-content surface.

## Overlay always-on-top window

The desktop Overlay is a separate `BrowserWindow` inside the same Electron process (frameless,
transparent, absent from the taskbar, pinned at the `screen-saver` level; shape parameters come from
the slice-five spike conclusions). It shares the same `VuaDesktopApiV1` preload contract face with
the main window and, via the surface-routing parameter (`?surface=overlay-desktop`), renders only
the Overlay surface at the earliest application-initialization stage, without bootstrapping the main
shell Gateway, DEV scenario, or business stores. Failure isolation is carried by two layers: the
Orchestrator Provider is an independent supervised process, and an Overlay renderer crash is
isolated by the Electron process model — no separate Gateway connection instance is needed
(proposal 017 §4 desktop statement).

- Zero new event surface: application events broadcast to every locally-originated window by local
  origin checks, and Overlay windows are naturally on that list; snapshots are read by on-demand
  polling with no new subscribe/push semantics;
- No Overlay session identity: actions submitted from Overlay go through the existing command face
  with the same acceptance path and nine-state discipline; the service side does not distinguish
  whether an action came from the main window or an Overlay window;
- The entry is the formal main-window top-bar action (outside DevScenario); show/hide toggling is
  arbitrated by Main (the decision face is a pure, testable function in `overlay-window.ts`);
  showing never steals focus; closing the Overlay window itself only clears the reference (the next
  toggle recreates it), and closing the main window destroys the Overlay — main-window close keeps
  its application-exit semantics;
- Overlay only consumes stable snapshots and semantic actions and never becomes a business-logic
  host (AGENTS architecture constraints; the consumption split follows proposal 017; see the
  Overlay boundary section in integrations-and-overlays.md), and Overlay failures never block the
  desktop mainline (standing delivery rule). The
  Overlay read-face wire vocabulary lands with the core freeze batch; until then the rendered
  surface shows an honest empty state and never fabricates a session.

## React and release boundaries

React implements workbenches, guidance, cards, Recipe editing, feedback, and accessibility while
domain models remain in the application core. Typed error codes map to localized messages. Accepted tasks survive
page unload. Drag-and-drop always has keyboard and button alternatives. Tokens and components are
promoted only after real-page validation.

Electron, Chromium, Node.js, packaging, the selected Orchestrator Provider, and native dependencies
are version-locked. The independent supervised Provider executable is packaged and verified for the
supported Windows architecture according to the accepted hosting decision. Releases require
dependency/license review, Electron security checks, remote-permission tests, signing, and update
rollback validation. The redistribution review authorizes each bundled binary.

## Document changelog

- 1.5.0 (2026-10-02): describe model-first deployment, silent-install activity and device/service
  account handoffs using existing isolated browser and task surfaces.

- 1.4.0 (2026-10-01): allow the Unity Hub installation handoff under the existing per-action external-protocol confirmation.

- 1.3.0 (2026-09-30): specify isolated temporary account-guide pages and credential-free application state.

- 1.2.2 (2026-09-28): remove obsolete mirror metadata and clarify current ownership where needed during the N documentation audit.

- 1.2.1 (2026-09-28): erratum — two dangling M7 citations in the Overlay bullet replaced (the
  consumption split now cites proposal 017 and the Overlay boundary section in
  integrations-and-overlays.md; the gate-delivery parenthetical becomes a standing delivery
  rule); no rule change.
- 1.2.0 (2026-09-12): added the "Overlay always-on-top window" section — Overlay window
  creation/pinning/show-hide and the formal entry shape (proposal 017 §4 desktop statement landed;
  desktop-domain advance slice); the wire read face is honestly declared as not yet connected.
- 1.0.0 (2026-09-06): entered version management; header normalized and conformance-review date
  added. Content reviewed against reality with no change.
