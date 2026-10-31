"use client";

import { useState } from "react";
import { ActionButton, ChoiceButton } from "@/components/ui";
import type { MethodInteractionProps } from "./types";

type Boundary = "unprocessed" | "distance" | "stop-replay" | "contact";
const boundaryCopy: Record<Boundary, string> = {
  unprocessed: "先不回想那件事。可以暂不处理，先看一件中性物品。",
  distance: "可以保持距离。你不需要联系、和解或否认发生过的损害。",
  "stop-replay": "只停止本次重播，不代表必须改变对这件事的看法。",
  contact: "只有在你愿意时，才观察此刻的反应；随时可以退回边界选择。",
};

export function ReleaseBoundary({ instruction }: MethodInteractionProps) {
  const [boundary, setBoundary] = useState<Boundary>("unprocessed");
  return <div className="grid flex-1 content-center gap-5">
    <p data-testid="boundary-guidance" className="sm-method-original">{boundary === "contact" ? instruction : boundaryCopy[boundary]}</p>
    <div className="sm-choice-row justify-center" role="group" aria-label="可拒绝的边界选择">
      <ChoiceButton selected={boundary === "unprocessed"} onClick={() => setBoundary("unprocessed")}>暂不处理</ChoiceButton>
      <ChoiceButton selected={boundary === "distance"} onClick={() => setBoundary("distance")}>保持距离</ChoiceButton>
      <ChoiceButton selected={boundary === "stop-replay"} onClick={() => setBoundary("stop-replay")}>只停止本次重播</ChoiceButton>
    </div>
    <ActionButton className="justify-self-center" aria-pressed={boundary === "contact"} onClick={() => setBoundary(boundary === "contact" ? "unprocessed" : "contact")}>{boundary === "contact" ? "暂不接触这件事" : "愿意继续观察反应"}</ActionButton>
    <p className="sm-caption text-center">这只改变本次引导，不代表你已宽恕，也不要求和解或联系对方。</p>
  </div>;
}

const awarenessFields = ["声音", "身体", "念头", "空间"] as const;
export function OpenAwareness({ instruction }: MethodInteractionProps) {
  const [fields, setFields] = useState<string[]>([]);
  const [textOnly, setTextOnly] = useState(false);
  function toggle(field: string) { setFields((current) => current.includes(field) ? current.filter((item) => item !== field) : [...current, field]); }
  return <div className="grid flex-1 content-center gap-5 text-center">
    <ChoiceButton className="justify-self-center" selected={textOnly} onClick={() => setTextOnly(!textOnly)}>{textOnly ? "显示静态场景" : "切换纯文字"}</ChoiceButton>
    {textOnly ? <p className="sm-method-original">可以注意一种声音、一处接触、一句念头，或周围的空间。也可以什么都不标记。</p> : <div className="sm-method-stage"><span className="grid h-32 w-32 place-items-center rounded-full border border-[var(--sm-border-strong)]"><span className="h-20 w-20 rounded-full border border-[var(--sm-border)]" /></span><p className="sm-caption">一个静态的开放注意范围，没有需要到达的中心。</p></div>}
    <p className="sm-method-copy">{instruction}</p>
    <div role="group" aria-label="可选的觉察标记" className="sm-choice-row justify-center">{awarenessFields.map((field) => <ChoiceButton key={field} selected={fields.includes(field)} onClick={() => toggle(field)}>{field}</ChoiceButton>)}</div>
    <p aria-live="polite" className="sm-caption">你的主动标记：{fields.join("、") || "暂无"}。没有标记不代表没有觉察。</p>
  </div>;
}

const focusViews = [{ id: "whole", label: "整体" }, { id: "object", label: "对象" }, { id: "detail", label: "细节" }] as const;
export function FocusedObservation({ instruction }: MethodInteractionProps) {
  const [view, setView] = useState<(typeof focusViews)[number]["id"]>("whole");
  const [external, setExternal] = useState(false);
  const [objectName, setObjectName] = useState("");
  return <div className="grid flex-1 content-center justify-items-center gap-4 text-center">
    <div className="sm-choice-row justify-center"><ChoiceButton selected={!external} onClick={() => setExternal(false)}>观察屏幕纸面</ChoiceButton><ChoiceButton selected={external} onClick={() => setExternal(true)}>观察现实物品</ChoiceButton></div>
    {external ? <><p className="sm-method-copy">把屏幕放低，看一件普通的真实物品。不需要拍照或授权摄像头。</p><input aria-label="本次观察的真实物品" autoComplete="off" maxLength={60} value={objectName} onChange={(event) => setObjectName(event.target.value)} placeholder="可记下物品或细节，也可以不写" className="sm-input" />{objectName.trim() ? <p className="sm-notice">本次对象：{objectName}</p> : null}</> : <>
      <div className="grid min-h-64 w-full place-items-center overflow-hidden"><div className="sm-paper" data-view={view} role="img" aria-label={view === "detail" ? "纸面纹理与杯沿边界的近看细节" : "带纸面纹理和杯沿轮廓的静物"} /></div>
      <div className="sm-choice-row justify-center" role="group" aria-label="聚焦范围">{focusViews.map((item) => <ChoiceButton key={item.id} selected={view === item.id} onClick={() => setView(item.id)}>{item.label}</ChoiceButton>)}</div>
      <p className="sm-caption" aria-live="polite">{view === "whole" ? "先看纸面与周围的关系。" : view === "object" ? "只看纸面上的杯沿轮廓。" : "观察一条纹理或一处明暗边界；画面只是放大，不代表注意力水平。"}</p>
    </>}
    <p className="sm-method-copy">{instruction}</p>
  </div>;
}
