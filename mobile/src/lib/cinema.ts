import Constants from "expo-constants";
import type { PracticeVariant } from "@stillmind/content";

export type CinemaPayload = {
  title: string;
  innerNoise: string[];
  scenes: { label: string; line: string }[];
  roleView: string;
  audienceView: string;
  witnessView: string;
};

export type CinemaResult = { cinema: CinemaPayload; source: "preset" | "stepfun" };

function isCinemaPayload(value: unknown): value is CinemaPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CinemaPayload>;
  return typeof item.title === "string" && Array.isArray(item.scenes) && item.scenes.length >= 2 && item.scenes.every((scene) => typeof scene?.label === "string" && typeof scene?.line === "string") && Array.isArray(item.innerNoise) && item.innerNoise.every((line) => typeof line === "string") && typeof item.roleView === "string" && typeof item.audienceView === "string" && typeof item.witnessView === "string";
}

export async function requestCinema(trigger: string, timeoutMs = 3500): Promise<CinemaResult | undefined> {
  const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof baseUrl !== "string" || !trigger.trim()) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/cinema`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: trigger.trim().slice(0, 500) }),
      signal: controller.signal,
    });
    if (!response.ok) return undefined;
    const data = await response.json() as { cinema?: unknown; source?: unknown };
    if (!isCinemaPayload(data.cinema)) return undefined;
    return { cinema: data.cinema, source: data.source === "stepfun" ? "stepfun" : "preset" };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export function cinemaToPractice(result: CinemaResult): PracticeVariant {
  const sceneSeconds = Math.floor(42 / Math.max(result.cinema.scenes.length, 1));
  return {
    id: `inner-cinema-live-${Date.now()}`,
    methodId: "inner-cinema",
    contentVersion: "1.0.0",
    minutes: 1,
    title: `《${result.cinema.title}》`,
    subtitle: result.source === "stepfun" ? "StepFun 实时分镜" : "稳定分镜",
    preparation: "这是一副观看镜头，不是对你的分析。",
    steps: [
      ...result.cinema.scenes.slice(0, 3).map((scene, index) => ({ id: `scene-${index + 1}`, kind: "observe" as const, title: scene.label, instruction: scene.line, seconds: sceneSeconds, haptic: "soft" as const })),
      { id: "audience", kind: "observe" as const, title: "观众席", instruction: result.cinema.audienceView, seconds: 10, haptic: "soft" as const },
      { id: "return", kind: "close" as const, title: "离开银幕", instruction: result.cinema.witnessView, seconds: 8, haptic: "soft" as const },
    ],
    closing: "电影仍然存在，但你不必继续出演。",
  };
}
