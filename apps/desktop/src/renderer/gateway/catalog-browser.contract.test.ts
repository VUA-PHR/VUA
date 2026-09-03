import assert from "node:assert/strict";
import { test } from "vitest";
import type {
  CatalogBrowserPort,
  CatalogListView,
} from "./catalog-browser-port.ts";
import { createSnapshotCatalogBrowser } from "./catalog-browser-snapshot.ts";
import { createEmptyCatalogBrowser } from "./empty-gateway.ts";
import { capabilityDetailKeys, capabilityStates, type CapabilityReport } from "./types.ts";

/**
 * 目录浏览端口契约测试(G8):同一组用例跑快照实现与 not-connected 实现,
 * 未来的 live 实现(G13 目录能力)也必须通过同一契约,页面才能零重写切换。
 * 末尾附真实 vendored 快照的冒烟校验(fs 读入,防快照与解析层漂移)。
 */

function assertCapabilityShape(report: CapabilityReport) {
  assert.ok(
    (capabilityStates as readonly string[]).includes(report.state),
    `unknown capability state: ${report.state}`,
  );
  if (report.detailKey !== undefined) {
    assert.ok(
      (capabilityDetailKeys as readonly string[]).includes(report.detailKey),
      `unknown capability detailKey: ${report.detailKey}`,
    );
  }
}

/** 合成快照:覆盖四态可用性、三种关系、词表外新值的防御解析 */
function syntheticSnapshot() {
  return {
    products: [
      {
        product_id: "booth:1001",
        title: "Sample Outfit Alpha",
        price: { amount: "500", currency: "JPY" },
        image_url: "https://example.test/1001.jpg",
        entity_count: 2,
        availability: "available",
      },
      {
        product_id: "booth:1002",
        title: "Sample Tool Beta",
        price: { amount: "0", currency: "JPY" },
        image_url: null,
        entity_count: 1,
        availability: "unavailable",
      },
      {
        product_id: "booth:1003",
        title: "Tombstone Gamma",
        price: { amount: "1200", currency: "JPY" },
        image_url: "https://example.test/1003.jpg",
        entity_count: 1,
        availability: "deleted",
      },
      {
        product_id: "booth:1004",
        title: "Legacy Delta",
        price: null,
        image_url: "https://example.test/1004-list.jpg",
        entity_count: 1,
        availability: "discontinued",
      },
    ],
    details: [
      {
        product_id: "booth:1001",
        title: "Sample Outfit Alpha",
        price: { amount: "500", currency: "JPY" },
        // 详情响应省略顶层 image_url(API 0.2 真实形态):主图应从 media 首图补齐
        entity_count: 2,
        availability: "available",
        source_url: "https://booth.pm/items/1001",
        source_locale: "ja",
        description: "alpha description",
        attribution: {
          shop_name: "ShopA",
          shop_url: "https://shopa.booth.pm/",
          creator_name: "CreatorA",
        },
        media: { image_urls: ["https://example.test/1001.jpg"], video_urls: [] },
        terms: [{ term_key: "avatar:alpha", term_kind: "avatar", label: "Alpha" }],
        entities: [
          {
            entity_id: "11111111-1111-4111-8111-111111111111",
            entity_type: "outfit",
            canonical_name: "Alpha Outfit",
            relations: [
              { relation_kind: "compatible_with", object_entity_id: "22222222-2222-4222-8222-222222222222" },
              { relation_kind: "bundled_with", object_entity_id: "33333333-3333-4333-8333-333333333333" },
            ],
          },
          {
            entity_id: "22222222-2222-4222-8222-222222222222",
            entity_type: "avatar",
            canonical_name: "Alpha Avatar",
            relations: [],
          },
        ],
      },
      {
        product_id: "booth:1002",
        title: "Sample Tool Beta",
        price: { amount: "0", currency: "JPY" },
        image_url: null,
        entity_count: 1,
        availability: "unavailable",
        entities: [
          {
            entity_id: "33333333-3333-4333-8333-333333333333",
            entity_type: "tool",
            canonical_name: null,
            relations: [
              { relation_kind: "addon_for", object_entity_id: "11111111-1111-4111-8111-111111111111" },
            ],
          },
        ],
      },
      {
        product_id: "booth:1003",
        title: "Tombstone Gamma",
        price: { amount: "1200", currency: "JPY" },
        image_url: "https://example.test/1003.jpg",
        entity_count: 1,
        availability: "deleted",
        // 多图媒体:相册数组的合成用例
        media: {
          image_urls: ["https://example.test/1003.jpg", "https://example.test/1003-b.jpg"],
          video_urls: [],
        },
        entities: [
          {
            entity_id: "44444444-4444-4444-8444-444444444444",
            entity_type: "prop",
            canonical_name: "Gamma Prop",
            relations: [
              { relation_kind: "requires", object_entity_id: "22222222-2222-4222-8222-222222222222" },
            ],
          },
        ],
      },
      {
        product_id: "booth:1004",
        title: "Legacy Delta",
        price: null,
        image_url: null,
        entity_count: 1,
        availability: "discontinued",
        entities: [
          {
            entity_id: "55555555-5555-4555-8555-555555555555",
            entity_type: "shader",
            canonical_name: "Delta Shader",
            relations: [
              // 目录内索引用例:对象 44444444 无实体档案,但它是 1003 的实体,
              // 规范名应从目录内索引解析("Gamma Prop")
              { relation_kind: "compatible_with", object_entity_id: "44444444-4444-4444-8444-444444444444" },
            ],
          },
        ],
      },
    ],
    // /entities/{id} 档案:aliases 唯一来源(商品详情 wire 不携带)
    entities: [
      {
        entity_id: "11111111-1111-4111-8111-111111111111",
        entity_type: "outfit",
        canonical_name: "Alpha Outfit",
        aliases: ["アルファ衣装"],
      },
      {
        entity_id: "22222222-2222-4222-8222-222222222222",
        entity_type: "avatar",
        canonical_name: "Alpha Avatar",
        aliases: ["アルファ", "alpha"],
      },
    ],
  };
}

