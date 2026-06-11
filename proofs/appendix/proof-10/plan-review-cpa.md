# CPA payments plan — cold plan-review (verbatim)

> Reviewer: fresh-context Claude subagent `a47d0fb5252a6b35e`, 2026-06-11, rubric v1. Inputs:
> rubric + fixture spec + the nine plan documents (listed at end). Verbatim final output follows.

---

All nine plan documents, the rubric, and the original spec read. Review follows.

---

## Rubric Q1–Q7

### Q1. Intent preservation — YES

The verbatim spec is reproduced in `spec-intake.md` and the paraphrase tracks it clause-for-clause. Every divergence I could find carries an interpretation note or assumption:

- The "enrollment at selection vs. at payment" tension is explicitly resolved with the rejected reading stated: *"selection creates an enrollment record in a pending-payment state; 'enrolled' is the active state reached only on verified payment. Rejected reading: …"* (spec-intake.md, Interpretation notes).
- Reversibility scope: *"read as reversible before payment, because the spec motivates it with 'we sometimes change our minds before payment happens'"* — with the refund consequence routed to A4/OQ-5 rather than silently dropped.
- "around 60 kids" → *"Exact number treated as configurable with default 60 (A2, OQ-3)"* — the softening is flagged, not smuggled.
- Requirements carry paragraph traceability (R1–R18 cite P1–P6); the one requirement not literally in the spec, R19 (PII scoping), is labeled *"surfaced constraint, see risk-map.md."*

Minor: R3's "signature (name + timestamp + waiver version) is stored" adds storage detail beyond the spec, but it is constraint-surfacing for a legal instrument (risk-map: *"a legal instrument (waiver)"*) and OQ-10 records the versioning question. No drift without a note found.

### Q2. No invented requirements — YES

Every addition I checked is a constraint with a cited rationale or a flagged assumption, not a feature: admin-configurable cap (A2 + OQ-3), decision audit history (*"reversals recorded, never deleted (audit trail for INV-8)"*, domain-model.md), waiver immutability (INV-6, justified by the legal-instrument risk), gear-entitlement recording (R15, derivable from "Full-year includes gear"). Non-goals.md explicitly fences off the tempting inventions (waitlist, discounts, refunds in-app, multi-event, price admin). Nothing rises to an invented feature.

### Q3. High-risk ambiguity surfaced — PARTIAL

The two BLOCKED high-severity questions are the **right** ones. OQ-1 (*"What does the full-year upfront purchase … entitle the child to … changes the payment/entitlement data model, INV-2's scope, and Slice 7's boundaries"*) and OQ-2 (renewal money flow) are genuine money ambiguities the spec cannot answer, and the plan correctly refuses to guess — Slice 7 is hard-blocked (*"Blocked by OQ-1 and OQ-2 (high, open) — do not start until resolved"*). Refunds (OQ-5), not-selected visibility (OQ-4), and two-guardian access (OQ-8) are all surfaced with conservative defaults.

The PARTIAL is one unsurfaced ambiguity touching auth + minors' data: Slice 3's scope silently resolves account-claiming — *"linking an authenticated identity to its family (by registration email)"* — with no assumption, invariant, or open question about whether that email must be **provider-verified** before the identity gains access to a family's children. A8 abstracts the provider but does not pin verified-email as a requirement of the abstraction. This is exactly the class of ambiguity Q3 exists to catch, and the plan recorded no rationale for it. (See C4 below — this is the plan's one real hole.)

### Q4. Invariants specific and testable — YES

All fourteen are checkable predicates with subjects, conditions, and forbidden outcomes. E.g. INV-1: *"a client-side success redirect alone must never activate anything"*; INV-7: *"a submission that would exceed it is rejected whole"*; INV-8: *"reversible only while the child's enrollment has no succeeded payment."* No vibes found; INV-12 is even given as a boolean formula (*"gear entitlement = (plan == full_year) OR (cohort.inaugural == true)"*, domain-model.md).

### Q5. Slices independently buildable — YES

