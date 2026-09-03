import assert from "node:assert/strict";
import { test } from "vitest";
import {
  isTrackStage,
  segmentAfter,
  stageConclusion,
  stageOrder,
  trackStages,
  type StageNode,
} from "./track-model.ts";

test("track connects only Assembly, Production and Inspection", () => {
  assert.deepEqual(trackStages, ["assembly", "production", "inspection"]);
  for (const stage of stageOrder) {
    assert.equal(isTrackStage(stage), trackStages.includes(stage));
  }
  assert.equal(isTrackStage("warehouse"), false);
  assert.equal(isTrackStage("recipe"), false);
  assert.equal(isTrackStage("release"), false);
});

test("segment syntax follows stage state", () => {
  assert.equal(segmentAfter("completed"), "confirmed");
  assert.equal(segmentAfter("current"), "flowing");
  assert.equal(segmentAfter("pending"), "planned");
  assert.equal(segmentAfter("needsConfirmation"), "planned");
  assert.equal(segmentAfter("blocked"), "planned");
});

const stage = (id: string, state: StageNode["state"]): StageNode => ({
  id: id as StageNode["id"],
  label: id,
  state,
});

test("stage conclusion: blocked wins over everything", () => {
  const stages = [stage("assembly", "completed"), stage("production", "blocked")];
  assert.equal(stageConclusion(stages).kind, "blocked");
});

test("stage conclusion: confirmation outranks running", () => {
  const stages = [
    stage("assembly", "completed"),
    stage("production", "current"),
    stage("inspection", "needsConfirmation"),
  ];
  assert.equal(stageConclusion(stages).kind, "needsConfirmation");
});

test("stage conclusion: any current stage means running", () => {
  const stages = [stage("assembly", "completed"), stage("production", "current")];
  assert.equal(stageConclusion(stages).kind, "running");
});

test("stage conclusion: completed requires every stage completed", () => {
  const done = [stage("assembly", "completed"), stage("production", "completed")];
  assert.equal(stageConclusion(done).kind, "completed");
});

test("stage conclusion: all pending is not started, never completed", () => {
  const stages = [stage("assembly", "pending"), stage("production", "pending")];
  assert.equal(stageConclusion(stages).kind, "notStarted");
});

test("stage conclusion: completed mixed with pending and no current is not started", () => {
  const stages = [stage("assembly", "completed"), stage("production", "pending")];
  assert.equal(stageConclusion(stages).kind, "notStarted");
});

test("stage conclusion: empty stage list is not started", () => {
  assert.equal(stageConclusion([]).kind, "notStarted");
});
