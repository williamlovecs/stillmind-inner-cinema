import { METHOD_IDS } from "./types";
import type { PracticeSession, SessionResult, StateMode } from "./types";
const MODES = new Set<StateMode>(["looping", "tense", "impulsive", "numb", "hurt", "curious"]);
const RESULTS = new Set<SessionResult>(["better", "same", "worse", "stopped"]);
const STATUSES = new Set<PracticeSession["status"]>(["completed", "stopped", "abandoned"]);
const METHODS = new Set<string>(METHOD_IDS);
const REUSE_INTENTS = new Set<NonNullable<PracticeSession["reuseIntent"]>>(["yes", "unsure", "no"]);
function optionalRating(value: unknown): boolean {
  return value === undefined || (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5);
}
export function isPracticeSession(value: unknown): value is PracticeSession {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PracticeSession>;
  return typeof item.id === "string" && item.id.length > 0 && item.schemaVersion === 1
    && typeof item.startedAt === "string" && Number.isFinite(Date.parse(item.startedAt))
    && typeof item.status === "string" && STATUSES.has(item.status as PracticeSession["status"])
    && typeof item.mode === "string" && MODES.has(item.mode as StateMode)
    && typeof item.methodId === "string" && METHODS.has(item.methodId)
    && typeof item.durationSeconds === "number" && Number.isFinite(item.durationSeconds) && item.durationSeconds >= 0
    && (item.plannedDurationSeconds === undefined || (Number.isFinite(item.plannedDurationSeconds) && item.plannedDurationSeconds >= item.durationSeconds))
    && (item.durationSource === undefined || item.durationSource === "active-clock")
    && optionalRating(item.activationBefore) && optionalRating(item.activationAfter)
    && (item.result === undefined || RESULTS.has(item.result))
    && (item.reuseIntent === undefined || REUSE_INTENTS.has(item.reuseIntent))
    && typeof item.contentVersion === "string"
    && (item.rawTrigger === undefined || (typeof item.rawTrigger === "string" && item.rawTrigger.length <= 5000))
    && (item.privateNote === undefined || (typeof item.privateNote === "string" && item.privateNote.length <= 20000));
}
export function validPracticeSessions(values: unknown): PracticeSession[] {
  return Array.isArray(values) ? values.filter(isPracticeSession) : [];
}
