/**
 * Packages 读面 live 端口(024 P1 中间诚实态消费批,2026-09-17;025 P2
 * 读面消费批,2026-09-17;025 v0.2 增量消费更新批,2026-09-17):经
 * Desktop Gateway 消费 packages-query v0.1(单方法只读
 * packages.listInstalled)与 025 P2 双族 v0.1(packages.listRepos 仓库
 * 订阅清单 + packages.packageCatalog 单包目录按需查询)冻结词面;目录
 * 族纯增量双版本协商——backend 未声明 v0.2 前以 v0.1 族应答(七键),
 * 声明后以 v0.2 族应答(冻结七键恰加必带 cacheSourced 披露)。消费纪律:
 * - 诚实缺席:引擎未装配/实现域未接线(vua.packages.unavailable)映射为
 *   not-connected 形态,绝不以空清单伪装(空态即终态);
 * - typed 失败照原词呈现:复用码 vua.project.project_not_found(选中项目
 *   已从 013 注册面消失)与合法空数组严格区分;vua.vpm.no_matching_package
 *   (词表外无此包)= 独立空态非错误页;失败不冒充空态(诚实纪律 2);
 * - 区块可用性标注权威事实源 = served_capabilities 能力行(app.snapshot
 *   operations):installed = packages.query 行;repos = packages.listRepos
 *   行;catalog = packages.packageCatalog 行(均随引擎后端
 *   catalog_capabilities 声明翻转,未实现即诚实不可渲染);changes 面无
 *   词表行,类型级恒 false,写入口不渲染;
 * - 响应窄化按三键纪律:schemaVersion==="0.1" + operation + result(本体
 *   族常量 vua.packages-installed/v0.1、vua.packages-repos/v0.1、
 *   vua.packages-catalog/v0.1)组合定位,零字段猜测,行闭集校验(多余
 *   键/缺键/类型不符 = 形状不符诚实失败);行序为服务端冻结事实
 *   (installed 按 packageId 升序、repos 按订阅面自身顺序),客户端不重
 *   排不猜测。
 */
import type {
  PackagesListInstalledRequestV1,
  PackagesListReposRequestV1,
  PackagesPackageCatalogRequestV1,
} from "@vua/contracts";
import type { GatewayClient } from "./gateway-client.ts";
import type {
  CatalogPackageFactsV01,
  CatalogPackageFactsV02,
  CatalogVersionRowV01,
  InstalledPackageRowV01,
  PackagesPort,
  PackagesView,
  RepoInfoRowV01,
} from "./packages-port.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

const PACKAGES_OPERATION_ID = "packages.query";
const LIST_REPOS_OPERATION_ID = "packages.listRepos";
const CATALOG_OPERATION_ID = "packages.packageCatalog";

/** wire 成功帧三键包裹:schemaVersion(信封 "0.1")+ operation + result */
interface PackagesWireEnvelope {
  readonly schemaVersion: unknown;
  readonly operation: unknown;
  readonly result: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 词面可空字符串:null = 库面 Option 如实投影;非 null 空串非法(Schema minLength 1) */
function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.length > 0);
}

/** 冻结包行三键闭集:多余键/缺键/类型不符即整行形状不符(诚实失败,不猜测) */
function isInstalledPackageRow(value: unknown): value is InstalledPackageRowV01 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.length !== 3 || keys[0] !== "dependencies" || keys[1] !== "packageId" || keys[2] !== "version") {
    return false;
  }
  return typeof value.packageId === "string"
    && value.packageId.length > 0
    && typeof value.version === "string"
    && value.version.length > 0
    && Array.isArray(value.dependencies)
    && value.dependencies.every((dependency) => typeof dependency === "string");
}

/** P2 仓库订阅行五键闭集(025 冻结词面;health/status 等发明字段 = 形状违规) */
function isRepoInfoRow(value: unknown): value is RepoInfoRowV01 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  const expected = ["cached", "localPath", "name", "repoId", "url"];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return typeof value.cached === "boolean"
    && isNullableNonEmptyString(value.repoId)
    && isNullableNonEmptyString(value.name)
    && isNullableNonEmptyString(value.url)
    && isNullableNonEmptyString(value.localPath);
}

