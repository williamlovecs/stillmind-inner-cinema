import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getPracticeVariant } from "@stillmind/content";
import { containsHighRiskLanguage, METHOD_BY_ID, recommendMethods, type DesiredOutcome, type DurationMinutes, type MethodId, type SessionResult, type StateMode } from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BreathingOrb } from "@/components/stillmind/BreathingOrb";
import { Chip, PrimaryButton, Screen, SecondaryButton, Surface, type } from "@/components/stillmind/ui";
import { MethodCard } from "@/components/stillmind/MethodCard";
import { useApp } from "@/state/AppProvider";
import { buildMethodHistory } from "@/lib/recommendation";
import { cinemaToPractice, requestCinema } from "@/lib/cinema";
import { track } from "@/lib/analytics";
import { resolveTimelinePosition } from "@/lib/timeline";

type Phase = "recommend" | "practice" | "check" | "action" | "done" | "support";
const ACTIONS = ["喝水，走路 3 分钟", "回到当前任务 25 分钟", "先不回复，今天稍后再决定", "写下可观察事实", "联系可信任的人"];

function parseDuration(value?: string): DurationMinutes { const n = Number(value); return n === 3 || n === 5 || n === 10 ? n : 1; }
function parseActivation(value?: string): 1 | 2 | 3 | 4 | 5 { const n = Number(value); return n >= 1 && n <= 5 ? n as 1 | 2 | 3 | 4 | 5 : 3; }

