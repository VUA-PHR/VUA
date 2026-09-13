import { describe, expect, it } from "vitest";
import { composeSourceLines, type ComposeSourceLine } from "./compose-source-model.ts";
import type { AcquireView } from "../../gateway/index.ts";
import type { WarehouseEntry } from "../../gateway/acquire-port.ts";
import type { ComposeDraftItem } from "../../app/compose-draft-store.ts";

function entry(overrides: Partial<WarehouseEntry> = {}): WarehouseEntry {
  return {
    warehouseItemId: "wh-1",
    folderName: "folder-1",
    displayName: "Hair A",
    kind: "imported_material",
    createdAt: "2026-09-14T00:00:00.000Z",
    artifactMode: null,
    effectiveArtifactMode: "use_original_unitypackage",
    artifacts: [],
    ...overrides,
  };
}

function draftItem(warehouseItemId: string): ComposeDraftItem {
  return {
    warehouseItemId,
    title: "t",
    role: null,
    nameHint: null,
    addedAt: "2026-09-14T00:00:00.000Z",
  };
}

describe("composeSourceLines", () => {
  it("entries 视图 → 逐条目行,added 按草稿身份判定", () => {
    const view: AcquireView = {
      schemaVersion: 1,
      kind: "entries",
      entries: [entry(), entry({ warehouseItemId: "wh-2", displayName: "Outfit B" })],
    };
    const lines: readonly ComposeSourceLine[] = composeSourceLines(view, [draftItem("wh-2")]);
    expect(lines).toEqual([
      { id: "wh-1", title: "Hair A", added: false },
      { id: "wh-2", title: "Outfit B", added: true },
    ]);
  });

  it("空仓库(entries 空数组)→ 空列表(不是失败)", () => {
    const view: AcquireView = { schemaVersion: 1, kind: "entries", entries: [] };
    expect(composeSourceLines(view, [])).toEqual([]);
  });

  it("not-connected 视图 → 空列表(语义不折叠,呈现层如实决定)", () => {
    const view: AcquireView = { schemaVersion: 1, kind: "not-connected" };
    expect(composeSourceLines(view, [draftItem("wh-1")])).toEqual([]);
  });
});
