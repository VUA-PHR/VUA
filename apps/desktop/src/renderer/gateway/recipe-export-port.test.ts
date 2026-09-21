import { describe, expect, it } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import {
  createLiveRecipeExportPort,
  createUnavailableRecipeExportPort,
  narrowRecipeProjectDraft,
} from "./recipe-export-port.ts";
import type { GatewayClient, GatewayResult } from "./gateway-client.ts";

/**
 * recipe-export 端口窄化测试(029 B 面环 4 桌面消费批):回执按冻结 Schema
 * 键形收窄——信封族常量 vua.recipe-export/v0.1 精确命中、六事实键必需键
 * 收不齐 = 不可解释(诚实失败不猜测);应用错误按码归类(project_not_found
 * = request_rejected,其余 = unavailable);传输异常 = unavailable;
 * empty/fixture 臂 = 恒 unavailable 诚实缺席(不伪造草稿)。
 */

function asWire(value: unknown): DesktopGatewaySuccessValueV1 {
  return value as DesktopGatewaySuccessValueV1;
}

function ok(value: unknown): GatewayResult<DesktopGatewaySuccessValueV1> {
  return {
    schemaVersion: 1,
    requestId: "test",
    ok: true,
    value: asWire(value),
  } as GatewayResult<DesktopGatewaySuccessValueV1>;
}

function appError(code: string): GatewayResult<DesktopGatewaySuccessValueV1> {
  return {
    schemaVersion: 1,
    requestId: "test",
    ok: false,
    error: {
      kind: "application",
      error: {
        contractVersion: "0.1",
        code,
        category: "validation",
        messageKey: "test",
        recoverable: false,
        retryable: false,
        correlationId: "test",
      },
    },
  } as unknown as GatewayResult<DesktopGatewaySuccessValueV1>;
}

function fakeClient(invoke: (request: DesktopGatewayRequestV1) => Promise<GatewayResult<DesktopGatewaySuccessValueV1>>): GatewayClient {
  return { invoke, subscribe: () => () => {} };
}

const VALID_RESULT = {
  schemaVersion: "vua.recipe-export/v0.1",
  operation: "recipe.exportProjectDraft",
  result: {
    schemaVersion: "vua.recipe-export/v0.1",
    draftId: "01900000-0000-7000-8000-000000000001",
    exportedAt: "2026-09-22T04:30:00.000Z",
    origin: {
      projectPath: "C:/projects/DemoAvatar",
      projectName: null,
      vuaIdentityStatus: "absent",
    },
    environment: { unityVersionConstraint: null },
    dependencies: [
      { packageId: "com.vrchat.avatars", versionConstraint: "3.7.x", lockedVersion: "3.7.0" },
      { packageId: "com.a.box", versionConstraint: "1.0" },
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
      "environmentUnityVersion",
    ],
  },
};

function resultWith(overrides: Record<string, unknown>): unknown {
  return {
    ...VALID_RESULT,
    result: { ...(VALID_RESULT.result as Record<string, unknown>), ...overrides },
  };
}

