# Progress Log

## 2026-06-20

- Created active goal for complete StillMind product and iOS distribution.
- Loaded planning-with-files and PDF workflows.
- Confirmed two large source PDFs (~210MB total).
- Created persistent scoped plan, findings, and progress files.
- Phase 0 in progress.
- Verified both PDFs are text-extractable: 906 pages, no OCR needed.
- Located the prior source attachment containing the original StillMind feature and GTM discussion.
- Recorded first-pass method candidates and unsafe/unverified claim categories.
- Benchmarked seven adjacent product patterns: Ebb, Wysa, How We Feel, Balance, Insight Timer, The Tapping Solution, and Daylio.
- Identified StillMind's defensible wedge as an in-the-moment trigger-to-method-to-action protocol rather than content volume or chatbot companionship.
- Added first-pass evidence support for self-distancing, third-person self-talk, body scan, cognitive defusion, open monitoring, forgiveness, and grounded-action planning.
- Phase 0 source inventory is complete; Phase 1 source knowledge modeling is in progress.

## 2026-06-22

- Completed source/evidence boundary, competitor positioning, method-system, architecture, privacy, business, market-model, KPI, GTM, App Store, and human-gate documents.
- Added an Expo SDK 56 native app with Today, Practices, Reflection, Me, Reset, and method-detail routes.
- Added shared `@stillmind/domain` and `@stillmind/content` packages.
- Implemented deterministic safety-first routing, 12 original offline method scripts, exact 1/3/5/10-minute variants, comfort exclusions, favorites, method hiding, and transparent explanations.
- Implemented local SQLite history, Web fallback storage, validation of stored records/preferences, individual/all deletion, export, weekly review, and user-selected reminders.
- Implemented optional StepFun Inner Cinema with consent, timeout, schema validation, deterministic fallback, and no dependency on AI for core use.
- Hardened the server API with request/output limits, no-store responses, bounded rate-map cleanup, prohibited diagnostic/identity output fallback, no provider-detail leakage, and high-risk 422 boundary.
- Added consistent high-risk language routing in the native Reset flow and Web entry flow.
- Added a final 1024x1024 StillMind observer-ring icon and splash configuration.
- Automated verification: 33 tests pass across routing, weekly next-step logic, content, storage validation, API, analytics, seed-user decisions, and absolute timeline boundaries; full TypeScript pass; Web and Expo lint pass; Expo Doctor 21/21; Next production build pass; iOS Hermes bundle pass; Expo Web 12-route export pass.
- Hardened accessibility and lifecycle behavior: 44pt minimum chips, Reduce Motion support, absolute practice timeline, and automatic pause when the app leaves the foreground.
- Production HTTP smoke: `/`, `/privacy`, `/terms` return 200; normal Cinema returns 3 scenes; high-risk text returns 422.
- EAS CLI check: not logged in. Signed cloud build/TestFlight remain external credential steps.

## 2026-06-23

- Added a root `verify:release` command that chains tests, typecheck, lint, Next production build, Expo Doctor, iOS bundle export, and Expo Web export.
- Added GitHub Actions CI on `main` and pull requests with Node 22.14.0 to match the EAS cloud-build runtime.
- Confirmed `npm run verify:release` passes locally; CI/export artifacts are kept out of git via `.expo-ci/`.
- Added release-readiness engineering audit for support/privacy/terms, issue templates, App Store package, Expo config, icon dimensions, mobile support links, safety boundaries, and explicit human/external gates.
- Added automated seed-user analyzer tests covering empty templates, broader-TestFlight GO, iteration NO-GO, severe safety pause, and per-method "worse" pause signals; release readiness now checks the analyzer, template, npm script, and test integration.
- Added weekly next-practice suggestions in the native Reflection tab: coarse local history now proposes one small next experiment without identity labels, and the event is tracked with privacy-safe reason buckets.
- Added a post-practice control for worse/stopped sessions that lets users reduce future recommendations for the current method while keeping it manually available in the library.
- Added Practice Paths to the native method library so the 12-method system is presented as non-labeling sequences for common moments instead of only a flat catalog.
- Added local Practice Path progress: path cards now show completed stages, the next stage to try, and respect methods the user has reduced from future recommendations.
- Added release-readiness gates for Practice Paths so the domain model, progress tests, mobile rendering, analytics allowlist, and product documentation must stay in sync before an iOS release.

## 2026-06-27

- Added an App Store metadata guard that checks Chinese App Store copy length, required metadata sections, screenshot story completeness, bundle ID/URL alignment, review notes, privacy-label draft, real-shipping-UI screenshot requirement, iOS icon dimensions, tablet setting, notification purpose string, and production API base URL.
- Wired `npm run check:app-store` into `npm run check:release-readiness` so the release gate now covers both engineering readiness and App Store submission metadata readiness.
- Confirmed `npm run verify:release` passes with the new guard: tests, typecheck, lint, public-claim guard, Next production build, release-readiness audit, App Store metadata guard, Expo Doctor, iOS export, and mobile Web export all pass locally.
- Added an EAS distribution guard that verifies `mobile/eas.json` has development, preview, production, and submit profiles; Node 22.14.0 cloud-build pins; iOS bundle identifiers; Expo Router/dev-client dependencies; and runbook/human-gate coverage for login, signed preview build, TestFlight, and App Store submission.
- Documented `npm run check:eas`, `eas-cli whoami`, and `eas-cli project:info` in the native README and App Store submission runbook so the Windows-to-cloud-iOS distribution path is explicit before preview or production builds.
