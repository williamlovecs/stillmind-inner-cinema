import type { ReactNode } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/ui";
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

const stepKindLabels = {
  arrive: "进入",
  notice: "留意",
  breathe: "呼吸",
  observe: "观察",
  choose: "选择",
  close: "收束",
} as const;

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
    <main className="sm-page">
      <section className="sm-container mx-auto">
        <AppHeader />
        <Link href="/methods" className="mt-6 inline-flex min-h-11 items-center text-sm text-[#596055] hover:text-[#8e4431]">← 返回方法库</Link>

        <section className="grid gap-10 border-b border-[#d4d2c5] py-12 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div>
            <p className="sm-eyebrow">方法说明</p>
            <h1 className="sm-title mt-4">{method.title}</h1>
            <p className="mt-5 font-serif text-2xl leading-relaxed text-[#282e29]">{method.subtitle}</p>
            <p className="sm-copy mt-5 text-[#596055]">{method.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/reset?method=${method.id}`} className="sm-button sm-button-primary inline-flex items-center justify-center px-5 py-3 text-sm no-underline">
                用这个方法开始练习
              </Link>
              <Link href="/" className="sm-button inline-flex items-center justify-center px-5 py-3 text-sm no-underline">
                回到一分钟入口
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6b7165]">
              <span>{method.durations.join(" / ")} 分钟</span>
              <span>{method.premium ? "进阶练习" : "核心练习"}</span>
            </div>
          </div>
          <div className="grid gap-0 border-t border-[#d4d2c5]">
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
          <section className="py-12">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="sm-eyebrow">练习脚本</p>
                <h2 className="mt-3 font-serif text-3xl font-medium text-[#282e29]">{primary.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#596055]">{primary.subtitle}</p>
              </div>
              <p className="text-xs text-[#6b7165]">内容版本 v{primary.contentVersion}</p>
            </div>
            <p className="mt-6 border-l-2 border-[#a9563d] bg-[#eeece3] p-4 text-sm leading-7 text-[#596055]">
              准备：{primary.preparation}
            </p>
            <div className="mt-8 grid gap-0 border-t border-[#d4d2c5] md:grid-cols-2 md:gap-x-8">
              {primary.steps.map((step, index) => (
                <article key={step.id} className="border-b border-[#d4d2c5] py-6">
                  <div className="flex items-center justify-between gap-3 text-xs text-[#6b7165]">
                    <p>{String(index + 1).padStart(2, "0")} · {stepKindLabels[step.kind]}</p>
                    <p>{step.seconds} 秒</p>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-[#282e29]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#596055]">{step.instruction}</p>
                  {step.alternative && <p className="mt-3 text-xs leading-6 text-[#6b7165]">替代方式：{step.alternative}</p>}
                </article>
              ))}
            </div>
            <p className="mt-7 text-base leading-8 text-[#282e29]">{primary.closing}</p>
          </section>
        )}

        <section className="grid gap-8 border-t border-[#d4d2c5] py-10 md:grid-cols-2">
          <div>
            <p className="sm-eyebrow">可选时长</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {method.durations.map((minutes) => <DurationChip key={minutes} method={method} minutes={minutes} />)}
            </div>
          </div>
          <div>
            <p className="sm-eyebrow">出现于路径</p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#596055]">
              {paths.length > 0 ? paths.map((path) => <p key={path.id}>{path.title} · {path.subtitle}</p>) : <p>可单独练习。</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="border-b border-[#d4d2c5] py-5 text-sm leading-7 text-[#596055]">
      <p className="mb-2 text-xs font-medium tracking-[0.12em] text-[#282e29]">{title}</p>
      {children}
    </article>
  );
}

function DurationChip({ method, minutes }: { method: MethodDefinition; minutes: DurationMinutes }) {
  const variant = getPracticeVariant(method.id, minutes);
  return <span className="rounded-md border border-[#d4d2c5] px-3 py-2 text-sm text-[#596055]">{minutes} 分钟{variant ? ` · ${variant.steps.length} 步` : ""}</span>;
}
