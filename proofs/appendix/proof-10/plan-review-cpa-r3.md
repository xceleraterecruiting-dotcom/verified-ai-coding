# CPA payments plan r3 — cold plan-review after payment-depth lens (verbatim)

> Reviewer: fresh-context Claude subagent `a481408826477c481`, 2026-06-11, rubric with the
> expanded 12-point payment-depth lens (first exercise) and the requested adversarial
> adjudication of the plan's zero-blockers lint-GREEN state. Inputs: rubric + fixture spec + the
> nine r3 plan documents. Verbatim final output follows.

---

All documents read. Review follows.

---

# Cold plan review — CPA payments fixture, round 3 (fresh judgment)

## Q1 — Intent preservation: YES

Verbatim spec in `spec-intake.md` matches the fixture exactly. Every requirement in `requirements.md` cites the forcing spec language (R1–R16). Every place the compiler narrowed or strengthened a reading carries an interpretation note with the rejected alternative stated: e.g. reversibility — "Rejected reading: decisions reversible at any time (would require a refund subsystem the spec never mentions). Adopted reading: in-app reversal is allowed only while the enrollment is unpaid" — which tracks the spec's own qualifier "before payment happens." The best-effort-email strengthening is flagged: "read as a hard decoupling requirement — decision persistence must never depend on email delivery (INV-18), not merely 'emails may be slow.'" No silent drift found.

## Q2 — No invented requirements: YES

Lens-derived material is consistently labeled rather than smuggled in as spec text: "amount/currency verification at grant time, session supersession, duplicate-payment detection, payment-after-reversal handling, and fail-closed parsing (INV-7…INV-13) are lens-derived defaults — the spec is silent on them; they are labeled as such." Invariants carry explicit "(lens-derived)" tags. No invented features: no waitlist (N4), no auto-refunds (N3), no rejection emails (N6), no multi-event UI (N11). ReconciliationCase is a constraint-surface (where does refused money go), not a feature, and cites A7/INV-12.

## Q3 — High-risk ambiguity surfaced: PARTIAL (with recorded rationale) — adjudication below

## Q4 — Invariants specific and testable: YES

All 19 are checkable predicates. Examples: INV-1 "a registration commit that would raise the count of registered kids above the configured evaluation cap is rejected, including under concurrent submissions (atomic check-and-insert)"; INV-13 "missing, null, or unparseable payment fields … cause the webhook/confirmation path to refuse activation and fail closed; absent data never defaults to success." No vibes. Each has a matching AC and a named regression test.

## Q5 — Slices independently buildable: YES

Linear, explicit, acyclic: "Dependency graph: 1 → 2 → 3 → 4 → 5 → 6 → 7." Split invariants are forward-safe, not forward-dependent: Slice 3 proves the decision-side half of INV-5 ("payment-side interleaving proven in Slice 6"), and Slice 5 is fail-closed without Slice 6 existing: "none can activate anything because the webhook does not exist yet (fail-closed by construction)." Each slice has allowed/forbidden files, rollback notes, and done criteria; a competent engineer could build slice N from its section alone.

## Q6 — Single-concern slices: YES

No schema+UI+publisher mixing; each migration belongs to its slice's single concern. Slice 6 is the largest (webhook verification + activation + reconciliation + admin reconciliation view) but those are one concern — money-state verification — and the admin view is the required surface for INV-12 ("a log line alone is never the outcome"). Acceptable.

## Q7 — L2 invariants → proof obligations + ACs: YES

Mapped every L2 invariant: all 18 L2 invariants (INV-1–17, INV-19; INV-18 is L1 and explicitly exempted: "STRONG_RED not applicable: L1 invariant") appear in at least one slice's proof obligations with a named test file and a named expected attributed STRONG_RED mutation (e.g. INV-7: "skipping the owed comparison before activation turns the test red"; INV-9: "removing the durable idempotency-key check turns the test red") and at least one AC (AC-1…AC-21 each cite their INV). Concrete enough for ship-review to demand the STRONG_RED.

---

## Payment-depth lens (12 points)

