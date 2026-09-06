# Versioning policy

[English](versioning_EN.md) | [简体中文](versioning_ZH.md)

> Document version: 1.0.0  
> Status: Accepted  
> Scope: VUA product releases, tags, packages, and public contracts  
> Updated: 2026-09-02  
> Normative effect: Yes

## Product version

VUA product releases follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html):
`MAJOR.MINOR.PATCH`, with optional pre-release and build metadata.

- Git release tags use `vMAJOR.MINOR.PATCH`; the `v` is a tag prefix, not part of the SemVer value.
- `0.y.z` is initial development. Public contracts can still change incompatibly, but every breaking
  change must be explicit in release notes and accompanied by the owning protocol/schema/migration.
- Within `0.x`, VUA reserves patch releases for compatible fixes and minor releases for planned
  stages, new capability, or intentionally documented contract change.
- `1.0.0` defines the first stable public product API and compatibility commitment.
- A published tag and artifact are immutable. Any change is a new version.

## Beta and release-candidate labels

`0.10.0` and `0.11.0` are normal SemVer versions in major-zero development. VUA may label their
release channels “Beta 1” and “Beta 2”, but that label is project lifecycle metadata rather than a
SemVer pre-release identifier. A candidate for the exact `1.0.0` contract may use
`1.0.0-rc.1`, followed by `1.0.0`; pre-release versions sort below the corresponding normal version.

Planned sequence:

```text
0.9.0       feature-path completion
0.10.0      Beta 1: feature and public-contract freeze
0.11.0      Beta 2: recovery, security, upgrade, packaging, and release validation
1.0.0-rc.1  optional release candidate for the intended 1.0 contract
1.0.0       first stable release
```

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
