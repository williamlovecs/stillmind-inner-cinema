"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/ui";
import { clearStillMindBrowserData, loadWebFavorites, loadWebSessions } from "@/lib/web-library";

export function WebDataSettings() {
  const [sessionCount, setSessionCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ title: string; body: string }>();
  useEffect(() => { const timer = window.setTimeout(() => { setSessionCount(loadWebSessions().length); setFavoriteCount(loadWebFavorites().length); }, 0); return () => window.clearTimeout(timer); }, []);

  function exportData() {
    let url: string | undefined;
    try {
      const payload = JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), sessions: loadWebSessions(), favoriteMethodIds: loadWebFavorites() }, null, 2);
      url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = `stillmind-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setNotice({ title: "已请求浏览器下载", body: "导出包含练习记录以及可能存在的原句和笔记。请把文件保存在只有你能访问的位置。" });
    } catch { setNotice({ title: "导出未完成", body: "浏览器没有完成文件下载。本机数据没有改动，请检查下载或存储权限后重试。" }); }
    finally { const createdUrl = url; if (createdUrl) window.setTimeout(() => URL.revokeObjectURL(createdUrl), 0); }
  }

  function deleteData() {
    let local: Storage | undefined; let session: Storage | undefined;
    try { local = window.localStorage; } catch { /* Reported by the deletion result. */ }
    try { session = window.sessionStorage; } catch { /* Reported by the deletion result. */ }
    const result = clearStillMindBrowserData(local, session);
    if (result.ok) {
      setSessionCount(0); setFavoriteCount(0); setConfirming(false);
      setNotice({ title: "本机数据已清除", body: "练习记录、收藏、反馈、引导确认和待进入练习的草稿已从此浏览器移除。" });
    } else {
      setSessionCount(loadWebSessions().length); setFavoriteCount(loadWebFavorites().length);
      setNotice({ title: "清除未完整完成", body: `有 ${result.failedKeys.length} 项无法移除，数据可能仍保留。请检查浏览器存储权限后重试。` });
    }
  }

  return <main className="sm-page"><div className="sm-container sm-narrow"><AppHeader current="设置与隐私" action={<Link href="/reflection" className="sm-button sm-button-quiet">本机复盘</Link>} />
    <section className="sm-page-intro"><p className="sm-eyebrow">本地优先</p><h1 className="sm-title">你决定留下什么，也可以随时带走。</h1><p className="sm-copy">这里管理的是 Web 版 StillMind 在此浏览器中的数据，不会清除其他网站、Expo App 或账号云端数据。</p></section>
    {notice ? <section role="alert" className="sm-notice"><strong>{notice.title}</strong><p>{notice.body}</p></section> : null}
    <section className="sm-surface sm-settings-section"><p className="sm-eyebrow">当前浏览器</p><h2>{sessionCount} 条练习记录 · {favoriteCount} 个收藏</h2><p className="sm-copy">练习历史用于首页快捷入口和本机复盘。未主动导出时，不会在这里生成另一份云端副本。</p><button type="button" className="sm-button sm-button-primary" onClick={exportData}>导出 JSON 数据</button></section>
    <section className="sm-surface sm-settings-section"><p className="sm-eyebrow">删除</p><h2>清除此浏览器中的 StillMind 数据</h2><p className="sm-copy">包括练习记录、收藏、反馈、引导确认和未完成草稿。此操作无法撤销。</p>{confirming ? <div className="sm-choice-row"><button type="button" className="sm-button sm-button-danger" onClick={deleteData}>确认永久清除</button><button type="button" className="sm-button sm-button-quiet" onClick={() => setConfirming(false)}>取消</button></div> : <button type="button" className="sm-button sm-button-warm" onClick={() => setConfirming(true)}>准备清除本机数据</button>}</section>
    <p className="sm-caption">StillMind 不提供诊断、治疗或危机处置。需要紧急帮助时，请联系当地紧急服务、急诊或可信任的人。</p>
  </div></main>;
}
