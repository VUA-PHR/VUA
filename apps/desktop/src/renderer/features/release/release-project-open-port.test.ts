/**
 * release「在 Unity 中打开以检查/修复」端口测试(U19 第二交付,用户裁决
 * 2026-09-21):
 * - 结构缺席实现:openForInspection 恒答 absent 诚实缺席(核心 open 入口
 *   入库前唯一实现;不伪造受理/不虚构路由);
 * - 缺席降级臂接线钉:emptyGateway(生产构建默认)与 live 装配点同走
 *   结构缺席——两装配点行为一致,能力缺席呈现不因装配分叉。
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
});

describe("缺席降级臂接线(emptyGateway 生产默认)", () => {
  test("releaseProjectOpen 装配点 → 同一缺席语义(降级臂不因装配分叉)", async () => {
    const gateway = emptyGateway();
    assert.deepEqual(await gateway.releaseProjectOpen.openForInspection("build-1"), {
      kind: "absent",
    });
  });
});
