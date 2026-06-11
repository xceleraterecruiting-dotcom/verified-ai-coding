# CPA payments plan r2 — cold plan-review after identity-lens remediation (verbatim)

> Reviewer: fresh-context Claude subagent `a49a53ea65bf328f9`, 2026-06-11, rubric v2 (first
> exercise of the domain lenses). Inputs: rubric + fixture spec + the nine r2 plan documents
> (listed at end). Verbatim final output follows.

---

All required documents read. Review follows.

# Cold plan-review — CPA youth-academy spec, remediation re-review (cpa-r2)

## Q1. Intent preservation — YES

The verbatim spec in `spec-intake.md` matches the fixture word-for-word. The paraphrase preserves all three surfaces and every behavioral clause. Every place the compiler had to choose a reading is an explicit interpretation note with the rejected alternative stated, e.g.:

> "**'decisions need to be reversible' (before payment)** — read as: both selected→not-selected and not-selected→selected re-decisions are allowed... Rejected narrower reading: only selected→not-selected is reversible."

Requirements 1–19 carry paragraph traceability ("Traceability: spec paragraph 1 = 'Families register…'"); the two non-spec-derived requirements are honestly marked "(implied by P2/P4)" and "(implied by P1/P3)". Nothing weakened: "when it's full it's full" became a hard cap (REQ-3, "Rejected reading: soft/advisory cap"); "best-effort email" became REQ-6 with the must-not-block semantics intact.

## Q2. No invented requirements — YES (overfitting check below)

The additions are constraints with cited rationale, not features: server-side price book (A3 — direct consequence of "Don't show prices"), webhook-driven enrollment (interpretation note on "Once paid"), admin reconciliation flag for payments against revoked enrollments (consequence of INV-5/INV-10 interplay, refund path explicitly deferred to OQ-1). The 14 non-goals fence off plausible-but-unrequested features (waitlist, refunds UI, subscriptions, SMS).

