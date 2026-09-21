/**
 * release「在 Unity 中打开以检查/修复」端口测试(U19 第二交付,用户裁决
 * 2026-09-21;TS 面随核心 v0.2 冻结形状对齐——第 156 批):
 * - 结构缺席实现(empty/fixture 装配点):openForInspection 恒答 absent、
 *   taskSnapshot 恒答 null——诚实缺席,不伪造受理/不伪造检视事实;
 * - 缺席降级臂接线钉:emptyGateway(生产构建默认)缺席语义——无宿主/未
 *   接入的诚实缺席(live 装配点已按冻结回执形状换 live 实现,行为由
 *   release-project-open-port-live.test.ts 钉)。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import { createAbsentReleaseProjectOpenPort } from "./release-project-open-port.ts";
import { emptyGateway } from "../../gateway/empty-gateway.ts";

describe("createAbsentReleaseProjectOpenPort(结构缺席)", () => {
  test("openForInspection 恒答 absent(不伪造受理)", async () => {
    const port = createAbsentReleaseProjectOpenPort();
    assert.deepEqual(await port.openForInspection("build-1"), { kind: "absent" });
    assert.deepEqual(await port.openForInspection(""), { kind: "absent" });
  });

  test("taskSnapshot 恒答 null(不伪造检视任务视图)", async () => {
    const port = createAbsentReleaseProjectOpenPort();
    assert.equal(await port.taskSnapshot("task-1"), null);
  });
});

describe("缺席降级臂接线(emptyGateway 生产默认)", () => {
  test("releaseProjectOpen 装配点 → 同一缺席语义(降级臂不因装配分叉)", async () => {
    const gateway = emptyGateway();
    assert.deepEqual(await gateway.releaseProjectOpen.openForInspection("build-1"), {
      kind: "absent",
    });
    assert.equal(await gateway.releaseProjectOpen.taskSnapshot("task-1"), null);
  });
});
