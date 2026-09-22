# VUA design standard v0.7.19

[English](design-standard_EN.md) | [简体中文](design-standard_ZH.md)

> Document version: 0.7.19
> Status: Accepted
> Authoritative language: Simplified Chinese (EN is the mirror, synced to 0.7.19)
> Scope: Electron desktop, desktop overlay, and VR overlay presentation  
> Updated: 2026-09-22
> Normative effect: Governs interaction, visual, and accessibility implementation;
> does not expand product scope or replace versioned application contracts

## 0. Position of this version

v0.6.1 combines UI/UX and visual-art direction into one normative source.

| Treatment | Content |
| --- | --- |
| Retain | goal before terminology, Recipe-first, explicit state, recovery first, honest progress, user-content priority, dark-first, VUA purple/AMF orange jurisdictions, 4 px grid, semantic tokens, workshop-track metaphor, fixed five-tab shell, command-center composition, slanted tab language, transparent overflow flyout, sidebar growth impression, three motion levels, WebGL three-scene direction, Recipe graph/list/exploded views, Release coverflow and 3D pedestal, community-skin direction, WCAG 2.2 AA and APG gates |
| Standardize | Windows and Fluent 2 desktop behavior; macOS native-tool texture as a visual reference; Carbon as information-structure reference only; global success/warning/error colors while reserving large traffic-light treatments for environment deployment; tokenized motion; transform-only sidebar growth; Electron mechanism + AMF use case for browsing/download; the five AMF stages kept as the full capability coverage (since 0.7.19 a wizard selects the path by goal/device/state — see Recipe-first) |
| Replace | framework-private Tauri window/IPC semantics, BDB contracts, a separate Production stage, globally disabled context menus, font-size or padding reflow on hover, deceptive progress floors, paid font or icon assumptions |
| Schedule separately | Visual direction remains part of v0.6.1. Delivery sequencing, performance gates, and fallback acceptance are reviewed independently from the design decision. |

## 1. Experience position

VUA is a reliable production assistant for players: friendlier than enterprise administration,
more professional than a game launcher, and more restrained than an enthusiast utility. It is not a
high-saturation cyber dashboard or an Office-style management application.

The visual system has four layers: predictable Windows desktop behavior; compact spacing, restrained
translucency, precise typography, and quiet surface hierarchy inspired by macOS native tools; a
near-black purple workshop atmosphere with restrained purple/orange ambient light, degradable WebGL,
and limited glass; and task narrative such as tracks and real task events only when they explain real
work. The macOS reference does not change Windows behavior. Atmosphere never carries the only
information. Disabling blur, glow, WebGL, and motion must preserve hierarchy and operation.

## 2. Product experience principles

### Goal before terminology

Ask for the desired result before introducing Unity, VPM, Armature, Shader, and other necessary terms.
Recommendations explain why, impact, and alternatives.

### Recipe-first and path selection

AMF still covers the five stages — Warehouse, Recipe, Assembly, Inspection, and Release — but no
longer forces every player through one fixed grand flow. A production wizard selects the path by
goal, device, and current state, walking only the stages that production actually needs (0.7.19,
user ruling 2026-09-22 — accepted direction, not yet implemented). The full flow remains valuable
for troubleshooting and experienced users as an optional path, not a mandatory one. Guidance does
not replace account authentication or platform authorization; the Quest first-time activation
tutorial distinguishes the standalone mode from the PC-connected path.

Execution, input waits, retry, and recovery are task states inside a use case, not a Production stage.

### Explicit facts and recovery

The UI identifies the current goal, object, saved state, task state, blocker, recovery condition, and
next action. Unknown and unavailable remain explicit. Fixtures are visibly demo data. Ordinary edits
have undo or a clear reverse operation. High-impact work explains scope, time, disk impact, snapshot,
and recovery before execution. Renderer reload never loses an accepted task.

### Progressive expertise and content priority

New users receive explanatory guidance; experienced users receive workbenches, shortcuts, batches,
and dense views. Both invoke the same use cases. Avatars, outfits, previews, Recipes, and Build Records
are the content; chrome does not obscure them or recolor third-party brands as VUA.

## 3. Platform and information architecture

| Scope | Baseline |
| --- | --- |
| Windows windows, focus, common controls | Microsoft Fluent 2 |
| Tables, trees, filters, batch work | IBM Carbon information structure, not its visual skin |
| Accessibility | WCAG 2.2 AA |
| Composite keyboard behavior | WAI-ARIA APG |
| Usability review | Nielsen's ten heuristics |

The shell fixes five primary tabs at the top: **Command Center**, **Environment Deployment**,
**Game Guide**, **Tool Collection**, and **Avatar Production**. Settings remains at the far right.
Changing this top-level information architecture requires an explicit product-and-design decision;
module count alone does not silently rewrite it.

Primary tabs retain the original slanted language: the visual shell uses `skewX(-12deg)` while the
label is counter-skewed, and selected or pressed states read as physical engagement. The responsive
ladder is full labels, compact labels, then a transparent overflow flyout that carries the original
tab controls rather than replacing them with an unrelated menu style. The flyout still follows APG
keyboard behavior, exposes focus visibly, and becomes static when reduced motion is requested.

The current area's index remains at the left; an available task center remains at the bottom; and
content scrolls in its own container. Sidebar items retain the original visual impression of growing
and shifting toward the user, implemented with transform and a stable layout slot. Font size and
padding remain fixed during hover and selection so adjacent items never move.

Custom title bars retain Windows drag, maximize, system-menu, scaling, and control expectations.
Remote pages visibly identify origin and security boundary and never imitate a local form.

**Guided pages** show goal/progress, one decision or conclusion, necessary explanation, then
back/continue. **Workbenches** arrange goal/commands, object/filter area, central workspace, Inspector,
and task/diagnostic surface. Dialogs are for immediate decisions or high-impact confirmation only.

## 4. Design tokens

Business components use semantic tokens rather than literal colors, shadows, or arbitrary spacing.
When `packages/design-system` exists, its tokens are a machine-checkable mirror of this section.

### Color

| Semantic | Dark | Light | Use |
| --- | --- | --- | --- |
| Canvas | `#0B0A12` | `#F6F6F9` | application canvas |
| Panel | `#151322` | `#FFFFFF` | ordinary surface |
| Elevated | `#1E1B30` | `#FFFFFF` | menu, dialog, flyout |
| Strong text | `#F5F3FF` | `#191824` | heading and body |
| Secondary text | `#B3B0C8` | `#565470` | secondary information |
| Border | `#2E2A45` | `#DAD9E2` | 1 px separation/control boundary |
| VUA accent | `#A78BFA` | `#6557D2` | environment, navigation, settings, general app |
| AMF accent | `#FF7A45` | `#BB4A10` | five AMF stages |
| Success | `#4ADE80` | `#107C10` | success, pass, available |
| Warning | `#FDE047` | `#9C6D00` | attention, confirmation, non-blocking risk |
| Error | `#FB7185` | `#D13438` | failure, blocker, quarantine |
| Info | `#94A3FF` | `#5F6B8A` | neutral information |

