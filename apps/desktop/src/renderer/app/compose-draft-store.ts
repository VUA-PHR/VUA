import { useEffect, useState } from "react";
import { createSignal } from "../gateway/index.ts";

/**
 * 搭配草稿共享状态(019 批 B,UI-03;桌面域共享容器层):
 * - 项目无关:条目直接来自素材库(warehouseItemId 身份,UI-02 统一对象
 *   身份),无须先创建 Unity 项目;
 * - 会话概念:未提交草稿是客户端会话状态(UI-02 归共享草稿状态=桌面域),
 *   **不进 localStorage**(核心 UI-03 评估:持久化由版本化应用接口
 *   recipe.save 管理,禁止散落 localStorage 充当生产文档库);保存后的
 *   权威事实在 recipe 文档库(recipe.list 读面);
 * - 撤销栈:撤销只回退本地未提交编辑,不反向执行已提交命令(UI-03);
 * - 保存入口(批 B 保存链,core 路由裁定):挂载选择器按 recipe v0.3
 *   entrypointSelector anyOf 由用户输入(catalogEntryId 引用目录条目或
 *   nameHint 用户命名提示)——零词表扩展,recipe.save 原样承载;共享容器
 *   层 signal:跨 UI 根切换保留(UI 根切换不触碰本 store)。
 */

export interface ComposeDraftItem {
  /** 素材身份(UI-02):warehouse 条目 id */
  readonly warehouseItemId: string;
  /** 呈现名(素材事实) */
  readonly title: string;
  /** 素材角色(素材事实;无则 null) */
  readonly role: string | null;
  /** 挂载选择器名称提示(recipe v0.3 anyOf 用户输入;null = 未指定) */
  readonly nameHint: string | null;
  readonly addedAt: string;
}

export interface ComposeDraftState {
  /** 当前草稿条目(加入顺序) */
  readonly items: readonly ComposeDraftItem[];
  /** 撤销栈(本地未提交编辑的历史;不含已提交状态) */
  readonly undoStack: readonly (readonly ComposeDraftItem[])[];
  /** 与最近一次保存的差异标记(会话内;保存接口接入前恒 true——有内容即未保存) */
  readonly dirty: boolean;
}

export const emptyComposeDraft: ComposeDraftState = {
  items: [],
  undoStack: [],
  dirty: false,
};

/** 共享容器层草稿 signal(UI 根切换不触碰) */
const draftSignal = createSignal<ComposeDraftState>(emptyComposeDraft);

/** 纯函数语义的状态转换(共享 signal 落地) */
function apply(next: ComposeDraftState): void {
  draftSignal.set(next);
}

export function useComposeDraft(): ComposeDraftState {
  const [state, setState] = useState(draftSignal.get());
  useEffect(() => {
    const unsubscribe = draftSignal.subscribe((value) => setState(value));
    return () => {
      unsubscribe();
    };
  }, []);
  return state;
}

export function composeAddItemAction(
  item: Omit<ComposeDraftItem, "addedAt">,
): void {
  apply(composeAddItem(draftSignal.get(), item));
}

export function composeRemoveItemAction(warehouseItemId: string): void {
  apply(composeRemoveItem(draftSignal.get(), warehouseItemId));
}

export function composeUndoAction(): void {
  apply(composeUndo(draftSignal.get()));
}

export function composeSavedAction(revision: number): void {
  apply(composeSaved(draftSignal.get(), revision));
}

/* ---- 批 B 保存链:草稿 → recipe v0.3 文档映射(core 路由裁定零词表
 * 扩展;recipe.save 原样承载)。entrypointSelector anyOf:nameHint 用户
 * 命名提示(无目录条目事实时不虚构 catalogEntryId) ---- */

export interface ComposeSaveDocument {
  readonly formatVersion: "0.3";
  readonly recipeId: string;
  readonly baseRevision: number;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly assets: readonly {
    readonly id: string;
    readonly role: string;
    readonly label: string;
    readonly sourceRef: { readonly warehouseItemId: string; readonly role: "original" };
  }[];
  readonly instances: readonly {
    readonly id: string;
    readonly assetId: string;
    readonly entrypoint: {
      readonly selectorId: string;
      readonly kind: "user_named_entrypoint";
      readonly nameHint: string;
    };
    readonly enabled: true;
  }[];
  readonly relations: readonly unknown[];
}

export interface ComposeSaveInput {
  /** 已保存文档的 recipeId(再次保存沿用;首存 = null 由调用方生成) */
  readonly savedRecipeId: string | null;
  /** 已保存文档的 baseRevision(首存 = 0) */
  readonly savedRevision: number;
  readonly items: readonly ComposeDraftItem[];
  readonly now: string;
}

/** 草稿 → recipe v0.3 保存文档(整文档提交;entrypoint=nameHint 用户
 *  命名提示——无 entrypoint 事实时用户命名,系统不虚构);items 空 = null */
export function composeDraftToSaveDocument(
  input: ComposeSaveInput,
): ComposeSaveDocument | null {
  if (input.items.length === 0) return null;
  const now = input.now;
  const recipeId =
    input.savedRecipeId ??
    `0190${(now.replaceAll(/[-:TZ.]/g, "") + "000000").slice(0, 20)}f7`;
  return {
    formatVersion: "0.3",
    recipeId,
    baseRevision: input.savedRevision,
    title: input.items.map((item) => item.title).join(" + "),
    createdAt: now,
    updatedAt: now,
    assets: input.items.map((item) => ({
      id: item.warehouseItemId,
      role: item.role ?? "other",
      label: item.title,
      sourceRef: { warehouseItemId: item.warehouseItemId, role: "original" },
    })),
    instances: input.items.map((item, index) => ({
      id: `${item.warehouseItemId}-instance-${index + 1}`,
      assetId: item.warehouseItemId,
      entrypoint: {
        selectorId: `${item.warehouseItemId}-entrypoint`,
        kind: "user_named_entrypoint",
        nameHint: item.nameHint ?? item.title,
      },
      enabled: true,
    })),
    relations: [],
  };
}

/** 加入素材(身份幂等:同素材重复加入为无操作) */
export function composeAddItem(
  state: ComposeDraftState,
  item: Omit<ComposeDraftItem, "addedAt">,
): ComposeDraftState {
  if (state.items.some((existing) => existing.warehouseItemId === item.warehouseItemId)) {
    return state;
  }
  return {
    items: [...state.items, { ...item, addedAt: new Date().toISOString() }],
    undoStack: [...state.undoStack.slice(-49), state.items],
    dirty: true,
  };
}

/** 移除素材(按身份) */
export function composeRemoveItem(state: ComposeDraftState, warehouseItemId: string): ComposeDraftState {
  if (!state.items.some((existing) => existing.warehouseItemId === warehouseItemId)) {
    return state;
  }
  return {
    items: state.items.filter((existing) => existing.warehouseItemId !== warehouseItemId),
    undoStack: [...state.undoStack.slice(-49), state.items],
    dirty: true,
  };
}

/** 撤销:回退到上一本地编辑前状态;空栈 = 无操作 */
export function composeUndo(state: ComposeDraftState): ComposeDraftState {
  const previous = state.undoStack[state.undoStack.length - 1];
  if (previous === undefined) return state;
  return {
    items: previous,
    undoStack: state.undoStack.slice(0, -1),
    dirty: true,
  };
}

/** 保存成功后的状态对齐(修订号来自服务端回执;脏标记清除) */
export function composeSaved(state: ComposeDraftState, revision: number): ComposeDraftState {
  void revision;
  return { ...state, dirty: false };
}
