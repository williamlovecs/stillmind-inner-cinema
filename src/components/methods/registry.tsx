"use client";

import { useState, type ComponentType } from "react";
import { OBSERVER_LENSES, observationText, type MethodId } from "@stillmind/domain";
import { InnerCinemaScene } from "@/components/InnerCinemaScene";
import { BreathObservation, GazeObservation, ThoughtObservation } from "./BatchA";
import { BodyObservation, LogoutPause, PersonPerspective } from "./BatchB";
import { FocusedObservation, OpenAwareness, ReleaseBoundary } from "./BatchC";
import { PerspectiveObservation, SteadyObservation } from "./BatchD";
import type { MethodInteractionProps } from "./types";

function InnerCinema({ instruction, trigger }: MethodInteractionProps) {
  const [lensIndex, setLensIndex] = useState(0);
  return <InnerCinemaScene subject={observationText(trigger)} instruction={instruction} lens={OBSERVER_LENSES[lensIndex]} lensIndex={lensIndex} onLensChange={setLensIndex} />;
}

export const methodRenderers: Record<MethodId, ComponentType<MethodInteractionProps>> = {
  "paced-breath": BreathObservation,
  "thought-watching": ThoughtObservation,
  "wide-gaze": GazeObservation,
  "body-scan": BodyObservation,
  "person-shift": PersonPerspective,
  "logout-pause": LogoutPause,
  release: ReleaseBoundary,
  "open-awareness": OpenAwareness,
  "grounded-action": FocusedObservation,
  "trigger-journal": SteadyObservation,
  anchors: PerspectiveObservation,
  "inner-cinema": InnerCinema,
};