Purple and orange communicate jurisdiction, selection, and primary action—not success or failure.
Semantic states always include text or icon. One page has one primary jurisdiction color. Body text
meets 4.5:1; large text, focus, icons, and control boundaries meet 3:1; forced colors map to system
colors.

### Typography, spacing, and elevation

```text
"Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", sans-serif
```

Caption `400 12px/16px`; Body `400 14px/20px`; Title `600 20px/28px`; Display `600 28px/36px`.
Structured data uses `ui-monospace, "Cascadia Mono", Consolas, monospace`; versions and counts use
tabular numerals.

- Grid: 4 / 8 / 12 / 16 / 24 / 32 px.
- Compact controls: 28–32 px; comfortable: 36–40 px; primary pointer interior at least 32×32 px, with
  WCAG's 24×24 px only as the floor.
- Pill radius for primary buttons/status chips; inputs/menus 6 px; cards 10 px; dialogs 12 px.
- Default 1 px borders; no shadow on ordinary panels/cards; subtle shadow only for elevated surfaces.
- Blur is limited to top/side/task/elevated structure, never card walls, tables, or long lists.

## 5. Component standard

The initial system covers Button, Icon Button, Text/Number Field, Combo Box, Tabs, Menu, Dialog,
Drawer, Toast, Inline Notification, Task Item, Progress, Badge, Skeleton, Empty State,
Inspector Row, Tree, Table, and Graph primitives. Applicable components cover default, hover, pressed,
focused, selected, disabled, loading, error, warning, and success.

Disabled critical actions expose a discoverable reason. Dialogs have a visible named close/cancel
action. Icons use a consistent 16/20/24 px line style and accessible names; unfamiliar icons include
text. Context menus only supplement expected object actions and never remove native text editing;
every action has a button, keyboard, or Inspector alternative. Components own no Recipe, permission,
recovery, or compatibility rules.

## 6. Interaction and feedback

- Standard shortcuts: `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+S`, `Ctrl+P`, `Enter`, `Esc`, `F2`, `Delete`, only
  where the real capability exists and without overriding text/system conventions.
- Menu, Tabs, Tree, Grid, Dialog, and Combo Box follow APG keyboard patterns. Focus returns to a
  sensible trigger after closure. Drag-and-drop always has keyboard and button/menu alternatives.
- Save states: saved, unsaved changes, saving, save failed.
- Task states: queued, preparing, running, awaiting input, paused, completed, completed with warnings,
  failed, cancelled. Tasks show origin, stage, actions, warning/error, and navigation to requested input.
- Once action-triggered computation, inspection, or planning shows busy feedback, keep that visual
  treatment visible for at least 700 ms to avoid flashing. Media loading is exempt. Real completion,
  safety, and error facts enter task state immediately; the 700 ms rule only controls the visible busy
  treatment and is implemented by a shared token or hook rather than page-local timers. Determinate
  progress requires a real total/time source. A monotonic floor applies only inside one stable task
  stage; replanning or restart creates an explicit new stage/task instead of visually hiding regression.
- Skeletons mean layout loading only. Refresh keeps old list results when possible.
- Errors explain event, affected object, known cause/missing condition, next step, and retry/undo/recover
  status. Codes and technical detail live in expandable diagnostics.
- Package, project, Unity, and batch changes present Inspect → Plan → Confirm → Execute → Validate,
  including full changes, conflicts, removals, and recovery conditions.

### 6.1 Notification-center semantics (v0.6.2)

The task center presents as a **notification center**: active tasks are always notifications;
tasks that reach a terminal state (completed / completed-with-warnings / failed / cancelled) no
longer appear as notifications by default; a "show completed" switch keeps historical terminal
tasks reachable; a per-item "clear" removes only the notification presentation (preference
persisted) - the task authority remains queryable through the task list and detail surfaces.
Clearing removes the notification, not the fact. A failed notification must use a glyph that is
semantically distinct from the dismiss/close ✕ (e.g. a circled exclamation mark).

### 6.2 Experimental feature presentation (v0.6.3)

Experimental features live on the "Settings - Experimental" page (W15 rework form: one card =
title + subtitle + warning strip + toggle rows). Rules:

- A toggle backed by a frozen protocol (e.g. "Generate VPM replacement" writing
  warehouse.setGlobalDefaultMode) is a **server-behavior toggle**: its state follows the server
  read-back/receipt; the presentation never fabricates state, and an unreadable initial value is
  labeled honestly instead of guessed;
- A toggle depending on an unfrozen protocol (e.g. "Delete originals after generation") is an
  **unwired preference**: permanently labeled unwired, toggling records intent only and triggers
  no server behavior; enabling it requires the danger confirm dialog, and DEV/fixture faces add
  the prototype note;
- An unwired preference combined with a danger toggle must be master-gated (the danger toggle is
  disabled while its master switch is off);
- Feature entries carry the "Experimental"/"Danger" badges; the presentation never weakens
  guards, and direct commands are still adjudicated by the versioned protocol;
- Destructive actions inside an experimental entry keep the danger styling and delayed
  confirmation (§6.4/§8.1).

## 7. Motion and asset discipline

| Token | Duration | Use |
| --- | ---: | --- |
| Instant | 0 ms | degradation and immediate replacement |
| Fast | 120 ms | hover, pressed, focus support |
| Normal | 180 ms | drawer, menu, local reveal |
| Slow | 360 ms | cards, modules, and rare causally related staged entrances |

Default staged easing is `cubic-bezier(0.2, 0.9, 0.25, 1)`. Motion uses opacity/transform rather than layout.
Reduced motion removes translation, scale, parallax, and loops, leaving at most 120 ms opacity.
`data-effects="off"` disables decorative motion, glow, blur, and optional canvas effects without
changing function. Infinite motion is reserved for real active state/loading, restrained breathing,
and low-frame mascots and pauses offscreen/unfocused/inactive. Three WebGL scenes are part of the
v0.6.1 visual direction: a nebula canvas for the dark application background, a holographic core for
the Command Center, and a three-dimensional pedestal for Release. Each scene provides
off/static/animated tiers, a CSS fallback, context-loss recovery, a measured performance budget, and
offscreen/unfocused pause behavior. Light, forced-colors, resource-saving, and reduced-motion modes
follow the same degradation chain. Pointer tilt and spotlight are animated-tier card enhancements;
tokens bound their angle and opacity, while keyboard, touch, reduced-motion, and effects-off receive
stable untilted cards.

## 8. Module visual language

- **Command Center:** a sidebar-free constant landing point and the first brand impression. The VUA
  wordmark, holographic core, `Ctrl+P` command entry, four module shortcut cards, and environment
  status band form one composition. The core supports animated/static/off modes and a CSS fallback
  that preserves every entry and status fact. This is the only page where low-opacity purple and
  orange atmosphere may coexist; controls still use one primary jurisdiction color.
