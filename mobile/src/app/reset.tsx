import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPracticeVariant } from "@stillmind/content";
import { changeText, endingCopy, METHOD_BY_ID, ratingText, type ActivationLevel, type PracticeSession, type SessionResult } from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BreathingOrb } from "@/components/stillmind/BreathingOrb";
import { MethodPracticeExperience } from "@/components/stillmind/MethodPracticeExperience";
import { Chip, PrimaryButton, Screen, SecondaryButton, Surface, type } from "@/components/stillmind/ui";
import { MethodCard } from "@/components/stillmind/MethodCard";
import { useApp } from "@/state/AppProvider";
import { useResetSession } from "@/hooks/useResetSession";
import { track } from "@/lib/analytics";

type ReuseIntent = "yes" | "unsure" | "no";
const ACTIONS = ["喝水，走路 3 分钟", "回到当前任务 25 分钟", "先不回复，今天稍后再决定", "写下可观察事实", "联系可信任的人"];

export default function ResetScreen() {
  const { preferences } = useApp();
  const { phase, setPhase, method, methodId, setMethodId, duration, changeDuration, trigger, setTrigger,
    activationBefore, setActivationBefore, activationAfter, setActivationAfter, result, setResult,
    reuseIntent, setReuseIntent, action, setAction, practice, practiceMinutes, stepIndex, seconds, elapsedSeconds,
    paused, togglePause, stopPractice, startPractice, generating, complete, endStatus, storageWarning,
    methodHidden, hideCurrentMethod, recommendation, recommendationCopy, setPendingResetDraft } = useResetSession();
  if (phase === "preparing") return <PreparingView />;
  if (phase === "support") return <SupportView onBack={() => { setPendingResetDraft(undefined); setPhase("recommend"); }} />;
  if (phase === "practice" && practice) return <PracticePlayer methodTitle={method.title} practice={practice} stepIndex={stepIndex} seconds={seconds} elapsedSeconds={elapsedSeconds} paused={paused} trigger={trigger} onPause={togglePause} onStop={stopPractice} />;
  if (phase === "check") return <CheckView methodTitle={method.title} result={result} stopped={endStatus === "stopped"} activationBefore={activationBefore} activation={activationAfter} reuseIntent={reuseIntent} onResult={setResult} onActivation={setActivationAfter} onReuseIntent={setReuseIntent} onSkip={() => complete(true)} onNext={() => result === "worse" || endStatus === "stopped" ? complete() : setPhase("action")} />;
  if (phase === "action") return <ActionView action={action} onAction={setAction} onComplete={() => complete()} methodAdjustment={result === "worse" || result === "stopped" ? { methodTitle: method.title, hidden: methodHidden, onHideMethod: hideCurrentMethod } : undefined} />;
  if (phase === "done") return <DoneView action={action} result={result} status={endStatus} storageWarning={storageWarning} activationBefore={activationBefore} activationAfter={activationAfter} onReturn={() => router.replace("/(tabs)")} />;

  return (
    <Screen>
      <TopBar title="选择一条退出剧情的路" onClose={() => router.back()} />
      <View style={styles.routeBlock}>
        <Text style={type.label}>现在有多强烈？（可不填）</Text>
        <View style={styles.row}>{([1, 2, 3, 4, 5] as const).map((value) => <Chip key={value} label={String(value)} selected={activationBefore === value} onPress={() => setActivationBefore(activationBefore === value ? undefined : value)} />)}</View>
        <Text style={type.label}>你有多少时间？</Text>
        <View style={styles.row}>{([1, 3, 5, 10] as const).map((value) => <Chip key={value} label={`${value} 分钟`} selected={duration === value} onPress={() => changeDuration(value)} />)}</View>
        {methodId === "inner-cinema" ? <><TextInput value={trigger} onChangeText={setTrigger} placeholder="一句话写下刚才的触发（可选）" placeholderTextColor={colors.textFaint} multiline style={styles.input} maxLength={500} />{preferences.aiEnabled ? <Text style={type.caption}>只有点“开始”后这句话才会发送；超时会自动使用离线脚本。</Text> : <Text style={type.caption}>AI 未开启，使用本机稳定脚本。</Text>}</> : null}
      </View>
      {recommendation.kind === "support" ? (
        <Surface><Text style={type.h2}>当前没有匹配的练习</Text><Text style={type.body}>{recommendation.explanation}</Text><PrimaryButton label="查看支持边界" onPress={() => setPhase("support")} /></Surface>
      ) : (
        <View style={styles.recommendBlock}>
          <Text style={type.label}>推荐这一种</Text>
          <MethodCard method={METHOD_BY_ID.get(methodId) ?? recommendation.primary} />
          <Text style={type.body}>{recommendationCopy}</Text>
          {practiceMinutes !== duration ? <Text style={type.caption}>当前选择对应 {practiceMinutes} 分钟版本。</Text> : null}
          <PrimaryButton label={generating ? "正在投影…" : `开始 ${practiceMinutes} 分钟`} disabled={generating} icon={<Ionicons name={generating ? "hourglass-outline" : "play"} size={18} color={colors.white} />} onPress={() => { void startPractice(); }} />
          <Text style={type.label}>也可以换一种</Text>
          {recommendation.alternatives.filter((item) => item.id !== methodId).map((item) => <MethodCard key={item.id} method={item} onPress={() => setMethodId(item.id)} />)}
        </View>
      )}
      <Pressable onPress={() => { track("safety_boundary_shown", { reason_code: "user-request" }); setPhase("support"); }}><Text style={styles.supportLink}>如果你现在无法保证安全，点这里</Text></Pressable>
    </Screen>
  );
}

