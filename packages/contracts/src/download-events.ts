// ---- download-events v0.1 wire vocabulary(frozen 2026-09-06)----
// TS mirror of `schemas/download-events/v0.1/event.schema.json` and the
// Rust anchor `download_events.rs` (field-for-field, deny-unknown-fields).
// The F4 download port reports transport facts only: content identity
// (SHA-256), inspection verdicts, source correlation and Warehouse
// decisions are AMF's. Events never carry cookies, download tokens or
// credentials, and `storedPath` is the only path field. Any vocabulary
// change must bump the schema version — never rewrite in place.

export const DOWNLOAD_EVENT_SCHEMA_VERSION = "0.1" as const;

export type DownloadEventKindV01 =
  | "download.started"
  | "download.progress"
  | "download.interrupted"
  | "download.completed"
  | "download.cancelled"
  | "download.failed";

/**
 * Failure attribution, failed events only. The port cannot honestly
 * distinguish network, disk or server causes on the Electron event
 * surface, so `unknown` is the honest default; `policy` is the port's own
 * allowlist denial at `will-download`. Vocabulary is closed — a port that
 * reports e.g. "network" fails the contract (negative fixture).
 */
export type DownloadFailureKindV01 = "policy" | "unknown";

/**
 * One normalized transport event. Field-for-field with the JSON Schema
 * document including deny-unknown-fields: a port that smuggles extra
 * fields (e.g. a user-chosen path) fails the guard here first.
 */
export interface DownloadEventV01 {
  readonly schemaVersion: typeof DOWNLOAD_EVENT_SCHEMA_VERSION;
  readonly kind: DownloadEventKindV01;
  /** Port-assigned; stable across attempts (resume keeps the id). */
  readonly downloadId: string;
  /** 1-based; resume() continues the same attempt, abandoning the partial
   * file and restarting from zero increments. */
  readonly attempt: number;
  readonly sourceUrl: string;
  /** Captured at `will-download`; null when unavailable. */
  readonly initiatedFromPageUrl: string | null;
  /** Captured at `will-download` (adopted v0.1 revision); null when absent. */
  readonly urlChain: readonly string[] | null;
  readonly suggestedFileName: string | null;
  /** The only path field; null for policy rejections (no file created). */
  readonly storedPath: string | null;
  /** Unknown size is null — never 0. */
  readonly expectedBytes: number | null;
  readonly receivedBytes: number | null;
  /** The port's resume verdict (Electron canResume()); never guessed. */
  readonly resumable: boolean;
  readonly failureKind: DownloadFailureKindV01 | null;
  readonly occurredAt: string;
}

const EVENT_KINDS: readonly DownloadEventKindV01[] = [
  "download.started",
  "download.progress",
  "download.interrupted",
  "download.completed",
  "download.cancelled",
  "download.failed",
];

const EVENT_KEYS = [
  "schemaVersion",
  "kind",
  "downloadId",
  "attempt",
  "sourceUrl",
  "initiatedFromPageUrl",
  "urlChain",
  "suggestedFileName",
  "storedPath",
  "expectedBytes",
  "receivedBytes",
  "resumable",
  "failureKind",
  "occurredAt",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNonNegativeInteger(value: unknown): value is number | null {
  return value === null
    || (typeof value === "number" && Number.isSafeInteger(value) && value >= 0);
}

/**
 * Guard mirroring the JSON Schema document (deny-unknown-fields): the
 * negative fixtures — a `failureKind: "network"` (outside the closed
 * vocabulary) and any extra field (e.g. `userChosenPath`) — must be
 * rejected here exactly as the Rust serde mirror rejects them.
 */
export function isDownloadEventV01(value: unknown): value is DownloadEventV01 {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== DOWNLOAD_EVENT_SCHEMA_VERSION) return false;
  if (!(EVENT_KINDS as readonly string[]).includes(value.kind as string)) return false;
  const keys = Object.keys(value).sort();
  if (keys.length !== EVENT_KEYS.length) return false;
  if (!keys.every((key, index) => key === [...EVENT_KEYS].sort()[index])) return false;

  const event = value as unknown as DownloadEventV01;
  if (typeof event.downloadId !== "string" || event.downloadId.length === 0) return false;
  if (typeof event.attempt !== "number" || !Number.isSafeInteger(event.attempt) || event.attempt < 1) {
    return false;
  }
  if (typeof event.sourceUrl !== "string" || event.sourceUrl.length === 0) return false;
  if (!isNullableString(event.initiatedFromPageUrl)) return false;
  if (event.urlChain !== null
    && !(Array.isArray(event.urlChain) && event.urlChain.every((url) => typeof url === "string"))) {
    return false;
  }
  if (!isNullableString(event.suggestedFileName)) return false;
  if (!isNullableString(event.storedPath)) return false;
  // expectedBytes/receivedBytes:integer|null、≥ 0 均合法("未知名报 null,
  // 不得注水为 0"是端口发射纪律,不是 Schema 拒绝)
  if (!isNullableNonNegativeInteger(event.expectedBytes)) return false;
  if (!isNullableNonNegativeInteger(event.receivedBytes)) return false;
  if (typeof event.resumable !== "boolean") return false;
  if (event.failureKind !== null
    && event.failureKind !== "policy"
    && event.failureKind !== "unknown") {
    return false;
  }
  if (typeof event.occurredAt !== "string" || event.occurredAt.length === 0) return false;

  // per-kind 条件(镜像 Schema allOf):非失败事件的 failureKind 必须为
  // null;started/progress/interrupted/completed 必须带 storedPath;
  // progress/completed 必须带整数 receivedBytes;failed 必须带 failureKind
  const kind = event.kind;
  const hasStoredPath = typeof event.storedPath === "string" && event.storedPath.length > 0;
  if (kind === "download.failed") {
    if (event.failureKind === null) return false;
  } else {
    if (event.failureKind !== null) return false;
    if (kind !== "download.cancelled" && !hasStoredPath) return false;
    if ((kind === "download.progress" || kind === "download.completed")
      && (typeof event.receivedBytes !== "number" || event.receivedBytes < 0)) {
      return false;
    }
  }
  return true;
}
