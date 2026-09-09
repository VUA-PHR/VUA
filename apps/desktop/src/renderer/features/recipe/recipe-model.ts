import type {
  RecipeConflict,
  RecipeGraphEdge,
  RecipeGraphNode,
  RecipeGraphView,
} from "../../gateway/index.ts";

/**
 * Recipe 图谱模型(C-RECIPE):RecipeDocumentV1 的 TS 镜像 + 图谱视图推导。
 * 纯函数、无 IO:文档由端口注入,本文件只负责呈现决策。
 *
 * 契约纪律:schema 权威是 schemas/recipe/v1/recipe.schema.json,本镜像字段与
 * 其一一对应;漂移由 packages/contracts 的 recipe-fixtures 校验测试 +
 * gateway/fixture-recipes.test.ts 的数据一致性测试共同把守。
 * @vrcua/contracts 的 Recipe 类型恢复后(中台 P0 悬空提交裁决)本镜像退役。
 *
 * 文案纪律:本文件不持有任何文案字面量;冲突说明等展示文本经 DeriveTexts
 * 注入(负载文案集中在 i18n/strings.fixtures.zh-CN.ts / strings.zh-CN.ts)。
 */

/* ---- RecipeDocumentV1 TS 镜像(临时,见头注) ---- */

export type RecipeAssetRoleV1 =
  | "avatar_base"
  | "outfit"
  | "hair"
  | "accessory"
  | "prop"
  | "expression_pack"
  | "animation_pack"
  | "shader"
  | "texture_pack"
  | "material_pack"
  | "tool_dependency"
  | "other";

export type RecipeSelectionModeV1 = "exactly_one" | "zero_or_one" | "any";

export interface RecipeAssetV1 {
  id: string;
  role: RecipeAssetRoleV1;
  label?: string;
  variant?: string;
  versionConstraint?: string;
  /** 缺省即 true(schema 默认) */
  required?: boolean;
  entityRef?: { entityId: string };
  sourceRef?: { provider: string; productId: string; url?: string };
}

export interface RecipeWardrobeGroupV1 {
  id: string;
  label?: string;
  memberAssetIds: string[];
  selectionMode: RecipeSelectionModeV1;
  defaultAssetIds?: string[];
}

export interface RecipeDependencyV1 {
  packageId: string;
  versionConstraint: string;
}

export interface RecipeDocumentV1 {
  schemaVersion: 1;
  recipeId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  target: { platforms: string[]; avatarAssetId: string; performanceTarget?: string };
  assets: RecipeAssetV1[];
  wardrobeGroups?: RecipeWardrobeGroupV1[];
  dependencies?: RecipeDependencyV1[];
  extensions?: Record<string, unknown>;
}

/**
 * 结构性最小校验:字段形态检查(完整 schema 校验由 contracts 测试对
 * fixture 执行;分享码导入的加固校验在 src-tauri 版本化 command,
 * C-RECIPE-4)。返回 null 表示结构不合法,调用方按"未接入/拒绝"处理。
 */
export function parseRecipeDocument(input: unknown): RecipeDocumentV1 | null {
  if (typeof input !== "object" || input === null) return null;
  const doc = input as Partial<RecipeDocumentV1>;
  if (doc.schemaVersion !== 1) return null;
  if (typeof doc.recipeId !== "string" || typeof doc.title !== "string") return null;
  if (typeof doc.createdAt !== "string" || typeof doc.updatedAt !== "string") return null;
  if (
    typeof doc.target !== "object" ||
    doc.target === null ||
    !Array.isArray(doc.target.platforms) ||
    typeof doc.target.avatarAssetId !== "string"
  ) {
    return null;
  }
  if (!Array.isArray(doc.assets) || doc.assets.length === 0) return null;
  for (const asset of doc.assets) {
    if (typeof asset.id !== "string" || typeof asset.role !== "string") return null;
    if (!asset.entityRef && !asset.sourceRef) return null;
  }
  return doc as RecipeDocumentV1;
}

/* ---- 图谱推导 ---- */

