import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { OBSERVER_LENSES } from "@stillmind/domain";
import { colors } from "@/constants/theme";

type ObserverLens = (typeof OBSERVER_LENSES)[number];
const LENS_NAMES: Record<ObserverLens["id"], string> = {
  role: "角色视角",
  audience: "观众视角",
  witness: "见证视角",
};

export function InnerCinemaScene({
  subject,
  lens,
  lensIndex,
  paused,
  onLensChange,
}: {
  subject: string;
  lens: ObserverLens;
  lensIndex: number;
  paused: boolean;
  onLensChange: (index: number) => void;
}) {
  const [position] = useState(() => new Animated.Value(lensIndex));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (active) setReduceMotion(enabled); })
      .catch(() => { if (active) setReduceMotion(true); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (paused) {
      position.stopAnimation();
      return;
    }
    const animation = Animated.timing(position, {
      toValue: lensIndex,
      duration: reduceMotion ? 0 : 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => { animation.stop(); };
  }, [lensIndex, paused, position, reduceMotion]);

  const roomOpacity = position.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0.72, 1] });
  const floorOpacity = position.interpolate({ inputRange: [0, 1, 2], outputRange: [0.08, 0.42, 0.72] });
  const screenTranslateY = position.interpolate({ inputRange: [0, 1, 2], outputRange: [14, 0, -12] });

  return (
    <View style={styles.wrapper}>
      <View testID="observer-stage" style={styles.stage}>
        <View accessible={false} style={styles.ambientGlow} />
        <Animated.View accessible={false} style={[styles.proscenium, { opacity: roomOpacity }]} />
        <Animated.View accessible={false} style={[styles.floor, { opacity: floorOpacity }]} />
        <Animated.View
          testID="observer-screen"
          style={[styles.screen, { width: `${lens.width}%`, transform: [{ translateY: screenTranslateY }] }]}
        >
          <Text style={styles.subject}>{subject}</Text>
        </Animated.View>
        <Animated.View accessible={false} style={[styles.backSeats, { opacity: roomOpacity }]}>
          <View style={styles.backSeat} /><View style={styles.backSeat} /><View style={styles.backSeat} />
        </Animated.View>
        <Animated.View accessible={false} style={[styles.observerSeat, { opacity: roomOpacity }]} />
        <View accessible={false} style={styles.sceneMeta} pointerEvents="none">
          <Text style={styles.sceneMetaText}>{LENS_NAMES[lens.id]}</Text>
          <Text style={styles.sceneMetaMuted}>同一句话</Text>
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.hint}>
        <Text style={styles.hintTitle}>{LENS_NAMES[lens.id]}</Text>
        {"  "}{lens.hint}
      </Text>
      <View style={styles.controlLabelRow}>
        <Text style={styles.controlLabel}>观看位置</Text>
        <Text style={styles.controlLabel}>可随时切回</Text>
      </View>
      <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel="观看距离">
        {OBSERVER_LENSES.map((item, index) => (
          <Pressable
            disabled={paused}
            accessibilityRole="button"
            accessibilityState={{ selected: index === lensIndex, disabled: paused }}
            key={item.id}
            onPress={() => onLensChange(index)}
            style={({ pressed }) => [styles.segment, index === lensIndex && styles.segmentActive, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, index === lensIndex && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  stage: {
    minHeight: 310,
    overflow: "hidden",
    paddingTop: 42,
    paddingHorizontal: 18,
    paddingBottom: 66,
    borderRadius: 4,
    backgroundColor: "#252A26",
    alignItems: "center",
    justifyContent: "center",
  },
  ambientGlow: { display: "none" },
  proscenium: {
    position: "absolute",
    top: 16,
    right: 14,
    bottom: 24,
    left: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#59604D",
  },
  floor: {
    position: "absolute",
    right: -70,
    bottom: -92,
    left: -70,
    height: 190,
    borderTopWidth: 1,
    borderColor: "#68705B",
    backgroundColor: "#30362C",
    transform: [{ perspective: 700 }, { rotateX: "58deg" }],
  },
  screen: {
    minHeight: 196,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 26,
    borderRadius: 2,
    backgroundColor: "#ECE7D9",
    shadowColor: "#11150F",
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 12 },
    elevation: 4,
  },
  subject: {
    color: "#343A31",
    fontSize: 21,
    lineHeight: 36,
    fontWeight: "400",
    textAlign: "center",
  },
  backSeats: { position: "absolute", bottom: 30, flexDirection: "row", gap: 28 },
  backSeat: {
    width: 42,
    height: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#59604D",
    backgroundColor: "#2D332A",
  },
  observerSeat: {
    position: "absolute",
    bottom: 10,
    width: 88,
    height: 48,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 1,
    borderColor: "#68705B",
    backgroundColor: "#30362C",
  },
  sceneMeta: { display: "none" },
  sceneMetaText: { color: colors.textMuted, fontSize: 10 },
  sceneMetaMuted: { color: colors.textFaint, fontSize: 10 },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center" },
  hintTitle: { color: colors.accentStrong, fontWeight: "500" },
  controlLabelRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 3 },
  controlLabel: { color: colors.textFaint, fontSize: 10 },
  segmented: { flexDirection: "row", gap: 7 },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  segmentActive: { borderColor: colors.accent, borderBottomWidth: 2, backgroundColor: "transparent" },
  segmentText: { color: colors.textMuted, fontSize: 12, fontWeight: "500", textAlign: "center" },
  segmentTextActive: { color: colors.accentStrong },
  pressed: { opacity: 0.72 },
});
