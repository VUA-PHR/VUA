import { describe, expect, it } from "vitest";
import {
  DOWNLOAD_EVENT_SCHEMA_VERSION,
  isDownloadEventV01,
  type DownloadEventV01,
} from "./download-events.js";

function event(overrides: Partial<DownloadEventV01> = {}): DownloadEventV01 {
  return {
    schemaVersion: DOWNLOAD_EVENT_SCHEMA_VERSION,
    kind: "download.started",
    downloadId: "dl-1",
    attempt: 1,
    sourceUrl: "https://booth.pm/download/1",
    initiatedFromPageUrl: "https://booth.pm/items/1",
    urlChain: ["https://booth.pm/download/1"],
    suggestedFileName: "closet.unitypackage",
    storedPath: "C:/vua/staging/closet.unitypackage",
    expectedBytes: 1024,
    receivedBytes: 0,
    resumable: false,
    failureKind: null,
    occurredAt: "2026-09-06T00:00:00.000Z",
    ...overrides,
  };
}

describe("download-events v0.1 wire vocabulary", () => {
  it("accepts the six frozen kinds and explicit-null optionals", () => {
    for (const kind of [
      "download.started",
      "download.progress",
      "download.interrupted",
      "download.completed",
      "download.cancelled",
    ] as const) {
      expect(isDownloadEventV01(event({ kind }))).toBe(true);
    }
    // failed:failureKind 必填且仅 policy|unknown
    expect(isDownloadEventV01(event({
      kind: "download.failed",
      storedPath: null,
      receivedBytes: null,
      failureKind: "policy",
    }))).toBe(true);
    expect(isDownloadEventV01(event({
      kind: "download.failed",
      storedPath: null,
      failureKind: "unknown",
    }))).toBe(true);
  });

  it("rejects the negative fixtures: off-vocabulary failure kinds and extra fields", () => {
    // 负例 1:端口不可如实归因的 "network" 必须被拒(词表闭合为 policy|unknown)
    expect(isDownloadEventV01(event({ failureKind: "network" }))).toBe(false);
    // 负例 2:事件之外旁路路径字段(如 userChosenPath)必须被拒
    expect(isDownloadEventV01({
      ...event(),
      userChosenPath: "C:/Users/x/Downloads/closet.unitypackage",
    } as unknown as DownloadEventV01)).toBe(false);
  });

  it("rejects wrong schema versions, unknown kinds, and malformed facts", () => {
    expect(isDownloadEventV01(event({ schemaVersion: "0.2" }))).toBe(false);
    expect(isDownloadEventV01(event({ kind: "download.paused" as never }))).toBe(false);
    expect(isDownloadEventV01(event({ attempt: 0 }))).toBe(false);
    // expectedBytes: 0 是 Schema 合法值("未知名报 null 不注水"是端口发射
    // 纪律,不是 Schema 拒绝)
    expect(isDownloadEventV01(event({ expectedBytes: 0 }))).toBe(true);
    expect(isDownloadEventV01(event({ sourceUrl: "" }))).toBe(false);
    expect(isDownloadEventV01(event({ resumable: "yes" as never }))).toBe(false);
    expect(isDownloadEventV01(null)).toBe(false);
  });

  it("enforces the per-kind conditionals (mirror of the Schema allOf)", () => {
    // started/progress/interrupted/completed:failureKind 必须为 null
    expect(isDownloadEventV01(event({ kind: "download.started", failureKind: "policy" }))).toBe(false);
    // started/progress/interrupted/completed:storedPath 必须在场
    expect(isDownloadEventV01(event({ kind: "download.started", storedPath: null }))).toBe(false);
    expect(isDownloadEventV01(event({ kind: "download.interrupted", storedPath: null }))).toBe(false);
    // progress/completed:receivedBytes 必须是整数
    expect(isDownloadEventV01(event({
      kind: "download.progress",
      receivedBytes: null,
    }))).toBe(false);
    expect(isDownloadEventV01(event({
      kind: "download.completed",
      receivedBytes: null,
    }))).toBe(false);
    // interrupted:failureKind 必须为 null(它不是失败)
    expect(isDownloadEventV01(event({
      kind: "download.interrupted",
      failureKind: "unknown",
    }))).toBe(false);
    // failed:failureKind 必须在场
    expect(isDownloadEventV01(event({ kind: "download.failed", failureKind: null }))).toBe(false);
    // cancelled:无附加条件(storedPath/failureKind 皆可空)
    expect(isDownloadEventV01(event({
      kind: "download.cancelled",
      storedPath: null,
      receivedBytes: null,
    }))).toBe(true);
  });
});
