import {
  isTerminalTaskStateV01,
  type ImportCopyPhaseV01,
  type ImportCopyPlanV01,
  type ImportCopyReceiptV01,
  type ImportCopyRejectedV01,
  type ProjectTaskAcceptedV02,
  type TaskSnapshotV01,
} from "@vua/contracts";
import type { GatewayClient } from "./gateway-client.ts";
import type { Unsubscribe } from "./types.ts";

export type {
  ImportCopyPhaseV01,
  ImportCopyPlanV01,
  ImportCopyReceiptV01,
  ImportCopyRejectedV01,
  ProjectTaskAcceptedV02,
} from "@vua/contracts";

/**
 * 项目操作窄端口(F6/014:「导入为 VUA 管理的副本」确认链;project-ops
 * 冻结词表)。plan/apply 两段一闭集命令:plan 产出确认面投影(磁盘预估/
 * 排除清单/目标路径/planDigest),apply 携带 confirmedPlanDigest 重算并拒绝
 * 漂移(plan_drift);守卫(七项闭集)在服务端任务内评估,桌面只呈现。
 *
 * 任务化消费(proposal 020 result 回流,#22 裁决):live wire 的命令成功值
 * 是任务化受理回执(taskId/correlationId),结果文档随任务终态快照的
 * `result`(Done payload)回流——端口内封装受理→终态等待→result 窄化,
 * 对调用方保持既有 ProjectOpsOutcome 形状。九态/可取消/不隐式续传的任务
 * 语义归应用契约任务面;任务中心呈现任务真实状态,本端口只消费终态结果。
 */

export interface ProjectImportCopyParams {
  readonly phase: ImportCopyPhaseV01;
  readonly sourcePath: string;
  readonly targetParentDirectory: string;
  readonly targetProjectName: string;
  readonly confirmedPlanDigest?: string;
}

export type ProjectOpsOutcome =
  | { readonly ok: true; readonly plan: ImportCopyPlanV01 }
  | { readonly ok: true; readonly receipt: ImportCopyReceiptV01 }
  | { readonly ok: true; readonly rejected: ImportCopyRejectedV01 }
  | {
      readonly ok: false;
      readonly error: { readonly kind: "unavailable" | "request_rejected" };
    };

export interface ProjectOpsPort {
  /** plan/apply 两段确认链(project.import-copy):live 下为任务化受理——
   *  端口内等待任务终态并从快照 result 窄化结果文档(proposal 020);
   *  失败/取消/超时 = 诚实 unavailable,任务事实由任务中心呈现 */
  importCopy(params: ProjectImportCopyParams): Promise<ProjectOpsOutcome>;
  /** 备注写(project-ops v0.2 project.setNote;任务化受理):回执携带
   *  taskId,结果文档随任务完成面——调用方经任务中心等待终态后,以
   *  inspectProject 读面刷新确认存储事实(诚实纪律:呈现只来自读面) */
  setNote(params: ProjectSetNoteParams): Promise<ProjectSetNoteOutcome>;
}

export interface ProjectSetNoteParams {
  readonly projectPath: string;
  /** null 清除既有备注;非空单行纯文本(冻结 Schema 1..2000 字符无换行) */
  readonly note: string | null;
}

export type ProjectSetNoteOutcome =
  | { readonly ok: true; readonly accepted: ProjectTaskAcceptedV02 }
  | {
      readonly ok: false;
      readonly error: { readonly kind: "unavailable" | "request_rejected" };
    };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asInt(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

function asStringArray(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as readonly string[])
    : null;
}

/** plan 投影窄化:收不齐必需字段=不可用,不渲染半可信计划 */
function narrowPlan(record: Record<string, unknown>): ImportCopyPlanV01 | null {
  const sourcePath = asString(record.sourcePath);
  const targetPath = asString(record.targetPath);
  const targetProjectName = asString(record.targetProjectName);
  const estimatedBytes = asInt(record.estimatedBytes);
  const excludedEntries = asStringArray(record.excludedEntries);
  const sourceTopLevels = asStringArray(record.sourceTopLevels);
  const planDigest = asString(record.planDigest);
  if (
    sourcePath === null ||
    targetPath === null ||
    targetProjectName === null ||
    estimatedBytes === null ||
    excludedEntries === null ||
    sourceTopLevels === null ||
    planDigest === null
  ) {
    return null;
  }
  return {
    kind: "plan",
    sourcePath,
    targetPath,
    targetProjectName,
    estimatedBytes,
    excludedEntries,
    sourceTopLevels,
    planDigest,
  };
}

