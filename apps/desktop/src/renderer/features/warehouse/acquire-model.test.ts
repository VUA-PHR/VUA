import assert from "node:assert/strict";
import { test } from "vitest";
import {
  artifactCardMatches,
  artifactCards,
  commandErrorText,
  entryActions,
  entryModeLine,
  experimentalActionGates,
  settingsEntryOptions,
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

/* ---- F4-9 条目动作可见性(bdl-commands v0.1 入口条件镜像) ---- */

function withArtifacts(
  partial: Partial<WarehouseEntry> & { warehouseItemId: string },
  roles: ReadonlyArray<"original" | "generated_vpm">,
): WarehouseEntry {
  const entry = entryOf(partial);
  return {
    ...entry,
    artifacts: roles.map((role, index) => ({
      ...entry.artifacts[0]!,
      artifactSha256: `sha256:${role}-${index}-${"0".repeat(48)}`,
      role,
    })),
  };
}

test("entryActions: 生效模式非 generate_vpm 时动作整组不出现", () => {
  assert.deepEqual(entryActions(entryOf({ warehouseItemId: "whentry-x" })), []);
  assert.deepEqual(
    entryActions(entryOf({
      warehouseItemId: "whentry-y",
      artifactMode: "generate_vpm",
      effectiveArtifactMode: "use_original_unitypackage",
    })),
    [],
  );
});

test("entryActions: 生成入口 = 生效 generate_vpm + 有原始件 + 无生成副本", () => {
  assert.deepEqual(
    entryActions(withArtifacts({
      warehouseItemId: "whentry-gen",
      effectiveArtifactMode: "generate_vpm",
    }, ["original"])),
    ["generateVpm"],
  );
  // 已有生成副本:生成入口消失(副本永不静默替换),删除入口出现
  assert.deepEqual(
    entryActions(withArtifacts({
      warehouseItemId: "whentry-both",
      effectiveArtifactMode: "generate_vpm",
    }, ["original", "generated_vpm"])),
    ["deleteOriginals"],
  );
});

test("entryActions: 删除入口 = 生效 generate_vpm + 生成副本在场", () => {
  assert.deepEqual(
    entryActions(withArtifacts({
      warehouseItemId: "whentry-del",
      artifactMode: "generate_vpm",
      effectiveArtifactMode: "generate_vpm",
    }, ["generated_vpm"])),
    ["deleteOriginals"],
  );
  // 生效 generate_vpm 但无生成副本:删除入口不出现(服务端守卫必拒)
  assert.deepEqual(
    entryActions(withArtifacts({
      warehouseItemId: "whentry-none",
      effectiveArtifactMode: "generate_vpm",
    }, ["original"])),
    ["generateVpm"],
  );
});

/* ---- W15 设置-实验性两级选项(前置镜像 + 选择器投影 + 错误文案映射) ---- */

test("experimentalActionGates: 生效 generate_vpm + 有原始件 + 无生成副本 = 生成可用,删除置灰", () => {
  const gates = experimentalActionGates(
    withArtifacts({ warehouseItemId: "whentry-g1", effectiveArtifactMode: "generate_vpm" }, [
      "original",
    ]),
  );
  assert.deepEqual(gates.generateVpm, { available: true, reason: null });
  assert.deepEqual(gates.deleteOriginals, { available: false, reason: "noGeneratedCopy" });
});

test("experimentalActionGates: 已有生成副本 = 生成置灰(alreadyGenerated),删除可用", () => {
  const gates = experimentalActionGates(
    withArtifacts({ warehouseItemId: "whentry-g2", effectiveArtifactMode: "generate_vpm" }, [
      "original",
      "generated_vpm",
    ]),
  );
  assert.deepEqual(gates.generateVpm, { available: false, reason: "alreadyGenerated" });
  assert.deepEqual(gates.deleteOriginals, { available: true, reason: null });
});

test("experimentalActionGates: 生效模式非 generate_vpm = 两选项均置灰 modeNotGenerateVpm", () => {
  const gates = experimentalActionGates(
    withArtifacts(
      {
        warehouseItemId: "whentry-g4",
        artifactMode: "generate_vpm",
        effectiveArtifactMode: "use_original_unitypackage",
      },
      ["original", "generated_vpm"],
    ),
  );
  // 覆盖存在但生效模式由服务端读回解析:生效非 generate_vpm 时整组置灰
  assert.deepEqual(gates.generateVpm, { available: false, reason: "modeNotGenerateVpm" });
  assert.deepEqual(gates.deleteOriginals, { available: false, reason: "modeNotGenerateVpm" });
});

test("experimentalActionGates: 生效 generate_vpm 但无原始件 = 生成置灰 noOriginal", () => {
  const gates = experimentalActionGates(
    withArtifacts({ warehouseItemId: "whentry-g5", effectiveArtifactMode: "generate_vpm" }, [
      "generated_vpm",
    ]),
  );
  assert.deepEqual(gates.generateVpm, { available: false, reason: "noOriginal" });
  assert.deepEqual(gates.deleteOriginals, { available: true, reason: null });
});

test("experimentalActionGates 与 entryActions 的可用性逐一对应", () => {
  const samples: ReadonlyArray<ReadonlyArray<"original" | "generated_vpm">> = [
    [],
    ["original"],
    ["generated_vpm"],
    ["original", "generated_vpm"],
  ];
  for (const roles of samples) {
    for (const effective of ["use_original_unitypackage", "generate_vpm"] as const) {
      const entry = withArtifacts({ warehouseItemId: "whentry-x", effectiveArtifactMode: effective }, roles);
      const gates = experimentalActionGates(entry);
      const actions = entryActions(entry);
      assert.equal(gates.generateVpm.available, actions.includes("generateVpm"));
      assert.equal(gates.deleteOriginals.available, actions.includes("deleteOriginals"));
    }
  }
});

test("settingsEntryOptions: 值=条目身份,标签=显示名,副行=文件夹名", () => {
  const options = settingsEntryOptions([
    entryOf({ warehouseItemId: "whentry-s1", displayName: "示例条目一" }),
    entryOf({ warehouseItemId: "whentry-s2", displayName: "示例条目二" }),
  ]);
  assert.deepEqual(options, [
    { value: "whentry-s1", label: "示例条目一", folderName: "whentry-s1" },
    { value: "whentry-s2", label: "示例条目二", folderName: "whentry-s2" },
  ]);
});

test("commandErrorText: 已知码查表,未知码回落 fallback,传输面回落服务未接入", () => {
  const table = {
    vua_warehouse_invalid_state: "模式不符",
    vua_warehouse_unavailable: "服务未接入",
    fallback: "操作未能完成",
  };
  assert.equal(
    commandErrorText(
      { kind: "application", code: "vua.warehouse.invalid_state" },
      table,
    ),
    "模式不符",
  );
  assert.equal(
    commandErrorText({ kind: "application", code: "vua.warehouse.unknown_code" }, table),
    "操作未能完成",
  );
  assert.equal(commandErrorText({ kind: "unavailable" }, table), "服务未接入");
  assert.equal(commandErrorText({ kind: "request_rejected" }, table), "服务未接入");
});

/* ---- W15 重做:全局默认读面推断(设置页全局开关初值) ---- */

import { inferGlobalDefaultMode } from "./acquire-model.ts";

test("inferGlobalDefaultMode: 无覆盖条目的生效模式即全局默认;不可知如实 unknown", () => {
  // 无覆盖条目:生效模式 = composed 全局默认
  const known = inferGlobalDefaultMode([
    entryOf({ warehouseItemId: "whentry-i1", artifactMode: "generate_vpm", effectiveArtifactMode: "generate_vpm" }),
    entryOf({ warehouseItemId: "whentry-i2" }),
  ]);
  assert.deepEqual(known, { kind: "known", mode: "use_original_unitypackage" });

  // 全部条目有覆盖:不可知,不猜测
  const unknown = inferGlobalDefaultMode([
    entryOf({ warehouseItemId: "whentry-i3", artifactMode: "generate_vpm", effectiveArtifactMode: "generate_vpm" }),
  ]);
  assert.deepEqual(unknown, { kind: "unknown" });

  // 空仓库:不可知
  assert.deepEqual(inferGlobalDefaultMode([]), { kind: "unknown" });
});
