import Link from "next/link";

type WorkflowStep = "home" | "reset" | "methods";

const steps: Array<{ id: WorkflowStep; href: string; label: string; body: string }> = [
  { id: "home", href: "/", label: "说出发生了什么", body: "口述或写下当前剧情" },
  { id: "reset", href: "/reset", label: "做 1 分钟 Reset", body: "推荐方法 + 前后评分" },
  { id: "methods", href: "/methods", label: "探索方法库", body: "完成后再深入 12 种方法" },
];

export function WorkflowNav({ active }: { active: WorkflowStep }) {
  return (
    <nav aria-label="StillMind workflow" className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-2 backdrop-blur-xl">
      <div className="grid gap-2 sm:grid-cols-3">
        {steps.map((step, index) => {
          const isActive = step.id === active;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`rounded-[1.2rem] border px-3 py-3 transition ${
                isActive
                  ? "border-violet-200/55 bg-violet-200/14 text-white shadow-[0_0_24px_rgba(168,85,247,0.12)]"
                  : "border-white/8 bg-slate-950/24 text-stone-400 hover:border-violet-200/30 hover:text-stone-100"
              }`}
            >
              <span className="text-xs uppercase tracking-[0.2em] text-violet-200/55">0{index + 1}</span>
              <span className="mt-1 block text-sm font-semibold">{step.label}</span>
              <span className="mt-1 block text-xs leading-5 opacity-70">{step.body}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

