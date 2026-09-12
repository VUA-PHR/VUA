/**
 * Inspection 表现模型测试(M7 消费批):基调推导与投影的纯函数事实——
 * - 维状态基调:fail=error / warn=amber / unavailable=muted(缺席非通过) /
 *   pass=neutral(§6.1 异常才红);
 * - 聚合结论基调三态穷尽(unavailable 不是聚合输出);
 * - 投影原样透传(checks 消息原样,词表外 kind/basis 原词透传);
 * - 摘要行投影 label 优先,缺 label 显 ref(零猜测合成);
 * - 列表/详情视图状态概括(空态即终态判据)。
 */
import assert from "node:assert/strict";
import { describe, test } from "vitest";
import type { InspectionEvidenceDocumentV01 } from "@vua/contracts";
import {
  detailViewKind,
  evidenceDetailModel,
  listEntryModel,
  listViewKind,
  toneForDimensionStatus,
  toneForOverallStatus,
} from "./inspection-model.ts";
import type { InspectionDetailView, InspectionListView } from "./inspection-port.ts";

const INSP_ID = "01982b5a-3f10-7c4e-9d2a-4b8e1f6a7c21";

function evidenceDocument(): InspectionEvidenceDocumentV01 {
  return {
    schemaVersion: "0.1",
    inspectionId: INSP_ID,
    avatarRef: { ref: "warehouse:booth-item-1001" },
    performedAt: "2026-09-13T00:20:00Z",
    bridge: {
      editorVersion: "2022.3.22f1",
      bridgeSchemaVersion: 3,
      operations: [
        { operation: "inspect_avatar_references", commandId: "insp-01", status: "succeeded" },
      ],
    },
    dimensions: [
      {
        kind: "dependencies",
        status: "fail",
        basis: "bridge_typed_checks",
        checks: [
          { code: "references.missing_material", severity: "error", message: "丢失的材质槽引用。" },
        ],
      },
      {
        kind: "functional",
        status: "unavailable",
        basis: "none",
        checks: [],
      },
      {
        kind: "performance",
        status: "warn",
        basis: "bridge_local_estimate",
        checks: [],
      },
    ],
    overallStatus: "fail",
    notes: "合成投影测试。",
  };
}

describe("inspection 表现模型(M7 消费批)", () => {
  test("维状态基调四态穷尽:缺席=灰阶非通过,异常才红", () => {
    assert.equal(toneForDimensionStatus("pass"), "neutral");
    assert.equal(toneForDimensionStatus("warn"), "amber");
    assert.equal(toneForDimensionStatus("fail"), "error");
    assert.equal(toneForDimensionStatus("unavailable"), "muted");
  });

  test("聚合结论基调三态穷尽", () => {
    assert.equal(toneForOverallStatus("pass"), "neutral");
    assert.equal(toneForOverallStatus("warn"), "amber");
    assert.equal(toneForOverallStatus("fail"), "error");
  });

  test("证据束投影:checks/basis 原词透传,bridge 概要转抄,notes 透传", () => {
    const model = evidenceDetailModel(evidenceDocument());
    assert.equal(model.inspectionId, INSP_ID);
    assert.equal(model.avatarLabel, "warehouse:booth-item-1001");
    assert.equal(model.overallStatusRaw, "fail");
    assert.equal(model.editorVersion, "2022.3.22f1");
    assert.equal(model.operationCount, 1);
    assert.equal(model.dimensions.length, 3);
    const first = model.dimensions[0];
    assert.ok(first !== undefined);
    assert.equal(first.statusRaw, "fail");
    assert.equal(first.basisRaw, "bridge_typed_checks");
    assert.equal(first.checks[0]?.message, "丢失的材质槽引用。");
    assert.equal(model.notes, "合成投影测试。");
  });

  test("摘要行投影:label 优先,缺 label 显 ref", () => {
    const withLabel = listEntryModel({
      inspectionId: INSP_ID,
      avatarRef: { ref: "warehouse:booth-item-1001", label: "Synthetic Avatar A" },
      overallStatus: "warn",
      performedAt: "2026-09-13T00:20:00Z",
    });
    assert.equal(withLabel.avatarLabel, "Synthetic Avatar A");
    const withoutLabel = listEntryModel({
      inspectionId: INSP_ID,
      avatarRef: { ref: "warehouse:booth-item-1001" },
      overallStatus: "pass",
      performedAt: "2026-09-13T00:20:00Z",
    });
    assert.equal(withoutLabel.avatarLabel, "warehouse:booth-item-1001");
  });

  test("列表视图状态概括:not-connected/empty/ready 三态", () => {
    const notConnected: InspectionListView = { schemaVersion: 1, kind: "not-connected" };
    assert.equal(listViewKind(notConnected), "not-connected");
    const empty: InspectionListView = {
      schemaVersion: 1,
      kind: "available",
      total: 0,
      entries: [],
    };
    assert.equal(listViewKind(empty), "empty");
    assert.equal(listViewKind({ schemaVersion: 1, kind: "available", total: 1, entries: [{
      inspectionId: INSP_ID,
      avatarRef: { ref: "warehouse:x" },
      overallStatus: "pass",
      performedAt: "2026-09-13T00:20:00Z",
    }] }), "ready");
  });

  test("详情视图状态概括:not-connected/missing/ready 三态", () => {
    assert.equal(detailViewKind({ schemaVersion: 1, kind: "not-connected" }), "not-connected");
    assert.equal(detailViewKind({ schemaVersion: 1, kind: "missing" }), "missing");
    const detail: InspectionDetailView = {
      schemaVersion: 1,
      kind: "available",
      document: evidenceDocument(),
    };
    assert.equal(detailViewKind(detail), "ready");
  });
});
