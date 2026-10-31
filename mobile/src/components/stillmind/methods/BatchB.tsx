import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { observationText, observerFrame } from "@stillmind/domain";
import { colors } from "@/constants/theme";
import { Chip, SecondaryButton, type } from "@/components/stillmind/ui";
import { ChoiceRow, methodStyles, Note, OriginalText, Stage, type MethodInteractionProps } from "./shared";

const bodyZones = [{ id: "feet", label: "脚底", prompt: "注意脚底与地面的接触，也可以没有明显感觉。" }, { id: "palms", label: "手掌", prompt: "注意手掌接触衣物或物品的地方。" }, { id: "chair", label: "椅子接触点", prompt: "注意身体与椅子的接触，不需要寻找特殊感觉。" }, { id: "shoulders", label: "肩颈", prompt: "只留意此刻的感觉；不舒服就换一个位置。" }] as const;
export function BodyObservation({ paused }: MethodInteractionProps) {
  const [zoneId, setZoneId] = useState<(typeof bodyZones)[number]["id"]>("feet");
  const [environment, setEnvironment] = useState(false);
  const selected = bodyZones.find((zone) => zone.id === zoneId) ?? bodyZones[0];
  return <>
    <ChoiceRow><Chip disabled={paused} label="选择接触点" selected={!environment} onPress={() => setEnvironment(false)} /><Chip disabled={paused} label="改看周围环境" selected={environment} onPress={() => setEnvironment(true)} /></ChoiceRow>
    {environment ? <Stage><Text style={type.label}>睁眼的替代方式</Text><OriginalText>找出周围三种颜色，或听一个普通的环境声音。</OriginalText><Note>这只是环境观察提示，不需要关注身体内部。</Note></Stage> : <>
      <Stage><Text style={type.label}>你选择的注意位置</Text><Text style={methodStyles.selectedTitle}>{selected.label}</Text><Note>{selected.prompt}</Note></Stage>
      <ChoiceRow>{bodyZones.map((zone) => <Chip key={zone.id} disabled={paused} accessibilityLabel={`标记${zone.label}`} label={zone.label} selected={zoneId === zone.id} onPress={() => setZoneId(zone.id)} />)}</ChoiceRow>
    </>}
    <Note>系统没有检测身体状态。可以不选、跳过不舒服的位置，或改看环境。</Note>
  </>;
}

export function PersonPerspective({ trigger, paused }: MethodInteractionProps) {
  const [name, setName] = useState("");
  const [sentence, setSentence] = useState(trigger);
  const [facts, setFacts] = useState("");
  const [response, setResponse] = useState("");
  return <>
    <Note center={false}>原句保留不变。后面的观察、事实和回应都由你自己决定。</Note>
    <TextInput accessibilityLabel="用于人称替代的名字" editable={!paused} value={name} onChangeText={setName} maxLength={40} placeholder="昵称或代称（可不填）" placeholderTextColor={colors.textFaint} style={methodStyles.input} />
    <TextInput accessibilityLabel="需要转换为旁观语言的念头" editable={!paused} value={sentence} onChangeText={setSentence} maxLength={500} placeholder="写一句脑内正在说的话（可不填）" placeholderTextColor={colors.textFaint} multiline style={[methodStyles.input, methodStyles.multiline]} />
    {sentence.trim() ? <><OriginalText>原句：{sentence}</OriginalText><View testID="observer-frame" style={methodStyles.notice}><Text style={methodStyles.noticeText}>{observerFrame(sentence, name)}</Text></View></> : <Note>也可以只在心里试，不需要输入。</Note>}
    <TextInput accessibilityLabel="我亲眼看到或听到的事实" editable={!paused} value={facts} onChangeText={setFacts} maxLength={500} placeholder="你确认的事实（可不填），不由系统推测" placeholderTextColor={colors.textFaint} multiline style={[methodStyles.input, methodStyles.multiline]} />
    {facts.trim() ? <View testID="observed-facts" style={methodStyles.notice}><Text style={methodStyles.noticeText}>你写下的事实：{facts}</Text></View> : null}
    <TextInput accessibilityLabel="一个可选择的回应" editable={!paused} value={response} onChangeText={setResponse} maxLength={200} placeholder="例如：稍后再回复（可不填）" placeholderTextColor={colors.textFaint} style={methodStyles.input} />
    {response.trim() ? <Note center={false}>你考虑的选择：{response}。这里只记录文字，不表示已经做到。</Note> : null}
  </>;
}

const returnTimes = ["稍后再看", "走完一小段路后", "今天不返回"] as const;
const realityActions = ["喝一杯水", "回到手边的小事", "暂时不安排动作"] as const;
export function LogoutPause({ trigger, paused }: MethodInteractionProps) {
  const [hidden, setHidden] = useState(false);
  const [returnTime, setReturnTime] = useState<(typeof returnTimes)[number]>("稍后再看");
  const [action, setAction] = useState<(typeof realityActions)[number]>("喝一杯水");
  return <>
    <OriginalText testID="logout-subject">{hidden ? "先看看周围，不用继续读这句话。" : observationText(trigger)}</OriginalText>
    <Note>{hidden ? "暂时不接触这句话，也可以随时回来。" : "看见它，先不解释，也不急着回应。"}</Note>
    <SecondaryButton disabled={paused} accessibilityState={{ selected: hidden }} label={hidden ? "重新显示这句话" : "暂时收起这句话"} onPress={() => setHidden(!hidden)} />
    <Text style={type.caption}>你想什么时候再决定是否回应？</Text><ChoiceRow>{returnTimes.map((item) => <Chip key={item} disabled={paused} label={item} selected={returnTime === item} onPress={() => setReturnTime(item)} />)}</ChoiceRow>
    <Text style={type.caption}>暂停期间，可以选的一个现实动作</Text><ChoiceRow>{realityActions.map((item) => <Chip key={item} disabled={paused} label={item} selected={action === item} onPress={() => setAction(item)} />)}</ChoiceRow>
    <View style={methodStyles.notice}><Text accessibilityLiveRegion="polite" style={methodStyles.noticeText}>你的选择：{returnTime}；{action}。这里只记录选择，不代表你已经做到或改变了现实行为。</Text></View>
  </>;
}
