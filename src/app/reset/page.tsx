"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AmbientToggle } from "@/components/AmbientToggle";
import { WorkflowNav } from "@/components/WorkflowNav";
import {
  PENDING_MODE_KEY,
  PENDING_TRIGGER_KEY,
  detectStateModeFromText,
  isStateMode,
} from "@/lib/reset-routing";
import { getPracticeVariant, type PracticeVariant } from "@stillmind/content";
import {
  METHOD_BY_ID,
  METHOD_CATALOG,
  recommendMethods,
  type DesiredOutcome,
  type DurationMinutes,
  type MethodDefinition,
  type MethodId,
  type PracticeSession,
  type SessionResult,
  type StateMode,
} from "@stillmind/domain";

const SESSION_KEY = "stillmind.web.sessions.v1";
const SEED_FEEDBACK_KEY = "stillmind.web.seedFeedback.v1";

const STATE_OPTIONS: Array<{ id: StateMode; label: string; body: string; outcome: DesiredOutcome; activation: 1 | 2 | 3 | 4 | 5 }> = [
  { id: "impulsive", label: "想立刻反击", body: "先不让冲动替你决定。", outcome: "pause", activation: 4 },
  { id: "looping", label: "脑子在重播", body: "把剧情从脑内移到银幕。", outcome: "distance", activation: 3 },
  { id: "tense", label: "身体很紧", body: "先让注意落到一个稳定点。", outcome: "settle", activation: 4 },
  { id: "hurt", label: "被一句话刺到", body: "看见受伤角色，不急着解释。", outcome: "release", activation: 3 },
  { id: "numb", label: "有点断开", body: "用睁眼练习回到当下。", outcome: "choose", activation: 3 },
  { id: "curious", label: "想长期练习", body: "训练更稳定的观察位置。", outcome: "awareness", activation: 2 },
];

const ACTIONS = ["喝水 + 走路 3 分钟", "回到当前任务 25 分钟", "先不回复，稍后再决定", "写下一句事实，不写评价"];

type ReuseIntent = "会" | "不确定" | "不会";

type SeedFeedback = {
  id: string;
  sessionId: string;
  createdAt: string;
  mode: StateMode;
  methodId: MethodId;
  intensityBefore: number;
  intensityAfter: number;
  reuseIntent: ReuseIntent;
  note: string;
};

const METHOD_MARKS: Record<MethodId, string> = {
  "inner-cinema": "观",
  "paced-breath": "息",
  "thought-watching": "觉",
  "wide-gaze": "凝",
  "body-scan": "内",
  "person-shift": "名",
  "logout-pause": "出",
  release: "恕",
  "open-awareness": "合",
  "grounded-action": "焦",
  "trigger-journal": "稳",
  anchors: "远",
};

const FAMILY_LABELS: Record<MethodDefinition["family"], string> = {
  distance: "拉开距离",
  settle: "先安定",
  observe: "练习观察",
  release: "松开重播",
  return: "回到行动",
  reflect: "复盘习惯",
};

type MethodGuidance = {
  anchor: string;
  mechanism: string;
  reminder: string;
};

const METHOD_GUIDANCE: Record<MethodId, MethodGuidance> = {
  "inner-cinema": {
    anchor: "银幕上的一幕",
    mechanism: "把刚才的反应放到屏幕上，你就不只是在角色里，也坐回了观众席。",
    reminder: "不用分析自己是什么人，只看见这一幕正在发生。",
  },
  "paced-breath": {
    anchor: "呼气时的数字",
    mechanism: "重点不是控制呼吸，而是让注意力落在数字上，内在对白会慢慢降下来。",
    reminder: "如果数乱了，从下一个呼气继续，不需要重新来过。",
  },
  "thought-watching": {
    anchor: "念头升起又落下",
    mechanism: "旁观念头的起伏，你会看见小我如何冒头，也看见它会自己变化。",
    reminder: "不追随，也不赶走；回来很多次也算练习。",
  },
  "wide-gaze": {
    anchor: "一束安静烛光",
    mechanism: "固定一个可看的对象，注意力就少一点被脑内剧情牵走。",
    reminder: "不是用力盯，眼睛累了就眨眼，轻轻回来。",
  },
  "body-scan": {
    anchor: "身体里的一个落点",
    mechanism: "把注意放回身体感受，会让解释性的念头少一点接管全局。",
    reminder: "哪里不舒服就跳过，回到脚底、椅子或手掌。",
  },
  "person-shift": {
    anchor: "从“我”换成名字",
    mechanism: "把第一人称换成名字，反应会从“我就是这样”变成“有人正在经历”。",
    reminder: "这不是否认自己，只是临时拉开一点距离。",
  },
  "logout-pause": {
    anchor: "暂时登出解释界面",
    mechanism: "解释常常会继续造剧情，先不互动，反应就少一点燃料。",
    reminder: "不要把登出做成麻木；一分钟后仍要回到现实行动。",
  },
  release: {
    anchor: "情绪起伏的波纹",
    mechanism: "允许反应出现，同时保留旁观位置，情绪就不必变成身份。",
    reminder: "宽恕不是替对方开脱，边界仍然可以清楚。",
  },
  "open-awareness": {
    anchor: "更宽的空间感",
    mechanism: "把声音、身体和念头一起纳入，单一的“我”就不再占满全部画面。",
    reminder: "不追求神秘体验，只记住一点安静的质地。",
  },
  "grounded-action": {
    anchor: "一个很小的细节",
    mechanism: "把视角压缩到具体感官，脑内大剧情会被切成可处理的小片段。",
    reminder: "只选一个细节，不需要同时抓住所有感官。",
  },
  "trigger-journal": {
    anchor: "让晃动画面慢下来",
    mechanism: "观察注意如何被带走，再轻轻稳定它，就是在训练意识稳定性。",
    reminder: "稳定不了也没关系，知道自己被带走就是进步。",
  },
  anchors: {
    anchor: "从近景拉到高空",
    mechanism: "把视角从眼前小事拉到更大时间线，角色会变小，空间会变大。",
    reminder: "拉远后要回来，选择一个现实里的小动作。",
  },
};

