import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import { validPracticeSessions, type PracticeSession } from "@stillmind/domain";

const WEB_SESSIONS_KEY = "stillmind.sessions.v1";
let databasePromise: ReturnType<typeof SQLite.openDatabaseAsync> | undefined;

async function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync("stillmind.db");
  const db = await databasePromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      started_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return db;
}

export async function loadSessions(): Promise<PracticeSession[]> {
  if (Platform.OS === "web") {
    const raw = await AsyncStorage.getItem(WEB_SESSIONS_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return validPracticeSessions(parsed);
    } catch {
      return [];
    }
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ payload: string }>("SELECT payload FROM practice_sessions ORDER BY started_at DESC");
  return rows.flatMap((row) => {
    try { return validPracticeSessions([JSON.parse(row.payload)]); } catch { return []; }
  });
}

export async function saveSession(session: PracticeSession): Promise<void> {
  if (Platform.OS === "web") {
    const sessions = await loadSessions();
    const next = [session, ...sessions.filter((item) => item.id !== session.id)];
    await AsyncStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify(next));
    return;
  }
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO practice_sessions (id, started_at, payload) VALUES (?, ?, ?)",
    session.id,
    session.startedAt,
    JSON.stringify(session),
  );
}

export async function deleteSession(id: string): Promise<void> {
  if (Platform.OS === "web") {
    const sessions = await loadSessions();
    await AsyncStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify(sessions.filter((item) => item.id !== id)));
    return;
  }
  const db = await getDatabase();
  await db.runAsync("DELETE FROM practice_sessions WHERE id = ?", id);
}

export async function deleteAllSessions(): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(WEB_SESSIONS_KEY);
    return;
  }
  const db = await getDatabase();
  await db.runAsync("DELETE FROM practice_sessions");
}
