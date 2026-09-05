import { mkdtempSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DownloadPort, type DownloadEventSink } from "./download-port.js";
import { isDownloadEventV01, type DownloadEventV01 } from "@vua/contracts";

/**
 * 下载端口单元测试(F4-3):假 DownloadItem 驱动事件规范化状态机——
 * 策略拒绝、started/progress/completed 形状、interrupted→canResume 派生、
 * attempt 纪律(resume 同 attempt、弃件重绑递增)、同名消歧。
 * 每个发射事件都过 isDownloadEventV01 守卫(镜像 Rust deny_unknown_fields)。
 */

class FakeDownloadItem extends EventEmitter {
  readonly url: string;
  readonly chain: string[];
  readonly filename: string;
  total: number | null;
  received = 0;
  savePath = "";
  resumable = false;
  cancelled = false;
  resumed = false;

  constructor(url: string, options: { filename?: string; total?: number | null; chain?: string[] } = {}) {
    super();
    this.url = url;
    this.chain = options.chain ?? [url];
    this.filename = options.filename ?? "closet.unitypackage";
    this.total = "total" in options ? options.total! : 1024;
  }

  getURL(): string {
    return this.url;
  }
  getURLChain(): string[] {
    return this.chain;
  }
  getWebContents(): { getURL: () => string } {
    return { getURL: () => "https://booth.pm/items/1" };
  }
  getFilename(): string {
    return this.filename;
  }
  getTotalBytes(): number {
    return this.total ?? 0;
  }
  getReceivedBytes(): number {
    return this.received;
  }
  setSavePath(savePath: string): void {
    this.savePath = savePath;
  }
  getSavePath(): string {
    return this.savePath;
  }
  canResume(): boolean {
    return this.resumable;
  }
  isPaused(): boolean {
    return false;
  }
  cancel(): void {
    this.cancelled = true;
    this.emit("done", {}, "cancelled");
  }
  resume(): void {
    this.resumed = true;
  }
  tick(bytes: number): void {
    this.received = bytes;
    this.emit("updated", {}, "progressing");
  }
  finish(state: "completed" | "cancelled" | "interrupted"): void {
    this.emit("done", {}, state);
  }
}

