// Presentation choices are independent of the session clock and self-reported outcomes.
export const OBSERVER_LENSES = [
  { id: "role", label: "近一点", hint: "先把这句话放在这里。", width: 100 },
  { id: "audience", label: "退远一点", hint: "留一点距离，仍然看着同一句话。", width: 82 },
  { id: "witness", label: "再远一点", hint: "也可以注意到画面周围的空间。", width: 66 },
] as const;

export function observationText(trigger: string): string {
  return trigger.trim() || "有一个念头";
}

export function observerFrame(sentence: string, name = ""): string {
  if (!sentence.trim()) return "";
  return `${name.trim() || "我"}注意到，脑中出现了这样一句话：「${sentence}」`;
}
