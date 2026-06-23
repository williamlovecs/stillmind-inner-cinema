# StillMind Privacy, Security, and Product Risk

## Data Inventory

| Data | Default location | Sent off device? | Retention |
| --- | --- | --- | --- |
| Comfort preferences | Local SQLite/AsyncStorage | No | Until user deletes app data |
| Session mode/method/result | Local SQLite | No by default | Until individual/all deletion |
| Raw trigger | Memory/local session only when user chooses history | Only with explicit AI opt-in | Local until deletion; server should not retain |
| Private note | Local SQLite | No | Until deletion |
| AI cinema request | Server function in transit | Yes after consent | No application logging/storage |
| Reminder schedule | Device notification store + local preferences | No | Until disabled/deleted |
| Analytics | Not enabled until provider/consent decision | Sanitized allowlist only | Provider policy when enabled |

## Safety Boundary

StillMind is a general-wellness, self-reflection tool. It does not diagnose, treat, monitor emergencies, or replace professional or emergency support. Medical emergency, immediate danger, inability to stay safe, and diagnosis requests route away from practices to appropriate external help or a boundary message.

Safety decisions are deterministic. AI cannot override them.

## Threat Model

| Threat | Control | Residual risk |
| --- | --- | --- |
| API key extraction | Key stays in server environment; never shipped to mobile | Server compromise/console access |
| Sensitive text in logs | No raw request logging; structured error codes only | Platform-level logs must be audited |
| Network/API failure | Offline deterministic fallback and timeout | AI experience may be generic |
| Prompt injection in trigger text | Structured schema, strict output validation, no tools/actions | Model may still produce undesirable text |
| Harmful interpretation | No diagnosis/identity labels; short scripts; report/stop path | Generated language may feel invalidating |
| Device access by another person | Local data, export/delete controls; optional future app lock | Unlocked device exposes local history |
| Analytics overcollection | Typed allowlist; no raw text | Provider configuration drift |
| Dependency vulnerability | Lockfile, audit, release review, no forced unsafe downgrades | Moderate transitive advisories remain upstream |

## AI Controls

- AI is off by default and explained before first send.
- Only the current trigger required for the requested feature is sent.
- Server validates trigger length and output schema.
- Two-to-four second client budget; fallback remains first-class.
- Generated content is labeled as a temporary lens, not truth.
- No AI-generated safety advice, clinical conclusions, or identity analysis.
- A user can disable AI and continue using every core method.

## Product-Risk Register

| Risk | Severity | Mitigation / validation |
| --- | --- | --- |
| Triggered users cannot tolerate reading | High | 60-second, eyes-open, no-text-heavy routes; observe first sessions |
| Breath/body focus worsens discomfort | High | Explicit opt-outs, alternatives, stop control, adverse-rate monitoring |
| Spiritual claims undermine trust or create harm | High | Keep source teaching separate from evidence; no ranking or metaphysical claims |
| Subscription feels exploitative in distress | Medium | Free immediate reset; sell depth/continuity, not emergency relief |
| Weekly review becomes self-judgment | Medium | Descriptive language, sample thresholds, no scores/streak shame |
| AI feels invasive or generic | Medium | Consent, minimized payload, source badge, local fallback |
| Community advice becomes unsafe | High | No open feed at launch; future moderation and facilitator boundaries |

## Dependency Audit Position

The current audit reports moderate transitive advisories in the Expo/Next toolchain and no high or critical vulnerabilities. Automated force-fixes that downgrade framework majors are not acceptable. Recheck before each release, follow upstream patches, and document any production-reachable advisory separately.

## Release Security Checklist

- [ ] No secret in Git history, mobile bundle, screenshots, or logs.
- [ ] Production environment variables exist only in server project settings.
- [ ] Privacy policy reflects actual analytics and AI behavior.
- [ ] API rate limit and payload limits tested.
- [ ] Export/delete verified on a real device.
- [ ] Network-off and AI-failure paths complete.
- [ ] App Store privacy labels match the shipping binary.
- [ ] Support and emergency-boundary links work in target countries.
- [ ] `npm run check:claims` passes on public product and App Store copy.
