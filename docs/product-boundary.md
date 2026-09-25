# VUA product boundary


> Document version: 1.5.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors product-boundary.md at 1.5.0)
> Scope: Entire VUA product
> Updated: 2026-09-22
> Normative effect: Yes

## Product definition

VUA is a Windows-first, local VRChat desktop production environment for players who want to move
from asset discovery and environment preparation through Avatar production and runtime-tool setup.
The core audience is VRChat players who are unfamiliar with Unity and may not even know what they
need (user ruling, 2026-09-22). It is Recipe-first, local-first, capability-aware, and designed
for recoverable execution: new users get a Wizard that selects a path by goal, device, and current
state instead of everyone being marched through one fixed master flow (end-to-end flow coverage
remains a valuable capability), while experienced users keep inspectable, reproducible production
records.

## Accepted product areas

1. **Electron desktop application:** React, TypeScript, and Vite renderer; isolated remote pages and
   sessions; download interaction; desktop windows; narrow Gateway.
2. **Orchestrator:** durable tasks, plans, approval, cancellation, recovery, Build Records, and
   adapter coordination behind a replaceable, versioned Provider boundary.
3. **Avatar MegaFactory:** owns the Warehouse, Recipe, Assembly, and Release user flows — check
   evidence is folded into production records and the notification center, and a standalone
   Inspection page is no longer required (user ruling, 2026-09-22; see "Production scope and
   product rulings"); native browsing, authorized downloads, content management, and
   external-source adapters;
   - **Material-entry semantics (user ruling, 2026-09-07; trigger-timing clarification with the
     W15 re-review, 2026-09-08):** the default path is direct use of the original
     `.unitypackage` (beginner-oriented positioning); the **target trigger timing** of "generate
     a VPM package as a replacement" is **at material import** (automatic generation, replacing
     the original UnityPackage); both it and "delete original material after generation" are
     **experimental** capabilities presented under the Settings-Experimental location; in the
     current version this automatic generation is **not yet wired** (honestly labeled in the
     UI) — generation is still started manually by the user from the warehouse entry, and the
     import-time hook and orchestration semantics land with the M5 wiring; VPM package
     generation results are always clearly distinguished from direct-import results
     (`unityValidated` vs experimental offline output);
   - and **BDL**, its private
   local catalog, terms, compatibility, source, search, and mapping module.
4. **Environment deployment:** prerequisite detection, guided deployment, and bounded recovery for
   hardware, VR, Unity, VRChat, and related tools without which play or Avatar production is blocked.
5. **Project management:** the most frequently used "project management" in VUA is actually the
   Recipe and Release modules; VUA's `vrc-get`-based package manager takes **Recipe-driven
   automatic resolution and import** as its primary form — it finds and imports the matching
   packages from a Recipe's inputs, rather than being a module where the user manually imports a
   series of plugins on first entry; manual per-package management is the secondary form (user
   reaffirmation and ruling U14, 2026-09-19). **Read-only compatibility** applies to
   ALCOM/VCC-managed projects, whose only write path is the user-initiated "import as a
   VUA-managed copy" (user ruling U3, 2026-09-08; allow/deny lists, copy spec, and tightening
   clause under Explicit boundaries; write capability against original projects is uniformly
   false within the `1.0.x` boundary). **Settings-face exception (user ruling U14,
   2026-09-19):** the VPM package-manager settings (the repository-subscription and
   local-package-registry faces of `settings.json`) are the same file shared with VCC/ALCOM;
   VUA may read and write it, and changes are visible to both sides immediately — this exception
   covers the settings face only; the project-file face keeps U3 unchanged.
6. **Unity Bridge:** a versioned deterministic protocol whose production target is exactly global
   Unity `2022.3.22f1`; historical editor projects enter through the documented migration boundary.
7. **Desktop overlay:** guidance, status, and runtime information through stable application
   services; part of the `1.0.0` product composition. **VR overlay:** removed from the `1.0.0`
   scope (user ruling, 2026-09-06) and kept as a post-`1.0.0` direction anchor (see the v1.1
   outlook in the [development plan outline](development-outline.md)).
8. **Integrated runtimes:** major optional native-feeling capabilities, including face tracking,
   motion tracking, and Avatar optimization, through managed or external-connection adapters.
   Implementation begins only after `1.0.0`.
9. **Community plugin interface:** a versioned protocol for optional enhancements and customization,
   with declared capabilities, lifecycle, tasks, permissions, and compatibility rules.

## Production scope and product rulings (user ruling, 2026-09-22)

