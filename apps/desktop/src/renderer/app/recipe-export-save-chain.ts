import { useRef, useState } from "react";
import type { DesktopGatewayResponseV1 } from "@vua/contracts";
import {
  classifyComposeSaveResult,
  type ComposeSaveState,
} from "./compose-save-chain.ts";
import {
  composeDraftCompareKey,
  fetchRecipeCompareCandidates,
  findIdenticalRecipe,
  type IdenticalRecipe,
} from "./compose-save-dedup.ts";
import { recipePersisted } from "./recipe-library-revision.ts";
import { productionChainRecipeSavedAction } from "./production-chain-store.ts";
import {
  recipeExportDraftToSaveDocument,
  type RecipeExportConfirmState,
} from "../features/recipe/recipe-export-draft-model.ts";

/**
 * 项目导出草稿转正保存链 hook(proposal 029 B 面环 4 桌面消费批):与
 * useComposeSave / useRecipeDocumentSave 同一线形状、同一守卫集(判决书
 * 只钉「同一保存链形状、同一守卫集」,转正是用户显式确认后的既有保存链,
 * 绝不静默):
 * - 保存线形状:recipe.save v1,首存 baseRevision 0(无既有修订);
 * - 守卫集同一:忙碌守卫(UI-06)、空保存拒绝(守卫未过 = 不提交)、可提交
 *   性守卫(标题/环境补全/至少一条素材/挂载名同律)、保存前查重(D5:比对
 *   键 = 将要保存的素材集——composeDraftCompareKey 同一比对面;命中弹同一
 *   确认框,用户确认才提交);
 * - 回执对齐同一:「已保存」只在持久化回执后显示(UI-03/AC-04),失败如实
 *   呈现、确认会话内容保留、不自动重试;成功对齐生产链身份
 *   (productionChainRecipeSavedAction)与配方文档库失效重取(recipePersisted)
 *   ——与两条既有保存链同源;
 * - 状态是本弹窗呈现层局部(确认会话随弹窗存续),权威身份在服务端保存链。
 * 时钟注入(BG-18):now 在命令边界取用。
 */

export type RecipeExportSaveState = ComposeSaveState;

/** 转正保存链 hook(state 为当前确认会话;null = 弹窗未进入确认段) */
export function useRecipeExportSave(
  state: RecipeExportConfirmState | null,
): {
  readonly saveState: RecipeExportSaveState;
  /** 持久化回执(「已保存」只在回执后呈现:UI-03/AC-04;null = 本会话尚无
   *  保存回执) */
  readonly savedReceipt: { readonly recipeId: string; readonly revision: number } | null;
  /** 查重命中待确认的既有配方身份(D5;null = 无命中,不弹确认框) */
  readonly duplicate: IdenticalRecipe | null;
  /** 保存入口:先查重后提交(命中→弹确认框等用户裁决;否则直存) */
  readonly saveRecipe: () => void;
  /** 确认「仍保存为新配方」(D5 确认框;用户显式确认后才提交) */
  readonly confirmDuplicateSave: () => void;
  /** 取消查重命中(不提交,回到 idle) */
  readonly cancelDuplicateSave: () => void;
} {
  const [saveState, setSaveState] = useState<RecipeExportSaveState>("idle");
  const [savedReceipt, setSavedReceipt] = useState<{ readonly recipeId: string; readonly revision: number } | null>(null);
  const [duplicate, setDuplicate] = useState<IdenticalRecipe | null>(null);
  const busyRef = useRef(false);
  const stateRef = useRef<RecipeExportConfirmState | null>(state);
  stateRef.current = state;

  const submitSave = (session: RecipeExportConfirmState) => {
    const document = recipeExportDraftToSaveDocument(session, new Date().toISOString());
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
          baseRevision: 0,
        },
      })
      .then((result: DesktopGatewayResponseV1) => {
        const outcome = classifyComposeSaveResult(result);
        if (outcome.kind === "failed") {
          // 失败如实呈现:确认会话内容保留,重试由用户发起(UI-03/06)
          setSaveState("failed");
          return;
        }
        setSaveState("idle");
        // 保存回执对齐:配方身份同步入生产链 + 文档库失效重取(与两条既有
        // 保存链同源;草稿转正后由服务端身份接续,弹窗凭回执呈现「已保存」)
        setSavedReceipt({ recipeId: outcome.recipeId, revision: outcome.revision });
        productionChainRecipeSavedAction(outcome.recipeId, outcome.revision);
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

  const saveRecipe = () => {
    if (busyRef.current) return;
    const session = stateRef.current;
    if (session === null || recipeExportDraftToSaveDocument(session, new Date().toISOString()) === null) {
      return;
    }
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
        const current = stateRef.current;
        if (current === null || recipeExportDraftToSaveDocument(current, new Date().toISOString()) === null) {
          busyRef.current = false;
          setSaveState("idle");
          return;
        }
        // 比对「将要保存的内容」:素材集判等键与搭配草稿同一比对面
        const hit = findIdenticalRecipe(composeDraftCompareKey(current.additions), candidates);
        if (hit === null) {
          // 无命中:照常直存(D5 主路径)
          submitSave(current);
          return;
        }
        // 命中:弹确认框等用户裁决;busy 持有至确认/取消
        setDuplicate(hit);
        setSaveState("idle");
      })
      .catch(() => {
        // 查重装配自身异常也不阻塞保存(诚实降级;装配层已吞读失败,此处兜底)
        const current = stateRef.current;
        if (current !== null) submitSave(current);
        else {
          busyRef.current = false;
          setSaveState("idle");
        }
      });
  };

  const confirmDuplicateSave = () => {
    if (duplicate === null) return;
    setDuplicate(null);
    // 确认时以当下确认会话重建文档(对话框打开期间可能被编辑;诚实取当下)
    const current = stateRef.current;
    if (current === null || recipeExportDraftToSaveDocument(current, new Date().toISOString()) === null) {
      busyRef.current = false;
      return;
    }
    submitSave(current);
  };

  const cancelDuplicateSave = () => {
    if (duplicate === null) return;
    setDuplicate(null);
    setSaveState("idle");
    busyRef.current = false;
  };

  return { saveState, savedReceipt, duplicate, saveRecipe, confirmDuplicateSave, cancelDuplicateSave };
}
