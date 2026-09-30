import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isApplicationRequestV01 } from "./application-contract.js";
import { isDesktopGatewayRequestV1 } from "./desktop-gateway.js";
import { DEPLOYMENT_SCHEMA, isDeploymentIntent, isDeploymentParams, isDeploymentPlanResult, isDeploymentAccepted, isDeploymentCommandId } from "./environment-deployment.js";

const vectors = JSON.parse(readFileSync(new URL("../../../schemas/environment-deployment/v0.1/intent-vectors.json", import.meta.url), "utf8")) as { name: string; valid: boolean; intent: unknown }[];
const intent = { purposes: ["pc_avatar"], editorRoot: "C:\\VUA Test\\Editors" };
const digest = "a".repeat(64);
describe("deployment v0.1 closed boundary", () => {
  it("does not mistake an accepted receipt for an installer result or accept malformed identity", () => {
    const receipt = { schemaVersion: DEPLOYMENT_SCHEMA, operation: "environment.executeDeployment", taskId: "task-1", correlationId: "corr-1" };
    expect(isDeploymentAccepted(receipt)).toBe(true);
    expect(isDeploymentAccepted({ ...receipt, taskId: null })).toBe(false);
    expect(isDeploymentAccepted({ ...receipt, installed: true })).toBe(false);
    expect(isDeploymentCommandId("用户-1")).toBe(true);
    expect(isDeploymentCommandId("a".repeat(129))).toBe(false);
    expect(isDeploymentCommandId("界".repeat(43))).toBe(false);
    expect(isDeploymentCommandId("cmd\u0085")).toBe(false);
  });
  for (const vector of vectors) it(vector.name, () => expect(isDeploymentIntent(vector.intent)).toBe(vector.valid));
  it("accepts query/command on both envelopes and keeps command identity outside app params", () => {
    for (const execute of [false, true]) {
      const method = execute ? "environment.executeDeployment" : "environment.planDeployment";
      const params = execute ? { intent, confirmedDigest: digest } : { intent };
      const app = { contractVersion: "0.1", requestId: "r", correlationId: "corr", kind: execute ? "command" : "query", method, params, ...(execute ? { commandId: "cmd" } : {}) };
      expect(isApplicationRequestV01(app)).toBe(true);
      expect(isDesktopGatewayRequestV1({ schemaVersion: 1, requestId: "r", method, params: { ...params, ...(execute ? { commandId: "cmd" } : {}) } })).toBe(true);
      expect(isApplicationRequestV01({ ...app, params: { ...params, executable: "cmd.exe" } })).toBe(false);
    }
  });
  it("requires exact confirmation and rejects fields outside this capability", () => {
    expect(isDeploymentParams({ intent, confirmedDigest: digest }, true)).toBe(true);
    for (const invalid of [{ intent }, { intent, confirmedDigest: digest.toUpperCase() }, { intent, confirmedDigest: digest, force: true }, { intent, confirmedDigest: "x" }]) {
      expect(isDeploymentParams(invalid, true)).toBe(false);
    }
    expect(isDeploymentIntent({ ...intent, editorRoot: `C:\\${"界".repeat(80)}` })).toBe(false);
  });
  it("rejects arbitrary URLs, duplicate components and false-ready results", () => {
    const step = { component: "unity_hub", action: "retain", reason: "verified", location: null, version: null, officialUrl: "https://unity.com/download" };
    const editor = { ...step, component: "unity_editor", action: "manual_install", reason: "missing" };
    const plan = { schemaVersion: DEPLOYMENT_SCHEMA, intent, steps: [step, editor], digest, prerequisitesReady: false };
    expect(isDeploymentPlanResult({ deploymentPlan: plan })).toBe(true);
    expect(isDeploymentPlanResult({ deploymentPlan: { ...plan, prerequisitesReady: true } })).toBe(false);
    expect(isDeploymentPlanResult({ deploymentPlan: { ...plan, steps: [step, step] } })).toBe(false);
    expect(isDeploymentPlanResult({ deploymentPlan: { ...plan, steps: [step, { ...editor, officialUrl: "https://example.com/installer" }] } })).toBe(false);
  });
});
