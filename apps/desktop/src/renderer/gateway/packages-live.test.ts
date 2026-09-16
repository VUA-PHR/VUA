import { describe, expect, it } from "vitest";
import type {
  DesktopGatewayRequestV1,
  DesktopGatewaySuccessValueV1,
} from "@vua/contracts";
import { createLivePackages } from "./packages-live.ts";
import type { PackagesView } from "./packages-port.ts";
import type { GatewayClient, GatewayResult } from "./gateway-client.ts";

/**
 * packages 读面 live 端口测试(024 P1 中间诚实态消费批;025 P2 读面消费
 * 批):fake GatewayClient 编排 app.snapshot 能力行与 packages.* wire 帧,
 * 钉死消费纪律——诚实缺席(not-connected)、typed 失败照原词(不折叠空
 * 态)、帧窄化(行闭集,形状不符诚实失败)、区块可用性标注随能力行翻转
 * (installed = packages.query;repos = packages.listRepos;catalog =
 * packages.packageCatalog)、订阅行 cached=false 诚实承载、目录按需查询
 * no_matching_package 独立空态码照原词上呈。
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
/** P2 读面齐全:三能力行全部 available */
const P2_AVAILABLE = [
  { operationId: "packages.query", availability: "available" },
  { operationId: "packages.listRepos", availability: "available" },
  { operationId: "packages.packageCatalog", availability: "available" },
];
/** P2 读面行存在但引擎后端未声明目录能力(availability 翻转前的诚实缺席) */
const P2_ROWS_UNAVAILABLE = [
  { operationId: "packages.query", availability: "available" },
  { operationId: "packages.listRepos", availability: "unavailable" },
  { operationId: "packages.packageCatalog", availability: "unavailable" },
];

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

function reposFrame(rows: unknown[]) {
  return asWire({
    schemaVersion: "0.1",
    operation: "packages.listRepos",
    result: {
      schemaVersion: "vua.packages-repos/v0.1",
      repos: rows,
    },
  });
}

function catalogFrame(result: unknown) {
  return asWire({
    schemaVersion: "0.1",
    operation: "packages.packageCatalog",
    result,
  });
}

const VALID_ROWS = [
  { packageId: "com.vrchat.avatars", version: "3.7.4", dependencies: ["com.vrchat.base"] },
  { packageId: "com.vrchat.base", version: "3.7.2", dependencies: [] },
];

/** 订阅面自身顺序(配置事实);含 null 投影行与 cached=false 诚实行 */
const VALID_REPO_ROWS = [
  {
    repoId: "official",
    name: "Official",
    url: "https://vpm.example/vpm.json",
    localPath: "C:/Users/demo/AppData/Local/VRChatCreatorCompanion/vpm-repos/official.json",
    cached: true,
  },
  { repoId: null, name: null, url: null, localPath: "C:/repos/local.json", cached: false },
];

/** 端口返回的七键事实(族常量 schemaVersion 在窄化校验时消费,不外传) */
const VALID_CATALOG_FACTS = {
  projectPath: "C:/proj",
  packageId: "com.anatawa12.avatar-optimizer",
  displayName: "Avatar Optimizer",
  source: "repo",
  installed: true,
  updateAvailable: null,
  versions: [
    { version: "1.8.0", yanked: false, compatible: true },
    { version: "1.9.0", yanked: false, compatible: null },
  ],
};

function applicationError(
  code: string,
  category:
    | "validation"
    | "conflict"
    | "permission"
    | "dependency"
    | "unavailable"
    | "timeout"
    | "cancelled"
    | "external_failure"
    | "internal",
): GatewayResult<DesktopGatewaySuccessValueV1> {
  return {
    ok: false,
    error: {
      kind: "application",
      error: {
        contractVersion: "0.1",
        code,
        category,
        messageKey: `errors.${code}`,
        recoverable: false,
        retryable: false,
        correlationId: "c",
      },
    },
  } as const;
}

const UNAVAILABLE_ERROR = applicationError("vua.packages.unavailable", "unavailable");

function clientWith(overrides: {
  snapshot?: Parameters<typeof appSnapshot>[0];
  listResult?: GatewayResult<DesktopGatewaySuccessValueV1>;
  reposResult?: GatewayResult<DesktopGatewaySuccessValueV1>;
  catalogResult?: GatewayResult<DesktopGatewaySuccessValueV1>;
} = {}): GatewayClient {
  return fakeClient(async (request) => {
    if (request.method === "app.snapshot") {
      return { ok: true, value: appSnapshot(overrides.snapshot ?? QUERY_AVAILABLE) };
    }
    if (request.method === "packages.listInstalled") {
      return overrides.listResult ?? { ok: true, value: installedFrame(VALID_ROWS) };
    }
    if (request.method === "packages.listRepos") {
      return overrides.reposResult ?? { ok: true, value: reposFrame(VALID_REPO_ROWS) };
    }
    if (request.method === "packages.packageCatalog") {
      // wire result 本体 = 族常量盖戳 + 七键事实(路由盖戳,后端事实逐字)
      return (
        overrides.catalogResult ?? {
          ok: true,
          value: catalogFrame({ schemaVersion: "vua.packages-catalog/v0.1", ...VALID_CATALOG_FACTS }),
        }
      );
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
        listResult: UNAVAILABLE_ERROR,
      }),
    );
    const view = await port.snapshot();
    expect(view).toEqual({ schemaVersion: 1, kind: "not-connected" });
    const capability = await port.capability();
    expect(capability).toEqual({ state: "unavailable", detailKey: "packagesEngineMissing" });
    // 缺席下的直接读面同样诚实 unavailable
    expect(await port.listInstalled("C:/proj")).toEqual({ kind: "unavailable" });
  });

  it("projects a ready-p2 view with availability blocks and no selection facts (P2 rows unavailable = honest hidden sections)", async () => {
    const port = createLivePackages(clientWith());
    const view = await port.snapshot();
    expect(view).toEqual({
      schemaVersion: 1,
      kind: "ready-p2",
      blocks: { installed: true, repos: false, catalog: false, changes: false },
      projectPath: null,
      installedPackages: [],
      repos: [],
    });
    expect(await port.capability()).toEqual({ state: "ready" });
  });

  it("carries the frozen three-key rows after selectProject, ascending order untouched", async () => {
    const port = createLivePackages(clientWith());
    await port.selectProject("C:/proj");
    const view = await port.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.projectPath).toBe("C:/proj");
    expect(view.installedPackages).toEqual(VALID_ROWS);
    expect(view.loadError).toBeUndefined();
  });

  it("surfaces typed failures verbatim instead of folding them into an empty listing", async () => {
    const port = createLivePackages(
      clientWith({
        listResult: applicationError("vua.project.project_not_found", "validation"),
      }),
    );
    await port.selectProject("C:/proj");
    const view = await port.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
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
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.loadError).toEqual({ code: "packages_shape_violation" });
  });

  it("stays not-connected when the engine answers unavailable for the direct read", async () => {
    const port = createLivePackages(
      clientWith({ listResult: UNAVAILABLE_ERROR }),
    );
    await port.selectProject("C:/proj");
    expect(await port.snapshot()).toEqual({ schemaVersion: 1, kind: "not-connected" });
    expect(await port.listInstalled("C:/proj")).toEqual({ kind: "unavailable" });
  });
});

