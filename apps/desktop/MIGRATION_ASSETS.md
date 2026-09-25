# Electron Presentation Asset Migration Record

> Status: In progress
> Legacy source: `_references/kimi-desktop-5870d0c/apps/desktop` (branch `kimi/docs-art-v04-dual-track`, commit `5870d0c`)
> Current ruling: restore legacy presentation assets on Electron and validate visual and interaction behavior against the accepted `design-standard-v0.6.1`

This record does not restore the Tauri host, IPC, permissions, or product data contracts. Electron process isolation, the narrow Gateway, remote-content isolation, and current module ownership remain in force.

## Slice 1 (M1 baseline, completed)

Minimal Electron host plus presentation shell; see the "Electron presentation migration record" in `docs/migration/asset-ledger.md`.

## Slice 1 closure addendum (M1 acceptance, 2026-09-04)

- **Provider routing**: Electron Main starts the controlled Mock Provider through
  `provider-bootstrap.ts` (the `OrchestratorProviderV01` surface); `vua:gateway:invoke`
  validates the envelope and `gateway-router.ts` routes it to the provider;
  `capabilities` derive from the provider capability report instead of a Main-side
  literal; invalid envelopes and untrusted senders are rejected before routing;
- **Real remote permission smoke**: `scripts/smoke-remote-permissions.mjs` exercises a
  synthetic `http://127.0.0.1` page — notifications/geolocation/media are denied by the
  isolated session; the remote page has no `window.vua` and no Gateway; remote
  navigation is blocked; HTTP(S) `window.open` hands off to the shell boundary without
  creating an Electron window; evidence is written to `_local_m1/v0.4.1/` (excluded by
  .gitignore, raw logs kept locally);
- **Verification**: `pnpm check` passes; 24 TypeScript tests pass on the M line; the
  product version is now `0.4.1` with release notes in `docs/release/v0.4.1.md` /
  `.md`; M1 is marked as passed in the development plan (EN and ZH).

## Slice 2: full legacy presentation asset restoration (this slice)

The remaining KIMI presentation assets (feature pages, application models, four-locale i18n, WebGL scenes, remaining primitives) and the five quality-gate scripts are migrated into the Electron shell. Scheduling remains governed by `docs/development-outline.md` (the F2–F7 application-contract integrations proceed as planned; this slice restores presentation and pure models only, and fabricates no production data).

| Asset group | Target owner | Preserved in this slice | Explicitly rejected | Verification |
| --- | --- | --- | --- | --- |
| Full i18n (zh-CN/en/ja/ko + terms/format/locale registry) | `apps/desktop/src/renderer/i18n` | Four locale tables, term forms, interpolation, endonym discipline | Legacy conclusory product copy (reviewed against v0.6.1) | `check-i18n`, `check-i18n-tables`, `i18n.test`, `locales.test` |
| Application models and pure functions (nav/onboarding/busy-timing/shortcuts/storage-keys/resource-saver/perf-probe/task-status/resolve-scenario/scene-mode, etc.) | `src/renderer/app`, `components/three` | All pure models and tests | Tauri API dependencies | Full vitest run passes |
| Feature-page presentation (home/deployer/guide/onboarding/warehouse/recipe/workshop/release/packages/tools/settings/task-center/tutorial/command-palette, etc.) | `src/renderer/features` | Page components, layout models, interaction splits | Legacy BDB/Catalog identity and API, fabricated production data | Type check, production build, DEV fixture walkthrough |
| WebGL scenes (Nebula/HoloCore/Pedestal + procedural textures) | `src/renderer/components/three` (new dependency `three` 0.185.1, MIT) | Scene implementations and degradation gates (reduced-motion/HC/effects-off) | Unverified high-resource rules suppressed by the resource-saver mode | Build code-splitting (lazy loaded, outside the main chunk) |
| Remaining primitives (ContextMenu/DelayedButton/MediaSlot/Skeleton + media-state model) | `src/renderer/components/primitives` | Components and co-located CSS | None | `media-state.test` |
| Quality-gate scripts ×5 | `apps/desktop/scripts` | check-boundary / check-contrast / check-i18n / check-i18n-tables / check-leak, wired into `pnpm check` | Tauri boundary rules | Rewritten as Electron rules (renderer must not import `electron`/`node:`/`@tauri-apps`; Gateway only via the barrel) |
| Full tokens and base styles | `packages/design-system` | Full tokens (aurora/glow/dual high-contrast channels), base.css, Icon | None | `check-contrast` (5 contexts, AA) |
| Recipe fixture JSON sources | repo-root `schemas/recipe/v1/fixtures` (4 synthetic samples) | Parity-checked against the embedded copies | None | `fixture-recipes.test` |
| Minimal tutorial content-pack v1 index (20 step ids rebuilt from the strings keys) | `src/renderer/app/tutorial-content-pack.ts` | Tutorial/step structure and validation rules (rejection conditions aligned with legacy `parse_content_pack`) | Legacy `schemas/tutorial/v1` JSON and the Rust `include_str!` dual-endpoint mechanism (M5 rebuilds a versioned JSON) | `tutorial-content-pack.test`, `tutorial-port.test` guards |

