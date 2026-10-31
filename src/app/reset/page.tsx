"use client";

import "./session.css";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PracticePlayer } from "@/components/ResetPracticePlayer";
import { InnerCinemaVisual } from "@/components/InnerCinemaScene";
import { AppHeader } from "@/components/ui";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { PracticeOptionsPanel } from "@/components/PracticeOptionsPanel";
import { PENDING_PRACTICE_OPTIONS_KEY, readPracticeOptions, practiceOptionsFromQuery, type PracticeOptions } from "@/lib/practice-options";
import { beginAttempt, endAttempt, saveAttemptFeedback, type PracticeAttempt } from "@/lib/practice-attempt";
import { browserLocalStorage, readStoredArray, writeStoredJson } from "@/lib/safe-storage";
import { browserSessionStorage, consumeResetDraft } from "@/lib/reset-draft";
import {
  PENDING_ACTIVATION_KEY, PENDING_INPUT_METHOD_KEY, PENDING_INTENSITY_KEY, PENDING_MODE_KEY, PENDING_TRIGGER_KEY,
  detectStateModeFromText, isStateMode, resolveResetActivation,
} from "@/lib/reset-routing";
import { getPracticeVariant, type PracticeVariant } from "@stillmind/content";
import { getPreset, type CinemaPayload } from "@/lib/cinema-presets";
import { sendAnonymousEvent } from "@/lib/analytics-client";
import {
  METHOD_BY_ID, METHOD_CATALOG, recommendMethods, canStartMethod, containsHighRiskLanguage, isPracticeSession,
  elapsedPracticeMs, pausePracticeClock, resumePracticeClock, practicePosition, sessionResult, ratingText,
  changeText, endingCopy, upsertPracticeSession,
  type DesiredOutcome, type ActivationLevel, type DurationMinutes, type MethodDefinition, type MethodId,
  type PracticeSession, type SessionResult, type StateMode,
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
type InputMethod = "typed" | "dictation" | "example" | "state-only";
function analyticsReuseIntent(value: ReuseIntent): "yes" | "unsure" | "no" {
  return value === "会" ? "yes" : value === "不会" ? "no" : "unsure";
}
type SeedFeedback = {
  id: string; sessionId: string; createdAt: string; mode: StateMode; methodId: MethodId;
  intensityBefore?: ActivationLevel; intensityAfter?: ActivationLevel; reuseIntent?: ReuseIntent; note: string;
};
const METHOD_MARKS: Record<MethodId, string> = {
  "inner-cinema": "观", "paced-breath": "息", "thought-watching": "觉", "wide-gaze": "凝", "body-scan": "内",
  "person-shift": "名", "logout-pause": "出", release: "恕", "open-awareness": "合", "grounded-action": "焦", "trigger-journal": "稳", anchors: "远",
};
const FAMILY_LABELS: Record<MethodDefinition["family"], string> = {
  distance: "拉开距离", settle: "先安定", observe: "练习观察", release: "松开重播", return: "回到行动", reflect: "稳定 / 拉远",
};
type MethodGuidance = { anchor: string; mechanism: string; reminder: string };
const METHOD_GUIDANCE: Record<MethodId, MethodGuidance> = {
  "inner-cinema": { anchor: "银幕上的一幕", mechanism: "把刚才的反应放到屏幕上，你就不只是在角色里，也坐回了观众席。", reminder: "不用分析自己是什么人，只看见这一幕正在发生。" },
  "paced-breath": { anchor: "呼气时的数字", mechanism: "重点不是控制呼吸，而是让注意力落在数字上，内在对白会慢慢降下来。", reminder: "如果数乱了，从下一个呼气继续，不需要重新来过。" },
  "thought-watching": { anchor: "念头升起又落下", mechanism: "旁观念头的起伏，你会看见小我如何冒头，也看见它会自己变化。", reminder: "不追随，也不赶走；回来很多次也算练习。" },
  "wide-gaze": { anchor: "一束安静烛光", mechanism: "固定一个可看的对象，注意力就少一点被脑内剧情牵走。", reminder: "不是用力盯，眼睛累了就眨眼，轻轻回来。" },
  "body-scan": { anchor: "身体里的一个落点", mechanism: "把注意放回身体感受，会让解释性的念头少一点接管全局。", reminder: "哪里不舒服就跳过，回到脚底、椅子或手掌。" },
  "person-shift": { anchor: "用名字观察原句", mechanism: "保留原句，在前面加上名字和“注意到”，试试从另一位置读它。", reminder: "不改变事实，不要求你产生不同感受。" },
  "logout-pause": { anchor: "暂时登出解释界面", mechanism: "解释常常会继续造剧情，先不互动，反应就少一点燃料。", reminder: "不要把登出做成麻木；一分钟后仍要回到现实行动。" },
  release: { anchor: "情绪起伏的波纹", mechanism: "允许反应出现，同时保留旁观位置，情绪就不必变成身份。", reminder: "宽恕不是替对方开脱，边界仍然可以清楚。" },
  "open-awareness": { anchor: "此刻的声音与空间", mechanism: "尝试同时注意几种经验，不需要选一个中心，也不需要全部注意到。", reminder: "没有连接感或安静感也可以，不要求达到某种状态。" },
  "grounded-action": { anchor: "一个很小的细节", mechanism: "把视角压缩到具体感官，脑内大剧情会被切成可处理的小片段。", reminder: "只选一个细节，不需要同时抓住所有感官。" },
  "trigger-journal": { anchor: "一个静止的观察对象", mechanism: "用低刺激的静止对象练习观看，不通过按钮或图案移动来判断注意力。", reminder: "眨眼、放松；视觉不适就转向身边物品或停止。" },
  anchors: { anchor: "从近景拉到高空", mechanism: "把视角从眼前小事拉到更大时间线，角色会变小，空间会变大。", reminder: "拉远后要回来，选择一个现实里的小动作。" },
};
function loadSessions(): PracticeSession[] {
  return readStoredArray(browserLocalStorage(), SESSION_KEY, isPracticeSession);
}
function storeSessions(sessions: PracticeSession[]): boolean {
  return writeStoredJson(browserLocalStorage(), SESSION_KEY, sessions.slice(0, 30));
}
function storeSeedFeedback(feedback: SeedFeedback): boolean {
  const storage = browserLocalStorage();
  const list = readStoredArray(storage, SEED_FEEDBACK_KEY, (value): value is SeedFeedback =>
    Boolean(value) && typeof value === "object" && typeof (value as SeedFeedback).id === "string");
  return writeStoredJson(storage, SEED_FEEDBACK_KEY, [feedback, ...list.filter((item) => item.id !== feedback.id)].slice(0, 50));
}
function practiceFor(methodId: MethodId, duration: DurationMinutes): PracticeVariant | undefined {
  const exact = getPracticeVariant(methodId, duration);
  if (exact) return exact;
  const method = METHOD_BY_ID.get(methodId);
  return getPracticeVariant(methodId, method?.durations[0] ?? 1);
}
export default function ResetPage() {
  return <Suspense fallback={<ResetRouteFallback />}><ResetExperience /></Suspense>;
}
function localCinemaFor(trigger: string): CinemaPayload {
  const preset = getPreset(trigger);
  const clean = trigger.replace(/\s+/g, " ").trim();
  if (!clean) return preset;
  const excerpt = clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
  return { ...preset, scenes: preset.scenes.map((scene, index) => index === 0 ? { ...scene, line: `刚才的一幕：“${excerpt}”` } : scene) };
}
function ResetRouteFallback() {
  return <main className="reset-fallback"><div><span aria-hidden="true" /><p>正在准备这一分钟…</p></div></main>;
}

function ResetExperience() {
  const searchParams = useSearchParams();
  const queryMode = searchParams.get("mode");
  const initialMode = isStateMode(queryMode) ? queryMode : "looping";
  const initialState = STATE_OPTIONS.find((item) => item.id === initialMode) ?? STATE_OPTIONS[0];
  const initialRating = resolveResetActivation(null, searchParams.get("activation"), null, searchParams.get("intensity"), initialState.activation);
  const initialDirect = searchParams.get("direct") === "1";
  const initialMethod = searchParams.get("method") as MethodId | null;
  const initialMethodDef = initialMethod ? METHOD_BY_ID.get(initialMethod) : undefined;
  const [mode, setMode] = useState<StateMode>(initialMode);
  const state = STATE_OPTIONS.find((item) => item.id === mode) ?? STATE_OPTIONS[0];
  const [duration, setDuration] = useState<DurationMinutes>(initialMethodDef?.durations[0] ?? 1);
  const [selectedMethodId, setSelectedMethodId] = useState<MethodId | undefined>(initialMethodDef?.id);
  const [phase, setPhase] = useState<"choose" | "precheck" | "practice" | "check" | "done">(initialDirect ? "precheck" : "choose");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<SessionResult | undefined>();
  // Routing defaults are never written as a user's self-report. Missing is a real state.
  const [intensityBefore, setIntensityBefore] = useState<ActivationLevel | undefined>(initialRating.supplied ? initialRating.value : undefined);
  const [intensityAfter, setIntensityAfter] = useState<ActivationLevel | undefined>();
  const [reuseIntent, setReuseIntent] = useState<ReuseIntent | undefined>();
  const [feedbackNote, setFeedbackNote] = useState("");
  const [options, setOptions] = useState<PracticeOptions>(practiceOptionsFromQuery(searchParams));
  const shareAnonymous = options.shareAnonymous;
  const [inputMethod, setInputMethod] = useState<InputMethod>("state-only");
  const action = ACTIONS[0]; // A suggestion only; not recorded as a chosen/completed action.
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [manualChoice, setManualChoice] = useState(Boolean(initialMethodDef));
  const [showAdvancedMethods, setShowAdvancedMethods] = useState(Boolean(initialMethodDef));
  const [showDurationOptions, setShowDurationOptions] = useState(false);
  const [showAllStates, setShowAllStates] = useState(false);
  const [incomingTrigger, setIncomingTrigger] = useState("");
  const [lockedBeforeScore, setLockedBeforeScore] = useState(initialRating.supplied);
  const [directEntry, setDirectEntry] = useState(initialDirect);
  const [autoStartPending, setAutoStartPending] = useState(initialDirect);
  const [routingReady, setRoutingReady] = useState(false);
  const [boundaryReady, setBoundaryReady] = useState(false);
  const [startNotice, setStartNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const [endStatus, setEndStatus] = useState<PracticeSession["status"] | undefined>();
  const didHydrateRouting = useRef(false);
  const attemptRef = useRef<PracticeAttempt | undefined>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSessions(loadSessions()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useLayoutEffect(() => {
    if (didHydrateRouting.current) return;
    didHydrateRouting.current = true;
    /* eslint-disable react-hooks/set-state-in-effect -- Consume the entry draft once before starting the practice. */
    try {
      const params = new URLSearchParams(window.location.search);
      const draftId = params.get("draft");
      const draft = draftId ? consumeResetDraft(browserSessionStorage(), draftId) : undefined;
      // A new entry never falls back to unrelated legacy text or analytics consent.
      const legacyStorage = draftId ? undefined : browserSessionStorage();
      const storedTrigger = draft?.trigger ?? legacyStorage?.getItem(PENDING_TRIGGER_KEY) ?? "";
      const storedMode = draft?.mode ?? legacyStorage?.getItem(PENDING_MODE_KEY) ?? null;
      const storedActivation = draft?.activation === undefined ? legacyStorage?.getItem(PENDING_ACTIVATION_KEY) ?? null : String(draft.activation);
      const storedInputMethod = draft?.inputMethod ?? legacyStorage?.getItem(PENDING_INPUT_METHOD_KEY);
      const legacyStoredIntensity = legacyStorage?.getItem(PENDING_INTENSITY_KEY) ?? null;
      const queryMethod = params.get("method") as MethodId | null;
      const queryMethodDef = queryMethod ? METHOD_BY_ID.get(queryMethod) : undefined;
      const queryMode = params.get("mode");
      const nextMode = isStateMode(storedMode) ? storedMode
        : isStateMode(queryMode) ? queryMode
          : queryMethodDef?.modes[0] ?? detectStateModeFromText(storedTrigger);
      setIncomingTrigger(storedTrigger.slice(0, 500));
      setMode(nextMode);
      const incomingRating = resolveResetActivation(storedActivation, params.get("activation"), legacyStoredIntensity, params.get("intensity"), STATE_OPTIONS.find((item) => item.id === nextMode)?.activation ?? 3);
      setIntensityBefore(incomingRating.supplied ? incomingRating.value : undefined);
      setIntensityAfter(undefined);
      setLockedBeforeScore(incomingRating.supplied);
      const storedOptions = legacyStorage?.getItem(PENDING_PRACTICE_OPTIONS_KEY);
      setOptions(draft?.options ?? (storedOptions ? readPracticeOptions(storedOptions) : practiceOptionsFromQuery(params)));
      if (storedInputMethod === "typed" || storedInputMethod === "dictation" || storedInputMethod === "example" || storedInputMethod === "state-only") setInputMethod(storedInputMethod);
      if (queryMethodDef) {
        setSelectedMethodId(queryMethodDef.id);
        setManualChoice(true);
        setShowAdvancedMethods(true);
        setDuration(queryMethodDef.durations[0]);
      }
      for (const key of [PENDING_TRIGGER_KEY, PENDING_MODE_KEY, PENDING_ACTIVATION_KEY, PENDING_INPUT_METHOD_KEY, PENDING_INTENSITY_KEY, PENDING_PRACTICE_OPTIONS_KEY]) browserSessionStorage()?.removeItem(key);
    } catch {
      // No storage access: safe URL parameters still work; no raw text or consent is invented.
    } finally {
      setRoutingReady(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const routingInput = useMemo(() => ({
    activation: intensityBefore ?? state.activation,
    mode, duration, outcome: state.outcome,
    // Library choices may include all twelve methods, but do not bypass other restrictions.
    scope: manualChoice ? "library" as const : "reset" as const,
    eyesOpenPreferred: options.eyesOpenPreferred,
    bodyFocusAllowed: options.bodyFocusAllowed,
    breathChangeAllowed: options.breathChangeAllowed,
    safety: { cannotStaySafe: containsHighRiskLanguage(incomingTrigger) },
  }), [duration, intensityBefore, mode, state.activation, state.outcome, manualChoice, options.eyesOpenPreferred, options.bodyFocusAllowed, options.breathChangeAllowed, incomingTrigger]);
  const recommendation = useMemo(() => recommendMethods(routingInput), [routingInput]);
  // A display fallback is not permission to start; all entrances use canStartMethod below.
  const recommendedMethod = recommendation.kind === "practice" ? recommendation.primary : METHOD_BY_ID.get("grounded-action")!;
  const method = METHOD_BY_ID.get(manualChoice && selectedMethodId ? selectedMethodId : recommendedMethod.id) ?? recommendedMethod;
  const practice = useMemo(() => practiceFor(method.id, duration), [method.id, duration]);
  const localCinema = useMemo(() => localCinemaFor(incomingTrigger), [incomingTrigger]);
  const position = practicePosition(practice?.steps ?? [], elapsedMs);
  const { stepIndex, secondsLeft, elapsedSeconds: completedSeconds, breathingSeconds: completedBreathingSeconds, progress } = position;
  const currentStep = practice?.steps[stepIndex];
  const visibleStateOptions = showAllStates ? STATE_OPTIONS : STATE_OPTIONS.slice(0, 3);
  const methodReason = recommendation.kind === "practice" && method.id === recommendation.primary.id ? recommendation.explanation : method.summary;
  const focusMode = directEntry || phase !== "choose";

  const startPractice = useCallback(() => {
    if (!routingReady || !boundaryReady || !practice || (attemptRef.current && !attemptRef.current.ended)) return;
    if (recommendation.kind === "support" || !canStartMethod(method.id, { ...routingInput, duration: practice.minutes })) {
      setStartNotice(recommendation.kind === "support" ? recommendation.explanation : "当前方法不符合所选强度或练习偏好。可以返回推荐，或直接退出。");
      setAutoStartPending(false);
      setPhase("precheck");
      return;
    }
    const id = `web-${typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)}`;
    const attempt = beginAttempt({ id, mode, methodId: method.id, minutes: practice.minutes,
      plannedDurationSeconds: practice.steps.reduce((sum, step) => sum + step.seconds, 0),
      contentVersion: practice.contentVersion, activationBefore: intensityBefore,
      inputMethod, textProvided: Boolean(incomingTrigger.trim()), consentAtStart: shareAnonymous,
    }, {
      now: () => performance.now(), isoNow: () => new Date().toISOString(),
      save: (record) => storeSessions(upsertPracticeSession(loadSessions(), record)),
      emit: (name, payload) => { void sendAnonymousEvent(name, payload); },
    });
    if (document.hidden) attempt.clock = pausePracticeClock(attempt.clock, performance.now());
    attemptRef.current = attempt;
    setElapsedMs(0); setEndStatus(undefined); setPaused(document.hidden); setResult(undefined);
    setIntensityAfter(undefined); setReuseIntent(undefined); setFeedbackNote(""); setStartNotice("");
    setStorageWarning(!attempt.savedLocally); setAutoStartPending(false); setPhase("practice");
  }, [routingReady, boundaryReady, practice, recommendation, method.id, routingInput, mode, intensityBefore, inputMethod, incomingTrigger, shareAnonymous]);

  useLayoutEffect(() => {
    if (!autoStartPending || !routingReady || !boundaryReady) return;
    // Waiting for hydrated routing avoids starting an initial/default method before the draft arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One explicit direct-entry start, guarded by the attempt ref.
    startPractice();
  }, [autoStartPending, routingReady, boundaryReady, startPractice]);

  useEffect(() => {
    if (phase !== "practice" || paused || !practice) return;
    const tick = () => {
      const attempt = attemptRef.current;
      if (!attempt || attempt.ended) return;
      const elapsed = elapsedPracticeMs(attempt.clock, performance.now());
      const next = practicePosition(practice.steps, elapsed);
      setElapsedMs(next.elapsedSeconds * 1000);
      if (next.complete) {
        endAttempt(attempt, "completed"); setEndStatus("completed");
        setStorageWarning(!attempt.savedLocally); setPhase("check");
      }
    };
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [paused, phase, practice]);

  useEffect(() => {
    mountedRef.current = true;
    const pauseInBackground = () => {
      const attempt = attemptRef.current;
      if (!document.hidden || !attempt || attempt.ended) return;
      attempt.clock = pausePracticeClock(attempt.clock, performance.now());
      setElapsedMs(attempt.clock.elapsedMs);
      setPaused(true); // Returning to the tab never resumes a practice without an explicit tap.
    };
    const leavePage = () => {
      const attempt = attemptRef.current;
      if (attempt && !attempt.ended) endAttempt(attempt, "abandoned");
    };
    const restorePage = () => {
      if (attemptRef.current?.record.status === "abandoned" && attemptRef.current.ended) { setEndStatus("abandoned"); setPhase("done"); }
    };
    document.addEventListener("visibilitychange", pauseInBackground);
    window.addEventListener("pagehide", leavePage);
    window.addEventListener("pageshow", restorePage);
    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", pauseInBackground);
      window.removeEventListener("pagehide", leavePage);
      window.removeEventListener("pageshow", restorePage);
      // React StrictMode replays setup/cleanup. Do not log a phantom abandonment during that replay.
      queueMicrotask(() => { if (!mountedRef.current) leavePage(); });
    };
  }, []);

  function changeMode(nextMode: StateMode) {
    setMode(nextMode); setPhase("choose"); setManualChoice(false); setShowAdvancedMethods(false);
    setIncomingTrigger(""); setLockedBeforeScore(false); setDirectEntry(false); setAutoStartPending(false);
    setResult(undefined); setIntensityBefore(undefined); setIntensityAfter(undefined); setStartNotice("");
  }
  function chooseMethod(id: MethodId) {
    setSelectedMethodId(id); setManualChoice(true); setShowAdvancedMethods(true);
    setDuration(METHOD_BY_ID.get(id)?.durations[0] ?? 1);
    setPhase("choose"); setResult(undefined); setStartNotice("");
  }
  function requestStart() {
    if (!practice) return;
    setResult(undefined); setFeedbackNote(""); setReuseIntent(undefined); setIntensityAfter(undefined);
    setLockedBeforeScore(intensityBefore !== undefined); setDirectEntry(false); setAutoStartPending(false); setPhase("precheck");
  }
  function togglePause() {
    const attempt = attemptRef.current;
    if (!attempt || attempt.ended) return;
    attempt.clock = paused ? resumePracticeClock(attempt.clock, performance.now()) : pausePracticeClock(attempt.clock, performance.now());
    setElapsedMs(elapsedPracticeMs(attempt.clock, performance.now())); setPaused(!paused);
  }
  function stopPractice() {
    const attempt = attemptRef.current;
    if (!attempt) return;
    const record = endAttempt(attempt, "stopped"); setEndStatus(record.status);
    setElapsedMs(record.durationSeconds * 1000); setPaused(true); setResult(record.result);
    setStorageWarning(!attempt.savedLocally); setPhase("check");
  }
  function completeSession(skipFeedback = false) {
    const attempt = attemptRef.current;
    if (!attempt || !attempt.ended) return;
    if (!skipFeedback) {
      saveAttemptFeedback(attempt, { activationAfter: intensityAfter,
        reuseIntent: reuseIntent ? analyticsReuseIntent(reuseIntent) : undefined, shareAnonymous });
      const feedbackSaved = storeSeedFeedback({ id: `seed-${attempt.seed.id}`, sessionId: attempt.seed.id,
        createdAt: new Date().toISOString(), mode: attempt.seed.mode, methodId: attempt.seed.methodId,
        intensityBefore: attempt.seed.activationBefore, intensityAfter, reuseIntent, note: feedbackNote.trim().slice(0, 500) });
      setStorageWarning(!attempt.savedLocally || !feedbackSaved);
    } else {
      setIntensityAfter(undefined); setReuseIntent(undefined); setFeedbackNote("");
    }
    setResult(attempt.record.result); setEndStatus(attempt.record.status);
    setSessions((previous) => upsertPracticeSession(previous, attempt.record)); setPhase("done");
  }
  function resetAgain() {
    attemptRef.current = undefined; setEndStatus(undefined);
    setPhase("choose"); setElapsedMs(0); setResult(undefined); setIntensityBefore(undefined); setIntensityAfter(undefined);
    setLockedBeforeScore(false); setDirectEntry(false); setAutoStartPending(false); setStartNotice("");
    setFeedbackNote(""); setReuseIntent(undefined); setStorageWarning(false);
  }

  return (
    <main className="sm-page reset-page">
      <DisclaimerModal onAcknowledged={setBoundaryReady} />
      {focusMode ? <h1 className="sr-only">StillMind · {method.title}</h1> : null}
      <div className="sm-container reset-container">
        <AppHeader current={focusMode ? method.title : "沉寂小我"} action={focusMode ? <Link className="sm-button sm-button-quiet" href="/">回到入口</Link> : <nav className="sm-header-nav" aria-label="产品导航"><Link href="/methods">方法库</Link><Link href="/reflection">复盘</Link></nav>} />
        <section className={`reset-main${phase === "practice" ? " is-practicing" : ""}`}>
          {startNotice ? <div role="alert" className="sm-notice"><p>{startNotice}</p><button type="button" onClick={() => { setManualChoice(false); setShowAdvancedMethods(false); setDirectEntry(false); setAutoStartPending(false); setStartNotice(""); setPhase("choose"); }} className="sm-text-link">返回推荐</button><Link href="/support" className="sm-text-link">支持与退出</Link></div> : null}
          {phase === "choose" && practice ? <>
            <header className="reset-intro"><p className="sm-eyebrow">从此刻开始，不必先选方法</p><h1 className="sm-title">给脑内的剧情，<br />留一点观看的距离。</h1><p className="sm-copy">先做一个短练习。是否适合、有没有变化，都由你在结束后判断。</p></header>
            <div className="reset-recommendation"><div><p className="sm-eyebrow">为此刻推荐 · {practice.minutes} 分钟</p><h2>{method.title}</h2><p className="sm-copy">{methodReason}</p></div><button type="button" onClick={requestStart} className="sm-button sm-button-primary">开始 {practice.minutes} 分钟练习</button></div>
            {incomingTrigger ? <div className="reset-context"><p className="sm-caption">你留下的一句</p><p>{incomingTrigger}</p></div> : null}
            <details className="sm-fold reset-options"><summary>调整状态、时长或方法 <span>可选</span></summary><div>
              <div className="reset-state-grid">{visibleStateOptions.map((item) => <button key={item.id} type="button" onClick={() => changeMode(item.id)} className={`sm-choice${mode === item.id ? " is-selected" : ""}`} aria-pressed={mode === item.id}><strong>{item.label}</strong><span>{item.body}</span></button>)}</div>
              <button type="button" onClick={() => setShowAllStates((value) => !value)} className="sm-button sm-button-quiet">{showAllStates ? "收起状态" : "更多状态"}</button>
              <div className="sm-filter-row"><p className="sm-caption">本次时长</p><div className="sm-choice-row">{!showDurationOptions ? <button type="button" onClick={() => setShowDurationOptions(true)} className="sm-choice">{practice.minutes} 分钟 · 调整</button> : [1, 3, 5, 10].map((value) => { const minutes = value as DurationMinutes; return <button key={value} type="button" disabled={!method.durations.includes(minutes)} onClick={() => setDuration(minutes)} className={`sm-choice${duration === minutes ? " is-selected" : ""}`} aria-pressed={duration === minutes}>{minutes} 分钟</button>; })}</div></div>
              <div className="sm-section-heading"><h2 className="sm-section-title">或者，自己选择一种方法</h2><button type="button" onClick={() => setShowAdvancedMethods((value) => !value)} className="sm-button sm-button-quiet">{showAdvancedMethods ? "收起" : "展开"}</button></div>
              {showAdvancedMethods ? <div className="reset-method-picker">{METHOD_CATALOG.map((item) => <button key={item.id} type="button" onClick={() => chooseMethod(item.id)} className={`sm-choice${item.id === method.id ? " is-selected" : ""}`} aria-pressed={item.id === method.id}><span className="reset-method-mark" aria-hidden="true">{METHOD_MARKS[item.id]}</span><span><strong>{item.title}</strong><span>{FAMILY_LABELS[item.family]}</span></span></button>)}</div> : <p className="sm-caption">第一次不必比较十二种方法。上面的推荐已经考虑了状态与练习偏好。</p>}
            </div></details>
            <details className="sm-fold reset-options"><summary>先了解这一分钟</summary><ChoosePractice method={method} practice={practice} /></details>
            {sessions.length > 0 ? <details className="sm-fold reset-local-note"><summary>查看本机记录 <span>{sessions.length} 条</span></summary><p className="sm-caption">只保存在当前浏览器，不上传私人触发内容。</p>{sessions.slice(0, 3).map((session) => <div key={session.id} className="reset-session-row"><p>{METHOD_BY_ID.get(session.methodId)?.title ?? session.methodId}</p><span>{session.result ?? session.status} · {new Date(session.startedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></div>)}</details> : null}
          </> : null}
          {phase === "precheck" && practice ? <PrePracticeCheck method={method} practice={practice} intensityBefore={intensityBefore} lockedBeforeScore={lockedBeforeScore} onIntensityBefore={setIntensityBefore} options={options} onOptions={setOptions} onStart={startPractice} /> : null}
          {phase === "practice" && practice && currentStep ? <PracticePlayer method={method} practice={practice} stepIndex={stepIndex} secondsLeft={secondsLeft} elapsedSeconds={completedSeconds} breathingSeconds={completedBreathingSeconds} progress={progress} paused={paused} trigger={incomingTrigger} cinema={localCinema} onPause={togglePause} onStop={stopPractice} /> : null}
          {phase === "check" ? <CheckView stopped={result === "stopped"} intensityBefore={intensityBefore} intensityAfter={intensityAfter} reuseIntent={reuseIntent} feedbackNote={feedbackNote} shareAnonymous={shareAnonymous} onIntensityAfter={setIntensityAfter} onReuseIntent={setReuseIntent} onFeedbackNote={setFeedbackNote} onShareAnonymous={(value) => setOptions((previous) => ({ ...previous, shareAnonymous: value }))} onComplete={() => completeSession()} onSkip={() => completeSession(true)} /> : null}
          {phase === "done" ? <DoneView result={result} status={endStatus} storageWarning={storageWarning} method={method} action={action} intensityBefore={intensityBefore} intensityAfter={intensityAfter} reuseIntent={reuseIntent} feedbackNote={feedbackNote} onAgain={resetAgain} /> : null}
        </section>
      </div>
    </main>
  );
}

function ChoosePractice({ method, practice }: { method: MethodDefinition; practice: PracticeVariant }) {
  const guidance = METHOD_GUIDANCE[method.id];
  return <div className="reset-preview">
    <div className="reset-preview-heading"><div><p className="sm-eyebrow">{guidance.anchor}</p><h3>{practice.title}</h3><p className="sm-copy">{practice.subtitle}</p></div>{method.id === "inner-cinema" ? <div className="inner-cinema-entry-visual"><InnerCinemaVisual lensId="audience" compact decorative /></div> : <span className="reset-preview-mark" aria-hidden="true">{METHOD_MARKS[method.id]}</span>}</div>
    <p className="sm-copy">{practice.preparation}</p>
    <div className="reset-preview-notes"><p><strong>为什么这样做</strong>{guidance.mechanism}</p><p><strong>练习提醒</strong>{guidance.reminder}</p></div>
    <ol className="reset-preview-steps">{practice.steps.slice(0, 3).map((step, index) => <li key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.instruction}</p></div><small>{step.seconds} 秒</small></li>)}</ol>
  </div>;
}
function PrePracticeCheck({ method, practice, intensityBefore, lockedBeforeScore, onIntensityBefore, options, onOptions, onStart }: {
  method: MethodDefinition; practice: PracticeVariant; intensityBefore?: ActivationLevel; lockedBeforeScore: boolean;
  onIntensityBefore: (value: ActivationLevel | undefined) => void; options: PracticeOptions; onOptions: (value: PracticeOptions) => void; onStart: () => void;
}) {
  return <div className="reset-precheck">
    <p className="sm-eyebrow">{practice.minutes} 分钟 · {method.title}</p>
    <h2 className="sm-title">{lockedBeforeScore ? "准备好了，就开始。" : "此刻的强度，可以记，也可以不记。"}</h2>
    <p className="sm-copy">{lockedBeforeScore ? `首页已记录：被带走程度 ${ratingText(intensityBefore)}。这里不需要重复选择。` : "1 = 稳定，5 = 完全被带走。这个数字只用于本次前后自评，不代表人的状态等级。"}</p>
    {lockedBeforeScore ? null : <IntensityScale label="被带走程度" value={intensityBefore} onChange={onIntensityBefore} />}
    <PracticeOptionsPanel value={options} onChange={onOptions} />
    <button type="button" onClick={onStart} className="sm-button sm-button-primary reset-start">开始 {practice.minutes} 分钟练习</button>
    <p className="sm-caption">练后可以跳过反馈。没有变化或更不舒服，都可以如实记录。</p>
  </div>;
}

function CheckView({ stopped, intensityBefore, intensityAfter, reuseIntent, feedbackNote, shareAnonymous, onIntensityAfter, onReuseIntent, onFeedbackNote, onShareAnonymous, onComplete, onSkip }: {
  stopped: boolean; intensityBefore?: ActivationLevel; intensityAfter?: ActivationLevel; reuseIntent?: ReuseIntent; feedbackNote: string; shareAnonymous: boolean;
  onIntensityAfter: (value: ActivationLevel | undefined) => void; onReuseIntent: (value: ReuseIntent) => void; onFeedbackNote: (value: string) => void;
  onShareAnonymous: (value: boolean) => void; onComplete: () => void; onSkip: () => void;
}) {
  const feedbackOutcome = sessionResult(intensityBefore, intensityAfter, stopped);
  return <div className="reset-check">
    <p className="sm-eyebrow">可选反馈 · 练习前 {ratingText(intensityBefore)}</p>
    <h2 className="sm-title">{stopped ? "已经停在这里。" : "现在感觉怎样？"}</h2>
    <p className="sm-copy">不需要填写，也不需要证明练习有效。想离开，可以直接结束。</p>
    <IntensityScale label="现在被带走的程度（可不填）" value={intensityAfter} onChange={onIntensityAfter} />
    <div aria-live="polite" className="sm-notice"><p>{changeText(intensityBefore, intensityAfter)}</p><p className="sm-caption">{feedbackOutcome === "worse" ? "先停在这里，不必继续这个练习。" : "按实际感受填写，没有变化也可以。"}</p></div>
    <details className="sm-fold reset-feedback-extra"><summary>再留一句感受 <span>可选</span></summary><div>
      <fieldset><legend className="sm-caption">下次会再用吗？（可不选）</legend><div className="sm-choice-row">{(["会", "不确定", "不会"] as const).map((item) => <button key={item} type="button" aria-pressed={reuseIntent === item} onClick={() => onReuseIntent(item)} className={`sm-choice${reuseIntent === item ? " is-selected" : ""}`}>{item}</button>)}</div></fieldset>
      <label><span className="sm-caption">一句话感受（可选）</span><textarea name="practice-feedback" autoComplete="off" value={feedbackNote} onChange={(event) => onFeedbackNote(event.target.value)} maxLength={500} placeholder="哪里有用，哪里不舒服？" className="sm-input" /></label>
      <label className="reset-consent"><input type="checkbox" checked={shareAnonymous} onChange={(event) => onShareAnonymous(event.target.checked)} /><span>自愿匿名分享已填写的变化、方法及复用意愿。不发送原话或反馈文字。</span></label>
    </div></details>
    <div className="reset-check-actions"><button type="button" onClick={onSkip} className="sm-button sm-button-quiet">跳过反馈，结束</button><button type="button" onClick={onComplete} className="sm-button sm-button-primary">保存反馈并结束</button></div>
  </div>;
}
function IntensityScale({ label, value, onChange }: { label: string; value?: ActivationLevel; onChange: (value: ActivationLevel | undefined) => void }) {
  return <div className="sm-activation"><div className="sm-input-heading"><p>{label}</p><strong>{ratingText(value)}</strong></div><div className="sm-scale" role="group" aria-label={label}>{([1, 2, 3, 4, 5] as const).map((level) => <button key={level} type="button" aria-label={`${label} ${level}`} aria-pressed={value === level} onClick={() => onChange(value === level ? undefined : level)}>{level}</button>)}</div></div>;
}
function DoneView({ method, action, result, status, storageWarning, intensityBefore, intensityAfter, reuseIntent, feedbackNote, onAgain }: {
  method: MethodDefinition; action: string; result?: SessionResult; status?: PracticeSession["status"]; storageWarning: boolean;
  intensityBefore?: ActivationLevel; intensityAfter?: ActivationLevel; reuseIntent?: ReuseIntent; feedbackNote: string; onAgain: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const ending = endingCopy(result, status);
  const feedbackLine = feedbackNote.trim() || "（未填写）";
  const feedbackText = ["StillMind Web Reset 反馈", `练习方法：${method.title}`, `会话状态：${status ?? "未记录"}`,
    `练习前：${ratingText(intensityBefore)}`, `练习后：${ratingText(intensityAfter)}`, `变化：${changeText(intensityBefore, intensityAfter)}`,
    `下次类似场景是否愿意再用：${reuseIntent ?? "未填写"}`, `一句话反馈：${feedbackLine}`, "未收集实际行动完成情况。"].join("\n");
  async function copyFeedback() {
    try { await navigator.clipboard.writeText(feedbackText); setCopied(true); setCopyFailed(false); }
    catch { setCopied(false); setCopyFailed(true); }
  }
  return <div className="reset-done">
    {method.id === "inner-cinema" ? <div className="inner-cinema-completion-scene"><InnerCinemaVisual lensId="witness" compact decorative /></div> : null}
    <h2 className="sm-title">{ending.title}</h2><p className="sm-copy">{ending.body}</p>
    {storageWarning ? <p role="status" className="sm-notice">本次记录未能完整保存在浏览器中。你仍然可以离开或复制反馈。</p> : null}
    <div className="reset-result-line"><span>练习前 <strong>{ratingText(intensityBefore)}</strong></span><span>练习后 <strong>{ratingText(intensityAfter)}</strong></span><span>{changeText(intensityBefore, intensityAfter)}</span></div>
    {ending.suggestPractice ? <p className="sm-copy">可选的小建议：{action}。不需要马上做。</p> : <Link href="/support" className="sm-text-link">查看现实支持</Link>}
    <div className="reset-done-actions"><Link href="/" className="sm-button sm-button-primary">结束并返回</Link><Link href="/methods" className="sm-button sm-button-quiet">方法库</Link>{ending.suggestPractice ? <button type="button" onClick={onAgain} className="sm-button sm-button-quiet">另开一次练习</button> : null}</div>
    <details className="sm-fold reset-done-secondary"><summary>复制本次反馈 <span>由你决定是否分享</span></summary><div><div><p className="sm-caption">反馈文字只保存在本机，复制后是否分享由你决定。</p><p className="sm-caption">{feedbackLine}</p></div><button type="button" onClick={copyFeedback} className="sm-button sm-button-quiet">{copied ? "已复制" : "复制反馈"}</button></div>{copyFailed ? <textarea aria-label="可手动复制的反馈" readOnly value={feedbackText} className="sm-input" /> : null}</details>
  </div>;
}
