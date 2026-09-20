import { fixtureStrings } from "../i18n/strings.fixtures.zh-CN.ts";
import type {
  ChangeRequest,
  PackageChangeItem,
  PackageChangeKind,
  PackageChangePreview,
  PackageProject,
  PackageRow,
  PackagesPort,
  PackagesView,
  RepoInfo,
} from "./packages-port.ts";
import type { CapabilityReport } from "./types.ts";

/**
 * 包管理 fixture(S-XVI,仅 DEV 可达,经 fixture-gateway 装配):
 * - demo-packages 场景提供完整 ready 视图:3 个项目(其一目录丢失无效)、
 *   8 个包(已装最新/可升级/大版本升级/未装/预发布/yanked/本地导入/
 *   不兼容旧版分组)、官方与精选仓库 + 2 个社区仓库(其一 unreachable);
 * - 变更两阶段:previewChanges 产出确定性预览(移除"示例换装衣柜"→
 *   冲突红名单 + legacy 移除清单;remove/majorUpgrade/downgrade →
 *   destructive,表现层据此延迟确认),applyChanges 推进内存态并广播;
 * - addProject / importLocalPackage 为确定性演示:首次 added 并广播,
 *   其后 cancelled(等价于用户取消选择框),保证走查可复现;
 * - 版本状态由本端口计算(诚实纪律:表现层不做版本词法比较);
 *   展示负载集中在 strings.fixtures.zh-CN.ts,时间戳为固定 ISO 字符串。
 */

const copy = fixtureStrings.packages;

const CHECKED_OK = "2026-08-26T02:30:00.000Z";
const CHECKED_STALE = "2026-08-18T14:05:00.000Z";

interface PackagesState {
  projects: PackageProject[];
  selectedProjectId: string;
  packagesByProject: Record<string, PackageRow[]>;
  repos: RepoInfo[];
  localImported: boolean;
  projectAdded: boolean;
}

/* ---- 端口侧版本工具(诚实纪律:版本比较只允许发生在端口实现内) ---- */