export default function ResetScreen() {
  const params = useLocalSearchParams<{ mode?: StateMode; methodId?: MethodId; duration?: string; activation?: string; outcome?: DesiredOutcome; direct?: string }>();
  const { preferences, sessions, addSession, updatePreferences } = useApp();
  const [phase, setPhase] = useState<Phase>("recommend");
  const [mode] = useState<StateMode>(params.mode ?? "looping");
  const [activationBefore, setActivationBefore] = useState(parseActivation(params.activation));
  const [duration, setDuration] = useState<DurationMinutes>(parseDuration(params.duration));
  const [trigger, setTrigger] = useState("");
  const history = useMemo(() => buildMethodHistory(sessions, preferences.favoriteMethodIds), [sessions, preferences.favoriteMethodIds]);
  const recommendation = useMemo(() => recommendMethods({
    activation: activationBefore,
    mode,
    duration,
    outcome: params.outcome ?? "pause",
    eyesOpenPreferred: preferences.eyesOpenPreferred,
    bodyFocusAllowed: preferences.bodyFocusAllowed,
    breathChangeAllowed: preferences.breathChangeAllowed,
    hiddenMethodIds: preferences.hiddenMethodIds,
    history,
  }), [activationBefore, duration, history, mode, params.outcome, preferences]);
  const recommendedId = recommendation.kind === "practice" ? recommendation.primary.id : "grounded-action";
  const [methodId, setMethodId] = useState<MethodId>(params.methodId ?? recommendedId);
  const method = METHOD_BY_ID.get(methodId)!;
  const methodHidden = preferences.hiddenMethodIds.includes(methodId);
  const basePractice = getPracticeVariant(methodId, duration);
  const practiceMinutes = basePractice?.minutes ?? duration;
  const [generatedPractice, setGeneratedPractice] = useState<typeof basePractice>();
  const [generating, setGenerating] = useState(false);
  const practice = generatedPractice ?? basePractice;
  const [stepIndex, setStepIndex] = useState(0);
  const [seconds, setSeconds] = useState(practice?.steps[0]?.seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<SessionResult>();
  const [activationAfter, setActivationAfter] = useState<1 | 2 | 3 | 4 | 5>(activationBefore);
  const [action, setAction] = useState(ACTIONS[0]);
  const startedAt = useRef(new Date().toISOString());
  const practiceStartedAtMs = useRef(0);
  const pauseStartedAtMs = useRef<number | undefined>(undefined);
  const pausedTotalMs = useRef(0);
  const completionRecorded = useRef(false);
  const directSessionTracked = useRef(false);

  useEffect(() => {
    if (phase !== "practice" || paused || !practice) return;
    const tick = () => {
      const elapsedMs = Date.now() - practiceStartedAtMs.current - pausedTotalMs.current;
      const position = resolveTimelinePosition(practice.steps, elapsedMs);
      if (position.complete) {
        if (!completionRecorded.current) {
          completionRecorded.current = true;
          track("practice_ended", { method_id: methodId, status: "completed", elapsed_bucket: "complete" });
        }
        setSeconds(0);
        setPhase("check");
        return;
      }
      if (position.stepIndex !== stepIndex) {
        setStepIndex(position.stepIndex);
        if (preferences.hapticsEnabled) Haptics.selectionAsync().catch(() => undefined);
      }
      setSeconds(position.secondsLeft);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [methodId, paused, phase, practice, preferences.hapticsEnabled, stepIndex]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" && phase === "practice" && !paused) {
        pauseStartedAtMs.current = Date.now();
        setPaused(true);
      }
    });
    return () => subscription.remove();
  }, [paused, phase]);

  useEffect(() => {
    if (params.direct !== "1" || !practice || directSessionTracked.current) return;
    directSessionTracked.current = true;
    practiceStartedAtMs.current = Date.now();
    pauseStartedAtMs.current = undefined;
    pausedTotalMs.current = 0;
    completionRecorded.current = false;
    setStepIndex(0);
    setSeconds(practice.steps[0]?.seconds ?? 0);
    setPaused(false);
    setPhase("practice");
    track("reset_started", { mode, activation_bucket: activationBefore, duration_bucket: practice.minutes, method_id: methodId });
    track("practice_started", { method_id: methodId, duration_bucket: practice.minutes, source: "offline" });
  }, [activationBefore, methodId, mode, params.direct, practice]);

  const beginPractice = (selectedPractice: NonNullable<typeof practice>, source: "offline" | "preset" | "stepfun") => {
    setStepIndex(0);
    setSeconds(selectedPractice.steps[0]?.seconds ?? 0);
    setPaused(false);
    practiceStartedAtMs.current = Date.now();
    pauseStartedAtMs.current = undefined;
    pausedTotalMs.current = 0;
    completionRecorded.current = false;
    setPhase("practice");
    track("reset_started", { mode, activation_bucket: activationBefore, duration_bucket: selectedPractice.minutes, method_id: methodId });
    track("practice_started", { method_id: methodId, duration_bucket: selectedPractice.minutes, source });
  };

  const startPractice = async () => {
    if (!basePractice) return Alert.alert("暂无这个时长", "请选择该方法已有的时长版本。 ");
    if (trigger.trim() && containsHighRiskLanguage(trigger)) {
      track("safety_boundary_shown", { reason_code: "high-risk-language" });
      setPhase("support");
      return;
    }
    if (methodId === "inner-cinema" && preferences.aiEnabled && trigger.trim()) {
      const aiStartedAt = Date.now();
      track("ai_requested", { feature: "inner-cinema", consent_state: "enabled" });
      setGenerating(true);
      const result = await requestCinema(trigger);
      setGenerating(false);
      const elapsed = Date.now() - aiStartedAt;
      const latency_bucket = elapsed < 2000 ? "under_2s" : elapsed <= 4000 ? "2-4s" : "over_4s";
      if (result) {
        track("ai_completed", { feature: "inner-cinema", source: result.source, latency_bucket, fallback_reason: "none" });
        const livePractice = cinemaToPractice(result);
        setGeneratedPractice(livePractice);
        beginPractice(livePractice, result.source);
        return;
      }
      track("ai_completed", { feature: "inner-cinema", source: "offline", latency_bucket, fallback_reason: "network" });
    }
    setGeneratedPractice(undefined);
    beginPractice(basePractice, "offline");
  };

  const changeDuration = (nextDuration: DurationMinutes) => {
    setDuration(nextDuration);
    const currentMethod = METHOD_BY_ID.get(methodId);
    if (currentMethod?.durations.includes(nextDuration)) return;
    const nextRecommendation = recommendMethods({
      activation: activationBefore,
      mode,
      duration: nextDuration,
      outcome: params.outcome ?? "pause",
      eyesOpenPreferred: preferences.eyesOpenPreferred,
      bodyFocusAllowed: preferences.bodyFocusAllowed,
      breathChangeAllowed: preferences.breathChangeAllowed,
      hiddenMethodIds: preferences.hiddenMethodIds,
      history,
    });
    if (nextRecommendation.kind === "practice") setMethodId(nextRecommendation.primary.id);
  };

  const togglePause = () => {
    const now = Date.now();
    if (paused) {
      if (pauseStartedAtMs.current) pausedTotalMs.current += now - pauseStartedAtMs.current;
      pauseStartedAtMs.current = undefined;
      setPaused(false);
      return;
    }
    pauseStartedAtMs.current = now;
    setPaused(true);
  };

  const complete = async () => {
    await addSession({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: 1,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      status: result === "stopped" ? "stopped" : "completed",
      mode,
      methodId,
      durationSeconds: practice?.steps.reduce((sum, step) => sum + step.seconds, 0) ?? duration * 60,
      activationBefore,
      activationAfter,
      result: result ?? "same",
      groundedActionId: action,
      rawTrigger: trigger.trim() || undefined,
      contentVersion: practice?.contentVersion ?? "1.0.0",
    });
    track("after_check_saved", {
      method_id: methodId,
      result: result ?? "same",
      activation_change_bucket: activationAfter < activationBefore ? "down" : activationAfter === activationBefore ? "same" : "up",
      grounded_action_id: action,
    });
    setPhase("done");
  };

  const hideCurrentMethod = async () => {
    if (methodHidden) return;
    await updatePreferences({ hiddenMethodIds: [...preferences.hiddenMethodIds, methodId] });
    track("method_preference_changed", { method_id: methodId, preference: "hidden", enabled: true });
  };

  if (phase === "support") return <SupportView onBack={() => setPhase("recommend")} />;
  if (phase === "practice" && practice) return <PracticePlayer methodTitle={method.title} practice={practice} stepIndex={stepIndex} seconds={seconds} paused={paused} onPause={togglePause} onStop={() => { track("practice_ended", { method_id: methodId, status: "stopped", elapsed_bucket: stepIndex === 0 ? "under_half" : "half_or_more" }); setResult("stopped"); setPhase("check"); }} />;
  if (phase === "check") return <CheckView methodTitle={method.title} result={result} activation={activationAfter} onResult={setResult} onActivation={setActivationAfter} onNext={() => setPhase("action")} />;
  if (phase === "action") return <ActionView action={action} onAction={setAction} onComplete={complete} methodAdjustment={result === "worse" || result === "stopped" ? { methodTitle: method.title, hidden: methodHidden, onHideMethod: hideCurrentMethod } : undefined} />;
  if (phase === "done") return <DoneView action={action} onReturn={() => router.replace("/(tabs)")} />;

  return (
    <Screen>
      <TopBar title="选择一条退出剧情的路" onClose={() => router.back()} />
      <View style={styles.routeBlock}>
        <Text style={type.label}>现在有多强烈？</Text>
        <View style={styles.row}>{([1, 2, 3, 4, 5] as const).map((value) => <Chip key={value} label={String(value)} selected={activationBefore === value} onPress={() => setActivationBefore(value)} />)}</View>
        <Text style={type.label}>你有多少时间？</Text>
        <View style={styles.row}>{([1, 3, 5, 10] as const).map((value) => <Chip key={value} label={`${value} 分钟`} selected={duration === value} onPress={() => changeDuration(value)} />)}</View>
        {methodId === "inner-cinema" ? <><TextInput value={trigger} onChangeText={setTrigger} placeholder="一句话写下刚才的触发（可选）" placeholderTextColor={colors.textFaint} multiline style={styles.input} maxLength={500} />{preferences.aiEnabled ? <Text style={type.caption}>只有点“开始”后这句话才会发送；超时会自动使用离线脚本。</Text> : <Text style={type.caption}>AI 未开启，使用本机稳定脚本。</Text>}</> : null}
      </View>
      {recommendation.kind === "support" ? (
        <Surface><Text style={type.h2}>先联系现实中的支持</Text><Text style={type.body}>{recommendation.explanation}</Text><PrimaryButton label="查看支持边界" onPress={() => setPhase("support")} /></Surface>
      ) : (
        <View style={styles.recommendBlock}>
          <Text style={type.label}>推荐这一种</Text>
          <MethodCard method={METHOD_BY_ID.get(methodId) ?? recommendation.primary} onPress={() => undefined} />
          <Text style={type.body}>{recommendation.explanation}</Text>
          {practiceMinutes !== duration ? <Text style={type.caption}>当前强度下先使用更短、可随时停止的 {practiceMinutes} 分钟版本。</Text> : null}
          <PrimaryButton label={generating ? "正在投影…" : `开始 ${practiceMinutes} 分钟`} disabled={generating} icon={<Ionicons name={generating ? "hourglass-outline" : "play"} size={18} color={colors.white} />} onPress={startPractice} />
          <Text style={type.label}>也可以换一种</Text>
          {recommendation.alternatives.filter((item) => item.id !== methodId).map((item) => <MethodCard key={item.id} method={item} onPress={() => setMethodId(item.id)} />)}
        </View>
      )}
      <Pressable onPress={() => { track("safety_boundary_shown", { reason_code: "user-request" }); setPhase("support"); }}><Text style={styles.supportLink}>如果你现在无法保证安全，点这里</Text></Pressable>
    </Screen>
  );
}

