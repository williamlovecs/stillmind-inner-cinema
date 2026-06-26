import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWeeklyReview,
  buildPracticePathProgress,
  containsHighRiskLanguage,
  evaluateSafety,
  METHOD_BY_ID,
  METHOD_CATALOG,
  PRACTICE_PATHS,
  validPracticeSessions,
  recommendMethods,
  type DurationMinutes,
  type PracticeSession,
  type StateMode,
} from "../src/index";

test("high activation and impulsive mode prefer an acute eyes-open method", () => {
  const result = recommendMethods({
    activation: 5,
    mode: "impulsive",
    duration: 1,
    outcome: "pause",
    eyesOpenPreferred: true,
    bodyFocusAllowed: false,
    breathChangeAllowed: false,
  });
  assert.equal(result.kind, "practice");
  if (result.kind === "practice") assert.equal(result.primary.id, "logout-pause");
});

test("safety gate always wins over favorites", () => {
  const result = recommendMethods({
    activation: 2,
    mode: "looping",
    duration: 3,
    outcome: "distance",
    history: { "inner-cinema": { favorite: true, betterCount: 10 } },
    safety: { cannotStaySafe: true },
  });
  assert.equal(result.kind, "support");
});

test("medical emergency has highest safety priority", () => {
  assert.deepEqual(evaluateSafety({ medicalEmergency: true, immediateDanger: true }), {
    allowed: false,
    reason: "medical-emergency",
    action: "medical-help",
  });
});

test("high-risk language is detected before reflective exercises", () => {
  assert.equal(containsHighRiskLanguage("我现在无法保证自己安全"), true);
  assert.equal(containsHighRiskLanguage("I might hurt myself tonight"), true);
  assert.equal(containsHighRiskLanguage("我很生气，想先暂停回复"), false);
});

test("comfort constraints exclude body and breath practices", () => {
  const result = recommendMethods({
    activation: 3,
    mode: "tense",
    duration: 3,
    outcome: "settle",
    bodyFocusAllowed: false,
    breathChangeAllowed: false,
  });
  assert.equal(result.kind, "practice");
  if (result.kind !== "practice") return;
  for (const method of [result.primary, ...result.alternatives]) {
    assert.equal(method.bodyFocus, false);
    assert.equal(method.breathChange, false);
  }
});

test("eyes-open preference and high activation exclude ineligible methods", () => {
  const result = recommendMethods({
    activation: 4,
    mode: "hurt",
    duration: 3,
    outcome: "pause",
    eyesOpenPreferred: true,
  });
  assert.equal(result.kind, "practice");
  if (result.kind !== "practice") return;
  for (const method of [result.primary, ...result.alternatives]) {
    assert.equal(method.eyesOpen, true);
    assert.equal(method.acuteEligible, true);
  }
});

test("every supported mode and duration produces a known practice", () => {
  const modes: StateMode[] = ["looping", "tense", "impulsive", "numb", "hurt", "curious"];
  const durations: DurationMinutes[] = [1, 3, 5, 10];
  for (const mode of modes) {
    for (const duration of durations) {
      const result = recommendMethods({ activation: 2, mode, duration, outcome: "choose" });
      assert.equal(result.kind, "practice");
      if (result.kind === "practice") {
        assert.equal(METHOD_CATALOG.some((method) => method.id === result.primary.id), true);
      }
    }
  }
});

test("a favorite cannot bypass explicit method hiding", () => {
  const result = recommendMethods({
    activation: 2,
    mode: "looping",
    duration: 3,
    outcome: "distance",
    hiddenMethodIds: ["inner-cinema"],
    history: { "inner-cinema": { favorite: true, betterCount: 99 } },
  });
  assert.equal(result.kind, "practice");
  if (result.kind === "practice") {
    assert.notEqual(result.primary.id, "inner-cinema");
    assert.equal(result.alternatives.some((method) => method.id === "inner-cinema"), false);
  }
});

