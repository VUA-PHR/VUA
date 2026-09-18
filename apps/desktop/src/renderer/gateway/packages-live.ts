/**
 * Packages 读面 live 端口(024 P1 中间诚实态消费批,2026-09-17;025 P2
 * 读面消费批,2026-09-17;025 v0.2 增量消费更新批,2026-09-17;026 A1
 * 移除写面消费批,2026-09-19):经 Desktop Gateway 消费 packages-query
 * v0.1(单方法只读 packages.listInstalled)、025 P2 双族 v0.1
 * (packages.listRepos 仓库订阅清单 + packages.packageCatalog 单包目录
 * 按需查询)与 packages-ops v0.1 A1 移除写面(packages.previewRemove
 * 同步只读变更预览 + packages.applyRemove 九态任务化移除写命令——
 * 双摘要守卫:confirmedDigest 漂移即拒 preview_drift recoverable 冲突,
 * 重预览重确认绝不静默覆盖,诚实纪律 3;权威判定在服务端)。目录族纯
 * 增量双版本协商——backend 未声明 v0.2 前以 v0.1 族应答(七键),声明
 * 后以 v0.2 族应答(冻结七键恰加必带 cacheSourced 披露)。消费纪律:
 * - 诚实缺席:引擎未装配/实现域未接线(vua.packages.unavailable)映射为
 *   not-connected 形态,绝不以空清单伪装(空态即终态);
 * - typed 失败照原词呈现:复用码 vua.project.project_not_found(选中项目
 *   已从 013 注册面消失)与合法空数组严格区分;vua.vpm.no_matching_package
 *   (词表外无此包)= 独立空态非错误页;失败不冒充空态(诚实纪律 2);
 * - 区块可用性标注权威事实源 = served_capabilities 能力行(app.snapshot
 *   operations):installed = packages.query 行;repos = packages.listRepos
 *   行;catalog = packages.packageCatalog 行;changes = packages.removeOps
 *   行(026 A1:随引擎后端 remove_packages 能力声明翻转,未声明即写入口
 *   诚实不渲染);
 * - 响应窄化按三键纪律:schemaVersion==="0.1" + operation + result(本体
 *   族常量 vua.packages-installed/v0.1、vua.packages-repos/v0.1、
 *   vua.packages-catalog/v0.1、vua.packages-ops/v0.1)组合定位,零字段
 *   猜测,行闭集校验(多余键/缺键/类型不符 = 形状不符诚实失败);行序
 *   为服务端冻结事实(installed 按 packageId 升序、repos 按订阅面自身
 *   顺序),客户端不重排不猜测。
 */
import { isTerminalTaskStateV01 } from "@vua/contracts";
import type {
  PackagesApplyRemoveRequestV1,
  PackagesChangeItemV01,
  PackagesListInstalledRequestV1,
  PackagesListReposRequestV1,
  PackagesPackageCatalogRequestV1,
  PackagesPreviewRemoveRequestV1,
  PackagesRemovePlanV01,
  PackagesRemoveReceiptV01,
  PackagesRemoveRejectedV01,
} from "@vua/contracts";
import type { GatewayClient } from "./gateway-client.ts";
import { waitForTerminalTask } from "./project-ops-port.ts";
import type {
  CatalogPackageFactsV01,
  CatalogPackageFactsV02,
  CatalogVersionRowV01,
  InstalledPackageRowV01,
  PackagesPort,
  PackagesRemoveApplyOutcome,
  PackagesView,
  RepoInfoRowV01,
} from "./packages-port.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

const PACKAGES_OPERATION_ID = "packages.query";
const LIST_REPOS_OPERATION_ID = "packages.listRepos";
const CATALOG_OPERATION_ID = "packages.packageCatalog";
/** A1 移除写面 served 行(026 接线批申报;remove_packages 能力门控) */
const REMOVE_OPS_OPERATION_ID = "packages.removeOps";
/** packages-ops result 本体族常量(026 冻结批;盖戳辨词面永不猜测) */
const PACKAGES_OPS_SCHEMA_VERSION = "vua.packages-ops/v0.1";
/**
 * applyRemove 任务等待上界(本地文件移除操作,正常终态由 task.completed
 * 事件驱动毫秒级到达;本界只防御事件丢失/断连后的无限挂起——超时是
 * 「无法确认结果」,任务本身仍在任务中心呈现真实状态;014 先例同界)。
 */
const PACKAGES_APPLY_TASK_WAIT_MS = 120_000;

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

/* ---- A1 移除写面窄化(026 冻结词面;family const vua.packages-ops/v0.1) ---- */

