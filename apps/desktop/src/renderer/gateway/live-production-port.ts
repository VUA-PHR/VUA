import {
  APPLICATION_CONTRACT_VERSION,
  type AppErrorV01,
  type DesktopGatewayRequestV1,
  type DesktopGatewaySuccessValueV1,
  type TaskSnapshotV01,
} from "@vua/contracts";
import type { LogEntry } from "../features/workshop/track-model.ts";
import { phaseOfRun } from "../features/workshop/production-flow-model.ts";
import { strings } from "../i18n/index.ts";
import { projectWorkflowRunState, type ProductionTaskRole } from "./contract-projection.ts";
import type {
  BuildRecord,
  BuildRecordAuthorityStatus,
  BuildRecordEvidenceSummary,
  BuildRecordView,
  InspectionFinding,
  InspectionReport,
  InspectionView,
  MaterialRef,
  ModelProductionCapabilities,
  ModelProductionPort,
  ModelProductionView,
  PlanDiff,
  PlanRisk,
  PlanRiskChoice,
  PlanView,
  ProductionIntentResult,
  ProductionPlan,
  ProductionRejectReason,
  ProductionRunView,
  RecoverDecision,
  SourceIntake,
} from "./model-production-port.ts";
import { sourceIntakes } from "./model-production-port.ts";
import { failureLogText, liveWorkshopView } from "./production-workshop-view.ts";
import { workflowStages, type WorkflowStage } from "./workflow.ts";
import type { GatewayClient, GatewayClientError } from "./gateway-client.ts";
import type { DesktopKernelHost } from "./electron-gateway.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

/**
 * F3 live 模型生产端口(F-3):七方法经 typed client → Kernel 路由 → Provider
 * 真实链路,替换 electron-gateway 中 notRun.modelProduction 的透传。
 *
 * - 运行视图推导:任务九态是唯一权威事实。端口只关联自己经命令创建的生产
 *   任务(命令回执给出 taskId,不拉全量任务列表、不依赖 taskId 前缀),
 *   经 task.get 重取权威快照,由 contract-projection 的"角色 × 九态"投影
 *   得到运行阶段;检查/计划/记录文档在对应任务终态成功后按引用查询并内嵌。
 * - 文档收敛:应用值按字段存在性收窄(client 纪律),词表外条目如实丢弃,
 *   收不齐视图必需字段时按未接入处理(not-connected),绝不猜测。
 * - 断连语义:snapshot 由端口已知的任务事实推导,不抛错;首帧诚实失败由
 *   capability()(app.snapshot)向上抛出,GatewayProvider/车间页呈现失败卡
 *   + 重试;订阅期间的取数失败保留上一视图,恢复由下一次事件或用户重试驱动。
 * - 会话边界:运行关联是渲染层会话事实(命令回执 + 事件),窗口重载后
 *   运行视图回到 not-connected;任务引擎侧任务仍可见、可取消,意图拒绝由
 *   应用层权威裁决并如实透传,前端不复刻状态机、绝不自动重确认。
 * - 切片边界:Recipe 图谱/分享码/卡片墙仍走 notRun 退路(fallback),F-3 不接。
 */

/** 阶段迁移日志上限(防御异常高频事件;超出后丢弃最旧条目) */
const LOG_LIMIT = 100;

interface TrackedTask {
  readonly taskId: string;
  readonly role: ProductionTaskRole;
}

interface RunRecord {
  /** 运行标识 = startInspection 的 correlationId(Kernel requestId,契约事实) */
  readonly runId: string;
  readonly source: MaterialRef;
  /** 本运行经命令创建的任务(按创建序;末位为当前命令) */
  readonly tasks: readonly TrackedTask[];
  /** 各任务最近一次权威快照(task.get 回执) */
  readonly snapshots: ReadonlyMap<string, TaskSnapshotV01>;
  /** 检查域身份(v0.2:startInspection 回执签发,文档按它直取,不再以任务 id 代用) */
  readonly inspectionId: string | null;
  /** 计划域身份(v0.2:requestPlan 回执签发) */
  readonly planId: string | null;
  readonly inspection: InspectionReport | null;
  readonly plan: ProductionPlan | null;
  readonly buildRecord: BuildRecord | null;
  /** 查询构建记录的引用(计划域身份;记录按 planId 别名可取) */
  readonly recordRef: string | null;
  readonly cancelled: boolean;
  /** 确认已过期的运行级事实(stale_revision 拒绝;九态无此表达) */
  readonly expired: boolean;
}