| # | Point | Score | Evidence |
|---|---|---|---|
| 1 | Owed computed server-side | YES | INV-6: "client-supplied amounts, prices, or plan/price pairs are never trusted"; AC-10 tamper test |
| 2 | Captured amount/currency/status verified vs owed BEFORE grant | YES | INV-7: "verified at grant time against the owed amount… creation-time pricing alone never grants entitlement"; AC-13 |
| 3 | Canonical payment↔domain id with defined miss behavior | YES | PaymentSession = "one Stripe Checkout session for one Enrollment"; missing "enrollment reference" is in the INV-13/AC-18 fail-closed table |
| 4 | Stale/superseded-session rules | YES | INV-8: "neither honored at the stale amount nor silently dropped — it opens a reconciliation case"; AC-12 |
| 5 | Event idempotency on durable id | YES | INV-9 "durable idempotency record"; AC-14 replay test |
| 6 | Duplicate distinct payments detected, not absorbed | YES | INV-10: "never absorbed as a replay"; Slice 6 mutation "classifying any repeat payment as a replay turns the test red" |
| 7 | Payment after cancel/reversal defined | YES | INV-11 + domain model: "withdrawn + payment arrives ──▶ stays withdrawn + ReconciliationCase" |
| 8 | Reversal-vs-payment race serialized | YES | INV-5 "serialized by a conditional state transition… only `awaiting_payment` may transition"; AC-8 "both interleavings" |
| 9 | Refund/reconciliation signal when money moves but state rejects | YES | INV-12 "a log line alone is never the outcome"; A7; AC-17 |
| 10 | Entitlement bound to verified principal | YES | INV-19; AC-19 "activation is refused when no verified binding exists" |
| 11 | Fail-closed on missing/ambiguous data | YES | INV-13; AC-18 field-absence/garbling table |
| 12 | Money-state auditability | YES | INV-14 covers "session create/supersede, activation, reconciliation open/close"; AC-20 |

**Payment-depth lens: YES (12/12).**

## Identity lens: YES

Claimed-vs-verified is explicit at the entity level: parent email is a "claimed identifier until verified — identity lens." Proof of control: "provider-**verified** email equal to the registration's parent email, or an audited admin relink" (INV-4). Claiming another's record: blocked — "mismatches are resolved by an audited admin relink, never by self-service claim" (A2), tested in AC-4. Money/PII bound to verified principal: INV-19, INV-3. Identifier changed/reassigned after binding: OQ-6 names "recycled/reassigned after binding" with admin relink as the recovery; two-guardian case surfaced (OQ-11/N12).

---

## Q3 ambiguity adjudication (explicit, per the critical instruction)

The compiler's posture: "Where the lenses mandate a fail-closed default for an otherwise-high ambiguity, the default is adopted as a labeled assumption and the confirmation question is filed at medium — the adopted behavior is the strict reading, so a different answer can only loosen it" (open-questions.md). I tested each money-model assumption against that justification:

- **Refunds (A7/OQ-3/N3): LEGITIMATE.** "Money arriving for a reversed, canceled, or superseded obligation is never auto-honored and never silently dropped — funds are held, a reconciliation alert… refunds are issued manually." This is genuinely the strict end: a founder answer can only add automation, never reveal that the default lost money or granted entitlement. Safe default a founder of a 60-kid launch would endorse.
- **Post-cohort behavior (A6/OQ-4/N1): LEGITIMATE.** "Launch scope is the first enrollment payment per kid." Deferral is honest (the spec describes a launch with one inaugural evaluation), nothing irreversible is decided, and access-after-expiry is read-only schedule data.
- **Identity binding (A2/OQ-6): LEGITIMATE.** Strict reading; any founder answer loosens it.
- **Pricing position (A3/OQ-2): WEAKEST LINK — does NOT satisfy the plan's own justification.** OQ-2 admits "a different answer changes owed amounts in edge cases," and the plan's own severity rule says high = "the answer changes… money behavior." A3 is not a "can only loosen" strict default: pricing by cohort position can charge a registered-WR kid placed in a QB cohort $1,200 instead of $500 — the assumption moves money in both directions. Mitigation that keeps this from being a papered ambiguity: the parent sees and approves the exact server-computed amount before paying (R13/AC-11), the INV-6 mechanism is answer-independent, and the assumption + rejected reading are fully visible in the intake. A money-model choice was made by the compiler, but transparently and behind a human-confirmed charge — mislabeled severity (should be high or founder-confirmed pre-build), not concealment.
- **What full-year upfront buys: GAP — no explicit OQ.** The prompt's first ambiguity is the one the plan handles only implicitly. OQ-4 asks about per-cohort end; OQ-5 about upgrades; nothing asks "when the inaugural cohort ends, what does the $4,000 family get, and how is the year modeled?" At launch a full-year payment activates exactly the same single Kid↔Cohort enrollment as a $1,200 payment, differing only in the stored plan field and gear flag. Defensible as deferral (plan is durably recorded, audit exists, nothing is lost), but a $2,800 price delta whose entitlement scope is undefined deserved its own confirmation question rather than riding inside N1's per-cohort framing.

