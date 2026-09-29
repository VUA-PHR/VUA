# Repository foundation: execution context for development agents

> Version: 1.0.0
> Date: 2026-09-22
> Status: Prepared plan; no GitHub setting changes executed by this document
> Audience: All development agents, their child processes, and the integration operator
> Language: English authoritative execution context; Chinese routing summary in wt-7 state
> Baseline: local main 2bd60a4a; GitHub observations below must be refreshed before execution

## 1. Authority, purpose, and boundaries

The user has authorized repository files, reporting entry points, security settings, and main-branch protection as the first infrastructure batch. Their latest instruction is to write the plan context first. This delivery is planning only: it does not activate settings, send reports, transfer ownership, or start implementation agents.

The broader order is: infrastructure additions -> removal of redundant material -> documentation language contraction -> README/release-notes/product-boundary revision -> repository transfer. Do not polish files that the removal batch will delete. Preserve effective decisions before removing their current location.

English serves the agent-development workflow and the user's intended LLM reasoning efficiency; Chinese serves the primary mainland-China user/community audience. Do not describe English as cosmetic internationalization. This plan does not globally change the existing bilingual policy; that is a later, explicit work package.

Current repository: https://github.com/VUA-PHR/VUA
Intended future repository: https://github.com/VUA-Project/VUA
Transfer needs the user's separate explicit approval, expected around 10:00 GMT+9 (09:00 Asia/Hong_Kong). A clock time, silence, successful infrastructure work, or a completed test is NOT approval.

## 2. Evidence and why the first batch matters

Read-only inspection on 2026-09-22 found:
- The repository is public, under a User account; VUA-Project is an Organization.
- main reported protected=false; the rulesets endpoint returned no entries.
- Private vulnerability reporting, secret scanning, push protection, and Dependabot security updates reported disabled.
- No SECURITY.md, issue forms, or PR template were present; CONTRIBUTING refers to a private channel without a concrete enabled destination.
- Existing workflows are rust, ts, schema-vectors, and report-only collab-registry. Several have path filters.
- Current integration relies on local main merges/direct pushes, including collab bookkeeping.
- Repository settings are mutable: record fresh state rather than treating these observations as permanent.

The objective is a usable reporting path, protection against accidental secret publication and destructive pushes, and a reviewable integration flow. This is not a compliance-score exercise and does not introduce new product features.

## 3. Ownership and work isolation

One implementation owner coordinates this batch in an idle VUA-7 or VUA-8 worktree on a short-lived slice branch. Recheck status, worktree occupancy, and collab:brief before claiming it. Do not take over VUA-2 through VUA-6 or alter their uncommitted work.

The integration seat owns the main cutover and informs all six roles through committed collab state/BOARD. A single designated operator applies remote settings to avoid concurrent configuration writes. Contributor agents can continue coding during preparation; only the final push/merge cutover requires a short coordinated hold.

Do not spawn or dispatch additional agents solely because this document lists roles. Role responsibilities are implementation assignments, not evidence that work has already been delegated.

## 4. Deliverable A: minimal repository files and reporting routes

Add a small, usable public surface:
1. SECURITY.md: supported-security scope, current pre-alpha status, private GitHub reporting route, what information to provide, and what must never be attached. Do not promise an unstaffed response SLA or assert that no stable support is needed merely because this is pre-alpha.
2. .github/ISSUE_TEMPLATE/bug_report.yml: version/commit, Windows and relevant Unity version, reproduction, expected/actual behavior, sanitized diagnostics, and whether synthetic/demo data was used.
3. .github/ISSUE_TEMPLATE/feature_request.yml: the player's goal, present obstacle, current workaround, and intended result; avoid requiring architecture proposals from users.
4. .github/ISSUE_TEMPLATE/config.yml: a working private-security link and a clear question/support route. Keep ordinary issues available; do not introduce a dead discussion link.
5. .github/PULL_REQUEST_TEMPLATE.md: problem/result, validation performed and limits, relevant issue, and data/privacy checks. Keep it short.
6. Only necessary amendments to CONTRIBUTING and active collaboration instructions: reporting destinations, the new merge path, and agent cutover rules. Defer full rewrites and general language conversion.

