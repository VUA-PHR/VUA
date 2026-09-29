# Versioning policy


> Document version: 2.1.0
> Status: Accepted
> Scope: VUA product releases, tags, packages, and public contracts
> Updated: 2026-09-28
> Normative effect: Yes

## Product version

VUA product releases follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html):
`MAJOR.MINOR.PATCH`, with optional pre-release and build metadata.

- Git release tags use `vMAJOR.MINOR.PATCH`; the `v` is a tag prefix, not part of the SemVer value.
- `0.y.z` is initial development. Public contracts can still change incompatibly, but every breaking
  change must be explicit in release notes and accompanied by the owning protocol/schema/migration.
- Under the 2026-09-28 user ruling, the explicit N-stage mapping below replaces the former
  patch-only-fixes convention during major-zero development. Patch-numbered N releases may add
  capabilities. Protocol/schema versions and breaking-change/migration disclosure remain required.
- No `1.0.0`, stable release, or production-safety commitment is scheduled. Only an explicit
  request from the author can change the continuing-Beta policy.
- A published tag and artifact are immutable. Any change is a new version.

## Continuing Beta and N-stage versions

Beta is lifecycle metadata rather than an automatically appended SemVer suffix. Keep the exact
numeric versions below. Do not generate v1.0.0 candidates or stable claims from earlier M plans.
Historical tags/artifacts and their original stage labels remain unchanged; adoption of this plan
does not itself bump the current package version or create a release.

| Gate | Product version | Delivery |
| --- | --- | --- |
| N1 | v0.7.0 | Purpose-driven deployment |
| N2 | v0.7.1 | VRCFaceTracking and modified hyblocker Space Calibrator |
| N3 | v0.8.0 | Complex real-material production and SDK handoff |
| N4 | v0.8.1 | Recipe reproduction |
| N5 | v0.8.2 | Audited old-M4 material-management rework |
| N6 | v0.9.0 | Recovery and environment maintenance |
| N7 | v0.9.1 | Beta installer, regression, and illustrated user guide |

All are Beta. The [development sequence](../development-outline.md) owns their acceptance rows.
Known non-blocking defects may ship with impact/workaround/follow-up disclosed. A pass covers
recorded scenarios, not production safety or all Windows versions. Non-UI acceptance can be
agent-driven; human acceptance is required for UI usability. Private real-run artifacts stay local.

## What is independently versioned

Product SemVer does not replace protocol or storage versions:

| Versioned object | Rule |
| --- | --- |
| Desktop product and installer | One product SemVer and one release source of truth |
| Git tag | `v` plus the exact product SemVer |
| Orchestrator Provider | Built and distributed with the matching desktop release; reports transport, build, protocol, and product compatibility |
| Unity Bridge | Own machine-readable protocol/package version; compatibility declared explicitly |
| Gateway and community plugin protocol | Own machine-readable contract version; compatibility cannot be inferred from product SemVer alone |
| Recipe, Build Record, persistent schema | Own format/schema version and migration or rejection behavior |
| Private workspace packages | Need not imply a public API; their versions follow release tooling policy |
| Third-party implementation dependencies | Exact dependency versions in the lockfile/inventory; never presented as VUA versions |

The release pipeline generates or verifies the product version across the desktop manifest, Provider
metadata, installer, diagnostic output, and release artifact. Manually maintained duplicate
version strings are not authoritative.

## Compatibility and communication

- Each public release has release notes. Breaking `0.x` changes name the affected API/format and the
  required migration or reset behavior.
- Deprecation is documented before removal wherever users or community developers need a migration
  window.
- Build metadata such as `+sha.<commit>` may identify CI artifacts but does not affect precedence or
  compatibility.
- Marketing stage names (`pre-alpha`, `alpha`, `beta`, `stable`) never replace the numeric version.

## Third-party changes and compatibility

Third-party integrations may require changes to VUA's application protocols, persisted formats,
and supported version combinations during Beta. This is advance notice of possible change, not
an authorization to silently break an existing contract or a promise to support every upstream
version. Keep vendor-specific types and version handling behind adapters.

For each concrete integration/update, record the upstream version/build, affected operations,
compatibility impact, and verification evidence in the owning implementation slice. Adapter-only
changes do not require a speculative protocol bump. A normative change to a frozen wire/storage
face requires a new explicit version with schemas, producers, consumers and tests updated together;
retain the old definition and state migration, continued support, or explicit rejection behavior.
Release notes explain user action and affected versions before users take the update. Do not
reserve invented fields or promise universal downgrade solely because upstream might change.

Licensing is separate from wire compatibility. VUA's repository license does not replace a
third-party component's license. Before bundling or changing a dependency, record the exact
source/version, applicable terms, notices, redistribution/update/removal requirements and any
excluded components. Keep notices consistent with the actual distributed build. Do not announce
a future VUA license change merely because an integration is planned; any proposed change needs
an explicit decision based on the selected code and distribution. N2's removal of SimpleBLE and
base-station BLE management remains required; this policy is not a completed license audit.

## Document changelog

- 2.1.0 (2026-09-28): clarify third-party compatibility change disclosure and separate licensing review.


- 2.0.0 (2026-09-28): replace the stable-release roadmap and patch-only-fix convention with the explicitly mapped continuing-Beta N sequence.
- 1.0.0 (2026-09-02): original product/protocol versioning policy.
