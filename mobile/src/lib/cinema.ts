import Constants from "expo-constants";
import { isCinemaPayload, type CinemaResult } from "./cinema-payload";
export { cinemaToPractice } from "./cinema-payload";
export type { CinemaPayload, CinemaResult } from "./cinema-payload";

// Server budget: 8.5s. Caller cancellation always wins over both live and fallback results.
export async function requestCinema(trigger: string, timeoutMs = 10_000, callerSignal?: AbortSignal): Promise<CinemaResult | undefined> {
  const baseUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof baseUrl !== "string" || !trigger.trim() || callerSignal?.aborted) return undefined;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  callerSignal?.addEventListener("abort", cancel, { once: true });
  const timeout = setTimeout(cancel, timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/cinema`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: trigger.trim().slice(0, 500) }), signal: controller.signal,
    });
    if (!response.ok || controller.signal.aborted) return undefined;
    const data = await response.json() as { cinema?: unknown; source?: unknown };
    if (controller.signal.aborted || !isCinemaPayload(data.cinema) || (data.source !== "stepfun" && data.source !== "preset")) return undefined;
    return { cinema: data.cinema, source: data.source };
  } catch { return undefined; }
  finally { clearTimeout(timeout); callerSignal?.removeEventListener("abort", cancel); }
}
