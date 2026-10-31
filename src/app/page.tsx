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
    <main className="sm-page sm-home">
      <div className="sm-container sm-home-shell">
        <AppHeader />
        <div className="sm-home-grid">
          <section className="sm-home-action" aria-labelledby="home-title">
            <p className="sm-eyebrow">沉寂小我 · 一分钟入口</p>
            <h1 id="home-title" className="sm-title">先不用回答。<br />给自己一分钟。</h1>
            <p className="sm-copy">不用整理好情绪，也不用先读懂十二种方法。让一个念头被看见，再决定下一步。</p>
            <button type="button" onClick={startReset} disabled={starting} className="sm-button sm-button-primary sm-home-start">{starting ? "正在进入…" : "开始 1 分钟 Reset"}</button>
            <p className="sm-caption sm-home-assurance">可以空输入，随时可以停止。练后不必报告变化。</p>
            <TodayShortcuts />
            <details className="sm-fold sm-home-details" onToggle={(event) => { if (!event.currentTarget.open) stopVoice(); }}>
              <summary>留下一句此刻的话 <span>可选</span></summary>
              <div className="sm-home-inputs">
                <div className="sm-input-heading"><label htmlFor="home-trigger">说一句，或者写一句</label><button type="button" onClick={toggleVoice} disabled={!voiceSupported} aria-pressed={listening} className="sm-button sm-button-quiet">{listening ? "正在听 · 停止" : voiceSupported ? "开始说" : "用键盘输入"}</button></div>
                {voiceSupported ? <p className="sm-caption">语音由浏览器识别，可能使用云端服务。可改用文字或不输入。</p> : null}
                <textarea id="home-trigger" aria-label="现在发生了什么" value={trigger} onChange={(event) => { stopVoice(); updateTrigger(event.target.value); }} maxLength={500} autoComplete="off" placeholder="比如：我被批评了，现在很想反击。" className="sm-input" />
                <div className="sm-choice-row">{EXAMPLES.map((example) => <button key={example} type="button" onClick={() => { stopVoice(); updateTrigger(example, "example"); }} className="sm-choice">{example}</button>)}</div>
                <div className="sm-activation"><div className="sm-input-heading"><p>现在被带走的程度 <span className="sm-caption">可选</span></p><strong>{activation === undefined ? "未填写" : `${activation} · ${ACTIVATION_LABELS[activation]}`}</strong></div>
                  <div className="sm-scale" role="group" aria-label="现在被带走的程度，1稳定，5被带走，再点一次取消">{([1, 2, 3, 4, 5] as const).map((value) => <button key={value} type="button" aria-pressed={activation === value} onClick={() => setActivation(activation === value ? undefined : value)}>{value}</button>)}</div>
                </div>
                <PracticeOptionsPanel value={options} onChange={setOptions} />
              </div>
            </details>
            {safetyNotice ? <div role="alert" className="sm-notice"><strong>先联系现实中的支持。</strong><p>如果你有即时危险或无法保证安全，请联系当地紧急服务、急诊或可信任的人。StillMind 不处理危机场景。</p><Link href="/support" className="sm-text-link">查看支持边界</Link></div> : null}
          </section>
          <aside className="sm-home-object" aria-label="一分钟练习的三个阶段">
            <div className="sm-folded-object" aria-hidden="true"><span className="sm-object-orbit" /><span className="sm-object-paper">一个念头<br />也可以只是<br />被看见。</span><span className="sm-object-shadow" /></div>
            <ol className="sm-home-path"><li><span>01</span><div><strong>看见</strong><p>不必先解释发生了什么。</p></div></li><li><span>02</span><div><strong>留出一点距离</strong><p>跟着一种方法，停留一分钟。</p></div></li><li><span>03</span><div><strong>回到此刻</strong><p>变化由你判断，不由动画宣布。</p></div></li></ol>
            <details className="sm-fold"><summary>隐私与安全</summary><p className="sm-caption">不要输入真实姓名、隐私事件、创伤细节或医疗危机场景。本工具只提供日常状态切换练习，不替代心理咨询或医疗帮助。</p><Link href="/support" className="sm-text-link">支持与危机边界</Link></details>
          </aside>
        </div>
        <footer className="sm-home-footer"><span>不需要连续打卡，也不给人打分。</span><Link href="/settings">偏好与数据</Link></footer>
      </div>
    </main>
  </>;
}