### Explicit degradations in this slice (honest empty states / explicit failures, nothing fabricated)

| Legacy capability | Disposition | Restoring slice |
| --- | --- | --- |
| Tauri `open_external_url` | `window.open` → Main `setWindowOpenHandler` hands off to the system browser (http/https only) | Already available |
| In-app browse window (WebviewWindow) | `browseWindowSupported()` returns false; pages degrade to "open in system browser" | F4 (Main-managed `WebContentsView` + isolated session) |
| `vuaimg` thumbnail protocol | Direct original URL; HTTP cache as fallback | F4 (domain allowlist + disk cache rebuilt with Electron mechanisms) |
| Tutorial session / desktop tutorial window / topmost (Rust app layer) | Tutorial port stays inactive; `openTutorialWindow` fails explicitly; the topmost button does not render | M5 (tutorial session enters the application contract + preload window actions) |
| VR overlay helper (`tutorial_overlay_start` etc.) | DEV entries fail explicitly; the pure payload builder is preserved | G7/M5 |
| Real BDB vendored snapshot (309 products) and `catalog-browser-dev` | Excluded by ruling; the catalog port stays not-connected | F4 (aligned with the AMF material-intake protocol) |
| Real product image URLs (5 × `booth.pximg.net`) | Replaced with synthetic SVG data URIs (repository tests use synthetic data only) | Not restored |

### Slice verification

- `pnpm check` fully green: contracts 5 tests + orchestrator-provider suite + desktop **252 tests** (35 files); strict type checks for renderer and electron tsconfigs (including `exactOptionalPropertyTypes`/`noUncheckedIndexedAccess`); `vite build` passes with the three.js scenes lazy-loaded outside the main chunk;
- Quality gates: `check-boundary` (barrel + Electron host boundary), `check-i18n` (no CJK literals), `check-i18n-tables` (3 delivered tables aligned), `check-contrast` (5 contexts WCAG AA + forced-colors structural guard), `check-leak` (120 fixture fingerprints, zero leakage in the production build);
- Windows Electron smoke test: the `dist` artifact launches, the window title `VUA` renders, the process tree is healthy, and no processes remain after exit;
- New dependencies: `three` 0.185.1 and `@types/three` 0.185.4 (MIT; complete the license and NOTICE audit before distribution);
- Fixture tree-shaking depends on the `sideEffects: ["**/*.css"]` declaration (do not remove; guarded by `check-leak`).

## Slice 3: F2 Gateway client and task experience (2026-09-04)