/** P2 目录版本行三键闭集(compatible boolean|null,null = 工程版本未知) */
function isCatalogVersionRow(value: unknown): value is CatalogVersionRowV01 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  const expected = ["compatible", "version", "yanked"];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return typeof value.version === "string"
    && value.version.length > 0
    && typeof value.yanked === "boolean"
    && (typeof value.compatible === "boolean" || value.compatible === null);
}

/** P2 单包目录事实七键闭集(source 词表 repo|local;updateAvailable boolean|null) */
function isCatalogPackageFacts(value: unknown): value is CatalogPackageFactsV01 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  const expected = ["displayName", "installed", "packageId", "projectPath", "source", "updateAvailable", "versions"];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return typeof value.projectPath === "string"
    && value.projectPath.length > 0
    && typeof value.packageId === "string"
    && value.packageId.length > 0
    && isNullableNonEmptyString(value.displayName)
    && (value.source === "repo" || value.source === "local")
    && typeof value.installed === "boolean"
    && (typeof value.updateAvailable === "boolean" || value.updateAvailable === null)
    && Array.isArray(value.versions)
    && value.versions.every(isCatalogVersionRow);
}

/** P2 v0.2 目录事实八键闭集 = 冻结七键恰加必带 cacheSourced(025 v0.2
 * 增量冻结批):缺键(七键盖 v0.2 戳)或多余键均形状不符诚实失败——
 * 版本世代由盖戳族常量钉死,消费端永不猜测 */
function isCatalogPackageFactsV02(value: unknown): value is CatalogPackageFactsV02 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  const expected = [
    "cacheSourced",
    "displayName",
    "installed",
    "packageId",
    "projectPath",
    "source",
    "updateAvailable",
    "versions",
  ];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return typeof value.cacheSourced === "boolean" && isCatalogPackageFacts({
    displayName: value.displayName,
    installed: value.installed,
    packageId: value.packageId,
    projectPath: value.projectPath,
    source: value.source,
    updateAvailable: value.updateAvailable,
    versions: value.versions,
  });
}

function isPackagesWireEnvelope(value: unknown, operation: string): value is PackagesWireEnvelope {
  return isRecord(value)
    && value.schemaVersion === "0.1"
    && value.operation === operation
    && isRecord(value.result);
}

/** result 本体:schemaVersion 族常量 + projectPath + packages 行数组 */
function isPackagesInstalledResult(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== "vua.packages-installed/v0.1") return false;
  if (typeof value.projectPath !== "string" || value.projectPath.length === 0) return false;
  return Array.isArray(value.packages) && value.packages.every(isInstalledPackageRow);
}

/** result 本体:schemaVersion 族常量 + repos 行数组(空数组 = 诚实零订阅) */
function isPackagesReposResult(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== "vua.packages-repos/v0.1") return false;
  return Array.isArray(value.repos) && value.repos.every(isRepoInfoRow);
}

/** result 本体:schemaVersion 族常量 + 冻结七键目录事实(v0.1 冻结词面,
 * backend 未声明 v0.2 前的应答族) */
function isPackagesCatalogResultV01(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== "vua.packages-catalog/v0.1") return false;
  const { schemaVersion: _familyConst, ...facts } = value;
  return isCatalogPackageFacts(facts);
}

/** result 本体:schemaVersion 族常量 + 八键目录事实(冻结七键恰加必带
 * cacheSourced;声明 v0.2 的 backend 应答族)。双族协商:读盖戳族常量
 * 按对应词面窄化,零字段猜测;两族盖戳不匹配各自键闭集 = 形状不符 */
function isPackagesCatalogResultV02(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== "vua.packages-catalog/v0.2") return false;
  const { schemaVersion: _familyConst, ...facts } = value;
  return isCatalogPackageFactsV02(facts);
}

/** 目录族组合校验:盖戳族常量决定按 v0.1 或 v0.2 词面窄化(纯增量双
 * 版本协商);未知族常量 = 形状不符(消费端永不猜测词面) */
function isPackagesCatalogResult(value: Record<string, unknown>): boolean {
  return isPackagesCatalogResultV01(value) || isPackagesCatalogResultV02(value);
}

