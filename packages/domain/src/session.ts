import type { ActivationLevel, PracticeSession, SessionResult } from "./types";

/** Active practice time only. Pausing is idempotent; no UI state updates live here. */
export type PracticeClock = { elapsedMs: number; runningSinceMs?: number };
export type TimelineStep = { seconds: number; kind?: string };

export function startPracticeClock(now: number): PracticeClock {
  return { elapsedMs: 0, runningSinceMs: now };
}
export function elapsedPracticeMs(clock: PracticeClock, now: number): number {
  const running = clock.runningSinceMs === undefined ? 0 : Math.max(0, now - clock.runningSinceMs);
  return Math.max(0, clock.elapsedMs + running);
}
export function pausePracticeClock(clock: PracticeClock, now: number): PracticeClock {
  return { elapsedMs: elapsedPracticeMs(clock, now) };
}
export function resumePracticeClock(clock: PracticeClock, now: number): PracticeClock {
  return clock.runningSinceMs === undefined ? { ...clock, runningSinceMs: now } : clock;
}
/** One absolute timeline drives the timer, scene and breathing cue; delayed ticks never add time. */
export function practicePosition(steps: readonly TimelineStep[], elapsedMs: number) {
  const totalSeconds = steps.reduce((sum, step) => sum + Math.max(0, step.seconds), 0);
  const elapsedSeconds = Math.min(totalSeconds, Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs / 1000 : 0));
  let offset = 0;
  let breathingSeconds = 0;
  let stepIndex = Math.max(0, steps.length - 1);
  let secondsLeft = 0;
  for (let index = 0; index < steps.length; index += 1) {
    const length = Math.max(0, steps[index].seconds);
    const consumed = Math.min(length, Math.max(0, elapsedSeconds - offset));
    if (steps[index].kind === "breathe") breathingSeconds += consumed;
    if (elapsedSeconds < offset + length) {
      stepIndex = index;
      secondsLeft = Math.ceil(offset + length - elapsedSeconds);
      break;
    }
    offset += length;
  }
  return { stepIndex, secondsLeft, elapsedSeconds, breathingSeconds, totalSeconds,
    complete: elapsedSeconds >= totalSeconds,
    progress: totalSeconds > 0 ? elapsedSeconds / totalSeconds * 100 : 100 };
}
export function reportedActivation(value: unknown): ActivationLevel | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5
    ? value as ActivationLevel : undefined;
}
/** Missing answers are not “same”, and stopping is not a successful outcome. */
export function sessionResult(before?: ActivationLevel, after?: ActivationLevel, stopped = false): SessionResult | undefined {
  if (stopped) return "stopped";
  if (before === undefined || after === undefined) return undefined;
  return after < before ? "better" : after > before ? "worse" : "same";
}
export function activationChange(before?: ActivationLevel, after?: ActivationLevel): "down" | "same" | "up" | "unreported" {
  if (before === undefined || after === undefined) return "unreported";
  return after < before ? "down" : after > before ? "up" : "same";
}
export function ratingText(value?: ActivationLevel): string {
  return value === undefined ? "未填写" : `${value}/5`;
}
export function changeText(before?: ActivationLevel, after?: ActivationLevel): string {
  if (before === undefined || after === undefined) return "没有完整的前后评分，不计算变化。";
  const delta = after - before;
  return delta < 0 ? `下降 ${-delta} 级` : delta > 0 ? `上升 ${delta} 级` : "暂时没有变化";
}
export function endingCopy(result?: SessionResult, status?: PracticeSession["status"]) {
  if (status === "stopped" || status === "abandoned" || result === "stopped") {
    return { title: "练习已停止。", body: "不需要继续，也不必填写反馈。", suggestPractice: false };
  }
  if (result === "worse") {
    return { title: "这次感觉更不舒服。", body: "先停在这里，不必继续这个练习。需要时可以联系现实中的支持。", suggestPractice: false };
  }
  if (result === "same") {
    return { title: "这次没有明显变化。", body: "也可以就此结束，不需要追求一个特定状态。", suggestPractice: true };
  }
  if (result === "better") {
    return { title: "你记录了这次变化。", body: "这是你这一次的感受，不代表每次都会相同。", suggestPractice: true };
  }
  return { title: "这一段练习已结束。", body: "没有填写完整评分，我们不会替你判断效果。", suggestPractice: true };
}
export function elapsedBucket(actual: number, planned: number): "under_half" | "half_or_more" | "complete" {
  return actual >= planned ? "complete" : actual >= planned / 2 ? "half_or_more" : "under_half";
}
/** Preserve one record per attempt when optional feedback arrives after the session ended. */
export function upsertPracticeSession(sessions: readonly PracticeSession[], session: PracticeSession): PracticeSession[] {
  return [session, ...sessions.filter((item) => item.id !== session.id)].slice(0, 30);
}
