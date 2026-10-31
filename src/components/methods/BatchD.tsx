"use client";

import { useState } from "react";
import { ActionButton, ChoiceButton } from "@/components/ui";
import type { MethodInteractionProps } from "./types";

type SteadyMode = "visual" | "text" | "external";
export function SteadyObservation({ instruction }: MethodInteractionProps) {
  const [mode, setMode] = useState<SteadyMode>("visual");
  return <div className="grid flex-1 content-center justify-items-center gap-5 text-center">
    <div data-testid="steady-object" className="sm-method-stage w-full">
      {mode === "visual" ? <span aria-label="静止的观察方框" role="img" className="h-24 w-24 border-2 border-[var(--sm-mint)]" /> : null}
      {mode === "text" ? <p className="sm-method-original">看这一句普通的话。不需要持续点击，也没有稳定度分数。</p> : null}
      {mode === "external" ? <p className="sm-method-copy">看一件身边静止的物品，或听一个平稳的声音。</p> : null}
    </div>
    <p className="sm-method-copy">{instruction}</p>
    <div className="sm-choice-row justify-center">
      <ActionButton aria-pressed={mode === "external"} onClick={() => setMode(mode === "external" ? "visual" : "external")}>{mode === "external" ? "回到屏幕对象" : "改看身边的物品"}</ActionButton>
      <ChoiceButton selected={mode === "text"} onClick={() => setMode(mode === "text" ? "visual" : "text")}>{mode === "text" ? "回到低刺激视觉" : "使用纯文字"}</ChoiceButton>
    </div>
    <p className="sm-caption">画面本来就是静止的，不评判你的注意力。可以随时停止。</p>
  </div>;
}

const levels = [
  { label: "当前房间", body: "看见此刻的房间、桌面或一个现实物品。" },
  { label: "今天", body: "把刚才的一幕放进今天的时间线。" },
  { label: "更长的时间", body: "只是改变构图，想想这一周或更长时间。" },
  { label: "更大的空间", body: "从更大的空间看这一幕，然后准备回到房间。" },
] as const;

export function PerspectiveObservation({ instruction, stepIndex }: MethodInteractionProps) {
  const [manualLevel, setManualLevel] = useState<number>();
  const level = manualLevel ?? Math.min(stepIndex, levels.length - 1);
  const active = levels[level] ?? levels[0];
  return <div className="grid flex-1 content-center justify-items-center gap-4 text-center">
    <div className="sm-zoom-room" data-level={level} data-testid="perspective-room" role="img" aria-label={`镜头构图：${active.label}`}><span className="sr-only">{active.body}</span></div>
    <div className="sm-choice-row justify-center" role="group" aria-label="空间与时间构图">{levels.map((item, index) => <ChoiceButton key={item.label} selected={level === index} onClick={() => setManualLevel(index)}>{item.label}</ChoiceButton>)}</div>
    <label className="grid w-full max-w-md gap-2"><span className="sm-caption">主动调整镜头</span><input aria-label="拉远镜头" type="range" min="0" max="3" value={level} onChange={(event) => setManualLevel(Number(event.target.value))} className="min-h-11 w-full accent-[var(--sm-accent)]" /></label>
    <p className="sm-method-copy" aria-live="polite">{active.body}</p><p className="sm-method-copy">{instruction}</p>
    <ActionButton tone="warm" onClick={() => setManualLevel(0)}>返回当前房间</ActionButton>
    <p className="sm-caption">变化的是屏幕构图，不代表已经完成心理抽离。不适时可以停止。</p>
  </div>;
}
