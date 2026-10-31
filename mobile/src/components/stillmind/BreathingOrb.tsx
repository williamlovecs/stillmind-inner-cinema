import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

export function BreathingOrb({ phase, seconds, compact = false, paused = false, elapsedSeconds }: { phase?: "吸气" | "呼气"; seconds?: number; compact?: boolean; paused?: boolean; elapsedSeconds?: number }) {
  const [scale] = useState(() => new Animated.Value(0.94));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (active) setReduceMotion(enabled); }).catch(() => { if (active) setReduceMotion(true); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    if (paused || elapsedSeconds !== undefined) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(scale, { toValue: 0.94, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== "web" }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, scale, paused, elapsedSeconds]);

  useEffect(() => {
    if (reduceMotion || paused || elapsedSeconds === undefined) return;
    // Controlled by the same active clock as phase text; pausing freezes both.
    const phaseSeconds = elapsedSeconds % 6;
    const fraction = phaseSeconds <= 3 ? phaseSeconds / 3 : (6 - phaseSeconds) / 3;
    scale.setValue(0.94 + 0.14 * (1 - Math.cos(Math.PI * fraction)) / 2);
  }, [elapsedSeconds, paused, reduceMotion, scale]);

  const size = compact ? 132 : 190;
  return (
    <View style={[styles.stage, { height: size + 64 }]} accessible accessibilityLabel={phase ? `${phase}，剩余 ${seconds ?? 0} 秒` : "观察者光圈"}>
      <View style={[styles.halo, { width: size * 1.45, height: size * 1.45, borderRadius: size }]} />
      <View style={[styles.orbit, { width: size * 1.25, height: size * 1.25, borderRadius: size }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}>
          {typeof seconds === "number" ? <Text style={[styles.seconds, compact && styles.secondsCompact]}>{seconds}</Text> : <View style={styles.core} />}
          {phase ? <Text style={styles.phase}>{phase.split("").join(" ")}</Text> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", backgroundColor: colors.surfaceSoft },
  orbit: { position: "absolute", borderWidth: 1, borderColor: colors.borderStrong },
  orb: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceQuiet },
  core: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent },
  seconds: { color: colors.text, fontSize: 56, lineHeight: 60, fontWeight: "500", fontVariant: ["tabular-nums"] },
  secondsCompact: { fontSize: 42, lineHeight: 46 },
  phase: { color: colors.textMuted, fontSize: 15, fontWeight: "500", letterSpacing: 3, marginTop: 5 },
});