describe("packages live port (025 P2 consumption)", () => {
  it("carries repo subscription rows verbatim — cached=false honest rows and null projections preserved, order untouched", async () => {
    const port = createLivePackages(
      clientWith({ snapshot: P2_ROWS_UNAVAILABLE, reposResult: { ok: true, value: reposFrame(VALID_REPO_ROWS) } }),
    );
    // 能力行 unavailable:区块不渲染(repos block false),但快照不伪造
    const hidden = await port.snapshot();
    assertReadyP2(hidden);
    if (hidden.kind !== "ready-p2") return;
    expect(hidden.blocks).toEqual({ installed: true, repos: false, catalog: false, changes: false });

    const port2 = createLivePackages(clientWith({ snapshot: P2_AVAILABLE }));
    const view = await port2.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.blocks).toEqual({ installed: true, repos: true, catalog: true, changes: false });
    expect(view.repos).toEqual(VALID_REPO_ROWS);
    expect(view.reposError).toBeUndefined();
  });

  it("renders an honest zero-subscription empty array when the subscription face is empty", async () => {
    const port = createLivePackages(
      clientWith({ snapshot: P2_AVAILABLE, reposResult: { ok: true, value: reposFrame([]) } }),
    );
    const view = await port.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.repos).toEqual([]);
    expect(view.reposError).toBeUndefined();
  });

  it("surfaces listRepos typed failures verbatim as reposError — never an empty masquerade", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        reposResult: applicationError("vua.vpm.capability_missing", "unavailable"),
      }),
    );
    const view = await port.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.repos).toEqual([]);
    expect(view.reposError).toEqual({ code: "vua.vpm.capability_missing" });
  });

  it("answers repos shape violation when a row invents a health field (health face is a frozen non-goal)", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        reposResult: {
          ok: true,
          value: reposFrame([
            {
              repoId: "official",
              name: "Official",
              url: "https://vpm.example/vpm.json",
              localPath: "C:/repos/official.json",
              cached: true,
              health: "ok",
            },
          ]),
        },
      }),
    );
    const view = await port.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.repos).toEqual([]);
    expect(view.reposError).toEqual({ code: "packages_shape_violation" });
  });

  it("answers packageCatalog with the frozen seven-key facts, null semantics preserved", async () => {
    const port = createLivePackages(clientWith({ snapshot: P2_AVAILABLE }));
    const outcome = await port.packageCatalog("C:/proj", "com.anatawa12.avatar-optimizer");
    expect(outcome).toEqual({ kind: "ok", result: VALID_CATALOG_FACTS });
  });

  it("surfaces no_matching_package verbatim for the own empty state — never folded into an error page or empty masquerade", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        catalogResult: applicationError("vua.vpm.no_matching_package", "validation"),
      }),
    );
    expect(await port.packageCatalog("C:/proj", "com.missing.package")).toEqual({
      kind: "failed",
      code: "vua.vpm.no_matching_package",
    });
  });

  it("answers catalog shape violation when a version row invents changelogUrl (false-assertion guard)", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        catalogResult: {
          ok: true,
          value: catalogFrame({
            schemaVersion: "vua.packages-catalog/v0.1",
            projectPath: "C:/proj",
            packageId: "com.x",
            displayName: null,
            source: "repo",
            installed: false,
            updateAvailable: null,
            versions: [{ version: "1.0.0", yanked: false, compatible: true, changelogUrl: "https://x" }],
          }),
        },
      }),
    );
    expect(await port.packageCatalog("C:/proj", "com.x")).toEqual({
      kind: "failed",
      code: "packages_shape_violation",
    });
  });

  it("answers packageCatalog honestly unavailable when the engine is absent", async () => {
    const port = createLivePackages(
      clientWith({ snapshot: P2_AVAILABLE, catalogResult: UNAVAILABLE_ERROR }),
    );
    expect(await port.packageCatalog("C:/proj", "com.x")).toEqual({ kind: "unavailable" });
  });
});

function assertReadyP2(view: PackagesView): void {
  expect(view.kind).toBe("ready-p2");
}
