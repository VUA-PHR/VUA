# Download Events Protocol v0.1

[English](download-events-v0.1_EN.md) | [简体中文](download-events-v0.1_ZH.md)

> Status: Draft — frozen together with the F-line port shape confirmation; no normative
> effect until frozen
> Scope: Normalized download events, retry/recovery semantics, source correlation,
> LocalArtifact inspection and Warehouse mapping for AMF material acquisition
> (B4: material acquisition and BDL)
> Ownership boundaries: `docs/architecture/desktop_EN.md` (Electron owns Session/
> DownloadItem), `docs/architecture/bdl_EN.md` (BDL stores only the metadata subset AMF
> approves for persistence)
> Updated: 2026-09-05

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
retries), `attempt` (1-based), `sourceUrl`, `initiatedFromPageUrl`, `suggestedFileName`,
`storedPath` (VUA-managed download staging path — never user folders directly),
`expectedBytes` (nullable; Content-Length), `receivedBytes`, `resumable` (true only if
the port observed `Accept-Ranges: bytes` or a 206 response), `failureKind`
(`network` / `disk` / `policy` / `server`, failure events only), `occurredAt`.

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

## F-line port alignment

- Capability: `desktop.remoteBrowser` is already in the Provider capability table
  (currently unavailable); the download port belongs to the same desktop capability
  family;
- Event payloads are exactly this vocabulary; the transport channel (Gateway
  notifications vs port frames) is F4's implementation choice — the vocabulary and
  fields are the freezing target;
- The port implementation must not smuggle file-path semantics outside events —
  `storedPath` is the only path field, derived from the VUA-managed directory.

## Open items

- Inspection hooks (archive content scanning etc.) are defined as an interface
  placeholder; B4 implements only the minimal size/type/digest set;
- Machine-readable JSON Schema for event payloads lands in
  `schemas/download-events/v0.1/` when F confirms the vocabulary at freeze.

The warehouse physical layout is ruled (`docs/decisions/warehouse-layout_EN.md`):
semantic tree, no deduplication, copy-in + batch import, artifact-mode setting.
