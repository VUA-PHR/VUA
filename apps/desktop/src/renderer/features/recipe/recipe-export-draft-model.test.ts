import assert from "node:assert/strict";
import { test } from "vitest";
import type { RecipeProjectDraft } from "../../gateway/index.ts";
import {
  recipeExportAddItem,
  recipeExportConfirmOpened,
  recipeExportDraftToSaveDocument,
  recipeExportRemoveAddition,
  recipeExportSaveBlocked,
  recipeExportTitleEdited,
  recipeExportUnityConstraintEdited,
} from "./recipe-export-draft-model.ts";
import { composeDraftCompareKey } from "../../app/compose-save-dedup.ts";

/* 项目导出草稿确认流纯模型(029 B 面环 4 桌面消费批):草稿无 recipeId/
 * title/关系面/locked 块,转正 = 用户显式补全后走既有 recipe.save 保存链
 * (同一保存链形状、同一守卫集)。固定时钟(BG-18 确定性)。 */

const T0 = "2026-09-22T04:30:00.000Z";

const NOW = "2026-09-22T05:00:00.000Z";

/** 冻结词表形状的草稿(v0.1 六事实键;lockedVersion 可缺) */
function draft(overrides: Partial<RecipeProjectDraft> = {}): RecipeProjectDraft {
  return {
    schemaVersion: "vua.recipe-export/v0.1",
    draftId: "01900000-0000-7000-8000-000000000001",
    exportedAt: T0,
    origin: {
      projectPath: "C:/projects/DemoAvatar",
      projectName: "DemoAvatar",
      vuaIdentityStatus: "present",
    },
    environment: { unityVersionConstraint: "2022.3.22f1" },
    dependencies: [
      { packageId: "com.vrchat.avatars", versionConstraint: "3.7.x", lockedVersion: "3.7.0" },
      { packageId: "com.animals.some-box", versionConstraint: "1.2.3" },
    ],
    missing: [
      "assets",
      "instances",
      "relations",
      "wardrobeGroups",
      "targetAvatar",
      "assetRoles",
      "assetLabels",
      "sourceRefs",
      "titleSemantics",
    ],
    ...overrides,
  };
}

const assetEntry = {
  warehouseItemId: "wh-1",
  title: "上衣 A",
  role: null,
  nameHint: null,
};

test("opening the confirmation session prefills the title from the project name and keeps additions empty", () => {
  const state = recipeExportConfirmOpened(draft());
  assert.equal(state.title, "DemoAvatar");
  assert.equal(state.additions.length, 0);
  assert.equal(state.unityConstraintInput, null);
  // 名称缺席 = 预填诚实为空(不猜测)
  const unnamed = recipeExportConfirmOpened(
    draft({ origin: { projectPath: "C:/x", projectName: null, vuaIdentityStatus: "absent" } }),
  );
  assert.equal(unnamed.title, "");
});

test("save is blocked until title, (unreadable) unity version, and at least one asset are completed", () => {
  const state = recipeExportConfirmOpened(draft({ environment: { unityVersionConstraint: null } }));
  // 全缺:标题空 + 版本未补 + 零素材
  assert.equal(recipeExportSaveBlocked(state), true);
  const titled = recipeExportTitleEdited(state, "夏日制服");
  assert.equal(recipeExportSaveBlocked(titled), true); // 仍缺版本与素材
  const versioned = recipeExportUnityConstraintEdited(titled, "2022.3.22f1");
  assert.equal(recipeExportSaveBlocked(versioned), true); // 仍缺素材
  const withAsset = recipeExportAddItem(versioned, assetEntry, NOW);
  assert.equal(recipeExportSaveBlocked(withAsset), false);
  // 版本可读的草稿不需要版本补全
  const readable = recipeExportTitleEdited(recipeExportConfirmOpened(draft()), "夏日制服");
  assert.equal(recipeExportSaveBlocked(recipeExportAddItem(readable, assetEntry, NOW)), false);
});

test("title guard: blank trimmed and over-length titles block (recipe v0.3 title 1..120)", () => {
  const base = recipeExportAddItem(
    recipeExportUnityConstraintEdited(
      recipeExportConfirmOpened(draft({ environment: { unityVersionConstraint: null } })),
      "2022.3.22f1",
    ),
    assetEntry,
    NOW,
  );
  assert.equal(recipeExportSaveBlocked(recipeExportTitleEdited(base, "   ")), true);
  assert.equal(recipeExportSaveBlocked(recipeExportTitleEdited(base, "x".repeat(121))), true);
  assert.equal(recipeExportSaveBlocked(recipeExportTitleEdited(base, "x".repeat(120))), false);
  // 可读草稿的版本补全输入不参与守卫(verbatim 呈现不可编)
  const readableBase = recipeExportAddItem(recipeExportConfirmOpened(draft()), assetEntry, NOW);
  assert.equal(
    recipeExportSaveBlocked(recipeExportTitleEdited(recipeExportUnityConstraintEdited(readableBase, ""), "t")),
    false,
  );
});

