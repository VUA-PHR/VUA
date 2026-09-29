# Contributing to VUA

> Document version: 2.0.0
> Status: Accepted

Start with [the documentation guide](docs/README.md). The [N sequence](docs/development-outline.md)
defines the next usable outcome and acceptance; [version policy](docs/release/versioning.md)
defines release numbers and continuing Beta.

## Develop one useful slice

1. Read the product/contract documents relevant to your task. Discuss substantial scope, dependency
   or architecture changes in an Issue/PR; routine corrections do not need advance discussion.
2. Use a `slice/<slug>` branch. One checkout is sufficient; worktrees are optional. Preserve
   unrelated changes and do not run concurrent writers in the same checkout. A slice lasts at most
   3 days or falls 15 commits behind main before reconciliation; never rewrite public history.
3. Implement the smallest usable path with its contracts, tests and documentation. Follow
   [engineering/evidence rules](docs/development/engineering-rules.md) and the owning architecture.
4. Run relevant checks and describe actual results, remaining gaps and impact in the PR. UI
   usability requires human acceptance; other acceptance follows the named N scenario. A CI pass
   is not a real-machine workflow pass.
5. Merge through GitHub under [protected-main policy](docs/meta/protected-main.md). Return to
   main only with a clean checkout and a fast-forward update; escalate divergence instead of resetting.

Record scope and definitions in their owning documents. [Documentation governance](docs/meta/documentation-governance.md)
owns language, versions and registry rules. [The collab archive](docs/archive/2026-09-29/README.md)
preserves provenance; no role sessions, proposals, BOARD updates or ticks are required.

## Reporting and assets

Use [Issues](https://github.com/VUA-PHR/VUA/issues/new/choose) for ordinary questions, bugs and
suggestions. Follow [SECURITY.md](SECURITY.md) for private vulnerability reporting. Follow
[privacy and evidence rules](docs/development/engineering-rules.md#security-and-legal-boundaries)
before sharing diagnostics or assets. Raw real-machine evidence stays local; sanitized acceptance
conclusions belong in release records.

## License of contributions

The repository is licensed under the [Apache License 2.0](LICENSE). Under Section 5 of that license,
unless you explicitly state otherwise, a contribution intentionally submitted for inclusion in VUA
is provided under Apache-2.0 without additional terms. Contributors retain copyright in their work.

VUA does not currently require a Contributor License Agreement or a `Signed-off-by` trailer. That
policy may change only through an explicit, documented governance decision.

Use of the VUA name and visual identity is governed separately by the
[trademark guidance](TRADEMARKS.md).

## Document changelog

- 2.0.0 (2026-09-29): consolidate the ordinary contribution path and replace duplicated policy with owning-document links. Earlier versions remain in Git history.