/** receipt 投影窄化:嵌套 sourceLink/reInspection 逐字段收窄 */
function narrowReceipt(record: Record<string, unknown>): ImportCopyReceiptV01 | null {
  const sourcePath = asString(record.sourcePath);
  const targetPath = asString(record.targetPath);
  const targetProjectName = asString(record.targetProjectName);
  const copiedTopLevels = asStringArray(record.copiedTopLevels);
  const excludedEntries = asStringArray(record.excludedEntries);
  const bytesCopied = asInt(record.bytesCopied);
  const link = asRecord(record.sourceLink);
  const re = asRecord(record.reInspection);
  if (sourcePath === null || targetPath === null || targetProjectName === null ||
      copiedTopLevels === null || excludedEntries === null || bytesCopied === null || link === null || re === null) {
    return null;
  }
  const linkSourcePath = asString(link.sourcePath);
  const associationsRaw = asStringArray(link.sourceAssociations);
  const associations =
    associationsRaw !== null &&
    associationsRaw.every(
      (a) => a === "vcc_registered" || a === "alcom_registered",
    )
      ? (associationsRaw as readonly ("vcc_registered" | "alcom_registered")[])
      : null;
  const importedAt = asString(link.importedAt);
  const taskCorrelation = asString(link.taskCorrelation);
  const unityVersion = re.unityVersion === null || typeof re.unityVersion === "string" ? (re.unityVersion as string | null) : null;
  const unityClassificationRaw = re.unityClassification;
  const unityClassification =
    unityClassificationRaw === null ||
    unityClassificationRaw === "production_target" ||
    unityClassificationRaw === "migration_source" ||
    unityClassificationRaw === "other_unity_version" ||
    unityClassificationRaw === "tuanjie_family"
      ? unityClassificationRaw
      : null;
  const manifestPresent = typeof re.manifestPresent === "boolean" ? re.manifestPresent : null;
  const manifestSchemaOk = typeof re.manifestSchemaOk === "boolean" ? re.manifestSchemaOk : null;
  if (linkSourcePath === null || associations === null || importedAt === null ||
      taskCorrelation === null || manifestPresent === null || manifestSchemaOk === null) {
    return null;
  }
  return {
    kind: "receipt",
    sourcePath,
    targetPath,
    targetProjectName,
    copiedTopLevels,
    excludedEntries,
    bytesCopied,
    sourceLink: {
      sourcePath: linkSourcePath,
      sourceAssociations: associations,
      importedAt,
      taskCorrelation,
    },
    reInspection: {
      unityVersion,
      unityClassification,
      manifestPresent,
      manifestSchemaOk,
    },
  };
}

/** rejected 投影窄化:guard 七项闭集+code 词表(pattern vua.project.*);不齐=不可用 */
function narrowRejected(record: Record<string, unknown>): ImportCopyRejectedV01 | null {
  const guards: readonly string[] = [
    "target_exists",
    "target_inside_source",
    "source_not_registered",
    "source_invalid",
    "insufficient_disk_space",
    "plan_drift",
    "execution_failed",
  ];
  const guard = asString(record.guard);
  const code = asString(record.code);
  const detail = record.detail === undefined || record.detail === null ? null : asString(record.detail);
  if (guard === null || !guards.includes(guard) || code === null || !code.startsWith("vua.project.") || detail === null) {
    return null;
  }
  return {
    kind: "rejected",
    guard: guard as ImportCopyRejectedV01["guard"],
    code,
    detail,
  };
}

/** setNote 受理回执窄化(taskId/correlationId 齐才可信;结果文档不经本
 *  回执——诚实纪律:调用方以读面刷新确认存储事实) */
function narrowTaskAccepted(value: unknown): ProjectTaskAcceptedV02 | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const taskId = record.taskId;
  const correlationId = record.correlationId;
  if (
    typeof taskId !== "string" ||
    taskId.length === 0 ||
    typeof correlationId !== "string" ||
    correlationId.length === 0
  ) {
    return null;
  }
  return { taskId, correlationId };
}

/* ---- 任务化消费(proposal 020 result 回流):importCopy 专用 ---- */

/**
 * 任务等待上界(apply 段含真实目录复制,不设短界):正常终态由
 * task.completed 事件驱动毫秒级到达;本界只防御事件丢失/断连后的无限
 * 挂起——超时是「无法确认结果」,任务本身仍在任务中心呈现真实状态。
 */
const IMPORT_COPY_TASK_WAIT_MS = 120_000;

/** task.get 权威快照形态收窄(client 纪律:字段存在性;必需键收不齐 =
 *  不可信快照,与词表外取值同按不可用处理)。result 为可选增量(020
 *  冻结面:仅成功终态出现),本函数不深检——消费处按操作词表窄化。 */
function isTaskSnapshot(value: unknown): value is TaskSnapshotV01 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.taskId === "string" &&
    record.taskId.length > 0 &&
    typeof record.correlationId === "string" &&
    record.correlationId.length > 0 &&
    typeof record.revision === "number" &&
    Number.isSafeInteger(record.revision) &&
    typeof record.state === "string" &&
    record.state.length > 0 &&
    typeof record.cancellationRequested === "boolean" &&
    (record.recoveryDisposition === "none" || record.recoveryDisposition === "inspect_required") &&
    typeof record.updatedAt === "string" &&
    record.updatedAt.length > 0
  );
}

async function fetchTaskSnapshot(client: GatewayClient, taskId: string): Promise<TaskSnapshotV01 | null> {
  const result = await client.invoke({
    schemaVersion: 1,
    requestId: crypto.randomUUID(),
    method: "task.get",
    params: { taskId },
  });
  return result.ok && isTaskSnapshot(result.value) ? result.value : null;
}

