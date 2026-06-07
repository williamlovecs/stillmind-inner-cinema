"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "home" | "cinema" | "perspective" | "observer" | "return";
type Cinema = ReturnType<typeof createCinema>;
type GenerationSource = "mock" | "stepfun" | "fallback";

const examples = [
  "我被批评了",
  "我刚发生冲突",
  "我想证明自己",
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
const pitchDemoTrigger = "我刚在会上和同事起了冲突，我想立刻反击证明自己没错。";

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

  const innerNoise = isIgnored
    ? ["为什么没有回应？", "是不是我不够好？", "我需要一个答案"]
    : isConflict
      ? ["我需要为自己辩解", "他们误解了我", "我必须立刻反击"]
      : isProve
        ? ["我需要证明自己", "他们必须看见我的价值", "我不能显得弱"]
        : ["哪里不对劲", "我需要马上解决", "我坐不住"];

  const scenes = isIgnored
    ? [
        { label: "镜头 01", line: "沉默出现了，身体开始寻找答案。" },
        { label: "镜头 02", line: "一个念头升起：是不是我不够好？" },
        { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
      ]
    : isConflict
      ? [
          { label: "镜头 01", line: "冲突刚刚发生，身体还在紧绷。" },
          { label: "镜头 02", line: "一个念头升起：我必须立刻反击。" },
          { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
        ]
      : isProve
        ? [
            { label: "镜头 01", line: "价值感被触动，注意力开始向外寻找确认。" },
            { label: "镜头 02", line: "一个念头升起：我必须证明自己。" },
            { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
          ]
        : [
            { label: "镜头 01", line: "触发刚刚出现，身体还没有完全安定。" },
            { label: "镜头 02", line: "一个念头升起：我需要马上解决它。" },
            { label: "镜头 03", line: "现在坐到观众席，看见角色，不进入剧情。" },
          ];

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

  const witnessView =
    "这个反应正在发生。念头经过你，不需要立刻被解释，也不需要被认同。";

  return {
    title,
    innerNoise,
    scenes,
    roleView,
    audienceView,
    witnessView,
  };
}

export default function Home() {
  const [step, setStep] = useState<Step>("home");
  const [trigger, setTrigger] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [isComplete, setIsComplete] = useState(false);
  const [timerEndsAt, setTimerEndsAt] = useState<number | null>(null);
  const [breathCount, setBreathCount] = useState(0);
  const [thoughtCount, setThoughtCount] = useState(0);
  const [liveCinema, setLiveCinema] = useState<Cinema | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] =
    useState<GenerationSource>("mock");

  const mockCinema = useMemo(() => createCinema(trigger), [trigger]);
  const cinema = liveCinema ?? mockCinema;
  const progress = Math.min(
    100,
    Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100),
  );

  useEffect(() => {
    if (step !== "observer" || isComplete || !timerEndsAt) {
      return;
    }

    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setIsComplete(true);
        setTimerEndsAt(null);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [step, isComplete, timerEndsAt]);

  const generateCinema = async (input: string) => {
    const controller = new AbortController();
    let didFallback = false;
    const timeout = window.setTimeout(() => controller.abort(), 9500);
    const fallbackTimer = window.setTimeout(() => {
      didFallback = true;
      setLiveCinema(null);
      setGenerationSource("fallback");
      setIsGenerating(false);
    }, 2000);

    try {
      const response = await fetch("/api/cinema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ trigger: input }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        cinema?: Cinema;
        source?: GenerationSource;
      };

      if (!data.cinema) {
        throw new Error("Missing cinema payload.");
      }

      if (didFallback) {
        return;
      }

      setLiveCinema(data.cinema);
      setGenerationSource(data.source === "stepfun" ? "stepfun" : "fallback");
    } catch {
      setLiveCinema(null);
      setGenerationSource("fallback");
    } finally {
      window.clearTimeout(timeout);
      window.clearTimeout(fallbackTimer);
      setIsGenerating(false);
    }
  };

  const enterCinema = (override?: string) => {
    const input = (override ?? trigger).trim() || fallbackTrigger;
    setTrigger(input);
    setLiveCinema(null);
    setGenerationSource("mock");
    setIsGenerating(true);
    setStep("cinema");
    void generateCinema(input);
  };

  const startAgain = () => {
    setTrigger("");
    setSecondsLeft(60);
    setTotalSeconds(60);
    setIsComplete(false);
    setTimerEndsAt(null);
    setBreathCount(0);
    setThoughtCount(0);
    setLiveCinema(null);
    setIsGenerating(false);
    setGenerationSource("mock");
    setStep("home");
  };

  const startObserver = () => {
    setSecondsLeft(60);
    setTotalSeconds(60);
    setIsComplete(false);
    setTimerEndsAt(Date.now() + 60000);
    setBreathCount(0);
    setThoughtCount(0);
    setStep("observer");
  };

  const startPitchDemo = () => {
    enterCinema(pitchDemoTrigger);
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
              onTriggerChange={(value) => {
                setTrigger(value);
                setLiveCinema(null);
                setGenerationSource("mock");
              }}
              onExampleClick={(value) => {
                setTrigger(value);
                setLiveCinema(null);
                setGenerationSource("mock");
              }}
              onEnter={() => enterCinema()}
              onPitchDemo={startPitchDemo}
            />
          )}

          {step === "cinema" && (
            <CinemaPanel
              cinema={cinema}
              source={generationSource}
              isGenerating={isGenerating}
              onNext={() => setStep("perspective")}
            />
          )}

          {step === "perspective" && (
            <PerspectivePanel
              roleView={cinema.roleView}
              audienceView={cinema.audienceView}
              witnessView={cinema.witnessView}
              onNext={startObserver}
            />
          )}

          {step === "observer" && (
            <ObserverPanel
              secondsLeft={secondsLeft}
              progress={progress}
              isComplete={isComplete}
              breathCount={breathCount}
              thoughtCount={thoughtCount}
              onBreath={() => setBreathCount((count) => count + 1)}
              onThought={() => setThoughtCount((count) => count + 1)}
              onFastDemo={() => {
                setTotalSeconds(15);
                setSecondsLeft(15);
                setTimerEndsAt(Date.now() + 15000);
              }}
              onSkip={() => {
                setSecondsLeft(0);
                setIsComplete(true);
                setTimerEndsAt(null);
              }}
              onReturn={() => setStep("return")}
            />
          )}

          {step === "return" && (
            <ReturnPanel
              breathCount={breathCount}
              thoughtCount={thoughtCount}
              onStartAgain={startAgain}
            />
          )}
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
        <p className="mt-1 text-sm text-stone-300">内在电影</p>
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
  onPitchDemo,
}: {
  trigger: string;
  onTriggerChange: (value: string) => void;
  onExampleClick: (value: string) => void;
  onEnter: () => void;
  onPitchDemo: () => void;
}) {
  return (
    <div className="panel-enter w-full">
      <p className="mb-4 text-sm tracking-[0.28em] text-stone-400">内在电影</p>
      <h1 className="text-5xl font-semibold leading-[0.98] text-stone-50">
        StillMind: Inner Cinema
      </h1>
      <h2 className="mt-4 text-2xl font-medium leading-tight text-stone-200">
        把脑子里的剧情，变成一场可以退出的电影。
      </h2>
      <p className="mt-4 text-base leading-7 text-stone-300">
        输入一个情绪触发，StillMind 会把它转成三幕内在电影。
      </p>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/35 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <button
          type="button"
          onClick={onPitchDemo}
          className="mb-3 flex h-12 w-full items-center justify-center rounded-full border border-amber-200/20 bg-amber-100/10 text-sm font-medium text-amber-100 transition hover:bg-amber-100/15"
        >
          一键演示
        </button>
        <textarea
          value={trigger}
          onChange={(event) => onTriggerChange(event.target.value)}
          className="min-h-36 w-full resize-none scroll-mt-24 rounded-[1.4rem] border border-white/10 bg-black/30 p-4 text-base leading-7 text-stone-100 outline-none placeholder:text-stone-500 focus:border-stone-300/60"
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
          进入内在电影
        </button>
      </div>
    </div>
  );
}