> **This section is accepted product direction. It does not mean the related UI, protocols, or
> execution chain are implemented, and it is not a real-machine acceptance claim.** It supersedes
> conflicting older statements in this file and related documents (a fixed five-stage flow, the
> standalone Inspection page requirement, any implication that a Recipe fully reproduces arbitrary
> projects, and VUA exhaustively testing upstream capabilities). **Frozen protocols and existing
> data formats do not automatically change because of this documentation merge**; where change is
> needed, it lands through later versioned migrations. This section authorizes neither deleting
> existing data nor silently overwriting user projects.

### Confirmed scope

**Product positioning and beginner guidance.** The core audience is VRChat players unfamiliar with
Unity — including players who do not yet know what they need. End-to-end flow coverage remains
valuable, but a Wizard selects a path for the user by goal, device, and current state; no player is
required to walk one big flow. Device preparation adds Quest first-time-activation guidance and
distinguishes standalone use from PC-connected use. Guidance and tutorials never complete account
authentication or platform authorization on the user's behalf.

**Recipe = a stackable set of modifications.** A Recipe expresses an asset combination and explicit,
supported options, with semantics similar to a mod manager. A new Recipe stacks onto the current
Avatar; existing assets and settings it does not mention are preserved by default and must not be
deleted merely because they are absent from the new Recipe. Deletion must be an explicit action;
conflicts require explicit handling. A Recipe does not undertake full reproduction of arbitrary
Unity projects, scenes, or all hand-authored work.

Applying a Recipe to an existing Avatar offers four options: (1) Recipe settings win (supported
fields in conflict take the Recipe value); (2) Avatar settings win (conflicting fields keep the
current Avatar value); (3) create a new Avatar to carry the Recipe (recommended); (4) cancel. These
options cover only the fields the Recipe touches and do not authorize overwriting unrelated
content. Creating a new Avatar does not require creating a new Unity project, and adding, removing,
or changing assets on the same Avatar must not by itself demand a new project either. The ownership
limits of existing external projects (see the ALCOM/VCC clauses under "Explicit boundaries") apply
separately.

An object that cannot be identified is a different situation from a value conflict: "Recipe wins"
must not be used to paper over object-location ambiguity. And without a reliable baseline, not
every diff may be dismissed as a player's manual edit.

**Recipe sharing and reproduction boundary.** Shareable content = BOOTH asset references + clearly
supported boolean, enum, integer, and float options (for example color, brightness, hue, local
position, rotation, and scale). Not included: custom texture files, custom FBX, paid asset bodies,
and smuggling arbitrary content such as meshes or pixels into sharing by encoding it as numbers.
An SNS paste text and a file may carry the same declaration; the file itself may be nothing more
than long text and does not need to become a Unity scene package for that reason.

**Asset provenance (fill in at sharing time; as little as possible).** Import and local use do not
require entering a BOOTH ID immediately. Only when actually sharing, provenance is required only
for the assets this Recipe touches that lack it. The preferred flows are picking from the purchased
library or the product page, choosing from keyword-search candidate lists, and batch correlation —
typing in numbers one by one is not the default experience. Confirmed correlations are remembered
to avoid repeated work: human supplementation is as little as possible, as late as possible, and
never repeated once done. A BOOTH ID is the author's or user's provenance statement, not VUA's
certification of authenticity, unmodified state, or reproducibility. A wrong correlation is a
UGC-content responsibility; VUA still reports parse failures honestly and owns its own execution
and application errors. A reproducer re-acquires assets through their own BOOTH entitlement. A
provenance statement grants no purchase rights, and VUA is not required to prove the local package
is identical to the store original.

**BDL.** The existing base storage, asset identity, source correlation, and catalog capabilities
are retained. Automatic compatibility-evidence collection is an experimental feature, off by
default; when enabled it tries to collect evidence from the user's actual BOOTH browsing and Unity
usage, without reviving the whole-site cloud-collection direction. Turning automatic collection off
never disables base storage, ordinary import, or Recipe provenance supplementation. The direction
of local evidence viewing and correction is retained; the concrete UI and editable scope still need
definition and must not be derived into arbitrary database-edit rights. No evidence means unknown;
it must not be treated as compatibility or dependency being resolved.

**Inspection folded into production records.** A standalone Inspection page is no longer required.
When the user confirms production and the workshop starts intake, Release creates a placeholder
record for that run. Production problems surface through both the notification center and the record
status; both open the same explanation, logs, and follow-up actions. Closing a notification does
not make the problem go away. A placeholder record of a run in flight must never pose as a completed
Build Record. The page change removes none of the inspection services, recovery guards, or evidence
records.

