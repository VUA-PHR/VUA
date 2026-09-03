# Unity editor compatibility

[English](unity-editor_EN.md) | [简体中文](unity-editor_ZH.md)

> Status: Accepted  
> Scope: Unity detection, project intake, AMF production, and Unity Bridge execution  
> Updated: 2026-09-02  
> Normative effect: Defines VUA's editor support matrix

## Support matrix

VUA matches the complete Unity editor version string, including release and distribution suffixes.
The Unity version is a capability identifier for this policy, not a SemVer range.

| Class | Editor versions | VUA behavior |
| --- | --- | --- |
| Production target | Global Unity `2022.3.22f1` exactly | Sole editor eligible for full AMF and Unity Bridge inspection, mutation, validation, and Build Record support |
| Migration source | `2019.4.31f1`, `2022.3.6f1` | Detect project metadata, require a backup or copy, and guide migration to the production target |
| Other Unity version or build | Any complete version string outside the production target and migration sources | Report the exact difference from the production target and guide installation of global `2022.3.22f1` |
| Unsupported editor family | Tuanjie Engine | Report the unsupported editor and guide the user to the production target |

The [VRChat current-version page](https://creators.vrchat.com/sdk/upgrade/current-unity-version/)
defines its current editor as `2022.3.22f1` and warns that later editors can produce content that does
not load in VRChat. VUA therefore promotes a new production target only after VRChat selects it and a
VUA release passes the Bridge, SDK, package, synthetic-project, and local smoke matrices. Upstream
recommendation and VUA verification remain separate states.

## Migration sources

`2019.4.31f1` and `2022.3.6f1` are accepted only as project-migration inputs. VUA may inspect their
`ProjectSettings/ProjectVersion.txt`, identify the migration route, and create or require a backup.
Bridge v1 operations start after a project copy reaches the production target. The official
[VRChat 2019-to-2022 guide](https://creators.vrchat.com/sdk/upgrade/unity-2022/) remains authoritative
for that upgrade.

## Other Unity versions

Every complete version string outside the production target and migration sources follows the same
unsupported-version path; VUA creates no separate product class for a particular distribution
suffix. It reports the detected version, required production target, and available installation
guidance while leaving `ProjectSettings/ProjectVersion.txt` unchanged. Unity Hub and Editor retain
credentials, account sessions, and license activation; VUA receives capability and readiness results
only.

## Tuanjie Engine

Tuanjie Engine is currently unsupported. VUA may identify it for diagnostics, then stops the Unity
production path and guides the user to global Unity `2022.3.22f1`. Tuanjie project-format similarity
does not authorize Bridge execution, VRChat SDK validation, building, or upload preparation.

## M0 enforcement requirements

- M0 migration closure is decided by local Unity Bridge verification; the current Orchestrator
  reference implementation and its tests are not a rejection gate.
- A production Orchestrator implementation must select only an exact production-target editor for
  Bridge jobs.
- Unity Bridge must validate its running `Application.unityVersion` before inspection or mutation.
- Version mismatch leaves project files unchanged and returns a typed remediation path.
- Migration always works on a backup or explicit copy and records source and target versions.
- Build Records store the complete editor version used for every successful production run.
