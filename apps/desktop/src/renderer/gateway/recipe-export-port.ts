import {
  type RecipeExportDraftDependencyV01,
  type RecipeExportDraftEnvironmentV01,
  type RecipeExportDraftOriginV01,
  type RecipeExportMissingDimensionV01,
  type RecipeExportProjectDraftResultV01,
} from "@vua/contracts";
import type { GatewayClient } from "./gateway-client.ts";

export type {
  RecipeExportDraftDependencyV01,
  RecipeExportDraftEnvironmentV01,
  RecipeExportDraftOriginV01,
  RecipeExportMissingDimensionV01,
  RecipeExportProjectDraftResultV01,
} from "@vua/contracts";

/**
 * 配方导出窄端口(proposal 029 B 面环 4 桌面消费批;recipe-export v0.1
 * 冻结词表):recipe.exportProjectDraft 同步只读 Query——从已注册 Unity
 * 工程导出「配方草稿」(draft;永不是 Recipe,转正唯一通道 = 用户显式确认
 * 后的既有 recipe.save 版本链)。
 *
 * - projectPath 复用 013 注册身份(入口限定 VUA 已注册工程集,不开放任意
 *   路径输入);未注册 = Provider 复用 vua.project.project_not_found(024
 *   判例)→ request_rejected;
 * - 实现域未接线 / 引擎未装配 = vua.recipe_export.unavailable → unavailable
 *   (诚实缺席,不虚构草稿);
 * - 回执窄化按冻结 Schema 键形收窄:信封族常量 vua.recipe-export/v0.1 必须
 *   精确命中,必需键收不齐 = 不可解释 → unavailable(不猜测、不渲染半可信
 *   草稿——诚实纪律 1);missing 的 iff 关系与九维恒在由冻结 Schema 权威,
 *   本端口只做键存在性与类型收窄。
 */

/** 窄化后的草稿(冻结 Schema 键形;字段语义见契约 TS 面注记) */
export type RecipeProjectDraft = RecipeExportProjectDraftResultV01;

export type RecipeExportOutcome =
  | { readonly ok: true; readonly draft: RecipeProjectDraft }
  | {
      readonly ok: false;
      readonly error: { readonly kind: "unavailable" | "request_rejected" };
    };

