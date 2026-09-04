import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import { deriveGraph } from "../features/recipe/recipe-model.ts";
import type { RecipeGraphView } from "./model-production-port.ts";
import { CURRENT_RECIPE_ID } from "./model-production-port.ts";
import { fixtureRecipeDocs, fixtureResolvedEntities } from "./fixture-recipes-data.ts";

/**
 * Recipe 图谱 fixture 适配(C-RECIPE,仅 DEV 可达):
 * "current"(当前配方占位 id,见 model-production-port)映射到 rich 场景;
 * DEV 走查可用 "fixture:<词干>" 直达其余场景(missing-assets / conflict /
 * multi-file-package)。未知 id 诚实返回 not-connected,不返回猜测图谱。
 */
export function fixtureRecipeGraph(recipeId: string): RecipeGraphView {
  const name = recipeId === CURRENT_RECIPE_ID ? "rich" : recipeId.replace(/^fixture:/, "");
  const doc = fixtureRecipeDocs.get(name);
  if (!doc) return { schemaVersion: 1, kind: "not-connected" };
  const resolved = new Set(fixtureResolvedEntities.get(name) ?? []);
  return deriveGraph(doc, resolved, {
    conflictAvatarBase: fixtureStrings.recipe.conflictAvatarBase,
  });
}
