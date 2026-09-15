"use client";

// Extracted from the existing reset page without changing method layouts.
// The parent owns the session clock; this component only renders guided visuals and controls.
import Image from "next/image";
import "./observer-cinema.css";
import { useState } from "react";
import type { PracticeVariant } from "@stillmind/content";
import { OBSERVER_LENSES, observationText, observerFrame, type MethodDefinition, type MethodId } from "@stillmind/domain";
import type { CinemaPayload } from "@/lib/cinema-presets";

export function PracticePlayer({ method, practice, stepIndex, secondsLeft, elapsedSeconds, breathingSeconds, progress, paused, trigger, cinema, onPause, onStop }: { method: MethodDefinition; practice: PracticeVariant; stepIndex: number; secondsLeft: number; elapsedSeconds: number; breathingSeconds: number; progress: number; paused: boolean; trigger: string; cinema: CinemaPayload; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  return <div className="flex h-full min-w-0 flex-col gap-4">
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-[#080e1b]/95 py-2">
      <div><p className="text-sm text-violet-200/70">{method.title}</p><p className="tabular-nums text-sm text-stone-400">{secondsLeft} 秒{paused ? " · 已暂停" : ""}</p></div>
      <div className="flex gap-2">
        <button type="button" onClick={onPause} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-white">{paused ? "继续" : "暂停"}</button>
        <button type="button" onClick={onStop} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm text-stone-200">停止</button>
      </div>
    </div>
    <div role="progressbar" aria-label="练习时间" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-violet-300 transition-[width]" style={{ width: `${progress}%` }} /></div>
    <fieldset disabled={paused} data-practice-paused={paused} className="contents">
      <MethodExperience paused={paused} methodId={method.id} instruction={step.instruction} secondsLeft={secondsLeft} elapsedSeconds={elapsedSeconds} breathingSeconds={breathingSeconds} stepIndex={stepIndex} trigger={trigger} cinema={cinema} />
    </fieldset>
    <p className="text-center text-xs leading-5 text-stone-500">{step.alternative ?? "不舒服就停止，不需要完成。"}</p>
  </div>;
}

function MethodExperience({ methodId, instruction, secondsLeft, elapsedSeconds, stepIndex, trigger, cinema, paused }: { paused: boolean; methodId: MethodId; instruction: string; secondsLeft: number; elapsedSeconds: number; breathingSeconds: number; stepIndex: number; trigger: string; cinema: CinemaPayload }) {
  const thoughts = [observationText(trigger)];
  if (["paced-breath", "wide-gaze", "trigger-journal", "grounded-action"].includes(methodId)) {
    return <FocusObjectEngine paused={paused} elapsedSeconds={elapsedSeconds} methodId={methodId} instruction={instruction} secondsLeft={secondsLeft} stepIndex={stepIndex} />;
  }
  if (["inner-cinema", "thought-watching", "logout-pause", "person-shift"].includes(methodId)) {
    return <ThoughtBubbleEngine methodId={methodId} instruction={instruction} stepIndex={stepIndex} thoughts={thoughts} trigger={trigger} cinema={cinema} />;
  }
  if (["body-scan", "release", "open-awareness"].includes(methodId)) {
    return <BodySpaceEngine methodId={methodId} instruction={instruction} stepIndex={stepIndex} />;
  }
  if (methodId === "anchors") return <PerspectiveZoomEngine instruction={instruction} stepIndex={stepIndex} />;
  return <div className="grid flex-1 place-items-center rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_34%,rgba(139,92,246,0.14),transparent_45%),rgba(2,6,23,0.72)] p-6 text-center"><div>{thoughts.map((thought, index) => <span key={thought} className="m-1 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-300" style={{ opacity: Math.max(0.25, 1 - (stepIndex + index) * 0.14) }}>{thought}</span>)}<p className="mx-auto mt-8 max-w-xl text-2xl font-semibold leading-10 text-white">{instruction}</p></div></div>;
}

function FocusObjectEngine({ methodId, instruction }: { paused: boolean; elapsedSeconds: number; methodId: MethodId; instruction: string; secondsLeft: number; stepIndex: number }) {
  const [returns, setReturns] = useState(0);
  const [externalObject, setExternalObject] = useState(false);
  const [objectName, setObjectName] = useState("");
  const [exhaleTaps, setExhaleTaps] = useState(0);

  if (methodId === "paced-breath") {
    return (
      <div className="natural-breath grid flex-1 content-center justify-items-center gap-5 p-5 text-center">
        <button type="button" aria-label="轻点记一次数" onClick={() => setExhaleTaps((value) => value + 1)}
          className="grid h-44 w-44 place-items-center rounded-full border border-sky-100/30 bg-sky-200/10 text-xl text-sky-50 shadow-[0_0_46px_rgba(96,165,250,0.18)]">
          {exhaleTaps > 0 ? <span aria-live="polite">轻点 {exhaleTaps}</span> : "自然呼吸"}
        </button>
        <p className="max-w-md text-lg leading-8 text-stone-200">{instruction}</p>
        <p className="text-sm text-stone-400">呼气时心里数一下，也可以轻点记数。不点也可以。</p>
        {exhaleTaps > 0 ? <button type="button" onClick={() => setExhaleTaps(0)} className="min-h-11 px-4 text-sm text-stone-400">重新数</button> : null}
      </div>
    );
  }
  if (methodId === "wide-gaze") {
    function markWandered() { setReturns((value) => value + 1); }
    return (
      <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-sky-200/15 bg-[radial-gradient(circle_at_50%_24%,rgba(125,211,252,0.12),transparent_44%),rgba(2,6,23,0.76)] p-6 text-center">
        <button type="button" onClick={markWandered} aria-label="走神了，回到烛光" className="relative grid h-64 w-full max-w-md place-items-center overflow-hidden rounded-[1.6rem] border border-sky-100/15 bg-slate-950/72 text-left shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition active:scale-[0.99]">
          <span className="absolute h-52 w-52 rounded-full bg-amber-200/10 blur-3xl" />
          <Image src="/practice-visuals/wide-gaze.svg" alt="一束安静烛光，用来做凝视练习" width={360} height={260} priority={false} className="relative h-full w-full object-cover opacity-95" />
          <span className="wide-flame pointer-events-none absolute left-1/2 top-[31%] h-20 w-12 -translate-x-1/2 rounded-[70%_70%_55%_55%] bg-[linear-gradient(180deg,rgba(255,247,237,0.88),rgba(251,191,36,0.5)_48%,rgba(251,113,133,0.32))] blur-[1px]" />
          <span className="absolute bottom-4 left-4 rounded-full border border-amber-100/20 bg-slate-950/72 px-3 py-2 text-xs font-semibold text-amber-50 backdrop-blur-md">走神时点画面，回到烛光</span>
          <span className="absolute right-4 top-4 rounded-full border border-sky-100/20 bg-slate-950/72 px-3 py-2 text-xs text-sky-50 backdrop-blur-md">回归 {returns}</span>
        </button>
        <p className="mt-4 max-w-md text-base leading-8 text-stone-300">{instruction}</p>
        <div className="mt-3 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs text-stone-500">主动点击次数</p><p className="mt-1 text-2xl font-semibold text-white">{returns}</p></div>
      </div>
    );
  }
  if (methodId === "trigger-journal") {
    return (
      <div className="grid flex-1 content-center justify-items-center gap-5 p-4 text-center">
        <div data-testid="steady-object" className="grid min-h-56 w-full max-w-sm place-items-center border-y border-emerald-100/20">
          {externalObject ? <p className="px-5 text-lg leading-8 text-emerald-50">看一件身边静止的物品，或听一个平稳的声音。</p> : <span aria-label="静止的观察方框" role="img" className="h-24 w-24 border-2 border-emerald-100/60" />}
        </div>
        <p className="max-w-md text-lg leading-8 text-stone-200">{instruction}</p>
        <button type="button" aria-pressed={externalObject} onClick={() => setExternalObject(!externalObject)} className="min-h-12 rounded-lg border border-white/20 px-4 py-3 text-stone-200">{externalObject ? "回到屏幕对象" : "改看身边的物品"}</button>
        <p className="text-sm text-stone-400">画面本来就是静止的，不评判你的注意力。</p>
      </div>
    );
  }
  return (
    <div className="grid flex-1 content-center gap-5 p-5 text-center">
      <p className="text-xl leading-8 text-amber-50">把手机放低，看一件身边真实的物品。</p>
      <input aria-label="本次观察的真实物品" autoComplete="off" maxLength={60} value={objectName} onChange={event => setObjectName(event.target.value)} placeholder="可记下物品或细节，也可以不写" className="min-h-12 w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white" />
      {objectName.trim() ? <p className="text-lg text-amber-100 [overflow-wrap:anywhere]">本次对象：{objectName}</p> : null}
      <p className="text-lg leading-8 text-stone-200">{instruction}</p>
      <p className="text-sm text-stone-400">不需要拍照，也不需要点击来证明专注。</p>
    </div>
  );
}

function ThoughtBubbleEngine({ methodId, instruction, trigger }: { methodId: MethodId; instruction: string; stepIndex: number; thoughts: string[]; trigger: string; cinema: CinemaPayload }) {
  const [name, setName] = useState("");
  const [sentence, setSentence] = useState(trigger);
  const [lensIndex, setLensIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [noticed, setNoticed] = useState(false);
  const lens = OBSERVER_LENSES[lensIndex];
  const subject = observationText(trigger);

  if (methodId === "person-shift") {
    return <div className="flex flex-1 flex-col justify-center gap-4 p-3">
      <p className="text-base leading-7 text-stone-300">保留原句，试着用名字描述“注意到这句话”。</p>
      <input aria-label="用于人称替代的名字" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} maxLength={40}
        className="min-h-11 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white" placeholder="昵称或代称（可不填）" />
      <textarea aria-label="需要转换为旁观语言的念头" autoComplete="off" value={sentence} onChange={(event) => setSentence(event.target.value)} maxLength={500}
        className="min-h-24 w-full rounded-lg border border-white/15 bg-white/5 p-4 text-white" placeholder="写一句脑内正在说的话（可不填）" />
      {sentence.trim() ? <blockquote data-testid="observer-frame" className="border-l-2 border-amber-100/40 py-3 pl-4 text-lg leading-8 text-amber-50 [overflow-wrap:anywhere]">{observerFrame(sentence, name)}</blockquote> : <p className="text-sm text-stone-400">也可以只在心里试，不需要输入。</p>}
    </div>;
  }
  if (methodId === "inner-cinema") {
    return <div className="observer-cinema flex flex-1 flex-col justify-center gap-4 text-center" data-lens={lens.id}>
      <div className="observer-stage" data-testid="observer-stage">
        <div aria-hidden="true" className="observer-background" />
        <blockquote data-testid="observer-screen" className="observer-screen" style={{ width: `${lens.width}%` }}>
          <p className="text-xl font-semibold leading-relaxed text-white sm:text-2xl">{subject}</p>
        </blockquote>
        <div aria-hidden="true" className="observer-seat" />
      </div>
      <p data-testid="step-instruction" className="min-h-12 text-2xl font-semibold leading-10 text-white">{instruction}</p>
      <div className="mx-auto flex w-full max-w-md flex-col gap-2">
        <p className="text-sm text-stone-400">{lens.hint}</p>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="观看距离">
          {OBSERVER_LENSES.map((item, index) => <button key={item.id} type="button" aria-pressed={index === lensIndex} onClick={() => setLensIndex(index)}
            className={`min-h-12 rounded-lg border px-2 py-3 text-sm transition ${index === lensIndex ? "border-violet-100/60 bg-violet-100/10 text-white" : "border-white/15 text-stone-400"}`}>{item.label}</button>)}
        </div>
      </div>
    </div>;
  }
  if (methodId === "logout-pause") {
    return <div className="flex flex-1 flex-col items-center justify-center gap-5 p-4 text-center">
      <blockquote data-testid="logout-subject" className="flex min-h-40 w-full items-center justify-center border-y border-white/10 p-4 text-xl leading-8 text-stone-100 [overflow-wrap:anywhere]">{hidden ? "先看看周围，不用继续读这句话。" : subject}</blockquote>
      <p className="text-base leading-7 text-stone-300">{hidden ? "暂时不接触这句话，也可以随时回来。" : "看见它，先不解释，也不急着回应。"}</p>
      <button type="button" aria-pressed={hidden} onClick={() => setHidden(!hidden)} className="min-h-12 rounded-lg border border-amber-100/30 px-5 py-3 text-amber-50">{hidden ? "重新显示这句话" : "暂时收起这句话"}</button>
    </div>;
  }
  return <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 text-center">
    <blockquote className="w-full border-y border-violet-200/15 px-4 py-8 text-xl leading-8 text-stone-100 [overflow-wrap:anywhere]">{subject}</blockquote>
    <p className="max-w-md text-base leading-7 text-stone-300">{instruction}</p>
    <button type="button" aria-pressed={noticed} onClick={() => setNoticed(!noticed)} className="min-h-12 rounded-lg border border-violet-200/30 px-5 py-3 text-violet-100">{noticed ? "撤销标记" : "注意到了"}</button>
    <p aria-live="polite" className="min-h-6 text-sm text-stone-400">{noticed ? "已记下这次主动标记。" : "不需要点，也不需要让念头消失。"}</p>
  </div>;
}

function BodySpaceEngine({ methodId, instruction }: { methodId: MethodId; instruction: string; stepIndex: number }) {
  const zones = [
    { id: "feet", label: "脚底", x: "50%", y: "82%" },
    { id: "palms", label: "手掌", x: "28%", y: "54%" },
    { id: "chest", label: "胸口", x: "50%", y: "40%" },
    { id: "shoulders", label: "肩颈", x: "50%", y: "28%" },
  ] as const;
  const fields = ["声音", "身体", "念头", "空间"];
  const [zoneId, setZoneId] = useState<(typeof zones)[number]["id"]>("feet");
  const [contact, setContact] = useState(false);
  const [manualAwarenessFields, setManualAwarenessFields] = useState<string[]>([]);
  const selected = zones.find((zone) => zone.id === zoneId) ?? zones[0];
  const activeAwarenessFields = manualAwarenessFields;
  function toggleAwarenessField(field: string) {
    setManualAwarenessFields((current) => {
      return current.includes(field) ? current.filter((item) => item !== field) : [...current, field];
    });
  }
  if (methodId === "open-awareness") {
    return <div className="grid flex-1 content-center gap-6 p-5 text-center">
      <p className="text-lg leading-8 text-stone-200">{instruction}</p>
      <div role="group" aria-label="可选的觉察标记" className="grid grid-cols-2 gap-3">{fields.map(field => <button key={field} type="button" aria-pressed={activeAwarenessFields.includes(field)} onClick={() => toggleAwarenessField(field)} className={`min-h-12 rounded-lg border px-4 py-3 ${activeAwarenessFields.includes(field) ? "border-violet-200 bg-violet-100/10 text-white" : "border-white/20 text-stone-300"}`}>{field}</button>)}</div>
      <p aria-live="polite" className="text-sm text-violet-100">主动标记：{activeAwarenessFields.join("、") || "暂无"}</p>
      <p className="text-sm text-stone-400">不需要凑齐，也可以什么都不标记。</p>
    </div>;
  }
  if (methodId === "release") {
    return <div className="grid flex-1 content-center gap-6 p-5 text-center">
      <p data-testid="boundary-guidance" className="text-xl leading-9 text-rose-50">{contact ? instruction : "先不回想那件事。看一件中性物品，感受脚底的支撑。"}</p>
      <button type="button" aria-pressed={contact} onClick={() => setContact(!contact)} className="min-h-12 rounded-lg border border-rose-100/30 px-4 py-3 text-rose-50">{contact ? "暂不接触这件事" : "愿意继续观察反应"}</button>
      <p className="text-sm leading-7 text-stone-400">这只改变本次引导，不代表你已宽恕，也不要求和解或联系对方。</p>
    </div>;
  }
  return <div className="grid flex-1 content-center gap-5 rounded-[2rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.12),transparent_45%),rgba(2,6,23,0.72)] p-6"><div className="grid gap-5 sm:grid-cols-[0.78fr_1fr] sm:items-center"><div className="relative mx-auto h-72 w-44 rounded-full border border-cyan-100/15 bg-[radial-gradient(ellipse_at_center,rgba(125,211,252,0.12),transparent_62%)]"><span className="absolute left-1/2 top-5 h-14 w-14 -translate-x-1/2 rounded-full border border-cyan-100/20 bg-cyan-100/[0.04]" /><span className="absolute left-1/2 top-20 h-28 w-20 -translate-x-1/2 rounded-[999px] border border-cyan-100/20 bg-cyan-100/[0.035]" />{zones.map((zone) => <button key={zone.id} type="button" onClick={() => setZoneId(zone.id)} aria-label={`标记${zone.label}`} aria-pressed={zone.id === zoneId} className={`absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-semibold transition ${zone.id === zoneId ? "border-cyan-100/70 bg-cyan-100/22 text-white shadow-[0_0_30px_rgba(34,211,238,0.24)]" : "border-cyan-100/20 bg-slate-950/72 text-cyan-100/70"}`} style={{ left: zone.x, top: zone.y }}>{zone.label.slice(0, 1)}</button>)}</div><div className="space-y-3 text-center sm:text-left"><p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">身体落点</p><p className="text-3xl font-semibold text-white">{selected.label}</p><p className="text-sm leading-7 text-stone-300">注意这里有什么感觉，也可以没有明显感觉。不需要解释原因。</p><p className="text-xl font-semibold leading-9 text-white">{instruction}</p></div></div></div>;
}

function PerspectiveZoomEngine({ instruction, stepIndex }: { instruction: string; stepIndex: number }) {
  const levels = [
    { id: "room", label: "房间", body: "看见此刻的身体和桌面", scale: 1 },
    { id: "city", label: "城市", body: "这件事只是城市里的一小格", scale: 0.78 },
    { id: "earth", label: "地球", body: "今天只是地球上的一束灯光", scale: 0.56 },
    { id: "sky", label: "宇宙", body: "把它放进更大的时间线", scale: 0.38 },
  ] as const;
  const [manualZoomIndex, setManualZoomIndex] = useState<number | undefined>();
  const zoomIndex = manualZoomIndex ?? Math.min(stepIndex, levels.length - 1);
  const active = levels[zoomIndex] ?? levels[0];
  return <div className="grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(96,165,250,0.16),transparent_44%),rgba(2,6,23,0.78)] p-6 text-center"><div className="relative grid h-72 w-72 place-items-center"><span className="absolute h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_28%,#eff6ff,#60a5fa_32%,#1d4ed8_62%,#020617)] shadow-[0_0_44px_rgba(96,165,250,0.32)] transition" style={{ transform: `scale(${active.scale})`, opacity: Math.max(0.34, active.scale) }} />{[0, 1, 2, 3, 4].map((index) => <span key={index} className="distance-star absolute h-1.5 w-1.5 rounded-full bg-white/70" style={{ left: `${18 + index * 15}%`, top: `${16 + (index % 3) * 22}%`, animationDelay: `${index * 0.4}s`, opacity: zoomIndex >= 1 ? 0.75 : 0.22 }} />)}{levels.map((item, index) => <span key={item.id} className={`absolute rounded-full border transition ${index <= zoomIndex ? "border-violet-100/35 bg-violet-100/[0.045]" : "border-white/10"}`} style={{ width: 96 + index * 72, height: 96 + index * 72 }} />)}<span className="relative mt-28 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-stone-200">{active.label}</span></div><input aria-label="拉远镜头" type="range" min="0" max="3" value={zoomIndex} onChange={(event) => setManualZoomIndex(Number(event.target.value))} className="w-full max-w-sm accent-violet-200" /><p className="max-w-md text-sm leading-6 text-sky-100/70">{active.body}</p><p className="max-w-md text-base leading-8 text-stone-300">{instruction}</p><p className="text-xs text-stone-500">拖动镜头，从近景拉到高空；最后仍要回到一个现实小动作。</p></div>;
}
