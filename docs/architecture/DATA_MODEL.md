# StillMind Data Model

## Versioning

Every persisted record carries a schema version. Migrations are additive when possible and are tested against fixtures from prior versions.

## Core Records

### UserPreferences

```ts
type UserPreferences = {
  schemaVersion: 1;
  locale: "zh-CN" | "en";
  historyEnabled: boolean;
  aiEnabled: boolean;
  eyesOpenPreferred: boolean;
  bodyFocusAllowed: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  hiddenMethodIds: string[];
  favoriteMethodIds: string[];
  onboardingCompletedAt?: string;
};
```

### PracticeSession

```ts
type PracticeSession = {
  id: string;
  schemaVersion: 1;
  startedAt: string;
  completedAt?: string;
  status: "completed" | "stopped" | "abandoned";
  mode: "looping" | "tense" | "impulsive" | "numb" | "hurt" | "curious";
  context?: "work" | "relationship" | "family" | "self" | "waiting" | "other";
  methodId: string;
  durationSeconds: number;
  activationBefore?: 1 | 2 | 3 | 4 | 5;
  activationAfter?: 1 | 2 | 3 | 4 | 5;
  result?: "better" | "same" | "worse" | "stopped";
  groundedActionId?: string;
  rawTrigger?: string;
  privateNote?: string;
  contentVersion: string;
};
```

`rawTrigger` and `privateNote` are never included in analytics and are not sent to the server unless the user takes a specific, disclosed action.

### MethodPreference

```ts
type MethodPreference = {
  methodId: string;
  favorite: boolean;
  completedCount: number;
  betterCount: number;
  worseOrStoppedCount: number;
  lastUsedAt?: string;
};
```

Preference scores rank eligible methods only. They never override safety exclusions.

### Reminder

```ts
type Reminder = {
  id: string;
  enabled: boolean;
  cue: "time" | "after-meeting" | "before-chat" | "before-sleep" | "custom";
  localTime?: string;
  weekdays?: number[];
  copy: string;
  notificationId?: string;
};
```

### WeeklyReview

Weekly reviews are derived from sessions and can be recomputed. Cached reviews contain aggregate counts and the user's chosen next experiment, never an inferred identity label.

## Analytics Allowlist

Allowed fields:

- app version, platform, locale;
- screen and event name;
- method id and duration bucket;
- coarse selected mode/context;
- completed/stopped and better/same/worse;
- AI requested/succeeded/fell back;
- subscription lifecycle event.

Forbidden fields:

- raw trigger text;
- generated scene text;
- private notes;
- contact identifiers without explicit account consent;
- inferred diagnosis, trauma, attachment style, spiritual level, or ego type.

## Deletion and Export

- Delete one session from its detail screen.
- Delete all local content from Privacy Center, requiring explicit confirmation.
- Export a human-readable JSON file locally and invoke the native share sheet.
- If cloud sync is introduced, the same controls must propagate deletion and produce a remote export.
