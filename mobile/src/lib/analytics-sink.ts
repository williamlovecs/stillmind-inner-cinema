import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { AnalyticsEnvelope, AnalyticsEvent, AnalyticsPlatform } from "@stillmind/domain";

const ANONYMOUS_ID_KEY = "stillmind.analytics.id.v1";
let identityTask: Promise<string> | undefined;
let identityGeneration = 0;

function apiBaseUrl(): string | undefined {
  const value = process.env.EXPO_PUBLIC_STILLMIND_API_BASE_URL?.trim();
  return value ? value.replace(/\/$/, "") : undefined;
}

function platform(): AnalyticsPlatform {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

async function anonymousId(): Promise<string> {
  if (identityTask) return identityTask;
  const generation = identityGeneration;
  const task = (async () => {
    const existing = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const created = `sm_${Math.random().toString(36).slice(2, 14)}_${Math.random().toString(36).slice(2, 14)}`;
    if (generation !== identityGeneration) throw new Error("Analytics identity was cleared");
    await AsyncStorage.setItem(ANONYMOUS_ID_KEY, created);
    return created;
  })();
  identityTask = task;
  try { return await task; } finally { if (identityTask === task) identityTask = undefined; }
}

export async function sendAnonymousAnalytics(event: AnalyticsEvent): Promise<void> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) return;
  const generation = identityGeneration;
  const id = await anonymousId();
  if (generation !== identityGeneration) return;
  const envelope: AnalyticsEnvelope = { ...event, anonymousId: id, platform: platform() };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_500);
  try {
    const response = await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Analytics request was not accepted");
    const result = await response.json() as { accepted?: unknown };
    if (result.accepted !== true) throw new Error("Analytics sink is unavailable; event not stored");
  } finally {
    clearTimeout(timeout);
  }
}

export async function clearAnonymousAnalyticsIdentity(): Promise<void> {
  identityGeneration += 1;
  await identityTask?.catch(() => undefined);
  await AsyncStorage.removeItem(ANONYMOUS_ID_KEY);
}
