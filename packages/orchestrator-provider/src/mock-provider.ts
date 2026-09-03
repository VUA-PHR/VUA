import {
  APPLICATION_CONTRACT_VERSION,
  isTerminalTaskStateV01,
  type AppErrorV01,
  type ApplicationEventV01,
  type ApplicationRequestV01,
  type ApplicationResponseV01,
  type CapabilityOperationV01,
  type TaskCancellationResultV01,
  type TaskSnapshotV01,
  type TaskStateV01,
} from "@vua/contracts";
import type {
  BlockingTaskV01,
  ContinueShutdownRequestV01,
  OrchestratorProviderV01,
  ProviderEventListenerV01,
  ProviderHandshakeV01,
  ProviderShutdownResultV01,
  ProviderStatusV01,
  ProviderUnsubscribe,
} from "./provider.js";

export interface MockProviderOptionsV01 {
  readonly providerBuildId?: string;
  readonly providerInstanceId?: string;
  readonly now?: () => string;
  readonly capabilities?: readonly CapabilityOperationV01[];
  readonly tasks?: readonly TaskSnapshotV01[];
  readonly mutatingTaskIds?: readonly string[];
}

export class MockOrchestratorProviderV01 implements OrchestratorProviderV01 {
  readonly contractVersion = APPLICATION_CONTRACT_VERSION;

  readonly #providerBuildId: string;
  readonly #providerInstanceId: string;
  readonly #now: () => string;
  readonly #tasks = new Map<string, TaskSnapshotV01>();
  readonly #mutatingTaskIds = new Set<string>();
  readonly #listeners = new Set<ProviderEventListenerV01>();
  readonly #commandResults = new Map<string, { taskId: string; result: TaskCancellationResultV01 }>();
  readonly #capabilities: readonly CapabilityOperationV01[];
  #state: ProviderStatusV01["state"] = "stopped";
  #acceptingCalls = false;
  #applicationRevision = 1;
  #eventSequence = 0;

