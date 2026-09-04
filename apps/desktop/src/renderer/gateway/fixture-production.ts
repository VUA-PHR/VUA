import { format, termLabel } from "../i18n/index.ts";
import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type { FixtureName } from "../app/resolve-scenario.ts";
import type { LogEntry, StageNode, StageState, WorkshopView } from "../features/workshop/track-model.ts";
import type { TaskItem } from "./task-port.ts";
import { taskStatusForWorkflow, type WorkflowRunState } from "./workflow.ts";
import { createSignal } from "./fixture-signal.ts";
import { fixtureRecipeGraph } from "./fixture-recipes.ts";
import { fixtureReleaseWall } from "./fixture-release.ts";
import type {
  BuildRecord,
  BuildRecordFacts,
  InspectionReport,
  MaterialRef,
  ModelProductionCapabilities,
  ModelProductionPort,
  ModelProductionView,
  ProductionIntentResult,
  ProductionPlan,
  ProductionRejectReason,
  ProductionRunView,
  RecoverDecision,
  SourceIntake,
} from "./model-production-port.ts";

/**
 * F3 生产纵向流程 fixture(仅 DEV 可达;production-use-case v0.1 草案
 * "模拟 Provider 必须能脚本化演示五种生命周期"在 renderer 侧的镜像)。
 *
 * 八个 production-* 场景共享同一段脚本化时间线,只改初始运行态与恢复结局:
 * 成功 / 取消 / 漂移(failed_recoverable)/ 超时(expired)/ 回滚(成功与失败)。
 * 每个生产命令经 ProductionTaskLink 创建/迁移标准任务(任务中心无需特判,
 * await_confirmation 投影为 waitingInput,带来源页回跳)。
 * 文案负载集中在 i18n/strings.fixtures.zh-CN.ts(check-leak 指纹自动覆盖)。
 */

/** fixture 任务联动句柄(fixture-gateway 装配时注入) */
export interface ProductionTaskLink {
  upsertTask(task: TaskItem): void;
  patchTask(taskId: string, patch: Partial<TaskItem>): void;
  /** 任务取消回调:fixture 生产流程据此把当前运行标记为已取消(取消纪律走查) */
  setCancelHandler(handler: ((taskId: string) => void) | null): void;
}

export interface FixtureProductionOptions {
  /** 时间线每步间隔(测试用小值) */
  settleMs?: number;
}

type RunView = Extract<ProductionRunView, { kind: "run" }>;

type ScenarioKey =
  | "inspect"
  | "plan"
  | "running"
  | "success"
  | "cancelled"
  | "drifted"
  | "expired"
  | "rollback";

const copy = fixtureStrings.production;

const notConnectedRun: ProductionRunView = { schemaVersion: 1, kind: "not-connected" };

/* ---- 演示负载构造 ---- */

function materialFor(intake: SourceIntake): MaterialRef {
  return intake === "unitypackage_direct"
    ? {
        materialId: "fixture-material-unitypackage",
        intake,
        displayName: copy.materials.unitypackageDirect,
      }
    : {
        materialId: "fixture-material-vpm",
        intake,
        displayName: copy.materials.localVpm,
      };
}

function inspectionFor(source: MaterialRef): InspectionReport {
  return {
    inspectionId: "fixture-inspection-1",
    source,
    findings: [
      {
        id: "f-compat",
        kind: "compat",
        summary: copy.inspection.findings.compat,
        recoverable: true,
        retryable: true,
      },
      {
        id: "f-missing",
        kind: "missing",
        summary: copy.inspection.findings.missing,
        recoverable: true,
        retryable: true,
      },
      {
        id: "f-conflict",
        kind: "conflict",
        summary: copy.inspection.findings.conflict,
        recoverable: true,
        retryable: false,
      },
    ],
    plannability: "needs_attention",
    inspectedAt: "2026-09-04T10:24:40+08:00",
  };
}

function planFor(inspectionId: string, revision: number): ProductionPlan {
  return {
    planId: "fixture-plan-1",
    revision,
    inspectionId,
    stages: [
      { id: "s-snapshot", stage: "snapshot", summary: copy.plan.stageSummaries.snapshot },
      { id: "s-execute", stage: "execute", summary: copy.plan.stageSummaries.execute },
      { id: "s-validate", stage: "validate", summary: copy.plan.stageSummaries.validate },
    ],
    risks: [...copy.plan.risks],
    estimatedDurationMs: 8 * 60_000,
    diffs: [
      { id: "d-added", kind: "added", summary: copy.plan.diffs.added },
      { id: "d-resolved", kind: "resolved", summary: copy.plan.diffs.resolved },
    ],
  };
}

