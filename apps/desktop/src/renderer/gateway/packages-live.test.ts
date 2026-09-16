import { describe, expect, it } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import { createLivePackages } from "./packages-live.ts";
import type { PackagesView } from "./packages-port.ts";
import type { GatewayClient, GatewayResult } from "./gateway-client.ts";

/**
 * packages 读面 live 端口测试(024 P1 中间诚实态消费批):fake GatewayClient
 * 编排 app.snapshot 能力行与 packages.listInstalled wire 帧,钉死消费纪律——
 * 诚实缺席(not-connected)、typed 失败照原词(不折叠空态)、三键帧窄化
 * (形状不符诚实失败)、区块可用性标注随 packages.query 能力行翻转。
 */

type InvokeHandler = (
  request: DesktopGatewayRequestV1,
) => Promise<GatewayResult<DesktopGatewaySuccessValueV1>>;

function fakeClient(invoke: InvokeHandler): GatewayClient {
  return {
    invoke,
    subscribe: () => () => {},
  };
}

function asWire(value: unknown): DesktopGatewaySuccessValueV1 {
  return value as DesktopGatewaySuccessValueV1;
}

function appSnapshot(operations: readonly { operationId: string; availability: string }[]) {
  return asWire({
    contractVersion: "0.1",
    revision: 1,
    capabilities: { revision: 1, operations },
  });
}

const QUERY_AVAILABLE = [{ operationId: "packages.query", availability: "available" }];
const QUERY_ABSENT = [{ operationId: "task.list", availability: "available" }];

function installedFrame(rows: unknown[]) {
  return asWire({
    schemaVersion: "0.1",
    operation: "packages.listInstalled",
    result: {
      schemaVersion: "vua.packages-installed/v0.1",
      projectPath: "C:/proj",
      packages: rows,
    },
  });
}

const VALID_ROWS = [
  { packageId: "com.vrchat.avatars", version: "3.7.4", dependencies: ["com.vrchat.base"] },
  { packageId: "com.vrchat.base", version: "3.7.2", dependencies: [] },
];

function clientWith(overrides: {
  snapshot?: Parameters<typeof appSnapshot>[0];
  listResult?: GatewayResult<DesktopGatewaySuccessValueV1>;
} = {}): GatewayClient {
  return fakeClient(async (request) => {
    if (request.method === "app.snapshot") {
      return { ok: true, value: appSnapshot(overrides.snapshot ?? QUERY_AVAILABLE) };
    }
    if (request.method === "packages.listInstalled") {
      return overrides.listResult ?? { ok: true, value: installedFrame(VALID_ROWS) };
    }
    return { ok: false, error: { kind: "unavailable" } as const };
  });
}

describe("packages live port (024 P1 consumption)", () => {
  it("answers not-connected and packagesEngineMissing when the capability row is absent", async () => {
    // 真实 provider 语义:引擎未装配时读面答 typed unavailable(缺席臂)
    const port = createLivePackages(
      clientWith({
        snapshot: QUERY_ABSENT,
        listResult: {
          ok: false,
          error: {
            kind: "application",
            error: {
              contractVersion: "0.1",
              code: "vua.packages.unavailable",
              category: "unavailable",
              messageKey: "errors.packages.unavailable",
              recoverable: false,
              retryable: false,
              correlationId: "c",
            },
          },
        },
      }),
    );
    const view = await port.snapshot();
    expect(view).toEqual({ schemaVersion: 1, kind: "not-connected" });
    const capability = await port.capability();
    expect(capability).toEqual({ state: "unavailable", detailKey: "packagesEngineMissing" });
    // 缺席下的直接读面同样诚实 unavailable
    expect(await port.listInstalled("C:/proj")).toEqual({ kind: "unavailable" });
  });

  it("projects a ready-p1 view with availability blocks and no selection facts", async () => {
    const port = createLivePackages(clientWith());
    const view = await port.snapshot();
    expect(view).toEqual({
      schemaVersion: 1,
      kind: "ready-p1",
      blocks: { installed: true, repos: false, changes: false },
      projectPath: null,
      installedPackages: [],
    });
    expect(await port.capability()).toEqual({ state: "ready" });
  });

  it("carries the frozen three-key rows after selectProject, ascending order untouched", async () => {
    const port = createLivePackages(clientWith());
    await port.selectProject("C:/proj");
    const view = await port.snapshot();
    assertReadyP1(view);
    if (view.kind !== "ready-p1") return;
    expect(view.projectPath).toBe("C:/proj");
    expect(view.installedPackages).toEqual(VALID_ROWS);
    expect(view.loadError).toBeUndefined();
  });

  it("surfaces typed failures verbatim instead of folding them into an empty listing", async () => {
    const port = createLivePackages(
      clientWith({
        listResult: {
          ok: false,
          error: {
            kind: "application",
            error: {
              contractVersion: "0.1",
              code: "vua.project.project_not_found",
              category: "validation",
              messageKey: "errors.project.projectNotFound",
              recoverable: false,
              retryable: false,
              correlationId: "c",
            },
          },
        },
      }),
    );
    await port.selectProject("C:/proj");
    const view = await port.snapshot();
    assertReadyP1(view);
    if (view.kind !== "ready-p1") return;
    expect(view.installedPackages).toEqual([]);
    expect(view.loadError).toEqual({ code: "vua.project.project_not_found" });
    expect(await port.listInstalled("C:/proj")).toEqual({
      kind: "failed",
      code: "vua.project.project_not_found",
    });
  });

  it("answers shape violation when the wire envelope deviates from the frozen three-key face", async () => {
    const port = createLivePackages(
      clientWith({
        listResult: {
          ok: true,
          value: installedFrame([
            // 发明 P2 事实字段(updateAvailable)= 虚假断言防线,整帧形状不符
            { packageId: "com.x", version: "1.0", dependencies: [], updateAvailable: false },
          ]),
        },
      }),
    );
    await port.selectProject("C:/proj");
    const view = await port.snapshot();
    assertReadyP1(view);
    if (view.kind !== "ready-p1") return;
    expect(view.loadError).toEqual({ code: "packages_shape_violation" });
  });

  it("stays not-connected when the engine answers unavailable for the direct read", async () => {
    const port = createLivePackages(
      clientWith({
        listResult: {
          ok: false,
          error: {
            kind: "application",
            error: {
              contractVersion: "0.1",
              code: "vua.packages.unavailable",
              category: "unavailable",
              messageKey: "errors.packages.unavailable",
              recoverable: false,
              retryable: false,
              correlationId: "c",
            },
          },
        },
      }),
    );
    await port.selectProject("C:/proj");
    expect(await port.snapshot()).toEqual({ schemaVersion: 1, kind: "not-connected" });
    expect(await port.listInstalled("C:/proj")).toEqual({ kind: "unavailable" });
  });
});

function assertReadyP1(view: PackagesView): void {
  expect(view.kind).toBe("ready-p1");
}
