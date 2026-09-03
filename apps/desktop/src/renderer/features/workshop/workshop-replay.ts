import {
  stageOrder,
  type LogEntry,
  type StageId,
  type StageNode,
  type StageState,
  type WorkshopTape,
} from "./track-model.ts";

/**
 * 录制事件流回放模型(C-WORKSHOP,v0.4.0 §7.2):
 * tapeFrame 是纯函数——给定回放带与时刻,推导该时刻的轨道帧
 * (阶段状态/日志/可核实操作数),供播放时钟逐帧调用;
 * 不做 DOM 测量,不做副作用,播放/暂停/重播只是改变入参 tMs。
 */

/** 单帧视图:六阶段全量(未触发事件的阶段保持 pending)+ 截至时刻的日志与计数 */
export interface WorkshopFrame {
  readonly stages: StageNode[];
  readonly log: LogEntry[];
  /** 可由日志核实的自动操作累计数(§7.2 劳动可视化;0 时 UI 不渲染该行) */
  readonly operations: number;
  /** 是否已播到带尾(播完后播放钟自停) */
  readonly done: boolean;
}

/** mm:ss(日志时间列与回放进度共用同一格式) */
export function formatTapeClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 推导 tMs 时刻的帧;events 按 at 升序,越界事件不可见 */
export function tapeFrame(
  tape: WorkshopTape,
  tMs: number,
  labelOf: (id: StageId) => string,
): WorkshopFrame {
  const states = new Map<StageId, StageState>();
  const log: LogEntry[] = [];
  let operations = 0;
  for (const event of tape.events) {
    if (event.at > tMs) break;
    if (event.kind === "stage") {
      states.set(event.stage, event.state);
    } else if (event.kind === "log") {
      log.push({ time: formatTapeClock(event.at), text: event.text });
    } else {
      operations += event.operations;
    }
  }
  const stages: StageNode[] = stageOrder.map((id) => ({
    id,
    label: labelOf(id),
    state: states.get(id) ?? "pending",
  }));
  return { stages, log, operations, done: tMs >= tape.durationMs };
}

/** 防御:事件必须按 at 升序(乱序带会让"回到过去"语义错误);供适配层与测试断言 */
export function tapeEventsSorted(tape: WorkshopTape): boolean {
  for (let i = 1; i < tape.events.length; i += 1) {
    const prev = tape.events[i - 1];
    const curr = tape.events[i];
    if (prev && curr && curr.at < prev.at) return false;
  }
  return true;
}

/**
 * 工位事件流(S-IX-1):回放带中某阶段的状态迁移序列,按 at 升序。
 * 纯函数,不截断——播放时刻过滤由调用方做(at <= positionMs),
 * 暂停/拖进度时同一序列反复切片即可。
 */
export function eventsForStage(
  tape: WorkshopTape,
  stage: StageId,
): Array<{ readonly at: number; readonly state: StageState }> {
  const result: Array<{ at: number; state: StageState }> = [];
  for (const event of tape.events) {
    if (event.kind === "stage" && event.stage === stage) {
      result.push({ at: event.at, state: event.state });
    }
  }
  return result;
}
