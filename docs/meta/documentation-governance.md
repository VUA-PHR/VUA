# VUA documentation governance


> Document version: 2.4.1
> Status: Accepted
> Source: formalization of §2 of the "VUA documentation and collaboration repair plan"
> (`docs/plans/docs-governance-reform.md`). The plan itself carries no normative effect;
> from acceptance onward this document is the sole authority for document version management.

## 1. Layers and version rules

| Layer | Content | Storage | Version rule | Change gate |
| --- | --- | --- | --- | --- |
| T0 Governance | AGENTS.md, this document | Tracked in git | Internal SemVer | Major requires user ruling |
| T1 Product boundary | product-boundary, compatibility policy | Tracked in git | Internal SemVer | Major requires user ruling |
| T2 Contracts/protocols/Schemas | docs/protocols, schemas/ | Tracked in git | Independent versions per contract | After freeze, bump version only; never edit in place |
| T3 Decisions | docs/decisions (ADR) | Tracked in git | Immutable numbering | Can only be superseded by a new ADR |
| T4 Architecture/design | docs/architecture, docs/design | All tracked in git | Internal SemVer | Implementation-conformance review at every N gate |
| T5 Plans/history | development-outline; frozen collab history | Tracked in git | outline uses internal SemVer; collab is unmaintained | User rules N direction; no collab bookkeeping |

## 2. Internal document SemVer

- **Major**: major structural rewrite, section reorganization, change of content direction;
- **Minor**: new sections or substantial additions that do not disturb the existing structure;
- **Patch**: typo fixes, data updates, minor wording adjustments.

### 2.1 Header format

Every managed document uses this uniform header:

```
> Document version: x.y.z
> Status: Draft / Accepted / Frozen / Superseded (→ successor path)
> Last conformance review: YYYY-MM-DD (T4 only)
```

Single-language canonical documents omit any "authoritative language" line (see §2.3).

T2 contract documents keep their existing protocol/format-version status block; the document
version line is placed near the status block without altering the status wording.

### 2.2 Changelog section

Every document ends with a fixed `Document changelog` section, one line per version
(version, date, one sentence), keeping only the latest 10 entries; earlier history lives in
git. Patch changes may ride along with any commit; Minor/Major changes must name the document
and the version action in the commit message.

### 2.3 Language policy (user ruling 2026-09-25)

Tracked documentation is **single-language English**: each document exists once, without a
language suffix, and the tracked English file is the sole authority. Three standing exceptions:

- **Changelogs** (`docs/release/v*.md` release notes) are single-language **Chinese**;
- **README** is maintained in four languages: English (`README.md`), Chinese (`README_ZH.md`),
  Japanese (`README_JA.md`), Korean (`README_KO.md`); more editions may be added;
- Schemas, wire formats, source code, generated files, and official license texts remain
  single-source as before.

Desktop application copy uses the i18n system, initially supporting English, Simplified Chinese,
Japanese and Korean, with further languages allowed. UI translation resources are not duplicated
developer documentation. Literal UI terminology, source-language examples and official license text
may retain their original language within an English document. Archived records preserve their
historical wording and carry no current implementation authority; new instructions belong in
English current documents. Internal document-version changelog sections follow their document's
language; the Chinese changelog exception above refers to product release notes.

Chinese mirrors of the English documentation are maintained **locally** under the gitignored
`docs-zh/` directory (same relative paths). They are not tracked, are never registered, carry no
normative force, and are synced by the local workspace as English documents evolve. New tracked
documents are English-only from creation.

### 2.4 Status separated from version

- "Frozen" is a lifecycle state, not a promise of immutable content; Patch changes remain
  allowed after freeze;
- A **normative content** change to a frozen document = Major + an explicit unfreeze ruling
  record (who, when, why), with the old version section preserved;
- T2 contracts keep the stricter rule: any normative change bumps the version number only and
  is never edited in place.

### 2.5 Hard prerequisites for freezing

Before any contract/protocol may be marked "Frozen", the repository must already contain: a
machine-readable Schema (or a justified exemption record), positive and negative test vectors,
and at least one consumer-side test. If any of the three is missing, the status can only be
"Candidate".

### 2.6 Registry

`docs/REGISTRY.md` is the machine-readable table of all managed documents (path, document
version, status, maintainer, last review date). The format is one explanatory line plus one
markdown table:

```
| Path | Document version | Status | Maintainer | Last review |
```

Paths refer to the canonical file (single-language per §2.3). Update rules are in §3.

### 2.7 Traceability

Each product release records its accepted document version matrix (a REGISTRY snapshot) in the
release notes. N-gate acceptance records cite the document versions reviewed and the release or
commit actually tested. A gate may span several releases; release numbering and gate completion
remain independent.

## 3. REGISTRY update cadence (event-driven, not per collaboration count)

- **Update triggers** (exactly four): ① a managed document changes Minor/Major version;
  ② a document changes status (Draft → Accepted → Frozen → Superseded); ③ a new managed
  document is added; ④ review dates are refreshed after an N-gate conformance review.
  **Patch-level edits never touch the REGISTRY**.
- **Same-batch commits**: a REGISTRY row edit rides along with the document commit that caused
  it — no extra commits, no extra collaboration round trips.
- **Expected frequency**: at the current pace, roughly 0–3 single-line edits per day; status
  files, proposal discussions, and similar collaboration actions **never touch** the REGISTRY
  (historical coordination records are no longer maintained).
