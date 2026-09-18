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
 * 批;025 v0.2 增量消费更新批):fake GatewayClient 编排 app.snapshot
 * 能力行与 packages.* wire 帧,钉死消费纪律——诚实缺席(not-connected)、
 * typed 失败照原词(不折叠空态)、帧窄化(行闭集,形状不符诚实失败)、
 * 区块可用性标注随能力行翻转(installed = packages.query;repos =
 * packages.listRepos;catalog = packages.packageCatalog)、订阅行
 * cached=false 诚实承载、目录按需查询 no_matching_package 独立空态码照
 * 原词上呈;目录族双版协商(v0.1 七键/v0.2 八键 cacheSourced 披露,盖
 * 戳族常量辨词面,缺键/发明键均形状不符)。
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
      blocks: { installed: true, repos: false, catalog: false, changes: false, installs: false },
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
    expect(hidden.blocks).toEqual({ installed: true, repos: false, catalog: false, changes: false, installs: false });

    const port2 = createLivePackages(clientWith({ snapshot: P2_AVAILABLE }));
    const view = await port2.snapshot();
    assertReadyP2(view);
    if (view.kind !== "ready-p2") return;
    expect(view.blocks).toEqual({ installed: true, repos: true, catalog: true, changes: false, installs: false });
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

describe("packages live port (025 v0.2 increment consumption update)", () => {
  /** v0.2 = 冻结 v0.1 七键恰加必带 cacheSourced(025 v0.2 增量冻结批词面) */
  const VALID_CATALOG_FACTS_V02 = {
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
    cacheSourced: true,
  };

  it("accepts a v0.2-stamped eight-key answer and carries the cacheSourced disclosure verbatim (true = served via cache degradation)", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        catalogResult: {
          ok: true,
          value: catalogFrame({ schemaVersion: "vua.packages-catalog/v0.2", ...VALID_CATALOG_FACTS_V02 }),
        },
      }),
    );
    const outcome = await port.packageCatalog("C:/proj", "com.anatawa12.avatar-optimizer");
    expect(outcome.kind).toBe("ok");
    if (outcome.kind !== "ok") return;
    expect(outcome.result).toEqual(VALID_CATALOG_FACTS_V02);
    // 族判别:结果携带披露事实,页面据此呈现「缓存数据」信息标注(非失败)
    expect("cacheSourced" in outcome.result && outcome.result.cacheSourced).toBe(true);
  });

  it("accepts a v0.2 answer with cacheSourced=false (online-refreshed, no annotation)", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        catalogResult: {
          ok: true,
          value: catalogFrame({
            schemaVersion: "vua.packages-catalog/v0.2",
            ...VALID_CATALOG_FACTS_V02,
            cacheSourced: false,
          }),
        },
      }),
    );
    const outcome = await port.packageCatalog("C:/proj", "com.anatawa12.avatar-optimizer");
    expect(outcome.kind).toBe("ok");
    if (outcome.kind !== "ok") return;
    expect("cacheSourced" in outcome.result && outcome.result.cacheSourced).toBe(false);
  });

  it("answers shape violation for a v0.2 stamp without the required cacheSourced key (version generation is pinned by the family constant, never guessed)", async () => {
    const { cacheSourced: _omitted, ...sevenKeyFacts } = VALID_CATALOG_FACTS_V02;
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        catalogResult: {
          ok: true,
          value: catalogFrame({ schemaVersion: "vua.packages-catalog/v0.2", ...sevenKeyFacts }),
        },
      }),
    );
    expect(await port.packageCatalog("C:/proj", "com.anatawa12.avatar-optimizer")).toEqual({
      kind: "failed",
      code: "packages_shape_violation",
    });
  });

  it("answers shape violation for a v0.1 answer inventing the disclosure field (frozen v0.1 closed set unchanged — no fabricated annotation source)", async () => {
    const port = createLivePackages(
      clientWith({
        snapshot: P2_AVAILABLE,
        catalogResult: {
          ok: true,
          value: catalogFrame({ schemaVersion: "vua.packages-catalog/v0.1", ...VALID_CATALOG_FACTS, cacheSourced: false }),
        },
      }),
    );
    expect(await port.packageCatalog("C:/proj", "com.anatawa12.avatar-optimizer")).toEqual({
      kind: "failed",
      code: "packages_shape_violation",
    });
  });
});


