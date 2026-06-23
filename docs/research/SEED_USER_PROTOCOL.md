# StillMind Seed-User Validation Protocol

Purpose: prove whether first-time users can understand and complete StillMind's core reset loop, and whether it creates more choice before acting. This is product validation, not clinical research.

## Scope

Target sample: 15 first-time users before public App Store launch.

Recruiting mix:

- 5 founder/community users who already understand self-observation language.
- 5 product/design/knowledge-work peers who face work or relationship triggers.
- 3 mindfulness/journaling-adjacent users who are not spiritual-community insiders.
- 2 skeptics who dislike meditation apps or AI companion products.

Do not recruit anyone currently seeking emergency support, crisis help, or clinical care from StillMind. If that appears during recruitment, stop the study and direct them to real-world support.

## Privacy Boundary

Do not collect raw trigger text in notes, recordings, spreadsheets, analytics, issue reports, or screenshots.

Allowed notes:

- broad scenario category, such as work conflict, message anxiety, overthinking, family tension;
- completion status;
- selected mode, duration, method, and grounded action;
- user's own non-sensitive summary of clarity, confusion, or discomfort.

Not allowed:

- names of other people involved in the trigger;
- screenshots containing private text;
- medical history or diagnoses;
- self-harm, harm-to-others, or crisis details;
- contact information in public feedback channels.

If the user wants to share sensitive context, ask them to generalize it into one of the broad categories above.

## Test Setup

Run each session on an installable app build when possible. If TestFlight is not ready, use the current web/mobile preview and mark the session as "prototype surface."

Before the session:

1. Confirm the user understands this is a general-wellness product test, not care or advice.
2. Ask them not to type private details; a generic trigger is enough.
3. Explain they can stop at any moment.
4. Ask permission to take non-sensitive notes about flow, confusion, and completion.

Opening script:

> I am testing whether StillMind helps a person pause before reacting. Please use a generic version of a real-ish moment, without private names or details. This is not therapy, advice, or crisis support. I am watching the product flow, not judging your experience.

## Core Task

Ask the user to complete one reset:

1. Open StillMind.
2. Pick a current state and duration.
3. Read the recommendation.
4. Start the practice.
5. Pause once, then continue.
6. Finish or stop honestly.
7. Complete the after-check.
8. Pick a grounded action.
9. Open Reflection.
10. Open Profile and find export/delete/support.

Do not guide unless the user is blocked for more than 20 seconds. If you help, record the help.

## Observation Checklist

Record one row per user.

| Field | Values / notes |
| --- | --- |
| Session ID | `S01` to `S15`; no names |
| Surface | TestFlight, local native, Expo preview, web |
| Scenario category | work, relationship, family, self-pressure, message, overthinking, other |
| Completed reset | yes / no / partly |
| Needed help | none / once / multiple |
| First confusion point | screen or phrase |
| Selected method | method id or title |
| Duration | 1 / 3 / 5 / 10 minutes |
| After-check result | more choice / same / worse / stopped |
| Grounded action chosen | water-walk, current-task, reply-later, other |
| Found privacy/delete/export | yes / no / partly |
| Would use again this week | yes / maybe / no |
| Non-sensitive quote | optional, anonymized |

## User Questions

Ask after completion:

1. In one sentence, what do you think StillMind does?
2. What moment would you open it for?
3. Did it feel like it was judging, advising, comforting, or observing?
4. What felt too much, too vague, or confusing?
5. Did you feel more choice before acting, same, worse, or unsure?
6. Which method title made the most sense?
7. Which method title felt unclear or unsafe?
8. Would you use it again in the next 7 days? Why or why not?
9. Would you pay for deeper history/programs later? Do not pressure for a yes.
10. What should never be stored or sent?

## Scoring Rubric

Score each user from 1 to 5 on each dimension:

| Dimension | 1 | 3 | 5 |
| --- | --- | --- | --- |
| Comprehension | Cannot explain the product | Understands basic pause/reset idea | Explains observer/choice loop clearly |
| Completion | Abandons before practice | Completes with help | Completes without help |
| Felt agency | Same or more reactive | Mild pause | Clearer choice before acting |
| Safety comfort | Feels judged/advised/unsafe | Neutral | Feels non-judgmental and bounded |
| Return intent | Would not reuse | Maybe in some situations | Names a concrete future use |
| Trust/privacy | Worried or confused | Understands after explanation | Finds local-first/export/delete reassuring |

Primary success is not average score alone. Look for where users get stuck and whether the product earns a second use.

## Go / No-Go Thresholds

Proceed to broader TestFlight only if:

- at least 8 of 15 complete one reset;
- at least 5 of 15 report more choice before acting;
- no unresolved severe safety concern appears;
- at least 10 of 15 understand that StillMind is not therapy or crisis support;
- at least 8 of 15 can find privacy/support/delete/export without help or with one hint.

Pause growth and fix product if:

- 4 or more users stop because text is too long or confusing;
- 3 or more users interpret it as diagnosis, advice, or therapy;
- 2 or more users report feeling worse in the same method;
- any severe safety concern appears and cannot be resolved with copy/routing changes;
- users like the concept but do not know when to open the app.

## Follow-Up

Send a short follow-up 48-72 hours later:

1. Did you use StillMind again?
2. If yes, what broad situation category?
3. If no, what would have reminded you at the right time?
4. Did any part of the first session stay with you?
5. Would you recommend it to one specific person? Why?

Do not ask for private trigger details.

## Result Summary Template

After 15 users, summarize:

- completion funnel;
- three strongest use moments;
- top three confusion points;
- methods with worse/stopped signals;
- privacy/support concerns;
- second-use intent;
- exact product changes before TestFlight expansion;
- go/no-go decision and reasoning.

Store only anonymized aggregated notes.
