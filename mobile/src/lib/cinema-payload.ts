import type { PracticeVariant } from "@stillmind/content";
import type { DurationMinutes } from "@stillmind/domain";

export type CinemaPayload = {
  title: string; innerNoise: string[]; scenes: { label: string; line: string }[];
  roleView: string; audienceView: string; witnessView: string;
};
export type CinemaResult = { cinema: CinemaPayload; source: "preset" | "stepfun" };
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
export function isCinemaPayload(value: unknown): value is CinemaPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CinemaPayload>;
  return text(item.title, 100) && Array.isArray(item.scenes) && item.scenes.length >= 2 && item.scenes.length <= 3
    && item.scenes.every(scene => text(scene?.label, 50) && text(scene?.line, 200))
    && Array.isArray(item.innerNoise) && item.innerNoise.length <= 10 && item.innerNoise.every(line => text(line, 100))
    && text(item.roleView, 300) && text(item.audienceView, 300) && text(item.witnessView, 300);
}
/** Preserve chosen duration exactly; long or invalid provider arrays cannot shorten the session. */
export function cinemaToPractice(result: CinemaResult, minutes: DurationMinutes = 1): PracticeVariant {
  if (!isCinemaPayload(result.cinema)) throw new Error("Invalid structured cinema");
  const total = minutes * 60;
  const sceneBudget = total - 18;
  const scenes = result.cinema.scenes;
  const seconds = Math.floor(sceneBudget / scenes.length);
  return {
    id: `inner-cinema-live-${Date.now()}`, methodId: "inner-cinema", contentVersion: "1.1.0", minutes,
    title: `《${result.cinema.title}》`, subtitle: result.source === "stepfun" ? "StepFun 实时分镜" : "预设分镜",
    preparation: "这是一组观看提示，不是对你的分析。不舒服可以随时停止。",
    steps: [
      ...scenes.map((scene, index) => ({ id: `scene-${index + 1}`, kind: "observe" as const,
        title: scene.label, instruction: scene.line, seconds: seconds + (index < sceneBudget % scenes.length ? 1 : 0),
        alternative: "不想回想可以停止，或回到房间里的一个普通物体。", haptic: "soft" as const })),
      { id: "audience", kind: "observe" as const, title: "观众席", instruction: result.cinema.audienceView, seconds: 10, haptic: "soft" as const },
      { id: "return", kind: "close" as const, title: "离开银幕", instruction: result.cinema.witnessView, seconds: 8, haptic: "soft" as const },
    ],
    closing: "这一段练习结束了。按实际感受记录，也可以不填。",
  };
}
