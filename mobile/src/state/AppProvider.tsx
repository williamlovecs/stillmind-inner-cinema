import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { MethodId, PracticeSession } from "@stillmind/domain";
import { deleteAllSessions as clearStoredSessions, deleteSession as removeStoredSession, loadSessions, saveSession } from "@/storage/database";
import { DEFAULT_PREFERENCES, type Preferences } from "@/state/preferences";
import { configureAnalytics, track } from "@/lib/analytics";
import { createSerialTaskQueue } from "@/lib/serial-tasks";
import { clearAnonymousAnalyticsIdentity, sendAnonymousAnalytics } from "@/lib/analytics-sink";
import { Platform } from "react-native";
import { clearAppStorage, loadAppState } from "@/state/storage-lifecycle";

export type { Preferences } from "@/state/preferences";

export type ResetDraft = {
  trigger: string;
  inputMethod: "typed" | "dictation" | "example" | "state-only";
};

const PREFS_KEY = "stillmind.preferences.v1";

type AppContextValue = {
  ready: boolean;
  storageNotice?: string;
  clearStorageNotice: () => void;
  preferences: Preferences;
  sessions: PracticeSession[];
  pendingResetDraft?: ResetDraft;
  setPendingResetDraft: (draft?: ResetDraft) => void;
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>;
  runReminderTask: (task: (current: Preferences) => Promise<void>) => Promise<void>;
  addSession: (session: PracticeSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  toggleFavorite: (id: MethodId) => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [storageQueue] = useState(createSerialTaskQueue);
  const [reminderQueue] = useState(createSerialTaskQueue);
  const knownSessionIds = useRef(new Set<string>());
  const deletedSessionIds = useRef(new Set<string>());
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string>();
  const clearStorageNotice = useCallback(() => setStorageNotice(undefined), []);
  const deletingRef = useRef(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const preferencesRef = useRef(DEFAULT_PREFERENCES);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [pendingResetDraft, setPendingResetDraft] = useState<ResetDraft>();

  useEffect(() => {
    let active = true;
    loadAppState({ loadPreferences: () => AsyncStorage.getItem(PREFS_KEY), loadSessions }).then((state) => {
      if (!active) return;
      preferencesRef.current = state.preferences;
      setPreferences(state.preferences);
      state.sessions.forEach(session => knownSessionIds.current.add(session.id));
      setSessions(state.sessions);
      setStorageNotice(state.notice);
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
    if (deletingRef.current) throw new Error("Data deletion in progress");
    const next = { ...preferencesRef.current, ...patch };
    preferencesRef.current = next;
    if (!next.anonymousAnalyticsEnabled) configureAnalytics(undefined);
    setPreferences(next);
    try {
      await storageQueue.run(() => AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)));
    } catch (error) {
      setStorageNotice("设置暂未保存。本次使用会遵守你的选择，下次打开可能需要重新设置。");
      throw error;
    }
  }, [storageQueue]);

  const runReminderTask = useCallback(async (task: (current: Preferences) => Promise<void>) => {
    if (deletingRef.current) throw new Error("Data deletion in progress");
    await reminderQueue.run(async () => {
      if (deletingRef.current) throw new Error("Data deletion in progress");
      await task(preferencesRef.current);
    });
  }, [reminderQueue]);

  const addSession = useCallback(async (session: PracticeSession) => {
    if (deletingRef.current || !preferencesRef.current.historyEnabled || deletedSessionIds.current.has(session.id)) return;
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
    if (deletingRef.current) return;
    deletingRef.current = true;
    knownSessionIds.current.forEach(id => deletedSessionIds.current.add(id));
    configureAnalytics(undefined);
    try {
      // OS permission prompts may return late; drain their updates before cancellation.
      await reminderQueue.run(async () => undefined);
      // Clear runs after in-flight writes; old attempts cannot resurrect removed records.
      await storageQueue.run(() => clearAppStorage({
        cancelReminders: async () => {
          if (Platform.OS !== "web") {
            const Notifications = await import("expo-notifications");
            await Notifications.cancelAllScheduledNotificationsAsync();
          }
        },
        clearSessions: clearStoredSessions,
        clearPreferences: () => AsyncStorage.removeItem(PREFS_KEY),
        clearAnalyticsIdentity: clearAnonymousAnalyticsIdentity,
      }));
      setSessions([]); setPendingResetDraft(undefined); setStorageNotice(undefined);
      preferencesRef.current = DEFAULT_PREFERENCES;
      setPreferences(DEFAULT_PREFERENCES);
    } catch (error) {
      setStorageNotice("清除未完成，部分数据或提醒可能仍保留。请稍后重试。");
      throw error;
    } finally { deletingRef.current = false; }
  }, [storageQueue, reminderQueue]);

  const toggleFavorite = useCallback(async (id: MethodId) => {
    const favorites = preferences.favoriteMethodIds.includes(id)
      ? preferences.favoriteMethodIds.filter((item) => item !== id)
      : [...preferences.favoriteMethodIds, id];
    await updatePreferences({ favoriteMethodIds: favorites });
    track("method_preference_changed", { method_id: id, preference: "favorite", enabled: favorites.includes(id) });
  }, [preferences.favoriteMethodIds, updatePreferences]);

  const value = useMemo(() => ({ ready, storageNotice, clearStorageNotice, preferences, sessions, pendingResetDraft, setPendingResetDraft, updatePreferences, runReminderTask, addSession, deleteSession, deleteAllData, toggleFavorite }), [ready, storageNotice, clearStorageNotice, preferences, sessions, pendingResetDraft, updatePreferences, runReminderTask, addSession, deleteSession, deleteAllData, toggleFavorite]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
