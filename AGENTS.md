<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## StillMind engineering handoff

Read `docs/engineering/CODEX_HANDOFF.md` first. Continue `fix/native-integrity-deps-20260906` / PR #3, which includes PR #1's Web repairs.
Read `NATIVE_REPAIR_2026-09-06.md` and `NATIVE_DEPENDENCY_BLOCKER.md` under docs/engineering for native/session changes, the verified SDK57 migration and scoped dependency bridge.
Preserve methods, assets and routes. Do not silently merge or deploy main, reset user work, remove failing checks, or use audit fix --force.
Keep unreported scores missing, visual parameters distinct from measurements, and stopped/worse outcomes neutral.
Run `npm run test`, `npm run verify:release`, `npm run smoke:web`, `npm run smoke:native`, and `npm audit`. Report actual SHA-bound results and untested physical-device/model/rights surfaces separately.
Do not upload private transcripts, protected source text, participants' notes, credentials or font files. GitHub Actions source-handoff artifacts provide real tracked source and hashes; do not substitute a notes-only ZIP.

Second-review code and launch operations: read `docs/engineering/ROUND2_REVIEW_2026-09-06.md`. PR #3 targets main directly. Use only the latest commit-bound CI; do not substitute prior green runs. Keep real participant rows and rights evidence outside this public repository.
