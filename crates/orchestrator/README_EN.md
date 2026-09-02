# VUA Orchestrator

This crate is the current testable application-core baseline for VUA. It contains environment and
tool capability checks, the task runtime, recoverable local state adapters, process ports, Recipe and
Assembly application behavior, Unity Bridge job support, and synthetic fixtures.

Its Rust implementation, crate layout, hosting model, and transport are implementation details rather
than product invariants. Renderer code reaches it only through the versioned application Gateway and
does not depend on private crate types.

Current verification covers workspace check, locked tests, Clippy with warnings denied, SQLite `0.1`
authoritative task state, per-project fencing leases, the supervised Provider process, and shared
Unity Bridge request/result examples. Later phases still own real Electron Gateway integration, the
first Orchestrator-to-Unity use case, final three-path project-management adapters, and release-artifact
verification.

The repository is licensed under Apache-2.0. Third-party dependencies retain their own licenses; see
the root third-party notices.

See the [Orchestrator migration asset record](MIGRATION_ASSETS_EN.md) for the B0 classification of
existing behavior, rejected assumptions, and transitional persistence debt.
