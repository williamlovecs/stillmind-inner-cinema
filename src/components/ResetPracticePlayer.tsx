"use client";

// Extracted from the existing reset page without changing method layouts.
// The parent owns the session clock; this component only renders guided visuals and controls.
import Image from "next/image";
import { useEffect, useState } from "react";
import type { PracticeVariant } from "@stillmind/content";
import type { MethodDefinition, MethodId } from "@stillmind/domain";
import type { CinemaPayload } from "@/lib/cinema-presets";

export function PracticePlayer({ method, practice, stepIndex, secondsLeft, elapsedSeconds, breathingSeconds, progress, paused, trigger, cinema, onPause, onStop }: { method: MethodDefinition; practice: PracticeVariant; stepIndex: number; secondsLeft: number; elapsedSeconds: number; breathingSeconds: number; progress: number; paused: boolean; trigger: string; cinema: CinemaPayload; onPause: () => void; onStop: () => void }) {
  const step = practice.steps[stepIndex];
  return <div className="flex h-full flex-col gap-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.24em] text-violet-200/60">{method.title}</p><h3 className="mt-2 text-2xl font-semibold text-white">{step.title}</h3></div><div className="text-right"><p className="text-4xl font-semibold tabular-nums text-white">{secondsLeft}</p><p className="text-xs uppercase tracking-[0.22em] text-stone-500">秒</p></div></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-200 to-amber-200 transition-[width]" style={{ width: `${progress}%` }} /></div><fieldset disabled={paused} data-practice-paused={paused} className="contents"><MethodExperience paused={paused} methodId={method.id} instruction={step.instruction} secondsLeft={secondsLeft} elapsedSeconds={elapsedSeconds} breathingSeconds={breathingSeconds} stepIndex={stepIndex} trigger={trigger} cinema={cinema} /></fieldset><p className="text-xs leading-5 text-stone-500">{practice.steps[stepIndex].alternative ?? "不舒服就停止，不需要完成。"}</p><div className="mt-auto flex flex-wrap gap-3"><button type="button" onClick={onPause} className="rounded-full border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-200/35">{paused ? "继续" : "暂停"}</button><button type="button" onClick={onStop} className="rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-stone-300 transition hover:border-amber-200/35 hover:text-white">停止</button></div></div>;
}

