import io

p = "src/mock-provider.ts"
s = io.open(p, encoding="utf-8").read()

# 1. 导入 ApplicationSuccessValueV01
old = '  type TaskSnapshotV01,'
new = '  type ApplicationSuccessValueV01,\n  type TaskSnapshotV01,'
assert old in s
s = s.replace(old, new, 1)

# 2. acceptProductionTask 私有方法(任务创建 + accepted 事件;插在 #startDemoTask 前)
anchor = "  #startDemoTask("
method = """  /**
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

"""
idx = s.index(anchor)
s = s[:idx] + method + s[idx:]

# 3. production #success 值断言(startInspection/recover 的 task 对象)
old = """    this.#productionRecords.set(request.commandId, { taskId, result: task });
    return this.#success(request, task);"""
new = """    this.#productionRecords.set(request.commandId, { taskId, result: task });
    return this.#success(request, task as unknown as ApplicationSuccessValueV01);"""
assert old in s
s = s.replace(old, new)

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("mock types and task creation fixed")
