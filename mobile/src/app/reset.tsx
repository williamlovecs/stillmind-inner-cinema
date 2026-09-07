import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getPracticeVariant, type PracticeVariant } from "@stillmind/content";
import {
  containsHighRiskLanguage, METHOD_BY_ID, recommendMethods, canStartMethod, isStateMode,
  reportedActivation, ratingText, changeText, endingCopy, practicePosition,
  pausePracticeClock, resumePracticeClock, elapsedPracticeMs,
  type ActivationLevel, type DesiredOutcome, type DurationMinutes, type MethodId,
  type PracticeSession, type RoutingInput, type StateMode,
} from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BreathingOrb } from "@/components/stillmind/BreathingOrb";
import { MethodPracticeExperience } from "@/components/stillmind/MethodPracticeExperience";
import { Chip, PrimaryButton, Screen, SecondaryButton, Surface, type } from "@/components/stillmind/ui";
import { MethodCard } from "@/components/stillmind/MethodCard";
import { useApp } from "@/state/AppProvider";
import { buildMethodHistory } from "@/lib/recommendation";
import { cinemaToPractice, requestCinema } from "@/lib/cinema";
import { track } from "@/lib/analytics";
import {
  beginNativeAttempt, endNativeAttempt, saveNativeFeedback, nativeFeedbackResult,
  nativeReportedRating, createRequestLifetime, type NativeAttempt,
} from "@/lib/practice-session";

type Phase = "preparing" | "recommend" | "practice" | "check" | "action" | "done" | "support";
type ReuseIntent = "yes" | "unsure" | "no";
type Feeling = "better" | "same" | "worse";
const ACTIONS = ["喝水，走路 3 分钟", "回到当前任务 25 分钟", "先不回复，今天稍后再决定", "写下可观察事实", "联系可信任的人"];
function parseDuration(value?: string): DurationMinutes { return value === "3" ? 3 : value === "5" ? 5 : value === "10" ? 10 : 1; }
function parseOutcome(value?: string): DesiredOutcome { return (["pause", "settle", "distance", "release", "choose", "awareness"] as const).find(item => item === value) ?? "pause"; }

