import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { getPracticeVariant } from "@stillmind/content";
import {
  canStartMethod, containsHighRiskLanguage, elapsedPracticeMs, isStateMode, METHOD_BY_ID,
  pausePracticeClock, practicePosition, recommendMethods, reportedActivation, RESET_STATE_BY_MODE,
  resumePracticeClock, type ActivationLevel, type DesiredOutcome, type DurationMinutes,
  type MethodId, type PracticeSession, type SessionResult, type StateMode,
} from "@stillmind/domain";
import { useApp } from "@/state/AppProvider";
import { buildMethodHistory } from "@/lib/recommendation";
import { cinemaToPractice, requestCinema } from "@/lib/cinema";
import { track } from "@/lib/analytics";
import { beginNativeAttempt, endNativeAttempt, nativeFeedbackResult, saveNativeFeedback, type NativeAttempt } from "@/lib/practice-attempt";

export type ResetPhase = "preparing" | "recommend" | "practice" | "check" | "action" | "done" | "support";
type ReuseIntent = "yes" | "unsure" | "no";
const OUTCOMES: readonly string[] = ["pause", "settle", "distance", "release", "choose", "awareness"];
const now = () => performance.now();
function parseDuration(value?: string): DurationMinutes {
  const n = Number(value); return n === 3 || n === 5 || n === 10 ? n : 1;
}

