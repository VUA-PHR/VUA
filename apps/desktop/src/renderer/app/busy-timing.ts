import { useEffect, useRef, useState } from "react";

/**
 * 忙碌指示与进度的诚实呈现(借鉴 Comfy-Desktop:uiTiming.ts 的
 * 700ms 最小忙碌 + progressStore 的单调地板):
 * - 亚帧完成的 IPC 若立刻撤掉忙碌指示,读起来像"没点中"——至少挂 700ms;
 * - 快照乱序/重算导致的进度回退不显示(monotonicDone 取历史最大);
 * - 本模块只处理"显示节奏",不虚构进度:不确定阶段停在起点不注水,
 *   由各数据源自身保证(不在此注水)。
 */

/** 最小忙碌展示时长 */
export const MIN_BUSY_MS = 700;

/** 单调进度地板:进度只进不退;首值(previous 为 null)取当前值 */
export function monotonicDone(previous: number | null, next: number): number {
  return previous === null ? next : Math.max(previous, next);
}

/** 忙碌可见性(纯函数):开始即可见;结束后距开始不足 minMs 仍可见(补满最小窗) */
export function busyVisible(args: {
  readonly startedAt: number | null;
  readonly endedAt: number | null;
  readonly now: number;
  readonly minMs?: number;
}): boolean {
  const { startedAt, endedAt, now } = args;
  if (startedAt === null) return false;
  const minMs = args.minMs ?? MIN_BUSY_MS;
  if (endedAt === null) return true;
  return now - startedAt < minMs;
}

/**
 * 最小忙碌值 hook:输入(如加载中的条目 id)变非 null 即开始计时并直通输出;
 * 变 null 时若不足 MIN_BUSY_MS 则保持最后一个非 null 值,补满后才输出 null。
 * 连续切换非 null 值视为同一段忙碌(计时不重置)。
 */
export function useMinBusyValue<T>(value: T | null): T | null {
  const [shown, setShown] = useState<T | null>(value);
  const startedAtRef = useRef<number | null>(value !== null ? Date.now() : null);

  useEffect(() => {
    if (value !== null) {
      if (startedAtRef.current === null) startedAtRef.current = Date.now();
      setShown(value);
      return;
    }
    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    if (startedAt === null) {
      setShown(null);
      return;
    }
    const elapsed = Date.now() - startedAt;
    if (elapsed >= MIN_BUSY_MS) {
      setShown(null);
      return;
    }
    const timer = window.setTimeout(() => setShown(null), MIN_BUSY_MS - elapsed);
    return () => window.clearTimeout(timer);
  }, [value]);

  return shown;
}
