# Electron Presentation Asset Migration Record

> Status: In progress
> Legacy source: `_references/kimi-desktop-5870d0c/apps/desktop`
> Current ruling: restore legacy presentation assets on Electron and validate visual and interaction behavior against the accepted `design-standard-v0.6.1`

This record does not restore the Tauri host, IPC, permissions, or product data contracts. Electron process isolation, the narrow Gateway, remote-content isolation, and current module ownership remain in force.

| Asset group | Target owner | Preserved in this slice | Explicitly rejected | Verification |
| --- | --- | --- | --- | --- |
| Tokens and base styles | `packages/design-system` | Dark-first theme, purple/orange districts, light and high-contrast mappings | Tauri/WebView-specific selectors | TypeScript check and Renderer production build |
| Primitives | `packages/design-system` | Button, Card, Badge, EmptyState, StatusLight, pixel assembler | Domain rules and authoritative task state | TypeScript check and real-page use |
| Shell and navigation | `apps/desktop/src/renderer` | Legacy fixed regions, header, sidebar, taskbar, and workshop-track presentation | Tauri window API and direct Node/Electron imports | Pure navigation test and Electron startup smoke test |
| Minimal Desktop Gateway v1 | `packages/contracts`, Main, and Preload | Explicit version, request ID, size limit, sender restriction, app snapshot | Handwritten Rust-private types, generic IPC, shell and filesystem capabilities | Contract and origin-rejection tests |
| Tauri browse/external/image/tutorial ports | Not migrated yet | Behavioral requirements only | All Tauri commands, events, WebviewWindow code, and custom-protocol implementation | Later Electron-specific slice |
| BDB, Catalog, and legacy fixtures | Excluded from this slice | None | Legacy BDB identities, APIs, snapshots, and demo production data | These modules are absent from the production bundle |

## Slice verification

- `pnpm check`: passed, with six tests passing;
- `pnpm build`: passed;
- Windows Electron Main, Preload, and Renderer joint startup: passed; the responsive window title was `VUA`;
- all Electron child processes exited after the smoke test.
