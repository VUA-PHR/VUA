import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewayResponseV1,
  EnvironmentVerifyEditorResultV01,
} from "@vua/contracts";
import { MockOrchestratorProviderV01 } from "@vua/orchestrator-provider";
import { routeDesktopGatewayInvoke } from "./gateway-router.js";

/**
 * U10 editor-verify 向量消费测试(021 桌面 TS 面登记批,016/021 时序
 * 「TS 面登记时正反例测试向量照正 3 负 3 对表」):直接读取仓库根
 * schemas/editor-verify/v0.1/examples/*.json(环境域落库面,只读不改),
 * 经 Gateway 全链(信封守卫 → router 臂翻译 → mock 注入回放)验证:
 * - 六场景 request 逐字段到达验证面(path verbatim,桌面零归一化);
 * - result 与向量逐字段一致(verified 六字段 / refused 三字段 + schemaVersion);
 * - 拒绝全部 ok:true + verdict:"refused"——拒绝绝不冒充错误信封(钉子一)。
 * schema / Rust(provider-host editor_verify_wire)/ TS 任一漂移在此失败。
 */

const VECTORS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../schemas/editor-verify/v0.1/examples",
);

describe("editor-verify vectors replay green through the gateway route (021)", () => {
  it("replays every vector scene against the mock-injected verdicts, 6/6 green", async () => {
    const requestFiles = readdirSync(VECTORS_DIR)
      .filter((name) => name.endsWith(".request.json"))
      .sort();
    assert.ok(
      requestFiles.length >= 6,
      `the editor-verify vector set must stay populated (found ${requestFiles.length})`,
    );
    assert.equal(
      requestFiles.length,
      readdirSync(VECTORS_DIR).filter((name) => name.endsWith(".result.json")).length,
      "every request vector must have a matching result vector",
    );

    /** 向量剧本:path → 冻结 result(mock 注入面只回放,零裁决) */
    const verdicts = new Map<string, unknown>();
    for (const requestFile of requestFiles) {
      const stem = requestFile.replace(/\.request\.json$/, "");
      const request = JSON.parse(
        readFileSync(path.join(VECTORS_DIR, requestFile), "utf8"),
      ) as { path: string };
      const result = JSON.parse(
        readFileSync(path.join(VECTORS_DIR, `${stem}.result.json`), "utf8"),
      );
      verdicts.set(request.path, result);
    }

    const seenPaths: string[] = [];
    const provider = new MockOrchestratorProviderV01({
      capabilities: [{ operationId: "environment.verifyEditor", availability: "available" }],
      environmentVerifyEditor: (pickedPath) => {
        seenPaths.push(pickedPath);
        const result = verdicts.get(pickedPath);
        assert.ok(result, `mock must not be asked about a path outside the vector set: ${pickedPath}`);
        return result as EnvironmentVerifyEditorResultV01;
      },
    });
    await provider.start();

    const route = (request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1> =>
      routeDesktopGatewayInvoke(
        {
          provider,
          productVersion: "0.6.0",
          platform: "win32",
          rendererUrl: "http://127.0.0.1:5173",
          resolveMaterialSource: () => undefined,
        },
        "http://127.0.0.1:5173/",
        request,
      );

    for (const requestFile of requestFiles) {
      const stem = requestFile.replace(/\.request\.json$/, "");
      const vectorRequest = JSON.parse(
        readFileSync(path.join(VECTORS_DIR, requestFile), "utf8"),
      ) as { path: string };
      const vectorResult = JSON.parse(
        readFileSync(path.join(VECTORS_DIR, `${stem}.result.json`), "utf8"),
      ) as Record<string, unknown>;

      const response = await route({
        schemaVersion: 1,
        requestId: `req-${stem}`,
        method: "environment.verifyEditor",
        params: { path: vectorRequest.path },
      });

      assert.ok(response.ok, `${stem}: the route must deliver refusals as normal results`);
      assert.deepEqual(
        response.value,
        vectorResult,
        `${stem}: wire result must match the frozen vector verbatim`,
      );
    }

    // 透传钉死:六个场景的 path 全部逐字到达验证面(含反斜杠,零归一化)
    assert.equal(seenPaths.length, requestFiles.length);
  });
});
