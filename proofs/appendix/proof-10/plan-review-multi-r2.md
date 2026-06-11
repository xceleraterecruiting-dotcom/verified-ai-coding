# Multi-slice team-hub plan r2 — cold plan-review after payment-depth lens (verbatim)

> Reviewer: fresh-context Claude subagent `ab9a05945423376b4`, 2026-06-11, rubric with the
> expanded 12-point payment-depth lens. Lint: structurally clean incl. rule 6b; 4 BLOCKED
> high-severity OQs (designed terminal state). Inputs: rubric + fixture spec + the nine r2 plan
> documents. Verbatim final output follows.

---

# Cold Plan Review — multi-slice-team-hub, round 2 (fresh judgment)

Files read: `/Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md`, `/Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/multi-slice-team-hub.md`, and all nine documents in `/tmp/spec-eval/multi-r2/` (spec-intake, requirements, non-goals, domain-model, invariants, risk-map, open-questions, acceptance-criteria, implementation-slices). Nothing else.

---

## Q1 — Intent preservation: YES

Verbatim spec block in `spec-intake.md` matches the fixture exactly. R1–R16 each cite the spec line. Every deviation carries an interpretation note with the rejected reading stated: "charge on order" → "Rejected reading: authorize at order and capture at fulfillment"; RSVP≠attendance → "I did NOT silently equate RSVP with attendance; this is OQ-002 (high)"; "reminder text" → SMS ("'text' forces SMS"). The two requirements that are *conditioned* beyond the spec's words (R11 SMS "gated on documented SMS consent (OQ-003)"; R14 badges "display is default-deny until then" pending OQ-001) are constraints with cited risk rationale, not drift — each has its own interpretation note and high OQ. The 13+-athlete commenting ambiguity is honestly held open (OQ-012) with a stated default rather than silently resolved.

## Q2 — No invented requirements: YES

The additions are constraints, not features, and labeled as such: A3/A4/A10 marked "(lens-derived ...)", INV-07 and INV-09..16 marked "(lens-derived)". Non-goals explicitly fence off the tempting feature inventions (self-service refunds UI, inventory ledger, check-in system, athlete-authored content, DMs). Borderline item, noted but acceptable: the coach `hidden_by_coach | visible` moderation action in Slice 4 / domain-model is a minimal completion of the spec's "report button" (a report must reach someone), and non-goals cap it: "Human moderation staffing/queues beyond surfacing reports to coaches... excluded."

## Q3 — High-risk ambiguity surfaced: YES

The four BLOCKED high OQs are exactly the right four:
- OQ-001 (public badges for minors) — the genuine L3 driver; "Until answered, INV-17 is default-deny and Slice 12's public-render step cannot ship."
- OQ-002 (RSVP vs attendance authority) — a real source-of-truth split the spec papers over; correctly flagged as potentially a re-plan ("is RSVP an acceptable proxy, or must a check-in capability be built (a re-plan: new slices)").
- OQ-003 (SMS consent) — "the compiler will not default to" unconsented texts; INV-07 fails closed meanwhile.
- OQ-004 (parent↔athlete / DOB authority) — feeds INV-02 and INV-16; "a provided identifier is a claim, not evidence."

None is resolved by guess; all dangerous defaults are deny/fail-closed pending answers. The medium tier (provider OQ-005, audience OQ-006, stock OQ-010, malware OQ-009) is defensibly medium because the invariants are provider-agnostic and the defaults are recorded provisional assumptions.

**L2→L3 self-escalation honesty:** honest and well-scoped. Risk map: Initial L2, "Escalated to Final L3 because of the badge-publication path... minors' data + public output — the skill's definition of L3. The escalation is owned by one path only (see per-area levels)." Per-area table keeps store at L2, schema at L1 — no blanket inflation, no downgrade.

## Q4 — Invariants specific and testable: YES

All 20 are checkable predicates with quantified conditions, e.g. INV-10: "missing, null, or unparseable amount/currency/session fields refuse the transition — fail closed, never default to success"; INV-08: "At most one reminder is sent per (session, recipient)"; INV-17: "while OQ-001 is open the public render path is default-deny for every athlete." No vibes.

## Q5 — Slices independently buildable: YES

Dependency graph is explicit and acyclic (1 → 2 → {3→4, 5, 6→7, 8→9→{10,11}}; 12 and 13 hang off interfaces + Slice 1/2). Each slice has allowed/forbidden files, tests, rollback, done criteria. Slice 3 building before Slice 4 is handled honestly: "the board ships dark behind the hub scaffold until Slice 4 lands, because R4 makes the filter a precondition of a visible board." Provisional paths are flagged (A8) with the boundary-preservation rule.

