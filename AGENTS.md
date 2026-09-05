<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## StillMind engineering handoff

Read `docs/engineering/CODEX_HANDOFF.md` before continuing the audit-fix branch.
Read `docs/engineering/NATIVE_DEPENDENCY_BLOCKER.md` for the actual Expo Doctor and dependency-audit blockers found in CI. Do not call release verification green while these remain unresolved.
Preserve existing methods, assets and public routes. Do not silently merge or deploy main.
Keep unreported scores missing, visual parameters distinct from user measurements, and stopped/worse outcomes neutral.
Use `npm run test:audit`, `npm run verify:release`, then `npm run smoke:web`; list actual results and untested surfaces separately.
Do not upload private transcripts, protected source text, research participants' notes, or credentials.
