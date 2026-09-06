# Download Events Protocol v0.1

[English](download-events-v0.1_EN.md) | [简体中文](download-events-v0.1_ZH.md)

> Status: **Frozen** (2026-09-06) — the F-line's four acceptances and three revisions
> (`resumable` wording unification, `failureKind` nullable/`unknown`, optional
> `urlChain`) are merged into this edition; machine-readable vocabulary in
> `schemas/download-events/v0.1/`
> Scope: Normalized download events, retry/recovery semantics, source correlation,
> LocalArtifact inspection and Warehouse mapping for AMF material acquisition
> (B4: material acquisition and BDL)
> Ownership boundaries: `docs/architecture/desktop_EN.md` (Electron owns Session/
> DownloadItem), `docs/architecture/bdl_EN.md` (BDL stores only the metadata subset AMF
> approves for persistence)
> Updated: 2026-09-06

## Event flow and ownership

```text
Electron Main (isolated Session / DownloadItem)
  ↓ narrowed download port: normalized events (transport facts)
AMF material acquisition (intent, tasks, source correlation)
  ↓ LocalArtifact inspection (size/type/source validation + content digest)
AMF inspection decision
  ↓ approved-to-persist metadata subset
BDL local database (download_events / local_artifacts / warehouse)
```

The port reports **transport facts** only. Content identity (SHA-256), inspection
verdicts, source correlation and Warehouse decisions are all made by AMF. Events never
carry cookies, download tokens or credentials.

## Event vocabulary (closed set)

| Event | Meaning |
| --- | --- |
| `download.started` | an attempt begins transferring |
| `download.progress` | periodic byte counts (throttling is the port's choice; AMF never depends on its frequency) |
| `download.interrupted` | network break before a terminal state; a **resumable** candidate |
| `download.completed` | byte transfer finished (still untrusted — pending AMF verification) |
| `download.cancelled` | cancelled by user or task; terminal |
| `download.failed` | unrecoverable failure; terminal |

Normalized fields (carried by every event): `downloadId` (port-assigned, stable across
retries), `attempt` (1-based), `sourceUrl`, `initiatedFromPageUrl` (page context
captured at `will-download` time), `urlChain` (optional, redirect chain captured at
`will-download` time — source-verification input, adopted by the B side),
`suggestedFileName`, `storedPath` (VUA-managed download staging path — never user
folders directly; nullable when a policy rejection happens at `will-download` and no
file was created), `expectedBytes` (nullable; Content-Length — unknown size is
reported as `null`, never inflated to 0), `receivedBytes`, `resumable` (**the port's
resumability verdict**, i.e. Electron `canResume()`; the port never self-observes
range headers as a second signal, avoiding dual-signal drift), `failureKind` (failure
events only: `policy` is the port's self-attributable download-target allowlist
denial; for every other failure the port **cannot honestly distinguish** network,
disk or server causes, so it reports `unknown` — the "no guessing, no inflation"
discipline), `occurredAt`.

## State machine

```text
queued → downloading → transferDone → verifying → inspected → admitted
              ↓ interrupted (back to downloading, same attempt counter)
              ↓ cancelled / failed (terminal)
```

`completed` ≠ `admitted`: transfer completion is only the input to AMF inspection.
Inspection = size bound, extension/type allowlist, source and page-context
cross-check, SHA-256 computation. Only after passing does the file become a trusted
LocalArtifact eligible for source correlation and Warehouse decisions.

## Retry and recovery semantics

- **Retry unit**: `downloadId` stays stable across attempts; `attempt` increments. A
  retry under the same `downloadId` is not a new download.
- **Resume**: only when `resumable` is true — append from a server-confirmed byte
  offset. SHA-256 cannot resume across interruptions, so partial hash state is always
  discarded and the digest is computed over the complete file. Any offset doubt (no 206
  response, length mismatch) → discard the partial file and restart from zero.
- **Bounded attempts**: at most 3 attempts per `downloadId` with exponential backoff;
  task-level cancellation takes effect at attempt boundaries (same as the global task
  contract: cancellation requested ≠ cancelled).
- **Crash recovery**: after a restart, downloads without a terminal event are
  `orphaned` — the partial file is inspected, never silently resumed: provably complete
  (size matches and SHA-256 matches an existing record) goes through inspection;
  otherwise the partial file is discarded and recorded as a failed download for the
  user's retry decision. This is the global "receipt unknown → inspect first"
  discipline made concrete.
- **BDL idempotency**: inspection facts are idempotent per content
  (`artifact_sha256`); physical copies exist per entry — downloading the same asset
  again creates new physical copies and a new package entry, but never repeats
  inspection or source correlation (warehouse-layout ruling 2).

## Source correlation

The correlation triple is submitted to BDL by AMF when inspection passes:

1. **Source product** — the page context at click time; if that page was normalized by
   the observation pipeline, it carries the `booth:<native_product_id>` namespaced
   identity;
2. **Artifact identity** — the AMF-computed `artifact_sha256`;
3. **Sub-product** — nullable; carried when order/variant context is available.

Correlation is a **many-to-many fact** (one file can be referenced by several product
pages): BDL's `artifact_mappings` keys on `(artifact_sha256, product_id)` and repeated
submissions are idempotent.

## Warehouse mapping

The layout is governed by `docs/decisions/warehouse-layout_EN.md` (accepted,
2026-09-06): **semantic directory tree, no deduplication, copy-in import**. After
inspection passes, AMF decides whether to create a material-package entry:

- the warehouse is organized by material package: one entry per folder, the folder name
  being a VUA-generated local identity (stable, never derived from display names), with
  `storedPath` updated when the root setting changes;
- **no deduplication**: the same content may exist many times — inspection facts are
  idempotent per content, physical copies exist per entry, and source correlation
  (`artifact_mappings`) is unaffected by copy count;
- **import = copy-in + batch**: multi-select folders, each folder becomes one
  material-package entry, originals untouched;
- **artifact-mode setting**: the generated VPM package and the material folder are
  siblings within an entry; the settings expose "use VPM package (optional: delete
  originals after generation) / use the original .unitypackage (default)", mapping to
  the two material-intake v0.1 channels; original deletion executes only after
  generation and verification succeed, and is audited;
