/**
 * 工厂车间轨道表现模型(美术方案 v0.3.3 §7)。
 * 轨道只连接 Assembly → Production → Inspection;
 * Warehouse / Recipe 是"进料口"端点,Release 是"出货口"端点(§7.1)。
 */

export type StageId =
  | "warehouse"
  | "recipe"
  | "assembly"
  | "production"
  | "inspection"
  | "release";

export type StageState = "completed" | "current" | "pending" | "needsConfirmation" | "blocked";

export interface StageNode {
  id: StageId;
  label: string;
  state: StageState;
}

export const stageOrder: readonly StageId[] = [
  "warehouse",
  "recipe",
  "assembly",
  "production",
  "inspection",
  "release",
];

/** 装配轨道覆盖的阶段(§7.1:仅中间三项连成轨道) */
export const trackStages: readonly StageId[] = ["assembly", "production", "inspection"];

export function isTrackStage(id: StageId): boolean {
  return trackStages.includes(id);
}

/**
 * 轨道段语法(§7.1 / 附表,AMF 辖区品牌橙):
 * - confirmed:橙色实线,已确认的安全路径;
 * - flowing:橙色流光,正在执行的任务;
 * - planned:灰色虚线,尚未执行的计划。
 */
export type SegmentKind = "confirmed" | "flowing" | "planned";

/** 由左端阶段状态推导通向右侧阶段的轨道段样式 */
export function segmentAfter(state: StageState): SegmentKind {
  if (state === "completed") return "confirmed";
  if (state === "current") return "flowing";
  return "planned";
}

/** 执行日志条目(由真实工作流事件驱动,§7.2) */
export interface LogEntry {
  time: string;
  text: string;
}

/* ---- 录制事件流回放(C-WORKSHOP) ---- */

/**
 * 录制事件(回放带):轨道与日志的唯一驱动源——节点点亮、日志追加、
 * 劳动计数全部来自事件,不渲染无事件支撑的状态(原则①)。
 * at 为相对回放起点的毫秒偏移;events 必须按 at 升序。
 */
export type WorkshopTapeEvent =
  | { readonly at: number; readonly kind: "stage"; readonly stage: StageId; readonly state: StageState }
  | { readonly at: number; readonly kind: "log"; readonly text: string }
  /** 可由日志核实的自动操作数增量(§7.2 劳动可视化;只累计,不估算工时) */
  | { readonly at: number; readonly kind: "stat"; readonly operations: number };

/** 回放带(版本化;真实事件流接入后由适配器产出同一形态) */
export interface WorkshopTape {
  readonly schemaVersion: 1;
  readonly durationMs: number;
  readonly events: readonly WorkshopTapeEvent[];
}

/**
 * 车间页面视图:idle 表示生产流程尚未接入或没有可展示的任务,
 * 此时必须呈现诚实的空状态,不得渲染虚构轨道与日志。
 * running 为实时事件流视图;replay 为录制事件流回放(C-WORKSHOP),
 * 轨道状态由回放带驱动,回放内容必须带"演示数据"标识。
 */
export type WorkshopView =
  | { kind: "idle" }
  | { kind: "running"; headline: string; stages: StageNode[]; log: LogEntry[] }
  | { kind: "replay"; headline: string; tape: WorkshopTape };

/**
 * 车间状态结论(§7.3):不使用红绿灯语义——进行中/完成为橙色系,
 * 检查点确认为琥珀,仅阻断用红。
 * kind 同时作为 strings.workshop.conclusion 的文案 key 与
 * CSS data-kind(图标与颜色由表现层按 kind 映射)。
 */
export type WorkshopConclusionKind =
  | "running"
  | "needsConfirmation"
  | "blocked"
  | "completed"
  | "notStarted";

export interface WorkshopConclusion {
  kind: WorkshopConclusionKind;
}

/**
 * 由阶段集合推导整体结论,优先级:阻断 > 待确认 > 进行中 > 已完成 > 未开始。
 * "已完成"要求至少一个阶段且全部为 completed:全 pending(计划未执行)
 * 或空列表一律回落 notStarted,不得虚构完成结论(原则①)。
 */
export function stageConclusion(stages: readonly StageNode[]): WorkshopConclusion {
  if (stages.some((s) => s.state === "blocked")) return { kind: "blocked" };
  if (stages.some((s) => s.state === "needsConfirmation")) return { kind: "needsConfirmation" };
  if (stages.some((s) => s.state === "current")) return { kind: "running" };
  if (stages.length > 0 && stages.every((s) => s.state === "completed")) {
    return { kind: "completed" };
  }
  return { kind: "notStarted" };
}