function PracticePlayer({ methodTitle, practice, stepIndex, seconds, paused, onPause, onStop }: { methodTitle: string; practice: NonNullable<ReturnType<typeof getPracticeVariant>>; stepIndex: number; seconds: number; paused: boolean; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  const phase = step.kind === "breathe" ? (Math.floor(seconds / 3) % 2 === 0 ? "吸气" : "呼气") : undefined;
  return (
    <Screen scroll={false} contentStyle={styles.player}>
      <TopBar title={methodTitle} onClose={onStop} />
      <View style={styles.progressRow}>{practice.steps.map((item, index) => <View key={item.id} style={[styles.progressSegment, index <= stepIndex && styles.progressActive]} />)}</View>
      <View style={styles.playerCenter}>
        {practice.methodId === "paced-breath" ? <BreathingOrb phase={phase} seconds={seconds} /> : <View style={styles.projection}><Text style={styles.stepCount}>{String(stepIndex + 1).padStart(2, "0")} / {String(practice.steps.length).padStart(2, "0")}</Text><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.instruction}>{step.instruction}</Text><Text style={styles.secondsSmall}>{seconds} 秒</Text></View>}
        {step.alternative ? <Text style={styles.alternative}>{step.alternative}</Text> : null}
      </View>
      <View style={styles.controls}><SecondaryButton label={paused ? "继续" : "暂停"} icon={<Ionicons name={paused ? "play" : "pause"} size={18} color={colors.text} />} onPress={onPause} style={styles.control} /><SecondaryButton label="停止" onPress={onStop} style={styles.control} /></View>
    </Screen>
  );
}

