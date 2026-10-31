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
    className="fixed inset-0 z-50 flex items-end justify-center bg-[#282e29]/55 px-4 py-5 backdrop-blur-sm sm:items-center sm:p-6"
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])'));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <div className="max-h-[calc(100dvh-2.5rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-md border border-[#d4d2c5] bg-[#faf8f2] shadow-xl shadow-stone-900/10">
      <div className="px-6 py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#596055]">使用边界</p>
        <h2 id="disclaimer-title" className="mt-3 text-2xl font-medium leading-tight text-[#282e29]">这是 1 分钟日常 reset，不是医疗工具。</h2>
        <div className="mt-5 space-y-3 text-sm leading-6 text-[#596055]">
          <p>不做诊断、治疗或危机干预，也不替代心理咨询。</p>
          <p>请不要输入真实姓名、隐私事件、创伤细节、医疗或危机场景。</p>
          <p className="rounded-md border border-[#d4d2c5] bg-[#e7eae0] p-3 text-[#282e29]">如果你无法保证自己或他人安全，请立刻联系当地急救、警方、危机热线或身边可信任的人。</p>
          <p className="text-xs text-[#6b7165]">完整说明： <Link href="/privacy" className="underline underline-offset-2 hover:text-[#282e29]">隐私政策</Link>{" · "}<Link href="/terms" className="underline underline-offset-2 hover:text-[#282e29]">服务条款</Link></p>
        </div>
      </div>
      <div className="border-t border-[#d4d2c5] bg-[#f4f1e9] px-6 py-5">
        <label className="flex items-start gap-3 text-sm text-[#282e29]"><input ref={checkboxRef} type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-0.5 h-5 w-5 cursor-pointer accent-[#a9563d]" /><span>我已了解边界，继续体验。</span></label>
        <button type="button" onClick={acknowledge} disabled={!checked} className="mt-4 flex h-12 w-full items-center justify-center rounded-md bg-[#a9563d] text-base font-medium text-[#fff9f1] transition hover:bg-[#8e4431] disabled:cursor-not-allowed disabled:opacity-35">进入体验</button>
      </div>
    </div>
  </div>;
}
