# VUA cold-start primer

[English](project-context_EN.md) | [简体中文](project-context_ZH.md)

> Status: cold-start primer (no normative effect)
> Scope: the minimal entry map for a fresh session
> Updated: 2026-09-21
> Conflict handling: when this primer disagrees with any normative source, the normative source wins
> Maintenance trigger: update only when entry points, responsibilities, or reading paths change;
> version numbers, current progress, todo lists, and hosting candidates stay out of this document
> (they live in the board, the state files, and the owning normative documents)

## What this project is

VUA is a Windows-first, local-first VRChat desktop production environment serving VRChat players
and creators (originating from mainland-China network and language conditions): with lawfully
obtained assets only, it hands the production chain — pick a target combination, then environment,
project, dependency, assembly, inspection, release — to inspectable, recoverable program execution.
Judgment and confirmation points stay with the user; purchase sessions, credentials, paid assets,
and production data remain on the machine.

A little stable history: the project evolved from a "one-click setup plus tutorials" idea into a
desktop tool oriented around completing real tasks; the cloud acquisition pipeline (BDB) experiment
taught that coupling acquisition, identification, cleaning, and publication into one pipeline does
not survive, and those capabilities were rebuilt as AMF's private local BDL; this repository is the
current implementation authority (an Electron desktop shell plus the Rust Orchestrator workspace).
Older history is evidence only and imposes no implementation constraint.

## Reading order and authority conflicts

1. Read the root [README](../README.md), then the [documentation guide](README_EN.md) to pick the
   smallest task-specific path.
2. Authority order (the former wins on conflict): current user rulings →
   [product boundary](product-boundary_EN.md) → versioned protocols and tests → accepted decisions →
   architecture → design standards → development plans.
3. This primer, `docs/plans/` (local scratch area), and reference material carry no normative
   effect; research material does not become implementation authority by being cited.
4. Scope and module ownership go to the [product boundary](product-boundary_EN.md); managed
   documents and versions go to the [registry](REGISTRY.md).

## collab:brief first, then role and domain documents

- Before any work in any worktree, run `pnpm collab:brief` and handle the blockers and messages
  routed to your worktree/role (mechanism: [collab/README.md](../collab/README.md)).
- Read your worktree state file `collab/state/wt-N.md` and the shared board `collab/BOARD.md` to
  claim work; the shared periodic command is [collab/TICK.md](../collab/TICK.md).
- The six execution roles (Integration / Desktop / Core / Production / Data / Environment) are
  defined with code ownership in the [development outline](development-outline_EN.md)
  ("Execution roles (six roles)"); bootstrap prompts live in [collab/roles/](../collab/roles/);
  worktree↔role assignments live in the BOARD. A role is a hat a session wears, not a branch or
  worktree.
- Then enter the task's domain documents: product boundary, architecture, protocols and schemas,
  design standards.

## Ownership map (links, not copies)

- Product scope and module ownership: [product-boundary_EN](product-boundary_EN.md) (ZH mirror
  alongside)
- Six-crate layout and dependency direction: [system architecture](architecture/system_EN.md)
- Six-role responsibilities and collaboration discipline:
  [development outline](development-outline_EN.md)
- Honesty laws, security and legal boundaries, commit and merge discipline: [AGENTS.md](../AGENTS.md)
  and [collab/README.md](../collab/README.md)
- Managed-document registry: [REGISTRY](REGISTRY.md)

The prior full text (the 2026-09-01 handoff summary) is preserved by Git history; no archive or
summary copy is created.
