"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { METHOD_CATALOG, type MethodDefinition, type MethodId, type PracticeFamily } from "@stillmind/domain";
import { PRACTICES_BY_METHOD } from "@stillmind/content";
import { filterMethods, loadWebFavorites, saveWebFavorites, WEB_LIBRARY_CHANGE_EVENT, type MethodFilters } from "@/lib/web-library";

const FAMILIES: Array<{ id: "all" | PracticeFamily; label: string }> = [
  { id: "all", label: "全部方向" }, { id: "distance", label: "拉开距离" }, { id: "settle", label: "先安定" },
  { id: "observe", label: "练习观察" }, { id: "release", label: "松开重播" }, { id: "return", label: "回到行动" }, { id: "reflect", label: "稳定 / 拉远" },
];
const EVIDENCE: Record<MethodDefinition["evidenceTier"], string> = { supported: "适合初次练习", informed: "需要一点练习", experimental: "探索型练习" };

export function MethodLibrary() {
  const [favorites, setFavorites] = useState<MethodId[]>([]);
  const [filters, setFilters] = useState<MethodFilters>({ family: "all", duration: "all", favoritesOnly: false });
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setFavorites(loadWebFavorites()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const methods = useMemo(() => filterMethods(METHOD_CATALOG, filters, favorites), [favorites, filters]);

  function toggleFavorite(id: MethodId) {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    if (!saveWebFavorites(next)) {
      setNotice("收藏暂未保存。请检查浏览器的存储权限后重试；当前筛选不会改变。");
      return;
    }
    setFavorites(next); setNotice("");
    window.dispatchEvent(new Event(WEB_LIBRARY_CHANGE_EVENT));
  }

  return <>
    <section aria-label="筛选方法" className="sm-surface sm-library-filters">
      <div className="sm-choice-row" role="group" aria-label="练习方向">
        {FAMILIES.map((family) => <button key={family.id} type="button" className={`sm-choice ${filters.family === family.id ? "is-selected" : ""}`} aria-pressed={filters.family === family.id} onClick={() => setFilters((current) => ({ ...current, family: family.id }))}>{family.label}</button>)}
      </div>
      <div className="sm-filter-row">
        <div className="sm-choice-row" role="group" aria-label="练习时长">
          {(["all", 1, 3, 5, 10] as const).map((duration) => <button key={duration} type="button" className={`sm-choice ${filters.duration === duration ? "is-selected" : ""}`} aria-pressed={filters.duration === duration} onClick={() => setFilters((current) => ({ ...current, duration }))}>{duration === "all" ? "全部时长" : `${duration} 分钟`}</button>)}
        </div>
        <button type="button" className={`sm-choice ${filters.favoritesOnly ? "is-selected" : ""}`} aria-pressed={filters.favoritesOnly} onClick={() => setFilters((current) => ({ ...current, favoritesOnly: !current.favoritesOnly }))}>只看收藏</button>
      </div>
    </section>
    {notice ? <p role="alert" className="sm-notice">{notice}</p> : null}
    <div className="sm-section-heading"><div><p className="sm-eyebrow">按此刻的需要选择</p><h2 className="sm-section-title">{methods.length} 种方法</h2></div><Link href="/reflection" className="sm-text-link">查看本机复盘</Link></div>
    {methods.length ? <section aria-label="方法结果" className="sm-method-grid">
      {methods.map((method) => {
        const favorite = favorites.includes(method.id);
        const variants = PRACTICES_BY_METHOD.get(method.id) ?? [];
        return <article key={method.id} className="sm-method-card">
          <div className="sm-method-card-top"><span className="sm-caption">{method.premium ? "进阶" : "核心"}</span><button type="button" className="sm-favorite" aria-label={`${favorite ? "取消收藏" : "收藏"}${method.title}`} aria-pressed={favorite} onClick={() => toggleFavorite(method.id)}>{favorite ? "已收藏" : "收藏"}</button></div>
          <Link href={`/methods/${method.id}`} className="sm-method-link">
            <h3>{method.title}</h3><p className="sm-method-subtitle">{method.subtitle}</p><p className="sm-copy">{method.summary}</p>
            <span className="sm-method-meta"><span>{method.durations.join(" / ")} 分钟</span><span>{EVIDENCE[method.evidenceTier]}</span><span>{variants.length} 个脚本</span></span>
            <span className="sm-text-link">查看方法详情 →</span>
          </Link>
        </article>;
      })}
    </section> : <section className="sm-surface sm-empty"><h2>暂时没有符合条件的方法</h2><p className="sm-copy">可以换一个方向或时长；收藏为空时，先关闭“只看收藏”。</p><button type="button" className="sm-button sm-button-quiet" onClick={() => setFilters({ family: "all", duration: "all", favoritesOnly: false })}>清除筛选</button></section>}
  </>;
}
