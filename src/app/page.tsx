"use client";

import { useEffect, useMemo, useState } from "react";
import { getPreset, type CinemaPayload } from "@/lib/cinema-presets";
import { containsHighRiskLanguage } from "@stillmind/domain";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { HistoryList } from "@/components/HistoryList";
import {
  appendHistory,
  loadHistory,
  updateHistoryEntry,
  type DistanceAfter,
  type HistoryEntry,
} from "@/lib/history";

type Step = "home" | "cinema" | "perspective" | "observer" | "return" | "support";
type Cinema = CinemaPayload;
type GenerationSource = "preset" | "stepfun";

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

const demoTrigger = "我刚在会上和同事起了冲突，我想立刻反击证明自己没错。";
const pitchDemoTrigger = "我刚在会上和同事起了冲突，我想立刻反击证明自己没错。";
const actionOptions = [
  "喝水 + 走路 3 分钟",
  "回到当前任务 25 分钟",
  "先不回复，今天稍后再决定",
];

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
    useState<GenerationSource>("preset");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [distanceAfter, setDistanceAfter] = useState<DistanceAfter | null>(null);
  const [sessionHistoryId, setSessionHistoryId] = useState<string | null>(null);
  const [feedbackCopied, setFeedbackCopied] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 一次性从 localStorage 加载历史
    setHistory(loadHistory());
  }, []);

  // 客户端 preset：AI 没回来时 UI 永远有内容，避免闪屏
  const presetCinema = useMemo(() => getPreset(trigger), [trigger]);
  const cinema = liveCinema ?? presetCinema;
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
    let gaveUpOnLive = false;
    const timeout = window.setTimeout(() => controller.abort(), 9500);
    const presetTimer = window.setTimeout(() => {
      gaveUpOnLive = true;
      setLiveCinema(null);
      setGenerationSource("preset");
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

      if (gaveUpOnLive) {
        return;
      }

      setLiveCinema(data.cinema);
      setGenerationSource(data.source === "stepfun" ? "stepfun" : "preset");
    } catch {
      setLiveCinema(null);
      setGenerationSource("preset");
    } finally {
      window.clearTimeout(timeout);
      window.clearTimeout(presetTimer);
      setIsGenerating(false);
    }
  };

  const enterCinema = (override?: string) => {
    const input = (override ?? trigger).trim() || demoTrigger;
    setTrigger(input);
    if (containsHighRiskLanguage(input)) {
      setIsGenerating(false);
      setStep("support");
      return;
    }
    setLiveCinema(null);
    setGenerationSource("preset");
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
    setGenerationSource("preset");
    setSelectedAction(null);
    setDistanceAfter(null);
    setSessionHistoryId(null);
    setFeedbackCopied(false);
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

  const completeSession = () => {
    const updated = appendHistory({
      trigger: trigger.trim() || "(未填写触发事件)",
      cinemaTitle: cinema.title,
      breathCount,
      thoughtCount,
      selectedAction:
        selectedAction === null ? "" : (actionOptions[selectedAction] ?? ""),
      distanceAfter: distanceAfter ?? undefined,
      source: generationSource,
    });
    setHistory(updated);
    setSessionHistoryId(updated[0]?.id ?? null);
    setStep("return");
  };

  const changeSelectedAction = (index: number) => {
    setSelectedAction(index);
    setFeedbackCopied(false);
    if (sessionHistoryId) {
      setHistory(
        updateHistoryEntry(sessionHistoryId, {
          selectedAction: actionOptions[index] ?? "",
        }),
      );
    }
  };

  const changeDistanceAfter = (value: DistanceAfter) => {
    setDistanceAfter(value);
    setFeedbackCopied(false);
    if (sessionHistoryId) {
      setHistory(updateHistoryEntry(sessionHistoryId, { distanceAfter: value }));
    }
  };

  const copySessionFeedback = async () => {
    if (!distanceAfter) {
      return;
    }
    const distanceLabel =
      distanceAfter === "yes" ? "有" : distanceAfter === "some" ? "一点" : "没有";
    const actionLabel =
      selectedAction === null ? "尚未选择" : (actionOptions[selectedAction] ?? "尚未选择");
    const summary = [
      "StillMind v1 体验反馈",
      `和刚才的情绪之间多了一点距离：${distanceLabel}`,
      `呼吸锚定：${breathCount} 次；看见念头：${thoughtCount} 次`,
      `下一步行动：${actionLabel}`,
      "一句话补充：",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setFeedbackCopied(true);
    } catch {
      setFeedbackCopied(false);
    }
  };

  const startPitchDemo = () => {
    enterCinema(pitchDemoTrigger);
  };

  return (
    <>
      <DisclaimerModal />
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
                setGenerationSource("preset");
              }}
              onExampleClick={(value) => {
                setTrigger(value);
                setLiveCinema(null);
                setGenerationSource("preset");
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
              onReturn={completeSession}
            />
          )}

          {step === "return" && (
            <ReturnPanel
              breathCount={breathCount}
              thoughtCount={thoughtCount}
              selectedAction={selectedAction}
              distanceAfter={distanceAfter}
              feedbackCopied={feedbackCopied}
              onActionChange={changeSelectedAction}
              onDistanceChange={changeDistanceAfter}
              onCopyFeedback={copySessionFeedback}
              historyCount={history.length}
              onShowHistory={() => setShowHistory(true)}
              onStartAgain={startAgain}
            />
          )}

          {step === "support" && <SupportPanel onBack={startAgain} />}
        </div>
      </section>
    </main>
    {showHistory && (
      <HistoryList
        entries={history}
        onClose={() => setShowHistory(false)}
        onCleared={() => setHistory([])}
      />
    )}
    </>
  );
}

function SupportPanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="panel-enter w-full space-y-7">
      <p className="text-sm text-violet-200">先回到现实支持</p>
      <h1 className="text-4xl font-semibold leading-tight text-stone-50">
        这不是一个人扛住的时刻。
      </h1>
      <p className="text-base leading-7 text-stone-300">
        如果你有即时危险、医疗紧急情况，或无法保证自己的安全，请立即联系当地紧急服务、前往急诊，或让可信任的人陪在你身边。
      </p>
      <div className="rounded-lg border border-amber-200/20 bg-amber-100/5 p-5 text-sm leading-6 text-stone-300">
        StillMind 只提供一般性的短暂停顿与觉察提示，不提供诊断、治疗或危机处置。
      </div>
      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-full border border-violet-200/25 bg-violet-300/10 px-5 py-4 font-semibold text-violet-100"
      >
        返回首页
      </button>
    </div>
  );
}

function Header({ step }: { step: Step }) {
  const steps: Step[] = ["home", "cinema", "perspective", "observer", "return"];
  const index = steps.indexOf(step);

  return (
    <header className="flex items-center justify-between pt-2">
      <div className="flex items-center gap-3">
        <span className="brand-mark" aria-hidden="true" />
        <div>
        <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
          StillMind
        </p>
        <p className="mt-1 text-sm text-stone-300">内在电影</p>
        </div>
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
      <div className="cinema-portal mb-7 rounded-[2rem] border border-white/10 bg-black/30 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="cinema-screen rounded-[1.4rem] border border-white/10 px-5 py-8 text-center">
          <p className="text-xs tracking-[0.28em] text-stone-400">正在观影，而不是经历</p>
          <p className="mt-3 text-sm leading-6 text-stone-300">
            坐到观众席，看见屏幕里的自己。
          </p>
        </div>
        <div className="seat-row mt-4" aria-hidden="true" />
      </div>

      <p className="mb-3 text-sm tracking-[0.28em] text-stone-400">内在电影</p>
      <h1 className="text-4xl font-semibold leading-none text-stone-50">
        StillMind: Inner Cinema
      </h1>
      <h2 className="mt-4 text-2xl font-medium leading-tight text-stone-100">
        把脑子里的剧情，变成一场可以退出的电影。
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-400">
        写一句触发。进入三幕内在电影。
      </p>

      <div className="mt-6 rounded-[2rem] border border-violet-200/15 bg-[#091225]/70 p-4 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
        <button
          type="button"
          onClick={onPitchDemo}
          className="mb-3 flex h-12 w-full items-center justify-center rounded-full border border-violet-200/25 bg-violet-200/10 text-sm font-medium text-violet-100 transition hover:bg-violet-200/15"
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
          className="mt-5 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-fuchsia-300 text-base font-medium text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
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
      : source === "preset"
        ? "preset 模式"
        : "正在准备";

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneIndex(0), 0);
    return () => window.clearTimeout(timer);
  }, [cinema.title]);

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
          <div className="mt-6 rounded-[2rem] border border-violet-200/12 bg-[#081120]/82 p-4 shadow-2xl shadow-violet-950/20 backdrop-blur">
            <article
              key={`${safeScenes[sceneIndex].label}-${sceneIndex}`}
              className="projection-screen min-h-[22rem] rounded-[1.7rem] border border-violet-200/18 p-5"
              style={{ animation: "sceneEnter 0.45s ease both" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-100/65">
                  {safeScenes[sceneIndex].label}
                </p>
                <p className="text-xs text-stone-400">
                  {sceneIndex + 1} / {safeScenes.length}
                </p>
              </div>
              <div className="flex min-h-56 items-center justify-center text-center">
                <p className="max-w-xs text-3xl font-semibold leading-tight text-stone-50">
                  {safeScenes[sceneIndex].line}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {safeScenes.map((scene, index) => (
                  <button
                    key={scene.label}
                    type="button"
                    onClick={() => setSceneIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === sceneIndex
                        ? "w-9 bg-violet-200 shadow-[0_0_18px_rgba(196,181,253,0.45)]"
                        : "w-2.5 bg-white/18 hover:bg-white/35"
                    }`}
                    aria-label={`切换到${scene.label}`}
                  />
                ))}
              </div>
            </article>

            <div className="mt-4 flex flex-wrap gap-2">
              {cinema.innerNoise.map((line) => (
                <span
                  key={line}
                  className="rounded-full border border-violet-100/10 bg-violet-100/8 px-3 py-1.5 text-sm text-stone-100/65 shadow-[0_0_18px_rgba(139,92,246,0.08)]"
                >
                  {line}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={advanceScene}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-fuchsia-300 text-base font-medium text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
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
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-fuchsia-300 text-base font-medium text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
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
            <p className="breathe-text mt-3 text-base font-medium tracking-[0.25em] text-violet-100">
              {breathingPhase === "吸气" ? "吸 气" : "呼 气"}
            </p>
          )}
          {!isComplete && (
            <p className="mt-2 text-xs text-stone-500">跟着光圈，不用用力。</p>
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
          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-200 to-amber-300 transition-all duration-700"
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
          className="mt-7 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-fuchsia-300 text-base font-medium text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110"
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
  selectedAction,
  distanceAfter,
  feedbackCopied,
  onActionChange,
  onDistanceChange,
  onCopyFeedback,
  historyCount,
  onShowHistory,
  onStartAgain,
}: {
  breathCount: number;
  thoughtCount: number;
  selectedAction: number | null;
  distanceAfter: DistanceAfter | null;
  feedbackCopied: boolean;
  onActionChange: (index: number) => void;
  onDistanceChange: (value: DistanceAfter) => void;
  onCopyFeedback: () => void;
  historyCount: number;
  onShowHistory: () => void;
  onStartAgain: () => void;
}) {
  const actions = actionOptions;

  return (
    <div className="panel-enter w-full">
      <p className="text-sm uppercase tracking-[0.28em] text-stone-500">
        回归
      </p>
      <h2 className="mt-4 text-4xl font-semibold leading-tight text-stone-50">
        带着清晰，回到你的生活。
      </h2>
      <div className="mt-8 rounded-[2rem] border border-amber-100/15 bg-amber-50/[0.08] p-6 shadow-2xl shadow-amber-950/20 backdrop-blur-xl">
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
        <div className="mt-6 rounded-[1.4rem] border border-violet-200/15 bg-violet-100/[0.06] p-5">
          <p className="text-sm font-medium text-stone-100">
            现在，你和刚才的情绪之间有多一点距离吗？
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([
              ["yes", "有"],
              ["some", "一点"],
              ["no", "没有"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onDistanceChange(value)}
                className={`rounded-full border px-3 py-2.5 text-sm transition ${
                  distanceAfter === value
                    ? "border-violet-200/60 bg-violet-200/15 text-violet-50"
                    : "border-white/10 bg-white/[0.04] text-stone-400 hover:border-white/20"
                }`}
              >
                {label}
              </button>
            ))}
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
                onClick={() => onActionChange(index)}
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
          {selectedAction !== null && (
            <p className="mt-4 text-sm leading-6 text-stone-600">
              你刚刚从角色视角退回了观众位。
            </p>
          )}
        </div>
        <p className="mt-6 text-base leading-7 text-stone-300">
          StillMind 不告诉你“你是谁”。它只帮助你看见：此刻有什么正在经过你。
        </p>
      </div>

      {distanceAfter && (
        <button
          type="button"
          onClick={onCopyFeedback}
          className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-violet-200/20 bg-violet-100/[0.07] text-sm font-medium text-violet-100 transition hover:bg-violet-100/[0.12]"
        >
          {feedbackCopied ? "反馈已复制" : "复制本次反馈"}
        </button>
      )}

      <button
        type="button"
        onClick={onStartAgain}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.09] text-base font-medium text-stone-50 transition hover:bg-white/[0.14]"
      >
        再来一次
      </button>

      {historyCount > 0 && (
        <button
          type="button"
          onClick={onShowHistory}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-white/10 bg-transparent text-sm text-stone-400 transition hover:border-white/20 hover:text-stone-200"
        >
          查看内在电影院历史 · 共 {historyCount} 场
        </button>
      )}
    </div>
  );
}