function loadSessions(): PracticeSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeSessions(sessions: PracticeSession[]) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(0, 30)));
}

function storeSeedFeedback(feedback: SeedFeedback) {
  try {
    const raw = window.localStorage.getItem(SEED_FEEDBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    window.localStorage.setItem(SEED_FEEDBACK_KEY, JSON.stringify([feedback, ...list].slice(0, 50)));
  } catch {
    window.localStorage.setItem(SEED_FEEDBACK_KEY, JSON.stringify([feedback]));
  }
}

function toActivationBucket(value: number): 1 | 2 | 3 | 4 | 5 {
  if (value <= 1) return 1;
  if (value <= 3) return 2;
  if (value <= 5) return 3;
  if (value <= 7) return 4;
  return 5;
}

function practiceFor(methodId: MethodId, duration: DurationMinutes): PracticeVariant | undefined {
  const exact = getPracticeVariant(methodId, duration);
  if (exact) return exact;
  const method = METHOD_BY_ID.get(methodId);
  const fallback = method?.durations[0] ?? 1;
  return getPracticeVariant(methodId, fallback);
}

export default function ResetPage() {
  const [mode, setMode] = useState<StateMode>("looping");
  const state = STATE_OPTIONS.find((item) => item.id === mode) ?? STATE_OPTIONS[0];
  const [duration, setDuration] = useState<DurationMinutes>(1);
  const [selectedMethodId, setSelectedMethodId] = useState<MethodId | undefined>();
  const [phase, setPhase] = useState<"choose" | "precheck" | "practice" | "check" | "done">("choose");
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<SessionResult | undefined>();
  const [intensityBefore, setIntensityBefore] = useState(Math.min(10, state.activation * 2));
  const [intensityAfter, setIntensityAfter] = useState(Math.min(10, state.activation * 2));
  const [reuseIntent, setReuseIntent] = useState<ReuseIntent>("不确定");
  const [feedbackNote, setFeedbackNote] = useState("");
  const action = ACTIONS[0];
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [manualChoice, setManualChoice] = useState(false);
  const [showAdvancedMethods, setShowAdvancedMethods] = useState(false);
  const [showDurationOptions, setShowDurationOptions] = useState(false);
  const [showAllStates, setShowAllStates] = useState(false);
  const [incomingTrigger, setIncomingTrigger] = useState("");
  const startedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const timer = window.setTimeout(() => setSessions(loadSessions()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const storedTrigger = window.sessionStorage.getItem(PENDING_TRIGGER_KEY) ?? "";
        const storedMode = window.sessionStorage.getItem(PENDING_MODE_KEY);
        const queryMode = params.get("mode");
        const queryMethod = params.get("method") as MethodId | null;
        const queryMethodDef = queryMethod ? METHOD_BY_ID.get(queryMethod) : undefined;
        const nextMode = isStateMode(storedMode)
          ? storedMode
          : isStateMode(queryMode)
            ? queryMode
            : queryMethodDef?.modes[0]
              ? queryMethodDef.modes[0]
              : storedTrigger
                ? detectStateModeFromText(storedTrigger)
                : undefined;

        if (storedTrigger) {
          setIncomingTrigger(storedTrigger.slice(0, 220));
        }
        if (nextMode) {
          setMode(nextMode);
          const nextActivation = STATE_OPTIONS.find((item) => item.id === nextMode)?.activation ?? 3;
          setIntensityBefore(Math.min(10, nextActivation * 2));
          setIntensityAfter(Math.min(10, nextActivation * 2));
          if (!queryMethodDef) {
            setManualChoice(false);
            setShowAdvancedMethods(false);
          }
        }
        if (queryMethodDef) {
          setSelectedMethodId(queryMethodDef.id);
          setManualChoice(true);
          setShowAdvancedMethods(true);
          setDuration(queryMethodDef.durations.includes(1) ? 1 : queryMethodDef.durations[0]);
        }
        window.sessionStorage.removeItem(PENDING_TRIGGER_KEY);
        window.sessionStorage.removeItem(PENDING_MODE_KEY);
      } catch {
        // keep default recommendation if storage or URL parsing is unavailable
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const recommendation = useMemo(() => recommendMethods({
    activation: state.activation,
    mode,
    duration,
    outcome: state.outcome,
    eyesOpenPreferred: true,
    bodyFocusAllowed: true,
    breathChangeAllowed: true,
  }), [duration, mode, state.activation, state.outcome]);

  const recommendedMethod = recommendation.kind === "practice" ? recommendation.primary : METHOD_BY_ID.get("grounded-action")!;
  const activeMethodId = manualChoice && selectedMethodId ? selectedMethodId : recommendedMethod.id;
  const method = METHOD_BY_ID.get(activeMethodId) ?? recommendedMethod;
  const practice = practiceFor(method.id, duration) ?? practiceFor(method.id, method.durations[0]);
  const visibleStateOptions = showAllStates ? STATE_OPTIONS : STATE_OPTIONS.slice(0, 3);
  const currentStep = practice?.steps[stepIndex];
  const totalSeconds = practice?.steps.reduce((sum, step) => sum + step.seconds, 0) ?? 0;
  const completedSeconds = practice ? practice.steps.slice(0, stepIndex).reduce((sum, step) => sum + step.seconds, 0) + ((currentStep?.seconds ?? 0) - secondsLeft) : 0;
  const progress = totalSeconds > 0 ? Math.min(100, Math.max(0, (completedSeconds / totalSeconds) * 100)) : 0;
  const methodReason =
    recommendation.kind === "practice" && method.id === recommendation.primary.id
      ? recommendation.explanation
      : method.summary;
  const practiceShellClass = `flex min-w-0 flex-col rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-inner shadow-black/30 ${phase === "practice" ? "min-h-[560px]" : "min-h-[360px]"}`;

  useEffect(() => {
    if (phase !== "practice" || paused || !practice) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value > 1) return value - 1;
        setStepIndex((index) => {
          const next = index + 1;
          if (next >= practice.steps.length) {
            window.clearInterval(timer);
            setPhase("check");
            return index;
          }
          setSecondsLeft(practice.steps[next]?.seconds ?? 0);
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, phase, practice]);

  function changeMode(nextMode: StateMode) {
    setMode(nextMode);
    setPhase("choose");
    setManualChoice(false);
    setShowAdvancedMethods(false);
    setIncomingTrigger("");
    setResult(undefined);
    const nextActivation = STATE_OPTIONS.find((item) => item.id === nextMode)?.activation ?? 3;
    setIntensityBefore(Math.min(10, nextActivation * 2));
    setIntensityAfter(Math.min(10, nextActivation * 2));
  }

  function chooseMethod(id: MethodId) {
    setSelectedMethodId(id);
    setManualChoice(true);
    setShowAdvancedMethods(true);
    setPhase("choose");
    setResult(undefined);
  }

  function requestStart() {
    if (!practice) return;
    setResult(undefined);
    setFeedbackNote("");
    setReuseIntent("不确定");
    setIntensityAfter(intensityBefore);
    setPhase("precheck");
  }

  function startPractice() {
    if (!practice) return;
    startedAt.current = new Date().toISOString();
    setStepIndex(0);
    setSecondsLeft(practice.steps[0]?.seconds ?? 0);
    setPaused(false);
    setPhase("practice");
    setResult(undefined);
    setFeedbackNote("");
    setReuseIntent("不确定");
  }

  function stopPractice() {
    setResult("stopped");
    setPhase("check");
  }

  function completeSession() {
    if (!practice) return;
    const sessionId = `web-${Date.now()}`;
    const finalResult: SessionResult = result ?? (intensityAfter < intensityBefore ? "better" : intensityAfter > intensityBefore ? "worse" : "same");
    const session: PracticeSession = {
      id: sessionId,
      schemaVersion: 1,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      status: finalResult === "stopped" ? "stopped" : "completed",
      mode,
      methodId: method.id,
      durationSeconds: totalSeconds,
      activationBefore: toActivationBucket(intensityBefore),
      activationAfter: toActivationBucket(intensityAfter),
      result: finalResult,
      groundedActionId: action,
      contentVersion: practice.contentVersion,
    };
    const next = [session, ...sessions].slice(0, 30);
    setSessions(next);
    storeSessions(next);
    storeSeedFeedback({
      id: `seed-${Date.now()}`,
      sessionId,
      createdAt: new Date().toISOString(),
      mode,
      methodId: method.id,
      intensityBefore,
      intensityAfter,
      reuseIntent,
      note: feedbackNote.trim().slice(0, 500),
    });
    setPhase("done");
  }

  function resetAgain() {
    setPhase("choose");
    setStepIndex(0);
    setSecondsLeft(0);
    setResult(undefined);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050914] text-stone-50">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_72%_78%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(135deg,#050914_0%,#07111f_46%,#0b1020_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-200 via-violet-500 to-sky-500 p-[2px] shadow-lg shadow-violet-950/30"><span className="h-full w-full rounded-full bg-[#070d1b]" /></span>
            <span><span className="block text-sm uppercase tracking-[0.34em] text-violet-100/70">StillMind</span><span className="block text-sm font-medium text-stone-200">沉寂小我练习器</span></span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-stone-300">
            <AmbientToggle className="hidden sm:inline-flex" />
            <Link className="rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white" href="/methods">方法库</Link>
            <Link className="hidden rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white sm:inline-flex" href="/support/seed-test">参与测试</Link>
          </nav>
        </header>

        <div className="mt-5">
          <WorkflowNav active="reset" />
        </div>

        <section className="grid w-full min-w-0 flex-1 gap-5 py-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <aside className="w-full min-w-0 space-y-4 lg:sticky lg:top-6">
            <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-violet-200/15 bg-slate-950/55 p-5 shadow-2xl shadow-violet-950/25 backdrop-blur-xl sm:max-w-full">
              <p className="text-sm uppercase tracking-[0.26em] text-violet-200/65">先把声音放下来</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">脑子里那个停不下来的声音，先让它静一点。</h1>
              <p className="mt-4 text-base leading-7 text-stone-300">这些练习都在做同一件事：从剧情里的角色，退回能观看的观众席。</p>
              <div className="mt-4 break-all rounded-2xl border border-violet-200/20 bg-violet-200/[0.08] p-3 text-sm leading-6 text-violet-50">第一次体验：选当前状态，做 1 分钟推荐练习，看看“被带走”的程度有没有下降。</div>
              {incomingTrigger ? (
                <div className="mt-4 rounded-2xl border border-amber-200/18 bg-amber-100/[0.06] p-3 text-sm leading-6 text-amber-50/90">
                  <span className="block text-xs uppercase tracking-[0.18em] text-amber-100/55">刚才说的是</span>
                  <span className="mt-1 block break-all text-stone-200">{incomingTrigger}</span>
                </div>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-stone-500">请不要输入真实姓名、隐私事件、创伤细节、医疗或危机场景。本工具只是日常情绪 reset 和自我观察练习，不替代心理咨询或医疗帮助。</p>
            </div>
            <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl sm:max-w-full">
              <p className="px-1 text-sm font-medium text-stone-100">当前状态</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibleStateOptions.map((item) => <button key={item.id} type="button" onClick={() => changeMode(item.id)} className={`rounded-2xl border p-3 text-left transition ${mode === item.id ? "border-violet-200/70 bg-violet-200/14 shadow-lg shadow-violet-950/20" : "border-white/10 bg-slate-950/36 hover:border-violet-200/35"}`}><span className="block text-sm font-semibold text-white">{item.label}</span><span className="mt-1 block text-xs leading-5 text-stone-400">{item.body}</span></button>)}
              </div>
              <button type="button" onClick={() => setShowAllStates((value) => !value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium text-stone-300 transition hover:border-violet-200/35 hover:text-white">{showAllStates ? "收起状态" : "更多状态"}</button>
            </div>
          </aside>

          <section className="grid w-full min-w-0 gap-5 rounded-[2rem] border border-violet-200/15 bg-[#07111f]/76 p-4 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-violet-200/65">推荐练习</p>
                <div className="mt-3 flex flex-wrap items-end gap-3"><h2 className="text-3xl font-semibold text-white sm:text-4xl">{method.title}</h2><span className="rounded-full border border-amber-200/25 bg-amber-100/10 px-3 py-1 text-sm text-amber-100">{practice?.minutes ?? duration} 分钟</span></div>
                <p className="mt-3 max-w-2xl text-base leading-7 text-stone-300">{methodReason}</p>
                <div className="mt-3 grid gap-2 text-xs text-stone-400 sm:grid-cols-3">
                  <span className="rounded-full border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2">先被看见</span>
                  <span className="rounded-full border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2">退回观众席</span>
                  <span className="rounded-full border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2">前后 0-10 评分</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-violet-100/70">先跟着这一分钟走完，不用先研究 12 种方法；完成后会看到前后变化。</p>{phase === "choose" ? <button type="button" onClick={requestStart} className="mt-4 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-950/25 transition hover:scale-[1.01]">开始 {practice?.minutes ?? duration} 分钟练习</button> : null}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {!showDurationOptions ? <button type="button" onClick={() => setShowDurationOptions(true)} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-stone-300 transition hover:border-violet-200/35 hover:text-white">默认 1 分钟 · 调整</button> : [1, 3, 5, 10].map((value) => {
                  const minutes = value as DurationMinutes;
                  const available = method.durations.includes(minutes);
                  return <button key={value} type="button" disabled={!available} onClick={() => setDuration(minutes)} className={`rounded-full border px-3 py-2 text-sm transition ${duration === minutes ? "border-violet-200/70 bg-violet-200/16 text-white" : "border-white/10 bg-white/[0.04] text-stone-300 enabled:hover:border-violet-200/35 disabled:cursor-not-allowed disabled:opacity-35"}`}>{value}m</button>;
                })}
              </div>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className={practiceShellClass}>
                {phase === "choose" && practice ? <ChoosePractice method={method} practice={practice} onStart={requestStart} /> : null}
                {phase === "precheck" && practice ? <PrePracticeCheck method={method} practice={practice} intensityBefore={intensityBefore} onIntensityBefore={setIntensityBefore} onStart={startPractice} /> : null}
                {phase === "practice" && practice && currentStep ? <PracticePlayer method={method} practice={practice} stepIndex={stepIndex} secondsLeft={secondsLeft} progress={progress} paused={paused} onPause={() => setPaused((value) => !value)} onStop={stopPractice} /> : null}
                {phase === "check" ? <CheckView intensityBefore={intensityBefore} intensityAfter={intensityAfter} reuseIntent={reuseIntent} feedbackNote={feedbackNote} onIntensityAfter={setIntensityAfter} onReuseIntent={setReuseIntent} onFeedbackNote={setFeedbackNote} onComplete={completeSession} /> : null}
                {phase === "done" ? <DoneView method={method} action={action} intensityBefore={intensityBefore} intensityAfter={intensityAfter} onAgain={resetAgain} /> : null}
              </div>

              <aside className="min-w-0 space-y-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-100">进阶方法库</p><button type="button" onClick={() => setShowAdvancedMethods((value) => !value)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-stone-300 transition hover:border-violet-200/35 hover:text-white">{showAdvancedMethods ? "收起" : "展开"}</button></div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">第一次不用手动选择方法，系统已根据当前状态推荐。</p>
                  {!showAdvancedMethods ? <div className="mt-3 rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] p-3"><p className="text-xs uppercase tracking-[0.18em] text-violet-200/60">当前推荐</p><p className="mt-2 text-sm font-semibold text-white">{method.title}</p><p className="mt-1 text-xs leading-5 text-stone-500">完成第一次练习后，可以探索更多方法。</p></div> : <div className="mt-3 grid max-h-[340px] grid-cols-1 gap-2 overflow-y-auto pr-1">
                    {METHOD_CATALOG.map((item) => <button key={item.id} type="button" onClick={() => chooseMethod(item.id)} className={`group rounded-2xl border p-2.5 text-left transition ${item.id === method.id ? "border-violet-200/70 bg-violet-200/14" : "border-white/10 bg-slate-950/32 hover:border-violet-200/35"}`}><span className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-300/80 to-amber-200/70 text-sm font-bold text-slate-950">{METHOD_MARKS[item.id]}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="block truncate text-xs text-stone-500">{FAMILY_LABELS[item.family]}</span></span></span></button>)}
                  </div>}
                </div>
                {sessions.length > 0 ? <div className="rounded-[1.6rem] border border-amber-200/15 bg-amber-100/[0.055] p-4">
                  <p className="text-sm font-medium text-stone-100">本机记录</p>
                  <p className="mt-2 break-all text-sm leading-6 text-stone-400">只保存在当前浏览器，用来做 seed user 测试和下次推荐，不上传私人触发内容。</p>
                  <div className="mt-4 space-y-2">
                    {sessions.slice(0, 3).map((session) => <div key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/36 p-3"><p className="text-sm font-medium text-stone-100">{METHOD_BY_ID.get(session.methodId)?.title ?? session.methodId}</p><p className="mt-1 text-xs text-stone-500">{session.result ?? "completed"} · {new Date(session.startedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>)}
                  </div>
                </div> : null}
              </aside>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function ChoosePractice({ method, practice, onStart }: { method: MethodDefinition; practice: PracticeVariant; onStart: () => void }) {
  const guidance = METHOD_GUIDANCE[method.id];

  return (
    <div className="flex h-full flex-col justify-between gap-5">
      <div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(180px,0.55fr)] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">练习预览</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{practice.title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-400">{practice.subtitle}</p>
            <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-stone-400">{practice.preparation}</p>
          </div>
          <MethodAnchorVisual methodId={method.id} label={guidance.anchor} />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] p-3">
            <p className="text-xs font-medium text-violet-100">为什么这样做</p>
            <p className="mt-2 text-xs leading-5 text-stone-400">{guidance.mechanism}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/15 bg-amber-100/[0.055] p-3">
            <p className="text-xs font-medium text-amber-100">温柔提醒</p>
            <p className="mt-2 text-xs leading-5 text-stone-400">{guidance.reminder}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {practice.steps.slice(0, 3).map((step, index) => (
            <div key={step.id} className="rounded-2xl border border-white/10 bg-slate-950/42 p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-violet-200/60">Step {String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-sm font-semibold text-white">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-stone-500">{step.seconds} 秒</p>
            </div>
          ))}
        </div>
      </div>
      <button type="button" onClick={onStart} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-violet-950/30 transition hover:scale-[1.01]">开始 {practice.minutes} 分钟练习</button>
    </div>
  );
}

function MethodAnchorVisual({ methodId, label }: { methodId: MethodId; label: string }) {
  const base = "relative min-h-44 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-4 shadow-inner shadow-black/30";

  if (methodId === "wide-gaze") {
    return (
      <div className={base}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_50%_62%,rgba(168,85,247,0.18),transparent_42%)]" />
        <div className="relative mx-auto mt-5 h-24 w-16">
          <span className="absolute left-1/2 top-0 h-12 w-8 -translate-x-1/2 rounded-full bg-gradient-to-b from-white via-amber-200 to-orange-500 shadow-[0_0_42px_rgba(251,191,36,0.55)]" />
          <span className="absolute bottom-0 left-1/2 h-16 w-10 -translate-x-1/2 rounded-t-full bg-gradient-to-b from-slate-700 to-slate-950" />
        </div>
        <p className="relative mt-4 text-center text-sm font-medium text-stone-100">{label}</p>
      </div>
    );
  }

  if (methodId === "paced-breath") {
    return (
      <div className={base}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(96,165,250,0.24),transparent_44%)]" />
        <div className="relative mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full border border-sky-100/20 bg-sky-200/10 shadow-[0_0_50px_rgba(96,165,250,0.22)]">
          <span className="text-4xl font-semibold text-sky-50">1</span>
          <span className="absolute -right-2 top-5 h-6 w-4 rounded-full bg-gradient-to-b from-white to-sky-200 opacity-80" />
        </div>
        <p className="relative mt-4 text-center text-sm font-medium text-stone-100">{label}</p>
      </div>
    );
  }

  if (methodId === "trigger-journal") {
    return (
      <div className={base}>
        <div className="absolute inset-4 rounded-[1.25rem] bg-[repeating-conic-gradient(from_12deg,rgba(167,243,208,0.18)_0deg_10deg,rgba(15,23,42,0.4)_10deg_20deg)] opacity-80" />
        <div className="absolute inset-12 rounded-full border border-emerald-100/30 bg-slate-950/65 backdrop-blur-[1px]" />
        <p className="relative mt-28 text-center text-sm font-medium text-stone-100">{label}</p>
      </div>
    );
  }

  if (methodId === "anchors") {
    return (
      <div className={base}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(96,165,250,0.28),transparent_20%),radial-gradient(circle_at_50%_45%,rgba(168,85,247,0.16),transparent_44%)]" />
        <div className="relative mx-auto mt-5 grid h-28 w-28 place-items-center rounded-full border border-sky-100/20 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.7),rgba(96,165,250,0.35)_24%,rgba(15,23,42,0.92)_70%)] shadow-[0_0_60px_rgba(96,165,250,0.24)]">
          <span className="text-xs text-sky-50/80">高空</span>
        </div>
        <p className="relative mt-3 text-center text-sm font-medium text-stone-100">{label}</p>
      </div>
    );
  }

  if (methodId === "inner-cinema") {
    return (
      <div className={base}>
        <div className="absolute inset-x-5 top-5 h-24 rounded-[1.2rem] border border-amber-100/15 bg-[radial-gradient(circle_at_50%_20%,rgba(245,158,11,0.24),transparent_45%),linear-gradient(180deg,rgba(30,41,59,0.7),rgba(2,6,23,0.92))]" />
        <span className="absolute bottom-12 left-1/2 h-12 w-12 -translate-x-1/2 rounded-full bg-slate-900 shadow-[0_0_34px_rgba(168,85,247,0.24)]" />
        <p className="relative mt-32 text-center text-sm font-medium text-stone-100">{label}</p>
      </div>
    );
  }

  return (
    <div className={base}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(216,180,254,0.22),transparent_38%),radial-gradient(circle_at_70%_72%,rgba(245,158,11,0.12),transparent_32%)]" />
      <div className="relative mx-auto mt-8 grid h-20 w-20 place-items-center rounded-full border border-violet-100/20 bg-violet-200/10 shadow-[0_0_48px_rgba(168,85,247,0.24)]">
        <span className="text-xl font-semibold text-violet-50">{METHOD_MARKS[methodId]}</span>
      </div>
      <p className="relative mt-5 text-center text-sm font-medium text-stone-100">{label}</p>
    </div>
  );
}

function PrePracticeCheck({ method, practice, intensityBefore, onIntensityBefore, onStart }: { method: MethodDefinition; practice: PracticeVariant; intensityBefore: number; onIntensityBefore: (value: number) => void; onStart: () => void }) {
  return <div className="flex h-full flex-col justify-center gap-6"><div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">练习前</p><h3 className="mt-3 text-3xl font-semibold text-white">先标记一下此刻的强度。</h3><p className="mt-3 text-base leading-7 text-stone-400">你现在被脑内剧情带走的程度？0 = 很稳定，10 = 完全被带走。</p></div><IntensityScale label="被脑内剧情带走的程度" value={intensityBefore} onChange={onIntensityBefore} /><div className="rounded-3xl border border-violet-200/15 bg-violet-200/[0.06] p-4"><p className="text-sm text-stone-400">接下来练习</p><p className="mt-2 text-xl font-semibold text-white">{practice.minutes} 分钟 · {method.title}</p><p className="mt-2 text-sm leading-6 text-stone-500">练完后会自动记录练习后分数、复用意愿和一句话反馈。</p></div><button type="button" onClick={onStart} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-violet-950/30 transition hover:scale-[1.01]">开始 {practice.minutes} 分钟练习</button></div>;
}

function PracticePlayer({ method, practice, stepIndex, secondsLeft, progress, paused, onPause, onStop }: { method: MethodDefinition; practice: PracticeVariant; stepIndex: number; secondsLeft: number; progress: number; paused: boolean; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  return <div className="flex h-full flex-col gap-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">{method.title}</p><h3 className="mt-2 text-2xl font-semibold text-white">{step.title}</h3></div><div className="text-right"><p className="text-4xl font-semibold text-white">{secondsLeft}</p><p className="text-xs uppercase tracking-[0.22em] text-stone-500">秒</p></div></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-200 to-amber-200 transition-all" style={{ width: `${progress}%` }} /></div><MethodExperience methodId={method.id} instruction={step.instruction} secondsLeft={secondsLeft} stepIndex={stepIndex} /><div className="mt-auto flex flex-wrap gap-3"><button type="button" onClick={onPause} className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-200/35">{paused ? "继续" : "暂停"}</button><button type="button" onClick={onStop} className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-stone-300 transition hover:border-amber-200/35 hover:text-white">停止并反馈</button></div></div>;
}

function MethodExperience({ methodId, instruction, secondsLeft, stepIndex }: { methodId: MethodId; instruction: string; secondsLeft: number; stepIndex: number }) {
  const breathIn = Math.floor(secondsLeft / 3) % 2 === 0;
  const thoughts = ["我必须回应", "是不是我不够好", "他们不理解我", "我不能输"];
  if (methodId === "paced-breath") return <div className="grid flex-1 place-items-center rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_58%)] p-6 text-center"><div className={`grid h-48 w-48 place-items-center rounded-full border border-violet-100/20 bg-[radial-gradient(circle_at_38%_32%,rgba(255,255,255,0.84),rgba(221,214,254,0.46)_18%,rgba(76,29,149,0.28)_42%,rgba(2,6,23,0.96)_72%)] shadow-[0_0_52px_rgba(168,85,247,0.35),0_0_100px_rgba(245,158,11,0.16)] transition duration-1000 ${breathIn ? "scale-105" : "scale-95"}`}><span className="text-xl font-semibold tracking-[0.28em] text-white">{breathIn ? "吸 气" : "呼 气"}</span></div><p className="mt-6 max-w-md text-base leading-8 text-stone-300">{instruction}</p></div>;
  if (methodId === "inner-cinema") return <div className="flex flex-1 flex-col justify-center rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.14),transparent_45%),#050914] p-6 text-center"><p className="text-xs uppercase tracking-[0.28em] text-violet-200/55">Scene {String(stepIndex + 1).padStart(2, "0")}</p><p className="mx-auto mt-8 max-w-2xl text-3xl font-semibold leading-tight text-white">{instruction}</p><div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-2 text-xs text-stone-400"><span className="rounded-full bg-white/[0.06] px-3 py-2">角色</span><span className="rounded-full bg-violet-200/12 px-3 py-2 text-violet-100">观众</span><span className="rounded-full bg-amber-200/12 px-3 py-2 text-amber-100">见证</span></div></div>;
  if (methodId === "wide-gaze") return <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-sky-200/15 bg-slate-950/62 p-6 text-center"><div className="absolute inset-8 rounded-full border border-sky-200/10" /><div className="absolute left-12 top-16 h-3 w-3 rounded-full bg-sky-200/35" /><div className="absolute right-14 top-24 h-2 w-2 rounded-full bg-violet-200/40" /><div className="absolute bottom-20 left-20 h-2 w-2 rounded-full bg-amber-200/40" /><div className="grid h-24 w-24 place-items-center rounded-full border border-sky-100/25 bg-sky-200/10 shadow-[0_0_50px_rgba(96,165,250,0.2)]"><span className="h-3 w-3 rounded-full bg-sky-100" /></div><p className="mt-64 max-w-md text-base leading-8 text-stone-300">{instruction}</p></div>;
  if (methodId === "thought-watching") return <ThoughtWatching instruction={instruction} stepIndex={stepIndex} thoughts={thoughts} />;
  if (methodId === "body-scan") return <BodyScan instruction={instruction} />;
  if (methodId === "person-shift") return <PersonShift instruction={instruction} />;
  if (methodId === "logout-pause") return <div className="grid flex-1 content-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/62 p-6"><div className="grid grid-cols-3 gap-2 text-center text-sm"><span className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-stone-500">解释</span><span className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-stone-500">参与</span><span className="rounded-2xl border border-amber-200/35 bg-amber-200/12 p-4 text-amber-100">登出</span></div><p className="text-center text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
  if (methodId === "release") return <ReleasePractice instruction={instruction} />;
  if (methodId === "open-awareness") return <OpenAwareness instruction={instruction} stepIndex={stepIndex} />;
  if (methodId === "grounded-action") return <GroundedAction instruction={instruction} />;
  if (methodId === "trigger-journal") return <StabilityPractice instruction={instruction} secondsLeft={secondsLeft} />;
  if (methodId === "anchors") return <div className="grid flex-1 place-items-center rounded-[2rem] border border-white/10 bg-slate-950/62 p-6 text-center"><div className="relative grid h-64 w-64 place-items-center"><span className="absolute h-24 w-24 rounded-full border border-violet-200/30" /><span className="absolute h-40 w-40 rounded-full border border-sky-200/20" /><span className="absolute h-60 w-60 rounded-full border border-amber-200/15" /><span className="text-sm text-stone-300">房间 → 城市 → 天空</span></div><p className="max-w-md text-base leading-8 text-stone-300">{instruction}</p></div>;
  return <div className="grid flex-1 place-items-center rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_34%,rgba(139,92,246,0.14),transparent_45%),rgba(2,6,23,0.72)] p-6 text-center"><div>{thoughts.map((thought, index) => <span key={thought} className="m-1 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-300" style={{ opacity: Math.max(0.25, 1 - (stepIndex + index) * 0.14) }}>{thought}</span>)}<p className="mx-auto mt-8 max-w-xl text-2xl font-semibold leading-10 text-white">{instruction}</p></div></div>;
}

function ThoughtWatching({ instruction, stepIndex, thoughts }: { instruction: string; stepIndex: number; thoughts: string[] }) {
  return <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.16),transparent_55%),rgba(2,6,23,0.72)] p-6 text-center"><div className="absolute inset-10 rounded-full border border-violet-200/10" /><div className="absolute inset-20 rounded-full border border-amber-200/10" />{thoughts.map((thought, index) => <span key={thought} className="absolute rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-xs text-stone-300 shadow-lg shadow-black/20" style={{ left: `${16 + (index % 2) * 55}%`, top: `${18 + index * 15}%`, opacity: Math.max(0.26, 0.88 - (stepIndex + index) * 0.16) }}>{thought}</span>)}<div className="relative grid h-36 w-36 place-items-center rounded-full border border-violet-100/20 bg-violet-200/10 shadow-[0_0_70px_rgba(168,85,247,0.22)]"><span className="text-sm font-semibold tracking-[0.26em] text-violet-100">看见</span></div><p className="relative max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
}

function BodyScan({ instruction }: { instruction: string }) {
  const zones = ["脚底", "手掌", "胸口", "肩颈"];
  const [zone, setZone] = useState(zones[0]);
  return <div className="grid flex-1 content-center gap-5 rounded-[2rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.12),transparent_45%),rgba(2,6,23,0.72)] p-6"><div className="mx-auto grid h-64 w-40 place-items-center rounded-full border border-cyan-100/15 bg-cyan-200/[0.035]"><div className="grid gap-3">{zones.map((item) => <button key={item} type="button" onClick={() => setZone(item)} className={`rounded-full border px-4 py-2 text-sm transition ${zone === item ? "border-cyan-100/60 bg-cyan-100/16 text-white shadow-[0_0_28px_rgba(34,211,238,0.16)]" : "border-white/10 bg-white/[0.04] text-stone-400"}`}>{item}</button>)}</div></div><p className="text-center text-sm text-cyan-100/80">当前落点：{zone}</p><p className="text-center text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
}

function PersonShift({ instruction }: { instruction: string }) {
  const [name, setName] = useState("Will");
  const [sentence, setSentence] = useState("我现在很想证明自己没错。");
  const shifted = sentence.replaceAll("我", name || "这个人");
  return <div className="grid flex-1 content-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/62 p-5"><p className="text-base leading-7 text-stone-300">{instruction}</p><input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-violet-200/50" placeholder="你的名字" /><textarea value={sentence} onChange={(event) => setSentence(event.target.value)} className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-violet-200/50" /><div className="rounded-3xl border border-violet-200/20 bg-violet-200/10 p-4"><p className="text-xs uppercase tracking-[0.22em] text-violet-200/70">替换后</p><p className="mt-2 text-xl font-semibold leading-8 text-white">{shifted}</p></div></div>;
}

function ReleasePractice({ instruction }: { instruction: string }) {
  const [choice, setChoice] = useState("允许出现");
  const options = ["允许出现", "保持边界", "少重播一次"];
  return <div className="grid flex-1 place-items-center rounded-[2rem] border border-rose-200/15 bg-[radial-gradient(circle_at_50%_16%,rgba(251,113,133,0.12),transparent_42%),rgba(2,6,23,0.72)] p-6 text-center"><div className="flex flex-wrap justify-center gap-2">{options.map((item) => <button key={item} type="button" onClick={() => setChoice(item)} className={`rounded-full border px-4 py-2 text-sm transition ${choice === item ? "border-rose-100/60 bg-rose-100/14 text-white" : "border-white/10 bg-white/[0.04] text-stone-400"}`}>{item}</button>)}</div><div className="my-8 h-24 w-full max-w-md overflow-hidden rounded-full border border-rose-100/10 bg-white/[0.035]"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-rose-300/0 via-rose-200/20 to-amber-200/30 blur-sm" /></div><p className="text-xs uppercase tracking-[0.24em] text-rose-100/60">{choice}</p><p className="mt-3 max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
}

function OpenAwareness({ instruction, stepIndex }: { instruction: string; stepIndex: number }) {
  const fields = ["声音", "身体", "念头"];
  return <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(216,180,254,0.13),transparent_52%),rgba(2,6,23,0.72)] p-6 text-center">{[0, 1, 2].map((index) => <span key={index} className="absolute rounded-full border border-violet-100/10" style={{ width: 120 + index * 90, height: 120 + index * 90, opacity: 0.75 - index * 0.16 }} />)}<div className="relative grid gap-3">{fields.map((field, index) => <span key={field} className={`rounded-full border px-5 py-3 text-sm transition ${index <= stepIndex % 3 ? "border-violet-100/45 bg-violet-100/13 text-violet-50" : "border-white/10 bg-white/[0.04] text-stone-500"}`}>{field}</span>)}</div><p className="absolute bottom-8 max-w-xl px-6 text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
}

