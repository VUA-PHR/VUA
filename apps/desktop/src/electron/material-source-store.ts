import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * 素材来源登记持久化(W25 真机实测易失缺陷修复,2026-09-20):
 * 此前 refId→路径映射只存在于主进程内存,应用重启即失——渲染层残留的
 * materialRefId 成为死引用,startInspection 被 Kernel 以 source_unknown 拒绝。
 * 现在登记落盘 userData 下 material-sources.json,启动载入、注册即写盘。
 *
 * 格式与原子写纪律对齐 crates/orchestrator/src/state_file.rs(ORC-STO-003..005):
 * - 信封:{ schemaVersion, savedAt, sources };信封版本只管文件格式;
 * - 三态读:Loaded / Absent(文件不存在,按空登记)/ Recovered(JSON 坏、
 *   版本不认识或形状非法——原文件改名归档为 *.corrupt-<毫秒> 供人工取证,
 *   原始字节原样保留,然后按空登记);跨版本不猜、坏文件不静默修复;
 * - 原子写:同目录 .tmp 先写后 rename,任何时刻看到的要么是旧文件要么
 *   是新文件;写完 .tmp 不残留。
 * 红线(操作者指令 2026-09-20):该文件含用户本机路径,位于 userData 内
 * (不入 git),不做脱敏设计。
 */

export const MATERIAL_SOURCES_SCHEMA_VERSION = 1;

export interface MaterialSourceEntryV1 {
  readonly path: string;
  readonly displayName: string;
}

/** 落盘信封(整文档全量覆写;sources 为 refId → 登记条目) */
export interface MaterialSourceDocV1 {
  readonly schemaVersion: typeof MATERIAL_SOURCES_SCHEMA_VERSION;
  readonly savedAt: string;
  readonly sources: Readonly<Record<string, MaterialSourceEntryV1>>;
}

export type MaterialSourceLoad =
  | { readonly kind: "absent" }
  | {
      readonly kind: "loaded";
      readonly sources: ReadonlyMap<string, MaterialSourceEntryV1>;
      /** 自落盘 refId(mat-<n>-<uuid> 词表)回收的序号水位,注册侧据此续号 */
      readonly sequence: number;
    }
  | {
      readonly kind: "recovered";
      readonly archivedTo: string;
      readonly reason: "corrupt_json" | "unsupported_version" | "invalid_shape";
    };

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** 登记条目形状守卫(恰 path+displayName 两键,均非空文本;词表外拒绝) */
export function isMaterialSourceEntryV1(value: unknown): value is MaterialSourceEntryV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return keys.length === 2 && keys[0] === "displayName" && keys[1] === "path"
    && isNonEmptyText(record.path)
    && isNonEmptyText(record.displayName);
}

/** 落盘信封形状守卫(schemaVersion 1 + savedAt + sources 全表校验) */
function isMaterialSourceDocV1(value: unknown): value is MaterialSourceDocV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== MATERIAL_SOURCES_SCHEMA_VERSION) return false;
  if (!isNonEmptyText(record.savedAt)) return false;
  const sources = record.sources;
  if (sources === null || typeof sources !== "object" || Array.isArray(sources)) return false;
  for (const [refId, entry] of Object.entries(sources)) {
    if (!isNonEmptyText(refId) || !isMaterialSourceEntryV1(entry)) return false;
  }
  return true;
}

/** refId 词表(mat-<n>-<uuid>)中的序号水位;词表外 refId 不参与水位 */
function sequenceWatermark(sources: ReadonlyMap<string, MaterialSourceEntryV1>): number {
  let watermark = 0;
  for (const refId of sources.keys()) {
    const match = /^mat-(\d+)-/.exec(refId);
    if (match !== null) watermark = Math.max(watermark, Number(match[1]));
  }
  return watermark;
}

/**
 * 三态读:文件缺失=absent;JSON 坏/版本不认识/形状非法=归档后 recovered
 * (ORC-STO-005:跨版本不猜,归档不删除);否则 loaded。
 */
export function readMaterialSourcesFromFile(filePath: string): MaterialSourceLoad {
  if (!existsSync(filePath)) return { kind: "absent" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return { kind: "recovered", ...archiveCorruptFile(filePath), reason: "corrupt_json" };
  }
  if (
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    && (parsed as Record<string, unknown>)["schemaVersion"] !== MATERIAL_SOURCES_SCHEMA_VERSION
  ) {
    return { kind: "recovered", ...archiveCorruptFile(filePath), reason: "unsupported_version" };
  }
  if (!isMaterialSourceDocV1(parsed)) {
    return { kind: "recovered", ...archiveCorruptFile(filePath), reason: "invalid_shape" };
  }
  const sources = new Map<string, MaterialSourceEntryV1>(
    Object.entries(parsed.sources) as [string, MaterialSourceEntryV1][],
  );
  return { kind: "loaded", sources, sequence: sequenceWatermark(sources) };
}

/** 坏文件原字节改名归档(同目录 *.corrupt-<毫秒>),返回归档目标 */
function archiveCorruptFile(filePath: string): { archivedTo: string } {
  const archivedTo = `${filePath}.corrupt-${Date.now()}`;
  renameSync(filePath, archivedTo);
  return { archivedTo };
}

/**
 * 全量覆写(原子):目录不存在则创建;先写同目录 .tmp 再 rename 覆盖;
 * 成功返回写出的信封。savedAt 由调用方给(进程时刻),本模块不做时钟假设。
 */
export function writeMaterialSourcesToFile(
  filePath: string,
  sources: ReadonlyMap<string, MaterialSourceEntryV1>,
  savedAt: string,
): MaterialSourceDocV1 {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const doc: MaterialSourceDocV1 = {
    schemaVersion: MATERIAL_SOURCES_SCHEMA_VERSION,
    savedAt,
    sources: Object.fromEntries(sources),
  };
  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, JSON.stringify(doc, null, 2), "utf8");
  renameSync(tempPath, filePath);
  return doc;
}
