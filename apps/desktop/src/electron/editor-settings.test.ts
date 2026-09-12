import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "vitest";
import {
  emptyEditorSettings,
  isEditorSettingsV1,
  readEditorSettingsFromFile,
  writeEditorSettingsToFile,
} from "./editor-settings.js";

/**
 * U10 壳编辑器设置(门③留痕)持久化测试:形状守卫拒绝词表外内容;
 * 读取按落盘事实(缺失/非法 = 诚实空设置,不修复不猜测);保存全量覆写。
 */

const tmpRoots: string[] = [];
function makeTmp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "vua-editor-settings-"));
  tmpRoots.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tmpRoots.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("editor settings (U10 gate-3 ledger, machine-level shell settings)", () => {
  it("validates the closed shape and rejects speculative content", () => {
    expectValid({ schemaVersion: 1, confirmedEditor: null });
    expectValid({
      schemaVersion: 1,
      confirmedEditor: { path: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe", version: "2022.3.22f1", confirmedAt: "2026-09-13T04:00:00.000Z" },
    });
    expectInvalid(null);
    expectInvalid("settings");
    expectInvalid({ schemaVersion: 2, confirmedEditor: null });
    expectInvalid({});
    // 投机字段拒绝
    expectInvalid({ schemaVersion: 1, confirmedEditor: null, lastEditor: "C:\\x" });
    expectInvalid({
      schemaVersion: 1,
      confirmedEditor: { path: "C:\\x", version: "1", confirmedAt: "2026-09-13T04:00:00.000Z", zone: "play" },
    });
    // 空串字段拒绝
    expectInvalid({ schemaVersion: 1, confirmedEditor: { path: "", version: "1", confirmedAt: "t" } });
  });

  it("reads absence honestly: missing or malformed files yield the empty settings", () => {
    const dir = makeTmp();
    const filePath = path.join(dir, "editor-settings.json");
    assert.deepEqual(readEditorSettingsFromFile(filePath), emptyEditorSettings());

    writeFileSync(filePath, "{not json", "utf8");
    assert.deepEqual(readEditorSettingsFromFile(filePath), emptyEditorSettings());

    writeFileSync(filePath, JSON.stringify({ schemaVersion: 9, confirmedEditor: null }), "utf8");
    assert.deepEqual(readEditorSettingsFromFile(filePath), emptyEditorSettings());
  });

  it("saves a full overwrite and reads back the written ledger", () => {
    const dir = makeTmp();
    const filePath = path.join(dir, "nested", "editor-settings.json");
    const settings = {
      schemaVersion: 1 as const,
      confirmedEditor: { path: "C:\\Editors\\2022.3.22f1\\Editor\\Unity.exe", version: "2022.3.22f1", confirmedAt: "2026-09-13T04:00:00.000Z" },
    };
    const saved = writeEditorSettingsToFile(filePath, settings);
    assert.deepEqual(saved, settings);
    assert.deepEqual(readEditorSettingsFromFile(filePath), settings);
    // 落盘文件是可读 JSON(用户可审计自己的留痕)
    assert.deepEqual(JSON.parse(readFileSync(filePath, "utf8")), settings);
  });
});

function expectValid(value: unknown): void {
  assert.ok(isEditorSettingsV1(value), `expected valid: ${JSON.stringify(value)}`);
}
function expectInvalid(value: unknown): void {
  assert.ok(!isEditorSettingsV1(value), `expected invalid: ${JSON.stringify(value)}`);
}
