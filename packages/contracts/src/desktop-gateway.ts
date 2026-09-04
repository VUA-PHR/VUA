import type {
  AppErrorV01,
  ApplicationEventV01,
  ApplicationSuccessValueV01,
} from "./application-contract.js";

export const DESKTOP_GATEWAY_VERSION = 1 as const;
export const DESKTOP_GATEWAY_MAX_REQUEST_BYTES = 64 * 1024;

export interface AppSnapshotV1 {
  readonly schemaVersion: 1;
  readonly productVersion: string;
  readonly runtime: "electron";
  readonly platform: "win32" | "darwin" | "linux";
  readonly capabilities: {
    readonly gateway: true;
    readonly tasks: boolean;
    readonly remoteBrowser: boolean;
  };
}

/**
 * Gateway 方法表(v1):Renderer 可见的显式方法面。
 * 每个方法映射到 application-contract v0.1 的对应 Query/Command(见
 * docs/protocols/application-contract-v0.1);映射关系由 Kernel(gateway-router)
 * 持有,Renderer 不接触 Provider 词汇以外的语义。
 * 未知方法在守卫处明确拒绝;新增方法在此登记并同步更新守卫与测试。
 */
export interface AppSnapshotRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "app.snapshot";
  readonly params: Record<string, never>;
}

export interface GatewayTaskListRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.list";
  readonly params: Record<string, never>;
}

export interface GatewayTaskGetRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.get";
  readonly params: {
    readonly taskId: string;
  };
}

export interface GatewayTaskCancellationRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.requestCancellation";
  readonly params: {
    readonly taskId: string;
    readonly commandId: string;
    readonly observedRevision?: number;
  };
}

export interface GatewayEnvironmentSnapshotRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "environment.getSnapshot";
  readonly params: Record<string, never>;
}

export interface GatewayDemoTaskRequestV1 {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly method: "task.startDemo";
  readonly params: {
    readonly commandId: string;
  };
}

export type DesktopGatewayRequestV1 =
  | AppSnapshotRequestV1
  | GatewayTaskListRequestV1
  | GatewayTaskGetRequestV1
  | GatewayTaskCancellationRequestV1
  | GatewayEnvironmentSnapshotRequestV1
  | GatewayDemoTaskRequestV1;

/** 方法 → 应用语义:Kernel 路由用;未知方法返回 undefined */
export const DESKTOP_GATEWAY_METHOD_KINDS = {
  "app.snapshot": "query",
  "task.list": "query",
  "task.get": "query",
  "task.requestCancellation": "command",
  "environment.getSnapshot": "query",
  "task.startDemo": "command",
} as const satisfies Readonly<Record<string, "query" | "command">>;

export type DesktopGatewayMethodV1 = keyof typeof DESKTOP_GATEWAY_METHOD_KINDS;

/**
 * 各方法的成功返回值:应用契约值原样透传,外加 Kernel 派生的 app.snapshot。
 */
export type DesktopGatewaySuccessValueV1 = AppSnapshotV1 | ApplicationSuccessValueV01;

/**
 * Gateway 错误:Kernel 自身的三种失败用 code + messageKey;Provider 的应用
 * 错误原样透传(code = "application"),本地化与重试判定引用 AppErrorV01 原值。
 */
export type DesktopGatewayErrorV1 =
  | {
      readonly code: "invalid_request" | "unsupported_method" | "internal";
      readonly messageKey: string;
    }
  | {
      readonly code: "application";
      readonly application: AppErrorV01;
    };

export type DesktopGatewayResponseV1 =
  | {
      readonly schemaVersion: 1;
      readonly requestId: string;
      readonly ok: true;
      readonly value: DesktopGatewaySuccessValueV1;
    }
  | {
      readonly schemaVersion: 1;
      readonly requestId: string;
      readonly ok: false;
      readonly error: DesktopGatewayErrorV1;
    };

/** 事件订阅面:Provider 的类型化应用事件经 Kernel 广播到全部本地来源窗口 */
export interface DesktopGatewayEventsApiV1 {
  subscribe(listener: (event: ApplicationEventV01) => void): () => void;
}

export interface DesktopGatewayApiV1 {
  readonly version: 1;
  invoke(request: DesktopGatewayRequestV1): Promise<DesktopGatewayResponseV1>;
}

export interface DesktopWindowApiV1 {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
}

/**
 * 素材来源选取对话框(生产用例契约草案"双素材入口":文件选择经 Kernel 的
 * 显式对话框动作完成,Renderer 不持文件系统句柄)。Kernel 保存选取结果并
 * 只回发不透明 refId 与展示名;路径在 Kernel 侧解析后随应用请求交给 Provider。
 */
export type MaterialSourceIntakeV1 = "direct_unity_package" | "local_reusable_vpm";

export interface PickedMaterialSourceV1 {
  /** 不透明引用:Kernel 侧映射到真实路径;Renderer 只透传 */
  readonly refId: string;
  readonly displayName: string;
}

export interface DesktopDialogApiV1 {
  /** 用户取消或无宿主时返回 null */
  pickMaterialSource(intake: MaterialSourceIntakeV1): Promise<PickedMaterialSourceV1 | null>;
}

export interface VuaDesktopApiV1 {
  readonly gateway: DesktopGatewayApiV1;
  readonly events: DesktopGatewayEventsApiV1;
  readonly dialog: DesktopDialogApiV1;
  readonly window: DesktopWindowApiV1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

const REQUEST_KEYS = ["schemaVersion", "requestId", "method", "params"] as const;

export function isDesktopGatewayRequestV1(value: unknown): value is DesktopGatewayRequestV1 {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== DESKTOP_GATEWAY_VERSION) return false;
  if (typeof value.requestId !== "string" || value.requestId.length < 1 || value.requestId.length > 128) {
    return false;
  }
  if (!isRecord(value.params)) return false;

  switch (value.method) {
    case "app.snapshot":
    case "task.list":
    case "environment.getSnapshot":
      return hasExactKeys(value, REQUEST_KEYS) && hasExactKeys(value.params, []);
    case "task.get":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["taskId"])
        && isIdentifier(value.params.taskId);
    case "task.requestCancellation":
      if (!hasExactKeys(value, REQUEST_KEYS)) return false;
      if (!hasExactKeys(value.params, ["taskId", "commandId"])) {
        // observedRevision 可选:允许 { taskId, commandId, observedRevision }
        const keys = Object.keys(value.params).sort();
        if (
          keys.length !== 3
          || keys[0] !== "commandId"
          || keys[1] !== "observedRevision"
          || keys[2] !== "taskId"
        ) {
          return false;
        }
      }
      return isIdentifier(value.params.taskId)
        && isIdentifier(value.params.commandId)
        && (value.params.observedRevision === undefined || isNonNegativeInteger(value.params.observedRevision));
    case "task.startDemo":
      return hasExactKeys(value, REQUEST_KEYS)
        && hasExactKeys(value.params, ["commandId"])
        && isIdentifier(value.params.commandId);
    default:
      return false;
  }
}

export function requestByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
