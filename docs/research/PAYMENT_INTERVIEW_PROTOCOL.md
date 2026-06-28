# StillMind Payment Interview Protocol

Purpose: decide whether StillMind should introduce a paid offer, and which offer shape earns trust, before StoreKit or subscription work expands.

This is not a sales script. It is a validation protocol for willingness to pay after a user has experienced a useful reset.

## Target Sample

Minimum before paid launch: 5 qualified interviews.
Preferred before StoreKit subscription: 8-10 qualified interviews plus one lightweight price-choice survey.

Qualified means the person has completed at least one reset and can describe a concrete moment where StillMind created more choice before acting.

Recruit from:

- Seed users who completed the core flow.
- Users who returned within seven days.
- Founder community members who understand the product but have not been coached on the answer.
- Mindfulness-adjacent users who currently pay for apps, courses, coaching, or communities.

Do not recruit people currently in crisis. Do not collect medical history, diagnosis details, raw trigger text, private names, or contact details in the CSV.

## Offer Cards To Show

Show the offer as plain text. Do not imply it is already built.

### Offer A: StillMind Plus

Full method library, adaptive local routing, deeper weekly review, optional AI Inner Cinema, and private pattern views.

Price range to test: CNY 28-48 monthly or CNY 198-298 annual.

### Offer B: 21-Day Reset Path

A structured 21-day guided path for overthinking, conflict, proving, or replaying. No diagnosis, no therapy claim.

Price range to test: CNY 49-99 one-time.

### Offer C: Founder-Led Cohort

Small guided cohort around observer mode, grounded action, and weekly reflection. Not treatment, not clinical care.

Price range to test: CNY 299-699 one-time.

## Interview Flow

1. Ask what happened before they opened StillMind.
2. Ask what changed after the reset, using their words.
3. Ask what they would replace StillMind with today.
4. Show the three offer cards.
5. Ask which offer they would choose, if any.
6. Ask what price feels fair, expensive-but-possible, and too expensive.
7. Ask whether they would attempt purchase today if the offer existed.
8. Ask what would stop them: trust, privacy, unclear value, price, spiritual language, App Store credibility, or preference for human guidance.
9. Confirm they understand this is general wellness/self-observation, not therapy or crisis support.
10. Ask permission for a non-sensitive quote, paraphrased if needed.

## CSV Rules

Use `docs/research/payment_interview_results_template.csv` as the template.

Allowed:

- Segment, surface, offer choice, price reaction, purchase-intent score.
- Short non-sensitive quote with no names or private incident details.
- Objection category.

Not allowed:

- Raw trigger text.
- Names, phone numbers, email addresses, WeChat IDs.
- Medical history, diagnoses, trauma details, crisis details.
- Payment card details or screenshots.

## Go / No-Go Rules

Run:

```powershell
npm run analyze:payment-interviews -- path\to\payment_interview_results.csv
```

Go to paid-offer experiment only when:

- At least 5 qualified interviews exist.
- At least 3 users give purchase intent score 4 or 5.
- At least 2 users say they would attempt purchase today.
- No user expects therapy/crisis support from the paid offer.
- Fewer than 2 users raise unresolved privacy/trust concerns.

No-go / fix positioning when:

- Fewer than 5 qualified interviews exist.
- High intent is below 3 users.
- Purchase attempt signal is below 2 users.
- Main objections cluster around unclear value or too much spiritual abstraction.

No-go / fix safety and trust when:

- Any user expects the paid offer to act as therapy, diagnosis, treatment, or crisis support.
- Two or more users raise privacy or trust concerns.

## Output Decision Labels

The analyzer returns one of:

- `GO_TEST_PAID_OFFER`
- `NO_GO_FIX_OFFER_OR_POSITIONING`
- `NO_GO_FIX_SAFETY_OR_TRUST`
- `INSUFFICIENT_PAYMENT_DATA`

A `GO_TEST_PAID_OFFER` decision means you can test a paid offer. It does not mean you should turn on subscription until StoreKit, restore purchase, refund language, privacy copy, and App Store review notes are all correct.
