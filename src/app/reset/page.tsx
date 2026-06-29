"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

const STATE_OPTIONS: Array<{ id: StateMode; label: string; body: string; outcome: DesiredOutcome; activation: 1 | 2 | 3 | 4 | 5 }> = [
  { id: "impulsive", label: "想立刻反击", body: "先不让冲动替你决定。", outcome: "pause", activation: 4 },
  { id: "looping", label: "脑子在重播", body: "把剧情从脑内移到银幕。", outcome: "distance", activation: 3 },
  { id: "tense", label: "身体很紧", body: "先让注意落到一个稳定点。", outcome: "settle", activation: 4 },
  { id: "hurt", label: "被一句话刺到", body: "看见受伤角色，不急着解释。", outcome: "release", activation: 3 },
  { id: "numb", label: "有点断开", body: "用睁眼练习回到当下。", outcome: "choose", activation: 3 },
  { id: "curious", label: "想长期练习", body: "训练更稳定的观察位置。", outcome: "awareness", activation: 2 },
];

const ACTIONS = ["喝水 + 走路 3 分钟", "回到当前任务 25 分钟", "先不回复，稍后再决定", "写下一句事实，不写评价"];

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

function practiceFor(methodId: MethodId, duration: DurationMinutes): PracticeVariant | undefined {
  const exact = getPracticeVariant(methodId, duration);
  if (exact) return exact;
  const method = METHOD_BY_ID.get(methodId);
  const fallback = method?.durations[0] ?? 1;
  return getPracticeVariant(methodId, fallback);
}

