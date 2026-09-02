export const APPLICATION_CONTRACT_VERSION = "0.1" as const;

export type ApplicationContractVersion = typeof APPLICATION_CONTRACT_VERSION;

export type ApplicationErrorCategoryV01 =
  | "validation"
  | "conflict"
  | "permission"
  | "dependency"
  | "unavailable"
  | "timeout"
  | "cancelled"
  | "external_failure"
  | "internal";

export type ApplicationParamValueV01 = string | number | boolean;

export interface AppErrorV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly code: string;
  readonly category: ApplicationErrorCategoryV01;
  readonly messageKey: string;
  readonly params?: Readonly<Record<string, ApplicationParamValueV01>>;
  readonly recoverable: boolean;
  readonly retryable: boolean;
  readonly correlationId: string;
  readonly fieldPath?: string;
  readonly redactedContext?: Readonly<Record<string, ApplicationParamValueV01>>;
}

export type TaskStateV01 =
  | "queued"
  | "preparing"
  | "running"
  | "waiting_for_input"
  | "paused"
  | "succeeded"
  | "succeeded_with_warnings"
  | "failed"
  | "cancelled";

export const TERMINAL_TASK_STATES_V01 = [
  "succeeded",
  "succeeded_with_warnings",
  "failed",
  "cancelled",
] as const satisfies readonly TaskStateV01[];

export function isTerminalTaskStateV01(state: TaskStateV01): boolean {
  return (TERMINAL_TASK_STATES_V01 as readonly string[]).includes(state);
}

export type TaskRecoveryDispositionV01 = "none" | "inspect_required";

export type CapabilityOperationV01 =
  | {
      readonly operationId: string;
      readonly availability: "available";
    }
  | {
      readonly operationId: string;
      readonly availability: "unavailable";
      readonly reason: AppErrorV01;
    };

export interface CapabilitySnapshotV01 {
  readonly revision: number;
  readonly operations: readonly CapabilityOperationV01[];
}

export interface ApplicationSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly revision: number;
  readonly capabilities: CapabilitySnapshotV01;
}

export interface TaskSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly taskId: string;
  readonly revision: number;
  readonly correlationId: string;
  readonly state: TaskStateV01;
  readonly cancellationRequested: boolean;
  readonly recoveryDisposition: TaskRecoveryDispositionV01;
  readonly updatedAt: string;
  readonly error?: AppErrorV01;
}

interface ApplicationRequestBaseV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly requestId: string;
  readonly correlationId: string;
}

export interface ApplicationSnapshotQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "application.getSnapshot";
  readonly params: Readonly<Record<string, never>>;
}

export interface TaskListQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "task.list";
  readonly params: Readonly<Record<string, never>>;
}

export interface TaskGetQueryV01 extends ApplicationRequestBaseV01 {
  readonly kind: "query";
  readonly method: "task.get";
  readonly params: {
    readonly taskId: string;
  };
}

export interface TaskCancellationCommandV01 extends ApplicationRequestBaseV01 {
  readonly kind: "command";
  readonly method: "task.requestCancellation";
  readonly commandId: string;
  readonly params: {
    readonly taskId: string;
    readonly observedRevision?: number;
  };
}

export type ApplicationRequestV01 =
  | ApplicationSnapshotQueryV01
  | TaskListQueryV01
  | TaskGetQueryV01
  | TaskCancellationCommandV01;

export interface TaskListSnapshotV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly revision: number;
  readonly tasks: readonly TaskSnapshotV01[];
}

export type CancellationOutcomeV01 = "requested" | "already_requested" | "already_terminal";

export interface TaskCancellationResultV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly taskId: string;
  readonly revision: number;
  readonly state: TaskStateV01;
  readonly outcome: CancellationOutcomeV01;
}

export type ApplicationSuccessValueV01 =
  | ApplicationSnapshotV01
  | TaskListSnapshotV01
  | TaskSnapshotV01
  | TaskCancellationResultV01;

export type ApplicationResponseV01 =
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly requestId: string;
      readonly ok: true;
      readonly value: ApplicationSuccessValueV01;
    }
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly requestId: string;
      readonly ok: false;
      readonly error: AppErrorV01;
    };

interface TaskEventBaseV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly eventId: string;
  readonly taskId: string;
  readonly revision: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly state: TaskStateV01;
}

export type TaskEventV01 =
  | (TaskEventBaseV01 & {
      readonly kind: "task.accepted" | "task.stateChanged";
      readonly payload: Readonly<Record<string, never>>;
    })
  | (TaskEventBaseV01 & {
      readonly kind: "task.progressed";
      readonly payload: {
        readonly completed: number;
        readonly total?: number;
        readonly messageKey: string;
        readonly params?: Readonly<Record<string, ApplicationParamValueV01>>;
      };
    })
  | (TaskEventBaseV01 & {
      readonly kind: "task.cancellationRequested";
      readonly payload: {
        readonly commandId: string;
        readonly observedRevision?: number;
      };
    })
  | (TaskEventBaseV01 & {
      readonly kind: "task.completed";
      readonly payload: {
        readonly error?: AppErrorV01;
      };
    });

export interface CapabilityChangedEventV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly eventId: string;
  readonly revision: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly kind: "capability.changed";
  readonly payload: CapabilitySnapshotV01;
}

export type ApplicationEventV01 = TaskEventV01 | CapabilityChangedEventV01;

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

export function isApplicationRequestV01(value: unknown): value is ApplicationRequestV01 {
  if (!isRecord(value) || value.contractVersion !== APPLICATION_CONTRACT_VERSION) return false;
  if (!isIdentifier(value.requestId) || !isIdentifier(value.correlationId) || !isRecord(value.params)) return false;

  if (value.kind === "query" && value.method === "application.getSnapshot") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "task.list") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, []);
  }
  if (value.kind === "query" && value.method === "task.get") {
    return hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "params"])
      && hasExactKeys(value.params, ["taskId"])
      && isIdentifier(value.params.taskId);
  }
  if (value.kind === "command" && value.method === "task.requestCancellation") {
    if (!hasExactKeys(value, ["contractVersion", "requestId", "correlationId", "kind", "method", "commandId", "params"])) {
      return false;
    }
    if (!isIdentifier(value.commandId) || !isIdentifier(value.params.taskId)) return false;
    const keys = Object.keys(value.params);
    if (!keys.every((key) => key === "taskId" || key === "observedRevision") || !keys.includes("taskId")) return false;
    return value.params.observedRevision === undefined || isNonNegativeInteger(value.params.observedRevision);
  }
  return false;
}