/** 语义分层(v0.4.0 §6.3):身体与基础模型 / 衣装与饰品 / 动画与菜单 / Shader 与依赖 */
export type RecipeLayer = "body" | "outfit" | "animation" | "tech";

export const recipeLayerOrder: readonly RecipeLayer[] = ["body", "outfit", "animation", "tech"];

export function layerOfRole(role: RecipeAssetRoleV1): RecipeLayer {
  switch (role) {
    case "avatar_base":
      return "body";
    case "outfit":
    case "hair":
    case "accessory":
    case "prop":
      return "outfit";
    case "expression_pack":
    case "animation_pack":
      return "animation";
    default:
      return "tech";
  }
}

/** 推导所需文本(负载注入;模型层零文案) */
export interface DeriveTexts {
  conflictAvatarBase: string;
}

export type RecipeGraph = Extract<RecipeGraphView, { kind: "graph" }>;

/**
 * 图谱推导:RecipeDocumentV1 + 本地实体解析结果 → RecipeGraphView。
 * - 状态:entityRef 已解析 ready / 未解析 missing;仅 sourceRef → unresolved;
 *   冲突覆盖其他状态;
 * - 冲突规则(本切片唯一):多个 required avatar_base 同存 → 冲突组,
 *   绝不自动取舍;
 * - 边:组成=实线(avatar→必需非组素材),换装可选=虚线(avatar→衣橱组成员),
 *   依赖=点线(avatar→合成依赖节点 dep:<packageId>);
 * - 缺失列表与节点 state 冗余,供列表化提示。
 */
export function deriveGraph(
  doc: RecipeDocumentV1,
  resolvedEntityIds: ReadonlySet<string>,
  texts: DeriveTexts,
): RecipeGraph {
  const avatarId = doc.target.avatarAssetId;
  const grouped = new Set<string>();
  for (const group of doc.wardrobeGroups ?? []) {
    for (const member of group.memberAssetIds) grouped.add(member);
  }

  const requiredBases = doc.assets
    .filter((asset) => asset.role === "avatar_base" && asset.required !== false)
    .map((asset) => asset.id);
  const conflicting = new Set(requiredBases.length > 1 ? requiredBases : []);

  const nodes: RecipeGraphNode[] = doc.assets.map((asset) => {
    const state = conflicting.has(asset.id)
      ? ("conflict" as const)
      : asset.entityRef
        ? resolvedEntityIds.has(asset.entityRef.entityId)
          ? ("ready" as const)
          : ("missing" as const)
        : ("unresolved" as const);
    return {
      id: asset.id,
      asset: {
        id: asset.entityRef?.entityId ?? asset.id,
        displayFallback: asset.label ?? asset.id,
      },
      // exactOptionalPropertyTypes:无 sourceRef 时省略键,不写 undefined
      ...(asset.sourceRef
        ? { sourceRef: { provider: asset.sourceRef.provider, productId: asset.sourceRef.productId } }
        : {}),
      state,
      role: asset.role,
    };
  });

  const edges: RecipeGraphEdge[] = [];
  for (const asset of doc.assets) {
    if (asset.id === avatarId) continue;
    edges.push({
      from: avatarId,
      to: asset.id,
      kind: grouped.has(asset.id) ? "wardrobe" : "composition",
    });
  }
  for (const dependency of doc.dependencies ?? []) {
    const depId = `dep:${dependency.packageId}`;
    nodes.push({
      id: depId,
      asset: {
        id: dependency.packageId,
        displayFallback: `${dependency.packageId} ${dependency.versionConstraint}`,
      },
      // 合成依赖节点:安装状态未核实,恒 unresolved(不得显示为已安装)
      state: "unresolved",
    });
    edges.push({ from: avatarId, to: depId, kind: "dependency" });
  }

  const conflicts: RecipeConflict[] =
    conflicting.size > 0
      ? [{ nodeIds: [...conflicting], description: texts.conflictAvatarBase }]
      : [];

  return {
    schemaVersion: 1,
    kind: "graph",
    recipeId: doc.recipeId,
    nodes,
    edges,
    selectedNodeId: null,
    conflicts,
    missing: nodes
      .filter((node) => node.state === "missing")
      .map((node) => node.id),
  };
}

