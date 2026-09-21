import { useEffect, useRef, useState } from "react";
import type { DesktopGatewayResponseV1 } from "@vua/contracts";
import { createSignal } from "../gateway/index.ts";
import type { ComposeDraftItem } from "./compose-draft-store.ts";
import {
  classifyComposeSaveResult,
  type ComposeSaveState,
} from "./compose-save-chain.ts";
import {
  fetchRecipeCompareCandidates,
  findIdenticalRecipe,
  recipeDocumentCompareKey,
  type IdenticalRecipe,
} from "./compose-save-dedup.ts";
import { recipePersisted } from "./recipe-library-revision.ts";
import { productionChainRecipeSavedAction } from "./production-chain-store.ts";
import {
  recipeDocumentEditAddItem,
  recipeDocumentEditBlocked,
  recipeDocumentEditRemoveAddition,
  recipeDocumentEditSaved,
  recipeDocumentEditSelected,
  recipeDocumentEditToSaveDocument,
  type RecipeDocumentEditState,
} from "../features/recipe/recipe-document-edit-model.ts";

/**
 * 选中配方文档编辑 store(proposal 029 A2 消费切片三):平行文档编辑链的
 * 状态与保存入口——判决书④核对点②落形决策,只钉「同一保存链形状、同一
 * 守卫集」:
 * - 保存线形状与搭配草稿同一(recipe.save v1 + baseRevision 版本链);
 * - 守卫集同一:忙碌守卫(保存进行中重复点击不重复提交,UI-06)、空保存
 *   拒绝(无未保存新增不提交)、可提交性守卫(nameHint 规则同律)、保存前
 *   查重(D5:命中完全一致内容弹确认框,用户确认才提交);
 * - 回执对齐同一:「已保存」只在持久化回执后显示(UI-03/AC-04),失败如实
 *   呈现、内容保留、不自动重试;成功对齐生产链身份(保存回执对齐动作)与
 *   配方文档库失效重取(recipePersisted)——与 compose-save-chain 同源;
 * - 状态是模块级 signal:跨页导航保留会话内未保存编辑(与搭配草稿存续
 *   语义同构);身份相同的选择重取不清空待保存新增(不静默丢弃用户编辑),
 *   身份变更即新编辑会话。
 * 时钟注入(BG-18):now 在命令边界取用。
 */

/** 共享容器层编辑 signal(本会话选中配方;null = 无选中或已清除) */
const editSignal = createSignal<RecipeDocumentEditState | null>(null);

function apply(next: RecipeDocumentEditState | null): void {
  editSignal.set(next);
}

export function useRecipeDocumentEdit(): RecipeDocumentEditState | null {
  const [state, setState] = useState(editSignal.get());
  useEffect(() => {
    const unsubscribe = editSignal.subscribe((value) => setState(value));
    return () => {
      unsubscribe();
    };
  }, []);
  return state;
}

/** 选中事实源对齐(recipe.get 回执驱动;身份相同保留待保存新增,身份变更
 *  即新编辑会话——语义见 recipeDocumentEditSelected) */
export function recipeDocumentEditSelectedAction(
  recipeId: string,
  revision: number,
  document: Record<string, unknown>,
): void {
  apply(recipeDocumentEditSelected(editSignal.get(), recipeId, revision, document));
}

/** 清除编辑态(退出选中态) */
export function recipeDocumentEditClearedAction(): void {
  apply(null);
}

/** 加入待保存新增(时钟注入:action 层命令边界取用) */
export function recipeDocumentEditAddItemAction(item: Omit<ComposeDraftItem, "addedAt">): void {
  const current = editSignal.get();
  if (current === null) return;
  apply(recipeDocumentEditAddItem(current, item, new Date().toISOString()));
}

/** 移除一条待保存新增 */
export function recipeDocumentEditRemoveAdditionAction(warehouseItemId: string): void {
  const current = editSignal.get();
  if (current === null) return;
  apply(recipeDocumentEditRemoveAddition(current, warehouseItemId));
}

/** 保存回执对齐(submittedAdditions 语义见 recipeDocumentEditSaved;无编辑
 *  态时无操作返回 false) */