function parseVersion(version: string): number[] {
  return version.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let index = 0; index < Math.max(pa.length, pb.length); index += 1) {
    const diff = (pa[index] ?? 0) - (pb[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function classifyUpdate(installed: string, target: string): PackageChangeKind {
  const order = compareVersions(target, installed);
  if (order < 0) return "downgrade";
  if (order === 0) return "reinstall";
  return parseVersion(target)[0] !== parseVersion(installed)[0] ? "majorUpgrade" : "upgrade";
}

/* ---- 初始数据 ---- */

function initialProjects(): PackageProject[] {
  return [
    {
      id: "proj-summer",
      name: copy.projects.summer.name,
      path: copy.projects.summer.path,
      unityVersion: "2022.3.22f1",
      valid: true,
      favorite: true,
    },
    {
      id: "proj-stage",
      name: copy.projects.stage.name,
      path: copy.projects.stage.path,
      valid: true,
      favorite: false,
    },
    {
      id: "proj-lost",
      name: copy.projects.lost.name,
      path: copy.projects.lost.path,
      unityVersion: "2022.3.6f1",
      valid: false,
      invalidReasonKey: "folderMissing",
      favorite: false,
    },
  ];
}

function sdkRow(installedVersion: string | null): PackageRow {
  return {
    id: "com.vrchat.avatars",
    displayName: copy.rows.avatarsSdk.displayName,
    description: copy.rows.avatarsSdk.description,
    source: "official",
    installedVersion,
    latestVersion: "3.9.2",
    updateAvailable: installedVersion !== null && installedVersion !== "3.9.2",
    versions: [
      { version: "3.9.2", compatible: true },
      { version: "3.9.1", compatible: true },
    ],
    changelogUrl: "https://example.invalid/changelog/vrchat-avatars",
  };
}

function initialPackages(): Record<string, PackageRow[]> {
  return {
    "proj-summer": [
      sdkRow("3.9.2"),
      {
        id: "com.example.modular-closet",
        displayName: copy.rows.modularCloset.displayName,
        description: copy.rows.modularCloset.description,
        source: "curated",
        installedVersion: "1.4.0",
        latestVersion: "2.0.0",
        updateAvailable: true,
        versions: [
          { version: "2.0.0", compatible: true },
          { version: "1.6.0", compatible: true },
          { version: "1.4.0", compatible: true },
        ],
        changelogUrl: "https://example.invalid/changelog/modular-closet",
      },
      {
        id: "com.example.facefx",
        displayName: copy.rows.facefx.displayName,
        description: copy.rows.facefx.description,
        source: "community",
        installedVersion: null,
        latestVersion: "3.1.0",
        updateAvailable: false,
        versions: [
          { version: "3.2.0-beta.1", compatible: true },
          { version: "3.1.0", compatible: true },
          { version: "3.0.0", compatible: false },
        ],
      },
      {
        id: "com.example.toon-shader",
        displayName: copy.rows.toonShader.displayName,
        description: copy.rows.toonShader.description,
        source: "community",
        installedVersion: "0.9.5",
        latestVersion: "0.9.5",
        updateAvailable: false,
        versions: [
          { version: "0.9.5", compatible: true },
          { version: "0.9.4", compatible: true, yanked: true },
          { version: "0.9.3", compatible: true },
        ],
      },
      {
        id: "com.example.legacy-props",
        displayName: copy.rows.legacyProps.displayName,
        description: copy.rows.legacyProps.description,
        source: "curated",
        installedVersion: "2.2.1",
        latestVersion: "2.3.0",
        updateAvailable: true,
        versions: [
          { version: "2.3.0", compatible: true },
          { version: "2.2.1", compatible: true },
        ],
      },
      {
        id: "com.example.physbone-plus",
        displayName: copy.rows.physbonePlus.displayName,
        description: copy.rows.physbonePlus.description,
        source: "community",
        installedVersion: null,
        latestVersion: "1.0.2",
        updateAvailable: false,
        versions: [
          { version: "1.0.2", compatible: true },
          { version: "1.0.1", compatible: true },
        ],
      },
      {
        id: "com.example.local-tail",
        displayName: copy.rows.localTail.displayName,
        description: copy.rows.localTail.description,
        source: "local",
        installedVersion: "0.3.0",
        latestVersion: null,
        updateAvailable: false,
        versions: [{ version: "0.3.0", compatible: true }],
      },
      {
        id: "com.example.stage-fx",
        displayName: copy.rows.stageFx.displayName,
        description: copy.rows.stageFx.description,
        source: "community",
        installedVersion: null,
        latestVersion: "4.0.0",
        updateAvailable: false,
        versions: [
          { version: "4.0.0", compatible: true },
          { version: "3.5.0", compatible: false },
          { version: "3.4.0", compatible: false },
        ],
        changelogUrl: "https://example.invalid/changelog/stage-fx",
      },
    ],
    "proj-stage": [
      sdkRow("3.9.1"),
      {
        id: "com.example.toon-shader",
        displayName: copy.rows.toonShader.displayName,
        description: copy.rows.toonShader.description,
        source: "community",
        installedVersion: "0.9.3",
        latestVersion: "0.9.5",
        updateAvailable: true,
        versions: [
          { version: "0.9.5", compatible: true },
          { version: "0.9.4", compatible: true, yanked: true },
          { version: "0.9.3", compatible: true },
        ],
      },
      {
        id: "com.example.stage-fx",
        displayName: copy.rows.stageFx.displayName,
        description: copy.rows.stageFx.description,
        source: "community",
        installedVersion: "4.0.0",
        latestVersion: "4.0.0",
        updateAvailable: false,
        versions: [
          { version: "4.0.0", compatible: true },
          { version: "3.5.0", compatible: false },
          { version: "3.4.0", compatible: false },
        ],
      },
    ],
  };
}

function initialRepos(): RepoInfo[] {
  return [
    {
      id: "repo-official",
      name: copy.repos.official.name,
      kind: "official",
      enabled: true,
      health: "ok",
      lastCheckedAt: CHECKED_OK,
      packageCount: 5,
    },
    {
      id: "repo-curated",
      name: copy.repos.curated.name,
      kind: "curated",
      enabled: true,
      health: "ok",
      lastCheckedAt: CHECKED_OK,
      packageCount: 18,
    },
    {
      id: "repo-community-a",
      name: copy.repos.communityA.name,
      url: copy.repos.communityA.url,
      kind: "community",
      enabled: true,
      health: "ok",
      lastCheckedAt: CHECKED_OK,
      packageCount: 42,
    },
    {
      id: "repo-community-b",
      name: copy.repos.communityB.name,
      url: copy.repos.communityB.url,
      kind: "community",
      enabled: true,
      health: "unreachable",
      lastCheckedAt: CHECKED_STALE,
      packageCount: 17,
    },
  ];
}

function localImportRow(): PackageRow {
  return {
    id: "com.example.local-hairpin",
    displayName: copy.rows.localImport.displayName,
    description: copy.rows.localImport.description,
    source: "local",
    installedVersion: "0.1.0",
    latestVersion: null,
    updateAvailable: false,
    versions: [{ version: "0.1.0", compatible: true }],
  };
}

/* ---- 视图与两阶段变更 ---- */

function toView(state: PackagesState): PackagesView {
  return {
    schemaVersion: 1,
    kind: "ready",
    projects: state.projects,
    selectedProjectId: state.selectedProjectId,
    packages: state.packagesByProject[state.selectedProjectId] ?? [],
    repos: state.repos,
    migrationHint: { kind: "vpm", summaryKey: "vpmProject" },
  };
}

function buildPreview(
  requests: readonly ChangeRequest[],
  state: PackagesState,
  id: string,
): PackageChangePreview {
  const rows = state.packagesByProject[state.selectedProjectId] ?? [];
  const items: PackageChangeItem[] = [];
  const conflicts: PackageChangePreview["conflicts"][number][] = [];
  const legacyRemovals: string[] = [];
  for (const request of requests) {
    const packageIds =
      request.kind === "bulk-update-latest" ? request.packageIds : [request.packageId];
    for (const packageId of packageIds) {
      const row = rows.find((candidate) => candidate.id === packageId);
      if (!row) continue;
      if (request.kind === "install") {
        const toVersion = request.version ?? row.latestVersion;
        if (!toVersion) continue;
        items.push({ kind: "install", packageId, displayName: row.displayName, toVersion });
        continue;
      }
      if (request.kind === "update" || request.kind === "bulk-update-latest") {
        if (!row.installedVersion) continue;
        const toVersion =
          request.kind === "update" && request.version ? request.version : row.latestVersion;
        if (!toVersion) continue;
        items.push({
          kind: classifyUpdate(row.installedVersion, toVersion),
          packageId,
          displayName: row.displayName,
          fromVersion: row.installedVersion,
          toVersion,
        });
        continue;
      }
      // remove
      if (!row.installedVersion) continue;
      items.push({
        kind: "remove",
        packageId,
        displayName: row.displayName,
        fromVersion: row.installedVersion,
      });
      // 罐装冲突:换装衣柜被旧版道具集依赖,移除需一并确认 legacy 目录
      if (packageId === "com.example.modular-closet") {
        conflicts.push({
          packageIds: [row.id, "com.example.legacy-props"],
          messageKey: "requiredBy",
        });
        legacyRemovals.push(copy.legacyDirs.modularCloset);
      }
    }
  }
  const destructive = items.some(
    (item) => item.kind === "remove" || item.kind === "majorUpgrade" || item.kind === "downgrade",
  );
  return { id, items, conflicts, legacyRemovals, destructive };
}

function applyPreview(preview: PackageChangePreview, state: PackagesState): void {
  const rows = state.packagesByProject[state.selectedProjectId] ?? [];
  state.packagesByProject[state.selectedProjectId] = rows.map((row) => {
    const item = preview.items.find((candidate) => candidate.packageId === row.id);
    if (!item) return row;
    if (item.kind === "remove") {
      return { ...row, installedVersion: null, updateAvailable: false };
    }
    if (item.kind === "reinstall") return row;
    const installedVersion = item.toVersion ?? row.installedVersion;
    return {
      ...row,
      installedVersion,
      updateAvailable:
        installedVersion !== null &&
        row.latestVersion !== null &&
        installedVersion !== row.latestVersion,
    };
  });
}

export function createFixturePackages(): PackagesPort {
  const state: PackagesState = {
    projects: initialProjects(),
    selectedProjectId: "proj-summer",
    packagesByProject: initialPackages(),
    repos: initialRepos(),
    localImported: false,
    projectAdded: false,
  };
  const listeners = new Set<(view: PackagesView) => void>();
  const previews = new Map<string, PackageChangePreview>();
  let previewCounter = 0;
  const broadcast = () => {
    const view = toView(state);
    for (const callback of listeners) callback(view);
  };
  return {
    snapshot: () => Promise.resolve(toView(state)),
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    selectProject: (projectId) => {
      if (state.projects.some((project) => project.id === projectId)) {
        state.selectedProjectId = projectId;
        broadcast();
      }
      return Promise.resolve(toView(state));
    },
    addProject: () => {
      if (state.projectAdded) return Promise.resolve({ kind: "cancelled" } as const);
      state.projectAdded = true;
      state.projects.push({
        id: "proj-imported",
        name: copy.projects.imported.name,
        path: copy.projects.imported.path,
        valid: true,
        favorite: false,
      });
      state.packagesByProject["proj-imported"] = [];
      state.selectedProjectId = "proj-imported";
      broadcast();
      return Promise.resolve({ kind: "added", view: toView(state) } as const);
    },
    importLocalPackage: () => {
      if (state.localImported) return Promise.resolve({ kind: "cancelled" } as const);
      state.localImported = true;
      const rows = state.packagesByProject[state.selectedProjectId] ?? [];
      state.packagesByProject[state.selectedProjectId] = [...rows, localImportRow()];
      broadcast();
      return Promise.resolve({ kind: "added", view: toView(state) } as const);
    },
    previewChanges: (requests) => {
      previewCounter += 1;
      const preview = buildPreview(requests, state, `preview-${previewCounter}`);
      previews.set(preview.id, preview);
      return Promise.resolve({ kind: "ok", preview } as const);
    },
    applyChanges: (previewId) => {
      const preview = previews.get(previewId);
      // 预览 id 未知/已消费:如实失败,不产生副作用
      if (!preview) return Promise.resolve({ kind: "unavailable" } as const);
      previews.delete(previewId);
      applyPreview(preview, state);
      broadcast();
      return Promise.resolve({ kind: "applied", view: toView(state) } as const);
    },
    // P1 词面(packages.listInstalled,024 消费批):fixture 是 DEV 演示面,
    // 不模拟 wire 词面回执——如实 unavailable(演示数据走既有 ready 完整
    // IA 视图,P1 中间诚实态只有 live 装配提供,mock 不冒充真实引擎)
    listInstalled: () => Promise.resolve({ kind: "unavailable" } as const),
    // P2 词面(packages.listRepos/packageCatalog,025 消费批):同纪律恒
    // 诚实 unavailable,演示订阅/目录数据只存在于既有 ready 视图
    packageCatalog: () => Promise.resolve({ kind: "unavailable" } as const),
    // F2 词面(packages.repoCatalog,027 消费批):同纪律恒诚实缺席——
    // 演示面永不模拟仓库级包目录 wire 回执(F2 浏览面只在 live 装配的
    // ready-p2 视图出现,mock 不冒充真实引擎)
    repoCatalog: () => Promise.resolve({ kind: "unavailable" } as const),
    // F5 词面(packages.listTemplates,027 消费批):同纪律恒诚实缺席——
    // 演示面永不模拟模板枚举 wire 回执(模板下拉只在 live 装配出现,
    // mock 不冒充真实引擎)
    listTemplates: () => Promise.resolve({ kind: "unavailable" } as const),
    // A1 写面词面(packages.previewRemove/applyRemove,026 消费批):模拟
    // 面永不模拟 wire 写回执——恒缺席臂(演示变更链走既有 ready 视图
    // 泛型 previewChanges/applyChanges,与 live A1 词面分立互不污染)
    previewRemove: () => Promise.resolve({ kind: "unavailable" } as const),
    applyRemove: () => Promise.resolve({ kind: "unavailable" } as const),
    // A2 写面词面(packages.previewInstall/applyInstall,026 v0.2 消费批):
    // 同纪律恒缺席臂(演示面永不模拟安装收据)
    previewInstall: () => Promise.resolve({ kind: "unavailable" } as const),
    applyInstall: () => Promise.resolve({ kind: "unavailable" } as const),
    // A3 写面词面(packages.registerLocalPackage,026 v0.3 消费批):同纪律
    // 恒缺席臂(演示面永不模拟注册收据)
    registerLocalPackage: () => Promise.resolve({ kind: "unavailable" } as const),
    // A4 写面词面(packages.addRemoteRepo/addLocalRepo/removeRepo,026 v0.4
    // 消费批):同纪律恒缺席臂(演示面永不模拟订阅收据)
    addRemoteRepo: () => Promise.resolve({ kind: "unavailable" } as const),
    addLocalRepo: () => Promise.resolve({ kind: "unavailable" } as const),
    removeRepo: () => Promise.resolve({ kind: "unavailable" } as const),
    // F4 写面词面(packages.enableRepo/disableRepo/refreshRepo,027 v0.6
    // 消费批):同纪律恒缺席臂(演示面永不模拟生命周期收据);原
    // setRepoEnabled 本地演示翻转退役——本地状态翻转绝不冒充 wire 写面,
    // 演示仓库行如需展示禁用态走静态演示数据非交互切换
    enableRepo: () => Promise.resolve({ kind: "unavailable" } as const),
    disableRepo: () => Promise.resolve({ kind: "unavailable" } as const),
    refreshRepo: () => Promise.resolve({ kind: "unavailable" } as const),
    // A5 写面词面(packages.createProject,026 v0.5 消费批):同纪律
    // 恒缺席臂(演示面永不模拟创建收据)
    createProject: () => Promise.resolve({ kind: "unavailable" } as const),
    capability: () => Promise.resolve<CapabilityReport>({ state: "ready" }),
  };
}
