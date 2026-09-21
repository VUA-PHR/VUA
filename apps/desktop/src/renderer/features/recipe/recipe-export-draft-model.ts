import type { RecipeProjectDraft } from "../../gateway/index.ts";
import type { ComposeDraftItem, ComposeSaveDocument } from "../../app/compose-draft-store.ts";
import { composeDraftToSaveDocument } from "../../app/compose-draft-store.ts";
import { composeSaveBlocked } from "../../app/compose-save-chain.ts";

/**
 * 项目导出草稿确认流纯模型(proposal 029 B 面环 4 桌面消费批):消费
 * recipe-export v0.1 冻结词表的「配方草稿」——草稿无 recipeId/title/关系面
 * /locked 块(冻结 Schema additionalProperties:false = 类型级事实),转正
 * 唯一通道 = 用户显式补全确认后的既有 recipe.save 保存链(与切片三编辑链
 * 同构:同一保存链形状、同一守卫集;本模型只持确认会话状态与文档构造)。
 *
 * 诚实边界(诚实律 1/2):
 * - 草稿六事实键只呈现不修饰:依赖行 verbatim(packageId/版本约束/同 id
 *   锁定钉定)、环境版本 verbatim、身份三态 verbatim、缺失清单照单渲染——
 *   导出不宣称还原设计意图,缺失维度清单就是「缺什么」的诚实答案;
 * - 标题:草稿没有 title,由用户显式补全(recipe v0.3 title 1..120);
 *   projectName 可空,预填系呈现决策(冻结 Schema description 明示归桌面),
 *   预填时如实标注来源并可自由修改;
 * - 环境约束:盘上观察 verbatim 不迁移;null(不可读)时由用户显式补全
 *   (recipe v0.3 environment.unityVersionConstraint 必填非空,系统绝不
 *   代填),对应缺失清单 environmentUnityVersion 维度;
 * - 素材:草稿零关系面(案 B 零桥接裁决),recipe v0.3 assets/instances
 *   minItems 1 = 诚实的空骨架不能作为配方存在——转正前用户经仓储读面
 *   投影选择器(与 A2 同一面)显式加入至少一条素材;
 * - 依赖:声明集 verbatim 转入配方文档 dependencies(packageId +
 *   versionConstraint);lockedVersion 是盘上观察事实,配方文档的 locked 块
 *   由保存/解析链权威铸造,草稿绝不伪造 locked 块,锁定钉定只作呈现;
 * - 时钟注入(BG-18):now 必填,真实时钟由调用层在命令边界取用。
 */

/** 转正确认会话状态(弹窗局部;草稿身份 draftId 只作呈现,不入保存链) */
export interface RecipeExportConfirmState {
  readonly draft: RecipeProjectDraft;
  /** 用户补全的标题(草稿无 title;预填自 projectName 时注明来源) */
  readonly title: string;
  /** 环境约束可读 = null(verbatim 只呈现);不可读 = 用户补全输入 */
  readonly unityConstraintInput: string | null;
  /** 待保存素材(与 A2 同一选择器与同一映射;草稿零关系面,无双层守卫底稿) */
  readonly additions: readonly ComposeDraftItem[];
}

/** 导出回执进入确认会话(projectName 非空时预填标题并保留预填来源标注) */
export function recipeExportConfirmOpened(draft: RecipeProjectDraft): RecipeExportConfirmState {
  return {
    draft,
    title: draft.origin.projectName ?? "",
    unityConstraintInput: null,
    additions: [],
  };
}

/** 标题编辑(用户显式补全;不自动裁剪——守卫对空白如实阻止) */
export function recipeExportTitleEdited(
  state: RecipeExportConfirmState,
  title: string,
): RecipeExportConfirmState {
  return { ...state, title };
}

/** 环境约束补全输入(仅在盘上观察不可读时存在;可读 = verbatim 呈现不可编) */
export function recipeExportUnityConstraintEdited(
  state: RecipeExportConfirmState,
  text: string,
): RecipeExportConfirmState {
  if (state.draft.environment.unityVersionConstraint !== null) return state;
  return { ...state, unityConstraintInput: text.length > 0 ? text : null };
}

