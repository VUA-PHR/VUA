# VUA design standard v0.7.5

[English](design-standard_EN.md) | [简体中文](design-standard_ZH.md)

> Document version: 0.7.5
> Status: Accepted
> Authoritative language: Simplified Chinese (EN is the mirror, synced to 0.7.5)  
> Scope: Electron desktop, desktop overlay, and VR overlay presentation  
> Updated: 2026-09-19  
> Normative effect: Governs interaction, visual, and accessibility implementation;
> does not expand product scope or replace versioned application contracts

## 0. Position of this version

v0.6.1 combines UI/UX and visual-art direction into one normative source.

| Treatment | Content |
| --- | --- |
| Retain | goal before terminology, Recipe-first, explicit state, recovery first, honest progress, user-content priority, dark-first, VUA purple/AMF orange jurisdictions, 4 px grid, semantic tokens, workshop-track metaphor, fixed five-tab shell, command-center composition, slanted tab language, transparent overflow flyout, sidebar growth impression, three motion levels, WebGL three-scene direction, Recipe graph/list/exploded views, Release coverflow and 3D pedestal, community-skin direction, WCAG 2.2 AA and APG gates |
| Standardize | Windows and Fluent 2 desktop behavior; macOS native-tool texture as a visual reference; Carbon as information-structure reference only; global success/warning/error colors while reserving large traffic-light treatments for environment deployment; tokenized motion; transform-only sidebar growth; Electron mechanism + AMF use case for browsing/download; five AMF stages |
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

### Recipe-first

```text
Warehouse → Recipe → Assembly → Inspection → Release
```

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
- Dedicated import tab (v0.7.0, proposal 015 reconciliation accepted; IMP-1): the
  "one continuous acquisition path" lands as a dedicated "Import" page — a cloud
  section (embedded browsing and catalog mode as parallel discovery entries, plus
  a per-batch adopt-into-warehouse entry for completed downloads) above a local
  section (system folder pick → confirmation list → single command → task center),
  both landing in the same warehouse entry model; the warehouse page converges to
  pure entry management (dual-track header removal rides the IMP-4 reorg batch;
  status quo kept until then, no extra change surface); the embedded browse area
  permanently shows the "VUA embedded browsing · Session isolated" badge, and the
  isolation red lines (sandbox / no preload / separate partition / standard Web
  APIs) remain untouched item by item; platform pages render as-is with zero
  purchase-flow UI; the `desktop.remoteBrowser` capability is two-state — it flips
  only when embedded browsing works end to end, and unwired entries stay
  permanently labeled unavailable (a plain unavailable note with no alternative
  action — under the U9 four-way split, http/https popups open in the current
  embedded view, so no "hand off to the system browser" degradation path exists).
- **Recipe:** graph, list, and exploded views remain peers. The list is complete and always available.
  The graph uses deterministic force layout, reset, persisted positions, adjacency highlighting, and
  a performance target up to 100 nodes. The exploded view separates semantic layers with CSS 3D.
  All views share selection, version snapshots, domain semantics, keyboard operation, and non-drag
  alternatives; every effects degradation retains the list.
- **Assembly:** orange tracks, checkpoints, and loops may explain real plan,
  execution, input, blocking, and recovery events. No separate Production stage. The high-density
  workshop remains a core visual investment: assets become parts on a track; carrying, alignment,
  locking, node illumination, missing-dependency confusion, and rollback reversal are driven by real
  task events. Increase spectacle after flow logic stabilizes; scheduling does not delete the direction.
- **Inspection/Release:** evidence and next steps distinguish local estimates from official results.
  Release shows result cards, versions, snapshots, Build Records, and official SDK handoff. It retains
  the horizontal conveyor, animated-tier coverflow, WebGL pedestal, CSS pedestal fallback, and Unity-
  baked turntable direction. Static/off modes return to flat horizontal scrolling and stable previews
  without losing any result, diagnostic, or handoff action.
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
  input — no invented directory enumeration and no fabricated template dropdown; leaving the template
  blank means the backend default template resolution, stated as it is. Success registers the project
  immediately (visible after the list refresh); creation is not idempotent, and refusals such as an
  already-existing target directory render inline as they are.

  Settings-face copy discipline (027 F1, user ruling U14): UI copy for settings-face operations
  such as subscribing and registering local packages states the shared semantics honestly — the
  same package-manager settings file (settings.json) is shared with VCC/ALCOM and changes are
  visible to both sides immediately; VUA does not modify your project files, and external imports
  default to cloning a copy before modifying it. Settings-face copy must not use exclusive claims
  such as "isolated backend environment" or "never modifies your VCC/ALCOM settings" that
  contradict the shared implementation; the read-only project-file face and clone-first semantics
  are unchanged.
- **Overlay:** stronger text contrast, fewer levels, larger targets, stable snapshots, and semantic
  actions. No blur, complex background, or long lists; desktop fallback is always available.

## 9. Accessibility, internationalization, and performance

Core flows work by keyboard with visible predictable focus. State never relies on color alone; field
errors are associated; icon buttons have names/tooltips. Support dark, light, forced colors, at least
200% text zoom, 960×600, and 125%/150% DPI. User strings use language keys; domain terms retain the
English name with a local explanation. Fixtures are development-only and labeled. Large lists use
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
slanted controls and overflow flyout, sidebar growth impression, task feedback, five AMF stages,
three WebGL scenes, Recipe's three views, Release coverflow/pedestal, community-skin direction, module
metaphors, motion fallbacks, and accessibility gates. Real M1–M7 slices may refine page layout after
validation.

The final logo remains a separate commission. The visual direction retained here and its development
schedule are reviewed separately; a schedule change does not automatically delete an approved design
direction.

## 12. Document changelog

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
