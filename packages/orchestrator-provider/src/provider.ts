import type {
  ApplicationContractVersion,
  ApplicationEventV01,
  ApplicationRequestV01,
  ApplicationResponseV01,
  TaskStateV01,
} from "@vua/contracts";

export type ProviderLifecycleStateV01 = "stopped" | "starting" | "ready" | "stopping" | "failed";

export interface ProviderStatusV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly state: ProviderLifecycleStateV01;
  readonly acceptingCalls: boolean;
}

export interface ProviderHandshakeV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly supportedContractVersions: readonly ApplicationContractVersion[];
  readonly providerBuildId: string;
  readonly providerInstanceId: string;
}

export interface BlockingTaskV01 {
  readonly taskId: string;
  readonly revision: number;
  readonly state: TaskStateV01;
}

export type ProviderShutdownResultV01 =
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly outcome: "safe_to_stop";
      readonly blockingTasks: readonly [];
    }
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly outcome: "needs_user_choice";
      readonly blockingTasks: readonly BlockingTaskV01[];
    }
  | {
      readonly contractVersion: ApplicationContractVersion;
      readonly outcome: "forced";
      readonly userDecisionId: string;
      readonly interruptedTasks: readonly BlockingTaskV01[];
    };

export type ContinueShutdownRequestV01 =
  | {
      readonly decision: "wait";
      readonly timeoutMs: number;
    }
  | {
      readonly decision: "force";
      readonly userDecisionId: string;
    };

export type ProviderEventListenerV01 = (event: ApplicationEventV01) => void;
export type ProviderUnsubscribe = () => void;

export interface OrchestratorProviderV01 {
  readonly contractVersion: ApplicationContractVersion;

  status(): ProviderStatusV01;
  start(): Promise<ProviderHandshakeV01>;
  invoke(request: ApplicationRequestV01): Promise<ApplicationResponseV01>;
  subscribe(listener: ProviderEventListenerV01): ProviderUnsubscribe;
  prepareShutdown(request: { readonly timeoutMs: number }): Promise<ProviderShutdownResultV01>;
  continueShutdown(request: ContinueShutdownRequestV01): Promise<ProviderShutdownResultV01>;
}
