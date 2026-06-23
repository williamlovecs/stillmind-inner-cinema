export const METHOD_IDS = [
  "inner-cinema",
  "paced-breath",
  "thought-watching",
  "wide-gaze",
  "body-scan",
  "person-shift",
  "logout-pause",
  "release",
  "open-awareness",
  "grounded-action",
  "trigger-journal",
  "anchors",
] as const;

export type MethodId = (typeof METHOD_IDS)[number];
export type StateMode = "looping" | "tense" | "impulsive" | "numb" | "hurt" | "curious";
export type DesiredOutcome = "pause" | "settle" | "distance" | "release" | "choose" | "awareness";
export type DurationMinutes = 1 | 3 | 5 | 10;
export type EvidenceTier = "supported" | "informed" | "experimental";
export type PracticeFamily = "distance" | "settle" | "observe" | "release" | "return" | "reflect";
export type SessionResult = "better" | "same" | "worse" | "stopped";

export type SafetyInput = {
  immediateDanger?: boolean;
  medicalEmergency?: boolean;
  cannotStaySafe?: boolean;
  seekingDiagnosis?: boolean;
};

export type SafetyDecision = {
  allowed: true;
  reason: "clear";
  action: "continue";
} | {
  allowed: false;
  reason: "immediate-danger" | "medical-emergency" | "cannot-stay-safe" | "diagnosis-request";
  action: "external-support" | "medical-help" | "boundary-message";
};

export type MethodDefinition = {
  id: MethodId;
  title: string;
  subtitle: string;
  family: PracticeFamily;
  summary: string;
  durations: readonly DurationMinutes[];
  modes: readonly StateMode[];
  outcomes: readonly DesiredOutcome[];
  evidenceTier: EvidenceTier;
  eyesOpen: boolean;
  bodyFocus: boolean;
  breathChange: boolean;
  acuteEligible: boolean;
  premium: boolean;
};

export type MethodHistory = Partial<Record<MethodId, {
  favorite?: boolean;
  completedCount?: number;
  betterCount?: number;
  worseOrStoppedCount?: number;
}>>;

export type RoutingInput = {
  activation: 1 | 2 | 3 | 4 | 5;
  mode: StateMode;
  duration: DurationMinutes;
  outcome: DesiredOutcome;
  eyesOpenPreferred?: boolean;
  bodyFocusAllowed?: boolean;
  breathChangeAllowed?: boolean;
  hiddenMethodIds?: readonly MethodId[];
  history?: MethodHistory;
  safety?: SafetyInput;
};

export type Recommendation = {
  kind: "practice";
  primary: MethodDefinition;
  alternatives: MethodDefinition[];
  explanation: string;
  reasonCodes: string[];
} | {
  kind: "support";
  safety: SafetyDecision;
  explanation: string;
};

export type PracticeSession = {
  id: string;
  schemaVersion: 1;
  startedAt: string;
  completedAt?: string;
  status: "completed" | "stopped" | "abandoned";
  mode: StateMode;
  context?: "work" | "relationship" | "family" | "self" | "waiting" | "other";
  methodId: MethodId;
  durationSeconds: number;
  activationBefore?: 1 | 2 | 3 | 4 | 5;
  activationAfter?: 1 | 2 | 3 | 4 | 5;
  result?: SessionResult;
  groundedActionId?: string;
  rawTrigger?: string;
  privateNote?: string;
  contentVersion: string;
};

export type WeeklyReview = {
  start: string;
  end: string;
  sessions: number;
  completed: number;
  results: Record<SessionResult, number>;
  methodCounts: Partial<Record<MethodId, number>>;
  modeCounts: Partial<Record<StateMode, number>>;
  averageActivationChange?: number;
};