/** 变更行四键闭集:kind 词表二值;version/reason 可空(null = 端口
 *  Option 如实投影,移除行即 null——非省略) */
function isRemoveChangeItem(value: unknown): value is PackagesChangeItemV01 {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value).sort();
  const expected = ["kind", "packageId", "reason", "version"];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return (value.kind === "install" || value.kind === "remove")
    && typeof value.packageId === "string"
    && value.packageId.length > 0
    && isNullableNonEmptyString(value.version)
    && (value.reason === null || typeof value.reason === "string");
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0);
}

/** kind=plan 九键闭集(026 冻结词面):items/conflicts/
 * removeLegacyFiles/removeLegacyFolders 必为数组,destructive 必布尔,
 * digest 必非空串——收不齐即形状不符诚实失败(虚假断言防线) */
function isPackagesRemovePlanResult(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== PACKAGES_OPS_SCHEMA_VERSION) return false;
  const keys = Object.keys(value).sort();
  const expected = [
    "conflicts",
    "destructive",
    "digest",
    "items",
    "kind",
    "projectPath",
    "removeLegacyFiles",
    "removeLegacyFolders",
    "schemaVersion",
  ];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return value.kind === "plan"
    && typeof value.projectPath === "string"
    && value.projectPath.length > 0
    && Array.isArray(value.items)
    && value.items.every(isRemoveChangeItem)
    && isStringArray(value.conflicts)
    && isStringArray(value.removeLegacyFiles)
    && isStringArray(value.removeLegacyFolders)
    && typeof value.destructive === "boolean"
    && typeof value.digest === "string"
    && value.digest.length > 0;
}

/** kind=receipt 六键闭集(审计收据三半面:确认指纹回显＋请求清单＋
 * 实际移除行;无端口载体的发明事实在 Schema 即非法) */
function isPackagesRemoveReceiptResult(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== PACKAGES_OPS_SCHEMA_VERSION) return false;
  const keys = Object.keys(value).sort();
  const expected = [
    "confirmedDigest",
    "kind",
    "projectPath",
    "removedItems",
    "requestedPackageIds",
    "schemaVersion",
  ];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return value.kind === "receipt"
    && typeof value.projectPath === "string"
    && value.projectPath.length > 0
    && typeof value.confirmedDigest === "string"
    && value.confirmedDigest.length > 0
    && isStringArray(value.requestedPackageIds)
    && Array.isArray(value.removedItems)
    && value.removedItems.every(isRemoveChangeItem);
}

/** kind=rejected 五键闭集:guard 三值闭集 + code 锁 vua.packages. 族
 * (013 复用码永不入 rejected 文档) + detail 非空 */
function isPackagesRemoveRejectedResult(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== PACKAGES_OPS_SCHEMA_VERSION) return false;
  const keys = Object.keys(value).sort();
  const expected = ["code", "detail", "guard", "kind", "schemaVersion"];
  if (keys.length !== expected.length) return false;
  for (let index = 0; index < expected.length; index += 1) {
    if (keys[index] !== expected[index]) return false;
  }
  return value.kind === "rejected"
    && (value.guard === "preview_drift"
      || value.guard === "package_not_found"
      || value.guard === "execution_failed")
    && typeof value.code === "string"
    && value.code.startsWith("vua.packages.")
    && typeof value.detail === "string"
    && value.detail.length > 0;
}

/** applyRemove wire 受理回执窄化(import-copy 同构四键:schemaVersion
 * 信封 + operation + taskId + correlationId;收不齐 = 形状不符) */
