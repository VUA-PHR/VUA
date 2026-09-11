import assert from "node:assert/strict";
import { test } from "vitest";
import {
  associationLabel,
  lockStatusKey,
  narrowEnvironmentSnapshot,
  narrowInspectAssociations,
  narrowManagerCapability,
  narrowVuaIdentity,
} from "./project-detection-model.ts";

/* 013 读面消费(T-B)的呈现窄化纯函数:envelope 强度承载下按字段存在性
 * 收窄,缺失/不可解释 = null 或原文呈现,不猜测。 */

const labels = { vcc: "VCC", alcom: "ALCOM" };

test("narrowManagerCapability: presence 词表三值收窄,词表外=null", () => {
  assert.deepEqual(narrowManagerCapability({ presence: "found", userProjects: ["a", "b"] }), {
    presence: "found",
    settingsPath: null,
    userProjectsCount: 2,
  });
  assert.equal(narrowManagerCapability({ presence: "read_failed" })?.presence, "read_failed");
  assert.equal(narrowManagerCapability({ presence: "whatever" }), null);
  assert.equal(narrowManagerCapability(null), null);
  assert.equal(narrowManagerCapability("found"), null);
});

test("narrowEnvironmentSnapshot: 顶层字段存在性读取,计数缺失=null", () => {
  const narrowed = narrowEnvironmentSnapshot({
    capturedAt: "2026-09-10T03:00:00Z",
    vcc: { presence: "found" },
    alcom: { presence: "not_found" },
    editors: [{}, {}],
  });
  assert.equal(narrowed?.capturedAt, "2026-09-10T03:00:00Z");
  assert.equal(narrowed?.vcc?.presence, "found");
  assert.equal(narrowed?.alcom?.presence, "not_found");
  assert.equal(narrowed?.editorsCount, 2);
  assert.equal(narrowed?.projectsCount, null);
  assert.equal(narrowEnvironmentSnapshot(undefined), null);
});

test("associationLabel: 词表两值映射,词表外原文诚实呈现", () => {
  assert.equal(associationLabel("vcc_registered", labels), "VCC");
  assert.equal(associationLabel("alcom_registered", labels), "ALCOM");
  assert.equal(associationLabel("future_manager", labels), "future_manager");
  assert.equal(associationLabel(42, labels), "");
});

test("lockStatusKey: 三态映射,词表外=null", () => {
  assert.equal(lockStatusKey("none"), "lockNone");
  assert.equal(lockStatusKey("leftover"), "lockLeftover");
  assert.equal(lockStatusKey("unreadable"), "lockUnreadable");
  assert.equal(lockStatusKey("locked"), null);
});

test("narrowInspectAssociations: 仅保留非空字符串关联", () => {
  assert.deepEqual(narrowInspectAssociations(["vcc_registered", "", 42]), ["vcc_registered"]);
  assert.deepEqual(narrowInspectAssociations([]), []);
});

test("narrowVuaIdentity: 三态收窄(present 携带 markedAt/note)", () => {
  assert.deepEqual(narrowVuaIdentity({ status: "absent" }), {
    status: "absent",
    markedAt: null,
    note: null,
  });
  assert.deepEqual(
    narrowVuaIdentity({ status: "present", markedAt: "2026-09-12T00:00:00Z", note: "亚洲字符补位" }),
    { status: "present", markedAt: "2026-09-12T00:00:00Z", note: "亚洲字符补位" },
  );
  // note = null 是合法存储态(无备注的 VUA 原生项目)
  assert.deepEqual(
    narrowVuaIdentity({ status: "present", markedAt: "2026-09-12T00:00:00Z", note: null }),
    { status: "present", markedAt: "2026-09-12T00:00:00Z", note: null },
  );
  assert.deepEqual(narrowVuaIdentity({ status: "unreadable" }), {
    status: "unreadable",
    markedAt: null,
    note: null,
  });
});

test("narrowVuaIdentity: 不可解释 = null(缺字段/词表外/非对象,不猜测)", () => {
  assert.equal(narrowVuaIdentity(null), null);
  assert.equal(narrowVuaIdentity("x"), null);
  assert.equal(narrowVuaIdentity({ status: "present" }), null);
  assert.equal(narrowVuaIdentity({ status: "present", markedAt: "", note: null }), null);
  assert.equal(narrowVuaIdentity({ status: "present", markedAt: "t", note: 42 }), null);
  assert.equal(narrowVuaIdentity({ status: "locked" }), null);
});
