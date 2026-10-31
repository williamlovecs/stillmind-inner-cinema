import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MethodDefinition } from "@stillmind/domain";
import { colors } from "@/constants/theme";

const FAMILY_COLOR = {
  distance: colors.violet,
  settle: colors.blue,
  observe: colors.lavender,
  release: colors.rose,
  return: colors.amber,
  reflect: colors.mint,
} as const;

export function MethodCard({ method, favorite, onPress, onFavorite }: { method: MethodDefinition; favorite?: boolean; onPress?: () => void; onFavorite?: () => void }) {
  const content = (
    <>
      <View style={styles.mark}><Text style={[styles.markText, { color: FAMILY_COLOR[method.family] }]}>{method.title.slice(0, 1)}</Text></View>
      <View style={styles.content}>
        <View style={styles.titleRow}><Text style={styles.title}>{method.title}</Text>{method.premium ? <Text style={styles.plus}>进阶</Text> : null}</View>
        <Text style={styles.subtitle}>{method.subtitle}</Text>
        <View style={styles.meta}><Text style={styles.metaText}>{method.durations.join(" / ")} 分钟</Text><Text style={styles.dot}>·</Text><Text style={styles.metaText}>{method.eyesOpen ? "可睁眼" : "可闭眼"}</Text></View>
      </View>
      {onFavorite ? <Pressable accessibilityRole="button" accessibilityLabel={favorite ? "取消收藏" : "收藏"} hitSlop={12} onPress={(event) => { event.stopPropagation(); onFavorite(); }}><Ionicons name={favorite ? "bookmark" : "bookmark-outline"} size={21} color={favorite ? colors.accent : colors.textFaint} /></Pressable> : onPress ? <Ionicons name="arrow-forward" size={19} color={colors.textMuted} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.card}>{content}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: { minHeight: 116, flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 18, paddingHorizontal: 2, backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.7 },
  mark: { width: 44, height: 52, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-2deg" }] },
  markText: { fontSize: 20, fontWeight: "500" },
  content: { flex: 1, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: "500" },
  plus: { color: colors.textFaint, fontSize: 10, fontWeight: "500" },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  meta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  metaText: { color: colors.textFaint, fontSize: 12 },
  dot: { color: colors.textFaint, marginHorizontal: 6 },
});
