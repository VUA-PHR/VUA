/**
 * Overlay 演示端口(切片五 F7a;v2 随 017 表面批 1 契约对齐,仅 DEV 构建可达)。
 *
 * 加载守卫在 ../overlay-port-instance.ts(import.meta.env.DEV 折叠 + 动态
 * import,与 main.tsx 的 PreviewLabPage 同模式):生产构建中本模块不可达,
 * chunk 不产出,check-leak 以 fixture 文案指纹把守。
 *
 * 演示内容(v2 快照形状):两张任务卡(running 慢速定时器推进 → succeeded,
 * queued 保持等待,展示"快照驱动"的订阅刷新)+ 生产状态卡(plan 摘要＋
 * 最近记录摘要,批 1 投影范围;环境摘要属批 2,不演示)。dispatch 最小
 * 状态机:
 * - request_cancel_task(带 taskId):目标卡迁到 cancelled(取消是请求语义,
 *   这里演示"应用层接受请求"后的快照迁移);
 * - dismiss:快照回到与诚实缺席同形的空态;
 * - open_on_desktop:ok,快照不变(桌面落点行为属壳层,不在本端口演示)。
 *
 * 模块不得有顶层副作用(与 tutorial-overlay-dev.ts 同一纪律):定时器在
 * createDemoOverlayPort() 内启动,推进到尾声或会话结束后自行停止。
 */
import type { OverlaySnapshot } from "../overlay-contract.ts";
import type { OverlaySurfacePort } from "../overlay-port.ts";

/** 慢速推进节奏:让双表面预览能观察到快照广播(非真实耗时语义) */
const PROGRESS_TICK_MS = 4000;

/** 演示偏好:reduced-motion 跟随系统(壳侧呈现事实,与 live 端口同源) */
function demoPresentation() {
  return {
    locale: "zh-CN",
    textScale: 1,
    reducedMotion:
      typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

function buildInitialSnapshot(): OverlaySnapshot {
  return {
    schemaVersion: 2,
    availability: "available",
    presentation: demoPresentation(),
    tasks: [
      {
        taskId: "demo-assembly-1",
        state: "running",
        correlationId: "demo-correlation-1",
      },
      {
        taskId: "demo-download-2",
        state: "queued",
        correlationId: "demo-correlation-2",
      },
    ],
    productionCard: {
      currentPlan: {
        planId: "plan-demo0000000001",
        planStatus: "approved",
        createdAt: "2026-09-13T00:00:00.000Z",
        recipeId: "recipe-demo00000001",
      },
      latestRecord: {
        buildId: "record-demo00000001",
        planId: "plan-demo0000000001",
        status: "succeeded",
        finishedAt: "2026-09-13T00:05:00.000Z",
      },
    },
  };
}

export function createDemoOverlayPort(): OverlaySurfacePort {
  let snapshot = buildInitialSnapshot();
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<(snapshot: OverlaySnapshot) => void>();

  const stopTimer = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const commit = (next: OverlaySnapshot) => {
    snapshot = next;
    for (const listener of listeners) listener(snapshot);
  };

  /** 演示推进:running 卡在若干 tick 后迁到 succeeded(展示状态事实变化),
   *  随后停表;取消后若无运行中卡亦停表 */
  const ticks: Record<string, number> = {};
  const tick = () => {
    const running = snapshot.availability === "available"
      ? snapshot.tasks.find((card) => card.state === "running")
      : undefined;
    if (running === undefined) {
      stopTimer();
      return;
    }
    const done = (ticks[running.taskId] ?? 0) + 1;
    ticks[running.taskId] = done;
    if (done >= 3) {
      commit({
        ...(snapshot as Extract<OverlaySnapshot, { availability: "available" }>),
        tasks: (snapshot as Extract<OverlaySnapshot, { availability: "available" }>).tasks.map(
          (card) => (card.taskId === running.taskId ? { ...card, state: "succeeded" } : card),
        ),
      });
      stopTimer();
    }
  };

  timer = setInterval(tick, PROGRESS_TICK_MS);

  return {
    snapshot: () => Promise.resolve(snapshot),
    subscribe: (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    dispatch: (action, payload) => {
      if (action === "open_on_desktop") {
        return Promise.resolve({ kind: "ok" as const, snapshot });
      }
      if (action === "request_cancel_task") {
        const taskId = payload?.taskId;
        const available = snapshot as Extract<OverlaySnapshot, { availability: "available" }>;
        if (
          snapshot.availability !== "available"
          || typeof taskId !== "string"
          || !available.tasks.some((card) => card.taskId === taskId)
        ) {
          return Promise.resolve({
            kind: "rejected" as const,
            reason: "action_not_allowed" as const,
            snapshot,
          });
        }
        stopTimer();
        commit({
          ...available,
          tasks: available.tasks.map((card) => (
            card.taskId === taskId ? { ...card, state: "cancelled" } : card
          )),
        });
        return Promise.resolve({ kind: "ok" as const, snapshot });
      }
      // dismiss:回到诚实缺席同形空态
      stopTimer();
      commit({
        schemaVersion: 2,
        availability: "unavailable",
        presentation: demoPresentation(),
      });
      return Promise.resolve({ kind: "ok" as const, snapshot });
    },
  };
}