- **Environment:** conclusion-first repairable status. Large red/green/amber lights are unique to this
  area; undetected is neutral; play and production environments are evaluated separately.
  Mutually exclusive alternatives (brand VR runtimes and streaming apps) collapse into one
  "any one" group card (v0.7.2): once any member is detected the group is ready, and the
  remaining absent members render as neutral optional facts, never warnings; when none is
  detected, the whole group counts as a single pending item. Detection failures stay visible
  as failures at the member row and are never downgraded by group satisfaction.
- **Warehouse/acquisition:** remote browsing, authorized download, and local Warehouse form one path.
  Remote origin/session boundary is explicit; 1:1 media cards keep user content primary. BDL is not
  directly exposed. Unchecked `LocalArtifact` values are pending/quarantined; executables are listed,
  never offered a run action. Animated mode may add a restrained pointer spotlight and tilt to cards;
  all other modes retain stable cards with identical selection, detail, and keyboard behavior.
  Layout (v0.6.2/W13): the card wall adapts its column count to the window width; the entry detail
  is a dedicated right-hand panel (own scroll, sticky header), not a drawer that squeezes the wall;
  narrow windows stack it below. Artifact-mode semantics (v0.6.3, W15 walkthrough ruling;
  novice-first): the original UnityPackage is the default; the global behavior is written by the
  "Generate VPM replacement" toggle on the Settings-Experimental page (frozen
  warehouse.setGlobalDefaultMode, §6.2), with the effective mode always read back from the
  server; per-entry mode editing and generate/delete entries inside the warehouse entry details
  mirror the entry facts and carry the experimental badge; "Delete originals after generation"
  is an unwired preference (proposal 008), permanently labeled unwired.
- Material import is a content dialog inside the warehouse page (0.7.12, user
  ruling 2026-09-20; dedicated import tab since v0.7.0, proposal 015
  reconciliation accepted; IMP-1): the "one continuous acquisition path" keeps
  its two sections — a cloud section (embedded browsing and catalog mode as
  parallel discovery entries, plus a per-batch adopt-into-warehouse entry for
  completed downloads) above a local section (system folder pick →
  confirmation list → single command → task center), both landing in the same
  warehouse entry model; what changes is the hosting: instead of a dedicated
  "Import" page, a wide content dialog (internal scroll, Esc/backdrop close,
  title bar + close button) opens from the warehouse page hero — closing the
  dialog unmounts the component and closes any in-flight embedded view, so the
  "component is the view's only control surface" lifecycle semantics stay
  unchanged; the sidebar drops the warehouse/workshop/packages group labels,
  making production a flat ungrouped list like every other module; the
  embedded browse area permanently shows the "VUA embedded browsing · Session
  isolated" badge, and the isolation red lines (sandbox / no preload /
  separate partition / standard Web APIs) remain untouched item by item;
  platform pages render as-is with zero purchase-flow UI; the
  `desktop.remoteBrowser` capability is two-state — it flips only when
  embedded browsing works end to end, and unwired entries stay permanently
  labeled unavailable (a plain unavailable note with no alternative action —
  under the U9 four-way split, http/https popups open in the current embedded
  view, so no "hand off to the system browser" degradation path exists).
- **Recipe:** the composing draft is a content dialog inside the recipe page
  (0.7.12, user ruling 2026-09-20; standalone page since batch 019 B): the
  project-independent drafting starting point mounts the former "Composing
  draft" page as a dialog behind the recipe page hero entry — draft state lives
  in the container layer (shared across UI roots), so opening or closing the
  dialog never destroys it; the save chain and production chain semantics are
  unchanged.
- Recipe page as the production hub (0.7.15, U16 user-ruling consumption slice
  1, proposal 029 A4/A5): the library selection is the preview subject —
  selecting a library document loads the three views through the document
  mapping, and the chain identity becomes ready with the selection. The
  selection is a production-chain fact-source action: the chain identity keys
  come only from the document identity of the recipe.get read receipt (the
  receipt's TOP-LEVEL required identity fields recipeId/revision —
  store-authoritative, not the transparent recipeDocument body itself; the
  body need not carry a revision), never from list labels
  or local guesses (UI-02 "chain identity is object identity" extended to the
  selection fact source); a changed document identity means a new chain — the
  previous chain's task/record identities step aside. The selected state offers
  the "assemble" initiation face: the production chain section double-mounts in
  the recipe page selected state and the composing-draft dialog, consuming the
  same container-layer store and Gateway port (batch 019 C two-UIs-one-store
  precedent), advancing resolve → plan → approve → execute; plan approval keeps
  the production-use-case v0.2 plan.approve idempotent wording (request face is
  the single key {planId}); a risk decision is not part of this face (if ever
  needed it is a v0.2→v0.3 version-bump matter for the core freeze ring — the
  desktop invents nothing and smuggles nothing in). The stale-authorization
  gate (stale-draft) holds only while a composing draft is present and its
  content deviates from the saved revision; a selection-driven chain with no
  draft present is ready. The workshop consumption face is covered in §8.5
  (0.7.16). **Word
  discipline (#44×U16, codified for the first time)**: the user-action wording
  is "assemble" (组装 — including the chain card's execute button and other
  user-operation copy); "装配" (assembly) is reserved for wardrobe mounting and
  the AMF Assembly stage semantics (stage names, pipeline stage diagrams, and
  stage-event copy do not migrate).
- Create and add assets (0.7.17, U16 user-ruling consumption slice 3, proposal
  029 A1/A2/A3 local segment): the recipe page hero main path offers a
  "Create" entry (worded 创建 per the U16 ruling text; never mixed with
  "add assets"/"assemble"), opening the composing-draft dialog — the draft
  dialog remains one of the creation starting points and the two-UIs-one-save-
  chain discipline holds (batch 019 D); creation products enter the recipe
  library and can be selected (save receipts already trigger library
  invalidation refetch, landed in slice 1). The selected state offers an
  "Add assets" action: writing into the selected recipe's asset set rides the
  recipe.save version chain (baseRevision chain + pre-save dedup D5 + busy
  guard — the same save-chain shape and the same guard set as the composing
  draft; the document-edit chain takes the parallel-document-edit-chain form,
  independent state from the project-independent draft chain, per shape-ruling
  checkpoint 2 of judgment 4); pending additions and saved facts are presented
  separately — the three views keep rendering the SAVED document from the
  recipe.get receipt, and "saved" appears only after the persistence receipt —
  local edits never masquerade as saved (honesty laws 1/2); failures are
  presented as failures, pending additions are kept, and retry is explicitly
  user-initiated. The asset picker is a projection of the warehouse read face
  (acquire entries): it presents local warehouse entry facts only and honestly
  marks entries already in the recipe; asset ingestion still uses the two
  existing import paths on the import page (embedded browsing / system pick →
  task center) — no third import entry is created for the recipe page (§8.3
  discipline holds); cloud asset access (pending item 3 = BOARD #46, linked to
  proposal 030 / U18) stays honestly absent until a ruling lands — no invented
  cloud entry; read face absent / empty warehouse / no match render as honest
  empty states.
- Export a draft from a project (0.7.18, U16 user-ruling B-face loop 4
  desktop consumption, proposal 029 B4): the recipe page hero action row gains
  an "export draft from project" entry (recipe-export v0.1 frozen word-table
  consumption; reverse direction project -> recipe). The pick stage is limited
  to the VUA-registered project set (project.listProjects 013 aggregate
  read-face projection) with no arbitrary path input; stale registrations
  (path missing) are honestly badged and disabled; service not connected / no
  registrations render honest empty states. The confirmation stage presents
  the draft's six fact keys as-is: origin (path / nullable name = honest
  absence / VUA-native identity tri-state - an applicability fact, never a
  gate; the absent-identity difference prompt stays open as pending item 2);
  the environment version verbatim from the on-disk observation with no
  migration, completed explicitly by the user when unreadable and never
  filled by the system (the missing list's environmentUnityVersion
  dimension); declared dependencies verbatim (an empty array is the honest
  answer; locked pins are presentation-only - the recipe's locked block is
  minted by the save/resolve chain and a draft never fabricates one); the
  missing-dimension list rendered as-is - the export never claims to recover
  design intent, and "what is missing" stays honestly readable. Promotion =
  explicit user completion (a title - the draft has none; a projectName
  prefill is labeled as such and freely editable; at least one asset - the
  draft has zero relation face, the picker is the same warehouse read-face
  projection as add-assets; the environment constraint - only when
  unreadable) riding the standing recipe.save save chain (same save-chain
  shape and same guard set: busy guard + the same D5 dedup confirmation +
  receipt classification; first save carries baseRevision 0); "saved" appears
  only after the persistence receipt, failures are presented as failures with
  content kept and retry explicitly user-initiated; a draft is never silently
  promoted (frozen-Schema type-level facts: a draft carries no recipeId /
  title / relation face / locked block). The save receipt aligns the
  production-chain identity and the library invalidation refetch (same source
  as the two standing save chains). Word discipline: the entry is "export a
  draft", promotion is "save as a recipe"; never mixed with "create / add
  assets / assemble".
