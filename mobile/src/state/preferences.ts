import { METHOD_IDS, type MethodId } from "@stillmind/domain";

export type Preferences = {
  schemaVersion: 1;
  onboardingComplete: boolean;
  historyEnabled: boolean;
  aiEnabled: boolean;
  eyesOpenPreferred: boolean;
  bodyFocusAllowed: boolean;
  breathChangeAllowed: boolean;
  hapticsEnabled: boolean;
  reminderEnabled: boolean;
  reminderHour: number;
  favoriteMethodIds: MethodId[];
  hiddenMethodIds: MethodId[];
};

export const DEFAULT_PREFERENCES: Preferences = {
  schemaVersion: 1,
  onboardingComplete: false,
  historyEnabled: true,
  aiEnabled: false,
  eyesOpenPreferred: false,
  bodyFocusAllowed: true,
  breathChangeAllowed: true,
  hapticsEnabled: true,
  reminderEnabled: false,
  reminderHour: 21,
  favoriteMethodIds: [],
  hiddenMethodIds: [],
};

const METHOD_SET = new Set<string>(METHOD_IDS);

function methodIds(value: unknown): MethodId[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is MethodId => typeof item === "string" && METHOD_SET.has(item)))]
    : [];
}

export function normalizePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object") return DEFAULT_PREFERENCES;
  const item = value as Record<string, unknown>;
  const boolean = (key: keyof Preferences) => typeof item[key] === "boolean" ? item[key] as boolean : DEFAULT_PREFERENCES[key] as boolean;
  return {
    schemaVersion: 1,
    onboardingComplete: boolean("onboardingComplete"),
    historyEnabled: boolean("historyEnabled"),
    aiEnabled: boolean("aiEnabled"),
    eyesOpenPreferred: boolean("eyesOpenPreferred"),
    bodyFocusAllowed: boolean("bodyFocusAllowed"),
    breathChangeAllowed: boolean("breathChangeAllowed"),
    hapticsEnabled: boolean("hapticsEnabled"),
    reminderEnabled: boolean("reminderEnabled"),
    reminderHour: Number.isInteger(item.reminderHour) && Number(item.reminderHour) >= 0 && Number(item.reminderHour) <= 23 ? Number(item.reminderHour) : DEFAULT_PREFERENCES.reminderHour,
    favoriteMethodIds: methodIds(item.favoriteMethodIds),
    hiddenMethodIds: methodIds(item.hiddenMethodIds),
  };
}
