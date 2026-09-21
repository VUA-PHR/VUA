import { recipePersisted } from "./recipe-library-revision.ts";
import { useRef, useState } from "react";
import type { DesktopGatewayResponseV1 } from "@vua/contracts";
import {
  composeDraftToSaveDocument,
  composeSavedAction,
  useComposeDraft,
  type ComposeDraftState,
} from "./compose-draft-store.ts";
import {
  composeDraftCompareKey,
  fetchRecipeCompareCandidates,
  findIdenticalRecipe,
  type IdenticalRecipe,
} from "./compose-save-dedup.ts";
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
 * - 保存前查重(D5,用户裁定 2026-09-20「点 N 次存 N 版应先查重询问」):
 *   提交前先用配方文档库既有列表(recipe.list 读面,已在库)比对草稿内容
 *   (素材集合＋挂载名等可判等字段,compose-save-dedup);完全一致→弹确认
 *   框(duplicate 身份供展示),用户确认才提交新修订;不一致→照常直存;
 *   列表不可得/为空→诚实降级照常保存,不阻塞;
 * - 成功对齐双 store:composeSavedAction(脏标记清除+saved 身份)+
 *   productionChainRecipeSavedAction(链推进入口启用)——与服务端同一
 *   回执对齐,跨 UI 根保留(UI-01/UI-05);保存回执落容器层不随卸载取消,
 *   切换 UI 不丢保存结果。
 * 时钟注入(BG-18):now 在命令边界取用。
 */

/** 保存请求状态(idle=未开始/checking=查重中/saving=提交中/failed=失败
 *  如实呈现) */
export type ComposeSaveState = "idle" | "checking" | "saving" | "failed";

/** 保存可提交性(纯函数):任一条目 nameHint 为空白即不可提交——挂载
 *  选择器用户命名提示是 recipe.save 词表的必填面,两套 UI 同一规则。
 *  D3(用户裁定 2026-09-20):加入草稿时挂载名称已自动派生自条目
 *  displayName(composeAddItem),自动填充值非空白——校验对自动填充值恒过;
 *  仅当用户显式清空输入框(null/空白)时如实阻止。 */
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
  if (result.value === null || typeof result.value !== "object") return { kind: "failed" };
  const payload = result.value as { recipeId?: unknown; revision?: unknown };
  const recipeId = typeof payload.recipeId === "string" ? payload.recipeId : null;
  const revision = typeof payload.revision === "number" ? payload.revision : null;
  if (!recipeId || revision === null || !Number.isSafeInteger(revision) || revision < 1) return { kind: "failed" };
  return { kind: "saved", recipeId, revision };
}

/** 共享保存链(两套 UI 消费同一实例逻辑;状态是本 UI 呈现层局部,
 *  权威身份在容器层 store) */
export function useComposeSave(): {
  readonly saveState: ComposeSaveState;
  /** 查重命中待确认的既有配方身份(D5;null = 无命中,不弹确认框) */
  readonly duplicate: IdenticalRecipe | null;
  /** 保存入口:先查重后提交(命中→弹确认框等用户裁决;否则直存) */
  readonly saveDraft: () => void;
  /** 确认「仍保存为新修订」(D5 确认框;用户显式确认后才提交) */
  readonly confirmDuplicateSave: () => void;
  /** 取消查重命中(不提交,回到 idle) */
  readonly cancelDuplicateSave: () => void;
} {
  const draft = useComposeDraft();
  const [saveState, setSaveState] = useState<ComposeSaveState>("idle");
  const [duplicate, setDuplicate] = useState<IdenticalRecipe | null>(null);
  const busyRef = useRef(false);

  /** 实际提交(查重通过或用户确认后;忙碌守卫由调用方持有) */
  const submitSave = (items: ComposeDraftState["items"], saved: ComposeDraftState["saved"]) => {
    const document = composeDraftToSaveDocument({
      savedRecipeId: saved?.recipeId ?? null,
      savedRevision: saved?.revision ?? 0,
      items,
      now: new Date().toISOString(),
    });
    if (document === null) {
      busyRef.current = false;
      setSaveState("idle");
      return;
    }
    const api = window.vua?.gateway;
    if (!api) {
      busyRef.current = false;
      setSaveState("failed");
      return;
    }
    setSaveState("saving");
    void api.invoke({
        schemaVersion: 1,
        requestId: crypto.randomUUID(),
        method: "recipe.save",
        params: {
          recipeDocument: document as unknown as Record<string, unknown>,
          baseRevision: saved?.revision ?? 0,
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
        if (composeSavedAction(outcome.recipeId, outcome.revision, items)) {
          productionChainRecipeSavedAction(outcome.recipeId, outcome.revision);
        }
        recipePersisted();
      })
      .catch(() => {
        // 传输异常也是失败:如实落 failed,不悬挂在「保存中」(UI-06/08)
        setSaveState("failed");
      })
      .finally(() => {
        busyRef.current = false;
      });
  };

  const saveDraft = () => {
    if (busyRef.current) return;
    if (draft.items.length === 0) return;
    if (composeSaveBlocked(draft.items)) return;
    const items = draft.items;
    const saved = draft.saved;
    busyRef.current = true;
    setDuplicate(null);
    setSaveState("checking");
    void fetchRecipeCompareCandidates((request) => {
      const api = window.vua?.gateway;
      if (api === undefined) {
        // 宿主面缺席:文档库不可得→诚实降级(空候选=直存路径),不阻塞
        return Promise.resolve({
          schemaVersion: 1,
          requestId: request.requestId,
          ok: false,
          error: { code: "internal", messageKey: "vua_internal" },
        } as DesktopGatewayResponseV1);
      }
      return api.invoke(request);
    })
      .then((candidates) => {
        const hit = findIdenticalRecipe(composeDraftCompareKey(items), candidates);
        if (hit === null) {
          // 无命中:照常直存(D5 主路径)
          submitSave(items, saved);
          return;
        }
        // 命中:弹确认框等用户裁决;busy 持有至确认/取消
        setDuplicate(hit);
        setSaveState("idle");
      })
      .catch(() => {
        // 查重装配自身异常也不阻塞保存(诚实降级;装配层已吞读失败,此处兜底)
        submitSave(items, saved);
      });
  };

  const confirmDuplicateSave = () => {
    if (duplicate === null) return;
    setDuplicate(null);
    // 确认时以当前草稿重建文档(对话框打开期间草稿可能被编辑;诚实取当下)
    submitSave(draft.items, draft.saved);
  };

  const cancelDuplicateSave = () => {
    if (duplicate === null) return;
    setDuplicate(null);
    setSaveState("idle");
    busyRef.current = false;
  };

  return { saveState, duplicate, saveDraft, confirmDuplicateSave, cancelDuplicateSave };
}