- Recipe overlay-conflict four options (0.7.19, user ruling 2026-09-22 — accepted direction, not
  yet implemented): a Recipe is "a stackable set of modifications"; when overlaid onto the current
  Avatar, unmentioned existing assets and settings are kept by default, and removal must be
  explicit. Overlay conflicts offer four options: 1) Recipe wins; 2) Avatar wins; 3) carry into a
  new Avatar (recommended); 4) cancel — handling only the fields the Recipe touches. Object-location
  ambiguity is not a value conflict and must not be hidden behind "Recipe wins"; without a reliable
  baseline, differences must not all be attributed to manual player edits.
- Asset-source "fill in at share time" interaction (0.7.19, user ruling 2026-09-22 — accepted
  direction, not yet implemented): import and local use do not require a BOOTH ID; at share time
  only the assets involved this time and missing a source are filled in — completed in one pass,
  minimal entry, no repeated asks. The fill-in flow prefers the purchased-library picker,
  click-to-pick from the web page, keyword-search candidates, and batch association; per-item
  manual typing is not the default; confirmed associations are remembered. A BOOTH ID is a source
  declaration, not VUA authentication.
- Graph, list, and exploded views remain peers. The list is complete and always available.
  The graph uses deterministic force layout, reset, persisted positions, adjacency highlighting, and
  a performance target up to 100 nodes. The exploded view separates semantic layers with CSS 3D.
  All views share selection, version snapshots, domain semantics, keyboard operation, and non-drag
  alternatives; every effects degradation retains the list.
- **Assembly:** orange tracks, checkpoints, and loops may explain real plan,
  execution, input, blocking, and recovery events. No separate Production stage. The high-density
  workshop remains a core visual investment: assets become parts on a track; carrying, alignment,
  locking, node illumination, missing-dependency confusion, and rollback reversal are driven by real
  task events. Increase spectacle after flow logic stabilizes; scheduling does not delete the direction.
  Workshop as the execution status face (0.7.16, U16 user-ruling consumption
  slice 2, proposal 029 A6): the workshop only displays status — the resolve →
  plan → assembly → record cards of the current chain (consuming the same
  container-layer store, Gateway port, and task-center authoritative snapshots as
  the recipe-page initiation face; plan approval and assembly start happen in the
  recipe page's selected state, the status face takes zero initiation actions and
  keeps only read-style refreshes); with no chain identity this session it renders
  the honest empty state, and "go to the recipe page" is pure navigation (023
  projection discipline: zero record identity crosses pages — the workshop fetches
  authoritative facts itself); when a task needs handling
  (waitingInput/paused/failed) it points to the task center instead of building a
  second recovery-decision surface in the status face. The replay view is the
  status face's recorded-tape form (real-task-event-driven DNA); consumption
  extends on it and does not start a second presentation system. The material
  direct-chain (production-use-case v0.1) initiation point leaves the workshop and
  lands in the warehouse page's action area (pending item 1's desktop form, ruled
  by the operator batch 162 on 2026-09-22; zero change to the wire face or the
  component behavior; the whole section hides honestly while capability is not
  ready) — the material direct chain's semantic origin is the material itself and
  it joins the continuous asset acquisition path (§8.3) on the same page. The
  workshop's page slot and gating semantics are unchanged (the honest in-page
  blocking state still applies while the environment is not ready).
- **Inspection/Release:** inspection folds into the production record (0.7.19, user ruling
  2026-09-22 — accepted direction, not yet implemented): this supersedes the standalone-
  inspection-page requirement (0.7.12). When the workshop takes in material, Release creates a
  placeholder record for that run; inspection issues surface through both the notification center
  and the record status, and both open the explanation, logs, and follow-up actions; closing a
  notification does not make the issue disappear; a placeholder record never masquerades as a
  completed Build Record. The inspection service, recovery admission, and evidence-recording
  capabilities are retained. The final upload is completed by the user in the official SDK, and
  technical checks do not guarantee that appearance and behavior meet expectations.
  Release shows result cards, versions, snapshots, Build Records, and official SDK handoff. It retains
  the horizontal conveyor, animated-tier coverflow, WebGL pedestal, and CSS pedestal fallback. The
  Unity-baked turntable direction is promoted to an accepted form (0.7.12, user ruling 2026-09-20):
  TurntablePlayer is the accepted landed shape — the Release detail embeds the turntable player,
  consuming unity-bridge v4 `build_preview` artifacts (`.vua/bridge/preview/<commandId>/`, manifest v1
  driving 60-frame 1024x1024 PNG canvas playback, cover.png as the card cover); the degradation path
  is pinned — missing artifacts or read failures render the honest placeholder copy, never a broken
  image or a fabricated thumbnail, and static/off modes return to flat horizontal scrolling and
  stable previews without losing any result, diagnostic, or handoff action.

  Handoff admission and the standalone open path (U19, user ruling 2026-09-21, 0.7.14): the official
  SDK handoff entry on Release build records presents by a record-state whitelist — succeeded and
  succeeded_with_warnings are allowed (the warning badge stays, never shadowed by the allowance);
  failed, cancelled and rolled_back are withheld with a discoverable reason plus an entry chain to
  diagnostics (the run record) and recovery/re-production (Workshop); recovered is withheld, presenting
  "complete the inspection and the follow-up production steps first" plus the run-record entry; a
  missing or out-of-vocabulary record state is refused with "the record cannot be confirmed". The
  backend stays the authority in the route admission order; the presentation bucket never pre-judges
  the acceptance, and direct invocations rejected at the gate render the typed refusal copy
  (discoverable reason for disabled key actions, §5). The standalone "Open in Unity to inspect or
  fix" action is deliberately separate from the handoff button (own control, port and copy), never
  gated by the record state — opening the editor is neither a recovery execution nor an upload
  permission; while the backend open entry is not wired, the entry presents honest absence (no
  pre-wired availability illusion, no fabricated capability). The handoff admission whitelist and
  the standalone open-in-Unity capability are retained under the inspection-in-records direction
  (0.7.19).