function CheckView({ methodTitle, result, activation, onResult, onActivation, onNext }: { methodTitle: string; result?: SessionResult; activation: 1 | 2 | 3 | 4 | 5; onResult: (value: SessionResult) => void; onActivation: (value: 1 | 2 | 3 | 4 | 5) => void; onNext: () => void }) {
  return <Screen><TopBar title={methodTitle} onClose={() => router.back()} /><View style={styles.centerCopy}><Text style={type.display}>现在，和刚才相比呢？</Text><Text style={type.body}>没有正确答案。“更不舒服”也会帮助 StillMind 少推荐这种方法。</Text></View><View style={styles.stack}>{([['better','多了一点选择'],['same','差不多'],['worse','更不舒服'],['stopped','我停止了']] as [SessionResult,string][]).map(([value,label]) => <Chip key={value} label={label} selected={result === value} onPress={() => onResult(value)} />)}</View><Text style={type.label}>此刻强烈程度</Text><View style={styles.row}>{([1,2,3,4,5] as const).map((value) => <Chip key={value} label={String(value)} selected={activation === value} onPress={() => onActivation(value)} />)}</View><PrimaryButton label="回到现实行动" disabled={!result} onPress={onNext} /></Screen>;
}

function ActionView({ action, onAction, onComplete, methodAdjustment }: { action: string; onAction: (value: string) => void; onComplete: () => void; methodAdjustment?: { methodTitle: string; hidden: boolean; onHideMethod: () => void } }) {
  return <Screen><TopBar title="回到行动" onClose={() => router.back()} /><View style={styles.centerCopy}><Text style={type.display}>只选下一件小事。</Text><Text style={type.body}>不是解决整件事，只是不让剧情继续替你决定。</Text></View><View style={styles.stack}>{ACTIONS.map((item) => <Chip key={item} label={item} selected={action === item} onPress={() => onAction(item)} />)}</View>{methodAdjustment ? <Surface style={styles.adjustmentCard}><Text style={type.label}>方法调整</Text><Text style={type.body}>如果“{methodAdjustment.methodTitle}”这次不适合你，可以减少它出现在推荐里的次数。你仍然可以在方法库里手动打开。</Text><SecondaryButton label={methodAdjustment.hidden ? "已减少推荐" : `减少推荐“${methodAdjustment.methodTitle}”`} disabled={methodAdjustment.hidden} onPress={methodAdjustment.onHideMethod} /></Surface> : null}<PrimaryButton label="保存并完成" onPress={onComplete} /></Screen>;
}