function isApplyRemoveAccepted(value: unknown): value is { taskId: string; correlationId: string } {
  if (!isRecord(value)) return false;
  return value.schemaVersion === "0.1"
    && value.operation === "packages.applyRemove"
    && typeof value.taskId === "string"
    && value.taskId.length > 0
    && typeof value.correlationId === "string"
    && value.correlationId.length > 0;
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
    changes: boolean;
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
      changes: availability(REMOVE_OPS_OPERATION_ID),
    };
  };

  const invokeTyped = async (
    request:
      | PackagesListInstalledRequestV1
      | PackagesListReposRequestV1
      | PackagesPackageCatalogRequestV1
      | PackagesPreviewRemoveRequestV1,
    operation: string,
    validateResult: (value: Record<string, unknown>) => boolean,
  ): Promise<TypedOutcome<Record<string, unknown>>> => {
    const result = await client.invoke(request);
    if (!result.ok) {
      if (result.error.kind === "application") {
        // 缺席臂(vua.packages.unavailable)= 引擎未装配,诚实 unavailable;
        // 其余 typed 码(project_not_found/no_matching_package/
        // capability_missing/package_not_found 等)照原词上呈,不折叠为空态
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

  /** A1 确认链第一步(026 冻结词面):同步只读预览,永不变更状态;
   * plan 九键闭集窄化,信封 typed 码照原词(unavailable 缺席臂折叠为
   * unavailable,其余 failed 照原词上呈) */
  const previewRemoveRaw = async (
    projectPath: string,
    packageIds: readonly string[],
  ): Promise<TypedOutcome<PackagesRemovePlanV01>> => {
    const request: PackagesPreviewRemoveRequestV1 = {
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "packages.previewRemove",
      params: { projectPath, packageIds },
    };
    const outcome = await invokeTyped(request, "packages.previewRemove", isPackagesRemovePlanResult);
    if (outcome.kind !== "ok") return outcome;
    return { kind: "ok", result: outcome.result as unknown as PackagesRemovePlanV01 };
  };

  /** A1 确认链第二步(026 冻结词面):任务化写命令(import-copy 同构,
   * 020 result 回流)——受理窄化→终态等待→Done payload 窄化。任务九态
   * 语义归应用契约任务面;任务真实状态由任务中心呈现,本端口只消费终
   * 态结果。超时/断连/形态不齐 = 诚实 unavailable,不猜测不伪造结果文
   * 档(014 先例);rejected 守卫拒绝是 Done payload(任务诚实完成、移
   * 除被拒),不是错误。 */
  const applyRemoveRaw = async (
    projectPath: string,
    packageIds: readonly string[],
    confirmedDigest: string,
  ): Promise<PackagesRemoveApplyOutcome> => {
    const request: PackagesApplyRemoveRequestV1 = {
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "packages.applyRemove",
      params: { projectPath, packageIds, confirmedDigest },
    };
    const response = await client.invoke(request);
    if (!response.ok) {
      if (response.error.kind === "application") {
        // 受理阶段信封错误:缺席臂折叠 unavailable(引擎未装配/未接线),
        // 其余 typed 码(未注册 vua.project.project_not_found / 能力缺席
        // vua.vpm.capability_missing / 受理持久化失败
        // vua.provider.persistence_failed / invalid_params)照原词 failed
        if (response.error.error.code === "vua.packages.unavailable") {
          return { kind: "unavailable" };
        }
        return { kind: "failed", code: response.error.error.code };
      }
      return { kind: "unavailable" };
    }
    if (!isApplyRemoveAccepted(response.value)) {
      return { kind: "failed", code: "packages_apply_acceptance_shape" };
    }
    const snapshot = await waitForTerminalTask(client, response.value.taskId, PACKAGES_APPLY_TASK_WAIT_MS);
    if (snapshot === null) {
      return { kind: "unavailable" };
    }
    // 冻结不变量(020):result 仅成功终态出现;rejected 守卫拒绝也在成
    // 功终态的 Done payload 内(任务诚实完成)。非成功终态 = 移除未发生
    // (failed/cancelled;恢复非终态绝不隐式续传),error.code 原词上呈,
    // 收不齐 = 诚实降级码,不猜测
    if (snapshot.state !== "succeeded" && snapshot.state !== "succeeded_with_warnings") {
      const errorCode = isRecord(snapshot.error) && typeof snapshot.error.code === "string"
        ? snapshot.error.code
        : "packages_task_not_succeeded";
      return { kind: "failed", code: errorCode };
    }
    const payload = isRecord(snapshot.result) ? snapshot.result : null;
    const body = payload === null ? null : isRecord(payload.result) ? payload.result : null;
    if (body === null) {
      return { kind: "failed", code: "packages_apply_result_shape" };
    }
    if (body.kind === "receipt" && isPackagesRemoveReceiptResult(body)) {
      return { kind: "ok", receipt: body as unknown as PackagesRemoveReceiptV01 };
    }
    if (body.kind === "rejected" && isPackagesRemoveRejectedResult(body)) {
      return { kind: "rejected", rejection: body as unknown as PackagesRemoveRejectedV01 };
    }
    return { kind: "failed", code: "packages_apply_result_shape" };
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
          changes: capabilityRows.changes,
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
        changes: capabilityRows.changes,
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
    async previewRemove(projectPath, packageIds) {
      const outcome = await previewRemoveRaw(projectPath, packageIds);
      return outcome.kind === "ok"
        ? { kind: "ok", plan: outcome.result }
        : outcome;
    },
    applyRemove: applyRemoveRaw,
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
