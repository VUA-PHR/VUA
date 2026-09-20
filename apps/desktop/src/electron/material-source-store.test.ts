import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  MATERIAL_SOURCES_SCHEMA_VERSION,
  readMaterialSourcesFromFile,
  writeMaterialSourcesToFile,
} from "./material-source-store.js";

/**
 * 素材登记持久化回归(W25 真机实测易失缺陷修复):登记→写盘→新实例载入
 * (重启模拟)后同一 refId 仍可解析;落盘文件缺失/损坏按三态读纪律处理
 * (归档取证、跨版本不猜);原子写不留 .tmp 残留。
 */

const dirs: string[] = [];

function tempFile(name: string): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "vua-material-sources-"));
  dirs.push(dir);
  return path.join(dir, name);
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const savedAt = "2026-09-20T12:00:00.000Z";

describe("material source persistence", () => {
  it("reads a missing file as absent", () => {
    expect(readMaterialSourcesFromFile(tempFile("material-sources.json"))).toEqual({ kind: "absent" });
  });

  it("keeps a registration resolvable after a restart: write, then load in a fresh instance", () => {
    // 重启模拟:写盘与载入是两次独立调用(新实例无共享内存),仅以文件为界
    const filePath = tempFile("material-sources.json");
    const registered = new Map([["mat-7-0f4c", { path: "C:/materials/Meiyun", displayName: "Meiyun" }]]);
    writeMaterialSourcesToFile(filePath, registered, savedAt);

    const loaded = readMaterialSourcesFromFile(filePath);
    expect(loaded).toEqual({
      kind: "loaded",
      sources: new Map([["mat-7-0f4c", { path: "C:/materials/Meiyun", displayName: "Meiyun" }]]),
      sequence: 7,
    });
  });

  it("seeds the sequence watermark from the highest persisted refId", () => {
    const filePath = tempFile("material-sources.json");
    writeMaterialSourcesToFile(
      filePath,
      new Map([
        ["mat-3-a", { path: "C:/m/a", displayName: "a" }],
        ["mat-12-b", { path: "C:/m/b", displayName: "b" }],
        ["foreign-ref", { path: "C:/m/c", displayName: "c" }],
      ]),
      savedAt,
    );
    const loaded = readMaterialSourcesFromFile(filePath);
    if (loaded.kind !== "loaded") throw new Error("expected loaded");
    expect(loaded.sequence).toBe(12);
    expect(loaded.sources.get("foreign-ref")).toEqual({ path: "C:/m/c", displayName: "c" });
  });

  it("writes atomically: no .tmp residue, valid envelope on disk", () => {
    const filePath = tempFile("material-sources.json");
    writeMaterialSourcesToFile(filePath, new Map([["mat-1-x", { path: "C:/m", displayName: "m" }]]), savedAt);

    expect(existsSync(`${filePath}.tmp`)).toBe(false);
    const doc = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
    expect(doc).toMatchObject({
      schemaVersion: MATERIAL_SOURCES_SCHEMA_VERSION,
      savedAt,
      sources: { "mat-1-x": { path: "C:/m", displayName: "m" } },
    });
  });

  it("archives a corrupt file beside itself and recovers to empty instead of guessing", () => {
    const filePath = tempFile("material-sources.json");
    writeFileSync(filePath, "{ not json", "utf8");

    const loaded = readMaterialSourcesFromFile(filePath);
    if (loaded.kind !== "recovered") throw new Error("expected recovered");
    expect(loaded.reason).toBe("corrupt_json");
    // 归档保留原始字节供人工取证;原位置不再有文件(下次读=absent=空登记)
    expect(readFileSync(loaded.archivedTo, "utf8")).toBe("{ not json");
    expect(existsSync(filePath)).toBe(false);
    expect(readMaterialSourcesFromFile(filePath)).toEqual({ kind: "absent" });
  });

  it("archives an unknown schema version instead of guessing across versions", () => {
    const filePath = tempFile("material-sources.json");
    writeFileSync(filePath, JSON.stringify({ schemaVersion: 99, savedAt, sources: {} }), "utf8");

    const loaded = readMaterialSourcesFromFile(filePath);
    if (loaded.kind !== "recovered") throw new Error("expected recovered");
    expect(loaded.reason).toBe("unsupported_version");
  });

  it("archives out-of-vocabulary shapes (extra entry keys, empty text) instead of repairing", () => {
    const filePath = tempFile("material-sources.json");
    writeFileSync(
      filePath,
      JSON.stringify({
        schemaVersion: MATERIAL_SOURCES_SCHEMA_VERSION,
        savedAt,
        sources: { "mat-1-x": { path: "C:/m", displayName: "m", extra: true } },
      }),
      "utf8",
    );
    expect(readMaterialSourcesFromFile(filePath)).toMatchObject({ kind: "recovered", reason: "invalid_shape" });

    const emptyTextPath = tempFile("material-sources-empty.json");
    writeFileSync(
      emptyTextPath,
      JSON.stringify({
        schemaVersion: MATERIAL_SOURCES_SCHEMA_VERSION,
        savedAt,
        sources: { "mat-1-x": { path: "", displayName: "m" } },
      }),
      "utf8",
    );
    expect(readMaterialSourcesFromFile(emptyTextPath)).toMatchObject({ kind: "recovered", reason: "invalid_shape" });
  });
});
