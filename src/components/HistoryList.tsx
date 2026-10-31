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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#282e29]/55 px-4 py-6 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-md border border-[#d4d2c5] bg-[#faf8f2] shadow-xl shadow-stone-900/10">
        <div className="flex items-center justify-between border-b border-[#d4d2c5] px-6 py-4">
          <h2 id="history-title" className="text-lg font-medium text-[#282e29]">内在电影院历史</h2>
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-sm text-[#596055] transition hover:text-[#282e29]" aria-label="关闭">关闭</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <p className="py-12 text-center text-sm leading-7 text-[#6b7165]">还没有历史。<br />完成一次内在电影就会出现在这里。</p>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-md border border-[#d4d2c5] bg-[#f4f1e9] p-4">
                  <div className="flex items-center justify-between text-xs text-[#6b7165]">
                    <span>{formatRelativeTime(entry.timestamp)}</span>
                    <span>{entry.source === "stepfun" ? "AI 生成" : "preset 模式"}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#282e29]">《{entry.cinemaTitle}》</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#596055]">{entry.trigger}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] text-[#596055]">
                    <span className="rounded-md border border-[#d4d2c5] px-2 py-1">呼气 ×{entry.breathCount}</span>
                    <span className="rounded-md border border-[#d4d2c5] px-2 py-1">念头 ×{entry.thoughtCount}</span>
                    {entry.selectedAction && <span className="rounded-md border border-[#d4d2c5] px-2 py-1">→ {entry.selectedAction}</span>}
                    {entry.distanceAfter && (
                      <span className="rounded-md border border-[#d4d2c5] px-2 py-1">
                        距离感：{entry.distanceAfter === "yes" ? "有" : entry.distanceAfter === "some" ? "一点" : "没有"}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {entries.length > 0 && (
          <div className="border-t border-[#d4d2c5] bg-[#f4f1e9] px-6 py-4">
            <button
              type="button"
              onClick={handleClear}
              onBlur={() => setConfirming(false)}
              className={`min-h-11 w-full rounded-md border px-4 py-2.5 text-sm transition ${confirming ? "border-[#8c3f33] bg-[#8c3f33]/10 text-[#8c3f33]" : "border-[#d4d2c5] text-[#596055] hover:border-[#8b9181] hover:text-[#282e29]"}`}
            >
              {confirming ? "再点一次确认清空" : "清空历史"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
