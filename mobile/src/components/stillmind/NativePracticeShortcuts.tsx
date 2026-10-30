import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { METHOD_BY_ID } from "@stillmind/domain";
import { colors } from "@/constants/theme";
import { SectionHeading, Surface, type } from "@/components/stillmind/ui";
import { useApp } from "@/state/AppProvider";

export function NativePracticeShortcuts() {
  const { sessions, preferences } = useApp();
  const recent = sessions[0];
  const favorites = preferences.favoriteMethodIds.slice(0, 2);
  if (!recent && favorites.length === 0) return null;
  return <View style={styles.section}>
    <SectionHeading title="接着上一次" caption="来自本机记录与收藏" action={<Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/reflection")}><Text style={styles.reviewLink}>复盘</Text></Pressable>} />
    <View style={styles.grid}>
      {recent ? <Shortcut label="最近练习" title={METHOD_BY_ID.get(recent.methodId)?.title ?? recent.methodId} meta={recent.status === "completed" ? "已完成 · 再次查看" : "已停止 · 再次查看"} onPress={() => router.push({ pathname: "/method/[id]", params: { id: recent.methodId } })} /> : null}
      {favorites.map((id) => <Shortcut key={id} label="已收藏" title={METHOD_BY_ID.get(id)?.title ?? id} meta="打开方法" onPress={() => router.push({ pathname: "/method/[id]", params: { id } })} />)}
    </View>
  </View>;
}

function Shortcut({ label, title, meta, onPress }: { label: string; title: string; meta: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.shortcutOuter, pressed && styles.pressed]}><Surface style={styles.shortcut}><View style={styles.heading}><Text style={type.caption}>{label}</Text><Ionicons name="arrow-forward" size={15} color={colors.textMuted} /></View><Text style={type.bodyStrong}>{title}</Text><Text style={type.caption}>{meta}</Text></Surface></Pressable>;
}

const styles = StyleSheet.create({
  section: { gap: 10 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  shortcutOuter: { flexGrow: 1, flexBasis: 140 }, shortcut: { minHeight: 116, gap: 7 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  reviewLink: { minHeight: 44, paddingVertical: 12, color: colors.lavender, fontSize: 14, fontWeight: "700" },
  pressed: { opacity: .76, transform: [{ scale: .99 }] },
});
