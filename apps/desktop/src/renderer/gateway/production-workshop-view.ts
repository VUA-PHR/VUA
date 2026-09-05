import { strings, termLabel } from "../i18n/index.ts";
import type { LogEntry, StageNode, StageState, WorkshopView } from "../features/workshop/track-model.ts";
import { stageConclusion } from "../features/workshop/track-model.ts";
import type { ProductionRunView } from "./model-production-port.ts";

/**
 * 运行视图 → 车间轨道视图的共享推导(F3):
 * fixture 演示与 live 端口使用同一份纯函数,保证两种数据源下轨道语义一致。
 * 推导只消费 ProductionRunView(运行态是任务生命周期的投影事实,原则①),
 * 不虚构进度;尚无运行时三工位全部未开始。
 */

/** 车间轨道联动:运行态 → 三工位状态(端点恒定;不触碰 TrackModel 行为) */
export function workshopStagesFor(run: ProductionRunView): StageNode[] {
  // 默认:尚无运行,三工位全部未开始(不虚构进度,原则①)
  let assembly: StageState = "pending";
  let production: StageState = "pending";
  let inspection: StageState = "pending";
  if (run.kind === "run") {
    // 进入运行后:inspect 是当前工位;其后装配恒为已完成
    assembly = run.runState === "inspect" ? "current" : "completed";
    if (run.cancelled) {
      assembly = "completed";
      production = "pending";
    } else {
      switch (run.runState) {
        case "inspect":
          break;
        case "plan":
          production = "current";
          break;
        case "await_confirmation":
        case "expired":
          production = "needsConfirmation";
          break;
        case "snapshot":
        case "execute":
        case "recover":
          production = "current";
          break;
        case "validate":
          production = "completed";
          inspection = "current";
          break;
        case "completed":
          production = "completed";
          inspection = "completed";
          break;
        case "failed":
        case "failed_recoverable":
          production = "blocked";
          break;
      }
    }
  }
  return [
    { id: "warehouse", label: termLabel("warehouse"), state: "completed" },
    { id: "recipe", label: termLabel("recipe"), state: "completed" },
    { id: "assembly", label: termLabel("assembly"), state: assembly },
    { id: "production", label: termLabel("production"), state: production },
    { id: "inspection", label: termLabel("inspection"), state: inspection },
    { id: "release", label: termLabel("release"), state: "pending" },
  ];
}

/**
 * live 车间视图:运行视图 + 观测到的阶段迁移日志 → WorkshopView。
 * 尚无运行时诚实 idle(不渲染虚构轨道);有运行时 headline 取自
 * 轨道结论文案(strings.workshop.conclusion,同一 key 驱动结论徽标),
 * 日志由端口从真实任务生命周期迁移追加,时间戳为契约原值(ISO)。
 */
export function liveWorkshopView(run: ProductionRunView, log: readonly LogEntry[]): WorkshopView {
  if (run.kind !== "run") return { kind: "idle" };
  const stages = workshopStagesFor(run);
  return {
    kind: "running",
    headline: strings.workshop.conclusion[stageConclusion(stages).kind],
    stages,
    log: [...log],
  };
}