## Q6 — Single-concern slices: YES

Schema isolated in Slice 1 with every later slice forbidding `db/migrations/`. Board / moderation / files / RSVP / reminders / catalog+order-creation / payment-capture / cancellation / fulfillment / badges / CSV are each one concern. Slice 9's bundle (grant gate, idempotency, supersession, quarantine, duplicate alert) is one concern — webhook reconciliation — not a mix.

## Q7 — L2+ invariants → proof obligations + ACs: YES

Traced every L2/L3 invariant: each maps to ≥1 named per-slice STRONG_RED proof obligation AND ≥1 AC. INV-01 (Slices 2,3,5,6,8,13 / AC-1..3,10,23), INV-02 (S3/AC-4,5), INV-03/04 (S4/AC-6,7), INV-06 (S5/AC-9), INV-07/08 (S7/AC-11,12), INV-09..16 (S8–11/AC-13..20), INV-17/18 (S12/AC-21,22), INV-19 (S13/AC-23). The L3 obligation is hardened: "INV-17 — attributed STRONG_RED required (L3 — non-negotiable, no not-applicable claim accepted)." L1 exemptions (INV-05, INV-20) are stated, not silent. Complete.

---

## Domain lenses

**AI-output lens:** not applicable (no generated content reaching humans/platforms).
**Enterprise-agent lens:** not applicable (no LLM over permissioned data).

### Payment-depth lens (applies: store/checkout, Slices 8–11) — point by point

| # | Point | Score | Evidence |
|---|---|---|---|
| 1 | Owed amount/currency server-side | YES | INV-09 "computed server-side from the canonical Product price list; client-supplied amounts/prices are never trusted"; AC-13 |
| 2 | Captured amount/currency/status verified before grant | YES | INV-10 "`paid` only after grant-time verification that the captured amount, currency, and captured (not merely authorized) status... equal what is owed"; AC-14 |
| 3 | Canonical payment↔domain id with miss behavior | YES | INV-11 "exactly one open canonical payment-session/intent id... a payment event matching no known order/session is quarantined... never auto-applied" |
| 4 | Stale/superseded-session rules | YES | INV-11 "a superseded session can never mark an order paid (no silent loss, no stale-amount honor)"; AC-15 |
| 5 | Event idempotency on durable id | YES | INV-12; AC-16 "same durable event id twice changes nothing... no second audit transition" |
| 6 | Duplicate distinct payments alerted, not absorbed | YES | INV-13 "not absorbed as a replay, not silently refunded"; AC-17 |
| 7 | Outcome for payment after cancel | YES | INV-14 "money arriving for a canceled order never activates fulfillment and always emits a refund/manual-reconciliation signal"; domain model `canceled + payment-arrives -> refund/reconciliation signal, never fulfillment` |
| 8 | Reversal-vs-payment race serialized | YES | INV-14 "serialized via conditional state transitions"; Slice 10 tests "Race both ways (cancel-then-webhook, webhook-then-cancel, concurrent)" |
| 9 | Refund/reconciliation signal, not a log | YES | INV-14 "'logged' is not a path"; Slice 10 done criteria "a real alerting artifact (queue item/incident), not a log line" |
| 10 | Entitlement bound to verified principal | YES | INV-16 "binds to the authenticated parent principal... verified principal, not a typed identifier"; A4 |
| 11 | Fail-closed on missing/ambiguous data | YES | INV-10 fail-closed clause; AC-14 "missing/null amount or session fields likewise refuses activation" |
| 12 | Auditability of money-state transitions | YES | INV-15 "actor, prior state, new state, reason, and timestamp, sufficient to reconcile money later"; AC-19; audit STRONG_REDs in Slices 8–11 |

**Payment-depth lens: YES (12/12).**

### Identity/account-claim lens (applies: parent↔athlete, DOB, order binding) — PARTIAL

- Claimed vs verified control: YES — OQ-004 asks precisely this ("provided-at-signup claims, or verified records?... a provided identifier is a claim, not evidence") and is high/blocking; INV-02's enforcement story is admitted to change if claims are unverified.
- Claiming another's record: YES for orders — INV-16/AC-20 (other parents denied, fulfillment against the same principal); RSVP tests "cannot RSVP for... another family's athlete."
- Money/PII bind to verified principal: YES — A4, INV-16.
- Identifier changed/reassigned AFTER binding: **gap.** Badge consent revocation is handled ("revoking consent removes it", Slice 12), but the plan nowhere addresses DOB edited after comments exist, a parent↔athlete link reassigned after orders/RSVPs, or a consented phone number later reassigned to a different person (SMS keeps consent attached to the number/record with no re-verification trigger). The non-goal "Changes to the existing auth/registration/membership system" partially records this as out of scope, but the *consequences* of upstream changes on existing bindings are unexamined.

