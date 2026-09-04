import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { APPLICATION_CONTRACT_VERSION, type ApplicationEventV01 } from "@vua/contracts";
import { SupervisedProcessProviderV01 } from "./supervised-process-provider.js";

/**
 * TS↔Rust 端到端(M2 整合):对本仓库构建的真实 vua-orchestrator-provider
 * 二进制跑完整帧协议——握手、能力表、演示任务全链路、取消、安全关闭。
 * 二进制缺失(未跑 cargo build)时整组跳过;CI/M2 构建链负责产出它。
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const suffix = process.platform === "win32" ? ".exe" : "";
const binaryPath = path.resolve(here, "../../../target/release/vua-orchestrator-provider" + suffix);
const binaryExists = existsSync(binaryPath);

const databasePath = path.resolve(here, "../../../target/vua-e2e-provider.db");
const d = binaryExists ? describe : describe.skip;

d("supervised provider against the real vua-orchestrator-provider binary", () => {
  it("walks handshake, capabilities, the demo task lifecycle and a safe shutdown", async () => {
    // 独立库:重置状态,保证断言基于确定的任务序列
    rmSync(databasePath, { force: true });
    const provider = new SupervisedProcessProviderV01({
      executablePath: binaryPath,
      databasePath,
      handshakeTimeoutMs: 15_000,
    });
    const events: ApplicationEventV01[] = [];
    provider.subscribe((event) => events.push(event));

    // 握手:真实进程,providerBuildId = Cargo 包版本
    const handshake = await provider.start();
    expect(handshake.contractVersion).toBe(APPLICATION_CONTRACT_VERSION);
    expect(handshake.supportedContractVersions).toContain(APPLICATION_CONTRACT_VERSION);
    expect(handshake.providerInstanceId).not.toBe("");

    // 能力表:宿主如实登记它所服务的操作
    const snapshot = await provider.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "e2e-snapshot",
      correlationId: "e2e-snapshot",
      kind: "query",
      method: "application.getSnapshot",
      params: {},
    });
    expect(snapshot.ok).toBe(true);
    if (snapshot.ok && "capabilities" in snapshot.value) {
      const operationIds = snapshot.value.capabilities.operations.map((op) => op.operationId);
      expect(operationIds).toContain("task.list");
      expect(operationIds).toContain("demo.task");
    } else {
      throw new Error("expected an application snapshot");
    }

    // 演示任务:接受 → (帧驱动)推进 → 取消 → 终态
    const started = await provider.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "e2e-demo",
      correlationId: "e2e-demo",
      commandId: "e2e-demo-command",
      kind: "command",
      method: "task.startDemo",
      params: {},
    });
    expect(started.ok).toBe(true);
    if (!started.ok || !("task" in started.value)) throw new Error("demo start failed");
    const taskId = started.value.task.taskId;
    expect(started.value.task.state).toBe("queued");

    const list = async () => {
      const response = await provider.invoke({
        contractVersion: APPLICATION_CONTRACT_VERSION,
        requestId: `e2e-list-${Math.random()}`,
        correlationId: "e2e-list",
        kind: "query",
        method: "task.list",
        params: {},
      });
      if (!response.ok || !("tasks" in response.value)) throw new Error("task.list failed");
      return response.value.tasks.find((task) => task.taskId === taskId)?.state;
    };
    expect(await list()).toBe("preparing");

    const cancel = await provider.invoke({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "e2e-cancel",
      correlationId: "e2e-cancel",
      commandId: "e2e-cancel-command",
      kind: "command",
      method: "task.requestCancellation",
      params: { taskId },
    });
    expect(cancel.ok).toBe(true);
    if (!cancel.ok || !("outcome" in cancel.value)) throw new Error("cancel failed");
    expect(cancel.value.outcome).toBe("requested");

    expect(await list()).toBe("cancelled");

    // 安全关闭:任务已终态,无阻塞
    const shutdown = await provider.prepareShutdown({ timeoutMs: 5_000 });
    expect(shutdown.outcome).toBe("safe_to_stop");

    // 帧驱动推进:取消帧先推进 preparing -> running(事件),再确认取消请求
    const kindsAndStates = events.map((event) =>
      event.kind === "capability.changed" ? event.kind : event.kind + ":" + event.state,
    );
    expect(kindsAndStates).toEqual([
      "task.accepted:queued",
      "task.stateChanged:preparing",
      "task.stateChanged:running",
      "task.cancellationRequested:running",
      "task.completed:cancelled",
    ]);
  }, 30_000);
});
