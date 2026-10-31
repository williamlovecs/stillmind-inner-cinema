import Link from "next/link";
import type { Metadata } from "next";
import { PRACTICE_PATHS } from "@stillmind/domain";
import { AppHeader } from "@/components/ui";
import { MethodLibrary } from "@/components/MethodLibrary";

export const metadata: Metadata = { title: "方法库 | StillMind", description: "StillMind 的 12 种沉寂小我方法与 4 条练习路径。" };

export default function MethodsPage() {
  return <main className="sm-page"><div className="sm-container"><AppHeader current="方法库" action={<nav aria-label="产品导航" className="sm-header-nav"><Link href="/reflection">复盘</Link><Link href="/settings">数据</Link></nav>} />
    <section className="sm-library-hero"><div><p className="sm-eyebrow">12 种练习方法 · 4 条路径</p><h1 className="sm-title">做完一次，再选择适合你的方法。</h1><p className="sm-copy">第一次不用选。先完成 1 分钟练习；觉得有用，再回来深入。</p><div className="sm-choice-row"><Link href="/reset" className="sm-button sm-button-primary">先做 1 分钟练习</Link><a href="#paths" className="sm-button sm-button-quiet">查看练习路径</a></div></div><aside className="sm-surface"><p className="sm-eyebrow">产品边界</p><p className="sm-copy">提供一般性的暂停、观察和注意力练习。不提供诊断、治疗或危机处置，也不替代专业支持。</p></aside></section>
    <section id="paths" className="sm-path-grid" aria-label="练习路径">{PRACTICE_PATHS.map((path) => <article key={path.id} className="sm-surface sm-path-card"><p className="sm-eyebrow">练习路径</p><h2>{path.title}</h2><p className="sm-caption">{path.subtitle}</p><p className="sm-copy">{path.summary}</p><ol>{path.stages.map((stage, index) => <li key={`${path.id}-${stage.methodId}`}>{index + 1}. {stage.label} · {stage.duration} 分钟</li>)}</ol></article>)}</section>
    <MethodLibrary />
  </div></main>;
}