/** 加入待保存素材(身份幂等:重复加入为无操作;D3 同律:未指定 nameHint
 *  即派生为条目 displayName) */
export function recipeExportAddItem(
  state: RecipeExportConfirmState,
  item: Omit<ComposeDraftItem, "addedAt">,
  now: string,
): RecipeExportConfirmState {
  if (state.additions.some((existing) => existing.warehouseItemId === item.warehouseItemId)) {
    return state;
  }
  const nameHint =
    item.nameHint !== null && item.nameHint.trim() !== "" ? item.nameHint : item.title;
  return {
    ...state,
    additions: [...state.additions, { ...item, nameHint, addedAt: now }],
  };
}

/** 移除一条待保存素材(本地未保存编辑,不触任何已保存事实) */
export function recipeExportRemoveAddition(
  state: RecipeExportConfirmState,
  warehouseItemId: string,
): RecipeExportConfirmState {
  if (!state.additions.some((existing) => existing.warehouseItemId === warehouseItemId)) {
    return state;
  }
  return {
    ...state,
    additions: state.additions.filter(
      (existing) => existing.warehouseItemId !== warehouseItemId,
    ),
  };
}

const RECIPE_TITLE_MAX = 120;
const UNITY_CONSTRAINT_MAX = 120;

/** 可保存性守卫(与搭配草稿同一规则集的组合,零新守卫语义):
 * - 标题必填且 ≤ 120(recipe v0.3 title 词面);
 * - 草稿环境约束不可读时用户补全必填且 ≤ 120(environment 词面);
 * - 至少一条素材(recipe v0.3 assets/instances minItems 1——诚实的空骨架
 *   不能作为配方存在);
 * - 挂载名守卫同律(composeSaveBlocked:任一空白即不可提交)。 */
export function recipeExportSaveBlocked(state: RecipeExportConfirmState): boolean {
  const title = state.title.trim();
  if (title.length === 0 || title.length > RECIPE_TITLE_MAX) return true;
  const constraint = state.draft.environment.unityVersionConstraint;
  if (constraint === null) {
    const input = (state.unityConstraintInput ?? "").trim();
    if (input.length === 0 || input.length > UNITY_CONSTRAINT_MAX) return true;
  }
  if (state.additions.length === 0) return true;
  return composeSaveBlocked(state.additions);
}

/** 确认会话 → recipe.save 提交文档(与搭配草稿同一构造器同形状:formatVersion
 *  0.3 + 同一 recipeId 铸造约定 + 同一 asset/instance 映射 + relations 空)——
 *  在此之上 verbatim 转入草稿自带的两维可靠事实:
 * - title = 用户补全标题(草稿无 title,绝不由系统派生);
 * - environment.unityVersionConstraint = 盘上观察 verbatim;不可读时 = 用户
 *   补全输入(守卫保证非空);
 * - dependencies = 声明集 verbatim(packageId + versionConstraint);
 *   lockedVersion 不入文档(锁定块由保存/解析链权威铸造,草稿不伪造)。
 * 守卫未过 = null(空保存拒绝,与编辑链同一语义)。 */
export function recipeExportDraftToSaveDocument(
  state: RecipeExportConfirmState,
  now: string,
): (ComposeSaveDocument & {
  readonly environment: { readonly unityVersionConstraint: string };
  readonly dependencies: readonly {
    readonly packageId: string;
    readonly versionConstraint: string;
  }[];
}) | null {
  if (recipeExportSaveBlocked(state)) return null;
  const base = composeDraftToSaveDocument({
    savedRecipeId: null,
    savedRevision: 0,
    items: state.additions,
    now,
  });
  if (base === null) return null;
  const constraint = state.draft.environment.unityVersionConstraint;
  return {
    ...base,
    title: state.title.trim(),
    environment: {
      unityVersionConstraint: constraint ?? (state.unityConstraintInput ?? "").trim(),
    },
    dependencies: state.draft.dependencies.map((row) => ({
      packageId: row.packageId,
      versionConstraint: row.versionConstraint,
    })),
  };
}
