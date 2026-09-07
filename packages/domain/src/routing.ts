import { METHOD_CATALOG } from "./catalog";
import { isCoreResetMethod } from "./launch";
import { evaluateSafety } from "./safety";
import type { MethodDefinition, MethodId, Recommendation, RoutingInput } from "./types";

const MODE_LEADS: Record<RoutingInput["mode"], readonly MethodId[]> = {
  looping: ["inner-cinema", "thought-watching", "person-shift", "grounded-action"],
  tense: ["paced-breath", "wide-gaze", "body-scan", "logout-pause"],
  impulsive: ["logout-pause", "wide-gaze", "paced-breath", "grounded-action"],
  numb: ["grounded-action", "wide-gaze", "body-scan"],
  hurt: ["inner-cinema", "person-shift", "thought-watching", "release"],
  curious: ["open-awareness", "thought-watching", "body-scan", "anchors"],
};
const SUPPORT_COPY: Record<Exclude<ReturnType<typeof evaluateSafety>["reason"], "clear">, string> = {
  "medical-emergency": "StillMind 不是医疗工具。请立即联系当地急救服务或前往最近的急诊。",
  "immediate-danger": "先离开危险并联系当地紧急服务或可信任的人。StillMind 不能处理紧急情况。",
  "cannot-stay-safe": "请现在联系当地紧急服务、危机支持或一位能陪在你身边的可信任的人。",
  "diagnosis-request": "StillMind 不做诊断。你可以继续使用一般觉察练习，或联系合格专业人士获得评估。",
};
function methodAllowed(method: MethodDefinition, input: RoutingInput): boolean {
  if (input.scope === "reset" && !isCoreResetMethod(method.id)) return false;
  if (input.hiddenMethodIds?.includes(method.id)) return false;
  if (!method.durations.includes(input.duration)) return false;
  if (input.bodyFocusAllowed === false && method.bodyFocus) return false;
  if (input.breathChangeAllowed === false && method.breathChange) return false;
  if (input.eyesOpenPreferred && !method.eyesOpen) return false;
  if (input.activation >= 4 && !method.acuteEligible) return false;
  return true;
}
/** Use at the last start boundary too: choosing a card/URL is not permission to bypass preferences. */
export function canStartMethod(id: MethodId, input: RoutingInput): boolean {
  const method = METHOD_CATALOG.find((item) => item.id === id);
  return evaluateSafety(input.safety).allowed && Boolean(method && methodAllowed(method, input));
}
function scoreMethod(method: MethodDefinition, input: RoutingInput): number {
  let score = 0;
  const leadIndex = MODE_LEADS[input.mode].indexOf(method.id);
  if (leadIndex >= 0) score += 50 - leadIndex * 7;
  if (method.modes.includes(input.mode)) score += 24;
  if (method.outcomes.includes(input.outcome)) score += 18;
  if (input.activation >= 4 && method.acuteEligible) score += 18;
  if (input.eyesOpenPreferred && method.eyesOpen) score += 8;
  const history = input.history?.[method.id];
  if (history?.favorite) score += 10;
  score += Math.min(history?.betterCount ?? 0, 4) * 2;
  score -= Math.min(history?.worseOrStoppedCount ?? 0, 3) * 4;
  return score;
}
function explain(primary: MethodDefinition, input: RoutingInput): { explanation: string; reasonCodes: string[] } {
  const reasons: string[] = [`mode:${input.mode}`, `duration:${input.duration}`];
  if (input.scope === "reset") reasons.push("scope:reset");
  if (input.activation >= 4) reasons.push("high-activation");
  if (input.eyesOpenPreferred) reasons.push("eyes-open");
  if (input.history?.[primary.id]?.favorite) reasons.push("favorite");
  const modeCopy: Record<RoutingInput["mode"], string> = {
    looping: "念头正在反复重播", tense: "身体现在比较紧", impulsive: "你有立刻行动的冲动",
    numb: "你更像是和当下断开了一点", hurt: "这次触发带着关系里的受伤感", curious: "你现在有空间做更开放的观察",
  };
  const extra = input.activation >= 4 ? "先选少阅读、能随时停下的方式。" : "";
  return { explanation: `${modeCopy[input.mode]}，你有 ${input.duration} 分钟。先试试“${primary.title}”。${extra}`, reasonCodes: reasons };
}
export function recommendMethods(input: RoutingInput): Recommendation {
  const safety = evaluateSafety(input.safety);
  if (!safety.allowed) return { kind: "support", safety, explanation: SUPPORT_COPY[safety.reason] };
  const ranked = METHOD_CATALOG.filter((method) => methodAllowed(method, input))
    .map((method) => ({ method, score: scoreMethod(method, input) }))
    .sort((a, b) => b.score - a.score || a.method.id.localeCompare(b.method.id));
  const primary = ranked[0]?.method;
  // No candidate means no match, not permission to restore a hidden/ineligible default.
  if (!primary) return { kind: "support", safety, explanation: "当前时长和偏好下没有匹配的练习。可以调整时长，或直接结束；不需要取消你的边界。" };
  return { kind: "practice", primary, alternatives: ranked.slice(1, 3).map((entry) => entry.method), ...explain(primary, input) };
}
