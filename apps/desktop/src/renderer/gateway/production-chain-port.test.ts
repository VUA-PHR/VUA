import { describe, expect, it } from "vitest";
import {
  createLiveProductionChainPort,
  type ProductionChainPort,
} from "./production-chain-port.ts";
import type { DesktopGatewayHost, GatewayClient } from "./gateway-client.ts";

/* 生产链共享端口(019 批 C)live 消费的收窄真值表:字段存在性收窄,
 * 收不齐=不可解释如实 null(照 warehouse live 先例)。 */

function hostWith(client: unknown): DesktopGatewayHost {
  return { gateway: client, events: { subscribe: () => () => {} } } as unknown as DesktopGatewayHost;
}

function okClient(value: unknown): { host: DesktopGatewayHost; spy: { methods: string[]; params: unknown[] } } {
  const spy = { methods: [] as string[], params: [] as unknown[] };
  const client = {
    invoke: async (request: { method: string; params: unknown }) => {
      spy.methods.push(request.method);
      spy.params.push(request.params);
      return { ok: true as const, value };
    },
    subscribe: () => () => {},
  };
  return { host: hostWith(client as never), spy };
}

function failClient(): { host: DesktopGatewayHost; spy: { methods: string[] } } {
  const spy = { methods: [] as string[] };
  const client = {
    invoke: async (request: { method: string }) => {
      spy.methods.push(request.method);
      return { ok: false as const, error: { kind: "request_rejected" as const } };
    },
    subscribe: () => () => {},
  };
  return { host: hostWith(client as never), spy };
}

describe("live production chain port", () => {
  it("resolveRecipe: 受理回执收窄齐则透传,失败如实 null", async () => {
    const ok = okClient({ taskId: "task-1", correlationId: "corr-1", state: "queued" });
    const port = createLiveProductionChainPort(ok.host);
    expect(await port.resolveRecipe("recipe-1")).toEqual({
      taskId: "task-1",
      correlationId: "corr-1",
      state: "queued",
    });
    const fail = failClient();
    const failPort = createLiveProductionChainPort(fail.host);
    expect(await failPort.resolveRecipe("recipe-1")).toBeNull();
  });

  it("approvePlan: 回执收窄(planId/planStatus)", async () => {
    const ok = okClient({ planId: "plan-1", planStatus: "approved" });
    const port = createLiveProductionChainPort(ok.host);
    expect(await port.approvePlan("plan-1")).toEqual({
      planId: "plan-1",
      planStatus: "approved",
    });
  });

  it("getPlan: 计划文档透传;字段不齐如实 null", async () => {
    const ok = okClient({
      planId: "plan-1",
      planStatus: "approved",
      planDocument: { nodes: [] },
    });
    const port = createLiveProductionChainPort(ok.host);
    expect(await port.getPlan("plan-1")).toEqual({
      planId: "plan-1",
      planStatus: "approved",
      planDocument: { nodes: [] },
    });
    const bad = okClient({ planId: "plan-1" });
    const badPort = createLiveProductionChainPort(bad.host);
    expect(await badPort.getPlan("plan-1")).toBeNull();
  });

  it("listPlans: entries 逐条收窄,词表外滤除;total 非整数如实 null", async () => {
    const ok = okClient({
      total: 1,
      entries: [{ planId: "plan-1", recipeId: "recipe-1", status: "approved", approvedAt: "t" }],
    });
    const port = createLiveProductionChainPort(ok.host);
    expect(await port.listPlans({})).toEqual({
      total: 1,
      entries: [{ planId: "plan-1", recipeId: "recipe-1", status: "approved", approvedAt: "t" }],
    });
    // 词表外条目滤除后返回剩余(诚实呈现服务端说了 1 条但形态不齐被丢弃)
    const mixed = okClient({
      total: 2,
      entries: [
        { planId: "plan-1", recipeId: "recipe-1", status: "approved", approvedAt: "t" },
        { planId: "plan-2", recipeId: "recipe-1", status: "bogus", approvedAt: "t" },
      ],
    });
    const mixedPort = createLiveProductionChainPort(mixed.host);
    expect(await mixedPort.listPlans({})).toEqual({
      total: 2,
      entries: [{ planId: "plan-1", recipeId: "recipe-1", status: "approved", approvedAt: "t" }],
    });
    // total 非整数如实 null
    const bad = okClient({ total: "many", entries: [] });
    const badPort = createLiveProductionChainPort(bad.host);
    expect(await badPort.listPlans({})).toBeNull();
  });

  it("executeJob: 受理回执收窄", async () => {
    const ok = okClient({ taskId: "task-9", correlationId: "corr-9", state: "running" });
    const port = createLiveProductionChainPort(ok.host);
    expect(await port.executeJob("plan-1")).toEqual({
      taskId: "task-9",
      correlationId: "corr-9",
      state: "running",
    });
  });

  it("getRecord: 记录文档透传;listRecords: 条目逐条收纬", async () => {
    const ok = okClient({
      buildId: "build-1",
      recordDocument: { finishedAt: "t" },
    });
    const port = createLiveProductionChainPort(ok.host);
    expect(await port.getRecord("build-1")).toEqual({
      buildId: "build-1",
      recordDocument: { finishedAt: "t" },
    });
    const okList = okClient({
      total: 1,
      entries: [{ buildId: "build-1", planId: "plan-1", status: "succeeded", finishedAt: "t" }],
    });
    const listPort = createLiveProductionChainPort(okList.host);
    expect(await listPort.listRecords({})).toEqual({
      total: 1,
      entries: [{ buildId: "build-1", planId: "plan-1", status: "succeeded", finishedAt: "t" }],
    });
  });
});
