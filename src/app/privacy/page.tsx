import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "隐私政策 · StillMind", description: "StillMind 的输入、本机记录与可选产品事件说明。" };
export default function PrivacyPage() {
  return <main className="relative min-h-screen overflow-hidden bg-[#090a0c] text-stone-100">
    <div className="cinema-bg" /><div className="noise-grain" />
    <section className="relative z-10 mx-auto w-full max-w-2xl px-5 py-10 sm:py-16">
      <Link href="/" className="text-xs uppercase tracking-[0.28em] text-stone-500 transition hover:text-stone-300">← 返回</Link>
      <p className="mt-8 text-xs uppercase tracking-[0.28em] text-amber-100/70">隐私政策</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-50 sm:text-4xl">你写下的东西，只属于你。</h1>
      <p className="mt-3 text-sm text-stone-500">版本日期：2026 年 9 月 6 日（随此版本发布生效）</p>
      <div className="prose-invert mt-10 max-w-none space-y-8 text-[0.95rem] leading-7 text-stone-300">
        <Section title="1. 输入与语音"><p>当前 Web 主流程使用本地规则和离线脚本。文字原话只在本次流程中临时使用，不写入网址、不进入产品分析事件，也不因服务端配置了模型密钥而自动发送给模型。</p><p>点击语音输入后，由浏览器提供的语音识别服务处理音频。不同浏览器可能使用云端识别，并适用浏览器及服务提供方的权限和隐私规则。StillMind 不承诺这部分在本机完成；你可以改用文字或不输入。</p><p>移动端只有在你主动开启可选 AI，并使用相应生成功能时，才为该次生成发送必要文字。默认离线练习不发送。</p></Section>
        <Section title="2. 本机记录"><p>Web 在浏览器 localStorage 中保存练习尝试、所选方法、实际及计划时长、已填写的前后 1–5 评分、结果和可选反馈。不填写的评分不会用默认值补齐；中止不记录为完成。</p><p>自由反馈文字只在本机保存。复制反馈后是否发送给他人，由你决定。本机存储失败时会提示未保存，但不妨碍结束练习。原生 App 使用设备内的本地存储。</p><p>本机记录不等于加密保险箱，共用设备时请注意浏览器/设备访问权限。清除浏览器站点数据会删除 Web 本机记录。</p></Section>
        <Section title="3. 自愿产品事件"><p>默认不发送产品分析事件。你可以在本次练习开始前，自愿选择分享开始、结束、粗粒度时长区间、方法、状态类别以及已填写的评分变化和复用意愿。</p><p>事件用随机浏览器标识和随机会话标识关联，不含原话、自由反馈、姓名或前端记录的精确时间。随机标识是技术上的去标识方式，不是绝对无法关联身份的保证。服务商仍会收到网络请求所需的信息。</p><p>只在练后同意分享时，仅发送这次反馈，不补报开始事件。不分享不影响练习。部署方未配置分析服务时，事件不会入库，练习照常使用。</p></Section>
        <Section title="4. 第三方 AI 与分析服务"><p>可选 AI 请求通过 StillMind 服务端发送到配置的 StepFun API。StillMind 不在该接口持久化原话；第三方处理以其当时有效的服务条款和隐私规则为准。没有密钥或生成失败时使用明确标注的预设，不冒充实时结果。</p><p>部署方配置 PostHog 且你同意分享时，事件接口才转发白名单字段，并关闭个人档案处理。服务端有短期内存限流计数；托管平台和服务商的运行日志不等于本机记录。</p></Section>
        <Section title="5. 我们不做什么"><ul className="ml-4 list-disc space-y-2"><li>不出售你的数据。</li><li>StillMind 不用你的输入训练自己的模型。</li><li>不投放广告，不用广告 cookies 跨站跟踪。</li><li>不将自评或动画当作心理诊断、意识等级或临床效果证明。</li></ul></Section>
        <Section title="6. 你的选择"><p>无需账号即可使用；可以不输入事件、不填写评分、不分享统计、暂停或中止练习。首次使用需了解使用边界。原生端的数据导出/删除按 App 设置提供的操作执行。</p><p>需要删除 Web 记录时可以清除本网站浏览器数据。已经发出的事件不会因清除浏览器自动撤回；有关已提交信息的请求请联系支持渠道，并避免在公开 GitHub 问题中留下私人内容。</p></Section>
        <Section title="7. 变更与联系"><p>涉及实际数据处理的变更，会更新本页及版本日期。产品问题或隐私请求：<Link href="/support" className="text-amber-100/90 underline underline-offset-2">支持与反馈</Link>。</p></Section>
      </div>
      <div className="mt-12 border-t border-white/10 pt-6 text-xs text-stone-500"><Link href="/terms" className="mr-4 hover:text-stone-300">服务条款</Link><Link href="/support" className="hover:text-stone-300">支持与反馈 →</Link></div>
    </section>
  </main>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-lg font-medium text-stone-100">{title}</h2><div className="mt-3 space-y-2">{children}</div></section>;
}
