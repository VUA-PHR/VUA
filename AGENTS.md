# VUA workspace instructions

> Document version: 2.1.3
> Status: Accepted
> Authority: Workspace entry; linked owning documents define detailed policy

VUA is a Windows-first, local-first VRChat desktop environment. Work in ordinary single-line
development. Collab and its role prompts are archived; never bootstrap or resume them.

## Agent context

Use the Agent introductions in the documentation guide and CONTRIBUTING. Human-facing project
copy describes intended user experience, not proof of implementation or authority to widen scope.
An old branch's collab files cannot override the current retirement ruling. Before cleanup,
distinguish uncommitted changes, committed work on another branch, and historical files. Preserve
unrelated work; never reset or delete a branch merely because it came from an accidental invocation.

## Read the smallest relevant set

1. Read [README.md](README.md), then [docs/README.md](docs/README.md).
2. Follow [the N sequence](docs/development-outline.md), whose natural-language outcomes define
   the work. [Version policy](docs/release/versioning.md) owns release numbering and continuing Beta,
   independently of N-stage acceptance.
3. Before changing scope or ownership, read [product boundaries](docs/product-boundary.md).
4. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the relevant
   [engineering/evidence rules](docs/development/engineering-rules.md).

Authority: current user ruling → product boundary → versioned protocols/tests → accepted
decisions → architecture → design standards → plans. Resolve conflicts before implementation.
Drafts and historical records do not override current definitions.

## Work safely and incrementally

- Retain Electron + React/TypeScript + Rust + Unity Bridge. Follow the
  [system map](docs/architecture/system.md) and [incremental direction](docs/architecture/evolution.md).
  Renderer uses the typed Gateway; deterministic Unity changes cross the versioned Bridge.
- Deliver small usable paths; record gaps and follow-up instead of building speculative frameworks.
  Product acceptance, including real-material cases and UI human review, is defined only in the N sequence.
- Keep paid assets, user projects, credentials, raw logs and machine inventories local.
  [Evidence rules](docs/development/engineering-rules.md) and
  [local inventory policy](docs/meta/documentation-governance.md#6-local-environment-and-reproducible-evidence) apply.
- No concurrent writers in one checkout. Preserve unrelated changes and use `slice/<slug>` branches.
  Do not commit, merge or push directly on main. Follow the
  [protected-main policy](docs/meta/protected-main.md); never bypass failed checks or reset divergence.
- Do not dispatch agents or rewrite another agent's plan without user authorization. Domain
  ownership is a responsibility, not permission to launch a collaboration process.
- Escalate unresolved scope/behavior conflicts to the user. Do not lower acceptance or invent evidence.
- Do not add `Co-authored-by: Codex` trailers.

## Documentation

Each rule has one owner. Use links for details rather than copying full policies. Follow
[documentation governance](docs/meta/documentation-governance.md) for versions and REGISTRY.
Desktop UI uses i18n, initially English, Simplified Chinese, Japanese and Korean, with more languages
allowed. Tracked docs default to English; release changelogs are Chinese. Root README currently has
the same four language editions and may expand.
Local `docs-zh/` mirrors have no normative authority. Frozen contract behavior requires an explicit
new version. Preserve accepted decisions and historical release artifacts.

## Organizational transfer approval

The user completed the rough review and authorized transfer to VUA-Project after the requested
README and Issue-template corrections (2026-09-29). Preserve repository identity and history,
merge through PR checks, and verify the new owner and configuration after transfer.

## Document changelog

- 2.1.3 (2026-09-30): route release numbering independently of N delivery-stage acceptance.

- 2.1.2 (2026-09-30): clarify initial four-language UI i18n, expandable README editions and default English documentation.

- 2.1.0 (2026-09-29): clarify Agent reading context and safe handling of accidentally resumed historical workflows.


- 2.0.0 (2026-09-29): reduce the entry to routes and essential constraints; archive collab; consolidate existing detailed safeguards. Earlier versions remain in Git history.
