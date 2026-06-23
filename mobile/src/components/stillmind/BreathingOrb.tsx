import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/theme";

export function BreathingOrb({ phase, seconds, compact = false }: { phase?: "吸气" | "呼气"; seconds?: number; compact?: boolean }) {
  const [scale] = useState(() => new Animated.Value(0.94));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (active) setReduceMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(scale, { toValue: 0.94, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, scale]);

  const size = compact ? 132 : 190;
  return (
    <View style={[styles.stage, { height: size + 64 }]} accessible accessibilityLabel={phase ? `${phase}，剩余 ${seconds ?? 0} 秒` : "观察者光圈"}>
      <View style={[styles.halo, { width: size * 1.45, height: size * 1.45, borderRadius: size }]} />
      <View style={[styles.orbit, { width: size * 1.25, height: size * 1.25, borderRadius: size }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={["#EAE4FF", "#9A79E5", "#22304C", "#0A0E1B"]} locations={[0, 0.22, 0.58, 1]} start={{ x: 0.28, y: 0.2 }} end={{ x: 0.85, y: 0.92 }} style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}>
          {typeof seconds === "number" ? <Text style={[styles.seconds, compact && styles.secondsCompact]}>{seconds}</Text> : <View style={styles.core} />}
          {phase ? <Text style={styles.phase}>{phase.split("").join(" ")}</Text> : null}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", backgroundColor: "rgba(124, 87, 216, 0.12)", shadowColor: colors.violet, shadowOpacity: 0.8, shadowRadius: 44 },
  orbit: { position: "absolute", borderWidth: 1, borderColor: "rgba(216, 180, 254, 0.18)" },
  orb: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(244, 182, 106, 0.35)", shadowColor: colors.lavender, shadowOpacity: 0.58, shadowRadius: 28 },
  core: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.64)", shadowColor: colors.white, shadowOpacity: 0.9, shadowRadius: 18 },
  seconds: { color: colors.white, fontSize: 56, lineHeight: 60, fontWeight: "800", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 8 },
  secondsCompact: { fontSize: 42, lineHeight: 46 },
  phase: { color: "#F0E9FF", fontSize: 15, fontWeight: "700", letterSpacing: 3, marginTop: 5, textShadowColor: "rgba(216,180,254,0.75)", textShadowRadius: 12 },
});
