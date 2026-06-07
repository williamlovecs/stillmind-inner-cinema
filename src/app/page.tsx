"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "home" | "cinema" | "perspective" | "observer" | "return";

const examples = [
  "我被批评了",
  "我感觉被忽视",
  "我想证明自己",
  "我刚发生冲突",
  "我在反复内耗",
];

const noiseWords = [
  "我必须证明自己",
  "是不是我不够好？",
  "我需要马上反击",
  "他们不理解我",
  "我不能输",
  "我要解释清楚",
];

const fallbackTrigger = "我被批评了，现在很想立刻为自己辩解。";

function createCinema(trigger: string) {
  const cleanTrigger = trigger.trim() || fallbackTrigger;
  const isIgnored = /忽视|没回|不回|ignored|reply/i.test(cleanTrigger);
  const isConflict = /冲突|吵|争|conflict|fight/i.test(cleanTrigger);
  const isProve = /证明|prove|价值|value/i.test(cleanTrigger);

  const title = isIgnored
    ? "一条没有回应的消息"
    : isConflict
      ? "冲突之后的回声"
      : isProve
        ? "想被看见的瞬间"
        : "被触发的片刻";

  const roleView = isIgnored
    ? "我被忽视了。我需要得到回应，才知道自己有没有价值。"
    : isConflict
      ? "我被攻击了。我必须把话说清楚，否则我就输了。"
      : isProve
        ? "我必须证明自己，不然别人就不会看见我的价值。"
        : "我被触动了。我想立刻做点什么，让这种不安停下来。";

  const audienceView = isIgnored
    ? "一个人正把沉默解读成否定，并想用回应确认自己的价值。"
    : isConflict
      ? "一个人感到被误解，身体进入防御，头脑正在准备反击。"
      : isProve
        ? "一个人正在努力保护自己的价值感，想让外界给出确认。"
        : "一个人正被一段内在剧情拉走，暂时忘了自己也可以观看它。";

  const directorView = isIgnored
    ? "反应背后，是一个想被看见、被回应、被安心接住的需要。"
    : isConflict
      ? "反应背后，是一个想被理解、被尊重、不被误读的需要。"
      : isProve
        ? "反应背后，是一个想确认自己本来就有价值的需要。"
        : "反应背后，是一个想重新回到安全、清明和选择权的需要。";

  return {
    title,
    narrative: `Will 坐在那里，回放着刚才发生的事：${cleanTrigger}

胸口有一点紧，注意力开始被那段剧情牵走。头脑想解释、辩解、证明，像是在保护某个很重要的价值。

现在，先坐到观众席。
看见这个角色。
不要进入这个角色。`,
    roleView,
    audienceView,
    directorView,
  };
}

export default function Home() {
  const [step, setStep] = useState<Step>("home");
  const [trigger, setTrigger] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isComplete, setIsComplete] = useState(false);

  const cinema = useMemo(() => createCinema(trigger), [trigger]);
  const progress = ((60 - secondsLeft) / 60) * 100;

  useEffect(() => {
    if (step !== "observer" || isComplete) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsComplete(true);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, isComplete]);

  const enterCinema = () => {
    if (!trigger.trim()) {
      setTrigger(fallbackTrigger);
    }
    setStep("cinema");
  };

  const startAgain = () => {
    setTrigger("");
    setSecondsLeft(60);
    setIsComplete(false);
    setStep("home");
  };

  const startObserver = () => {
    setSecondsLeft(60);
    setIsComplete(false);
    setStep("observer");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090a0c] text-stone-100">
      <div className="cinema-bg" />
      <div className="noise-grain" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-5 sm:max-w-lg">
        <Header step={step} />

        <div className="flex flex-1 items-center py-5">
          {step === "home" && (
            <HomePanel
              trigger={trigger}
              onTriggerChange={setTrigger}
              onExampleClick={setTrigger}
              onEnter={enterCinema}
            />
          )}

          {step === "cinema" && (
            <CinemaPanel cinema={cinema} onNext={() => setStep("perspective")} />
          )}

          {step === "perspective" && (
            <PerspectivePanel
              roleView={cinema.roleView}
              audienceView={cinema.audienceView}
              directorView={cinema.directorView}
              onNext={startObserver}
            />
          )}

          {step === "observer" && (
            <ObserverPanel
              secondsLeft={secondsLeft}
              progress={progress}
              isComplete={isComplete}
              onSkip={() => {
                setSecondsLeft(0);
                setIsComplete(true);
              }}
              onReturn={() => setStep("return")}
            />
          )}

          {step === "return" && <ReturnPanel onStartAgain={startAgain} />}
        </div>
      </section>
    </main>
  );
}

