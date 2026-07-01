import type { ReactNode } from "react";
import Link from "next/link";
import { WorkflowNav } from "@/components/WorkflowNav";
import { notFound } from "next/navigation";
import {
  METHOD_BY_ID,
  METHOD_CATALOG,
  PRACTICE_PATHS,
  type DurationMinutes,
  type EvidenceTier,
  type MethodDefinition,
  type MethodId,
  type StateMode,
} from "@stillmind/domain";
import { getPracticeVariant } from "@stillmind/content";

const evidenceCopy: Record<EvidenceTier, string> = {
  supported: "这是适合先尝试的基础练习。StillMind 不承诺个人效果，只帮你做一次短时观察。",
  informed: "这个练习需要一点熟悉度。先用 1 分钟版本感受是否适合你。",
  experimental: "这是探索型练习。把它当成一次温和尝试，不作为治疗方法使用。",
};

const modeLabels: Record<StateMode, string> = {
  looping: "念头循环",
  tense: "身体紧绷",
  impulsive: "想立刻回应",
  numb: "有点断开",
  hurt: "关系受伤",
  curious: "安静探索",
};

export function generateStaticParams() {
  return METHOD_CATALOG.map((method) => ({ id: method.id }));
}

type MethodPageParams = Promise<{ id: MethodId }>;

export async function generateMetadata({ params }: { params: MethodPageParams }) {
  const { id } = await params;
  const method = METHOD_BY_ID.get(id);
  if (!method) return { title: "方法 | StillMind" };
  return {
    title: `${method.title} | StillMind 方法库`,
    description: method.summary,
  };
}

export default async function MethodDetailPage({ params }: { params: MethodPageParams }) {
  const { id } = await params;
  const method = METHOD_BY_ID.get(id);
  if (!method) notFound();

  const variants = method.durations
    .map((minutes) => getPracticeVariant(method.id, minutes))
    .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant));
  const primary = variants[0];
  const paths = PRACTICE_PATHS.filter((path) =>
    path.stages.some((stage) => stage.methodId === method.id),
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050914] text-stone-100">
      <div className="cinema-bg" />
      <div className="noise-grain" />
      <section className="relative z-10 mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/methods" className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <span className="block text-xs uppercase tracking-[0.28em] text-stone-500">StillMind</span>
              <span className="mt-1 block text-sm text-stone-300">返回方法库</span>
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-stone-300 transition hover:bg-white/[0.1]"
          >
            回到入口
          </Link>
        </header>

        <div className="mt-5">
          <WorkflowNav active="methods" />
        </div>

        <section className="grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-[2rem] border border-violet-200/15 bg-[#091225]/72 p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-violet-200/70">Method detail</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight text-stone-50">{method.title}</h1>
            <p className="mt-4 text-2xl leading-tight text-stone-100">{method.subtitle}</p>
            <p className="mt-5 text-base leading-7 text-stone-300">{method.summary}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/reset?method=${method.id}`}
                className="rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-300 to-amber-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-950/25"
              >
                用这个方法开始练习
              </Link>
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-stone-300 transition hover:border-violet-200/35 hover:text-white"
              >
                回到“发生了什么”入口
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {method.durations.map((minutes) => (
                <span key={minutes} className="rounded-full bg-violet-100/10 px-3 py-1.5 text-sm text-violet-100">
                  {minutes} 分钟
                </span>
              ))}
              <span className="rounded-full bg-amber-100/10 px-3 py-1.5 text-sm text-amber-100">
                {method.premium ? "进阶练习" : "核心练习"}
              </span>
            </div>
          </aside>

          <div className="space-y-4">
            <InfoCard title="适合的时刻">
              <p>{method.modes.map((mode) => modeLabels[mode]).join(" · ")}</p>
            </InfoCard>
            <InfoCard title="练习边界">
              <p>
                {method.bodyFocus ? "包含身体关注，可在练习时切换到接触点或视觉替代方式。" : "不要求关注身体内部。"}
                {method.breathChange ? " 呼吸不适时，只看视觉节奏即可。" : ""}
                {method.eyesOpen ? " 可睁眼完成。" : " 建议在相对稳定的环境中使用。"}
              </p>
            </InfoCard>
            <InfoCard title="证据说明">
              <p>{evidenceCopy[method.evidenceTier]}</p>
            </InfoCard>
          </div>
        </section>

        {primary && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Practice script</p>
                <h2 className="mt-2 text-2xl font-semibold text-stone-50">{primary.title}</h2>
                <p className="mt-2 text-sm text-stone-400">{primary.subtitle}</p>
              </div>
              <p className="rounded-full border border-violet-200/20 bg-violet-100/[0.07] px-3 py-1.5 text-sm text-violet-100">
                v{primary.contentVersion}
              </p>
            </div>
            <p className="mt-5 rounded-[1.2rem] border border-amber-200/15 bg-amber-100/[0.06] p-4 text-sm leading-6 text-stone-300">
              准备：{primary.preparation}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {primary.steps.map((step, index) => (
                <article key={step.id} className="rounded-[1.4rem] border border-white/10 bg-[#091225]/68 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-violet-200/70">
                      {String(index + 1).padStart(2, "0")} · {step.kind}
                    </p>
                    <p className="text-xs text-stone-500">{step.seconds}s</p>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-stone-50">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{step.instruction}</p>
                  {step.alternative && (
                    <p className="mt-3 text-xs leading-5 text-stone-500">替代方式：{step.alternative}</p>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-5 text-base leading-7 text-violet-100">{primary.closing}</p>
          </section>
        )}

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[1.6rem] border border-white/10 bg-[#091225]/70 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Durations</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {method.durations.map((minutes) => (
                <DurationChip key={minutes} method={method} minutes={minutes} />
              ))}
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-white/10 bg-[#091225]/70 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">出现于路径</p>
            <div className="mt-4 space-y-2">
              {paths.length > 0 ? paths.map((path) => (
                <p key={path.id} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-stone-300">
                  {path.title} · {path.subtitle}
                </p>
              )) : <p className="text-sm text-stone-500">可单独练习。</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-stone-300 shadow-2xl shadow-black/15 backdrop-blur">
      <p className="mb-3 text-xs uppercase tracking-[0.24em] text-stone-500">{title}</p>
      {children}
    </article>
  );
}

function DurationChip({ method, minutes }: { method: MethodDefinition; minutes: DurationMinutes }) {
  const variant = getPracticeVariant(method.id, minutes);
  return (
    <span className="rounded-full border border-violet-200/20 bg-violet-100/[0.07] px-3 py-1.5 text-sm text-violet-100">
      {minutes} 分钟{variant ? ` · ${variant.steps.length} 步` : ""}
    </span>
  );
}
