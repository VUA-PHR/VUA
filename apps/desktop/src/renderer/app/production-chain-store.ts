import { useEffect, useState } from "react";
import { createSignal } from "../gateway/index.ts";

/**
 * 生产链共享状态(019 批 C,需求 §5 Production 分组;桌面域共享容器层):
 * - 链身份即对象身份(UI-02):配方身份来自保存回执、解析/装配任务身份来自
 *   受理回执、记录身份按本链计划身份匹配——不靠名称、数组位置或固定示例;
 * - 会话概念:链推进状态在容器层 signal,跨 UI 根切换保留(UI-01/UI-05);
 *   两套 UI 消费同一 store 与同一 Gateway 端口(批 C 验收:共用生产链);
 * - 请求状态(UI-06):requesting=待提交/提交中,accepted=已受理——「已受理」
 *   永不显示为「执行成功」;任务进度以任务中心权威快照为准(UI-07),本
 *   store 不产生本地计时成功;
 * - 旧计划失效(AC-05):草稿内容偏离已保存修订(dirty)即视为旧授权——
 *   gate 派生函数给出警示与推进禁用判定,服务端版本锁守卫仍独立拒绝。
 *
 * 计划列表/记录列表是查询结果缓存(UI-02:缓存只是已取得事实的副本),
 * 由各 UI 适配层按需拉取,不进容器层;容器层只承载跨 UI 必须保留的身份。
 */

/** 计划状态词表(production-use-case v0.2 PlanStatusV02 镜像) */
export type ChainPlanStatus = "draft" | "approved" | "superseded";

/** 请求推进状态(UI-06:待提交/提交中/已受理/失败四态;idle=未开始) */
export type ChainRequestState =
  | { readonly kind: "idle" }
  | { readonly kind: "requesting" }
  | {
      readonly kind: "accepted";
      /** 任务身份(任务中心权威快照的关联键;跨 UI 根保留) */
      readonly taskId: string;
      readonly correlationId: string;
    }
  | { readonly kind: "failed" };

/** 装配受理额外携带本链计划身份(记录按它匹配——AC-13 身份链) */
export type ChainExecuteState =
  | { readonly kind: "idle" }
  | { readonly kind: "requesting" }
  | {
      readonly kind: "accepted";
      readonly taskId: string;
      readonly correlationId: string;
      readonly planId: string;
    }
  | { readonly kind: "failed" };

export interface ProductionChainState {
  /** 链上配方身份(保存回执同步;null=本会话尚无保存事实) */
  readonly recipe: { readonly recipeId: string; readonly revision: number } | null;
  /** 解析(recipe.resolve)受理状态 */
  readonly resolve: ChainRequestState;
  /** 装配(job.execute)受理状态;accepted 携带执行所用的计划身份 */
  readonly execute: ChainExecuteState;
  /** 本链构建记录身份(record.list 按执行计划身份匹配发现;null=尚未发现) */
  readonly buildId: string | null;
}

export const emptyProductionChain: ProductionChainState = {
  recipe: null,
  resolve: { kind: "idle" },
  execute: { kind: "idle" },
  buildId: null,
};

/** 共享容器层链 signal(UI 根切换不触碰) */
const chainSignal = createSignal<ProductionChainState>(emptyProductionChain);

function apply(next: ProductionChainState): void {
  chainSignal.set(next);
}

/** 订阅 hook(共享容器层状态;两套 UI 消费同一实例) */
export function useProductionChain(): ProductionChainState {
  const [state, setState] = useState(chainSignal.get());
  useEffect(() => {
    const unsubscribe = chainSignal.subscribe((value) => setState(value));
    return () => {
      unsubscribe();
    };
  }, []);
  return state;
}

/* ---- 动作(全部由服务端回执/显式用户意图驱动;不从猜测出发) ---- */

/** 保存回执对齐:配方身份入链(与 compose-draft-store 的 saved 同步自同一
 *  服务端回执;新修订覆盖旧链身份——旧计划失效判定随之由 gate 派生) */
export function productionChainRecipeSavedAction(recipeId: string, revision: number): void {
  apply({
    ...chainSignal.get(),
    recipe: { recipeId, revision },
  });
}

export function productionChainResolveRequestedAction(): void {
  apply({ ...chainSignal.get(), resolve: { kind: "requesting" } });
}

export function productionChainResolveAcceptedAction(taskId: string, correlationId: string): void {
  apply({ ...chainSignal.get(), resolve: { kind: "accepted", taskId, correlationId } });
}

export function productionChainResolveFailedAction(): void {
  apply({ ...chainSignal.get(), resolve: { kind: "failed" } });
}

export function productionChainExecuteRequestedAction(): void {
  apply({ ...chainSignal.get(), execute: { kind: "requesting" } });
}

export function productionChainExecuteAcceptedAction(
  taskId: string,
  correlationId: string,
  planId: string,
): void {
  apply({
    ...chainSignal.get(),
    execute: { kind: "accepted", taskId, correlationId, planId },
  });
}

export function productionChainExecuteFailedAction(): void {
  apply({ ...chainSignal.get(), execute: { kind: "failed" } });
}

/** 本链记录发现(记录列表按执行计划身份匹配后登记;幂等) */
export function productionChainRecordSeenAction(buildId: string): void {
  if (chainSignal.get().buildId === buildId) return;
  apply({ ...chainSignal.get(), buildId });
}

/* ---- AC-05 派生:链推进闸门 ---- */

/**
 * 链推进闸门(AC-05;纯派生,不改状态):
 * - no-recipe:无已保存配方——链未开始;
 * - stale-draft:草稿内容偏离已保存修订——既有计划视为旧授权,呈现警示并
 *   禁用推进(解析应基于保存后的文档;服务端版本锁守卫独立拒绝旧授权);
 * - ready:链可推进。
 */
export type ProductionChainGate =
  | { readonly kind: "no-recipe" }
  | { readonly kind: "stale-draft" }
  | { readonly kind: "ready" };

export function productionChainGate(
  chain: ProductionChainState,
  draftDirty: boolean,
): ProductionChainGate {
  if (chain.recipe === null) return { kind: "no-recipe" };
  return draftDirty ? { kind: "stale-draft" } : { kind: "ready" };
}

/* ---- 纯函数语义(测试锚定;action 落地同一转换) ---- */

export function productionChainRecipeSaved(
  state: ProductionChainState,
  recipeId: string,
  revision: number,
): ProductionChainState {
  return { ...state, recipe: { recipeId, revision } };
}

export function productionChainResolveAccepted(
  state: ProductionChainState,
  taskId: string,
  correlationId: string,
): ProductionChainState {
  return { ...state, resolve: { kind: "accepted", taskId, correlationId } };
}

export function productionChainExecuteAccepted(
  state: ProductionChainState,
  taskId: string,
  correlationId: string,
  planId: string,
): ProductionChainState {
  return { ...state, execute: { kind: "accepted", taskId, correlationId, planId } };
}
