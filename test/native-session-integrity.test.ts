import assert from "node:assert/strict";
import test from "node:test";
import { isPracticeSession, isAnalyticsEnvelope, pausePracticeClock, resumePracticeClock,
  type AnalyticsEventName, type AnalyticsEvents, type PracticeSession } from "@stillmind/domain";
import { beginNativeAttempt, endNativeAttempt, nativeFeedbackResult, saveNativeFeedback,
  type NativeAttemptSeed } from "../mobile/src/lib/practice-attempt";

function fixture(overrides: Partial<NativeAttemptSeed> = {}) {
  let now = 0;
  const records: PracticeSession[] = [];
  const events: { name: AnalyticsEventName; payload: AnalyticsEvents[AnalyticsEventName] }[] = [];
  const seed: NativeAttemptSeed = { id: "native-synthetic-session", mode: "looping", methodId: "inner-cinema",
    minutes: 1, plannedDurationSeconds: 60, contentVersion: "1.0.0", source: "offline",
    inputMethod: "state-only", textProvided: false, consentAtStart: false, ...overrides };
  const attempt = beginNativeAttempt(seed, { now: () => now, isoNow: () => new Date(1700000000000 + now).toISOString(),
    save: async record => { records.push(record); }, emit: (name, payload) => { events.push({ name, payload }); } });
  return { attempt, records, events, advance: (value: number) => { now = value; } };
}
test("native no-rating session remains missing; eight-second stop is not sixty", async () => {
  const f = fixture(); f.advance(8000);
  const record = endNativeAttempt(f.attempt, "stopped"); await f.attempt.persisted;
  assert.equal(record.durationSeconds, 8); assert.equal(record.plannedDurationSeconds, 60);
  assert.equal(record.result, "stopped"); assert.equal(record.activationBefore, undefined);
  assert.equal(record.activationAfter, undefined); assert.equal(record.groundedActionId, undefined);
  assert.equal(isPracticeSession(record), true); assert.equal(f.events.length, 0);
});
test("native pause time is not active practice time", () => {
  const f = fixture(); f.advance(8000); f.attempt.clock = pausePracticeClock(f.attempt.clock, 8000);
  f.advance(20000); f.attempt.clock = resumePracticeClock(f.attempt.clock, 20000); f.advance(25000);
  assert.equal(endNativeAttempt(f.attempt, "stopped").durationSeconds, 13);
});
test("native completion saves before feedback; skip does not fabricate answers", async () => {
  const f = fixture({ activationBefore: 3 }); f.advance(65000);
  const record = endNativeAttempt(f.attempt, "completed"); await f.attempt.persisted;
  assert.equal(record.durationSeconds, 60); assert.equal(record.status, "completed");
  assert.equal(record.result, undefined); assert.equal(record.reuseIntent, undefined);
  assert.equal(f.records.at(-1)?.id, f.attempt.seed.id);
});
test("native async writes stay ordered even if the first write is delayed", async () => {
  const f = fixture(); let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  const order: string[] = [];
  f.attempt.ports.save = async record => { if (record.status === "abandoned") await hold; order.push(record.status + ':' + (record.result ?? '-')); };
  f.advance(60000); endNativeAttempt(f.attempt, "completed");
  saveNativeFeedback(f.attempt, { activationAfter: 4, shareAnonymous: false });
  await Promise.resolve(); assert.deepEqual(order, []);
  release(); await f.attempt.persisted;
  assert.deepEqual(order, ["abandoned:-", "completed:-", "completed:-"]);
});
test("native write failures do not reject exit or prevent a later save attempt", async () => {
  const f = fixture(); let notices = 0;
  f.attempt.ports.save = async () => { throw new Error("synthetic quota"); };
  f.attempt.ports.onStorageFailure = () => { notices += 1; };
  f.advance(8000); endNativeAttempt(f.attempt, "stopped");
  await assert.doesNotReject(f.attempt.persisted);
  assert.equal(f.attempt.ended, true); assert.equal(f.attempt.storageFailed, true); assert.equal(notices, 2);
});
test("native end/feedback are idempotent and events contain no private inputs", async () => {
  const f = fixture({ consentAtStart: true, activationBefore: 2 });
  f.advance(60000); endNativeAttempt(f.attempt, "completed"); endNativeAttempt(f.attempt, "abandoned");
  saveNativeFeedback(f.attempt, { activationAfter: 4, shareAnonymous: true });
  saveNativeFeedback(f.attempt, { activationAfter: 1, shareAnonymous: true });
  await f.attempt.persisted;
  assert.equal(f.attempt.record.result, "worse"); assert.equal(f.events.length, 5);
  for (const event of f.events) assert.equal(isAnalyticsEnvelope({ ...event, schemaVersion: 1, anonymousId: "synthetic-native-user", platform: "ios" }), true);
  assert.doesNotMatch(JSON.stringify(f.events), /rawTrigger|privateNote|feedbackNote/);
});
test("native late consent emits only the feedback, never synthetic starts", () => {
  const f = fixture(); f.advance(10000); endNativeAttempt(f.attempt, "abandoned");
  saveNativeFeedback(f.attempt, { shareAnonymous: true });
  assert.deepEqual(f.events.map(e => e.name), ["after_check_saved"]);
  assert.equal((f.events[0].payload as AnalyticsEvents["after_check_saved"]).activation_change_bucket, "unreported");
});
test("native discomfort is never overridden by a positive rating or explicit better result", () => {
  assert.equal(nativeFeedbackResult(4, 2, false, "worse"), "worse");
  assert.equal(nativeFeedbackResult(2, 4, false, "better"), "worse");
  assert.equal(nativeFeedbackResult(4, 2, true, "better"), "stopped");
  assert.equal(nativeFeedbackResult(undefined, undefined), undefined);
  assert.equal(nativeFeedbackResult(undefined, undefined, false, "same"), "same");
});
