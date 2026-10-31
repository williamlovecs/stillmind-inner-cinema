import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import { Chip, SecondaryButton } from "@/components/stillmind/ui";
import { ChoiceRow, Note, OriginalText, Stage, type MethodInteractionProps } from "./shared";

type SteadyMode = "visual" | "text" | "external";
export function SteadyObservation({ paused }: MethodInteractionProps) {
  const [mode, setMode] = useState<SteadyMode>("visual");
  return <>
    <Stage testID="steady-object">
      {mode === "visual" ? <View accessible accessibilityLabel="静止的观察方框" style={styles.steadySquare} /> : null}
      {mode === "text" ? <OriginalText>看这一句普通的话。不需要持续点击，也没有稳定度分数。</OriginalText> : null}
      {mode === "external" ? <Note>看一件身边静止的物品，或听一个平稳的声音。</Note> : null}
    </Stage>
    <ChoiceRow><SecondaryButton disabled={paused} accessibilityState={{ selected: mode === "external" }} label={mode === "external" ? "回到屏幕对象" : "改看身边的物品"} onPress={() => setMode(mode === "external" ? "visual" : "external")} /><Chip label={mode === "text" ? "回到低刺激视觉" : "使用纯文字"} selected={mode === "text"} onPress={() => setMode(mode === "text" ? "visual" : "text")} /></ChoiceRow>
    <Note>画面本来就是静止的，不评判你的注意力。可以随时停止。</Note>
  </>;
}

const levels = [{ label: "当前房间", body: "看见此刻的房间、桌面或一个现实物品。" }, { label: "今天", body: "把刚才的一幕放进今天的时间线。" }, { label: "更长的时间", body: "只是改变构图，想想这一周或更长时间。" }, { label: "更大的空间", body: "从更大的空间看这一幕，然后准备回到房间。" }] as const;
export function PerspectiveObservation({ stepIndex, paused }: MethodInteractionProps) {
  const [manualLevel, setManualLevel] = useState<number>();
  const level = manualLevel ?? Math.min(stepIndex, levels.length - 1);
  const active = levels[level] ?? levels[0];
  return <>
    <Stage testID="perspective-room"><View style={[styles.roomFrame, { transform: [{ scale: 1 - level * .2 }] }]}><View style={styles.roomTable} /></View><Note>{active.label} · 静态镜头构图</Note></Stage>
    <ChoiceRow>{levels.map((item, index) => <Chip key={item.label} disabled={paused} label={item.label} selected={level === index} onPress={() => setManualLevel(index)} />)}</ChoiceRow>
    <Note>{active.body}</Note><SecondaryButton disabled={paused} label="返回当前房间" onPress={() => setManualLevel(0)} />
    <Note>变化的是屏幕构图，不代表已经完成心理抽离。不适时可以停止。</Note>
  </>;
}

const styles = StyleSheet.create({
  steadySquare: { width: 96, height: 96, borderWidth: 2, borderColor: colors.mint },
  roomFrame: { width: 230, height: 150, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  roomTable: { width: 100, height: 50, borderWidth: 1, borderBottomWidth: 7, borderColor: colors.warm },
});
