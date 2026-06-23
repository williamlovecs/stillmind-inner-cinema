import { METHOD_BY_ID } from "./catalog";
import type { DesiredOutcome, DurationMinutes, MethodId, PracticeSession, SessionResult, StateMode, WeeklyNextStep, WeeklyReview } from "./types";

const EMPTY_RESULTS: Record<SessionResult, number> = { better: 0, same: 0, worse: 0, stopped: 0 };

export function buildWeeklyReview(sessions: readonly PracticeSession[], start: Date): WeeklyReview {
  const startTime = start.getTime();
  const end = new Date(startTime + 7 * 24 * 60 * 60 * 1000);
  const inRange = sessions.filter((session) => {
    const time = Date.parse(session.startedAt);
    return Number.isFinite(time) && time >= startTime && time < end.getTime();
  });

  const review: WeeklyReview = {
    start: start.toISOString(),
    end: end.toISOString(),
    sessions: inRange.length,
    completed: 0,
    results: { ...EMPTY_RESULTS },
    methodCounts: {},
    modeCounts: {},
    nextStep: EMPTY_NEXT_STEP,
  };
  const activationChanges: number[] = [];

  for (const session of inRange) {
    if (session.status === "completed") review.completed += 1;
    if (session.result) review.results[session.result] += 1;
    review.methodCounts[session.methodId] = (review.methodCounts[session.methodId] ?? 0) + 1;
    review.modeCounts[session.mode] = (review.modeCounts[session.mode] ?? 0) + 1;
    if (session.activationBefore && session.activationAfter) {
      activationChanges.push(session.activationBefore - session.activationAfter);
    }
  }

  if (activationChanges.length >= 2) {
    const total = activationChanges.reduce((sum, value) => sum + value, 0);
    review.averageActivationChange = Math.round((total / activationChanges.length) * 10) / 10;
  }
  review.nextStep = buildWeeklyNextStep(review);
  return review;
}

const EMPTY_NEXT_STEP: WeeklyNextStep = {
  title: "先留下一次小样本",
  body: "这一周还没有足够记录。下一次被剧情拉走时，只做 1 分钟暂停。",
  cta: "开始 1 分钟暂停",
  mode: "impulsive",
  methodId: "logout-pause",
  duration: 1,
  outcome: "pause",
  reasonCodes: ["weekly:no-data"],
};

const MODE_NEXT_STEP: Record<StateMode, { methodId: MethodId; outcome: DesiredOutcome; title: string; body: string }> = {
  looping: {
    methodId: "inner-cinema",
    outcome: "distance",
    title: "从重复剧情里退一步",
    body: "本周记录里，念头反复重播出现得更多。下一次先把它拍成一幕电影。",
  },
  tense: {
    methodId: "wide-gaze",
    outcome: "settle",
    title: "先把视野放宽一点",
    body: "本周记录里，身体紧绷出现得更多。下一次先用睁眼练习降低强度。",
  },
  impulsive: {
    methodId: "logout-pause",
    outcome: "pause",
    title: "把回应延后一分钟",
    body: "本周记录里，立刻回应的冲动出现得更多。下一次先登出角色。",
  },
  numb: {
    methodId: "wide-gaze",
    outcome: "settle",
    title: "先重新接上现场",
    body: "本周记录里，麻木或断开出现得更多。下一次先看见周围的空间。",
  },
  hurt: {
    methodId: "person-shift",
    outcome: "distance",
    title: "把受伤放到第三人称",
    body: "本周记录里，关系里的受伤出现得更多。下一次先换一个观看角度。",
  },
  curious: {
    methodId: "open-awareness",
    outcome: "awareness",
    title: "继续练习开放观察",
    body: "本周你有空间安静观察。下一次可以把声音、念头和身体感一起看见。",
  },
};

function buildWeeklyNextStep(review: WeeklyReview): WeeklyNextStep {
  if (review.sessions === 0) return EMPTY_NEXT_STEP;

  const uneasyCount = review.results.worse + review.results.stopped;
  if (uneasyCount >= 2) {
    return {
      title: "这周先降低练习强度",
      body: "有几次练习让你更不舒服或中途停下。下一次只做最短暂停，不追求深入。",
      cta: "做 1 分钟登出",
      mode: "impulsive",
      methodId: "logout-pause",
      duration: 1,
      outcome: "pause",
      reasonCodes: ["weekly:uneasy-signal"],
    };
  }

  const topMethod = topEntry(review.methodCounts);
  if (topMethod && review.results.better >= 2) {
    const method = METHOD_BY_ID.get(topMethod[0]);
    if (method) {
      return {
        title: "延续一个有效样本",
        body: `本周有 ${review.results.better} 次记录显示“多了一点选择”。下一次可以继续用“${method.title}”。`,
        cta: `继续 ${method.title}`,
        mode: topEntry(review.modeCounts)?.[0] ?? "curious",
        methodId: method.id,
        duration: nextDuration(review.sessions),
        outcome: method.outcomes[0] ?? "choose",
        reasonCodes: ["weekly:better-signal", `method:${method.id}`],
      };
    }
  }

  const topMode = topEntry(review.modeCounts);
  if (topMode && topMode[1] >= 2) {
    const next = MODE_NEXT_STEP[topMode[0]];
    return {
      ...next,
      cta: "按本周线索练一次",
      mode: topMode[0],
      duration: 1,
      reasonCodes: ["weekly:repeated-mode", `mode:${topMode[0]}`],
    };
  }

  return {
    title: "继续收集本周线索",
    body: "记录还不多。下一次先回到现实里的一个小行动，再看模式会不会重复。",
    cta: "做 1 分钟回归行动",
    mode: "curious",
    methodId: "grounded-action",
    duration: 1,
    outcome: "choose",
    reasonCodes: ["weekly:small-sample"],
  };
}

function topEntry<T extends string>(counts: Partial<Record<T, number>>): [T, number] | undefined {
  return Object.entries(counts).sort((a, b) => Number(b[1]) - Number(a[1]) || a[0].localeCompare(b[0]))[0] as [T, number] | undefined;
}

function nextDuration(sessionCount: number): DurationMinutes {
  return sessionCount >= 4 ? 3 : 1;
}