function PracticePlayer({ methodTitle, practice, stepIndex, seconds, elapsedSeconds, paused, trigger, onPause, onStop }: { methodTitle: string; practice: NonNullable<ReturnType<typeof getPracticeVariant>>; stepIndex: number; seconds: number; elapsedSeconds: number; paused: boolean; trigger: string; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  const { height } = useWindowDimensions();
  const needsScroll = height < 760;
  return (
    <Screen scroll={needsScroll} contentStyle={styles.player}>
      <TopBar title={methodTitle} meta={`${seconds} 秒`} onClose={onStop} />
      <View style={styles.progressRow}>{practice.steps.map((item, index) => <View key={item.id} style={[styles.progressSegment, index <= stepIndex && styles.progressActive]} />)}</View>
      <View style={styles.playerCenter}>
        <MethodPracticeExperience methodId={practice.methodId} title={step.title} instruction={step.instruction} stepIndex={stepIndex} stepCount={practice.steps.length} seconds={seconds} elapsedSeconds={elapsedSeconds} paused={paused} trigger={trigger} />
        {step.alternative ? <Text style={styles.alternative}>{step.alternative}</Text> : null}
      </View>
      <View style={styles.controls}><SecondaryButton label={paused ? "继续" : "暂停"} icon={<Ionicons name={paused ? "play" : "pause"} size={18} color={colors.text} />} onPress={onPause} style={styles.control} /><SecondaryButton label="停止" onPress={onStop} style={styles.control} /></View>
    </Screen>
  );
}

function CheckView({ methodTitle, result, stopped, activationBefore, activation, reuseIntent, onResult, onActivation, onReuseIntent, onNext, onSkip }: {
  methodTitle: string; result?: SessionResult; stopped: boolean; activationBefore?: ActivationLevel; activation?: ActivationLevel;
  reuseIntent?: ReuseIntent; onResult: (value: Exclude<SessionResult, "stopped">) => void;
  onActivation: (value: ActivationLevel | undefined) => void; onReuseIntent: (value: ReuseIntent) => void;
  onNext: () => void; onSkip: () => void;
}) {
  return <Screen><TopBar title={methodTitle} onClose={onSkip} />
    <View style={styles.centerCopy}><Text style={type.display}>{stopped ? "练习已停止。" : "现在感觉怎样？"}</Text>
      <Text style={type.body}>练习前：{ratingText(activationBefore)}。以下都可以不填。</Text></View>
    <SecondaryButton label="跳过反馈，结束" onPress={onSkip} />
    <Text style={type.label}>此刻被带走程度（可选）</Text>
    <View style={styles.row}>{([1,2,3,4,5] as const).map(value => <Chip key={value} label={String(value)} selected={activation === value} onPress={() => onActivation(activation === value ? undefined : value)} />)}</View>
    <Surface style={styles.deltaCard}><Text style={type.bodyStrong}>{changeText(activationBefore, activation)}</Text><Text style={type.caption}>只记录实际感受，不是考试。</Text></Surface>
    {!stopped ? <><Text style={type.label}>这次感觉（可选）</Text><View style={styles.stack}>{([["better","多了一点选择"],["same","差不多"],["worse","更不舒服"]] as [Exclude<SessionResult,"stopped">,string][]).map(([value,label]) => <Chip key={value} label={label} selected={result === value} onPress={() => onResult(value)} />)}</View></> : null}
    <Text style={type.label}>下次类似场景还会用吗？（可选）</Text><View style={styles.row}>{([["yes","会"],["unsure","不确定"],["no","不会"]] as [ReuseIntent,string][]).map(([value,label]) => <Chip key={value} label={label} selected={reuseIntent === value} onPress={() => onReuseIntent(value)} />)}</View>
    <PrimaryButton label={stopped || result === "worse" ? "保存反馈并结束" : "下一步（可选行动）"} onPress={onNext} />
  </Screen>;
}

function ActionView({ action, onAction, onComplete, methodAdjustment }: { action?: string; onAction: (value: string) => void; onComplete: () => void; methodAdjustment?: { methodTitle: string; hidden: boolean; onHideMethod: () => void } }) {
  return <Screen><TopBar title="回到行动" onClose={onComplete} /><View style={styles.centerCopy}><Text style={type.display}>可以选下一件小事。</Text><Text style={type.body}>没有合适的就不选，直接结束。</Text></View><View style={styles.stack}>{ACTIONS.map((item) => <Chip key={item} label={item} selected={action === item} onPress={() => onAction(item)} />)}</View>{methodAdjustment ? <Surface style={styles.adjustmentCard}><Text style={type.label}>方法调整</Text><Text style={type.body}>如果“{methodAdjustment.methodTitle}”这次不适合你，可以减少它出现在推荐里的次数。重新允许这个方法前，需要先调整偏好。</Text><SecondaryButton label={methodAdjustment.hidden ? "已减少推荐" : `减少推荐“${methodAdjustment.methodTitle}”`} disabled={methodAdjustment.hidden} onPress={methodAdjustment.onHideMethod} /></Surface> : null}<PrimaryButton label="保存并完成" onPress={onComplete} /></Screen>;
}

function DoneView({ action, result, status, storageWarning, activationBefore, activationAfter, onReturn }: {
  action?: string; result?: SessionResult; status?: PracticeSession["status"]; storageWarning: boolean;
  activationBefore?: ActivationLevel; activationAfter?: ActivationLevel; onReturn: () => void;
}) {
  const copy = endingCopy(result, status);
  return <Screen><View style={styles.done}><BreathingOrb compact paused />
    <Text style={[type.display, styles.centerText]}>{copy.title}</Text><Text style={type.body}>{copy.body}</Text>
    {storageWarning ? <Text accessibilityRole="alert" style={type.body}>本次记录未能完整保存，但你仍可结束。</Text> : null}
    <Surface style={styles.deltaCard}><Text style={type.label}>本次记录</Text><Text style={type.h2}>{ratingText(activationBefore)} → {ratingText(activationAfter)}</Text><Text style={type.caption}>{changeText(activationBefore, activationAfter)}</Text></Surface>
    {action ? <Surface warm style={styles.actionCard}><Text style={type.label}>你选择了（尚未记录实际完成）</Text><Text style={type.h2}>{action}</Text></Surface> : null}
    <PrimaryButton label="结束并返回" onPress={onReturn} />
  </View></Screen>;
}

function PreparingView() {
  return <Screen scroll={false} contentStyle={styles.preparing}><BreathingOrb compact /><Text style={type.h2}>正在准备这一分钟…</Text><Text style={[type.body, styles.centerText]}>不用再选择。跟着下一屏做就好。</Text></Screen>;
}

function SupportView({ onBack }: { onBack: () => void }) {
  return <Screen><TopBar title="先保证现实中的安全" onClose={onBack} /><View style={styles.centerCopy}><Text style={type.display}>这不是一个人扛住的时刻。</Text><Text style={type.body}>如果你有即时危险、医疗紧急情况，或无法保证自己的安全，请立刻联系当地紧急服务、前往急诊，或让可信任的人陪在你身边。</Text></View><Surface style={styles.supportCard}><Text style={type.h2}>StillMind 能做什么</Text><Text style={type.body}>只提供一般性的短暂停顿与定向提示，不提供诊断、治疗或危机处置。</Text></Surface><PrimaryButton label="我会联系现实中的支持" onPress={onBack} /></Screen>;
}

function TopBar({ title, meta, onClose }: { title: string; meta?: string; onClose: () => void }) {
  return <View style={styles.topBar}><Text style={styles.topTitle}>{title}</Text><View style={styles.topActions}>{meta ? <Text style={styles.topMeta}>{meta}</Text> : null}<Pressable accessibilityLabel="关闭" hitSlop={12} onPress={onClose}><Ionicons name="close" size={26} color={colors.textMuted} /></Pressable></View></View>;
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
