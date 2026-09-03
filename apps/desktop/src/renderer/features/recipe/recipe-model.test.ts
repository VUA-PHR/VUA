import assert from "node:assert/strict";
import { test } from "vitest";
import {
  deriveGraph,
  basePoints,
  layerOfRole,
  layoutGraph,
  parseRecipeDocument,
  type RecipeDocumentV1,
} from "./recipe-model.ts";

/** 模型层自含最小文档:不依赖 gateway fixture(职责分离) */
function minimalDoc(): RecipeDocumentV1 {
  return {
    schemaVersion: 1,
    recipeId: "r-test",
    title: "Model test doc",
    createdAt: "2026-08-27T10:00:00Z",
    updatedAt: "2026-08-27T10:00:00Z",
    target: { platforms: ["windows"], avatarAssetId: "avatar" },
    assets: [
      { id: "avatar", role: "avatar_base", entityRef: { entityId: "e-avatar" } },
      { id: "hair", role: "hair", entityRef: { entityId: "e-hair" } },
      {
        id: "dress",
        role: "outfit",
        sourceRef: { provider: "booth", productId: "0001" },
      },
      { id: "shader", role: "shader", entityRef: { entityId: "e-shader" } },
    ],
    wardrobeGroups: [
      { id: "g1", memberAssetIds: ["dress"], selectionMode: "zero_or_one" },
    ],
    dependencies: [{ packageId: "nadena.dev.modular-avatar", versionConstraint: ">=1.10 <2.0" }],
  };
}

const texts = { conflictAvatarBase: "conflict between avatar bases" };

test("parseRecipeDocument 拒绝垃圾输入", () => {
  assert.equal(parseRecipeDocument(null), null);
  assert.equal(parseRecipeDocument("recipe"), null);
  assert.equal(parseRecipeDocument({}), null);
  assert.equal(parseRecipeDocument({ ...minimalDoc(), schemaVersion: 2 }), null);
  // 素材缺 id/role 或两种引用都没有 → 拒绝
  const broken = minimalDoc();
  broken.assets.push({ id: "ghost", role: "prop" });
  assert.equal(parseRecipeDocument(broken), null);
});

test("parseRecipeDocument 接受合法文档", () => {
  const doc = parseRecipeDocument(minimalDoc());
  assert.ok(doc !== null);
  assert.equal(doc.recipeId, "r-test");
});

test("layerOfRole 语义分层:基础/衣装/动画/技术", () => {
  assert.equal(layerOfRole("avatar_base"), "body");
  assert.equal(layerOfRole("outfit"), "outfit");
  assert.equal(layerOfRole("hair"), "outfit");
  assert.equal(layerOfRole("expression_pack"), "animation");
  assert.equal(layerOfRole("shader"), "tech");
  assert.equal(layerOfRole("tool_dependency"), "tech");
});

test("deriveGraph:entityRef 已解析 ready、未解析 missing,仅 sourceRef unresolved", () => {
  const graph = deriveGraph(minimalDoc(), new Set(["e-avatar", "e-hair"]), texts);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  assert.equal(byId.get("avatar")?.state, "ready");
  assert.equal(byId.get("hair")?.state, "ready");
  assert.equal(byId.get("shader")?.state, "missing");
  assert.equal(byId.get("dress")?.state, "unresolved");
  assert.deepEqual(graph.missing, ["shader"]);
});

test("deriveGraph:衣橱组成员为虚线 wardrobe 边,其余组成边为实线", () => {
  const graph = deriveGraph(minimalDoc(), new Set(), texts);
  const edge = (to: string) => graph.edges.find((item) => item.to === to);
  assert.equal(edge("hair")?.kind, "composition");
  assert.equal(edge("dress")?.kind, "wardrobe");
  // 每条边都从 avatar 出发
  for (const item of graph.edges) assert.equal(item.from, "avatar");
});

test("deriveGraph:依赖包合成 dep: 节点,恒 unresolved,点线边", () => {
  const graph = deriveGraph(minimalDoc(), new Set(["e-avatar", "e-hair", "e-shader"]), texts);
  const dep = graph.nodes.find((node) => node.id === "dep:nadena.dev.modular-avatar");
  assert.ok(dep !== undefined);
  assert.equal(dep.state, "unresolved");
  assert.equal(dep.role, undefined);
  const edge = graph.edges.find((item) => item.to === dep.id);
  assert.equal(edge?.kind, "dependency");
});

test("deriveGraph:多个必需 avatar_base → 冲突组,绝不自动取舍", () => {
  const doc = minimalDoc();
  doc.assets.push({
    id: "avatar2",
    role: "avatar_base",
    entityRef: { entityId: "e-avatar2" },
  });
  const graph = deriveGraph(doc, new Set(["e-avatar", "e-avatar2"]), texts);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  assert.equal(byId.get("avatar")?.state, "conflict");
  assert.equal(byId.get("avatar2")?.state, "conflict");
  assert.equal(graph.conflicts.length, 1);
  assert.deepEqual([...graph.conflicts[0]!.nodeIds].sort(), ["avatar", "avatar2"]);
  assert.equal(graph.conflicts[0]!.description, texts.conflictAvatarBase);
});

test("deriveGraph:required:false 的第二个 avatar_base 不构成冲突", () => {
  const doc = minimalDoc();
  doc.assets.push({
    id: "avatar2",
    role: "avatar_base",
    required: false,
    entityRef: { entityId: "e-avatar2" },
  });
  const graph = deriveGraph(doc, new Set(["e-avatar", "e-avatar2"]), texts);
  assert.equal(graph.conflicts.length, 0);
  assert.equal(graph.nodes.find((node) => node.id === "avatar2")?.state, "ready");
});

test("layoutGraph(S-XI 力导):主轴 Avatar 精确居中,坐标确定性且有限", () => {
  const graph = deriveGraph(minimalDoc(), new Set(), texts);
  const layout = layoutGraph(graph);
  // 主轴(所有边的共同起点)钉在世界原点 → 渲染坐标 = 世界中心
  const hub = layout.positions.get("avatar");
  assert.ok(hub !== undefined);
  assert.equal(hub.x, layout.width / 2);
  assert.equal(hub.y, layout.height / 2);
  // 世界是正方形,全部坐标有限且落在世界盒内
  assert.equal(layout.width, layout.height);
  for (const p of layout.positions.values()) {
    assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    assert.ok(p.x >= 0 && p.x <= layout.width && p.y >= 0 && p.y <= layout.height);
  }
  // 确定性:同输入同输出(无随机源)
  assert.deepEqual(layout, layoutGraph(graph));
});

test("layoutGraph(S-XI 力导):语义层径向带——衣装平均比技术层更靠近中心", () => {
  const graph = deriveGraph(minimalDoc(), new Set(), texts);
  const points = basePoints(graph);
  const dist = (id: string) => {
    const p = points.get(id);
    assert.ok(p !== undefined);
    return Math.hypot(p.x, p.y);
  };
  const outfitAvg = (dist("hair") + dist("dress")) / 2;
  const techAvg = (dist("shader") + dist("dep:nadena.dev.modular-avatar")) / 2;
  assert.ok(outfitAvg < techAvg, `outfit ${outfitAvg} 应小于 tech ${techAvg}`);
});