**MA and SDK responsibilities.** Modular Avatar's declared capability boundary is accepted; VUA no
longer exhaustively tests everything MA can do. VUA validates its own integration, parameters,
object selection, call ordering, and representative real flows; issues also reproducible through
standard upstream use are reported upstream. Build and target-platform technical limits reuse the
official SDK checks instead of maintaining duplicate rules. Missing assets, dependency
installation, Bridge execution, and recovery remain VUA's responsibility. A check that did not run
must never display as passed. The final upload is performed by the user in the official SDK;
technical checks cannot guarantee that appearance and behavior match player expectations, and this
must be stated clearly.

### Explicitly deferred

An independent lightweight UI based on egui, Slint, or similar frameworks is deferred indefinitely
until core functionality is stable; no start date is promised. This deferral does not cancel the
existing Electron resource-saving mode.

### To be verified / undecided

The following items are **undecided**; nothing in this section's wording implies any of them is
resolved:

- **Object location (undecided):** same-name bones, cross-project location, and repeated
  application require real-machine verification; the current approach must not be assumed reliable.
- **Recipe fields and encoding (undecided):** the product capability is decided; the field
  whitelist, location identifiers, and versioned format are not.
- **Conflict-handling implementation (undecided):** the four options are decided; diff detection,
  preview, and protection need implementation verification.
- **Dependency degradation path (undecided):** how dependency completion is accomplished when
  automatic forensics is off or resolution fails still needs a concrete flow.
- **BDL human correction (undecided):** the viewing/correction direction is retained; concrete
  permissions and interaction are not yet frozen.

## Extension and integration trust boundary

VUA classifies extensibility by data access and trust:

| Boundary | Product meaning | Access rule |
| --- | --- | --- |
| Kernel and local UI | Stable application bootstrap, security authority, Gateway enforcement, and controlled presentation surface | Extensions consume their published surfaces |
| Core | Repository-owned, reviewed product behavior built directly into the trusted application and release | Uses owned Orchestrator application use cases and ports |
| Plugin | Separately packaged enhancement using the public, versioned capability boundary | Explicit grants define its complete authority |
| External | Independent software interacting with Unity, VRChat, SteamVR, devices, or another public external boundary | Maintains independent state; each VUA-side adapter is classified as Core or Plugin |

Environment deployment, tracking, optimization, accessibility, and appearance are described as
natural-language purposes inside each entry. The community-maintainable
[tool catalog](tool-catalog/README.md) records classification and evidence for individual entries.
The product boundary approves scope, architecture approves implementation ownership, and the release
gate derives risk from declared capabilities and behavior.

## Stable product principles

- **Recipe-first:** select assets and intent before creating or modifying a Unity project.
- **Local-first:** purchase sessions, orders, downloads, paid assets, and production state remain on
  the user's device.
- **Deterministic production:** normalizable Unity work is reproduced through Unity Bridge and Build
  Records.
- **Capability-aware:** official, open-source, and community tools coexist through adapters; the UI
  reports the actual available capability.
- **Recoverable:** long-running tasks define state, cancellation, retry, recovery, and manual handoff.
- **Least privilege:** remote content, plugins, and third-party components receive only required
  capabilities.

## Explicit boundaries

- BDL is AMF's private local data module in this repository; AMF provides its application services.
- Electron Main owns remote-page, Session, Cookie, permission, and download transport mechanisms and
  their desktop security enforcement. AMF owns acquisition intent, durable tasks, source validation,
  file inspection, and Warehouse mapping. Their boundary exchanges normalized application values.
- BOOTH sessions, orders, purchased files, and credentials stay on the user's device; platform
  purchase, payment, identity, age, and access controls remain authoritative.
- Repository and cloud-CI tests use synthetic fixtures that match production input structures without
  containing real product or user content.
- Local read-only compatibility tests may access public BOOTH pages through the platform's normal
  public entry points while respecting authentication, payment, age, and access controls. Page
  responses, screenshots, and product metadata are not committed as test fixtures.
- Developers may run local integration and smoke validation with Unity assets they lawfully obtained
  or purchased. Those assets, user projects, test configuration, and outputs stay local and do not
  enter the repository or cloud-CI artifacts.
- [Unity editor compatibility](compatibility/unity-editor.md) defines global `2022.3.22f1` as the
  sole production target. `2019.4.31f1` and `2022.3.6f1` are migration sources. Other Unity versions
  report their exact difference from the production target while project files remain unchanged;
  Tuanjie Engine is currently unsupported.
