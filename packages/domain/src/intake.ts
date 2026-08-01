import type { ActivationLevel, DesiredOutcome, StateMode } from "./types";

export type ResetStateProfile = {
  id: StateMode;
  label: string;
  shortLabel: string;
  outcome: DesiredOutcome;
  defaultActivation: ActivationLevel;
};

export const RESET_STATE_PROFILES: readonly ResetStateProfile[] = [
  { id: "impulsive", label: "想立刻反击", shortLabel: "想立刻回应", outcome: "pause", defaultActivation: 4 },
  { id: "looping", label: "脑子在重播", shortLabel: "想个不停", outcome: "distance", defaultActivation: 3 },
  { id: "tense", label: "身体很紧", shortLabel: "身体很紧", outcome: "settle", defaultActivation: 4 },
  { id: "hurt", label: "被一句话刺到", shortLabel: "关系里受伤", outcome: "release", defaultActivation: 3 },
  { id: "numb", label: "有点断开", shortLabel: "有点麻木", outcome: "choose", defaultActivation: 3 },
  { id: "curious", label: "想安静观察", shortLabel: "想安静观察", outcome: "awareness", defaultActivation: 2 },
] as const;

export const RESET_STATE_BY_MODE = new Map(RESET_STATE_PROFILES.map((profile) => [profile.id, profile]));

export function isStateMode(value: unknown): value is StateMode {
  return RESET_STATE_PROFILES.some((profile) => profile.id === value);
}

export function detectStateModeFromText(input: string): StateMode {
  const text = input.trim().toLowerCase();
  if (!text) return "looping";

  if (/反击|怼|吵|冲突|争执|证明|辩解|攻击|批评|指责|不服|不能输|被怼|被骂/.test(text)) return "impulsive";
  if (/重播|停不下来|想太多|过度思考|反复|脑子|循环|一直想|睡不着|内耗|翻来覆去/.test(text)) return "looping";
  if (/紧|胸闷|心跳|发抖|身体|肩|胃|呼吸|压力|焦虑|绷住|僵/.test(text)) return "tense";
  if (/刺|受伤|委屈|难过|失望|忽视|不理|没回|冷淡|羞耻|心酸|被否定/.test(text)) return "hurt";
  if (/麻|空|断开|没感觉|恍惚|迟钝|木|发呆|飘|不真实/.test(text)) return "numb";
  if (/练习|长期|成长|觉察|专注|稳定|意识|沉寂|小我|方法/.test(text)) return "curious";
  return "looping";
}

export function clampActivation(value: number, fallback: ActivationLevel = 3): ActivationLevel {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(5, Math.max(1, Math.round(value))) as ActivationLevel;
}

export function legacyTenPointToActivation(value: number, fallback: ActivationLevel = 3): ActivationLevel {
  if (!Number.isFinite(value)) return fallback;
  if (value <= 1) return 1;
  if (value <= 3) return 2;
  if (value <= 5) return 3;
  if (value <= 7) return 4;
  return 5;
}