test("practice paths are complete, routable, and non-labeling", () => {
  assert.equal(PRACTICE_PATHS.length >= 3, true);
  for (const path of PRACTICE_PATHS) {
    assert.equal(path.stages.length >= 3, true);
    assert.equal(path.summary.includes("你是"), false);
    assert.equal(path.bestFor.includes("类型"), false);
    for (const stage of path.stages) {
      const method = METHOD_BY_ID.get(stage.methodId);
      assert.ok(method, `${path.id} references missing method ${stage.methodId}`);
      assert.equal(method.durations.includes(stage.duration), true, `${stage.methodId} must support ${stage.duration} minutes for ${path.id}`);
    }
    assert.equal(path.duration, path.stages[0]?.duration);
  }
});

test("practice path progress advances only through completed non-worse stages", () => {
  const path = PRACTICE_PATHS.find((item) => item.id === "exit-inner-movie");
  assert.ok(path);
  const sessions: PracticeSession[] = [
    weeklySession("a", "inner-cinema", "looping", "better"),
    weeklySession("b", "person-shift", "looping", "worse"),
    weeklySession("c", "thought-watching", "looping", "better"),
  ];
  const progress = buildPracticePathProgress(path, sessions);
  assert.equal(progress.completedStages, 1);
  assert.equal(progress.nextStage?.methodId, "person-shift");
  assert.deepEqual(progress.reasonCodes, ["path:in-progress", "stage:2"]);
});

test("practice path progress respects methods hidden by the user", () => {
  const path = PRACTICE_PATHS.find((item) => item.id === "observer-foundation");
  assert.ok(path);
  const sessions: PracticeSession[] = [weeklySession("a", "thought-watching", "curious", "better")];
  const progress = buildPracticePathProgress(path, sessions, ["open-awareness"]);
  assert.equal(progress.completedStages, 1);
  assert.equal(progress.nextStage, undefined);
  assert.equal(progress.blockedByHiddenMethod, true);
  assert.deepEqual(progress.reasonCodes, ["path:hidden-method", "method:open-awareness"]);
});