type TypedOutcome<T> =
  | { readonly kind: "ok"; readonly result: T }
  | { readonly kind: "failed"; readonly code: string }
  | { readonly kind: "unavailable" };

export function createLivePackages(client: GatewayClient): PackagesPort {
  /**
   * served_capabilities 能力行读取(区块标注权威事实源):app.snapshot
   * 一次取三行——packages.query(installed)/packages.listRepos(repos)/
   * packages.packageCatalog(catalog);行缺席或 availability 非
   * available = 该区块诚实不可渲染(渲染层不伪造)。
   */
  const readCapabilityRows = async (): Promise<{
    installed: boolean;
    repos: boolean;
    catalog: boolean;
  }> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "app.snapshot",
      params: {},
    });
    const availability = (operationId: string): boolean => {
      if (!result.ok || !isRecord(result.value)) return false;
      const capabilities = result.value.capabilities;
      if (!isRecord(capabilities) || !Array.isArray(capabilities.operations)) return false;
      return capabilities.operations.some(
        (operation) =>
          isRecord(operation)
          && operation.operationId === operationId
          && operation.availability === "available",
      );
    };
    return {
      installed: availability(PACKAGES_OPERATION_ID),
      repos: availability(LIST_REPOS_OPERATION_ID),
      catalog: availability(CATALOG_OPERATION_ID),
    };
  };

  const invokeTyped = async (
    request: PackagesListInstalledRequestV1 | PackagesListReposRequestV1 | PackagesPackageCatalogRequestV1,
    operation: string,
    validateResult: (value: Record<string, unknown>) => boolean,
  ): Promise<TypedOutcome<Record<string, unknown>>> => {
    const result = await client.invoke(request);
    if (!result.ok) {
      if (result.error.kind === "application") {
        // 缺席臂(vua.packages.unavailable)= 引擎未装配,诚实 unavailable;
        // 其余 typed 码(project_not_found/no_matching_package/
        // capability_missing/project_load_failed/invalid_params)照原词
        // 上呈,不折叠为空态
        if (result.error.error.code === "vua.packages.unavailable") {
          return { kind: "unavailable" };
        }
        return { kind: "failed", code: result.error.error.code };
      }
      return { kind: "unavailable" };
    }
    if (!isPackagesWireEnvelope(result.value, operation)) {
      return { kind: "failed", code: "packages_shape_violation" };
    }
    const resultBody = result.value.result;
    if (!validateResult(resultBody)) {
      return { kind: "failed", code: "packages_shape_violation" };
    }
    return { kind: "ok", result: resultBody };
  };

  const listInstalledRaw = async (projectPath: string): Promise<TypedOutcome<readonly InstalledPackageRowV01[]>> => {
    const request: PackagesListInstalledRequestV1 = {
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "packages.listInstalled",
      params: { projectPath },
    };
    const outcome = await invokeTyped(request, "packages.listInstalled", isPackagesInstalledResult);
    if (outcome.kind !== "ok") return outcome;
    return { kind: "ok", result: (outcome.result as { packages: readonly InstalledPackageRowV01[] }).packages };
  };

  /** P2 订阅清单:行序 = 订阅面自身顺序(配置事实),空数组 = 诚实零订阅 */
  const listReposRaw = async (): Promise<TypedOutcome<readonly RepoInfoRowV01[]>> => {
    const request: PackagesListReposRequestV1 = {
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "packages.listRepos",
      params: {},
    };
    const outcome = await invokeTyped(request, "packages.listRepos", isPackagesReposResult);
    if (outcome.kind !== "ok") return outcome;
    return { kind: "ok", result: (outcome.result as { repos: readonly RepoInfoRowV01[] }).repos };
  };

  /** P2 目录事实:按需查询(双键闭集);typed 码照原词(no_matching_package
   * = 独立空态呈现,页面处理);族常量在窄化校验时消费并决定返回词面
   * (v0.1 七键 / v0.2 八键含 cacheSourced 披露),盖戳辨族永不猜测 */
  const packageCatalogRaw = async (projectPath: string, packageId: string): Promise<TypedOutcome<CatalogPackageFactsV01 | CatalogPackageFactsV02>> => {
    const request: PackagesPackageCatalogRequestV1 = {
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "packages.packageCatalog",
      params: { projectPath, packageId },
    };
    const outcome = await invokeTyped(request, "packages.packageCatalog", isPackagesCatalogResult);
    if (outcome.kind !== "ok") return outcome;
    const { schemaVersion: familyConst, ...facts } = outcome.result;
    // 组合校验已按族通过:剥信封键后按盖戳族断言对应词面事实
    const typedFacts = familyConst === "vua.packages-catalog/v0.2"
      ? (facts as unknown as CatalogPackageFactsV02)
      : (facts as unknown as CatalogPackageFactsV01);
    return { kind: "ok", result: typedFacts };
  };

  // 无事件推送源:快照按需聚合(选中项目变化或 capability.changed 驱动
  // 重取),订阅仅作能力行翻转的通知通道
  let selectedProjectPath: string | null = null;

  /** repos 面装配:能力行 false = 区块不渲染(repos: []);调用 unavailable
   * = 引擎缺席/断连(与 installed 同源)→ 整页 not-connected;typed 失败
   * = reposError 照原词(失败不冒充空态) */
  const fetchView = async (): Promise<PackagesView> => {
    const capabilityRows = await readCapabilityRows();
    if (!capabilityRows.installed) return { schemaVersion: 1, kind: "not-connected" };
    const reposOutcome = capabilityRows.repos ? await listReposRaw() : null;
    if (reposOutcome !== null && reposOutcome.kind === "unavailable") {
      return { schemaVersion: 1, kind: "not-connected" };
    }
    const reposFace: { repos: readonly RepoInfoRowV01[] } & { reposError?: { code: string } } =
      reposOutcome === null
        ? { repos: [] }
        : reposOutcome.kind === "ok"
          ? { repos: reposOutcome.result }
          : { repos: [], reposError: { code: reposOutcome.code } };
    if (selectedProjectPath === null) {
      return {
        schemaVersion: 1,
        kind: "ready-p2",
        blocks: {
          installed: true,
          repos: capabilityRows.repos,
          catalog: capabilityRows.catalog,
          changes: false,
        },
        projectPath: null,
        installedPackages: [],
        ...reposFace,
      };
    }
    const outcome = await listInstalledRaw(selectedProjectPath);
    if (outcome.kind === "unavailable") {
      return { schemaVersion: 1, kind: "not-connected" };
    }
    return {
      schemaVersion: 1,
      kind: "ready-p2",
      blocks: {
        installed: true,
        repos: capabilityRows.repos,
        catalog: capabilityRows.catalog,
        changes: false,
      },
      projectPath: selectedProjectPath,
      installedPackages: outcome.kind === "ok" ? outcome.result : [],
      ...(outcome.kind === "failed" ? { loadError: { code: outcome.code } } : {}),
      ...reposFace,
    };
  };

  const listeners = new Set<(view: PackagesView) => void>();
  const broadcast = () => {
    void fetchView().then(
      (view) => {
        for (const callback of listeners) callback(view);
      },
      () => {
        /* 断连期间保留上一视图(environment 端口同纪律) */
      },
    );
  };

  return {
    snapshot: fetchView,
    subscribe(callback) {
      listeners.add(callback);
      return (() => {
        listeners.delete(callback);
      }) as Unsubscribe;
    },
    async selectProject(projectPath) {
      // 视图的项目身份 = 013 注册路径;能力行不可用时保持 not-connected
      const capabilityRows = await readCapabilityRows();
      if (capabilityRows.installed) {
        selectedProjectPath = projectPath;
        broadcast();
      }
      return fetchView();
    },
    listInstalled: listInstalledRaw,
    packageCatalog: packageCatalogRaw,
    async addProject() {
      return { kind: "unavailable" };
    },
    async importLocalPackage() {
      return { kind: "unavailable" };
    },
    async previewChanges() {
      return { kind: "unavailable" };
    },
    async applyChanges() {
      return { kind: "unavailable" };
    },
    async setRepoEnabled() {
      return fetchView();
    },
    async capability(): Promise<CapabilityReport> {
      const capabilityRows = await readCapabilityRows();
      return capabilityRows.installed
        ? { state: "ready" }
        : { state: "unavailable", detailKey: "packagesEngineMissing" };
    },
  };
}
