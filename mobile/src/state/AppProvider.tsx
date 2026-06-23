import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MethodId, PracticeSession } from "@stillmind/domain";
import { deleteAllSessions as clearStoredSessions, deleteSession as removeStoredSession, loadSessions, saveSession } from "@/storage/database";
import { DEFAULT_PREFERENCES, normalizePreferences, type Preferences } from "@/state/preferences";
import { track } from "@/lib/analytics";

export type { Preferences } from "@/state/preferences";

const PREFS_KEY = "stillmind.preferences.v1";

type AppContextValue = {
  ready: boolean;
  preferences: Preferences;
  sessions: PracticeSession[];
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>;
  addSession: (session: PracticeSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  toggleFavorite: (id: MethodId) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(PREFS_KEY), loadSessions()]).then(([rawPreferences, storedSessions]) => {
      if (!active) return;
      if (rawPreferences) {
        try { setPreferences(normalizePreferences(JSON.parse(rawPreferences))); } catch { /* keep safe defaults */ }
      }
      setSessions(storedSessions);
      setReady(true);
    }).catch(() => setReady(true));
    return () => { active = false; };
  }, []);

  const updatePreferences = useCallback(async (patch: Partial<Preferences>) => {
    let next = DEFAULT_PREFERENCES;
    setPreferences((current) => {
      next = { ...current, ...patch };
      return next;
    });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }, []);

  const addSession = useCallback(async (session: PracticeSession) => {
    if (!preferences.historyEnabled) return;
    setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
    await saveSession(session);
  }, [preferences.historyEnabled]);

  const deleteSession = useCallback(async (id: string) => {
    setSessions((current) => current.filter((item) => item.id !== id));
    await removeStoredSession(id);
    track("data_deleted", { scope: "session" });
  }, []);

  const deleteAllData = useCallback(async () => {
    setSessions([]);
    setPreferences(DEFAULT_PREFERENCES);
    await Promise.all([clearStoredSessions(), AsyncStorage.removeItem(PREFS_KEY)]);
    track("data_deleted", { scope: "all" });
  }, []);

  const toggleFavorite = useCallback(async (id: MethodId) => {
    const favorites = preferences.favoriteMethodIds.includes(id)
      ? preferences.favoriteMethodIds.filter((item) => item !== id)
      : [...preferences.favoriteMethodIds, id];
    await updatePreferences({ favoriteMethodIds: favorites });
    track("method_preference_changed", { method_id: id, preference: "favorite", enabled: favorites.includes(id) });
  }, [preferences.favoriteMethodIds, updatePreferences]);

  const value = useMemo(() => ({ ready, preferences, sessions, updatePreferences, addSession, deleteSession, deleteAllData, toggleFavorite }), [ready, preferences, sessions, updatePreferences, addSession, deleteSession, deleteAllData, toggleFavorite]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
