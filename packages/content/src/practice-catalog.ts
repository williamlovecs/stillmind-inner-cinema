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
  v("inner-cinema", 1, "观电影法", "把刚才一幕放到屏幕上", "选一个刚才的场景，把它当成屏幕上的一幕。不急着解释，不急着反击。只是看见：这个角色正在经历什么。", [
    { id: "screen", kind: "arrive", title: "画面出现", instruction: "看见刚才那一幕。", seconds: 20, haptic: "soft" },
    { id: "role", kind: "observe", title: "角色正在演", instruction: "看见身体、念头和冲动。", seconds: 20 },
    { id: "audience", kind: "observe", title: "坐回观众席", instruction: "不急着进入剧情。", seconds: 20, haptic: "soft" },
  ], "观电影法只是 StillMind 的一种方法；你看见角色，但不必完全成为角色。"),
  v("paced-breath", 1, "呼吸法", "数呼气，不追念头", "如果数息让你不舒服，只保持自然呼吸并看着数字变化。", [
    { id: "arrive", kind: "arrive", title: "先找到呼气", instruction: "不用改变呼吸，只注意下一次呼气自然出现。", seconds: 8, alternative: "保持眼睛睁开，看着屏幕中央。" },
    { id: "count-1", kind: "breathe", title: "呼气，数 1", instruction: "呼气时在心里数 1，吸气时不用做任何事。", seconds: 18, haptic: "breath" },
    { id: "count-2", kind: "breathe", title: "继续数下去", instruction: "每次呼气只加一个数字。走神了，就从下一个数字继续。", seconds: 18, haptic: "breath" },
    { id: "release", kind: "close", title: "放开数字", instruction: "让呼吸回到自己的速度，看看周围。", seconds: 16, haptic: "soft" },
  ], "重点不是控制呼吸，而是让注意力停在数字上。"),
  v("thought-watching", 3, "觉察法", "看见小我如何升起又落下", "坐着或站着都可以。你只是在观察，不是在评判自己。", [
    { id: "name", kind: "notice", title: "小我冒头", instruction: "注意此刻最强的“我想、我怕、我必须”是哪一句。", seconds: 35 },
    { id: "habit", kind: "observe", title: "它喜欢什么", instruction: "它在保护权威、得失、猜疑、愧疚，还是别的角色感？", seconds: 45 },
    { id: "rise-fall", kind: "observe", title: "看起伏", instruction: "观察它变强、变弱、停住或再次回来。回来也只是被看见。", seconds: 50 },
    { id: "not-follow", kind: "observe", title: "不追随", instruction: "不急着证明它对，也不急着赶走它。", seconds: 35 },
    { id: "choose", kind: "choose", title: "保留选择", instruction: "这个念头之后，你仍能选择下一步。", seconds: 15, haptic: "soft" },
  ], "觉察不是分析小我，而是看见它正在活动。"),
  v("wide-gaze", 1, "凝视法", "用固定对象稳定注意", "选一个安全、中性的物体。蜡烛、水面、墙上一点或桌面物件都可以。", [
    { id: "object", kind: "notice", title: "选定对象", instruction: "把视线轻轻放在一个固定点上，不用用力盯。", seconds: 18 },
    { id: "details", kind: "observe", title: "看细节", instruction: "注意它的边缘、颜色、明暗和细小变化。", seconds: 18 },
    { id: "return", kind: "observe", title: "走神就回来", instruction: "内在对白出现时，不解释，只把视线放回对象。", seconds: 16 },
    { id: "close", kind: "close", title: "收回视线", instruction: "眨眨眼，看看房间里的三个中性物体。", seconds: 8, haptic: "soft" },
  ], "凝视不是发呆，而是把注意放到单纯稳定的观看上。"),
  v("body-scan", 5, "内观法", "观内在，不解释", "如果关注身体内部不舒服，就改为观察脚底、椅子和手部接触。", [
    { id: "support", kind: "arrive", title: "先找支撑", instruction: "注意身体被地面或椅子支撑的地方。", seconds: 45 },
    { id: "inside", kind: "notice", title: "观内在", instruction: "观察压力、温度、流动、紧绷或空白；不解释来源。", seconds: 55 },
    { id: "hands", kind: "notice", title: "观接触", instruction: "感受手指、手掌与接触面。不要试图改变。", seconds: 50 },
    { id: "center", kind: "observe", title: "观中心区域", instruction: "只注意起伏、紧或松。若不舒服，回到脚底。", seconds: 55, alternative: "跳过身体内部，继续感受椅子和脚底。" },
    { id: "whole", kind: "observe", title: "观整体", instruction: "把身体当成一个同时变化的感觉场。", seconds: 55 },
    { id: "orient", kind: "close", title: "回到现场", instruction: "睁眼，找到门、光源和一个让你安心的物体。", seconds: 40, haptic: "soft" },
  ], "内观只负责看见，不负责解释你是谁。"),
  v("person-shift", 1, "人称替代法", "把“我”换成名字", "准备一句正在困住你的“我……”或“我必须……”。", [
    { id: "original", kind: "notice", title: "原句", instruction: "看见原句，不和它争辩。", seconds: 10 },
    { id: "name", kind: "observe", title: "换成名字", instruction: "把“我很生气”改成“某某正在生气”。", seconds: 18 },
    { id: "third", kind: "observe", title: "再退一步", instruction: "改成：一个人正在经历这段反应。", seconds: 18 },
    { id: "choice", kind: "choose", title: "角色之外", instruction: "这个人现在可以先做哪件小事？", seconds: 14, haptic: "soft" },
  ], "名字替代不是否认自己，而是让观察距离出现。"),
  v("logout-pause", 1, "登出法", "不参与，不解释", "适合意识流很吵、越解释越停不下来时。", [
    { id: "notice", kind: "notice", title: "看见互动冲动", instruction: "注意你最想解释、回应、证明或追问的地方。", seconds: 12 },
    { id: "mute", kind: "observe", title: "暂时钝化", instruction: "对这股意识流先不互动，像把界面切到只读模式。", seconds: 18 },
    { id: "no-meaning", kind: "observe", title: "不造意义", instruction: "不把画面、感觉或念头继续解释成故事。", seconds: 16 },
    { id: "neutral", kind: "close", title: "中性落点", instruction: "喝水、走动或看一个普通物体。", seconds: 14, haptic: "soft" },
  ], "登出不是逃避，而是暂时停止给剧情继续加燃料。"),
  v("release", 5, "宽恕法", "旁观释放，不放弃边界", "只有你主动选择时才做。宽恕不等于和解，也不取消现实边界。", [
    { id: "allow", kind: "notice", title: "允许出现", instruction: "承认这股反应正在这里，无需压抑，也无需放大。", seconds: 55 },
    { id: "boundary", kind: "choose", title: "先确认边界", instruction: "你需要保持距离、保存证据、沟通还是寻求支持？", seconds: 55 },
    { id: "watch", kind: "observe", title: "旁观起伏", instruction: "看见情绪升起、停留、变化，不把它变成新的身份。", seconds: 60 },
    { id: "kindness", kind: "observe", title: "松开一点", instruction: "这一刻，允许自己少重播一次，不要求对方在脑中改写结局。", seconds: 65 },
    { id: "return", kind: "close", title: "带着边界回来", instruction: "选择一个保护自己、又不继续内耗的动作。", seconds: 65, haptic: "soft" },
  ], "你可以松开一部分重播，同时保留事实、边界和选择。"),
  v("open-awareness", 5, "合一法", "记住安静连接的感觉", "仅在你此刻相对稳定、愿意练习时使用。若变得不适，睁眼并退出。", [
    { id: "anchor", kind: "arrive", title: "找到锚点", instruction: "先用脚底、声音或自然呼吸稳定注意。", seconds: 50 },
    { id: "include", kind: "observe", title: "把经验放进来", instruction: "让声音、身体感觉和念头同时被看见，不选一个当中心。", seconds: 55 },
    { id: "connection", kind: "observe", title: "连接感", instruction: "注意一种更宽、更安静的连接感。它不需要被解释。", seconds: 55 },
    { id: "remember", kind: "observe", title: "记住频率", instruction: "记住这个感觉的质地，像保存一个下次可用的锚点。", seconds: 60 },
    { id: "soften", kind: "observe", title: "不抓住", instruction: "不追求保持，只知道自己曾经触到过这种安静。", seconds: 50 },
    { id: "close", kind: "close", title: "回到具体", instruction: "看见房间，动动手脚，回到一件具体的小事。", seconds: 30, haptic: "soft" },
  ], "合一法在产品里被表达为安静连接练习，不作为任何结果承诺。"),
  v("grounded-action", 1, "意识聚焦法", "缩小视角，进入细节", "选择一个眼前对象或感官细节，越具体越好。", [
    { id: "object", kind: "notice", title: "选一个对象", instruction: "例如杯沿、按钮、树叶、声音或手指触感。", seconds: 18 },
    { id: "zoom", kind: "observe", title: "拉近镜头", instruction: "观察它的边缘、纹理、远近、温度或声音层次。", seconds: 18 },
    { id: "sense", kind: "observe", title: "加入感官", instruction: "加入听觉、触觉或嗅觉，让注意更窄、更清楚。", seconds: 14 },
    { id: "close", kind: "close", title: "保持一小段", instruction: "再停留几秒，然后再决定下一步。", seconds: 10, haptic: "soft" },
  ], "意识聚焦不是缩小人生，而是把注意从大剧情带回一个清晰点。"),
  v("trigger-journal", 3, "稳定法", "让注意保持静止", "选择一个安全的视觉对象或简单图形。若视觉不适，改听稳定的声音。", [
    { id: "choose", kind: "notice", title: "选定画面", instruction: "选一个容易晃动注意的图形、纹理或画面。", seconds: 45 },
    { id: "soft", kind: "observe", title: "放松观察", instruction: "不要用力压制，只观察它看起来动或不动的变化。", seconds: 35 },
    { id: "steady", kind: "observe", title: "尝试稳定", instruction: "轻轻让画面、身体和念头都更稳定一点。", seconds: 35 },
    { id: "notice", kind: "observe", title: "看见波动", instruction: "稳定不了也没关系，记录注意如何被带走。", seconds: 35 },
    { id: "close", kind: "close", title: "回到普通视线", instruction: "眨眼，看看房间里一个静止物体。", seconds: 30, haptic: "soft" },
  ], "稳定法练的是注意的稳定性，不是强迫自己没有念头。"),
  v("anchors", 1, "意识抽离法", "从近景拉到宏观", "适合被眼前小事卡住时。若拉远想象让你不适，回到房间和脚底。", [
    { id: "near", kind: "notice", title: "近景", instruction: "看见眼前这件事：一句话、一个消息、一个表情。", seconds: 18 },
    { id: "timeline", kind: "observe", title: "时间线", instruction: "把视角拉到今天、一周、几年，看它只是时间线上的一点。", seconds: 18 },
    { id: "wide", kind: "observe", title: "更大空间", instruction: "想象从高处看这个场景，角色变小，空间变大。", seconds: 14 },
    { id: "return", kind: "close", title: "回到当下", instruction: "说出你现在所在的地点，并选择一个温和动作。", seconds: 10, haptic: "soft" },
  ], "抽离法是暂时换一个观看尺度，不是否认现实。"),
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
