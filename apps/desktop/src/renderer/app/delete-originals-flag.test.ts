import assert from "node:assert/strict";
import { test } from "vitest";
import { shouldResetDeleteFlag } from "./delete-originals-flag.ts";

/* 裁决 11(2026-09-09 用户裁定,走查 A4 行 2 自动取消):「生成 VPM 包替代」
 * 主开关关闭(全局默认写回非 generate_vpm)时,行 2「生成后删除原始素材文件」
 * 偏好自动复位为关。判定抽为纯函数覆盖;接线在设置页写回执处(清持久偏好,
 * 不溯已受理删除任务——服务端独立审计)。 */

test("shouldResetDeleteFlag: 主开关关闭(写回 use_original_unitypackage)= 行 2 自动复位", () => {
  assert.equal(shouldResetDeleteFlag("use_original_unitypackage"), true);
});

test("shouldResetDeleteFlag: 主开关开启(写回 generate_vpm)= 行 2 保持现状", () => {
  assert.equal(shouldResetDeleteFlag("generate_vpm"), false);
});
