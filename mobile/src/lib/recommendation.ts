import type { MethodHistory, PracticeSession } from "@stillmind/domain";

export function buildMethodHistory(sessions: readonly PracticeSession[], favorites: readonly string[]): MethodHistory {
  const history: MethodHistory = {};
  for (const session of sessions) {
    const current = history[session.methodId] ?? {};
    current.completedCount = (current.completedCount ?? 0) + (session.status === "completed" ? 1 : 0);
    current.betterCount = (current.betterCount ?? 0) + (session.result === "better" ? 1 : 0);
    current.worseOrStoppedCount = (current.worseOrStoppedCount ?? 0) + (session.result === "worse" || session.result === "stopped" ? 1 : 0);
    history[session.methodId] = current;
  }
  for (const id of favorites) {
    const methodId = id as keyof MethodHistory;
    history[methodId] = { ...history[methodId], favorite: true };
  }
  return history;
}
