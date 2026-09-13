import type { AcquireView } from "../../gateway/index.ts";
import type { ComposeDraftItem } from "../../app/compose-draft-store.ts";

/**
 * 选材列表投影(019 批 D D-3;自现有 UI 搭配页原样提取,两套 UI 共用):
 * warehouse 条目读面 × 共享草稿 → 选材行(身份/呈现名/是否已在草稿)。
 * 纯派生不回写共享状态;条目身份即 warehouseItemId(UI-02)。
 * 非 entries 视图(not-connected)投影为空列表——空态/断线呈现由各 UI
 * 适配层按视图种类如实决定,本投影不折叠语义。
 */
export interface ComposeSourceLine {
  readonly id: string;
  readonly title: string;
  readonly added: boolean;
}

export function composeSourceLines(
  view: AcquireView,
  draftItems: readonly ComposeDraftItem[],
): readonly ComposeSourceLine[] {
  if (view.kind !== "entries") return [];
  return view.entries.map((entry) => ({
    id: entry.warehouseItemId,
    title: entry.displayName,
    added: draftItems.some((item) => item.warehouseItemId === entry.warehouseItemId),
  }));
}
