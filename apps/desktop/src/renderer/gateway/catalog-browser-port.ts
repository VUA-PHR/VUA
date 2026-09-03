import type { CatalogStatus } from "./catalog.ts";
import type { CatalogAvailability, CatalogPrice } from "./refs.ts";
import type { CapabilityReport } from "./types.ts";

/**
 * 目录浏览只读窄端口(G8):Warehouse 卡片墙的取数口。
 *
 * 定位:
 * - 这是 BDB 目录端口的"浏览切片"——只读列表/详情/状态;
 *   激活、在线回退、增量同步等写路径在 G13 才并入,届时本端口向其演进,
 *   页面零重写(实现整体替换)。
 * - 领域类型,不是 wire DTO:wire 形态(API 0.2 下划线字段)只允许存在于
 *   catalog-browser-snapshot.ts 的解析层,不得透出到表现层。
 * - 双实现:快照 fixture(仅 DEV,读 schemas/vendor/bdb-api-0.2 草案快照)
 *   与 not-connected 诚实空态(生产默认),同一组契约测试约束。
 *
 * 身份纪律(承接 refs.ts):
 * - productId 是 BDB 规范 product_id(如 "booth:3681787"),解析时经
 *   catalogProductRef() 校验形态;
 * - entityId 在本端口一律不透明 string——API 0.4 实体是 UUIDv4,而
 *   refs.ts 的 EntityRef 语义实体身份(UUIDv7)尚未裁决(Issue #14 §2),
 *   此处禁止构造 EntityRef,只做展示与过滤用途。
 */

/** 实体间关系种类(API 0.2 仅此三种;新种类前向兼容策略见解析层) */
export type CatalogRelationKind = "compatible_with" | "addon_for" | "requires";

/** 列表查询:全部条件 AND 组合;缺省不过滤 */
export interface CatalogBrowserQuery {
  /** 标题 / productId 子串匹配(大小写不敏感) */
  readonly text?: string;
  readonly availability?: CatalogAvailability;
  /** 商品含至少一个该类型实体 */
  readonly entityType?: string;
  /** 商品含至少一条该种类实体关系 */
  readonly relationKind?: CatalogRelationKind;
}

/** 卡片墙条目(列表视图的最小展示单元) */
export interface CatalogProductSummary {
  readonly productId: string;
  readonly title: string;
  /** 字符串金额 + 币种;来源缺价格时为 null,UI 显示"无价格信息"而非猜测 */
  readonly price: CatalogPrice | null;
  readonly imageUrl: string | null;
  /**
   * 相册数据源:详情媒体的完整图片数组;详情缺媒体时回落 [imageUrl],
   * 无图为空数组。imageUrl 恒等于 imageUrls[0] 或 null。
   */
  readonly imageUrls: readonly string[];
  readonly availability: CatalogAvailability;
  readonly entityCount: number;
  /** 该商品实体的类型去重集合(筛选词表与卡片徽标的来源) */
  readonly entityTypes: readonly string[];
}

/** 实体摘要:详情抽屉的实体区与关系徽标使用 */
export interface CatalogEntityBrief {
  /** 不透明实体标识(API 0.4 为 UUIDv4;禁止构造 EntityRef,见文件头) */
  readonly entityId: string;
  readonly entityType: string;
  readonly canonicalName: string | null;
  readonly relations: readonly CatalogRelationBrief[];
}

export interface CatalogRelationBrief {
  readonly kind: CatalogRelationKind;
  readonly objectEntityId: string;
  /**
   * 关系对象规范名。解析顺序:/entities/{id} 档案 → 目录内实体名索引
   * (详情记录里同目录其他商品的实体,档案因 BDB 端点故障受阻时仍可补名)
   * → 库外实体为 null(UI 回落只显示关系种类,不编造名称)。
   */
  readonly objectName: string | null;
}

/** 商品详情(详情抽屉视图) */
export interface CatalogProductDetail {
  readonly productId: string;
  readonly title: string;
  readonly price: CatalogPrice | null;
  readonly imageUrl: string | null;
  /** deleted 即墓碑:保留最后标题与主图,UI 须明确表达"已下架/墓碑" */
  readonly availability: CatalogAvailability;
  readonly sourceUrl: string | null;
  readonly sourceLocale: string | null;
  readonly description: string | null;
  readonly attribution: {
    readonly shopName: string | null;
    readonly shopUrl: string | null;
    readonly creatorName: string | null;
  } | null;
  readonly media: {
    readonly imageUrls: readonly string[];
    readonly videoUrls: readonly string[];
  };
  readonly terms: readonly {
    readonly termKey: string;
    readonly termKind: string;
    readonly label: string | null;
  }[];
  readonly entities: readonly CatalogEntityBrief[];
}

export type CatalogListView =
  | { schemaVersion: 1; kind: "not-connected" }
  | {
      schemaVersion: 1;
      kind: "results";
      /** 过滤后的条目 */
      readonly items: readonly CatalogProductSummary[];
      /** 目录全量大小(未过滤),供"N / 共 M"计数表达 */
      readonly total: number;
      /** 筛选词表:全量数据中实际出现的取值(词表随数据走,UI 不硬编码) */
      readonly vocabulary: CatalogVocabulary;
    };

/** 筛选词表:由实现从全量目录派生,与当前过滤条件无关 */
export interface CatalogVocabulary {
  readonly availabilities: readonly CatalogAvailability[];
  readonly entityTypes: readonly string[];
  readonly relationKinds: readonly CatalogRelationKind[];
}

export type CatalogDetailView =
  | { schemaVersion: 1; kind: "not-connected" }
  | { schemaVersion: 1; kind: "not-found" }
  | { schemaVersion: 1; kind: "detail"; product: CatalogProductDetail };

export interface CatalogBrowserPort {
  list(query?: CatalogBrowserQuery): Promise<CatalogListView>;
  detail(productId: string): Promise<CatalogDetailView>;
  /** 目录新鲜度视图(catalog.ts 词汇;修订序号待 G13 离线包契约) */
  status(): Promise<CatalogStatus>;
  capability(): Promise<CapabilityReport>;
}