/** Native UI uses the same rating/clock/eligibility rules as Web, without sharing platform storage. */
export function useResetSession() {
  const params = useLocalSearchParams<{ mode?: string; methodId?: string; duration?: string; activation?: string; outcome?: string; direct?: string }>();
  const { ready, preferences, sessions, pendingResetDraft, setPendingResetDraft, addSession, updatePreferences } = useApp();
  const [phase, setPhase] = useState<ResetPhase>(params.direct === "1" ? "preparing" : "recommend");
  const [mode] = useState<StateMode>(isStateMode(params.mode) ? params.mode : "looping");
  const [activationBefore, setActivationBefore] = useState<ActivationLevel | undefined>(reportedActivation(Number(params.activation)));
  const [activationAfter, setActivationAfter] = useState<ActivationLevel | undefined>();
  const [duration, setDuration] = useState<DurationMinutes>(parseDuration(params.duration));
  const [trigger, setTrigger] = useState(pendingResetDraft?.trigger ?? "");
  const [selectedId, setSelectedId] = useState<MethodId | undefined>(METHOD_BY_ID.has(params.methodId as MethodId) ? params.methodId as MethodId : undefined);
  const [generatedPractice, setGeneratedPractice] = useState<ReturnType<typeof getPracticeVariant>>();
  const [generating, setGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reportedResult, setReportedResult] = useState<Exclude<SessionResult, "stopped">>();
  const [reuseIntent, setReuseIntent] = useState<ReuseIntent>();
  const [action, setAction] = useState<string>();
  const [endStatus, setEndStatus] = useState<PracticeSession["status"]>();
  const [storageWarning, setStorageWarning] = useState(false);
  const attempt = useRef<NativeAttempt | undefined>(undefined);
  const focused = useRef(false);
  const requestSequence = useRef(0);
  const requestInFlight = useRef(false);
  const directHandled = useRef(false);
  const latestSave = useRef(addSession);
  const latestPreferences = useRef(preferences);
  useEffect(() => { latestSave.current = addSession; latestPreferences.current = preferences; }, [addSession, preferences]);
  const history = useMemo(() => buildMethodHistory(sessions, preferences.favoriteMethodIds), [sessions, preferences.favoriteMethodIds]);
  const routingInput = useMemo(() => ({
    activation: activationBefore ?? RESET_STATE_BY_MODE.get(mode)?.defaultActivation ?? 3,
    mode, duration, outcome: (OUTCOMES.includes(params.outcome ?? "") ? params.outcome : "pause") as DesiredOutcome,
    scope: selectedId ? "library" as const : "reset" as const,
    eyesOpenPreferred: preferences.eyesOpenPreferred, bodyFocusAllowed: preferences.bodyFocusAllowed,
    breathChangeAllowed: preferences.breathChangeAllowed, hiddenMethodIds: preferences.hiddenMethodIds, history,
    safety: { cannotStaySafe: containsHighRiskLanguage(trigger) },
  }), [activationBefore, mode, duration, params.outcome, selectedId, preferences, history, trigger]);
  const recommendation = useMemo(() => recommendMethods(routingInput), [routingInput]);
  const methodId = selectedId ?? (recommendation.kind === "practice" ? recommendation.primary.id : "grounded-action");
  const method = METHOD_BY_ID.get(methodId)!;
  const methodHidden = preferences.hiddenMethodIds.includes(methodId);
  const basePractice = useMemo(() => getPracticeVariant(methodId, duration), [methodId, duration]);
  const practice = generatedPractice ?? basePractice;
  const position = practicePosition(practice?.steps ?? [], elapsedMs);
  const result = nativeFeedbackResult(activationBefore, activationAfter, endStatus === "stopped", reportedResult);

  const begin = useCallback((selected: NonNullable<typeof practice>, source: "offline" | "preset" | "stepfun") => {
    const current = latestPreferences.current;
    const finalInput = { ...routingInput, duration: selected.minutes, eyesOpenPreferred: current.eyesOpenPreferred,
      bodyFocusAllowed: current.bodyFocusAllowed, breathChangeAllowed: current.breathChangeAllowed, hiddenMethodIds: current.hiddenMethodIds };
    if (!focused.current || !ready || !current.onboardingComplete || !canStartMethod(methodId, finalInput)
      || (attempt.current && !attempt.current.ended)) return false;
    const next = beginNativeAttempt({ id: `native-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      mode, methodId, minutes: selected.minutes, plannedDurationSeconds: selected.steps.reduce((sum, step) => sum + step.seconds, 0),
      contentVersion: selected.contentVersion, activationBefore, consentAtStart: current.anonymousAnalyticsEnabled, source,
      inputMethod: trigger.trim() ? pendingResetDraft?.inputMethod ?? "typed" : "state-only", textProvided: Boolean(trigger.trim()),
    }, { now, isoNow: () => new Date().toISOString(), save: record => latestSave.current(record), emit: track,
      onStorageFailure: () => { if (focused.current) setStorageWarning(true); } });
    if (AppState.currentState !== "active") next.clock = pausePracticeClock(next.clock, now());
    attempt.current = next;
    setSelectedId(methodId); // Pin the method for this attempt while history asynchronously updates.
    setElapsedMs(0); setPaused(AppState.currentState !== "active"); setEndStatus(undefined); setStorageWarning(false);
    setActivationAfter(undefined); setReportedResult(undefined); setReuseIntent(undefined); setAction(undefined);
    setGeneratedPractice(source === "offline" ? undefined : selected); setPhase("practice");
    return true;
  }, [routingInput, ready, methodId, mode, activationBefore, trigger, pendingResetDraft]);

  const startPractice = useCallback(async (allowAI = true) => {
    if (requestInFlight.current || (attempt.current && !attempt.current.ended)) return;
    if (!ready || !preferences.onboardingComplete) return;
    if (containsHighRiskLanguage(trigger)) { setPhase("support"); return; }
    if (!basePractice || !canStartMethod(methodId, { ...routingInput, duration: basePractice.minutes })) {
      setPhase("recommend");
      Alert.alert("当前方法不符合练习偏好", "请选择其他时长或方法；不需要取消你的边界，也可以直接退出。");
      return;
    }
    if (!allowAI || methodId !== "inner-cinema" || !preferences.aiEnabled || !trigger.trim()) { begin(basePractice, "offline"); return; }
    requestInFlight.current = true;
    const sequence = ++requestSequence.current;
    const started = now(); setGenerating(true);
    track("ai_requested", { feature: "inner-cinema", consent_state: "enabled" });
    try {
      const response = await requestCinema(trigger);
      if (!focused.current || requestSequence.current !== sequence) return;
      const elapsed = now() - started;
      track("ai_completed", { feature: "inner-cinema", source: response?.source ?? "offline",
        latency_bucket: elapsed < 2000 ? "under_2s" : elapsed <= 4000 ? "2-4s" : "over_4s",
        fallback_reason: response ? (response.source === "stepfun" ? "none" : "invalid") : "network" });
      begin(response ? cinemaToPractice(response) : basePractice, response?.source ?? "offline");
    } finally {
      if (requestSequence.current === sequence) { requestInFlight.current = false; if (focused.current) setGenerating(false); }
    }
  }, [ready, preferences.onboardingComplete, preferences.aiEnabled, trigger, basePractice, methodId, routingInput, begin]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false; requestSequence.current += 1; requestInFlight.current = false;
      queueMicrotask(() => { if (!focused.current && attempt.current && !attempt.current.ended) endNativeAttempt(attempt.current, "abandoned"); });
    };
  }, []));
  useEffect(() => {
    if (!ready || !preferences.onboardingComplete || params.direct !== "1" || directHandled.current || !basePractice) return;
    const timer = setTimeout(() => { directHandled.current = true; void startPractice(false); }, 0);
    return () => clearTimeout(timer);
  }, [ready, preferences.onboardingComplete, params.direct, basePractice, startPractice]);
  useEffect(() => {
    if (phase !== "practice" || paused || !practice) return;
    const timer = setInterval(() => {
      const current = attempt.current;
      if (!current || current.ended) return;
      const next = practicePosition(practice.steps, elapsedPracticeMs(current.clock, now()));
      setElapsedMs(next.elapsedSeconds * 1000);
      if (next.complete) { endNativeAttempt(current, "completed"); setEndStatus("completed"); setPhase("check"); }
    }, 250);
    return () => clearInterval(timer);
  }, [phase, paused, practice]);
  useEffect(() => {
    if (phase === "practice" && !paused && preferences.hapticsEnabled) void Haptics.selectionAsync().catch(() => undefined);
  }, [position.stepIndex, phase, paused, preferences.hapticsEnabled]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      const current = attempt.current;
      if (state !== "active" && current && !current.ended) {
        current.clock = pausePracticeClock(current.clock, now()); setElapsedMs(current.clock.elapsedMs); setPaused(true);
      }
    });
    return () => subscription.remove();
  }, []);
  function togglePause() {
    const current = attempt.current; if (!current || current.ended) return;
    current.clock = paused ? resumePracticeClock(current.clock, now()) : pausePracticeClock(current.clock, now());
    setElapsedMs(elapsedPracticeMs(current.clock, now())); setPaused(!paused);
  }
  function stopPractice() {
    if (!attempt.current) return;
    const record = endNativeAttempt(attempt.current, "stopped");
    setElapsedMs(record.durationSeconds * 1000); setPaused(true); setEndStatus(record.status); setPhase("check");
  }
  function complete(skip = false) {
    const current = attempt.current; if (!current || !current.ended) return;
    if (!skip) saveNativeFeedback(current, { activationAfter, reportedResult, reuseIntent, groundedActionId: action,
      shareAnonymous: latestPreferences.current.anonymousAnalyticsEnabled });
    else { setActivationAfter(undefined); setReportedResult(undefined); setReuseIntent(undefined); setAction(undefined); }
    setPendingResetDraft(undefined); setPhase("done"); // Storage must never hold the exit hostage.
  }
  function setMethodId(id: MethodId) {
    requestSequence.current += 1; requestInFlight.current = false; setGenerating(false);
    setSelectedId(id); setGeneratedPractice(undefined);
  }
  function changeDuration(value: DurationMinutes) {
    requestSequence.current += 1; requestInFlight.current = false; setGenerating(false);
    setDuration(value); setGeneratedPractice(undefined);
    if (!method.durations.includes(value)) setSelectedId(undefined);
  }
  async function hideCurrentMethod() {
    if (methodHidden) return;
    try { await updatePreferences({ hiddenMethodIds: [...preferences.hiddenMethodIds, methodId] }); }
    catch { setStorageWarning(true); }
  }
  return { phase, setPhase, method, methodId, setMethodId, mode, duration, changeDuration, trigger, setTrigger,
    activationBefore, setActivationBefore, activationAfter, setActivationAfter, result, setResult: setReportedResult,
    reuseIntent, setReuseIntent, action, setAction, practice, practiceMinutes: practice?.minutes ?? duration,
    stepIndex: position.stepIndex, seconds: position.secondsLeft, elapsedSeconds: position.elapsedSeconds,
    paused, togglePause, stopPractice, startPractice, generating, complete, endStatus, storageWarning,
    methodHidden, hideCurrentMethod, recommendation,
    recommendationCopy: recommendation.kind === "practice" && recommendation.primary.id !== methodId
      ? `你选择了“${method.title}”。${method.summary}` : recommendation.explanation, setPendingResetDraft,
  };
}
