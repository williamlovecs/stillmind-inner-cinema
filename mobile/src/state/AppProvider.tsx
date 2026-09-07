import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { MethodId, PracticeSession } from "@stillmind/domain";
import { deleteAllSessions as clearStoredSessions, deleteSession as removeStoredSession, loadSessions, saveSession } from "@/storage/database";
import { DEFAULT_PREFERENCES, normalizePreferences, type Preferences } from "@/state/preferences";
import { configureAnalytics, track } from "@/lib/analytics";
import { createSerialTaskQueue } from "@/lib/serial-tasks";
import { clearAnonymousAnalyticsIdentity, sendAnonymousAnalytics } from "@/lib/analytics-sink";

export type { Preferences } from "@/state/preferences";

export type ResetDraft = {
  trigger: string;
  inputMethod: "typed" | "dictation" | "example" | "state-only";
};

const PREFS_KEY = "stillmind.preferences.v1";

type AppContextValue = {
  ready: boolean;
  preferences: Preferences;
  sessions: PracticeSession[];
  pendingResetDraft?: ResetDraft;
  setPendingResetDraft: (draft?: ResetDraft) => void;
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>;
  addSession: (session: PracticeSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  toggleFavorite: (id: MethodId) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [storageQueue] = useState(createSerialTaskQueue);
  const knownSessionIds = useRef(new Set<string>());
  const deletedSessionIds = useRef(new Set<string>());
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const preferencesRef = useRef(DEFAULT_PREFERENCES);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [pendingResetDraft, setPendingResetDraft] = useState<ResetDraft>();

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(PREFS_KEY), loadSessions()]).then(([rawPreferences, storedSessions]) => {
      if (!active) return;
      if (rawPreferences) {
        try {
          const normalized = normalizePreferences(JSON.parse(rawPreferences));
          preferencesRef.current = normalized;
          setPreferences(normalized);
        } catch { /* keep safe defaults */ }
      }
      storedSessions.forEach(session => knownSessionIds.current.add(session.id));
      setSessions(storedSessions);
      setReady(true);
    }).catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || !preferences.anonymousAnalyticsEnabled) {
      configureAnalytics(undefined);
      return;
    }
    configureAnalytics(sendAnonymousAnalytics);
    return () => configureAnalytics(undefined);
  }, [preferences.anonymousAnalyticsEnabled, ready]);

  const updatePreferences = useCallback(async (patch: Partial<Preferences>) => {
    const next = { ...preferencesRef.current, ...patch };
    preferencesRef.current = next;
    if (!next.anonymousAnalyticsEnabled) configureAnalytics(undefined);
    setPreferences(next);
    await storageQueue.run(() => AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)));
  }, [storageQueue]);

  const addSession = useCallback(async (session: PracticeSession) => {
    if (!preferencesRef.current.historyEnabled || deletedSessionIds.current.has(session.id)) return;
    knownSessionIds.current.add(session.id);
    setSessions(current => [session, ...current.filter(item => item.id !== session.id)]);
    await storageQueue.run(async () => {
      if (!preferencesRef.current.historyEnabled || deletedSessionIds.current.has(session.id)) return;
      await saveSession(session);
    });
  }, [storageQueue]);

  const deleteSession = useCallback(async (id: string) => {
    // A pending finish/feedback write cannot resurrect a deleted attempt.
    deletedSessionIds.current.add(id);
    setSessions(current => current.filter(item => item.id !== id));
    await storageQueue.run(() => removeStoredSession(id));
    track("data_deleted", { scope: "session" });
  }, [storageQueue]);

  const deleteAllData = useCallback(async () => {
    knownSessionIds.current.forEach(id => deletedSessionIds.current.add(id));
    setSessions([]); setPendingResetDraft(undefined);
    preferencesRef.current = DEFAULT_PREFERENCES;
    setPreferences(DEFAULT_PREFERENCES); configureAnalytics(undefined);
    // Clear runs after any in-flight database mutation; future writes to old IDs are ignored.
    await storageQueue.run(async () => {
      await clearStoredSessions();
      await AsyncStorage.removeItem(PREFS_KEY);
      await clearAnonymousAnalyticsIdentity();
    });
  }, [storageQueue]);

  const toggleFavorite = useCallback(async (id: MethodId) => {
    const favorites = preferences.favoriteMethodIds.includes(id)
      ? preferences.favoriteMethodIds.filter((item) => item !== id)
      : [...preferences.favoriteMethodIds, id];
    await updatePreferences({ favoriteMethodIds: favorites });
    track("method_preference_changed", { method_id: id, preference: "favorite", enabled: favorites.includes(id) });
  }, [preferences.favoriteMethodIds, updatePreferences]);

  const value = useMemo(() => ({ ready, preferences, sessions, pendingResetDraft, setPendingResetDraft, updatePreferences, addSession, deleteSession, deleteAllData, toggleFavorite }), [ready, preferences, sessions, pendingResetDraft, updatePreferences, addSession, deleteSession, deleteAllData, toggleFavorite]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