const implementations: Array<{ label: string; make: () => CatalogBrowserPort }> = [
  { label: "snapshot", make: () => createSnapshotCatalogBrowser(syntheticSnapshot()) },
  { label: "not-connected", make: () => createEmptyCatalogBrowser() },
];

for (const { label, make } of implementations) {
  test(`${label}: 视图与 capability 形态合法`, async () => {
    const port = make();
    const list = await port.list();
    assert.equal(list.schemaVersion, 1);
    assert.ok(list.kind === "results" || list.kind === "not-connected");
    const detail = await port.detail("__missing__");
    assert.equal(detail.schemaVersion, 1);
    assert.ok(detail.kind === "not-found" || detail.kind === "not-connected");
    assertCapabilityShape(await port.capability());
    assert.ok(
      ["unknown", "ok", "stale", "corrupted", "incompatible"].includes(
        (await port.status()).health,
      ),
    );
  });
}

test("not-connected: 诚实空态", async () => {
  const port = createEmptyCatalogBrowser();
  assert.equal((await port.list()).kind, "not-connected");
  assert.equal((await port.detail("booth:1001")).kind, "not-connected");
  assert.equal((await port.status()).health, "unknown");
  const capability = await port.capability();
  assert.equal(capability.state, "unavailable");
  assert.equal(capability.detailKey, "catalogMissing");
});

test("snapshot: 全量列表与计数", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.list();
  assert.equal(view.kind, "results");
  if (view.kind !== "results") return;
  assert.equal(view.total, 4);
  assert.equal(view.items.length, 4);
  // 源顺序保持(API 顺序即稳定排序)
  assert.deepEqual(
    view.items.map((item) => item.productId),
    ["booth:1001", "booth:1002", "booth:1003", "booth:1004"],
  );
});

test("snapshot: 可用性过滤(含墓碑)", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const deleted = await port.list({ availability: "deleted" });
  assert.equal(deleted.kind, "results");
  if (deleted.kind !== "results") return;
  assert.equal(deleted.items.length, 1);
  assert.equal(deleted.items[0]?.productId, "booth:1003");
  assert.equal(deleted.total, 4);
});

test("snapshot: 文本搜索大小写不敏感,命中标题与 productId", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const byTitle = await port.list({ text: "sample" });
  assert.equal(byTitle.kind, "results");
  if (byTitle.kind !== "results") return;
  assert.equal(byTitle.items.length, 2);
  const byId = await port.list({ text: "1003" });
  assert.equal(byId.kind, "results");
  if (byId.kind !== "results") return;
  assert.deepEqual(byId.items.map((item) => item.productId), ["booth:1003"]);
  const none = await port.list({ text: "不存在的商品" });
  assert.equal(none.kind, "results");
  if (none.kind !== "results") return;
  assert.equal(none.items.length, 0);
});

