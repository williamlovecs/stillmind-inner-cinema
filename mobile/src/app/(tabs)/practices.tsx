import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { buildPracticePathProgress, METHOD_BY_ID, METHOD_CATALOG, PRACTICE_PATHS, type PracticeFamily, type PracticePathDefinition, type PracticePathProgress } from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { BrandHeader, Chip, Screen, SectionHeading, Surface, type } from "@/components/stillmind/ui";
import { MethodCard } from "@/components/stillmind/MethodCard";
import { useApp } from "@/state/AppProvider";
import { track } from "@/lib/analytics";

const FILTERS: { id: "all" | PracticeFamily; label: string }[] = [
  { id: "all", label: "全部" }, { id: "distance", label: "拉开距离" }, { id: "settle", label: "先安定" }, { id: "observe", label: "练习观察" }, { id: "release", label: "松开重播" }, { id: "return", label: "回到行动" }, { id: "reflect", label: "稳定 / 拉远" },
];

export default function PracticesScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const { preferences, sessions, toggleFavorite } = useApp();
  const methods = useMemo(() => METHOD_CATALOG.filter((method) => filter === "all" || method.family === filter), [filter]);
  const startPath = (path: PracticePathDefinition) => {
    const progress = buildPracticePathProgress(path, sessions, preferences.hiddenMethodIds);
    const stage = progress.nextStage ?? path.stages[0];
    if (!stage) return;
    track("practice_path_started", { path_id: path.id, method_id: stage.methodId, duration_bucket: stage.duration });
    router.push({ pathname: "/reset", params: { methodId: stage.methodId, duration: String(stage.duration), mode: path.mode, outcome: path.outcome, direct: "1" } });
  };

  return (
    <Screen>
      <BrandHeader eyebrow="方法库" title="不是更多内容，是更合适的方法。" />
      <Text style={type.body}>每一种方法都能单独使用。推荐只是入口，你永远可以自己选择。</Text>
      <View style={styles.paths}>
        <SectionHeading title="练习路径" caption="从一个常见时刻开始" />
        {PRACTICE_PATHS.map((path) => <PathCard key={path.id} path={path} progress={buildPracticePathProgress(path, sessions, preferences.hiddenMethodIds)} onPress={() => startPath(path)} />)}
      </View>
      <View style={styles.filters}>{FILTERS.map((item) => <Chip key={item.id} label={item.label} selected={filter === item.id} onPress={() => setFilter(item.id)} />)}</View>
      <View style={styles.list}>
        <SectionHeading title={`${methods.length} 种方法`} caption="核心版本均可离线" />
        {methods.map((method) => <MethodCard key={method.id} method={method} favorite={preferences.favoriteMethodIds.includes(method.id)} onFavorite={() => toggleFavorite(method.id)} onPress={() => router.push({ pathname: "/method/[id]", params: { id: method.id } })} />)}
      </View>
    </Screen>
  );
}

function PathCard({ path, progress, onPress }: { path: PracticePathDefinition; progress: PracticePathProgress; onPress: () => void }) {
  const nextStage = progress.nextStage ?? path.stages[0];
  const nextMethod = METHOD_BY_ID.get(nextStage?.methodId);
  const complete = progress.completedStages >= progress.totalStages;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <Surface style={styles.pathCard} warm={path.id === "gentle-release"}>
        <View style={styles.pathHeader}>
          <View style={styles.pathIcon}><Ionicons name="trail-sign-outline" size={18} color={colors.white} /></View>
          <View style={styles.flex}>
            <Text style={type.h2}>{path.title}</Text>
            <Text style={type.caption}>{path.subtitle} · {progress.completedStages}/{progress.totalStages}</Text>
          </View>
          <Ionicons name={complete ? "checkmark-circle" : "play-circle"} size={24} color={complete ? colors.mint : colors.lavender} />
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round((progress.completedStages / progress.totalStages) * 100)}%` }]} /></View>
        <Text style={type.body}>{path.summary}</Text>
        <Text style={styles.bestFor}>{path.bestFor}</Text>
        <View style={styles.stageRow}>{path.stages.map((stage, index) => <View key={`${path.id}-${stage.methodId}`} style={[styles.stagePill, index < progress.completedStages && styles.stageDone, progress.nextStage?.methodId === stage.methodId && styles.stageNext]}><Text style={styles.stageIndex}>{index + 1}</Text><Text style={styles.stageText}>{METHOD_BY_ID.get(stage.methodId)?.title ?? stage.label} · {stage.duration}m</Text></View>)}</View>
        <Text style={styles.startText}>{complete ? "已完成这条路径，可从第一阶段复练" : progress.blockedByHiddenMethod ? "下一阶段已被你减少推荐，可在方法库手动打开" : `下一步：${nextMethod?.title ?? nextStage?.label} · ${nextStage?.duration ?? path.duration} 分钟`}</Text>
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
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.10)", overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.lavender },
  stageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stagePill: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(8, 12, 27, 0.42)" },
  stageDone: { borderColor: "rgba(126, 213, 195, 0.32)", backgroundColor: "rgba(126, 213, 195, 0.10)" },
  stageNext: { borderColor: colors.borderStrong, backgroundColor: "rgba(155, 135, 245, 0.16)" },
  stageIndex: { color: colors.lavender, fontSize: 11, fontWeight: "900" },
  stageText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  startText: { color: colors.lavender, fontSize: 13, fontWeight: "800", marginTop: spacing.xs },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  list: { gap: 12 },
});
