import { METHOD_BY_ID, type MethodId } from "@stillmind/domain";
import type { PracticeVariant } from "./types";

const v = (
  methodId: MethodId,
  minutes: PracticeVariant["minutes"],
  title: string,
  subtitle: string,
  preparation: string,
  steps: PracticeVariant["steps"],
  closing: string,
): PracticeVariant => ({
  id: `${methodId}-${minutes}`,
  methodId,
  contentVersion: "1.0.0",
  minutes,
  title,
  subtitle,
  preparation,
  steps,
  closing,
});

export const PRACTICE_VARIANTS: readonly PracticeVariant[] = [
  v("inner-cinema", 1, "三幕内在电影", "把反应放到银幕上", "你只需写一句；不想写也可以用预设场景。", [
    { id: "arrive", kind: "arrive", title: "银幕亮起", instruction: "用一句事实描述刚才发生了什么，不解释原因。", seconds: 12, haptic: "soft" },
    { id: "scene-1", kind: "observe", title: "第一幕", instruction: "一个角色刚被触发，身体还在反应。", seconds: 12 },
    { id: "scene-2", kind: "observe", title: "第二幕", instruction: "一个念头升起，但念头不是命令。", seconds: 12 },
    { id: "scene-3", kind: "observe", title: "第三幕", instruction: "坐到观众席。看见角色，不进入角色。", seconds: 14 },
    { id: "close", kind: "close", title: "灯光回来", instruction: "选择一个暂时不扩大剧情的行动。", seconds: 10, haptic: "soft" },
  ], "电影还在，但你不必继续出演。"),
  v("paced-breath", 1, "一分钟轻缓呼吸", "不用用力，也不用吸得更深", "如果改变呼吸不舒服，只看光圈扩张和收拢。", [
    { id: "natural", kind: "arrive", title: "先不改变", instruction: "注意一次自然的吸气和呼气。", seconds: 8, alternative: "保持眼睛睁开，看着屏幕中央。" },
    { id: "round-1", kind: "breathe", title: "吸气 4 · 呼气 5", instruction: "舒适地吸气，再让呼气稍微长一点。", seconds: 18, haptic: "breath" },
    { id: "round-2", kind: "breathe", title: "再来一轮", instruction: "不追求完美节奏，只跟随。", seconds: 18, haptic: "breath" },
    { id: "release", kind: "close", title: "放开控制", instruction: "让呼吸回到自己的速度，看看周围。", seconds: 16, haptic: "soft" },
  ], "你不必平静下来；只需要比刚才多一点空间。"),
  v("thought-watching", 3, "看念头经过", "把念头从主角变成字幕", "坐着或站着都可以。随时能退出。", [
    { id: "name", kind: "notice", title: "一个念头在这里", instruction: "在心里补一句：我注意到，一个念头正在说……", seconds: 35 },
    { id: "form", kind: "observe", title: "只看它的形式", instruction: "它是句子、画面、声音，还是一段争论？不用判断真假。", seconds: 45 },
    { id: "move", kind: "observe", title: "看它变化", instruction: "注意它变强、变弱、停住或再次回来。回来也没关系。", seconds: 50 },
    { id: "space", kind: "observe", title: "念头在空间里", instruction: "声音、身体感觉和念头都在变化。你可以看见变化。", seconds: 35 },
    { id: "choose", kind: "choose", title: "不听命令", instruction: "这个念头之后，你仍能选择下一步。", seconds: 15, haptic: "soft" },
  ], "看见，不等于相信；出现，不等于必须跟随。"),
  v("wide-gaze", 1, "宽视野", "从隧道注意力回到房间", "睁着眼睛，不盯住任何一点。若视觉不适，改听三种声音。", [
    { id: "objects", kind: "notice", title: "三个中性物体", instruction: "慢慢找到三个没有情绪意义的物体。", seconds: 18 },
    { id: "edges", kind: "observe", title: "边缘和距离", instruction: "注意它们的边缘、远近和彼此之间的空间。", seconds: 18 },
    { id: "periphery", kind: "observe", title: "让视野变宽", instruction: "保持头不动，感觉左右两侧也在视野里。", seconds: 16 },
    { id: "return", kind: "close", title: "回到现场", instruction: "说出你现在所在的地方和时间。", seconds: 8, haptic: "soft" },
  ], "剧情占据的是注意力，不是整个现实。"),
  v("body-scan", 5, "接触点扫描", "感受，不诊断", "不想关注身体内部时，只感受脚、椅子和双手的接触。", [
    { id: "support", kind: "arrive", title: "支撑", instruction: "注意身体被地面或椅子支撑的地方。", seconds: 45 },
    { id: "feet", kind: "notice", title: "脚和腿", instruction: "注意压力、温度或麻木；没有感觉也算一种感觉。", seconds: 55 },
    { id: "hands", kind: "notice", title: "双手", instruction: "感受手指、手掌与接触面。不要试图放松。", seconds: 50 },
    { id: "torso", kind: "observe", title: "胸腹", instruction: "只注意起伏、紧或松。若不舒服，回到脚底。", seconds: 55, alternative: "跳过胸腹，继续感受椅子和脚底。" },
    { id: "whole", kind: "observe", title: "整个轮廓", instruction: "把身体当成一个同时变化的感觉场。", seconds: 55 },
    { id: "orient", kind: "close", title: "重新定向", instruction: "睁眼，找到门、光源和一个让你安心的物体。", seconds: 40, haptic: "soft" },
  ], "你不需要修好身体，只需要知道此刻身体也在这里。"),
  v("person-shift", 1, "人称切换", "把身份判断还原成一段经历", "准备一句正在困住你的“我就是……”或“我必须……”。", [
    { id: "original", kind: "notice", title: "原句", instruction: "看见原句，不和它争辩。", seconds: 10 },
    { id: "third", kind: "observe", title: "换成人称", instruction: "改成：一个人正在经历……或者用你的名字说一次。", seconds: 18 },
    { id: "facts", kind: "observe", title: "只留可观察事实", instruction: "发生了什么？身体和念头分别做了什么？", seconds: 18 },
    { id: "choice", kind: "choose", title: "角色之外", instruction: "这个人现在可以先做哪件小事？", seconds: 14, haptic: "soft" },
  ], "这是一段正在发生的经验，不是你的定义。"),
  v("logout-pause", 1, "登出暂停", "先离开反应界面", "适合准备立刻回复、争辩、购买或做不可逆决定时。", [
    { id: "impulse", kind: "notice", title: "冲动不是命令", instruction: "说出你现在最想立刻做的动作。", seconds: 12 },
    { id: "window", kind: "choose", title: "选择返回时间", instruction: "选 10 分钟、1 小时或今天稍后，再回来决定。", seconds: 18 },
    { id: "remove", kind: "choose", title: "退出触发界面", instruction: "关掉聊天、草稿或购物页，不删除证据，也不做最终决定。", seconds: 16 },
    { id: "neutral", kind: "close", title: "一件中性小事", instruction: "喝水、走动或回到手头任务。", seconds: 14, haptic: "soft" },
  ], "暂停不是逃避，是把决定权拿回来。"),
  v("release", 5, "松开重播", "边界保留，重播可以少一点", "只有你主动选择时才做。宽恕不等于和解，也不取消责任。", [
    { id: "impact", kind: "notice", title: "承认影响", instruction: "这件事确实影响了你。无需缩小，也无需放大。", seconds: 55 },
    { id: "boundary", kind: "choose", title: "先确认边界", instruction: "你需要保持距离、保存证据、沟通还是寻求支持？", seconds: 55 },
    { id: "replay", kind: "observe", title: "看见重播", instruction: "区分现实中的边界行动和头脑里的重复演出。", seconds: 60 },
    { id: "release-one", kind: "observe", title: "只松开一点", instruction: "这一刻，允许自己暂时不要求对方在脑中改写结局。", seconds: 65 },
    { id: "return", kind: "close", title: "带着边界回来", instruction: "选择一个保护自己、又不继续内耗的动作。", seconds: 65, haptic: "soft" },
  ], "你可以放下重播，同时保留事实、边界和选择。"),
  v("open-awareness", 5, "开放觉察", "不选一个经验作为自己", "仅在你此刻相对稳定、愿意练习时使用。若变得不适，睁眼并退出。", [
    { id: "anchor", kind: "arrive", title: "找到锚点", instruction: "先用脚底、声音或自然呼吸稳定注意。", seconds: 50 },
    { id: "sounds", kind: "observe", title: "声音自己出现", instruction: "让近处和远处的声音进入，不寻找来源。", seconds: 55 },
    { id: "sensations", kind: "observe", title: "感觉自己变化", instruction: "身体感觉在来去，不必抓住任何一个。", seconds: 55 },
    { id: "thoughts", kind: "observe", title: "念头也在场", instruction: "让念头与声音一样出现、停留、离开。", seconds: 60 },
    { id: "field", kind: "observe", title: "开放的场", instruction: "不把某个念头选成中心，休息在整个经验里。", seconds: 50 },
    { id: "close", kind: "close", title: "收回边界", instruction: "看见房间，动动手脚，回到具体的一件事。", seconds: 30, haptic: "soft" },
  ], "觉察不是空白；它能容纳正在变化的一切。"),
  v("grounded-action", 1, "下一件小事", "不解决人生，只决定下一步", "选择小、具体、可逆的动作。", [
    { id: "options", kind: "choose", title: "三个选项", instruction: "喝水走动、回到当前任务、稍后再回复。也可以写自己的。", seconds: 18 },
    { id: "specific", kind: "choose", title: "让它具体", instruction: "什么时候、在哪里、做多久？", seconds: 18 },
    { id: "small", kind: "choose", title: "再缩小一半", instruction: "把动作缩到现在真的愿意开始。", seconds: 14 },
    { id: "commit", kind: "close", title: "开始", instruction: "结束练习后，先做这一件。", seconds: 10, haptic: "soft" },
  ], "清晰不等于确定一切，只是知道下一步。"),
  v("trigger-journal", 3, "触发记录", "记录发生，不定义自己", "你可以跳过任何问题；记录默认只留在本机。", [
    { id: "facts", kind: "notice", title: "发生了什么", instruction: "用一两句可观察事实记录场景。", seconds: 45 },
    { id: "mode", kind: "notice", title: "被什么带走", instruction: "循环念头、身体紧、冲动、麻木、受伤，还是别的？", seconds: 35 },
    { id: "response", kind: "observe", title: "你做了什么", instruction: "记录反应，不评价好坏。", seconds: 35 },
    { id: "helped", kind: "observe", title: "什么有帮助", instruction: "哪种方法让你多了一点选择？没有也可以。", seconds: 35 },
    { id: "experiment", kind: "choose", title: "下次实验", instruction: "下一次出现时，想提前做哪一个小动作？", seconds: 30, haptic: "soft" },
  ], "这是一次记录，不是一份人格报告。"),
  v("anchors", 1, "设置觉察锚点", "把暂停放进真实生活", "锚点由你选择，提醒可以随时关闭。", [
    { id: "cue", kind: "choose", title: "选择一个真实时刻", instruction: "会议结束、打开聊天前、到家后或睡前。", seconds: 18 },
    { id: "response", kind: "choose", title: "配一个十秒动作", instruction: "看一眼周围、呼一口气，或说“我正在入戏吗？”", seconds: 18 },
    { id: "copy", kind: "choose", title: "写成安静提醒", instruction: "不用打卡，不用催促，只提醒看见。", seconds: 14 },
    { id: "save", kind: "close", title: "保存", instruction: "从一个锚点开始，先用一周。", seconds: 10, haptic: "soft" },
  ], "练习不是额外任务，它可以藏在一个日常动作里。"),
] as const;

