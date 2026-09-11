import type {
  ImportCopyPhaseV01,
  ImportCopyPlanV01,
  ImportCopyReceiptV01,
  ImportCopyRejectedV01,
  ProjectTaskAcceptedV02,
} from "@vua/contracts";
import type { GatewayClient } from "./gateway-client.ts";

export type {
  ImportCopyPhaseV01,
  ImportCopyPlanV01,
  ImportCopyReceiptV01,
  ImportCopyRejectedV01,
  ProjectTaskAcceptedV02,
} from "@vua/contracts";

/**
 * 项目操作窄端口(F6/014:「导入为 VUA 管理的副本」确认链;project-ops v0.1
 * 冻结词表)。plan/apply 两段一闭集命令:plan 产出确认面投影(磁盘预估/
 * 排除清单/目标路径/planDigest),apply 携带 confirmedPlanDigest 重算并拒绝
 * 漂移(plan_drift);守卫(七项闭集)在服务端任务内评估,桌面只呈现。
 * 任务化语义(九态/可取消/不隐式续传)走应用契约任务面,不在本端口。
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
  /** plan/apply 两段确认链(014 冻结词表 project.import-copy) */
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

export function createLiveProjectOps(client: GatewayClient): ProjectOpsPort {
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
      const record = asRecord(response.value);
      const kind = record === null ? null : record.kind;
      if (kind === "plan") {
        const plan = narrowPlan(record!);
        return plan !== null
          ? { ok: true, plan }
          : { ok: false, error: { kind: "unavailable" } };
      }
      if (kind === "receipt") {
        const receipt = narrowReceipt(record!);
        return receipt !== null
          ? { ok: true, receipt }
          : { ok: false, error: { kind: "unavailable" } };
      }
      if (kind === "rejected") {
        const rejected = narrowRejected(record!);
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