export interface RecipeExportPort {
  /** 导出配方草稿(recipe.exportProjectDraft 同步只读;projectPath 为 013
   *  注册身份)。失败 = 诚实 unavailable / request_rejected,不虚构草稿 */
  exportProjectDraft(projectPath: string): Promise<RecipeExportOutcome>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

const RECIPE_EXPORT_SCHEMA_VERSION = "vua.recipe-export/v0.1";

const MISSING_DIMENSIONS: readonly RecipeExportMissingDimensionV01[] = [
  "assets",
  "instances",
  "relations",
  "wardrobeGroups",
  "targetAvatar",
  "assetRoles",
  "assetLabels",
  "sourceRefs",
  "titleSemantics",
  "environmentUnityVersion",
];

function narrowMissing(value: unknown): readonly RecipeExportMissingDimensionV01[] | null {
  if (!Array.isArray(value) || value.length < 9 || value.length > 10) return null;
  const rows: RecipeExportMissingDimensionV01[] = [];
  for (const item of value) {
    if (
      typeof item !== "string" ||
      !MISSING_DIMENSIONS.some((dimension) => dimension === item)
    ) {
      return null;
    }
    if (rows.includes(item as RecipeExportMissingDimensionV01)) return null;
    rows.push(item as RecipeExportMissingDimensionV01);
  }
  return rows;
}

function narrowOrigin(value: unknown): RecipeExportDraftOriginV01 | null {
  const record = asRecord(value);
  if (record === null) return null;
  const projectPath = asString(record.projectPath);
  const projectName =
    record.projectName === null || typeof record.projectName === "string"
      ? (record.projectName as string | null)
      : undefined;
  const identity = record.vuaIdentityStatus;
  if (
    projectPath === null ||
    projectName === undefined ||
    (identity !== "absent" && identity !== "present" && identity !== "unreadable")
  ) {
    return null;
  }
  return { projectPath, projectName, vuaIdentityStatus: identity };
}

function narrowEnvironment(value: unknown): RecipeExportDraftEnvironmentV01 | null {
  const record = asRecord(value);
  if (record === null) return null;
  const constraint =
    record.unityVersionConstraint === null || typeof record.unityVersionConstraint === "string"
      ? (record.unityVersionConstraint as string | null)
      : undefined;
  if (constraint === undefined) return null;
  return { unityVersionConstraint: constraint };
}

function narrowDependency(value: unknown): RecipeExportDraftDependencyV01 | null {
  const record = asRecord(value);
  if (record === null) return null;
  const packageId = asString(record.packageId);
  const versionConstraint = asString(record.versionConstraint);
  if (packageId === null || versionConstraint === null) return null;
  // lockedVersion 可缺;在场必须是非空字符串(词表外形状 = 行不可解释)
  if (record.lockedVersion === undefined) return { packageId, versionConstraint };
  const lockedVersion = asString(record.lockedVersion);
  return lockedVersion === null ? null : { packageId, versionConstraint, lockedVersion };
}

/** recipe.exportProjectDraft 成功值 → 草稿收窄(信封族常量 + 六事实键闭集;
 *  必需键收不齐 = null 不猜测) */
export function narrowRecipeProjectDraft(value: unknown): RecipeProjectDraft | null {
  const envelope = asRecord(value);
  if (
    envelope === null ||
    envelope.schemaVersion !== RECIPE_EXPORT_SCHEMA_VERSION ||
    envelope.operation !== "recipe.exportProjectDraft"
  ) {
    return null;
  }
  const body = asRecord(envelope.result);
  if (body === null || body.schemaVersion !== RECIPE_EXPORT_SCHEMA_VERSION) return null;
  const draftId = asString(body.draftId);
  const exportedAt = asString(body.exportedAt);
  const origin = narrowOrigin(body.origin);
  const environment = narrowEnvironment(body.environment);
  const missing = narrowMissing(body.missing);
  if (draftId === null || exportedAt === null || origin === null || environment === null || missing === null) {
    return null;
  }
  if (!Array.isArray(body.dependencies)) return null;
  const dependencies: RecipeExportDraftDependencyV01[] = [];
  for (const row of body.dependencies) {
    const narrowed = narrowDependency(row);
    if (narrowed === null) return null;
    dependencies.push(narrowed);
  }
  return {
    schemaVersion: RECIPE_EXPORT_SCHEMA_VERSION,
    draftId,
    exportedAt,
    origin,
    environment,
    dependencies,
    missing,
  };
}

/** live 端口(经 Kernel 直达 provider):应用错误原样透传后按码归类——
 *  vua.project.project_not_found = request_rejected,其余应用错误/传输异常 =
 *  unavailable;回执不可解释 = unavailable(诚实失败,不虚构草稿) */
export function createLiveRecipeExportPort(client: GatewayClient): RecipeExportPort {
  return {
    async exportProjectDraft(projectPath) {
      let result: Awaited<ReturnType<GatewayClient["invoke"]>>;
      try {
        result = await client.invoke({
          schemaVersion: 1,
          requestId: crypto.randomUUID(),
          method: "recipe.exportProjectDraft",
          params: { projectPath },
        });
      } catch {
        return { ok: false, error: { kind: "unavailable" } };
      }
      if (!result.ok) {
        const code = result.error.kind === "application" ? result.error.error.code : null;
        return {
          ok: false,
          error: { kind: code === "vua.project.project_not_found" ? "request_rejected" : "unavailable" },
        };
      }
      const draft = narrowRecipeProjectDraft(result.value);
      return draft === null
        ? { ok: false, error: { kind: "unavailable" } }
        : { ok: true, draft };
    },
  };
}

/** 不可用臂(empty/fixture 同一诚实缺席:不伪造草稿,页面呈现不可用空态) */
export function createUnavailableRecipeExportPort(): RecipeExportPort {
  return {
    exportProjectDraft: async () => ({ ok: false, error: { kind: "unavailable" } }),
  };
}
