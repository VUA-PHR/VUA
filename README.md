# VUA — VRC Ultra Assistant

English | [简体中文](README_ZH.md) | [日本語](README_JA.md) | [한국어](README_KO.md)

[![rust](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/rust.yml)
[![ts](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/ts.yml)
[![schema-vectors](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml/badge.svg)](https://github.com/VUA-PHR/VUA/actions/workflows/schema-vectors.yml)

> "Packed up and ready!" — the MCV, *Command & Conquer: Red Alert*

**VUA (VRC Ultra Assistant)** is a Windows desktop production environment for VRChat
players — especially players who have never touched Unity, or don't yet know what they
need. Start from a goal and your own assets; VUA guides you through environment setup,
project preparation, Avatar assembly, inspection, and recovery.

> [!IMPORTANT]
> **Current status: v0.6.0 (pre-alpha).** This repository publishes developer previews.
> The capabilities below are implemented in the repository and covered by automated
> tests, but end-to-end validation on a real machine is still pending, and a few are
> not yet reachable from the UI. Treat every flow as early evaluation. The
> everyday-player stability commitment begins with `1.0.0`.

## What you can do with VUA

- **Set up your environment.** VUA checks hardware, software, and network, then builds
  an installation plan for your goal: the VR runtime and drivers your headset actually
  needs, Unity `2022.3.22f1`, the VRChat SDK, and optional tracking tools. Account
  registration and authorization always stay on official pages — VUA guides, it never
  signs for you.
- **Learn the game.** A five-part in-app tutorial covers setup basics, movement and
  menus, safety settings worth adjusting (`Personal Space`, `Allow Untrusted URLs`,
  Avatar display limits), and your devices. A SteamVR overlay tutorial is a
  post-`1.0.0` goal.
- **Produce an Avatar.** Pick assets from your Warehouse or import ones you own,
  combine them into a Recipe, and VUA runs the assembly inside Unity through a
  deterministic, versioned bridge — import order, bindings, menus, parameters — with
  snapshots and a recovery path at every step.
- **Inspect and keep records.** Every production run leaves a Build Record with its
  inspection evidence and logs. Problems surface both in the notification center and
  on the run record; closing a notification never makes a problem disappear.
- **Manage projects and packages.** A built-in package manager (based on `vrc-get`)
  handles VPM repository subscriptions, package install/upgrade/removal, local
  packages, and project creation — and VUA stays compatible with projects managed by
  ALCOM or the official VCC.
- **Share Recipes, not files.** A Recipe is a shareable text declaration: BOOTH asset
  references plus explicit, supported options such as colors, toggles, and transforms.
  It never contains paid assets, custom textures, or meshes — re-creators fetch the
  assets through their own BOOTH access.

## How it works

VUA is goal-first: you choose the destination, VUA plans the route. A wizard picks a
path by your goal, device, and current state instead of forcing every player through
one fixed pipeline. Every Unity change crosses the versioned Unity Bridge — never
unscripted UI clicking — and risky steps ask for explicit confirmation with a rollback
path ready.

Under the hood: an Electron desktop shell, a React UI behind a narrow typed Gateway,
and a Rust Orchestrator that owns use cases, durable tasks, and recovery. Details live
in the [architecture documentation](docs/architecture/system.md).

## VUA, AMF, and BDL

| Name | What it is |
| --- | --- |
| **VUA** | The Windows desktop client itself — this repository |
| **AMF** (Avatar MegaFactory) | VUA's production domain: Warehouse, Recipe, Assembly, Inspection, and Release |
| **BDL** (Booth Database Local) | AMF's private local catalog: your assets, their sources, and compatibility notes — on your disk, not a cloud service |

## Safety boundaries

- Paid assets are processed only on your PC — never uploaded to any server,
  repository, or diagnostic pipeline.
- VUA never collects VRChat, BOOTH, or Unity passwords, cookies, or two-factor codes,
  and never bypasses purchase, payment, age, authentication, or access controls.
- VUA does not inject into or modify the VRChat client. Login and the final Avatar
  upload stay in VRChat's official flow — you press the upload button in the
  official SDK.
- Shared Recipes contain structure, source references, and settings only.
- Technical checks report facts, not taste: they cannot guarantee an Avatar looks or
  behaves the way you expect.

## Where VUA is going

- `1.0.0`: the stability commitment for everyday players, gated by real-machine
  acceptance of the full flow.
- After `1.0.0`: the SteamVR overlay tutorial, runtime integrations (SlimeVR,
  VRCFaceTracking), and the plugin ecosystem — each behind its own accepted security
  decision.
- Accepted direction, not yet implemented: wizard path selection, Recipe overlay
  semantics with explicit conflict choices, share-time source supplement, and folding
  inspection fully into production records. An experimental, off-by-default
  compatibility-evidence collector may follow; BDL's local storage is unaffected
  either way.
- An independent lightweight UI (egui/Slint) is indefinitely deferred; the Electron
  resource-saving mode stays.

## Documentation

- [Documentation guide](docs/README.md) — the smallest route for every task
- [Product boundary](docs/product-boundary.md)
- [Architecture](docs/architecture/system.md)
- [v0.6.0 release notes (Chinese)](docs/release/v0.6.0.md)
- [Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md)

## License

The repository is licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE),
[trademark guidance](TRADEMARKS.md), and [third-party notices](THIRD_PARTY_NOTICES.md).
Product releases follow Semantic Versioning 2.0.0; versioned protocols and schemas retain
their own independent compatibility versions.

Copyright 2026 Aran52.
