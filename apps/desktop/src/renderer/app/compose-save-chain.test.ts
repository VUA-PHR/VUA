import { describe, expect, it } from "vitest";
import type { DesktopGatewayResponseV1 } from "@vua/contracts";
import {
  classifyComposeSaveResult,
  composeSaveBlocked,
} from "./compose-save-chain.ts";
import { emptyComposeDraft, type ComposeDraftItem } from "./compose-draft-store.ts";
import type { ComposeDraftState } from "./compose-draft-store.ts";

function item(overrides: Partial<ComposeDraftItem> = {}): ComposeDraftItem {
  return {
    warehouseItemId: "wh-1",
    title: "Entry",
    role: null,
    nameHint: "hint",
    addedAt: "2026-09-14T00:00:00.000Z",
    ...overrides,
  };
}

describe("composeSaveBlocked", () => {
  it("空草稿不阻止提交(可提交性由文档映射的空判定兜底)", () => {
    expect(composeSaveBlocked(emptyComposeDraft.items)).toBe(false);
  });

  it("nameHint 非空白 → 不阻止", () => {
    expect(composeSaveBlocked([item({ nameHint: "top" })])).toBe(false);
  });

  it("nameHint 为 null → 阻止(用户命名提示未填)", () => {
    expect(composeSaveBlocked([item({ nameHint: null })])).toBe(true);
  });

  it("nameHint 纯空白 → 阻止(与编辑禁用规则一致)", () => {
    expect(composeSaveBlocked([item({ nameHint: "   " })])).toBe(true);
  });

  it("任一条目未填即阻止(整单规则,非逐条)", () => {
    expect(composeSaveBlocked([item(), item({ warehouseItemId: "wh-2", nameHint: null })])).toBe(
      true,
    );
  });
});

describe("classifyComposeSaveResult", () => {
  // 分类器对 value 面 opaque(与实现一致:原样窥视 recipeId/revision),
  // 包络整体断言为契约类型
  const okEnvelope = (value: unknown): DesktopGatewayResponseV1 =>
    ({
      schemaVersion: 1,
      requestId: "req-1",
      ok: true,
      value,
    }) as DesktopGatewayResponseV1;

  it("ok 回执且载荷可解释 → saved(身份原样透传,不派生)", () => {
    expect(classifyComposeSaveResult(okEnvelope({ recipeId: "r-1", revision: 3 }))).toEqual({
      kind: "saved",
      recipeId: "r-1",
      revision: 3,
    });
  });

  it("ok:false → failed(失败如实呈现)", () => {
    expect(
      classifyComposeSaveResult({
        schemaVersion: 1,
        requestId: "req-1",
        ok: false,
        error: { code: "invalid_request", messageKey: "vua_invalid_params" },
      }).kind,
    ).toBe("failed");
    expect(
      classifyComposeSaveResult({
        schemaVersion: 1,
        requestId: "req-1",
        ok: false,
        error: { code: "internal", messageKey: "fallback" },
      }).kind,
    ).toBe("failed");
  });

  it("recipeId 缺失/非字符串 → failed(不可解释回执不猜测)", () => {
    expect(classifyComposeSaveResult(okEnvelope({ revision: 1 })).kind).toBe("failed");
    expect(classifyComposeSaveResult(okEnvelope({ recipeId: 7, revision: 1 })).kind).toBe(
      "failed",
    );
  });

  it("revision 缺失/非数值 → failed", () => {
    expect(classifyComposeSaveResult(okEnvelope({ recipeId: "r-1" })).kind).toBe("failed");
    expect(classifyComposeSaveResult(okEnvelope({ recipeId: "r-1", revision: "3" })).kind).toBe(
      "failed",
    );
  });

  it("空载荷 → failed", () => {
    expect(classifyComposeSaveResult(okEnvelope({})).kind).toBe("failed");
  });
});

describe("ComposeDraftState 兼容", () => {
  it("composeSaveBlocked 接受草稿状态条目(类型面)", () => {
    const state: ComposeDraftState = emptyComposeDraft;
    expect(composeSaveBlocked(state.items)).toBe(false);
  });
});
