import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私政策 · StillMind",
  description: "StillMind 的隐私政策。我们不卖数据，私人原话默认不进入分析事件。",
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
        <p className="mt-3 text-sm text-stone-500">生效日期：2026 年 8 月 1 日</p>

        <div className="prose-invert mt-10 max-w-none space-y-8 text-[0.95rem] leading-7 text-stone-300">
          <Section title="1. 我们收集什么">
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong className="text-stone-100">你写下的原话</strong>：Web 版只在本次页面流程中临时使用，不写入网址，也不进入匿名分析事件。
                移动端只有在你主动开启「可选 AI 生成」并使用对应功能时，才会为单次生成发送给配置的 AI；默认离线练习不会发送。
              </li>
              <li>
                <strong className="text-stone-100">本地记录</strong>：方法、练习时长、练前练后 1–5 等级、结果和下一步行动。
                这些只存放在你浏览器的 localStorage，<strong>不上传</strong>。
              </li>
              <li>
                <strong className="text-stone-100">可选匿名产品事件</strong>：默认关闭。只有你主动勾选或在 App 设置中开启时，才会发送方法、状态类别、1–5 等级变化和复用意愿。
                不发送原话、自由反馈文字、真实姓名或精确事件时间。
              </li>
              <li>
                <strong className="text-stone-100">API rate limit</strong>：服务端在内存中按 IP 计数 1 分钟内的请求次数，用于防滥用。
                计数不持久化、进程重启即清空。
              </li>
            </ul>
          </Section>

          <Section title="2. 我们怎么用">
            <p>
              原话只用于完成你主动发起的本次练习；本地记录用于回看和改善下一次推荐。
              经你同意的匿名事件只用于判断练习是否完成、前后等级是否变化，以及用户是否愿意再次使用。
            </p>
          </Section>

          <Section title="3. 我们不做什么">
            <ul className="ml-4 list-disc space-y-2">
              <li>不卖你的数据</li>
              <li>StillMind 不用你的输入训练自己的模型</li>
              <li>除完成单次生成所需的第三方 AI 服务外，不向其他第三方提供你的输入</li>
              <li>不用广告 cookies 跨站跟踪你</li>
              <li>不投放广告</li>
            </ul>
          </Section>

          <Section title="4. 你的权利">
            <ul className="ml-4 list-disc space-y-2">
              <li>随时清浏览器数据 = 清掉所有本地历史</li>
              <li>拒绝 disclaimer = 不用服务</li>
              <li>不依赖账号 / 邮箱即可使用</li>
              <li>可以不启用匿名分析，核心练习照常使用</li>
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

          <Section title="6. 可选匿名分析">
            <p>
              如果部署方配置了 PostHog，且你主动同意匿名帮助改进，StillMind 会通过自己的事件接口转发严格白名单字段。
              事件使用随机匿名标识并关闭个人档案处理；没有同意时不会发送。部署方未配置分析服务时，练习仍然完整可用。
            </p>
          </Section>

          <Section title="7. 政策变更">
            <p>
              如果我们对政策做实质变更，会更新此页面并把生效日期写在最上方。
            </p>
          </Section>

          <Section title="8. 联系方式">
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
