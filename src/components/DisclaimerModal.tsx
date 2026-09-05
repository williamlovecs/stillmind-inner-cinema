"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
const STORAGE_KEY = "stillmind-disclaimer-ack-v1";
export function DisclaimerModal({ onAcknowledged }: { onAcknowledged?: (ready: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let acknowledged = false;
    try { acknowledged = localStorage.getItem(STORAGE_KEY) === "1"; } catch { /* Ask in this session. */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize this one-time external storage boundary.
    setOpen(!acknowledged);
    onAcknowledged?.(acknowledged);
  }, [onAcknowledged]);
  useEffect(() => { if (open) checkboxRef.current?.focus(); }, [open]);
  function acknowledge() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* This session still permits an acknowledged practice. */ }
    setOpen(false); onAcknowledged?.(true);
  }
  if (!open) return null;
  return <div role="dialog" aria-modal="true" aria-labelledby="disclaimer-title"
    className="fixed inset-0 z-50 flex items-end justify-center bg-[#050914]/80 px-4 py-5 backdrop-blur-md sm:items-center sm:p-6"
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-violet-200/20 bg-[#08111f]/96 shadow-2xl shadow-violet-950/40">
      <div className="px-6 py-6">
        <p className="text-xs uppercase tracking-[0.28em] text-violet-200/70">使用边界</p>
        <h2 id="disclaimer-title" className="mt-3 text-2xl font-semibold leading-tight text-stone-50">这是 1 分钟日常 reset，不是医疗工具。</h2>
        <div className="mt-5 space-y-3 text-sm leading-6 text-stone-300">
          <p>不做诊断、治疗或危机干预，也不替代心理咨询。</p>
          <p>请不要输入真实姓名、隐私事件、创伤细节、医疗或危机场景。</p>
          <p className="rounded-2xl border border-amber-200/15 bg-amber-50/[0.05] p-3 text-amber-50/90">如果你无法保证自己或他人安全，请立刻联系当地急救、警方、危机热线或身边可信任的人。</p>
          <p className="text-xs text-stone-500">完整说明： <Link href="/privacy" className="underline underline-offset-2 hover:text-stone-300">隐私政策</Link>{" · "}<Link href="/terms" className="underline underline-offset-2 hover:text-stone-300">服务条款</Link></p>
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/30 px-6 py-5">
        <label className="flex items-start gap-3 text-sm text-stone-200"><input ref={checkboxRef} type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer accent-violet-300" /><span>我已了解边界，继续体验。</span></label>
        <button type="button" onClick={acknowledge} disabled={!checked} className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 text-base font-semibold text-slate-950 shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">进入体验</button>
      </div>
    </div>
  </div>;
}
