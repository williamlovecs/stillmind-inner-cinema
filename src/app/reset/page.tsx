"use client";

import "./session.css";
import Link from "next/link";
import Image from "next/image";
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PracticePlayer } from "@/components/ResetPracticePlayer";
import { WorkflowNav } from "@/components/WorkflowNav";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { PracticeOptionsPanel } from "@/components/PracticeOptionsPanel";
import { PENDING_PRACTICE_OPTIONS_KEY, readPracticeOptions, practiceOptionsFromQuery, type PracticeOptions } from "@/lib/practice-options";
import { beginAttempt, endAttempt, saveAttemptFeedback, type PracticeAttempt } from "@/lib/practice-attempt";
import { browserLocalStorage, readStoredArray, writeStoredJson } from "@/lib/safe-storage";
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
  "person-shift": { anchor: "从“我”换成名字", mechanism: "把第一人称换成名字，反应会从“我就是这样”变成“有人正在经历”。", reminder: "这不是否认自己，只是临时拉开一点距离。" },
  "logout-pause": { anchor: "暂时登出解释界面", mechanism: "解释常常会继续造剧情，先不互动，反应就少一点燃料。", reminder: "不要把登出做成麻木；一分钟后仍要回到现实行动。" },
  release: { anchor: "情绪起伏的波纹", mechanism: "允许反应出现，同时保留旁观位置，情绪就不必变成身份。", reminder: "宽恕不是替对方开脱，边界仍然可以清楚。" },
  "open-awareness": { anchor: "更宽的空间感", mechanism: "把声音、身体和念头一起纳入，单一的“我”就不再占满全部画面。", reminder: "不追求神秘体验，只记住一点安静的质地。" },
  "grounded-action": { anchor: "一个很小的细节", mechanism: "把视角压缩到具体感官，脑内大剧情会被切成可处理的小片段。", reminder: "只选一个细节，不需要同时抓住所有感官。" },
  "trigger-journal": { anchor: "让晃动画面慢下来", mechanism: "观察注意如何被带走，再轻轻稳定它，就是在训练意识稳定性。", reminder: "稳定不了也没关系，知道自己被带走就是进步。" },
  anchors: { anchor: "从近景拉到高空", mechanism: "把视角从眼前小事拉到更大时间线，角色会变小，空间会变大。", reminder: "拉远后要回来，选择一个现实里的小动作。" },
};
const METHOD_VISUALS: Record<MethodId, { src: string; alt: string }> = {
  "inner-cinema": { src: "/practice-visuals/inner-cinema.svg", alt: "一个人坐在影院里，看着银幕上的夕光画面" },
  "paced-breath": { src: "/practice-visuals/paced-breath.svg", alt: "一颗安静的水珠，用来跟随呼气数数" },
  "thought-watching": { src: "/practice-visuals/thought-watching.svg", alt: "念头像字幕气泡一样围绕中心升起又落下" },
  "wide-gaze": { src: "/practice-visuals/wide-gaze.svg", alt: "一束安静烛光，用来做凝视练习" },
  "body-scan": { src: "/practice-visuals/body-scan.svg", alt: "身体轮廓上的几个感受落点" },
  "person-shift": { src: "/practice-visuals/person-shift.svg", alt: "两个观察位置之间的视角切换" },
  "logout-pause": { src: "/practice-visuals/logout-pause.svg", alt: "从解释和参与中暂时登出的界面" },
  release: { src: "/practice-visuals/release.svg", alt: "情绪波纹向外扩散又慢慢变柔" },
  "open-awareness": { src: "/practice-visuals/open-awareness.svg", alt: "开放空间里的发光中心和环形场域" },
  "grounded-action": { src: "/practice-visuals/grounded-action.svg", alt: "把注意力聚焦到杯沿这样的具体细节" },
  "trigger-journal": { src: "/practice-visuals/trigger-journal.svg", alt: "几条波动线被稳定在安静的视觉框里" },
  anchors: { src: "/practice-visuals/anchors.svg", alt: "从高空看向地球的宏观视角" },
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
  return <main className="grid min-h-dvh place-items-center bg-[#050914] px-6 text-stone-50"><div className="text-center"><span className="mx-auto block h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-200 to-amber-200 shadow-[0_0_42px_rgba(168,85,247,0.28)]" /><p className="mt-5 text-sm text-stone-400">正在准备这一分钟…</p></div></main>;
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
      const storedTrigger = window.sessionStorage.getItem(PENDING_TRIGGER_KEY) ?? "";
      const storedMode = window.sessionStorage.getItem(PENDING_MODE_KEY);
      const storedActivation = window.sessionStorage.getItem(PENDING_ACTIVATION_KEY);
      const storedInputMethod = window.sessionStorage.getItem(PENDING_INPUT_METHOD_KEY);
      const legacyStoredIntensity = window.sessionStorage.getItem(PENDING_INTENSITY_KEY);
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
      const storedOptions = window.sessionStorage.getItem(PENDING_PRACTICE_OPTIONS_KEY);
      setOptions(storedOptions ? readPracticeOptions(storedOptions) : practiceOptionsFromQuery(params));
      if (storedInputMethod === "typed" || storedInputMethod === "dictation" || storedInputMethod === "example" || storedInputMethod === "state-only") setInputMethod(storedInputMethod);
      if (queryMethodDef) {
        setSelectedMethodId(queryMethodDef.id);
        setManualChoice(true);
        setShowAdvancedMethods(true);
        setDuration(queryMethodDef.durations[0]);
      }
      for (const key of [PENDING_TRIGGER_KEY, PENDING_MODE_KEY, PENDING_ACTIVATION_KEY, PENDING_INPUT_METHOD_KEY, PENDING_INTENSITY_KEY, PENDING_PRACTICE_OPTIONS_KEY]) window.sessionStorage.removeItem(key);
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
  const practiceShellClass = `flex min-w-0 flex-col rounded-[2rem] border border-white/10 bg-slate-950/55 p-5 shadow-inner shadow-black/30 ${phase === "practice" ? "min-h-[560px]" : "min-h-[360px]"}`;
  const focusMode = directEntry || phase !== "choose";
  const focusEyebrow = phase === "practice" ? "练习进行中" : phase === "check" ? "可选反馈" : phase === "done" ? "练习已结束" : "推荐练习";
  const focusStatusCopy = phase === "practice" ? "跟着做，随时可以停止。"
    : phase === "check" ? "按实际感受填写，也可以跳过。"
      : phase === "done" ? "这次练习已结束。" : "评分可不填，默认值只用于选择练习。";

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
    <main className="min-h-screen overflow-hidden bg-[#050914] text-stone-50">
      <DisclaimerModal onAcknowledged={setBoundaryReady} />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_72%_78%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(135deg,#050914_0%,#07111f_46%,#0b1020_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-200 via-violet-500 to-sky-500 p-[2px] shadow-lg shadow-violet-950/30"><span className="h-full w-full rounded-full bg-[#070d1b]" /></span><span><span className="block text-sm uppercase tracking-[0.34em] text-violet-100/70">StillMind</span><span className="block text-sm font-medium text-stone-200">沉寂小我练习器</span></span></Link>
          <nav className="flex items-center gap-2 text-sm text-stone-300">{focusMode ? <Link className="rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white" href="/">回到入口</Link> : <><Link className="rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white" href="/methods">方法库</Link><Link className="hidden rounded-full border border-white/10 px-4 py-2 transition hover:border-violet-200/40 hover:text-white sm:inline-flex" href="/support/seed-test">参与测试</Link></>}</nav>
        </header>
        {!focusMode ? <div className="mt-5"><WorkflowNav active="reset" /></div> : null}
        <section className={`grid w-full min-w-0 flex-1 gap-5 py-6 lg:items-start ${focusMode ? "mx-auto max-w-2xl" : "lg:grid-cols-[0.78fr_1.22fr]"}`}>
          {!focusMode ? <aside className="w-full min-w-0 space-y-4 lg:sticky lg:top-6">
            <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-violet-200/15 bg-slate-950/55 p-5 shadow-2xl shadow-violet-950/25 backdrop-blur-xl sm:max-w-full">
              <p className="text-sm uppercase tracking-[0.26em] text-violet-200/65">先把声音放下来</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">脑子里那个停不下来的声音，先让它静一点。</h1>
              <p className="mt-4 text-base leading-7 text-stone-300">这些练习都在做同一件事：从剧情里的角色，退回能观看的观众席。</p>
              <div className="mt-4 rounded-2xl border border-violet-200/20 bg-violet-200/[0.08] p-3 text-sm leading-6 text-violet-50">第一次体验：选当前状态，做 1 分钟推荐练习，记录自己的实际感受。</div>
              {incomingTrigger ? <div className="mt-4 rounded-2xl border border-amber-200/18 bg-amber-100/[0.06] p-3 text-sm leading-6 text-amber-50/90"><span className="block text-xs uppercase tracking-[0.18em] text-amber-100/55">刚才说的是</span><span className="mt-1 block break-words text-stone-200">{incomingTrigger}</span></div> : null}
              <p className="mt-3 text-xs leading-5 text-stone-500">请不要输入真实姓名、隐私事件、创伤细节、医疗或危机场景。本工具只是日常情绪 reset 和自我观察练习，不替代心理咨询或医疗帮助。</p>
            </div>
            <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl sm:max-w-full">
              <p className="px-1 text-sm font-medium text-stone-100">当前状态</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{visibleStateOptions.map((item) => <button key={item.id} type="button" onClick={() => changeMode(item.id)} className={`rounded-2xl border p-3 text-left transition ${mode === item.id ? "border-violet-200/70 bg-violet-200/14 shadow-lg shadow-violet-950/20" : "border-white/10 bg-slate-950/36 hover:border-violet-200/35"}`}><span className="block text-sm font-semibold text-white">{item.label}</span><span className="mt-1 block text-xs leading-5 text-stone-400">{item.body}</span></button>)}</div>
              <button type="button" onClick={() => setShowAllStates((value) => !value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium text-stone-300 transition hover:border-violet-200/35 hover:text-white">{showAllStates ? "收起状态" : "更多状态"}</button>
            </div>
          </aside> : null}
          <section className="grid w-full min-w-0 content-start gap-5 rounded-[2rem] border border-violet-200/15 bg-[#07111f]/76 p-4 shadow-2xl shadow-black/35 backdrop-blur-2xl sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-violet-200/65">{focusMode ? focusEyebrow : "推荐练习"}</p>
                <div className="mt-3 flex flex-wrap items-end gap-3"><h2 className="text-3xl font-semibold text-white sm:text-4xl">{method.title}</h2><span className="rounded-full border border-amber-200/25 bg-amber-100/10 px-3 py-1 text-sm text-amber-100">{practice?.minutes ?? duration} 分钟</span></div>
                {!focusMode ? <p className="mt-3 max-w-2xl text-base leading-7 text-stone-300">{methodReason}</p> : <p className="mt-3 text-sm leading-6 text-stone-400">{focusStatusCopy}</p>}
                {phase === "practice" && incomingTrigger ? <p className="mt-3 line-clamp-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-6 text-stone-400">刚才发生了：{incomingTrigger}</p> : null}
                {!focusMode ? <div className="mt-3 grid gap-2 text-xs text-stone-400 sm:grid-cols-3"><span className="rounded-full border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2">先被看见</span><span className="rounded-full border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2">退回观众席</span><span className="rounded-full border border-violet-200/15 bg-violet-200/[0.06] px-3 py-2">前后 1-5 评分</span></div> : null}
                {!focusMode ? <p className="mt-3 text-sm leading-6 text-violet-100/70">先跟着这一分钟走完，不用先研究 12 种方法；完成后可以自愿记录感受。</p> : null}
                {phase === "choose" ? <button type="button" onClick={requestStart} className="mt-4 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-950/25 transition hover:scale-[1.01]">开始 {practice?.minutes ?? duration} 分钟练习</button> : null}
              </div>
              {!focusMode ? <div className="flex flex-wrap gap-2 lg:justify-end">{!showDurationOptions ? <button type="button" onClick={() => setShowDurationOptions(true)} className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-stone-300 transition hover:border-violet-200/35 hover:text-white">默认 1 分钟 · 调整</button> : [1, 3, 5, 10].map((value) => {
                const minutes = value as DurationMinutes; const available = method.durations.includes(minutes);
                return <button key={value} type="button" disabled={!available} onClick={() => setDuration(minutes)} className={`rounded-full border px-3 py-2 text-sm transition ${duration === minutes ? "border-violet-200/70 bg-violet-200/16 text-white" : "border-white/10 bg-white/[0.04] text-stone-300 enabled:hover:border-violet-200/35 disabled:cursor-not-allowed disabled:opacity-35"}`}>{value}m</button>;
              })}</div> : null}
            </div>
            {startNotice ? <div role="alert" className="rounded-2xl border border-amber-200/25 bg-amber-100/[0.06] p-4 text-sm leading-6 text-amber-50"><p>{startNotice}</p><button type="button" onClick={() => { setManualChoice(false); setShowAdvancedMethods(false); setDirectEntry(false); setAutoStartPending(false); setStartNotice(""); setPhase("choose"); }} className="mt-3 underline underline-offset-4">返回推荐</button><Link href="/support" className="ml-4 underline underline-offset-4">支持与退出</Link></div> : null}
            <div className="grid min-w-0 gap-4">
              <div className={practiceShellClass}>
                {phase === "choose" && practice ? <ChoosePractice method={method} practice={practice} /> : null}
                {phase === "precheck" && practice ? <PrePracticeCheck method={method} practice={practice} intensityBefore={intensityBefore} lockedBeforeScore={lockedBeforeScore} onIntensityBefore={setIntensityBefore} options={options} onOptions={setOptions} onStart={startPractice} /> : null}
                {phase === "practice" && practice && currentStep ? <PracticePlayer method={method} practice={practice} stepIndex={stepIndex} secondsLeft={secondsLeft} elapsedSeconds={completedSeconds} breathingSeconds={completedBreathingSeconds} progress={progress} paused={paused} trigger={incomingTrigger} cinema={localCinema} onPause={togglePause} onStop={stopPractice} /> : null}
                {phase === "check" ? <CheckView stopped={result === "stopped"} intensityBefore={intensityBefore} intensityAfter={intensityAfter} reuseIntent={reuseIntent} feedbackNote={feedbackNote} shareAnonymous={shareAnonymous} onIntensityAfter={setIntensityAfter} onReuseIntent={setReuseIntent} onFeedbackNote={setFeedbackNote} onShareAnonymous={(value) => setOptions((previous) => ({ ...previous, shareAnonymous: value }))} onComplete={() => completeSession()} onSkip={() => completeSession(true)} /> : null}
                {phase === "done" ? <DoneView result={result} status={endStatus} storageWarning={storageWarning} method={method} action={action} intensityBefore={intensityBefore} intensityAfter={intensityAfter} reuseIntent={reuseIntent} feedbackNote={feedbackNote} onAgain={resetAgain} /> : null}
              </div>
              {!focusMode ? <aside className="min-w-0 space-y-4">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-4">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-100">进阶方法库</p><button type="button" onClick={() => setShowAdvancedMethods((value) => !value)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-stone-300 transition hover:border-violet-200/35 hover:text-white">{showAdvancedMethods ? "收起" : "展开"}</button></div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">第一次不用手动选择方法，系统已根据当前状态推荐。</p>
                  {!showAdvancedMethods ? <div className="mt-3 rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] p-3"><p className="text-xs uppercase tracking-[0.18em] text-violet-200/60">当前推荐</p><p className="mt-2 text-sm font-semibold text-white">{method.title}</p><p className="mt-1 text-xs leading-5 text-stone-500">完成第一次练习后，可以探索更多方法。</p></div> : <div className="mt-3 grid max-h-[340px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">{METHOD_CATALOG.map((item) => <button key={item.id} type="button" onClick={() => chooseMethod(item.id)} className={`group rounded-2xl border p-2.5 text-left transition ${item.id === method.id ? "border-violet-200/70 bg-violet-200/14" : "border-white/10 bg-slate-950/32 hover:border-violet-200/35"}`}><span className="flex items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-300/80 to-amber-200/70 text-sm font-bold text-slate-950">{METHOD_MARKS[item.id]}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="block truncate text-xs text-stone-500">{FAMILY_LABELS[item.family]}</span></span></span></button>)}</div>}
                </div>
                {sessions.length > 0 ? <div className="rounded-[1.6rem] border border-amber-200/15 bg-amber-100/[0.055] p-4"><p className="text-sm font-medium text-stone-100">本机记录</p><p className="mt-2 break-all text-sm leading-6 text-stone-400">只保存在当前浏览器，用来回看练习，不上传私人触发内容。</p><div className="mt-4 space-y-2">{sessions.slice(0, 3).map((session) => <div key={session.id} className="rounded-2xl border border-white/10 bg-slate-950/36 p-3"><p className="text-sm font-medium text-stone-100">{METHOD_BY_ID.get(session.methodId)?.title ?? session.methodId}</p><p className="mt-1 text-xs text-stone-500">{session.result ?? session.status} · {new Date(session.startedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>)}</div></div> : null}
              </aside> : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function ChoosePractice({ method, practice }: { method: MethodDefinition; practice: PracticeVariant }) {
  const guidance = METHOD_GUIDANCE[method.id];
  return <div className="flex h-full flex-col gap-5"><div>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(180px,0.55fr)] lg:items-start"><div><p className="text-xs uppercase tracking-[0.22em] text-stone-500">练习预览</p><h3 className="mt-2 text-2xl font-semibold text-white">{practice.title}</h3><p className="mt-2 text-sm leading-6 text-stone-400">{practice.subtitle}</p><p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-stone-400">{practice.preparation}</p></div><MethodAnchorVisual methodId={method.id} label={guidance.anchor} /></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] p-3"><p className="text-xs font-medium text-violet-100">为什么这样做</p><p className="mt-2 text-xs leading-5 text-stone-400">{guidance.mechanism}</p></div><div className="rounded-2xl border border-amber-200/15 bg-amber-100/[0.055] p-3"><p className="text-xs font-medium text-amber-100">温柔提醒</p><p className="mt-2 text-xs leading-5 text-stone-400">{guidance.reminder}</p></div></div>
    <div className="mt-4 space-y-2">{practice.steps.slice(0, 3).map((step, index) => <div key={step.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/42 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-violet-200/20 bg-violet-200/[0.08] text-xs font-semibold text-violet-100">{index + 1}</span><div className="min-w-0"><p className="text-sm font-semibold leading-6 text-white">{step.title}</p><p className="mt-1 text-sm leading-6 text-stone-400">{step.instruction}</p></div><span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-xs text-stone-500">{step.seconds} 秒</span></div>)}</div>
  </div></div>;
}
function MethodAnchorVisual({ methodId, label }: { methodId: MethodId; label: string }) {
  const visual = METHOD_VISUALS[methodId];
  return <figure className="relative min-h-44 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60 shadow-inner shadow-black/30"><Image src={visual.src} alt={visual.alt} width={720} height={520} className="h-44 w-full object-cover opacity-95" /><figcaption className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2 text-center text-sm font-medium text-stone-100 shadow-lg shadow-black/25 backdrop-blur-md">{label}</figcaption></figure>;
}
function PrePracticeCheck({ method, practice, intensityBefore, lockedBeforeScore, onIntensityBefore, options, onOptions, onStart }: {
  method: MethodDefinition; practice: PracticeVariant; intensityBefore?: ActivationLevel; lockedBeforeScore: boolean;
  onIntensityBefore: (value: ActivationLevel | undefined) => void; options: PracticeOptions; onOptions: (value: PracticeOptions) => void; onStart: () => void;
}) {
  return <div className="flex h-full flex-col justify-center gap-6">
    <div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">练习前</p><h3 className="mt-3 text-3xl font-semibold text-white">{lockedBeforeScore ? "练习前分数已记录。" : "可以标记此刻的强度。"}</h3><p className="mt-3 text-base leading-7 text-stone-400">{lockedBeforeScore ? "首页已经记录了你被脑内剧情带走的程度，不需要重复选择。" : "你现在被脑内剧情带走的程度？1 = 稳定，5 = 完全被带走。"}</p></div>
    {lockedBeforeScore ? <div className="rounded-3xl border border-amber-200/20 bg-amber-100/[0.07] p-4"><p className="text-sm text-stone-400">练习前被带走程度</p><p className="mt-2 text-4xl font-semibold text-amber-100">{ratingText(intensityBefore)}</p><p className="mt-2 text-sm leading-6 text-stone-500">练后评分也可以不填，没有变化或不舒服都可以记录。</p></div> : <IntensityScale label="被带走程度" value={intensityBefore} onChange={onIntensityBefore} />}
    <div className="rounded-3xl border border-violet-200/15 bg-violet-200/[0.06] p-4"><p className="text-sm text-stone-400">接下来练习</p><p className="mt-2 text-xl font-semibold text-white">{practice.minutes} 分钟 · {method.title}</p><p className="mt-2 text-sm leading-6 text-stone-500">练完后会自动进入反馈，只问练后分数、下次是否愿意再用和一句话感受。</p></div>
    <PracticeOptionsPanel value={options} onChange={onOptions} />
    <button type="button" onClick={onStart} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-4 text-base font-semibold text-slate-950 shadow-xl shadow-violet-950/30 transition hover:scale-[1.01]">开始 {practice.minutes} 分钟练习</button>
  </div>;
}

function CheckView({ stopped, intensityBefore, intensityAfter, reuseIntent, feedbackNote, shareAnonymous, onIntensityAfter, onReuseIntent, onFeedbackNote, onShareAnonymous, onComplete, onSkip }: {
  stopped: boolean; intensityBefore?: ActivationLevel; intensityAfter?: ActivationLevel; reuseIntent?: ReuseIntent; feedbackNote: string; shareAnonymous: boolean;
  onIntensityAfter: (value: ActivationLevel | undefined) => void; onReuseIntent: (value: ReuseIntent) => void; onFeedbackNote: (value: string) => void;
  onShareAnonymous: (value: boolean) => void; onComplete: () => void; onSkip: () => void;
}) {
  const feedbackOutcome = sessionResult(intensityBefore, intensityAfter, stopped);
  return <div className="flex h-full flex-col justify-center gap-5">
    <div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">可选反馈</p><h3 className="mt-3 text-3xl font-semibold text-white">{stopped ? "练习已停止。" : "现在感觉怎样？"}</h3><p className="mt-3 text-sm leading-6 text-stone-400">练习前：{ratingText(intensityBefore)}。不必补填。</p></div>
    <button type="button" onClick={onSkip} className="min-h-11 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-stone-200">跳过反馈，结束</button>
    <IntensityScale label="现在被带走的程度（可不填）" value={intensityAfter} onChange={onIntensityAfter} />
    <div aria-live="polite" className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.06] p-4"><p className="text-sm font-medium text-stone-100">{changeText(intensityBefore, intensityAfter)}</p><p className="mt-1 text-xs leading-5 text-stone-400">{feedbackOutcome === "worse" ? "先停在这里，不必继续这个练习。" : "按实际感受填写，没有变化也可以。"}</p></div>
    <div><p className="mb-2 text-sm font-medium text-stone-100">下次会再用吗？（可不选）</p><div className="grid grid-cols-3 gap-2">{(["会", "不确定", "不会"] as const).map((item) => <button key={item} type="button" aria-pressed={reuseIntent === item} onClick={() => onReuseIntent(item)} className={reuseIntent === item ? "rounded-2xl border border-violet-200/70 bg-violet-200/14 p-3 text-center text-sm font-semibold text-white" : "rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center text-sm text-stone-300"}>{item}</button>)}</div></div>
    <label className="block"><span className="mb-2 block text-sm font-medium text-stone-100">一句话感受（可选）</span><textarea name="practice-feedback" autoComplete="off" value={feedbackNote} onChange={(event) => onFeedbackNote(event.target.value)} maxLength={500} placeholder="哪里有用，哪里不舒服？" className="min-h-20 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-6 text-white placeholder:text-stone-500 focus:border-violet-200/45" /></label>
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"><input type="checkbox" checked={shareAnonymous} onChange={(event) => onShareAnonymous(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-400" /><span className="text-xs leading-5 text-stone-400">自愿匿名分享已填写的变化、方法及复用意愿。不发送原话或反馈文字。</span></label>
    <button type="button" onClick={onComplete} className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 py-4 text-base font-semibold text-slate-950">保存反馈并结束</button>
  </div>;
}
function IntensityScale({ label, value, onChange }: { label: string; value?: ActivationLevel; onChange: (value: ActivationLevel | undefined) => void }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-100">{label}</p><span className="text-sm font-semibold tabular-nums text-amber-100">{ratingText(value)}</span></div><div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label={label}>{([1, 2, 3, 4, 5] as const).map((level) => <button key={level} type="button" aria-label={`${label} ${level}`} aria-pressed={value === level} onClick={() => onChange(value === level ? undefined : level)} className={`grid min-h-11 place-items-center rounded-xl border text-sm font-semibold transition ${value === level ? "border-amber-200/75 bg-amber-200/18 text-white" : "border-white/10 bg-slate-950/36 text-stone-400 hover:border-violet-200/35 hover:text-stone-200"}`}>{level}</button>)}</div></div>;
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
  return <div className="grid h-full place-items-center text-center"><div className="max-w-2xl">
    <p className="text-sm uppercase tracking-[0.26em] text-amber-100/70">练习已结束</p>
    <h3 className="mt-4 text-4xl font-semibold leading-tight text-white">{ending.title}</h3><p className="mt-4 text-base leading-7 text-stone-300">{ending.body}</p>
    {storageWarning ? <p role="status" className="mt-4 rounded-2xl border border-amber-200/25 p-3 text-sm text-amber-100">本次记录未能完整保存在浏览器中。你仍然可以离开或复制反馈。</p> : null}
    <div className="mx-auto mt-6 grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-amber-200/15 bg-amber-100/[0.055] p-4"><div><p className="text-xs text-stone-400">练习前</p><p className="mt-1 text-2xl font-semibold text-white">{ratingText(intensityBefore)}</p></div><span className="text-stone-500">→</span><div><p className="text-xs text-stone-400">练习后</p><p className="mt-1 text-2xl font-semibold text-amber-100">{ratingText(intensityAfter)}</p></div><p className="col-span-3 text-sm text-stone-300">{changeText(intensityBefore, intensityAfter)}</p></div>
    {ending.suggestPractice ? <p className="mt-5 text-base leading-7 text-stone-300">可选的小建议：{action}。不需要马上做。</p> : <Link href="/support" className="mt-5 inline-flex text-amber-100 underline underline-offset-4">查看现实支持</Link>}
    <div className="mt-6 rounded-3xl border border-violet-200/15 bg-violet-200/[0.06] p-4 text-left"><div className="grid grid-cols-[1fr_auto] items-start gap-3"><div className="min-w-0"><p className="text-sm font-medium text-stone-100">种子测试反馈</p><p className="mt-2 text-xs leading-5 text-stone-400">反馈文字只保存在本机；复制后是否分享由你决定。</p></div><button type="button" onClick={copyFeedback} className="min-h-11 shrink-0 whitespace-nowrap rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-5 py-2.5 text-sm font-semibold text-slate-950">{copied ? "已复制" : "复制反馈"}</button></div>{copyFailed ? <textarea aria-label="可手动复制的反馈" readOnly value={feedbackText} className="mt-3 min-h-36 w-full rounded-2xl bg-slate-950/60 p-3 text-sm text-stone-200" /> : null}<p className="mt-3 break-words text-sm text-stone-400">{feedbackLine}</p></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/" className="rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white">结束并返回</Link>{ending.suggestPractice ? <><Link href="/methods" className="rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white">方法库</Link><button type="button" onClick={onAgain} className="rounded-full border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white">另开一次练习</button><Link href="/support/seed-test" className="rounded-full border border-white/10 px-5 py-3 text-sm text-stone-300">参与后续测试</Link></> : null}</div>
  </div></div>;
}