  constructor(options: MockProviderOptionsV01 = {}) {
    this.#providerBuildId = options.providerBuildId ?? "mock-provider-build";
    this.#providerInstanceId = options.providerInstanceId ?? "mock-provider-instance";
    this.#now = options.now ?? (() => "2026-09-02T00:00:00.000Z");
    this.#capabilities = [...(options.capabilities ?? [])].sort((left, right) =>
      left.operationId.localeCompare(right.operationId));
    for (const task of options.tasks ?? []) this.#tasks.set(task.taskId, task);
    for (const taskId of options.mutatingTaskIds ?? []) this.#mutatingTaskIds.add(taskId);
  }

  status(): ProviderStatusV01 {
    return {
      contractVersion: this.contractVersion,
      state: this.#state,
      acceptingCalls: this.#acceptingCalls,
    };
  }

  async start(): Promise<ProviderHandshakeV01> {
    if (this.#state === "stopping") throw new Error("provider is stopping");
    this.#state = "starting";
    this.#acceptingCalls = true;
    this.#state = "ready";
    return {
      contractVersion: this.contractVersion,
      supportedContractVersions: [this.contractVersion],
      providerBuildId: this.#providerBuildId,
      providerInstanceId: this.#providerInstanceId,
    };
  }

  async invoke(request: ApplicationRequestV01): Promise<ApplicationResponseV01> {
    if (!this.#acceptingCalls || this.#state !== "ready") {
      return this.#failure(request, this.#error(
        "vua.provider.not_accepting",
        "unavailable",
        "errors.provider.notAccepting",
        request.correlationId,
        true,
        true,
      ));
    }

    switch (request.method) {
      case "application.getSnapshot":
        return this.#success(request, {
          contractVersion: this.contractVersion,
          revision: this.#applicationRevision,
          capabilities: {
            revision: this.#applicationRevision,
            operations: this.#capabilities,
          },
        });
      case "task.list":
        return this.#success(request, {
          contractVersion: this.contractVersion,
          revision: this.#applicationRevision,
          tasks: this.#orderedTasks(),
        });
      case "task.get": {
        const task = this.#tasks.get(request.params.taskId);
        return task === undefined
          ? this.#failure(request, this.#error(
              "vua.task.not_found",
              "validation",
              "errors.task.notFound",
              request.correlationId,
              false,
              false,
            ))
          : this.#success(request, task);
      }
      case "task.requestCancellation":
        return this.#requestCancellation(request);
    }
  }

  subscribe(listener: ProviderEventListenerV01): ProviderUnsubscribe {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async prepareShutdown(request: { readonly timeoutMs: number }): Promise<ProviderShutdownResultV01> {
    this.#requireTimeout(request.timeoutMs);
    this.#acceptingCalls = false;
    this.#state = "stopping";
    return this.#shutdownReadiness();
  }

  async continueShutdown(request: ContinueShutdownRequestV01): Promise<ProviderShutdownResultV01> {
    if (this.#state !== "stopping") throw new Error("shutdown was not prepared");
    if (request.decision === "wait") {
      this.#requireTimeout(request.timeoutMs);
      return this.#shutdownReadiness();
    }
    if (request.userDecisionId.trim().length === 0) {
      throw new Error("force shutdown requires a user decision id");
    }
    const interruptedTasks = this.#blockingTasks();
    this.#state = "stopped";
    return {
      contractVersion: this.contractVersion,
      outcome: "forced",
      userDecisionId: request.userDecisionId,
      interruptedTasks,
    };
  }

  commitTaskState(taskId: string, state: TaskStateV01): void {
    const task = this.#tasks.get(taskId);
    if (task === undefined) throw new Error(`unknown mock task: ${taskId}`);
    if (isTerminalTaskStateV01(task.state)) throw new Error(`mock task is already terminal: ${taskId}`);
    const next: TaskSnapshotV01 = {
      ...task,
      revision: task.revision + 1,
      state,
      updatedAt: this.#now(),
    };
    this.#tasks.set(taskId, next);
    this.#applicationRevision += 1;
    this.#emit({
      contractVersion: this.contractVersion,
      eventId: this.#nextEventId(),
      taskId,
      revision: next.revision,
      occurredAt: next.updatedAt,
      correlationId: next.correlationId,
      kind: isTerminalTaskStateV01(state) ? "task.completed" : "task.stateChanged",
      state,
      payload: {},
    });
  }

  #requestCancellation(
    request: Extract<ApplicationRequestV01, { method: "task.requestCancellation" }>,
  ): ApplicationResponseV01 {
    const replay = this.#commandResults.get(request.commandId);
    if (replay !== undefined) {
      if (replay.taskId !== request.params.taskId) {
        return this.#failure(request, this.#error(
          "vua.command.id_conflict",
          "conflict",
          "errors.command.idConflict",
          request.correlationId,
          true,
          false,
        ));
      }
      return this.#success(request, replay.result);
    }

    const task = this.#tasks.get(request.params.taskId);
    if (task === undefined) {
      return this.#failure(request, this.#error(
        "vua.task.not_found",
        "validation",
        "errors.task.notFound",
        request.correlationId,
        false,
        false,
      ));
    }

    if (isTerminalTaskStateV01(task.state)) {
      const result = this.#cancellationResult(task, "already_terminal");
      this.#commandResults.set(request.commandId, { taskId: task.taskId, result });
      return this.#success(request, result);
    }

    if (task.cancellationRequested) {
      const result = this.#cancellationResult(task, "already_requested");
      this.#commandResults.set(request.commandId, { taskId: task.taskId, result });
      return this.#success(request, result);
    }

    const next: TaskSnapshotV01 = {
      ...task,
      revision: task.revision + 1,
      cancellationRequested: true,
      updatedAt: this.#now(),
    };
    this.#tasks.set(next.taskId, next);
    this.#applicationRevision += 1;
    const result = this.#cancellationResult(next, "requested");
    this.#commandResults.set(request.commandId, { taskId: next.taskId, result });
    this.#emit({
      contractVersion: this.contractVersion,
      eventId: this.#nextEventId(),
      taskId: next.taskId,
      revision: next.revision,
      occurredAt: next.updatedAt,
      correlationId: next.correlationId,
      kind: "task.cancellationRequested",
      state: next.state,
      payload: {
        commandId: request.commandId,
        ...(request.params.observedRevision === undefined
          ? {}
          : { observedRevision: request.params.observedRevision }),
      },
    });
    return this.#success(request, result);
  }

  #cancellationResult(task: TaskSnapshotV01, outcome: TaskCancellationResultV01["outcome"]): TaskCancellationResultV01 {
    return {
      contractVersion: this.contractVersion,
      taskId: task.taskId,
      revision: task.revision,
      state: task.state,
      outcome,
    };
  }

  #orderedTasks(): readonly TaskSnapshotV01[] {
    return [...this.#tasks.values()].sort((left, right) => left.taskId.localeCompare(right.taskId));
  }

  #blockingTasks(): readonly BlockingTaskV01[] {
    return this.#orderedTasks()
      .filter((task) => this.#mutatingTaskIds.has(task.taskId) && !isTerminalTaskStateV01(task.state))
      .map((task) => ({ taskId: task.taskId, revision: task.revision, state: task.state }));
  }

  #shutdownReadiness(): ProviderShutdownResultV01 {
    const blockingTasks = this.#blockingTasks();
    if (blockingTasks.length > 0) {
      return {
        contractVersion: this.contractVersion,
        outcome: "needs_user_choice",
        blockingTasks,
      };
    }
    this.#state = "stopped";
    return {
      contractVersion: this.contractVersion,
      outcome: "safe_to_stop",
      blockingTasks: [],
    };
  }

  #requireTimeout(timeoutMs: number): void {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error("shutdown timeout must be a positive integer");
    }
  }

  #nextEventId(): string {
    this.#eventSequence += 1;
    return `mock-event-${this.#eventSequence}`;
  }

  #emit(event: ApplicationEventV01): void {
    for (const listener of this.#listeners) listener(event);
  }

  #success(
    request: ApplicationRequestV01,
    value: Extract<ApplicationResponseV01, { ok: true }>["value"],
  ): ApplicationResponseV01 {
    return {
      contractVersion: this.contractVersion,
      requestId: request.requestId,
      ok: true,
      value,
    };
  }

  #failure(request: ApplicationRequestV01, error: AppErrorV01): ApplicationResponseV01 {
    return {
      contractVersion: this.contractVersion,
      requestId: request.requestId,
      ok: false,
      error,
    };
  }

  #error(
    code: string,
    category: AppErrorV01["category"],
    messageKey: string,
    correlationId: string,
    recoverable: boolean,
    retryable: boolean,
  ): AppErrorV01 {
    return {
      contractVersion: this.contractVersion,
      code,
      category,
      messageKey,
      recoverable,
      retryable,
      correlationId,
    };
  }
}
