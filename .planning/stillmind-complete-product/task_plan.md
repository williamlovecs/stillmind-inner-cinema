# StillMind Complete Product Plan

## Goal

Build the complete ideal StillMind product: a coherent, non-clinical system of practices for stepping out of ego-driven narratives, delivered as a production-grade iOS app with supporting backend, GTM system, safety boundaries, testing, and App Store submission materials.

## Product Principle

The public product is a practical state-shift tool. The deeper framework may draw from witnessing, self-distancing, contemplative practice, and the user's source material, but must not diagnose, promise awakening, claim treatment, or turn source language into unsupported fact.

## Phases

| Phase | Status | Exit criteria |
| --- | --- | --- |
| 0. Recovery and source inventory | complete | Canonical repo confirmed; source files and prior materials indexed |
| 1. Source knowledge base | complete | PDFs and prior 古零 material summarized into concepts, practices, claims, risks, and citations |
| 2. Market and positioning | complete | Current competitors, ICP, wedge, pricing hypotheses, and validation risks documented |
| 3. Method system design | complete | Practice taxonomy, selection logic, contraindications, copy boundaries, and progression model defined |
| 4. Product and technical architecture | complete | Mobile/backend/data architecture, schemas, ADRs, threat model, and migration path documented |
| 5. iOS mobile implementation | complete | Expo app implements shell, 12-method library, timed sessions, history, review, settings, reminder, privacy, and offline fallback |
| 6. Backend and infrastructure | in_progress | Production AI API and fallback are hardened; production analytics/observability decision remains |
| 7. Commercial and GTM system | in_progress | Business, KPI, pricing, onboarding, retention, and validation plans exist; live cohorts and payment evidence remain external |
| 8. Safety, privacy, and compliance | complete | Claim boundaries, local-first controls, crisis routing, risk register, and App Store privacy draft exist; legal review is external |
| 9. Adversarial QA and hardening | in_progress | 33 automated tests, lint, typecheck, Doctor, bundles, builds, and HTTP smoke pass; real-device accessibility/background QA remains |
| 10. Distribution and App Store handoff | in_progress | EAS config, icon, metadata, runbook, and human gates exist; signed EAS/TestFlight build requires account login |

## In Scope

- Inner Cinema plus multiple ego-noise reduction practices.
- Personalized recommendation without personality labels or diagnosis.
- Session history, patterns, weekly review, practice progression, and reminders.
- Offline deterministic practice paths; AI is optional enhancement.
- Expo React Native iOS app and reusable TypeScript domain packages.
- Vercel-hosted API and web support/legal surfaces.
- Seed GTM, pricing hypotheses, analytics events, feedback and support operations.

## Out of Scope Until Validated

- Clinical diagnosis or treatment.
- Claims of guaranteed awakening, trauma healing, or medical outcomes.
- Open social feed, unmoderated community, therapist marketplace, or high-risk peer counseling.
- Cloud storage of raw trigger text by default.

## Human / External Gates

- Apple Developer enrollment, agreements, tax/banking, certificates, and final App Store submission approval.
- A real support email and legal entity/individual publisher decision.
- Reviewed StepFun retention/training/data-region terms.
- Real user interviews, pricing interviews, and professional legal/clinical review.
- Final brand/IP decision for source-derived terminology.

## Quality Gates

- No secret committed to git or shipped to mobile.
- All core exercises work offline with deterministic content.
- AI failures never block a session.
- Raw user trigger text is not persisted remotely by default.
- No empty states, broken flows, inaccessible controls, or misleading safety claims.
- Every market or spiritual claim is marked as sourced fact, inference, belief, or validation hypothesis.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| Web search backend returned 403 in prior GTM work | 1 | Use official-site direct reads and retry public search later |
| Windows did not expand the test glob | 1 | Use explicit test entrypoints; 17 tests now run cross-platform |
| Expo Doctor found duplicate React 19.2.3/19.2.4 | 1 | Unified monorepo on 19.2.3; Doctor now passes 21/21 |
| In-app browser policy blocked localhost:4175 | 1 | Did not bypass; verified production bundles and HTTP server separately; real-device/browser visual QA remains explicit |
| EAS CLI is not authenticated | 1 | Isolated as an external credential gate; EAS profiles and release runbook are ready |
