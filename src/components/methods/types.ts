import type { MethodId } from "@stillmind/domain";

export type MethodInteractionProps = {
  methodId: MethodId;
  instruction: string;
  trigger: string;
  stepIndex: number;
};
