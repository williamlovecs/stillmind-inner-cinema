# StillMind Source Material Boundary

This document defines how StillMind may use founder-provided source material such as 古零/元吾氏 writings, the local `《意识强度》最新电子版` PDFs, prior StillMind notes, and Praxis knowledge-base work.

The source material can shape product hypotheses, language sensitivity, practice taxonomy, and future knowledge-grounded feedback. It is not public scientific evidence and must not be used to rank, diagnose, label, or promise outcomes for users.

## Source Inventory

Known local source files inspected on 2026-06-28:

| Source | Local evidence | Product use |
| --- | --- | --- |
| `最终版-意识强度-上q.pdf` | 502 pages, not encrypted, outline readable | Internal concept map and future knowledge-grounded feedback research |
| `最终版-意识强度-下q.pdf` | 404 pages, not encrypted, outline readable | Internal concept map and future knowledge-grounded feedback research |
| Prior StillMind/古零 notes | Attachment excerpts covering ego-noise, observer mode, emotional triggers, and "沉寂小我" | Product origin, not public claims |
| Praxis distillation artifacts | Reported structured concepts/practices/claims/corpus from the same source family | Possible v2 RAG input after demand validation |

The two PDF volumes together form a 906-page source corpus. The outline includes areas such as 心智控制区, 自主意识区, 旧有惯性区, 神经联络区, and other metaphysical/system-model sections. These names may be useful internally, but public product copy must translate them into ordinary user language: attention, reaction loops, observer perspective, practice fit, and grounded action.

## Allowed Translation

| Source idea | StillMind product translation | Release-safe language |
| --- | --- | --- |
| 小我活跃, 内在噪音, 被角色当真 | Temporary inner movie or reaction loop | "A thought/reaction is happening" |
| 沉寂小我, 观察者状态 | Create distance before acting | "Step back, watch, choose next action" |
| 情绪/行为/思维惯性 | Explicit current-state routing | "You selected looping thought / impulse / body tension" |
| 冷静处理, 灵活切换, 自我修正 | Method selection and weekly next experiment | "Try one small practice; review what helped" |
| 宏观观察, 细节觉察 | Wide gaze, orienting, factual scene description | "Notice the room and observable facts" |
| 释放, 宽恕 | Optional release of mental replay with boundaries | "Release one replay for now; boundaries remain" |
| 信息过滤, 主观预设 | Separate observation from interpretation | "This is one lens, not the truth of the event" |

## Explicit Exclusions

StillMind must not expose these source-derived ideas as user-facing conclusions:

- consciousness scores, consciousness levels, soul levels, energy-frequency rankings, or progress as spiritual rank;
- fixed ego/personality labels such as "你是羞耻型/控制型/受害者型";
- percentages that imply the app measured ego-noise, shame, awakening, or consciousness;
- claims that a practice improves consciousness strength, opens a soul core, connects to divinity, or restores soul memory;
- diagnosis, treatment, trauma processing, crisis care, or medical/clinical claims;
- assertions that the app knows the true cause, hidden motive, attachment style, karmic meaning, or metaphysical structure of a user's situation;
- source quotations or proprietary passages in product UI, App Store copy, analytics, public docs, or marketing without explicit rights review.

## Future Knowledge-Grounded Core

The desired v2 "knowledge-grounded" core is allowed only under these constraints:

1. Demand first: build it after seed users show that StillMind's existing reset loop earns repeated use.
2. Grounded, not authoritative: output may cite internal concepts as lenses, not as truth claims.
3. No raw private retention: user trigger text is minimized, never stored in analytics, and not copied into research notes.
4. No hidden diagnosis: the model must not infer ego type, consciousness score, disorder, trauma, or moral/spiritual status.
5. Bounded output: every answer must end in a reversible practice, an option to stop, and a grounded action.
6. Traceable internal corpus: source passages may support retrieval internally, but public output should paraphrase product-safe concepts.
7. Human review: any source-derived claim, program, or paywalled guidance must pass claim, privacy, and safety review before release.

## Source-to-Product Gates

Before any source-derived feature ships:

- `npm run check:claims` must pass.
- `npm run check:source-boundary` must pass.
- App Store and public copy must remain free of consciousness ranking, diagnosis, treatment, awakening guarantees, and spiritual attainment claims.
- Seed-user testing must verify that users understand StillMind as an observation/choice tool, not a diagnostic or spiritual authority.
- Any RAG or knowledge-grounded feature must preserve the same safety gate, stop controls, local-first preference, and after-check loop as the offline methods.
