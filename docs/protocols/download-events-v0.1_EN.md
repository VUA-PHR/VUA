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
- **BDL idempotency**: admission is keyed by content (`artifact_sha256`), not by
  download events; downloading the same file twice never produces a second artifact
  record.

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

After inspection passes, AMF decides whether to create a Warehouse entry:

- `warehouseItemId` is a VUA-generated local identity (same discipline as package
  machine ids: stable, never derived from display names);
- the file moves into the Warehouse layout (**physical layout pending a ruling** — see
  open items) and `storedPath` is updated after the move;
- BDL records `warehouse_items` + `warehouse_artifacts` (item ↔ artifact); the existing
  `artifact_mappings` stays unchanged — the artifact-to-product fact does not follow
  Warehouse organization.

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

- Warehouse physical layout (on-disk organization, naming, dedup) — needs a
  product-owner one-pager ruling;
- Inspection hooks (archive content scanning etc.) are defined as an interface
  placeholder; B4 implements only the minimal size/type/digest set;
- Machine-readable JSON Schema for event payloads lands in
  `schemas/download-events/v0.1/` when F confirms the vocabulary at freeze.