const notConnectedRun: ProductionRunView = { schemaVersion: 1, kind: "not-connected" };

/** task.get/命令回执任务快照形态收窄(client 纪律:contractVersion + 消费必
 *  需键;陌生契约版本的快照按冻结面不可信——集成 #22 验收 L 级观察随手批
 *  补齐,与 project-ops-port 同一线形)。收不齐 = 不可信快照:refreshTask
 *  保留上一视图、命令回执按 unavailable 诚实降级,绝不猜测。cancellation-
 *  Requested/recoveryDisposition 非本端口消费键,不作收窄条件(020 冻结面)。 */
function isTaskSnapshot(value: unknown): value is TaskSnapshotV01 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.contractVersion === APPLICATION_CONTRACT_VERSION &&
    typeof record.taskId === "string" &&
    record.taskId.length > 0 &&
    typeof record.correlationId === "string" &&
    record.correlationId.length > 0 &&
    typeof record.revision === "number" &&
    Number.isSafeInteger(record.revision) &&
    typeof record.state === "string" &&
    record.state.length > 0 &&
    typeof record.updatedAt === "string" &&
    record.updatedAt.length > 0
  );
}

/** 命令成功值收敛:{ contractVersion, task } 包装(B 线/DemoTaskStarted 同形)或裸任务快照 */
function taskFromValue(value: DesktopGatewaySuccessValueV1): TaskSnapshotV01 | null {
  if (isTaskSnapshot(value)) return value;
  if ("task" in value && isTaskSnapshot((value as { task: unknown }).task)) {
    return (value as { task: TaskSnapshotV01 }).task;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** 应用值 → 字段表(按字段存在性收窄的统一入口;client 纪律) */
function valueFields(value: DesktopGatewaySuccessValueV1): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

function isWorkflowStage(value: unknown): value is WorkflowStage {
  return (workflowStages as readonly string[]).includes(value as string);
}

function stagesFrom(value: unknown): WorkflowStage[] {
  return asArray(value).filter(isWorkflowStage);
}

/** 应用错误 → 意图拒绝;词表外应用错误如实归入不可用,不猜测拒绝语义 */
function rejectReasonFor(error: GatewayClientError): ProductionRejectReason | "unavailable" {
  if (error.kind !== "application") return "unavailable";
  const map: Readonly<Record<string, ProductionRejectReason>> = {
    "vua.production.plan_mismatch": "stale_revision",
    "vua.production.not_recoverable": "not_recoverable",
    // v0.2:领域身份存在性统一词(record_not_found);任务面未知引用同义
    "vua.production.record_not_found": "unknown_ref",
    "vua.task.not_found": "unknown_ref",
    // W25 真机实测(2026-09-20):Kernel 重启后素材登记失存,渲染层残留
    // materialRefId 成死引用——专用拒绝原因,不再误报「生产能力未连接」
    "vua.material.source_unknown": "unknown_material_source",
    // W25 真机第四批(2026-09-20):provider inspect_folder 要求 sourceFolder
    // 为目录,文件路径被 vua.material.source_invalid 拒绝——命令已发出且被
    // provider 拒,如实上呈专用拒绝原因,不折叠「未连接/操作未发出」
    "vua.material.source_invalid": "source_invalid",
  };
  return map[error.error.code] ?? "unavailable";
}

/* ---- 文档收敛纯函数(词表外条目如实丢弃,必需字段收不齐返回 null) ---- */

const PLANNABILITY_STATES: readonly string[] = ["plannable", "needs_attention", "not_plannable"];
const FINDING_KINDS: readonly string[] = ["compat", "missing", "conflict"];
const PLAN_DIFF_KINDS: readonly string[] = ["added", "changed", "resolved"];
const RECORD_STATUS: readonly BuildRecordAuthorityStatus[] = [
  "succeeded",
  "succeeded_with_warnings",
  "failed",
  "cancelled",
  "recovered",
];

function inspectionReportFrom(payload: Record<string, unknown>, source: MaterialRef): InspectionReport | null {
  const inspectionId = asString(payload["inspectionId"]);
  const plannability = payload["plannability"];
  if (inspectionId === null || typeof plannability !== "string") return null;
  if (!PLANNABILITY_STATES.includes(plannability)) return null;
  const findings: InspectionFinding[] = [];
  for (const entry of asArray(payload["findings"])) {
    const finding = asRecord(entry);
    if (finding === null) continue;
    const kind = finding["kind"];
    if (typeof kind !== "string" || !FINDING_KINDS.includes(kind)) continue;
    findings.push({
      id: asString(finding["id"]) ?? `finding-${findings.length}`,
      kind: kind as InspectionFinding["kind"],
      summary: asString(finding["summary"]) ?? "",
      recoverable: finding["recoverable"] === true,
      retryable: finding["retryable"] === true,
    });
  }
  return {
    inspectionId,
    // source 用本运行提交的 MaterialRef(渲染层权威);应用文档不回带该形状
    source,
    findings,
    plannability: plannability as InspectionReport["plannability"],
    inspectedAt: asString(payload["inspectedAt"]) ?? "",
  };
}

/** v0.2 计划文档收敛:stages 为工作流阶段词表,risks 为标注对象 */
function planFrom(payload: Record<string, unknown>, planId: string): ProductionPlan | null {
  const revision = payload["revision"];
  if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1) return null;
  const mode = payload["mode"];
  if (typeof mode !== "string" || !(sourceIntakes as readonly string[]).includes(mode)) return null;
  const projectId = asString(payload["projectId"]);
  const projectFingerprint = asString(payload["projectFingerprint"]);
  const riskDecisionRequired = payload["riskDecisionRequired"];
  if (projectId === null || projectFingerprint === null || typeof riskDecisionRequired !== "boolean") {
    return null;
  }
  const stages = stagesFrom(payload["stages"]);
  const risks: PlanRisk[] = [];
  for (const entry of asArray(payload["risks"])) {
    const risk = asRecord(entry);
    if (risk === null) continue;
    const kind = risk["kind"];
    if (typeof kind !== "string" || !FINDING_KINDS.includes(kind)) continue;
    risks.push({
      kind: kind as PlanRisk["kind"],
      summary: asString(risk["summary"]) ?? "",
      recoverable: risk["recoverable"] === true,
      retryable: risk["retryable"] === true,
    });
  }
  const diffs: PlanDiff[] = [];
  for (const entry of asArray(payload["diffs"])) {
    const diff = asRecord(entry);
    if (diff === null) continue;
    const kind = diff["kind"];
    if (typeof kind !== "string" || !PLAN_DIFF_KINDS.includes(kind)) continue;
    diffs.push({
      id: asString(diff["id"]) ?? `diff-${diffs.length}`,
      kind: kind as PlanDiff["kind"],
      summary: asString(diff["summary"]) ?? "",
    });
  }
  const estimated = payload["estimatedDurationMs"];
  return {
    planId: asString(payload["planId"]) ?? planId,
    revision,
    inspectionId: asString(payload["inspectionId"]) ?? "",
    mode: mode as ProductionPlan["mode"],
    projectId,
    projectFingerprint,
    stages,
    riskDecisionRequired,
    risks,
    // 无真实总量来源时 null,界面不得注水(§6.3)
    estimatedDurationMs: typeof estimated === "number" && Number.isSafeInteger(estimated) ? estimated : null,
    diffs,
  };
}

/** v0.2 构建记录收敛:evidenceSummary 四节,未尝试节 null 锚 */
function buildRecordFrom(payload: Record<string, unknown>, ref: string): BuildRecord | null {
  const status = payload["status"];
  if (typeof status !== "string" || !RECORD_STATUS.includes(status as BuildRecordAuthorityStatus)) return null;
  const mode = payload["mode"];
  if (typeof mode !== "string" || !(sourceIntakes as readonly string[]).includes(mode)) return null;
  const evidence = asRecord(payload["evidenceSummary"]);
  if (evidence === null) return null;
  const snapshot = asRecord(evidence["snapshot"]);
  const bridge = asRecord(evidence["bridge"]);
  const localVpm = asRecord(evidence["localVpm"]);
  const validation = asRecord(evidence["validation"]);
  if (snapshot === null || bridge === null || localVpm === null || validation === null) return null;
  const validationStatus = validation["status"];
  if (validationStatus !== "passed" && validationStatus !== "failed" && validationStatus !== "skipped") {
    return null;
  }
  const nullableBoolean = (value: unknown): boolean | null => (value === null ? null : value === true);
  const restoreSucceeded = payload["restoreSucceeded"];
  const evidenceSummary: BuildRecordEvidenceSummary = {
    snapshot: {
      attempted: snapshot["attempted"] === true,
      succeeded: nullableBoolean(snapshot["succeeded"]),
    },
    bridge: {
      jobsRun: typeof bridge["jobsRun"] === "number" && Number.isSafeInteger(bridge["jobsRun"]) && bridge["jobsRun"] >= 0
        ? bridge["jobsRun"]
        : 0,
      allSucceeded: nullableBoolean(bridge["allSucceeded"]),
      lastOperation: asString(bridge["lastOperation"]),
    },
    localVpm: {
      attempted: localVpm["attempted"] === true,
      published: nullableBoolean(localVpm["published"]),
      packageId: asString(localVpm["packageId"]),
    },
    validation: { status: validationStatus },
  };
  return {
    recordId: asString(payload["recordId"]) ?? ref,
    taskId: asString(payload["taskId"]) ?? "",
    planId: asString(payload["planId"]) ?? "",
    mode: mode as BuildRecord["mode"],
    status: status as BuildRecordAuthorityStatus,
    restoreAttempted: payload["restoreAttempted"] === true,
    restoreSucceeded: restoreSucceeded === undefined ? null : restoreSucceeded === true,
    stages: stagesFrom(payload["stages"]),
    evidenceSummary,
    startedAt: asString(payload["startedAt"]) ?? "",
    finishedAt: asString(payload["finishedAt"]) ?? "",
  };
}

export function createLiveModelProduction(
  client: GatewayClient,
  host: DesktopKernelHost | undefined,
  fallback: ModelProductionPort,
): ModelProductionPort {
  let run: RunRecord | null = null;
  const log: LogEntry[] = [];
  let lastPhaseKey: string | null = null;

  /* ---- 视图推导 ---- */

  const runView = (): ProductionRunView => {
    if (run === null || run.tasks.length === 0) return notConnectedRun;
    const current = run.tasks[run.tasks.length - 1]!;
    const snapshot = run.snapshots.get(current.taskId);
    if (snapshot === undefined) return notConnectedRun;
    return {
      schemaVersion: 1,
      kind: "run",
      runId: run.runId,
      taskId: current.taskId,
      runState: run.expired ? "expired" : projectWorkflowRunState(current.role, snapshot),
      cancelled: run.cancelled,
      source: run.source,
      inspection: run.inspection,
      plan: run.plan,
      buildRecord: run.buildRecord,
    };
  };

  const buildView = (): ModelProductionView => {
    const productionRun = runView();
    return { schemaVersion: 1, workshop: liveWorkshopView(productionRun, log), productionRun };
  };

  const listeners = new Set<(view: ModelProductionView) => void>();
  const emit = (): void => {
    const view = buildView();
    for (const listener of listeners) listener(view);
  };

  /** 阶段迁移日志:文本取自 productionFlow 阶段文案(同一键驱动流程段阶段行) */
  const pushLog = (at: string): void => {
    const view = runView();
    if (view.kind !== "run") return;
    const phase = phaseOfRun(view);
    const key = phase as string;
    if (key === lastPhaseKey) return;
    lastPhaseKey = key;
    // 诚实纪律#2(W25 真机呈现缺口修复,第 142 批):失败行词面必须携带
    // 错误详情——messageKey 命中 errors 词表用本地化词面,否则 code 原词
    // 呈现(如 vua.material.bridge_failed),绝不只呈「失败」两字让用户去
    // 任务记录翻原因;error 缺席 = 仅基础词面,不猜测不虚构详情
    let text = strings.productionFlow.phase[phase];
    if (phase === "failed" || phase === "failedRecoverable") {
      text = failureLogText(text, currentTaskError());
    }
    log.push({ time: at, text });
    if (log.length > LOG_LIMIT) log.splice(0, log.length - LOG_LIMIT);
  };

  /** 当前任务快照的 error 载荷(与 runView 同一当前任务定位;失败行详情
   *  数据源——契约 AppErrorV01:code + messageKey + params) */
  const currentTaskError = (): AppErrorV01 | null => {
    if (run === null) return null;
    const current = run.tasks.at(-1);
    if (current === undefined) return null;
    const snapshot = run.snapshots.get(current.taskId);
    const error = snapshot?.error;
    return error ?? null;
  };

  const withTask = (record: RunRecord, task: TaskSnapshotV01): RunRecord => ({
    ...record,
    cancelled: record.cancelled || task.state === "cancelled",
    snapshots: new Map(record.snapshots).set(task.taskId, task),
  });

  // 事件只是事实通知;权威状态一律经 task.get 重取(契约"revision 与事件")。
  // 端口创建即订阅事件通道:运行视图的推导与文档回填不依赖 UI 订阅者,
  // port.subscribe 只负责把视图变更推给监听方。
  client.subscribe((event) => {
    if (event.kind === "capability.changed" || event.kind === "download.intent") return;
    void refreshTask(event.taskId);
  });

  const refreshTask = async (taskId: string): Promise<void> => {
    if (run === null || !run.tasks.some((entry) => entry.taskId === taskId)) return;
    const result = await invoke("task.get", { taskId });
    const task = result.ok ? taskFromValue(result.value) : null;
    if (task === null || run === null) return; // 断连期间保留上一视图
    const previous = run.snapshots.get(taskId);
    run = withTask(run, task);
    if (previous === undefined || previous.state !== task.state || previous.revision !== task.revision) {
      pushLog(task.updatedAt);
    }
    // 终态成功后按引用补齐内嵌文档(失败保留上一视图,等下一次事件)
    if (task.state === "succeeded" || task.state === "succeeded_with_warnings") {
      const role = run.tasks.find((entry) => entry.taskId === taskId)?.role;
      // v0.2:文档按回执签发的域身份直取(不再以任务 id 代用)
      if (role === "inspect" && run.inspectionId !== null) void refreshInspection(run.inspectionId);
      if (role === "plan" && run.planId !== null) void refreshPlan(run.planId);
      if ((role === "execute" || role === "recover") && run.recordRef !== null) {
        void refreshRecord(run.recordRef);
      }
    }
    emit();
  };

  const invoke = async (
    method: DesktopGatewayRequestV1["method"],
    params: Record<string, unknown>,
  ): Promise<Awaited<ReturnType<GatewayClient["invoke"]>>> =>
    client.invoke({ schemaVersion: 1, requestId: crypto.randomUUID(), method, params } as DesktopGatewayRequestV1);

  /* ---- 文档刷新(查询收敛;失败保留上一视图) ---- */

  const refreshInspection = async (inspectionId: string): Promise<void> => {
    const result = await invoke("production.getInspection", { inspectionId });
    const payload = result.ok ? asRecord(valueFields(result.value)["inspection"]) : null;
    const report = payload !== null && run !== null ? inspectionReportFrom(payload, run.source) : null;
    if (report !== null && run !== null) {
      run = { ...run, inspection: report };
      pushLog(new Date().toISOString());
      emit();
    }
  };

  const refreshPlan = async (planId: string): Promise<void> => {
    const result = await invoke("production.getPlan", { planId });
    const payload = result.ok ? asRecord(valueFields(result.value)["plan"]) : null;
    const plan = payload === null ? null : planFrom(payload, planId);
    if (plan !== null && run !== null) {
      run = { ...run, plan };
      pushLog(new Date().toISOString());
      emit();
    }
  };

  const refreshRecord = async (ref: string): Promise<void> => {
    const result = await invoke("production.getBuildRecord", { buildRecordId: ref });
    const payload = result.ok ? asRecord(valueFields(result.value)["buildRecord"]) : null;
    const record = payload === null ? null : buildRecordFrom(payload, ref);
    if (record !== null && run !== null) {
      run = { ...run, buildRecord: record };
      emit();
    }
  };

  /** 意图命令共用面:命令回执给出已创建任务;应用拒绝如实透传 */
  const submitIntent = async (
    method: "production.startInspection" | "production.requestPlan" | "production.confirmPlan" | "production.recover",
    params: Record<string, unknown>,
    role: ProductionTaskRole,
    beginRun: MaterialRef | null,
  ): Promise<ProductionIntentResult> => {
    const result = await invoke(method, params);
    if (!result.ok) {
      const reason = rejectReasonFor(result.error);
      if (reason === "stale_revision" && run !== null) {
        // 确认纪律:计划已变化是应用层权威事实 → 运行态 expired(绝不自动重确认)
        run = { ...run, expired: true };
        lastPhaseKey = null;
        pushLog(new Date().toISOString());
        emit();
      }
      return reason === "unavailable"
        ? { kind: "unavailable" }
        : { kind: "rejected", reason, run: runView() };
    }
    const task = taskFromValue(result.value);
    if (task === null) return { kind: "unavailable" };
    // v0.2 域身份:startInspection/requestPlan 回执各自签发文档引用
    const issuedInspectionId = asString(valueFields(result.value)["inspectionId"]);
    const issuedPlanId = asString(valueFields(result.value)["planId"]);
    if (beginRun !== null) {
      run = {
        runId: task.correlationId,
        source: beginRun,
        tasks: [],
        snapshots: new Map(),
        inspectionId: issuedInspectionId,
        planId: null,
        inspection: null,
        plan: null,
        buildRecord: null,
        recordRef: null,
        cancelled: false,
        expired: false,
      };
      lastPhaseKey = null;
    } else if (run !== null) {
      // 新命令推进运行:确认过期事实随之解除(重新确认/恢复是显式用户动作)
      run = { ...run, expired: false };
      run = role === "plan" ? { ...run, planId: issuedPlanId } : run;
      run = role === "execute" ? { ...run, recordRef: params["planId"] as string } : run;
    }
    const base = run ?? {
      runId: task.correlationId,
      source: { materialId: "", intake: "direct_unity_package", displayName: "" },
      tasks: [],
      snapshots: new Map<string, TaskSnapshotV01>(),
      inspectionId: null,
      planId: null,
      inspection: null,
      plan: null,
      buildRecord: null,
      recordRef: null,
      cancelled: false,
      expired: false,
    };
    run = {
      ...base,
      tasks: [...base.tasks, { taskId: task.taskId, role }],
      cancelled: base.cancelled || task.state === "cancelled",
      snapshots: new Map(base.snapshots).set(task.taskId, task),
    };
    pushLog(task.updatedAt);
    emit();
    // v0.2 内联完成:startInspection/requestPlan 的回执任务可能已 succeeded,
    // 而其 completed 事件在 invoke 返回前已发出(当时 run 尚未登记)——
    // 此处补一次文档回填,不依赖事件时序;引用用回执签发的域身份
    if (task.state === "succeeded" || task.state === "succeeded_with_warnings") {
      if (role === "inspect" && run.inspectionId !== null) void refreshInspection(run.inspectionId);
      if (role === "plan" && issuedPlanId !== null) void refreshPlan(issuedPlanId);
    }
    return { kind: "ok", taskId: task.taskId, run: runView() };
  };

  const overallCapability: CapabilityReport = { state: "unavailable", detailKey: "detectorsMissing" };

  return {
    ...fallback,

    snapshot: () => Promise.resolve(buildView()),

    subscribe(callback: (view: ModelProductionView) => void): Unsubscribe {
      // 事件通道的订阅在端口创建时已建立(见上);此处只登记视图监听
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },

    pickMaterial: async (intake: SourceIntake) => {
      if (host?.dialog === undefined) return null;
      const picked = await host.dialog.pickMaterialSource(intake);
      return picked === null
        ? null
        : { materialId: picked.refId, intake, displayName: picked.displayName };
    },

    startInspection: (source: MaterialRef) =>
      submitIntent(
        "production.startInspection",
        { materialRefId: source.materialId, commandId: crypto.randomUUID() },
        "inspect",
        source,
      ),

    getInspection: async (inspectionId): Promise<InspectionView> => {
      const result = await invoke("production.getInspection", { inspectionId });
      const payload = result.ok ? asRecord(valueFields(result.value)["inspection"]) : null;
      // source 关联按域身份比对(v0.2):本运行签发的检查才呈现本运行来源
      const source = run !== null && run.inspectionId === inspectionId ? run.source : null;
      const report = payload !== null && source !== null ? inspectionReportFrom(payload, source) : null;
      return report === null
        ? { schemaVersion: 1, kind: "not-connected" }
        : { schemaVersion: 1, kind: "inspection", report };
    },

    requestPlan: (inspectionId: string) =>
      submitIntent(
        "production.requestPlan",
        {
          inspectionId,
          commandId: crypto.randomUUID(),
          // v0.2:mode 是用户在素材入口的真实决策,从运行已选素材的 intake 内取
          mode: run?.source.intake ?? "direct_unity_package",
        },
        "plan",
        null,
      ),

    getPlan: async (planId): Promise<PlanView> => {
      const result = await invoke("production.getPlan", { planId });
      const payload = result.ok ? asRecord(valueFields(result.value)["plan"]) : null;
      const plan = payload === null ? null : planFrom(payload, planId);
      return plan === null
        ? { schemaVersion: 1, kind: "not-connected" }
        : { schemaVersion: 1, kind: "plan", plan };
    },

    confirmPlan: (planId: string, revision: number, riskChoice: PlanRiskChoice, rememberForSession?: boolean) =>
      submitIntent(
        "production.confirmPlan",
        {
          planId,
          commandId: crypto.randomUUID(),
          observedRevision: revision,
          riskChoice,
          ...(rememberForSession === undefined ? {} : { rememberForSession }),
        },
        "execute",
        null,
      ),

    recover: (taskId: string, decision: RecoverDecision) =>
      // decisionId 由 Kernel 受理时生成并绑定(taskId + revision + decision),
      // 渲染层不携带该概念,请求只表达语义选择
      submitIntent(
        "production.recover",
        { taskId, decision: decision.kind, commandId: crypto.randomUUID() },
        "recover",
        null,
      ),

    getBuildRecord: async (recordId): Promise<BuildRecordView> => {
      const result = await invoke("production.getBuildRecord", { buildRecordId: recordId });
      const payload = result.ok ? asRecord(valueFields(result.value)["buildRecord"]) : null;
      const record = payload === null ? null : buildRecordFrom(payload, recordId);
      return record === null
        ? { schemaVersion: 1, kind: "not-connected" }
        : { schemaVersion: 1, kind: "record", record };
    },

    capability: async (): Promise<ModelProductionCapabilities> => {
      // 首帧诚实失败:取数失败向上抛出(车间页呈现失败卡 + 重试,不改本地数据)
      const result = await invoke("app.snapshot", {});
      const tasks = result.ok ? asRecord(valueFields(result.value)["capabilities"])?.["tasks"] : null;
      if (tasks === null || tasks === undefined) {
        throw new Error("production_capability_unavailable");
      }
      return {
        // 图谱/分享码/卡片墙属后续切片(本切片保持 notRun 退路),overall 不谎报就绪
        overall: overallCapability,
        // 冻结 app.snapshot 面以任务引擎为生产用例的宿主事实;production.* 缺席时
        // 命令会以应用错误如实拒绝(vua.production.unavailable)
        production: tasks === true
          ? { state: "ready" }
          : { state: "unavailable", detailKey: "taskEngineMissing" },
      };
    },
  };
}
