import assert from "node:assert/strict";
import test from "node:test";
import { resolveTimelinePosition } from "../mobile/src/lib/timeline";

const steps = [{ seconds: 10 }, { seconds: 20 }];

test("timeline resolves start and partial first step", () => {
  assert.deepEqual(resolveTimelinePosition(steps, 0), { complete: false, stepIndex: 0, secondsLeft: 10 });
  assert.deepEqual(resolveTimelinePosition(steps, 9_500), { complete: false, stepIndex: 0, secondsLeft: 1 });
});

test("timeline crosses steps using absolute elapsed time", () => {
  assert.deepEqual(resolveTimelinePosition(steps, 10_000), { complete: false, stepIndex: 1, secondsLeft: 20 });
  assert.deepEqual(resolveTimelinePosition(steps, 25_000), { complete: false, stepIndex: 1, secondsLeft: 5 });
});

test("timeline completes exactly at total duration", () => {
  assert.deepEqual(resolveTimelinePosition(steps, 30_000), { complete: true, stepIndex: 1, secondsLeft: 0 });
});

test("timeline handles negative elapsed and empty content safely", () => {
  assert.deepEqual(resolveTimelinePosition(steps, -500), { complete: false, stepIndex: 0, secondsLeft: 10 });
  assert.deepEqual(resolveTimelinePosition([], 1_000), { complete: true, stepIndex: 0, secondsLeft: 0 });
});
