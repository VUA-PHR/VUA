import assert from "node:assert/strict";
import { test } from "vitest";
import {
  catalogProductRef,
  entityRef,
  parseCatalogVariantId,
  type CatalogVariantId,
  type RecipeSourceRef,
} from "./refs.ts";

test("catalogProductRef 接受规范 product_id 并冻结实例", () => {
  const ref = catalogProductRef({ productId: "booth:3681787" });
  assert.equal(ref.productId, "booth:3681787");
  assert.ok(Object.isFrozen(ref));
});

test("catalogProductRef 接受与 product_id 一致的冗余 source/nativeId", () => {
  const ref = catalogProductRef({
    productId: "booth:3681787",
    source: "booth",
    nativeId: "3681787",
  });
  assert.equal(ref.source, "booth");
  assert.equal(ref.nativeId, "3681787");
});

test("catalogProductRef 拒绝非法 product_id 与不一致的冗余字段", () => {
  assert.throws(() => catalogProductRef({ productId: "" }));
  assert.throws(() => catalogProductRef({ productId: "3681787" }));
  assert.throws(() => catalogProductRef({ productId: "booth: 3681787" }));
  assert.throws(() => catalogProductRef({ productId: "booth:3681787", source: "pmall" }));
  assert.throws(() => catalogProductRef({ productId: "booth:3681787", nativeId: "999" }));
});

test("entityRef 只接受 UUIDv7 形态", () => {
  const valid = entityRef("018f2e3a-9c1b-7cde-8f2a-1234567890ab");
  assert.equal(valid.entityId, "018f2e3a-9c1b-7cde-8f2a-1234567890ab");
  // v4 UUID 与非 UUID 一律拒绝:语义实体身份不允许商品 id 或其他版本混入
  assert.throws(() => entityRef("018f2e3a-9c1b-4cde-8f2a-1234567890ab"));
  assert.throws(() => entityRef("booth:3681787"));
  assert.throws(() => entityRef(""));
});

test("parseCatalogVariantId 拒绝空白输入", () => {
  assert.equal(parseCatalogVariantId("var-01"), "var-01");
  assert.throws(() => parseCatalogVariantId(""));
  assert.throws(() => parseCatalogVariantId("   "));
});

test("RecipeSourceRef.variant 是自由文本,与 CatalogVariantId 类型不同", () => {
  const sourceRef: RecipeSourceRef = { provider: "booth", productId: "3681787", variant: "白色款" };
  // 类型层:自由文本 variant 不可直接赋给 CatalogVariantId(编译期保障);
  // 运行期:只有显式解析能产生 CatalogVariantId
  const parsed: CatalogVariantId = parseCatalogVariantId(sourceRef.variant ?? "");
  assert.equal(parsed, "白色款");
  assert.notEqual(typeof parsed, "undefined");
});

test("catalogProductRef 接受合法 availability(墓碑/下架)并冻结", () => {
  const deleted = catalogProductRef({ productId: "booth:3681787", availability: "deleted" });
  assert.equal(deleted.availability, "deleted");
  assert.ok(Object.isFrozen(deleted));
  // 缺省:不猜测为 available,读取侧按 unknown 处理
  assert.equal(catalogProductRef({ productId: "booth:3681787" }).availability, undefined);
});

test("catalogProductRef 拒绝非法 availability(wire 数据不可信)", () => {
  assert.throws(() =>
    catalogProductRef({
      productId: "booth:3681787",
      // @ts-expect-error 运行时校验:绕过类型层的非法枚举值必须被拒
      availability: "maybe",
    }),
  );
});
