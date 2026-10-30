"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildWeeklyReview, METHOD_BY_ID, type PracticeSession } from "@stillmind/domain";
import { loadWebSessions } from "@/lib/web-library";
import { AppHeader } from "@/components/ui";

function weekStart(now = new Date()) {
  const date = new Date(now); const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - day); return date;
}
const RESULT: Record<string, string> = { better: "更有选择", same: "差不多", worse: "更不舒服", stopped: "已停止" };

export function WebReflection() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => setSessions(loadWebSessions()), 0); return () => window.clearTimeout(timer); }, []);
  const review = useMemo(() => buildWeeklyReview(sessions, weekStart()), [sessions]);
  const topMethod = Object.entries(review.methodCounts).sort((a, b) => b[1] - a[1])[0];
  return <main className="sm-page"><div className="sm-container sm-narrow"><AppHeader current="本机复盘" action={<Link className="sm-button sm-button-quiet" href="/settings">数据管理</Link>} />
    <section className="sm-page-intro"><p className="sm-eyebrow">只回看你留下的记录</p><h1 className="sm-title">看见重复，不把重复变成身份。</h1><p className="sm-copy">这里不是 B 的文档复盘功能，也不生成人格分析。所有数字都来自这台浏览器中的练习记录。</p></section>
    <div className="sm-metrics"><section className="sm-surface"><strong>{review.sessions}</strong><span>本周练习</span></section><section className="sm-surface"><strong>{review.completed}</strong><span>完成次数</span></section><section className="sm-surface"><strong>{review.results.better}</strong><span>本人反馈“更有选择”</span></section></div>
    {review.sessions === 0 ? <section className="sm-surface sm-empty"><h2>这一周还没有记录</h2><p className="sm-copy">完成或停止一次练习后，这里会显示方法、状态和本人反馈。空数据不会被补成趋势。</p><Link href="/reset" className="sm-button sm-button-primary">开始 1 分钟练习</Link></section> : <section className="sm-surface sm-review-summary"><p className="sm-eyebrow">本周线索</p><h2>{topMethod ? `最常使用：${METHOD_BY_ID.get(topMethod[0] as never)?.title ?? topMethod[0]}` : "你已留下练习记录"}</h2><p className="sm-copy">次数只是发生过的事实，不代表效果或适合度排名。</p>{typeof review.averageActivationChange === "number" ? <p className="sm-caption">有前后自评的记录中，平均自报变化为 {review.averageActivationChange > 0 ? "+" : ""}{review.averageActivationChange}。这不是疗效测量。</p> : <p className="sm-caption">至少两条同时具备前后自评的记录，才显示平均值。</p>}</section>}
    <section className="sm-surface sm-next-step"><p className="sm-eyebrow">下一次练习</p><h2>{review.nextStep.title}</h2><p className="sm-copy">{review.nextStep.body}</p><Link className="sm-button sm-button-primary" href={`/reset?method=${review.nextStep.methodId}&mode=${review.nextStep.mode}&direct=1`}>{review.nextStep.cta}</Link></section>
    <section><div className="sm-section-heading"><h2 className="sm-section-title">最近记录</h2><span className="sm-caption">最多保留 30 条</span></div><div className="sm-session-list">{sessions.slice(0, 8).map((session) => <article key={session.id} className="sm-surface sm-session-row"><div><h3>{METHOD_BY_ID.get(session.methodId)?.title ?? session.methodId}</h3><p className="sm-caption">{new Date(session.startedAt).toLocaleString("zh-CN")} · {session.status === "completed" ? "已完成" : "已停止"}</p></div><div className="sm-session-result"><span>{session.result ? RESULT[session.result] : "未填写反馈"}</span><small>{session.activationBefore !== undefined && session.activationAfter !== undefined ? `本人自报 ${session.activationBefore} → ${session.activationAfter}` : "前后自评未完整填写"}</small></div></article>)}</div></section>
  </div></main>;
}
