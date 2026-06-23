import type { MethodId, SessionResult, StateMode } from "@stillmind/domain";

type DurationBucket = 1 | 3 | 5 | 10;

export type AnalyticsEvents = {
  onboarding_completed: { eyes_open: boolean; body_focus: boolean; breath_change: boolean };
  reset_started: { mode: StateMode; activation_bucket: 1 | 2 | 3 | 4 | 5; duration_bucket: DurationBucket; method_id: MethodId };
  practice_started: { method_id: MethodId; duration_bucket: DurationBucket; source: "offline" | "preset" | "stepfun" };
  practice_ended: { method_id: MethodId; status: "completed" | "stopped"; elapsed_bucket: "under_half" | "half_or_more" | "complete" };
  after_check_saved: { method_id: MethodId; result: SessionResult; activation_change_bucket: "down" | "same" | "up"; grounded_action_id: string };
  weekly_review_opened: { session_count_bucket: "0" | "1-2" | "3-6" | "7+"; has_average: boolean };
  weekly_next_step_started: { method_id: MethodId; duration_bucket: DurationBucket; reason_code: WeeklyNextStepReason };
  ai_requested: { feature: "inner-cinema"; consent_state: "enabled" };
  ai_completed: { feature: "inner-cinema"; source: "preset" | "stepfun" | "offline"; latency_bucket: "under_2s" | "2-4s" | "over_4s"; fallback_reason: "none" | "timeout" | "invalid" | "network" };
  data_exported: { format: "json" };
  data_deleted: { scope: "session" | "all" };
  safety_boundary_shown: { reason_code: "high-risk-language" | "user-request" };
  reminder_changed: { enabled: boolean; hour_bucket: "morning" | "midday" | "evening" | "night" };
  method_preference_changed: { method_id: MethodId; preference: "favorite" | "hidden"; enabled: boolean };
};

export type AnalyticsEventName = keyof AnalyticsEvents;
export type WeeklyNextStepReason = "no-data" | "uneasy-signal" | "better-signal" | "repeated-mode" | "small-sample";
export type AnalyticsEnvelope<Name extends AnalyticsEventName = AnalyticsEventName> = {
  name: Name;
  payload: AnalyticsEvents[Name];
  occurredAt: string;
};

type AnalyticsSink = (event: AnalyticsEnvelope) => void | Promise<void>;
let sink: AnalyticsSink | undefined;

export function configureAnalytics(nextSink?: AnalyticsSink) {
  sink = nextSink;
}

export function track<Name extends AnalyticsEventName>(name: Name, payload: AnalyticsEvents[Name]) {
  if (!sink) return;
  const event = { name, payload, occurredAt: new Date().toISOString() } as AnalyticsEnvelope;
  try {
    void Promise.resolve(sink(event)).catch(() => undefined);
  } catch {
    // Analytics must never interrupt a practice.
  }
}

export function sessionCountBucket(count: number): AnalyticsEvents["weekly_review_opened"]["session_count_bucket"] {
  if (count <= 0) return "0";
  if (count <= 2) return "1-2";
  if (count <= 6) return "3-6";
  return "7+";
}

export function reminderHourBucket(hour: number): AnalyticsEvents["reminder_changed"]["hour_bucket"] {
  if (hour < 11) return "morning";
  if (hour < 16) return "midday";
  if (hour < 21) return "evening";
  return "night";
}

export function weeklyNextStepReason(reasonCodes: readonly string[]): WeeklyNextStepReason {
  if (reasonCodes.includes("weekly:uneasy-signal")) return "uneasy-signal";
  if (reasonCodes.includes("weekly:better-signal")) return "better-signal";
  if (reasonCodes.includes("weekly:repeated-mode")) return "repeated-mode";
  if (reasonCodes.includes("weekly:small-sample")) return "small-sample";
  return "no-data";
}
