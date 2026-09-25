# Repository foundation execution evidence

> Date: 2026-09-22 (Asia/Hong_Kong)
> Status: files and supported security settings delivered; main enforcement pending coordination
> Authority: user approval to execute the foundation plan in order

## Landed files and verification

PR https://github.com/VUA-PHR/VUA/pull/1 merged as 147b81548a0b53c1e2ffdfce81a8e4cf14abc1b8.
It adds SECURITY.md, Chinese-first bug/feature forms, question/private-report routes, a PR template,
and PR-only integration instructions. AGENTS moves to 1.2.0; CONTRIBUTING EN/ZH moves to 1.1.0.
Active role and harness prompts explicitly defer to collab/PROTECTED_MAIN.md.

Validation on PR head 7e159c44a6129c7702fb35443b0a40ee39894edc:
- GitHub check: success (3m6s), run 35658130421.
- GitHub test-and-clippy: success (6m37s), run 35658130532.
- GitHub vectors: success (3m12s), run 35658130569.
- Report-only registry: success (12s), run 35658130425.
- Local YAML parse and form IDs/required workflow triggers passed; diff whitespace check passed.
- Registry scan: 96 consistent entries, zero anomalies, zero conflict markers.
- Both issue forms rendered correctly in GitHub's branch preview; no test issues were posted.
- No runtime changes and no claim of real Unity end-to-end verification.

## Settings applied and read back

Repository identity remains VUA-PHR/VUA, ID 1359567934. No transfer occurred.
- Private vulnerability reporting: enabled (API and security overview).
- Dependabot alerts and security updates: enabled.
- Secret scanning and push protection: enabled.
- Open secret-scanning and Dependabot alert counts at inspection: zero (not a security guarantee).
- Fork PR workflows: approval required for all external contributors.
- Existing workflow token default: read; workflow PR approval permission: false. Files now also
  declare contents: read. Action allowlists/SHA-pinning and broad CI redesign remain deferred.

Organization VUA-Project:
- Ordinary members cannot create repositories, change visibility, delete or transfer repositories.
- New repositories default to dependency graph, Dependabot alerts/security updates, secret scanning,
  and push protection enabled.
- Base repository permission stays read. Membership and account authentication were not changed.
- Display name, Chinese/English description and project link updated; repository description,
  documentation homepage and VRChat/avatar/asset-management/Unity topics updated.

The organization is on Free. Restricting invitations of outside collaborators to owners requires
Enterprise Cloud; that control remains unchanged, with no subscription upgrade.
Source: https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-organization-settings/setting-permissions-for-adding-outside-collaborators
Organization Actions API inspection also required an unavailable admin:org scope; no token scope
was expanded. Repository-level settings above were verified independently.

## Cutover still pending

The operator has requested acknowledgment that external integration and automatic main-push/sync
processes are paused. That acknowledgment has not arrived. Do not infer it from a generic instruction
to continue, silence, or a green test result. No server-side main protection has been enabled yet.

This documentation-only PR checks that check/test-and-clippy/vectors all appear without code or
workflow changes. After it passes and the pause is confirmed, enable PR/check enforcement, block
force pushes/deletions (including administrators), resolve review conversations, and require an
up-to-date base. Do not require independent approval with current single-maintainer staffing.
Select required checks from observed GitHub Actions app ID 15368. No blanket bypass.

Complete a legitimate PR under protection, read back settings, and record its evidence before
claiming main protection verified. Resume integration only after processes load PROTECTED_MAIN.md.
Transfer, 2FA/account-role changes, deletion/language-contraction batches, and broader CI work remain
outside this delivery. Never create a placeholder or replacement repository on an access failure.