function recordFor(
  status: BuildRecord["status"],
  facts: BuildRecordFacts,
  stages: BuildRecord["stages"],
): BuildRecord {
  return {
    recordId: "fixture-record-1",
    status,
    stages,
    facts,
    finishedAt: "2026-09-04T10:33:10+08:00",
  };
}

const completedRecord = (): BuildRecord =>
  recordFor("completed", copy.recordFacts.completed, ["snapshot", "execute", "validate"]);
const rolledBackRecord = (): BuildRecord =>
  recordFor("rolled_back", copy.recordFacts.rolledBack, ["snapshot", "execute", "recover"]);
const rollbackFailedRecord = (): BuildRecord =>
  recordFor("rollback_failed", copy.recordFacts.rollbackFailed, ["snapshot", "execute", "recover"]);

/* ---- 车间轨道联动:运行态 → 三工位状态(端点恒定;不触碰 TrackModel 行为) ---- */

function workshopStagesFor(run: ProductionRunView): StageNode[] {
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

function headlineFor(run: ProductionRunView): string {
  const stage = termLabel("production");
  if (run.kind !== "run") return format(copy.headlines.active, { stage });
  if (run.cancelled) return format(copy.headlines.cancelled, { stage });
  switch (run.runState) {
    case "completed":
      return format(copy.headlines.completed, { stage });
    case "failed":
    case "failed_recoverable":
      return format(copy.headlines.failed, { stage });
    case "expired":
      return format(copy.headlines.expired, { stage });
    default:
      return format(copy.headlines.active, { stage });
  }
}

/** 演示时钟:日志时间列是演示负载,不代表真实耗时 */
function logClock(index: number): string {
  const seconds = 5 + index * 7;
  return `11:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function isProductionFixture(name: FixtureName): boolean {
  return name.startsWith("production-");
}

/**
 * production-* 场景的模型生产端口;其余场景返回 null(由装配方回落到基础 fixture)。
 * 返回 null 时不得触碰任务联动句柄。
 */
export function createFixtureProduction(
  name: FixtureName,
  link: ProductionTaskLink,
  options: FixtureProductionOptions = {},
): ModelProductionPort | null {
  if (!isProductionFixture(name)) return null;
  const scenario = name.slice("production-".length) as ScenarioKey;
  const settleMs = options.settleMs ?? 1100;

  let counter = 0;
  const nextId = (prefix: string): string => `${prefix}-${(counter += 1)}`;

  const logs: LogEntry[] = [];
  const pushLog = (text: string): void => {
    logs.push({ time: logClock(logs.length), text });
  };

  /* ---- 初始运行态(八场景共享脚本,只改开局与恢复结局) ---- */

  const source = materialFor("unitypackage_direct");
  const inspection = inspectionFor(source);
  const planV1 = planFor(inspection.inspectionId, 1);

  const seedRun = (partial: Omit<RunView, "schemaVersion" | "kind">): RunView => ({
    schemaVersion: 1,
    kind: "run",
    ...partial,
  });

  let currentRun: ProductionRunView = notConnectedRun;
  switch (scenario) {
    case "inspect":
      // 从素材选择开始的全流程走查;尚无运行(诚实空态)
      break;
    case "plan":
      pushLog(copy.transitionLog.inspectDone);
      pushLog(copy.transitionLog.planDone);
      currentRun = seedRun({
        runId: "fixture-run-1",
        taskId: "fixture-task-plan-1",
        runState: "await_confirmation",
        cancelled: false,
        source,
        inspection,
        plan: planV1,
        buildRecord: null,
      });
      break;
    case "running":
      pushLog(copy.transitionLog.snapshotStarted);
      pushLog(copy.transitionLog.executeStarted);
      currentRun = seedRun({
        runId: "fixture-run-1",
        taskId: "fixture-task-execute-1",
        runState: "execute",
        cancelled: false,
        source,
        inspection,
        plan: planV1,
        buildRecord: null,
      });
      break;
    case "success":
      pushLog(copy.transitionLog.completed);
      currentRun = seedRun({
        runId: "fixture-run-1",
        taskId: "fixture-task-execute-1",
        runState: "completed",
        cancelled: false,
        source,
        inspection,
        plan: planV1,
        buildRecord: completedRecord(),
      });
      break;
    case "cancelled":
      pushLog(copy.transitionLog.cancelled);
      currentRun = seedRun({
        runId: "fixture-run-1",
        taskId: "fixture-task-execute-1",
        runState: "execute",
        cancelled: true,
        source,
        inspection,
        plan: planV1,
        buildRecord: null,
      });
      break;
    case "drifted":
    case "rollback":
      pushLog(copy.transitionLog.drifted);
      currentRun = seedRun({
        runId: "fixture-run-1",
        taskId: "fixture-task-execute-1",
        runState: "failed_recoverable",
        cancelled: false,
        source,
        inspection,
        plan: planV1,
        buildRecord: null,
      });
      break;
    case "expired":
      // 计划在确认后变化:revision 递增,旧确认失效(草案确认纪律)
      pushLog(copy.transitionLog.expired);
      currentRun = seedRun({
        runId: "fixture-run-1",
        taskId: "fixture-task-plan-1",
        runState: "expired",
        cancelled: false,
        source,
        inspection,
        plan: planFor(inspection.inspectionId, 2),
        buildRecord: null,
      });
      break;
  }

  const buildView = (): ModelProductionView => ({
    schemaVersion: 1,
    workshop: {
      kind: "running",
      headline: headlineFor(currentRun),
      stages: workshopStagesFor(currentRun),
      log: [...logs],
    },
    productionRun: currentRun,
  });

  const signal = createSignal<ModelProductionView>(buildView());
  const emit = (): void => {
    signal.set(buildView());
  };

  const timers: ReturnType<typeof setTimeout>[] = [];
  const after = (ms: number, fn: () => void): void => {
    timers.push(setTimeout(fn, ms));
  };

  /* ---- 任务联动 ---- */

  const upsertTask = (taskId: string, titleKey: keyof typeof copy.tasks, runState: WorkflowRunState): void => {
    link.upsertTask({
      id: taskId,
      title: copy.tasks[titleKey],
      status: taskStatusForWorkflow(runState),
      originPage: "workshop",
      cancellable: true,
    });
  };

  const moveTask = (taskId: string, runState: WorkflowRunState): void => {
    const status = taskStatusForWorkflow(runState);
    const terminal = status === "completed" || status === "failed" || status === "cancelled";
    link.patchTask(taskId, { status, cancellable: !terminal });
  };

  // 场景开局的任务种子(初始运行态对应一条当前任务;终态不可再取消)
  if (currentRun.kind === "run") {
    const initial = currentRun;
    const titleKey =
      initial.runState === "await_confirmation" || initial.runState === "expired"
        ? ("plan" as const)
        : ("execute" as const);
    upsertTask(initial.taskId, titleKey, initial.runState);
    const initialStatus = taskStatusForWorkflow(initial.runState);
    if (initial.cancelled) {
      link.patchTask(initial.taskId, { status: "cancelled", cancellable: false });
    } else if (
      initialStatus === "completed" ||
      initialStatus === "failed" ||
      initialStatus === "cancelled"
    ) {
      link.patchTask(initial.taskId, { cancellable: false });
    }
  }

  /** 时间线步骤守卫:运行被取代/取消后,过期定时器不再生效 */
  const alive = (taskId: string): boolean =>
    currentRun.kind === "run" && currentRun.taskId === taskId && !currentRun.cancelled;

  const patchRun = (patch: Partial<RunView>): void => {
    if (currentRun.kind !== "run") return;
    currentRun = { ...currentRun, ...patch };
    emit();
  };

  /** 执行链:snapshot → execute → validate → completed + Build Record */
  const runExecuteChain = (taskId: string): void => {
    patchRun({ runState: "snapshot", taskId });
    pushLog(copy.transitionLog.snapshotStarted);
    emit();
    after(settleMs, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "execute");
      patchRun({ runState: "execute" });
      pushLog(copy.transitionLog.executeStarted);
      emit();
    });
    after(settleMs * 2, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "validate");
      patchRun({ runState: "validate" });
      pushLog(copy.transitionLog.validateStarted);
      emit();
    });
    after(settleMs * 3, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "completed");
      patchRun({ runState: "completed", buildRecord: completedRecord() });
      pushLog(copy.transitionLog.completed);
      emit();
    });
  };

  // 取消纪律走查:任务中心取消当前生产命令 → 运行标记已取消(安全边界演示:
  // fixture 立即结案,真实实现由应用层在安全边界结束后推送)
  link.setCancelHandler((taskId) => {
    if (currentRun.kind !== "run" || currentRun.taskId !== taskId || currentRun.cancelled) return;
    currentRun = { ...currentRun, cancelled: true };
    pushLog(copy.transitionLog.cancelled);
    emit();
  });

  // running 场景:开局即把执行链跑完
  if (currentRun.kind === "run" && scenario === "running") {
    const taskId = currentRun.taskId;
    after(settleMs, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "validate");
      patchRun({ runState: "validate" });
      pushLog(copy.transitionLog.validateStarted);
      emit();
    });
    after(settleMs * 2, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "completed");
      patchRun({ runState: "completed", buildRecord: completedRecord() });
      pushLog(copy.transitionLog.completed);
      emit();
    });
  }

  /* ---- 端口方法 ---- */

  const rejected = (reason: ProductionRejectReason): ProductionIntentResult => ({
    kind: "rejected",
    reason,
    run: currentRun,
  });

  const startInspection = (material: MaterialRef): ProductionIntentResult => {
    const runId = nextId("fixture-run");
    const taskId = nextId("fixture-task-inspect");
    upsertTask(taskId, "inspect", "inspect");
    pushLog(copy.transitionLog.inspectStarted);
    currentRun = seedRun({
      runId,
      taskId,
      runState: "inspect",
      cancelled: false,
      source: material,
      inspection: null,
      plan: null,
      buildRecord: null,
    });
    emit();
    after(settleMs, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "completed");
      patchRun({ inspection: inspectionFor(material) });
      pushLog(copy.transitionLog.inspectDone);
      emit();
    });
    return { kind: "ok", taskId, run: currentRun };
  };

  const requestPlan = (inspectionId: string): ProductionIntentResult => {
    if (currentRun.kind !== "run" || currentRun.inspection?.inspectionId !== inspectionId) {
      return rejected("unknown_ref");
    }
    if (currentRun.runState !== "inspect") return rejected("invalid_state");
    const taskId = nextId("fixture-task-plan");
    upsertTask(taskId, "plan", "plan");
    patchRun({ runState: "plan", taskId });
    pushLog(copy.transitionLog.planStarted);
    emit();
    after(settleMs, () => {
      if (!alive(taskId)) return;
      moveTask(taskId, "await_confirmation");
      patchRun({ runState: "await_confirmation", plan: planFor(inspectionId, 1) });
      pushLog(copy.transitionLog.planDone);
      emit();
    });
    return { kind: "ok", taskId, run: currentRun };
  };

  const confirmPlan = (planId: string, revision: number): ProductionIntentResult => {
    if (currentRun.kind !== "run" || currentRun.plan?.planId !== planId) {
      return rejected("unknown_ref");
    }
    if (currentRun.plan.revision !== revision) return rejected("stale_revision");
    if (currentRun.runState !== "await_confirmation") return rejected("invalid_state");
    moveTask(currentRun.taskId, "completed");
    const taskId = nextId("fixture-task-execute");
    upsertTask(taskId, "execute", "snapshot");
    runExecuteChain(taskId);
    return { kind: "ok", taskId, run: currentRun };
  };

  const recover = (taskId: string, decision: RecoverDecision): ProductionIntentResult => {
    if (currentRun.kind !== "run" || currentRun.taskId !== taskId) return rejected("unknown_ref");
    const state = currentRun.runState;
    if (state !== "failed_recoverable" && state !== "expired") return rejected("not_recoverable");
    // 旧任务已是终态(failed/cancelled 投影),保持历史不改写;恢复创建新任务
    const recoverTaskId = nextId("fixture-task-recover");
    pushLog(copy.transitionLog.recoverStarted);

    if (decision.kind === "continue") {
      if (state === "expired") {
        // 超时(确认失效):回到计划审阅重新确认;恢复任务转入等待输入
        upsertTask(recoverTaskId, "recover", "recover");
        moveTask(recoverTaskId, "await_confirmation");
        patchRun({ runState: "await_confirmation", taskId: recoverTaskId });
        pushLog(copy.transitionLog.expiredBack);
        emit();
        return { kind: "ok", taskId: recoverTaskId, run: currentRun };
      }
      // 漂移:从最近安全点继续执行剩余阶段
      upsertTask(recoverTaskId, "recover", "execute");
      patchRun({ runState: "execute", taskId: recoverTaskId });
      pushLog(copy.transitionLog.continueRerun);
      emit();
      after(settleMs, () => {
        if (!alive(recoverTaskId)) return;
        moveTask(recoverTaskId, "validate");
        patchRun({ runState: "validate" });
        pushLog(copy.transitionLog.validateStarted);
        emit();
      });
      after(settleMs * 2, () => {
        if (!alive(recoverTaskId)) return;
        moveTask(recoverTaskId, "completed");
        patchRun({ runState: "completed", buildRecord: completedRecord() });
        pushLog(copy.transitionLog.completed);
        emit();
      });
      return { kind: "ok", taskId: recoverTaskId, run: currentRun };
    }

    // 回滚:recover → 回滚成功(rolled_back)或失败(rollback_failed,drifted 场景)
    upsertTask(recoverTaskId, "recover", "recover");
    patchRun({ runState: "recover", taskId: recoverTaskId });
    emit();
    const rollbackSucceeds = scenario !== "drifted";
    after(settleMs, () => {
      if (!alive(recoverTaskId)) return;
      if (rollbackSucceeds) {
        moveTask(recoverTaskId, "completed");
        patchRun({ runState: "completed", buildRecord: rolledBackRecord() });
        pushLog(copy.transitionLog.rollbackDone);
      } else {
        moveTask(recoverTaskId, "failed");
        patchRun({ runState: "failed", buildRecord: rollbackFailedRecord() });
        pushLog(copy.transitionLog.rollbackFailed);
      }
      emit();
    });
    return { kind: "ok", taskId: recoverTaskId, run: currentRun };
  };

  return {
    snapshot: () => Promise.resolve(signal.get()),
    subscribe: signal.subscribe,
    recipeGraph: (recipeId) => Promise.resolve(fixtureRecipeGraph(recipeId)),
    importShareCode: () => Promise.resolve({ kind: "unavailable" }),
    exportShareCode: () => Promise.resolve({ kind: "unavailable" }),
    releaseWall: () => Promise.resolve(fixtureReleaseWall()),
    // 素材选择:Kernel 文件对话框未实现前的 fixture 模拟,返回合成 MaterialRef
    pickMaterial: (intake) => Promise.resolve(materialFor(intake)),
    startInspection: (material) => Promise.resolve(startInspection(material)),
    getInspection: (inspectionId) =>
      Promise.resolve(
        currentRun.kind === "run" && currentRun.inspection?.inspectionId === inspectionId
          ? { schemaVersion: 1 as const, kind: "inspection" as const, report: currentRun.inspection }
          : { schemaVersion: 1 as const, kind: "not-connected" as const },
      ),
    requestPlan: (inspectionId) => Promise.resolve(requestPlan(inspectionId)),
    getPlan: (planId) =>
      Promise.resolve(
        currentRun.kind === "run" && currentRun.plan?.planId === planId
          ? { schemaVersion: 1 as const, kind: "plan" as const, plan: currentRun.plan }
          : { schemaVersion: 1 as const, kind: "not-connected" as const },
      ),
    confirmPlan: (planId, revision) => Promise.resolve(confirmPlan(planId, revision)),
    recover: (taskId, decision) => Promise.resolve(recover(taskId, decision)),
    getBuildRecord: (recordId) =>
      Promise.resolve(
        currentRun.kind === "run" && currentRun.buildRecord?.recordId === recordId
          ? { schemaVersion: 1 as const, kind: "record" as const, record: currentRun.buildRecord }
          : { schemaVersion: 1 as const, kind: "not-connected" as const },
      ),
    capability: () =>
      Promise.resolve<ModelProductionCapabilities>({
        overall: { state: "ready" },
        production: { state: "ready" },
      }),
  };
}
