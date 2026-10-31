import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { observationText } from "@stillmind/domain";
import { colors, radii } from "@/constants/theme";
import { Chip, SecondaryButton } from "@/components/stillmind/ui";
import { ChoiceRow, methodStyles, Note, OriginalText, type MethodInteractionProps } from "./shared";

export function BreathObservation({ paused }: MethodInteractionProps) {
  const [taps, setTaps] = useState(0);
  const [textOnly, setTextOnly] = useState(false);
  return <>
    <ChoiceRow><Chip disabled={paused} label="静态水面" selected={!textOnly} onPress={() => setTextOnly(false)} /><Chip disabled={paused} label="纯文字" selected={textOnly} onPress={() => setTextOnly(true)} /></ChoiceRow>
    {textOnly ? <OriginalText>按自己的节奏呼吸。呼气时，可以在心里数一次。</OriginalText> : <Pressable disabled={paused} accessibilityRole="button" accessibilityLabel="轻点记一次数" onPress={() => setTaps((value) => value + 1)} style={styles.water}>
      <View style={styles.waterRing} /><View style={styles.waterLine} /><Text accessibilityLiveRegion="polite" style={styles.waterText}>{taps ? `轻点 ${taps}` : "自然呼吸"}</Text>
    </Pressable>}
    {textOnly ? <SecondaryButton disabled={paused} accessibilityLabel="轻点记一次数" label={taps ? `轻点 ${taps}` : "自然呼吸"} onPress={() => setTaps((value) => value + 1)} /> : null}
    <Note>水面是静止的，不代表你的呼吸频率。可以轻点记数，也可以什么都不点。</Note>
    {taps > 0 ? <SecondaryButton disabled={paused} label="重新数" onPress={() => setTaps(0)} /> : null}
  </>;
}

export function ThoughtObservation({ trigger, paused }: MethodInteractionProps) {
  const [sentence, setSentence] = useState(trigger);
  const [noticed, setNoticed] = useState(false);
  const [hidden, setHidden] = useState(false);
  return <>
    <TextInput accessibilityLabel="此刻的一句念头" editable={!paused} value={sentence} maxLength={500} onChangeText={(value) => { setSentence(value); setNoticed(false); }} placeholder="保留你的原句，也可以留空" placeholderTextColor={colors.textFaint} multiline style={[methodStyles.input, methodStyles.multiline]} />
    <OriginalText testID="thought-subject">{hidden ? "这句话已暂时隐藏。它没有消失，你可以再次查看。" : sentence.trim() ? observationText(sentence) : "不必寻找或制造一个念头。只读下面的提示也可以。"}</OriginalText>
    <ChoiceRow><SecondaryButton disabled={paused} accessibilityState={{ selected: noticed }} label={noticed ? "撤销标记" : "注意到了"} onPress={() => setNoticed(!noticed)} />{sentence.trim() ? <SecondaryButton disabled={paused} accessibilityState={{ selected: hidden }} label={hidden ? "再次查看念头" : "暂时隐藏念头"} onPress={() => setHidden(!hidden)} /> : null}</ChoiceRow>
    <Note>{noticed ? "已记下这次主动标记，不代表念头或感受已经改变。" : "不需要点击，也不需要让念头消失。"}</Note>
  </>;
}

const gazeViews = [{ id: "center", label: "烛光中心", hint: "轻松地看烛光的中心，不需要屏住呼吸。" }, { id: "edge", label: "物体边缘", hint: "把注意移到蜡烛的边缘与明暗交界。" }, { id: "space", label: "周围空间", hint: "让烛光留在视野里，同时注意它周围的空间。" }] as const;
export function GazeObservation({ paused }: MethodInteractionProps) {
  const [view, setView] = useState<(typeof gazeViews)[number]["id"]>("center");
  const [returns, setReturns] = useState(0);
  const active = gazeViews.find((item) => item.id === view) ?? gazeViews[0];
  return <>
    <Pressable disabled={paused} accessibilityRole="button" accessibilityLabel="走神了，点一下回到烛光" onPress={() => { setReturns((value) => value + 1); setView("center"); }} style={({ pressed }) => [styles.candleStage, pressed && styles.pressed]}>
      <View style={[styles.candle, view === "edge" && styles.candleEdge, view === "space" && styles.candleSpace]}><View style={styles.flame} /><View style={styles.wick} /><View style={styles.candleBody} /></View>
    </Pressable>
    <ChoiceRow>{gazeViews.map((item) => <Chip key={item.id} disabled={paused} label={item.label} selected={view === item.id} onPress={() => setView(item.id)} />)}</ChoiceRow>
    <Note>{active.hint}</Note><Note>眼睛累了就眨眼或停止。点击只是回到中心，不是成绩。{returns > 0 ? `本次主动回到中心 ${returns} 次。` : ""}</Note>
  </>;
}

const styles = StyleSheet.create({
  water: { minHeight: 190, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderStrong, backgroundColor: "#0E1C2B", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  waterRing: { position: "absolute", width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderColor: colors.blue },
  waterLine: { position: "absolute", bottom: 30, left: 20, right: 20, height: 32, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.borderStrong },
  waterText: { color: colors.text, fontSize: 18, fontWeight: "600", backgroundColor: "#0E1C2B", padding: 10 },
  candleStage: { minHeight: 220, borderWidth: 1, borderColor: colors.border, backgroundColor: "#11151D", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  candle: { width: 110, height: 170 },
  candleEdge: { transform: [{ translateX: -54 }] },
  candleSpace: { transform: [{ scale: .65 }] },
  flame: { position: "absolute", top: 10, left: 42, width: 28, height: 50, borderTopLeftRadius: 24, borderTopRightRadius: 14, borderBottomLeftRadius: 18, borderBottomRightRadius: 20, backgroundColor: "#E6C58C" },
  wick: { position: "absolute", top: 60, left: 55, width: 2, height: 16, backgroundColor: colors.textFaint },
  candleBody: { position: "absolute", top: 74, left: 28, width: 56, height: 86, borderRadius: radii.small, backgroundColor: "#B7B1A5" },
  pressed: { opacity: .82 },
});
