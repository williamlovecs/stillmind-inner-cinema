import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { METHOD_BY_ID, METHOD_CATALOG, PRACTICE_PATHS, type PracticeFamily, type PracticePathDefinition } from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BrandHeader, Chip, Screen, SectionHeading, Surface, type } from "@/components/stillmind/ui";
import { MethodCard } from "@/components/stillmind/MethodCard";
import { useApp } from "@/state/AppProvider";
import { track } from "@/lib/analytics";

const FILTERS: { id: "all" | PracticeFamily; label: string }[] = [
  { id: "all", label: "全部" }, { id: "distance", label: "拉开距离" }, { id: "settle", label: "先安定" }, { id: "observe", label: "练习观察" }, { id: "release", label: "松开重播" }, { id: "return", label: "回到行动" }, { id: "reflect", label: "复盘习惯" },
];

export default function PracticesScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const { preferences, toggleFavorite } = useApp();
  const methods = useMemo(() => METHOD_CATALOG.filter((method) => filter === "all" || method.family === filter), [filter]);
  const startPath = (path: PracticePathDefinition) => {
    const first = path.stages[0];
    if (!first) return;
    track("practice_path_started", { path_id: path.id, method_id: first.methodId, duration_bucket: first.duration });
    router.push({ pathname: "/reset", params: { methodId: first.methodId, duration: String(first.duration), mode: path.mode, outcome: path.outcome, direct: "1" } });
  };

  return (
    <Screen>
      <BrandHeader eyebrow="方法库" title="不是更多内容，是更合适的方法。" />
      <Text style={type.body}>每一种方法都能单独使用。推荐只是入口，你永远可以自己选择。</Text>
      <View style={styles.paths}>
        <SectionHeading title="练习路径" caption="从一个常见时刻开始" />
        {PRACTICE_PATHS.map((path) => <PathCard key={path.id} path={path} onPress={() => startPath(path)} />)}
      </View>
      <View style={styles.filters}>{FILTERS.map((item) => <Chip key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />)}</View>
      <View style={styles.list}>
        <SectionHeading title={`${methods.length} 种方法`} caption="核心版本均可离线" />
        {methods.map((method) => <MethodCard key={method.id} method={method} favorite={preferences.favoriteMethodIds.includes(method.id)} onFavorite={() => toggleFavorite(method.id)} onPress={() => router.push({ pathname: "/method/[id]", params: { id: method.id } })} />)}
      </View>
    </Screen>
  );
}

function PathCard({ path, onPress }: { path: PracticePathDefinition; onPress: () => void }) {
  const firstMethod = METHOD_BY_ID.get(path.stages[0]?.methodId);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Surface style={styles.pathCard} warm={path.id === "gentle-release"}>
        <View style={styles.pathHeader}>
          <View style={styles.pathIcon}><Ionicons name="trail-sign-outline" size={18} color={colors.white} /></View>
          <View style={styles.flex}>
            <Text style={type.h2}>{path.title}</Text>
            <Text style={type.caption}>{path.subtitle}</Text>
          </View>
          <Ionicons name="play-circle" size={24} color={colors.lavender} />
        </View>
        <Text style={type.body}>{path.summary}</Text>
        <Text style={styles.bestFor}>{path.bestFor}</Text>
        <View style={styles.stageRow}>{path.stages.map((stage, index) => <View key={`${path.id}-${stage.methodId}`} style={styles.stagePill}><Text style={styles.stageIndex}>{index + 1}</Text><Text style={styles.stageText}>{METHOD_BY_ID.get(stage.methodId)?.title ?? stage.label} · {stage.duration}m</Text></View>)}</View>
        <Text style={styles.startText}>开始：{firstMethod?.title ?? path.stages[0]?.label} · {path.stages[0]?.duration ?? path.duration} 分钟</Text>
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  paths: { gap: 12 },
  pathCard: { gap: 12 },
  pathHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  pathIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(116, 87, 216, 0.72)", alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  bestFor: { color: colors.textFaint, fontSize: 13, lineHeight: 19 },
  stageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stagePill: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(8, 12, 27, 0.42)" },
  stageIndex: { color: colors.lavender, fontSize: 11, fontWeight: "900" },
  stageText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  startText: { color: colors.lavender, fontSize: 13, fontWeight: "800", marginTop: spacing.xs },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  list: { gap: 12 },
});
