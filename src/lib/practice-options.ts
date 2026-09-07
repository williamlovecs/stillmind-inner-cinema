export const PENDING_PRACTICE_OPTIONS_KEY = "stillmind.pendingPracticeOptions.v1";
export type PracticeOptions = { eyesOpenPreferred: boolean; bodyFocusAllowed: boolean; breathChangeAllowed: boolean; shareAnonymous: boolean };
export const DEFAULT_PRACTICE_OPTIONS: PracticeOptions = { eyesOpenPreferred: true, bodyFocusAllowed: true, breathChangeAllowed: true, shareAnonymous: false };

/** These are optional product preferences, not a diagnosis or proof of suitability. */
export function readPracticeOptions(value: string | null): PracticeOptions {
  try {
    const parsed = value ? JSON.parse(value) : null;
    return {
      eyesOpenPreferred: parsed?.eyesOpenPreferred !== false,
      bodyFocusAllowed: parsed?.bodyFocusAllowed !== false,
      breathChangeAllowed: parsed?.breathChangeAllowed !== false,
      shareAnonymous: parsed?.shareAnonymous === true,
    };
  } catch { return { ...DEFAULT_PRACTICE_OPTIONS }; }
}

/** Only non-sensitive preferences travel in a URL; a link can never grant analytics consent. */
export function practiceOptionsFromQuery(params: { get: (key: string) => string | null }): PracticeOptions {
  return { eyesOpenPreferred: params.get("eyes") !== "0", bodyFocusAllowed: params.get("body") !== "0",
    breathChangeAllowed: params.get("breath") !== "0", shareAnonymous: false };
}
