import type { AnalyticsEvent, AnalyticsEventName, AnalyticsEvents, WeeklyNextStepReason } from "@stillmind/domain";

export type { AnalyticsEvent, AnalyticsEventName, AnalyticsEvents, WeeklyNextStepReason } from "@stillmind/domain";

type AnalyticsSink = (event: AnalyticsEvent) => void | Promise<void>;
let sink: AnalyticsSink | undefined;

export function configureAnalytics(nextSink?: AnalyticsSink) {
  sink = nextSink;
}

export function track<Name extends AnalyticsEventName>(name: Name, payload: AnalyticsEvents[Name]) {
  if (!sink) return;
  const event = { schemaVersion: 1, name, payload } as AnalyticsEvent;
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
