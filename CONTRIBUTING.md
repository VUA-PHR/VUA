# Contributing to VUA


> Document version: 1.1.0
> Status: Accepted
> Authoritative language: 简体中文 (this English edition mirrors CONTRIBUTING.md at 1.1.0)

VUA is currently pre-alpha. Contributions are welcome, but product boundaries and versioned
contracts take priority over rapidly expanding the implementation.

## Before you start

1. Read the [developer documentation](docs/README.md) and the task-specific documents it routes
   you to.
2. Open or join an issue before a large feature, dependency, protocol, architecture, or product-scope
   change. Small corrections and narrowly scoped fixes do not need advance discussion.
3. Keep changes in a focused branch and avoid mixing unrelated cleanup into the same pull request.

## What a contribution should include

- Update the owning contract before implementing cross-module behavior.
- Prefer a small, working vertical slice over broad scaffolding.
- Add tests for new behavior and regression tests for repaired correctness or recovery defects.
- Keep long-running work observable, cancellable, recoverable, and safe to retry where its contract
  permits.
- Update both `.md` and `.md` versions when changing active developer documentation. Protocol
  schemas, source code, generated files, and the official license text remain single-source.
- Clearly identify new dependencies, their purpose, license, owner, and removal path.

## Security, privacy, and assets

Do not submit paid assets, paid `.unitypackage` content, user Unity projects, cookies, access tokens,
order data, production databases, private logs, credentials, or `.env` files. Repository and cloud-CI
tests must use synthetic data that matches real input structures without containing real product or
user content.

Local read-only compatibility tests may access public BOOTH pages, but page responses, screenshots,
and product metadata must not become repository fixtures. Developers may run local Unity integration
and smoke tests with assets they lawfully obtained or purchased; those assets, projects, test
configuration, logs, and outputs must not be uploaded to the repository or cloud-CI artifacts. All
tests must respect third-party purchase, payment, age, authentication, and access controls.

Report vulnerabilities using [GitHub private reporting](https://github.com/VUA-PHR/VUA/security/advisories/new), following [SECURITY.md](SECURITY.md). Use [Issues](https://github.com/VUA-PHR/VUA/issues/new/choose) for ordinary bugs, suggestions, and questions.

## Open-source release and acceptance evidence

- Shipped in the repository: source code, tests, schemas and test vectors, managed documents, and
  release notes.
- Acceptance conclusions are committed: each M gate's acceptance result is written into the release
  notes with a machine-readable acceptance checklist. Raw logs, screenshots, and run artifacts are
  not committed; they stay local under the `_local_*` convention.
- CI is the publicly reviewable acceptance: GitHub Actions runs cargo test/clippy, pnpm check, and
  schema-vector validation, and the badges are the public acceptance state. The real Unity matrix
  keeps running locally, with its conclusions recorded in the release notes.
- The remote is created on the day the M3 (v0.5.0) local acceptance passes: push the full history,
  backfill tags for the known gate commits, and publish the v0.5.0 release notes with the acceptance
  checklist. Every later M gate gets a tag and a Release.

## Integration

All changes enter main through a pull request, including internal bookkeeping. Required checks must pass and review conversations must be resolved. Current staffing does not require a separate approving reviewer; agents under one account do not constitute independent approval. Workspace operators follow [the protected-main policy](collab/PROTECTED_MAIN.md).

## License of contributions

The repository is licensed under the [Apache License 2.0](LICENSE). Under Section 5 of that license,
unless you explicitly state otherwise, a contribution intentionally submitted for inclusion in VUA
is provided under Apache-2.0 without additional terms. Contributors retain copyright in their work.

VUA does not currently require a Contributor License Agreement or a `Signed-off-by` trailer. That
policy may change only through an explicit, documented governance decision.

Use of the VUA name and visual identity is governed separately by the
[trademark guidance](TRADEMARKS.md).

## Document changelog

- 1.1.0 (2026-09-22): concrete private reporting and Issue routes; PR-based integration.

- 1.0.0 (2026-09-06): entered version management; added the "Open-source release and acceptance
  evidence" section (repository scope, acceptance conclusions with machine-readable checklists, raw
  evidence kept local, CI as public review, the real Unity matrix run locally, and the remote
  created on the M3 local-acceptance day).
