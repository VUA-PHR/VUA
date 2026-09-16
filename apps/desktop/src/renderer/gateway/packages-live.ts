/**
 * Packages 读面 live 端口(024 P1 中间诚实态消费批,2026-09-17):经
 * Desktop Gateway 消费 packages-query v0.1 冻结词面(单方法只读
 * packages.listInstalled)。消费纪律:
 * - 诚实缺席:引擎未装配/实现域未接线(vua.packages.unavailable)映射为
 *   not-connected 形态,绝不以空清单伪装(空态即终态);
 * - typed 失败照原词呈现:复用码 vua.project.project_not_found(选中项目
 *   已从 013 注册面消失)与合法空数组严格区分——失败不冒充空态
 *   (诚实纪律 2);
 * - 区块可用性标注权威事实源 = served_capabilities 的 packages.query
 *   能力行(app.snapshot operations);available = 已安装区块可渲染,
 *   repos/变更面 P1 无词表行即诚实不可渲染(ready-p1 blocks 类型级恒
 *   false),不显示不可用入口;
 * - 响应窄化按三键纪律:schemaVersion==="0.1" + operation ===
 *   "packages.listInstalled" + result(本体 schemaVersion
 *   "vua.packages-installed/v0.1")组合定位,零字段猜测,形状不符诚实
 *   失败;包行只认冻结三键 packageId/version/dependencies,升序为
 *   服务端冻结事实,客户端不重排不猜测。
 */
import type { PackagesListInstalledRequestV1 } from "@vua/contracts";
import type { GatewayClient } from "./gateway-client.ts";
import type {
  InstalledPackageRowV01,
  PackagesPort,
  PackagesView,
} from "./packages-port.ts";
import type { CapabilityReport, Unsubscribe } from "./types.ts";

const PACKAGES_OPERATION_ID = "packages.query";

/** wire 成功帧三键包裹:schemaVersion(信封 "0.1")+ operation + result */
interface PackagesWireEnvelope {
  readonly schemaVersion: unknown;
  readonly operation: unknown;
  readonly result: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function isPackagesWireEnvelope(value: unknown): value is PackagesWireEnvelope {
  return isRecord(value)
    && value.schemaVersion === "0.1"
    && value.operation === "packages.listInstalled"
    && isRecord(value.result);
}

/** result 本体:schemaVersion 族常量 + projectPath + packages 行数组 */
function isPackagesInstalledResult(value: Record<string, unknown>): boolean {
  if (value.schemaVersion !== "vua.packages-installed/v0.1") return false;
  if (typeof value.projectPath !== "string" || value.projectPath.length === 0) return false;
  return Array.isArray(value.packages) && value.packages.every(isInstalledPackageRow);
}

export function createLivePackages(client: GatewayClient): PackagesPort {
  /** packages.query 能力行可用性:区块标注的权威事实源 */
  const queryAvailability = async (): Promise<boolean> => {
    const result = await client.invoke({
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "app.snapshot",
      params: {},
    });
    if (!result.ok || !isRecord(result.value)) return false;
    const capabilities = result.value.capabilities;
    if (!isRecord(capabilities) || !Array.isArray(capabilities.operations)) return false;
    return capabilities.operations.some(
      (operation) =>
        isRecord(operation)
        && operation.operationId === PACKAGES_OPERATION_ID
        && operation.availability === "available",
    );
  };

  const listInstalledRaw = async (
    projectPath: string,
  ): Promise<
    | { readonly kind: "ok"; readonly result: readonly InstalledPackageRowV01[] }
    | { readonly kind: "failed"; readonly code: string }
    | { readonly kind: "unavailable" }
  > => {
    const request: PackagesListInstalledRequestV1 = {
      schemaVersion: 1,
      requestId: crypto.randomUUID(),
      method: "packages.listInstalled",
      params: { projectPath },
    };
    const result = await client.invoke(request);
    if (!result.ok) {
      if (result.error.kind === "application") {
        // 缺席臂(vua.packages.unavailable)= 引擎未装配,诚实 unavailable;
        // 其余 typed 码(project_not_found 复用码/capability_missing/
        // project_load_failed)照原词上呈,不折叠为空态
        if (result.error.error.code === "vua.packages.unavailable") {
          return { kind: "unavailable" };
        }
        return { kind: "failed", code: result.error.error.code };
      }
      return { kind: "unavailable" };
    }
    if (!isPackagesWireEnvelope(result.value)) {
      return { kind: "failed", code: "packages_shape_violation" };
    }
    const resultBody = result.value.result;
    if (!isPackagesInstalledResult(resultBody)) {
      return { kind: "failed", code: "packages_shape_violation" };
    }
    return { kind: "ok", result: resultBody.packages as readonly InstalledPackageRowV01[] };
  };

  // P1 无事件推送源:快照按需聚合(选中项目变化或 capability.changed 驱动
  // 重取),订阅仅作能力行翻转的通知通道
  let selectedProjectPath: string | null = null;

  const fetchView = async (): Promise<PackagesView> => {
    const available = await queryAvailability();
    if (!available) return { schemaVersion: 1, kind: "not-connected" };
    if (selectedProjectPath === null) {
      return {
        schemaVersion: 1,
        kind: "ready-p1",
        blocks: { installed: true, repos: false, changes: false },
        projectPath: null,
        installedPackages: [],
      };
    }
    const outcome = await listInstalledRaw(selectedProjectPath);
    if (outcome.kind === "unavailable") {
      return { schemaVersion: 1, kind: "not-connected" };
    }
    return {
      schemaVersion: 1,
      kind: "ready-p1",
      blocks: { installed: true, repos: false, changes: false },
      projectPath: selectedProjectPath,
      installedPackages: outcome.kind === "ok" ? outcome.result : [],
      ...(outcome.kind === "failed" ? { loadError: { code: outcome.code } } : {}),
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
      // P1 视图的项目身份 = 013 注册路径;能力行不可用时保持 not-connected
      if (await queryAvailability()) {
        selectedProjectPath = projectPath;
        broadcast();
      }
      return fetchView();
    },
    listInstalled: listInstalledRaw,
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
      return (await queryAvailability())
        ? { state: "ready" }
        : { state: "unavailable", detailKey: "packagesEngineMissing" };
    },
  };
}
