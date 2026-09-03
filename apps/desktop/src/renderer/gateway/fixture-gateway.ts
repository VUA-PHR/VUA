import { format, termLabel } from "../i18n/index.ts";
import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type { CheckItem, CheckZone, VersionTrack, ZoneCheckResult, ZonePhase } from "../features/deployer/deployer-model.ts";
import type { LogEntry, StageNode } from "../features/workshop/track-model.ts";
import type { FixtureName } from "../app/resolve-scenario.ts";
import type { StoredGoalsV1 } from "../app/onboarding-model.ts";
import { createInactiveTutorialPort } from "./tutorial-port.ts";
import { createMemorySettingsPort } from "./settings-port.ts";
import { fixtureRecipeGraph } from "./fixture-recipes.ts";
import { fixtureReleaseWall } from "./fixture-release.ts";
import { fixtureWorkshopReplay } from "./fixture-workshop.ts";
import { fixtureAcquireEmpty, fixtureAcquireGallery } from "./fixture-acquire.ts";
import { createFixturePackages } from "./fixture-packages.ts";
import type { AcquirePort } from "./acquire-port.ts";
import type { EnvironmentPort, EnvironmentView, FixPlanResult } from "./environment-port.ts";
import type { FixPlanV1 } from "../features/deployer/fix-plan-model.ts";
import type { ModelProductionPort, ModelProductionView } from "./model-production-port.ts";
import type { PackagesPort, PackagesView } from "./packages-port.ts";
import type { TaskItem, TaskPort } from "./task-port.ts";
import type { TaskCenterView } from "./task-port.ts";
import type { ToolCard, ToolCatalogPort, ToolCatalogView, ToolCategory } from "./tool-catalog-port.ts";
import type { VuaGateway } from "./gateway.ts";
import type { CapabilityReport, DataSource } from "./types.ts";

/**
 * fixture 实现(G3,仅 DEV 构建可达——见 App.tsx 的 DEV 硬防线,
 * 生产构建中本模块被 Rollup 剔除,check:leak 验证)。
 * 数据模拟真实数据源负载:不代表真实环境状态,界面必须以"演示数据"
 * 徽标明确标识,禁止在任何安全相关结论中引用(原则①)。
 * 文案纪律:负载文案集中在 i18n/strings.fixtures.zh-CN.ts。
 */

/* ---- 共享信号:端口快照 + 订阅的最小实现 ---- */