export default function ResetScreen() {
  const params = useLocalSearchParams<{ mode?: string; methodId?: string; duration?: string; activation?: string; ratingProvided?: string; outcome?: string; direct?: string }>();
  const { ready, preferences, sessions, pendingResetDraft, setPendingResetDraft, addSession, updatePreferences } = useApp();
  const [phase, setPhase] = useState<Phase>(params.direct === "1" ? "preparing" : "recommend");
  const mode: StateMode = isStateMode(params.mode) ? params.mode : "looping";
  const [activationBefore, setActivationBefore] = useState<ActivationLevel | undefined>(() => nativeReportedRating(params.activation, params.ratingProvided));
  const [duration, setDuration] = useState<DurationMinutes>(() => parseDuration(params.duration));
  const [trigger, setTrigger] = useState(pendingResetDraft?.trigger ?? "");
  const [selectedMethodId, setSelectedMethodId] = useState<MethodId | undefined>(() => METHOD_BY_ID.get(params.methodId as MethodId)?.id);
  const [activePractice, setActivePractice] = useState<PracticeVariant>();
  const [generating, setGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [activationAfter, setActivationAfter] = useState<ActivationLevel>();
  const [feeling, setFeeling] = useState<Feeling>();
  const [reuseIntent, setReuseIntent] = useState<ReuseIntent>();
  const [action, setAction] = useState<string>();
  const [finalRecord, setFinalRecord] = useState<PracticeSession>();
  const [storageWarning, setStorageWarning] = useState(false);
  const [startNotice, setStartNotice] = useState("");
  const [requestLifetime] = useState(createRequestLifetime);
  const attemptRef = useRef<NativeAttempt | undefined>(undefined);
  const focusedRef = useRef(false);
  const directAttempted = useRef(false);
  const lastStep = useRef(0);
  const history = useMemo(() => buildMethodHistory(sessions, preferences.favoriteMethodIds), [sessions, preferences.favoriteMethodIds]);
  // Older deep links can contain recommendation defaults. They remain routing hints, not self-reports.
  const routingActivation = activationBefore ?? reportedActivation(Number(params.activation)) ?? 3;
  const routingInput = useMemo<RoutingInput>(() => ({
    activation: routingActivation, mode, duration, outcome: parseOutcome(params.outcome),
    scope: selectedMethodId ? "library" : "reset",
    eyesOpenPreferred: preferences.eyesOpenPreferred, bodyFocusAllowed: preferences.bodyFocusAllowed,
    breathChangeAllowed: preferences.breathChangeAllowed, hiddenMethodIds: preferences.hiddenMethodIds,
    history, safety: { cannotStaySafe: containsHighRiskLanguage(trigger) },
  }), [routingActivation, mode, duration, params.outcome, selectedMethodId, preferences, history, trigger]);
  const recommendation = useMemo(() => recommendMethods(routingInput), [routingInput]);
  const recommendedId = recommendation.kind === "practice" ? recommendation.primary.id : "grounded-action";
  const methodId = activePractice?.methodId ?? selectedMethodId ?? recommendedId;
  const method = METHOD_BY_ID.get(methodId)!;
  const basePractice = getPracticeVariant(methodId, duration);
  const practice = activePractice ?? basePractice;
  const methodHidden = preferences.hiddenMethodIds.includes(methodId);
  const position = practicePosition(practice?.steps ?? [], elapsedMs);
  const stopped = finalRecord?.status === "stopped";
  const result = nativeFeedbackResult(activationBefore, activationAfter, feeling, stopped);

  function watchPersistence(attempt: NativeAttempt) {
    void attempt.writes.then(() => { if (focusedRef.current) setStorageWarning(attempt.saveFailed); });
  }
  const finishAttempt = useCallback((status: PracticeSession["status"]) => {
    const attempt = attemptRef.current;
    if (!attempt) return;
    const record = endNativeAttempt(attempt, status);
    setFinalRecord(record); setElapsedMs(record.durationSeconds * 1000); setPaused(true);
    void attempt.writes.then(() => { if (focusedRef.current) setStorageWarning(attempt.saveFailed); });
    setPhase(status === "abandoned" ? "done" : "check");
  }, []);

  // The same gate runs for recommendation, manual selection, direct links, and after optional AI.
  const beginPractice = useCallback((candidate: PracticeVariant, source: "offline" | "preset" | "stepfun") => {
    if (!ready || !focusedRef.current || !preferences.onboardingComplete) return;
    if (attemptRef.current && !attemptRef.current.ended) return;
    if (!canStartMethod(candidate.methodId, { ...routingInput, duration: candidate.minutes })) {
      setStartNotice("这个方法不符合当前强度或练习偏好。可以返回推荐，或直接结束。");
      setPhase("recommend"); return;
    }
    const id = `native-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const attempt = beginNativeAttempt({
      id, mode, methodId: candidate.methodId, minutes: candidate.minutes,
      plannedDurationSeconds: candidate.steps.reduce((sum, step) => sum + step.seconds, 0),
      contentVersion: candidate.contentVersion, activationBefore,
      inputMethod: trigger.trim() ? pendingResetDraft?.inputMethod ?? "typed" : "state-only",
      textProvided: Boolean(trigger.trim()), consentAtStart: preferences.anonymousAnalyticsEnabled, source,
    }, { now: () => performance.now(), isoNow: () => new Date().toISOString(), save: addSession, emit: track });
    if (AppState.currentState !== "active") attempt.clock = pausePracticeClock(attempt.clock, performance.now());
    attemptRef.current = attempt; lastStep.current = 0;
    setActivePractice(candidate); setElapsedMs(0); setPaused(AppState.currentState !== "active");
    setActivationAfter(undefined); setFeeling(undefined); setReuseIntent(undefined); setAction(undefined);
    setFinalRecord(undefined); setStorageWarning(false); setStartNotice(""); setPhase("practice");
    void attempt.writes.then(() => { if (focusedRef.current) setStorageWarning(attempt.saveFailed); });
  }, [ready, preferences.onboardingComplete, preferences.anonymousAnalyticsEnabled, routingInput, mode, activationBefore, pendingResetDraft?.inputMethod, trigger, addSession]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    return () => {
      focusedRef.current = false;
      requestLifetime.cancel();
      // StrictMode's immediate cleanup/setup must not manufacture an abandoned attempt.
      queueMicrotask(() => {
        if (focusedRef.current) return;
        const attempt = attemptRef.current;
        if (attempt && !attempt.ended) endNativeAttempt(attempt, "abandoned");
      });
    };
  }, [requestLifetime]));

  useEffect(() => {
    if (!ready || !preferences.onboardingComplete || params.direct !== "1" || directAttempted.current) return;
    const timer = setTimeout(() => {
      directAttempted.current = true;
      if (params.methodId && !METHOD_BY_ID.has(params.methodId as MethodId)) {
        setStartNotice("没有找到这个方法，请重新选择。"); setPhase("recommend"); return;
      }
      if (containsHighRiskLanguage(trigger)) { setPhase("support"); return; }
      if (recommendation.kind !== "practice" || !basePractice) {
        setStartNotice(recommendation.explanation); setPhase("recommend"); return;
      }
      // Direct-entry remains offline. Merely enabling optional AI never uploads this draft.
      beginPractice(basePractice, "offline");
    }, 0);
    return () => clearTimeout(timer);
  }, [ready, preferences.onboardingComplete, params.direct, params.methodId, trigger, recommendation, basePractice, beginPractice]);

  useEffect(() => {
    if (phase !== "practice" || paused || !practice) return;
    const timer = setInterval(() => {
      const attempt = attemptRef.current;
      if (!attempt || attempt.ended) return;
      const next = practicePosition(practice.steps, elapsedPracticeMs(attempt.clock, performance.now()));
      setElapsedMs(next.elapsedSeconds * 1000);
      if (next.stepIndex !== lastStep.current) {
        lastStep.current = next.stepIndex;
        if (preferences.hapticsEnabled) void Haptics.selectionAsync().catch(() => undefined);
      }
      if (next.complete) finishAttempt("completed");
    }, 250);
    return () => clearInterval(timer);
  }, [phase, paused, practice, preferences.hapticsEnabled, finishAttempt]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      if (nextState === "active") return; // Returning never auto-resumes.
      requestLifetime.cancel();
      setGenerating(false);
      const attempt = attemptRef.current;
      if (attempt && !attempt.ended) {
        attempt.clock = pausePracticeClock(attempt.clock, performance.now());
        setElapsedMs(attempt.clock.elapsedMs); setPaused(true);
      }
    });
    return () => subscription.remove();
  }, [requestLifetime]);

  async function startPractice() {
    if (!ready || !preferences.onboardingComplete || generating) return;
    if (containsHighRiskLanguage(trigger)) { setPhase("support"); return; }
    if (!basePractice || !canStartMethod(methodId, { ...routingInput, duration: basePractice.minutes })) {
      setStartNotice("当前方法不符合所选时长、强度或偏好。可以换一种，也可以结束。"); return;
    }
    if (methodId === "inner-cinema" && preferences.aiEnabled && trigger.trim()) {
      const request = requestLifetime.begin();
      const aiStarted = performance.now(); setGenerating(true);
      track("ai_requested", { feature: "inner-cinema", consent_state: "enabled" });
      const generated = await requestCinema(trigger, 10_000, request.signal);
      if (!request.isCurrent() || !focusedRef.current) return;
      setGenerating(false);
      const elapsed = performance.now() - aiStarted;
      track("ai_completed", { feature: "inner-cinema", source: generated?.source ?? "offline",
        latency_bucket: elapsed < 2000 ? "under_2s" : elapsed <= 4000 ? "2-4s" : "over_4s",
        fallback_reason: generated ? "none" : "network" });
      if (generated) { beginPractice(cinemaToPractice(generated, basePractice.minutes), generated.source); return; }
    }
    beginPractice(basePractice, "offline");
  }
  function changeInput(update: () => void) {
    requestLifetime.cancel(); setGenerating(false); setStartNotice(""); update();
  }
  function togglePause() {
    const attempt = attemptRef.current;
    if (!attempt || attempt.ended) return;
    attempt.clock = paused ? resumePracticeClock(attempt.clock, performance.now()) : pausePracticeClock(attempt.clock, performance.now());
    setElapsedMs(elapsedPracticeMs(attempt.clock, performance.now())); setPaused(!paused);
  }
  function complete(skip = false, omitAction = false) {
    const attempt = attemptRef.current;
    if (!attempt || !attempt.ended) return;
    if (!skip) saveNativeFeedback(attempt, { activationAfter, reportedResult: feeling, reuseIntent, groundedActionId: omitAction ? undefined : action,
      shareAnonymous: preferences.anonymousAnalyticsEnabled });
    setFinalRecord(attempt.record); setPendingResetDraft(undefined); setPhase("done");
    watchPersistence(attempt); // Storage must never hold the exit screen hostage.
  }
  function close() {
    requestLifetime.cancel();
    const attempt = attemptRef.current;
    if (attempt && !attempt.ended) endNativeAttempt(attempt, "abandoned");
    setPendingResetDraft(undefined); router.replace("/(tabs)");
  }
  async function hideCurrentMethod() {
    if (methodHidden) return;
    try { await updatePreferences({ hiddenMethodIds: [...preferences.hiddenMethodIds, methodId] }); }
    catch { Alert.alert("设置暂未保存", "你仍可以结束练习；设置将在本次使用中生效。"); }
  }

  if (phase === "preparing") return <PreparingView onClose={close} />;
  if (phase === "support") return <SupportView onBack={close} />;
  if (phase === "practice" && practice) return <PracticePlayer methodTitle={method.title} practice={practice} stepIndex={position.stepIndex} seconds={position.secondsLeft} elapsedSeconds={position.elapsedSeconds} paused={paused} trigger={trigger} onPause={togglePause} onStop={() => finishAttempt("stopped")} />;
  if (phase === "check") return <CheckView methodTitle={method.title} stopped={stopped} feeling={feeling} activationBefore={activationBefore} activation={activationAfter} reuseIntent={reuseIntent} onFeeling={setFeeling} onActivation={setActivationAfter} onReuseIntent={setReuseIntent} onSkip={() => complete(true)} onNext={() => result === "worse" || stopped ? complete() : setPhase("action")} />;
  if (phase === "action") return <ActionView action={action} onAction={setAction} onComplete={() => complete()} onSkip={() => complete(false, true)} />;
  if (phase === "done") return <DoneView record={finalRecord} storageWarning={storageWarning} historyEnabled={preferences.historyEnabled} onReturn={close} methodAdjustment={finalRecord?.result === "worse" || finalRecord?.status === "stopped" ? { methodTitle: method.title, hidden: methodHidden, onHideMethod: hideCurrentMethod } : undefined} />;

  return <Screen>
    <TopBar title="选择一条练习路径" onClose={close} />
    <View style={styles.routeBlock}>
      <Text style={type.label}>现在有多强烈？（可选） {ratingText(activationBefore)}</Text>
      <View style={styles.row}>{([1, 2, 3, 4, 5] as const).map(value => <Chip key={value} label={String(value)} selected={activationBefore === value} onPress={() => changeInput(() => setActivationBefore(activationBefore === value ? undefined : value))} />)}</View>
      <Text style={type.label}>你有多少时间？</Text>
      <View style={styles.row}>{([1, 3, 5, 10] as const).map(value => <Chip key={value} label={`${value} 分钟`} selected={duration === value} onPress={() => changeInput(() => { setDuration(value); setSelectedMethodId(undefined); })} />)}</View>
      {methodId === "inner-cinema" ? <><TextInput value={trigger} onChangeText={text => changeInput(() => setTrigger(text))} placeholder="一句话写下刚才的触发（可选）" placeholderTextColor={colors.textFaint} multiline style={styles.input} maxLength={500} /><Text style={type.caption}>{preferences.aiEnabled ? "点开始才会发送这句话进行可选 AI 生成；取消后不会自动开始。" : "AI 未开启，使用本机离线脚本。"}</Text></> : null}
    </View>
    {startNotice ? <Surface><Text accessibilityRole="alert" style={type.body}>{startNotice}</Text><SecondaryButton label="返回推荐" onPress={() => changeInput(() => setSelectedMethodId(undefined))} /></Surface> : null}
    {recommendation.kind === "support" ? <Surface><Text style={type.body}>{recommendation.explanation}</Text><SecondaryButton label="结束并返回" onPress={close} /></Surface> : <View style={styles.recommendBlock}>
      <Text style={type.label}>{selectedMethodId ? "你选择的方法" : "推荐这一种"}</Text><MethodCard method={method} />
      <Text style={type.body}>{selectedMethodId ? method.summary : recommendation.explanation}</Text>
      <PrimaryButton label={generating ? "正在投影…" : `开始 ${basePractice?.minutes ?? duration} 分钟`} disabled={generating || !ready || !preferences.onboardingComplete} onPress={startPractice} />
      {generating ? <SecondaryButton label="取消生成" onPress={() => changeInput(() => undefined)} /> : null}
      <Text style={type.label}>也可以换一种</Text>
      {[recommendation.primary, ...recommendation.alternatives].filter(item => item.id !== methodId).map(item => <MethodCard key={item.id} method={item} onPress={() => changeInput(() => setSelectedMethodId(item.id))} />)}
    </View>}
    <Pressable onPress={() => { requestLifetime.cancel(); setGenerating(false); setPhase("support"); }}><Text style={styles.supportLink}>如果你现在无法保证安全，点这里</Text></Pressable>
  </Screen>;
}

function PracticePlayer({ methodTitle, practice, stepIndex, seconds, elapsedSeconds, paused, trigger, onPause, onStop }: { methodTitle: string; practice: PracticeVariant; stepIndex: number; seconds: number; elapsedSeconds: number; paused: boolean; trigger: string; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  const { height } = useWindowDimensions();
  return <Screen scroll={height < 760} contentStyle={styles.player}>
    <TopBar title={methodTitle} meta={`${seconds} 秒${paused ? " · 已暂停" : ""}`} onClose={onStop} />
    <View style={styles.progressRow}>{practice.steps.map((item, index) => <View key={item.id} style={[styles.progressSegment, index <= stepIndex && styles.progressActive]} />)}</View>
    <View style={styles.playerCenter}><MethodPracticeExperience methodId={practice.methodId} title={step.title} instruction={step.instruction} stepIndex={stepIndex} stepCount={practice.steps.length} seconds={seconds} elapsedSeconds={elapsedSeconds} paused={paused} trigger={trigger} /><Text style={styles.alternative}>{step.alternative ?? "不舒服就停止，不需要完成。"}</Text></View>
    <View style={styles.controls}><SecondaryButton label={paused ? "继续" : "暂停"} icon={<Ionicons name={paused ? "play" : "pause"} size={18} color={colors.text} />} onPress={onPause} style={styles.control} /><SecondaryButton label="停止" onPress={onStop} style={styles.control} /></View>
  </Screen>;
}
function CheckView({ methodTitle, stopped, feeling, activationBefore, activation, reuseIntent, onFeeling, onActivation, onReuseIntent, onNext, onSkip }: { methodTitle: string; stopped: boolean; feeling?: Feeling; activationBefore?: ActivationLevel; activation?: ActivationLevel; reuseIntent?: ReuseIntent; onFeeling: (value: Feeling | undefined) => void; onActivation: (value: ActivationLevel | undefined) => void; onReuseIntent: (value: ReuseIntent | undefined) => void; onNext: () => void; onSkip: () => void }) {
  return <Screen><TopBar title={methodTitle} onClose={onSkip} /><View style={styles.centerCopy}><Text style={type.display}>{stopped ? "练习已停止。" : "现在感觉怎样？"}</Text><Text style={type.body}>练习前：{ratingText(activationBefore)}。以下都可以不填。</Text></View>
    <SecondaryButton label="跳过反馈，结束" onPress={onSkip} />
    <Text style={type.label}>此刻被带走程度</Text><View style={styles.row}>{([1,2,3,4,5] as const).map(value => <Chip key={value} label={String(value)} selected={activation === value} onPress={() => onActivation(activation === value ? undefined : value)} />)}</View>
    <Surface style={styles.deltaCard}><Text style={type.bodyStrong}>{changeText(activationBefore, activation)}</Text><Text style={type.caption}>按实际感受记录；没有变化或更不舒服也可以。</Text></Surface>
    <Text style={type.label}>这次感觉（可选）</Text><View style={styles.stack}>{([["better","有帮助"],["same","差不多"],["worse","更不舒服"]] as [Feeling,string][]).map(([value,label]) => <Chip key={value} label={label} selected={feeling === value} onPress={() => onFeeling(feeling === value ? undefined : value)} />)}</View>
    <Text style={type.label}>下次类似场景还会用吗？（可选）</Text><View style={styles.row}>{([["yes","会"],["unsure","不确定"],["no","不会"]] as [ReuseIntent,string][]).map(([value,label]) => <Chip key={value} label={label} selected={reuseIntent === value} onPress={() => onReuseIntent(reuseIntent === value ? undefined : value)} />)}</View>
    <PrimaryButton label="保存本次反馈" onPress={onNext} />
  </Screen>;
}
function ActionView({ action, onAction, onComplete, onSkip }: { action?: string; onAction: (value: string | undefined) => void; onComplete: () => void; onSkip: () => void }) {
  return <Screen><TopBar title="可选的下一步" onClose={onComplete} /><View style={styles.centerCopy}><Text style={type.display}>选一件小事，也可以不选。</Text><Text style={type.body}>只记录你的选择，不代表你已经完成。</Text></View><View style={styles.stack}>{ACTIONS.map(item => <Chip key={item} label={item} selected={action === item} onPress={() => onAction(action === item ? undefined : item)} />)}</View><PrimaryButton label="结束练习" onPress={onComplete} /><SecondaryButton label="不选行动，结束" onPress={onSkip} /></Screen>;
}
function DoneView({ record, storageWarning, historyEnabled, onReturn, methodAdjustment }: { record?: PracticeSession; storageWarning: boolean; historyEnabled: boolean; onReturn: () => void; methodAdjustment?: { methodTitle: string; hidden: boolean; onHideMethod: () => void } }) {
  const ending = endingCopy(record?.result, record?.status);
  return <Screen><View style={styles.done}><BreathingOrb compact paused /><Text style={[type.display, styles.centerText]}>{ending.title}</Text><Text style={type.body}>{ending.body}</Text>
    {storageWarning ? <Text accessibilityRole="alert" style={type.body}>本次记录未能完整保存。你仍可以直接离开。</Text> : !historyEnabled ? <Text style={type.caption}>本机历史已关闭，本次未保存到历史。</Text> : null}
    <Surface style={styles.deltaCard}><Text style={type.label}>你填写的分数</Text><Text style={type.h2}>{ratingText(record?.activationBefore)} → {ratingText(record?.activationAfter)}</Text><Text style={type.caption}>{changeText(record?.activationBefore, record?.activationAfter)}</Text></Surface>
    {record?.groundedActionId ? <Surface warm style={styles.actionCard}><Text style={type.label}>你选择的下一步（未记录完成）</Text><Text style={type.h2}>{record.groundedActionId}</Text></Surface> : null}
    <PrimaryButton label="结束并返回" onPress={onReturn} />
    {methodAdjustment ? <Surface style={styles.adjustmentCard}><Text style={type.body}>这次不合适，可以将“{methodAdjustment.methodTitle}”从推荐中隐藏。</Text><SecondaryButton label={methodAdjustment.hidden ? "已隐藏推荐" : "隐藏这个方法"} disabled={methodAdjustment.hidden} onPress={methodAdjustment.onHideMethod} /></Surface> : null}
  </View></Screen>;
}
function PreparingView({ onClose }: { onClose: () => void }) { return <Screen scroll={false} contentStyle={styles.preparing}><BreathingOrb compact paused /><Text style={type.h2}>正在准备练习…</Text><SecondaryButton label="结束并返回" onPress={onClose} /></Screen>; }
function SupportView({ onBack }: { onBack: () => void }) { return <Screen><TopBar title="先保证现实中的安全" onClose={onBack} /><View style={styles.centerCopy}><Text style={type.display}>先联系现实中的支持。</Text><Text style={type.body}>如果你有即时危险、医疗紧急情况，或无法保证自己的安全，请联系当地紧急服务、前往急诊，或让可信任的人陪在你身边。</Text></View><Surface style={styles.supportCard}><Text style={type.body}>StillMind 只提供一般性的短暂停顿与定向提示，不提供诊断、治疗或危机处置。</Text></Surface><PrimaryButton label="结束并返回" onPress={onBack} /></Screen>; }
function TopBar({ title, meta, onClose }: { title: string; meta?: string; onClose: () => void }) {
  return <View style={styles.topBar}><Text style={styles.topTitle}>{title}</Text><View style={styles.topActions}>{meta ? <Text testID="native-session-timer" style={styles.topMeta}>{meta}</Text> : null}<Pressable accessibilityLabel="关闭" hitSlop={12} onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></Pressable></View></View>;
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 50 }, topTitle: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 12 }, topMeta: { color: colors.lavender, fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] },
  routeBlock: { gap: 12 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, input: { minHeight: 92, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, color: colors.text, backgroundColor: colors.surface, padding: 15, fontSize: 15, textAlignVertical: "top" },
  recommendBlock: { gap: 13 }, supportLink: { color: colors.textFaint, textAlign: "center", fontSize: 12, textDecorationLine: "underline" },
  player: { paddingBottom: 28 }, progressRow: { flexDirection: "row", gap: 6 }, progressSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" }, progressActive: { backgroundColor: colors.lavender },
  playerCenter: { flex: 1, justifyContent: "center", gap: spacing.md }, alternative: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  controls: { flexDirection: "row", gap: 10 }, control: { flex: 1 }, centerCopy: { gap: 12, marginTop: spacing.xl }, stack: { gap: 10 }, adjustmentCard: { gap: 12 }, done: { flex: 1, justifyContent: "center", gap: 24 }, centerText: { textAlign: "center" }, actionCard: { gap: 10 }, supportCard: { gap: 10 },
  deltaCard: { gap: 7 }, preparing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, paddingBottom: 20 },
});