test("snapshot: 主图解析——详情省略字段时从媒体与列表项补全", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.list();
  assert.equal(view.kind, "results");
  if (view.kind !== "results") return;
  const byId = new Map(view.items.map((item) => [item.productId, item]));
  // 1001:详情无顶层 image_url,从 media.image_urls 首图补齐
  assert.equal(byId.get("booth:1001")?.imageUrl, "https://example.test/1001.jpg");
  // 1003:详情顶层 image_url 仍在(旧形态兼容)
  assert.equal(byId.get("booth:1003")?.imageUrl, "https://example.test/1003.jpg");
  // 1004:详情无图,从列表项 image_url 兜底;详情查询拿到同一主图
  assert.equal(byId.get("booth:1004")?.imageUrl, "https://example.test/1004-list.jpg");
  const delta = await port.detail("booth:1004");
  assert.equal(delta.kind, "detail");
  if (delta.kind !== "detail") return;
  assert.equal(delta.product.imageUrl, "https://example.test/1004-list.jpg");
  // 1002:全来源无图,保持 null(不编造)
  assert.equal(byId.get("booth:1002")?.imageUrl, null);

  // 相册数组(G8 增量):详情媒体全量保留;无媒体回落 [主图];无图为空数组
  assert.deepEqual(byId.get("booth:1001")?.imageUrls, ["https://example.test/1001.jpg"]);
  assert.deepEqual(byId.get("booth:1003")?.imageUrls, [
    "https://example.test/1003.jpg",
    "https://example.test/1003-b.jpg",
  ]);
  assert.deepEqual(byId.get("booth:1004")?.imageUrls, ["https://example.test/1004-list.jpg"]);
  assert.deepEqual(byId.get("booth:1002")?.imageUrls, []);
  // 详情媒体不受列表兜底影响:1003 详情查询拿到同两张图
  const gamma = await port.detail("booth:1003");
  assert.equal(gamma.kind, "detail");
  if (gamma.kind !== "detail") return;
  assert.deepEqual(gamma.product.media.imageUrls, [
    "https://example.test/1003.jpg",
    "https://example.test/1003-b.jpg",
  ]);
});

test("snapshot: 辞典感知搜索——别名任一写法命中同一商品", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const ids = (view: CatalogListView) =>
    view.kind === "results" ? view.items.map((item) => item.productId).sort() : [];
  // 假名别名命中携带实体(1001)与关系指向该实体的商品(1002 addon_for、1003 requires)
  const byKana = await port.list({ text: "アルファ" });
  // 罗马字别名/规范名命中同一集合:两种写法结果一致
  const byRomaji = await port.list({ text: "alpha" });
  assert.deepEqual(ids(byKana), ["booth:1001", "booth:1002", "booth:1003"]);
  assert.deepEqual(ids(byRomaji), ids(byKana));
  // 关系对象档案名也入搜索域:1003 无 Alpha 实体,仅 requires → Alpha Avatar
  const byRelationObject = await port.list({ text: "alpha avatar" });
  assert.deepEqual(ids(byRelationObject), ["booth:1001", "booth:1003"]);
  // 商品自身实体档案别名(アルファ衣装)命中携带者与其 addon 工具
  const byOutfitAlias = await port.list({ text: "アルファ衣装" });
  assert.deepEqual(ids(byOutfitAlias), ["booth:1001", "booth:1002"]);
});

test("snapshot: 关系对象经实体档案补名,库外对象为 null", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.detail("booth:1001");
  assert.equal(view.kind, "detail");
  if (view.kind !== "detail") return;
  const outfit = view.product.entities.find((e) => e.entityId === "11111111-1111-4111-8111-111111111111");
  const compatible = outfit?.relations.find((r) => r.kind === "compatible_with");
  assert.equal(compatible?.objectName, "Alpha Avatar");
  // bundled_with 词表外已跳过;1002 的 addon_for 对象经档案补名
  const beta = await port.detail("booth:1002");
  assert.equal(beta.kind, "detail");
  if (beta.kind !== "detail") return;
  const addon = beta.product.entities[0]?.relations.find((r) => r.kind === "addon_for");
  assert.equal(addon?.objectName, "Alpha Outfit");
  // 目录内索引:1004 的关系对象 44444444 无实体档案,但它是 1003 的实体,
  // 规范名 "Gamma Prop" 应从目录内索引解析(档案受阻时的兜底路径)
  const delta = await port.detail("booth:1004");
  assert.equal(delta.kind, "detail");
  if (delta.kind !== "detail") return;
  const internal = delta.product.entities[0]?.relations.find(
    (r) => r.kind === "compatible_with",
  );
  assert.equal(internal?.objectName, "Gamma Prop");
});