- users do not browse the disk: the warehouse is presented by VUA's own content
  manager.

## F-line port alignment conclusions (confirmed, 2026-09-06)

The F line accepted all four items (`docs/plans/f-reply-to-b4-download-port-alignment_ZH.md`);
the freeze merges these conclusions:

- Capability: `desktop.remoteBrowser` is already in the Provider capability table
  (currently unavailable); the download port belongs to the same desktop capability
  family; event payloads are exactly this vocabulary, and the transport channel
  (Gateway notifications vs port frames) is F4's implementation choice;
- **Failure derivation**: on reaching `interrupted` the port calls `canResume()` —
  true reports `download.interrupted`, false reports `download.failed`; this is the
  only native discriminator on the Electron `DownloadItem`;
- **Field mapping**: confirmed row by row. `initiatedFromPageUrl` and `urlChain` must
  be captured at `will-download` time (fetching after the event fires is too late);
  `expectedBytes` reports `null` for unknown size, never inflated to 0;
- **Retry responsibility split**: policy belongs to AMF (whether to retry, the 3-attempt
  bound, backoff, giving up); mechanism belongs to the port (`resume()`, partial-file
  management, attempt counting); AMF intent commands on the same `downloadId` are
  **serialized** by the port (adjudicated by command arrival order + revision — `resume`
  and cancellation are never interpreted concurrently); the port never initiates a
  retry AMF did not authorize;
- **Staging directory injection**: `storedPath` is derived from the VUA-managed staging
  directory injected by the shell/AMF; the port holds no path policy of its own;
  same-name disambiguation inside the injected directory (e.g. a short `downloadId`
  suffix) is the port's implementation detail, the final name is reported verbatim,
  and AMF never parses its construction;
- `policy` failures cancel via `event.cancel()` directly at `will-download` and report
  `failed/policy`, the same practice as the local content navigation policy.

## Open items

- Inspection hooks (archive content scanning etc.) are defined as an interface
  placeholder; B4 implements only the minimal size/type/digest set;
- The machine-readable JSON Schema for event payloads landed with the freeze in
  `schemas/download-events/v0.1/` (`event.schema.json` + `examples/`); vocabulary or
  field changes must bump the version, never rewrite in place.

The warehouse physical layout is ruled (`docs/decisions/warehouse-layout_EN.md`):
semantic tree, no deduplication, copy-in + batch import, artifact-mode setting.