- **ALCOM/VCC project compatibility (user ruling U3, 2026-09-08, after third-party arbitration
  review):** read-only against ALCOM/VCC-managed original projects. **Allowed:** discovery and
  identification; reading version/package/SDK/compatibility/environment state; generating
  diagnostics, plans, and handling suggestions; handing write operations off to the owning
  manager; "import as a VUA-managed copy" after explicit user choice. **Denied:** installing or
  removing packages inside the original project; modifying its manifest, project configuration,
  assets, or `.vua` job files; writing ALCOM/VCC registries, databases, settings, or caches;
  silently relabeling the original project as VUA-managed. **"Import as a VUA-managed copy"
  spec:** new project path + new project identity; estimated disk usage shown up front; no
  copying of regenerable directories or legacy task state; re-Inspect after import (the original
  project's confirmations/snapshots are not inherited); the source relationship is kept so the
  user can go back. **Rationale:** VUA's project lock coordinates VUA instances only — ALCOM/VCC
  do not honor it, so "allow writes + warn about conflicts" would promise a safety that does not
  exist; both sides understanding the VPM format does not mean they share compatible transaction
  and recovery mechanics. **Tightening clause:** within the `1.0.x` boundary, write capability
  against ALCOM/VCC-managed projects is uniformly false; it may only be opened later through a
  **new user ruling** once the upstream offers verifiable transactions/locks/a supported write
  interface — warnings alone are not sufficient. **Settings-face exception (user ruling U14,
  2026-09-19):** the deny-list item "writing ALCOM/VCC registries, databases, settings, or
  caches" is waived for the VPM package-manager settings file (the repository-subscription and
  local-package-registry faces of `settings.json`) — that location is the shared settings
  convention of VCC/ALCOM/vrc-get, and VUA is opened for read/write with changes visible to both
  sides immediately; all other storage faces such as `vcc.liteDb` stay denied, and the
  project-file face keeps U3 read-only with clone-then-modify-the-copy as the default external
  import path.
- **Remote web browsing and window/protocol boundary (user rulings U7② + U9, 2026-09-09):**
  Web browsing follows an **allowlist-first** policy — allowlisted domains browse directly;
  non-allowlisted domains are **prompted but never blocked** (content stays reachable after
  confirmation). **The purchase flow is out of scope for now** (not permanently; depends on
  future contact with BOOTH officially); download host domains are **proposed and approved
  domain by domain** after real-machine verification. New windows and external protocols
  follow a **four-way split**: (1) web-class new windows (http/https) never open a separate
  window — allowlisted targets open in the current embedded view, non-allowlisted targets
  open in the current view after a confirm prompt; (2) pseudo-protocol windows
  (`javascript:`/`data:`/`blob:`/`file:`) are rejected unconditionally with no override path;
  (3) external protocols pass through a **dedicated confirmation layer**: non-allowlisted
  http/https prompts first and then hands off to the system browser; explicit protocol lists
  such as `mailto:`/`steam:`/`vrchat:`/`discord:` show a per-invocation confirmation dialog
  with the full target and never offer a permanent skip; unknown protocols are denied by
  default; (4) **gesture requirement:** protocol launches must originate from a user click;
  page-triggered launches (script/meta refresh) never execute; native new-window creation is
  denied unconditionally. **Rationale:** content reachability (prompt, don't block) and local
  privilege isolation (no separate windows, no unconfirmed protocol launches) hold together;
  remote content never gains local privilege (see "Extension and integration trust boundary").
- Every optionally bundled component requires an individual license, redistribution, update, and
  signature review.
- EAC process termination is an experimental high-risk recovery action, disabled by default and
  confirmed on every execution. It may cause game interruption, abnormal EAC state, or in extreme
  cases platform/account safety checks and account anomalies. It is limited to verified allowlisted
  user-mode residual processes and never disables services/drivers, modifies EAC/VRChat files, or
  bypasses anti-cheat.
- The first delivery phase supplies the capability protocol and security model; marketplace
  governance follows a later release decision.
- Final VRChat Avatar login and upload remain a user action in the official SDK flow; VUA prepares
  and validates. A technical check passing does not guarantee appearance and behavior match player
  expectations (this must be stated clearly to the user), and a check that did not run must never
  display as passed (user ruling, 2026-09-22).

## Current stage

The project is in pre-alpha. Component ownership is effective now; versioned and locally tested
protocols govern implementation. Runtime-tool integration begins after `1.0.0`. The repository
license is Apache-2.0 and the public
contribution policy is defined in the root contribution guide. Release signing and update design
remain release-engineering decisions.

## Document changelog

- 1.5.0 (2026-09-22): the full user ruling of 2026-09-22 landed — new "Production scope and product
  rulings" section (confirmed scope: beginner Wizard and Quest guidance, Recipe as a stackable set
  of modifications with four conflict options, sharing and reproduction boundary, provenance filled
  at sharing time, BDL base capabilities retained with experimental forensics off by default,
  Inspection folded into production records, MA/SDK responsibilities reusing upstream checks;
  explicitly deferred: an egui/Slint lightweight standalone UI; five to-be-verified items listed as
  undecided); AMF composition item 3 no longer lists Inspection as a user stage; the SDK-upload
  boundary clause gains the technical-check limitations and honest display of unexecuted checks;
  prominent notice that the section is accepted direction, not an implementation or real-machine
  acceptance claim, and that frozen protocols and data formats do not automatically change.
  Mirrors the ZH edition.