Every slice declares `Depends on:`; the graph (1→{2,3}; {1,3}→4; 4→5; {3,4}→6; 6→7; {1,3}→8; {7,8}→9) is acyclic, and independence is stated where it holds (*"slices 5 and 8 are independent of each other and of 6"*). Forward references are handled: Slice 4 can test INV-8 without Slice 7 existing (*"Reverse with a seeded succeeded payment → refused"* — schema exists from Slice 1); Slice 6 builds a *"payment stub (no charging yet)"* so it doesn't need Slice 7. Allowed/forbidden file lists make the boundaries enforceable.

### Q6. Single-concern slices — YES

No slice mixes unrelated concerns. Slice 1 is schema + pure domain functions only (*"No business routes or UI beyond the default shell"*, with portal/admin/payments in Forbidden files). Slice 7 is the largest but is one coherent money flow (session creation → webhook → activation → entitlement). Slice 8 spans several entities but is a single concern (admin content CRUD behind one gate).

### Q7. L2 invariants → proof obligations AND acceptance criteria — PARTIAL

Twelve of thirteen L2 invariants map cleanly to both a named proof obligation and an AC:

| INV | Proof obligation (slice) | AC |
|---|---|---|
| 1 | `payments.activation-requires-verified-webhook` (S7), `decisions.selection-never-activates` (S4) | AC-7 |
| 2 | `payments.server-side-amount` (S7) | AC-8 |
| 3 | `pricing.hidden-until-selected` (S6) | AC-3 |
| 4 | `authz.cross-family-denied` (S3) | AC-4 |
| 5 | `authz.admin-gate` (S3), `admin-content.non-admin-denied` (S8) | AC-5 |
| 6 | `registration.requires-waiver` (S2) | AC-2 |
| 7 | `registration.cap-concurrent` (S2) | AC-1 |
| 8 | `decisions.reversal-blocked-after-payment` (S4) | AC-6 |
| 9 | `payments.webhook-idempotent` (S7) | AC-9 |
| 10 | `notifications.selection-survives-email-failure` (S5) | AC-10 |
| 13 | `transitions.rejects-illegal` (S1) | AC-13 |
| 14 | `portal.paid-gating` (S9) | AC-12 |

The gap: **INV-11** (PII never exposed publicly or cross-family) has acceptance coverage (AC-4 cites *"INV-4, INV-11"*) and is listed under "Invariants touched" in Slices 2, 3, 6, 9 — but **no named proof obligation is attributed to it**. `authz.cross-family-denied` is attributed only to INV-4; the Slice 2 public-route sweep is attributed to AC-3/INV-3. The material tests exist, but as written ship-review could not demand a STRONG_RED *for INV-11 specifically*. Fixable by attribution.

---

## VERDICT: NEEDS_REVISION

Reasoning: Q1, Q2, Q4, Q5, Q6 are YES. Q3 and Q7 are PARTIAL — and in both cases the rationale for the gap is **not recorded in the plan** (the email-verification linking ambiguity is silently resolved in Slice 3's scope; INV-11's missing attribution is unacknowledged), so the PASS condition ("all YES or PARTIAL-with-recorded-rationale") is not met. Nothing here is intent loss, papered-over ambiguity at scale, or untestable invariants, so REJECT is wrong. The plan-lint BLOCKED state on OQ-1/OQ-2 is correct behavior and judged correct here (Q3) — those are the right high-severity questions.

**Revision obligations:**

1. **Family-account linking must require a verified email.** Add an invariant (or high-severity assumption/OQ) to Slice 3: an authenticated identity may be linked to a family only if the hosted provider attests the email is verified and it matches the registration email; add a deny test (unverified identity with matching email → no family access, no PII). This protects minors' data from account-claiming and belongs at L2 alongside INV-4/INV-11.
2. **Attribute INV-11 to a named proof obligation** — e.g., extend `authz.cross-family-denied` to cite INV-11, or promote Slice 2's public-route sweep to a named regression (`pii.public-route-sweep`), so a STRONG_RED can be demanded for it.
3. **Close the cancelled-enrollment payment window explicitly.** Slice 7 should require: (a) a test that checkout-session creation for a `cancelled` enrollment is refused, and (b) a defined outcome for a webhook completing a session whose enrollment was reversed in-flight (refuse activation per INV-13 + flag for manual refund per A4). Currently this is only implied by the state machine.