describe("narrowRecipeProjectDraft", () => {
  it("accepts the frozen word-face envelope with the six fact keys (empty dependencies are an honest answer)", () => {
    const draft = narrowRecipeProjectDraft(VALID_RESULT);
    expect(draft).not.toBeNull();
    assertDraft(draft);
  });

  it("rejects a foreign envelope family constant and a foreign operation", () => {
    expect(narrowRecipeProjectDraft({ ...VALID_RESULT, schemaVersion: "vua.recipe-export/v0.2" })).toBeNull();
    expect(narrowRecipeProjectDraft({ ...VALID_RESULT, operation: "recipe.list" })).toBeNull();
    expect(narrowRecipeProjectDraft(null)).toBeNull();
    expect(narrowRecipeProjectDraft("text")).toBeNull();
  });

  it("rejects drafts missing required keys or carrying mis-typed facts (never renders half-trusted drafts)", () => {
    expect(narrowRecipeProjectDraft(resultWith({ draftId: undefined }))).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ draftId: "" }))).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ exportedAt: 42 }))).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ origin: { projectPath: "C:/x" } }))).toBeNull();
    expect(
      narrowRecipeProjectDraft(
        resultWith({ origin: { projectPath: "C:/x", projectName: null, vuaIdentityStatus: "garbage" } }),
      ),
    ).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ environment: {} }))).toBeNull();
    expect(
      narrowRecipeProjectDraft(resultWith({ environment: { unityVersionConstraint: 2022 } })),
    ).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ dependencies: "none" }))).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ dependencies: [{ packageId: "x" }] }))).toBeNull();
    expect(
      narrowRecipeProjectDraft(
        resultWith({ dependencies: [{ packageId: "x", versionConstraint: "1", lockedVersion: null }] }),
      ),
    ).toBeNull();
    expect(narrowRecipeProjectDraft(resultWith({ missing: ["assets"] }))).toBeNull();
    expect(
      narrowRecipeProjectDraft(
        resultWith({ missing: [...(VALID_RESULT.result as { missing: string[] }).missing.slice(0, -1), "invented"] }),
      ),
    ).toBeNull();
    expect(
      narrowRecipeProjectDraft(
        resultWith({ missing: [...(VALID_RESULT.result as { missing: string[] }).missing, "assets"] }),
      ),
    ).toBeNull();
  });

  function assertDraft(draft: ReturnType<typeof narrowRecipeProjectDraft>): void {
    expect(draft?.schemaVersion).toBe("vua.recipe-export/v0.1");
    expect(draft?.origin.projectName).toBeNull();
    expect(draft?.origin.vuaIdentityStatus).toBe("absent");
    expect(draft?.environment.unityVersionConstraint).toBeNull();
    expect(draft?.dependencies[0]?.lockedVersion).toBe("3.7.0");
    expect(draft?.dependencies[1]?.lockedVersion).toBeUndefined();
    expect(draft?.missing).toHaveLength(10);
  }
});

describe("createLiveRecipeExportPort", () => {
  it("narrows a well-formed success and classifies typed application errors by code", async () => {
    const seen: DesktopGatewayRequestV1[] = [];
    const port = createLiveRecipeExportPort(
      fakeClient(async (request) => {
        seen.push(request);
        return ok(VALID_RESULT);
      }),
    );
    const outcome = await port.exportProjectDraft("C:/projects/DemoAvatar");
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.draft.draftId).toBe("01900000-0000-7000-8000-000000000001");
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      method: "recipe.exportProjectDraft",
      params: { projectPath: "C:/projects/DemoAvatar" },
    });

    const notFound = await createLiveRecipeExportPort(
      fakeClient(async () => appError("vua.project.project_not_found")),
    ).exportProjectDraft("C:/gone");
    expect(notFound).toEqual({ ok: false, error: { kind: "request_rejected" } });

    const unavailable = await createLiveRecipeExportPort(
      fakeClient(async () => appError("vua.recipe_export.unavailable")),
    ).exportProjectDraft("C:/x");
    expect(unavailable).toEqual({ ok: false, error: { kind: "unavailable" } });

    const unexplained = await createLiveRecipeExportPort(
      fakeClient(async () => ok({ some: "junk" })),
    ).exportProjectDraft("C:/x");
    expect(unexplained).toEqual({ ok: false, error: { kind: "unavailable" } });

    const thrown = await createLiveRecipeExportPort(
      fakeClient(async () => {
        throw new Error("transport");
      }),
    ).exportProjectDraft("C:/x");
    expect(thrown).toEqual({ ok: false, error: { kind: "unavailable" } });
  });
});

describe("createUnavailableRecipeExportPort", () => {
  it("stays honestly absent for empty/fixture assemblies (no fabricated drafts)", async () => {
    const outcome = await createUnavailableRecipeExportPort().exportProjectDraft("C:/x");
    expect(outcome).toEqual({ ok: false, error: { kind: "unavailable" } });
  });
});