/* ---- A1 移除写面消费(026 冻结词面 d7f6a57;wire 接线批 41503a4 世代) ---- */

const VALID_PLAN = {
  schemaVersion: "vua.packages-ops/v0.1",
  kind: "plan",
  projectPath: "C:/proj",
  items: [{ kind: "remove", packageId: "com.vrchat.avatars", version: null, reason: null }],
  conflicts: ["com.example.dependent depends on com.vrchat.avatars"],
  removeLegacyFiles: [],
  removeLegacyFolders: ["Packages/com.vrchat.avatars_legacy"],
  destructive: true,
  digest: "fnv-1a-abc123",
};

const VALID_RECEIPT = {
  schemaVersion: "vua.packages-ops/v0.1",
  kind: "receipt",
  projectPath: "C:/proj",
  confirmedDigest: "fnv-1a-abc123",
  requestedPackageIds: ["com.vrchat.avatars"],
  removedItems: [{ kind: "remove", packageId: "com.vrchat.avatars", version: null, reason: null }],
};

const VALID_REJECTED = {
  schemaVersion: "vua.packages-ops/v0.1",
  kind: "rejected",
  guard: "preview_drift",
  code: "vua.packages.preview_drift",
  detail: "confirmed digest fnv-1a-abc123 does not match the re-computed preview digest fnv-1a-def456",
};

function previewRemoveFrame(result: unknown): DesktopGatewaySuccessValueV1 {
  return asWire({ schemaVersion: "0.1", operation: "packages.previewRemove", result });
}

function acceptedFrame(taskId: string): DesktopGatewaySuccessValueV1 {
  return asWire({ schemaVersion: "0.1", operation: "packages.applyRemove", taskId, correlationId: "c-1" });
}

function taskSnapshotValue(state: string, extra: { result?: unknown; error?: unknown } = {}): DesktopGatewaySuccessValueV1 {
  return asWire({
    contractVersion: "0.1",
    taskId: "t-1",
    correlationId: "c-1",
    revision: 2,
    state,
    cancellationRequested: false,
    recoveryDisposition: "none",
    updatedAt: "2026-09-19T00:00:00Z",
    ...extra,
  });
}

/** A1 流编排 client:preview/apply/task.get 分支可控;subscribe 支持
 * task.completed 事件派发(020 终态等待通道)。 */
function a1Client(overrides: {
  snapshot?: Parameters<typeof appSnapshot>[0];
  preview?: GatewayResult<DesktopGatewaySuccessValueV1>;
  apply?: GatewayResult<DesktopGatewaySuccessValueV1>;
  taskGet?: GatewayResult<DesktopGatewaySuccessValueV1>;
} = {}): { client: GatewayClient; emitCompleted: (taskId: string) => void } {
  const listeners = new Set<(event: unknown) => void>();
  const client: GatewayClient = {
    invoke: async (request) => {
      if (request.method === "app.snapshot") {
        return { ok: true, value: appSnapshot(overrides.snapshot ?? QUERY_AVAILABLE) };
      }
      if (request.method === "packages.previewRemove") {
        return overrides.preview ?? { ok: true, value: previewRemoveFrame(VALID_PLAN) };
      }
      if (request.method === "packages.applyRemove") {
        return overrides.apply ?? { ok: true, value: acceptedFrame("t-1") };
      }
      if (request.method === "task.get") {
        return overrides.taskGet ?? { ok: true, value: taskSnapshotValue("running") };
      }
      return { ok: false, error: { kind: "unavailable" } as const };
    },
    subscribe: (callback) => {
      listeners.add(callback as (event: unknown) => void);
      return () => {
        listeners.delete(callback as (event: unknown) => void);
      };
    },
  };
  return {
    client,
    emitCompleted: (taskId) => {
      for (const listener of listeners) {
        listener({ kind: "task.completed", taskId, payload: {} });
      }
    },
  };
}

