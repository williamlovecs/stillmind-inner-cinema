import { METHOD_IDS } from "./types";
import type { ActivationLevel, DurationMinutes, MethodId, PracticePathId, SessionResult, StateMode } from "./types";

export type AnalyticsPlatform = "web" | "ios" | "android";
export type WeeklyNextStepReason = "no-data" | "uneasy-signal" | "better-signal" | "repeated-mode" | "small-sample";
// Random per-attempt identifiers join actual start/end events. They contain no timestamps or text.
type AttemptEvent = { session_id?: string };
export type AnalyticsEvents = {
  onboarding_completed: { eyes_open: boolean; body_focus: boolean; breath_change: boolean };
  reset_entry_submitted: AttemptEvent & { mode: StateMode; activation_bucket: ActivationLevel | "unreported"; input_method: "typed" | "dictation" | "example" | "state-only"; text_provided: boolean };
  reset_started: AttemptEvent & { mode: StateMode; activation_bucket: ActivationLevel | "unreported"; duration_bucket: DurationMinutes; method_id: MethodId };
  practice_started: AttemptEvent & { method_id: MethodId; duration_bucket: DurationMinutes; source: "offline" | "preset" | "stepfun" };
  practice_ended: AttemptEvent & { method_id: MethodId; status: "completed" | "stopped" | "abandoned"; elapsed_bucket: "under_half" | "half_or_more" | "complete" };
  after_check_saved: AttemptEvent & { method_id: MethodId; result: SessionResult | "unreported"; activation_change_bucket: "down" | "same" | "up" | "unreported"; grounded_action_id: string; reuse_intent: "yes" | "unsure" | "no" | "unreported" };
  weekly_review_opened: { session_count_bucket: "0" | "1-2" | "3-6" | "7+"; has_average: boolean };
  weekly_next_step_started: { method_id: MethodId; duration_bucket: DurationMinutes; reason_code: WeeklyNextStepReason };
  practice_path_started: { path_id: PracticePathId; method_id: MethodId; duration_bucket: DurationMinutes };
  ai_requested: { feature: "inner-cinema"; consent_state: "enabled" };
  ai_completed: { feature: "inner-cinema"; source: "preset" | "stepfun" | "offline"; latency_bucket: "under_2s" | "2-4s" | "over_4s"; fallback_reason: "none" | "timeout" | "invalid" | "network" };
  data_exported: { format: "json" };
  data_deleted: { scope: "session" | "all" };
  safety_boundary_shown: { reason_code: "high-risk-language" | "user-request" };
  reminder_changed: { enabled: boolean; hour_bucket: "morning" | "midday" | "evening" | "night" };
  method_preference_changed: { method_id: MethodId; preference: "favorite" | "hidden"; enabled: boolean };
};
export type AnalyticsEventName = keyof AnalyticsEvents;
export type AnalyticsEvent<Name extends AnalyticsEventName = AnalyticsEventName> = { schemaVersion: 1; name: Name; payload: AnalyticsEvents[Name] };
export type AnalyticsEnvelope<Name extends AnalyticsEventName = AnalyticsEventName> = AnalyticsEvent<Name> & { anonymousId: string; platform: AnalyticsPlatform };
const METHOD_SET = new Set<string>(METHOD_IDS);
const STATE_MODES = new Set<string>(["looping", "tense", "impulsive", "numb", "hurt", "curious"]);
const RESULTS = new Set<string>(["better", "same", "worse", "stopped", "unreported"]);
const PATHS = new Set<string>(["pause-before-reply", "exit-inner-movie", "observer-foundation", "gentle-release"]);
function object(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort(); const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}
function attemptKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  if (!Object.prototype.hasOwnProperty.call(value, "session_id")) return exactKeys(value, keys);
  return typeof value.session_id === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(value.session_id) && exactKeys(value, [...keys, "session_id"]);
}
function oneOf<T extends string | number>(value: unknown, choices: readonly T[]): value is T { return choices.includes(value as T); }
function method(value: unknown): value is MethodId { return typeof value === "string" && METHOD_SET.has(value); }
function rating(value: unknown): boolean { return value === "unreported" || oneOf(value, [1, 2, 3, 4, 5]); }
function validatePayload(name: AnalyticsEventName, value: unknown): boolean {
  if (!object(value)) return false;
  switch (name) {
    case "onboarding_completed":
      return exactKeys(value, ["eyes_open", "body_focus", "breath_change"]) && typeof value.eyes_open === "boolean" && typeof value.body_focus === "boolean" && typeof value.breath_change === "boolean";
    case "reset_entry_submitted":
      return attemptKeys(value, ["mode", "activation_bucket", "input_method", "text_provided"]) && typeof value.mode === "string" && STATE_MODES.has(value.mode) && rating(value.activation_bucket) && oneOf(value.input_method, ["typed", "dictation", "example", "state-only"]) && typeof value.text_provided === "boolean";
    case "reset_started":
      return attemptKeys(value, ["mode", "activation_bucket", "duration_bucket", "method_id"]) && typeof value.mode === "string" && STATE_MODES.has(value.mode) && rating(value.activation_bucket) && oneOf(value.duration_bucket, [1, 3, 5, 10]) && method(value.method_id);
    case "practice_started":
      return attemptKeys(value, ["method_id", "duration_bucket", "source"]) && method(value.method_id) && oneOf(value.duration_bucket, [1, 3, 5, 10]) && oneOf(value.source, ["offline", "preset", "stepfun"]);
    case "practice_ended":
      return attemptKeys(value, ["method_id", "status", "elapsed_bucket"]) && method(value.method_id) && oneOf(value.status, ["completed", "stopped", "abandoned"]) && oneOf(value.elapsed_bucket, ["under_half", "half_or_more", "complete"]);
    case "after_check_saved":
      return attemptKeys(value, ["method_id", "result", "activation_change_bucket", "grounded_action_id", "reuse_intent"]) && method(value.method_id) && typeof value.result === "string" && RESULTS.has(value.result) && oneOf(value.activation_change_bucket, ["down", "same", "up", "unreported"]) && typeof value.grounded_action_id === "string" && value.grounded_action_id.length <= 80 && oneOf(value.reuse_intent, ["yes", "unsure", "no", "unreported"]);
    case "weekly_review_opened":
      return exactKeys(value, ["session_count_bucket", "has_average"]) && oneOf(value.session_count_bucket, ["0", "1-2", "3-6", "7+"]) && typeof value.has_average === "boolean";
    case "weekly_next_step_started":
      return exactKeys(value, ["method_id", "duration_bucket", "reason_code"]) && method(value.method_id) && oneOf(value.duration_bucket, [1, 3, 5, 10]) && oneOf(value.reason_code, ["no-data", "uneasy-signal", "better-signal", "repeated-mode", "small-sample"]);
    case "practice_path_started":
      return exactKeys(value, ["path_id", "method_id", "duration_bucket"]) && typeof value.path_id === "string" && PATHS.has(value.path_id) && method(value.method_id) && oneOf(value.duration_bucket, [1, 3, 5, 10]);
    case "ai_requested":
      return exactKeys(value, ["feature", "consent_state"]) && value.feature === "inner-cinema" && value.consent_state === "enabled";
    case "ai_completed":
      return exactKeys(value, ["feature", "source", "latency_bucket", "fallback_reason"]) && value.feature === "inner-cinema" && oneOf(value.source, ["preset", "stepfun", "offline"]) && oneOf(value.latency_bucket, ["under_2s", "2-4s", "over_4s"]) && oneOf(value.fallback_reason, ["none", "timeout", "invalid", "network"]);
    case "data_exported":
      return exactKeys(value, ["format"]) && value.format === "json";
    case "data_deleted":
      return exactKeys(value, ["scope"]) && oneOf(value.scope, ["session", "all"]);
    case "safety_boundary_shown":
      return exactKeys(value, ["reason_code"]) && oneOf(value.reason_code, ["high-risk-language", "user-request"]);
    case "reminder_changed":
      return exactKeys(value, ["enabled", "hour_bucket"]) && typeof value.enabled === "boolean" && oneOf(value.hour_bucket, ["morning", "midday", "evening", "night"]);
    case "method_preference_changed":
      return exactKeys(value, ["method_id", "preference", "enabled"]) && method(value.method_id) && oneOf(value.preference, ["favorite", "hidden"]) && typeof value.enabled === "boolean";
  }
  return false;
}
export function isAnalyticsEnvelope(value: unknown): value is AnalyticsEnvelope {
  if (!object(value) || value.schemaVersion !== 1 || typeof value.name !== "string") return false;
  if (!exactKeys(value, ["schemaVersion", "name", "payload", "anonymousId", "platform"])) return false;
  if (!oneOf(value.platform, ["web", "ios", "android"])) return false;
  if (typeof value.anonymousId !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(value.anonymousId)) return false;
  return validatePayload(value.name as AnalyticsEventName, value.payload);
}
