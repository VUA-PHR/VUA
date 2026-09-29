# Protected-main integration policy

> Document version: 1.2.1
> Status: Accepted
> Authority: user-approved repository foundation work, 2026-09-22
> Effective: when this policy is merged; server enforcement is recorded separately.

Collab is archived and retired as of 2026-09-28. Its special checkout/coordination duties below
are historical and inactive; ordinary branch-and-PR development is the only current workflow.
The user authorized transfer to VUA-Project on 2026-09-28. Update the remote only after verifying
the same repository identity at its new owner; never recreate or mirror-push a replacement.

This policy supersedes older local-main merge/direct-push instructions in collab, role prompts,
.zcode agent prompts, and recurring prompts. Read it before any integration action.

1. All work uses a feature branch and GitHub PR. Ordinary development may switch branches
   in one checkout; linked worktrees are optional. Never commit, merge or push directly on main.
2. Merge through GitHub only after applicable tests and required checks succeed and review
   conversations are resolved. Preserve merge commits; do not rewrite public history. Current
   single-maintainer staffing does not require an independent approving review. Another agent
   using the same account is not an independent reviewer.
3. After a remote merge, fetch and fast-forward the canonical main checkout. Stop and report if
   main diverged or local changes obstruct the update; never reset or discard another process's work.
   Ordinary checkouts follow the same fast-forward-only rule when returning to main.
4. Collab-only changes still use a PR, preferably batched with an existing integration. They need
   no extra local full-suite run, but must satisfy the remote required checks. Idle rounds do not
   create commits, PRs, syncs, or status churn.
5. Before server enforcement, the designated operator obtains acknowledgment that integration
   and automatic main-push helpers are paused. Resume them only with this policy loaded. Feature
   work on separate branches can continue. Never treat silence as acknowledgment.
6. Required checks are selected only after real PR evidence. Do not bypass failed/pending checks,
   manufacture approvals, or recreate a repository after an access failure. If protection needs
   emergency adjustment, stop automatic integration and obtain an explicit user ruling; record
   the exact change and restoration. There is no standing agent/admin bypass.
7. The organizational transfer is on hold for the user review requested on 2026-09-29.
   Do not execute it until the user releases the hold. Never create VUA-Project/VUA as a placeholder or
   recreate VUA-PHR/VUA after transfer. Never independently change remotes, mirror-push, delete
   repositories, or reinitialize worktrees to recover access. Report access failures to the operator.

The foundation assignment contains the full transfer invariants and cutover checklist:
[historical execution context](../archive/2026-09-29/collab/assignments/2026-09-22-repository-foundation_EN.md).

## Document changelog

- 1.2.0 (2026-09-28): move the continuing repository PR policy out of retired collab; record transfer authorization and identity-preserving remote cutover.
