import assert from "node:assert/strict";
import { test } from "vitest";
import { canAdvanceStep, type FixStep } from "./fix-plan-model.ts";

const base = { id: "s1", title: "t", description: "d" };

test("confirm-candidate 必须先选定候选才可前进(Issue #4:不替用户猜测)", () => {
  const step: FixStep = { ...base, kind: "confirm-candidate", candidates: ["a", "b"] };
  assert.equal(canAdvanceStep(step, null), false);
  assert.equal(canAdvanceStep(step, "a"), true);
});

test("manual / external-link / recheck 无需候选即可前进", () => {
  assert.equal(canAdvanceStep({ ...base, kind: "manual" }, null), true);
  assert.equal(
    canAdvanceStep({ ...base, kind: "external-link", url: "https://example.com" }, null),
    true,
  );
  assert.equal(canAdvanceStep({ ...base, kind: "recheck" }, null), true);
});
