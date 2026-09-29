# Third-party notices

VUA includes or depends on third-party software. Those components remain subject to their own
licenses; the repository's Apache-2.0 license does not replace them.

## Current source dependencies

The current Rust workspace directly declares the following third-party crates:

| Dependency | Declared license family | Role |
| --- | --- | --- |
| `vrc-get-vpm` | MIT | VRChat package and project operations |
| `tokio` | MIT | asynchronous runtime |
| `reqwest` | MIT OR Apache-2.0 | HTTP client |
| `rusqlite` | MIT | Orchestrator authoritative-task SQLite adapter |
| `serde`, `serde_json` | MIT OR Apache-2.0 | serialization |
| `sha2` | MIT OR Apache-2.0 | content hashing |
| `windows-sys` | MIT OR Apache-2.0 | Windows Job Object process-tree supervision |
| `jsonschema` | MIT | schema validation in tests |

`rusqlite` enables its `bundled` feature and statically builds SQLite, which is in the public domain.
The Orchestrator persistence adapter owns this dependency. It may be removed only by a replacement
that passes the same database-format, transaction, durability, and recovery characterization tests.

The Unity Bridge package declares VRChat Avatars SDK and Modular Avatar as Unity package
dependencies. They are resolved from their own package sources and are not relicensed by VUA.

This is a human-readable summary, not a complete generated bill of materials. `Cargo.lock`, Unity
package manifests, and `pnpm-lock.yaml` are the authoritative dependency snapshots.
Transitive dependencies currently include multiple permissive licenses and components under
licenses such as MPL-2.0, Unicode-3.0, Zlib, and CDLA-Permissive-2.0.

## First runtime-tool adaptation targets (N2)

These are the two planned N2 integrations, not a declaration that their binaries are currently
bundled or that modified builds have passed acceptance. Upstream license sources were checked
on 2026-09-29; branches below are moving references, not release pins.

| Component | Upstream license / attribution | VUA adaptation scope |
| --- | --- | --- |
| [VRCFaceTracking](https://github.com/benaclejames/VRCFaceTracking) | [Apache-2.0](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE); copyright 2024 benaclejames | External face-tracking integration; independently audit selected modules and dependencies |
| [hyblocker/OpenVR-SpaceCalibrator](https://github.com/hyblocker/OpenVR-SpaceCalibrator) | [MIT core and third-party notices](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE); copyright 2023–2026 Hyblocker and contributors, 2020–2022 Justin Li and contributors | Modified build retaining calibration and SteamVR driver, excluding SimpleBLE and base-station BLE management |

VRCFaceTracking distributions must retain the Apache-2.0 license, applicable attribution/NOTICE
and modification notices. The MIT portion of Space Calibrator retains its copyright and permission
notice; other included components keep their own licenses. Neither tool is relicensed by VUA.

Upstream explicitly says its SimpleBLE commercial grant does not cover forks. VUA's planned
variant must remove the SimpleBLE submodule, patch/build/link configuration and the base-station
BLE implementation, lifecycle calls, UI and configuration handling. Keep ordinary SteamVR
shutdown handling and calibration functionality; the [N2 acceptance](docs/development-outline.md)
owns the detailed removal and real-run criteria. Merely hiding the BLE page is insufficient.

Only remove a dependency notice from the modified distribution after confirming the corresponding
code and binary dependency are absent; retain notices for everything that remains. This summary
does not certify a source tree has already been cleaned. Before distribution pin the actual commit,
audit all remaining dependencies, record modifications, include complete applicable license texts
and validate the produced binary. Do not redistribute an unmodified official build as the planned
SimpleBLE-free variant.

## Distribution rule

Before a binary release, the project must generate and review a complete dependency and license
inventory for that exact build, preserve all required license and attribution texts, and separately
approve every bundled third-party binary. Support for connecting to externally installed software
does not imply permission to redistribute it.

If this summary conflicts with a dependency's license text, the dependency's license text controls.