function DoneView({ action, onReturn }: { action: string; onReturn: () => void }) {
  return <Screen><View style={styles.done}><BreathingOrb compact /><Text style={[type.display, styles.centerText]}>电影没有被抹掉。你回到了观众席。</Text><Surface warm style={styles.actionCard}><Text style={type.label}>下一步</Text><Text style={type.h2}>{action}</Text></Surface><Text style={[type.body, styles.centerText]}>StillMind 不告诉你“你是谁”。它帮助你看见：此刻有什么正在经过。</Text><PrimaryButton label="回到此刻" onPress={onReturn} /></View></Screen>;
}

function SupportView({ onBack }: { onBack: () => void }) {
  return <Screen><TopBar title="先保证现实中的安全" onClose={onBack} /><View style={styles.centerCopy}><Text style={type.display}>这不是一个人扛住的时刻。</Text><Text style={type.body}>如果你有即时危险、医疗紧急情况，或无法保证自己的安全，请立刻联系当地紧急服务、前往急诊，或让可信任的人陪在你身边。</Text></View><Surface style={styles.supportCard}><Text style={type.h2}>StillMind 能做什么</Text><Text style={type.body}>只提供一般性的短暂停顿与定向提示，不提供诊断、治疗或危机处置。</Text></Surface><PrimaryButton label="我会联系现实中的支持" onPress={onBack} /></Screen>;
}

function TopBar({ title, onClose }: { title: string; onClose: () => void }) { return <View style={styles.topBar}><Text style={styles.topTitle}>{title}</Text><Pressable accessibilityLabel="关闭" hitSlop={12} onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></Pressable></View>; }

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 50 }, topTitle: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
  routeBlock: { gap: 12 }, row: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, input: { minHeight: 92, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, color: colors.text, backgroundColor: colors.surface, padding: 15, fontSize: 15, textAlignVertical: "top" },
  recommendBlock: { gap: 13 }, supportLink: { color: colors.textFaint, textAlign: "center", fontSize: 12, textDecorationLine: "underline" },
  player: { paddingBottom: 28 }, progressRow: { flexDirection: "row", gap: 6 }, progressSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" }, progressActive: { backgroundColor: colors.lavender },
  playerCenter: { flex: 1, justifyContent: "center", gap: spacing.md }, projection: { minHeight: 310, borderRadius: 28, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(8,12,27,0.9)", alignItems: "center", justifyContent: "center", padding: 28, gap: 18, shadowColor: colors.violet, shadowOpacity: 0.24, shadowRadius: 34 },
  stepCount: { color: colors.textFaint, fontSize: 12, letterSpacing: 2 }, stepTitle: { color: colors.lavender, fontSize: 16, fontWeight: "800", letterSpacing: 2 }, instruction: { color: colors.text, fontSize: 24, lineHeight: 36, fontWeight: "700", textAlign: "center" }, secondsSmall: { color: colors.textFaint, fontSize: 13 }, alternative: { color: colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  controls: { flexDirection: "row", gap: 10 }, control: { flex: 1 }, centerCopy: { gap: 12, marginTop: spacing.xl }, stack: { gap: 10 }, adjustmentCard: { gap: 12 }, done: { flex: 1, justifyContent: "center", gap: 24 }, centerText: { textAlign: "center" }, actionCard: { gap: 10 }, supportCard: { gap: 10 },
});
