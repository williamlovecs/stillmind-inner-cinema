import assert from "node:assert/strict";
import test from "node:test";
import {
  startPracticeClock, pausePracticeClock, resumePracticeClock, elapsedPracticeMs, practicePosition,
  sessionResult, endingCopy, ratingText, reportedActivation, isPracticeSession,
  canStartMethod, recommendMethods, METHOD_IDS, isAnalyticsEnvelope, type AnalyticsEventName,
  type AnalyticsEvents, type PracticeSession, type RoutingInput,
} from "@stillmind/domain";
import { beginAttempt, endAttempt, saveAttemptFeedback, type AttemptSeed } from "../src/lib/practice-attempt";
import { readStoredArray, writeStoredJson } from "../src/lib/safe-storage";
import { readPracticeOptions, practiceOptionsFromQuery } from "../src/lib/practice-options";
import { eventWasAccepted } from "../src/lib/analytics-client";

const steps = [{ seconds: 20, kind: "arrive" }, { seconds: 20, kind: "breathe" }, { seconds: 20, kind: "close" }];
test("clock counts active time, not paused time, with idempotent pause/resume", () => {
  let clock = startPracticeClock(1000);
  clock = pausePracticeClock(clock, 9000);
  clock = pausePracticeClock(clock, 19000);
  assert.equal(elapsedPracticeMs(clock, 22000), 8000);
  clock = resumePracticeClock(clock, 24000);
  clock = resumePracticeClock(clock, 25000);
  assert.equal(elapsedPracticeMs(clock, 27000), 11000);
});
test("delayed ticks resolve a pure absolute timeline without double increments", () => {
  assert.equal(practicePosition(steps, 19999).stepIndex, 0);
  assert.equal(practicePosition(steps, 20000).stepIndex, 1);
  assert.equal(practicePosition(steps, 20000).secondsLeft, 20);
  assert.equal(practicePosition(steps, 45500).stepIndex, 2);
  assert.equal(practicePosition(steps, 45500).breathingSeconds, 20);
  assert.equal(practicePosition(steps, 70000).elapsedSeconds, 60);
  assert.equal(practicePosition(steps, 70000).complete, true);
});
test("unanswered scores remain missing, not same, and valid ratings remain 1-5", () => {
  for (const value of [undefined, null, 0, 6, 2.5, NaN, "4"]) assert.equal(reportedActivation(value), undefined);
  assert.equal(reportedActivation(4), 4);
  assert.equal(sessionResult(undefined, 3), undefined);
  assert.equal(sessionResult(4, undefined), undefined);
  assert.equal(ratingText(undefined), "未填写");
  assert.equal(sessionResult(3, 3), "same");
  assert.equal(sessionResult(2, 4), "worse");
});
test("worse/stopped/abandoned endings never claim an acquired observer position", () => {
  for (const [result, status] of [["worse", "completed"], ["better", "stopped"], [undefined, "abandoned"]] as const) {
    const copy = endingCopy(result, status);
    assert.equal(copy.suggestPractice, false);
    assert.doesNotMatch(copy.title + copy.body, /获得|观察位置|成功|消散/);
  }
  assert.match(endingCopy("same").title, /没有明显变化/);
  assert.match(endingCopy(undefined).body, /不会替你判断/);
});
function fixture(overrides: Partial<AttemptSeed> = {}) {
  let now = 0;
  const records: PracticeSession[] = [];
  const events: Array<{ name: AnalyticsEventName; payload: AnalyticsEvents[AnalyticsEventName] }> = [];
  const seed: AttemptSeed = { id: "web-synthetic-session-123", mode: "looping", methodId: "inner-cinema", minutes: 1,
    plannedDurationSeconds: 60, contentVersion: "1.0.0", inputMethod: "state-only", textProvided: false,
    consentAtStart: false, ...overrides };
  const attempt = beginAttempt(seed, { now: () => now, isoNow: () => new Date(1700000000000 + now).toISOString(),
    save: (record) => { records.push(record); return true; },
    emit: (name, payload) => { events.push({ name, payload }); } });
  return { attempt, records, events, advance: (value: number) => { now = value; } };
}
test("an eight-second stop retains actual and planned durations separately", () => {
  const f = fixture(); f.advance(8000);
  const record = endAttempt(f.attempt, "stopped");
  assert.equal(record.durationSeconds, 8); assert.equal(record.plannedDurationSeconds, 60);
  assert.equal(record.status, "stopped"); assert.equal(record.result, "stopped");
  assert.equal(record.activationBefore, undefined); assert.equal(record.activationAfter, undefined);
  assert.equal(record.groundedActionId, undefined); assert.equal(record.reuseIntent, undefined);
  assert.equal(isPracticeSession(record), true);
});
test("completion is recorded before optional feedback and feedback updates the same id", () => {
  const f = fixture({ activationBefore: 2 }); f.advance(60000);
  const record = endAttempt(f.attempt, "completed");
  assert.equal(record.status, "completed"); assert.equal(record.result, undefined);
  const updated = saveAttemptFeedback(f.attempt, { activationAfter: 4, shareAnonymous: false });
  assert.equal(updated.id, record.id); assert.equal(updated.result, "worse");
  assert.equal(updated.groundedActionId, undefined); assert.equal(f.events.length, 0);
});
test("actual start/abandon events are opt-in, joinable and idempotent", () => {
  const f = fixture({ consentAtStart: true });
  assert.deepEqual(f.events.map(e => e.name), ["reset_entry_submitted", "reset_started", "practice_started"]);
  f.advance(4000); endAttempt(f.attempt, "abandoned"); endAttempt(f.attempt, "stopped");
  assert.equal(f.events.length, 4); assert.equal(f.attempt.record.status, "abandoned");
  for (const event of f.events) {
    assert.equal(isAnalyticsEnvelope({ schemaVersion: 1, name: event.name, payload: event.payload, anonymousId: "synthetic-user-123", platform: "web" }), true);
    assert.equal(event.payload && "session_id" in event.payload ? event.payload.session_id : undefined, f.attempt.seed.id);
    assert.doesNotMatch(JSON.stringify(event), /rawTrigger|privateNote|feedbackNote/);
  }
});
test("late feedback consent does not invent start or completion funnel events", () => {
  const f = fixture(); f.advance(60000); endAttempt(f.attempt, "completed");
  saveAttemptFeedback(f.attempt, { shareAnonymous: true }); saveAttemptFeedback(f.attempt, { shareAnonymous: true });
  assert.deepEqual(f.events.map(e => e.name), ["after_check_saved"]);
  const payload = f.events[0].payload as AnalyticsEvents["after_check_saved"];
  assert.equal(payload.result, "unreported"); assert.equal(payload.activation_change_bucket, "unreported");
  assert.equal(payload.reuse_intent, "unreported"); assert.equal(payload.grounded_action_id, "");
});
test("anonymous event schema rejects raw text, unknown fields and malformed attempt ids", () => {
  const base = {schemaVersion:1,name:"practice_started",anonymousId:"synthetic-user-123",platform:"web",payload:{method_id:"inner-cinema",duration_bucket:1,source:"offline"}};
  assert.equal(isAnalyticsEnvelope(base), true);
  assert.equal(isAnalyticsEnvelope({...base,payload:{...base.payload,rawTrigger:"private"}}), false);
  assert.equal(isAnalyticsEnvelope({...base,payload:{...base.payload,session_id:"private text"}}), false);
});
test("storage exceptions never need a retry to end a practice", () => {
  let calls = 0;
  const storage = { getItem: () => { throw Error("unavailable"); }, setItem: () => { calls++; throw Error("quota"); } };
  assert.deepEqual(readStoredArray(storage, "test", isPracticeSession), []);
  assert.equal(writeStoredJson(storage, "test", []), false); assert.equal(calls, 1);
  const f = fixture(); f.attempt.ports.save = () => false; f.advance(8000);
  assert.doesNotThrow(() => endAttempt(f.attempt, "stopped"));
  assert.equal(f.attempt.savedLocally, false); assert.equal(f.attempt.ended, true);
});
test("manual and URL choices obey the same eligibility as recommendations", () => {
  const base: RoutingInput = {activation:5,mode:"impulsive",duration:1,outcome:"pause",scope:"library",eyesOpenPreferred:true};
  assert.equal(canStartMethod("inner-cinema", base), false);
  assert.equal(canStartMethod("paced-breath", {...base,breathChangeAllowed:false}), false);
  assert.equal(canStartMethod("body-scan", {...base,duration:5,bodyFocusAllowed:false}), false);
  assert.equal(canStartMethod("logout-pause", {...base,safety:{cannotStaySafe:true}}), false);
  assert.equal(canStartMethod("grounded-action", {...base,hiddenMethodIds:["grounded-action"]}), false);
  assert.equal(recommendMethods({...base,hiddenMethodIds:METHOD_IDS}).kind, "support");
  assert.equal(canStartMethod("logout-pause", base), true);
});
test("navigation keeps opt-outs but URLs never opt in to analytics", () => {
  const options = practiceOptionsFromQuery(new URLSearchParams("body=0&breath=0&eyes=1&shareAnonymous=true"));
  assert.equal(options.bodyFocusAllowed, false); assert.equal(options.breathChangeAllowed, false);
  assert.equal(options.eyesOpenPreferred, true); assert.equal(options.shareAnonymous, false);
  assert.equal(readPracticeOptions('{"shareAnonymous":"true"}').shareAnonymous, false);
  assert.equal(readPracticeOptions("invalid").shareAnonymous, false);
});
test("202 accepted:false, malformed responses and server errors are not stored events", async () => {
  assert.equal(await eventWasAccepted(Response.json({accepted:false,reason:"not-configured"},{status:202})), false);
  assert.equal(await eventWasAccepted(Response.json({accepted:true},{status:202})), true);
  assert.equal(await eventWasAccepted(new Response("invalid",{status:202})), false);
  assert.equal(await eventWasAccepted(Response.json({accepted:true},{status:500})), false);
});
test("legacy sessions still load; new duration metadata is validated", () => {
  const f=fixture(); f.advance(8000); const current=endAttempt(f.attempt,"stopped");
  const legacy={...current}; delete legacy.plannedDurationSeconds; delete legacy.durationSource;
  assert.equal(isPracticeSession(legacy),true);
  assert.equal(isPracticeSession({...current,plannedDurationSeconds:2}),false);
  assert.equal(isPracticeSession({...current,activationAfter:7}),false);
});
