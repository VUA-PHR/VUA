import { strings, termLabel } from "../i18n/index.ts";
import type { LogEntry, StageNode, StageState, WorkshopView } from "../features/workshop/track-model.ts";
import { stageConclusion } from "../features/workshop/track-model.ts";
import type { ProductionRunView } from "./model-production-port.ts";
import type { AppErrorV01 } from "@vua/contracts";

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

/**
 * 线上 messageKey → 本地化错误文案(errors.* 家族嵌套查表)。
 * 无词面(词表外 messageKey / 家族中途断链 / 空词)= null——调用方
 * 原样呈现 code 原词,不猜测语义(诚实纪律#2:失败呈现为失败且带原因)。
 */
export function errorCopyFor(messageKey: string): string | null {
  if (!messageKey.startsWith("errors.")) return null;
  let node: unknown = strings.errors;
  for (const segment of messageKey.slice("errors.".length).split(".")) {
    if (typeof node !== "object" || node === null) return null;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" && node.length > 0 ? node : null;
}

/**
 * 失败行词面(诚实纪律#2;W25 真机呈现缺口修复,第 142 批;148 批反向
 * 审查订正并呈律):基础阶段词面 + 错误详情。详情两事实并呈——
 * messageKey 命中词表 = 本地化词面 + code 原词(半角括号,diagnostics.
 * statusWithCode 同构),未命中 = 仅 code 原词;error 缺席 = 仅基础词面
 * (不猜测不虚构详情)。
 *
 * 并呈律依据(引擎 wire 面实证,2026-09-21 反向审查):素材任务 Failed
 * 的 messageKey 恒为 errors.material.executionFailed,与 code 无关
 * (provider_host.rs 物料失败映射 + material_task.rs:104;rollback 失败
 * 亦折同一词面)——若命中即只呈词面,供给失败(vua.material.provision_
 * failed)/桥接失败(bridge_failed)等各异失败将以同一句「执行失败」呈现
 * 且精确原因(code 原词)被遮蔽,预留的 errors.material.provisionFailed
 * 词面也永不命中。code 原词是契约事实,任何命中都不再隐没它。
 */
export function failureLogText(base: string, error: AppErrorV01 | null): string {
  if (error === null) return base;
  const localized = errorCopyFor(error.messageKey);
  const detail = localized === null ? error.code : `${localized} (${error.code})`;
  return `${base}:${detail}`;
}
