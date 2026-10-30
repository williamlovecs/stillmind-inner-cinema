import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { OBSERVER_LENSES, observationText, observerFrame, type MethodId } from "@stillmind/domain";
import { colors, radii, spacing } from "@/constants/theme";
import { InnerCinemaScene } from "@/components/stillmind/InnerCinemaScene";

const BODY_ZONES = [
  { id: "feet", label: "脚底", quality: "支撑" },
  { id: "hands", label: "手掌", quality: "温度" },
  { id: "chest", label: "胸口", quality: "起伏" },
  { id: "shoulders", label: "肩颈", quality: "松紧" },
] as const;
const AWARENESS_FIELDS = ["声音", "身体", "念头", "空间"] as const;
const ZOOM_LEVELS = [
  { label: "近景", body: "刚才的一句话或一个表情", scale: 1 },
  { label: "今天", body: "它只是今天的一小段", scale: 0.82 },
  { label: "城市", body: "它只是城市里的一盏灯", scale: 0.64 },
  { label: "地球", body: "把它放进更大的时间线", scale: 0.46 },
] as const;

export function MethodPracticeExperience({
  methodId,
  title,
  instruction,
  stepIndex,
  stepCount,
  trigger = "",
  paused = false,
}: {
  methodId: MethodId;
  title: string;
  instruction: string;
  stepIndex: number;
  stepCount: number;
  seconds: number;
  trigger?: string;
  paused?: boolean;
  elapsedSeconds?: number;
}) {
  const [noticed, setNoticed] = useState(false);
  const [observerName, setObserverName] = useState("");
  const [observerSentence, setObserverSentence] = useState(trigger);
  const [hidden, setHidden] = useState(false);
  const [bodyZone, setBodyZone] = useState<(typeof BODY_ZONES)[number]["id"]>("feet");
  const [contact, setContact] = useState(false);
  const [awarenessFields, setAwarenessFields] = useState<string[]>([]);
  const [objectName, setObjectName] = useState("");
  const [externalObject, setExternalObject] = useState(false);
  const [returns, setReturns] = useState(0);
  const [manualZoomLevel, setManualZoomLevel] = useState<number>();
  const [exhaleTaps, setExhaleTaps] = useState(0);
  const [cinemaLensIndex, setCinemaLensIndex] = useState(0);

  const zoomLevel = manualZoomLevel ?? Math.min(stepIndex, ZOOM_LEVELS.length - 1);
  const selectedZone = BODY_ZONES.find((item) => item.id === bodyZone) ?? BODY_ZONES[0];
  const subject = observationText(trigger);
  const cinemaLens = OBSERVER_LENSES[cinemaLensIndex];

  function toggleAwareness(field: string) {
    setAwarenessFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  }

  if (methodId === "paced-breath") {
    return <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
      <View style={styles.naturalBreathStage}>
        <Pressable disabled={paused} accessibilityRole="button" accessibilityLabel="轻点记一次数"
          onPress={() => setExhaleTaps((value) => value + 1)} style={styles.naturalBreath}>
          <Text accessibilityLiveRegion="polite" style={styles.naturalBreathText}>{exhaleTaps ? `轻点 ${exhaleTaps}` : "自然呼吸"}</Text>
        </Pressable>
      </View>
      <Text style={styles.helper}>呼气时心里数一下，也可以轻点记数。不点也可以。</Text>
      {exhaleTaps > 0 ? <Pressable disabled={paused} accessibilityRole="button" onPress={() => setExhaleTaps(0)} style={styles.action}><Text style={styles.actionText}>重新数</Text></Pressable> : null}
    </ExperienceShell>;
  }

  if (methodId === "wide-gaze") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <Pressable disabled={paused} accessibilityRole="button" accessibilityLabel="走神了，点一下回到烛光"
          onPress={() => setReturns((value) => value + 1)}
          style={({ pressed }) => [styles.candleStage, pressed && styles.pressed]}
        >
          <View style={styles.candleGlow} />
          <View style={styles.flameOuter}><View style={styles.flameInner} /></View>
          <View style={styles.candleBody} />
          <Text style={styles.stageHint}>走神时点一下，回到火焰</Text>
        </Pressable>
        <Metric label="主动点击次数" value={`${returns} 次`} />
      </ExperienceShell>
    );
  }

  if (methodId === "thought-watching") {
    return <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
      <View style={styles.thoughtField}><Text style={styles.cinemaCopy}>{subject}</Text></View>
      <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: noticed }} onPress={() => setNoticed(!noticed)} style={styles.action}>
        <Text style={styles.actionText}>{noticed ? "撤销标记" : "注意到了"}</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.helper}>{noticed ? "已记下这次主动标记。" : "不需要点，也不需要让念头消失。"}</Text>
    </ExperienceShell>;
  }

  if (methodId === "inner-cinema") {
    return <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
      <InnerCinemaScene subject={subject} lens={cinemaLens} lensIndex={cinemaLensIndex} paused={paused} onLensChange={setCinemaLensIndex} />
    </ExperienceShell>;
  }

  if (methodId === "person-shift") {
    return <ExperienceShell title={title} instruction="保留原句，试着用名字描述“注意到这句话”。" stepIndex={stepIndex} stepCount={stepCount}>
      <View style={styles.inputStack}>
        <TextInput accessibilityLabel="用于人称替代的名字" editable={!paused} value={observerName} onChangeText={setObserverName} maxLength={40} placeholder="昵称或代称（可不填）" placeholderTextColor={colors.textFaint} style={styles.input} />
        <TextInput accessibilityLabel="需要转换为旁观语言的念头" editable={!paused} value={observerSentence} onChangeText={setObserverSentence} maxLength={500} placeholder="写一句脑内正在说的话（可不填）" placeholderTextColor={colors.textFaint} multiline style={[styles.input, styles.multiline]} />
      </View>
      {observerSentence.trim() ? <Comparison label="试着这样读" value={observerFrame(observerSentence, observerName)} /> : <Text style={styles.helper}>也可以只在心里试，不需要输入。</Text>}
    </ExperienceShell>;
  }

  if (methodId === "logout-pause") {
    return <ExperienceShell title={title} instruction={hidden ? "暂时不接触这句话，也可以随时回来。" : "看见它，先不解释，也不急着回应。"} stepIndex={stepIndex} stepCount={stepCount}>
      <View testID="logout-subject" style={styles.thoughtField}><Text style={styles.cinemaCopy}>{hidden ? "先看看周围，不用继续读这句话。" : subject}</Text></View>
      <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: hidden }} onPress={() => setHidden(!hidden)} style={styles.action}>
        <Text style={styles.actionText}>{hidden ? "重新显示这句话" : "暂时收起这句话"}</Text>
      </Pressable>
    </ExperienceShell>;
  }

  if (methodId === "body-scan") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.bodyMap}>
          {BODY_ZONES.map((zone) => (
            <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: bodyZone === zone.id, disabled: paused }} key={zone.id} onPress={() => setBodyZone(zone.id)} style={[styles.bodyZone, bodyZone === zone.id && styles.bodyZoneActive]}>
              <Text style={[styles.bodyZoneText, bodyZone === zone.id && styles.bodyZoneTextActive]}>{zone.label}</Text>
            </Pressable>
          ))}
        </View>
        <Metric label="只观察，不解释" value={selectedZone.label} />
        <Text style={styles.helper}>留意真实感觉；也可以没有明显感觉。不舒服的部位可以跳过。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "release") {
    return (
      <ExperienceShell title={title} instruction={contact ? instruction : "先不回想那件事。看一件中性物品，感受脚底的支撑。"} stepIndex={stepIndex} stepCount={stepCount}>
        <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: contact, disabled: paused }} onPress={() => setContact(!contact)} style={styles.action}>
          <Text style={styles.actionText}>{contact ? "暂不接触这件事" : "愿意继续观察反应"}</Text>
        </Pressable>
        <Text style={styles.helper}>只改变本次引导，不代表已宽恕，也不要求和解或联系对方。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "open-awareness") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.awarenessStage}>
          <View style={styles.awarenessRing} />
          <View style={styles.wrapCentered}>
            {AWARENESS_FIELDS.map((field) => (
              <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: awarenessFields.includes(field), disabled: paused }} key={field} onPress={() => toggleAwareness(field)} style={[styles.awarenessChip, awarenessFields.includes(field) && styles.awarenessChipActive]}>
                <Text style={[styles.awarenessText, awarenessFields.includes(field) && styles.awarenessTextActive]}>{field}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.helper}>主动标记：{awarenessFields.join("、") || "暂无"}。不需要凑齐，也可以什么都不标记。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "grounded-action") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <Text style={styles.helper}>把手机放低，看一件身边真实的物品。不需要拍照或点击来证明专注。</Text>
        <TextInput accessibilityLabel="本次观察的真实物品" editable={!paused} value={objectName} onChangeText={setObjectName} maxLength={60} placeholder="可记下物品或细节，也可以不写" placeholderTextColor={colors.textMuted} style={styles.input} />
        {objectName.trim() ? <Metric label="本次对象" value={objectName} /> : null}
      </ExperienceShell>
    );
  }

  if (methodId === "trigger-journal") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View testID="steady-object" style={styles.stabilityStage}>
          {externalObject ? <Text style={styles.helper}>看一件身边静止的物品，或听一个平稳的声音。</Text> : <View accessible accessibilityLabel="静止的观察方框" style={{ width: 96, height: 96, borderWidth: 2, borderColor: colors.textMuted }} />}
        </View>
        <Pressable disabled={paused} accessibilityRole="button" onPress={() => setExternalObject(!externalObject)} style={styles.action}><Text style={styles.actionText}>{externalObject ? "回到屏幕对象" : "改看身边的物品"}</Text></Pressable>
        <Text style={styles.helper}>画面本来就是静止的，不评判你的注意力。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "anchors") {
    const active = ZOOM_LEVELS[zoomLevel];
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.zoomStage}>
          <View style={[styles.earth, { transform: [{ scale: active.scale }] }]} />
          <View style={[styles.zoomOrbit, { transform: [{ scale: 0.7 + zoomLevel * 0.16 }] }]} />
        </View>
        <View style={styles.segmented}>
          {ZOOM_LEVELS.map((item, index) => (
            <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: zoomLevel === index }} key={item.label} onPress={() => setManualZoomLevel(index)} style={[styles.segment, zoomLevel === index && styles.segmentActive]}>
              <Text style={[styles.segmentText, zoomLevel === index && styles.segmentTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Metric label={active.label} value={active.body} />
      </ExperienceShell>
    );
  }

  return (
    <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
      <View style={styles.fallback}><Text style={styles.fallbackText}>只跟着这一句做，不需要理解整套方法。</Text></View>
    </ExperienceShell>
  );
}

