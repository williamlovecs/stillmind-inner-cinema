"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { METHOD_BY_ID, type MethodId, type PracticeSession } from "@stillmind/domain";
import { loadWebFavorites, loadWebSessions, WEB_LIBRARY_CHANGE_EVENT } from "@/lib/web-library";

export function TodayShortcuts() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [favorites, setFavorites] = useState<MethodId[]>([]);
  const refresh = useCallback(() => { setSessions(loadWebSessions()); setFavorites(loadWebFavorites()); }, []);
  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("focus", refresh);
    window.addEventListener(WEB_LIBRARY_CHANGE_EVENT, refresh);
    return () => { window.clearTimeout(timer); window.removeEventListener("focus", refresh); window.removeEventListener(WEB_LIBRARY_CHANGE_EVENT, refresh); };
  }, [refresh]);
  const recent = sessions[0];
  if (!recent && favorites.length === 0) return null;
  return <section aria-label="继续你的练习" className="sm-shortcuts">
    <div className="sm-section-heading"><h2 className="sm-section-title">接着上一次</h2><Link href="/reflection" className="sm-text-link">全部复盘</Link></div>
    <div className="sm-shortcut-grid">
      {recent ? <Link href={`/methods/${recent.methodId}`} className="sm-shortcut"><span className="sm-caption">最近练习 · {new Date(recent.startedAt).toLocaleDateString("zh-CN")}</span><strong>{METHOD_BY_ID.get(recent.methodId)?.title ?? recent.methodId}</strong><span>{recent.status === "completed" ? "已完成" : "已停止"} · 再次查看方法 →</span></Link> : null}
      {favorites.slice(0, 2).map((id) => <Link key={id} href={`/methods/${id}`} className="sm-shortcut"><span className="sm-caption">已收藏</span><strong>{METHOD_BY_ID.get(id)?.title ?? id}</strong><span>打开方法 →</span></Link>)}
    </div>
  </section>;
}