test("snapshot: 目录内索引入搜索域——无档案的关系对象名仍可命中", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.list({ text: "gamma prop" });
  assert.equal(view.kind, "results");
  if (view.kind !== "results") return;
  // 1003 经自身实体规范名命中;1004 仅经关系对象的目录内索引名命中
  assert.deepEqual(
    view.items.map((item) => item.productId),
    ["booth:1003", "booth:1004"],
  );
});

test("snapshot: 实体类型与关系种类过滤,条件 AND 组合", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const outfit = await port.list({ entityType: "outfit" });
  assert.equal(outfit.kind, "results");
  if (outfit.kind !== "results") return;
  assert.deepEqual(outfit.items.map((item) => item.productId), ["booth:1001"]);

  const requires = await port.list({ relationKind: "requires" });
  assert.equal(requires.kind, "results");
  if (requires.kind !== "results") return;
  assert.deepEqual(requires.items.map((item) => item.productId), ["booth:1003"]);

  const combined = await port.list({ entityType: "avatar", relationKind: "compatible_with" });
  assert.equal(combined.kind, "results");
  if (combined.kind !== "results") return;
  assert.deepEqual(combined.items.map((item) => item.productId), ["booth:1001"]);

  const empty = await port.list({ entityType: "avatar", relationKind: "requires" });
  assert.equal(empty.kind, "results");
  if (empty.kind !== "results") return;
  assert.equal(empty.items.length, 0);
});

test("snapshot: 摘要派生字段(entityTypes 去重排序、价格保持字符串)", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.list();
  assert.equal(view.kind, "results");
  if (view.kind !== "results") return;
  const alpha = view.items.find((item) => item.productId === "booth:1001");
  assert.deepEqual(alpha?.entityTypes, ["avatar", "outfit"]);
  assert.deepEqual(alpha?.price, { amount: "500", currency: "JPY" });
  assert.equal(typeof alpha?.price?.amount, "string");
});

test("snapshot: 防御解析(词表外 availability 归 unknown,未知关系跳过,缺价格为 null)", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.list();
  assert.equal(view.kind, "results");
  if (view.kind !== "results") return;
  const legacy = view.items.find((item) => item.productId === "booth:1004");
  assert.equal(legacy?.availability, "unknown");
  assert.equal(legacy?.price, null);

  const detail = await port.detail("booth:1001");
  assert.equal(detail.kind, "detail");
  if (detail.kind !== "detail") return;
  const alpha = detail.product.entities.find((entity) => entity.entityType === "outfit");
  // bundled_with 是词表外种类,必须被跳过而非泄露或崩溃
  assert.deepEqual(
    alpha?.relations.map((relation) => relation.kind),
    ["compatible_with"],
  );
});

test("snapshot: 筛选词表来自全量数据(与过滤条件无关)", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.list({ availability: "deleted" });
  assert.equal(view.kind, "results");
  if (view.kind !== "results") return;
  // 四态俱全(含词表外值归 unknown);未知关系种类 bundled_with 不进词表
  assert.deepEqual(view.vocabulary.availabilities, [
    "available",
    "unavailable",
    "unknown",
    "deleted",
  ]);
  assert.deepEqual(view.vocabulary.entityTypes, [
    "avatar",
    "outfit",
    "prop",
    "shader",
    "tool",
  ]);
  assert.deepEqual(view.vocabulary.relationKinds, [
    "compatible_with",
    "addon_for",
    "requires",
  ]);
});

test("snapshot: 详情完整性(实体/关系/归属/媒体/词条/墓碑)", async () => {
  const port = createSnapshotCatalogBrowser(syntheticSnapshot());
  const view = await port.detail("booth:1001");
  assert.equal(view.kind, "detail");
  if (view.kind !== "detail") return;
  const { product } = view;
  assert.equal(product.entities.length, 2);
  assert.equal(product.attribution?.shopName, "ShopA");
  assert.deepEqual(product.media.imageUrls, ["https://example.test/1001.jpg"]);
  assert.deepEqual(product.terms, [
    { termKey: "avatar:alpha", termKind: "avatar", label: "Alpha" },
  ]);
  assert.equal(product.sourceLocale, "ja");

  const tombstone = await port.detail("booth:1003");
  assert.equal(tombstone.kind, "detail");
  if (tombstone.kind !== "detail") return;
  // 墓碑:保留最后标题与主图,可用性明确为 deleted
  assert.equal(tombstone.product.availability, "deleted");
  assert.equal(tombstone.product.title, "Tombstone Gamma");
  assert.equal(tombstone.product.imageUrl, "https://example.test/1003.jpg");

  assert.equal((await port.detail("booth:9999")).kind, "not-found");
});
