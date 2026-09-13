import type { ComposeDraftState } from "./compose-draft-store.ts";

/**
 * UI 根切换只读摘要(019 批 D 共享层,UI-05/AC-09):
 * - 场景:目标 UI 不支持当前编辑字段(森林绿未接入/能力缺口)时,切换
 *   前的编辑内容已在共享容器草稿中(现有 UI 输入控件 onChange 直写共享
 *   store,无本地缓冲——UI-05「切换前同步」结构成立),本模型把共享草稿
 *   投影为只读摘要,供不可用根/降级根呈现「字段保留＋只读摘要＋返回入口」;
 * - 诚实纪律:摘要每字段都溯源共享草稿事实(身份/呈现名/编辑字段/未保存
 *   标记/已保存身份),不发明内容;空草稿投影为 hasDraft:false 的诚实空态;
 * - 纯投影不回写:派生不改共享状态(AC-09「不静默覆盖」的模型面钉子),
 *   写路径仍只经 compose-draft-store 的 action。
 */

/** 摘要条目:身份＋素材事实(呈现名)＋当前 UI 的编辑字段(挂载名称提示) */
export interface UiSwitchSummaryItem {
  /** 素材身份(UI-02):warehouse 条目 id */
  readonly warehouseItemId: string;
  /** 呈现名(素材事实) */
  readonly title: string;
  /** 当前 UI 的编辑字段:挂载选择器名称提示(共享草稿保留,只读展示) */
  readonly nameHint: string | null;
}

/** 只读摘要:目标 UI 根呈现共享草稿保留状态的最小事实面 */
export interface UiSwitchSummary {
  /** 共享容器内是否存在草稿内容(false = 诚实空态,不展示占位内容) */
  readonly hasDraft: boolean;
  readonly items: readonly UiSwitchSummaryItem[];
  /** 未保存标记(会话内;与草稿 store 同源透传) */
  readonly dirty: boolean;
  /** 最近一次成功保存的配方身份与修订(UI-02;null = 本会话未成功保存) */
  readonly saved: { readonly recipeId: string; readonly revision: number } | null;
}

/** 共享草稿 → 只读摘要(纯投影;字段逐一溯源,不发明、不回写) */
export function uiSwitchSummary(draft: ComposeDraftState): UiSwitchSummary {
  return {
    hasDraft: draft.items.length > 0,
    items: draft.items.map((item) => ({
      warehouseItemId: item.warehouseItemId,
      title: item.title,
      nameHint: item.nameHint,
    })),
    dirty: draft.dirty,
    saved: draft.saved,
  };
}
