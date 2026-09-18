import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDownloadEventSink,
  type DownloadIngestInvoke,
} from "./download-ingest.js";
import type { DownloadEventV01 } from "@vua/contracts";

/**
 * 下载事件投递泵单元测试(F4-3/F4-4,自 main.ts 抽出):批量冲刷阈值/间隔、
 * at-least-once 回灌、失败后**自主退避重试**(回归:旧实现失败后仅靠新事件
 * 触发重冲,provider 短暂不可达+无新下载时缓冲无限期滞留)、退避封顶与
 * 成功归零、死信留痕不毒化整批、缓冲上限丢最旧、dispose 丢弃。
 */

function event(downloadId: string, attempt = 1): DownloadEventV01 {
  const base = {
    schemaVersion: "0.1" as const,
    occurredAt: "2026-09-18T00:00:00.000Z",
    downloadId,
    attempt,
    sourceUrl: "https://booth.pm/items/x",
    initiatedFromPageUrl: null,
    urlChain: null,
    suggestedFileName: "item.zip",
    expectedBytes: 10,
    receivedBytes: null,
    resumable: false,
    failureKind: null,
  };
  return { kind: "download.started", ...base };
}

function isEvent(value: unknown): value is DownloadEventV01 {
  return typeof value === "object" && value !== null && "downloadId" in value;
}

describe("createDownloadEventSink", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes on the interval and delivers the batch with schemaVersion 0.1", async () => {
    const invoke = vi.fn<DownloadIngestInvoke>().mockResolvedValue({ ok: true, value: { rejected: [] } });
    const sink = createDownloadEventSink({ invoke });
    sink.emit(event("dl-1"));
    sink.emit(event("dl-2"));
    expect(invoke).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(invoke).toHaveBeenCalledTimes(1);
    const params = invoke.mock.calls[0]![0];
    expect(params.schemaVersion).toBe("0.1");
    expect(params.events.filter(isEvent)).toHaveLength(2);
    sink.dispose();
  });

  it("flushes immediately once the threshold is reached", async () => {
    const invoke = vi.fn<DownloadIngestInvoke>().mockResolvedValue({ ok: true, value: { rejected: [] } });
    const sink = createDownloadEventSink({ invoke });
    for (let index = 0; index < 20; index += 1) {
      sink.emit(event(`dl-${index}`));
    }
    await vi.advanceTimersByTimeAsync(0);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls[0]![0].events).toHaveLength(20);
    sink.dispose();
  });

  it("re-buffers on failure and retries on its own without new events (regression)", async () => {
    const invoke = vi.fn<DownloadIngestInvoke>().mockRejectedValueOnce(new Error("provider down"));
    const logs: string[] = [];
    const sink = createDownloadEventSink({ invoke, log: (line) => logs.push(line) });
    sink.emit(event("dl-retry"));

    await vi.advanceTimersByTimeAsync(1_000);
    expect(invoke).toHaveBeenCalledTimes(1);
    // 旧缺陷:这里之后没有任何新事件,缓冲将无限期滞留。现在 1s 退避后必须自主重试。
    await vi.advanceTimersByTimeAsync(1_000);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke.mock.calls[1]![0].events.filter(isEvent)).toHaveLength(1);
    expect(logs.some((line) => line.includes("ingestRetry"))).toBe(true);
    sink.dispose();
  });

  it("doubles the backoff per consecutive failure and resets after one success", async () => {
    let failures = 3;
    const invoke = vi.fn<DownloadIngestInvoke>(async () => {
      if (failures > 0) {
        failures -= 1;
        return Promise.reject(new Error("provider down"));
      }
      return { ok: true, value: { rejected: [] } };
    });
    const sink = createDownloadEventSink({ invoke });
    sink.emit(event("dl-backoff"));

    await vi.advanceTimersByTimeAsync(1_000); // 首次投递(失败)
    expect(invoke).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000); // 退避 1s 后第二次(失败)
    expect(invoke).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2_000); // 退避 2s 后第三次(失败)
    expect(invoke).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(3_999); // 退避 4s 未到
    expect(invoke).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1); // 4s 到点(成功)
    expect(invoke).toHaveBeenCalledTimes(4);
    // 成功后退避归零:再发一条失败事件,下次重试间隔回到 1s
    failures = 1;
    sink.emit(event("dl-backoff-2"));
    await vi.advanceTimersByTimeAsync(1_000); // 首次投递(失败)
    expect(invoke).toHaveBeenCalledTimes(5);
    await vi.advanceTimersByTimeAsync(2_000); // 若退避未归零这里会是 2s 间隔
    expect(invoke).toHaveBeenCalledTimes(6);
    sink.dispose();
  });

  it("caps the backoff at maxBackoffMs", async () => {
    const invoke = vi.fn<DownloadIngestInvoke>().mockRejectedValue(new Error("provider down"));
    const sink = createDownloadEventSink({ invoke, flushThreshold: 1, maxBackoffMs: 3_000 });
    sink.emit(event("dl-cap")); // 阈值 1:emit 即首次投递(失败,退避 1s)
    expect(invoke).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_000); // 第二次(失败,退避 2s)
    expect(invoke).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2_000); // 第三次(失败,退避 min(4s,3s)=3s 封顶)
    expect(invoke).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(2_999); // 封顶 3s 未到
    expect(invoke).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1); // 第四次(失败,退避维持 3s)
    expect(invoke).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(3_000); // 第五次
    expect(invoke).toHaveBeenCalledTimes(5);
    sink.dispose();
  });

  it("dead-letters rejected events without poisoning the batch", async () => {
    const invoke = vi
      .fn<DownloadIngestInvoke>()
      .mockResolvedValue({ ok: true, value: { rejected: [{ downloadId: "dl-bad", reason: "shape" }] } });
    const logs: string[] = [];
    const sink = createDownloadEventSink({ invoke, log: (line) => logs.push(line) });
    sink.emit(event("dl-good"));
    await vi.advanceTimersByTimeAsync(1_000);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(logs.some((line) => line.includes("deadLetter") && line.includes("dl-bad"))).toBe(true);
    // 死信不毒化:后续事件照常投递
    sink.emit(event("dl-good-2"));
    await vi.advanceTimersByTimeAsync(1_000);
    expect(invoke).toHaveBeenCalledTimes(2);
    sink.dispose();
  });

  it("drops the oldest events beyond the buffer cap", async () => {
    const invoke = vi.fn<DownloadIngestInvoke>().mockResolvedValue({ ok: true, value: { rejected: [] } });
    const sink = createDownloadEventSink({ invoke, bufferCap: 3 });
    for (let index = 0; index < 5; index += 1) {
      sink.emit(event(`dl-${index}`));
    }
    // 阈值 20 未到,由 1s 定时冲刷
    await vi.advanceTimersByTimeAsync(1_000);
    const delivered = invoke.mock.calls[0]![0].events.filter(isEvent);
    expect(delivered).toHaveLength(3);
    expect(delivered.map((item) => item.downloadId)).toEqual(["dl-2", "dl-3", "dl-4"]);
    sink.dispose();
  });

  it("dispose drops the buffer and cancels pending timers", async () => {
    const invoke = vi.fn<DownloadIngestInvoke>().mockResolvedValue({ ok: true, value: { rejected: [] } });
    const sink = createDownloadEventSink({ invoke });
    sink.emit(event("dl-drop"));
    sink.dispose();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(invoke).not.toHaveBeenCalled();
  });
});