function MethodExperience({ methodId, instruction, secondsLeft, elapsedSeconds, breathingSeconds, stepIndex, trigger, cinema, paused }: { paused: boolean; methodId: MethodId; instruction: string; secondsLeft: number; elapsedSeconds: number; breathingSeconds: number; stepIndex: number; trigger: string; cinema: CinemaPayload }) {
  const breathIn = Math.floor(elapsedSeconds / 3) % 2 === 0;
  const thoughts = cinema.innerNoise.length > 0 ? cinema.innerNoise : ["我必须回应", "是不是我不够好", "他们不理解我", "我不能输"];
  if (["paced-breath", "wide-gaze", "trigger-journal", "grounded-action"].includes(methodId)) {
    return <FocusObjectEngine paused={paused} elapsedSeconds={elapsedSeconds} methodId={methodId} instruction={instruction} secondsLeft={secondsLeft} breathingSeconds={breathingSeconds} stepIndex={stepIndex} breathIn={breathIn} />;
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

function FocusObjectEngine({ methodId, instruction, secondsLeft, breathingSeconds, stepIndex, breathIn, paused, elapsedSeconds }: { paused: boolean; elapsedSeconds: number; methodId: MethodId; instruction: string; secondsLeft: number; breathingSeconds: number; stepIndex: number; breathIn: boolean }) {
  const [returns, setReturns] = useState(0);
  const [resetAt, setResetAt] = useState(elapsedSeconds);
  const [stability, setStability] = useState(34);
  const [holding, setHolding] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number>();
  const exhaleCount = Math.max(0, Math.floor(breathingSeconds / 6));
  const steadySeconds = Math.floor(Math.max(0, elapsedSeconds - resetAt));
  const detailSteps = [
    { label: "环境", value: "这个房间", hint: "先看见大范围", x: "50%", y: "50%" },
    { label: "对象", value: "一个杯子", hint: "把镜头推近", x: "48%", y: "48%" },
    { label: "细节", value: "杯沿高光", hint: "只看一个小点", x: "55%", y: "38%" },
    { label: "触感", value: "脚底压力", hint: "加入身体感官", x: "48%", y: "78%" },
  ] as const;
  const suggestedDetailIndex = Math.min(stepIndex, detailSteps.length - 1);
  const activeDetailIndex = detailIndex ?? suggestedDetailIndex;
  const activeDetail = detailSteps[activeDetailIndex] ?? detailSteps[0];
  useEffect(() => {
    if (methodId !== "trigger-journal" || paused) return;
    const timer = window.setInterval(() => {
      setStability((value) => {
        const next = holding ? value + 5 : value - 1.4;
        return Math.min(100, Math.max(22, next));
      });
    }, 320);
    return () => window.clearInterval(timer);
  }, [holding, methodId, paused]);
  useEffect(() => {
    if (!paused) return;
    const timer = window.setTimeout(() => setHolding(false), 0);
    return () => window.clearTimeout(timer);
  }, [paused]);

  if (methodId === "paced-breath") {
    const ripples = Array.from({ length: 4 }, (_, index) => index);
    const countTrail = Array.from({ length: Math.min(6, exhaleCount) }, (_, index) => exhaleCount - index).reverse();
    return (
      <div className="grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_48%),radial-gradient(circle_at_50%_78%,rgba(139,92,246,0.2),transparent_56%),rgba(2,6,23,0.76)] p-6 text-center">
        <div className="relative grid h-56 w-56 place-items-center">
          {ripples.map((index) => <span key={index} className="absolute rounded-full border border-sky-100/20" style={{ width: 118 + index * 34, height: 118 + index * 34, opacity: Math.max(0.1, 0.38 - index * 0.07), animation: `breathRipple ${2.6 + index * 0.35}s ease-out infinite`, animationDelay: `${index * 0.28}s` }} />)}
          <div className={`relative grid h-44 w-44 place-items-center rounded-full border border-sky-100/25 bg-[radial-gradient(circle_at_36%_28%,rgba(255,255,255,0.92),rgba(186,230,253,0.58)_18%,rgba(59,130,246,0.28)_44%,rgba(15,23,42,0.96)_74%)] shadow-[0_0_46px_rgba(96,165,250,0.26),0_0_86px_rgba(168,85,247,0.2)] transition duration-1000 ${breathIn ? "scale-105" : "scale-[0.92]"}`}>
            <span className="text-xl font-semibold tracking-[0.28em] text-white">{breathIn ? "吸 气" : "呼 气"}</span>
          </div>
        </div>
        <p className="mt-6 max-w-md text-base leading-8 text-stone-300">{instruction}</p>
        <div className="mt-5 rounded-2xl border border-sky-100/15 bg-sky-100/[0.06] px-4 py-3">
          <p className="text-xs text-sky-100/55">光圈是节奏提示，不检测你的呼吸。</p>
          <p className="mt-1 text-sm font-semibold text-sky-50">引导节拍：{exhaleCount}</p>
        </div>
        {countTrail.length > 0 ? <div className="mt-3 flex flex-wrap justify-center gap-1.5">{countTrail.map((count) => <span key={count} className="grid h-7 w-7 place-items-center rounded-full border border-sky-100/15 bg-sky-100/[0.06] text-xs text-sky-50">{count}</span>)}</div> : null}
        <p className="mt-2 text-xs text-sky-100/55">重点是数呼气，不是用力控制呼吸。</p>
      </div>
    );
  }
  if (methodId === "wide-gaze") {
    function markWandered() { setReturns((value) => value + 1); setResetAt(elapsedSeconds); }
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
        <div className="mt-3 grid w-full max-w-md grid-cols-2 gap-2"><div className="rounded-2xl border border-sky-100/15 bg-sky-100/[0.07] p-3"><p className="text-xs text-sky-100/55">距上次点击</p><p className="mt-1 text-2xl font-semibold text-sky-50">{steadySeconds}s</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs text-stone-500">主动点击次数</p><p className="mt-1 text-2xl font-semibold text-white">{returns}</p></div></div>
      </div>
    );
  }
  if (methodId === "trigger-journal") {
    const steady = stability >= 72;
    return (
      <div className="grid flex-1 content-center gap-5 overflow-hidden rounded-[2rem] border border-emerald-200/15 bg-[radial-gradient(circle_at_50%_24%,rgba(16,185,129,0.14),transparent_46%),rgba(2,6,23,0.76)] p-6 text-center">
        <button type="button" onPointerDown={() => setHolding(true)} onPointerUp={() => setHolding(false)} onPointerCancel={() => setHolding(false)} onPointerLeave={() => setHolding(false)} aria-label="按住画面让它慢下来" className={`illusion-field mx-auto grid h-60 w-60 place-items-center rounded-[2rem] border border-emerald-100/15 transition duration-700 active:scale-[0.98] ${steady ? "illusion-steady scale-95 opacity-75" : "scale-100 opacity-100"}`} style={{ animationDuration: `${Math.max(2.4, 9 - stability / 14)}s` }}><span className="rounded-full bg-slate-950/75 px-4 py-2 text-sm text-emerald-50">{holding ? "正在稳定画面" : steady ? "画面慢下来了" : "按住画面"}</span></button>
        <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center justify-between text-xs text-stone-500"><span>晃动</span><span>稳定</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-100 transition-[width]" style={{ width: `${stability}%` }} /></div><p className="mt-2 text-sm text-emerald-50">画面变化（非身体或心理测量）</p></div>
        <p className="mx-auto max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p>
        <p className="text-xs text-stone-500">按住图案让它慢下来，松开后观察它恢复移动。剩余 {secondsLeft} 秒。</p>
      </div>
    );
  }
  return (
    <div className="grid flex-1 content-center gap-5 rounded-[2rem] border border-amber-200/15 bg-[radial-gradient(circle_at_50%_22%,rgba(245,158,11,0.12),transparent_46%),rgba(2,6,23,0.72)] p-6 text-center">
      <div className="relative mx-auto h-56 w-56 rounded-full border border-amber-100/20 bg-amber-200/10 shadow-[0_0_60px_rgba(245,158,11,0.18)]">
        <span className="absolute inset-10 rounded-full border border-amber-100/10" />
        <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-100/25 bg-slate-950/50" />
        {detailSteps.map((item, index) => <button key={item.label} type="button" aria-pressed={index === activeDetailIndex} onClick={() => setDetailIndex(index)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-2 text-xs font-semibold transition ${index === activeDetailIndex ? "border-amber-100/65 bg-amber-100/18 text-white" : "border-white/10 bg-slate-950/70 text-stone-400"}`} style={{ left: item.x, top: item.y }}>{item.label}</button>)}
      </div>
      <div className="mx-auto max-w-md rounded-2xl border border-amber-100/15 bg-amber-100/[0.07] p-4"><p className="text-xs text-amber-100/55">当前焦点</p><p className="mt-1 text-2xl font-semibold text-amber-50">{activeDetail.value}</p><p className="mt-2 text-sm text-stone-400">{activeDetail.hint}</p></div>
      <p className="mx-auto max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p>
    </div>
  );
}

function ThoughtBubbleEngine({ methodId, instruction, stepIndex, thoughts, trigger, cinema }: { methodId: MethodId; instruction: string; stepIndex: number; thoughts: string[]; trigger: string; cinema: CinemaPayload }) {
  const [seen, setSeen] = useState<Record<string, "升起" | "停留" | "落下">>({});
  const [name, setName] = useState("Will");
  const [sentence, setSentence] = useState(trigger || "我现在很想证明自己没错。");
  const [manualCinemaLens, setManualCinemaLens] = useState<number>();
  const [manualLogoutMode, setManualLogoutMode] = useState<"explain" | "join" | "logout">();
  const shifted = sentence.replaceAll("我", name || "这个人");
  const further = `一个人正在经历：${shifted.replaceAll(name || "这个人", "").trim() || sentence.replaceAll("我", "")}`;
  const lenses = [
    { id: "role", label: "角色里", body: "我正在被剧情拉走" },
    { id: "audience", label: "观众席", body: "我正在看见这一幕" },
    { id: "witness", label: "见证位", body: "念头经过，不必进入" },
  ] as const;
  const activeLensIndex = manualCinemaLens ?? Math.min(stepIndex, lenses.length - 1);
  const activeLens = lenses[activeLensIndex] ?? lenses[0];
  function toggleSeen(thought: string) {
    setSeen((items) => {
      const current = items[thought];
      const next = current === "升起" ? "停留" : current === "停留" ? "落下" : current === "落下" ? undefined : "升起";
      const copy = { ...items };
      if (next) copy[thought] = next; else delete copy[thought];
      return copy;
    });
  }
  if (methodId === "person-shift") {
    return (
      <div className="grid flex-1 content-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/62 p-5">
        <p className="text-base leading-7 text-stone-300">{instruction}</p>
        <div className="grid gap-3 sm:grid-cols-[0.42fr_1fr]"><input aria-label="用于人称替代的名字" name="observer-name" autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white focus:border-violet-200/50" placeholder="你的名字" /><textarea aria-label="需要转换为旁观语言的念头" name="observer-sentence" autoComplete="off" value={sentence} onChange={(event) => setSentence(event.target.value)} className="min-h-24 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-stone-600 focus:border-violet-200/50" placeholder="写一句脑内正在说的话" /></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center justify-between text-xs text-stone-500"><span>入戏语言</span><span>旁观语言</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full w-[82%] rounded-full bg-gradient-to-r from-violet-300 to-amber-100" /></div><p className="mt-2 text-xs text-stone-500">输入时自动转换，不需要再做选择。</p></div>
        <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-2xl border border-violet-100/35 bg-violet-100/10 p-3 text-left text-white"><span className="block text-xs uppercase tracking-[0.2em] opacity-70">名字视角</span><span className="mt-2 block text-sm leading-6">{shifted}</span></div><div className="rounded-2xl border border-amber-100/35 bg-amber-100/10 p-3 text-left text-white"><span className="block text-xs uppercase tracking-[0.2em] opacity-70">再退一步</span><span className="mt-2 block text-sm leading-6">{further}</span></div></div>
      </div>
    );
  }
  if (methodId === "inner-cinema") {
    const scene = cinema.scenes[Math.min(stepIndex, cinema.scenes.length - 1)];
    return (
      <div className="flex flex-1 flex-col justify-center rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.14),transparent_45%),#050914] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-violet-200/55">{cinema.title} · {scene?.label ?? `Scene ${String(stepIndex + 1).padStart(2, "0")}`}</p>
        <p className="mx-auto mt-7 max-w-2xl text-2xl font-semibold leading-snug text-white sm:text-3xl">{scene?.line ?? instruction}</p>
        <p className="mt-6 text-xs text-stone-400">当前镜头：{activeLens.label}（不是状态测量）</p>
        <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-3 gap-2">{lenses.map((item, index) => <button key={item.id} type="button" aria-pressed={index === activeLensIndex} onClick={() => setManualCinemaLens(index)} className={`rounded-2xl border p-3 text-left transition ${index === activeLensIndex ? "border-violet-100/60 bg-violet-100/14 text-white shadow-[0_0_28px_rgba(168,85,247,0.16)]" : "border-white/10 bg-white/[0.035] text-stone-500 hover:border-violet-200/30 hover:text-stone-300"}`}><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 hidden text-xs leading-5 opacity-75 sm:block">{item.body}</span></button>)}</div>
      </div>
    );
  }
  if (methodId === "logout-pause") {
    const options = [
      { id: "explain", label: "解释", body: "我在给它编故事", quiet: 18 },
      { id: "join", label: "参与", body: "我想马上回应", quiet: 38 },
      { id: "logout", label: "只读", body: "先不解释，不参与", quiet: 76 },
    ] as const;
    const activeId = manualLogoutMode ?? options[Math.min(stepIndex, options.length - 1)]?.id ?? "explain";
    const active = options.find((item) => item.id === activeId) ?? options[0];
    return <div className="grid flex-1 content-center gap-4 rounded-[2rem] border border-white/10 bg-slate-950/62 p-6"><p className="text-center text-xl font-semibold leading-9 text-white">{instruction}</p><div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><div className="flex items-center justify-between text-xs text-stone-500"><span>信息互动</span><span>只读模式</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-200 to-violet-300 transition-[width] duration-700" style={{ width: `${active.quiet}%` }} /></div><p className="mt-2 text-sm text-stone-300">{active.body}</p></div><div className="grid grid-cols-3 gap-2 text-center text-sm">{options.map((item) => <button key={item.id} type="button" aria-pressed={item.id === active.id} onClick={() => setManualLogoutMode(item.id)} className={`rounded-2xl border px-2 py-4 transition sm:p-4 ${item.id === active.id ? "border-amber-200/45 bg-amber-200/12 text-amber-50" : "border-white/10 bg-white/[0.035] text-stone-500 hover:border-amber-200/25 hover:text-stone-300"}`}><span className="block font-semibold">{item.label}</span><span className="mt-2 hidden text-xs leading-5 opacity-75 sm:block">{item.body}</span></button>)}</div></div>;
  }
  const seenCount = Object.keys(seen).length;
  return <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.16),transparent_55%),rgba(2,6,23,0.72)] p-6 text-center"><div className="absolute inset-10 rounded-full border border-violet-200/10" /><div className="absolute inset-20 rounded-full border border-amber-200/10" />{thoughts.map((thought, index) => <button key={thought} type="button" onClick={() => toggleSeen(thought)} className={`absolute rounded-full border px-3 py-2 text-xs shadow-lg shadow-black/20 transition ${seen[thought] === "落下" ? "border-amber-100/35 bg-amber-100/10 text-amber-50 opacity-45" : seen[thought] ? "border-violet-100/45 bg-violet-100/12 text-violet-50" : "border-white/10 bg-white/[0.055] text-stone-300 hover:border-violet-200/35"}`} style={{ left: `${16 + (index % 2) * 55}%`, top: `${18 + index * 15}%`, opacity: seen[thought] === "落下" ? 0.45 : Math.max(0.26, 0.88 - (stepIndex + index) * 0.16) }}>{thought}{seen[thought] ? ` · ${seen[thought]}` : ""}</button>)}<div className="relative grid h-36 w-36 place-items-center rounded-full border border-violet-100/20 bg-violet-200/10 shadow-[0_0_70px_rgba(168,85,247,0.22)]"><span className="text-sm font-semibold tracking-[0.26em] text-violet-100">看见 {seenCount}</span></div><p className="relative max-w-xl text-xl font-semibold leading-9 text-white">{instruction}</p><p className="relative text-xs text-stone-500">点念头表示“看见了”，不是为了处理它。</p></div>;
}

function BodySpaceEngine({ methodId, instruction, stepIndex }: { methodId: MethodId; instruction: string; stepIndex: number }) {
  const zones = [
    { id: "feet", label: "脚底", x: "50%", y: "82%" },
    { id: "palms", label: "手掌", x: "28%", y: "54%" },
    { id: "chest", label: "胸口", x: "50%", y: "40%" },
    { id: "shoulders", label: "肩颈", x: "50%", y: "28%" },
  ] as const;
  const fields = ["声音", "身体", "念头", "空间"];
  const [zoneId, setZoneId] = useState<(typeof zones)[number]["id"]>("feet");
  const [releaseDistance, setReleaseDistance] = useState(54);
  const [manualAwarenessFields, setManualAwarenessFields] = useState<string[]>();
  const selected = zones.find((zone) => zone.id === zoneId) ?? zones[0];
  const includedCount = Math.min(fields.length, stepIndex + 1);
  const activeAwarenessFields = manualAwarenessFields ?? fields.slice(0, includedCount);
  function toggleAwarenessField(field: string) {
    setManualAwarenessFields((current) => {
      const base = current ?? fields.slice(0, includedCount);
      return base.includes(field) ? base.filter((item) => item !== field) : [...base, field];
    });
  }
  if (methodId === "open-awareness") {
    return <div className="relative grid flex-1 place-items-center overflow-hidden rounded-[2rem] border border-violet-200/15 bg-[radial-gradient(circle_at_center,rgba(216,180,254,0.13),transparent_52%),rgba(2,6,23,0.72)] p-6 text-center">{[0, 1, 2, 3].map((index) => <span key={index} className="absolute rounded-full border border-violet-100/10 transition-[width,height,opacity]" style={{ width: 110 + index * 74 + activeAwarenessFields.length * 18, height: 110 + index * 74 + activeAwarenessFields.length * 18, opacity: Math.max(0.12, 0.74 - index * 0.14) }} />)}<div className="relative grid grid-cols-2 gap-3 sm:grid-cols-4">{fields.map((field) => <button key={field} type="button" aria-pressed={activeAwarenessFields.includes(field)} onClick={() => toggleAwarenessField(field)} className={`rounded-full border px-5 py-3 text-sm transition ${activeAwarenessFields.includes(field) ? "border-violet-100/45 bg-violet-100/13 text-violet-50 shadow-[0_0_22px_rgba(216,180,254,0.12)]" : "border-white/10 bg-white/[0.04] text-stone-500 hover:border-violet-200/30 hover:text-stone-300"}`}>{field}</button>)}</div><p className="relative mt-5 text-xs text-violet-100/55">已纳入：{activeAwarenessFields.length > 0 ? activeAwarenessFields.join("、") : "暂时留白"}</p><p className="absolute bottom-16 max-w-xl px-6 text-xl font-semibold leading-9 text-white">{instruction}</p><p className="absolute bottom-7 text-xs text-stone-500">点选要纳入的经验；这是扩展注意范围，不是在追求神秘体验。</p></div>;
  }
  if (methodId === "release") {
    return <div className="grid flex-1 place-items-center rounded-[2rem] border border-rose-200/15 bg-[radial-gradient(circle_at_50%_16%,rgba(251,113,133,0.12),transparent_42%),rgba(2,6,23,0.72)] p-6 text-center"><div className="relative h-44 w-44 rounded-full border border-rose-100/20 bg-rose-100/[0.04]"><span className="absolute inset-8 rounded-full border border-amber-100/15" style={{ transform: `scale(${releaseDistance / 64})` }} /><span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-200/20 blur-sm" /></div><p className="mt-5 text-xl font-semibold leading-9 text-white">{instruction}</p><p className="mt-2 text-sm text-rose-100/70">拖动边界圈。宽恕不是取消边界，是让自己少重播一次。</p><input aria-label="边界距离" type="range" min="30" max="100" value={releaseDistance} onChange={(event) => setReleaseDistance(Number(event.target.value))} className="mt-4 w-full max-w-sm accent-rose-200" /><p className="text-xs text-stone-500">调整的是画面圆圈，不代表现实边界评分。</p></div>;
  }
  return <div className="grid flex-1 content-center gap-5 rounded-[2rem] border border-cyan-200/15 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.12),transparent_45%),rgba(2,6,23,0.72)] p-6"><div className="grid gap-5 sm:grid-cols-[0.78fr_1fr] sm:items-center"><div className="relative mx-auto h-72 w-44 rounded-full border border-cyan-100/15 bg-[radial-gradient(ellipse_at_center,rgba(125,211,252,0.12),transparent_62%)]"><span className="absolute left-1/2 top-5 h-14 w-14 -translate-x-1/2 rounded-full border border-cyan-100/20 bg-cyan-100/[0.04]" /><span className="absolute left-1/2 top-20 h-28 w-20 -translate-x-1/2 rounded-[999px] border border-cyan-100/20 bg-cyan-100/[0.035]" />{zones.map((zone) => <button key={zone.id} type="button" onClick={() => setZoneId(zone.id)} aria-label={`标记${zone.label}`} className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-xs font-semibold transition ${zone.id === zoneId ? "border-cyan-100/70 bg-cyan-100/22 text-white shadow-[0_0_30px_rgba(34,211,238,0.24)]" : "border-cyan-100/20 bg-slate-950/72 text-cyan-100/70"}`} style={{ left: zone.x, top: zone.y }}>{zone.label.slice(0, 1)}</button>)}</div><div className="space-y-3 text-center sm:text-left"><p className="text-xs uppercase tracking-[0.24em] text-cyan-100/50">身体落点</p><p className="text-3xl font-semibold text-white">{selected.label}</p><p className="text-sm leading-7 text-stone-300">注意这里有什么感觉，也可以没有明显感觉。不需要解释原因。</p><p className="text-xl font-semibold leading-9 text-white">{instruction}</p></div></div></div>;
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