- **Projects/packages:** compact tables, fact rows, and capability badges; combined change preview
  before install/update/remove; no third-party branding that implies embedding. Project compatibility
  no longer holds a standalone second-level page (proposal 026 B, user ruling 2026-09-18): its read
  faces (project detection, note, lock status, environment status, copy-import confirmation chain)
  render as a "Project compatibility" section at the end of the package manager page; the section is
  not gated on the package engine capability. Write-operation handover stays guidance-only: no
  invented interaction without a word face or capability facts.

  Project creation (026 A5) is a single-stage write command without the combined change preview: a
  brand-new project directory has no pre-existing state to diff and no digest to bind, so the user's
  explicit form submission is the confirmation. The entry is gated on the create capability fact row;
  without the fact it does not render. The form is a parent-folder path input plus a project name
  input — no invented directory enumeration. Success registers the project immediately (visible
  after the list refresh); creation is not idempotent, and refusals such as an already-existing
  target directory render inline as they are.

  Template enumeration presentation (027 F5 consumption slice): the create block mounts the
  template enumeration gated on the packages.templatesOps capability fact row
  (packages.listTemplates is an environment-level configuration face, page-locally carried, never
  entering the snapshot) — once the enumeration is ready a template dropdown replaces the manual
  input: the default option = "use the backend default template (leave empty)" (026 A5 blank-face
  semantics verbatim), each row displays the name verbatim (= the frozen same-value projection of
  id, never a fabricated friendlier label), and the selected id is passed as-is as the
  packages.createProject template argument. Fall-back discipline: capability-row absence, an empty
  array (an honest zero-template answer — a missing directory root is a fact, not an error, never
  rendered as an error and never fabricated into a listing), typed failures, and unavailability
  all fall back to the standing manual input plus leave-empty = backend default resolution; typed
  failures render with the error code verbatim, strictly distinguished from capability absence —
  a failure never masquerades as an empty listing.

  Settings-face copy discipline (027 F1, user ruling U14): UI copy for settings-face operations
  such as subscribing and registering local packages states the shared semantics honestly — the
  same package-manager settings file (settings.json) is shared with VCC/ALCOM and changes are
  visible to both sides immediately; VUA does not modify your project files, and external imports
  default to cloning a copy before modifying it. Settings-face copy must not use exclusive claims
  such as "isolated backend environment" or "never modifies your VCC/ALCOM settings" that
  contradict the shared implementation; the read-only project-file face and clone-first semantics
  are unchanged.

  Repository discovery presentation (027 F2 consumption slice, IA stance 2 landed): the repository
  subscriptions and repository-subscription-management partitions merge into a single
  "Repositories" partition (a pure presentation-layer restructure; capability fact rows and word
  faces unchanged) — the subscription list rows are the main body, and expanding a row inline is
  that repository's installable-packages browse face; the browse entry is gated on the
  packages.repoCatalogOps capability fact row (honestly absent until the environment override
  flips it; no fact, no render); the search box is a presentation-layer filter over the already
  fetched catalog facts (packageId/displayName), never a second query shape — batch packageId
  filtering is carried by the word face. Honest-presentation discipline: cached=false rows render
  the "subscribed · no cache yet" empty state, never hidden and never disguised as an empty
  inventory; latestVersion=null renders "no qualifying version" as it is and never renders
  "up to date"-style assertions; cacheSourced=true renders an informational "cached data"
  annotation, never a failure; author and compatible are deliberately absent from the frozen word
  face and are never invented by the presentation layer; displayName=null lets the packageId act
  as the display name; typed failures render verbatim (repo_not_found travels untouched) — a
  failure never masquerades as an empty state.

  Installed-packages update awareness presentation (027 F3 consumption slice): the installed
  table gains an "Updatable" column rendering the frozen judgment word face as a three-state
  honest projection — updateAvailable=null (judgment not executed) renders honestly empty with
  a hover explanation, never "up to date" and never a default false fill (024 stance 2, user
  ruling); false = the precise word face "no strictly newer version under the current filter
  conditions", never generalized into a "no update" assertion; true = renders "update
  available" plus an inline update key (gated on the packages.installOps capability fact row;
  no fact, no render), the key reusing the A2 install-face version=null semantics (resolver
  picks the latest stable), with no new upgrade verb. Dual-family negotiation discipline: a
  v0.1-family answer (discriminated by family constant vua.packages-installed/v0.1) carries no
  judgment facts, so the column stays honestly empty with zero regression to the existing
  presentation; cacheSourced=true rides only v0.2-family answers and renders an informational
  "cached data" annotation above the table (reusing catalog wording), never a failure — a
  v0.1-family answer never fabricates the annotation.

  Repository lifecycle presentation (027 F4 consumption slice): the subscription rows carry
  inline enable/disable and refresh controls, gated on the packages.repoLifecycleOps
  capability fact row (one row serving the three methods; honestly absent until the
  environment override flips it = controls not rendered while the subscription rows keep
  rendering — degradation is not an error, no fact no render). Honest enable-wording ruling
  (W25 read-only evidence ruling (c): VCC carries no enable/disable state anywhere): the
  enable bit is VUA-owned state, distinguished from the §8.7 settings-face shared-semantics
  copy discipline — the disabled wording honestly states "a disabled repository stays
  listed while its packages leave browsing and install resolution; the shared VCC/ALCOM
  settings are never written", which is an implementation-faithful statement, not an
  exclusivity claim. Disabled-not-hidden: a v0.2-family answer (discriminated by family
  constant vua.packages-repos/v0.2) renders enabled=false rows as usual with a "disabled"
  badge; a v0.1-family answer carries no enabled bit = the toggle state is unknowable, so
  the enable/disable control is not rendered (never guessed), while the refresh control does
  not depend on that bit and may render independently; id-absent rows lie outside the
  lifecycle word faces' reach and render no controls at all. Both refresh receipt arms are
  successes: cacheUpdated=false (etag unchanged) renders the honest "cache already up to
  date" informational word face, never an error. Typed refusals surface with the original
  port code in detail, strictly distinguished from capability absence; capability absence
  (capability_missing) and engine absence (unavailable) are presented distinctly; repeated
  toggles claim no idempotence and refusals surface as refusals.
