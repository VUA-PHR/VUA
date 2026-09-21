import type { ComposeDraftItem } from "../../app/compose-draft-store.ts";
import { composeSaveBlocked } from "../../app/compose-save-chain.ts";

/**
 * 选中配方文档编辑链纯模型(proposal 029 A2 消费切片三,判决书④核对点②
 * 落形决策):文档编辑链与项目无关搭配草稿链各自独立状态(平行文档编辑
 * 链),判决书只钉「同一保存链形状、同一守卫集」——保存线形状(recipe.save
 * v1:baseRevision 版本链)、忙碌守卫、保存前查重(D5)、回执分类与对齐全
 * 律照旧(复用 compose-save-chain/compose-save-dedup 的同源纯函数)。
 *
 * 诚实边界(诚实律 1/2):
 * - 待保存新增只存在于本编辑状态,文档三视图仍呈现 recipe.get 回执的已
 *   保存事实——严禁本地直改文档呈现为已保存;「已保存」仅在持久化回执后
 *   显示(新增列表与已保存事实分开呈现);
 * - 保存合并以 recipe.get 回执文档本体为透明底稿:保留底稿全部字段(标题/
 *   createdAt/未知字段原样透传),只追加 assets/instances 并刷新 updatedAt
 *   ——不重写用户未编辑的文档字段;
 * - 身份幂等:同素材重复加入为无操作;底稿 assets 已含同 id 素材亦无操作
 *   (素材集只增不减,本切片不提供移除已保存素材);
 * - D3 同律(用户裁定 2026-09-20):挂载名称加入时自动派生自条目
 *   displayName,守卫(composeSaveBlocked)与搭配草稿同一规则。
 */

/** 编辑状态基底(recipe.get 回执身份;修订是存储层权威,与三视图同源) */
export interface RecipeDocumentEditState {
  readonly recipeId: string;
  readonly baseRevision: number;
  /** recipe.get 回执文档本体(透明底稿;保存合并的基底,原样透传未知字段) */
  readonly document: Record<string, unknown>;
  /** 待保存新增素材(加入顺序;D3 同律 nameHint 自动派生) */
  readonly additions: readonly ComposeDraftItem[];
  /** 有未保存新增(dirty = additions 非空;保存回执后清零) */
  readonly dirty: boolean;
  /** 最近一次保存回执修订(null = 本编辑会话尚无保存回执) */
  readonly lastSavedRevision: number | null;
}

/** 选中配方进入编辑态(全新编辑会话;身份相同且已有编辑会话时保留待保存
 *  新增——文档库失效重取不得静默丢弃用户未保存编辑,身份变更即新会话) */
export function recipeDocumentEditSelected(
  previous: RecipeDocumentEditState | null,
  recipeId: string,
  revision: number,
  document: Record<string, unknown>,
): RecipeDocumentEditState {
  if (
    previous !== null &&
    previous.recipeId === recipeId &&
    previous.baseRevision === revision
  ) {
    return { ...previous, document };
  }
  return {
    recipeId,
    baseRevision: revision,
    document,
    additions: [],
    dirty: false,
    lastSavedRevision: null,
  };
}

/** 底稿 assets 已含的素材 id 集合(选择器「已在本配方」的判定源;非数组
 *  底稿 = 空集,不猜测) */
export function recipeDocumentAssetIds(document: Record<string, unknown>): ReadonlySet<string> {
  const ids = new Set<string>();
  if (Array.isArray(document.assets)) {
    for (const item of document.assets) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
      const asset = item as Record<string, unknown>;
      if (typeof asset.id === "string" && asset.id.length > 0) ids.add(asset.id);
    }
  }
  return ids;
}

/** 待保存新增素材 id 集合(选择器「已添加」判定源) */
export function recipeDocumentAdditionIds(
  additions: readonly ComposeDraftItem[],
): ReadonlySet<string> {
  return new Set(additions.map((item) => item.warehouseItemId));
}

/** 加入待保存新增(身份幂等:已在待保存列表或底稿 assets 中即无操作;
 *  D3 同律:未指定 nameHint 即派生为条目 displayName)。时钟注入(BG-18):
 *  now 必填,真实时钟由 action 层在命令边界取用。 */
export function recipeDocumentEditAddItem(
  state: RecipeDocumentEditState,
  item: Omit<ComposeDraftItem, "addedAt">,
  now: string,
): RecipeDocumentEditState {
  if (state.additions.some((existing) => existing.warehouseItemId === item.warehouseItemId)) {
    return state;
  }
  if (recipeDocumentAssetIds(state.document).has(item.warehouseItemId)) return state;
  const nameHint =
    item.nameHint !== null && item.nameHint.trim() !== "" ? item.nameHint : item.title;
  const additions: readonly ComposeDraftItem[] = [
    ...state.additions,
    { ...item, nameHint, addedAt: now },
  ];
  return { ...state, additions, dirty: true };
}

