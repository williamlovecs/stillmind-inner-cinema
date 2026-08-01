import {
  clampActivation,
  detectStateModeFromText,
  isStateMode,
  legacyTenPointToActivation,
  type ActivationLevel,
  type StateMode,
} from "@stillmind/domain";

export const PENDING_TRIGGER_KEY = "stillmind.pendingTrigger.v1";
export const PENDING_MODE_KEY = "stillmind.pendingMode.v1";
export const PENDING_ACTIVATION_KEY = "stillmind.pendingActivation.v2";
export const PENDING_INPUT_METHOD_KEY = "stillmind.pendingInputMethod.v1";
// Read-only migration key for sessions started before the shared 1-5 scale.
export const PENDING_INTENSITY_KEY = "stillmind.pendingIntensity.v1";

export const RESET_MODE_LABELS: Record<StateMode, string> = {
  impulsive: "想立刻反击",
  looping: "脑子在重播",
  tense: "身体很紧",
  hurt: "被一句话刺到",
  numb: "有点断开",
  curious: "想长期练习",
};

export { detectStateModeFromText, isStateMode };

function parseIntensity(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function resolveResetIntensity(
  storedValue: string | null,
  queryValue: string | null,
  fallback: number,
): { value: number; supplied: boolean } {
  const incoming = parseIntensity(storedValue) ?? parseIntensity(queryValue);
  const value = incoming ?? fallback;
  return {
    value: Math.min(10, Math.max(0, value)),
    supplied: incoming !== undefined,
  };
}

export function resolveResetActivation(
  storedValue: string | null,
  queryValue: string | null,
  legacyStoredValue: string | null,
  legacyQueryValue: string | null,
  fallback: ActivationLevel,
): { value: ActivationLevel; supplied: boolean } {
  const current = parseIntensity(storedValue) ?? parseIntensity(queryValue);
  if (current !== undefined) return { value: clampActivation(current, fallback), supplied: true };
  const legacy = parseIntensity(legacyStoredValue) ?? parseIntensity(legacyQueryValue);
  if (legacy !== undefined) return { value: legacyTenPointToActivation(legacy, fallback), supplied: true };
  return { value: fallback, supplied: false };
}

