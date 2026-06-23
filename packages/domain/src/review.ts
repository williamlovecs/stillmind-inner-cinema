import type { PracticeSession, SessionResult, WeeklyReview } from "./types";

const EMPTY_RESULTS: Record<SessionResult, number> = { better: 0, same: 0, worse: 0, stopped: 0 };

export function buildWeeklyReview(sessions: readonly PracticeSession[], start: Date): WeeklyReview {
  const startTime = start.getTime();
  const end = new Date(startTime + 7 * 24 * 60 * 60 * 1000);
  const inRange = sessions.filter((session) => {
    const time = Date.parse(session.startedAt);
    return Number.isFinite(time) && time >= startTime && time < end.getTime();
  });

  const review: WeeklyReview = {
    start: start.toISOString(),
    end: end.toISOString(),
    sessions: inRange.length,
    completed: 0,
    results: { ...EMPTY_RESULTS },
    methodCounts: {},
    modeCounts: {},
  };
  const activationChanges: number[] = [];

  for (const session of inRange) {
    if (session.status === "completed") review.completed += 1;
    if (session.result) review.results[session.result] += 1;
    review.methodCounts[session.methodId] = (review.methodCounts[session.methodId] ?? 0) + 1;
    review.modeCounts[session.mode] = (review.modeCounts[session.mode] ?? 0) + 1;
    if (session.activationBefore && session.activationAfter) {
      activationChanges.push(session.activationBefore - session.activationAfter);
    }
  }

  if (activationChanges.length >= 2) {
    const total = activationChanges.reduce((sum, value) => sum + value, 0);
    review.averageActivationChange = Math.round((total / activationChanges.length) * 10) / 10;
  }
  return review;
}
