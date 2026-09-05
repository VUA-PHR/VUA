import assert from "node:assert/strict";
import { test } from "vitest";
import {
  artifactCardMatches,
  artifactCards,
  entryModeLine,
  sizeText,
  type AcquireArtifactCard,
} from "./acquire-model.ts";
import type { WarehouseEntry } from "../../gateway/index.ts";

test("sizeText: B 级整数,不进位", () => {
  assert.deepEqual(sizeText(0), { amount: "0", unitKey: "sizeB" });
  assert.deepEqual(sizeText(512), { amount: "512", unitKey: "sizeB" });
  assert.deepEqual(sizeText(1023), { amount: "1023", unitKey: "sizeB" });
});

test("sizeText: KB/MB/GB 进位与一位小数去尾零", () => {
  assert.deepEqual(sizeText(1024), { amount: "1", unitKey: "sizeKb" });
  assert.deepEqual(sizeText(1536), { amount: "1.5", unitKey: "sizeKb" });
  assert.deepEqual(sizeText(48_332_800), { amount: "46.1", unitKey: "sizeMb" });
  assert.deepEqual(sizeText(2 * 1024 * 1024 * 1024), { amount: "2", unitKey: "sizeGb" });
});

test("sizeText: 非法输入回落 0 B,不猜测", () => {
  assert.deepEqual(sizeText(Number.NaN), { amount: "0", unitKey: "sizeB" });
  assert.deepEqual(sizeText(-5), { amount: "0", unitKey: "sizeB" });
  assert.deepEqual(sizeText(Number.POSITIVE_INFINITY), { amount: "0", unitKey: "sizeB" });
});

/* ---- F4-6 条目模型:卡片展开 / 搜索 / 模式行 ---- */

function entryOf(partial: Partial<WarehouseEntry> & { warehouseItemId: string }): WarehouseEntry {
  return {
    folderName: partial.warehouseItemId,
    displayName: partial.warehouseItemId,
    kind: "imported_material",
    createdAt: "2026-09-01T10:20:00+08:00",
    artifactMode: null,
    effectiveArtifactMode: "use_original_unitypackage",
    artifacts: [
      {
        artifactSha256: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        relativePath: "pack.unitypackage",
        state: "clean",
        sizeBytes: 1024,
        role: "original",
      },
    ],
    ...partial,
  };
}

const entryA = entryOf({ warehouseItemId: "whentry-a" });
const entryB = entryOf({
  warehouseItemId: "whentry-b",
  displayName: "巫女裙套装",
  kind: "downloaded_material",
});

test("artifactCards: 条目 × 工件展开,key 含条目身份与内容身份", () => {
  const twoArtifactEntry = entryOf({
    warehouseItemId: "whentry-two",
    artifacts: [
      {
        artifactSha256: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        relativePath: "orig/pack.unitypackage",
        state: "clean",
        sizeBytes: 1,
        role: "original",
      },
      {
        artifactSha256: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        relativePath: "generated/pack.vpm",
        state: "clean",
        sizeBytes: 2,
        role: "generated_vpm",
      },
    ],
  });
  const cards = artifactCards([entryA, twoArtifactEntry, entryB]);
  assert.equal(cards.length, 4);
  assert.deepEqual(
    cards.map((card) => card.key),
    [
      "whentry-a:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "whentry-two:sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "whentry-two:sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      "whentry-b:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ],
  );
  // 每张卡携带条目上下文(卡片标题与 kind 徽标的来源)
  assert.equal(cards[2]?.entry.warehouseItemId, "whentry-two");
  assert.equal(cards[2]?.artifact.role, "generated_vpm");
});

test("artifactCardMatches: 显示名/文件夹名/相对路径子串,大小写不敏感,空词全过", () => {
  const cards: readonly AcquireArtifactCard[] = artifactCards([entryA, entryB]);
  const miko = cards[1];
  assert.ok(miko !== undefined);
  assert.equal(artifactCardMatches(miko, ""), true);
  assert.equal(artifactCardMatches(miko, "  "), true);
  assert.equal(artifactCardMatches(miko, "巫女"), true);
  assert.equal(artifactCardMatches(miko, "MIKO"), false); // displayName 为中文,拉丁词不命中
  assert.equal(artifactCardMatches(miko, "WHENTRY-B"), true); // folderName 大写不敏感命中
  assert.equal(artifactCardMatches(miko, "whentry-b"), true); // folderName = 条目 id
  assert.equal(artifactCardMatches(miko, "PACK.UNITYPACKAGE"), true); // 相对路径
  assert.equal(artifactCardMatches(miko, "summer"), false);
});

test("entryModeLine: 覆盖与跟随全局两形态,生效模式读取面已解析", () => {
  assert.deepEqual(entryModeLine(entryA), {
    overridden: false,
    effective: "use_original_unitypackage",
  });
  assert.deepEqual(
    entryModeLine(
      entryOf({
        warehouseItemId: "whentry-c",
        artifactMode: "generate_vpm",
        effectiveArtifactMode: "generate_vpm",
      }),
    ),
    { overridden: true, effective: "generate_vpm" },
  );
});