function ExperienceShell({ title, instruction, stepIndex, stepCount, children }: { title: string; instruction: string; stepIndex: number; stepCount: number; children: React.ReactNode }) {
  return (
    <View style={styles.shell}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}><Text style={styles.stepCount}>{String(stepIndex + 1).padStart(2, "0")} / {String(stepCount).padStart(2, "0")}</Text><Text style={styles.title}>{title}</Text></View>
      </View>
      <View style={styles.experience}>{children}</View>
      <Text style={styles.instruction}>{instruction}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function Comparison({ label, value, warm = false }: { label: string; value: string; warm?: boolean }) {
  return <View style={[styles.comparison, warm && styles.comparisonWarm]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.comparisonText}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  naturalBreathStage: { minHeight: 240, alignItems: "center", justifyContent: "center" },
  naturalBreath: { width: 176, height: 176, borderRadius: 88, borderWidth: 1, borderColor: colors.blue, backgroundColor: "rgba(103,183,232,0.1)", alignItems: "center", justifyContent: "center" },
  naturalBreathText: { color: colors.text, fontSize: 20, fontWeight: "700" },
  cinemaScreen: { minHeight: 210, justifyContent: "center", padding: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#182238" },
  observerSeat: { position: "absolute", bottom: 0, width: 100, borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#090C17" },
  shell: { flex: 1, gap: spacing.md },
  heading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
  headingCopy: { flex: 1, gap: 5 },
  stepCount: { color: colors.textFaint, fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  title: { color: colors.lavender, fontSize: 18, fontWeight: "800" },
  experience: { flex: 1, minHeight: 250, justifyContent: "center", gap: spacing.sm },
  instruction: { color: colors.text, fontSize: 21, lineHeight: 30, fontWeight: "700", textAlign: "center" },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 19, textAlign: "center" },
  pressed: { transform: [{ scale: 0.985 }] },
  candleStage: { minHeight: 230, borderRadius: radii.large, borderWidth: 1, borderColor: "rgba(244,182,106,0.18)", backgroundColor: "#080D1C", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  candleGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(244,182,106,0.1)" },
  flameOuter: { width: 48, height: 78, borderRadius: 38, borderBottomLeftRadius: 24, backgroundColor: "#F4B66A", alignItems: "center", justifyContent: "flex-end", paddingBottom: 12, shadowColor: colors.amber, shadowOpacity: 0.8, shadowRadius: 26 },
  flameInner: { width: 20, height: 38, borderRadius: 16, backgroundColor: "#FFF2C2" },
  candleBody: { width: 54, height: 70, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#E7D8C4" },
  stageHint: { position: "absolute", bottom: 14, color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  metric: { borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, padding: 13, gap: 7 },
  metricLabel: { color: colors.textFaint, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: "800" },
  thoughtField: { minHeight: 250, borderRadius: radii.large, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(8,12,27,0.9)", alignItems: "center", justifyContent: "center", padding: 18, gap: 18 },
  observerCore: { width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.14)", alignItems: "center", justifyContent: "center", shadowColor: colors.violet, shadowOpacity: 0.5, shadowRadius: 24 },
  observerCoreText: { color: colors.lavender, fontSize: 12, fontWeight: "800" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  wrapCentered: { flexDirection: "row", flexWrap: "wrap", gap: 9, justifyContent: "center", zIndex: 2 },
  thoughtChip: { borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, paddingHorizontal: 12, paddingVertical: 9 },
  thoughtFaded: { opacity: 0.42 },
  thoughtText: { color: colors.textMuted, fontSize: 12 },
  cinema: { minHeight: 300, borderRadius: radii.large, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#050914", padding: 12, alignItems: "center", justifyContent: "center", gap: 24, shadowColor: colors.violet, shadowOpacity: 0.3, shadowRadius: 28 },
  sceneLabel: { color: colors.textFaint, fontSize: 11, fontWeight: "700", letterSpacing: 3 },
  cinemaCopy: { color: colors.text, fontSize: 24, lineHeight: 34, fontWeight: "800", textAlign: "center" },
  lensTrack: { flexDirection: "row", gap: 7, alignItems: "center" },
  lensDot: { borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 7 },
  lensDotActive: { borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.14)" },
  lensText: { color: colors.textFaint, fontSize: 10, fontWeight: "700" },
  lensTextActive: { color: colors.lavender },
  inputStack: { gap: 8 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radii.medium, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 13, paddingVertical: 11 },
  multiline: { minHeight: 76, textAlignVertical: "top" },
  comparison: { borderRadius: radii.medium, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.1)", padding: 13, gap: 7 },
  comparisonWarm: { borderColor: "rgba(244,182,106,0.3)", backgroundColor: "rgba(244,182,106,0.08)" },
  comparisonText: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "700" },
  segmented: { flexDirection: "row", gap: 7 },
  segment: { flex: 1, minHeight: 46, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  action: { flexGrow: 0, flexShrink: 0, minHeight: 48, paddingVertical: 12, paddingHorizontal: 16, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  actionText: { color: colors.text, fontSize: 14, fontWeight: "600", textAlign: "center" },
  segmentActive: { borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.16)" },
  segmentWarm: { borderColor: "rgba(244,182,106,0.34)", backgroundColor: "rgba(244,182,106,0.1)" },
  segmentText: { color: colors.textMuted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  segmentTextActive: { color: colors.text },
  metricLabels: { flexDirection: "row", justifyContent: "space-between" },
  track: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  trackFill: { height: 7, borderRadius: 4, backgroundColor: colors.lavender },
  bodyMap: { minHeight: 245, borderRadius: 130, borderWidth: 1, borderColor: "rgba(103,183,232,0.2)", backgroundColor: "rgba(103,183,232,0.05)", padding: 24, justifyContent: "space-around" },
  bodyZone: { minHeight: 44, borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  bodyZoneActive: { borderColor: "rgba(103,183,232,0.6)", backgroundColor: "rgba(103,183,232,0.16)" },
  bodyZoneText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  bodyZoneTextActive: { color: "#D9F3FF" },
  boundaryStage: { minHeight: 210, alignItems: "center", justifyContent: "center" },
  boundaryRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  boundaryNear: { transform: [{ scale: 0.72 }], borderColor: colors.rose },
  boundaryMiddle: { transform: [{ scale: 1 }], borderColor: colors.amber },
  boundaryFar: { transform: [{ scale: 1.26 }], borderColor: colors.lavender },
  boundaryCore: { width: 62, height: 62, borderRadius: 31, backgroundColor: "rgba(226,138,146,0.2)", shadowColor: colors.rose, shadowOpacity: 0.55, shadowRadius: 22 },
  awarenessStage: { minHeight: 240, alignItems: "center", justifyContent: "center" },
  awarenessRing: { position: "absolute", width: 230, height: 230, borderRadius: 115, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.04)" },
  awarenessChip: { borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, paddingHorizontal: 16, paddingVertical: 11 },
  awarenessChipActive: { borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.16)" },
  awarenessText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  awarenessTextActive: { color: colors.lavender },
  focusStage: { minHeight: 230, alignItems: "center", justifyContent: "center" },
  focusRing: { position: "absolute", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  focusRingActive: { borderColor: colors.amber, backgroundColor: "rgba(244,182,106,0.08)" },
  focusRingText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  stabilityStage: { minHeight: 240, borderRadius: radii.large, borderWidth: 1, borderColor: "rgba(126,213,195,0.22)", backgroundColor: "#07141B", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  stabilityHeld: { transform: [{ scale: 0.985 }], opacity: 0.86 },
  stabilityPattern: { width: 180, height: 180, borderRadius: 32, borderWidth: 18, borderColor: "rgba(126,213,195,0.25)", backgroundColor: "rgba(155,135,245,0.08)" },
  zoomStage: { minHeight: 220, alignItems: "center", justifyContent: "center" },
  earth: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.blue, borderWidth: 12, borderColor: "#214B87", shadowColor: colors.blue, shadowOpacity: 0.65, shadowRadius: 28, zIndex: 2 },
  zoomOrbit: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: colors.borderStrong },
  fallback: { minHeight: 230, borderRadius: radii.large, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  fallbackText: { color: colors.textMuted, fontSize: 14, lineHeight: 22, textAlign: "center" },
});
