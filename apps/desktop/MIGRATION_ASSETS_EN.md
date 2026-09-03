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
  product version is now `0.4.1` with release notes in `docs/release/v0.4.1_EN.md` /
  `_ZH.md`; M1 is marked as passed in the development plan (EN and ZH).

## Slice 2: full legacy presentation asset restoration (this slice)

The remaining KIMI presentation assets (feature pages, application models, four-locale i18n, WebGL scenes, remaining primitives) and the five quality-gate scripts are migrated into the Electron shell. Scheduling remains governed by `docs/plans/development-outline` (the F2–F7 application-contract integrations proceed as planned; this slice restores presentation and pure models only, and fabricates no production data).

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
