import { isStateMode, reportedActivation, type ActivationLevel, type StateMode } from "@stillmind/domain";
import { readPracticeOptions, type PracticeOptions } from "./practice-options";

export const PENDING_RESET_DRAFT_KEY = "stillmind.pendingResetDraft.v1";
type InputMethod = "typed" | "dictation" | "example" | "state-only";
export type ResetDraft = {
  id: string;
  trigger: string;
  mode: StateMode;
  activation?: ActivationLevel;
  inputMethod: InputMethod;
  options: PracticeOptions;
};

export function browserSessionStorage(): Storage | undefined {
  try { return typeof window === "undefined" ? undefined : window.sessionStorage; }
  catch { return undefined; }
}

export function storeResetDraft(storage: Pick<Storage, "setItem"> | undefined, draft: ResetDraft): boolean {
  try {
    if (!storage) return false;
    storage.setItem(PENDING_RESET_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch { return false; }
}

export function consumeResetDraft(storage: Pick<Storage, "getItem" | "removeItem"> | undefined, id: string): ResetDraft | undefined {
  try {
    if (!storage) return undefined;
    const raw = storage.getItem(PENDING_RESET_DRAFT_KEY);
    // Failed removal must not let a refreshed URL replay private text or consent.
    storage.removeItem(PENDING_RESET_DRAFT_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object") return undefined;
    const item = value as Record<string, unknown>;
    if (item.id !== id || typeof item.trigger !== "string" || item.trigger.length > 500 || !isStateMode(item.mode)
      || !["typed", "dictation", "example", "state-only"].includes(String(item.inputMethod))) return undefined;
    return { id, trigger: item.trigger, mode: item.mode, activation: reportedActivation(item.activation),
      inputMethod: item.inputMethod as InputMethod, options: readPracticeOptions(JSON.stringify(item.options)) };
  } catch { return undefined; }
}
