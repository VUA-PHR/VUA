# VUA Desktop App (@vua/desktop)

[English](README_EN.md) | [简体中文](README_ZH.md)

> Status: Accepted
> Scope: Electron Main / Preload / Renderer, package scripts, and quality gates
> Updated: 2026-09-04
> Authority: development entry point and known-issue record; product boundary and contracts live in `docs/`

## Development commands

Run `pnpm install` at the repository root first:

| Command | Purpose |
| --- | --- |
| `pnpm dev` (`pnpm --filter @vua/desktop dev`) | Joint Main + Renderer development launch |
| `pnpm --filter @vua/desktop typecheck` | Strict type check for both renderer and electron tsconfigs |
| `pnpm --filter @vua/desktop test` | vitest unit tests |
| `pnpm --filter @vua/desktop build` | Builds `@vua/orchestrator-provider` first, then emits to `dist/` |
| `pnpm --filter @vua/desktop check` | typecheck + test + build + 5 quality gates |
| `pnpm --filter @vua/desktop smoke:remote-permissions` | Real remote permission smoke (evidence written to `_local_m1/<version>/`, not committed) |
| `pnpm --filter @vua/desktop start` | Build and launch the packaged artifact |

Quality gates: `check:boundary` (Gateway only via the barrel; renderer must not import `electron`/`node:`/`@tauri-apps`),
`check:i18n` + `check:i18n-tables` (no CJK literals; locale tables aligned), `check:contrast` (WCAG AA in 5 contexts),
`check:leak` (zero fixture leakage into the production build).

## Known notes

1. **Build the provider first on a fresh clone**: the `@vua/orchestrator-provider` runtime
   entry points to `dist/index.js`, while the desktop `test` script runs before `build` —
   running `pnpm --filter @vua/desktop test` directly on a fresh clone (right after
   `pnpm install`) fails to resolve the package because `dist/` is missing. Run
   `pnpm build` once (the root script builds all packages in topological order) or
   `pnpm --filter @vua/orchestrator-provider build` before testing. Fixing the ordering
   (e.g. in the root `check` or ahead of the package `test`) is deferred to the M2/CI
   slice for a decision.
2. **Stale version string left on the M line**: on the `glm/orchestrator` branch the M1
   shell's `src/renderer/gateway.ts` browser-fallback snapshot still carries
   `productVersion: "0.4.0-dev"`. That file is already deleted on this branch (full
   presentation migration) and replaced by the `src/renderer/gateway/` port system; it
   disappears when this branch merges back to the main line and is visible only while the
   M line stands alone. It blocks no gate.

## Migration and verification records

- Presentation asset migration record: [MIGRATION_ASSETS_EN.md](MIGRATION_ASSETS_EN.md) / [MIGRATION_ASSETS_ZH.md](MIGRATION_ASSETS_ZH.md);
- Legacy repository asset ledger: `docs/migration/asset-ledger.md`;
- Release notes: `docs/release/`.
