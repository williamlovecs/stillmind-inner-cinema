import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MethodId } from "@stillmind/domain";
import { BreathingOrb } from "@/components/stillmind/BreathingOrb";
import { colors, radii, spacing } from "@/constants/theme";

type ThoughtState = "升起" | "停留" | "落下";

const THOUGHTS = ["我必须回应", "是不是我不够好", "他们不理解我", "我不能输"] as const;
const BODY_ZONES = [
  { id: "feet", label: "脚底", quality: "支撑" },
  { id: "hands", label: "手掌", quality: "温度" },
  { id: "chest", label: "胸口", quality: "起伏" },
  { id: "shoulders", label: "肩颈", quality: "松紧" },
] as const;
const AWARENESS_FIELDS = ["声音", "身体", "念头", "空间"] as const;
const FOCUS_LEVELS = [
  { label: "环境", value: "看见整个房间" },
  { label: "对象", value: "选一个普通物体" },
  { label: "细节", value: "只看边缘与纹理" },
  { label: "触感", value: "加入脚底或手掌" },
] as const;
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
  seconds,
  trigger = "",
  paused = false,
  elapsedSeconds = 0,
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
  const [thoughtStates, setThoughtStates] = useState<Record<string, ThoughtState>>({});
  const [observerName, setObserverName] = useState("这个人");
  const [observerSentence, setObserverSentence] = useState(trigger.trim() || "我现在很想证明自己没错。");
  const [manualLogoutMode, setManualLogoutMode] = useState<"解释" | "参与" | "只读">();
  const [bodyZone, setBodyZone] = useState<(typeof BODY_ZONES)[number]["id"]>("feet");
  const [boundary, setBoundary] = useState<"靠近" | "保持距离" | "暂不接触">("保持距离");
  const [awarenessFields, setAwarenessFields] = useState<string[]>(["声音"]);
  const [manualFocusLevel, setManualFocusLevel] = useState<number>();
  const [returns, setReturns] = useState(0);
  const [holding, setHolding] = useState(false);
  const [stability, setStability] = useState(32);
  const [manualZoomLevel, setManualZoomLevel] = useState<number>();
  const [exhaleTaps, setExhaleTaps] = useState(0);
  const [manualCinemaLens, setManualCinemaLens] = useState<number>();

  useEffect(() => {
    if (methodId !== "trigger-journal" || paused) return;
    const timer = setInterval(() => {
      setStability((current) => Math.max(20, Math.min(100, current + (holding ? 4 : -1))));
    }, 260);
    return () => clearInterval(timer);
  }, [holding, methodId, paused]);

  useEffect(() => {
    if (!paused) return;
    const timer = setTimeout(() => setHolding(false), 0);
    return () => clearTimeout(timer);
  }, [paused]);

  const phase = Math.floor(elapsedSeconds / 3) % 2 === 0 ? "吸气" : "呼气";
  const logoutMode = manualLogoutMode ?? (stepIndex >= 2 ? "只读" : stepIndex === 1 ? "参与" : "解释");
  const focusLevel = manualFocusLevel ?? Math.min(stepIndex, FOCUS_LEVELS.length - 1);
  const zoomLevel = manualZoomLevel ?? Math.min(stepIndex, ZOOM_LEVELS.length - 1);
  const selectedZone = BODY_ZONES.find((item) => item.id === bodyZone) ?? BODY_ZONES[0];
  const shiftedSentence = observerSentence.replaceAll("我", observerName.trim() || "这个人");
  const thirdPersonSentence = `一个人正在经历：${observerSentence.replaceAll("我", "").trim()}`;
  const seenThoughts = Object.keys(thoughtStates).length;
  const cinemaLenses = [
    { label: "角色里", copy: "事情正在发生在我身上" },
    { label: "观众席", copy: "我正在看见这段反应" },
    { label: "见证位", copy: "念头经过，不必跟随" },
  ] as const;
  const cinemaLensIndex = manualCinemaLens ?? Math.min(stepIndex, 2);
  const cinemaLens = cinemaLenses[cinemaLensIndex];
  // Show the actual offline/AI step. A change of visual lens is not a measured mental change.
  const cinemaCopy = instruction;

  function cycleThought(thought: string) {
    setThoughtStates((current) => {
      const state = current[thought];
      const next = state === "升起" ? "停留" : state === "停留" ? "落下" : state === "落下" ? undefined : "升起";
      const copy = { ...current };
      if (next) copy[thought] = next;
      else delete copy[thought];
      return copy;
    });
  }

  function toggleAwareness(field: string) {
    setAwarenessFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]);
  }

  if (methodId === "paced-breath") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <Pressable disabled={paused} accessibilityRole="button" accessibilityLabel={phase === "呼气" ? "呼气时轻点记录一次" : "跟随吸气"} onPress={() => { if (phase === "呼气") setExhaleTaps((value) => value + 1); }} style={({ pressed }) => pressed && styles.pressed}>
          <BreathingOrb phase={phase} seconds={seconds} paused={paused} elapsedSeconds={elapsedSeconds} />
        </Pressable>
        <Metric label="主动轻点次数" value={exhaleTaps > 0 ? `${exhaleTaps} 次` : "呼气时可轻点"} />
        <Text style={styles.helper}>光圈只提示节奏，不检测呼吸。轻点可选；不舒服就停止。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "wide-gaze") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <Pressable disabled={paused}
          accessibilityLabel="走神了，点一下回到烛光"
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
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.thoughtField}>
          <View style={styles.observerCore}><Text style={styles.observerCoreText}>看见 {seenThoughts}</Text></View>
          <View style={styles.wrap}>
            {THOUGHTS.map((thought) => (
              <Pressable disabled={paused} key={thought} onPress={() => cycleThought(thought)} style={[styles.thoughtChip, thoughtStates[thought] === "落下" && styles.thoughtFaded]}>
                <Text style={styles.thoughtText}>{thought}{thoughtStates[thought] ? ` · ${thoughtStates[thought]}` : ""}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.helper}>这里是示例念头，不是系统对你的判断；不符合可以忽略。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "inner-cinema") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.cinema}>
          <Text style={styles.sceneLabel}>SCENE {String(stepIndex + 1).padStart(2, "0")}</Text>
          <Text style={styles.cinemaCopy}>{cinemaCopy}</Text>
          <View style={styles.lensTrack}>
            {cinemaLenses.map((item, index) => (
              <Pressable disabled={paused} accessibilityRole="button" accessibilityState={{ selected: index === cinemaLensIndex }} onPress={() => setManualCinemaLens(index)} key={item.label} style={[styles.lensDot, index === cinemaLensIndex && styles.lensDotActive]}>
                <Text style={[styles.lensText, index === cinemaLensIndex && styles.lensTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Metric label="当前画面视角" value={cinemaLens.label} />
        <Text style={styles.helper}>轻点三个视角，感受同一件事在不同观看位置里的变化。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "person-shift") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.inputStack}>
          <TextInput editable={!paused} value={observerName} onChangeText={setObserverName} placeholder="你的名字" placeholderTextColor={colors.textFaint} style={styles.input} />
          <TextInput editable={!paused} value={observerSentence} onChangeText={setObserverSentence} placeholder="写一句脑内正在说的话" placeholderTextColor={colors.textFaint} multiline style={[styles.input, styles.multiline]} />
        </View>
        <Comparison label="名字视角" value={shiftedSentence} />
        <Comparison label="再退一步" value={thirdPersonSentence} warm />
      </ExperienceShell>
    );
  }

  if (methodId === "logout-pause") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.segmented}>
          {(["解释", "参与", "只读"] as const).map((item) => (
            <Pressable disabled={paused} key={item} onPress={() => setManualLogoutMode(item)} style={[styles.segment, logoutMode === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, logoutMode === item && styles.segmentTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Metric label="当前画面模式" value={logoutMode} />
        <Text style={styles.helper}>{logoutMode === "只读" ? "现在先不解释，也不回应。让信息经过。" : "看见自己正在加入故事，然后试试切到“只读”。"}</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "body-scan") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.bodyMap}>
          {BODY_ZONES.map((zone) => (
            <Pressable disabled={paused} key={zone.id} onPress={() => setBodyZone(zone.id)} style={[styles.bodyZone, bodyZone === zone.id && styles.bodyZoneActive]}>
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
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.boundaryStage}>
          <View style={[styles.boundaryRing, boundary === "靠近" ? styles.boundaryNear : boundary === "暂不接触" ? styles.boundaryFar : styles.boundaryMiddle]}>
            <View style={styles.boundaryCore} />
          </View>
        </View>
        <View style={styles.segmented}>
          {(["靠近", "保持距离", "暂不接触"] as const).map((item) => (
            <Pressable disabled={paused} key={item} onPress={() => setBoundary(item)} style={[styles.segment, boundary === item && styles.segmentWarm]}>
              <Text style={[styles.segmentText, boundary === item && styles.segmentTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.helper}>接纳情绪不等于取消边界。选一个此刻更安全的距离。</Text>
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
              <Pressable disabled={paused} key={field} onPress={() => toggleAwareness(field)} style={[styles.awarenessChip, awarenessFields.includes(field) && styles.awarenessChipActive]}>
                <Text style={[styles.awarenessText, awarenessFields.includes(field) && styles.awarenessTextActive]}>{field}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.helper}>轻点加入或放下一个经验。练习的是让它们同时存在，不选谁当中心。</Text>
      </ExperienceShell>
    );
  }

  if (methodId === "grounded-action") {
    const active = FOCUS_LEVELS[focusLevel];
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <View style={styles.focusStage}>
          {FOCUS_LEVELS.map((item, index) => (
            <Pressable disabled={paused} key={item.label} onPress={() => setManualFocusLevel(index)} style={[styles.focusRing, { width: 210 - index * 38, height: 210 - index * 38, borderRadius: 120 - index * 18 }, focusLevel === index && styles.focusRingActive]}>
              {focusLevel === index ? <Text style={styles.focusRingText}>{item.label}</Text> : null}
            </Pressable>
          ))}
        </View>
        <Metric label={active.label} value={active.value} />
      </ExperienceShell>
    );
  }

  if (methodId === "trigger-journal") {
    return (
      <ExperienceShell title={title} instruction={instruction} stepIndex={stepIndex} stepCount={stepCount}>
        <Pressable disabled={paused}
          accessibilityLabel="按住画面，让波动慢下来"
          onPressIn={() => setHolding(true)}
          onPressOut={() => setHolding(false)}
          style={[styles.stabilityStage, holding && styles.stabilityHeld]}
        >
          <View style={[styles.stabilityPattern, { transform: [{ rotate: `${stability * 1.8}deg` }, { scale: 0.8 + stability / 500 }] }]} />
          <Text style={styles.stageHint}>{holding ? "正在稳定" : "按住画面"}</Text>
        </Pressable>
        <ProgressMetric label="画面转动" endLabel="画面变慢" value={stability} />
        <Text style={styles.helper}>这个变化来自按压操作，不代表身体或心理测量。</Text>
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
            <Pressable disabled={paused} key={item.label} onPress={() => setManualZoomLevel(index)} style={[styles.segment, zoomLevel === index && styles.segmentActive]}>
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

function ProgressMetric({ label, endLabel, value }: { label: string; endLabel: string; value: number }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricLabels}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricLabel}>{endLabel}</Text></View>
      <View style={styles.track}><View style={[styles.trackFill, { width: `${Math.max(0, Math.min(100, value))}%` }]} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cinema: { minHeight: 260, borderRadius: radii.large, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#050914", padding: 24, alignItems: "center", justifyContent: "center", gap: 24, shadowColor: colors.violet, shadowOpacity: 0.3, shadowRadius: 28 },
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
  segmentActive: { borderColor: colors.borderStrong, backgroundColor: "rgba(155,135,245,0.16)" },
  segmentWarm: { borderColor: "rgba(244,182,106,0.34)", backgroundColor: "rgba(244,182,106,0.1)" },
  segmentText: { color: colors.textMuted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  segmentTextActive: { color: colors.text },
  metricLabels: { flexDirection: "row", justifyContent: "space-between" },
  track: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  trackFill: { height: 7, borderRadius: 4, backgroundColor: colors.lavender },
  bodyMap: { minHeight: 245, borderRadius: 130, borderWidth: 1, borderColor: "rgba(103,183,232,0.2)", backgroundColor: "rgba(103,183,232,0.05)", padding: 24, justifyContent: "space-around" },
  bodyZone: { minHeight: 40, borderRadius: radii.round, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
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
