# XR-orchestration plan — cold plan-review (verbatim)

> Reviewer: fresh-context Claude subagent `a907f1006274b2f19`, 2026-06-11, rubric v2 (AI-output
> and payment/status lenses applied; identity and enterprise-agent lenses judged not applicable —
> the plan itself pre-recorded the identity non-applicability). Inputs: rubric + fixture spec +
> the nine plan documents (listed at end). Verbatim final output follows.

---

All ten documents read. Review follows.

---

## Rubric v1 — Questions 1–7

**Q1. Intent preservation — YES.**
The verbatim spec is reproduced in `spec-intake.md` and every requirement carries a spec citation (e.g. R5: *"it has to cope with seeing the same offers again without flooding my queue with duplicates of drafts it already made"*). Every place the plan strengthens or chooses a reading, an interpretation note records it with the rejected alternative: IN-3 (*"persistent ledger-based idempotency, not a time-window trick... Rejected alternative: last-run-timestamp cursor only"*), IN-4 (*"per-record atomicity, not whole-run transaction"*), IN-6 (*"'weird or partial dates' → never fabricate"*). R12 is the only derived requirement and is explicitly marked *"(Derived from R2 + R6 ... see IN-6.)"*. No silent drift found.

**Q2. No invented requirements — YES.**
The additions are constraints with cited risk rationale, not features: the sanitization invariant (IN-5 grounds it in *"Stored errors render in an internal dashboard"*), the no-fabrication date policy (IN-6: *"a guessed or silently coerced offer date is a publishable falsehood"*), the four-facts input restriction (A8 ties it to the *"compliance posture for content about (often minor) athletes"*). The suppression-list idea is correctly surfaced as OQ-8, not requirement-ified. Slice 4's overlap guard is operational necessity for INV-8, with its scope honestly limited (*"the ledger already guarantees no duplicates; the guard keeps run records coherent"*).

**Q3. High-risk ambiguity surfaced — YES.**
The two BLOCKED high-severity OQs are the right ones. OQ-1 (offer identity + dedupe lifecycle) defines INV-2's predicate and Slice 1's schema — *"building on the wrong key either floods the queue or permanently suppresses legitimate drafts"*. OQ-2 (re-delivery with corrected facts) governs whether *"stale drafts of corrected facts"* reach review, i.e. publishing truthfulness — exactly the ambiguity that must not be guessed. The minors question is handled with an explicit escalation trigger rather than buried: risk-map states *"If OQ-8 reveals an opt-out/consent obligation that must gate draft creation itself ... this classification escalates to L3 and the plan must be re-compiled."* OQ-6 even asks whether the offer reference in errors *"may include the athlete's name or only an ID"* — a private-data nuance most plans miss.

**Q4. Invariants specific and testable — YES.**
All nine are checkable predicates, e.g. INV-2: *"must never auto-create more than one draft, across overlapping runs, retries, process restarts, and feed re-delivery — at-most-once draft creation enforced by a persistent dedupe ledger, not by run timing"*; INV-5 is an explicit allowlist (*"only a sanitized human-readable message, a failure category, an offer reference, and an internal correlation ID"*). No vibes.

**Q5. Slices independently buildable — YES (with recorded rationale).**
Dependencies are explicit and acyclic (*"Slices 1–4 are sequential; Slice 5 depends on 1 and 4 only"*), each slice has allowed/forbidden files, tests, done criteria, and rollback. The placeholder file paths are a real limitation but are honestly flagged with a handoff rule (*"All file paths below are proposed placeholders ... MUST be remapped onto the real repo's layout ... preserving each slice's allowed/forbidden intent"*) — rationale recorded per IN-1/A7.

**Q6. Single-concern slices — YES.**
Slice 1 schema only; Slice 2 pure read-only selection/validation (*"no writes to queue or ledger here"*); Slice 4 run loop + sanitizer; Slice 5 dashboard read-only. Slice 3 combines generation + enqueue + dedupe, but that grouping is forced by INV-3's atomic unit (*"the draft in pending-review state, its offer trace(s), its model-call ID, and the ledger entry"* commit in one transaction) — splitting it would break the invariant.

**Q7. L2 invariants → proof obligations + acceptance criteria — YES.**
Every L2 invariant maps to both: INV-1 → AC-1 + `no-publish-capability` (Slice 3); INV-2 → AC-2 + `ledger-unique-offer-identity` (S1) + `dedupe-at-most-once-concurrent` (S3); INV-3 → AC-3 + `no-partial-draft-on-failure` (S3) + `crash-leaves-no-partials` (S4); INV-4 → AC-4 + `trace-provenance-not-null` (S1) + `provenance-required-to-enqueue` (S3); INV-5 → AC-5 + `run-history-never-leaks` (S4) + `dashboard-renders-allowlist-only` (S5); INV-7 → AC-7 + `date-never-fabricated` (S2); INV-9 → AC-9 + `unverified-never-selected` (S2). All marked *"attributed STRONG_RED required"*. Minor note (non-blocking): INV-9's input-restriction half is a required test in Slice 3 ("payload snapshot contains only the four public facts") but not a named STRONG_RED obligation.

## v2 domain lenses

**AI-output lens — APPLIES. PARTIAL.**
- No-fabrication: strong for facts/dates (INV-7, INV-9, AC-7 *"no draft anywhere contains a date not literally derivable from the source offer"*, AC-9 payload assertion).
- Human approval before publication: fully covered (INV-1, R4, AC-1).
- Dry-run before live side effects: structurally satisfied — the feature has no live side effects by design, plus AC-11 staging pass.
- Traceability: model-call ID + run records (INV-4, INV-8), but prompt-version traceability is not explicit — deferred to *"the engine's existing traceability convention"* (A5). And groundedness of the generated *text* beyond the date (e.g. hallucinated embellishments about a named minor) has no output-side check; it is delegated to the existing pipeline (non-goal) plus the human gate. PARTIAL with this rationale recorded; not a NO, so no cap.