function Header({ step }: { step: Step }) {
  const steps: Step[] = ["home", "cinema", "perspective", "observer", "return"];
  const index = steps.indexOf(step);

  return (
    <header className="flex items-center justify-between pt-2">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          StillMind
        </p>
        <p className="mt-1 text-sm text-stone-300">Inner Cinema</p>
      </div>
      <div className="flex gap-1.5" aria-label="Progress">
        {steps.map((item, itemIndex) => (
          <span
            key={item}
            className={`h-1.5 w-6 rounded-full transition-colors ${
              itemIndex <= index ? "bg-stone-100" : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </header>
  );
}

function HomePanel({
  trigger,
  onTriggerChange,
  onExampleClick,
  onEnter,
}: {
  trigger: string;
  onTriggerChange: (value: string) => void;
  onExampleClick: (value: string) => void;
  onEnter: () => void;
}) {
  return (
    <div className="w-full">
      <p className="mb-4 text-sm text-stone-400">AI 观察者模式</p>
      <h1 className="text-5xl font-semibold leading-[0.98] text-stone-50">
        Turn inner noise into a movie.
      </h1>
      <p className="mt-5 text-base leading-7 text-stone-300">
        写下一个情绪触发。StillMind 会把它转成第三人称内在电影，
        带你从角色视角回到 Observer Mode。
      </p>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <textarea
          value={trigger}
          onChange={(event) => onTriggerChange(event.target.value)}
          className="min-h-36 w-full resize-none rounded-[1.4rem] border border-white/10 bg-black/30 p-4 text-base leading-7 text-stone-100 outline-none placeholder:text-stone-500 focus:border-stone-300/60"
          placeholder="我被批评了，现在很想立刻为自己辩解。"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => onExampleClick(example)}
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-stone-300 transition hover:border-white/25 hover:bg-white/[0.1]"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-stone-100 text-base font-medium text-[#111113] transition hover:bg-white"
        >
          Enter Inner Cinema
        </button>
      </div>
    </div>
  );
}

function CinemaPanel({
  cinema,
  onNext,
}: {
  cinema: ReturnType<typeof createCinema>;
  onNext: () => void;
}) {
  return (
    <div className="w-full">
      <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
        Scene 01
      </p>
      <h2 className="mt-3 text-4xl font-semibold text-stone-50">
        《{cinema.title}》
      </h2>
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#111113]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="whitespace-pre-line text-lg leading-9 text-stone-200">
          {cinema.narrative}
        </p>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.09] text-base font-medium text-stone-50 transition hover:bg-white/[0.14]"
      >
        Shift Perspective
      </button>
    </div>
  );
}

function PerspectivePanel({
  roleView,
  audienceView,
  directorView,
  onNext,
}: {
  roleView: string;
  audienceView: string;
  directorView: string;
  onNext: () => void;
}) {
  const cards = [
    {
      title: "Role View",
      subtitle: "角色视角",
      text: roleView,
    },
    {
      title: "Audience View",
      subtitle: "观众视角",
      text: audienceView,
    },
    {
      title: "Director View",
      subtitle: "导演视角",
      text: directorView,
    },
  ];

  return (
    <div className="w-full">
      <p className="text-sm text-stone-400">三层视角切换</p>
      <h2 className="mt-3 text-4xl font-semibold leading-tight text-stone-50">
        不是定义你， 只是观看这段电影。
      </h2>

      <div className="mt-6 grid gap-3">
        {cards.map((card, index) => (
          <article
            key={card.title}
            className="rounded-[1.6rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-stone-50">{card.title}</h3>
              <span className="text-xs text-stone-500">0{index + 1}</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">{card.subtitle}</p>
            <p className="mt-4 text-base leading-7 text-stone-200">
              {card.text}
            </p>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-stone-100 text-base font-medium text-[#111113] transition hover:bg-white"
      >
        Start Observer Mode
      </button>
    </div>
  );
}

function ObserverPanel({
  secondsLeft,
  progress,
  isComplete,
  onSkip,
  onReturn,
}: {
  secondsLeft: number;
  progress: number;
  isComplete: boolean;
  onSkip: () => void;
  onReturn: () => void;
}) {
  const opacity = Math.max(0.08, 1 - progress / 90);

  return (
    <div className="w-full text-center">
      <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
        Observer Mode
      </p>
      <div className="relative mx-auto mt-8 flex aspect-square w-full max-w-[330px] items-center justify-center">
        <div className="absolute inset-8 rounded-full border border-white/10" />
        <div className="breathing-circle absolute h-44 w-44 rounded-full" />
        <div className="relative z-10">
          <p className="text-6xl font-semibold tabular-nums text-stone-50">
            {secondsLeft}
          </p>
          <p className="mt-2 text-sm text-stone-500">seconds</p>
        </div>

        {noiseWords.map((word, index) => (
          <span
            key={word}
            className={`floating-word floating-word-${index + 1}`}
            style={{ opacity }}
          >
            {word}
          </span>
        ))}
      </div>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-stone-100 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mx-auto mt-6 max-w-sm text-xl leading-8 text-stone-100">
        Watch the role. Watch the thought. Do not enter the movie.
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-500">
        看见念头升起、停留、落下。不解释，不证明，不追随。
      </p>

      {isComplete ? (
        <button
          type="button"
          onClick={onReturn}
          className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-stone-100 text-base font-medium text-[#111113] transition hover:bg-white"
        >
          Return
        </button>
      ) : (
        <button
          type="button"
          onClick={onSkip}
          className="mt-7 text-sm text-stone-500 underline underline-offset-4 transition hover:text-stone-200"
        >
          Skip to Return
        </button>
      )}
    </div>
  );
}

function ReturnPanel({ onStartAgain }: { onStartAgain: () => void }) {
  return (
    <div className="w-full">
      <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
        Return
      </p>
      <h2 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">
        情绪没有被抹掉。你只是回到了观众席。
      </h2>
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-lg leading-8 text-stone-200">
          You did not erase the emotion. You stepped out of the role and
          returned to the observer seat.
        </p>
        <div className="mt-6 rounded-[1.4rem] border border-stone-200/15 bg-stone-100 p-5 text-[#111113]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            Grounding Action
          </p>
          <p className="mt-3 text-lg leading-8">
            先不要立刻回复。喝水，走路 3 分钟，晚一点再决定。
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartAgain}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.09] text-base font-medium text-stone-50 transition hover:bg-white/[0.14]"
      >
        Start Again
      </button>
    </div>
  );
}
