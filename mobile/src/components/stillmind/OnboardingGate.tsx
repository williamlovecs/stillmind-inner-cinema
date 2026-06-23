import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, radii, spacing } from "@/constants/theme";
import { PrimaryButton, SecondaryButton, type } from "./ui";
import { BreathingOrb } from "./BreathingOrb";
import { useApp } from "@/state/AppProvider";
import { track } from "@/lib/analytics";

const PAGES = [
  { icon: "film-outline" as const, title: "看见正在发生的电影", body: "StillMind 帮你从角色退到观众席，再选择下一步。它不是治疗或紧急支持。" },
  { icon: "lock-closed-outline" as const, title: "默认留在你的手机里", body: "练习记录默认本地保存。只有你主动开启 AI 时，相关文字才会发送到服务端。" },
  { icon: "options-outline" as const, title: "方法适合你，而不是定义你", body: "你可以选择睁眼、避开身体关注或不改变呼吸。推荐随时能换。" },
];

export function OnboardingGate() {
  const { ready, preferences, updatePreferences } = useApp();
  const [page, setPage] = useState(0);

  if (!ready) {
    return <View style={styles.loading}><ActivityIndicator color={colors.lavender} /><Text style={styles.loadingText}>StillMind</Text></View>;
  }
  if (preferences.onboardingComplete) return null;
  const item = PAGES[page];
  const completeOnboarding = () => {
    track("onboarding_completed", { eyes_open: preferences.eyesOpenPreferred, body_focus: preferences.bodyFocusAllowed, breath_change: preferences.breathChangeAllowed });
    void updatePreferences({ onboardingComplete: true });
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <LinearGradient colors={gradients.background} style={styles.modal}>
        <View style={styles.top}><Text style={styles.brand}>STILLMIND</Text><Text style={styles.step}>{page + 1} / {PAGES.length}</Text></View>
        <View style={styles.content}>
          {page === 0 ? <BreathingOrb compact /> : <View style={styles.iconWrap}><Ionicons name={item.icon} size={34} color={colors.lavender} /></View>}
          <Text style={type.h1}>{item.title}</Text>
          <Text style={[type.body, styles.center]}>{item.body}</Text>
          {page === 2 ? (
            <View style={styles.choices}>
              {[{ key: "eyesOpenPreferred", label: "优先睁眼练习" }, { key: "bodyFocusAllowed", label: "允许身体关注" }, { key: "breathChangeAllowed", label: "允许调整呼吸" }].map((choice) => {
                const key = choice.key as "eyesOpenPreferred" | "bodyFocusAllowed" | "breathChangeAllowed";
                const selected = preferences[key];
                return <Pressable key={key} onPress={() => updatePreferences({ [key]: !selected })} style={[styles.choice, selected && styles.choiceSelected]}><Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? colors.lavender : colors.textFaint} /><Text style={styles.choiceText}>{choice.label}</Text></Pressable>;
              })}
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          {page > 0 ? <SecondaryButton label="上一步" onPress={() => setPage((value) => value - 1)} style={styles.half} /> : null}
          <PrimaryButton label={page === PAGES.length - 1 ? "进入 StillMind" : "继续"} onPress={() => page === PAGES.length - 1 ? completeOnboarding() : setPage((value) => value + 1)} style={page > 0 ? styles.half : undefined} />
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loading: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 14, zIndex: 100 },
  loadingText: { color: colors.text, letterSpacing: 4, fontWeight: "800" },
  modal: { flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 34 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: colors.text, fontSize: 14, fontWeight: "800", letterSpacing: 4 },
  step: { color: colors.textFaint, fontSize: 13 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  center: { textAlign: "center", maxWidth: 330 },
  iconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(116,87,216,0.2)", borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  choices: { alignSelf: "stretch", gap: 10, marginTop: 4 },
  choice: { minHeight: 54, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radii.medium, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  choiceSelected: { borderColor: colors.borderStrong, backgroundColor: "rgba(116,87,216,0.22)" },
  choiceText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  footer: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
});
