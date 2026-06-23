export type TimelinePosition = {
  complete: boolean;
  stepIndex: number;
  secondsLeft: number;
};

export function resolveTimelinePosition(steps: readonly { seconds: number }[], elapsedMs: number): TimelinePosition {
  if (steps.length === 0) return { complete: true, stepIndex: 0, secondsLeft: 0 };
  const elapsed = Math.max(0, elapsedMs);
  let cumulativeMs = 0;
  for (let index = 0; index < steps.length; index += 1) {
    cumulativeMs += Math.max(0, steps[index].seconds) * 1000;
    if (elapsed < cumulativeMs) {
      return { complete: false, stepIndex: index, secondsLeft: Math.max(1, Math.ceil((cumulativeMs - elapsed) / 1000)) };
    }
  }
  return { complete: true, stepIndex: steps.length - 1, secondsLeft: 0 };
}
