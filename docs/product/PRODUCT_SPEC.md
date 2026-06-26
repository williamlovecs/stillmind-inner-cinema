# StillMind Complete Product Specification

## Product Promise

When an inner story takes over, StillMind helps the user notice it, step out of the role, choose a suitable practice, and return to life with more agency.

## Primary Audience

The initial audience is adults who are generally functional but become caught in overthinking, interpersonal triggers, self-proving, comparison, or impulsive replies. They are open to mindfulness or self-observation but do not want a therapy chatbot, a spiritual identity test, or a large meditation library.

## Jobs To Be Done

1. "I am triggered right now; help me avoid making the next minute worse."
2. "Help me see this thought without turning it into who I am."
3. "Give me the smallest practice that fits my state and available time."
4. "Help me learn what repeatedly pulls me in and what actually helps."
5. "Let me deepen observation practice without being ranked or diagnosed."

## Information Architecture

### Today

- Immediate "What is pulling you in?" entry.
- State shortcut: looping, tense, impulsive, numb, hurt, or curious.
- One recommended practice with a transparent reason.
- Continue a recent practice or open favorites.

### Reset

- Trigger input is optional; a user can choose a state without writing personal text.
- Two-question quick route: current mode and available time.
- Recommended method plus two alternatives.
- Session player with pause, stop, accessibility alternative, and haptic rhythm where appropriate.
- Before/after check and grounded action.
- If a method feels worse or is stopped, the user can immediately reduce that method in future recommendations without losing manual access in the method library.

### Practices

- Twelve method families grouped as Distance, Settle, Observe, Release, and Return.
- Short practice paths for common moments such as "pause before replying," "exit the inner movie," "observer foundation," and "gentle release," with local progress based only on completed non-worse sessions.
- Search and filters for time, eyes-open, no-audio, body-neutral, and saved.
- Method detail: what it is, when it may fit, when to skip, evidence note, and duration variants.
- Guided and silent variants; all core text sessions work offline.

### Reflection

- Private session timeline.
- Weekly review of contexts, methods, completion, and self-reported change.
- Language is descriptive: "meetings appeared 3 times" rather than "you are a conflict type."
- User can edit or delete individual sessions and export or erase all local data.

### Me

- Preferences: eyes open, sound, haptics, duration, reminders, sensitive methods to hide.
- Privacy center, data export/delete, AI settings, legal pages, support, and crisis boundary.
- Subscription and restore-purchases surface when monetization is enabled.

## Onboarding

1. Product boundary: non-clinical state-shift tool; not emergency or medical support.
2. Privacy choice: local-only by default; AI enhancement opt-in explained before any text is sent.
3. Comfort preferences: eyes-open, body attention, sound, haptics.
4. Choose one common moment: conflict, overthinking, comparison, waiting for a reply, or "skip."
5. Run a 60-second sample and ask whether it felt better, the same, worse, or was stopped.

No login is required for first value. Optional account/cloud sync is deferred until local retention and willingness to pay are validated.

## Session State Machine

`entry -> safety gate -> quick route -> recommendation -> practice -> after-check -> grounded action -> saved locally -> optional reflection`

The user can exit at every state. Exiting is recorded only as a local session outcome if the user permits history.

## Personalization

- Deterministic rules select an eligible set.
- A local preference score ranks eligible methods using explicit favorites, completions, and self-reported results.
- Negative self-reports never become an identity label; they only lower future ranking and can prompt an explicit "reduce recommendation" control.
- AI may generate an Inner Cinema scene or weekly narrative only after opt-in, with deterministic fallback.
- AI never decides safety eligibility, diagnosis, or identity-level interpretation.

## Weekly Review

- Total sessions and completed sessions.
- Common user-selected contexts and modes.
- Methods used and proportion marked better/same/worse/stopped.
- Average activation change only when enough entries exist; no fake precision.
- One user-chosen experiment for next week, such as "pause before opening chat after meetings."
- Optional AI summary works only on minimized structured data unless the user explicitly includes notes.

## Reminders

- User chooses cue, schedule, and wording.
- No default daily push before explicit consent.
- No shame, streak loss, or claims that missing practice is failure.
- Smart reminders are local in v1: time and user-defined context only, not passive surveillance.

## Community Handoff

Community is not an open feed in the initial app. A later moderated layer may offer scheduled group practices, facilitator-authored prompts, anonymous aggregate learning, and a clear separation between peer sharing and professional support.

No direct crisis counseling, unmoderated advice, spiritual ranking, or public raw-trigger posts.

## Monetization Hypothesis

### Free

- Immediate reset flow.
- Inner Cinema preset mode.
- Four core practices and short variants.
- Seven days of local history.

### StillMind Plus

- Full twelve-method library and longer variants.
- Adaptive routing and favorites.
- Unlimited local history and weekly review.
- Custom anchors/reminders, offline packs, and optional AI cinema.
- Introductory hypothesis: monthly and annual subscription with a meaningful annual discount; price must be tested before implementation.

### Later

- Facilitated programs and private cohorts.
- Carefully scoped employer wellness offering without exposing individual trigger data.
- No sale of personal emotional data and no ad-supported model.

## North-Star and Guardrail Metrics

- North star: completed resets followed by user-reported "more choice before acting."
- Activation: first completed session within onboarding day.
- Retention: second useful session within 7 days and weekly review opened after 3+ sessions.
- Quality: better/same/worse/stopped distribution by method and state.
- Safety guardrails: adverse/worse rate, forced exits, support-link use, AI fallback rate, and privacy opt-out rate.
- Business: free-to-trial, trial-to-paid, month-2 paid retention, refund rate.

Raw trigger text, generated narratives, and private notes are excluded from analytics.

## Release Slices

### Slice A: Native Product Foundation

- Expo app shell, tabs, onboarding, local database, privacy center, method catalog, shared design tokens.

### Slice B: Complete Offline Practice System

- Deterministic router, all twelve method families, session player, haptics, after-check, grounded action.

### Slice C: Reflection and Retention

- History, weekly review, favorites, anchors, local notifications, export/delete.

### Slice D: Optional AI and Commerce

- Server-side StepFun enhancement, consent, rate limits, purchase abstraction, subscription screens.

### Slice E: Distribution Hardening

- Accessibility, offline/error behavior, security/privacy review, EAS builds, TestFlight, App Store assets and review notes.

## Definition of Done

- A user can complete every core practice offline.
- No critical flow requires an account or AI response.
- Personal text stays on device by default.
- Recommendations are explainable and manually overridable.
- Accessibility alternatives exist for breathing, visual, body, audio, and haptic practices.
- Legal and App Store disclosures match actual behavior.
- Automated tests cover routing, storage, deletion, session state, API fallback, and purchase gating.
- A real iOS build can be produced through EAS and submitted with only human credentials and final policy decisions remaining.
