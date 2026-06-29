import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私政策 · StillMind",
  description: "StillMind 的隐私政策。我们不卖数据、不训练模型、不做跟踪。",
};

export default function PrivacyPage() {
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
          隐私政策
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-50 sm:text-4xl">
          你写下的东西，只属于你。
        </h1>
        <p className="mt-3 text-sm text-stone-500">生效日期：2026 年 6 月 10 日</p>

        <div className="prose-invert mt-10 max-w-none space-y-8 text-[0.95rem] leading-7 text-stone-300">
          <Section title="1. 我们收集什么">
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong className="text-stone-100">trigger 文字</strong>：你在主页输入的情绪触发事件。
                仅在你点击「进入内在电影」时，发送给我们配置的 AI（用于单次生成分镜）。
                我们不持久化你的输入。
              </li>
              <li>
                <strong className="text-stone-100">本地统计</strong>：呼气次数、念头经过次数、选中动作、距离感反馈、生成方式（preset / stepfun）。
                这些只存放在你浏览器的 localStorage，<strong>不上传</strong>。
              </li>
              <li>
                <strong className="text-stone-100">API rate limit</strong>：服务端在内存中按 IP 计数 1 分钟内的请求次数，用于防滥用。
                计数不持久化、进程重启即清空。
              </li>
            </ul>
          </Section>

          <Section title="2. 我们怎么用">
            <p>
              trigger 文字只用于一次性生成你看到的内在电影分镜；
              本地统计只用于在你自己设备上展示「本次呼吸锚定」「念头经过」等回顾。
            </p>
          </Section>

          <Section title="3. 我们不做什么">
            <ul className="ml-4 list-disc space-y-2">
              <li>不卖你的数据</li>
              <li>StillMind 不用你的输入训练自己的模型</li>
              <li>除完成单次生成所需的第三方 AI 服务外，不向其他第三方提供你的输入</li>
              <li>不用 cookies 跨站跟踪你</li>
              <li>不投放广告</li>
            </ul>
          </Section>

          <Section title="4. 你的权利">
            <ul className="ml-4 list-disc space-y-2">
              <li>随时清浏览器数据 = 清掉所有本地历史</li>
              <li>拒绝 disclaimer = 不用服务</li>
              <li>不依赖账号 / 邮箱即可使用</li>
            </ul>
          </Section>

          <Section title="5. 第三方 AI 处理">
            <p>
              如果服务端配置了 <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">STEPFUN_API_KEY</code>，
              你输入的 trigger 会被发送到 StepFun 的 API 用于生成分镜。
              StillMind 不在自己的服务中持久化这段输入；第三方如何处理请求，
              以 StepFun 当时有效的服务条款和隐私政策为准。
            </p>
            <p>
              即使没配 key，StillMind 也能完整使用——它会使用本地预设的内在电影模板。
            </p>
          </Section>

          <Section title="6. 政策变更">
            <p>
              如果我们对政策做实质变更，会更新此页面并把生效日期写在最上方。
            </p>
          </Section>

          <Section title="7. 联系方式">
            <p>
              产品问题或隐私请求：
              <Link className="text-amber-100/90 underline underline-offset-2" href="/support">
                支持与反馈
              </Link>
            </p>
          </Section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-stone-500">
          <Link href="/terms" className="mr-4 hover:text-stone-300">
            服务条款
          </Link>
          <Link href="/support" className="hover:text-stone-300">
            支持与反馈 →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium text-stone-100">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}