function GroundedAction({ instruction }: { instruction: string }) {
  const [focus, setFocus] = useState("杯沿");
  const objects = ["杯沿", "脚底", "光线", "一个声音"];
  return <div className="grid flex-1 content-center gap-5 rounded-[2rem] border border-amber-200/15 bg-[radial-gradient(circle_at_50%_22%,rgba(245,158,11,0.12),transparent_46%),rgba(2,6,23,0.72)] p-6 text-center"><div className="mx-auto grid h-44 w-44 place-items-center rounded-full border border-amber-100/20 bg-amber-200/10 shadow-[0_0_60px_rgba(245,158,11,0.18)]"><span className="text-2xl font-semibold text-amber-50">{focus}</span></div><div className="flex flex-wrap justify-center gap-2">{objects.map((item) => <button key={item} type="button" onClick={() => setFocus(item)} className={`rounded-full border px-4 py-2 text-sm transition ${focus === item ? "border-amber-100/60 bg-amber-100/14 text-white" : "border-white/10 bg-white/[0.04] text-stone-400"}`}>{item}</button>)}</div><p className="mx-auto max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
}

function StabilityPractice({ instruction, secondsLeft }: { instruction: string; secondsLeft: number }) {
  const [steady, setSteady] = useState(false);
  return <div className="grid flex-1 content-center gap-5 overflow-hidden rounded-[2rem] border border-emerald-200/15 bg-slate-950/70 p-6 text-center"><div className={`mx-auto grid h-56 w-56 place-items-center rounded-[2rem] border border-emerald-100/15 bg-[repeating-conic-gradient(from_0deg,rgba(167,243,208,0.12)_0deg_12deg,rgba(15,23,42,0.2)_12deg_24deg)] transition duration-700 ${steady ? "scale-95 opacity-70 blur-[0.2px]" : "scale-100 opacity-100"}`}><span className="rounded-full bg-slate-950/70 px-4 py-2 text-sm text-emerald-50">{steady ? "画面已放慢" : "画面在牵引注意"}</span></div><button type="button" onClick={() => setSteady((value) => !value)} className="mx-auto rounded-full border border-emerald-100/30 bg-emerald-100/10 px-5 py-3 text-sm font-semibold text-emerald-50">{steady ? "允许波动" : "尝试稳定"}</button><p className="mx-auto max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p><p className="text-xs text-stone-500">剩余 {secondsLeft} 秒</p></div>;
}

