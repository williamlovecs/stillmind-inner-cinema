import assert from "node:assert/strict";
import test from "node:test";
import { configureAnalytics, reminderHourBucket, sessionCountBucket, track, type AnalyticsEnvelope } from "../mobile/src/lib/analytics";

test("analytics is inert until a privacy-reviewed sink is configured", () => {
  configureAnalytics(undefined);
  assert.doesNotThrow(() => track("data_exported", { format: "json" }));
});

test("analytics emits only the typed sanitized envelope", async () => {
  const events: AnalyticsEnvelope[] = [];
  configureAnalytics((event) => { events.push(event); });
  track("practice_started", { method_id: "inner-cinema", duration_bucket: 1, source: "offline" });
  await Promise.resolve();
  assert.equal(events.length, 1);
  assert.equal(events[0].name, "practice_started");
  assert.deepEqual(events[0].payload, { method_id: "inner-cinema", duration_bucket: 1, source: "offline" });
  configureAnalytics(undefined);
});

test("analytics buckets avoid precise behavioral timestamps and counts", () => {
  assert.equal(sessionCountBucket(0), "0");
  assert.equal(sessionCountBucket(5), "3-6");
  assert.equal(sessionCountBucket(20), "7+");
  assert.equal(reminderHourBucket(8), "morning");
  assert.equal(reminderHourBucket(21), "night");
});
