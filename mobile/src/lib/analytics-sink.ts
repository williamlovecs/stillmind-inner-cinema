import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { AnalyticsEnvelope, AnalyticsEvent, AnalyticsPlatform } from "@stillmind/domain";

const ANONYMOUS_ID_KEY = "stillmind.analytics.id.v1";

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
  const existing = await AsyncStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
  const created = `sm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
  await AsyncStorage.setItem(ANONYMOUS_ID_KEY, created);
  return created;
}

export async function sendAnonymousAnalytics(event: AnalyticsEvent): Promise<void> {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) return;
  const envelope: AnalyticsEnvelope = { ...event, anonymousId: await anonymousId(), platform: platform() };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_500);
  try {
    await fetch(`${baseUrl}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function clearAnonymousAnalyticsIdentity(): Promise<void> {
  await AsyncStorage.removeItem(ANONYMOUS_ID_KEY);
}