| Asset group | Target owner | Delivered in this slice | Verification |
| --- | --- | --- | --- |
| Contract | `packages/contracts`, `docs/protocols/application-contract-v0.1` | Contract revision (growth model + `environment.getSnapshot` + `task.startDemo`); Gateway v1 six-method table with per-method guards; application-error passthrough (`code=application`) | 10 contract tests (unknown version/method/mixed-shape rejection) |
| Kernel | `apps/desktop/src/electron` | Full method routing to the Provider; typed event broadcast (local-origin windows only); operation-level capability registration | 8 router tests (passthrough/errors/gating/snapshot) |
| Provider | `packages/orchestrator-provider` | Mock implementations of environment.getSnapshot (injected or honest empty) and task.startDemo (`demo.task` gating, commandId idempotency, deterministic state driving) | 14 provider tests |
| Renderer | `src/renderer/gateway` | Typed client (explicit unavailable/request_rejected/application failures); contract projection (`satisfies`-locked totality, presence severity as a consumer-side default); live task-center and environment-snapshot ports; production assembly of the live Gateway (not-run fallback without a host) | 273 desktop tests (projection totality/cancel distinguishes unknown task from outage/event-driven refresh/unsubscribe) |

Disconnection semantics: a first-frame failure propagates so the GatewayProvider shows the honest failure
card with retry; refetch failures during subscriptions keep the previous view; cancellation is rejected as
unknown task / not cancellable / unavailable. The detection execution command and environment events belong
to F6/B6 — `runCheck` currently returns the current snapshot and entries appear only via capability.

Boundaries unchanged: the Renderer still never touches Provider lifecycle, Rust types, or IPC details; the
DEV fixture defense stands (`check-leak`, 120 fingerprints, zero leakage); the remote permission smoke
passed again (a remote page sees neither `window.vua` nor the events surface); the Windows launch smoke
passed (window `VUA`, no application errors, no leftover processes).

## Slice 4: F3 production vertical experience, UI/UX first (2026-09-05, worktree kimi/frontend)

Before the B3 interaction logic (the `production.*` application contract + Rust executor + Kernel
file dialog) is frozen, the F3 production vertical use case is fully implemented in the presentation
layer on a renderer-owned port + DEV fixtures: material intake → inspection results → plan
review/confirmation (bound to a revision) → execution progress → recovery (continue/rollback) →
minimal Build Record, covering all five lifecycles: success / cancel / drift (failed_recoverable) /
timeout (expired) / rollback (both rollback success and failure). Interaction semantics follow
`docs/protocols/production-use-case-v0.1.md` (B3/F3 candidate draft); visual and interaction
acceptance follows design standard v0.6.1 (`docs/design/design-standard.md`, now tracked
and managed in the repository). The experience is hosted
in the workshop page (§2.2/§8.5: execution, waiting and recovery are task progress inside Assembly;
no separate Production user stage); the primary/secondary navigation and PageId structure are
untouched.