- **Overlay:** stronger text contrast, fewer levels, larger targets, stable snapshots, and semantic
  actions. No blur, complex background, or long lists; desktop fallback is always available.
- **Global shell: boot splash and notification center:** the boot splash is the brand's first
  frame, never a loading-mask stand-in: the square column grid falling top-to-bottom and the
  central VUA letter frames in a purple-orange gradient stroke are the fixed ceremony. Exit is
  driven by the real startup chain — the fade-out happens only when the animation budget is spent
  AND all four milestones (renderer/gateway/provider/paint) have been reached; otherwise the
  splash enters a waiting state (breathing columns plus an honest waiting caption), and the hard
  cap forces exit on schedule with the main UI's own honest-absence rendering taking over.
  Escape and click skip immediately. With flattened motion (reduced-motion / effects off) the
  animations flatten entirely, the dwell shortens, and milestones are not awaited. The
  bottom-left version badge reads build-time injected facts (version · commit · dirty); the
  update badge appears only for "newer available" — a failed check or up-to-date never disturbs.
  The notification center (header bell) and the bottom taskbar share one notification projection
  — one fact source, two presentations, no diverging invented counts; when the task-engine
  capability is not ready the entry never appears at all (§2.6 no-fact-no-render, not a disabled
  state), and the bell badge equals the active-task count. The panel is a fullscreen frosted
  backdrop plus a solid panel: the header's own backdrop-filter traps fixed descendants, so
  backdrop and panel always portal to body, blur lives only on the fullscreen backdrop and the
  panel itself stays unblurred (the compositing ghosting lesson). Opening moves focus into the
  panel; closing returns it to the bell (not stolen when the user has focused elsewhere);
  outside click / Escape / scrolling outside the panel (scrolling inside the panel's list does
  not close it — W25 real-machine correction) / blur close it; flattened motion skips the exit
  animation window.
  Notification-entry discipline: active tasks show by default; terminal tasks appear only with
  "show completed" enabled and not dismissed. Dismissal is offered only for terminal
  notifications — what is cleared is the notification, not the fact; task authority remains
  queryable through the task surfaces (§6.2). Task-row titles project honestly: registered task
  identities use their registered title, unregistered tasks get the honest type word
  "background task", and a bare taskId never serves as a description (facts the projection
  cannot reach are not invented). Clicking the row's main area returns to the task's origin page,
  identical for active and terminal states, never a silent no-response. The in-row status glyph
  and status word carry success/failure facts, action buttons (retry/clear) each do one job, and
  the panel close ✕ only closes the panel — never conflated with dismissing a notification or
  presenting a failure.

## 9. Accessibility, internationalization, and performance

Core flows work by keyboard with visible predictable focus. State never relies on color alone; field
errors are associated; icon buttons have names/tooltips. Support dark, light, forced colors, at least
200% text zoom, 960×600, and 125%/150% DPI. User strings use language keys; domain function names use familiar local wording without mandatory English prefixes. Brands and internal IDs stay unchanged (user-approved i18n review, 2026-09-20). Known diagnostics have localized explanations keyed by stable codes, with original messages retained; dates and native dialogs follow the app language. Fixtures are development-only and labeled. Large lists use
virtualization or `content-visibility`; expensive effects need measurements and an off path. If a
Recipe graph exists, the target at 100 nodes is 60 fps, minimum 30 fps, with a list alternative.

## 10. Definition of done

A page is deliverable only when:

1. goal, object, state, next action, and recovery entry are clear;
2. views send intent only through Gateway and contain no privileged/business operation;
3. dark/light/high-contrast and jurisdiction contrast pass;
4. keyboard, focus restore, non-drag alternative, and screen-reader semantics pass;
5. loading, empty, error, blocked, success, and unavailable-capability states are honest;
6. reduced-motion and effects-off preserve full operation;
7. high-impact work shows scope and recovery;
8. fixtures do not enter production;
9. 960×600, maximized, 125%/150% DPI, and long Chinese/Japanese/English strings retain key actions;
10. the fixed five tabs, three-step responsive ladder, slanted controls, and transparent overflow
    flyout pass mouse, keyboard, scaling, and reduced-motion checks; sidebar growth moves no neighbor;
11. each WebGL scene passes animated/static/off, CSS fallback, context-loss, focus pause, and measured
    performance checks; no wall-to-wall blur, continuous parallax, or layout reflow motion appears;
12. Recipe's three views and Release coverflow/pedestal retain complete degradation paths;
13. each new visual element explains real use and can be removed without information loss.

## 11. v0.6.1 accepted scope

The accepted scope covers the base character, two jurisdictions, tokens, component states, fixed five tabs,
slanted controls and overflow flyout, sidebar growth impression, task feedback, the five AMF stages as full
capability coverage (presentation per the 0.7.19 user ruling: wizard-selected paths, inspection folded into
production records), three WebGL scenes, Recipe's three views, Release coverflow/pedestal, community-skin
direction, module metaphors, motion fallbacks, and accessibility gates. Real M1–M7 slices may refine page
layout after validation.

The final logo remains a separate commission. The visual direction retained here and its development
schedule are reviewed separately; a schedule change does not automatically delete an approved design
direction.

## 12. Document changelog

- **0.7.19 (2026-09-22)**: user ruling 2026-09-22 (product-boundary 1.5.0) consumed —
  §2.2 the fixed five-stage flow becomes "full capability coverage + a wizard selecting the
  path by goal/device/current state", including guidance not replacing account authentication
  or platform authorization and the Quest first-time tutorial distinguishing standalone vs
  PC-connected paths; §8.6 the standalone-inspection-page requirement is superseded by
  "inspection folds into the production record" (Release run placeholder record at workshop
  feed + notification-center dual channel, closing a notification is not the issue
  disappearing, placeholder records never masquerade as completed Build Records, inspection
  service/recovery admission/evidence recording retained, handoff admission and the standalone
  open-in-Unity capability retained, handoff failure now jumps to the run record); §8.4 adds
  the Recipe overlay-conflict four options and the asset-source "fill in at share time"
  interaction (both marked accepted direction, not yet implemented). ZH mirror synced.

- **0.7.18 (2026-09-22)**: §8.4 addendum for project draft export (U16
  user-ruling B-face loop 4 desktop consumption, proposal 029 B4) - the
  recipe page hero action row gains the "export draft from project" entry
  (recipe-export v0.1 frozen word-table consumption): the pick stage is
  limited to the VUA-registered project set (no arbitrary path input; stale
  registrations honestly badged and disabled; not connected / no registrations
  render honest empty states); the confirmation stage presents the draft's six
  fact keys as-is (origin identity tri-state is not a gate [pending item 2
  awaits a ruling]; environment version verbatim, completed by the user when
  unreadable; dependencies verbatim with honest empty arrays and
  presentation-only locked pins; the missing-dimension list as-is - no design
  intent claims); promotion = explicit user completion (title + at least one
  asset + the environment constraint when unreadable) riding the standing
  recipe.save save chain (same shape and same guard set, first save
  baseRevision 0), "saved" only after the receipt, a draft never silently
  promoted. ZH mirror synced.

