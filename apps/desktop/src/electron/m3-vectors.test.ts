import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { TERMINAL_TASK_STATES_V01, type DesktopGatewayRequestV1, type DesktopGatewayResponseV1 } from "@vua/contracts";
import { MockOrchestratorProviderV01 } from "@vua/orchestrator-provider";
import {
  routeDesktopGatewayInvoke,
  type ProductionContextV02,
} from "./gateway-router.js";

/**
 * M3/T2 固定向量消费测试(三处同批的 F 端):直接读取仓库根
 * schemas/amf-production/v0.2/vectors/*.json(只读,B 侧文件不改),经
 * Gateway 全链(renderer 信封守卫 → router 臂翻译 → mock provider)回放,
 * 与 Rust m3_vectors.rs 消费同一批文件——schema / Rust / TS 任一漂移在此
 * 失败。加载语义镜像 Rust 侧:有序 steps、$var 整值替换(响应派生变量
 * 从前一步回执收割)、waitTerminal 轮询任务终态;断言算子穷尽向量实际
 * 所用(ok / errorCode / startsWith / isArray / equals,点路径),不发明
 * 新算子;ok:false 时错误码精确匹配。
 *
 * startInspection 的四元组由向量自身携带(Kernel 替身按当前 step 返回),
 * 因此缺参负例(start-inspection.missing-params)可完整走通应用层校验。
 */

const VECTORS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../schemas/amf-production/v0.2/vectors",
);

/** 外部变量:测试合成本地目录(mkdir;mock 不读取内容,目录即契约事实) */
function makeWorld(): { base: string; variables: Record<string, string> } {
  const base = mkdtempSync(path.join(tmpdir(), "vua-m3vec-"));
  for (const dir of ["source", "target", "artifacts"]) {
    mkdirSync(path.join(base, dir), { recursive: true });
  }
  writeFileSync(path.join(base, "source", "pack.unitypackage"), "fixture");
  return {
    base,
    variables: {
      sourceFolder: path.join(base, "source"),
      projectRoot: path.join(base, "target"),
      artifactOutputRoot: path.join(base, "artifacts"),
      projectId: "project",
    },
  };
}

/** $var 整值替换(镜像 Rust substitute:仅整串变量名参与替换) */
function substitute(
  value: unknown,
  context: Record<string, string | number>,
): unknown {
  if (typeof value === "string") {
    const variable = value.startsWith("$") ? context[value.slice(1)] : undefined;
    return variable !== undefined ? variable : value;
  }
  if (Array.isArray(value)) return value.map((entry) => substitute(entry, context));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, substitute(entry, context)]),
    );
  }
  return value;
}