Use Chinese-first issue forms with short English hints where helpful; keep agent implementation directions in English. Respect currently applicable bilingual requirements for touched contributor documents until the later language-policy batch changes them. Do not create a full mirror of this internal assignment.

Decide whether questions remain labeled Issues or use Discussions; a functioning Issues route is sufficient for this batch. Do not add CODEOWNERS pointing at invented people/teams, a Code of Conduct without a real contact, or a CLA merely to fill a checklist.

Acceptance:
- GitHub renders forms/templates; required fields are sensible and links resolve.
- The vulnerability route works before SECURITY.md claims it does.
- No live vulnerability, fake public issue, private user data, paid asset, cookie, token, or full Unity project is posted as a test.
- Use a real infrastructure PR to validate the PR template. A maintainer-visible preview/read-only check suffices for issue forms; do not create public test spam.

## 5. Deliverable B: security settings, with readback

Capture the current non-secret configuration locally before changing it. Record only names/statuses/IDs in public evidence; never dump secret values, private reports, credentials, or credential-helper output.

Subject to GitHub availability and the operator's existing permissions:
- Enable private vulnerability reporting.
- Enable repository secret scanning and push protection. Inspect existing alerts privately, without copying findings to Issues or public commits.
- Enable Dependabot security updates and verify the prerequisite vulnerability-alert/dependency-graph state.
- If version-update configuration is added, batch/group it at a manageable cadence; review pnpm workspace and Cargo coverage. Do not start an unbounded dependency-upgrade campaign.
- Make workflow token permissions explicit and least-privilege after examining the existing workflows; these test workflows should not need broad repository write access.
- Keep existing checks running; never disable a failing check to make the repository appear healthy.

Read back each setting after the change. If a setting is unavailable due to plan, permissions, or organization policy, report the exact limitation; do not invent completion, change visibility, buy a plan, or create a replacement repository.

Acceptance:
- Private reporting is enabled and the intended route is visible to the appropriate audience.
- Each supported security setting reads back enabled.
- No dependency updates or security fixes are silently auto-merged.
- CI can still install dependencies/run with the chosen token permissions.

## 6. Deliverable C: integration process BEFORE branch enforcement

Do not enable a required-PR policy while leaving agents instructed to push main directly.

Prepare and land the revised operational rule first:
- Feature/slice work remains in isolated worktrees.
- Integration assembles cross-domain changes on a temporary integration branch in an isolated checkout, submits a PR, and merges through the protected path.
- The canonical VUA checkout remains on main; after a GitHub merge it fetches and fast-forwards. Never reset away divergent or uncommitted work.
- Collab bookkeeping is batched into the integration PR or a small bookkeeping PR; it no longer relies on routine direct-main exceptions once enforcement begins.
- Remove or supersede conflicting direct-push instructions in active entry points atomically. Update AGENTS/collab rules as needed, including their version discipline; do not rewrite unrelated role prose destined for removal.
- Keep feature changes separate from status spam. Do not fabricate a second human reviewer by using another agent under the same account.

A PR requirement and required independent approval are different controls. For the current single-maintainer situation, require PRs and automated checks; do not require one independent approval unless a real eligible second maintainer and an achievable review path exist. Set review requirements based on observed staffing, not a hypothetical team.

Path-filtered CI trap:
- Observe actual check-run names and trigger behavior on both code and docs-only PRs.
- Never make a check required if an allowed PR can leave it permanently absent/pending.
- Prefer a small always-present required gate aggregating appropriate checks, or the minimal trigger adjustment needed for a reliable gate.
- If existing workflows must be changed for that gate, include and test only that narrow prerequisite now. Broader CI normalization remains deferred.
- Do not make the report-only collab-registry workflow a required success merely by renaming it; retain its honest scope or fix its failure behavior intentionally.

## 7. Deliverable D: main protection and controlled cutover

Take a fresh configuration snapshot immediately before cutover. Use either a coherent ruleset or branch-protection configuration; avoid overlapping contradictory mechanisms.

Target behavior:
- Protect main from force pushes and deletion.
- Require the tested PR/check path and resolved review conversations.
- Require only checks proven to appear on every eligible PR.
- Preserve existing merge commits/history topology; do not impose linear history or rewrite public history in this batch.
- Keep routine integration inside the rules. Do not grant all agents/admin activity a blanket bypass.
- Document a narrow human-controlled emergency repair path if supported/needed; every use must be attributable and recorded, not automated.