export function recipeDocumentEditSavedAction(
  revision: number,
  submittedAdditions?: readonly ComposeDraftItem[],
): boolean {
  const current = editSignal.get();
  if (current === null) return false;
  apply(recipeDocumentEditSaved(current, revision, submittedAdditions));
  return true;
}

/** 保存回执分类复用搭配草稿同一分类器(类型别名:同一回执面) */
export type RecipeDocumentSaveState = ComposeSaveState;

/** 文档编辑保存链 hook(与 useComposeSave 同一线形状、同一守卫集;D5 查重
 *  命中确认框由本 hook 承载):
 * - 提交文档在提交时刻按当下编辑态重建(确认框打开期间的新增诚实取当下,
 *   与 confirmDuplicateSave 同律);
 * - 查重比对键 = 将要保存的合并文档内容(compose-save-dedup 同一比对面);
 * - 成功对齐三件:编辑态回执对齐 + 生产链身份(保存回执对齐)+ 文档库失效
 *   重取;失败如实落 failed,待保存新增与 dirty 原样保留。 */
export function useRecipeDocumentSave(): {
  readonly saveState: RecipeDocumentSaveState;
  /** 查重命中待确认的既有配方身份(D5;null = 无命中,不弹确认框) */
  readonly duplicate: IdenticalRecipe | null;
  /** 保存入口:先查重后提交(命中→弹确认框等用户裁决;否则直存) */
  readonly saveEdit: () => void;
  /** 确认「仍保存为新修订」(D5 确认框;用户显式确认后才提交) */
  readonly confirmDuplicateSave: () => void;
  /** 取消查重命中(不提交,回到 idle) */
  readonly cancelDuplicateSave: () => void;
} {
  const [saveState, setSaveState] = useState<RecipeDocumentSaveState>("idle");
  const [duplicate, setDuplicate] = useState<IdenticalRecipe | null>(null);
  const busyRef = useRef(false);

  const submitSave = (state: RecipeDocumentEditState) => {
    const submittedAdditions = state.additions;
    const document = recipeDocumentEditToSaveDocument(state, new Date().toISOString());
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
          recipeDocument: document,
          baseRevision: state.baseRevision,
        },
      })
      .then((result: DesktopGatewayResponseV1) => {
        const outcome = classifyComposeSaveResult(result);
        if (outcome.kind === "failed") {
          // 失败如实呈现:待保存新增与 dirty 保留,重试由用户发起(UI-03/06)
          setSaveState("failed");
          return;
        }
        setSaveState("idle");
        recipeDocumentEditSavedAction(outcome.revision, submittedAdditions);
        // 保存回执对齐:配方身份同步入生产链 + 文档库失效重取(新修订入库
        // 即见,选中态详情随 persistedRevision 重取)
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

  const saveEdit = () => {
    if (busyRef.current) return;
    const state = editSignal.get();
    if (state === null || !state.dirty) return;
    if (recipeDocumentEditBlocked(state.additions)) return;
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
        // 比对「将要保存的内容」:按当下编辑态重建合并文档取判等键
        const merged = recipeDocumentEditToSaveDocument(editSignal.get() ?? state, new Date().toISOString());
        const key = merged === null ? null : recipeDocumentCompareKey(merged);
        const hit =
          key === null ? null : findIdenticalRecipe(key, candidates);
        if (hit === null) {
          // 无命中:照常直存(D5 主路径)
          submitSave(editSignal.get() ?? state);
          return;
        }
        // 命中:弹确认框等用户裁决;busy 持有至确认/取消
        setDuplicate(hit);
        setSaveState("idle");
      })
      .catch(() => {
        // 查重装配自身异常也不阻塞保存(诚实降级;装配层已吞读失败,此处兜底)
        submitSave(editSignal.get() ?? state);
      });
  };

  const confirmDuplicateSave = () => {
    if (duplicate === null) return;
    setDuplicate(null);
    // 确认时以当下编辑态重建文档(对话框打开期间新增可能变化;诚实取当下)
    const state = editSignal.get();
    if (state === null || !state.dirty) {
      busyRef.current = false;
      return;
    }
    submitSave(state);
  };

  const cancelDuplicateSave = () => {
    if (duplicate === null) return;
    setDuplicate(null);
    setSaveState("idle");
    busyRef.current = false;
  };

  return { saveState, duplicate, saveEdit, confirmDuplicateSave, cancelDuplicateSave };
}
