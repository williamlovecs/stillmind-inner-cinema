import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MethodDefinition } from "@stillmind/domain";
import { colors, radii } from "@/constants/theme";

const FAMILY_COLOR = {
  distance: colors.violet,
  settle: colors.blue,
  observe: colors.lavender,
  release: colors.rose,
  return: colors.amber,
  reflect: colors.mint,
} as const;

export function MethodCard({ method, favorite, onPress, onFavorite }: { method: MethodDefinition; favorite?: boolean; onPress: () => void; onFavorite?: () => void }) {
  const accent = FAMILY_COLOR[method.family];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]} accessibilityRole="button">
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <View style={styles.titleRow}><Text style={styles.title}>{method.title}</Text>{method.premium ? <Text style={styles.plus}>PLUS</Text> : null}</View>
        <Text style={styles.subtitle}>{method.subtitle}</Text>
        <View style={styles.meta}><Text style={styles.metaText}>{method.durations.join(" / ")} 分钟</Text><Text style={styles.dot}>·</Text><Text style={styles.metaText}>{method.eyesOpen ? "可睁眼" : "可闭眼"}</Text></View>
      </View>
      {onFavorite ? <Pressable accessibilityRole="button" accessibilityLabel={favorite ? "取消收藏" : "收藏"} hitSlop={12} onPress={(event) => { event.stopPropagation(); onFavorite(); }}><Ionicons name={favorite ? "bookmark" : "bookmark-outline"} size={21} color={favorite ? colors.lavender : colors.textFaint} /></Pressable> : <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 104, flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, overflow: "hidden" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  accent: { position: "absolute", left: 0, top: 16, bottom: 16, width: 3, borderRadius: 2 },
  content: { flex: 1, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.text, fontSize: 17, fontWeight: "800" },
  plus: { color: colors.lavender, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: "row", alignItems: "center" },
  metaText: { color: colors.textFaint, fontSize: 12 },
  dot: { color: colors.textFaint, marginHorizontal: 6 },
});