/** 移除一条待保存新增(只回退本地未保存编辑,不触已保存文档);全部移除
 *  即回到无未保存差异(dirty:false) */
export function recipeDocumentEditRemoveAddition(
  state: RecipeDocumentEditState,
  warehouseItemId: string,
): RecipeDocumentEditState {
  if (!state.additions.some((existing) => existing.warehouseItemId === warehouseItemId)) {
    return state;
  }
  const additions = state.additions.filter(
    (existing) => existing.warehouseItemId !== warehouseItemId,
  );
  return { ...state, additions, dirty: additions.length > 0 };
}

/** 保存回执对齐(修订来自服务端回执):底稿修订前移、待保存清零、回执
 *  修订入档。submittedAdditions 缺省 = 当前待保存全部随本回执落账;在途
 *  期间又发生本地编辑时(当前待保存 ≠ 提交时待保存),未随本回执落账的
 *  新增保留且 dirty 维持——在途编辑不冒充已保存(与 composeSavedAction
 *  同一语义)。 */
export function recipeDocumentEditSaved(
  state: RecipeDocumentEditState,
  revision: number,
  submittedAdditions?: readonly ComposeDraftItem[],
): RecipeDocumentEditState {
  const saved: RecipeDocumentEditState = {
    ...state,
    baseRevision: revision,
    additions: [],
    dirty: false,
    lastSavedRevision: revision,
  };
  if (submittedAdditions === undefined || state.additions === submittedAdditions) return saved;
  const submittedIds = new Set(submittedAdditions.map((item) => item.warehouseItemId));
  const remaining = state.additions.filter((item) => !submittedIds.has(item.warehouseItemId));
  return { ...saved, additions: remaining, dirty: remaining.length > 0 };
}

/** 底稿 instances 数(新增实例 id 排位接续底稿;非数组底稿 = 0) */
function baseInstanceCount(document: Record<string, unknown>): number {
  return Array.isArray(document.instances) ? document.instances.length : 0;
}

/** 新增素材 → asset 行(与 composeDraftToSaveDocument 同一映射:role 缺省
 *  other、label=条目呈现名、sourceRef 指回仓储条目 original) */
function additionToAsset(item: ComposeDraftItem): Record<string, unknown> {
  return {
    id: item.warehouseItemId,
    role: item.role ?? "other",
    label: item.title,
    sourceRef: { warehouseItemId: item.warehouseItemId, role: "original" },
  };
}

/** 新增素材 → instance 行(与 composeDraftToSaveDocument 同一映射:entrypoint
 *  = user_named_entrypoint + nameHint 用户命名提示;实例 id 排位由调用方
 *  传入,接续底稿确定性编号) */
function additionToInstance(item: ComposeDraftItem, position: number): Record<string, unknown> {
  return {
    id: `${item.warehouseItemId}-instance-${position}`,
    assetId: item.warehouseItemId,
    entrypoint: {
      selectorId: `${item.warehouseItemId}-entrypoint`,
      kind: "user_named_entrypoint",
      nameHint: item.nameHint ?? item.title,
    },
    enabled: true,
  };
}

/** 编辑态 → recipe.save 提交文档(透明合并:底稿全部字段原样保留,追加
 *  assets/instances,刷新 updatedAt 与 baseRevision;标题/createdAt 等用户
 *  未编辑字段不重写)。无未保存新增 = null(空保存拒绝:提交未变更文档
 *  只会空耗修订号,正是 D5 存在要防的事)。 */
export function recipeDocumentEditToSaveDocument(
  state: RecipeDocumentEditState,
  now: string,
): Record<string, unknown> | null {
  if (!state.dirty || state.additions.length === 0) return null;
  const baseAssets = Array.isArray(state.document.assets) ? state.document.assets : [];
  const baseInstances = Array.isArray(state.document.instances) ? state.document.instances : [];
  const offset = baseInstanceCount(state.document);
  return {
    ...state.document,
    recipeId: state.recipeId,
    baseRevision: state.baseRevision,
    updatedAt: now,
    assets: [...baseAssets, ...state.additions.map(additionToAsset)],
    instances: [
      ...baseInstances,
      ...state.additions.map((item, index) => additionToInstance(item, offset + index + 1)),
    ],
  };
}

/** 可提交性守卫(与搭配草稿同一规则、同一函数:任一待保存新增 nameHint
 *  空白即不可提交——本模型加入时自动派生,守卫对自动派生值恒过) */
export function recipeDocumentEditBlocked(additions: readonly ComposeDraftItem[]): boolean {
  return composeSaveBlocked(additions);
}
