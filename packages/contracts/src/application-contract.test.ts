import { describe, expect, it } from "vitest";
import {
  APPLICATION_CONTRACT_VERSION,
  isApplicationRequestV01,
  isTerminalTaskStateV01,
} from "./application-contract.js";

describe("application contract v0.1", () => {
  it("accepts only the explicit B1 query and command shapes", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-1",
      correlationId: "correlation-1",
      kind: "query",
      method: "application.getSnapshot",
      params: {},
    })).toBe(true);

    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-2",
      correlationId: "correlation-2",
      commandId: "cancel-1",
      kind: "command",
      method: "task.requestCancellation",
      params: { taskId: "task-1", observedRevision: 8 },
    })).toBe(true);
  });

  it("rejects unknown versions, methods, extra authority, and mixed kinds", () => {
    const base = {
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-1",
      correlationId: "correlation-1",
      kind: "query",
      method: "task.get",
      params: { taskId: "task-1" },
    };
    expect(isApplicationRequestV01({ ...base, contractVersion: "1.0" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, method: "shell.execute" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, executable: "powershell.exe" })).toBe(false);
    expect(isApplicationRequestV01({ ...base, kind: "command", commandId: "command-1" })).toBe(false);
  });

  it("accepts the F2 environment snapshot query and demo task command", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-3",
      correlationId: "correlation-3",
      kind: "query",
      method: "environment.getSnapshot",
      params: {},
    })).toBe(true);

    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-4",
      correlationId: "correlation-4",
      commandId: "demo-1",
      kind: "command",
      method: "task.startDemo",
      params: {},
    })).toBe(true);
  });

  it("rejects F2 shapes with wrong kind, extra params, or bad identifiers", () => {
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-5",
      correlationId: "correlation-5",
      kind: "command",
      method: "environment.getSnapshot",
      params: {},
    })).toBe(false);
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-6",
      correlationId: "correlation-6",
      kind: "query",
      method: "environment.getSnapshot",
      params: { zone: "play" },
    })).toBe(false);
    expect(isApplicationRequestV01({
      contractVersion: APPLICATION_CONTRACT_VERSION,
      requestId: "request-7",
      correlationId: "correlation-7",
      commandId: "",
      kind: "command",
      method: "task.startDemo",
      params: {},
    })).toBe(false);
  });

  it("treats only the four committed outcomes as terminal", () => {
    expect(isTerminalTaskStateV01("running")).toBe(false);
    expect(isTerminalTaskStateV01("waiting_for_input")).toBe(false);
    expect(isTerminalTaskStateV01("succeeded")).toBe(true);
    expect(isTerminalTaskStateV01("succeeded_with_warnings")).toBe(true);
    expect(isTerminalTaskStateV01("failed")).toBe(true);
    expect(isTerminalTaskStateV01("cancelled")).toBe(true);
  });
});
