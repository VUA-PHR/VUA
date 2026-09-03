import assert from "node:assert/strict";
import { test } from "vitest";
import type { StageId, WorkshopTape } from "./track-model.ts";
import { formatTapeClock, tapeFrame, tapeEventsSorted, eventsForStage } from "./workshop-replay.ts";

const labelOf = (id: StageId) => id;

const tape: WorkshopTape = {
  schemaVersion: 1,
  durationMs: 10000,
  events: [
    { at: 0, kind: "stage", stage: "warehouse", state: "completed" },
    { at: 0, kind: "stage", stage: "assembly", state: "current" },
    { at: 1500, kind: "log", text: "snapshot created" },
    { at: 3000, kind: "stat", operations: 12 },
    { at: 3000, kind: "log", text: "import done" },
    { at: 5000, kind: "stage", stage: "assembly", state: "completed" },
    { at: 5000, kind: "stage", stage: "production", state: "current" },
    { at: 8000, kind: "stat", operations: 30 },
    { at: 9000, kind: "stage", stage: "production", state: "blocked" },
  ],
};

test("tapeFrame:起点帧只含 at=0 事件,未触发阶段 pending", () => {
  const frame = tapeFrame(tape, 0, labelOf);
  const byId = new Map(frame.stages.map((s) => [s.id, s.state]));
  assert.equal(byId.get("warehouse"), "completed");
  assert.equal(byId.get("assembly"), "current");
  assert.equal(byId.get("production"), "pending");
  assert.equal(frame.log.length, 0);
  assert.equal(frame.operations, 0);
  assert.equal(frame.done, false);
});

test("tapeFrame:中间帧按事件流点亮节点、追加日志、累计操作数", () => {
  const frame = tapeFrame(tape, 6000, labelOf);
  const byId = new Map(frame.stages.map((s) => [s.id, s.state]));
  assert.equal(byId.get("assembly"), "completed");
  assert.equal(byId.get("production"), "current");
  assert.deepEqual(
    frame.log.map((entry) => entry.text),
    ["snapshot created", "import done"],
  );
  assert.equal(frame.operations, 12);
});

test("tapeFrame:带尾帧 done,可核实计数为全部 stat 增量之和", () => {
  const frame = tapeFrame(tape, 10000, labelOf);
  assert.equal(frame.done, true);
  assert.equal(frame.operations, 42);
  assert.equal(frame.stages.find((s) => s.id === "production")?.state, "blocked");
});

test("tapeFrame:回退语义——恢复带中阶段可从 blocked 退回 pending 再前进", () => {
  const recoverTape: WorkshopTape = {
    schemaVersion: 1,
    durationMs: 8000,
    events: [
      { at: 0, kind: "stage", stage: "production", state: "current" },
      { at: 2000, kind: "stage", stage: "production", state: "blocked" },
      { at: 4000, kind: "log", text: "snapshot restored" },
      { at: 4000, kind: "stage", stage: "production", state: "pending" },
      { at: 6000, kind: "stage", stage: "production", state: "current" },
    ],
  };
  assert.equal(tapeFrame(recoverTape, 3000, labelOf).stages.find((s) => s.id === "production")?.state, "blocked");
  assert.equal(tapeFrame(recoverTape, 5000, labelOf).stages.find((s) => s.id === "production")?.state, "pending");
  assert.equal(tapeFrame(recoverTape, 7000, labelOf).stages.find((s) => s.id === "production")?.state, "current");
});

test("formatTapeClock:mm:ss 格式", () => {
  assert.equal(formatTapeClock(0), "00:00");
  assert.equal(formatTapeClock(61500), "01:01");
});

test("tapeEventsSorted:乱序带被拒绝", () => {
  assert.equal(tapeEventsSorted(tape), true);
  const messy: WorkshopTape = {
    schemaVersion: 1,
    durationMs: 1000,
    events: [
      { at: 500, kind: "log", text: "b" },
      { at: 100, kind: "log", text: "a" },
    ],
  };
  assert.equal(tapeEventsSorted(messy), false);
});

test("eventsForStage:只取该阶段的状态迁移,按 at 升序", () => {
  assert.deepEqual(eventsForStage(tape, "production"), [
    { at: 5000, state: "current" },
    { at: 9000, state: "blocked" },
  ]);
  assert.deepEqual(eventsForStage(tape, "assembly"), [
    { at: 0, state: "current" },
    { at: 5000, state: "completed" },
  ]);
});

test("eventsForStage:未触发的阶段返回空序列,不虚构状态", () => {
  assert.deepEqual(eventsForStage(tape, "inspection"), []);
});
