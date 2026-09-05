import {
  type DemoTaskStartedV01,
  type EnvironmentSnapshotV01,
  APPLICATION_CONTRACT_VERSION,
  isTerminalTaskStateV01,
  type AppErrorV01,
  type ApplicationContractVersion,
  type ApplicationEventV01,
  type ApplicationRequestV01,
  type ApplicationResponseV01,
  type CapabilityOperationV01,
  type TaskCancellationResultV01,
  type ApplicationSuccessValueV01,
  type TaskSnapshotV01,
  type TaskRecoveryDispositionV01,
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
  readonly environment?: EnvironmentSnapshotV01;
}

/**
 * production 命令成功值(与 B 线 provider_host 同形:{ contractVersion, task };
 * 与 DemoTaskStartedV01 同一包装纪律)。文档查询(getInspection / getPlan /
 * getBuildRecord)按 get_task_payload 形状返回 { contractVersion, taskId,
 * state, inspection?/plan?/buildRecord?: 负载 | null }。
 */
export interface ProductionTaskStartedV01 {
  readonly contractVersion: ApplicationContractVersion;
  readonly task: TaskSnapshotV01;
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
  readonly #demoCommandResults = new Map<string, DemoTaskStartedV01>();
  #productionSequence = 0;
  /** commandId → 已创建任务 id(幂等重放依据) */
  #productionCommands = new Map<string, string>();
  /** 检查文档(inspect 任务 id → 负载):冻结词表(production-use-case v0.1,
   *  B 侧采纳渲染层词表)的合成 InspectionReport 形状 */
  #inspectionDocs = new Map<string, Record<string, unknown>>();
  /** 计划文档(plan 任务 id → 负载) */
  #planDocs = new Map<string, Record<string, unknown>>();
  /** 构建记录(plan 任务 id → 负载):合成记录随计划就位;真实写入属执行器 */
  #buildRecords = new Map<string, Record<string, unknown>>();
  readonly #capabilities: readonly CapabilityOperationV01[];
  readonly #environment: EnvironmentSnapshotV01 | undefined;
  #demoTaskSequence = 0;
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
    this.#environment = options.environment;
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
      case "environment.getSnapshot":
        return this.#success(request, this.#environment ?? {
          contractVersion: this.contractVersion,
          revision: this.#applicationRevision,
          capturedAt: this.#now(),
          items: [],
        });
      case "task.startDemo":
        return this.#startDemoTask(request);
      case "production.startInspection":
        return this.#startProductionInspection(request);
      case "production.getInspection":
        return this.#getProductionTaskPayload(request, "inspection");
      case "production.requestPlan":
        return this.#requestProductionPlan(request);
      case "production.getPlan":
        return this.#getProductionTaskPayload(request, "plan");
      case "production.confirmPlan":
        return this.#confirmProductionPlan(request);
      case "production.recover":
        return this.#confirmProductionPlan(request);
      case "production.getBuildRecord":
        return this.#getProductionBuildRecord(request);
      // bdl-queries v0.2 只读面:模拟 Provider 无本地 BDL 存储,按协议
      // "空态即终态"如实回空集/未知健康;未知引用明确拒绝
      case "catalog.list":
        return this.#success(request, { total: 0, entries: [] });
      case "catalog.detail":
        return this.#failure(request, this.#error(
          "vua.catalog.not_found",
          "validation",
          "errors.catalog.notFound",
          request.correlationId,
          false,
          false,
        ));
      case "catalog.status":
        return this.#success(request, {
          health: "unknown",
          revision: { catalogUpdatedSeq: null, datasetRevision: "0.1" },
        });
      case "warehouse.listEntries":
        return this.#success(request, { entries: [] });
      case "warehouse.entryDetail":
        return this.#failure(request, this.#error(
          "vua.warehouse.not_found",
          "validation",
          "errors.warehouse.notFound",
          request.correlationId,
          false,
          false,
        ));
      case "download.ingest":
      case "download.retry":
        // 模拟 Provider 未配置下载域:诚实不可用(同 production.* 纪律)
        return this.#failure(request, this.#error(
          "vua.download.unavailable",
          "unavailable",
          "errors.download.unavailable",
          request.correlationId,
          true,
          false,
        ));
    }
  }

  /**
   * 演示任务(契约 F2):与真实任务完全相同的九态、事件、取消与关闭语义;
   * 进度由测试经 commitTaskState 驱动,不依赖真实定时器。capability
   * `demo.task` 不可用时命令被拒绝(诚实不可用,而非静默成功)。
   */
  /**
   * 生产命令任务创建(幂等):queued 状态入栈 + accepted 事件;
   * 与 demo 任务同一套任务机制,进度由调用方驱动到终态。
   */
  #acceptProductionTask(
    commandKind: string,
    commandId: string,
    taskId: string,
    correlationId: string,
  ): TaskSnapshotV01 {
    const task: TaskSnapshotV01 = {
      contractVersion: this.contractVersion,
      taskId,
      revision: 1,
      correlationId,
      state: "queued",
      cancellationRequested: false,
      recoveryDisposition: "none",
      updatedAt: this.#now(),
    };
    this.#tasks.set(taskId, task);
    this.#mutatingTaskIds.add(taskId);
    this.#applicationRevision += 1;
    this.#emit({
      contractVersion: this.contractVersion,
      eventId: this.#nextEventId(),
      taskId,
      revision: task.revision,
      occurredAt: task.updatedAt,
      correlationId,
      kind: "task.accepted",
      state: task.state,
      payload: {},
    });
    return task;
  }

  #startDemoTask(
    request: Extract<ApplicationRequestV01, { method: "task.startDemo" }>,
  ): ApplicationResponseV01 {
    const demoAvailable = this.#capabilities.some(
      (operation) => operation.operationId === "demo.task" && operation.availability === "available",
    );
    if (!demoAvailable) {
      return this.#failure(request, this.#error(
        "vua.demo.unavailable",
        "unavailable",
        "errors.demo.unavailable",
        request.correlationId,
        true,
        false,
      ));
    }

    const replay = this.#demoCommandResults.get(request.commandId);
    if (replay !== undefined) {
      const task = this.#tasks.get(replay.task.taskId);
      return this.#success(request, {
        contractVersion: this.contractVersion,
        task: task ?? replay.task,
      });
    }

    this.#demoTaskSequence += 1;
    const task: TaskSnapshotV01 = {
      contractVersion: this.contractVersion,
      taskId: `demo-${this.#demoTaskSequence}`,
      revision: 1,
      correlationId: request.correlationId,
      state: "queued",
      cancellationRequested: false,
      recoveryDisposition: "none",
      updatedAt: this.#now(),
    };
    this.#tasks.set(task.taskId, task);
    this.#mutatingTaskIds.add(task.taskId);
    this.#applicationRevision += 1;
    const started: DemoTaskStartedV01 = {
      contractVersion: this.contractVersion,
      task,
    };
    this.#demoCommandResults.set(request.commandId, started);
    this.#emit({
      contractVersion: this.contractVersion,
      eventId: this.#nextEventId(),
      taskId: task.taskId,
      revision: task.revision,
      occurredAt: task.updatedAt,
      correlationId: task.correlationId,
      kind: "task.accepted",
      state: task.state,
      payload: {},
    });
    return this.#success(request, started);
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

  /**
   * 测试驱动任务状态迁移(五种生产生命周期呈现的脚本化入口)。
   * patch 允许脚本化恢复事实:漂移场景 = failed + inspect_required
   * (渲染层投影 failed_recoverable);错误负载随 task.completed 事件携带。
   */
  commitTaskState(
    taskId: string,
    state: TaskStateV01,
    patch: {
      readonly recoveryDisposition?: TaskRecoveryDispositionV01;
      readonly error?: AppErrorV01;
    } = {},
  ): void {
    const task = this.#tasks.get(taskId);
    if (task === undefined) throw new Error(`unknown mock task: ${taskId}`);
    if (isTerminalTaskStateV01(task.state)) throw new Error(`mock task is already terminal: ${taskId}`);
    const next: TaskSnapshotV01 = {
      ...task,
      revision: task.revision + 1,
      state,
      ...(patch.recoveryDisposition !== undefined
        ? { recoveryDisposition: patch.recoveryDisposition }
        : {}),
      ...(patch.error !== undefined ? { error: patch.error } : {}),
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

  #productionUnavailable(request: Extract<ApplicationRequestV01, { method: `production.${string}` }>): ApplicationResponseV01 | null {
    const productionAvailable = this.#capabilities.some(
      (operation) => operation.operationId === "production.useCase" && operation.availability === "available",
    );
    if (productionAvailable) return null;
    return this.#failure(request, this.#error(
      "vua.production.unavailable",
      "unavailable",
      "errors.production.unavailable",
      request.correlationId,
      true,
      false,
    ));
  }

  /** 幂等重放:同一 commandId 返回当前任务快照的包装值(回执纪律) */
  #replayOrUndefined(
    request: Extract<ApplicationRequestV01, { method: "production.startInspection" | "production.requestPlan" | "production.confirmPlan" | "production.recover" }>,
  ): ApplicationResponseV01 | null {
    const taskId = this.#productionCommands.get(request.commandId);
    if (taskId === undefined) return null;
    const task = this.#tasks.get(taskId);
    if (task === undefined) return null;
    return this.#success(request, {
      contractVersion: this.contractVersion,
      task,
    } satisfies ProductionTaskStartedV01 as unknown as ApplicationSuccessValueV01);
  }

  #startProductionInspection(
    request: Extract<ApplicationRequestV01, { method: "production.startInspection" }>,
  ): ApplicationResponseV01 {
    const unavailable = this.#productionUnavailable(request);
    if (unavailable !== null) return unavailable;
    const replay = this.#replayOrUndefined(request);
    if (replay !== null) return replay;

    this.#productionSequence += 1;
    const taskId = `production-${this.#productionSequence}`;
    // 合成检查负载:冻结词表(plannability / findings 带 recoverable、retryable);
    // source 由渲染层以自己提交的 MaterialRef 呈现,文档不回带
    this.#inspectionDocs.set(taskId, {
      inspectionId: taskId,
      findings: [],
      plannability: "plannable",
      inspectedAt: this.#now(),
    });
    const task = this.#acceptProductionTask(
      "production.startInspection",
      request.commandId,
      taskId,
      request.correlationId,
    );
    this.#productionCommands.set(request.commandId, taskId);
    return this.#success(request, {
      contractVersion: this.contractVersion,
      task,
    } satisfies ProductionTaskStartedV01 as unknown as ApplicationSuccessValueV01);
  }

  /** get_task_payload 形状(B 线同形):任务存在即回任务态,负载可为 null(未就绪) */
  #getProductionTaskPayload(
    request: Extract<ApplicationRequestV01, { method: "production.getInspection" | "production.getPlan" }>,
    kind: "inspection" | "plan",
  ): ApplicationResponseV01 {
    const ref =
      kind === "inspection"
        ? (request.params as { inspectionId?: string }).inspectionId
        : (request.params as { planId?: string }).planId;
    const task = this.#tasks.get(ref ?? "");
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
    const document =
      kind === "inspection" ? this.#inspectionDocs.get(ref!) : this.#planDocs.get(ref!);
    return this.#success(request, {
      contractVersion: this.contractVersion,
      taskId: task.taskId,
      state: task.state,
      [kind]: document ?? null,
    } as unknown as ApplicationSuccessValueV01);
  }

  #requestProductionPlan(
    request: Extract<ApplicationRequestV01, { method: "production.requestPlan" }>,
  ): ApplicationResponseV01 {
    const unavailable = this.#productionUnavailable(request);
    if (unavailable !== null) return unavailable;
    const replay = this.#replayOrUndefined(request);
    if (replay !== null) return replay;

    this.#productionSequence += 1;
    const taskId = `production-plan-${this.#productionSequence}`;
    // 合成计划负载:阶段词表与 production-use-case v0.1 阶段映射一致;
    // 确认绑定 revision(确认纪律),预估时长为合成事实
    this.#planDocs.set(taskId, {
      planId: taskId,
      revision: 1,
      inspectionId: request.params.inspectionId,
      stages: [
        { id: `${taskId}-snapshot`, stage: "snapshot", summary: "合成阶段:快照(模拟 Provider)" },
        { id: `${taskId}-execute`, stage: "execute", summary: "合成阶段:导入(模拟 Provider)" },
        { id: `${taskId}-validate`, stage: "validate", summary: "合成阶段:验证(模拟 Provider)" },
      ],
      risks: [],
      estimatedDurationMs: 30_000,
      diffs: [],
    });
    // 合成构建记录随计划就位(planId 派生 recordId,B 线 material- 前缀同形)
    this.#buildRecords.set(taskId, {
      recordId: `material-${taskId}`,
      status: "succeeded",
      restoreAttempted: false,
      stages: ["snapshot", "execute", "validate"],
      facts: {
        snapshot: "合成快照证据(模拟 Provider)",
        bridgeJob: "合成 Bridge 作业序列化占位(模拟 Provider)",
        localVpm: "合成本地 VPM 证据(模拟 Provider)",
        validation: "合成验证证据(模拟 Provider)",
      },
      finishedAt: this.#now(),
    });
    const task = this.#acceptProductionTask(
      "production.requestPlan",
      request.commandId,
      taskId,
      request.correlationId,
    );
    this.#productionCommands.set(request.commandId, taskId);
    return this.#success(request, {
      contractVersion: this.contractVersion,
      task,
    } satisfies ProductionTaskStartedV01 as unknown as ApplicationSuccessValueV01);
  }

  #confirmProductionPlan(
    request: Extract<ApplicationRequestV01, { method: "production.confirmPlan" | "production.recover" }>,
  ): ApplicationResponseV01 {
    const unavailable = this.#productionUnavailable(request);
    if (unavailable !== null) return unavailable;
    const replay = this.#replayOrUndefined(request);
    if (replay !== null) return replay;

    if (request.method === "production.confirmPlan") {
      // 确认纪律:确认绑定计划 revision,过期确认在被接受前拒绝(不产生半个任务)
      const planId = request.params.planId;
      const plan = this.#planDocs.get(planId);
      if (plan === undefined) {
        return this.#failure(request, this.#error(
          "vua.task.not_found",
          "validation",
          "errors.task.notFound",
          request.correlationId,
          false,
          false,
        ));
      }
      const observedRevision = request.params.observedRevision;
      if (observedRevision !== undefined && plan["revision"] !== observedRevision) {
        return this.#failure(request, this.#error(
          "vua.production.plan_mismatch",
          "validation",
          "errors.production.planMismatch",
          request.correlationId,
          false,
          false,
        ));
      }
    } else {
      // 恢复绑定原始失败任务:引用不存在明确拒绝(not_found),
      // 存在但未处于 failed / cancelled 终态则不可恢复(B 线同形)
      const original = this.#tasks.get(request.params.taskId);
      if (original === undefined) {
        return this.#failure(request, this.#error(
          "vua.task.not_found",
          "validation",
          "errors.task.notFound",
          request.correlationId,
          false,
          false,
        ));
      }
      if (!(original.state === "failed" || original.state === "cancelled")) {
        return this.#failure(request, this.#error(
          "vua.production.not_recoverable",
          "validation",
          "errors.production.notRecoverable",
          request.correlationId,
          false,
          false,
        ));
      }
    }

    this.#productionSequence += 1;
    const taskId = `production-confirm-${this.#productionSequence}`;
    const task = this.#acceptProductionTask(
      request.method,
      request.commandId,
      taskId,
      request.correlationId,
    );
    this.#productionCommands.set(request.commandId, taskId);
    return this.#success(request, {
      contractVersion: this.contractVersion,
      task,
    } satisfies ProductionTaskStartedV01 as unknown as ApplicationSuccessValueV01);
  }

  #getProductionBuildRecord(
    request: Extract<ApplicationRequestV01, { method: "production.getBuildRecord" }>,
  ): ApplicationResponseV01 {
    const ref = request.params.buildRecordId;
    const record = this.#buildRecords.get(ref) ?? this.#buildRecords.get(`material-${ref}`);
    if (record === undefined) {
      return this.#failure(request, this.#error(
        "vua.task.not_found",
        "validation",
        "errors.task.notFound",
        request.correlationId,
        false,
        false,
      ));
    }
    return this.#success(request, {
      contractVersion: this.contractVersion,
      buildRecord: record,
    } as unknown as ApplicationSuccessValueV01);
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
