import {
  activationChange, elapsedBucket, elapsedPracticeMs, pausePracticeClock,
  sessionResult, startPracticeClock,
  type ActivationLevel, type AnalyticsEventName, type AnalyticsEvents, type DurationMinutes,
  type MethodId, type PracticeClock, type PracticeSession, type SessionResult, type StateMode,
} from "@stillmind/domain";

export type NativeAttemptSeed = {
  id: string; mode: StateMode; methodId: MethodId; minutes: DurationMinutes;
  plannedDurationSeconds: number; contentVersion: string; activationBefore?: ActivationLevel;
  consentAtStart: boolean; source: "offline" | "preset" | "stepfun";
  inputMethod: "typed" | "dictation" | "example" | "state-only"; textProvided: boolean;
};
export type NativeAttemptPorts = {
  now: () => number; isoNow: () => string; save: (record: PracticeSession) => Promise<void>;
  emit: <N extends AnalyticsEventName>(name: N, payload: AnalyticsEvents[N]) => void;
  onStorageFailure?: () => void;
};
export type NativeAttempt = {
  seed: NativeAttemptSeed; ports: NativeAttemptPorts; clock: PracticeClock;
  record: PracticeSession; ended: boolean; feedbackSaved: boolean;
  persisted: Promise<void>; storageFailed: boolean;
};
function persist(attempt: NativeAttempt) {
  const snapshot = { ...attempt.record };
  // Start/end/feedback writes are serialized. A delayed start write must never overwrite the final record.
  attempt.persisted = attempt.persisted.then(() => attempt.ports.save(snapshot)).catch(() => {
    attempt.storageFailed = true;
    attempt.ports.onStorageFailure?.();
  });
}
export function beginNativeAttempt(seed: NativeAttemptSeed, ports: NativeAttemptPorts): NativeAttempt {
  const attempt: NativeAttempt = {
    seed, ports, clock: startPracticeClock(ports.now()), ended: false, feedbackSaved: false,
    persisted: Promise.resolve(), storageFailed: false,
    record: { id: seed.id, schemaVersion: 1, startedAt: ports.isoNow(), status: "abandoned",
      mode: seed.mode, methodId: seed.methodId, durationSeconds: 0,
      plannedDurationSeconds: seed.plannedDurationSeconds, durationSource: "active-clock",
      activationBefore: seed.activationBefore, contentVersion: seed.contentVersion },
  };
  persist(attempt);
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
  attempt.ended = true;
  const actual = Math.min(attempt.seed.plannedDurationSeconds, elapsedPracticeMs(attempt.clock, attempt.ports.now()) / 1000);
  attempt.record = { ...attempt.record, completedAt: attempt.ports.isoNow(), status,
    durationSeconds: actual, result: status === "stopped" ? "stopped" : undefined };
  persist(attempt);
  if (attempt.seed.consentAtStart) attempt.ports.emit("practice_ended", {
    session_id: attempt.seed.id, method_id: attempt.seed.methodId, status,
    elapsed_bucket: elapsedBucket(actual, attempt.seed.plannedDurationSeconds),
  });
  return attempt.record;
}
export function nativeFeedbackResult(before?: ActivationLevel, after?: ActivationLevel, stopped = false,
  reported?: Exclude<SessionResult, "stopped">): SessionResult | undefined {
  if (stopped) return "stopped";
  const change = sessionResult(before, after);
  // Never soften an explicit discomfort report or an increase in self-reported intensity.
  return reported === "worse" || change === "worse" ? "worse" : reported ?? change;
}
export function saveNativeFeedback(attempt: NativeAttempt, feedback: {
  activationAfter?: ActivationLevel; reportedResult?: Exclude<SessionResult, "stopped">;
  reuseIntent?: "yes" | "unsure" | "no"; groundedActionId?: string; shareAnonymous: boolean;
}): PracticeSession {
  if (!attempt.ended || attempt.feedbackSaved) return attempt.record;
  attempt.feedbackSaved = true;
  const result = nativeFeedbackResult(attempt.seed.activationBefore, feedback.activationAfter,
    attempt.record.status === "stopped", feedback.reportedResult);
  attempt.record = { ...attempt.record, activationAfter: feedback.activationAfter, result,
    reuseIntent: feedback.reuseIntent, groundedActionId: feedback.groundedActionId };
  persist(attempt);
  if (feedback.shareAnonymous) attempt.ports.emit("after_check_saved", {
    session_id: attempt.seed.id, method_id: attempt.seed.methodId, result: result ?? "unreported",
    activation_change_bucket: activationChange(attempt.seed.activationBefore, feedback.activationAfter),
    grounded_action_id: feedback.groundedActionId ?? "", reuse_intent: feedback.reuseIntent ?? "unreported",
  });
  return attempt.record;
}
