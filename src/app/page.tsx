"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  containsHighRiskLanguage,
  detectStateModeFromText,
  RESET_STATE_BY_MODE,
  type ActivationLevel,
} from "@stillmind/domain";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import {
  PENDING_ACTIVATION_KEY,
  PENDING_INPUT_METHOD_KEY,
  PENDING_MODE_KEY,
  PENDING_TRIGGER_KEY,
} from "@/lib/reset-routing";

type InputMethod = "typed" | "dictation" | "example" | "state-only";
type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = { readonly isFinal: boolean; readonly length: number; [index: number]: SpeechRecognitionAlternativeLike };
type SpeechRecognitionEventLike = { readonly resultIndex: number; readonly results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const EXAMPLES = ["我被批评了", "我刚发生冲突", "我想证明自己"];
const ACTIVATION_LABELS: Record<ActivationLevel, string> = {
  1: "稳定",
  2: "有一点",
  3: "明显",
  4: "很强",
  5: "被带走",
};

export default function Home() {
  const router = useRouter();
  const [trigger, setTrigger] = useState("");
  const [activation, setActivation] = useState<ActivationLevel>(4);
  const [inputMethod, setInputMethod] = useState<InputMethod>("state-only");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");

  const mode = useMemo(() => detectStateModeFromText(trigger), [trigger]);
  const matchedState = RESET_STATE_BY_MODE.get(mode);

  useEffect(() => {
    router.prefetch("/reset");
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const capabilityTimer = window.setTimeout(() => {
      setVoiceSupported(Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition));
    }, 0);
    return () => {
      window.clearTimeout(capabilityTimer);
      recognitionRef.current?.abort();
    };
  }, [router]);

  function updateTrigger(value: string, method: InputMethod = "typed") {
    setTrigger(value.slice(0, 500));
    setInputMethod(value.trim() ? method : "state-only");
    setSafetyNotice(false);
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";
    voiceBaseRef.current = trigger.trim();
    recognition.onstart = () => {
      setListening(true);
      setInputMethod("dictation");
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += ` ${event.results[index]?.[0]?.transcript ?? ""}`;
      }
      updateTrigger([voiceBaseRef.current, transcript.trim()].filter(Boolean).join(" "), "dictation");
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  function startReset() {
    const text = trigger.trim();
    if (text && containsHighRiskLanguage(text)) {
      setSafetyNotice(true);
      return;
    }
    setStarting(true);
    try {
      window.sessionStorage.setItem(PENDING_TRIGGER_KEY, text);
      window.sessionStorage.setItem(PENDING_MODE_KEY, mode);
      window.sessionStorage.setItem(PENDING_ACTIVATION_KEY, String(activation));
      window.sessionStorage.setItem(PENDING_INPUT_METHOD_KEY, text ? inputMethod : "state-only");
    } catch {
      // Private browsing can disable sessionStorage; safe route params still preserve the reset.
    }
    router.push(`/reset?mode=${mode}&activation=${activation}&direct=1`);
  }

  return (
    <>
      <DisclaimerModal />
      <main className="relative min-h-dvh overflow-hidden bg-[#050914] text-stone-50">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(139,92,246,0.24),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(96,165,250,0.13),transparent_28%),radial-gradient(circle_at_68%_86%,rgba(245,158,11,0.12),transparent_34%),linear-gradient(145deg,#050914_0%,#07111f_48%,#0b1020_100%)]" />
        <section className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-5 sm:px-7 sm:py-7">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-fuchsia-200 via-violet-500 to-sky-500 p-[2px] shadow-lg shadow-violet-950/30"><span className="h-full w-full rounded-full bg-[#070d1b]" /></span>
              <span><span className="block text-xs uppercase tracking-[0.34em] text-violet-100/70">StillMind</span><span className="mt-0.5 block text-sm font-medium text-stone-200">沉寂小我</span></span>
            </div>
            <Link href="/methods" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-stone-300 transition hover:border-violet-200/35 hover:text-white">方法库</Link>
          </header>

          <div className="flex flex-1 items-center py-7 sm:py-10">
            <section className="w-full rounded-[2rem] border border-violet-200/15 bg-[#081123]/82 p-5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-7">
              <h1 className="text-4xl font-semibold leading-[1.12] text-white sm:text-5xl">现在发生了什么？</h1>
              <p className="mt-3 text-base text-stone-400">说一句就够。先暂停 1 分钟。</p>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone-200">说一句，或者写一句</p>
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={!voiceSupported}
                    aria-pressed={listening}
                    className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${listening ? "border-rose-200/55 bg-rose-200/14 text-rose-50" : voiceSupported ? "border-violet-200/35 bg-violet-200/10 text-violet-50 hover:bg-violet-200/16" : "cursor-not-allowed border-white/10 text-stone-600"}`}
                  >
                    {listening ? "正在听 · 停止" : voiceSupported ? "开始说" : "用键盘输入"}
                  </button>
                </div>
                <textarea
                  aria-label="现在发生了什么"
                  value={trigger}
                  onChange={(event) => updateTrigger(event.target.value)}
                  maxLength={500}
                  autoComplete="off"
                  placeholder="比如：我被批评了，现在很想反击。"
                  className="mt-4 min-h-28 w-full resize-none rounded-[1.25rem] border border-white/10 bg-slate-950/65 p-4 text-base leading-7 text-white outline-none placeholder:text-stone-600 focus:border-violet-200/45"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXAMPLES.map((example) => <button key={example} type="button" onClick={() => updateTrigger(example, "example")} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-stone-400 transition hover:border-violet-200/35 hover:text-white">{example}</button>)}
                </div>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone-200">现在被带走的程度</p>
                  <span className="text-sm font-semibold text-amber-100">{activation} · {ACTIVATION_LABELS[activation]}</span>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2" role="radiogroup" aria-label="现在被带走的程度">
                  {([1, 2, 3, 4, 5] as const).map((value) => <button key={value} type="button" role="radio" aria-checked={activation === value} onClick={() => setActivation(value)} className={`grid min-h-11 place-items-center rounded-xl border text-sm font-semibold transition ${activation === value ? "border-amber-100/65 bg-amber-100/15 text-white shadow-[0_0_22px_rgba(245,158,11,0.1)]" : "border-white/10 bg-slate-950/45 text-stone-500 hover:border-violet-200/30 hover:text-stone-200"}`}>{value}</button>)}
                </div>
              </div>

              {safetyNotice ? <div role="alert" className="mt-4 rounded-2xl border border-rose-200/25 bg-rose-200/[0.08] p-4 text-sm leading-6 text-rose-50"><p className="font-semibold">先联系现实中的支持。</p><p className="mt-1 text-rose-100/75">如果你有即时危险或无法保证安全，请联系当地紧急服务、急诊或可信任的人。StillMind 不处理危机场景。</p><Link href="/support" className="mt-3 inline-flex font-semibold underline underline-offset-4">查看支持边界</Link></div> : null}

              <button type="button" onClick={startReset} disabled={starting} className="mt-5 flex min-h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-6 text-base font-semibold text-slate-950 shadow-xl shadow-violet-950/25 transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70">{starting ? "正在进入…" : "开始 1 分钟 Reset"}</button>
              <p className="mt-3 text-center text-xs text-stone-600">匹配：{matchedState?.label ?? "脑子在重播"} · 输入只在本次练习中使用</p>

              <details className="mt-5 border-t border-white/8 pt-4 text-xs leading-5 text-stone-600">
                <summary className="cursor-pointer text-center text-stone-500">隐私与安全</summary>
                <p className="mt-3">不要输入真实姓名、隐私事件、创伤细节或医疗危机场景。本工具只提供日常状态切换练习，不替代心理咨询或医疗帮助。</p>
                <Link href="/support" className="mt-2 inline-flex text-stone-500 underline decoration-white/15 underline-offset-4 transition hover:text-stone-300">支持与危机边界</Link>
              </details>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}