- **Drift is prevented by machine checks, not high-frequency human effort**: `collab:brief`
  (and later CI) verifies that each managed document's header version/status matches its
  REGISTRY row, and reports any mismatch. Low-cost detection replaces preventive high-frequency
  updates; a human writes one line only when an event occurs.

## 4. Reference whitelist for managed-document bodies (2026-09-23, proposal 031-E4)

When the normative body text of a managed document (T0–T5) references a collaboration work
item, only the following forms are allowed:

- `proposal NNN` (a `collab/proposals/` proposal number);
- `U#` (a BOARD "pending user ruling" row number, only when citing an issued ruling);
- managed-document versions (internal SemVer), protocol/schema versions, product versions.

The following identifiers **must not enter managed documents**: integration batch numbers
("batch N"), worktree numbers (wt-N/VUA-N), and **bare** facet letters from inside proposals
(cross-document references must use the `NNN-facet` form, e.g. 026-A3).

Disposition of existing residue: the G13 references currently present in the
`docs/protocols/bdl-queries-*` protocol documents and `docs/architecture/bdl_*` are listed
as a **ride-along cleanup item for the next version bump of those documents**; no freeze face
is re-versioned just for this. Old identifiers in historical files are never rewritten
retroactively (see the retired-namespace table in `collab/README.md`).

## 5. Current routes, proposals and archives (2026-09-28)

Keep one short docs/README route by user task. Architecture distinguishes current implementation
from Draft evolution; a proposal does not change a frozen interface. Update the smallest owning
document with its implementation slice. Do not make exhaustive documentation cleanup a dependency
of a working N feature.

Before retirement, check runtime/schema/test consumers, inherited definitions, and accepted
constraints. Older version numbers can be concurrently served faces. Move only demonstrated
historical material into docs/archive with a reason and current-route pointer; preserve original
content, adjust links, and record the disposition. Existing protocols/superseded paths may remain.
Archived embedded status headers are historical, not current authority. Registry tracks current
owners, not copied archive snapshots. Research with implementation consumers needs domain review
before its constraints are discarded.

Collab is retired and physically archived. The
[protected-main policy](protected-main.md) continues in force. Keep pnpm collab:brief
and report-only CI; registry-only checking does not reactivate collab bootstrap. Current decisions
land in owning documents/PRs, not mandatory BOARD updates.

## 6. Local environment and reproducible evidence

Keep the workstation inventory in the gitignored `_local_environment/` directory. The ignore
file contains exclusion patterns, not machine facts. Record the observation date, software and
version where known, evidence source, and whether each entry is user-reported, detected, or
actually exercised. Unknown is distinct from absent. Refresh observations before deployment
and after installation/removal; a stale inventory is not an execution prerequisite or proof.

Keep paths, accounts, device identifiers, raw logs and private artifacts local. Public documents
record the target scenario, required versions, procedure and sanitized result/scope. A tracked
acceptance recipe can name PICO PCVR without claiming any developer's current runtime is working.
Real runs keep dated before/after snapshots under `_local_real_machine/`; the current inventory
is only a convenience index. Local reinstall is not a clean OS, and one machine is not evidence
of compatibility with other Windows versions. A synthetic CI fixture contains no real inventory.

## 7. One owner per rule

Current entry points link to the owning document instead of restating complete policies.
Product boundaries define scope; the N sequence defines outcomes and acceptance; release policy
defines versions; architecture defines responsibilities; protocols define wire/storage behavior;
engineering rules define implementation/evidence safeguards. REGISTRY contains concise metadata,
not implementation histories. Keep historical claims in archives and Git history.

Collab and old role prompts live under `docs/archive/2026-09-29/`. The two legacy collab entry
files forward to the archive and current PR policy. No archived prompt is an active instruction.

## Document changelog

- 2.4.1 (2026-09-30): separate release document matrices from N-gate acceptance traceability.

- 2.4.0 (2026-09-30): clarify UI i18n, expandable README languages, English current documentation and preserved source-language examples/history.

- 2.3.0 (2026-09-29): define one-rule-one-owner routes and physical collab archival.


- 2.2.0 (2026-09-28): define local inventory versus public test evidence; repair misplaced section insertion.
- 2.1.0 (2026-09-28): add task routes, current/proposed distinction and evidence-based archival under the collab freeze.

- 2.0.1 (2026-09-28): erratum — M-gate references replaced by N gates following the 2026-09-28
  sequence change (T4 change gate, §2.7 traceability, §3 trigger ④); no rule change.
- 2.0.0 (2026-09-25): user ruling — language policy flip. Tracked documentation becomes
  single-language English (this file, formerly the EN mirror, becomes the canonical document);
  changelogs become single-language Chinese; README stays four-language; Chinese mirrors move to
  the local gitignored `docs-zh/`. §2.3 rewritten, §2.1 header template and §2.6 registry path
  rule updated; authoritative language changes to English.
- 1.1.0 (2026-09-23): added §4 "Reference whitelist for managed-document bodies" (landing
  of proposal 031-E4) — normative bodies cite only proposal NNN / U# / managed-document
  versions / protocol and schema versions / product versions; batch numbers, wt-N, and bare
  facet letters are barred from managed documents; the G13 residue becomes a ride-along
  cleanup item at the next version bump.
- 1.0.0 (2026-09-06): initial version, formalized from §2 of the documentation and
  collaboration repair plan.
