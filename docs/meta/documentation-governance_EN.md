# VUA documentation governance

[English](documentation-governance_EN.md) | [简体中文](documentation-governance_ZH.md)

> Document version: 1.1.0
> Status: Accepted
> Authoritative language: Simplified Chinese (EN is the mirror, synced to 1.1.0)
> Source: formalization of §2 of the "VUA documentation and collaboration repair plan"
> (`docs/plans/docs-governance-reform_ZH.md`). The plan itself carries no normative effect;
> from acceptance onward this document is the sole authority for document version management.

## 1. Layers and version rules

| Layer | Content | Storage | Version rule | Change gate |
| --- | --- | --- | --- | --- |
| T0 Governance | AGENTS.md, this document | Tracked in git | Internal SemVer | Major requires user ruling |
| T1 Product boundary | product-boundary, compatibility policy | Tracked in git | Internal SemVer | Major requires user ruling |
| T2 Contracts/protocols/Schemas | docs/protocols, schemas/ | Tracked in git | Independent versions per contract | After freeze, bump version only; never edit in place |
| T3 Decisions | docs/decisions (ADR) | Tracked in git | Immutable numbering | Can only be superseded by a new ADR |
| T4 Architecture/design | docs/architecture, docs/design | All tracked in git | Internal SemVer | Implementation-conformance review at every M gate |
| T5 Plans/collaboration | development-outline, collab/ | Tracked in git | outline uses internal SemVer; collab follows the collaboration-mechanism rules | User rules plan direction; worktrees self-maintain state |

## 2. Internal document SemVer

- **Major**: major structural rewrite, section reorganization, change of content direction;
- **Minor**: new sections or substantial additions that do not disturb the existing structure;
- **Patch**: typo fixes, data updates, minor wording adjustments.

### 2.1 Header format

Every managed document uses this uniform header:

```
> Document version: x.y.z
> Status: Draft / Accepted / Frozen / Superseded (→ successor path)
> Authoritative language: Simplified Chinese (EN is the mirror, synced to x.y.z)
> Last conformance review: YYYY-MM-DD (T4 only)
```

T2 contract documents keep their existing protocol/format-version status block; the document
version line is placed near the status block without altering the status wording.

### 2.2 Changelog section

Every document ends with a fixed `## Document changelog` section, one line per version
(version, date, one sentence), keeping only the latest 10 entries; earlier history lives in
git. Patch changes may ride along with any commit; Minor/Major changes must name the document
and the version action in the commit message.

### 2.3 Bilingual pairs

The version number belongs to the "document pair". ZH is the authoritative source; the EN
mirror must state in its header which version it is synced to. Transient Patch-level drift is
allowed; Minor and above must land bilingually in the same batch.

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

Paths refer to the ZH version; the EN mirror travels with it and is not registered separately.
Update rules are in §3.

### 2.7 Traceability

The release notes of every M gate end with the "document version matrix accepted at this gate"
(a REGISTRY snapshot), making product versions and document versions mutually traceable.

## 3. REGISTRY update cadence (event-driven, not per collaboration count)

- **Update triggers** (exactly four): ① a managed document changes Minor/Major version;
  ② a document changes status (Draft → Accepted → Frozen → Superseded); ③ a new managed
  document is added; ④ review dates are refreshed after an M-gate conformance review.
  **Patch-level edits never touch the REGISTRY**.
- **Same-batch commits**: a REGISTRY row edit rides along with the document commit that caused
  it — no extra commits, no extra collaboration round trips.
- **Expected frequency**: at the current pace, roughly 0–3 single-line edits per day; status
  files, proposal discussions, and similar collaboration actions **never touch** the REGISTRY
  (that is collab/'s job; the two mechanisms stay separate).
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

## Document changelog

- 1.1.0 (2026-09-23): added §4 "Reference whitelist for managed-document bodies" (landing
  of proposal 031-E4) — normative bodies cite only proposal NNN / U# / managed-document
  versions / protocol and schema versions / product versions; batch numbers, wt-N, and bare
  facet letters are barred from managed documents; the G13 residue becomes a ride-along
  cleanup item at the next version bump.
- 1.0.0 (2026-09-06): initial version, formalized from §2 of the documentation and
  collaboration repair plan.
