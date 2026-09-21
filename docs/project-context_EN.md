# VUA origin, evolution, and current context

[English](project-context_EN.md) | [简体中文](project-context_ZH.md)

> Status: Agent handoff summary  
> Scope: Current VUA repository  
> Updated: 2026-09-01  
> Normative effect: None; product boundary, versioned protocols, and accepted ADRs prevail

## How to use this document

Read the root [README](../README.md), then this handoff summary to understand why the current product
boundary exists. Use the [documentation guide](README_EN.md) before concrete work. Historical source
and migration records are evidence, not implementation authority.

## Origin and evolution

VUA began with practical problems faced by VRChat players in mainland China: unreliable access to
software, difficulty discovering and evaluating legitimately purchased BOOTH assets, and a
Unity/VRChat workflow that is hard for newcomers. The idea evolved from “one-click setup plus
tutorials” into a desktop system oriented around completing real production goals.

Avatar project trading also exposed a product need and a legal boundary. Players want legitimate
assets but may not know how to find, combine, and install them, while finished projects can contain
unauthorized copies. VUA therefore focuses on reproducible assembly when the user lawfully possesses
the referenced assets. A Recipe carries intent and identity, not paid files.

The product progressed through environment and assembly prototypes, a Recipe-first AMF concept, a
cloud-catalog experiment, and a desktop rebuild. The cloud pipeline coupled acquisition,
identification, deduplication, compatibility, and publication too tightly. Its retained value became
the AMF-owned local BDL. The desktop shell moved to Electron for consistent Chromium behavior,
isolated sessions, multiple remote views, and download management. React, TypeScript, and Vite remain.
The current direction adds a small non-plugin Node.js Kernel and explicitly composes trusted core
modules behind a VUA-owned boundary. The Rust Orchestrator uses a replaceable versioned Provider;
in-process native and supervised-process hosting remain candidates. Community plugins do not share
the trusted context; Unity Bridge remains unchanged. Kernel, Core, Plugin, and External each retain
their explicit authority boundary.

## Current product

VUA v0.4.0 is a Windows-first modular VRChat play and Avatar-production toolkit. Users choose goals
such as preparing an environment or producing an Avatar; VUA plans and performs the steps and keeps
recoverable task state and Build Records.

Ownership is explicit:

1. Electron owns windows, local UI hosting, isolated remote pages, sessions, and download transport;
   the Kernel owns bootstrap, trusted composition, Gateway enforcement, and Provider hosting/supervision.
2. The Rust Orchestrator owns plans, approval, durable tasks, cancellation, recovery, adapter
   coordination, and Build Records, exposed through a replaceable versioned Provider.
3. AMF owns the Warehouse → Recipe → Assembly → Inspection → Release production abstraction.
4. BDL is AMF's private local catalog, terms, compatibility, provenance, search, and mapping module.
5. Environment and project management prepare VR/Unity/VRChat and manage Unity projects.
6. Unity Bridge performs testable operations on global Unity `2022.3.22f1` through a versioned job
   protocol. Earlier VRChat editor projects enter through the migration path.
7. Core modules compose behind the Kernel-owned boundary; community plugins use a future public
   capability boundary; external integrations receive no VUA internal service.
8. Overlays and runtime integrations consume stable services; runtime-integration implementation
   starts after `1.0.0`.

## Stable ideas

- Users choose the intended outcome; the system manages the route.
- Recipe is portable intent and never distributes paid asset contents, custom textures, animation
  files, or Blueprint IDs.
- Build Record captures the locally resolved assets, versions, plan, operations, results,
  fingerprints, warnings, and recovery points.
- Deterministic Unity work goes through Unity Bridge instead of unversioned UI automation.
- Sessions, purchases, downloaded files, BDL data, and production state remain local.
- The UI reports real capability and provides a manual path when automation is unsafe.

## Compatibility and legal boundaries

Project management distinguishes VUA's own `vrc-get`-based package manager from compatibility with
ALCOM-managed and VCC-managed projects. Compatibility does not mean embedding or reproducing those
applications. BLM and VAE may be optional AMF acquisition/content adapters but never write BDL
directly or replace the native path.

The project does not bypass platform controls, commit paid or private user material, expose local
privileges to remote content, or let plugins access private databases and sessions. Final login and
Avatar upload remain in the official VRChat SDK Panel.

## Migration context

Reusable behavior, tests, design tokens, and deterministic Bridge work may be reimplemented after
their ownership, assumptions, verification, and license status are recorded. Desktop-framework
bindings, old cloud-catalog contracts, personal paths, paid fixtures, and unverified UI automation do
not cross into the current baseline. The detailed schedule lives in the
[development plan](plans/development-outline_EN.md); this history does not create requirements.

## Unresolved work

- Orchestrator hosting decision, Provider transport/error/shutdown behavior, and packaging;
- BDL identity, SQLite schema, observation, terms, and compatibility evidence models;
- Plugin isolation and any future directory or marketplace decision;
- the first real Electron slice, CI, installer, signing, and updates;
- real capability matrices for three project-management paths;
- later Recipe, Build Record, and Unity Bridge validation with lawfully held test assets.

Apache-2.0 and the public contribution policy are accepted repository decisions, not unresolved
release gates. Exact third-party redistribution approval still belongs to each binary release.
