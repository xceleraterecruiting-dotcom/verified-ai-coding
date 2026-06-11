# Multi-slice team-hub plan — cold plan-review (verbatim)

> Reviewer: fresh-context Claude subagent `a91b382d267c9a214`, 2026-06-11, rubric v2 (payment and
> identity lenses applied as PARTIAL; AI-output and enterprise-agent judged not applicable).
> Inputs: rubric + fixture spec + the nine plan documents (listed at end). Verbatim final output
> follows.

---

All required files read (rubric, fixture spec, nine plan documents). Review follows.

---

# Cold plan review — multi-slice-team-hub fixture

## Q1. Intent preservation — YES

Verbatim spec is reproduced in `spec-intake.md` and the paraphrase covers all six capabilities plus both cross-cutting laws. Every requirement R1–R18 quotes its spec anchor ("Traceability: spec text quoted in parentheses is from the verbatim spec"). The two places where the plan deviates from a literal reading are both recorded as interpretation notes, not silent drift:
- Strengthening of the comment rule — "The plan defaults to the restrictive reading (A4) and records the ambiguity (OQ-05). Rejected silent choice: letting all 13+ athletes comment without asking."
- Conditioning of R16 on consent — "display is gated on OQ-03 (guardian consent for minors)" — a risk-driven constraint, not a reinterpretation, and the gating is flagged in the requirement itself.

The "while you're in there" CSV ask was correctly kept in scope but decomposed separately ("It gets its own slice").

## Q2. No invented requirements — YES

Additions are constraints with cited risk rationales, which the rubric permits: SMS consent (INV-10, justified via OQ-02 "regulated-messaging exposure"), ConsentRecord (OQ-03), charge idempotency (INV-12). Borderline cases are all pinned to recorded defaults rather than smuggled in: report-button behavior "Plan default: visible + coach notification, no auto-hide" (OQ-07); `refunded` state exists only as a "staff-only escape hatch; policy gated on OQ-04" and N3 explicitly excludes a refund flow. No new features (no inventory UI per N2, no messaging per N5, no badge types per N7).

## Q3. High-risk ambiguity surfaced — YES

The four BLOCKED high-severity OQs are exactly the right four; each maps to a distinct dangerous domain and names the invariant and slice it gates:
- OQ-01 (minors/identity): "How is 'under 13' determined, and is the parent↔athlete linkage verified? ... defines how INV-03 and INV-18 can be enforced at all (gates Slice 4)."
- OQ-02 (regulated messaging): "Texting guardians without recorded consent is a regulated-messaging exposure ... gates Slice 7 entirely."
- OQ-03 (minors + public output): "publish attendance-derived data about minors to the open internet ... gates Slice 11 (the plan's L3 path)."
- OQ-04 (money): "what is the policy when charge-on-order meets a fulfillment failure ... gates Slices 8 and 9."

Nothing dangerous is silently guessed: "charge on order" carries a rejected-reading note; cohort scoping carries one too ("Rejected reading: UI-level hiding/filtering only, which would leak via direct URL or API access"). Medium/low OQs all carry recorded safe defaults.

**Escalation honesty (as instructed):** the L2→L3 self-escalation is honest and well-scoped. `risk-map.md` quotes the triggering spec text verbatim, states the rule it matches ("minors' data + public output — the L3 definition verbatim"), explains the actual harm ("A streak badge (and its absence or disappearance) leaks a minor's physical attendance pattern to the open internet"), and confines L3 to the badge-display path with per-area levels rather than inflating or deflating the whole plan. No level-shopping.

## Q4. Invariants specific and testable — YES

All 18 are checkable predicates with explicit polarity, e.g. INV-12: "An order's card is charged exactly once; an order must never be marked paid without a successful charge, and a failed charge must never yield a fulfillable order"; INV-16: "must never appear on a minor athlete's public recruiting profile without a recorded guardian consent that covers it." Each carries its own risk level. No vibes.

## Q5. Slices independently buildable — YES

