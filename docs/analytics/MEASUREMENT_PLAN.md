# StillMind Measurement Plan

## North Star

**Useful resets:** completed resets followed by the user reporting more choice before acting.

This is an agency measure, not a clinical outcome. “Better” is insufficient by itself; the product must help the user pause or choose.

## KPI Tree

| Layer | Metric | Definition |
| --- | --- | --- |
| Acquisition | Qualified install | First open from an identified campaign or referral |
| Activation | First useful reset | Completed session + `better` or explicit more-choice response on day 0 |
| Core value | Useful reset rate | Useful resets / started resets |
| Retention | 7-day second useful reset | User completes another useful reset within 7 days |
| Learning | Weekly review eligible | 3+ saved sessions in a rolling 7-day period |
| Safety | Worse/stopped rate | Sessions marked worse or stopped / sessions started |
| Reliability | Offline completion | Completed sessions while AI/network unavailable |
| AI quality | AI fallback rate | AI-requested sessions completed with deterministic fallback |
| Business | Trial-to-paid | Paid starts / eligible trials |
| Business | Paid month-2 retention | Active paid users in month 2 / original paid cohort |

## Initial Targets

Targets are validation thresholds, not forecasts:

- First reset completion: >=40% of new users.
- First useful reset: >=25% of new users.
- Seven-day second useful reset: >=20% of activated users.
- Worse + stopped: <=15% overall; investigate any method >20% with at least 10 starts.
- Crash-free sessions: >=99.5% before public launch.
- Offline core completion: 100% in test matrix.
- AI fallback success: >=99% returns a usable deterministic practice.

## Privacy-Safe Event Allowlist

Allowed events contain only enumerated or coarse fields:

| Event | Allowed properties |
| --- | --- |
| `onboarding_completed` | comfort flags, skipped_sample |
| `reset_started` | mode, duration_bucket, activation_bucket, source |
| `recommendation_shown` | method_id, reason_codes, alternative_count |
| `practice_started` | method_id, duration_bucket, offline |
| `practice_ended` | method_id, status, elapsed_bucket |
| `after_check_saved` | result, activation_change_bucket, grounded_action_id |
| `weekly_review_opened` | session_count_bucket, has_average |
| `ai_requested` | feature, consent_state |
| `ai_completed` | feature, source, latency_bucket, fallback_reason |
| `data_exported` | format |
| `data_deleted` | scope |
| `safety_boundary_shown` | reason_code |

Never send:

- Raw trigger text.
- Private notes.
- Generated cinema scenes.
- Exact timestamps tied to emotional content.
- Contact identifiers without a separate account consent flow.
- Free-form safety text.

## Cohorts

- Acquisition channel.
- First selected mode.
- First recommended method.
- AI opted in vs local-only.
- Guided sample completed vs skipped.
- Repeat trigger frequency reported in research, not inferred from private text.

Do not create “personality,” “shame,” “victim,” “awakening,” or consciousness-level cohorts.

## Experiment Order

1. One-question route vs two-question route: completion and useful reset.
2. Auto recommendation vs recommendation plus alternatives: completion and override rate.
3. Grounded-action choices: immediate-action follow-through.
4. Local reminder after a user-defined cue: seven-day second use.
5. Plus packaging only after repeat use is credible.

Each experiment must specify a guardrail for worse/stopped rate and cannot weaken privacy or safety copy.

## Instrumentation Architecture

- Default first build: local event buffer disabled from upload until provider and consent are configured.
- Production provider must support EU/appropriate regional controls, deletion, and data minimization.
- Event construction lives behind one typed analytics interface.
- Debug builds can print sanitized event names; production builds do not log payloads containing personal text.
- Remote configuration may change copy or routing weights only within safety-tested bounds.

## Review Cadence

- Daily during seed test: crashes, blocked flows, worse/stopped reports.
- Use `docs/research/SEED_USER_PROTOCOL.md` for the first 15 guided sessions before interpreting any numeric funnel as product-market signal.
- Summarize the first 15 anonymized rows with `npm run analyze:seed-users -- path\to\seed_user_results.csv`.
- Weekly: funnel, cohort retention, method outcomes, AI fallback, qualitative notes.
- Monthly after launch: paid cohorts, refunds, support themes, privacy requests.
- Any safety spike pauses the affected method before growth work continues.