test("unity completion input only exists while the on-disk observation is unreadable", () => {
  const readable = recipeExportConfirmOpened(draft());
  // 可读 = verbatim 呈现,补全输入无操作(绝不覆写盘上观察)
  assert.equal(recipeExportUnityConstraintEdited(readable, "2019.4.31f1"), readable);
});

test("asset additions are idempotent by identity and removable; D3 derives the mount name", () => {
  let state = recipeExportConfirmOpened(draft());
  state = recipeExportAddItem(state, assetEntry, NOW);
  assert.equal(state.additions.length, 1);
  assert.equal(state.additions[0]?.nameHint, "上衣 A"); // D3 派生
  state = recipeExportAddItem(state, assetEntry, NOW);
  assert.equal(state.additions.length, 1); // 身份幂等
  state = recipeExportRemoveAddition(state, "wh-1");
  assert.equal(state.additions.length, 0);
  state = recipeExportRemoveAddition(state, "wh-1"); // 移除不存在的 = 无操作
  assert.equal(state.additions.length, 0);
});

test("the promotion document rides the compose save document shape and carries the draft's verbatim facts", () => {
  const state = recipeExportAddItem(
    recipeExportTitleEdited(recipeExportConfirmOpened(draft()), "  夏日制服  "),
    assetEntry,
    NOW,
  );
  const document = recipeExportDraftToSaveDocument(state, NOW);
  assert(document !== null);
  // 同一构造器同形状:formatVersion/recipeId 铸造/createdAt/updatedAt/relations
  assert.equal(document.formatVersion, "0.3");
  assert.equal(document.baseRevision, 0); // 首存
  assert.equal(document.title, "夏日制服"); // trim 后用户标题(系统绝不派生标题)
  assert.equal(document.assets.length, 1);
  assert.equal(document.assets[0]?.id, "wh-1");
  assert.equal(document.assets[0]?.role, "other");
  assert.equal(document.instances[0]?.entrypoint.nameHint, "上衣 A");
  assert.equal(document.relations.length, 0);
  // 草稿两维可靠事实 verbatim 转入
  assert.equal(document.environment.unityVersionConstraint, "2022.3.22f1");
  assert.deepEqual(document.dependencies, [
    { packageId: "com.vrchat.avatars", versionConstraint: "3.7.x" },
    { packageId: "com.animals.some-box", versionConstraint: "1.2.3" },
  ]);
  // lockedVersion 是盘上观察事实:只作呈现,绝不进入配方文档(无 locked 块)
  assert.equal("locked" in document, false);
  assert.equal(JSON.stringify(document).includes("3.7.0"), false);
});

test("promotion with an unreadable unity version uses the user-completed constraint verbatim", () => {
  const state = recipeExportAddItem(
    recipeExportUnityConstraintEdited(
      recipeExportTitleEdited(
        recipeExportConfirmOpened(draft({ environment: { unityVersionConstraint: null } })),
        "夏日制服",
      ),
      "2022.3.22f1",
    ),
    assetEntry,
    NOW,
  );
  const document = recipeExportDraftToSaveDocument(state, NOW);
  assert(document !== null);
  assert.equal(document.environment.unityVersionConstraint, "2022.3.22f1");
});

test("blocked sessions produce no document (empty-save rejection, same guard semantics)", () => {
  const noAsset = recipeExportTitleEdited(recipeExportConfirmOpened(draft()), "夏日制服");
  assert.equal(recipeExportDraftToSaveDocument(noAsset, NOW), null);
  const noVersion = recipeExportAddItem(
    recipeExportTitleEdited(
      recipeExportConfirmOpened(draft({ environment: { unityVersionConstraint: null } })),
      "夏日制服",
    ),
    assetEntry,
    NOW,
  );
  assert.equal(recipeExportDraftToSaveDocument(noVersion, NOW), null);
});

test("the dedup compare key is the same compare face as the compose draft (asset set of the would-be save)", () => {
  const state = recipeExportAddItem(
    recipeExportTitleEdited(recipeExportConfirmOpened(draft()), "夏日制服"),
    assetEntry,
    NOW,
  );
  // 与搭配草稿同一判等面:素材身份＋角色＋挂载名多重集
  assert.equal(composeDraftCompareKey(state.additions), composeDraftCompareKey([
    { warehouseItemId: "wh-1", title: "上衣 A", role: null, nameHint: "上衣 A", addedAt: NOW },
  ]));
});
