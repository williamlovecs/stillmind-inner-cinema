import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { METHOD_BY_ID, recommendMethods, type DesiredOutcome, type StateMode } from "@stillmind/domain";
import { colors, spacing } from "@/constants/theme";
import { BreathingOrb } from "@/components/stillmind/BreathingOrb";
import { BrandHeader, Chip, PrimaryButton, Screen, SectionHeading, Surface, type } from "@/components/stillmind/ui";
import { useApp } from "@/state/AppProvider";
import { buildMethodHistory } from "@/lib/recommendation";

const MODES: { id: StateMode; label: string; outcome: DesiredOutcome }[] = [
  { id: "looping", label: "想个不停", outcome: "distance" },
  { id: "tense", label: "身体很紧", outcome: "settle" },
  { id: "impulsive", label: "想立刻回应", outcome: "pause" },
  { id: "numb", label: "有点麻木", outcome: "settle" },
  { id: "hurt", label: "关系里受伤", outcome: "distance" },
  { id: "curious", label: "想安静观察", outcome: "awareness" },
];

export default function TodayScreen() {
  const [mode, setMode] = useState<StateMode>("impulsive");
  const { preferences, sessions } = useApp();
  const selected = MODES.find((item) => item.id === mode) ?? MODES[0];
  const history = useMemo(() => buildMethodHistory(sessions, preferences.favoriteMethodIds), [sessions, preferences.favoriteMethodIds]);
  const recommendation = recommendMethods({
    activation: mode === "impulsive" || mode === "tense" ? 4 : 3,
    mode,
    duration: 1,
    outcome: selected.outcome,
    eyesOpenPreferred: preferences.eyesOpenPreferred,
    bodyFocusAllowed: preferences.bodyFocusAllowed,
    breathChangeAllowed: preferences.breathChangeAllowed,
    hiddenMethodIds: preferences.hiddenMethodIds,
    history,
  });

  const primary = recommendation.kind === "practice" ? recommendation.primary : METHOD_BY_ID.get("grounded-action")!;
  const start = () => router.push({ pathname: "/reset", params: { mode, methodId: primary.id, activation: mode === "impulsive" || mode === "tense" ? "4" : "3", duration: "1", outcome: selected.outcome } });

  return (
    <Screen>
      <BrandHeader />
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={type.display}>此刻，什么在拉着你？</Text>
          <Text style={type.body}>不用先讲完整。选一个最接近的状态。</Text>
        </View>
        <BreathingOrb compact />
      </View>
      <View style={styles.chips}>{MODES.map((item) => <Chip key={item.id} label={item.label} selected={mode === item.id} onPress={() => setMode(item.id)} />)}</View>
      <Surface style={styles.recommendation}>
        <View style={styles.recommendationTop}><Text style={type.label}>此刻推荐</Text><Ionicons name="sparkles" size={18} color={colors.lavender} /></View>
        <Text style={type.h1}>{primary.title}</Text>
        <Text style={type.bodyStrong}>{primary.subtitle}</Text>
        <Text style={type.body}>{recommendation.kind === "practice" ? recommendation.explanation : recommendation.explanation}</Text>
        <PrimaryButton label="开始 1 分钟" icon={<Ionicons name="play" size={18} color={colors.white} />} onPress={start} />
        <Pressable onPress={() => router.push("/(tabs)/practices")}><Text style={styles.link}>不合适？自己选一种方法</Text></Pressable>
      </Surface>
      {sessions.length > 0 ? (
        <View style={styles.section}>
          <SectionHeading title="最近一次" caption="记录只保存在本机" />
          <Surface style={styles.recent}>
            <View><Text style={type.bodyStrong}>{METHOD_BY_ID.get(sessions[0].methodId)?.title ?? "一次练习"}</Text><Text style={type.caption}>{new Date(sessions[0].startedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text></View>
            <Text style={[styles.result, sessions[0].result === "better" && styles.better]}>{sessions[0].result === "better" ? "多了一点选择" : sessions[0].result === "worse" ? "不太适合" : "已记录"}</Text>
          </Surface>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { minHeight: 340, justifyContent: "space-between" },
  heroCopy: { gap: spacing.sm, paddingTop: spacing.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  recommendation: { gap: 14, shadowColor: colors.violet, shadowOpacity: 0.16, shadowRadius: 30 },
  recommendationTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: colors.textMuted, fontSize: 13, fontWeight: "600", textAlign: "center", paddingVertical: 4 },
  section: { gap: 12 },
  recent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  result: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  better: { color: colors.mint },
});
