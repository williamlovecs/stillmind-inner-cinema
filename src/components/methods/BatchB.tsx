"use client";

import { useState } from "react";
import { observationText, observerFrame } from "@stillmind/domain";
import { ActionButton, ChoiceButton } from "@/components/ui";
import type { MethodInteractionProps } from "./types";

const bodyZones = [
  { id: "feet", label: "脚底", prompt: "注意脚底与地面的接触，也可以没有明显感觉。" },
  { id: "palms", label: "手掌", prompt: "注意手掌接触衣物或物品的地方。" },
  { id: "chair", label: "椅子接触点", prompt: "注意身体与椅子的接触，不需要寻找特殊感觉。" },
  { id: "shoulders", label: "肩颈", prompt: "只留意此刻的感觉；不舒服就换一个位置。" },
] as const;

export function BodyObservation({ instruction }: MethodInteractionProps) {
  const [zoneId, setZoneId] = useState<(typeof bodyZones)[number]["id"]>("feet");
  const [environment, setEnvironment] = useState(false);
  const selected = bodyZones.find((zone) => zone.id === zoneId) ?? bodyZones[0];
  return <div className="grid flex-1 content-center gap-5">
    <div className="sm-choice-row justify-center"><ChoiceButton selected={!environment} onClick={() => setEnvironment(false)}>选择接触点</ChoiceButton><ChoiceButton selected={environment} onClick={() => setEnvironment(true)}>改看周围环境</ChoiceButton></div>
    {environment ? <div className="sm-method-stage"><p className="sm-eyebrow">睁眼的替代方式</p><p className="sm-method-original">找出周围三种颜色，或听一个普通的环境声音。</p><p className="sm-caption">这只是环境观察提示，不需要关注身体内部。</p></div> : <>
      <div className="sm-method-stage"><p className="sm-eyebrow">你选择的注意位置</p><p className="text-3xl font-semibold text-[var(--sm-text)]">{selected.label}</p><p className="sm-method-copy">{selected.prompt}</p></div>
      <div className="sm-choice-row justify-center" role="group" aria-label="可选身体接触点">{bodyZones.map((zone) => <ChoiceButton key={zone.id} aria-label={`标记${zone.label}`} selected={zoneId === zone.id} onClick={() => setZoneId(zone.id)}>{zone.label}</ChoiceButton>)}</div>
    </>}
    <p className="sm-method-copy text-center">{instruction}</p>
    <p className="sm-caption text-center">系统没有检测身体状态。可以不选、跳过不舒服的位置，或改看环境。</p>
  </div>;
}

export function PersonPerspective({ trigger }: MethodInteractionProps) {
  const [name, setName] = useState("");
  const [sentence, setSentence] = useState(trigger);
  const [facts, setFacts] = useState("");
  const [response, setResponse] = useState("");
  return <div className="flex flex-1 flex-col justify-center gap-4">
    <p className="sm-copy">原句保留不变。后面的观察、事实和回应都由你自己决定。</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <input aria-label="用于人称替代的名字" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} className="sm-input" placeholder="昵称或代称（可不填）" />
      <textarea aria-label="需要转换为旁观语言的念头" autoComplete="off" value={sentence} onChange={(event) => setSentence(event.target.value)} maxLength={500} className="sm-input" placeholder="写一句脑内正在说的话（可不填）" />
    </div>
    {sentence.trim() ? <><blockquote className="sm-method-original">原句：{sentence}</blockquote><blockquote data-testid="observer-frame" className="sm-notice text-lg">{observerFrame(sentence, name)}</blockquote></> : <p className="sm-caption">也可以只在心里试，不需要输入。</p>}
    <label className="grid gap-2"><span className="sm-caption">我亲眼看到或听到的事实（可不填）</span><textarea aria-label="我亲眼看到或听到的事实" className="sm-input" value={facts} maxLength={500} onChange={(event) => setFacts(event.target.value)} placeholder="不由系统推测；只写你确认的事实" /></label>
    {facts.trim() ? <p className="sm-notice" data-testid="observed-facts">你写下的事实：{facts}</p> : null}
    <label className="grid gap-2"><span className="sm-caption">一个可选择的回应（可不填）</span><input aria-label="一个可选择的回应" className="sm-input" value={response} maxLength={200} onChange={(event) => setResponse(event.target.value)} placeholder="例如：稍后再回复；不代表已经执行" /></label>
    {response.trim() ? <p className="sm-caption">你考虑的选择：{response}。这里只记录文字，不表示已经做到。</p> : null}
  </div>;
}

const returnTimes = ["稍后再看", "走完一小段路后", "今天不返回"] as const;
const realityActions = ["喝一杯水", "回到手边的小事", "暂时不安排动作"] as const;

export function LogoutPause({ trigger }: MethodInteractionProps) {
  const [hidden, setHidden] = useState(false);
  const [returnTime, setReturnTime] = useState<(typeof returnTimes)[number]>("稍后再看");
  const [action, setAction] = useState<(typeof realityActions)[number]>("喝一杯水");
  return <div className="flex flex-1 flex-col justify-center gap-5 text-center">
    <blockquote data-testid="logout-subject" className="sm-method-original">{hidden ? "先看看周围，不用继续读这句话。" : observationText(trigger)}</blockquote>
    <p className="sm-method-copy">{hidden ? "暂时不接触这句话，也可以随时回来。" : "看见它，先不解释，也不急着回应。"}</p>
    <ActionButton onClick={() => setHidden(!hidden)} aria-pressed={hidden} className="self-center">{hidden ? "重新显示这句话" : "暂时收起这句话"}</ActionButton>
    <fieldset className="grid gap-3 text-left"><legend className="sm-caption mb-2">你想什么时候再决定是否回应？</legend><div className="sm-choice-row">{returnTimes.map((item) => <ChoiceButton key={item} selected={returnTime === item} onClick={() => setReturnTime(item)}>{item}</ChoiceButton>)}</div></fieldset>
    <fieldset className="grid gap-3 text-left"><legend className="sm-caption mb-2">暂停期间，可以选的一个现实动作</legend><div className="sm-choice-row">{realityActions.map((item) => <ChoiceButton key={item} selected={action === item} onClick={() => setAction(item)}>{item}</ChoiceButton>)}</div></fieldset>
    <p className="sm-notice text-left" aria-live="polite">你的选择：{returnTime}；{action}。这里只记录选择，不代表你已经做到或改变了现实行为。</p>
  </div>;
}
