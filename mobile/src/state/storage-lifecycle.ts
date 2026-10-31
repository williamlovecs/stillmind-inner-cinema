import type { PracticeSession } from "@stillmind/domain";
import { DEFAULT_PREFERENCES, normalizePreferences, type Preferences } from "./preferences";

type BootstrapPorts = {
  loadPreferences: () => Promise<string | null>;
  loadSessions: () => Promise<PracticeSession[]>;
};

export async function loadAppState(ports: BootstrapPorts) {
  const [settings, history] = await Promise.allSettled([
    Promise.resolve().then(ports.loadPreferences),
    Promise.resolve().then(ports.loadSessions),
  ]);
  let preferences: Preferences = { ...DEFAULT_PREFERENCES };
  let notice: string | undefined;
  try {
    if (settings.status === "rejected") throw settings.reason;
    if (settings.value) {
      const saved: unknown = JSON.parse(settings.value);
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Invalid saved preferences");
      preferences = normalizePreferences(saved);
    }
  } catch {
    // Unknown saved choices must not silently turn history or optional features back on.
    preferences = { ...DEFAULT_PREFERENCES, historyEnabled: false, eyesOpenPreferred: true,
      bodyFocusAllowed: false, breathChangeAllowed: false, hapticsEnabled: false };
    notice = "本机设置暂未读取，当前先使用不保存历史的基础设置。";
  }
  if (history.status === "rejected") {
    notice = notice ?? "本机历史暂未读取；已保存的练习偏好仍会生效。";
  }
  return { preferences, sessions: history.status === "fulfilled" ? history.value : [], notice };
}

type DeletionPorts = {
  cancelReminders: () => Promise<unknown>;
  clearSessions: () => Promise<unknown>;
  clearPreferences: () => Promise<unknown>;
  clearAnalyticsIdentity: () => Promise<unknown>;
};

export async function clearAppStorage(ports: DeletionPorts): Promise<void> {
  // Each independent resource is attempted even when another one is unavailable.
  const results = await Promise.allSettled(Object.values(ports).map(action => Promise.resolve().then(action)));
  const errors = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  if (errors.length) throw new AggregateError(errors.map(result => result.reason), "Local data deletion incomplete");
}