| Asset group | Target owner | Delivered in this slice | Verification |
| --- | --- | --- | --- |
| F3 port extension (seven methods + material-pick placeholder + composite capability report + discriminated-union value types, all `schemaVersion: 1` with not-connected fallbacks) | `src/renderer/gateway/model-production-port.ts`, `empty-gateway.ts`, `index.ts` | `startInspection/getInspection/requestPlan/getPlan/confirmPlan(planId, revision)/recover(taskId, decision)/getBuildRecord`; `pickMaterial` is the explicit placeholder until the Kernel file dialog exists (not-run always returns null); `ModelProductionView` gains `productionRun` | `model-production-port.contract.test.ts` (16 tests, empty/fixture dual implementations) |
| Flow pure model (port data → view props; five-lifecycle display mapping; color discipline: orange = running/done, amber = awaiting confirmation, red = blocking only; explicit expired-confirmation state; disabled-reason keys) | `src/renderer/features/workshop/production-flow-model.ts` | `productionFlowModel()` + `phaseOfRun/toneForPhase` (exhaustive switches); `primaryAction` (at most one primary action per screen) | `production-flow-model.test.ts` (15 tests: five states × loading/failure/not-connected/empty + enum parity) |
| Workshop-page F3 flow section (material entry bar / inspection card / plan review card / recover card / build record card; in-page cards + DelayedButton, no new Dialog primitive) | `src/renderer/features/workshop/` (MaterialEntryBar/InspectionCard/PlanReviewCard/RecoverCard/BuildRecordCard/ProductionFlowSection + WorkshopPage wiring + workshop.css) | Four honest states: Skeleton while loading / EmptyState+retry on failure / EmptyState for not-connected / whole section hidden when the capability is not ready; existing idle/running/replay behavior and the four replay tapes untouched | Full vitest run (including the pre-existing 274 tests); boundary/contrast gates |
| Five-lifecycle fixtures + eight dev scenarios + task-center linkage | `src/renderer/gateway/fixture-production.ts`, `fixture-signal.ts`, `fixture-gateway.ts`, `app/resolve-scenario.ts`, `app/DevScenarioBar.tsx` | A scripted timeline drives the run view; every production command creates a standard task (await_confirmation → waitingInput, originPage=workshop with back-to-origin jump); task cancellation propagates to the run; scenarios: `production-inspect/plan/running/success/cancelled/drifted/expired/rollback` | Contract tests cover all eight scenarios plus cancel/recover/expired-reconfirm paths |
| Four-locale i18n (en is the structural source): new `strings.productionFlow` section + eight `strings.dev` labels | `src/renderer/i18n/strings.{en,zh-CN,ja,ko}.ts`, `strings.fixtures.zh-CN.ts` | Enum keys mirror the TS unions 1:1 (parity-tested); terms flow through termLabel; fixture copy lives only in the fixtures table | `check-i18n`, `check-i18n-tables`, `i18n.test` |

### Explicitly out of scope in this slice

- **Contracts not registered**: `production.*` is not in the `packages/contracts` method table (a B3
  alignment action, deferred to a later slice);
- **Live not wired**: `electron-gateway.ts` still reuses the not-run modelProduction port, and
  production builds show the honest empty state;
- **Kernel file dialog not implemented**: material selection is the `pickMaterial` port placeholder;
  the fixture returns a synthetic MaterialRef;
- The legacy orphan keys in `strings.wizard` (around zh-CN lines 1260-1271: wrongStep/onlyReview/
  noProject/required/labels.{outfit,outfitArmature,toggleName,workflowId}) were evaluated and found
  to carry legacy "step-wizard form validation" semantics that do not fit plan review
  (stages/risks/diffs/revision confirmation) — **not adopted, left as-is**; their ownership question
  is deferred to the wizard slice.

Task-center integration: fixture production tasks flow into the Taskbar through the existing
TaskPort; the waitingInput row's "back to origin page" entry (existing TaskRow behavior) +
`originPage: "workshop"` completes the jump back to the workshop, with no structural Taskbar change.
`runState` consumes the frozen `WorkflowRunState` 11-state vocabulary and the
`taskStatusForWorkflow` projection directly — no parallel enum was created; cancellation is a task
fact rather than a workflow state, expressed on the run view as the `cancelled` flag (draft
cancellation discipline).

## Slice 5: F7a overlay dual-surface demo (2026-09-05, worktree kimi/frontend)

UI/UX-first slice for the two Overlay surfaces — desktop and VR — with demo placeholder content
(not final). Scope: a versioned `OverlaySnapshot` contract mirror + a narrowed Surface Port
(snapshot/subscribe/dispatch) + a pure presentation model + two earliest-diverted render surfaces
(`?surface=overlay-desktop` / `?surface=overlay-vr`) + a DEV-only demo port + the
`preview:overlay` preview/capture script. Basis: `docs/architecture/integrations-and-overlays.md`
§Overlay (both surfaces share one presentation state behind a narrowed port with semantic actions;
no VRChat injection), design standard v0.6.1 §8.8 (higher text contrast, fewer levels, larger
targets; no frosted glass / complex backgrounds / long lists; the desktop fallback is always
visible), and the S-F7a spike evidence (`scripts/spike-overlay.mjs` for the desktop shape,
`spikes/steamvr-overlay` for IVROverlay_028 texture streaming and event polling — untouched by
this slice).

