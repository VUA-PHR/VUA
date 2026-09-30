# VUA Desktop App (@vua/desktop)


> Status: Accepted
> Scope: Electron Main / Preload / Renderer, package scripts, and quality gates
> Updated: 2026-09-30
> Authority: development entry point and known-issue record; product boundary and contracts live in `docs/`

## Development commands

Run commands below from the repository root. The current [Windows CI baseline](../../.github/workflows/ts.yml)
uses Node.js 24 and Rust 1.97.1; [package.json](../../package.json) pins pnpm 11.19.0.
Install the Windows Rust/MSVC build prerequisites before starting: the initial desktop build
also compiles the Rust Provider. Unity and user accounts are needed for their corresponding real
flows, not for editing the desktop shell.

```powershell
pnpm install --frozen-lockfile
pnpm --filter @vua/desktop build
pnpm dev:desktop
```

This launches the development app, not a verified user installer. For a change, choose the relevant
checks below; documentation-only edits need document/link checks rather than a local full build.
The existing remote PR workflow still determines its own required checks.
The development launcher does not rebuild the Rust Provider; repeat the build after backend changes.

| Command | Purpose |
| --- | --- |
| `pnpm dev:desktop` | Joint Main + Renderer development launch |
| `pnpm --filter @vua/desktop typecheck` | Strict type check for both renderer and electron tsconfigs |
| `pnpm --filter @vua/desktop test` | vitest unit tests |
| `pnpm --filter @vua/desktop build` | Builds `@vua/orchestrator-provider` first, then emits to `dist/` |
| `pnpm --filter @vua/desktop check` | typecheck + test + build + boundary, i18n, contrast and leakage checks |
| `pnpm --filter @vua/desktop smoke:remote-permissions` | Real remote permission smoke (evidence written to `_local_m1/<version>/`, not committed) |
| `pnpm --filter @vua/desktop start` | Build and launch the packaged artifact |

Quality gates: `check:boundary` (Gateway only via the barrel; renderer must not import `electron`/`node:`/`@tauri-apps`),
`check:i18n` (including table validation) (no CJK literals; locale tables aligned), `check:contrast` (WCAG AA in 5 contexts),
`check:leak` and `check:forest-leak` (production leakage checks).

## Known notes

1. ~~Build the provider first on a fresh clone~~ **Fixed (M2 closure, 2026-09-04)**: the
   desktop `test` script now chains the `@vua/orchestrator-provider` build first, so
   package-level `test` / `check` work directly on a fresh clone without the earlier
   missing-`dist/` resolution failure.
2. ~~Stale version string left on the M line~~ **Resolved with the M2 closure
   (2026-09-04)**: the file was deleted; version strings are carried by `app-meta.ts` and
   the package.json files.

## Migration and verification records

- Presentation asset migration record: [MIGRATION_ASSETS.md](MIGRATION_ASSETS.md);
- Legacy repository asset ledger: `docs/migration/asset-ledger.md`;
- Release notes: `docs/release/`.