function createSignal<T>(initial: T) {
  let current = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    get: () => current,
    set: (next: T) => {
      current = next;
      for (const callback of listeners) callback(current);
    },
    subscribe: (callback: (value: T) => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

/* ---- 演示负载(自 scenario-fixtures 迁移) ---- */

const checks = fixtureStrings.checks;

const mixedChecks: CheckItem[] = [
  {
    id: "vrchat",
    zone: "play",
    title: checks.vrchat.title,
    status: "ok",
    description: checks.vrchat.okDescription,
  },
  {
    id: "unity",
    zone: "create",
    title: checks.unity.title,
    status: "ok",
    description: checks.unity.okDescription,
  },
  {
    id: "vpm",
    zone: "create",
    title: checks.vpm.title,
    status: "error",
    description: checks.vpm.errorDescription,
    fixLabel: checks.vpm.fixLabel,
  },
  {
    id: "vr-runtime",
    zone: "play",
    title: checks.vrRuntime.title,
    status: "warning",
    description: checks.vrRuntime.warningDescription,
    fixLabel: checks.vrRuntime.fixLabel,
  },
  {
    id: "disk",
    zone: "create",
    title: checks.disk.title,
    status: "ok",
    description: checks.disk.okDescription,
  },
  {
    id: "network",
    zone: "play",
    title: checks.network.title,
    status: "ok",
    description: checks.network.okDescription,
  },
];

const allGreenChecks: CheckItem[] = mixedChecks.map(
  // exactOptionalPropertyTypes:从原项剥离 fixLabel 键而不是写 undefined
  ({ fixLabel: _omitted, ...rest }: CheckItem): CheckItem => ({
    ...rest,
    status: "ok",
    description:
      rest.id === "vpm"
        ? checks.vpm.okDescription
        : rest.id === "vr-runtime"
          ? checks.vrRuntime.okDescription
          : rest.description,
  }),
);

const runningStages: StageNode[] = [
  { id: "warehouse", label: termLabel("warehouse"), state: "completed" },
  { id: "recipe", label: termLabel("recipe"), state: "completed" },
  { id: "assembly", label: termLabel("assembly"), state: "completed" },
  { id: "production", label: termLabel("production"), state: "current" },
  { id: "inspection", label: termLabel("inspection"), state: "pending" },
  { id: "release", label: termLabel("release"), state: "pending" },
];

const runningLogTimes = ["10:24:31", "10:24:40", "10:25:02", "10:25:10"] as const;

const runningLog: LogEntry[] = fixtureStrings.workshop.logs.map((text, index) => ({
  time: runningLogTimes[index] ?? "10:25:10",
  text,
}));

const runningWorkshop = {
  kind: "running",
  headline: format(fixtureStrings.workshop.headline, { stage: termLabel("production") }),
  stages: runningStages,
  log: runningLog,
} as const;

/* ---- 修复计划演示负载(C-ENV):版本化 FixPlanV1,checkId 对应检测项 ---- */

const fixtureFixPlans: Record<string, FixPlanV1> = {
  vpm: {
    schemaVersion: 1,
    planId: "fixture-fix-vpm",
    checkId: "vpm",
    title: fixtureStrings.fixPlans.vpm.title,
    impact: fixtureStrings.fixPlans.vpm.impact,
    steps: [
      {
        kind: "confirm-candidate",
        id: "identify",
        title: fixtureStrings.fixPlans.vpm.identify,
        description: "",
        candidates: [...fixtureStrings.fixPlans.vpm.identifyCandidates],
      },
      {
        kind: "external-link",
        id: "download",
        title: fixtureStrings.fixPlans.vpm.openDownload,
        description: fixtureStrings.fixPlans.vpm.openDownloadDescription,
        url: "https://vrchat.com/home/download",
      },
      {
        kind: "manual",
        id: "install",
        title: fixtureStrings.fixPlans.vpm.runInstaller,
        description: fixtureStrings.fixPlans.vpm.runInstallerDescription,
      },
      {
        kind: "recheck",
        id: "recheck",
        title: fixtureStrings.fixPlans.vpm.recheck,
        description: fixtureStrings.fixPlans.vpm.recheckDescription,
      },
    ],
  },
  "vr-runtime": {
    schemaVersion: 1,
    planId: "fixture-fix-vr-runtime",
    checkId: "vr-runtime",
    title: fixtureStrings.fixPlans.vrRuntime.title,
    impact: fixtureStrings.fixPlans.vrRuntime.impact,
    steps: [
      {
        kind: "external-link",
        id: "guide",
        title: fixtureStrings.fixPlans.vrRuntime.openGuide,
        description: fixtureStrings.fixPlans.vrRuntime.openGuideDescription,
        url: "https://help.steampowered.com/zh-cn/faqs/view/0E2C-406B-9135-38A4",
      },
      {
        kind: "manual",
        id: "follow",
        title: fixtureStrings.fixPlans.vrRuntime.followGuide,
        description: fixtureStrings.fixPlans.vrRuntime.followGuideDescription,
      },
      {
        kind: "recheck",
        id: "recheck",
        title: fixtureStrings.fixPlans.vrRuntime.recheck,
        description: fixtureStrings.fixPlans.vrRuntime.recheckDescription,
      },
    ],
  },
};

/* ---- 任务演示负载(demo-tasks) ---- */

const taskCopy = fixtureStrings.tasks;

const demoTasks: TaskItem[] = [
  {
    id: "task-assembly",
    title: taskCopy.assembly.title,
    status: "running",
    progress: { done: 42, total: 100 },
    originPage: "workshop",
    cancellable: true,
  },
  {
    id: "task-envcheck",
    title: taskCopy.envCheck.title,
    status: "completedWithWarnings",
    originPage: "env-create",
    cancellable: false,
    errorText: taskCopy.envCheck.warning,
  },
  {
    id: "task-scan",
    title: taskCopy.warehouseScan.title,
    status: "completed",
    originPage: "warehouse",
    cancellable: false,
  },
];

/* ---- 版本轨道演示负载(S-XV)---- */

const versionCopy = fixtureStrings.versions;

/** 版本事实为演示负载(界面随页面挂"演示数据"徽标),不代表真实环境;
 *  state 结论由数据源给出(词法比较不做语义猜测),与真实端口同一契约 */
const fixtureVersions: Record<CheckZone, VersionTrack[]> = {
  play: [
    {
      id: "vrchat",
      title: versionCopy.vrchat,
      installed: "2025.3.1",
      latest: "2025.3.2",
      checkedAt: "2026-08-28T09:40:00+08:00",
      state: "update-available",
    },
    {
      id: "steamvr",
      title: versionCopy.steamvr,
      installed: "2.12.4",
      latest: "2.12.4",
      checkedAt: "2026-08-28T09:40:00+08:00",
      state: "up-to-date",
    },
  ],
  create: [
    {
      id: "unity",
      title: versionCopy.unity,
      installed: "2022.3.22f1",
      latest: "2022.3.22f1",
      checkedAt: "2026-08-28T09:40:00+08:00",
      state: "up-to-date",
    },
    {
      id: "vrcsdk",
      title: versionCopy.vrcsdk,
      installed: "3.7.2",
      latest: "3.8.1",
      checkedAt: "2026-08-27T21:15:00+08:00",
      state: "update-available",
    },
  ],
};

/* ---- 领域端口 fixture 实现 ---- */

function createFixtureEnvironment(
  items: CheckItem[],
  options: { startFresh?: boolean; failZones?: readonly CheckZone[]; settleMs?: number } = {},
): EnvironmentPort {
  const { startFresh = false, failZones = [], settleMs = 1200 } = options;
  const resultsFor = (zone: CheckZone, checkedAt: string): ZoneCheckResult => ({
    items: items.filter((item) => item.zone === zone),
    checkedAt,
  });
  const lastOf = (phase: ZonePhase): ZoneCheckResult | null => {
    if (phase.kind === "results") return { items: phase.items, checkedAt: phase.checkedAt };
    if (phase.kind === "running" || phase.kind === "failed") return phase.last;
    return null;
  };
  const zones: Record<CheckZone, ZonePhase> = startFresh
    ? { play: { kind: "not-run" }, create: { kind: "not-run" } }
    : {
        play: { kind: "results", ...resultsFor("play", "2026-08-25T10:20:00+08:00") },
        create: { kind: "results", ...resultsFor("create", "2026-08-25T10:20:00+08:00") },
      };
  const signal = createSignal<EnvironmentView>({
    schemaVersion: 1,
    deployer: { zones },
    versions: fixtureVersions,
  });
  return {
    snapshot: () => Promise.resolve(signal.get()),
    subscribe: signal.subscribe,
    // fixture 驱动完整状态机供走查(C-ENV):runCheck → running →(settleMs)→
    // results / failed。数据仍是演示负载(界面挂"演示数据"徽标),不代表真实
    // 环境(原则①);capability 为 ready 以便走查入口出现,与 empty 实现区分。
    runCheck: (zone) => {
      const current = signal.get().deployer.zones;
      const running: ZonePhase = {
        kind: "running",
        startedAt: new Date().toISOString(),
        last: lastOf(current[zone]),
      };
      signal.set({
        schemaVersion: 1,
        deployer: { zones: { ...current, [zone]: running } },
        versions: fixtureVersions,
      });
      setTimeout(() => {
        const zonesNow = signal.get().deployer.zones;
        const next: ZonePhase = failZones.includes(zone)
          ? { kind: "failed", last: lastOf(zonesNow[zone]) }
          : { kind: "results", ...resultsFor(zone, new Date().toISOString()) };
        signal.set({
          schemaVersion: 1,
          deployer: { zones: { ...zonesNow, [zone]: next } },
          versions: fixtureVersions,
        });
      }, settleMs);
      return Promise.resolve(signal.get());
    },
    planFix: (checkId): Promise<FixPlanResult> => {
      const plan = fixtureFixPlans[checkId];
      return Promise.resolve(plan ? { kind: "ok", plan } : { kind: "unknown-check" });
    },
    capability: () => Promise.resolve<CapabilityReport>({ state: "ready" }),
  };
}

function createFixtureModelProduction(workshop: ModelProductionView["workshop"]): ModelProductionPort {
  const view: ModelProductionView = { schemaVersion: 1, workshop };
  return {
    snapshot: () => Promise.resolve(view),
    subscribe: () => () => {},
    // Recipe 图谱(C-RECIPE):fixture 适配 derive 自内嵌文档副本
    // (fixture-recipes-data.ts);"current" → rich 场景,未知 id 诚实 not-connected
    recipeGraph: (recipeId) => Promise.resolve(fixtureRecipeGraph(recipeId)),
    importShareCode: () => Promise.resolve({ kind: "unavailable" }),
    exportShareCode: () => Promise.resolve({ kind: "unavailable" }),
    // Release 卡片墙(C-RECIPE-3):fixture 演示项目,覆盖健康/漂移/缺依赖
    releaseWall: () => Promise.resolve(fixtureReleaseWall()),
    capability: () => Promise.resolve<CapabilityReport>({ state: "ready" }),
  };
}

function createFixtureToolCatalog(): ToolCatalogPort {
  // C-TOOLS:演示目录五件,覆盖三用途分组与已装/未装组合;
  // 名称/用途/数据去向/维护者负载集中在 strings.fixtures.zh-CN.ts,
  // 分组键即 category(词表不进入字符串值,避免 check-leak 指纹误报)
  const tools: ToolCard[] = (
    Object.entries(fixtureStrings.tools) as Array<[ToolCategory, readonly unknown[]]>
  ).flatMap(([category, items]) =>
    items.map((item) => ({ ...(item as Omit<ToolCard, "category">), category })),
  );
  const view: ToolCatalogView = { schemaVersion: 1, kind: "catalog", tools };
  return {
    snapshot: () => Promise.resolve(view),
    subscribe: () => () => {},
    capability: () => Promise.resolve<CapabilityReport>({ state: "ready" }),
  };
}

/**
 * fixture 获取端口(C-ACQUIRE,ADR-0004 后 BLM 适配移除):
 * demo-acquire-scan 走查"扫描范围已指定、尚无素材到达"的空图册;
 * 其余场景给三种检查结论 + 预览已提取/未提取的混合图册。
 */
function createFixtureAcquire(empty: boolean): AcquirePort {
  const view = empty ? fixtureAcquireEmpty() : fixtureAcquireGallery();
  return {
    snapshot: () => Promise.resolve(view),
    subscribe: () => () => {},
    capability: () => Promise.resolve<CapabilityReport>({ state: "ready" }),
  };
}

/** fixture 任务端口:较 TaskPort 多出 DEV 演示回放(仅 demo-tasks 场景提供) */
export interface FixtureTaskPort extends TaskPort {
  /** 按时间序列驱动装配任务状态迁移,演示订阅链路;任务不存在时无操作 */
  replayDemoEvents?: () => void;
}

function createFixtureTask(withTasks: boolean): FixtureTaskPort {
  const initial: TaskCenterView = { schemaVersion: 1, tasks: withTasks ? demoTasks : [] };
  const signal = createSignal<TaskCenterView>(initial);

  const updateTask = (taskId: string, patch: Partial<TaskItem>) => {
    const view = signal.get();
    if (!view.tasks.some((task) => task.id === taskId)) return;
    signal.set({
      schemaVersion: 1,
      tasks: view.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    });
  };

  const port: FixtureTaskPort = {
    snapshot: () => Promise.resolve(signal.get()),
    subscribe: signal.subscribe,
    cancel: (taskId) => {
      const view = signal.get();
      const task = view.tasks.find((item) => item.id === taskId);
      if (!task) return Promise.resolve({ kind: "rejected" as const, reason: "unknown_task" as const, view });
      if (!task.cancellable) {
        return Promise.resolve({ kind: "rejected" as const, reason: "not_cancellable" as const, view });
      }
      updateTask(taskId, { status: "cancelled", cancellable: false });
      return Promise.resolve({ kind: "ok" as const, view: signal.get() });
    },
    capability: () => Promise.resolve<CapabilityReport>({ state: "ready" }),
  };

  if (withTasks) {
    port.replayDemoEvents = () => {
      const steps: Array<Partial<TaskItem>> = [
        { status: "queued", cancellable: true },
        { status: "preparing" },
        { status: "running", progress: { done: 0, total: 100 } },
        { status: "running", progress: { done: 50, total: 100 } },
        { status: "completed", progress: { done: 100, total: 100 }, cancellable: false },
      ];
      steps.forEach((patch, index) => {
        setTimeout(() => updateTask("task-assembly", patch), index * 900);
      });
    };
  }
  return port;
}

/* ---- 包管理(S-XVI):占位端口,fixture 本体随后续切片(fixture-packages)接入 ---- */

const stubPackagesView: PackagesView = { schemaVersion: 1, kind: "not-connected" };

function createStubPackages(): PackagesPort {
  return {
    snapshot: () => Promise.resolve(stubPackagesView),
    subscribe: () => () => {},
    selectProject: () => Promise.resolve(stubPackagesView),
    addProject: () => Promise.resolve({ kind: "unavailable" }),
    importLocalPackage: () => Promise.resolve({ kind: "unavailable" }),
    previewChanges: () => Promise.resolve({ kind: "unavailable" }),
    applyChanges: () => Promise.resolve({ kind: "unavailable" }),
    setRepoEnabled: () => Promise.resolve(stubPackagesView),
    capability: () =>
      Promise.resolve<CapabilityReport>({
        state: "unavailable",
        detailKey: "packagesEngineMissing",
      }),
  };
}

/* ---- 场景装配 ---- */

/**
 * fixture Gateway 装配(仅 DEV)。dataSource 恒为 "fixture",
 * 界面据此挂"演示数据"徽标。
 */
export function fixtureGateway(
  name: FixtureName,
  initialGoals: StoredGoalsV1 | null = null,
  envOptions: { settleMs?: number; failZones?: readonly CheckZone[] } = {},
): VuaGateway & { task: FixtureTaskPort } {
  const green = name === "demo-all-green" || name.startsWith("demo-workshop");
  // 车间(C-WORKSHOP):四盘回放带覆盖成功/警告/阻断/恢复;空态由
  // demo-all-green 承载;其余场景保留原静态 running 演示
  const workshop =
    name === "demo-all-green"
      ? ({ kind: "idle" } as const)
      : (fixtureWorkshopReplay(name) ?? runningWorkshop);
  const source: DataSource = "fixture";
  // 环境辖区场景(C-ENV):fresh = 两辖区从未检测,走查完整状态机;
  // fail = 检测必定失败,走查 failed 态与旧证据保留;其余场景直接出结果
  const envFresh = name === "demo-env-fresh" || name === "demo-env-fail";
  const envFailZones: readonly CheckZone[] =
    envOptions.failZones ?? (name === "demo-env-fail" ? ["play", "create"] : []);
  return {
    environment: createFixtureEnvironment(green ? allGreenChecks : mixedChecks, {
      startFresh: envFresh,
      failZones: envFailZones,
      // exactOptionalPropertyTypes:未配置时不写 settleMs 键
      ...(envOptions.settleMs !== undefined ? { settleMs: envOptions.settleMs } : {}),
    }),
    tutorial: createInactiveTutorialPort(),
    modelProduction: createFixtureModelProduction(workshop),
    toolCatalog: createFixtureToolCatalog(),
    acquire: createFixtureAcquire(name === "demo-acquire-scan"),
    // 包管理(S-XVI):demo-packages 场景接完整 fixture;其余场景保持
    // not-connected 占位(同 demo-tasks 的功能场景门控先例)
    packages: name === "demo-packages" ? createFixturePackages() : createStubPackages(),
    task: createFixtureTask(name === "demo-tasks"),
    settings: createMemorySettingsPort(initialGoals),
    dataSource: () => source,
  };
}
