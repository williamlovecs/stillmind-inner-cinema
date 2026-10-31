import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";
import type { MethodId } from "@stillmind/domain";

export type MethodInteractionProps = { methodId: MethodId; instruction: string; trigger: string; stepIndex: number; paused: boolean };
export function Stage({ children, style, testID }: PropsWithChildren<{ style?: ViewStyle; testID?: string }>) { return <View testID={testID} style={[styles.stage, style]}>{children}</View>; }
export function ChoiceRow({ children }: PropsWithChildren) { return <View style={styles.row}>{children}</View>; }
export function OriginalText({ children, testID }: PropsWithChildren<{ testID?: string }>) { return <Text testID={testID} style={styles.original}>{children}</Text>; }
export function Note({ children, center = true }: PropsWithChildren<{ center?: boolean }>) { return <Text style={[styles.helper, center && styles.center]}>{children}</Text>; }
export const methodStyles = StyleSheet.create({
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.surfaceQuiet, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, lineHeight: 24 },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  notice: { borderLeftWidth: 2, borderLeftColor: colors.warm, backgroundColor: colors.surfaceQuiet, padding: 14, gap: 6 },
  noticeText: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  selectedTitle: { color: colors.text, fontSize: 26, lineHeight: 34, fontWeight: "600", textAlign: "center" },
});
const styles = StyleSheet.create({
  stage: { minHeight: 200, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.large, backgroundColor: colors.surfaceQuiet, alignItems: "center", justifyContent: "center", gap: 14, overflow: "hidden" },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  original: { color: colors.text, fontSize: 20, lineHeight: 32, textAlign: "center", paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  helper: { color: colors.textMuted, fontSize: 13, lineHeight: 21 },
  center: { textAlign: "center" },
});
