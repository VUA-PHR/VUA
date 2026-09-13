import { useRef, useState } from "react";
import type { DesktopGatewayResponseV1 } from "@vua/contracts";
import {
  composeDraftToSaveDocument,
  composeSavedAction,
  useComposeDraft,
  type ComposeDraftState,
} from "./compose-draft-store.ts";
import { productionChainRecipeSavedAction } from "./production-chain-store.ts";

/**
 * 搭配保存链共享 hook(019 批 D D-3,§5 Drafts 分组「保存反馈」;桌面域
 * 共享容器层):自现有 UI 搭配页(批 B 保存链)原样提取,两套 UI 消费同一
 * 保存链——同一线形状(recipe.save v1)、同一守卫、同一回执对齐,不存在
 * 各 UI 自带的第二套保存逻辑(AC-01/AC-04 一致事实)。
 *
 * - 忙碌守卫:保存进行中重复点击不重复提交(UI-06/AC-06);
 * - 空草稿不提交(文档映射返回 null 即无操作);
 * - 「已保存」只在持久化回执后显示(UI-03/AC-04):失败/不可解释回执/
 *   传输异常一律落入 failed——内容保留、未保存标记不动、不自动重试,
 *   重试由用户显式发起;
 * - 成功对齐双 store:composeSavedAction(脏标记清除+saved 身份)+
 *   productionChainRecipeSavedAction(链推进入口启用)——与服务端同一
 *   回执对齐,跨 UI 根保留(UI-01/UI-05);保存回执落容器层不随卸载取消,
 *   切换 UI 不丢保存结果。
 * 时钟注入(BG-18):now 在命令边界取用。
 */

/** 保存请求状态(idle=未开始/saving=提交中/failed=失败如实呈现) */
export type ComposeSaveState = "idle" | "saving" | "failed";

/** 保存可提交性(纯函数):任一条目 nameHint 为空白即不可提交——挂载
 *  选择器用户命名提示是 recipe.save 词表的必填面,两套 UI 同一规则。 */
export function composeSaveBlocked(items: ComposeDraftState["items"]): boolean {
  return items.some((item) => (item.nameHint ?? "").trim() === "");
}

/** recipe.save 回执分类(纯函数;UI-06 诚实边界):ok 回执且载荷可解释
 *  (recipeId 字符串+revision 数值)才落 saved;不可解释如实失败,不猜测。 */
export type ComposeSaveResult =
  | { readonly kind: "saved"; readonly recipeId: string; readonly revision: number }
  | { readonly kind: "failed" };

export function classifyComposeSaveResult(result: DesktopGatewayResponseV1): ComposeSaveResult {
  if (!result.ok) return { kind: "failed" };
  const payload = result.value as { recipeId?: unknown; revision?: unknown };
  const recipeId = typeof payload.recipeId === "string" ? payload.recipeId : null;
  const revision = typeof payload.revision === "number" ? payload.revision : null;
  if (recipeId === null || revision === null) return { kind: "failed" };
  return { kind: "saved", recipeId, revision };
}

/** 共享保存链(两套 UI 消费同一实例逻辑;状态是本 UI 呈现层局部,
 *  权威身份在容器层 store) */
export function useComposeSave(): {
  readonly saveState: ComposeSaveState;
  readonly saveDraft: () => void;
} {
  const draft = useComposeDraft();
  const [saveState, setSaveState] = useState<ComposeSaveState>("idle");
  const savingRef = useRef(false);

  const saveDraft = () => {
    if (savingRef.current) return;
    const document = composeDraftToSaveDocument({
      savedRecipeId: draft.saved?.recipeId ?? null,
      savedRevision: draft.saved?.revision ?? 0,
      items: draft.items,
      now: new Date().toISOString(),
    });
    if (document === null) return;
    savingRef.current = true;
    setSaveState("saving");
    void window.vua?.gateway
      .invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "recipe.save",
        params: {
          recipeDocument: document as unknown as Record<string, unknown>,
          baseRevision: draft.saved?.revision ?? 0,
        },
      })
      .then((result) => {
        const outcome = classifyComposeSaveResult(result);
        if (outcome.kind === "failed") {
          // 失败如实呈现:保留内容与未保存标记,重试由用户发起(UI-03/06)
          setSaveState("failed");
          return;
        }
        setSaveState("idle");
        // 保存对齐:脏标记清除＋saved 身份入容器层;配方身份同步入生产链
        composeSavedAction(outcome.recipeId, outcome.revision);
        productionChainRecipeSavedAction(outcome.recipeId, outcome.revision);
      })
      .catch(() => {
        // 传输异常也是失败:如实落 failed,不悬挂在「保存中」(UI-06/08)
        setSaveState("failed");
      })
      .finally(() => {
        savingRef.current = false;
      });
  };

  return { saveState, saveDraft };
}