describe("packages live port A1 removal write face (026 consumption)", () => {
  it("narrows the frozen nine-key plan verbatim (family const stamped, nulls projected as port facts)", async () => {
    const { client } = a1Client();
    const port = createLivePackages(client);
    const outcome = await port.previewRemove("C:/proj", ["com.vrchat.avatars"]);
    expect(outcome).toEqual({ kind: "ok", plan: VALID_PLAN });
  });

  it("answers unavailable on the absence arm and passes unknown-port codes verbatim as envelope errors", async () => {
    const absent = a1Client({
      preview: {
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
    });
    expect(
      await createLivePackages(absent.client).previewRemove("C:/proj", ["com.vrchat.avatars"]),
    ).toEqual({ kind: "unavailable" });
    const notFound = a1Client({
      preview: applicationError("vua.packages.package_not_found", "validation"),
    });
    expect(
      await createLivePackages(notFound.client).previewRemove("C:/proj", ["com.vrchat.avatars"]),
    ).toEqual({ kind: "failed", code: "vua.packages.package_not_found" });
  });

  it("answers shape violation when the plan invents a field or the result carries a foreign kind", async () => {
    const invented = a1Client({
      preview: {
        ok: true,
        value: previewRemoveFrame({ ...VALID_PLAN, updateAvailable: false }),
      },
    });
    expect(
      await createLivePackages(invented.client).previewRemove("C:/proj", ["com.vrchat.avatars"]),
    ).toEqual({ kind: "failed", code: "packages_shape_violation" });
    const foreignKind = a1Client({
      preview: {
        ok: true,
        value: previewRemoveFrame({ ...VALID_PLAN, kind: "receipt" }),
      },
    });
    expect(
      await createLivePackages(foreignKind.client).previewRemove("C:/proj", ["com.vrchat.avatars"]),
    ).toEqual({ kind: "failed", code: "packages_shape_violation" });
  });

  it("flips blocks.changes with the served packages.removeOps row (absent row stays false)", async () => {
    const withRow = await createLivePackages(
      a1Client({
        snapshot: [
          { operationId: "packages.query", availability: "available" },
          { operationId: "packages.removeOps", availability: "available" },
        ],
      }).client,
    ).snapshot();
    assertReadyP2(withRow);
    if (withRow.kind === "ready-p2") {
      expect(withRow.blocks.changes).toBe(true);
    }
    const withoutRow = await createLivePackages(a1Client().client).snapshot();
    assertReadyP2(withoutRow);
    if (withoutRow.kind === "ready-p2") {
      expect(withoutRow.blocks.changes).toBe(false);
    }
  });

  it("rides the task loop: acceptance -> completed event -> succeeded snapshot with the receipt payload", async () => {
    // task.get 序列:首取 running(非终态) -> task.completed 事件后重取 succeeded 携收据
    const taskGetSequence: GatewayResult<DesktopGatewaySuccessValueV1>[] = [
      { ok: true, value: taskSnapshotValue("running") },
      {
        ok: true,
        value: taskSnapshotValue("succeeded", {
          result: { schemaVersion: "0.1", operation: "packages.applyRemove", result: VALID_RECEIPT },
        }),
      },
    ];
    let taskGetCalls = 0;
    let subscribed = false;
    const listeners = new Set<(event: unknown) => void>();
    const client: GatewayClient = {
      invoke: async (request) => {
        if (request.method === "packages.applyRemove") {
          return { ok: true, value: acceptedFrame("t-1") };
        }
        if (request.method === "task.get") {
          const answer: GatewayResult<DesktopGatewaySuccessValueV1> =
            taskGetSequence[Math.min(taskGetCalls, taskGetSequence.length - 1)] ?? {
              ok: false,
              error: { kind: "unavailable" },
            };
          taskGetCalls += 1;
          return answer;
        }
        return { ok: false, error: { kind: "unavailable" } as const };
      },
      subscribe: (callback) => {
        listeners.add(callback as (event: unknown) => void);
        subscribed = true;
        return () => {
          listeners.delete(callback as (event: unknown) => void);
        };
      },
    };
    const port = createLivePackages(client);
    const pending = port.applyRemove("C:/proj", ["com.vrchat.avatars"], "fnv-1a-abc123");
    // 端口订阅建立后才派发 task.completed(020 事件通道语义:订阅先于事件)
    while (!subscribed) await new Promise((resolve) => setTimeout(resolve, 1));
    for (const listener of listeners) listener({ kind: "task.completed", taskId: "t-1", payload: {} });
    expect(await pending).toEqual({ kind: "ok", receipt: VALID_RECEIPT });
  });

  it("surfaces a rejected guard refusal (drift) as the typed rejection, never an error", async () => {
    const flow = a1Client({
      taskGet: {
        ok: true,
        value: taskSnapshotValue("succeeded", {
          result: { schemaVersion: "0.1", operation: "packages.applyRemove", result: VALID_REJECTED },
        }),
      },
    });
    const port = createLivePackages(flow.client);
    expect(await port.applyRemove("C:/proj", ["com.vrchat.avatars"], "fnv-1a-abc123")).toEqual({
      kind: "rejected",
      rejection: VALID_REJECTED,
    });
  });

  it("reports a non-succeeded terminal state verbatim (task truth lives in the task center)", async () => {
    const flow = a1Client({
      taskGet: {
        ok: true,
        value: taskSnapshotValue("failed", {
          error: {
            contractVersion: "0.1",
            code: "vua.provider.persistence_failed",
            category: "internal",
            messageKey: "errors.provider.persistence",
            recoverable: false,
            retryable: false,
            correlationId: "c-1",
          },
        }),
      },
    });
    const port = createLivePackages(flow.client);
    expect(await port.applyRemove("C:/proj", ["com.vrchat.avatars"], "fnv-1a-abc123")).toEqual({
      kind: "failed",
      code: "vua.provider.persistence_failed",
    });
  });

  it("answers acceptance shape violation and unavailable honestly (never fabricates a receipt)", async () => {
    const badAcceptance = a1Client({
      apply: { ok: true, value: asWire({ schemaVersion: "0.1", operation: "packages.applyRemove", taskId: "t-1" }) },
    });
    expect(
      await createLivePackages(badAcceptance.client).applyRemove("C:/proj", ["com.vrchat.avatars"], "d"),
    ).toEqual({ kind: "failed", code: "packages_apply_acceptance_shape" });
    const absent = a1Client({
      apply: applicationError("vua.packages.unavailable", "unavailable"),
    });
    expect(
      await createLivePackages(absent.client).applyRemove("C:/proj", ["com.vrchat.avatars"], "d"),
    ).toEqual({ kind: "unavailable" });
  });
});

/* ---- A2 安装/升级写面消费(026 packages-ops v0.2 冻结词面 8552d2c;wire
 * 接线批 61da51a + 钉法缺口收口 beb7d34 世代) ---- */

const VALID_INSTALL_PLAN = {
  schemaVersion: "vua.packages-ops/v0.2",
  kind: "plan",
  projectPath: "C:/proj",
  items: [
    { kind: "install", packageId: "com.vrchat.avatars", version: "3.7.4", reason: null },
    { kind: "remove", packageId: "com.example.conflict", version: null, reason: "conflict" },
  ],
  conflicts: ["com.example.conflict depends on com.vrchat.avatars < 3.7.0"],
  removeLegacyFiles: [],
  removeLegacyFolders: [],
  destructive: true,
  digest: "fnv-1a-def456",
};

const VALID_INSTALL_RECEIPT = {
  schemaVersion: "vua.packages-ops/v0.2",
  kind: "receipt",
  projectPath: "C:/proj",
  confirmedDigest: "fnv-1a-def456",
  requestedPackages: [{ packageId: "com.vrchat.avatars", version: null }],
  appliedItems: [
    { kind: "install", packageId: "com.vrchat.avatars", version: "3.7.5", reason: null },
  ],
};

const VALID_INSTALL_REJECTED = {
  schemaVersion: "vua.packages-ops/v0.2",
  kind: "rejected",
  guard: "preview_drift",
  code: "vua.packages.preview_drift",
  detail: "confirmed digest fnv-1a-def456 does not match the re-computed preview digest fnv-1a-abc123",
};

function previewInstallFrame(result: unknown): DesktopGatewaySuccessValueV1 {
  return asWire({ schemaVersion: "0.2", operation: "packages.previewInstall", result });
}

function acceptedInstallFrame(taskId: string): DesktopGatewaySuccessValueV1 {
  return asWire({ schemaVersion: "0.2", operation: "packages.applyInstall", taskId, correlationId: "c-2" });
}

/** A2 流编排 client:preview/apply/task.get 分支可控(与 A1 a1Client 分立,
 * 信封版本 0.2)。 */
function a2Client(overrides: {
  snapshot?: Parameters<typeof appSnapshot>[0];
  preview?: GatewayResult<DesktopGatewaySuccessValueV1>;
  apply?: GatewayResult<DesktopGatewaySuccessValueV1>;
  taskGet?: GatewayResult<DesktopGatewaySuccessValueV1>;
} = {}): { client: GatewayClient; emitCompleted: (taskId: string) => void } {
  const listeners = new Set<(event: unknown) => void>();
  const client: GatewayClient = {
    invoke: async (request) => {
      if (request.method === "app.snapshot") {
        return { ok: true, value: appSnapshot(overrides.snapshot ?? QUERY_AVAILABLE) };
      }
      if (request.method === "packages.previewInstall") {
        return overrides.preview ?? { ok: true, value: previewInstallFrame(VALID_INSTALL_PLAN) };
      }
      if (request.method === "packages.applyInstall") {
        return overrides.apply ?? { ok: true, value: acceptedInstallFrame("t-2") };
      }
      if (request.method === "task.get") {
        return overrides.taskGet ?? { ok: true, value: taskSnapshotValue("running") };
      }
      return { ok: false, error: { kind: "unavailable" } as const };
    },
    subscribe: (callback) => {
      listeners.add(callback as (event: unknown) => void);
      return () => {
        listeners.delete(callback as (event: unknown) => void);
      };
    },
  };
  return {
    client,
    emitCompleted: (taskId) => {
      for (const listener of listeners) {
        listener({ kind: "task.completed", taskId, payload: {} });
      }
    },
  };
}

describe("packages live port A2 install write face (026 v0.2 consumption)", () => {
  it("narrows the frozen nine-key v0.2 plan verbatim (family const stamped, version-selection semantics carried, conflict remove rows projected)", async () => {
    const { client } = a2Client();
    const port = createLivePackages(client);
    const outcome = await port.previewInstall("C:/proj", [{ packageId: "com.vrchat.avatars", version: null }]);
    expect(outcome).toEqual({ kind: "ok", plan: VALID_INSTALL_PLAN });
  });

  it("answers unavailable on the absence arm and passes the A2 preview_failed envelope code verbatim", async () => {
    const absent = a2Client({
      preview: applicationError("vua.packages.unavailable", "unavailable"),
    });
    expect(
      await createLivePackages(absent.client).previewInstall("C:/proj", [{ packageId: "com.a.b", version: null }]),
    ).toEqual({ kind: "unavailable" });
    const previewFailed = a2Client({
      preview: applicationError("vua.packages.preview_failed", "external_failure"),
    });
    expect(
      await createLivePackages(previewFailed.client).previewInstall("C:/proj", [{ packageId: "com.a.b", version: null }]),
    ).toEqual({ kind: "failed", code: "vua.packages.preview_failed" });
  });

  it("answers shape violation when a v0.1-stamped plan rides the v0.2 operation or a field is invented", async () => {
    // v0.1 戳冒充 v0.2 应答:消费窄化按字面量,v0.1 戳 = 形状不符
    const v01Stamp = a2Client({
      preview: {
        ok: true,
        value: previewInstallFrame({ ...VALID_INSTALL_PLAN, schemaVersion: "vua.packages-ops/v0.1" }),
      },
    });
    expect(
      await createLivePackages(v01Stamp.client).previewInstall("C:/proj", [{ packageId: "com.a.b", version: null }]),
    ).toEqual({ kind: "failed", code: "packages_shape_violation" });
    const invented = a2Client({
      preview: {
        ok: true,
        value: previewInstallFrame({ ...VALID_INSTALL_PLAN, cacheSourced: true }),
      },
    });
    expect(
      await createLivePackages(invented.client).previewInstall("C:/proj", [{ packageId: "com.a.b", version: null }]),
    ).toEqual({ kind: "failed", code: "packages_shape_violation" });
  });

  it("flips blocks.installs with the served packages.installOps row (one row serves both A2 methods; changes semantics untouched)", async () => {
    const withRow = await createLivePackages(
      a2Client({
        snapshot: [
          { operationId: "packages.query", availability: "available" },
          { operationId: "packages.installOps", availability: "available" },
        ],
      }).client,
    ).snapshot();
    if (withRow.kind === "ready-p2") {
      expect(withRow.blocks.installs).toBe(true);
      expect(withRow.blocks.changes).toBe(false);
    }
    const withoutRow = await createLivePackages(a2Client().client).snapshot();
    if (withoutRow.kind === "ready-p2") {
      expect(withoutRow.blocks.installs).toBe(false);
    }
  });

  it("rides the task loop: v0.2 acceptance -> completed event -> succeeded snapshot with the install receipt payload", async () => {
    const taskGetSequence: GatewayResult<DesktopGatewaySuccessValueV1>[] = [
      { ok: true, value: taskSnapshotValue("running") },
      {
        ok: true,
        value: taskSnapshotValue("succeeded", {
          result: { schemaVersion: "0.2", operation: "packages.applyInstall", result: VALID_INSTALL_RECEIPT },
        }),
      },
    ];
    let taskGetCalls = 0;
    let subscribed = false;
    const listeners = new Set<(event: unknown) => void>();
    const client: GatewayClient = {
      invoke: async (request) => {
        if (request.method === "packages.applyInstall") {
          return { ok: true, value: acceptedInstallFrame("t-2") };
        }
        if (request.method === "task.get") {
          const answer: GatewayResult<DesktopGatewaySuccessValueV1> =
            taskGetSequence[Math.min(taskGetCalls, taskGetSequence.length - 1)] ?? {
              ok: false,
              error: { kind: "unavailable" },
            };
          taskGetCalls += 1;
          return answer;
        }
        return { ok: false, error: { kind: "unavailable" } as const };
      },
      subscribe: (callback) => {
        listeners.add(callback as (event: unknown) => void);
        subscribed = true;
        return () => {
          listeners.delete(callback as (event: unknown) => void);
        };
      },
    };
    const port = createLivePackages(client);
    const pending = port.applyInstall("C:/proj", [{ packageId: "com.vrchat.avatars", version: null }], "fnv-1a-def456");
    while (!subscribed) await new Promise((resolve) => setTimeout(resolve, 1));
    for (const listener of listeners) listener({ kind: "task.completed", taskId: "t-2", payload: {} });
    expect(await pending).toEqual({ kind: "ok", receipt: VALID_INSTALL_RECEIPT });
  });

  it("surfaces a rejected guard refusal (drift) as the typed rejection and never an error", async () => {
    const flow = a2Client({
      taskGet: {
        ok: true,
        value: taskSnapshotValue("succeeded", {
          result: { schemaVersion: "0.2", operation: "packages.applyInstall", result: VALID_INSTALL_REJECTED },
        }),
      },
    });
    const port = createLivePackages(flow.client);
    expect(
      await port.applyInstall("C:/proj", [{ packageId: "com.vrchat.avatars", version: null }], "fnv-1a-def456"),
    ).toEqual({ kind: "rejected", rejection: VALID_INSTALL_REJECTED });
  });

  it("answers a non-succeeded terminal verbatim and a v0.1-stamped acceptance as shape violation (never fabricates a receipt)", async () => {
    const failed = a2Client({
      taskGet: {
        ok: true,
        value: taskSnapshotValue("failed", {
          error: {
            contractVersion: "0.1",
            code: "vua.provider.persistence_failed",
            category: "internal",
            messageKey: "errors.provider.persistence",
            recoverable: false,
            retryable: false,
            correlationId: "c-2",
          },
        }),
      },
    });
    expect(
      await createLivePackages(failed.client).applyInstall("C:/proj", [{ packageId: "com.a.b", version: null }], "d"),
    ).toEqual({ kind: "failed", code: "vua.provider.persistence_failed" });
    // 受理回执信封版本钉 0.2:0.1 戳 = 受理形状违规
    const badAcceptance = a2Client({
      apply: { ok: true, value: asWire({ schemaVersion: "0.1", operation: "packages.applyInstall", taskId: "t-2", correlationId: "c-2" }) },
    });
    expect(
      await createLivePackages(badAcceptance.client).applyInstall("C:/proj", [{ packageId: "com.a.b", version: null }], "d"),
    ).toEqual({ kind: "failed", code: "packages_apply_acceptance_shape" });
  });
});

function assertReadyP2(view: PackagesView): void {
  expect(view.kind).toBe("ready-p2");
}