---

## Q8 — Pre-registered ground-truth classes (does not affect the verdict)

| Class | Score | Plan lines that would (or would not) have caught it |
|---|---|---|
| **C1** payment-session lifecycle (superseded/duplicate session: no silent loss, no double capture) | **PARTIAL** | Double-capture/double-grant is forced: INV-9 (*"repeated completion of the same checkout must never produce more than one succeeded payment record or more than one activation"*), AC-9, Slice 7 test *"Duplicate webhook / replayed session → one payment, one activation"* and proof `payments.webhook-idempotent`. But the **superseded-session / silent-loss** half is unaddressed: nothing handles a session paid after the plan was switched (a new session created) or after the enrollment was cancelled — money could be captured with no grant and no defined disposition. AC-15 only checks the charge matches the plan *"selected at payment time."* |
| **C2** payment verification before granting (amount/currency/captured-status vs. owed) | **PARTIAL** | Captured-status and no-grant-on-redirect are forced: INV-1 (*"verified server-side via a signature-checked webhook … a client-side success redirect alone must never activate anything"*), AC-7. Amount is forced at creation: INV-2 + AC-8 (*"a request with a tampered client-side amount, price, or position field still charges the server-computed amount or is rejected"*). However, no obligation demands re-checking the **received event's** amount/payment_status against what is owed (a builder could treat signature validity as sufficient and grant on an async/unpaid `completed` event), and **currency appears nowhere in any of the nine documents**. |
| **C3** decision reversal closes the payment window | **PARTIAL** | Activation of a reversed enrollment is structurally forced illegal: domain-model.md `pending_payment ──decision reversed──▶ cancelled` with no `cancelled → active` edge, INV-13 (*"changes follow only the transitions defined"*), and Slice 1's test *"every illegal transition … is rejected by the domain function."* Slice 7's scope limits payment to *"a pending enrollment."* But there is **no test or proof obligation that a reversed kid's family is refused at checkout creation**, and the in-flight race (session created pre-reversal, paid post-reversal) has no defined handling — AC-6 only tests the opposite direction (reversal blocked *after* payment). |
| **C4** portal account linking requires verified email | **MISS** | Nothing would have caught it. Slice 3's scope is the bug as written: *"linking an authenticated identity to its family (by registration email)"* — no verified-email requirement in any invariant, assumption, AC, test, or open question. A8 (*"thin abstraction so slices do not depend on the choice"*) abstracts the provider without pinning email verification; OQ-8 is about a second guardian, not verification. Revision obligation 1 above. |
| **C5** capacity check-and-insert serialized | **HIT** | Forced at every layer: INV-7 (*"must never exceed … including under concurrent registration submissions"*), domain-model.md (*"Capacity is checked transactionally … at registration commit"*), AC-1 (*"two concurrent registrations … exactly one acceptance and one capacity rejection; the confirmed count never reads 61"*), Slice 2 required test (*"Concurrency test: two simultaneous one-child submissions at 59/60 → exactly one accepted"*) and L2 proof obligation `registration.cap-concurrent` with attributed STRONG_RED. |

Score line: 1 HIT, 3 PARTIAL, 1 MISS. The misses cluster exactly where the rubric review flagged its gaps (Q3 → C4; the C1/C3 residuals → revision obligation 3), which is consistent: the plan is strong on the invariants it states and weak only where an ambiguity was resolved silently instead of being stated.

---

## Files read

1. /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
2. /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/cpa-payments.md
3–11. /tmp/spec-eval/cpa/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,implementation-slices,open-questions}.md

Nothing else was read, per the isolation instruction.
