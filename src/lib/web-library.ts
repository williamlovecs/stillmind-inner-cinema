import { isPracticeSession, METHOD_BY_ID, type DurationMinutes, type MethodDefinition, type MethodId, type PracticeFamily, type PracticeSession } from "@stillmind/domain";
import { browserLocalStorage, readStoredArray, writeStoredJson } from "@/lib/safe-storage";

export const WEB_SESSIONS_KEY = "stillmind.web.sessions.v1";
export const WEB_FAVORITES_KEY = "stillmind.web.favorites.v1";
export const WEB_LIBRARY_CHANGE_EVENT = "stillmind-library-change";

export type WebStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type MethodFilters = { family: "all" | PracticeFamily; duration: "all" | DurationMinutes; favoritesOnly: boolean };

export function loadWebSessions(storage: Pick<Storage, "getItem"> | undefined = browserLocalStorage()): PracticeSession[] {
  return readStoredArray(storage, WEB_SESSIONS_KEY, isPracticeSession)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

function isMethodId(value: unknown): value is MethodId {
  return typeof value === "string" && METHOD_BY_ID.has(value as MethodId);
}

export function loadWebFavorites(storage: Pick<Storage, "getItem"> | undefined = browserLocalStorage()): MethodId[] {
  return readStoredArray(storage, WEB_FAVORITES_KEY, isMethodId);
}

export function saveWebFavorites(favorites: readonly MethodId[], storage: Pick<Storage, "setItem"> | undefined = browserLocalStorage()): boolean {
  return writeStoredJson(storage, WEB_FAVORITES_KEY, [...new Set(favorites)]);
}

export function filterMethods(methods: readonly MethodDefinition[], filters: MethodFilters, favorites: readonly MethodId[]): MethodDefinition[] {
  const favoriteSet = new Set(favorites);
  return methods.filter((method) =>
    (filters.family === "all" || method.family === filters.family) &&
    (filters.duration === "all" || method.durations.includes(filters.duration)) &&
    (!filters.favoritesOnly || favoriteSet.has(method.id)),
  );
}

const LOCAL_KEYS = [
  WEB_SESSIONS_KEY,
  WEB_FAVORITES_KEY,
  "stillmind.web.seedFeedback.v1",
  "stillmind-history-v1",
  "stillmind-disclaimer-ack-v1",
  "stillmind.analytics.anonymousId.v1",
] as const;
const SESSION_KEYS = [
  "stillmind.pendingResetDraft.v1",
  "stillmind.pendingPracticeOptions.v1",
  "stillmind.pendingTrigger.v1",
  "stillmind.pendingMode.v1",
  "stillmind.pendingActivation.v2",
  "stillmind.pendingInputMethod.v1",
  "stillmind.pendingIntensity.v1",
] as const;

export function clearStillMindBrowserData(local: Pick<Storage, "removeItem"> | undefined, session: Pick<Storage, "removeItem"> | undefined): { ok: boolean; failedKeys: string[] } {
  const failedKeys: string[] = [];
  for (const [storage, keys] of [[local, LOCAL_KEYS], [session, SESSION_KEYS]] as const) {
    for (const key of keys) {
      try {
        if (!storage) throw new Error("Storage unavailable");
        storage.removeItem(key);
      } catch { failedKeys.push(key); }
    }
  }
  return { ok: failedKeys.length === 0, failedKeys };
}
