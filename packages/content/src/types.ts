import type { DurationMinutes, MethodId } from "@stillmind/domain";

export type PracticeStepKind = "arrive" | "notice" | "breathe" | "observe" | "choose" | "close";

export type PracticeStep = {
  id: string;
  kind: PracticeStepKind;
  title: string;
  instruction: string;
  seconds: number;
  haptic?: "soft" | "breath" | "none";
  alternative?: string;
};

export type PracticeVariant = {
  id: string;
  methodId: MethodId;
  // 1.0.0 keeps existing offline scripts; 1.1.0 records the revised generated-session contract.
  contentVersion: "1.0.0" | "1.1.0";
  minutes: DurationMinutes;
  title: string;
  subtitle: string;
  preparation: string;
  steps: readonly PracticeStep[];
  closing: string;
};
