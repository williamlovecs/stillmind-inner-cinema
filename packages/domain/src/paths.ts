import type { PracticePathDefinition } from "./types";

export const PRACTICE_PATHS: readonly PracticePathDefinition[] = [
  {
    id: "pause-before-reply",
    title: "先别立刻回复",
    subtitle: "冲动来时，先拿回一分钟",
    summary: "从想反击、解释、证明的冲动里退一步，最后回到一个可逆的小行动。",
    bestFor: "刚被触发，想马上回应、发消息、争辩或证明自己时。",
    mode: "impulsive",
    outcome: "pause",
    duration: 1,
    stages: [
      { label: "停下", methodId: "logout-pause", duration: 1, why: "先退出反应界面。" },
      { label: "看见现场", methodId: "wide-gaze", duration: 1, why: "用视野降低隧道注意力。" },
      { label: "回到选择", methodId: "grounded-action", duration: 1, why: "只选下一件小事。" },
    ],
  },
  {
    id: "exit-inner-movie",
    title: "退出内在电影",
    subtitle: "把剧情从第一人称放到银幕上",
    summary: "把触发拆成三幕，再从角色、观众和见证位置看见它。",
    bestFor: "反复回放一句话、一个表情、一次冲突，脑子停不下来时。",
    mode: "looping",
    outcome: "distance",
    duration: 1,
    stages: [
      { label: "成片", methodId: "inner-cinema", duration: 1, why: "把剧情放到第三人称。" },
      { label: "换人称", methodId: "person-shift", duration: 1, why: "把“我就是”还原成“一个人正在”。" },
      { label: "看念头", methodId: "thought-watching", duration: 1, why: "让念头像字幕一样经过。" },
    ],
  },
  {
    id: "observer-foundation",
    title: "见证力基础",
    subtitle: "从安静观察开始，不追随念头",
    summary: "从看念头开始，逐渐扩展到声音、身体和提醒锚点。",
    bestFor: "没有强烈危机，只想长期练习观察、不被念头带走时。",
    mode: "curious",
    outcome: "awareness",
    duration: 3,
    stages: [
      { label: "看念头", methodId: "thought-watching", duration: 3, why: "先练习不追随。" },
      { label: "开放觉察", methodId: "open-awareness", duration: 5, why: "让更多经验一起经过。" },
      { label: "设置锚点", methodId: "anchors", duration: 1, why: "把暂停带回日常场景。" },
    ],
  },
  {
    id: "gentle-release",
    title: "松开重播",
    subtitle: "放下反复播放，不放下边界",
    summary: "先看见受伤，再可选地松开一部分精神重播，最后回到现实边界。",
    bestFor: "关系里的受伤、怨气或反复想起一段话时。",
    mode: "hurt",
    outcome: "release",
    duration: 1,
    stages: [
      { label: "看见角色", methodId: "inner-cinema", duration: 1, why: "先不直接进入故事。" },
      { label: "松开一点", methodId: "release", duration: 5, why: "只松开重播，不要求原谅。" },
      { label: "回到行动", methodId: "grounded-action", duration: 1, why: "保留现实边界和选择。" },
    ],
  },
] as const;
