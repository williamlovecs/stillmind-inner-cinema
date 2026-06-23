import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { METHOD_BY_ID, type DurationMinutes, type MethodId } from "@stillmind/domain";
import { colors } from "@/constants/theme";
import { BrandHeader, Chip, PrimaryButton, Screen, SecondaryButton, Surface, type } from "@/components/stillmind/ui";
import { useApp } from "@/state/AppProvider";
import { track } from "@/lib/analytics";

const EVIDENCE_COPY = {
  supported: "有相邻机制研究支持；StillMind 不据此承诺个人效果。",
  informed: "由行为与产品研究启发，具体体验仍需用户验证。",
  experimental: "实验性产品练习，不作为已证实的治疗方法宣传。",
};

export default function MethodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: MethodId }>();
  const method = METHOD_BY_ID.get(id);
  const { preferences, toggleFavorite, updatePreferences } = useApp();
  const durations = useMemo<readonly DurationMinutes[]>(() => method?.durations ?? [1], [method]);
  const [minutes, setMinutes] = useState<DurationMinutes>(durations[0]);

  if (!method) return <Screen><Text style={type.h1}>没有找到这个方法</Text><SecondaryButton label="返回" onPress={() => router.back()} /></Screen>;
  const favorite = preferences.favoriteMethodIds.includes(method.id);
  const hidden = preferences.hiddenMethodIds.includes(method.id);
  const toggleHidden = () => {
    const hiddenMethodIds = hidden ? preferences.hiddenMethodIds.filter((item) => item !== method.id) : [...preferences.hiddenMethodIds, method.id];
    track("method_preference_changed", { method_id: method.id, preference: "hidden", enabled: !hidden });
    void updatePreferences({ hiddenMethodIds });
  };

  return (
    <Screen>
      <BrandHeader action={<Pressable accessibilityLabel={favorite ? "取消收藏" : "收藏"} onPress={() => toggleFavorite(method.id)}><Ionicons name={favorite ? "bookmark" : "bookmark-outline"} size={24} color={favorite ? colors.lavender : colors.textMuted} /></Pressable>} />
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={20} color={colors.textMuted} /><Text style={styles.backText}>方法库</Text></Pressable>
      <View style={styles.heading}><Text style={type.display}>{method.title}</Text><Text style={type.h2}>{method.subtitle}</Text><Text style={type.body}>{method.summary}</Text></View>
      <Surface style={styles.detail}>
        <Text style={type.label}>适合的时刻</Text>
        <Text style={type.body}>{method.modes.map(modeLabel).join(" · ")}</Text>
        <View style={styles.divider} />
        <Text style={type.label}>练习边界</Text>
        <Text style={type.body}>{method.bodyFocus ? "包含身体关注，可在设置中关闭或切换替代方式。" : "不要求关注身体内部。"}{method.breathChange ? " 呼吸不适时只看视觉节奏。" : ""}</Text>
        <View style={styles.divider} />
        <Text style={type.label}>证据说明</Text>
        <Text style={type.body}>{EVIDENCE_COPY[method.evidenceTier]}</Text>
      </Surface>
      <View style={styles.duration}><Text style={type.h2}>选择时长</Text><View style={styles.chips}>{durations.map((value) => <Chip key={value} label={`${value} 分钟`} selected={minutes === value} onPress={() => setMinutes(value)} />)}</View></View>
      <PrimaryButton label={`开始 ${minutes} 分钟`} icon={<Ionicons name="play" size={18} color={colors.white} />} onPress={() => router.push({ pathname: "/reset", params: { methodId: method.id, duration: String(minutes), mode: method.modes[0], activation: "3", outcome: method.outcomes[0], direct: "1" } })} />
      <SecondaryButton label={hidden ? "恢复到推荐中" : "不再向我推荐"} onPress={toggleHidden} />
    </Screen>
  );
}

function modeLabel(mode: string) { return ({ looping: "念头循环", tense: "身体紧绷", impulsive: "想立刻回应", numb: "有点断开", hurt: "关系受伤", curious: "安静探索" } as Record<string, string>)[mode] ?? mode; }

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", marginTop: -8, alignSelf: "flex-start" }, backText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  heading: { gap: 12 }, detail: { gap: 10 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 }, duration: { gap: 12 }, chips: { flexDirection: "row", gap: 9 },
});
