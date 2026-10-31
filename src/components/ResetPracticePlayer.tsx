"use client";

// The session clock, routing and feedback stay in the parent; renderers only own local interactions.
import type { PracticeVariant } from "@stillmind/content";
import type { MethodDefinition } from "@stillmind/domain";
import type { CinemaPayload } from "@/lib/cinema-presets";
import { ActionButton } from "@/components/ui";
import { methodRenderers } from "@/components/methods/registry";

export function PracticePlayer({ method, practice, stepIndex, secondsLeft, progress, paused, trigger, onPause, onStop }: { method: MethodDefinition; practice: PracticeVariant; stepIndex: number; secondsLeft: number; elapsedSeconds: number; breathingSeconds: number; progress: number; paused: boolean; trigger: string; cinema: CinemaPayload; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  const MethodExperience = methodRenderers[method.id];
  return <div className="sm-practice-layout">
    <div className="sm-practice-top">
      <div><p className="sm-practice-top-title">{method.title}</p><p className="sm-practice-top-time tabular-nums">{secondsLeft} 秒{paused ? " · 已暂停" : ""}</p></div>
      <div className="sm-choice-row"><ActionButton onClick={onPause}>{paused ? "继续" : "暂停"}</ActionButton><ActionButton onClick={onStop}>停止</ActionButton></div>
    </div>
    <div role="progressbar" aria-label="练习时间" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="sm-progress"><div className="sm-progress-fill" style={{ width: `${progress}%` }} /></div>
    <fieldset disabled={paused} data-practice-paused={paused} className="contents">
      <MethodExperience methodId={method.id} instruction={step.instruction} stepIndex={stepIndex} trigger={trigger} />
    </fieldset>
    <p className="sm-caption sm-practice-alternative">{step.alternative ?? "不舒服就停止，不需要完成。"}</p>
  </div>;
}
