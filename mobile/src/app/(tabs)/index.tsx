import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  containsHighRiskLanguage,
  detectStateModeFromText,
  METHOD_BY_ID,
  recommendMethods,
  RESET_STATE_BY_MODE,
  RESET_STATE_PROFILES,
  ratingText,
  type ActivationLevel,
  type StateMode,
} from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BrandHeader, Chip, PrimaryButton, Screen, SecondaryButton, Surface, type } from "@/components/stillmind/ui";
import { useApp, type ResetDraft } from "@/state/AppProvider";
import { buildMethodHistory } from "@/lib/recommendation";
import { track } from "@/lib/analytics";
import { NativePracticeShortcuts } from "@/components/stillmind/NativePracticeShortcuts";

const EXAMPLES = [
  "我被批评了，现在很想反击。",
  "刚才的对话一直在脑子里重播。",
  "身体很紧，停不下来。",
] as const;

export default function TodayScreen() {
  const [trigger, setTrigger] = useState("");
  const [activation, setActivation] = useState<ActivationLevel | undefined>();
  const [manualMode, setManualMode] = useState<StateMode>();
  const [inputMethod, setInputMethod] = useState<ResetDraft["inputMethod"]>("typed");
  const [showStates, setShowStates] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [starting, setStarting] = useState(false);
  // Alert.alert is a silent no-op on react-native-web, so boundary notices render inline on every platform.
  const [notice, setNotice] = useState<{ title: string; body: string }>();
  const { preferences, sessions, setPendingResetDraft } = useApp();
  const startingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startedRef = useRef(false);
  // A finished flow must not leave the previous sentence in the box: returning users
  // could accidentally resubmit it (and, with AI enabled, send it to the server again).
  useFocusEffect(useCallback(() => {
    if (!startedRef.current) return;
    startedRef.current = false;
    setTrigger(""); setActivation(undefined); setManualMode(undefined); setInputMethod("typed");
  }, []));
  useEffect(() => () => clearTimeout(startingTimerRef.current), []);

  const detectedMode = detectStateModeFromText(trigger);
  const mode = manualMode ?? detectedMode;
  const profile = RESET_STATE_BY_MODE.get(mode) ?? RESET_STATE_PROFILES[1];
  const history = useMemo(() => buildMethodHistory(sessions, preferences.favoriteMethodIds), [sessions, preferences.favoriteMethodIds]);
  const recommendation = useMemo(() => recommendMethods({
    activation: activation ?? profile.defaultActivation,
    mode,
    duration: 1,
    outcome: profile.outcome,
    scope: "reset",
    eyesOpenPreferred: preferences.eyesOpenPreferred,
    bodyFocusAllowed: preferences.bodyFocusAllowed,
    breathChangeAllowed: preferences.breathChangeAllowed,
    hiddenMethodIds: preferences.hiddenMethodIds,
    history,
  }), [activation, history, mode, preferences, profile.outcome, profile.defaultActivation]);
  const method = recommendation.kind === "practice" ? recommendation.primary : METHOD_BY_ID.get("grounded-action")!;

  function chooseExample(value: string) {
    setTrigger(value);
    setManualMode(undefined);
    setInputMethod("example");
  }

  function chooseMode(value: StateMode) {
    setManualMode(value);
    setActivation(undefined);
    if (!trigger.trim()) setInputMethod("state-only");
  }

  function start() {
    if (starting) return;
    const text = trigger.trim();
    if (text && containsHighRiskLanguage(text)) {
      track("safety_boundary_shown", { reason_code: "high-risk-language" });
      setNotice({
        title: "先联系现实中的支持",
        body: "StillMind 不处理危机或医疗紧急情况。如果你无法保证自己的安全，请立即联系当地紧急服务、前往急诊，或让可信任的人陪在身边。",
      });
      return;
    }

    if (recommendation.kind !== "practice") {
      setNotice({ title: "当前没有匹配的练习", body: recommendation.explanation });
      return;
    }
    setStarting(true);
    const resolvedInputMethod = text ? inputMethod : "state-only";
    setPendingResetDraft({ trigger: text, inputMethod: resolvedInputMethod });
    // The reset screen records the actual start once, with a joinable session id.
    router.push({
      pathname: "/reset",
      params: {
        mode,
        methodId: method.id,
        ...(activation === undefined ? {} : { activation: String(activation), ratingProvided: "1" }),
        duration: "1",
        outcome: profile.outcome,
        direct: "1",
      },
    });
    startedRef.current = true;
    clearTimeout(startingTimerRef.current);
    startingTimerRef.current = setTimeout(() => setStarting(false), 700);
  }

  return (
    <Screen contentStyle={styles.screen}>
      <BrandHeader />
      <View style={styles.heroCopy}>
        <Text style={type.label}>沉寂小我 · 一分钟入口</Text>
        <Text style={type.display}>先不用回答。{"\n"}给自己一分钟。</Text>
        <Text style={type.body}>不用整理好情绪，也不用先读懂十二种方法。让一个念头被看见，再决定下一步。</Text>
        <Text style={type.caption}>可以空输入，随时可以停止。练后不必报告变化。</Text>
      </View>

      <PrimaryButton
        label={starting ? "正在准备…" : "开始 1 分钟 Reset"}
        disabled={starting}
        icon={<Ionicons name="play" size={18} color={colors.accentInk} />}
        onPress={start}
      />
      <NativePracticeShortcuts />
      {notice ? <Surface style={styles.noticeCard}>
        <View accessibilityRole="alert" style={styles.noticeCopy}>
          <Text style={type.bodyStrong}>{notice.title}</Text>
          <Text style={type.body}>{notice.body}</Text>
        </View>
        <SecondaryButton label="知道了" onPress={() => setNotice(undefined)} />
      </Surface> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showIntake }} onPress={() => setShowIntake(!showIntake)} style={styles.secondaryLink}><Text style={styles.secondaryLinkText}>{showIntake ? "收起输入" : "想说一句，或记录此刻程度（可选）"}</Text></Pressable>
      {showIntake ? <Surface style={styles.intakeCard}>
        <View style={styles.dictationHint}>
          <Ionicons name="mic-outline" size={17} color={colors.lavender} />
          <Text style={styles.dictationText}>可直接使用键盘上的语音输入</Text>
        </View>
        <TextInput
          value={trigger}
          onChangeText={(value) => {
            setTrigger(value);
            setManualMode(undefined);
            setInputMethod("typed");
          }}
          placeholder="比如：我被批评了，现在很想反击。"
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={500}
          textAlignVertical="top"
          returnKeyType="done"
          style={styles.input}
          accessibilityLabel="写下刚才发生了什么"
        />
        <View style={styles.examples}>
          {EXAMPLES.map((example) => (
            <Pressable key={example} accessibilityRole="button" onPress={() => chooseExample(example)} style={({ pressed }) => [styles.example, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={styles.exampleText}>{example.replace(/。$/, "")}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.scaleHeader}>
          <View>
            <Text style={type.bodyStrong}>现在被带走的程度（可选）</Text>
            <Text style={type.caption}>1 = 还能停一下，5 = 很难停下来</Text>
          </View>
          <Text style={styles.score}>{ratingText(activation)}</Text>
        </View>
        <View style={styles.scale}>
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: activation === value }}
              onPress={() => setActivation(activation === value ? undefined : value)}
              style={[styles.scaleButton, activation === value && styles.scaleButtonActive]}
            >
              <Text style={[styles.scaleText, activation === value && styles.scaleTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>


        <Text style={styles.matchCopy}>将使用：{method.title}</Text>
      </Surface> : null}

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showStates }} onPress={() => setShowStates((value) => !value)} style={styles.secondaryLink}>
        <Text style={styles.secondaryLinkText}>{showStates ? "收起状态选择" : "不想描述？直接选状态"}</Text>
        <Ionicons name={showStates ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </Pressable>
      {showStates ? (
        <View style={styles.stateChoices}>
          {RESET_STATE_PROFILES.map((item) => <Chip key={item.id} label={item.shortLabel} selected={mode === item.id} onPress={() => chooseMode(item.id)} />)}
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/practices")} style={styles.methodsLink}>
        <Text style={styles.methodsLinkText}>探索 12 种方法</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <View style={styles.quietObject} accessibilityLabel="一分钟练习：看见，留一点距离，回到此刻">
        <View style={styles.objectOrbit} /><View style={styles.objectPaper}><Text style={styles.objectText}>一个念头{"\n"}也可以只是{"\n"}被看见。</Text></View>
        <View style={styles.objectSteps}><Text style={styles.objectStep}>看见</Text><Text style={styles.objectStep}>留一点距离</Text><Text style={styles.objectStep}>回到此刻</Text></View>
      </View>
      <Text style={styles.safety}>不提供诊断、治疗或危机处置。私人原话不会进入分析事件。</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.md },
  heroCopy: { gap: 13, paddingTop: spacing.xl },
  noticeCard: { gap: 12, padding: 16 },
  noticeCopy: { gap: 7 },
  intakeCard: { gap: 16, paddingVertical: 18, paddingHorizontal: 0, borderTopWidth: 1, borderColor: colors.border, borderRadius: 0, backgroundColor: "transparent" },
  dictationHint: { flexDirection: "row", alignItems: "center", gap: 7 },
  dictationText: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
  input: { minHeight: 122, borderBottomWidth: 1, borderColor: colors.borderStrong, color: colors.text, backgroundColor: "transparent", paddingVertical: 15, fontSize: 16, lineHeight: 25 },
  examples: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  example: { minHeight: 44, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9, justifyContent: "center" },
  exampleText: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  scaleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  score: { color: colors.accentStrong, fontSize: 20, fontWeight: "500", fontVariant: ["tabular-nums"] },
  scale: { flexDirection: "row", gap: 8 },
  scaleButton: { flex: 1, minHeight: 46, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  scaleButtonActive: { borderColor: colors.accent, borderBottomWidth: 2 },
  scaleText: { color: colors.textMuted, fontSize: 15, fontWeight: "500" },
  scaleTextActive: { color: colors.accentStrong },
  matchCopy: { color: colors.textFaint, fontSize: 12, textAlign: "center" },
  secondaryLink: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  secondaryLinkText: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  stateChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodsLink: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  methodsLinkText: { color: colors.accentStrong, fontSize: 13, fontWeight: "500" },
  quietObject: { minHeight: 280, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  objectOrbit: { position: "absolute", width: 250, height: 174, borderRadius: 125, borderWidth: 1, borderColor: "#AEB6A0", transform: [{ rotate: "-16deg" }] },
  objectPaper: { width: 178, height: 194, backgroundColor: "#E5E3D5", alignItems: "center", justifyContent: "center", transform: [{ rotate: "3deg" }] },
  objectText: { color: "#4D5848", fontSize: 18, lineHeight: 32, fontWeight: "400", textAlign: "center" },
  objectSteps: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderColor: colors.border, paddingTop: 12 },
  objectStep: { color: colors.textMuted, fontSize: 11 },
  safety: { color: colors.textFaint, fontSize: 11, lineHeight: 18, textAlign: "center", paddingHorizontal: 8 },
  pressed: { opacity: 0.72 },
});
