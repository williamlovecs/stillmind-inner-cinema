import type { MethodId } from "./types";

// The first-use reset deliberately routes through a small, legible set.
// All twelve methods remain available in the library and longer practice paths.
export const CORE_RESET_METHOD_IDS = [
  "inner-cinema",
  "paced-breath",
  "thought-watching",
  "wide-gaze",
  "logout-pause",
  "grounded-action",
] as const satisfies readonly MethodId[];

const CORE_RESET_METHOD_SET = new Set<MethodId>(CORE_RESET_METHOD_IDS);

export function isCoreResetMethod(methodId: MethodId): boolean {
  return CORE_RESET_METHOD_SET.has(methodId);
}
