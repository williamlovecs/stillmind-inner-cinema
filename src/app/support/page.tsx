import type { Metadata } from "next";
import Link from "next/link";

const feedbackUrl = "https://github.com/williamlovecs/stillmind-inner-cinema/issues/new/choose";

export const metadata: Metadata = {
  title: "支持与反馈 · StillMind: Inner Cinema",
  description: "StillMind 的支持入口、数据请求、产品边界和反馈方式。",
};

export default function SupportPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090a0c] text-stone-100">
      <div className="cinema-bg" />
      <div className="noise-grain" />

      <section className="relative z-10 mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.28em] text-stone-500 transition hover:text-stone-300"
        >
          ← 返回
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.28em] text-amber-100/70">
          支持与反馈
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-50 sm:text-4xl">
          这里处理产品问题，不处理危机。
        </h1>
        <p className="mt-4 text-[0.98rem] leading-7 text-stone-300">
          StillMind 是一般觉察与状态切换工具。你可以在这里反馈 bug、提出产品建议、
          请求隐私或数据相关帮助。若你或他人正处于即时危险，请优先联系当地紧急服务或可信任的人。
        </p>

        <div className="mt-10 grid gap-4">
          <SupportCard
            title="产品反馈"
            body="流程卡住、页面打不开、文案不清楚、练习体验不舒服，都可以提交。GitHub issue 是公开的，请不要写私人触发内容、联系方式、医疗信息或危机细节。"
            href={feedbackUrl}
            label="打开公开反馈模板"
            external
          />
          <SupportCard
            title="种子用户测试"
            body="如果你是被邀请的早期测试者，请先看测试说明。反馈只需要泛化场景、完成情况、困惑点和是否更有选择，不需要任何私人故事。"
            href="/support/seed-test"
            label="查看测试说明"
          />
          <SupportCard
            title="隐私与数据"
            body="当前版本默认本地优先。你可以在 App 内导出或清除本机数据。Web demo 的本地记录可通过清理浏览器站点数据删除。正式上架前，私密支持邮箱仍需确认。"
            href="/privacy"
            label="查看隐私政策"
          />
          <SupportCard
            title="服务边界"
            body="StillMind 不提供诊断、治疗、医疗建议或紧急支持。它只提供短时的观察、暂停和回到行动的提示。"
            href="/terms"
            label="查看服务条款"
          />
        </div>

        <section className="mt-10 rounded-[1.5rem] border border-amber-100/15 bg-amber-100/[0.06] p-5">
          <h2 className="text-lg font-medium text-stone-50">如果你现在无法保证安全</h2>
          <p className="mt-3 text-[0.95rem] leading-7 text-stone-300">
            请不要等待 StillMind 回复。请立即联系当地紧急服务、前往急诊，或请一位可信任的人留在你身边。
            StillMind 不能替代现实中的紧急支持。
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-xs text-stone-500">
          <Link href="/privacy" className="hover:text-stone-300">
            隐私政策
          </Link>
          <Link href="/terms" className="hover:text-stone-300">
            服务条款
          </Link>
        </div>
      </section>
    </main>
  );
}

function SupportCard({
  title,
  body,
  href,
  label,
  external = false,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "block rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:border-violet-200/30 hover:bg-white/[0.07]";

  const content = (
    <>
      <h2 className="text-lg font-medium text-stone-50">{title}</h2>
      <p className="mt-3 text-[0.95rem] leading-7 text-stone-300">{body}</p>
      <p className="mt-4 text-sm font-medium text-violet-100">{label} →</p>
    </>
  );

  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
