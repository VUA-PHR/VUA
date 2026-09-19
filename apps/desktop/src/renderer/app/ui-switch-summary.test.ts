import { describe, expect, it } from "vitest";
import {
  emptyComposeDraft,
  composeAddItem,
  composeSetNameHint,
  composeSaved,
} from "./compose-draft-store.ts";
import { uiSwitchSummary } from "./ui-switch-summary.ts";

/* 019 批 D 共享层(UI-05/AC-09):只读摘要模型——字段保留、不发明内容、
 * 不回写共享状态。目标 UI 不支持当前编辑字段时,摘要即「保留字段＋只读
 * 摘要」的呈现事实源。 */

const NOW = "2026-09-14T00:00:00.000Z";

function draftWithOneItem() {
  return composeAddItem(
    emptyComposeDraft,
    { warehouseItemId: "w-1", title: "Hair A", role: "hair", nameHint: null },
    NOW,
  );
}

describe("ui switch summary (AC-09 read-only projection)", () => {
  it("projects an empty draft as an honest empty summary", () => {
    const summary = uiSwitchSummary(emptyComposeDraft);
    expect(summary.hasDraft).toBe(false);
    expect(summary.items).toEqual([]);
    expect(summary.dirty).toBe(false);
    expect(summary.saved).toBeNull();
  });

  it("preserves item identity, display title and the editable field verbatim", () => {
    const withHint = composeSetNameHint(draftWithOneItem(), "w-1", "my mount");
    const summary = uiSwitchSummary(withHint);
    expect(summary.hasDraft).toBe(true);
    expect(summary.items).toEqual([
      {
        warehouseItemId: "w-1",
        title: "Hair A",
        nameHint: "my mount",
      },
    ]);
    expect(summary.dirty).toBe(true);
  });

  it("passes through the saved recipe identity and revision", () => {
    const saved = composeSaved(draftWithOneItem(), "0190recipe", 3);
    const summary = uiSwitchSummary(saved);
    expect(summary.dirty).toBe(false);
    expect(summary.saved).toEqual({ recipeId: "0190recipe", revision: 3 });
  });

  it("keeps multiple items in draft order without inventing fields", () => {
    const two = composeAddItem(draftWithOneItem(), {
      warehouseItemId: "w-2",
      title: "Outfit B",
      role: null,
      nameHint: null,
    }, NOW);
    const summary = uiSwitchSummary(two);
    expect(summary.items.map((item) => item.warehouseItemId)).toEqual(["w-1", "w-2"]);
    // D3(用户裁定 2026-09-20):加入时挂载名称自动派生为条目 displayName,
    // 摘要如实投影派生值(不发明——值溯源共享草稿事实)
    expect(summary.items[1]).toEqual({
      warehouseItemId: "w-2",
      title: "Outfit B",
      nameHint: "Outfit B",
    });
  });

  it("does not mutate the shared draft (no silent overwrite)", () => {
    const draft = composeSetNameHint(draftWithOneItem(), "w-1", "keep me");
    const snapshot = JSON.stringify(draft);
    uiSwitchSummary(draft);
    expect(JSON.stringify(draft)).toBe(snapshot);
    // 字段保留:派生后编辑字段仍在共享草稿中
    expect(draft.items[0]?.nameHint).toBe("keep me");
  });
});
