# VUA Desktop App (@vua/desktop)


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

1. ~~Build the provider first on a fresh clone~~ **Fixed (M2 closure, 2026-09-04)**: the
   desktop `test` script now chains the `@vua/orchestrator-provider` build first, so
   package-level `test` / `check` work directly on a fresh clone without the earlier
   missing-`dist/` resolution failure.
2. ~~Stale version string left on the M line~~ **Resolved with the M2 closure
   (2026-09-04)**: the file was deleted; version strings are carried by `app-meta.ts` and
   the package.json files.

## Migration and verification records

- Presentation asset migration record: [MIGRATION_ASSETS.md](MIGRATION_ASSETS.md) / [MIGRATION_ASSETS.md](MIGRATION_ASSETS.md);
- Legacy repository asset ledger: `docs/migration/asset-ledger.md`;
- Release notes: `docs/release/`.
