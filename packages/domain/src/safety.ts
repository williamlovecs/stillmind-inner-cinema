import type { SafetyDecision, SafetyInput } from "./types";

// Lexical gate, not a diagnosis. Coverage includes the natural 的 phrasings and
// colloquial verbs ("没办法/保证不了") so asking for help in ordinary wording is caught.
const HIGH_RISK_LANGUAGE = /自杀|轻生|不想活|结束生命|伤害自己|杀死自己|(?:无法|不能|没(?:有)?办?法)保证(?:自己)?的?安全|保证不了(?:自己)?的?安全|suicid|kill myself|end my life|self[- ]?harm|hurt myself|can(?:not|'t) stay safe/i;

export function containsHighRiskLanguage(text: string): boolean {
  return HIGH_RISK_LANGUAGE.test(text);
}

export function evaluateSafety(input: SafetyInput = {}): SafetyDecision {
  if (input.medicalEmergency) {
    return { allowed: false, reason: "medical-emergency", action: "medical-help" };
  }
  if (input.immediateDanger) {
    return { allowed: false, reason: "immediate-danger", action: "external-support" };
  }
  if (input.cannotStaySafe) {
    return { allowed: false, reason: "cannot-stay-safe", action: "external-support" };
  }
  if (input.seekingDiagnosis) {
    return { allowed: false, reason: "diagnosis-request", action: "boundary-message" };
  }
  return { allowed: true, reason: "clear", action: "continue" };
}