PARTIAL with recorded rationale (OQ-004 + the non-goal). Not a NO — three of four lens elements are squarely covered.

---

## VERDICT: PASS

Q1–Q7 all YES; payment-depth lens YES; identity lens PARTIAL with recorded rationale (only a lens NO caps the verdict). Non-blocking notes for the next revision:
1. Identity lens residual: define post-binding mutation behavior (DOB edit, parent↔athlete reassignment, phone-number reassignment vs stored SMS consent) — could be folded into OQ-004's answer.
2. Slice 12 may need a consent-record table once OQ-001 is answered, but Slice 12 forbids `db/migrations/` and Slice 1 only carries `BadgeAward.publication_state`; the re-plan path should anticipate a schema addendum.

---

## Q8 — Pre-registered blocker classes (does not affect verdict)

| Class | Score | Citation |
|---|---|---|
| P-A: amount/currency/captured-status verified against order total BEFORE paid/fulfillable (round-1 MISS) | **HIT** | INV-10 ("only after grant-time verification that the captured amount, currency, and captured (not merely authorized) status... equal what is owed"); AC-14; Slice 9 PO "INV-10 — attributed STRONG_RED required: regression test `mismatched/missing capture data never marks order paid`" |
| P-B: order/payment visibility invariant carries named per-slice STRONG_RED (round-1 INV-14 gap, now lint-forced) | **HIT** | INV-16 ("order records are visible only to that purchaser and the cohort's coaches"); Slice 8 PO "INV-16 — attributed STRONG_RED required: regression test `order binds to authenticated cohort parent; other parents denied` must fail when the binding or visibility check is removed"; Slice 11 PO repeats for fulfillment. Lint-forced, but the obligation is substantive, not a checkbox. |
| P-C: stale/superseded payment handling, incl. async processor reports | **HIT** | INV-11 ("a superseded session can never mark an order paid (no silent loss, no stale-amount honor)"); AC-15; Slice 9 scope is explicitly webhook (asynchronous) processing with quarantine for unmatched events |
| P-D: cancel/reversal vs payment race explicitly serialized | **HIT** | INV-14 ("serialized via conditional state transitions: an order can never end both canceled and silently paid"); Slice 10 tests all three interleavings; PO "must fail when the conditional transition is replaced by a blind update" |
| P-E: money-moved-but-state-rejects → refund/reconciliation signal, not just a log | **HIT** | INV-14 ("always emits a refund/manual-reconciliation signal — 'logged' is not a path"); A10; Slice 10 done criteria ("a real alerting artifact (queue item/incident), not a log line") |

**5/5 HIT.**

## Overfitting check (pre-registered falsifiers)

1. **Payment lens silent on non-payment slices: PASS.** Invariants section header scopes it explicitly: "Store and payments (payment-depth lens applies to Slices 8–11 only)." Board (S3/4), files (S5), RSVP (S6), reminders (S7), badges (S12), CSV (S13) touch only INV-01..08 and INV-17..20 — no payment language, no payment proof obligations, no quarantine/idempotency vocabulary leaked into them (INV-08's reminder idempotency is a correctness need of "automatic reminder," not a payment-lens import).
2. **No escalation merely for status/approval semantics: PASS.** Comment states (blocked/visible/reported/hidden) and order states stay L2; risk map confines L3 to one path with a real trigger: "the escalation is owned by one path only... minors' data + public output." Coach approval of comments and order fulfillment status did not inflate anything. Counter-evidence sought, none found.
3. **Lens-derived defaults labeled: PASS.** A3 "(lens-derived, payment-depth #1/#2/#11)", A4 "(lens-derived, identity lens)", A10 "(lens-derived, payment-depth #9)", INV-07 "(lens-derived: identity/privacy default)", INV-09..16 each "(lens-derived)", INV-16 even cites "identity lens + payment-depth #10". Conversely, spec-backed invariants (INV-01..06, 17..19) carry spec citations via requirements, and OQ-006's provisional default is labeled "(lens-free, needs confirmation)" — the labeling discriminates rather than blanket-stamping. One unlabeled hardening (INV-20 CSV-injection) is not a lens default and is correctly an L1 surfaced constraint.

No overfitting detected; the lens machinery was applied where triggered and stayed quiet where not.