export const PRACTICES_BY_METHOD = PRACTICE_VARIANTS.reduce((map, practice) => {
  const list = map.get(practice.methodId) ?? [];
  list.push(practice);
  map.set(practice.methodId, list);
  return map;
}, new Map<MethodId, PracticeVariant[]>());

function scaleVariant(base: PracticeVariant, minutes: PracticeVariant["minutes"]): PracticeVariant {
  const targetSeconds = minutes * 60;
  const sourceSeconds = base.steps.reduce((sum, step) => sum + step.seconds, 0);
  let assigned = 0;
  const steps = base.steps.map((step, index) => {
    const seconds = index === base.steps.length - 1
      ? targetSeconds - assigned
      : Math.max(5, Math.round((step.seconds / sourceSeconds) * targetSeconds));
    assigned += seconds;
    return { ...step, seconds };
  });
  const methodTitle = METHOD_BY_ID.get(base.methodId)?.title ?? base.title;
  return {
    ...base,
    id: `${base.methodId}-${minutes}`,
    minutes,
    title: `${minutes} 分钟 · ${methodTitle}`,
    steps,
  };
}

export function getPracticeVariant(methodId: MethodId, minutes: PracticeVariant["minutes"]): PracticeVariant | undefined {
  const variants = PRACTICES_BY_METHOD.get(methodId) ?? [];
  const exact = variants.find((variant) => variant.minutes === minutes);
  if (exact) return exact;
  const base = variants[0];
  if (!base) return undefined;
  const supported = METHOD_BY_ID.get(methodId)?.durations.includes(minutes) ?? false;
  return supported ? scaleVariant(base, minutes) : base;
}
