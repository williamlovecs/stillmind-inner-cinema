import Link from "next/link";

type WorkflowStep = "home" | "reset" | "methods";

const steps: Array<{ id: WorkflowStep; href: string; label: string; body: string }> = [
  { id: "home", href: "/", label: "说出发生了什么", body: "口述或写下当前剧情" },
  { id: "reset", href: "/reset", label: "做 1 分钟练习", body: "推荐方法 + 前后评分" },
  { id: "methods", href: "/methods", label: "探索方法库", body: "完成后再深入 12 种方法" },
];

export function WorkflowNav({ active }: { active: WorkflowStep }) {
  return (
    <nav aria-label="StillMind 使用流程" className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-1.5 backdrop-blur-xl sm:rounded-[1.6rem] sm:p-2">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === active;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={`min-h-16 rounded-[1rem] border px-2 py-2.5 text-center transition sm:min-h-0 sm:rounded-[1.2rem] sm:px-3 sm:py-3 sm:text-left ${
                isActive
                  ? "border-violet-200/55 bg-violet-200/14 text-white shadow-[0_0_24px_rgba(168,85,247,0.12)]"
                  : "border-white/8 bg-slate-950/24 text-stone-400 hover:border-violet-200/30 hover:text-stone-100"
              }`}
            >
              <span className="text-[10px] tracking-[0.16em] text-violet-200/55 sm:text-xs sm:uppercase sm:tracking-[0.2em]">0{index + 1}</span>
              <span className="mt-1 block text-xs font-semibold leading-4 sm:text-sm">{step.label}</span>
              <span className="mt-1 hidden text-xs leading-5 opacity-70 sm:block">{step.body}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