Cutover order:
1. Land public files and the new operational instructions using the existing authorized path.
2. Prove the candidate check names/triggers with an actual infrastructure PR, including a docs-only case.
3. Obtain integration and active-worker acknowledgments through the coordination channel; pause main pushes/merges and background sync/push helpers briefly.
4. Refresh main, detect any concurrent updates, and drain or rebase outstanding integration work safely.
5. Apply protection settings and read them back.
6. Complete a legitimate PR through the protected route, and fast-forward the canonical main checkout.
7. Announce cutover complete and resume ordinary development under the new rule.

If there are outstanding unacknowledged push processes, do not enable an uncoordinated cutoff. Escalate the coordination gap rather than assuming other agents read a file.

Do not validate force-push/deletion protection by attempting destructive operations on main. Use API/readback and the legitimate PR. Never open a temporary bypass silently when a check is pending.

Rollback for a misconfigured protection setting means restoring the previously captured setting through the designated operator and recording why, while holding pushes. It does not mean deleting/recreating the repository, force-pushing history, or discarding worktree state.

## 8. Migration invariants for every agent and subprocess

Infrastructure work is on the original repository; transfer is not part of this batch.
- Never create VUA-Project/VUA as a placeholder: it would obstruct transfer.
- Never recreate VUA-PHR/VUA after transfer, including by fork: this can destroy redirects.
- A 404, permission error, SSH/auth failure, or redirect is a diagnosis input, not permission to create a repository.
- Do not run repo-create, initialize a substitute remote, mirror-push, force-push, or delete a remote to work around access.
- Do not independently change origin, pushurl, credentials, or upstream associations. The transfer operator will update shared configuration and audit each worktree.
- Preserve local .git, worktrees, branches, commits, and uncommitted files; transfer requires no reclone or worktree recreation.
- Prefer relative links and dynamic repository identifiers in new files. External reporting links may name the current repository; inventory them for the later transfer patch.
- Before and after transfer, compare repository identity (repository ID/node ID), commit tips, configuration, and key resources. Matching a name alone is insufficient.
- Keep the organizational default-permission impact, App authorization, check identities, reporting links, and secrets access on the migration checklist. Do not assume preserved secret association implies every workflow can use it.
- If an unexpected repository appears under either name, stop and report; do not overwrite or delete it.

These constraints must be included in each active agent's cutover context and inherited by any helpers it invokes.

## 9. Scope deferred until later

Not part of this infrastructure batch:
- Actual repository transfer (separate explicit approval).
- Removing .zcode/collab or rewriting public history.
- Global document-language contraction.
- Broad README/release-notes/product-boundary overhaul.
- New product behavior, dependency version upgrades, release publishing, or signed installer production.
- CI matrix/cache redesign, complete test discovery, expanded platforms, and broad cloud Unity automation.

Broad CI normalization may follow the v1.0 integration gate as discussed. Reliable protection checks are a prerequisite now; trustworthy build/license/artifact provenance remains a prerequisite before distributing a release, not an optional post-release cleanup.

## 10. Verification, evidence, and handoff

For repository-file changes: validate YAML/forms/links and review public rendering. Run tests relevant to workflow/script changes; do not recompile Unity merely for Markdown/template changes.
For operational changes: fresh API snapshot -> targeted update -> readback -> legitimate PR/check evidence. Preserve check URLs, PR/merge commit, and sanitized status summaries.
For every GitHub PR created during execution: attach its URL to the executing Codex task.

Completion report must distinguish:
- Files committed and merged (commit/PR).
- Settings actually enabled (readback timestamp).
- Main protection live and tested (real PR/check references).
- Agents/processes acknowledged and resumed.
- Unsupported settings or pending prerequisites.
- Transfer NOT performed and explicit approval still required.

Update collab/state/wt-7.md or the actual execution tree's state, and have integration register the result in BOARD. Do not describe this plan's existence as completion of infrastructure.

## References

- GitHub transfer semantics and redirect warning:
  https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository
- Private vulnerability reporting:
  https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository
- Current workflows and collaboration mechanism:
  .github/workflows/; collab/README.md; AGENTS.md
