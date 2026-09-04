# ADR: VUA instance identity and multi-instance boundaries

[English](vua-instance-identity_EN.md) | [简体中文](vua-instance-identity_ZH.md)

> Status: Proposed
> Date: 2026-09-04
> Scope: Desktop shell, environment detection, installer/updater (M9/M10)

## Context

Pre-alpha VUA ships without an installer, so portable copies and parallel
development builds make multiple instances likely. Unmanaged, they collide
four ways: concurrent operation on one project, updates against running
executables, version-skewed writes to shared local state, and ambiguous
custom-protocol/file-association handoff. Project-level mutation is already
fenced (per-`ProjectIdentity` leases with generations in the task store).
Ecosystem evidence: VCC ships stable and beta side-by-side with separate
data directories (`VRChatCreatorCompanion` / `VRChatCreatorCompanion-Beta`,
observed on a live machine).

## Decision (proposed)

1. Instance identity is the triple **(channel, install form, version)**.
   Channels: `stable` / `beta` / `dev`. Install form: `installed` /
   `portable`.
2. Every install root carries a **marker file** (product, channel, version)
   at a fixed relative path; the installer writes it for installed builds,
   portable builds carry it in their root. Self-detection reads markers —
   it never scans.
3. **Data directories are per channel.** A data directory records the
   schema/processor versions that wrote it; an older instance refuses to
   open a newer data directory (version gate) instead of best-effort
   reading it.
4. **App-level single instance**: a named mutex per channel acquired at
   desktop-shell startup; a second instance exits after surfacing the
   running one. The environment detector reports the probe result as
   presence (`another_instance_running`) — a fact, severity stays with the
   frontend.
5. The environment check `vua_instances` is **out of scope until this
   contract and the installer exist**; detecting against invented paths
   would be fiction.
6. Cross-instance project mutation stays fenced by the existing
   `ProjectIdentity` leases regardless of instance identity.

## Consequences

The installer (M9/M10) and the future `vua_instances` detector share one
contract instead of inventing separate conventions. Portable and installed
builds coexist per channel; stable/beta data never mix. Version-skew state
corruption is blocked by the version gate. The cost is one marker file and
one mutex — no registry footprint is required by this decision.

## Alternatives considered

- A single shared data directory across installs and versions: rejected —
  version-skew writes are the corruption mode this ADR exists to prevent.
- Detecting other installs by scanning common paths before any installer
  exists: rejected — detection without a contract detects assumptions.
- Per-project identity only (status quo): rejected — it fences project
  mutation but leaves app-level exclusion, updates, and protocol handoff
  undefined.