/* ---- 布局推导(S-XI Obsidian 风力导图;纯函数,无随机源) ---- */

/**
 * 自由坐标点(世界坐标,中心为 0,0):S-XI 起图谱从格点迁移为自由点。
 * 拖拽钉住、键盘微调与布局保存都落在整数点上;渲染层只做中心偏移。
 */
export interface GraphPoint {
  readonly x: number;
  readonly y: number;
}

/** 力导参数(确定性:黄金角螺旋初始化 + 固定迭代;非性能承诺) */
const FORCE = {
  iterations: 240,
  /** 节点间斥力强度(库仑式 k²/d²) */
  repulsion: 26000,
  /** 边弹簧静止长度 */
  springLength: 150,
  springK: 0.04,
  /** 向心弱引力:防游离,保持团簇紧凑 */
  gravityK: 0.015,
  /** 语义层径向带弱引力:有机排布中保留"衣装近、依赖远"的带状可读性 */
  layerK: 0.02,
  layerRadius: { body: 0, outfit: 210, animation: 340, tech: 470 } as const,
  damping: 0.82,
  maxStep: 28,
} as const;

/**
 * 力导自动布局:主轴节点(deriveGraph 契约:所有边的共同起点,即 Avatar)
 * 钉在原点;其余节点经斥力/边弹簧/向心引力/语义层径向带迭代收敛。
 * 同输入恒同输出(无 Math.random、无 Date 依赖),供测试与版本快照比对。
 */
export function basePoints(graph: RecipeGraph): Map<string, GraphPoint> {
  const nodes = graph.nodes;
  const n = nodes.length;
  const hubIndex = nodes.findIndex((node) => graph.edges.some((edge) => edge.from === node.id));
  // 黄金角螺旋初始化(确定性)
  const pos = nodes.map((_, i) => {
    const angle = i * 2.399963229728653;
    const r = 42 * Math.sqrt(i + 1);
    return { x: r * Math.cos(angle), y: r * Math.sin(angle), vx: 0, vy: 0 };
  });
  const indexOf = new Map(nodes.map((node, i) => [node.id, i] as const));
  const edges = graph.edges
    .map((edge) => [indexOf.get(edge.from), indexOf.get(edge.to)] as const)
    .filter((pair): pair is readonly [number, number] => pair[0] !== undefined && pair[1] !== undefined);
  const layerRadiusOf = (i: number): number => {
    const role = nodes[i]!.role;
    const layer = role ? layerOfRole(role as RecipeAssetRoleV1) : "tech";
    return FORCE.layerRadius[layer];
  };
  for (let tick = 0; tick < FORCE.iterations; tick += 1) {
    const fx = new Array<number>(n).fill(0);
    const fy = new Array<number>(n).fill(0);
    // 斥力(全对;≤100 节点预算内 O(n²) 足够)
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        let dx = pos[i]!.x - pos[j]!.x;
        let dy = pos[i]!.y - pos[j]!.y;
        if (dx * dx + dy * dy < 1) {
          // 完全重叠时按索引差确定性错开(不引入随机源)
          dx = 0.31 * (i - j);
          dy = 0.17 * (j - i);
        }
        const d = Math.hypot(dx, dy);
        const f = FORCE.repulsion / (d * d);
        fx[i]! += (dx / d) * f;
        fy[i]! += (dy / d) * f;
        fx[j]! -= (dx / d) * f;
        fy[j]! -= (dy / d) * f;
      }
    }
    // 边弹簧
    for (const [a, b] of edges) {
      const dx = pos[b]!.x - pos[a]!.x;
      const dy = pos[b]!.y - pos[a]!.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const f = (d - FORCE.springLength) * FORCE.springK;
      fx[a]! += (dx / d) * f;
      fy[a]! += (dy / d) * f;
      fx[b]! -= (dx / d) * f;
      fy[b]! -= (dy / d) * f;
    }
    // 向心引力 + 语义层径向带
    for (let i = 0; i < n; i += 1) {
      fx[i]! -= pos[i]!.x * FORCE.gravityK;
      fy[i]! -= pos[i]!.y * FORCE.gravityK;
      const target = layerRadiusOf(i);
      if (target > 0) {
        const d = Math.max(1, Math.hypot(pos[i]!.x, pos[i]!.y));
        const f = (d - target) * FORCE.layerK;
        fx[i]! -= (pos[i]!.x / d) * f;
        fy[i]! -= (pos[i]!.y / d) * f;
      }
    }
    // 积分(主轴钉死原点)
    for (let i = 0; i < n; i += 1) {
      if (i === hubIndex) {
        pos[i]!.x = 0;
        pos[i]!.y = 0;
        pos[i]!.vx = 0;
        pos[i]!.vy = 0;
        continue;
      }
      let vx = (pos[i]!.vx + fx[i]!) * FORCE.damping;
      let vy = (pos[i]!.vy + fy[i]!) * FORCE.damping;
      const step = Math.hypot(vx, vy);
      if (step > FORCE.maxStep) {
        vx = (vx / step) * FORCE.maxStep;
        vy = (vy / step) * FORCE.maxStep;
      }
      pos[i]!.vx = vx;
      pos[i]!.vy = vy;
      pos[i]!.x += vx;
      pos[i]!.y += vy;
    }
  }
  const points = new Map<string, GraphPoint>();
  nodes.forEach((node, i) => {
    points.set(node.id, { x: Math.round(pos[i]!.x), y: Math.round(pos[i]!.y) });
  });
  return points;
}