- 1.4.0 (2026-09-19): U14 user ruling landed in the boundary — project-management item 5
  reaffirmed: the most frequently used "project management" in VUA is actually the Recipe and
  Release modules; the package manager's primary form is Recipe-driven automatic resolution and
  import (finding and importing the matching packages from a Recipe's inputs), with manual
  per-package management as the secondary form; a settings-face exception is opened: the VPM
  package-manager settings (the repository-subscription and local-package-registry faces of
  `settings.json`) are shared with VCC/ALCOM as one file, VUA may read and write it, and changes
  are visible to both sides immediately; the project-file face keeps U3 unchanged — external
  import still defaults to clone-then-modify-the-copy and original projects stay read-only.
  Mirrors the ZH edition.

- 1.3.0 (2026-09-09): U7② + U9 user rulings landed in the boundary — a new Explicit-boundaries
  clause, **remote web browsing and window/protocol boundary**: allowlist-first browsing,
  non-allowlisted domains prompted but not blocked; purchase flow out of scope for now (not
  permanent); download host domains proposed and approved per domain after real-machine
  verification; the four-way split for new windows/external protocols (web-class new windows
  never open separate windows; pseudo-protocols rejected unconditionally; external protocols
  via a dedicated per-invocation confirmation layer without permanent skip; gesture requirement
  plus unconditional denial of native new-window creation). Mirrors the ZH edition.

- 1.2.1 (2026-09-08): trigger-timing clarification (W15 second-round re-review fix item) — the
  target trigger timing of "generate a VPM package as a replacement" is **at material import**
  (automatic generation); not yet wired in the current version (honestly labeled in the UI),
  generation still starts manually, and the import-time hook and orchestration semantics land
  with the M5 wiring. Mirrors the ZH edition.
- 1.2.0 (2026-09-08): U3 user ruling landed in the boundary (after third-party arbitration
  review) — project-management item 5 becomes read-only compatibility with ALCOM/VCC-managed
  projects plus the single write path "import as a VUA-managed copy"; a new Explicit-boundaries
  clause adds the allow list (discovery/identification, reading version/package/SDK/
  compatibility/environment state, diagnostics/plans/suggestions, write handoff, copy import),
  the deny list (install/remove packages in the original project, modifying manifest/
  configuration/assets/`.vua` job files, writing ALCOM/VCC registries/databases/settings/caches,
  silent relabeling), the five-point copy-import spec (new path+identity, upfront disk estimate,
  no copying of regenerable directories or legacy task state, re-Inspect without inheriting
  confirmations/snapshots, source relationship kept), the rationale (VUA's project lock
  coordinates VUA instances only; cross-tool locking is not feasible; "allow writes + warn" is
  not a real guarantee), and the tightening clause (write capability uniformly false in `1.0.x`;
  future opening only via a new user ruling). Mirrors the ZH edition.
- 1.1.1 (2026-09-08): terminology fix (hard user ruling, 2026-09-08) — VPM = VRChat Package
  Manager (the manager), VPM package = the managed package; in the item-3 material-entry
  semantics, "generate VPM as a replacement" and "VPM generation results" became "generate a
  VPM package as a replacement" and "VPM package generation results". Mirrors the ZH edition.
- 1.1.0 (2026-09-07): added the material-entry semantics clause to the AMF composition item —
  the default path is the original `.unitypackage`; "generate VPM as a replacement" and "delete
  original after generation" are experimental, presented under Settings-Experimental (user ruling
  2026-09-07). Mirrors the ZH edition.
- 1.0.0 (2026-09-06): entered version management. Item 7 split into the desktop overlay (retained
  in the `1.0.0` composition) and the VR overlay (removed from `1.0.0`, pointing to the v1.1
  outlook in the development outline); all other items unchanged.
