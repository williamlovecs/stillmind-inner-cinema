<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## StillMind: start here (handoff updated 2026-09-07)

Read in order:
1. `docs/engineering/CODEX_HANDOFF.md`
2. `.planning/stillmind-complete-product/CURRENT_STATE.md`
3. `docs/product/MODULES_AND_COMBINATIONS.md`
4. `docs/product/UX_INTERACTION_REVIEW_2026-09-06.md`
5. `docs/engineering/HANDOFF_SYNC_2026-09-07.md`

Continue `fix/native-integrity-deps-20260906` / Draft PR #3, targeting main. Runtime baseline: `0ba5edf7d46a113762c56e8137725d5241e7659b`, CI `33988224046`. This handoff update changes documentation only. Check the actual current head and latest CI; never present a historical green run as a new run.

The founder's project has A (StillMind practice / historical App1), B (reflection tool / historical App2), and C (source-based knowledge layer). These are composable product modules, not three proven shipping apps. Existing in-app Reflection is not proof that B's document-upload workflow is built. Metadata/source notes are not proof of a complete, authorized C retrieval service. Turning C off does not prove existing scripts are independent or cleared for release.

Engineering repairs are implemented; UX01–UX09 remain a reviewed backlog, not implemented fixes. Preserve the authentic self-observation/contemplative direction; a one-minute entry is not the entire product. Do not disguise it, promise outcomes, or add rankings of people.

Protect the user's work: inspect git status/worktrees first; no reset --hard, automatic stash, forced push, blind ZIP overwrite, automatic merge/deploy, or audit fix --force. Keep existing methods, IDs, routes, data, tested safety/consent/timing/neutral-outcome semantics. A focused UX repair is allowed as the next task, not a wholesale redesign or simultaneous build of B/C.

Use `npm run test`, `npm run verify:release`, `npm run smoke:web`, `npm run smoke:native`, and `npm audit`; browser tests require Node22/Chrome. Report skipped/blocked checks explicitly. No paid provider call, source upload, account change, participant outreach, signing or publication without the relevant approval.

Do not commit private conversations, permission evidence, source books, participant data, credentials or fonts. Keep original papers/assets outside public source until reviewed. Legacy .planning completion percentages are historical implementation notes, not authorization, UX validation or commercial evidence.