describe("download port (F4-3)", () => {
  let stagingRoot: string;
  let events: DownloadEventV01[];
  let downloadURLs: string[];

  function createPort(overrides: { allowedOrigins?: readonly string[]; progressIntervalMs?: number } = {}): DownloadPort {
    const sink: DownloadEventSink = {
      emit: (event) => {
        expect(isDownloadEventV01(event)).toBe(true);
        events.push(event);
      },
    };
    return new DownloadPort({
      stagingRoot,
      partitionSession: { downloadURL: (url: string) => downloadURLs.push(url) } as never,
      allowedOrigins: overrides.allowedOrigins ?? ["https://booth.pm"],
      sink,
      now: () => "2026-09-06T00:00:00.000Z",
      ...(overrides.progressIntervalMs === undefined ? {} : { progressIntervalMs: overrides.progressIntervalMs }),
    });
  }

  beforeEach(() => {
    stagingRoot = mkdtempSync(path.join(tmpdir(), "vua-download-port-"));
    events = [];
    downloadURLs = [];
  });

  afterEach(() => {
    rmSync(stagingRoot, { recursive: true, force: true });
  });

  it("rejects off-allowlist downloads before file creation with failed/policy", () => {
    const port = createPort();
    const preventDefault = vi.fn();
    const item = new FakeDownloadItem("https://example.test/file.zip", { filename: "file.zip" });

    port.handleWillDownload({ preventDefault }, item as never, item.getWebContents() as never);

    expect(preventDefault).toHaveBeenCalled();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      kind: "download.failed",
      failureKind: "policy",
      storedPath: null,
      resumable: false,
    });
    // preventDefault 即拒绝;端口从未指定保存路径
    expect(item.savePath).toBe("");
  });

  it("normalizes the happy path: started with staging path, throttled progress, completed", () => {
    const port = createPort({ progressIntervalMs: 0 });
    const item = new FakeDownloadItem("https://booth.pm/download/1");

    port.handleWillDownload({ preventDefault: vi.fn() }, item as never, item.getWebContents() as never);
    const started = events.find((event) => event.kind === "download.started")!;
    expect(started).toMatchObject({
      attempt: 1,
      sourceUrl: "https://booth.pm/download/1",
      initiatedFromPageUrl: "https://booth.pm/items/1",
      suggestedFileName: "closet.unitypackage",
      expectedBytes: 1024,
      receivedBytes: 0,
      failureKind: null,
    });
    expect(started.storedPath).toContain(stagingRoot);
    expect(started.storedPath!.endsWith("closet.unitypackage")).toBe(true);
    expect(item.savePath).toBe(started.storedPath);

    item.tick(300);
    item.tick(600);
    const progressEvents = events.filter((event) => event.kind === "download.progress");
    expect(progressEvents).toHaveLength(2);
    expect(progressEvents[1]).toMatchObject({ receivedBytes: 600, storedPath: started.storedPath });

    item.finish("completed");
    const completed = events.at(-1)!;
    expect(completed).toMatchObject({
      kind: "download.completed",
      downloadId: started.downloadId,
      receivedBytes: 600,
      failureKind: null,
    });
  });

  it("reports unknown size as null, never inflated to 0", () => {
    const port = createPort();
    const item = new FakeDownloadItem("https://booth.pm/download/2", { total: null });

    port.handleWillDownload({ preventDefault: vi.fn() }, item as never, item.getWebContents() as never);
    expect(events.find((event) => event.kind === "download.started")!.expectedBytes).toBeNull();
  });

  it("derives interrupted from canResume and resumes within the same attempt", () => {
    const port = createPort();
    const item = new FakeDownloadItem("https://booth.pm/download/3");
    item.tick(400);
    port.handleWillDownload({ preventDefault: vi.fn() }, item as never, item.getWebContents() as never);
    const downloadId = events.find((event) => event.kind === "download.started")!.downloadId;

    item.resumable = true;
    item.finish("interrupted");
    const interrupted = events.at(-1)!;
    expect(interrupted).toMatchObject({
      kind: "download.interrupted",
      downloadId,
      attempt: 1,
      resumable: true,
      failureKind: null,
    });

    port.applyIntent(downloadId, "resume");
    expect(item.resumed).toBe(true);
  });

  it("reports non-resumable interruptions as terminal failed/unknown", () => {
    const port = createPort();
    const item = new FakeDownloadItem("https://booth.pm/download/4");
    port.handleWillDownload({ preventDefault: vi.fn() }, item as never, item.getWebContents() as never);
    const downloadId = events.find((event) => event.kind === "download.started")!.downloadId;

    item.resumable = false;
    item.finish("interrupted");
    expect(events.at(-1)).toMatchObject({
      kind: "download.failed",
      downloadId,
      failureKind: "unknown",
      resumable: false,
    });
    // 不可续传时 retry 意图无事发生(端口无权改写 AMF 的重试策略)
    port.applyIntent(downloadId, "retry");
    expect(item.resumed).toBe(false);
  });

  it("abandons the partial file and rebinds the next same-url item with attempt+1", () => {
    const port = createPort();
    const item = new FakeDownloadItem("https://booth.pm/download/5");
    port.handleWillDownload({ preventDefault: vi.fn() }, item as never, item.getWebContents() as never);
    const started = events.find((event) => event.kind === "download.started")!;
    writeFileSync(started.storedPath!, "partial bytes");

    // retry 全新 attempt:弃件 + 经 downloadURL 重发起(session 桩捕获)
    port.applyIntent(started.downloadId, "retry");
    expect(item.cancelled).toBe(true);
    expect(existsSync(started.storedPath!)).toBe(false);
    expect(downloadURLs).toEqual(["https://booth.pm/download/5"]);

    // 同 URL 重发起:新 item 重绑原 downloadId,attempt 递增
    const second = new FakeDownloadItem("https://booth.pm/download/5");
    port.handleWillDownload({ preventDefault: vi.fn() }, second as never, second.getWebContents() as never);
    const restarted = events.filter((event) => event.kind === "download.started").at(-1)!;
    expect(restarted.downloadId).toBe(started.downloadId);
    expect(restarted.attempt).toBe(2);
  });

  it("disambiguates same-name staging files per download", () => {
    const port = createPort();
    const first = new FakeDownloadItem("https://booth.pm/download/6");
    port.handleWillDownload({ preventDefault: vi.fn() }, first as never, first.getWebContents() as never);
    const firstPath = events.find((event) => event.kind === "download.started")!.storedPath!;
    // Electron 在落盘时立即创建部分文件——模拟之,第二个同名下载才需要消歧
    writeFileSync(firstPath!, "partial bytes");

    const second = new FakeDownloadItem("https://booth.pm/download/7");
    port.handleWillDownload({ preventDefault: vi.fn() }, second as never, second.getWebContents() as never);
    const secondPath = events.filter((event) => event.kind === "download.started").at(-1)!.storedPath!;

    expect(firstPath).not.toBe(secondPath);
    expect(firstPath.endsWith("closet.unitypackage")).toBe(true);
    // 消歧名 = 原名 + downloadId 短码 + 扩展名
    expect(secondPath).toMatch(/closet-[0-9a-f]{6}\.unitypackage$/);
    expect(secondPath).not.toBe(firstPath);
  });

  it("throttles progress events by interval", () => {
    vi.useFakeTimers();
    try {
      const port = createPort();
      const item = new FakeDownloadItem("https://booth.pm/download/8");
      port.handleWillDownload({ preventDefault: vi.fn() }, item as never, item.getWebContents() as never);
      item.tick(100);
      item.tick(200);
      expect(events.filter((event) => event.kind === "download.progress")).toHaveLength(1);
      vi.advanceTimersByTime(300);
      item.tick(300);
      expect(events.filter((event) => event.kind === "download.progress")).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
