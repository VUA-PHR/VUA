# VUA Desktop App (@vua/desktop)


> Status: Accepted
> Scope: Electron Main / Preload / Renderer, package scripts, and quality gates
> Updated: 2026-10-01
> Authority: development entry point; product boundary and contracts live in `docs/`

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
| `pnpm --filter @vua/desktop smoke:remote-permissions` | Real remote permission smoke (evidence written to `_local_m1/<version>/`, not committed; the `_local_m*` directory names are historical M-line naming) |
| `pnpm --filter @vua/desktop start` | Build, then launch the unpacked app with Electron (`pnpm build && electron .`; no installer is produced) |
| `pnpm --filter @vua/desktop smoke:m2-deliverables` | Provider lifecycle and task-recovery smoke: kill/disconnect, restart recovery, multi-window event broadcast (evidence under `_local_m2/<version>/`, not committed) |
| `pnpm --filter @vua/desktop smoke:remote-content` | Isolated remote WebContentsView red-line smoke: no preload/Node, permission and navigation denials (evidence under `_local_m4/<version>/`, not committed) |
| `pnpm --filter @vua/desktop smoke:download-port` | Download-port event normalization smoke against a local HTTP fixture, including policy denial and cancel/rebind (evidence under `_local_m4/<version>/`, not committed) |
| `pnpm --filter @vua/desktop smoke:f4-deliverables` | Aggregates the remote-permissions, remote-content and download-port smokes and records their exit codes and evidence locations |
| `pnpm --filter @vua/desktop smoke:production-review` | Production-page Chromium DOM regression with a synthetic Gateway; no production or remote services |
| `pnpm --filter @vua/desktop smoke:import-dialog` | Material-import dialog Chromium DOM smoke with a synthetic Gateway; no production or remote services |
| `pnpm --filter @vua/desktop smoke:resource-monitor` | Top-bar resource-monitor Chromium DOM smoke with a synthetic host; asserts zero window-blur listener leaks via CDP |
| `pnpm --filter @vua/desktop preview:overlay` | Interactive overlay preview windows: desktop surface by default, `--vr` VR surface, `--both`, or offscreen `--capture` |

Quality gates: `check:boundary` (Gateway only via the barrel; renderer must not import `electron`/`node:`/`@tauri-apps`),
`check:i18n` (no CJK literals; locale tables aligned, including table validation), `check:contrast` (WCAG AA in 5 contexts),
`check:leak` and `check:forest-leak` (production leakage checks).

## Migration and verification records

- Presentation asset migration record: [MIGRATION_ASSETS.md](MIGRATION_ASSETS.md);
- Legacy repository asset ledger: `docs/migration/asset-ledger.md`;
- Release notes: `docs/release/`.
