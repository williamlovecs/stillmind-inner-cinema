import {
  activationChange, elapsedBucket, elapsedPracticeMs, pausePracticeClock,
  sessionResult, startPracticeClock, type PracticeClock,
  type ActivationLevel, type AnalyticsEventName, type AnalyticsEvents,
  type DurationMinutes, type MethodId, type PracticeSession, type StateMode,
} from "@stillmind/domain";

export type AttemptSeed = {
  id: string;
  mode: StateMode;
  methodId: MethodId;
  minutes: DurationMinutes;
  plannedDurationSeconds: number;
  contentVersion: string;
  activationBefore?: ActivationLevel;
  inputMethod: "typed" | "dictation" | "example" | "state-only";
  textProvided: boolean;
  consentAtStart: boolean;
};
export type AttemptPorts = {
  now: () => number;
  isoNow: () => string;
  save: (record: PracticeSession) => boolean;
  emit: <N extends AnalyticsEventName>(name: N, payload: AnalyticsEvents[N]) => void;
};
export type PracticeAttempt = {
  seed: AttemptSeed;
  ports: AttemptPorts;
  clock: PracticeClock;
  record: PracticeSession;
  ended: boolean;
  feedbackSaved: boolean;
  savedLocally: boolean;
};

/** A started attempt is conservatively unfinished until an actual end event occurs. */
export function beginAttempt(seed: AttemptSeed, ports: AttemptPorts): PracticeAttempt {
  const record: PracticeSession = {
    id: seed.id, schemaVersion: 1, startedAt: ports.isoNow(), status: "abandoned",
    mode: seed.mode, methodId: seed.methodId, durationSeconds: 0,
    plannedDurationSeconds: seed.plannedDurationSeconds, durationSource: "active-clock",
    activationBefore: seed.activationBefore, contentVersion: seed.contentVersion,
  };
  const attempt: PracticeAttempt = {
    seed, ports, clock: startPracticeClock(ports.now()), record,
    ended: false, feedbackSaved: false, savedLocally: ports.save(record),
  };
  if (seed.consentAtStart) {
    ports.emit("reset_entry_submitted", { session_id: seed.id, mode: seed.mode,
      activation_bucket: seed.activationBefore ?? "unreported", input_method: seed.inputMethod,
      text_provided: seed.textProvided });
    ports.emit("reset_started", { session_id: seed.id, mode: seed.mode,
      activation_bucket: seed.activationBefore ?? "unreported", duration_bucket: seed.minutes, method_id: seed.methodId });
    ports.emit("practice_started", { session_id: seed.id, method_id: seed.methodId,
      duration_bucket: seed.minutes, source: "offline" });
  }
  return attempt;
}

/** Called from real lifecycle events, never from a React state updater. Idempotent on exit. */
export function endAttempt(attempt: PracticeAttempt, status: PracticeSession["status"]): PracticeSession {
  if (attempt.ended) return attempt.record;
  attempt.clock = pausePracticeClock(attempt.clock, attempt.ports.now());
  attempt.ended = true;
  const actual = Math.min(attempt.seed.plannedDurationSeconds, elapsedPracticeMs(attempt.clock, attempt.ports.now()) / 1000);
  attempt.record = { ...attempt.record, completedAt: attempt.ports.isoNow(), status,
    durationSeconds: actual, result: status === "stopped" ? "stopped" : undefined };
  attempt.savedLocally = attempt.ports.save(attempt.record);
  if (attempt.seed.consentAtStart) {
    attempt.ports.emit("practice_ended", { session_id: attempt.seed.id, method_id: attempt.seed.methodId,
      status, elapsed_bucket: elapsedBucket(actual, attempt.seed.plannedDurationSeconds) });
  }
  return attempt.record;
}

export function saveAttemptFeedback(attempt: PracticeAttempt, feedback: {
  activationAfter?: ActivationLevel;
  reuseIntent?: "yes" | "unsure" | "no";
  groundedActionId?: string;
  shareAnonymous: boolean;
}): PracticeSession {
  if (!attempt.ended || attempt.feedbackSaved) return attempt.record;
  attempt.feedbackSaved = true;
  const result = sessionResult(attempt.seed.activationBefore, feedback.activationAfter, attempt.record.status === "stopped");
  attempt.record = { ...attempt.record, activationAfter: feedback.activationAfter, result,
    reuseIntent: feedback.reuseIntent, groundedActionId: feedback.groundedActionId };
  attempt.savedLocally = attempt.ports.save(attempt.record);
  if (feedback.shareAnonymous) {
    // Late consent permits this feedback only. Never manufacture a past start event.
    attempt.ports.emit("after_check_saved", { session_id: attempt.seed.id, method_id: attempt.seed.methodId,
      result: result ?? "unreported", activation_change_bucket: activationChange(attempt.seed.activationBefore, feedback.activationAfter),
      grounded_action_id: feedback.groundedActionId ?? "", reuse_intent: feedback.reuseIntent ?? "unreported" });
  }
  return attempt.record;
}
