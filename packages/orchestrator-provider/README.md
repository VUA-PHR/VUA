# Orchestrator Provider

This package defines the replaceable Orchestrator Provider v0.1 interface used inside the Electron
Kernel and supplies both a controlled mock adapter with no dependency on Rust, Electron, FFI, child
processes, SQLite, or Unity and the B2-selected supervised independent-process adapter.

The Provider accepts versioned application values and owns lifecycle coordination. Renderer code
does not import this package. The process adapter accepts absolute executable and database paths,
uses a restricted environment and shell-free pipe protocol, and handles handshake, crash, restart,
and safe shutdown explicitly.

See the [VUA Application Contract v0.1](../../docs/protocols/application-contract-v0.1.md) and
[Supervised Provider Process Protocol v0.1](../../docs/protocols/provider-process-v0.1.md).
