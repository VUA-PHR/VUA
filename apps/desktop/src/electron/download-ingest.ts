import type { DownloadEventV01, DownloadIngestReceiptV03 } from "@vua/contracts";

/**
 * 下载事件 → provider `download.ingest` 的投递泵（F4-3/F4-4，自 main.ts
 * 抽出以便测试）。投递语义 at-least-once：
 * - 批量冲刷：到达 `flushThreshold`(默认 20)条立即冲，否则 `flushIntervalMs`
 *   (默认 1s)定时冲；缓冲上限 `bufferCap`(默认 1000)超限丢最旧（回执裁剪
 *   ＋BDL 唯一键去重兜底，与原 main.ts 行为一致）；
 * - 失败重灌＋**自主重试驱动**：投递失败（invoke 抛错或 ok:false）整批回灌，
 *   并按指数退避（1s 起、×2、上限 `maxBackoffMs` 默认 30s）自主排定下一次
 *   冲刷——不依赖后续新事件到达（修复：provider 短暂不可达＋之后无新下载
 *   时，缓冲事件曾无限期滞留，BDL 永远收不到该批事实）；成功一次即归零
 *   退避；
 * - 单条非法事件死信（receipt.rejected）：诊断通道留痕，不毒化整批。
 * 全部依赖注入（invoke/log/时间参数），模块不 import Electron。
 */

export interface DownloadIngestInvokeResult {
  readonly ok: boolean;
  readonly value?: unknown;
}

export type DownloadIngestInvoke = (params: {
  readonly schemaVersion: "0.1";
  readonly events: readonly DownloadEventV01[];
}) => Promise<DownloadIngestInvokeResult>;

export interface DownloadEventSinkOptions {
  readonly invoke: DownloadIngestInvoke;
  /** 定时冲刷间隔（默认 1000ms） */
  readonly flushIntervalMs?: number;
  /** 立即冲刷阈值（默认 20 条） */
  readonly flushThreshold?: number;
  /** 缓冲上限，超限丢最旧（默认 1000 条） */
  readonly bufferCap?: number;
  /** 失败重试退避上限（默认 30_000ms；序列 1s→2s→4s→…→cap） */
  readonly maxBackoffMs?: number;
  /** 诊断通道（默认 stderr 单行 JSON；测试注入捕获） */
  readonly log?: (line: string) => void;
}

export interface DownloadEventSink {
  emit(event: DownloadEventV01): void;
  /** 丢弃待冲刷缓冲并取消定时器（窗口关闭路径） */
  dispose(): void;
}

interface QueuedEvent {
  readonly event: DownloadEventV01;
}

export function createDownloadEventSink(options: DownloadEventSinkOptions): DownloadEventSink {
  const flushIntervalMs = options.flushIntervalMs ?? 1_000;
  const flushThreshold = options.flushThreshold ?? 20;
  const bufferCap = options.bufferCap ?? 1_000;
  const maxBackoffMs = options.maxBackoffMs ?? 30_000;
  const log =
    options.log ?? ((line: string) => process.stderr.write(`${line}\n`));
  const buffer: QueuedEvent[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let consecutiveFailures = 0;
  let disposed = false;
  let flushing = false;

  const flushIngest = async (): Promise<void> => {
    if (flushing || buffer.length === 0) return;
    flushing = true;
    const batch = buffer.splice(0, buffer.length);
    try {
      const result = await options.invoke({
        schemaVersion: "0.1",
        events: batch.map((queued) => queued.event),
      });
      if (!result.ok) {
        throw new Error("download.ingest returned an application error");
      }
      const receipt = result.value as Partial<DownloadIngestReceiptV03> | undefined;
      for (const rejected of receipt?.rejected ?? []) {
        // 单条非法事件死信（不毒化整批）；诊断通道留痕
        log(JSON.stringify({ channel: "download-events", deadLetter: rejected }));
      }
      consecutiveFailures = 0;
    } catch (error) {
      // 投递失败:整批回灌,排定退避重试——不等新事件(at-least-once 自驱)
      buffer.unshift(...batch);
      if (buffer.length > bufferCap) buffer.splice(0, buffer.length - bufferCap);
      consecutiveFailures += 1;
      const backoff = Math.min(flushIntervalMs * 2 ** (consecutiveFailures - 1), maxBackoffMs);
      log(
        JSON.stringify({
          channel: "download-events",
          ingestRetry: String(error),
          attempt: consecutiveFailures,
          nextRetryMs: backoff,
        }),
      );
      scheduleFlush(backoff);
    } finally {
      flushing = false;
    }
  };

  const scheduleFlush = (delayMs: number): void => {
    if (flushTimer !== null || buffer.length === 0 || disposed) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushIngest();
    }, delayMs);
  };

  return {
    emit(event: DownloadEventV01): void {
      if (disposed) return;
      buffer.push({ event });
      if (buffer.length > bufferCap) buffer.splice(0, buffer.length - bufferCap);
      if (buffer.length >= flushThreshold) {
        if (flushTimer !== null) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        void flushIngest();
      } else {
        scheduleFlush(flushIntervalMs);
      }
    },
    dispose(): void {
      disposed = true;
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      buffer.splice(0, buffer.length);
    },
  };
}