**Adjudication result: the fail-closed-assumption posture is mostly legitimate — no ambiguity is silently resolved; every adopted default is labeled with its rejected reading and an OQ. Two findings prevent a clean YES: OQ-2's medium severity violates the plan's own severity rule, and the full-year-entitlement question is absorbed rather than asked. Q3 = PARTIAL with recorded rationale, not NO: nothing is papered over — both gaps are discoverable from the plan's own text, and neither can cause silent money loss or unearned entitlement before a founder sees them.**

---

## VERDICT: **PASS**

Q1 YES, Q2 YES, Q3 PARTIAL-with-recorded-rationale, Q4–Q7 YES; payment-depth lens YES (12/12), identity lens YES; no NO on Q1/3/4/7 and no lens NO. A senior engineer would start building from this plan. Two **non-blocking revision recommendations** for the founder-confirmation pass before Slice 5:

1. Re-grade OQ-2 to high (or get founder sign-off on A3 pre-build) — its answer changes charged amounts, which is "money behavior" under the plan's own severity rule.
2. Add an explicit OQ: "What does the $4,000/$1,700 full-year payment entitle beyond the inaugural cohort, and how is it modeled when cohort 2 opens?" — currently implicit in N1.

---

## Q8 — Would the plan have caught the known blocker classes? (does not affect verdict)

| Class | Score | Plan lines that catch it |
|---|---|---|
| C1 superseded/duplicate session: no silent loss, no double capture | **HIT** | INV-8 ("neither honored at the stale amount nor silently dropped"), INV-10 ("never absorbed as a replay"), AC-12/AC-15, Slice 6 tests `superseded-session-payment.test.ts`, `duplicate-payment.test.ts` |
| C2 payment verified against owed before granting | **HIT** | INV-7, AC-13, Slice 6 `grant-time-verification.test.ts` with STRONG_RED "skipping the owed comparison before activation" |
| C3 reversal closes payment window incl. in-flight race | **HIT** (with one noted gap) | INV-5 conditional transition, INV-11, AC-8 "both interleavings… never active-after-reversal without a reconciliation case," AC-16, `reversal-race.test.ts`. Gap: the plan never instructs best-effort expiry of the open Stripe Checkout session on reversal, so a parent can still complete a charge that lands in manual-refund reconciliation — activation window is closed and serialized, but the charge window is mitigated rather than closed. |
| C4 portal linking requires verified email | **HIT** | INV-4, A2, AC-4, `binding-verified-email.test.ts` ("relaxing the predicate to accept a claimed email turns the test red") |
| C5 capacity check-and-insert serialized | **HIT** | INV-1 ("atomic check-and-insert"), AC-1 concurrency criterion, `capacity-cap.race.test.ts` |

5/5 HIT (C3 with a customer-experience caveat, safety property fully covered).

## Overfitting check: NO INFLATION FOUND

The payment lens did not bleed into non-payment areas. Counter-evidence: risk-map keeps "Admin CRUD for cohorts/sessions/announcements: L2 on authz (INV-17), L1 on the CRUD content itself" and "Public-site copy, portal presentation, email template content: L0–L1"; INV-18 stays L1 honoring the spec's "best-effort" language, with Slice 3 explicitly declining a STRONG_RED for it ("below the attributed-STRONG_RED threshold"). Status-transition escalations that did occur (INV-5, INV-16) are genuinely payment-gating, not escalation-for-having-status. Lens-derived defaults are consistently labeled: "(lens-derived)" tags on INV-4, INV-7–13, INV-19; intake's lens note; A2/A7 marked "(identity lens, lens-derived)" / "(payment lens, lens-derived)". The risk-map also resisted upward creep: "Why not L3… No downgrade occurred (Initial = Final = L2)."

## Files read

- /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
- /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/cpa-payments.md
- /tmp/spec-eval/cpa-r3/spec-intake.md, requirements.md, non-goals.md, domain-model.md, invariants.md, risk-map.md, open-questions.md, acceptance-criteria.md, implementation-slices.md (all nine; nothing else)