/**
 * 受理后的终态等待:初始即取权威快照(快任务在受理返回前可能已内联完成,
 * v0.2 先例);未终态则订阅事件通道,task.completed(本任务)后重取权威
 * 快照——事件是事实通知,快照才是权威(契约「revision 与事件」;020:
 * 两通道同源同值,终态提交点先于发布)。首取失败(断连/形态不齐)= 无
 * 权威事实基础,立即 null;等待中重取失败保留等待(后续事件或超时兜底)。
 */
async function waitForTerminalTask(
  client: GatewayClient,
  taskId: string,
  waitMs: number,
): Promise<TaskSnapshotV01 | null> {
  const first = await fetchTaskSnapshot(client, taskId);
  if (first === null || isTerminalTaskStateV01(first.state)) return first;
  return new Promise<TaskSnapshotV01 | null>((resolve) => {
    let unsubscribe: Unsubscribe | null = null;
    let settled = false;
    const finish = (value: TaskSnapshotV01 | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      unsubscribe?.();
      resolve(value);
    };
    const deadline = setTimeout(() => finish(null), waitMs);
    unsubscribe = client.subscribe((event) => {
      if (event.kind !== "task.completed" || event.taskId !== taskId) return;
      void fetchTaskSnapshot(client, taskId).then((snapshot) => {
        if (snapshot !== null && isTerminalTaskStateV01(snapshot.state)) finish(snapshot);
      });
    });
  });
}

export function createLiveProjectOps(
  client: GatewayClient,
  options?: { readonly taskWaitMs?: number },
): ProjectOpsPort {
  const taskWaitMs = options?.taskWaitMs ?? IMPORT_COPY_TASK_WAIT_MS;
  return {
    async importCopy(params: ProjectImportCopyParams): Promise<ProjectOpsOutcome> {
      const response = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "project.import-copy",
        params,
      });
      if (!response.ok) {
        return {
          ok: false,
          error: {
            kind: response.error.kind === "request_rejected" ? "request_rejected" : "unavailable",
          },
        };
      }
      // 任务化受理(020 result 回流):live wire 成功值 = 受理回执;结果
      // 文档随任务终态快照回流。直接期待结果文档的旧形状正是 #22 缺口。
      const accepted = narrowTaskAccepted(response.value);
      if (accepted === null) {
        return { ok: false, error: { kind: "unavailable" } };
      }
      const snapshot = await waitForTerminalTask(client, accepted.taskId, taskWaitMs);
      // 超时/断连/形态不齐 = 无法确认结果,诚实 unavailable——不猜测、
      // 不伪造结果文档;任务的真实状态由任务中心呈现
      if (snapshot === null) {
        return { ok: false, error: { kind: "unavailable" } };
      }
      // 冻结不变量(020):result 仅成功终态出现;failed 走 error 字段、
      // 取消走 state——结果不可得 = unavailable,不猜测原因
      if (snapshot.state !== "succeeded" && snapshot.state !== "succeeded_with_warnings") {
        return { ok: false, error: { kind: "unavailable" } };
      }
      // Done payload(project-ops 词表自描述 schemaVersion/operation)内取
      // 结果文档;收不齐 = 不可用,不渲染半可信结果
      const payload = asRecord(snapshot.result);
      const result = payload === null ? null : asRecord(payload.result);
      if (result === null) {
        return { ok: false, error: { kind: "unavailable" } };
      }
      const kind = result.kind;
      if (kind === "plan") {
        const plan = narrowPlan(result);
        return plan !== null
          ? { ok: true, plan }
          : { ok: false, error: { kind: "unavailable" } };
      }
      if (kind === "receipt") {
        const receipt = narrowReceipt(result);
        return receipt !== null
          ? { ok: true, receipt }
          : { ok: false, error: { kind: "unavailable" } };
      }
      if (kind === "rejected") {
        const rejected = narrowRejected(result);
        return rejected !== null
          ? { ok: true, rejected }
          : { ok: false, error: { kind: "unavailable" } };
      }
      return { ok: false, error: { kind: "unavailable" } };
    },
    async setNote(params: ProjectSetNoteParams): Promise<ProjectSetNoteOutcome> {
      const response = await client.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "project.setNote",
        params,
      });
      if (!response.ok) {
        return {
          ok: false,
          error: {
            kind: response.error.kind === "request_rejected" ? "request_rejected" : "unavailable",
          },
        };
      }
      const accepted = narrowTaskAccepted(response.value);
      return accepted !== null
        ? { ok: true, accepted }
        : { ok: false, error: { kind: "unavailable" } };
    },
  };
}

/** 未接入宿主时的诚实退路:命令不可用(错误形态与 live 同构) */
export function createEmptyProjectOps(): ProjectOpsPort {
  return {
    importCopy: () =>
      Promise.resolve({ ok: false, error: { kind: "unavailable" } as const }),
    setNote: () =>
      Promise.resolve({ ok: false, error: { kind: "unavailable" } as const }),
  };
}
