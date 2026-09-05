/**
 * Overlay 演示端口(切片五 F7a,仅 DEV 构建可达)。
 *
 * 加载守卫在 ../overlay-port-instance.ts(import.meta.env.DEV 折叠 + 动态
 * import,与 main.tsx 的 PreviewLabPage 同模式):生产构建中本模块不可达,
 * chunk 不产出,check-leak 以 fixture 文案指纹把守。
 *
 * 演示内容:进行中的装配任务(慢速定时器推进 3/6 → … → 6/6,展示"快照驱动"
 * 的订阅刷新)+ SteamVR/Unity 等环境摘要 + 全量 allowedActions。
 * dispatch 最小状态机:
 * - request_cancel_task:任务取消(任务卡消失,状态转为取消说明;取消是请求
 *   语义,这里演示"应用层接受请求"后的快照迁移);
 * - dismiss:会话结束(快照回到与未接入占位同形的 inactive 空态);
 * - open_on_desktop:ok,快照不变(桌面落点行为属壳层,不在本端口演示)。
 *
 * 模块不得有顶层副作用(与 tutorial-overlay-dev.ts 同一纪律):定时器在
 * createDemoOverlayPort() 内启动,推进到尾声或会话结束后自行停止。
 */
import { fixtureStrings } from "../../../i18n/strings.fixtures.zh-CN.ts";
import type { OverlaySnapshot } from "../overlay-contract.ts";
import type { OverlaySurfacePort, Unsubscribe } from "../overlay-port.ts";

/** 慢速推进节奏:让双表面预览能观察到快照广播(非真实耗时语义) */
const PROGRESS_TICK_MS = 4000;
const PROGRESS_TOTAL = 6;

const copy = fixtureStrings.overlay;

function buildInitialSnapshot(): OverlaySnapshot {
  return {
    schemaVersion: 1,
    revision: 1,
    presentation: {
      locale: "zh-CN",
      textScale: 1,
      reducedMotion:
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    status: { tone: "active", title: copy.statusTitle, detail: copy.statusDetail },
    task: {
      title: fixtureStrings.tasks.assembly.title,
      stage: "execute",
      progress: { done: 3, total: PROGRESS_TOTAL },
      cancellable: true,
    },
    environment: [
      { id: "steamvr", state: "running" },
      { id: "unity", state: "ready" },
      { id: "vrchat", state: "running" },
      { id: "vpm", state: "ready" },
    ],
    allowedActions: ["open_on_desktop", "dismiss", "request_cancel_task"],
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

  /** 进度推进:3/6 → … → 6/6 后进入 validate 阶段(无真实总量,progress 置 null
      而非注水),随后停表;cancel/dismiss 亦停表 */
  const tick = () => {
    const task = snapshot.task;
    if (task === null || task.progress === null) {
      stopTimer();
      return;
    }
    const done = task.progress.done + 1;
    if (done >= task.progress.total) {
      commit({
        ...snapshot,
        revision: snapshot.revision + 1,
        task: { ...task, stage: "validate", progress: null },
      });
      stopTimer();
      return;
    }
    commit({
      ...snapshot,
      revision: snapshot.revision + 1,
      task: { ...task, progress: { done, total: task.progress.total } },
    });
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
    dispatch: (action) => {
      if (!snapshot.allowedActions.includes(action)) {
        return Promise.resolve({
          kind: "rejected" as const,
          reason: "action_not_allowed" as const,
          snapshot,
        });
      }
      if (action === "open_on_desktop") {
        return Promise.resolve({ kind: "ok" as const, snapshot });
      }
      if (action === "request_cancel_task") {
        const task = snapshot.task;
        if (task === null || !task.cancellable) {
          return Promise.resolve({
            kind: "rejected" as const,
            reason: "action_not_allowed" as const,
            snapshot,
          });
        }
        stopTimer();
        commit({
          ...snapshot,
          revision: snapshot.revision + 1,
          status: { tone: "inactive", title: copy.cancelledTitle, detail: copy.cancelledDetail },
          task: null,
          allowedActions: ["open_on_desktop", "dismiss"],
        });
        return Promise.resolve({ kind: "ok" as const, snapshot });
      }
      // dismiss:会话结束,回到 inactive 空态(与未接入占位同形)
      stopTimer();
      commit({
        ...snapshot,
        revision: snapshot.revision + 1,
        status: { tone: "inactive", title: "" },
        task: null,
        environment: [],
        allowedActions: [],
      });
      return Promise.resolve({ kind: "ok" as const, snapshot });
    },
  };
}
