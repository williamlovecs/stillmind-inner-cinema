import Link from "next/link";
import { METHOD_CATALOG, PRACTICE_PATHS, type MethodDefinition, type PracticeFamily } from "@stillmind/domain";
import { PRACTICES_BY_METHOD } from "@stillmind/content";

const familyLabels: Record<PracticeFamily, string> = {
  distance: "拉开距离",
  settle: "先安定",
  observe: "练习观察",
  release: "松开重播",
  return: "回到行动",
  reflect: "复盘习惯",
};

const evidenceLabels: Record<MethodDefinition["evidenceTier"], string> = {
  supported: "相邻机制支持",
  informed: "产品研究启发",
  experimental: "实验性练习",
};

export const metadata = {
  title: "方法库 | StillMind",
  description: "StillMind 的 12 种沉寂小我方法与 4 条练习路径。",
};

export default function MethodsPage() {
  const grouped = METHOD_CATALOG.reduce(
    (groups, method) => {
      const list = groups.get(method.family) ?? [];
      list.push(method);
      groups.set(method.family, list);
      return groups;
    },
    new Map<PracticeFamily, MethodDefinition[]>(),
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050914] text-stone-100">
      <div className="cinema-bg" />
      <div className="noise-grain" />
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <span className="block text-xs uppercase tracking-[0.28em] text-stone-500">StillMind</span>
              <span className="mt-1 block text-sm text-stone-300">方法库</span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-stone-300 transition hover:bg-white/[0.1]"
          >
            返回观电影法
          </Link>
        </header>

        <section className="grid gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-violet-200/70">StillMind method system</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight text-stone-50 sm:text-6xl">
              12 种方法，都是沉寂小我的入口。
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-300">
              呼吸法、凝视法、登出法、宽恕法、内观法、觉察法、观电影法、意识聚焦法、稳定法、意识抽离法、人称替代法和合一法并列存在。你从当前状态选择一个方法，而不是被某一种方法定义。
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#inner-cinema"
                className="rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-fuchsia-300 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30"
              >
                体验观电影法
              </Link>
              <a
                href="#paths"
                className="rounded-full border border-violet-200/20 bg-violet-100/[0.07] px-5 py-3 text-sm font-semibold text-violet-100"
              >
                查看练习路径
              </a>
            </div>
          </div>
          <div className="rounded-[2rem] border border-violet-200/15 bg-[#091225]/72 p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
            <p className="text-sm font-medium text-stone-100">产品边界</p>
            <p className="mt-3 text-sm leading-6 text-stone-400">
              StillMind 提供一般性的暂停、观察、注意力练习和回到行动提示。不提供诊断、治疗、危机处置，也不替代专业支持。
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Stat label="方法" value="12" />
              <Stat label="路径" value="4" />
              <Stat label="时长" value="1-10m" />
            </div>
          </div>
        </section>

        <section id="paths" className="grid gap-4 lg:grid-cols-4">
          {PRACTICE_PATHS.map((path) => (
            <article
              key={path.id}
              className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-violet-200/70">练习路径</p>
              <h2 className="mt-3 text-xl font-semibold text-stone-50">{path.title}</h2>
              <p className="mt-2 text-sm text-stone-400">{path.subtitle}</p>
              <p className="mt-4 text-sm leading-6 text-stone-300">{path.summary}</p>
              <div className="mt-5 space-y-2">
                {path.stages.map((stage, index) => (
                  <div key={`${path.id}-${stage.methodId}`} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-stone-300">
                    {index + 1}. {stage.label} · {stage.duration} 分钟
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 space-y-8">
          {Array.from(grouped.entries()).map(([family, methods]) => (
            <div key={family}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Practice family</p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-50">{familyLabels[family]}</h2>
                </div>
                <p className="text-sm text-stone-500">{methods.length} 种方法</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {methods.map((method) => {
                  const variants = PRACTICES_BY_METHOD.get(method.id) ?? [];
                  return (
                    <Link
                      key={method.id}
                      href={`/methods/${method.id}`}
                      className="group rounded-[1.6rem] border border-white/10 bg-[#091225]/70 p-5 shadow-2xl shadow-violet-950/10 backdrop-blur transition hover:border-violet-200/30 hover:bg-[#101936]/78"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-stone-50">{method.title}</h3>
                          <p className="mt-1 text-sm text-violet-100/70">{method.subtitle}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs text-stone-400">
                          {method.premium ? "进阶" : "核心"}
                        </span>
                      </div>
                      <p className="mt-4 min-h-12 text-sm leading-6 text-stone-300">{method.summary}</p>
                      <div className="mt-5 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-violet-100/10 px-3 py-1.5 text-violet-100">
                          {method.durations.join(" / ")} 分钟
                        </span>
                        <span className="rounded-full bg-amber-100/10 px-3 py-1.5 text-amber-100">
                          {evidenceLabels[method.evidenceTier]}
                        </span>
                        <span className="rounded-full bg-sky-100/10 px-3 py-1.5 text-sky-100">
                          {variants.length} 个脚本
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-50">{value}</p>
    </div>
  );
}
