import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "@/constants/theme";
import { Chip, SecondaryButton } from "@/components/stillmind/ui";
import { ChoiceRow, methodStyles, Note, OriginalText, Stage, type MethodInteractionProps } from "./shared";

type Boundary = "unprocessed" | "distance" | "stop-replay" | "contact";
const boundaryCopy: Record<Boundary, string> = { unprocessed: "先不回想那件事。可以暂不处理，先看一件中性物品。", distance: "可以保持距离。你不需要联系、和解或否认发生过的损害。", "stop-replay": "只停止本次重播，不代表必须改变对这件事的看法。", contact: "只有在你愿意时，才观察此刻的反应；随时可以退回边界选择。" };
export function ReleaseBoundary({ instruction, paused }: MethodInteractionProps) {
  const [boundary, setBoundary] = useState<Boundary>("unprocessed");
  return <>
    <OriginalText testID="boundary-guidance">{boundary === "contact" ? instruction : boundaryCopy[boundary]}</OriginalText>
    <ChoiceRow><Chip label="暂不处理" selected={boundary === "unprocessed"} onPress={() => setBoundary("unprocessed")} /><Chip label="保持距离" selected={boundary === "distance"} onPress={() => setBoundary("distance")} /><Chip label="只停止本次重播" selected={boundary === "stop-replay"} onPress={() => setBoundary("stop-replay")} /></ChoiceRow>
    <SecondaryButton disabled={paused} accessibilityState={{ selected: boundary === "contact" }} label={boundary === "contact" ? "暂不接触这件事" : "愿意继续观察反应"} onPress={() => setBoundary(boundary === "contact" ? "unprocessed" : "contact")} />
    <Note>这只改变本次引导，不代表你已宽恕，也不要求和解或联系对方。</Note>
  </>;
}

const awarenessFields = ["声音", "身体", "念头", "空间"] as const;
export function OpenAwareness({ paused }: MethodInteractionProps) {
  const [fields, setFields] = useState<string[]>([]);
  const [textOnly, setTextOnly] = useState(false);
  function toggle(field: string) { setFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]); }
  return <>
    <Chip label={textOnly ? "显示静态场景" : "切换纯文字"} selected={textOnly} onPress={() => setTextOnly(!textOnly)} />
    {textOnly ? <OriginalText>可以注意一种声音、一处接触、一句念头，或周围的空间。也可以什么都不标记。</OriginalText> : <Stage><View style={styles.awarenessOuter}><View style={styles.awarenessInner} /></View><Note>一个静态的开放注意范围，没有需要到达的中心。</Note></Stage>}
    <View accessibilityLabel="可选的觉察标记"><ChoiceRow>{awarenessFields.map((field) => <Chip key={field} disabled={paused} label={field} selected={fields.includes(field)} onPress={() => toggle(field)} />)}</ChoiceRow></View>
    <Note>主动标记：{fields.join("、") || "暂无"}。没有标记不代表没有觉察。</Note>
  </>;
}

const focusViews = [{ id: "whole", label: "整体" }, { id: "object", label: "对象" }, { id: "detail", label: "细节" }] as const;
export function FocusedObservation({ paused }: MethodInteractionProps) {
  const [view, setView] = useState<(typeof focusViews)[number]["id"]>("whole");
  const [external, setExternal] = useState(false);
  const [objectName, setObjectName] = useState("");
  return <>
    <ChoiceRow><Chip label="观察屏幕纸面" selected={!external} onPress={() => setExternal(false)} /><Chip label="观察现实物品" selected={external} onPress={() => setExternal(true)} /></ChoiceRow>
    {external ? <><Note>把屏幕放低，看一件普通的真实物品。不需要拍照或授权摄像头。</Note><TextInput accessibilityLabel="本次观察的真实物品" editable={!paused} value={objectName} onChangeText={setObjectName} maxLength={60} placeholder="可记下物品或细节，也可以不写" placeholderTextColor={colors.textFaint} style={methodStyles.input} />{objectName.trim() ? <View style={methodStyles.notice}><Text style={methodStyles.noticeText}>本次对象：{objectName}</Text></View> : null}</> : <>
      <View style={styles.paperViewport}><View accessible accessibilityLabel={view === "detail" ? "纸面纹理与杯沿边界的近看细节" : "带纸面纹理和杯沿轮廓的静物"} style={[styles.paper, view === "object" && styles.paperObject, view === "detail" && styles.paperDetail]}><View style={styles.paperLine} /><View style={styles.paperLineSecond} /><View style={styles.cupRim} /></View></View>
      <ChoiceRow>{focusViews.map((item) => <Chip key={item.id} label={item.label} selected={view === item.id} onPress={() => setView(item.id)} />)}</ChoiceRow>
      <Note>{view === "whole" ? "先看纸面与周围的关系。" : view === "object" ? "只看纸面上的杯沿轮廓。" : "观察一条纹理或一处明暗边界；画面只是放大，不代表注意力水平。"}</Note>
    </>}
  </>;
}

const styles = StyleSheet.create({
  awarenessOuter: { width: 132, height: 132, borderRadius: 66, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center" },
  awarenessInner: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: colors.border },
  paperViewport: { height: 270, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  paper: { width: 230, height: 210, borderWidth: 1, borderColor: "#747269", backgroundColor: "#C4C0B3", overflow: "hidden" },
  paperObject: { transform: [{ scale: .88 }] },
  paperDetail: { transform: [{ scale: 1.45 }] },
  paperLine: { position: "absolute", left: 28, top: 30, width: 120, borderTopWidth: 1, borderColor: "#858377" },
  paperLineSecond: { position: "absolute", left: 28, top: 44, width: 160, borderTopWidth: 1, borderColor: "#858377" },
  cupRim: { position: "absolute", right: -38, bottom: -20, width: 180, height: 120, borderWidth: 10, borderColor: "#999889", borderRadius: 90 },
});