function CinemaPanel({
  cinema,
  source,
  isGenerating,
  onNext,
}: {
  cinema: Cinema;
  source: GenerationSource;
  isGenerating: boolean;
  onNext: () => void;
}) {
  const safeScenes = useMemo(
    () =>
      Array.isArray(cinema.scenes) && cinema.scenes.length > 0
        ? cinema.scenes
        : [
            { label: "镜头 01", line: "触发刚刚发生，身体还在反应。" },
            { label: "镜头 02", line: "念头升起：“我必须立刻回应。”" },
            { label: "镜头 03", line: "现在先坐到观众席，看见角色。" },
          ],
    [cinema.scenes],
  );
  const [sceneIndex, setSceneIndex] = useState(0);
  const sourceLabel =
    source === "stepfun"
      ? "StepFun 实时生成"
      : source === "fallback"
        ? "稳定样例兜底"
        : "正在准备";

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneIndex(0), 0);
    return () => window.clearTimeout(timer);
  }, [cinema.title]);

  const currentScene = safeScenes[Math.min(sceneIndex, safeScenes.length - 1)];
  const isLastScene = sceneIndex >= safeScenes.length - 1;
  const advanceScene = () => {
    if (isLastScene) {
      onNext();
      return;
    }

    setSceneIndex((index) => Math.min(index + 1, safeScenes.length - 1));
  };

  return (
    <div className="panel-enter w-full">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
          内在电影
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            source === "stepfun"
              ? "border-amber-200/25 bg-amber-100/10 text-amber-100"
              : "border-stone-100/10 bg-stone-100/8 text-stone-400"
          }`}
        >
          {isGenerating ? "生成中..." : sourceLabel}
        </span>
      </div>
      <h2 className="mt-3 text-4xl font-semibold text-stone-50">
        《{cinema.title}》
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-2 text-left">
        <MetaPill label="角色" value="主角" />
        <MetaPill label="形式" value="内在电影" />
      </div>
      {isGenerating ? (
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-[#111113]/70 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mx-auto h-2 w-28 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-100/70" />
          </div>
          <p className="mt-5 text-lg text-stone-200">正在投影你的内在电影...</p>
        </div>
      ) : (
        <>
          <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#111113]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <article
              key={`${currentScene.label}-${sceneIndex}`}
              className="min-h-52 rounded-[1.35rem] border border-stone-100/10 bg-black/25 p-6"
              style={{ animation: "sceneEnter 0.45s ease both" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {currentScene.label}
                </p>
                <p className="text-xs text-stone-500">
                  {sceneIndex + 1} / {safeScenes.length}
                </p>
              </div>
              <p className="mt-10 text-3xl font-semibold leading-tight text-stone-50">
                {currentScene.line}
              </p>
            </article>

            <div className="mt-5 rounded-[1.25rem] border border-stone-200/15 bg-stone-950/30 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100/55">
                内在噪音字幕
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cinema.innerNoise.map((line) => (
                  <span
                    key={line}
                    className="rounded-full border border-stone-100/10 bg-stone-100/8 px-3 py-1.5 text-sm text-stone-100/80"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={advanceScene}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.09] text-base font-medium text-stone-50 transition hover:bg-white/[0.14]"
          >
            {isLastScene ? "切换视角" : "下一幕"}
          </button>
        </>
      )}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.06] p-3">
      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-stone-100">{value}</p>
    </div>
  );
}

function PerspectivePanel({
  roleView,
  audienceView,
  witnessView,
  onNext,
}: {
  roleView: string;
  audienceView: string;
  witnessView: string;
  onNext: () => void;
}) {
  const cards = [
    {
      title: "角色视角",
      subtitle: "入戏位置",
      text: roleView,
      tone: "border-stone-200/15 bg-stone-950/30 shadow-stone-950/20",
    },
    {
      title: "观众视角",
      subtitle: "观看位置",
      text: audienceView,
      tone: "border-sky-200/15 bg-sky-950/20 shadow-sky-950/20",
    },
    {
      title: "见证视角",
      subtitle: "安静背景",
      text: witnessView,
      tone: "border-amber-200/20 bg-amber-950/20 shadow-amber-950/20",
    },
  ];

  return (
    <div className="panel-enter w-full">
      <p className="text-sm text-stone-400">三层视角切换</p>
      <h2 className="mt-3 text-4xl font-semibold leading-tight text-stone-50">
        不是定义你， 只是观看这段电影。
      </h2>
      <p className="mt-3 text-sm text-stone-500">
        这不是标签，只是一副临时的观看镜头。
      </p>

      <div className="mt-6 grid gap-3">
        {cards.map((card, index) => (
          <article
            key={card.title}
            className={`rounded-[1.6rem] border p-5 shadow-2xl backdrop-blur ${card.tone}`}
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
        开始观察者模式
      </button>
    </div>
  );
}

function ObserverPanel({
  secondsLeft,
  progress,
  isComplete,
  breathCount,
  thoughtCount,
  onBreath,
  onThought,
  onFastDemo,
  onSkip,
  onReturn,
}: {
  secondsLeft: number;
  progress: number;
  isComplete: boolean;
  breathCount: number;
  thoughtCount: number;
  onBreath: () => void;
  onThought: () => void;
  onFastDemo: () => void;
  onSkip: () => void;
  onReturn: () => void;
}) {
  const opacity = Math.max(0.05, 1 - progress / 90 - thoughtCount * 0.08);
  const [breathingPhase, setBreathingPhase] = useState<"吸气" | "呼气">("吸气");

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const resetTimer = window.setTimeout(() => setBreathingPhase("吸气"), 0);
    const timer = window.setInterval(() => {
      setBreathingPhase((phase) => (phase === "吸气" ? "呼气" : "吸气"));
    }, 3000);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(timer);
    };
  }, [isComplete]);

  return (
    <div className="panel-enter w-full text-center">
      <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
        观察者模式
      </p>
      <div className="mt-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.18em] text-stone-500">
          <span>噪音</span>
          <span className="h-px w-20 bg-gradient-to-r from-amber-300/35 to-stone-100/70" />
          <span>安静</span>
      </div>
      <div className="relative mx-auto mt-8 flex aspect-square w-full max-w-[330px] items-center justify-center">
        <div className="absolute inset-8 rounded-full border border-white/10" />
        <div className="breathing-circle absolute h-44 w-44 rounded-full" />
        <div className="relative z-10">
          <p className="text-6xl font-semibold tabular-nums text-stone-50">
            {secondsLeft}
          </p>
          <p className="mt-2 text-sm text-stone-500">秒</p>
          {!isComplete && (
            <p className="mt-3 text-sm tracking-[0.3em] text-stone-400">
              {breathingPhase}
            </p>
          )}
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
          className="h-full rounded-full bg-gradient-to-r from-amber-300/80 via-stone-100 to-amber-100 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mx-auto mt-6 max-w-sm text-xl leading-8 text-stone-100">
        看见角色，看见念头，不再进入这部电影。
      </p>
      <p className="mt-3 text-sm leading-6 text-stone-500">
        看见念头升起、停留、落下。不解释，不证明，不追随。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBreath}
          className="rounded-[1.25rem] border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-left transition hover:bg-amber-100/15"
        >
          <span className="block text-xs text-amber-100/60">呼气计数</span>
          <span className="mt-1 block text-2xl font-semibold text-stone-50">
            {breathCount}
          </span>
        </button>
        <button
          type="button"
          onClick={onThought}
          className="rounded-[1.25rem] border border-stone-100/15 bg-stone-100/8 px-4 py-3 text-left transition hover:bg-stone-100/12"
        >
          <span className="block text-xs text-stone-400">念头经过</span>
          <span className="mt-1 block text-2xl font-semibold text-stone-50">
            {thoughtCount}
          </span>
        </button>
      </div>

      {isComplete ? (
        <button
          type="button"
          onClick={onReturn}
          className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-stone-100 text-base font-medium text-[#111113] transition hover:bg-white"
        >
          回归
        </button>
      ) : (
        <div className="mt-7 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={onFastDemo}
            className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-stone-200 transition hover:bg-white/[0.12]"
          >
            快速演示
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-stone-500 underline underline-offset-4 transition hover:text-stone-200"
          >
            跳到回归
          </button>
        </div>
      )}
    </div>
  );
}

function ReturnPanel({
  breathCount,
  thoughtCount,
  onStartAgain,
}: {
  breathCount: number;
  thoughtCount: number;
  onStartAgain: () => void;
}) {
  const [selectedAction, setSelectedAction] = useState(0);
  const actions = [
    "喝水 + 走路 3 分钟",
    "回到当前任务 25 分钟",
    "先不回复，今天稍后再决定",
  ];

  return (
    <div className="panel-enter w-full">
      <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
        回归
      </p>
      <h2 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">
        情绪没有被抹掉。你只是回到了观众席。
      </h2>
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 backdrop-blur-xl">
        <p className="text-lg leading-8 text-stone-200">
          情绪没有被抹掉。你只是从角色里退出来，重新坐回了观众席。
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.25rem] border border-amber-200/15 bg-amber-100/10 p-4">
            <p className="text-xs text-amber-100/60">本次呼吸锚定</p>
            <p className="mt-1 text-3xl font-semibold text-stone-50">
              {breathCount}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-stone-100/15 bg-stone-100/8 p-4">
            <p className="text-xs text-stone-400">看见念头经过</p>
            <p className="mt-1 text-3xl font-semibold text-stone-50">
              {thoughtCount}
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-[1.4rem] border border-stone-200/15 bg-stone-100 p-5 text-[#111113]">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
            下一步回到现实
          </p>
          <div className="mt-4 grid gap-2">
            {actions.map((action, index) => (
              <button
                key={action}
                type="button"
                onClick={() => setSelectedAction(index)}
                className={`rounded-full border px-4 py-3 text-left text-sm font-medium transition ${
                  selectedAction === index
                    ? "border-[#111113] bg-[#111113] text-stone-100"
                    : "border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-500"
                }`}
              >
                {action}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            你刚刚从角色视角退回了观众位。
          </p>
        </div>
        <p className="mt-6 text-base leading-7 text-stone-300">
          StillMind 不告诉你“你是谁”。它只帮助你看见：此刻有什么正在经过你。
        </p>
      </div>

      <button
        type="button"
        onClick={onStartAgain}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.09] text-base font-medium text-stone-50 transition hover:bg-white/[0.14]"
      >
        再来一次
      </button>
    </div>
  );
}