export default function ResetPage() {
  const [mode, setMode] = useState<StateMode>("impulsive");
  const state = STATE_OPTIONS.find((item) => item.id === mode) ?? STATE_OPTIONS[0];
  const [duration, setDuration] = useState<DurationMinutes>(1);
  const [selectedMethodId, setSelectedMethodId] = useState<MethodId | undefined>();
  const [phase, setPhase] = useState<"choose" | "practice" | "check" | "done">("choose");
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<SessionResult | undefined>();
  const [activationAfter, setActivationAfter] = useState<1 | 2 | 3 | 4 | 5>(state.activation);
  const [action, setAction] = useState(ACTIONS[0]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [manualChoice, setManualChoice] = useState(false);
  const startedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const timer = window.setTimeout(() => setSessions(loadSessions()), 0);
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
  const currentStep = practice?.steps[stepIndex];
  const totalSeconds = practice?.steps.reduce((sum, step) => sum + step.seconds, 0) ?? 0;
  const completedSeconds = practice ? practice.steps.slice(0, stepIndex).reduce((sum, step) => sum + step.seconds, 0) + ((currentStep?.seconds ?? 0) - secondsLeft) : 0;
  const progress = totalSeconds > 0 ? Math.min(100, Math.max(0, (completedSeconds / totalSeconds) * 100)) : 0;


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
    setResult(undefined);
    setActivationAfter(STATE_OPTIONS.find((item) => item.id === nextMode)?.activation ?? 3);
  }

  function chooseMethod(id: MethodId) {
    setSelectedMethodId(id);
    setManualChoice(true);
    setPhase("choose");
    setResult(undefined);
  }

  function startPractice() {
    if (!practice) return;
    startedAt.current = new Date().toISOString();
    setStepIndex(0);
    setSecondsLeft(practice.steps[0]?.seconds ?? 0);
    setPaused(false);
    setPhase("practice");
    setResult(undefined);
  }

  function stopPractice() {
    setResult("stopped");
    setPhase("check");
  }

  function completeSession() {
    if (!result || !practice) return;
    const session: PracticeSession = {
      id: `web-${Date.now()}`,
      schemaVersion: 1,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      status: result === "stopped" ? "stopped" : "completed",
      mode,
      methodId: method.id,
      durationSeconds: totalSeconds,
      activationBefore: state.activation,
      activationAfter,
      result,
      groundedActionId: action,
      contentVersion: practice.contentVersion,
    };
    const next = [session, ...sessions].slice(0, 30);
    setSessions(next);
    storeSessions(next);
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
            <Link className="rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white" href="/methods">方法库</Link>
            <Link className="hidden rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white sm:inline-flex" href="/support/seed-test">参与测试</Link>
          </nav>
        </header>

        <section className="grid min-w-0 flex-1 gap-6 py-8 lg:grid-cols-[0.9fr_1.25fr] lg:items-stretch">
          <aside className="min-w-0 max-w-[calc(100vw-2.5rem)] space-y-5 lg:max-w-none">
            <div className="rounded-[2rem] border border-violet-200/15 bg-slate-950/55 p-5 shadow-2xl shadow-violet-950/25 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.26em] text-violet-200/65">Web Reset</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">此刻，被什么带走了？</h1>
              <p className="mt-4 break-all text-base leading-7 text-stone-300">选一个当前状态，直接开始一次沉寂小我练习。</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl">
              <p className="px-1 text-sm font-medium text-stone-100">当前状态</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {STATE_OPTIONS.map((item) => <button key={item.id} type="button" onClick={() => changeMode(item.id)} className={`rounded-2xl border p-4 text-left transition ${mode === item.id ? "border-violet-200/70 bg-violet-200/14 shadow-lg shadow-violet-950/20" : "border-white/10 bg-slate-950/36 hover:border-violet-200/35"}`}><span className="block text-base font-semibold text-white">{item.label}</span><span className="mt-1 block text-sm leading-6 text-stone-400">{item.body}</span></button>)}
              </div>
            </div>
          </aside>

          <section className="grid min-h-[720px] min-w-0 max-w-[calc(100vw-2.5rem)] gap-5 rounded-[2.2rem] lg:max-w-none border border-violet-200/15 bg-[#07111f]/76 p-4 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:p-5 lg:grid-rows-[auto_1fr]">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-violet-200/65">Recommended practice</p>
                <div className="mt-3 flex flex-wrap items-end gap-3"><h2 className="text-3xl font-semibold text-white sm:text-4xl">{method.title}</h2><span className="rounded-full border border-amber-200/25 bg-amber-100/10 px-3 py-1 text-sm text-amber-100">{practice?.minutes ?? duration} 分钟</span></div>
                <p className="mt-3 max-w-2xl break-all text-base leading-7 text-stone-300">{recommendation.kind === "practice" && method.id === recommendation.primary.id ? recommendation.explanation : method.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {[1, 3, 5, 10].map((value) => {
                  const minutes = value as DurationMinutes;
                  const available = method.durations.includes(minutes);
                  return <button key={value} type="button" disabled={!available} onClick={() => setDuration(minutes)} className={`rounded-full border px-3 py-2 text-sm transition ${duration === minutes ? "border-violet-200/70 bg-violet-200/16 text-white" : "border-white/10 bg-white/[0.04] text-stone-300 enabled:hover:border-violet-200/35 disabled:cursor-not-allowed disabled:opacity-35"}`}>{value}m</button>;
                })}
              </div>
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-h-[520px] min-w-0 flex-col rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-inner shadow-black/30">
                {phase === "choose" && practice ? <ChoosePractice method={method} practice={practice} onStart={startPractice} /> : null}
                {phase === "practice" && practice && currentStep ? <PracticePlayer method={method} practice={practice} stepIndex={stepIndex} secondsLeft={secondsLeft} progress={progress} paused={paused} onPause={() => setPaused((value) => !value)} onStop={stopPractice} /> : null}
                {phase === "check" ? <CheckView result={result} activationAfter={activationAfter} action={action} onResult={setResult} onActivation={setActivationAfter} onAction={setAction} onComplete={completeSession} /> : null}
                {phase === "done" ? <DoneView method={method} action={action} onAgain={resetAgain} /> : null}
              </div>

              <aside className="min-w-0 space-y-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-100">12 种方法</p><p className="text-xs text-stone-500">可手动选择</p></div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
                    {METHOD_CATALOG.map((item) => <button key={item.id} type="button" onClick={() => chooseMethod(item.id)} className={`group rounded-2xl border p-3 text-left transition ${item.id === method.id ? "border-violet-200/70 bg-violet-200/14" : "border-white/10 bg-slate-950/32 hover:border-violet-200/35"}`}><span className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-300/80 to-amber-200/70 text-sm font-bold text-slate-950">{METHOD_MARKS[item.id]}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="block truncate text-xs text-stone-500">{FAMILY_LABELS[item.family]}</span></span></span></button>)}
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-amber-200/15 bg-amber-100/[0.055] p-4">
                  <p className="text-sm font-medium text-stone-100">本机记录</p>
                  <p className="mt-2 break-all text-sm leading-6 text-stone-400">只保存在当前浏览器，用来做 seed user 测试和下次推荐，不上传私人触发内容。</p>
                  <div className="mt-4 space-y-2">
                    {sessions.slice(0, 3).map((session) => <div key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/36 p-3"><p className="text-sm font-medium text-stone-100">{METHOD_BY_ID.get(session.methodId)?.title ?? session.methodId}</p><p className="mt-1 text-xs text-stone-500">{session.result ?? "completed"} · {new Date(session.startedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>)}
                    {sessions.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-3 text-sm text-stone-500">完成一次练习后，这里会出现本机记录。</p> : null}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function ChoosePractice({ method, practice, onStart }: { method: MethodDefinition; practice: PracticeVariant; onStart: () => void }) {
  return <div className="flex h-full flex-col justify-between gap-8"><div><div className="flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.24em] text-stone-500">Practice preview</p><h3 className="mt-3 text-3xl font-semibold text-white">{practice.title}</h3></div><span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-violet-300 via-indigo-400 to-amber-200 text-2xl font-bold text-slate-950 shadow-lg shadow-violet-950/30">{METHOD_MARKS[method.id]}</span></div><p className="mt-4 break-all text-base leading-7 text-stone-300">{practice.subtitle}</p><p className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-stone-400">{practice.preparation}</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{practice.steps.slice(0, 3).map((step, index) => <div key={step.id} className="rounded-3xl border border-white/10 bg-slate-950/42 p-4"><p className="text-xs uppercase tracking-[0.2em] text-violet-200/60">Step {String(index + 1).padStart(2, "0")}</p><p className="mt-3 text-sm font-semibold text-white">{step.title}</p><p className="mt-2 text-xs leading-5 text-stone-500">{step.seconds} 秒</p></div>)}</div></div><button type="button" onClick={onStart} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-violet-950/30 transition hover:scale-[1.01]">开始练习</button></div>;
}

function PracticePlayer({ method, practice, stepIndex, secondsLeft, progress, paused, onPause, onStop }: { method: MethodDefinition; practice: PracticeVariant; stepIndex: number; secondsLeft: number; progress: number; paused: boolean; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  return <div className="flex h-full flex-col gap-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">{method.title}</p><h3 className="mt-2 text-2xl font-semibold text-white">{step.title}</h3></div><div className="text-right"><p className="text-4xl font-semibold text-white">{secondsLeft}</p><p className="text-xs uppercase tracking-[0.22em] text-stone-500">seconds</p></div></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-200 to-amber-200 transition-all" style={{ width: `${progress}%` }} /></div><MethodExperience methodId={method.id} instruction={step.instruction} secondsLeft={secondsLeft} stepIndex={stepIndex} /><div className="mt-auto flex flex-wrap gap-3"><button type="button" onClick={onPause} className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-200/35">{paused ? "继续" : "暂停"}</button><button type="button" onClick={onStop} className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-stone-300 transition hover:border-amber-200/35 hover:text-white">停止并反馈</button></div></div>;
}

function MethodExperience({ methodId, instruction, secondsLeft, stepIndex }: { methodId: MethodId; instruction: string; secondsLeft: number; stepIndex: number }) {
  const breathIn = Math.floor(secondsLeft / 3) % 2 === 0;
  const thoughts = ["我必须回应", "是不是我不够好", "他们不理解我", "我不能输"];
  if (methodId === "paced-breath") return <div className="grid flex-1 place-items-center rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_58%)] p-6 text-center"><div className={`grid h-48 w-48 place-items-center rounded-full border border-violet-100/20 bg-[radial-gradient(circle_at_38%_32%,rgba(255,255,255,0.84),rgba(221,214,254,0.46)_18%,rgba(76,29,149,0.28)_42%,rgba(2,6,23,0.96)_72%)] shadow-[0_0_52px_rgba(168,85,247,0.35),0_0_100px_rgba(245,158,11,0.16)] transition duration-1000 ${breathIn ? "scale-105" : "scale-95"}`}><span className="text-xl font-semibold tracking-[0.28em] text-white">{breathIn ? "吸 气" : "呼 气"}</span></div><p className="mt-6 max-w-md text-base leading-8 text-stone-300">{instruction}</p></div>;
  if (methodId === "inner-cinema") return <div className="flex flex-1 flex-col justify-center rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.14),transparent_45%),#050914] p-6 text-center"><p className="text-xs uppercase tracking-[0.28em] text-violet-200/55">Scene {String(stepIndex + 1).padStart(2, "0")}</p><p className="mx-auto mt-8 max-w-2xl text-3xl font-semibold leading-tight text-white">{instruction}</p><div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-2 text-xs text-stone-400"><span className="rounded-full bg-white/[0.06] px-3 py-2">角色</span><span className="rounded-full bg-violet-200/12 px-3 py-2 text-violet-100">观众</span><span className="rounded-full bg-amber-200/12 px-3 py-2 text-amber-100">见证</span></div></div>;
  if (methodId === "wide-gaze") return <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-sky-200/15 bg-slate-950/62 p-6 text-center"><div className="absolute inset-8 rounded-full border border-sky-200/10" /><div className="absolute left-12 top-16 h-3 w-3 rounded-full bg-sky-200/35" /><div className="absolute right-14 top-24 h-2 w-2 rounded-full bg-violet-200/40" /><div className="absolute bottom-20 left-20 h-2 w-2 rounded-full bg-amber-200/40" /><div className="grid h-24 w-24 place-items-center rounded-full border border-sky-100/25 bg-sky-200/10 shadow-[0_0_50px_rgba(96,165,250,0.2)]"><span className="h-3 w-3 rounded-full bg-sky-100" /></div><p className="mt-64 max-w-md text-base leading-8 text-stone-300">{instruction}</p></div>;
  if (methodId === "person-shift") return <PersonShift instruction={instruction} />;
  if (methodId === "logout-pause") return <div className="grid flex-1 content-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/62 p-6"><div className="grid grid-cols-3 gap-2 text-center text-sm"><span className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-stone-500">解释</span><span className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-stone-500">参与</span><span className="rounded-2xl border border-amber-200/35 bg-amber-200/12 p-4 text-amber-100">登出</span></div><p className="text-center text-xl font-semibold leading-9 text-white">{instruction}</p></div>;
  if (methodId === "anchors") return <div className="grid flex-1 place-items-center rounded-[2rem] border border-white/10 bg-slate-950/62 p-6 text-center"><div className="relative grid h-64 w-64 place-items-center"><span className="absolute h-24 w-24 rounded-full border border-violet-200/30" /><span className="absolute h-40 w-40 rounded-full border border-sky-200/20" /><span className="absolute h-60 w-60 rounded-full border border-amber-200/15" /><span className="text-sm text-stone-300">房间 → 城市 → 天空</span></div><p className="max-w-md text-base leading-8 text-stone-300">{instruction}</p></div>;
  return <div className="grid flex-1 place-items-center rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_34%,rgba(139,92,246,0.14),transparent_45%),rgba(2,6,23,0.72)] p-6 text-center"><div>{thoughts.map((thought, index) => <span key={thought} className="m-1 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-300" style={{ opacity: Math.max(0.25, 1 - (stepIndex + index) * 0.14) }}>{thought}</span>)}<p className="mx-auto mt-8 max-w-xl text-2xl font-semibold leading-10 text-white">{instruction}</p></div></div>;
}

function PersonShift({ instruction }: { instruction: string }) {
  const [name, setName] = useState("Will");
  const [sentence, setSentence] = useState("我现在很想证明自己没错。");
  const shifted = sentence.replaceAll("我", name || "这个人");
  return <div className="grid flex-1 content-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/62 p-5"><p className="text-base leading-7 text-stone-300">{instruction}</p><input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-violet-200/50" placeholder="你的名字" /><textarea value={sentence} onChange={(event) => setSentence(event.target.value)} className="min-h-28 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none focus:border-violet-200/50" /><div className="rounded-3xl border border-violet-200/20 bg-violet-200/10 p-4"><p className="text-xs uppercase tracking-[0.22em] text-violet-200/70">替换后</p><p className="mt-2 text-xl font-semibold leading-8 text-white">{shifted}</p></div></div>;
}

function CheckView({ result, activationAfter, action, onResult, onActivation, onAction, onComplete }: { result?: SessionResult; activationAfter: 1 | 2 | 3 | 4 | 5; action: string; onResult: (value: SessionResult) => void; onActivation: (value: 1 | 2 | 3 | 4 | 5) => void; onAction: (value: string) => void; onComplete: () => void }) {
  const results: Array<[SessionResult, string]> = [["better", "多了一点选择"], ["same", "差不多"], ["worse", "更不舒服"], ["stopped", "我停止了"]];
  return <div className="flex h-full flex-col justify-center gap-6"><div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">After check</p><h3 className="mt-3 text-3xl font-semibold text-white">现在，和刚才相比呢？</h3><p className="mt-3 text-base leading-7 text-stone-400">没有正确答案。反馈会帮助 StillMind 下次少推荐不适合你的方法。</p></div><div className="grid gap-2 sm:grid-cols-2">{results.map(([value, label]) => <button key={value} type="button" onClick={() => onResult(value)} className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${result === value ? "border-violet-200/70 bg-violet-200/14 text-white" : "border-white/10 bg-white/[0.04] text-stone-300 hover:border-violet-200/35"}`}>{label}</button>)}</div><div><p className="mb-2 text-sm font-medium text-stone-100">此刻强烈程度</p><div className="flex gap-2">{([1,2,3,4,5] as const).map((value) => <button key={value} type="button" onClick={() => onActivation(value)} className={`grid h-11 w-11 place-items-center rounded-full border text-sm font-semibold ${activationAfter === value ? "border-amber-200/70 bg-amber-200/18 text-white" : "border-white/10 bg-white/[0.04] text-stone-400"}`}>{value}</button>)}</div></div><div><p className="mb-2 text-sm font-medium text-stone-100">下一步回到现实</p><div className="grid gap-2 sm:grid-cols-2">{ACTIONS.map((item) => <button key={item} type="button" onClick={() => onAction(item)} className={`rounded-2xl border p-3 text-left text-sm transition ${action === item ? "border-amber-200/70 bg-amber-200/14 text-white" : "border-white/10 bg-white/[0.04] text-stone-300"}`}>{item}</button>)}</div></div><button type="button" disabled={!result} onClick={onComplete} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-4 text-base font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">保存并完成</button></div>;
}

function DoneView({ method, action, onAgain }: { method: MethodDefinition; action: string; onAgain: () => void }) {
  return <div className="grid h-full place-items-center text-center"><div className="max-w-xl"><p className="text-sm uppercase tracking-[0.26em] text-amber-100/70">Returned</p><h3 className="mt-4 text-4xl font-semibold leading-tight text-white">你没有消灭念头，只是多了一个观察位置。</h3><p className="mt-5 text-lg leading-8 text-stone-300">这次你练习了“{method.title}”。下一步：{action}。</p><button type="button" onClick={onAgain} className="mt-8 rounded-full border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:border-violet-200/40">再练一次</button></div></div>;
}






