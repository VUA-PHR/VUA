# Protected-main integration policy

> Version: 1.0.0
> Authority: user-approved repository foundation work, 2026-09-22
> Effective: when this policy is merged; server enforcement is recorded separately.

This policy supersedes older local-main merge/direct-push instructions in collab, role prompts,
.zcode agent prompts, and recurring prompts. Read it before any integration action.

1. Work and bookkeeping use an isolated worktree and a slice or integration branch. Never commit
   or merge locally on the canonical main checkout. Integration can assemble slices with merge
   commits on its own branch, then open a pull request to main.
2. Merge through GitHub only after applicable tests and required checks succeed and review
   conversations are resolved. Preserve merge commits; do not rewrite public history. Current
   single-maintainer staffing does not require an independent approving review. Another agent
   using the same account is not an independent reviewer.
3. After a remote merge, fetch and fast-forward the canonical main checkout. Stop and report if
   main diverged or local changes obstruct the update; never reset or discard another process's work.
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
7. Transfer remains separately authorized. Never create VUA-Project/VUA as a placeholder or
   recreate VUA-PHR/VUA after transfer. Never independently change remotes, mirror-push, delete
   repositories, or reinitialize worktrees to recover access. Report access failures to the operator.

The foundation assignment contains the full transfer invariants and cutover checklist:
[execution context](assignments/2026-09-22-repository-foundation.md).
