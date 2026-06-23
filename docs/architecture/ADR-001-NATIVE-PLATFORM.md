# ADR-001: Native Platform and Local-First Architecture

## Status

Accepted on 2026-06-20.

## Decision

Keep the existing Next.js application at the repository root for the public web experience, legal/support pages, and server-side APIs. Add an Expo React Native application under `mobile/` and shared pure TypeScript packages under `packages/`.

Use Expo SDK 56 and EAS Build. Expo's current official setup documentation explicitly supports ready-to-submit Apple App Store binaries and documents `eas build --platform ios`; Apple Developer membership remains a human gate.

## Repository Shape

```text
/
  src/                    Next.js web and API
  mobile/                 Expo Router native app
  packages/
    domain/               routing, practice catalog, session and review logic
    content/              localized deterministic practice content
  docs/
  .planning/
```

The root remains the Vercel project. Adding the native app must not change the root build command or production route behavior.

## Why Expo

- Cloud iOS builds can be initiated from Windows through EAS Build.
- Native haptics, local notifications, SQLite, sharing, safe-area and accessibility APIs provide utility beyond a website wrapper.
- Expo Router gives typed file-based navigation and supports development builds.
- Managed native modules reduce certificate and Xcode maintenance while preserving the option to prebuild/eject if required.

## Local-First Data

SQLite on device is the source of truth for:

- onboarding and privacy choices;
- session metadata and optional local notes;
- favorites and method preference scores;
- reminder definitions;
- weekly review aggregates.

Raw trigger text and private notes stay local by default. Analytics use event names and coarse structured attributes only. A later account/sync service requires a separate ADR, account deletion, updated privacy disclosures, encryption and migration design.

## AI Boundary

- Mobile calls the existing Vercel API over HTTPS.
- StepFun credentials exist only in Vercel environment variables.
- The user must opt in before trigger text is sent.
- The API returns a deterministic preset when the model is unavailable, slow, or invalid.
- Safety routing is deterministic and happens before model invocation.
- AI may generate or summarize; it may not diagnose, assign an identity, choose crisis handling, or produce unsupported claims.

## Domain Package

`@stillmind/domain` is UI-independent and contains:

- state and session types;
- method eligibility and deterministic recommendation;
- recommendation explanations;
- safety gate rules;
- weekly review aggregation;
- versioned storage schemas and migrations.

The web and mobile clients can consume the same rules without copying logic.

## Content Package

`@stillmind/content` contains original Chinese practice scripts and short English metadata. It separates content from execution logic so scripts can be reviewed, localized, versioned, and safety-audited without changing the player.

## Infrastructure Stages

### Stage 1: Submission-Capable Local Product

- Vercel API and legal pages.
- EAS Build/Submit.
- SQLite and local notifications.
- No account, cloud history, or remote raw-text storage.

### Stage 2: Validated Commerce

- StoreKit subscription integration behind an adapter.
- Server receipt/status service only if required by the selected billing stack.
- Entitlements cached locally with graceful offline behavior.

### Stage 3: Optional Sync

- Authentication, encrypted cloud records, export and deletion APIs.
- Only after user demand and privacy/legal review.

## Threat Model

| Risk | Control |
| --- | --- |
| Secret shipped in mobile bundle | Server-only provider key; CI secret scanning |
| Raw trigger collected unintentionally | Local-first defaults; explicit AI consent; analytics allowlist |
| Model returns diagnosis or unsafe advice | constrained schema, post-validation, deterministic fallback, copy tests |
| Generated content appears authoritative | source badge and "lens, not analysis" language |
| Lost/stolen device exposes history | OS-protected storage; optional app lock later; user delete/export controls |
| Notification reveals sensitive state | neutral notification copy and user preview |
| Spiritual ranking harms users | no consciousness scores, ego types, or identity labels |
| Deep inward practice worsens state | stop/switch controls, after-check, eyes-open alternatives, safety routing |
| Subscription blocks urgent basic use | core reset remains available without purchase |

## Distribution Requirements

- Bundle identifier placeholder: `com.stillmind.innercinema` until publisher naming is confirmed.
- EAS development, preview, and production profiles.
- App icon, splash, screenshots, privacy nutrition-label answers, review notes, support URL, and marketing metadata.
- Final production build requires Apple Developer Program access and current agreements.
- As of Apple's published 2026 requirement, submission binaries must use Xcode 26+ and iOS 26 SDK; EAS image selection must be verified at build time.

## Consequences

- There are now two user interfaces to maintain, but one shared domain model.
- The native app is not dependent on the web UI and satisfies the requirement to exceed a repackaged website.
- The first release can be meaningfully private and offline without a backend database.
- Accounts, community, and remote personalization remain deliberately gated by evidence and policy work rather than technical enthusiasm.
