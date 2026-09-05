import {
  activationChange, elapsedBucket, elapsedPracticeMs, pausePracticeClock,
  startPracticeClock, sessionResult, reportedActivation,
  type ActivationLevel, type AnalyticsEventName, type AnalyticsEvents,
  type DurationMinutes, type MethodId, type PracticeClock, type PracticeSession, type StateMode,
} from "@stillmind/domain";

export type NativeSessionSeed = {
  id: string; mode: StateMode; methodId: MethodId; minutes: DurationMinutes;
  plannedDurationSeconds: number; contentVersion: string; activationBefore?: ActivationLevel;
  inputMethod: "typed" | "dictation" | "example" | "state-only";
  textProvided: boolean; consentAtStart: boolean; source: "offline" | "preset" | "stepfun";
};
export type NativeSessionPorts = {
  now: () => number; isoNow: () => string;
  save: (record: PracticeSession) => Promise<void>;
  emit: <N extends AnalyticsEventName>(name: N, payload: AnalyticsEvents[N]) => void;
};
export type NativeAttempt = {
  seed: NativeSessionSeed; ports: NativeSessionPorts; clock: PracticeClock;
  record: PracticeSession; ended: boolean; feedbackSaved: boolean;
  writes: Promise<void>; saveFailed: boolean;
};

/** Only explicitly confirmed query scores are self-reports. Legacy links remain routing hints. */
export function nativeReportedRating(value: unknown, confirmed: unknown): ActivationLevel | undefined {
  if (confirmed !== "1" || typeof value !== "string" || !/^[1-5]$/.test(value)) return undefined;
  return reportedActivation(Number(value));
}

function save(attempt: NativeAttempt) {
  const record = { ...attempt.record };
  // Serialize start/end/feedback so a slower start write cannot overwrite a later result.
  attempt.writes = attempt.writes.then(() => attempt.ports.save(record))
    .then(() => { attempt.saveFailed = false; }, () => { attempt.saveFailed = true; });
}

export function beginNativeAttempt(seed: NativeSessionSeed, ports: NativeSessionPorts): NativeAttempt {
  const attempt: NativeAttempt = {
    seed, ports, clock: startPracticeClock(ports.now()), ended: false, feedbackSaved: false,
    writes: Promise.resolve(), saveFailed: false,
    record: { id: seed.id, schemaVersion: 1, startedAt: ports.isoNow(), status: "abandoned",
      mode: seed.mode, methodId: seed.methodId, durationSeconds: 0,
      plannedDurationSeconds: seed.plannedDurationSeconds, durationSource: "active-clock",
      activationBefore: seed.activationBefore, contentVersion: seed.contentVersion },
  };
  save(attempt);
  if (seed.consentAtStart) {
    ports.emit("reset_entry_submitted", { session_id: seed.id, mode: seed.mode,
      activation_bucket: seed.activationBefore ?? "unreported", input_method: seed.inputMethod, text_provided: seed.textProvided });
    ports.emit("reset_started", { session_id: seed.id, mode: seed.mode,
      activation_bucket: seed.activationBefore ?? "unreported", duration_bucket: seed.minutes, method_id: seed.methodId });
    ports.emit("practice_started", { session_id: seed.id, method_id: seed.methodId, duration_bucket: seed.minutes, source: seed.source });
  }
  return attempt;
}

export function endNativeAttempt(attempt: NativeAttempt, status: PracticeSession["status"]): PracticeSession {
  if (attempt.ended) return attempt.record;
  attempt.clock = pausePracticeClock(attempt.clock, attempt.ports.now());
  const actual = Math.min(attempt.seed.plannedDurationSeconds, attempt.clock.elapsedMs / 1000);
  attempt.ended = true;
  attempt.record = { ...attempt.record, completedAt: attempt.ports.isoNow(), status,
    durationSeconds: actual, result: status === "stopped" ? "stopped" : undefined };
  save(attempt);
  if (attempt.seed.consentAtStart) attempt.ports.emit("practice_ended", {
    session_id: attempt.seed.id, method_id: attempt.seed.methodId, status,
    elapsed_bucket: elapsedBucket(actual, attempt.seed.plannedDurationSeconds),
  });
  return attempt.record;
}

type Feeling = "better" | "same" | "worse";
/** Keep the explicit feeling separately. Either discomfort signal makes the ending conservative. */
export function nativeFeedbackResult(before?: ActivationLevel, after?: ActivationLevel, feeling?: Feeling, stopped = false) {
  if (stopped) return "stopped" as const;
  const numeric = sessionResult(before, after);
  return numeric === "worse" || feeling === "worse" ? "worse" as const : feeling ?? numeric;
}

export function saveNativeFeedback(attempt: NativeAttempt, feedback: {
  activationAfter?: ActivationLevel; reportedResult?: Feeling;
  reuseIntent?: "yes" | "unsure" | "no"; groundedActionId?: string; shareAnonymous: boolean;
}): PracticeSession {
  if (!attempt.ended || attempt.feedbackSaved) return attempt.record;
  attempt.feedbackSaved = true;
  const result = nativeFeedbackResult(attempt.seed.activationBefore, feedback.activationAfter,
    feedback.reportedResult, attempt.record.status === "stopped");
  attempt.record = { ...attempt.record, activationAfter: feedback.activationAfter,
    reportedResult: feedback.reportedResult, result, reuseIntent: feedback.reuseIntent,
    groundedActionId: feedback.groundedActionId };
  save(attempt);
  if (feedback.shareAnonymous) attempt.ports.emit("after_check_saved", {
    session_id: attempt.seed.id, method_id: attempt.seed.methodId, result: result ?? "unreported",
    activation_change_bucket: activationChange(attempt.seed.activationBefore, feedback.activationAfter),
    grounded_action_id: feedback.groundedActionId ?? "", reuse_intent: feedback.reuseIntent ?? "unreported",
  });
  return attempt.record;
}

/** Cancel a late generation before it can restart a screen the user has already left. */
export function createRequestLifetime() {
  let current: AbortController | undefined;
  return {
    begin() {
      current?.abort();
      const controller = new AbortController(); current = controller;
      return { signal: controller.signal, isCurrent: () => current === controller && !controller.signal.aborted };
    },
    cancel() { current?.abort(); current = undefined; },
  };
}

export function activeNativeMs(attempt: NativeAttempt): number {
  return elapsedPracticeMs(attempt.clock, attempt.ports.now());
}