- **0.7.17 (2026-09-22)**: §8.4 addendum for create and add-assets (U16
  user-ruling consumption slice 3, proposal 029 A1/A2/A3 local segment) — the
  "Create" entry promoted onto the recipe page main path (U16 ruling wording;
  the draft dialog remains one creation starting point, two-UIs-one-save-chain
  holds); the selected-state "Add assets" action rides the recipe.save version
  chain (same save-chain shape, same guard set: baseRevision + D5 dedup + busy
  guard; parallel-document-edit-chain form), pending additions and saved facts
  presented separately with "saved" shown only after the receipt; the asset
  picker = warehouse read-face projection (no third import entry; cloud access
  = pending item 3/#46 stays honestly absent before a ruling). This closes the
  proposal-029 A-face (A1–A6) desktop consumption loop. EN mirror synced.

- **0.7.16 (2026-09-22)**: §8.5 addendum for the workshop as the execution status
  face (U16 user-ruling consumption slice 2, proposal 029 A6) — the workshop only
  displays status (resolve/plan/assembly/record cards share the same source and
  store with the recipe-page initiation face, zero initiation actions; honest
  no-chain empty state + pure-navigation CTA; task handling points to the task
  center); §8.4 one-line erratum (registered by integration batch 161): the chain
  identity source = the recipe.get receipt's TOP-LEVEL required identity fields
  (store-authoritative), not the recipeDocument body itself; the material
  direct-chain initiation point leaves the workshop and lands in the warehouse
  page's action area (pending item 1's desktop form, ruled by operator batch 162,
  zero change to the v0.1 wire face). EN mirror of the authoritative ZH.

- **0.7.15 (2026-09-22)**: §8.4 addendum for the recipe page as the production hub
  (U16 user-ruling consumption slice 1, proposal 029 A4/A5) — the library
  selection is the preview subject and the production-chain fact-source action
  (chain identity keys come only from the recipe.get receipt document identity,
  never list labels or local guesses; a changed document identity means a new
  chain); the selected-state assemble initiation face = the production chain
  section double-mounted in the recipe page and the composing-draft dialog,
  consuming the same container-layer store and Gateway port; plan approval keeps
  the production-use-case v0.2 plan.approve idempotent wording (single key
  {planId}, no risk decision on this face); the stale-authorization gate
  (stale-draft) holds only while a composing draft is present and deviates from
  the saved revision; #44×U16 word discipline codified for the first time (the
  user action is "assemble" (组装); wardrobe mounting and the AMF Assembly stage
  keep "装配"). The workshop page is untouched (§8.5 addendum awaits slice 2,
  0.7.16). EN mirror of the authoritative ZH.

- **0.7.14 (2026-09-21)**: §8.6 addendum for handoff admission and the standalone open path (U19
  user-ruling consumption slice) — the Release build-record handoff entry presents by a record-state
  whitelist (succeeded/succeeded_with_warnings allowed with the warning presentation preserved;
  failed/cancelled/rolled_back withheld with a discoverable reason plus diagnostics/recovery/
  re-production entry chain; recovered withheld until the inspection and follow-up production steps;
  missing/out-of-vocabulary states refused as "record cannot be confirmed"); the backend gate stays
  the authority in the route admission order, the presentation bucket never pre-judges acceptance,
  and direct rejections render the typed refusal copy; the standalone "Open in Unity to inspect or
  fix" action is deliberately separate from the handoff button, never gated by the record state,
  opening the editor is neither a recovery execution nor an upload permission, and honest absence
  presents while the backend open entry is unwired (no fabricated capability). EN mirror synced with
  the ZH authority.

- **0.7.13 (2026-09-21)**: §8.7 addendum for repository lifecycle presentation (proposal 027
  F4 consumption slice) — inline enable/disable and refresh controls on subscription rows
  gated on the packages.repoLifecycleOps capability fact row (degradation is not an error;
  no fact no render); honest enable-wording ruling (W25 ruling (c): VUA-owned state,
  disabled-not-hidden, shared settings never written, with the distinction from the
  settings-face shared-semantics copy discipline spelled out); dual-family negotiation
  discipline (a v0.1-family answer carries no enabled bit = the toggle control is not
  rendered, never guessed); both refresh receipt arms are successes (cacheUpdated=false =
  "already up to date" informational presentation, never an error); three-state presentation
  distinction among typed refusals, capability absence, and engine absence. ZH source
  updated; EN mirror synced.

- **0.7.12 (2026-09-20)**: navigation rework and baked-turntable promotion (user ruling
  2026-09-20; slice/production-nav-bake-preview merged into main by user ruling 2026-09-21).
  The two parallel development lines each advanced their own 0.7.10/0.7.11 versions, colliding
  with same-numbered content on the main side; this version collects both in sequence (registered
  honestly, no history rewrite). §8.3/§8.4 navigation rework — "Material import" moves from a
  dedicated tab into a content dialog inside the warehouse page; "Composing draft" moves from a
  dedicated page into a content dialog inside the recipe page (wide panel, internal scroll,
  Esc/backdrop close, closing unmounts the component and closes any in-flight embedded view);
  the production sidebar drops the warehouse/workshop/packages group labels and becomes a flat
  ungrouped list like every other module; inspection stays a standalone page (independent of
  the workshop) as the inspection landing point of "assembly → inspection → SDK handoff".
  §8.6 the Release baked-turntable direction is promoted to an accepted form — TurntablePlayer
  is the accepted landed shape: it consumes unity-bridge v4 `build_preview` artifacts
  (manifest v1 driving 60-frame 1024x1024 PNG canvas playback plus cover.png cover), with the
  degradation path pinned (missing artifacts or read failures render the honest placeholder
  copy, never a broken image or a fabricated thumbnail; static/off modes return to flat
  horizontal scrolling and stable previews). EN mirror of the ZH authority.

- **0.7.11 (2026-09-20)**: §8.7 addendum for template enumeration presentation (proposal 027 F5
  consumption slice) — the create block mounts the template dropdown gated on the
  packages.templatesOps capability fact row (a ready enumeration replaces the manual input; the
  default option = leave-empty backend default; the name projects verbatim, never a fabricated
  label; the id passes as-is as the createProject template argument); fall-back discipline
  (capability-row absence / an empty array = an honest zero-template answer [a fact, not an error]
  / typed failures carrying the error code verbatim / unavailability all fall back to the manual
  input plus leave-empty = backend default resolution, failures and absence strictly distinguished,
  never folded into an empty listing); the §8.7 project-creation sentence "no fabricated template
  dropdown" retires with the frozen word face now consumed. EN mirror in sync.
- **0.7.10 (2026-09-20)**: §8.9 notification-center scroll-to-close semantics clarified (W25
  real-machine batch-4 correction) — the user observed scrolling the notification list inside
  the panel closing the whole notification center; clarified that the scroll-to-close gesture
  holds only for scrolling outside the panel, scrolling inside the panel's list (wheel,
  scrollbar, keyboard) keeps it open, and scrolling outside still closes per the original rule.