**Overfitting check (identity lens):** No overfitting found. Evidence:
- The lens-driven assumption is explicitly provenance-labeled rather than smuggled in as spec text: A1 ends "(Money and minors' PII bind only to a verified principal — lens default, not spec text.)" and the intake note says binding "defaults to *verified email control required* (A1)". That is a surfaced constraint with rationale, the allowed kind.
- Ceremony was applied **only** where a real user↔resource binding exists (portal account ↔ family containing minors' PII and payment ability). The other "claimed identifier" in the spec — the typed-name waiver signature — was correctly left as the spec wrote it (REQ-2 stores name/timestamp/version; OQ-7 merely asks about legal requirements). No invented e-signature identity verification.
- No risk inflation: `risk-map.md` argues **against** escalation — "**Why not L3:** ... Minors' data is present but is never published publicly... Card data is delegated to Stripe-hosted collection (A6)".
- Admin identity got an assumption (A10) plus OQ-9, not invented provisioning machinery.

## Q3. High-risk ambiguity surfaced — YES

Every money/auth/minors/state-transition ambiguity is either an assumption (A1–A10) or an OQ, and the dangerous ones are high-severity and **blocking** rather than guessed:

> "OQ-1 [severity: high] [status: open] What happens after payment? ... money behavior, so the compiler must not pick a default."
> "OQ-2 [severity: high] [status: open] What exactly does 'full year upfront' buy..."

Both block Slices 6–7 ("**Gate:** do not start implementation while OQ-1/OQ-2 are open"). These are exactly the right two BLOCKED items: each changes the money state machine / charge model and is a founder call, matching the lint's designed terminal state. Medium-severity money-adjacent ambiguities carry explicit defaults plus confirmation requests (OQ-5 position drift — "QB vs non-QB is a $700–$2,300 difference"; OQ-4 partial-family-at-capacity; OQ-3 email mismatch/recycling; OQ-9 admin provisioning). Nothing dangerous is silently resolved.

## Q4. Invariants specific and testable — YES

All twelve are checkable predicates with concrete conditions, e.g. INV-6: "accepted only if the evaluation event is open and under capacity at commit time, enforced atomically so that concurrent submissions can never push accepted kid-count above capacity"; INV-4: "a merely typed/unverified email must never grant access to a family's kids, statuses, or payment ability"; INV-10: "a succeeded payment for a revoked or already-enrolled enrollment must never auto-enroll and must be flagged for admin reconciliation." No vibes.

## Q5. Slices independently buildable — YES

Dependency graph is explicit and acyclic (1 → 2 → 3 → 4 → {5, 6, 8}; 7 ← 6; 9 ← 7,8; "Slice 8 ... Independent of Slices 5–7"). Each slice has scope, allowed/forbidden files, tests, proof obligations, rollback, and done criteria. Cross-slice handoffs are stated where they exist ("admin UI for linking lands in Slice 4's admin shell; this slice exposes the server-side link primitive"; Slice 4 "Emits a domain event/outbox row ... that Slice 5 consumes (no email sending here)").

## Q6. Single-concern slices — PARTIAL (recorded rationale)

Slice 4 carries the admin shell + selection/reversal lifecycle + the manual account↔family link UI + outbox emission. The link UI is identity-domain inside a decisions slice. Mitigations recorded in the plan itself: the linking primitive lives in Slice 3 (Slice 4 only exposes UI over it), and the outbox write is intrinsic to the decision transaction (INV-8). This is a minor cohesion stretch, not the schema+UI+publisher anti-pattern; everything else is cleanly single-concern (Slice 5 email-only, Slice 7 payments-only with `lib/decisions/`, `lib/auth/` forbidden).

## Q7. L2 invariants → proof obligations + acceptance criteria — YES

All eleven L2 invariants map to at least one named-test proof obligation demanding attributed STRONG_RED **and** at least one AC:

| INV | Slice proof obligation (named test) | AC |
|---|---|---|
| 1 | S1 `price-book.test.ts`, S7 `server-priced.test.ts` | 16 |
| 2 | S7 `webhook-verify-idempotent.test.ts` | 17, 19 |
| 3 | S6 `pricing-visibility.test.ts` | 6, 15 |
| 4 | S3 `binding-verified-email.test.ts` | 7 |
| 5 | S4 `reversal-unpaid-only.test.ts` | 11, 12 |
| 6 | S2 `capacity-race.test.ts` | 3, 4 |
| 7 | S2 `waiver-required.test.ts` | 2 |
| 9 | S4 `admin-only.test.ts` + S8 extension | 9, 23 |
| 10 | S7 `revoked-not-enrollable.test.ts` | 11, 20 |
| 11 | S3 `family-scoping.test.ts`, S9 `enrolled-scope.test.ts` | 6, 8, 24 |
| 12 | S7 `webhook-verify-idempotent.test.ts` | 18, 19 |

Concrete enough for ship-review to demand STRONG_REDs (each slice says so explicitly).

## Lens: Payment/status — PARTIAL

Met, with evidence:
- **Replay idempotency:** INV-12 ("idempotent per event id: replaying any webhook event must never double-enroll"); AC 19.
- **Stale/superseded-event handling (partially):** INV-10 — success for revoked/already-enrolled is flagged, never auto-enrolled; AC 20.
- **Check-then-act concurrency for capacity:** INV-6 + Slice 2 "single transaction, row-lock or conditional insert" + AC 4 concurrency test.
- **Amount control at creation:** INV-1, AC 16 tamper test.

Not met, with no recorded rationale for the omission:
1. **No exact amount/currency/captured-status verification at grant time.** INV-2 requires only "server-side verification of a successful Stripe payment for that enrollment" — nowhere does the plan require the webhook handler to check the event's amount, currency, and payment/capture status against the enrollment's owed price before enrolling. Creation-time pricing (INV-1) mitigates but does not substitute (a session created before a position correction — OQ-5's own scenario — carries a stale amount).
2. **No checkout-session lifecycle/supersession rule.** Slice 7 just says "server creates a Stripe Checkout session"; the Payment entity allows `created → succeeded | failed | expired` but nothing bounds concurrent sessions per enrollment or cancels a superseded one when the parent switches plan. Double-capture would be *flagged* via INV-10's already-enrolled branch (so not fully silent), but nothing prevents it.
3. **Sibling-writer race not explicitly reasoned.** Admin reversal (INV-5: check no succeeded payment → revoke) and the webhook (INV-10: check pending_payment → enroll) are sibling writers to enrollment state; unlike capacity, no serialization requirement or race test exists (AC 11/12 are sequential).

PARTIAL, not NO: signature verification, event-id idempotency, state validation, server-side pricing, and one fully-worked concurrency case are all present and proof-obligated.

## Lens: Identity/account-claim — YES

All four lens elements addressed:
- **What proves control:** INV-4 — "bound to a family only when the account's provider-verified email equals the registration's parent email, or an admin explicitly links them; a merely typed/unverified email must never grant access"; Slice 3 obligation: "Document ... which provider claim is treated as 'verified email' and that the provider is configured to require verification."
- **Claiming another's record:** AC 7 (typed/unverified same email sees nothing, no payment ability), AC 8 (cross-family by id/API → denied), Slice 3 "lookalike addresses do not" bind.
- **Money/PII bind to verified principal:** A1 verbatim; INV-11 for minors' PII.
- **Identifier changed/reassigned after binding:** OQ-3 — "(typo at registration, family uses a different address, **email later recycled or changed**), what is the supported recovery path?" with admin-mediated default; domain model: "Linked to exactly one Family once bound."

# VERDICT: NEEDS_REVISION

Q1–Q7 contain no NO (Q6 PARTIAL with rationale), and the identity lens — the remediation target — is now a clear YES. But the payment/status lens is only PARTIAL, and unlike the plan's other PARTIALs the three payment-path omissions carry **no recorded rationale** anywhere (they are simply absent, not deferred-with-reason like the OQ-gated items). On a four-figure-money L2 plan, with Slice 7 already implementation-blocked on OQ-1/OQ-2 anyway, these are cheap, bounded, fixable gaps — the definition of NEEDS_REVISION rather than PASS.

**Revision obligations:**
1. Add an invariant + AC + Slice 7 proof obligation: before `pending_payment → enrolled`, the webhook handler verifies the event's amount and currency equal the server-computed owed price for (enrollment.position, recorded plan) and that payment status is paid/captured; any mismatch → no enrollment, admin-reconciliation flag (extend INV-2 or new INV-13).
2. Specify checkout-session lifecycle: at most one active session per enrollment, or an explicit supersession rule (creating a new session expires/cancels the prior one); a success event for a superseded session must not double-capture silently — with a named test in Slice 7.
3. Add explicit concurrency reasoning + race test for the reversal↔webhook sibling-writer pair (serialize INV-5's check-and-revoke against INV-10's check-and-enroll via row lock/conditional update), mirroring the discipline already applied to INV-6 capacity.

Everything else is PASS-quality; obligations are confined to `invariants.md`, `acceptance-criteria.md`, and Slice 7.

# Q8. Pre-registered classes (never affects verdict)

| Class | Score | Plan-line citations |
|---|---|---|
| C1 superseded/duplicate checkout session — no silent loss/double-capture | **PARTIAL** | Nothing manages session lifecycle (Slice 7 scope: "server creates a Stripe Checkout session" — no supersession/cancellation; domain model Payment states `created → succeeded \| failed \| expired` with no per-enrollment uniqueness). Double-capture would not be *silent* — INV-10: succeeded payment for "already-enrolled enrollment must never auto-enroll and must be flagged for admin reconciliation" — but nothing prevents it. |
| C2 payment verified against what is owed (amount/currency/captured) before granting | **PARTIAL** | INV-1 + AC 16 pin the amount at session **creation** ("tampered client request ... cannot change the amount or target"), and INV-2 requires verified success "for that enrollment" — but no plan line requires webhook-time amount/currency/captured-status checks against the owed price; a stale-amount session (OQ-5's position-change scenario) would enroll. |
| C3 reversal closes the payment window | **HIT** | INV-5: "reversing a selection voids the pending enrollment so it can no longer be paid"; INV-10 + AC 11: "any attempt to start payment for it fails"; AC 20 + Slice 7 test "Success webhook for revoked enrollment → not enrolled, reconciliation flag raised" closes the in-flight-session leak. |
| C4 portal account linking requires verified email | **HIT** | INV-4; A1; AC 7 ("same email merely typed/unverified ... sees no kids and gets no payment ability"); Slice 3 `binding-verified-email.test.ts` + provider-claim documentation obligation. |
| C5 capacity check-and-insert serialized | **HIT** | INV-6 ("enforced atomically so that concurrent submissions can never push accepted kid-count above capacity"); Slice 2 scope "single transaction, row-lock or conditional insert" + `capacity-race.test.ts`; AC 4 concurrency test. |

3 HIT / 2 PARTIAL / 0 MISS — the remediated compiler caught C3/C4/C5 outright (C4 is the class the v1 plan missed); the two PARTIALs are exactly the payment-lens gaps driving the verdict.

## Files read
1. /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
2. /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/cpa-payments.md
3–11. /tmp/spec-eval/cpa-r2/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,implementation-slices,open-questions}.md
