import type { StateMode } from "@stillmind/domain";

export const PENDING_TRIGGER_KEY = "stillmind.pendingTrigger.v1";
export const PENDING_MODE_KEY = "stillmind.pendingMode.v1";
export const PENDING_INTENSITY_KEY = "stillmind.pendingIntensity.v1";

export const RESET_MODE_LABELS: Record<StateMode, string> = {
  impulsive: "想立刻反击",
  looping: "脑子在重播",
  tense: "身体很紧",
  hurt: "被一句话刺到",
  numb: "有点断开",
  curious: "想长期练习",
};

export function isStateMode(value: string | null | undefined): value is StateMode {
  return (
    value === "impulsive" ||
    value === "looping" ||
    value === "tense" ||
    value === "hurt" ||
    value === "numb" ||
    value === "curious"
  );
}

export function detectStateModeFromText(input: string): StateMode {
  const text = input.trim().toLowerCase();
  if (!text) return "looping";

  if (/反击|怼|吵|冲突|争执|证明|辩解|攻击|批评|指责|不服|不能输|被怼|被骂/.test(text)) {
    return "impulsive";
  }

  if (/重播|停不下来|想太多|过度思考|反复|脑子|循环|一直想|睡不着|内耗|翻来覆去/.test(text)) {
    return "looping";
  }

  if (/紧|胸闷|心跳|发抖|身体|肩|胃|呼吸|压力|焦虑|绷住|僵/.test(text)) {
    return "tense";
  }

  if (/刺|受伤|委屈|难过|失望|忽视|不理|没回|冷淡|羞耻|心酸|被否定/.test(text)) {
    return "hurt";
  }

  if (/麻|空|断开|没感觉|恍惚|迟钝|木|发呆|飘|不真实/.test(text)) {
    return "numb";
  }

  if (/练习|长期|成长|觉察|专注|稳定|意识|沉寂|小我|方法/.test(text)) {
    return "curious";
  }

  return "looping";
}

