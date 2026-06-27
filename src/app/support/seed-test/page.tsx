import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "种子用户测试说明 · StillMind",
  description: "StillMind 种子用户测试的隐私边界、测试任务和反馈方式。",
};

const coreTasks = [
  "打开 StillMind，选择一个不含私人细节的泛化场景。",
  "完成一次 Reset：选择状态、开始练习、结束后做 after-check。",
  "打开 Reflection，看是否能理解本机历史和周度回看。",
  "打开 Profile，找到隐私、导出、删除和支持入口。",
  "48-72 小时后，告诉测试者你是否再次想起或打开过它。",
];

const safeFeedback = [
  "可以说：work conflict, message anxiety, overthinking, family tension。",
  "可以说：我完成了 / 卡住了 / 哪句话让我困惑。",
  "可以说：这让我更有选择、更没变化、或更不舒服。",
  "不要写：具体人名、聊天原文、医疗史、危机细节、联系方式。",
];

const questions = [
  "你觉得 StillMind 是做什么的？",
  "你会在什么时刻打开它？",
  "它像是在判断、建议、安慰，还是在帮你观察？",
  "哪一步太长、太虚、太像心理建议，或让你不舒服？",
  "你是否更能暂停一下再行动？",
];

export default function SeedTestPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090a0c] text-stone-100">
      <div className="cinema-bg" />
      <div className="noise-grain" />

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 py-10 sm:py-16">
        <Link
          href="/support"
          className="text-xs uppercase tracking-[0.28em] text-stone-500 transition hover:text-stone-300"
        >
          ← 支持与反馈
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.28em] text-violet-100/70">
          Invited seed test
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-stone-50 sm:text-4xl">
          请测试产品流程，不要提交私人故事。
        </h1>
        <p className="mt-4 text-[0.98rem] leading-7 text-stone-300">
          StillMind 正在验证一个很小的假设：当人被念头带走时，短暂停顿、
          观察和回到一个小行动，是否真的有帮助。这不是治疗、诊断、建议或危机支持。
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Panel title="测试任务" items={coreTasks} />
          <Panel title="安全反馈边界" items={safeFeedback} />
        </div>

        <section className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
          <h2 className="text-lg font-medium text-stone-50">完成后回答这 5 个问题</h2>
          <ol className="mt-4 space-y-3 text-[0.95rem] leading-7 text-stone-300">
            {questions.map((question) => (
              <li key={question} className="flex gap-3">
                <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-violet-300/20 text-center text-xs leading-5 text-violet-100">
                  {questions.indexOf(question) + 1}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-amber-100/15 bg-amber-100/[0.06] p-5">
          <h2 className="text-lg font-medium text-stone-50">如果过程中变得不安全</h2>
          <p className="mt-3 text-[0.95rem] leading-7 text-stone-300">
            请停止测试。StillMind 不能处理即时危险、医疗紧急情况、自伤/伤人风险或危机支持。
            请联系当地紧急服务、可信任的人或合格专业支持。
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-xs text-stone-500">
          <Link href="/privacy" className="hover:text-stone-300">
            隐私政策
          </Link>
          <Link href="/terms" className="hover:text-stone-300">
            服务条款
          </Link>
          <Link href="/support" className="hover:text-stone-300">
            支持与反馈
          </Link>
        </div>
      </section>
    </main>
  );
}

function Panel({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
      <h2 className="text-lg font-medium text-stone-50">{title}</h2>
      <ul className="mt-4 space-y-3 text-[0.95rem] leading-7 text-stone-300">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-200/80" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