/** 点路径取值(镜像 Rust 的 JSON Pointer 平移) */
function valueAt(value: unknown, dottedPath: string): unknown {
  let current: unknown = value;
  for (const segment of dottedPath.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** 断言算子全集:向量实际所用(ok/errorCode/startsWith/isArray/equals) */
function checkEntry(value: unknown, checks: unknown): string[] {
  const failures: string[] = [];
  if (checks === null || typeof checks !== "object") return failures;
  for (const [dottedPath, expectation] of Object.entries(checks as Record<string, unknown>)) {
    const target = valueAt(value, dottedPath);
    if (target === undefined) {
      failures.push(`${dottedPath}: missing`);
      continue;
    }
    if (expectation !== null && typeof expectation === "object") {
      const expected = expectation as Record<string, unknown>;
      if (typeof expected.startsWith === "string") {
        if (!(typeof target === "string" && target.startsWith(expected.startsWith))) {
          failures.push(`${dottedPath}: ${String(target)} does not start with ${expected.startsWith}`);
        }
      }
      if (expected.isArray === true && !Array.isArray(target)) {
        failures.push(`${dottedPath}: expected an array`);
      }
      if ("equals" in expected) {
        const expectedValue = expected.equals;
        const matches = Array.isArray(expectedValue)
          ? Array.isArray(target)
            && JSON.stringify(target) === JSON.stringify(expectedValue)
          : target === expectedValue;
        if (!matches) {
          failures.push(`${dottedPath}: ${JSON.stringify(target)} != ${JSON.stringify(expectedValue)}`);
        }
      }
    }
  }
  return failures;
}

describe("m3 fixed vectors replay green through the gateway route (T2)", () => {
  it("replays every vector file against the mock provider, 8/8 green", async () => {
    const vectorFiles = readdirSync(VECTORS_DIR)
      .filter((name) => name.endsWith(".json"))
      .sort();
    assert.ok(
      vectorFiles.length >= 8,
      `the vector set must stay populated (found ${vectorFiles.length})`,
    );

    const world = makeWorld();
    try {
      const provider = new MockOrchestratorProviderV01({
        capabilities: [{ operationId: "production.useCase", availability: "available" }],
        // 向量 waitTerminal 镜像真实 worker:confirm 受理后驱动到终态
        productionAutoComplete: true,
      });
      await provider.start();

      /** Kernel 替身:startInspection 的四元组由向量自身携带(可缺参回放负例) */
      let pendingQuad: Partial<ProductionContextV02> = {};
      const route = async (request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1> =>
        routeDesktopGatewayInvoke(
          {
            provider,
            productVersion: "0.5.0",
            platform: "win32",
            rendererUrl: "http://127.0.0.1:5173",
            resolveMaterialSource: (refId) =>
              refId === "vec-source" ? (pendingQuad as ProductionContextV02) : undefined,
          },
          "http://127.0.0.1:5173/",
          request,
        );

      const context: Record<string, string | number> = { ...world.variables };

      for (const fileName of vectorFiles) {
        const vector = JSON.parse(readFileSync(path.join(VECTORS_DIR, fileName), "utf8")) as {
          name: string;
          steps: {
            method: string;
            params: Record<string, unknown>;
            expect: { ok?: boolean; errorCode?: string; checks?: unknown };
            waitTerminal?: string;
          }[];
        };
        const name = vector.name;

        for (const [index, step] of vector.steps.entries()) {
          const params = substitute(step.params, context) as Record<string, unknown>;
          const commandId = `${name}-${index}`;
          let request: DesktopGatewayRequestV1;
          switch (step.method) {
            case "production.startInspection":
              pendingQuad = params as Partial<ProductionContextV02>;
              request = {
                schemaVersion: 1,
                requestId: `req-${commandId}`,
                method: step.method,
                params: { materialRefId: "vec-source", commandId },
              };
              break;
            case "production.requestPlan":
              request = {
                schemaVersion: 1,
                requestId: `req-${commandId}`,
                method: step.method,
                params: {
                  inspectionId: params.inspectionId as string,
                  commandId,
                  mode: params.mode as "direct_unity_package" | "local_reusable_vpm",
                },
              };
              break;
            case "production.getInspection":
              request = {
                schemaVersion: 1,
                requestId: `req-${commandId}`,
                method: step.method,
                params: { inspectionId: params.inspectionId as string },
              };
              break;
            case "production.getPlan":
              request = {
                schemaVersion: 1,
                requestId: `req-${commandId}`,
                method: step.method,
                params: { planId: params.planId as string },
              };
              break;
            case "production.confirmPlan":
              request = {
                schemaVersion: 1,
                requestId: `req-${commandId}`,
                method: step.method,
                params: {
                  planId: params.planId as string,
                  commandId,
                  observedRevision: params.observedRevision as number,
                  riskChoice: params.riskChoice as "continue",
                  ...(params.rememberForSession === undefined
                    ? {}
                    : { rememberForSession: params.rememberForSession as boolean }),
                },
              };
              break;
            default:
              throw new Error(`vector ${name} step ${index}: unmapped method ${step.method}`);
          }

          const response = await route(request);
          const expectOk = step.expect.ok ?? true;
          assert.equal(
            response.ok,
            expectOk,
            `${name} step ${index}: ok mismatch (${JSON.stringify(response)})`,
          );
          if (step.expect.errorCode !== undefined) {
            const code = !response.ok && response.error.code === "application"
              ? response.error.application.code
              : !response.ok ? `envelope:${response.error.code}` : "";
            assert.equal(
              code,
              step.expect.errorCode,
              `${name} step ${index}: got ${code} (${JSON.stringify(response)})`,
            );
          }

          const value = response.ok ? response.value : {};
          // 收割响应派生变量(镜像 Rust:顶层身份字段 + revision)
          for (const key of ["inspectionId", "planId", "taskId", "buildRecordId"] as const) {
            const harvested = (value as Record<string, unknown>)[key];
            if (typeof harvested === "string") context[key] = harvested;
          }
          if (typeof (value as Record<string, unknown>)["revision"] === "number") {
            context["revision"] = (value as Record<string, unknown>)["revision"] as number;
          }

          // 确认步等待任务到终态(mock 同步完成;轮询保留真实链语义)
          if (step.waitTerminal === "$taskId") {
            const taskId = context["taskId"];
            assert.equal(typeof taskId, "string", `${name}: waitTerminal needs taskId`);
            const deadline = Date.now() + 5_000;
            for (;;) {
              const poll = await route({
                schemaVersion: 1,
                requestId: `req-${commandId}-poll-${Math.random()}`,
                method: "task.get",
                params: { taskId: taskId as string },
              });
              const state = poll.ok
                ? (poll.value as { state?: string }).state
                : undefined;
              if (state !== undefined && (TERMINAL_TASK_STATES_V01 as readonly string[]).includes(state)) break;
              assert.ok(Date.now() < deadline, `${name}: confirm never completed`);
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
          }

          const failures = checkEntry(value, step.expect.checks);
          assert.deepEqual(failures, [], `${name} step ${index}`);
        }
      }
    } finally {
      rmSync(world.base, { recursive: true, force: true });
    }
  });
});