function CheckView({
  intensityBefore,
  intensityAfter,
  reuseIntent,
  feedbackNote,
  onIntensityAfter,
  onReuseIntent,
  onFeedbackNote,
  onComplete,
}: {
  intensityBefore: number;
  intensityAfter: number;
  reuseIntent: ReuseIntent;
  feedbackNote: string;
  onIntensityAfter: (value: number) => void;
  onReuseIntent: (value: ReuseIntent) => void;
  onFeedbackNote: (value: string) => void;
  onComplete: () => void;
}) {
  const intents: ReuseIntent[] = ["会", "不确定", "不会"];
  const delta = intensityAfter - intensityBefore;
  return <div className="flex h-full flex-col justify-center gap-5"><div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">练后反馈</p><h3 className="mt-3 text-3xl font-semibold text-white">练完后，现在是多少分？</h3><p className="mt-3 text-base leading-7 text-stone-400">只需要 20 秒。请不要写真实姓名、隐私事件、创伤细节或医疗危机场景。</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-100">练习前分数</p><span className="text-lg font-semibold text-amber-100">{intensityBefore}/10</span></div><p className="mt-2 text-xs leading-5 text-stone-500">已在开始前记录，用来和练习后状态对比。</p></div><IntensityScale label="练习后状态强度" value={intensityAfter} onChange={onIntensityAfter} /><div className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] p-4"><p className="text-sm font-medium text-stone-100">前后变化</p><p className="mt-2 text-sm leading-6 text-stone-400">{delta < 0 ? `下降 ${Math.abs(delta)} 分` : delta > 0 ? `上升 ${delta} 分` : "暂时没有变化"}</p></div><div><p className="mb-2 text-sm font-medium text-stone-100">下次类似场景是否愿意再用</p><div className="grid gap-2 sm:grid-cols-3">{intents.map((item) => <button key={item} type="button" onClick={() => onReuseIntent(item)} className={reuseIntent === item ? "rounded-2xl border border-violet-200/70 bg-violet-200/14 p-3 text-center text-sm font-semibold text-white transition" : "rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center text-sm font-semibold text-stone-300 transition hover:border-violet-200/35"}>{item}</button>)}</div></div><label className="block"><span className="mb-2 block text-sm font-medium text-stone-100">一句话反馈：哪里有用或哪里不舒服</span><textarea value={feedbackNote} onChange={(event) => onFeedbackNote(event.target.value)} maxLength={500} placeholder="例如：三步很清楚，但倒计时有点快。" className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-stone-600 focus:border-violet-200/45" /></label><button type="button" onClick={onComplete} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-4 text-base font-semibold text-slate-950">保存反馈并完成</button></div>;
}

