/**
 * U10「环境与路径」设置面纯函数(021 桌面消费批;诚实纪律:只收窄 Gateway
 * 实际返回的数据,缺失/不可解释 = null,不猜测、不发明解释):
 * - environmentManagers 快照本体的 editors[] 收窄(预填候选行,来源恒
 *   「已探测」由渲染层常量呈现,不入数据);
 * - environment.verifyEditor 两态 result 收窄(verdict 判别;拒绝码闭集内
 *   走 i18n 映射,词表外码照原词如实呈现——拒绝是正常发现,不隐藏);
 * - 门③留痕行的呈现派生(确认时刻 → 展示文本由调用方 format)。
 */

import {
  EDITOR_REFUSAL_CODES_V01,
  ENVIRONMENT_VERIFY_UNAVAILABLE,
} from "@vua/contracts";

/** 已冻结分类闭集(与 contracts EditorClassV01 逐字同构;渲染层重复闭集
 *  供收窄判定,漂移由 contracts 测试把守) */
const EDITOR_CLASSES: readonly string[] = [
  "production_target",
  "migration_source",
  "other_unity_version",
  "tuanjie_family",
];

/** 拒绝码闭集五码(contracts 运行时常量,不自持字面量) */
export const EDITOR_REFUSAL_CODES: readonly string[] = EDITOR_REFUSAL_CODES_V01;

/** 诚实缺席码(仅路由未接线/原语不可达,绝不是验证拒绝) */
export const ENVIRONMENT_VERIFY_UNAVAILABLE_CODE = ENVIRONMENT_VERIFY_UNAVAILABLE;

/** 预填候选行(字段语义归 environment-managers v0.1 快照 Schema,UI 按需窄化) */
export interface EditorFindingNarrowed {
  readonly version: string;
  readonly classification: string;
  readonly classificationKnown: boolean;
  readonly guidanceCode: string;
  readonly chinaDistribution: boolean;
  readonly path: string;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** 单个编辑器发现收窄;字段收不齐/类型不符 = null(不可解释,不猜测) */
export function narrowEditorFinding(raw: unknown): EditorFindingNarrowed | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (!isNonEmptyText(record.version)
    || !isNonEmptyText(record.classification)
    || !isNonEmptyText(record.guidanceCode)
    || !isNonEmptyText(record.path)
    || typeof record.chinaDistribution !== "boolean") {
    return null;
  }
  const classification = record.classification;
  return {
    version: record.version,
    classification,
    classificationKnown: EDITOR_CLASSES.includes(classification),
    guidanceCode: record.guidanceCode,
    chinaDistribution: record.chinaDistribution,
    path: record.path,
  };
}

/** editors 列表收窄:非数组 = null(不可解释);逐项 null 过滤(不猜测) */
export function narrowEditorFindings(raw: unknown): readonly EditorFindingNarrowed[] | null {
  if (!Array.isArray(raw)) return null;
  const narrowed: EditorFindingNarrowed[] = [];
  for (const entry of raw) {
    const finding = narrowEditorFinding(entry);
    if (finding !== null) narrowed.push(finding);
  }
  return narrowed;
}

/** verifyEditor 两态收窄结果:verified 字段逐字;refused 的 code 以原词
 *  承载并带闭集内标记(词表外码照原词呈现,不猜测映射) */
export type VerifyEditorNarrowed =
  | {
      readonly kind: "verified";
      readonly editorRoot: string;
      readonly exePath: string;
      readonly version: string;
      readonly classification: string;
      readonly classificationKnown: boolean;
      readonly guidanceCode: string;
      readonly chinaDistribution: boolean;
    }
  | {
      readonly kind: "refused";
      readonly exePath: string | null;
      readonly code: string;
      readonly codeKnown: boolean;
      readonly detail: string;
    };

/** 两态 result 收窄(钉子二:detail 原样承载,本层零加工);形状不符 =
 *  null(不可解释,不猜测) */
export function narrowVerifyEditorResult(raw: unknown): VerifyEditorNarrowed | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (record.verdict === "verified") {
    if (!isNonEmptyText(record.editorRoot)
      || !isNonEmptyText(record.exePath)
      || !isNonEmptyText(record.version)
      || !isNonEmptyText(record.classification)
      || !isNonEmptyText(record.guidanceCode)
      || typeof record.chinaDistribution !== "boolean") {
      return null;
    }
    const classification = record.classification;
    return {
      kind: "verified",
      editorRoot: record.editorRoot,
      exePath: record.exePath,
      version: record.version,
      classification,
      classificationKnown: EDITOR_CLASSES.includes(classification),
      guidanceCode: record.guidanceCode,
      chinaDistribution: record.chinaDistribution,
    };
  }
  if (record.verdict === "refused") {
    if (typeof record.code !== "string" || record.code.length === 0
      || !isNonEmptyText(record.detail)) {
      return null;
    }
    if (record.exePath !== null && !isNonEmptyText(record.exePath)) return null;
    return {
      kind: "refused",
      exePath: record.exePath,
      code: record.code,
      codeKnown: EDITOR_REFUSAL_CODES.includes(record.code),
      detail: record.detail,
    };
  }
  return null;
}

/** 拒绝码 → i18n 键尾(闭集内);词表外 = null(调用方照原词呈现) */
export function refusalCodeKey(code: string): string | null {
  if (!EDITOR_REFUSAL_CODES.includes(code)) return null;
  return code.slice("vua.editor_verify.".length);
}
