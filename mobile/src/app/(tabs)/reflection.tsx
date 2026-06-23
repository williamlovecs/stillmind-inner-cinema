import { useEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { METHOD_BY_ID, buildWeeklyReview } from "@stillmind/domain";
import { colors } from "@/constants/theme";
import { BrandHeader, Screen, SectionHeading, Surface, type } from "@/components/stillmind/ui";
import { useApp } from "@/state/AppProvider";
import { sessionCountBucket, track, weeklyNextStepReason } from "@/lib/analytics";

function weekStart(now = new Date()) {
  const date = new Date(now);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export default function ReflectionScreen() {
  const { sessions, deleteSession } = useApp();
  const review = useMemo(() => buildWeeklyReview(sessions, weekStart()), [sessions]);
  const topMethod = Object.entries(review.methodCounts).sort((a, b) => b[1] - a[1])[0];
  const topMode = Object.entries(review.modeCounts).sort((a, b) => b[1] - a[1])[0];
  const nextMethod = METHOD_BY_ID.get(review.nextStep.methodId);
  const startNextStep = () => {
    track("weekly_next_step_started", {
      method_id: review.nextStep.methodId,
      duration_bucket: review.nextStep.duration,
      reason_code: weeklyNextStepReason(review.nextStep.reasonCodes),
    });
    router.push({
      pathname: "/reset",
      params: {
        mode: review.nextStep.mode,
        methodId: review.nextStep.methodId,
        activation: "3",
        duration: String(review.nextStep.duration),
        outcome: review.nextStep.outcome,
      },
    });
  };

  useEffect(() => {
    track("weekly_review_opened", { session_count_bucket: sessionCountBucket(review.sessions), has_average: typeof review.averageActivationChange === "number" });
  }, [review.averageActivationChange, review.sessions]);

  return (
    <Screen>
      <BrandHeader eyebrow="本周回看" title="看见重复，不把重复变成身份。" />
      <View style={styles.metrics}>
        <Surface style={styles.metric}><Text style={styles.metricValue}>{review.sessions}</Text><Text style={type.caption}>次暂停</Text></Surface>
        <Surface style={styles.metric}><Text style={styles.metricValue}>{review.results.better}</Text><Text style={type.caption}>次多了一点选择</Text></Surface>
      </View>
      {review.sessions === 0 ? (
        <Surface style={styles.empty}><Text style={type.h2}>这一周还没有记录</Text><Text style={type.body}>第一次暂停之后，这里会出现方法和状态的简单回看。</Text></Surface>
      ) : (
        <Surface style={styles.summary} warm>
          <Text style={type.label}>这周出现的线索</Text>
          <Text style={type.h2}>{topMode ? `“${modeLabel(topMode[0])}”出现了 ${topMode[1]} 次。` : "你已经开始留下线索。"}</Text>
          <Text style={type.body}>{topMethod ? `你最常选择“${METHOD_BY_ID.get(topMethod[0] as never)?.title ?? topMethod[0]}”。这不是结论，只是本周发生过的事实。` : ""}</Text>
          {typeof review.averageActivationChange === "number" ? <Text style={styles.change}>平均自评变化 {review.averageActivationChange > 0 ? "+" : ""}{review.averageActivationChange}</Text> : <Text style={type.caption}>完成至少两次前，不显示容易误导的平均值。</Text>}
        </Surface>
      )}
      <Surface style={styles.nextStep}>
        <View style={styles.nextStepTop}>
          <View style={styles.nextStepIcon}><Ionicons name="compass-outline" size={18} color={colors.white} /></View>
          <View style={styles.flex}>
            <Text style={type.label}>下一次练习</Text>
            <Text style={type.h2}>{review.nextStep.title}</Text>
          </View>
        </View>
        <Text style={type.body}>{review.nextStep.body}</Text>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]} onPress={startNextStep}>
          <Text style={styles.nextButtonText}>{review.nextStep.cta}</Text>
          <Text style={styles.nextButtonMeta}>{nextMethod?.title ?? review.nextStep.methodId} · {review.nextStep.duration} 分钟</Text>
        </Pressable>
      </Surface>
      <View style={styles.list}>
        <SectionHeading title="最近记录" caption="可在“我的”中导出或清除" />
        {sessions.slice(0, 8).map((session) => (
          <Surface key={session.id} style={styles.row}>
            <View style={styles.flex}><Text style={type.bodyStrong}>{METHOD_BY_ID.get(session.methodId)?.title ?? session.methodId}</Text><Text style={type.caption}>{new Date(session.startedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {modeLabel(session.mode)}</Text></View>
            <Text style={[styles.result, session.result === "better" && styles.better, session.result === "worse" && styles.worse]}>{resultLabel(session.result)}</Text>
            <Pressable accessibilityLabel="删除这条记录" hitSlop={10} onPress={() => Alert.alert("删除这条记录？", "只会删除本机上的这一条练习。", [{ text: "取消", style: "cancel" }, { text: "删除", style: "destructive", onPress: () => deleteSession(session.id) }])}><Ionicons name="trash-outline" size={18} color={colors.textFaint} /></Pressable>
          </Surface>
        ))}
      </View>
    </Screen>
  );
}

function modeLabel(mode: string) { return ({ looping: "想个不停", tense: "身体很紧", impulsive: "想立刻回应", numb: "有点麻木", hurt: "关系里受伤", curious: "安静观察" } as Record<string, string>)[mode] ?? mode; }
function resultLabel(result?: string) { return ({ better: "更有选择", same: "差不多", worse: "更不舒服", stopped: "已停止" } as Record<string, string>)[result ?? ""] ?? "已记录"; }

const styles = StyleSheet.create({
  metrics: { flexDirection: "row", gap: 12 }, metric: { flex: 1, minHeight: 112, justifyContent: "center" }, metricValue: { color: colors.text, fontSize: 36, fontWeight: "800" },
  empty: { gap: 10, minHeight: 170, justifyContent: "center" }, summary: { gap: 14 }, change: { color: colors.amber, fontSize: 14, fontWeight: "700" },
  nextStep: { gap: 14 },
  nextStepTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  nextStepIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(124, 92, 255, 0.72)", alignItems: "center", justifyContent: "center" },
  nextButton: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: "rgba(216, 180, 254, 0.34)", backgroundColor: "rgba(124, 92, 255, 0.22)", paddingHorizontal: 16, justifyContent: "center" },
  nextButtonText: { color: colors.text, fontSize: 16, fontWeight: "800" },
  nextButtonMeta: { color: colors.textFaint, fontSize: 12, fontWeight: "600", marginTop: 3 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  list: { gap: 11 }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, flex: { flex: 1 }, result: { color: colors.textMuted, fontSize: 12, fontWeight: "700" }, better: { color: colors.mint }, worse: { color: colors.danger },
});
