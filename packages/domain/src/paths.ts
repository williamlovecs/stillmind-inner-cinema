import type { MethodId, PracticePathDefinition, PracticePathProgress, PracticeSession } from "./types";

export const PRACTICE_PATHS: readonly PracticePathDefinition[] = [
  {
    id: "pause-before-reply",
    title: "冲动降噪",
    subtitle: "想立刻回应时，先沉寂小我",
    summary: "从想解释、证明或反击的冲动里退一步，先登出，再凝视，最后把注意缩到一个感官细节。",
    bestFor: "刚被触发，想马上回应、发消息、争辩或证明自己时。",
    mode: "impulsive",
    outcome: "pause",
    duration: 1,
    stages: [
      { label: "登出", methodId: "logout-pause", duration: 1, why: "先不参与、不解释。" },
      { label: "凝视", methodId: "wide-gaze", duration: 1, why: "用固定对象稳定注意。" },
      { label: "聚焦", methodId: "grounded-action", duration: 1, why: "把注意缩到一个感官细节。" },
    ],
  },
  {
    id: "exit-inner-movie",
    title: "动态观电影",
    subtitle: "双意识焦点：体验与观察并行",
    summary: "用观电影法把剧情放到银幕上，再配合人称替代法和觉察法，把自己从角色里松开。",
    bestFor: "反复回放一句话、一个表情、一次冲突，脑子停不下来时。",
    mode: "looping",
    outcome: "distance",
    duration: 1,
    stages: [
      { label: "观电影", methodId: "inner-cinema", duration: 1, why: "一个焦点体验，一个焦点观察。" },
      { label: "换人称", methodId: "person-shift", duration: 1, why: "把“我”替换成名字或第三人称。" },
      { label: "觉察", methodId: "thought-watching", duration: 1, why: "看见小我如何冒头又消失。" },
    ],
  },
  {
    id: "observer-foundation",
    title: "静态沉寂基础",
    subtitle: "从数息到合一感",
    summary: "用呼吸法先收束注意，再用觉察法看见念头，最后以合一法记住安静连接的锚点。",
    bestFor: "没有强烈危机，只想长期练习安静、专注和观察时。",
    mode: "curious",
    outcome: "awareness",
    duration: 3,
    stages: [
      { label: "数息", methodId: "paced-breath", duration: 3, why: "把注意放在数字而不是剧情。" },
      { label: "觉察", methodId: "thought-watching", duration: 3, why: "看见小我状态的起落。" },
      { label: "合一", methodId: "open-awareness", duration: 5, why: "记住安静连接的感觉。" },
    ],
  },
  {
    id: "gentle-release",
    title: "受伤后的沉寂",
    subtitle: "不压抑，也不继续演",
    summary: "先用观电影法看见受伤角色，再用宽恕法旁观情绪起伏，最后用意识聚焦法回到可观察细节。",
    bestFor: "关系里的受伤、怨气或反复想起一段话时。",
    mode: "hurt",
    outcome: "release",
    duration: 1,
    stages: [
      { label: "观电影", methodId: "inner-cinema", duration: 1, why: "先看见角色，不直接入戏。" },
      { label: "宽恕", methodId: "release", duration: 5, why: "允许情绪释放，同时保持旁观。" },
      { label: "聚焦", methodId: "grounded-action", duration: 1, why: "把注意放回一个可观察细节。" },
    ],
  },
] as const;

export function buildPracticePathProgress(
  path: PracticePathDefinition,
  sessions: readonly PracticeSession[],
  hiddenMethodIds: readonly MethodId[] = [],
): PracticePathProgress {
  const completedMethods = new Set(
    sessions
      .filter((session) => session.status === "completed" && session.result !== "worse" && session.result !== "stopped")
      .map((session) => session.methodId),
  );
  const hidden = new Set(hiddenMethodIds);
  let completedStages = 0;

  for (const stage of path.stages) {
    if (!completedMethods.has(stage.methodId)) break;
    completedStages += 1;
  }

  const firstIncomplete = path.stages[completedStages];
  const nextStage = firstIncomplete && !hidden.has(firstIncomplete.methodId) ? firstIncomplete : undefined;
  const blockedByHiddenMethod = Boolean(firstIncomplete && hidden.has(firstIncomplete.methodId));
  const reasonCodes = completedStages === path.stages.length
    ? ["path:complete"]
    : blockedByHiddenMethod
      ? ["path:hidden-method", `method:${firstIncomplete?.methodId}`]
      : completedStages === 0
        ? ["path:not-started"]
        : ["path:in-progress", `stage:${completedStages + 1}`];

  return {
    pathId: path.id,
    completedStages,
    totalStages: path.stages.length,
    nextStage,
    blockedByHiddenMethod,
    reasonCodes,
  };
}
