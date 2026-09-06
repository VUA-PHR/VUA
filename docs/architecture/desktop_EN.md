# Electron desktop and presentation architecture

[English](desktop_EN.md) | [简体中文](desktop_ZH.md)

> Document version: 1.0.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors desktop_ZH.md at 1.0.0)
> Scope: `apps/desktop`, `packages/design-system`, frontend Gateway
> Updated: 2026-09-06
> Last conformance review: 2026-09-06
> Normative effect: Yes

## Technology decision

The desktop shell uses Electron; presentation uses React, TypeScript, and Vite. Electron Main hosts a
small Node.js Kernel. Kernel owns bootstrap, desktop security, Gateway, and Orchestrator Provider
lifecycle; React UI provides the controlled presentation surface, and Orchestrator, AMF, BDL, and
Unity Bridge retain their defined ownership. Built-in behavior wires directly to its owning
application use cases without a generic module registry or runtime composition framework.

## Process responsibilities

### Renderer

- Renders the local UI and owns temporary page/input state.
- Uses only the injected typed Gateway for commands, queries, and task actions.
- Imports presentation packages and the injected Gateway contract.
- Reads authoritative task, Recipe, and recovery state from Orchestrator snapshots.

### Preload

- Exposes a minimal explicit versioned API through `contextBridge`.
- Validates channel, request size, and caller origin.
- Exposes allowlisted application calls with typed request and response values.
- Gives remote pages an empty VUA capability surface.

### Main

- Owns windows, lifecycle, deep links, and updates.
- Separates local UI from Main-managed remote `WebContentsView` instances.
- Owns purpose-partitioned sessions and desktop enforcement for cookies, permissions, navigation,
  download transport, origins, destinations, types, and external protocols.
- Owns Kernel bootstrap, security policy, Provider hosting/supervision,
  diagnostics, and community-plugin host boundary.
- Hosts or supervises the selected Rust Orchestrator Provider and maps allowed calls to the versioned
  application contract without exposing its transport to the Renderer.
- Delegates AMF, Recipe, recovery, and compatibility behavior to application use cases.

Core catalog entries represent trusted behavior built directly into VUA and gain no authority through
runtime registration. The future community plugin host provides a separate capability context.

Main returns normalized navigation/download events through narrow ports and retains `Session`,
`WebContents`, `DownloadItem`, cookies, and tokens. AMF owns acquisition intent, task and source
correlation, post-download inspection, and Warehouse/BDL decisions.

## Remote content isolation

Remote content uses `nodeIntegration: false`, `contextIsolation: true`, sandboxing, an isolated
session partition, origin-scoped permission grants, and allowlisted navigation, windows, downloads,
and protocols. Its capability surface contains standard web APIs. AMF validates observed page data
for type, size, and source before persistence. Main-managed `WebContentsView` is the remote-content
surface.

## React and release boundaries

React implements workbenches, guidance, cards, Recipe editing, feedback, and accessibility while
domain models remain in the application core. Typed error codes map to localized messages. Accepted tasks survive
page unload. Drag-and-drop always has keyboard and button alternatives. Tokens and components are
promoted only after real-page validation.

Electron, Chromium, Node.js, packaging, the selected Orchestrator Provider, and native dependencies
are version-locked. The independent supervised Provider executable is packaged and verified for the
supported Windows architecture according to the accepted hosting decision. Releases require
dependency/license review, Electron security checks, remote-permission tests, signing, and update
rollback validation. The redistribution review authorizes each bundled binary.

## Document changelog

- 1.0.0 (2026-09-06): entered version management; header normalized and conformance-review date
  added. Content reviewed against reality with no change.
