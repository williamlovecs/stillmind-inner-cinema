import assert from "node:assert/strict";
import test from "node:test";
import { configureAnalytics, reminderHourBucket, sessionCountBucket, track, weeklyNextStepReason, type AnalyticsEvent } from "../mobile/src/lib/analytics";
import { isAnalyticsEnvelope } from "@stillmind/domain";

test("analytics is inert until a privacy-reviewed sink is configured", () => {
  configureAnalytics(undefined);
  assert.doesNotThrow(() => track("data_exported", { format: "json" }));
});

test("analytics emits only the typed sanitized envelope", async () => {
  const events: AnalyticsEvent[] = [];
  configureAnalytics((event) => { events.push(event); });
  track("practice_started", { method_id: "inner-cinema", duration_bucket: 1, source: "offline" });
  track("practice_path_started", { path_id: "exit-inner-movie", method_id: "inner-cinema", duration_bucket: 1 });
  await Promise.resolve();
  assert.equal(events.length, 2);
  assert.equal(events[0].name, "practice_started");
  assert.deepEqual(events[0].payload, { method_id: "inner-cinema", duration_bucket: 1, source: "offline" });
  assert.deepEqual(events[1].payload, { path_id: "exit-inner-movie", method_id: "inner-cinema", duration_bucket: 1 });
  configureAnalytics(undefined);
});

test("the anonymous receiver contract rejects raw text and extra fields", () => {
  const safe = {
    schemaVersion: 1,
    name: "after_check_saved",
    anonymousId: "anon_12345678",
    platform: "web",
    payload: {
      method_id: "inner-cinema",
      result: "better",
      activation_change_bucket: "down",
      grounded_action_id: "walk",
      reuse_intent: "yes",
    },
  };
  assert.equal(isAnalyticsEnvelope(safe), true);
  assert.equal(isAnalyticsEnvelope({ ...safe, payload: { ...safe.payload, trigger: "private words" } }), false);
  assert.equal(isAnalyticsEnvelope({ ...safe, timestamp: new Date().toISOString() }), false);
});

test("analytics buckets avoid precise behavioral timestamps and counts", () => {
  assert.equal(sessionCountBucket(0), "0");
  assert.equal(sessionCountBucket(5), "3-6");
  assert.equal(sessionCountBucket(20), "7+");
  assert.equal(reminderHourBucket(8), "morning");
  assert.equal(reminderHourBucket(21), "night");
  assert.equal(weeklyNextStepReason(["weekly:better-signal", "method:inner-cinema"]), "better-signal");
  assert.equal(weeklyNextStepReason(["weekly:repeated-mode", "mode:impulsive"]), "repeated-mode");
  assert.equal(weeklyNextStepReason([]), "no-data");
});