Explicit acyclic dependency graph at the top: "1 → {3,5,6,8,10}; 2 → {3,4,5,6,9,12}; 3 → 4; 6 → 7; 8 → 9; 10 → 11. Slices 5, 6, 10, 12 are mutually independent once 1 and 2 land." Every slice restates its deps, allowed/forbidden files, tests, proof obligations, rollback, and done criteria — buildable without slice N+1 (e.g., Slice 10 ships in-hub-only badges; Slice 3 ships posts read-only before comments exist). The no-codebase-access weakness is honestly mitigated: "All file paths are provisional ... Each slice's first task is to confirm ... and re-issue its allowed/forbidden lists" (A8).

## Q6. Single-concern slices — YES

No layer mixing anywhere: schema is isolated in Slices 1 and 8 ("No behavior, no routes, no UI"), authorization is its own slice (2: "this service is its single enforcement point; later slices consume it"), and every behavior slice forbids `db/migrations/`. Two slices are dense but still single-concern: Slice 1 (nine entities, but pure additive schema, with store schema deliberately split out "because their shape depends on OQ-04") and Slice 4 (filter + report + under-13 gate — all one comment-lifecycle surface whose pieces interact: filter-before-visibility, report-on-visible). Noted, not penalized.

## Q7. L2+ invariants → proof obligations + acceptance criteria — PARTIAL

12 of 13 L2/L3 invariants map fully to a slice proof obligation AND an acceptance criterion, with named attributed-STRONG_RED regression tests (e.g. INV-16 → AC18 + Slice 11 "`public-badge-requires-consent` (INV-16, L3) — attributed STRONG_RED at review time; ship-review bundle must include before/after captures"; INV-12/INV-13 → AC14/AC15 + Slice 9 POs; INV-18 → AC7 + Slice 4 `comment-unlinked-parent-rejected`).

**The gap: INV-14 [L2]** (order visibility limited to purchaser + staff) has an acceptance criterion (AC16) and appears in Slice 9's "Invariants touched" and "Tests required," but Slice 9's proof obligations name only "`order-single-charge-idempotent` (INV-12) and `order-no-oversell-concurrent` (INV-13)." No STRONG_RED obligation exists for INV-14, and it is NOT covered by Slice 2's cross-cohort obligation — INV-14 is finer-grained (same-cohort parents must not see each other's orders). No rationale is recorded for the omission, so this is PARTIAL without recorded rationale.

---

## Domain lenses (v2)

**AI-output lens — NOT APPLICABLE.** No generated content; badges are deterministically derived from attendance records (INV-15), not model output.

**Enterprise-agent lens — NOT APPLICABLE.** No LLM answering over permissioned data anywhere in the plan.

**Payment/status lens — APPLICABLE — PARTIAL.**
- Idempotency vs replay: YES — AC14 "replaying/double-submitting the checkout request does not create a second charge."
- Sibling writers / race reasoning: YES — AC15 concurrent last-unit test, plus explicit check-then-act ordering: "Charge attempted only after stock reservation succeeds (no charge-then-oversell window)."
- Stale/superseded-event handling: weakly covered — defensible since the plan commits to synchronous capture (A3), but the processor is unresolved (OQ-04), and if the chosen processor delivers async outcomes/webhooks, nothing in the plan handles stale events.
- **Exact amount/currency/captured-status verification: MISSING.** INV-12 and AC14 verify charge count and success/failure, but nowhere does the plan require that the charge's amount and currency equal the order total, or that the charge is captured (not merely authorized) before `paid`. PARTIAL (does not cap verdict).

**Identity/account-claim lens — APPLICABLE — PARTIAL.**
- Claimed vs verified control: YES — A9 "the hub never accepts a self-asserted linkage," INV-18, and OQ-01 explicitly asks "is the parent link provider-verified or self-asserted at signup?"
- Claiming another's record: YES — AC7 "rejected, even if the parent supplies the athlete's correct name/email."
- Money/PII bound to verified principal: YES — INV-18 covers purchases; Slice 9 lists INV-18.
- **Identifier changed/reassigned after binding: MISSING.** Nothing addresses phone-number reassignment for SMS targets (consent recorded against a number later reassigned to a stranger) or parent↔athlete linkage revocation after orders/consents exist. PARTIAL (does not cap verdict).

---

## VERDICT: NEEDS_REVISION

Close to PASS — Q1–Q6 are YES — but Q7 is PARTIAL without a recorded rationale (rubric: PASS requires "all YES or PARTIAL-with-recorded-rationale"), and the two applicable lenses each have one concrete gap. Revision obligations:

