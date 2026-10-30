"use client";

import type { KeyboardEvent } from "react";
import { OBSERVER_LENSES } from "@stillmind/domain";
import "./observer-cinema.css";

type ObserverLens = (typeof OBSERVER_LENSES)[number];
type ObserverLensId = ObserverLens["id"];

const LENS_NAMES: Record<ObserverLensId, string> = {
  role: "角色视角",
  audience: "观众视角",
  witness: "见证视角",
};

export function InnerCinemaVisual({
  subject,
  lensId,
  compact = false,
  decorative = false,
}: {
  subject?: string;
  lensId: ObserverLensId;
  compact?: boolean;
  decorative?: boolean;
}) {
  const lens = OBSERVER_LENSES.find((item) => item.id === lensId) ?? OBSERVER_LENSES[0];
  const stage = (
    <div
      className={`observer-stage${compact ? " is-compact" : ""}`}
      data-lens={lens.id}
      data-testid={decorative ? undefined : "observer-stage"}
    >
      <div aria-hidden="true" className="observer-background" />
      <div aria-hidden="true" className="observer-proscenium"><span /><span /></div>
      <div aria-hidden="true" className="observer-floor" />
      <div aria-hidden="true" className="observer-seat-row observer-seat-row--back">
        <span /><span /><span /><span /><span />
      </div>
      <blockquote
        data-testid={decorative ? undefined : "observer-screen"}
        className="observer-screen"
        style={{ width: `${lens.width}%` }}
        tabIndex={decorative || subject === undefined ? undefined : 0}
        aria-label={decorative ? undefined : "银幕中的原句，可滚动阅读"}
      >
        {subject === undefined ? null : <p>{subject}</p>}
      </blockquote>
      <div aria-hidden="true" className="observer-seat-row observer-seat-row--front">
        <span /><span /><span />
      </div>
      <div aria-hidden="true" className="observer-seat" />
      <div aria-hidden="true" className="observer-scene-meta">
        <span>{LENS_NAMES[lens.id]}</span>
        <span>同一句话</span>
      </div>
    </div>
  );

  return decorative ? <div aria-hidden="true" className="observer-decorative">{stage}</div> : stage;
}

export function InnerCinemaScene({
  subject,
  instruction,
  lens,
  lensIndex,
  onLensChange,
}: {
  subject: string;
  instruction: string;
  lens: ObserverLens;
  lensIndex: number;
  onLensChange: (index: number) => void;
}) {
  function handleLensKeys(event: KeyboardEvent<HTMLDivElement>) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = Math.min(lensIndex + 1, OBSERVER_LENSES.length - 1);
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = Math.max(lensIndex - 1, 0);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = OBSERVER_LENSES.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    onLensChange(nextIndex);
    event.currentTarget.querySelectorAll("button")[nextIndex]?.focus();
  }

  return (
    <div className="observer-cinema" data-lens={lens.id}>
      <InnerCinemaVisual subject={subject} lensId={lens.id} />
      <div className="observer-guidance">
        <p data-testid="step-instruction" className="observer-instruction">{instruction}</p>
        <p aria-live="polite" className="observer-hint">
          <span>{LENS_NAMES[lens.id]}</span>
          {lens.hint}
        </p>
      </div>
      <div className="observer-controls">
        <div className="observer-controls__label"><span>观看位置</span><span>可随时切回</span></div>
        <div className="observer-lens-buttons" role="group" aria-label="观看距离" onKeyDown={handleLensKeys}>
          {OBSERVER_LENSES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={index === lensIndex}
              onClick={() => onLensChange(index)}
              className="observer-lens-button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
