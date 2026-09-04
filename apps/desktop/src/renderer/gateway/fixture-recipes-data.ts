import type { RecipeDocumentV1 } from "../features/recipe/recipe-model.ts";

/**
 * Recipe fixture 文档的内嵌副本(仅 DEV 可达:fixture-gateway.ts 引用链,
 * 生产构建被 Tree-shaking 剔除)。
 *
 * 单一事实源是 schemas/recipe/v1/fixtures/*.recipe.json;此处内嵌是因为
 * 运行时 JSON import 无法同时满足 Vite 打包与 node --test 契约测试。
 * 漂移防线:gateway/fixture-recipes.test.ts 逐字节比对本文件与 JSON 源;
 * JSON 源本身的合法性由 packages/contracts 的 recipe-fixtures 测试把守。
 */

const rich: RecipeDocumentV1 = {
  schemaVersion: 1,
  recipeId: "019c0000-0000-7000-8000-000000000101",
  title: "Rich full-featured recipe (test sample)",
  description:
    "Exercises variants, wardrobe groups, dependencies and extensions. Self-authored redistributable fixture; all entities and URLs are placeholders.",
  createdAt: "2026-08-27T10:00:00Z",
  updatedAt: "2026-08-27T10:00:00Z",
  target: {
    platforms: ["windows", "android"],
    avatarAssetId: "avatar",
    performanceTarget: "good",
  },
  assets: [
    {
      id: "avatar",
      role: "avatar_base",
      label: "Sample Avatar Base",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000110" },
    },
    {
      id: "hair_long",
      role: "hair",
      label: "Sample Long Hair",
      variant: "straight",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000111" },
    },
    {
      id: "casual",
      role: "outfit",
      label: "Sample Casual Outfit",
      variant: "blue",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000112" },
    },
    {
      id: "formal",
      role: "outfit",
      label: "Sample Formal Outfit",
      sourceRef: {
        provider: "booth",
        productId: "0000001",
        url: "https://example.invalid/items/0000001",
      },
    },
    {
      id: "glasses",
      role: "accessory",
      label: "Sample Glasses",
      required: false,
      sourceRef: {
        provider: "booth",
        productId: "0000002",
        url: "https://example.invalid/items/0000002",
      },
    },
    {
      id: "toon_shader",
      role: "shader",
      label: "Sample Toon Shader",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000113" },
      versionConstraint: ">=1.0 <2.0",
    },
    {
      id: "skin_textures",
      role: "texture_pack",
      label: "Sample Skin Textures",
      variant: "hd",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000114" },
    },
  ],
  wardrobeGroups: [
    {
      id: "main_outfit",
      label: "Outfit",
      memberAssetIds: ["casual", "formal"],
      selectionMode: "exactly_one",
      defaultAssetIds: ["casual"],
    },
  ],
  dependencies: [
    { packageId: "nadena.dev.modular-avatar", versionConstraint: ">=1.10 <2.0" },
  ],
  extensions: {
    "dev.vua.example": { fixture: "rich", note: "test sample; not a real product" },
  },
};

const missingAssets: RecipeDocumentV1 = {
  schemaVersion: 1,
  recipeId: "019c0000-0000-7000-8000-000000000102",
  title: "Missing-assets recipe (test sample)",
  description:
    "Legally valid document whose entityRefs intentionally do not resolve in the local warehouse fixture, exercising the missing-node graph state. Self-authored redistributable fixture.",
  createdAt: "2026-08-27T10:00:00Z",
  updatedAt: "2026-08-27T10:00:00Z",
  target: { platforms: ["windows"], avatarAssetId: "avatar" },
  assets: [
    {
      id: "avatar",
      role: "avatar_base",
      label: "Sample Avatar Base",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000110" },
    },
    {
      id: "outfit_missing",
      role: "outfit",
      label: "Missing Outfit Sample",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000009901" },
    },
    {
      id: "animation_missing",
      role: "animation_pack",
      label: "Missing Animation Pack Sample",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000009902" },
    },
  ],
  extensions: {
    "dev.vua.example": {
      fixture: "missing-assets",
      note: "entityIds 019c...9901/9902 intentionally absent from the fixture warehouse",
    },
  },
};