| Asset group | Target owner | Delivered in this slice | Verification |
| --- | --- | --- | --- |
| Overlay contract mirror + port + assembly point (`schemaVersion: 1`; three `OverlayAction` semantic actions; the DEV demo port is assembled behind `import.meta.env.DEV` folding + dynamic import, production stays inactive) | `src/renderer/features/overlay/` (overlay-contract/overlay-port/overlay-port-instance/demo) | Same conventions as tutorial-contract/tutorial-port; cancellation is request semantics (`request_cancel_task` only while a task is running) | `overlay-model.test.ts` (14 tests: task/no-task × desktop/vr × inactive/failure + enum parity) |
| Presentation model (section visibility / action availability with disabled-reason keys / tone mapping: accent=running, amber=waiting, red=blocking only / no fabricated progress / VR environment truncation ≤3) | `src/renderer/features/overlay/overlay-model.ts` | Pure function, no IO, no copy literals; consumes the frozen `WorkflowStage` vocabulary — no parallel enum | Same test matrix |
| Desktop surface (keyboard/mouse: drag-region titlebar + close chrome, Tab focus ring, Esc to close, hover states, 32–40px targets, single primary action, DelayedButton delayed confirm) and VR surface (laser tap: flat 1024×768 panel, no hover dependency, ≥56px targets, ≤3 large buttons, two-step cancel confirm with timeout revert, no decorative animation) | `src/renderer/features/overlay/DesktopOverlaySurface.tsx`, `VrOverlaySurface.tsx`, `overlay.css` | Four honest states (skeleton / failure+retry / inactive empty / ready), 4000ms first-frame timeout as in TutorialSurface; close always available (falls back to `nativeWindow?.close()`); earliest diversion in `main.tsx`, never entering the main shell | Full vitest run + check:boundary/check:i18n/check:contrast/check:leak |
| Four-locale `strings.overlay` section (en is the structural source; enum keys mirror the TS unions 1:1) + demo payload in `strings.fixtures.zh-CN.ts` (task title reuses `tasks.assembly`) | `src/renderer/i18n/strings.{en,zh-CN,ja,ko}.ts`, `strings.fixtures.zh-CN.ts` | Demo state shows the existing `strings.common.fixtureBadge`; fixtures header comment updated for the new reference chain | `check-i18n`, `check-i18n-tables`, enum-parity tests |
| `preview:overlay` script (desktop preview window by default; `--vr` 1024×768 fixed window; `--both` opens both; `--capture <out.rgba>` renders the VR surface offscreen → BGRA→RGBA raw bytes + `.json` metadata) | `apps/desktop/scripts/preview-overlay.mjs`, `apps/desktop/package.json` | Renderer address: `VUA_RENDERER_URL` → dev-server probe → dist artifact fallback (loud failure when missing); the capture artifact is the seam product feeding `SetOverlayRaw` in spikes/steamvr-overlay | Manual / later-slice on-device walkthrough |

### Explicitly out of scope in this slice

- **Desktop always-on-top/click-through toggling, VR texture streaming and event return are
  Kernel/spike-side seams**: this slice wires nothing live (no overlay-window creation, no
  IVROverlay helper process, no action-return channel);
- **Demo data is DEV-only**: the demo port is reachable only from the `import.meta.env.DEV`
  branch; production builds always show the inactive honest empty state (guarded by check-leak
  fingerprints);
- `OverlaySnapshot` is a renderer-local mirror; the formal versioned contract enters
  `packages/contracts` with the Overlay wiring slice, which must align to this mirror rather than
  coining a second vocabulary.
