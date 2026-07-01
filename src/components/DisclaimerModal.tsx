"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "stillmind-disclaimer-ack-v1";

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 一次性从 localStorage 同步到组件状态
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // localStorage 不可用（隐私模式 / 禁用）——本会话内仍允许使用
    }
    setOpen(false);
  };

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#050914]/82 px-4 py-6 backdrop-blur-md sm:items-center sm:p-6"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-violet-200/20 bg-[#08111f]/96 shadow-2xl shadow-violet-950/40">
        <div className="px-6 py-7">
          <p className="text-xs uppercase tracking-[0.28em] text-violet-200/70">使用边界</p>
          <h2
            id="disclaimer-title"
            className="mt-3 text-2xl font-semibold leading-tight text-stone-50"
          >
            先确认三件事
          </h2>

          <div className="mt-5 space-y-3 text-sm leading-6 text-stone-300">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-stone-100">StillMind 是日常 reset 工具。</p>
              <p className="mt-1 text-stone-400">它不做诊断、治疗，也不替代专业心理帮助。</p>
            </div>
            <div className="rounded-2xl border border-amber-200/15 bg-amber-50/[0.05] p-4 text-amber-50/90">
              如果涉及自伤、伤人、医疗紧急或无法保证安全，请立刻联系当地急救、警方、危机热线或身边可信任的人。
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-stone-100">不要输入隐私细节。</p>
              <p className="mt-1 text-stone-400">避免真实姓名、隐私事件、创伤细节、医疗或危机场景。</p>
            </div>
            <p className="text-xs text-stone-500">
              完整说明：{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-stone-300"
              >
                隐私政策
              </Link>
              {" · "}
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-stone-300"
              >
                服务条款
              </Link>
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/30 px-6 py-5">
          <label className="flex items-start gap-3 text-sm text-stone-200">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-violet-300"
            />
            <span>我已了解，StillMind 不替代专业心理帮助。</span>
          </label>
          <button
            type="button"
            onClick={acknowledge}
            disabled={!checked}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 text-base font-semibold text-slate-950 shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
          >
            进入体验
          </button>
        </div>
      </div>
    </div>
  );
}