1. **Slice 9:** add an attributed STRONG_RED proof obligation for INV-14 (e.g. `order-visibility-purchaser-only`), or record an explicit rationale for why AC16-as-ordinary-test suffices for an L2 invariant.
2. **INV-12 / AC14 / Slice 9:** add amount + currency + captured-status verification (charge amount equals order total in order currency; status is captured, not authorized) — and fold async/stale-event handling into the OQ-04 resolution if the chosen processor reports asynchronously.
3. **INV-10 / INV-18 follow-through:** state what happens when a bound identifier changes after binding — phone number reassignment vs recorded SMS consent (re-consent on number change), and parent↔athlete linkage revocation while orders/consents/on-behalf comments exist.

---

## Q8 — Pre-registered classes (does not affect verdict)

| Class | Score | Evidence (plan citations) |
|---|---|---|
| MS1 independently buildable slices | **HIT** | implementation-slices.md:8–10 explicit graph; per-slice deps, allowed/forbidden, done criteria (e.g. lines 63, 100, 343); "Slices 5, 6, 10, 12 are mutually independent once 1 and 2 land" |
| MS2 no mega-slices / unrelated mixing | **HIT** | Store schema split from hub schema for OQ reasons (lines 18–19); auth its own slice (57–94); every behavior slice forbids `db/migrations/`. Densest slices (1, 4) remain single-concern (pure schema; one comment-lifecycle surface) |
| MS3 dependency order explicit, acyclic | **HIT** | Line 8–9: "Dependency graph (acyclic): 1 → {3,5,6,8,10}; 2 → {3,4,5,6,9,12}; 3 → 4; 6 → 7; 8 → 9; 10 → 11"; restated per slice; OQ-gates ordered before starts (lines 264, 304, 424) |
| MS4 schema separated from behavior | **HIT** | Slice 1 "No behavior, no routes, no UI" (line 17); Slice 8 "No behavior" (line 304); migrations forbidden in slices 3–7, 9–12 |
| MS5 high-risk ambiguity surfaced pre-implementation | **HIT** | Card payments → OQ-04; under-13 posting → OQ-01 + OQ-05/A4; public minor badges → OQ-03 + L3 escalation + INV-16; cohort scoping → intake interpretation note rejecting UI-only reading + A1 + INV-01 |
| MS6 L2+ invariants → slices + ACs + POs | **PARTIAL** | 12/13 fully mapped with named STRONG_RED obligations; INV-14 [L2] has AC16 + Slice 9 tests (line 366) but is absent from Slice 9's proof obligations (lines 369–372) |
| MS7 outputs feed verified-implementation per slice | **HIT** | Line 6: "One slice = one `verified-implementation` run = one `ship-review`"; per-slice allowed/forbidden lists, proof obligations, ship-review bundle contents (lines 372, 447–449) |
| MS8 high-severity OQs implementation-blocking | **HIT** | open-questions.md:6–7 "High + open blocks implementation of the slices it gates (and plan-lint exits nonzero)"; Slices 7/8/11 "must not start until resolved" (lines 264, 304, 423–424); plan-lint confirms 4 BLOCKED as terminal state |
| MS9 non-goals explicit | **HIT** | N1–N15 incl. the subtle ones: N3 refund flow vs refund policy, N9 attendance capture ("RSVP is intent, not attendance"), N12 COPPA audit boundary |
| MS10 no invented requirements | **HIT** | All additions are constraints with risk citations (INV-10/OQ-02, ConsentRecord/OQ-03) or recorded defaults (OQ-07 coach notification); no new features (N2, N5, N7) |

**Non-HIT category proposal:**
- MS6 → **(1) compiler prompt gap.** The compiler clearly knows the PO discipline (it emitted named STRONG_RED obligations for 12 invariants, including both other Slice-9 invariants), so the INV-14 omission suggests the prompt doesn't force a per-touched-L2-invariant proof-obligation checklist within each slice — an enumerable mechanical check the prompt could mandate.

## Files read

- /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
- /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/multi-slice-team-hub.md
- /tmp/spec-eval/multi/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,implementation-slices,open-questions}.md
