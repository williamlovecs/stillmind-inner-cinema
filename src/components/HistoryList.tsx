"use client";

import { useState } from "react";
import {
  type HistoryEntry,
  clearHistory,
  formatRelativeTime,
} from "@/lib/history";

export function HistoryList({
  entries,
  onClose,
  onCleared,
}: {
  entries: HistoryEntry[];
  onClose: () => void;
  onCleared: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleClear = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    clearHistory();
    onCleared();
    setConfirming(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#050914]/85 px-4 py-6 backdrop-blur-md sm:items-center sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-violet-200/20 bg-[#08111f]/96 shadow-2xl shadow-violet-950/40">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2
            id="history-title"
            className="text-lg font-medium text-stone-50"
          >
            内在电影院历史
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-stone-500 transition hover:text-stone-200"
            aria-label="关闭"
          >
            关闭
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">
              还没有历史。<br />完成一次内在电影就会出现在这里。
            </p>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{formatRelativeTime(entry.timestamp)}</span>
                    <span
                      className={
                        entry.source === "stepfun"
                          ? "text-amber-100/80"
                          : "text-stone-500"
                      }
                    >
                      {entry.source === "stepfun" ? "AI 生成" : "preset 模式"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-stone-100">
                    《{entry.cinemaTitle}》
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-400">
                    {entry.trigger}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] text-stone-500">
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      呼气 ×{entry.breathCount}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      念头 ×{entry.thoughtCount}
                    </span>
                    {entry.selectedAction && (
                      <span className="rounded-full border border-amber-200/15 bg-amber-100/5 px-2 py-0.5 text-amber-100/75">
                        → {entry.selectedAction}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {entries.length > 0 && (
          <div className="border-t border-white/10 bg-black/30 px-6 py-4">
            <button
              type="button"
              onClick={handleClear}
              onBlur={() => setConfirming(false)}
              className={`w-full rounded-full border px-4 py-2.5 text-sm transition ${
                confirming
                  ? "border-red-300/40 bg-red-500/10 text-red-100"
                  : "border-white/10 bg-white/[0.04] text-stone-400 hover:border-white/20 hover:text-stone-200"
              }`}
            >
              {confirming ? "再点一次确认清空" : "清空历史"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
