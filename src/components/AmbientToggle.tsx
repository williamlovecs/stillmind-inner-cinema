"use client";

import { useEffect, useRef, useState } from "react";

type AmbientNodes = {
  context: AudioContext;
  gain: GainNode;
  oscillators: OscillatorNode[];
};

type AmbientWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextClass() {
  const ambientWindow = window as AmbientWindow;
  return ambientWindow.AudioContext ?? ambientWindow.webkitAudioContext;
}

export function AmbientToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(false);
  const nodesRef = useRef<AmbientNodes | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setError(!Boolean(getAudioContextClass()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function stopAmbient() {
    const nodes = nodesRef.current;
    nodesRef.current = null;
    if (!nodes) return;

    const now = nodes.context.currentTime;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setTargetAtTime(0.0001, now, 0.08);
    window.setTimeout(() => {
      nodes.oscillators.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch {
          // oscillator may already be stopped
        }
      });
      void nodes.context.close();
    }, 220);
  }

  async function startAmbient() {
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) {
      throw new Error("AudioContext unavailable");
    }

    const context = new AudioContextClass();
    await context.resume();

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.45);
    gain.connect(context.destination);

    const frequencies = [110, 146.83, 196];
    const oscillators = frequencies.map((frequency, index) => {
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const localGain = context.createGain();

      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 520 + index * 80;
      localGain.gain.value = index === 0 ? 0.34 : 0.16;

      oscillator.connect(filter);
      filter.connect(localGain);
      localGain.connect(gain);
      oscillator.start();
      return oscillator;
    });

    nodesRef.current = { context, gain, oscillators };
  }

  async function toggleAmbient() {
    setError(false);
    if (enabled) {
      setEnabled(false);
      await stopAmbient();
      return;
    }

    try {
      await startAmbient();
      setEnabled(true);
    } catch {
      setEnabled(false);
      setError(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleAmbient}
      aria-pressed={enabled}
      title={error ? "当前浏览器无法开启环境音" : "开启或关闭背景环境音"}
      className={`${
        enabled
          ? "border-violet-200/55 bg-violet-200/14 text-violet-50 shadow-[0_0_24px_rgba(168,85,247,0.18)]"
          : error
            ? "border-amber-200/35 bg-amber-200/10 text-amber-100"
            : "border-white/10 bg-white/[0.045] text-stone-300 hover:border-violet-200/35 hover:text-white"
      } rounded-full border px-3 py-2 text-xs font-medium transition ${className}`}
    >
      {enabled ? "环境音 开" : error ? "环境音不可用" : "环境音"}
    </button>
  );
}

