import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "服务条款 · StillMind: Inner Cinema",
  description: "StillMind 的服务条款。它不是医疗服务，不替代专业心理帮助。",
};

export default function TermsPage() {
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
          服务条款
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-50 sm:text-4xl">
          一份关于「它不是什么」的说明。
        </h1>
        <p className="mt-3 text-sm text-stone-500">生效日期：2026 年 6 月 10 日</p>

        <div className="prose-invert mt-10 max-w-none space-y-8 text-[0.95rem] leading-7 text-stone-300">
          <Section title="1. StillMind 是什么">
            <p>
              一个内在电影工具：把你当下的情绪反应，投成一段第三人称的「分镜」，
              引导你从角色视角退到观众视角。是一个「看见念头」的练习，
              不是放松训练，不是冥想课程。
            </p>
          </Section>

          <Section title="2. StillMind 不是什么">
            <p>
              <strong className="text-stone-100">不是医疗服务。</strong>
              不做心理诊断，不做治疗，不开药，不替代心理咨询、心理治疗、危机干预。
            </p>
            <p>
              如果你正在经历抑郁、焦虑、自伤、伤人念头，
              请直接联系专业支持（参考 disclaimer 里的热线），
              <strong>不要依赖本应用处理危机</strong>。
            </p>
          </Section>

          <Section title="3. 用户责任">
            <ul className="ml-4 list-disc space-y-2">
              <li>不滥用：不刷接口、不攻击、不绕过 rate limit</li>
              <li>不依赖：把 StillMind 当辅助工具，不当替代</li>
              <li>你对自己输入的 trigger 内容负责</li>
            </ul>
          </Section>

          <Section title="4. 知识产权">
            <ul className="ml-4 list-disc space-y-2">
              <li>你输入的 trigger 归你</li>
              <li>AI 生成的「内在电影」分镜供你个人使用，不保证商业可用性</li>
              <li>StillMind 的代码、视觉、文案归我们</li>
            </ul>
          </Section>

          <Section title="5. 免责">
            <ul className="ml-4 list-disc space-y-2">
              <li>不保证服务永远可用、永远准确</li>
              <li>不对因使用本服务产生的任何后果负责</li>
              <li>不对第三方 AI（StepFun）的输出质量负责</li>
            </ul>
          </Section>

          <Section title="6. 变更 / 终止">
            <p>
              我们可能改功能、改 UI、改 preset、上线下线服务，
              会在产品内通知（如果你正在使用）。
            </p>
          </Section>

          <Section title="7. 联系方式">
            <p>
              产品问题或条款请求：
              <Link className="text-amber-100/90 underline underline-offset-2" href="/support">
                支持与反馈
              </Link>
            </p>
          </Section>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-stone-500">
          <Link href="/privacy" className="mr-4 hover:text-stone-300">
            ← 隐私政策
          </Link>
          <Link href="/support" className="hover:text-stone-300">
            支持与反馈
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
