import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import type { EditorSettingsV1 } from "@vua/contracts";

/**
 * U10 壳编辑器设置(021 仲裁:门③留痕与手选值物理持久化归桌面机器级
 * settings,核心经 VUA_UNITY_EDITOR 注入消费,核心不另建机器设置文档库):
 * - 落盘 = userData 下 editor-settings.json(schemaVersion 1 全量文档);
 * - 形状校验拒绝词表外内容:非法形状读取按缺席处理(不猜测、不修复),
 *   save 请求非法时拒绝并回当前落盘值;
 * - 本模块不做任何 Unity/文件系统语义操作——只承载用户决定的留痕。
 */

export const EDITOR_SETTINGS_SCHEMA_VERSION = 1;

/** 空设置(诚实缺席:无已确认手选) */
export function emptyEditorSettings(): EditorSettingsV1 {
  return { schemaVersion: EDITOR_SETTINGS_SCHEMA_VERSION, confirmedEditor: null };
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** 编辑器设置形状守卫(词表外键/类型不符 = 拒绝,不猜测) */
export function isEditorSettingsV1(value: unknown): value is EditorSettingsV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== EDITOR_SETTINGS_SCHEMA_VERSION) return false;
  if (!("confirmedEditor" in record)) return false;
  const confirmed = record.confirmedEditor;
  if (confirmed === null) return Object.keys(record).length === 2;
  if (confirmed === undefined || typeof confirmed !== "object" || Array.isArray(confirmed)) return false;
  const confirmedRecord = confirmed as Record<string, unknown>;
  const keys = Object.keys(confirmedRecord).sort();
  if (keys.length !== 3 || keys[0] !== "confirmedAt" || keys[1] !== "path" || keys[2] !== "version") {
    return false;
  }
  return isNonEmptyText(confirmedRecord.path)
    && isNonEmptyText(confirmedRecord.version)
    && isNonEmptyText(confirmedRecord.confirmedAt);
}

/** 读取落盘设置:文件缺失或形状非法 = 空设置(诚实缺席,不修复不猜测) */
export function readEditorSettingsFromFile(filePath: string): EditorSettingsV1 {
  if (!existsSync(filePath)) return emptyEditorSettings();
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"));
    return isEditorSettingsV1(parsed) ? parsed : emptyEditorSettings();
  } catch {
    return emptyEditorSettings();
  }
}

/** 全量覆写保存:目录不存在则创建;成功返回写入值 */
export function writeEditorSettingsToFile(filePath: string, settings: EditorSettingsV1): EditorSettingsV1 {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}
