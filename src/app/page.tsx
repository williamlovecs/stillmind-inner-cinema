"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { containsHighRiskLanguage, detectStateModeFromText, type ActivationLevel } from "@stillmind/domain";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { AppHeader } from "@/components/ui";
import { PracticeOptionsPanel } from "@/components/PracticeOptionsPanel";
import { TodayShortcuts } from "@/components/TodayShortcuts";
import { DEFAULT_PRACTICE_OPTIONS, type PracticeOptions } from "@/lib/practice-options";
import { browserSessionStorage, storeResetDraft } from "@/lib/reset-draft";

type InputMethod = "typed" | "dictation" | "example" | "state-only";
type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = { readonly isFinal: boolean; readonly length: number; [index: number]: SpeechRecognitionAlternativeLike };
type SpeechRecognitionEventLike = { readonly resultIndex: number; readonly results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  continuous: boolean; interimResults: boolean; lang: string;
  onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
const EXAMPLES = ["我被批评了", "我刚发生冲突", "我想证明自己"];
const ACTIVATION_LABELS: Record<ActivationLevel, string> = { 1: "稳定", 2: "有一点", 3: "明显", 4: "很强", 5: "被带走" };

export default function Home() {
  const router = useRouter();
  const [trigger, setTrigger] = useState("");
  // Optional self-report: no preselected value is ever treated as the user's answer.
  const [activation, setActivation] = useState<ActivationLevel | undefined>();
  const [options, setOptions] = useState<PracticeOptions>({ ...DEFAULT_PRACTICE_OPTIONS });
  const [inputMethod, setInputMethod] = useState<InputMethod>("state-only");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseRef = useRef("");
  const stopVoice = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    try { recognition?.abort(); } catch { /* Already ended by the browser. */ }
    setListening(false);
  }, []);
  const mode = useMemo(() => detectStateModeFromText(trigger), [trigger]);
  useEffect(() => {
    router.prefetch("/reset");
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const timer = window.setTimeout(() => setVoiceSupported(Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition)), 0);
    const onVisibility = () => { if (document.hidden) stopVoice(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); stopVoice(); };
  }, [router, stopVoice]);
  function updateTrigger(value: string, method: InputMethod = "typed") {
    setTrigger(value.slice(0, 500)); setInputMethod(value.trim() ? method : "state-only"); setSafetyNotice(false);
  }
  function toggleVoice() {
    if (recognitionRef.current) { stopVoice(); return; }
    const speechWindow = window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "zh-CN";
    voiceBaseRef.current = trigger.trim();
    recognition.onstart = () => { if (recognitionRef.current === recognition) { setListening(true); setInputMethod("dictation"); } };
    recognition.onend = () => { if (recognitionRef.current === recognition) { recognitionRef.current = null; setListening(false); } };
    recognition.onerror = () => { if (recognitionRef.current === recognition) stopVoice(); };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) transcript += ` ${event.results[index]?.[0]?.transcript ?? ""}`;
      updateTrigger([voiceBaseRef.current, transcript.trim()].filter(Boolean).join(" "), "dictation");
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { stopVoice(); }
  }
  function startReset() {
    if (starting) return;
    const text = trigger.trim();
    if (text && containsHighRiskLanguage(text)) { setSafetyNotice(true); return; }
    stopVoice(); setStarting(true);
    const draftId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    storeResetDraft(browserSessionStorage(), { id: draftId, trigger: text, mode, activation,
      inputMethod: text ? inputMethod : "state-only", options });
    const params = new URLSearchParams({ mode, direct: "1", draft: draftId, eyes: options.eyesOpenPreferred ? "1" : "0",
      body: options.bodyFocusAllowed ? "1" : "0", breath: options.breathChangeAllowed ? "1" : "0" });
    if (activation !== undefined) params.set("activation", String(activation));
    router.push(`/reset?${params}`);
  }
  return <>
    <DisclaimerModal />
    <main className="sm-page">
      <section className="sm-container flex min-h-dvh max-w-xl flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center py-7 sm:py-10">
          <section className="w-full py-5">
            <p className="sm-eyebrow">此刻 · 不需要先解释</p>
            <h1 className="sm-title">现在，先停一分钟。</h1>
            <p className="sm-copy mt-3">给自己一点观察与选择的空间，跟着做就好。</p>
            <button type="button" onClick={startReset} disabled={starting} className="sm-button sm-button-primary mt-7 min-h-14 w-full text-base">{starting ? "正在进入…" : "开始 1 分钟 Reset"}</button>
            <TodayShortcuts />
            <details className="mt-5" onToggle={(event) => { if (!event.currentTarget.open) stopVoice(); }}><summary className="min-h-11 cursor-pointer py-3 text-sm text-stone-300">想说一句，或记录此刻程度（可选）</summary>
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-stone-200">说一句，或者写一句</p>
                <button type="button" onClick={toggleVoice} disabled={!voiceSupported} aria-pressed={listening}
                  className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${listening ? "border-rose-200/55 bg-rose-200/14 text-rose-50" : voiceSupported ? "border-violet-200/35 bg-violet-200/10 text-violet-50 hover:bg-violet-200/16" : "cursor-not-allowed border-white/10 text-stone-600"}`}>
                  {listening ? "正在听 · 停止" : voiceSupported ? "开始说" : "用键盘输入"}
                </button>
              </div>
              {voiceSupported ? <p className="mt-2 text-xs text-stone-500">语音由浏览器识别，可能使用云端服务。可改用文字或不输入。</p> : null}
              <textarea aria-label="现在发生了什么" value={trigger} onChange={(event) => { stopVoice(); updateTrigger(event.target.value); }} maxLength={500} autoComplete="off" placeholder="比如：我被批评了，现在很想反击。"
                className="mt-4 min-h-28 w-full resize-none rounded-[1.25rem] border border-white/10 bg-slate-950/65 p-4 text-base leading-7 text-white outline-none placeholder:text-stone-600 focus:border-violet-200/45" />
              <div className="mt-3 flex flex-wrap gap-2">{EXAMPLES.map((example) => <button key={example} type="button" onClick={() => { stopVoice(); updateTrigger(example, "example"); }} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-sm text-stone-400 transition hover:border-violet-200/35 hover:text-white">{example}</button>)}</div>
            </div>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-stone-200">现在被带走的程度（可选）</p><span className="text-sm font-semibold text-amber-100">{activation === undefined ? "未填写" : `${activation} · ${ACTIVATION_LABELS[activation]}`}</span></div>
              <div className="mt-4 grid grid-cols-5 gap-2" role="group" aria-label="现在被带走的程度，1稳定，5被带走，再点一次取消">
                {([1, 2, 3, 4, 5] as const).map((value) => <button key={value} type="button" aria-pressed={activation === value} onClick={() => setActivation(activation === value ? undefined : value)} className={`grid min-h-11 place-items-center rounded-xl border text-sm font-semibold transition ${activation === value ? "border-amber-100/65 bg-amber-100/15 text-white shadow-[0_0_22px_rgba(245,158,11,0.1)]" : "border-white/10 bg-slate-950/45 text-stone-500 hover:border-violet-200/30 hover:text-stone-200"}`}>{value}</button>)}
              </div>
            </div>
            </details>
            {safetyNotice ? <div role="alert" className="mt-4 rounded-2xl border border-rose-200/25 bg-rose-200/[0.08] p-4 text-sm leading-6 text-rose-50"><p className="font-semibold">先联系现实中的支持。</p><p className="mt-1 text-rose-100/75">如果你有即时危险或无法保证安全，请联系当地紧急服务、急诊或可信任的人。StillMind 不处理危机场景。</p><Link href="/support" className="mt-3 inline-flex font-semibold underline underline-offset-4">查看支持边界</Link></div> : null}
            <div className="mt-4"><PracticeOptionsPanel value={options} onChange={setOptions} /></div>

            <details className="mt-5 border-t border-white/8 pt-4 text-xs leading-5 text-stone-500"><summary className="cursor-pointer text-center">隐私与安全</summary><p className="mt-3">不要输入真实姓名、隐私事件、创伤细节或医疗危机场景。本工具只提供日常状态切换练习，不替代心理咨询或医疗帮助。</p><Link href="/support" className="mt-2 inline-flex underline decoration-white/15 underline-offset-4 transition hover:text-stone-300">支持与危机边界</Link></details>
          </section>
        </div>
      </section>
    </main>
  </>;
}
