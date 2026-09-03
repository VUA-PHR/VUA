/**
 * 性能采样入口(G2-A):为 Recipe 100 节点图谱等后续重交互页面预留探针。
 *
 * 本阶段只提供稳定 API 与 dev 浮层数据源,不接业务页面——G9 实现图谱时
 * 在关键路径埋 perfMark/perfMeasure,验收用本模块的数据说话,而不是事后
 * 补探针。
 *
 * 无 user-facing 文案(浮层文案在 i18n 表 dev.perfProbe);浏览器/node 环境
 * 差异全部静默降级,探针永远不能让业务代码崩溃。
 */

export interface LongTaskSample {
  /** performance.now() 时间轴上的起点(ms) */
  startTime: number;
  duration: number;
}

export interface MeasureSample {
  name: string;
  duration: number;
  /** 采样发生时刻(performance.now()) */
  at: number;
}

const MAX_SAMPLES = 20;

const longTasks: LongTaskSample[] = [];
const measures: MeasureSample[] = [];
const listeners = new Set<() => void>();

function pushCapped<T>(buffer: T[], item: T): void {
  buffer.push(item);
  if (buffer.length > MAX_SAMPLES) buffer.splice(0, buffer.length - MAX_SAMPLES);
}

function notify(): void {
  for (const cb of listeners) cb();
}

let observerStarted = false;

/** 启动 longtask 观察(幂等;环境不支持 PerformanceObserver/longtask 时静默降级) */
export function ensureLongTaskObserver(): void {
  if (observerStarted || typeof PerformanceObserver === "undefined") return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        pushCapped(longTasks, { startTime: entry.startTime, duration: entry.duration });
      }
      notify();
    });
    observer.observe({ type: "longtask", buffered: true });
    observerStarted = true;
  } catch {
    /* longtask 不受支持(如 Firefox/node)时仅长任务为空,mark/measure 仍可用 */
  }
}

export function perfMark(markName: string): void {
  if (typeof performance === "undefined") return;
  performance.mark(markName);
}

/** 测量两个 mark 之间耗时并记录采样;失败(mark 缺失等)返回 null */
export function perfMeasure(measureName: string, startMark: string, endMark?: string): number | null {
  if (typeof performance === "undefined") return null;
  try {
    const entry = performance.measure(measureName, startMark, endMark);
    pushCapped(measures, { name: measureName, duration: entry.duration, at: performance.now() });
    notify();
    return entry.duration;
  } catch {
    return null;
  }
}

export function longTaskCount(): number {
  return longTasks.length;
}

export function recentLongTasks(): readonly LongTaskSample[] {
  return longTasks;
}

export function recentMeasures(): readonly MeasureSample[] {
  return measures;
}

/** 订阅新采样(长任务或测量),返回退订函数;供 dev 浮层刷新 */
export function subscribePerfSamples(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
