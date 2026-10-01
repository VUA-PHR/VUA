# Unity editor compatibility


> Document version: 1.1.1
> Status: Accepted  
> Scope: Unity detection, project intake, AMF production, and Unity Bridge execution  
> Updated: 2026-10-02  
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

Independently of the version class, the Unity CLI, the optional Unity Hub, and the Unity Editor
retain credentials, account sessions, and license activation; VUA receives capability and
readiness results only.

## Migration sources

`2019.4.31f1` and `2022.3.6f1` are accepted only as project-migration inputs. VUA may inspect their
`ProjectSettings/ProjectVersion.txt`, identify the migration route, and create or require a backup.
Bridge v1 operations start after a project copy reaches the production target. The official
[VRChat 2019-to-2022 guide](https://creators.vrchat.com/sdk/upgrade/unity-2022/) remains authoritative
for that upgrade.

## Installation route

The [standalone deployment direction](../architecture/unity-deployment.md) owns the route:
Unity's original installer installs the exact global target, and the official CLI registers the
Editor and handles licensing; Hub is optional. Installer version/support and Editor
compatibility are separate checks. A successful download does not establish a licensed, usable
Editor, and the production target above is not widened by the installation route.

## Other Unity versions

Every complete version string outside the production target and migration sources follows the same
unsupported-version path; VUA creates no separate product class for a particular distribution
suffix. It reports the detected version, required production target, and available installation
guidance while leaving `ProjectSettings/ProjectVersion.txt` unchanged.

## Tuanjie Engine

Tuanjie Engine is currently unsupported. VUA may identify it for diagnostics, then stops the Unity
production path and guides the user to global Unity `2022.3.22f1`. Tuanjie project-format similarity
does not authorize Bridge execution, VRChat SDK validation, building, or upload preparation.

## Enforcement requirements

- Migration closure is decided by local Unity Bridge verification; the current Orchestrator
  reference implementation and its tests are not a rejection gate.
- A production Orchestrator implementation must select only an exact production-target editor for
  Bridge jobs.
- Unity Bridge must validate its running `Application.unityVersion` before inspection or mutation.
- Version mismatch leaves project files unchanged and returns a typed remediation path.
- Migration always works on a backup or explicit copy and records source and target versions.
- Build Records store the complete editor version used for every successful production run.

## Document changelog

- 1.1.1 (2026-10-02): align the Installation route section with the owning deployment document
  (the original installer installs the Editor; the official CLI registers it), fix the
  production-target direction reference, move the credential-ownership sentence out of the
  version-classification section into the general support-matrix text, and refresh the stale
  header date; no matrix change.
- 1.1.0 (2026-09-30): link Hub-independent official CLI installation without changing Editor eligibility.
- 1.0.2 (2026-10-01): move the credential-ownership sentence out of the version-classification
  section into the general support-matrix text and refresh the stale header date; no matrix change.
- 1.0.1 (2026-09-28): erratum — the "M0 enforcement requirements" section is renamed
  "Enforcement requirements" and its closure bullet drops the M0 label following the 2026-09-28
  sequence change; no rule change.
