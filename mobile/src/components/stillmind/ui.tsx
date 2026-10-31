import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/constants/theme";
import { useApp } from "@/state/AppProvider";

export function Screen({ children, scroll = true, contentStyle }: PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle }>) {
  const { storageNotice, clearStorageNotice } = useApp();
  const notice = storageNotice ? <View accessibilityRole="alert" testID="native-storage-notice" style={styles.storageNotice}>
    <Text style={[type.caption, styles.flex, { color: colors.textMuted }]}>{storageNotice}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="关闭存储提示" onPress={clearStorageNotice} style={styles.noticeDismiss}>
      <Text style={type.bodyStrong}>知道了</Text>
    </Pressable>
  </View> : null;
  const content = scroll ? (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.screenContent, contentStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : <View style={[styles.screenContent, styles.flex, contentStyle]}>{children}</View>;
  return <View style={styles.screen}><SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>{notice}{content}</SafeAreaView></View>;
}

export function BrandHeader({ eyebrow, title, action }: { eyebrow?: string; title?: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandLine}>
        <View style={styles.brandRow}>
          <View style={styles.logoFold}><View style={styles.logoLine} /><View style={styles.logoDot} /></View>
          <View><Text style={styles.brand}>StillMind</Text><Text style={styles.brandChinese}>沉寂小我</Text></View>
        </View>
        {action}
      </View>
      {eyebrow || title ? <View style={styles.headingBlock}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}{title ? <Text style={styles.pageTitle}>{title}</Text> : null}</View> : null}
    </View>
  );
}

export function Surface({ children, style, warm = false }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[]; warm?: boolean }>) {
  return <View style={[styles.surface, warm && styles.surfaceWarm, style]}>{children}</View>;
}

export function PrimaryButton({ label, icon, disabled, style, ...props }: PressableProps & { label: string; icon?: ReactNode; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && styles.pressed, style]} {...props}>
      {icon}<Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, icon, style, ...props }: PressableProps & { label: string; icon?: ReactNode; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, style]} {...props}>
      {icon}<Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected = false, ...props }: PressableProps & { label: string; selected?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]} {...props}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeading({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.flex}><Text style={styles.sectionTitle}>{title}</Text>{caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}</View>
      {action}
    </View>
  );
}

export const type = StyleSheet.create({
  display: { color: colors.text, fontSize: 36, lineHeight: 46, fontWeight: "500", letterSpacing: -1 },
  h1: { color: colors.text, fontSize: 29, lineHeight: 38, fontWeight: "500", letterSpacing: -.5 },
  h2: { color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: "500" },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 27 },
  bodyStrong: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "500" },
  caption: { color: colors.textFaint, fontSize: 13, lineHeight: 20 },
  label: { color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: "500", letterSpacing: .8 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  storageNotice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.surfaceSoft },
  noticeDismiss: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  flex: { flex: 1 },
  screenContent: { paddingHorizontal: 22, paddingBottom: 120, gap: spacing.lg },
  header: { paddingTop: spacing.sm, gap: spacing.lg },
  brandLine: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  logoFold: { width: 27, height: 31, borderWidth: 1, borderColor: colors.text, backgroundColor: colors.background, transform: [{ rotate: "-3deg" }] },
  logoLine: { position: "absolute", left: 6, top: 5, bottom: 5, borderLeftWidth: 1, borderColor: colors.borderStrong },
  logoDot: { position: "absolute", right: 5, bottom: 6, width: 7, height: 7, backgroundColor: colors.accent },
  brand: { color: colors.text, fontSize: 20, lineHeight: 23, fontWeight: "500", letterSpacing: -.4 },
  brandChinese: { color: colors.textFaint, fontSize: 11, marginTop: 1, letterSpacing: 1 },
  headingBlock: { marginTop: spacing.lg, gap: 10 },
  eyebrow: { color: colors.textMuted, fontSize: 12, fontWeight: "500", letterSpacing: 1.2 },
  pageTitle: { color: colors.text, fontSize: 34, lineHeight: 44, fontWeight: "500", letterSpacing: -.8 },
  surface: { backgroundColor: colors.backgroundRaised, borderRadius: radii.large, padding: spacing.md },
  surfaceWarm: { backgroundColor: colors.surfaceSoft },
  primaryButton: { alignSelf: "stretch", minHeight: 54, paddingHorizontal: 20, borderRadius: radii.medium, backgroundColor: colors.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryButtonText: { color: colors.accentInk, fontSize: 16, fontWeight: "600" },
  secondaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: "500" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radii.small, borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  chipSelected: { borderColor: colors.accent, borderBottomWidth: 2, backgroundColor: "transparent" },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: "500" },
  chipTextSelected: { color: colors.accentStrong },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: "500" },
  sectionCaption: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
});
