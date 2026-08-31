# VUA Workspace Instructions

This repository is the clean implementation baseline for VRC Ultra Assistant (VUA). It replaces the
archived `VRC_Ultra_assistant` and `VUA_BDB` repositories. Old repositories are historical evidence,
not implementation authority.

## Start here

- Read `README.md`, then use `docs/README.md` to select the smallest task-specific reading path.
- Read `docs/product-boundary.md` before changing product scope or module ownership.
- Read only the documents and modules needed for the current task.
- Treat accepted decisions, versioned protocols, schemas, and tests as normative. Plans and research
  do not silently change product scope.
- When two normative sources conflict, stop implementation and resolve the authority chain first.

## Product invariants

- The desktop shell is Electron. The local UI uses React, TypeScript, and Vite.
- The application core and orchestration layer remain Rust and run outside the renderer process.
- React communicates through a narrow preload/Gateway API. Views never call Electron, Node.js,
  SQLite, Unity, or operating-system APIs directly.
- Remote web content is isolated from local application privileges. It never receives Node.js,
  preload, filesystem, credential, Orchestrator, or plugin-host access.
- BDB is a local VUA module. It owns local catalog, compatibility, terms, source metadata, and search
  state; it is not a separate cloud product or repository.
- AMF remains Recipe-first. A user selects assets and intent before VUA creates or modifies the Unity
  project.
- Unity changes cross the versioned Unity Bridge. Do not automate Unity through unversioned UI
  clicking when a deterministic Bridge operation can exist.
- Project management supports both the open `vrc-get`/ALCOM path and the official VCC path through
  capability-aware adapters.
- Runtime integrations use the same adapter model. SlimeVR Server and VRCFaceTracking are planned
  for optional managed integration and connection to an existing external installation.
- Desktop and VR overlays remain product modules and consume stable application services; they do
  not become alternate business-logic hosts.
- Third-party extensions use a versioned plugin protocol and declared capabilities. Plugins do not
  depend on private database tables, React state, or internal Rust types.

## Dependency direction

```text
React View
  -> typed frontend feature/Gateway
  -> Electron preload and main-process adapter
  -> versioned local IPC
  -> Rust Orchestrator use case
  -> domain port
  -> local or third-party adapter
```

Dependencies point inward toward contracts, application use cases, and domain rules. Framework and
vendor types stay in adapters. Do not place business decisions in React components, Electron IPC
handlers, Unity editor callbacks, or third-party integration wrappers.

## Security and legal boundaries

- Never commit paid assets, `.unitypackage` files containing paid content, user Unity projects,
  cookies, access tokens, order data, production databases, private logs, or `.env` files.
- BOOTH access and downloads use the user's own session and authorization. Do not bypass purchase,
  payment, age, authentication, or access controls.
- Credentials and purchased files remain local. Do not relay them through project-operated servers.
- Use synthetic fixtures in repository tests. Do not hard-code real paid-product URLs or copyrighted
  product data.
- Before bundling a third-party binary, audit its license, redistribution terms, update mechanism,
  signatures, and required notices. External-connection support does not imply redistribution rights.
- A plugin marketplace, hosted plugin catalog, or automatic execution of untrusted plugins requires
  a separately accepted security and governance decision.

## Change discipline

1. Define or update the owning contract before implementing a cross-module behavior.
2. Keep Electron handlers and vendor adapters thin; test application behavior below them.
3. Add regression tests for every repaired correctness or recovery defect.
4. Make long-running operations cancellable, observable, and safe to retry where the contract allows.
5. Prefer capability detection over assumptions about installed software or upstream versions.
6. Add dependencies only with a clear owner, purpose, license, and removal path.
7. Preserve unrelated worktree changes. Never work directly on `main`.
8. Do not add `Co-authored-by: Codex` trailers.

## Documentation discipline

- Product scope belongs in the product-boundary document.
- Dependency direction and module ownership belong in architecture documentation.
- Wire formats and persistent formats require explicit machine-readable versions.
- Technical trade-offs belong in accepted ADRs.
- Plans schedule accepted work; they do not create product requirements.
- A removed feature leaves active documentation and remains only in Git history or an explicitly
  historical document.
- `docs/reference/` and `docs/migration/` never become implementation authority by implication.

## Legacy repositories

- `VRC_Ultra_assistant` and `VUA_BDB` are read-only migration sources until they are archived.
- Never merge a legacy branch wholesale into this repository.
- Migrate a legacy asset only after recording its source, target owner, retained value, rejected
  baggage, verification evidence, and license status in the migration ledger.
- Legacy Tauri shell code and configuration are reference-only. React behavior may be reimplemented;
  Tauri-specific IPC, permissions, packaging, and runtime assumptions do not cross the new boundary.
