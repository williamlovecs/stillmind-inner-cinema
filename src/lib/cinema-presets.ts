// StillMind 内在电影预设
// client + server 共享的唯一 source of truth
// 4 套分类：忽视 / 冲突 / 证明 / 默认
// 文案标准：克制，不分析，不诊断，不贴标签，不安慰
// 所有 scene.line 截断到 42 字符以内

export type CinemaPayload = {
  title: string;
  innerNoise: string[];
  scenes: { label: string; line: string }[];
  roleView: string;
  audienceView: string;
  witnessView: string;
};

export type CinemaCategory = "ignored" | "conflict" | "prove" | "default";

const SCENE_MAX = 42;
const INLINE_MAX = 10;
const ROLE_MAX = 20;
const AUDIENCE_MAX = 25;
const WITNESS_MAX = 20;

const witnessView = "这个反应正在发生。念头经过你，不需要立刻被解释，也不需要被认同。";

const presets: Record<CinemaCategory, CinemaPayload> = {
  ignored: {
    title: "一条没有回应的消息",
    innerNoise: ["为什么没有回应？", "是不是我不够好？", "我需要一个答案"],
    scenes: [
      { label: "镜头 01", line: "沉默出现了，身体开始寻找答案。" },
      { label: "镜头 02", line: "一个念头升起：是不是我不够好？" },
      { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
    ],
    roleView: "我被忽视了。我需要得到回应，才知道自己有没有价值。",
    audienceView: "一个人正把沉默解读成否定，并想用回应确认自己的价值。",
    witnessView: witnessView,
  },
  conflict: {
    title: "冲突之后的回声",
    innerNoise: ["我需要为自己辩解", "他们误解了我", "我必须立刻反击"],
    scenes: [
      { label: "镜头 01", line: "冲突刚刚发生，身体还在紧绷。" },
      { label: "镜头 02", line: "一个念头升起：我必须立刻反击。" },
      { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
    ],
    roleView: "我被攻击了。我必须把话说清楚，否则我就输了。",
    audienceView: "一个人感到被误解，身体进入防御，头脑正在准备反击。",
    witnessView: witnessView,
  },
  prove: {
    title: "想被看见的瞬间",
    innerNoise: ["我需要证明自己", "他们必须看见我的价值", "我不能显得弱"],
    scenes: [
      { label: "镜头 01", line: "价值感被触动，注意力开始向外寻找确认。" },
      { label: "镜头 02", line: "一个念头升起：我必须证明自己。" },
      { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
    ],
    roleView: "我必须证明自己，不然别人就不会看见我的价值。",
    audienceView: "一个人正在努力保护自己的价值感，想让外界给出确认。",
    witnessView: witnessView,
  },
  default: {
    title: "被触发的片刻",
    innerNoise: ["哪里不对劲", "我需要马上解决", "我坐不住"],
    scenes: [
      { label: "镜头 01", line: "触发刚刚出现，身体还没有完全安定。" },
      { label: "镜头 02", line: "一个念头升起：我需要马上解决它。" },
      { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
    ],
    roleView: "我被触动了。我想立刻做点什么，让这种不安停下来。",
    audienceView: "一个人正被一段内在剧情拉走，暂时忘了自己也可以观看它。",
    witnessView: witnessView,
  },
};

export function detectCategory(trigger: string): CinemaCategory {
  // 优先级：conflict > prove > ignored > default
  if (/冲突|吵|争|反击|批评|指责|conflict|fight|criticized/i.test(trigger)) {
    return "conflict";
  }
  if (/证明|价值|prove|value/i.test(trigger)) {
    return "prove";
  }
  if (/忽视|没回|不回|冷淡|ignored|reply/i.test(trigger)) {
    return "ignored";
  }
  return "default";
}

function clamp(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

export function getPreset(trigger: string): CinemaPayload {
  const category = detectCategory(trigger);
  const base = presets[category];

  return {
    title: base.title,
    innerNoise: base.innerNoise.map((line) => clamp(line, INLINE_MAX)),
    scenes: base.scenes.map((scene, index) => ({
      label: `镜头 0${index + 1}`,
      line: clamp(scene.line, SCENE_MAX),
    })),
    roleView: clamp(base.roleView, ROLE_MAX),
    audienceView: clamp(base.audienceView, AUDIENCE_MAX),
    witnessView: clamp(base.witnessView, WITNESS_MAX),
  };
}
