"use client";

import { useState } from "react";
import { observationText } from "@stillmind/domain";
import { ActionButton, ChoiceButton } from "@/components/ui";
import type { MethodInteractionProps } from "./types";

export function BreathObservation({ instruction }: MethodInteractionProps) {
  const [taps, setTaps] = useState(0);
  const [textOnly, setTextOnly] = useState(false);
  return <div className="natural-breath grid flex-1 content-center justify-items-center gap-5 text-center">
    {textOnly ? <p className="sm-method-original">按自己的节奏呼吸。呼气时，可以在心里数一次。</p> : <div className="sm-water" data-testid="breath-water">
      <span className="sm-water-lines" aria-hidden="true" />
      <button type="button" aria-label="轻点记一次数" onClick={() => setTaps((value) => value + 1)} className="sm-breath-hit">
        <span aria-live="polite">{taps > 0 ? `轻点 ${taps}` : "自然呼吸"}</span>
      </button>
    </div>}
    {textOnly ? <ActionButton onClick={() => setTaps((value) => value + 1)}>{taps > 0 ? `轻点 ${taps}` : "自然呼吸"}</ActionButton> : null}
    <div className="sm-choice-row justify-center" role="group" aria-label="呼吸观察呈现方式">
      <ChoiceButton selected={!textOnly} onClick={() => setTextOnly(false)}>静态水面</ChoiceButton>
      <ChoiceButton selected={textOnly} onClick={() => setTextOnly(true)}>纯文字</ChoiceButton>
    </div>
    <p className="sm-method-copy">{instruction}</p>
    <p className="sm-caption">水面是静止的，不代表你的呼吸频率。可以轻点记数，也可以什么都不点。</p>
    {taps > 0 ? <ActionButton onClick={() => setTaps(0)}>重新数</ActionButton> : null}
  </div>;
}

export function ThoughtObservation({ instruction, trigger }: MethodInteractionProps) {
  const [sentence, setSentence] = useState(trigger);
  const [noticed, setNoticed] = useState(false);
  const [hidden, setHidden] = useState(false);
  return <div className="flex flex-1 flex-col justify-center gap-5">
    <label className="grid gap-2 text-left"><span className="sm-caption">此刻的一句念头（可不填）</span>
      <textarea aria-label="此刻的一句念头" className="sm-input" value={sentence} maxLength={500} autoComplete="off" placeholder="保留你的原句，也可以留空" onChange={(event) => { setSentence(event.target.value); setNoticed(false); }} />
    </label>
    <div className="sm-method-original" data-testid="thought-subject" aria-live="polite">
      {hidden ? "这句话已暂时隐藏。它没有消失，你可以再次查看。" : sentence.trim() ? observationText(sentence) : "不必寻找或制造一个念头。只读下面的提示也可以。"}
    </div>
    <p className="sm-method-copy text-center">{instruction}</p>
    <div className="sm-choice-row justify-center">
      <ActionButton onClick={() => setNoticed(!noticed)} aria-pressed={noticed}>{noticed ? "撤销标记" : "注意到了"}</ActionButton>
      {sentence.trim() ? <ActionButton onClick={() => setHidden(!hidden)} aria-pressed={hidden}>{hidden ? "再次查看念头" : "暂时隐藏念头"}</ActionButton> : null}
    </div>
    <p aria-live="polite" className="sm-caption text-center">{noticed ? "已记下这次主动标记，不代表念头或感受已经改变。" : "不需要点击，也不需要让念头消失。"}</p>
  </div>;
}

const gazeViews = [
  { id: "center", label: "烛光中心", hint: "轻松地看烛光的中心，不需要屏住呼吸。" },
  { id: "edge", label: "物体边缘", hint: "把注意移到蜡烛的边缘与明暗交界。" },
  { id: "space", label: "周围空间", hint: "让烛光留在视野里，同时注意它周围的空间。" },
] as const;

export function GazeObservation({ instruction }: MethodInteractionProps) {
  const [view, setView] = useState<(typeof gazeViews)[number]["id"]>("center");
  const [returns, setReturns] = useState(0);
  const active = gazeViews.find((item) => item.id === view) ?? gazeViews[0];
  return <div className="grid flex-1 content-center justify-items-center gap-4 text-center">
    <button type="button" aria-label="走神了，回到烛光" onClick={() => { setReturns((value) => value + 1); setView("center"); }} className="sm-candle-stage" data-view={view}>
      <span className="sm-candle-object" aria-hidden="true"><span className="sm-candle-flame wide-flame" /><span className="sm-candle-wick" /><span className="sm-candle-body" /></span>
      <span className="sr-only">走神时点画面，回到烛光中心</span>
    </button>
    <div className="sm-choice-row justify-center" role="group" aria-label="凝视观察范围">
      {gazeViews.map((item) => <ChoiceButton key={item.id} selected={view === item.id} onClick={() => setView(item.id)}>{item.label}</ChoiceButton>)}
    </div>
    <p className="sm-method-copy" aria-live="polite">{active.hint}</p>
    <p className="sm-method-copy">{instruction}</p>
    <p className="sm-caption">眼睛累了就眨眼或停止。点击只是回到中心，不是成绩。{returns > 0 ? `本次主动回到中心 ${returns} 次。` : ""}</p>
  </div>;
}
