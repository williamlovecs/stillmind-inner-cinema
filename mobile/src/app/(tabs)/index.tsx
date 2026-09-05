import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  containsHighRiskLanguage,
  detectStateModeFromText,
  METHOD_BY_ID,
  ratingText,
  recommendMethods,
  RESET_STATE_BY_MODE,
  RESET_STATE_PROFILES,
  type ActivationLevel,
  type StateMode,
} from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BrandHeader, Chip, PrimaryButton, Screen, Surface, type } from "@/components/stillmind/ui";
import { useApp, type ResetDraft } from "@/state/AppProvider";
import { buildMethodHistory } from "@/lib/recommendation";
import { track } from "@/lib/analytics";

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
  const [starting, setStarting] = useState(false);
  const { preferences, sessions, setPendingResetDraft } = useApp();

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
      Alert.alert(
        "先联系现实中的支持",
        "StillMind 不处理危机或医疗紧急情况。如果你无法保证自己的安全，请立即联系当地紧急服务、前往急诊，或让可信任的人陪在身边。",
        [{ text: "知道了" }],
      );
      return;
    }

    if (recommendation.kind !== "practice") { Alert.alert("暂时没有匹配的练习", recommendation.explanation); return; }
    setStarting(true);
    const resolvedInputMethod = text ? inputMethod : "state-only";
    setPendingResetDraft({ trigger: text, inputMethod: resolvedInputMethod });
    router.push({
      pathname: "/reset",
      params: {
        mode,
        methodId: method.id,
        ...(activation === undefined ? {} : { activation: String(activation) }),
        duration: "1",
        outcome: profile.outcome,
        direct: "1",
      },
    });
    setTimeout(() => setStarting(false), 700);
  }

  return (
    <Screen contentStyle={styles.screen}>
      <BrandHeader />
      <View style={styles.heroCopy}>
        <Text style={type.display}>现在发生了什么？</Text>
        <Text style={type.body}>说一句，或者写一句。不用解释完整。</Text>
      </View>

      <Surface style={styles.intakeCard}>
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
            <Pressable key={example} onPress={() => chooseExample(example)} style={({ pressed }) => [styles.example, pressed && styles.pressed]}>
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

        <PrimaryButton
          label={starting ? "正在准备…" : "开始 1 分钟 Reset"}
          disabled={starting}
          icon={<Ionicons name="play" size={18} color={colors.white} />}
          onPress={start}
        />
        <Text style={styles.matchCopy}>将使用：{method.title}</Text>
      </Surface>

      <Pressable onPress={() => setShowStates((value) => !value)} style={styles.secondaryLink}>
        <Text style={styles.secondaryLinkText}>{showStates ? "收起状态选择" : "不想描述？直接选状态"}</Text>
        <Ionicons name={showStates ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
      </Pressable>
      {showStates ? (
        <View style={styles.stateChoices}>
          {RESET_STATE_PROFILES.map((item) => <Chip key={item.id} label={item.shortLabel} selected={mode === item.id} onPress={() => chooseMode(item.id)} />)}
        </View>
      ) : null}

      <Pressable onPress={() => router.push("/(tabs)/practices")} style={styles.methodsLink}>
        <Text style={styles.methodsLinkText}>探索 12 种方法</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
      </Pressable>
      <Text style={styles.safety}>不提供诊断、治疗或危机处置。私人原话不会进入分析事件。</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.md },
  heroCopy: { gap: 7, paddingTop: spacing.md },
  intakeCard: { gap: 16, padding: 16 },
  dictationHint: { flexDirection: "row", alignItems: "center", gap: 7 },
  dictationText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  input: { minHeight: 122, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: "rgba(5,9,20,0.72)", color: colors.text, padding: 15, fontSize: 16, lineHeight: 24 },
  examples: { flexDirection: "row", gap: 8, overflow: "hidden" },
  example: { flex: 1, minWidth: 0, borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, paddingHorizontal: 10, paddingVertical: 9 },
  exampleText: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  scaleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  score: { color: colors.amber, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] },
  scale: { flexDirection: "row", gap: 8 },
  scaleButton: { flex: 1, aspectRatio: 1, maxHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  scaleButtonActive: { borderColor: colors.amber, backgroundColor: "rgba(244,182,106,0.16)" },
  scaleText: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  scaleTextActive: { color: colors.text },
  matchCopy: { color: colors.textFaint, fontSize: 12, textAlign: "center" },
  secondaryLink: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  secondaryLinkText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  stateChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodsLink: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  methodsLinkText: { color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  safety: { color: colors.textFaint, fontSize: 11, lineHeight: 18, textAlign: "center", paddingHorizontal: 8 },
  pressed: { opacity: 0.74 },
});
