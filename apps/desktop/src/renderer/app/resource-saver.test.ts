import assert from "node:assert/strict";
import { test } from "vitest";
import { resourceSaverActive, resourceSaverSource } from "./resource-saver.ts";

test("手动开即生效,与自动偏好无关", () => {
  assert.equal(
    resourceSaverActive({ manualOn: true, autoEnabled: false, steamVRRunning: false }),
    true,
  );
  assert.equal(
    resourceSaverActive({ manualOn: true, autoEnabled: true, steamVRRunning: false }),
    true,
  );
});

test("自动路径:仅当偏好开且 SteamVR 运行中才生效", () => {
  assert.equal(
    resourceSaverActive({ manualOn: false, autoEnabled: true, steamVRRunning: true }),
    true,
  );
  assert.equal(
    resourceSaverActive({ manualOn: false, autoEnabled: true, steamVRRunning: false }),
    false,
  );
  assert.equal(
    resourceSaverActive({ manualOn: false, autoEnabled: false, steamVRRunning: true }),
  false,
  );
});

test("检测器未接入(恒 false)时自动路径不产生效果", () => {
  assert.equal(
    resourceSaverActive({ manualOn: false, autoEnabled: true, steamVRRunning: false }),
    false,
  );
});

test("状态归因:手动优先于自动;都未命中为 off", () => {
  assert.equal(
    resourceSaverSource({ manualOn: true, autoEnabled: true, steamVRRunning: true }),
    "manual",
  );
  assert.equal(
    resourceSaverSource({ manualOn: false, autoEnabled: true, steamVRRunning: true }),
    "auto",
  );
  assert.equal(
  resourceSaverSource({ manualOn: false, autoEnabled: true, steamVRRunning: false }),
    "off",
  );
});