const conflict: RecipeDocumentV1 = {
  schemaVersion: 1,
  recipeId: "019c0000-0000-7000-8000-000000000103",
  title: "Conflicting avatar bases (test sample)",
  description:
    "Legally valid document with two required avatar_base assets; the graph layer must surface this as a conflict (red frame), never auto-resolve it. Self-authored redistributable fixture.",
  createdAt: "2026-08-27T10:00:00Z",
  updatedAt: "2026-08-27T10:00:00Z",
  target: { platforms: ["windows"], avatarAssetId: "avatar_main" },
  assets: [
    {
      id: "avatar_main",
      role: "avatar_base",
      label: "Sample Avatar Base A",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000110" },
    },
    {
      id: "avatar_alt",
      role: "avatar_base",
      label: "Sample Avatar Base B",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000115" },
    },
    {
      id: "hair_long",
      role: "hair",
      label: "Sample Long Hair",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000111" },
    },
  ],
  extensions: {
    "dev.vua.example": {
      fixture: "conflict",
      note: "two required avatar_base assets: graph must flag conflict, target.avatarAssetId still points at avatar_main",
    },
  },
};

const multiFilePackage: RecipeDocumentV1 = {
  schemaVersion: 1,
  recipeId: "019c0000-0000-7000-8000-000000000104",
  title: "Multi-file package recipe (test sample)",
  description:
    "Legally valid document whose outfit asset bundles multiple files (recorded as lazy extension metadata); the graph layer renders it as one node with a multi-file badge. Self-authored redistributable fixture.",
  createdAt: "2026-08-27T10:00:00Z",
  updatedAt: "2026-08-27T10:00:00Z",
  target: { platforms: ["windows"], avatarAssetId: "avatar" },
  assets: [
    {
      id: "avatar",
      role: "avatar_base",
      label: "Sample Avatar Base",
      entityRef: { entityId: "019c0000-0000-7000-8000-000000000110" },
    },
    {
      id: "winter_set",
      role: "outfit",
      label: "Sample Winter Set",
      variant: "complete-pack",
      sourceRef: {
        provider: "booth",
        productId: "0000003",
        url: "https://example.invalid/items/0000003",
      },
    },
  ],
  extensions: {
    "dev.vua.example": {
      fixture: "multi-file-package",
      files: ["coat", "scarf", "boots"],
      note: "files are descriptive fixture metadata, not paths or archive hashes",
    },
  },
};

export const fixtureRecipeDocs: ReadonlyMap<string, RecipeDocumentV1> = new Map([
  ["rich", rich],
  ["missing-assets", missingAssets],
  ["conflict", conflict],
  ["multi-file-package", multiFilePackage],
]);

/**
 * 各 fixture 的"本地已解析实体"集合(模拟 Warehouse 持有):
 * missing-assets 只解析 avatar 本体,其余 entityRef 故意缺失;
 * multi-file-package 的 winter_set 仅 sourceRef,恒 unresolved。
 */
export const fixtureResolvedEntities: ReadonlyMap<string, readonly string[]> = new Map([
  [
    "rich",
    [
      "019c0000-0000-7000-8000-000000000110",
      "019c0000-0000-7000-8000-000000000111",
      "019c0000-0000-7000-8000-000000000112",
      "019c0000-0000-7000-8000-000000000113",
      "019c0000-0000-7000-8000-000000000114",
    ],
  ],
  ["missing-assets", ["019c0000-0000-7000-8000-000000000110"]],
  [
    "conflict",
    [
      "019c0000-0000-7000-8000-000000000110",
      "019c0000-0000-7000-8000-000000000115",
      "019c0000-0000-7000-8000-000000000111",
    ],
  ],
  ["multi-file-package", ["019c0000-0000-7000-8000-000000000110"]],
]);
