import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients, radii, spacing } from "@/constants/theme";

export function Screen({ children, scroll = true, contentStyle }: PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle }>) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : <View style={[styles.screenContent, styles.flex, contentStyle]}>{children}</View>;
  return (
    <LinearGradient colors={gradients.background} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top", "left", "right"]}>{content}</SafeAreaView>
    </LinearGradient>
  );
}

export function BrandHeader({ eyebrow, title, action }: { eyebrow?: string; title?: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logoRing}><View style={styles.logoCore} /></View>
        <View>
          <Text style={styles.brand}>STILLMIND</Text>
          <Text style={styles.brandChinese}>内在电影</Text>
        </View>
      </View>
      {action}
      {eyebrow || title ? (
        <View style={styles.headingBlock}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {title ? <Text style={styles.pageTitle}>{title}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export function Surface({ children, style, warm = false }: PropsWithChildren<{ style?: ViewStyle | ViewStyle[]; warm?: boolean }>) {
  return <View style={[styles.surface, warm && styles.surfaceWarm, style]}>{children}</View>;
}

export function PrimaryButton({ label, icon, disabled, style, ...props }: PressableProps & { label: string; icon?: ReactNode; style?: ViewStyle }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} style={({ pressed }) => [styles.buttonOuter, disabled && styles.disabled, pressed && styles.pressed, style]} {...props}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
        {icon}
        <Text style={styles.primaryButtonText}>{label}</Text>
      </LinearGradient>
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
  display: { color: colors.text, fontSize: 34, lineHeight: 41, fontWeight: "800" },
  h1: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: "800" },
  h2: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: "700" },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 25 },
  bodyStrong: { color: colors.text, fontSize: 16, lineHeight: 24, fontWeight: "600" },
  caption: { color: colors.textFaint, fontSize: 13, lineHeight: 18 },
  label: { color: colors.lavender, fontSize: 12, lineHeight: 17, fontWeight: "700", letterSpacing: 1.4 },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { paddingHorizontal: 20, paddingBottom: 120, gap: spacing.lg },
  header: { paddingTop: spacing.sm, gap: spacing.lg },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoRing: { width: 34, height: 34, borderRadius: 17, borderWidth: 5, borderColor: colors.violet, alignItems: "center", justifyContent: "center", shadowColor: colors.lavender, shadowOpacity: 0.45, shadowRadius: 10 },
  logoCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.background },
  brand: { color: colors.text, fontSize: 15, fontWeight: "800", letterSpacing: 2.8 },
  brandChinese: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  headingBlock: { marginTop: spacing.md, gap: 8 },
  eyebrow: { color: colors.lavender, fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  pageTitle: { color: colors.text, fontSize: 30, lineHeight: 38, fontWeight: "800" },
  surface: { backgroundColor: colors.surface, borderRadius: radii.large, borderWidth: 1, borderColor: colors.border, padding: spacing.md, overflow: "hidden" },
  surfaceWarm: { backgroundColor: "rgba(82, 56, 72, 0.62)", borderColor: "rgba(244, 182, 106, 0.22)" },
  buttonOuter: { alignSelf: "stretch", borderRadius: radii.medium, overflow: "hidden" },
  primaryButton: { minHeight: 54, paddingHorizontal: 20, borderRadius: radii.medium, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  secondaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceSoft, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  chip: { minHeight: 44, paddingHorizontal: 15, borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(18, 27, 49, 0.68)", alignItems: "center", justifyContent: "center" },
  chipSelected: { borderColor: colors.lavender, backgroundColor: "rgba(116, 87, 216, 0.30)" },
  chipText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  chipTextSelected: { color: colors.text },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: "800" },
  sectionCaption: { color: colors.textFaint, fontSize: 13, marginTop: 4 },
});
