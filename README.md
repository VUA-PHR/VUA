# VUA — VRC Ultra Assistant

English | [简体中文](README_ZH.md) | [日本語](README_JA.md) | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

VUA is a Windows-first, local-first desktop production environment for VRChat players. It brings
environment setup, authorized asset acquisition, Avatar assembly and inspection, local asset
management, and reproducible production records into one connected workflow.

> [!IMPORTANT]
> **The current product version is v0.6.0 (pre-alpha); see [docs/release/](docs/release/) for
> release notes.** This repository provides developer previews and early evaluation builds; the
> everyday-player stability commitment begins with `1.0.0`.

## Product direction

VUA starts from the user's intended result. A user selects a goal—such as preparing an environment
or producing an Avatar from selected assets—and VUA plans the required steps, executes deterministic
Unity operations through the Unity Bridge, validates the result, and retains a reviewable Build
Record.

The goal is to let users choose the destination while VUA handles the route: dependencies, project
preparation, import order, binding, menus, optimization, validation, and recovery.

## Main modules

- **Desktop application:** Electron, React, TypeScript, and Vite, with a narrow typed Gateway and
  isolated remote web content.
- **Kernel and application host:** a small Node.js Kernel owns bootstrap, desktop security, Gateway,
  and Orchestrator Provider lifecycle; the React UI forms the controlled presentation surface.
- **Environment and project management:** guided checks and setup for VR, Unity, VRChat, and related
  tooling; a VUA package manager built on `vrc-get`; compatibility with ALCOM- and VCC-managed
  projects. The VPM package-management settings (the repository-subscription and
  local-package-registry faces of `settings.json`) are shared as one file with VCC/ALCOM; see the
  [product boundary](docs/product-boundary_EN.md).
- **Orchestrator:** the Rust application core for plans, approvals, durable tasks, cancellation,
  recovery, adapters, and Build Records, exposed through a replaceable versioned Provider boundary.
- **Avatar MegaFactory (AMF):** a Recipe-first production flow with five user stages: Warehouse,
  Recipe, Assembly, Inspection, and Release.
- **BDL (Booth Database Local):** an AMF-private local module for catalog, source, terms,
  compatibility, search, and Warehouse mapping metadata.
- **Unity Bridge:** a versioned protocol for deterministic operations on global Unity
  `2022.3.22f1`; historical projects use the documented migration path.
- **Desktop and VR overlays:** status and guidance surfaces backed by stable application services;
  the VR overlay is a post-`1.0.0` direction anchor.
- **Plugin protocol:** a planned, capability-declared extension boundary. Initial delivery covers the
  protocol and host security model; marketplace governance follows a later release decision.

Runtime integrations such as SlimeVR Server and VRCFaceTracking begin implementation after `1.0.0`.

## Architecture boundary

```text
React View
  -> typed frontend feature / Gateway
  -> Electron preload and main-process adapter
  -> versioned application contract
  -> Orchestrator use case
  -> domain port
  -> local or third-party adapter
```

Views reach local capabilities exclusively through the typed Gateway. Remote pages run in isolated
sessions with web privileges. AMF exclusively exposes BDL capabilities, and deterministic Unity
changes cross the Unity Bridge.

## Security and distribution boundaries

- Platform purchase, payment, identity, age, authentication, and access controls remain authoritative.
- BOOTH sessions, orders, downloads, paid assets, and production state remain on the user's device.
- Repository and cloud-CI tests use structurally representative synthetic data without real product
  or user content. Public BOOTH pages may be checked by local, read-only compatibility tests.
- Developers may validate Unity workflows locally with assets they lawfully obtained. Paid assets,
  user projects, credentials, captured page content, production data, and private logs stay local.
- Each third-party binary requires an individual license, redistribution, update, signature, and
  notice review before it may be bundled.

## Documentation and contributing

- [Developer documentation — English](docs/README_EN.md)
- [开发文档 — 简体中文](docs/README_ZH.md)
- [Versioning policy — English](docs/release/versioning_EN.md)
- [版本政策 — 简体中文](docs/release/versioning_ZH.md)
- [Contributing — English](CONTRIBUTING_EN.md)
- [贡献指南 — 简体中文](CONTRIBUTING_ZH.md)

The repository is licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE),
[trademark guidance](TRADEMARKS_EN.md), and [third-party notices](THIRD_PARTY_NOTICES_EN.md).
Product releases follow Semantic Versioning 2.0.0; versioned protocols and schemas retain their own
independent compatibility versions.

Copyright 2026 Aran52.
