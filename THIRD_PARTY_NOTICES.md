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
| `scraper` | ISC | HTML parsing for BOOTH page extraction |
| `url` | MIT OR Apache-2.0 | VPM repository URL parsing |
| `flate2`, `tar` | MIT OR Apache-2.0 | gzip/tar archive handling for `.unitypackage` materials |
| `zip` | MIT | zip archive writing for local VPM artifacts |
| `md-5` | MIT OR Apache-2.0 | official Unity Editor manifest checksum comparison |
| `windows-sys` | MIT OR Apache-2.0 | Windows Job Object process-tree supervision, Win32 window enumeration and focus for editor handoff, and native installer elevation |
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

## Official Unity tools (N1)

Unity CLI is acquired from Unity. Region and the mirror preference select the order of the
official Unity Editor source and [NoUnityCN](https://www.nounitycn.top/), whose version page and
published transfer service provide the original Unity installer. Disabled mirrors leave only
the official source; unsuccessful acquisition offers a Unity Hub installation handoff.
NoUnityCN's website source is [MIT-licensed](https://github.com/DanKE123abc/NoUnityCN/blob/main/LICENSE);
VUA's adapter uses its download page and does not bundle its website code. Unity CLI and Editor
are proprietary Unity offerings governed by [Unity terms](https://unity.com/legal/terms-of-service)
and [Editor software terms](https://unity.com/legal/editor-terms-of-service/software), not VUA’s
Apache-2.0 license. VUA does not bundle or mirror these tools or grant a Unity license. Users
complete authorization, license selection and agreement acceptance through Unity’s own tooling.
The [deployment direction](docs/architecture/unity-deployment.md) specifies acquisition, native
installation and official CLI registration. Unity Hub is optional.

## Optional external integrations (N2)

The planned N2 adapters discover, launch and guide setup of independently installed applications.
Neither application nor its dependencies are bundled with VUA under this delivery model. Users
obtain official distributions from Steam or upstream; those distributions retain their own terms.
This describes the selected integration model, not completed runtime acceptance. Sources below
were checked on 2026-09-30 and are moving references, not release pins.

| Application | Upstream license / attribution | Planned VUA connection |
| --- | --- | --- |
| [VRCFaceTracking](https://github.com/benaclejames/VRCFaceTracking) | [Apache-2.0](https://github.com/benaclejames/VRCFaceTracking/blob/master/LICENSE); copyright 2024 benaclejames | Discover, guide official installation, launch, and explain hardware-module/OSC setup; no source or binary redistribution |
| [hyblocker/OpenVR-SpaceCalibrator](https://github.com/hyblocker/OpenVR-SpaceCalibrator) | [MIT core with separately licensed third-party components](https://github.com/hyblocker/OpenVR-SpaceCalibrator/blob/develop/LICENSE); copyright 2023–2026 Hyblocker and contributors, 2020–2022 Justin Li and contributors | Discover, guide official installation, launch, and explain device selection/calibration in the upstream UI; no modified build or bundled driver |

VUA guides users to add these applications to their Steam library, install them through Steam,
and launch their independent installations through supported external entry points. Upstream
applications retain their own features, dependencies and license inventories; Space Calibrator's
full distribution has terms beyond its MIT core. Those terms are distinct from VUA's Apache-2.0.

If a later VUA release incorporates, modifies or redistributes source/binaries from either tool,
review the exact version and all included dependencies before release; preserve applicable license,
copyright, attribution/NOTICE and modification notices. External connection alone is not permission
to redistribute.

## Distribution rule

Before a binary release, the project must generate and review a complete dependency and license
inventory for that exact build, preserve all required license and attribution texts, and separately
approve every bundled third-party binary. Support for connecting to externally installed software
does not imply permission to redistribute it.

If this summary conflicts with a dependency's license text, the dependency's license text controls.
