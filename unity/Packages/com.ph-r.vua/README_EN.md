# VUA Unity Bridge

This global Unity `2022.3.22f1` Editor package is the deterministic execution boundary between VUA
Orchestrator and a Unity project. The current package implements project inspection, asset identification, Modular
Avatar outfit installation, menu toggles, assembly validation, and local performance estimation.

The exact production target and migration/unsupported editor classes are defined by the
[Unity editor compatibility policy](../../../docs/compatibility/unity-editor_EN.md). Every Unity
version other than exact global `2022.3.22f1`, as well as Tuanjie Engine, is outside this package's
execution support.

The machine contract is defined by the repository's `schemas/unity-bridge/v1/` directory; see the
[English protocol](../../../docs/protocols/unity-bridge-v1_EN.md). Package tests create synthetic
objects at runtime and contain no paid Avatar or outfit assets.

The package is licensed under Apache-2.0. Its declared Unity package dependencies retain their own
licenses and are not relicensed by VUA.
