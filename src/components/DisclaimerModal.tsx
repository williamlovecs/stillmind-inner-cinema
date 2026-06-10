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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#050914]/85 px-4 py-6 backdrop-blur-md sm:items-center sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-amber-200/20 bg-[#08111f]/96 shadow-2xl shadow-violet-950/40">
        <div className="overflow-y-auto px-6 py-7">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-100/70">
            在你开始之前
          </p>
          <h2
            id="disclaimer-title"
            className="mt-3 text-2xl font-semibold leading-tight text-stone-50"
          >
            这只是一面镜子
          </h2>

          <div className="mt-5 space-y-4 text-[0.95rem] leading-7 text-stone-300">
            <p>
              StillMind 不做心理诊断，不做治疗，也不替代专业心理帮助。
            </p>
            <p>
              它是一个内在电影工具：把你当下的情绪反应投到屏幕上，让你能从角色退到观众席。
            </p>

            <div className="rounded-2xl border border-amber-200/15 bg-amber-50/[0.04] p-4">
              <p className="text-sm font-medium text-amber-100/90">
                如果你正在经历危机
              </p>
              <p className="mt-1 text-sm leading-6 text-stone-300">
                抑郁、焦虑、有自伤或伤人倾向，请直接联系专业支持：
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-100/85">
                <li>· 全国心理援助热线：400-161-9995</li>
                <li>· 北京心理危机研究与干预中心：010-82951332</li>
                <li>· 紧急情况请拨 120 或当地急救</li>
              </ul>
            </div>

            <p>
              你输入的 trigger 文字，仅在你点击「进入内在电影」时发送给我们配置的 AI（如果有配置）用于生成分镜；不会用于训练，也不会与第三方分享。
            </p>

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
              className="mt-0.5 h-4 w-4 cursor-pointer accent-amber-300"
            />
            <span>我已了解，StillMind 不替代专业心理帮助。</span>
          </label>
          <button
            type="button"
            onClick={acknowledge}
            disabled={!checked}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-300 via-violet-400 to-indigo-400 text-base font-medium text-stone-900 shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
          >
            进入 StillMind
          </button>
        </div>
      </div>
    </div>
  );
}
