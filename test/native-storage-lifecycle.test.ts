import assert from "node:assert/strict";
import test from "node:test";
import { clearAppStorage, loadAppState } from "../mobile/src/state/storage-lifecycle";
import { DEFAULT_PREFERENCES } from "../mobile/src/state/preferences";
import { createSerialTaskQueue } from "../mobile/src/lib/serial-tasks";

test("a failed history read does not discard independently saved privacy or safety choices", async () => {
  const saved = { ...DEFAULT_PREFERENCES, onboardingComplete: true, historyEnabled: false,
    bodyFocusAllowed: false, breathChangeAllowed: false, favoriteMethodIds: ["inner-cinema"] };
  const state = await loadAppState({ loadPreferences: async () => JSON.stringify(saved),
    loadSessions: async () => { throw new Error("database unavailable"); } });
  assert.deepEqual(state.preferences, saved);
  assert.deepEqual(state.sessions, []);
  assert.match(state.notice ?? "", /历史暂未读取/);
});

test("a failed preferences read fails closed for persistence, analytics and optional experiences", async () => {
  const state = await loadAppState({ loadPreferences: async () => { throw new Error("settings unavailable"); },
    loadSessions: async () => [] });
  for (const key of ["historyEnabled", "aiEnabled", "anonymousAnalyticsEnabled", "bodyFocusAllowed", "breathChangeAllowed", "hapticsEnabled"] as const) {
    assert.equal(state.preferences[key], false, key);
  }
  assert.equal(state.preferences.eyesOpenPreferred, true);
  assert.match(state.notice ?? "", /不保存历史/);
});

test("malformed and structurally invalid saved preferences never enable history", async () => {
  for (const value of ["{bad-json", "null", "42", "[]", '"a string"']) {
    const state = await loadAppState({ loadPreferences: async () => value, loadSessions: async () => [] });
    assert.equal(state.preferences.historyEnabled, false, value);
    assert.ok(state.notice);
  }
});

test("a genuinely first launch preserves the intentional onboarding defaults", async () => {
  const state = await loadAppState({ loadPreferences: async () => null, loadSessions: async () => [] });
  assert.deepEqual(state.preferences, DEFAULT_PREFERENCES);
  assert.equal(state.notice, undefined);
});

test("deletion attempts reminders, sessions, settings and identity even if one resource fails", async () => {
  const calls: string[] = [];
  await assert.rejects(clearAppStorage({
    cancelReminders: async () => { calls.push("reminders"); },
    clearSessions: async () => { calls.push("sessions"); throw new Error("database unavailable"); },
    clearPreferences: async () => { calls.push("settings"); },
    clearAnalyticsIdentity: async () => { calls.push("identity"); },
  }), (error: unknown) => error instanceof AggregateError && error.errors.length === 1);
  assert.deepEqual(calls.sort(), ["identity", "reminders", "sessions", "settings"]);
});

test("deletion reports all failures, including synchronous adapter exceptions", async () => {
  await assert.rejects(clearAppStorage({
    cancelReminders: () => { throw new Error("notifications unavailable"); },
    clearSessions: async () => undefined,
    clearPreferences: async () => { throw new Error("preferences unavailable"); },
    clearAnalyticsIdentity: async () => undefined,
  }), (error: unknown) => error instanceof AggregateError && error.errors.length === 2);
});

test("a reminder lane drains a late OS response before deletion, including failed preference writes", async () => {
  const reminders = createSerialTaskQueue();
  let reply!: () => void;
  const permission = new Promise<void>(resolve => { reply = resolve; });
  const order: string[] = [];
  const pending = reminders.run(async () => {
    await permission;
    order.push("schedule");
    throw new Error("preferences cannot be restored during deletion");
  });
  const failed = assert.rejects(pending, /cannot be restored/);
  const deletion = (async () => {
    await reminders.run(async () => undefined);
    await clearAppStorage({ cancelReminders: async () => { order.push("cancel"); },
      clearSessions: async () => undefined, clearPreferences: async () => undefined, clearAnalyticsIdentity: async () => undefined });
  })();
  assert.deepEqual(order, []);
  reply();await failed;await deletion;
  assert.deepEqual(order, ["schedule", "cancel"]);
});