test("weekly review excludes sessions outside the interval and hides low-sample averages", () => {
  const sessions: PracticeSession[] = [
    {
      id: "a",
      schemaVersion: 1,
      startedAt: "2026-06-20T10:00:00.000Z",
      status: "completed",
      mode: "looping",
      methodId: "inner-cinema",
      durationSeconds: 60,
      activationBefore: 4,
      activationAfter: 2,
      result: "better",
      contentVersion: "1",
    },
    {
      id: "old",
      schemaVersion: 1,
      startedAt: "2026-06-01T10:00:00.000Z",
      status: "completed",
      mode: "tense",
      methodId: "paced-breath",
      durationSeconds: 60,
      result: "same",
      contentVersion: "1",
    },
  ];
  const review = buildWeeklyReview(sessions, new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(review.sessions, 1);
  assert.equal(review.results.better, 1);
  assert.equal(review.averageActivationChange, undefined);
});

test("weekly review ignores malformed dates and reports an average only with enough samples", () => {
  const base: Omit<PracticeSession, "id" | "startedAt" | "activationBefore" | "activationAfter"> = {
    schemaVersion: 1,
    status: "completed",
    mode: "tense",
    methodId: "paced-breath",
    durationSeconds: 60,
    result: "better",
    contentVersion: "1",
  };
  const sessions: PracticeSession[] = [
    { ...base, id: "a", startedAt: "2026-06-20T10:00:00.000Z", activationBefore: 5, activationAfter: 3 },
    { ...base, id: "b", startedAt: "2026-06-21T10:00:00.000Z", activationBefore: 4, activationAfter: 3 },
    { ...base, id: "bad", startedAt: "not-a-date", activationBefore: 5, activationAfter: 1 },
  ];
  const review = buildWeeklyReview(sessions, new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(review.sessions, 2);
  assert.equal(review.completed, 2);
  assert.equal(review.averageActivationChange, 1.5);
});

test("weekly review suggests the shortest pause when there is no data", () => {
  const review = buildWeeklyReview([], new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(review.nextStep.methodId, "logout-pause");
  assert.equal(review.nextStep.duration, 1);
  assert.deepEqual(review.nextStep.reasonCodes, ["weekly:no-data"]);
});

test("weekly review lowers intensity after repeated worse or stopped signals", () => {
  const base: Omit<PracticeSession, "id" | "startedAt" | "result"> = {
    schemaVersion: 1,
    status: "completed",
    mode: "looping",
    methodId: "inner-cinema",
    durationSeconds: 180,
    contentVersion: "1",
  };
  const sessions: PracticeSession[] = [
    { ...base, id: "a", startedAt: "2026-06-20T10:00:00.000Z", result: "worse" },
    { ...base, id: "b", startedAt: "2026-06-21T10:00:00.000Z", result: "stopped" },
    { ...base, id: "c", startedAt: "2026-06-22T10:00:00.000Z", result: "better" },
  ];
  const review = buildWeeklyReview(sessions, new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(review.nextStep.methodId, "logout-pause");
  assert.equal(review.nextStep.duration, 1);
  assert.equal(review.nextStep.reasonCodes.includes("weekly:uneasy-signal"), true);
  assert.equal(review.nextStep.body.includes("类型"), false);
});

test("weekly review continues a method after repeated better outcomes", () => {
  const sessions: PracticeSession[] = [
    weeklySession("a", "inner-cinema", "looping", "better"),
    weeklySession("b", "inner-cinema", "looping", "better"),
    weeklySession("c", "person-shift", "hurt", "same"),
    weeklySession("d", "inner-cinema", "looping", "same"),
  ];
  const review = buildWeeklyReview(sessions, new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(review.nextStep.methodId, "inner-cinema");
  assert.equal(review.nextStep.duration, 3);
  assert.equal(review.nextStep.reasonCodes.includes("weekly:better-signal"), true);
});

test("weekly review uses repeated mode as a next experiment without identity labels", () => {
  const sessions: PracticeSession[] = [
    weeklySession("a", "grounded-action", "impulsive", "same"),
    weeklySession("b", "grounded-action", "impulsive", "same"),
    weeklySession("c", "wide-gaze", "tense", "same"),
  ];
  const review = buildWeeklyReview(sessions, new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(review.nextStep.methodId, "logout-pause");
  assert.deepEqual(review.nextStep.reasonCodes, ["weekly:repeated-mode", "mode:impulsive"]);
  assert.equal(review.nextStep.body.includes("你是"), false);
});

test("stored-session validation drops malformed and unknown records", () => {
  const valid: PracticeSession = {
    id: "valid",
    schemaVersion: 1,
    startedAt: "2026-06-20T10:00:00.000Z",
    status: "completed",
    mode: "looping",
    methodId: "inner-cinema",
    durationSeconds: 60,
    result: "better",
    contentVersion: "1",
  };
  const sessions = validPracticeSessions([
    valid,
    { ...valid, id: "bad-method", methodId: "diagnose-me" },
    { ...valid, id: "bad-date", startedAt: "yesterday-ish" },
    { ...valid, id: "bad-rating", activationBefore: 9 },
    null,
  ]);
  assert.deepEqual(sessions, [valid]);
});

function weeklySession(id: string, methodId: PracticeSession["methodId"], mode: PracticeSession["mode"], result: PracticeSession["result"]): PracticeSession {
  const day = Number(id.charCodeAt(0) - 96);
  return {
    id,
    schemaVersion: 1,
    startedAt: `2026-06-${19 + day}T10:00:00.000Z`,
    status: "completed",
    mode,
    methodId,
    durationSeconds: 60,
    result,
    contentVersion: "1",
  };
}