function IntensityScale({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-100">{label}</p><span className="text-sm font-semibold text-amber-100">{value}/10</span></div><div className="mt-3 flex flex-wrap gap-1.5">{Array.from({ length: 11 }, (_, index) => <button key={index} type="button" onClick={() => onChange(index)} className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold transition ${value === index ? "border-amber-200/75 bg-amber-200/18 text-white" : "border-white/10 bg-slate-950/36 text-stone-500 hover:border-violet-200/35 hover:text-stone-200"}`}>{index}</button>)}</div></div>;
}

function DoneView({ method, action, intensityBefore, intensityAfter, onAgain }: { method: MethodDefinition; action: string; intensityBefore: number; intensityAfter: number; onAgain: () => void }) {
  const change = intensityBefore - intensityAfter;
  const changeCopy = change > 0 ? `下降了 ${change} 分` : change < 0 ? `上升了 ${Math.abs(change)} 分` : "暂时没有变化";

  return (
    <div className="grid h-full place-items-center text-center">
      <div className="max-w-xl">
        <p className="text-sm uppercase tracking-[0.26em] text-amber-100/70">回到观众席</p>
        <h3 className="mt-4 text-4xl font-semibold leading-tight text-white">你没有消灭念头，只是多了一个观察位置。</h3>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-amber-200/15 bg-amber-100/[0.055] p-4">
          <div>
            <p className="text-xs text-stone-500">练习前</p>
            <p className="mt-1 text-3xl font-semibold text-white">{intensityBefore}</p>
          </div>
          <span className="text-stone-500">→</span>
          <div>
            <p className="text-xs text-stone-500">练习后</p>
            <p className="mt-1 text-3xl font-semibold text-amber-100">{intensityAfter}</p>
          </div>
          <p className="col-span-3 text-sm text-stone-300">被带走程度{changeCopy}。这就是一次小样本，不是考试。</p>
        </div>
        <p className="mt-5 text-lg leading-8 text-stone-300">这次你练习了“{method.title}”。下一步：{action}。</p>
        <button type="button" onClick={onAgain} className="mt-8 rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:border-violet-200/40">再练一次</button>
      </div>
    </div>
  );
}
