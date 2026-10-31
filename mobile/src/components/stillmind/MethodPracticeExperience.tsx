import { StyleSheet, Text, View } from "react-native";
import type { MethodId } from "@stillmind/domain";
import { colors, spacing } from "@/constants/theme";
import { methodRenderers } from "@/components/stillmind/methods/registry";

export function MethodPracticeExperience({ methodId, title, instruction, stepIndex, stepCount, trigger = "", paused = false }: {
  methodId: MethodId; title: string; instruction: string; stepIndex: number; stepCount: number;
  seconds: number; trigger?: string; paused?: boolean; elapsedSeconds?: number;
}) {
  const MethodExperience = methodRenderers[methodId];
  return <View style={styles.shell}>
    <View style={styles.headingCopy}><Text style={styles.stepCount}>{String(stepIndex + 1).padStart(2, "0")} / {String(stepCount).padStart(2, "0")}</Text><Text style={styles.title}>{title}</Text></View>
    <View style={styles.experience}><MethodExperience methodId={methodId} instruction={instruction} trigger={trigger} stepIndex={stepIndex} paused={paused} /></View>
    <Text style={styles.instruction}>{instruction}</Text>
  </View>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, gap: spacing.md },
  headingCopy: { gap: 5 },
  stepCount: { color: colors.textFaint, fontSize: 11, fontWeight: "500", letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 18, lineHeight: 26, fontWeight: "500" },
  experience: { flex: 1, minHeight: 250, justifyContent: "center", gap: spacing.md },
  instruction: { color: colors.text, fontSize: 20, lineHeight: 32, fontWeight: "400", textAlign: "center" },
});