**Payment/status lens — APPLIES (state-machine transitions, no money). YES.**
Idempotency against replay AND sibling writers: INV-2 + Slice 3 (*"ledger check + ledger insert inside the same transaction as the draft — at-most-once under concurrency"*; concurrent two-worker test; S4 overlap-guard test). Stale/superseded-event handling: surfaced as blocking OQ-2 rather than guessed. Check-then-act race reasoning is explicit. Amount/currency: N/A.

**Identity/account-claim lens — NOT APPLICABLE, and the plan proves it considered the lens.**
IN-7: *"no in-scope principal↔resource binding ... Recorded here so silence is not mistaken for omission."* Single-operator queue, upstream verification trusted (A1), dashboard behind existing internal auth (A6). I concur with non-applicability.

**Enterprise-agent lens — NOT APPLICABLE** (no LLM answering over permissioned data).

## VERDICT: **PASS**

Q1–Q7 all YES (Q5 PARTIAL-shaped caveat with recorded rationale); no NO on any applicable lens (AI-output PARTIAL, rationale above). The two BLOCKED high-severity OQs are the correct designed terminal state — a senior engineer can start building the moment OQ-1/OQ-2 are answered, and is structurally prevented from starting before.

## Q8 — Pre-registered ground-truth classes (does not affect verdict)

| Class | Score | Plan-line citations |
|---|---|---|
| O1 — offer-distinguishing dedupe identity, idempotent re-runs | **HIT** | OQ-1 (high, BLOCKED): *"does the feed provide a stable unique offer ID that survives re-delivery, or must we derive a composite key (athlete + offering college + …)"* + lifecycle half (re-draft after reject/delete); INV-2; AC-2 *"exactly one draft per offer identity"* incl. concurrent + restart cases; A2/IN-2 force per-offer drafts so an athlete's multiple offers cannot collapse; Slice 1 PO `ledger-unique-offer-identity`; Slice 3 PO `dedupe-at-most-once-concurrent`. The plan blocks implementation until the identity is answered — it forces the issue. (Caveat: it never names source URL specifically as the distinguishing provenance; the blocked OQ is the forcing function.) |
| O2 — strict date validation, no silent normalization | **HIT** | INV-7 (*"never contain a fabricated, guessed, or silently coerced offer date"*); Slice 2 tests: *"full date, month/year partial, garbage string, impossible date, empty — ... never a coerced default day"*; AC-7 *"unparseable or contradictory"* dates fail the record; PO `date-never-fabricated` STRONG_RED. |
| O3 — no-persist-on-invalid-input | **HIT** | Slice 2 is pure (*"no writes to queue or ledger here"*) so validation failures cannot persist anything; INV-3 + AC-3 fault injection (*"no orphan trace rows or trace-less drafts"*); Slice 3 *"Any failure inside the unit rolls the whole unit back"*; PO `no-partial-draft-on-failure`. |
| O4 — failed runs finalize FAILED with inspectable history | **HIT** | INV-8 (*"Every scheduled run writes exactly one run-history record ... outcome ... including runs that process zero offers"*); domain-model `running --> failed`; AC-8; Slice 4 scope *"open an OrchestrationRun record ... close the run with outcome + counts"* + crash-mid-run test. |
| O5 — stored errors leak no prompt/model/stack internals | **HIT** | INV-5 names *"raw model output"* explicitly; allowlist construction (category/message/offer-ref/correlation-ID only); AC-5 red-team substring injection; Slice 4 `run-history-never-leaks`; Slice 5 defense-in-depth `dashboard-renders-allowlist-only`. |
| O6 — per-draft provenance to offer(s) + model run | **HIT** | INV-4 (*"a draft missing either must never be enqueued"*); AC-4 forces failure when the pipeline returns no model-call ID; Slice 1 not-null columns + `trace-provenance-not-null`; Slice 3 `provenance-required-to-enqueue`. |

No non-HITs, so no gap categories to propose. All six pre-registered classes would have been forced by this plan — O1 via a blocking open question rather than a baked-in answer, which is the compiler's designed behavior for unresolvable identity ambiguity.

## Unscored observations (recorded, not scored)

**(a) Generator-side golden/eval obligations for the drafting step: NO.** The plan declares model pipeline internals a non-goal (*"prompt design, content quality tuning, model selection ... We call its existing interface only"*), and Slice 3's tests cover payload contents, atomicity, dedupe, and provenance — there are no golden-output or eval obligations on the generated draft text itself. The only content-level assertion anywhere is AC-7's date-derivability check. Quality/groundedness of the prose rests entirely on the existing pipeline plus the human gate.

**(b) Per-draft traceability depth: model-call ID only.** INV-4/R10/AC-4 require *"the model-call ID that generated it"* per *"the engine's existing traceability convention"* (A5, to be confirmed at handoff). Model id and prompt version are never explicitly required; whether they ride along depends on what the existing convention's model-call record contains.

## Files read

1. /Users/jorigeck/code/verified-ai-coding/templates/plan-review-rubric.md
2. /Users/jorigeck/code/verified-ai-coding/examples/spec-compiler-fixtures/xr-orchestration-offers.md
3–11. /tmp/spec-eval/xr-orch/{spec-intake,requirements,non-goals,domain-model,invariants,risk-map,acceptance-criteria,implementation-slices,open-questions}.md