export interface GraphLayout {
  /** 正方形世界;positions 为节点中心点(已加半宽偏移,左上角原点) */
  width: number;
  height: number;
  positions: ReadonlyMap<string, { x: number; y: number }>;
}

/** 自由点 → 布局:世界盒随内容扩张,positions 即节点中心(渲染层自行对齐) */
export function layoutFromPoints(points: ReadonlyMap<string, GraphPoint>): GraphLayout {
  let half = 240;
  for (const point of points.values()) {
    half = Math.max(half, Math.abs(point.x) + 120, Math.abs(point.y) + 120);
  }
  const positions = new Map<string, { x: number; y: number }>();
  for (const [id, point] of points) {
    positions.set(id, { x: half + point.x, y: half + point.y });
  }
  return { width: half * 2, height: half * 2, positions };
}

/** 自动布局(无用户钉点):力导基准,拖拽与布局保存在此之上叠加 */
export function layoutGraph(graph: RecipeGraph): GraphLayout {
  return layoutFromPoints(basePoints(graph));
}

/* ---- BG-1(W24 读面预备):recipe 文档库列表窄化(production-use-case
 * v0.2 recipe.list 读面,envelope 强度;缺失字段 = 不可解释,不猜测) ---- */

export interface RecipeLibraryEntryNarrowed {
  readonly recipeId: string;
  readonly revision: number;
  readonly title: string;
  readonly updatedAt: string;
}

/** recipe.list result → 呈现条目收窄(非对象/缺必需字段 = 滤除,不猜测) */
export function narrowRecipeLibraryEntries(raw: unknown): readonly RecipeLibraryEntryNarrowed[] {
  if (!Array.isArray(raw)) return [];
  const entries: RecipeLibraryEntryNarrowed[] = [];
  for (const item of raw) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const recipeId = record.recipeId;
    const revision = record.revision;
    const title = record.title;
    const updatedAt = record.updatedAt;
    if (
      typeof recipeId !== "string" ||
      recipeId.length === 0 ||
      typeof revision !== "number" ||
      !Number.isInteger(revision) ||
      revision < 1 ||
      typeof title !== "string" ||
      typeof updatedAt !== "string" ||
      updatedAt.length === 0
    ) {
      continue;
    }
    entries.push({ recipeId, revision, title, updatedAt });
  }
  return entries;
}

/** 共享选择骨架:文档库选择(三视图共享的选中态;同 id 幂等) */
export function selectLibraryRecipe(
  current: string | null,
  recipeId: string,
): string | null {
  return recipeId.length === 0 ? current : recipeId;
}
