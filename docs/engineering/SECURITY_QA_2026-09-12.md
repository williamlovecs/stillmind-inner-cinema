# Security and interaction QA - 2026-09-12

Scope: current local StillMind A web/native application, shared domain/content, two public APIs, dependency tree, CI gates and synthetic browser flows. B/C assets, remote production configuration and historical secrets are not exhaustively audited. No private material was uploaded, no provider key used, no public endpoint attacked, no account or deployment changed.

## Findings and repairs

| ID | Severity | Evidence and impact | Local repair |
| --- | --- | --- | --- |
| S01 | Critical | Baseline package.json/lockfile: Next 16.2.12 matches GHSA-p293-qw3h-jr36 and GHSA-2xp9-vwfh-vxw4. Windows-hosted servers are affected by the first advisory; image optimization conditions matter for the second. | Next + eslint-config-next 16.3.3. No exploit attempted. |
| S02 | High | Baseline sharp override 0.35.3 matches GHSA-rgj7-g3m4-5g8c (libheif). | Override and lockfile upgraded to 0.35.4. |
| S03 | Medium | Baseline events/route.ts allowed wildcard browser CORS; both APIs parsed simple cross-site bodies. This enables browser-assisted quota use/event pollution, not theft of an authenticated cookie session. | request-policy.ts: exact same-origin or configured allowlist; reject opaque/foreign origins and non-JSON media type. Native requests without Origin remain supported. |
| S04 | Medium | server-limits.ts: forwarded address is client-controlled unless a trusted edge overwrites it. Per-address limits alone permit rotation. | cinema/route.ts:83 adds 30 paid calls/minute per instance; events/route.ts:8 adds 120 sink calls/minute. Existing bounded maps retained. Not a distributed budget or authentication system. |
| S05 | Medium | Baseline cinema/route.ts truncated at 500 characters before the safety check, ignoring high-risk text later in the bounded request. | Full bounded trigger checked first; oversize trigger rejected, not silently reinterpreted. Regression uses synthetic text and zero provider I/O. |
| S06 | Low / defense in depth | Baseline next.config.ts had no app-level security headers. Edge production headers were not verified. | next.config.ts:5-13: anti-framing, nosniff, no-referrer, restricted camera/location/microphone policy and limited CSP. No claim of a full script-src XSS policy. |
| S07 | Medium | Baseline CI captured npm audit but always succeeded even with critical findings. | CI now fails on high/critical advisories or registry failure; preserves JSON evidence. Remote CI not run until push/PR. |
| S08 | UX/privacy | Home speech callbacks lacked instance identity checks; late stopped callbacks could overwrite current input, and backgrounding did not stop listening. | page.tsx:39-75: invalidate old instance, stop on background/collapse/unmount and ignore stale callbacks. Speech tested with a local substitute, not microphone/cloud. |

Sources: [Next Windows advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36), [Next image advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), [sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c), live npm audit and Expo Doctor. Local framework headers documentation was read before implementation.

## Interaction repairs

- UX05: removed press-driven stability simulation and arbitrary score. Default is a static, low-stimulus observation object; switching to a real-world object changes the guide and is reversible. This is a safer adaptation, not a recreation/validation of the source optical-illusion exercise.
- UX07: no automatic awareness checkmarks. Only voluntary marks, removable and never inferred as an outcome. Contact choice in release now actually switches event-focused guidance to neutral surroundings. Grounding explicitly uses a real-world object, with an optional short local label; no fake cup or camera.
- UX08: first-use boundary panel scrolls within a small viewport; no removal of safety text or consent. Existing pause/stop and missing-score semantics retained.
- UX09: scaled durations explicitly say they reuse the same guidance. Long-form authored courses are NOT implemented or validated by this change. Revised scripts use contentVersion 1.1.0; no old records rewritten.
- Expo SDK remains 57; patch alignment follows Doctor's recommended package set. React/RN major versions unchanged.
- Screenshot inspection caught a native layout regression: standalone actions reused a flex-growing segmented-control style and expanded into blank panels. Commit 622e644 gives standalone actions intrinsic height and readable text, preserving horizontal segments. Native smoke now asserts a 44-80px default action height.
- Practice previews no longer describe motion in the static stability exercise, blind pronoun replacement, achieved calm, or every duration as one minute.

## QA harness integrity

A final Web rerun received a conflicting response header before the spawned server logged readiness. It failed rather than being accepted. Commit 2a1a2a6 now checks that the port is available, binds loopback and waits for the owned child to report readiness. Rerun on port 3137 confirmed the current app's headers and all 18 main plus 8 adversarial groups. The prior mismatch does not establish a production-header defect; it exposed an unreliable test-server identity assumption.

## Configuration and remaining risks

`STILLMIND_ALLOWED_ORIGINS` is an optional comma-separated list of exact browser origins for separately hosted Expo Web. Do not use wildcards. Native apps without Origin do not need this setting. Origin validation is not authentication: direct clients can forge/omit it. Before enabling a public paid provider, enforce a trusted reverse proxy, distributed edge limits and a provider-side monetary cap. The application does not implement these hosting controls.

No raw HTML/eval/command execution sinks were found in the scanned src/mobile/src/packages TypeScript application code. Only .env.example was tracked among checked env/private-key file patterns. These are scoped checks, not a forensic audit of all historical commits or a guarantee of no vulnerabilities. Local storage is not an encrypted vault. Strict script-src CSP, device privacy, upstream real usage and production headers remain separate checks.

## Verification

Initial audit: 1 critical + 1 high package finding. After patched install and Expo alignment: npm audit exit 0, zero advisories. First release attempt stopped at Expo Doctor 20/21; 14 compatible patch mismatches were addressed rather than excluded. Final release/browser results are recorded in the workspace closeout after execution. No historical green run is substituted.

Full verify:release passed at 9e4d02f: 127 tests, type/lint/claims, Next build, readiness guards, Doctor 21/21 and iOS/Expo Web export. Web-only preview changes at 680d98f passed verify again. Final Web screenshots/results identify 2a1a2a6, whose application Web code is identical to 680d98f: 18 main and 8 adversarial groups passed with no uncaught browser errors. Subsequent native-only 622e644 passed mobile type/lint, both exports and 9 native smoke groups, including the action-height regression. Final live npm audit returned exit 0 / zero advisories after the sandbox-only network denial was retried with approved network access. No signed iOS binary, physical device, live provider or remote deployment is certified.
