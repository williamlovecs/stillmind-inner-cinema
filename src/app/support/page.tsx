import type { Metadata } from "next";
import Link from "next/link";

const feedbackUrl = "https://github.com/williamlovecs/stillmind-inner-cinema/issues/new/choose";

export const metadata: Metadata = {
  title: "支持与反馈 · StillMind",
  description: "StillMind 的支持入口、数据请求、产品边界和反馈方式。",
};

export default function SupportPage() {
  return (
    <main className="sm-page">
      <section className="sm-container mx-auto max-w-3xl">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-[#596055] transition hover:text-[#8e4431]">← 返回</Link>
        <p className="sm-eyebrow mt-10">支持与反馈</p>
        <h1 className="sm-title mt-4">这里处理产品问题，不处理危机。</h1>
        <p className="sm-copy mt-5 text-[#596055]">
          StillMind 是一般觉察与状态切换工具。你可以在这里反馈 bug、提出产品建议、
          请求隐私或数据相关帮助。若你或他人正处于即时危险，请优先联系当地紧急服务或可信任的人。
        </p>

        <div className="mt-12 grid gap-0 border-t border-[#d4d2c5]">
          <SupportCard title="产品反馈" body="流程卡住、页面打不开、文案不清楚、练习体验不舒服，都可以提交。GitHub issue 是公开的，请不要写私人触发内容、联系方式、医疗信息或危机细节。" href={feedbackUrl} label="打开公开反馈模板" external />
          <SupportCard title="种子用户测试" body="如果你是被邀请的早期测试者，请先看测试说明。反馈只需要泛化场景、完成情况、困惑点和是否更有选择，不需要任何私人故事。" href="/support/seed-test" label="查看测试说明" />
          <SupportCard title="隐私与数据" body="当前版本默认本地优先。你可以在 App 内导出或清除本机数据。Web demo 的本地记录可通过清理浏览器站点数据删除。正式上架前，私密支持邮箱仍需确认。" href="/privacy" label="查看隐私政策" />
          <SupportCard title="服务边界" body="StillMind 不提供诊断、治疗、医疗建议或紧急支持。它只提供短时的观察、暂停和回到行动的提示。" href="/terms" label="查看服务条款" />
        </div>

        <section className="mt-10 border-l-2 border-[#a9563d] bg-[#eeece3] p-5">
          <h2 className="text-lg font-medium text-[#282e29]">如果你现在无法保证安全</h2>
          <p className="mt-3 text-[0.95rem] leading-7 text-[#596055]">
            请不要等待 StillMind 回复。请立即联系当地紧急服务、前往急诊，或请一位可信任的人留在你身边。
            StillMind 不能替代现实中的紧急支持。
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-5 border-t border-[#d4d2c5] pt-6 text-xs text-[#6b7165]">
          <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-[#282e29]">隐私政策</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-[#282e29]">服务条款</Link>
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
  const className = "block border-b border-[#d4d2c5] py-6 no-underline transition hover:bg-[#eeece3]";

  const content = (
    <>
      <h2 className="text-lg font-medium text-[#282e29]">{title}</h2>
      <p className="mt-3 text-[0.95rem] leading-7 text-[#596055]">{body}</p>
      <p className="mt-4 text-sm font-medium text-[#8e4431]">{label} →</p>
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