- **0.7.9 (2026-09-20)**: §8.7 addendum for installed-packages update awareness presentation
  (proposal 027 F3 consumption slice) — "Updatable" column three-state honest projection
  (null = judgment not executed, honestly empty, never "up to date", never default false;
  false = precise "no strictly newer version under the current filter conditions" word face,
  never generalized; true = "update available" plus inline update key reusing the A2
  version=null semantics, gated on the installs capability row); dual-family negotiation
  discipline (v0.1-family answers keep the column honestly empty with zero regression;
  cacheSourced=true rides only v0.2-family answers with the "cached data" annotation and is
  never fabricated for v0.1-family answers). EN mirror of the ZH authority.

- **0.7.8 (2026-09-20)**: new §8 global-shell bullets (boot splash and notification center;
  proposal 028 #7 desktop stance now codified) — splash exit milestone discipline (budget spent
  plus four milestones / waiting state / hard-cap forced exit / Escape skip / flattened motion),
  the update badge reporting only "newer available"; the notification center's single projection
  across two presentations, entry absent entirely when the capability is not ready, the portal
  positioning discipline (blur only on the fullscreen backdrop), clearing a notification never
  the fact, honest task-title projection (unregistered tasks get the type word "background
  task", bare taskId never a description), row-open returns to the origin page identically in
  both states, and the three-way split between status glyphs, action buttons, and the panel
  close ✕. The original stance ("after the W25 window, as 0.7.6") was advanced by the operator's
  2026-09-20 tick assignment; 0.7.6 belongs to the wt-7 in-flight batch and 0.7.7 to the F2
  consumption slice, so this batch takes 0.7.8. EN mirror synced.

- **0.7.7 (2026-09-20)**: §8.7 supplemented with repository-discovery presentation (proposal 027
  F2 consumption slice) — repository subscriptions and subscription management merge into a single
  "Repositories" partition (IA stance 2 landed: subscription list rows as the main body, inline
  row expansion as the per-repo installable-packages browse face, the search box as a
  presentation-layer filter never a second query shape, the entry gated jointly on capability
  fact rows); honest-presentation discipline for the browse face (cached=false "subscribed · no
  cache yet" empty state, latestVersion=null "no qualifying version" never rendered as "up to
  date", cacheSourced=true informational "cached data" annotation, author/compatible deliberate
  absence never invented, failures verbatim). Version 0.7.7 skips 0.7.6, reserved for the wt-7
  in-flight batch. EN mirror synced.

- **0.7.6 (2026-09-20)**: User-approved i18n repair; §9 uses familiar localized function names without mandatory English prefixes, retains brands and internal IDs, preserves original diagnostics, and makes dates and native dialogs follow the app language.

- **0.7.5 (2026-09-19)**: §8.7 projects/packages supplemented with the settings-face copy
  discipline (proposal 027 F1, user ruling U14) — UI copy for settings-face operations such as
  subscribing and registering local packages states the shared semantics honestly (the same
  package-manager settings file settings.json is shared with VCC/ALCOM and changes are visible to
  both sides immediately; VUA does not modify project files, and external imports default to
  cloning a copy before modifying it), and exclusive claims such as "isolated backend environment"
  or "never modifies your VCC/ALCOM settings" that contradict the shared implementation are
  banned; the read-only project-file face and clone-first semantics are unchanged. Mirrors the ZH
  edition.

- **0.7.4 (2026-09-19)**: §8.7 projects/packages supplemented with project-creation presentation
  (026 A5 consumption slice) — creation is a single-stage write command without the combined change
  preview (a brand-new directory has no pre-existing state to diff and no digest to bind; the
  explicit form submission is the confirmation); the entry is gated on the create capability fact
  row; parent-folder path and project name inputs invent no directory enumeration, and leaving the
  template blank means the backend default template resolution, stated honestly with no fabricated
  dropdown; success registers the project immediately, creation is not idempotent, and refusals such
  as an already-existing target directory render as they are. Mirrors the ZH edition.

- **0.7.3 (2026-09-18)**: §8 information-architecture update (proposal 026 B, user ruling
  2026-09-18) — the standalone "Project compatibility" second-level page is removed; its read
  faces merge into a "Project compatibility" section at the end of the package manager page
  (section-inside-tab shape, not gated on the package engine capability); the copy-import source
  prefers a registered-project picker with a manual-path fallback for out-of-registry ALCOM/VCC
  originals; the write-operation handover card stays guidance-only (honesty discipline 1, no
  invented interaction). Mirrors the ZH edition.

- **0.7.2 (2026-09-18)**: §8 environment deployment gains the alternative-group rule —
  brand VR runtimes / streaming apps are "any one" alternatives: one group card, a single
  pending count when unsatisfied, and neutral "optional" absent members once satisfied.
  Mirrors the ZH edition. (Registry row catches up from 0.7.0 to 0.7.2; the 0.7.1 bump had
  missed its registry sync.)

- **0.7.1 (2026-09-10)**: §8.3 wording fix (drift flagged in the desktop batch-A
  state) — "honest degradation pointing to the system browser" becomes "a plain
  unavailable note with no alternative action": under the U9 four-way split,
  http/https popups open in the current embedded view, so no "hand off to the
  system browser" degradation path exists. Mirrors the ZH edition.

- **0.7.0 (2026-09-10)**: proposal 015 reconciliation accepted (IMP-1, handled by
  integration) — §8 gains the dedicated import-tab semantics: the continuous
  acquisition path lands as an "Import" page (cloud section = embedded browsing +
  catalog mode + completed-download adoption; local section = W18 submission flow
  migration); the warehouse page converges to pure entry management (dual-track
  header removal rides IMP-4); permanent isolation badge and isolation red lines,
  zero purchase-flow UI, and the remoteBrowser two-state flip criterion. Mirrors
  the ZH edition (which also fixes the EN title lagging at v0.6.2).

- **0.6.3 (2026-09-08)**: W15 failed-walkthrough rework landing sync - §6.2 experimental
  feature presentation becomes a two-state toggle model (frozen-protocol **server-behavior
  toggle** vs unfrozen-protocol **unwired preference**; the latter is permanently labeled
  unwired, requires the danger confirm dialog, and gains the DEV prototype note); §8.3
  artifact-mode semantics reworked per the W15 ruling (global behavior written by the
  Settings-Experimental "Generate VPM replacement" toggle via setGlobalDefaultMode;
  per-entry entries return to the entry-facts mirror; the 007 preference gate is superseded
  by the global switch semantics); terminology aligned (VPM = VRChat Package Manager,
  VPM package = the managed package).

- **0.6.2 (2026-09-07)**: W7/W9/W13 landing sync - notification-center semantics (terminal
  tasks default to non-notification, show-completed switch, clear removes only the
  notification), new 6.2 experimental feature presentation (preference toggle, entry badge,
  entry-hiding is not guard removal), Warehouse layout (adaptive columns + dedicated
  right-hand detail panel + narrow-window stacking) and artifact-mode semantics
  (use_original default, experimental-gated per-entry entries, read-only global default);
  failed-notification glyph distinguished from the close ✕.
- 0.6.1 and earlier: see git history.
