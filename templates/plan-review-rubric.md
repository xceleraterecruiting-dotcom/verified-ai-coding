# Plan-review rubric (pre-registered)

Cold review of a spec-compiler output (the nine planning documents), performed by a fresh-context
reviewer that did not compile the plan. This rubric is committed BEFORE any fixture eval runs —
same discipline as pre-registered mutation expectations — so the reviewer cannot move goalposts.

The reviewer answers each question with **YES / PARTIAL / NO** plus cited evidence (quote the
plan's own lines). The plan-lint structural gate is assumed green before this review; do not
re-litigate structure.

## Questions

1. **Intent preservation.** Did the compiler preserve the user's intent? Compare `spec-intake.md`'s
   verbatim spec against the paraphrase and `requirements.md` — flag any requirement that drifted,
   weakened, or strengthened without an interpretation note.
2. **No invented requirements.** Did it invent requirements the spec never asked for? (Surfacing a
   *constraint* with a cited risk rationale is allowed; inventing *features* is not.)
3. **High-risk ambiguity surfaced.** Is every ambiguity that touches money, auth, private data,
   minors, publishing, or state transitions either an explicit assumption or an open question —
   and are the dangerous ones marked high-severity rather than silently resolved by guess?
4. **Invariants specific and testable.** Is each invariant a checkable predicate ("a draft whose
   gate_status is blocked can never reach the publisher") rather than a vibe ("handle content
   safely")?
5. **Slices independently buildable.** Could a competent engineer build slice N with only the
   plan, without slice N+1 existing? Are dependencies explicit and acyclic?
6. **Single-concern slices.** Does any slice mix unrelated concerns (e.g. schema + UI + publisher
   in one slice)?
7. **Level 2+ invariants → proof obligations.** Does every L2/L3 invariant map to at least one
   slice's proof obligations AND at least one acceptance criterion, concretely enough that
   ship-review could later demand a STRONG_RED for it?
8. **Would this plan have caught the known fixture blockers?** (Only for fixtures with
   pre-registered ground-truth classes — score each class HIT / PARTIAL / MISS with the plan
   line(s) that would have caught it, or state plainly that nothing would have.)

## Domain lenses (v2 — added 2026-06-11, AFTER the first CPA/XR-governance evals, which ran v1 questions 1–8 only; lenses apply to subsequent evals)

When the spec matches a domain below, additionally answer that lens's question with
YES/PARTIAL/NO + evidence. A NO on an applicable lens caps the verdict at NEEDS_REVISION.

- **AI-output depth** (expanded 2026-06-11 from the shorter AI-output wording — reviews before
  that date ran the shorter version; generated content reaching humans or external systems):
  did the plan address ALL of — (1) model id, (2) prompt version, and (3) run/trace id captured
  per generation; (4) source facts captured; (5) claim-level provenance; (6) no-fabrication
  enforced by verification, not instruction; (7) generator-side golden cases (safety canaries
  alone don't count); (8) generator-side adversarial cases; (9) safe decline when source facts
  are insufficient; (10) no raw-output/prompt/stack leakage to user-visible surfaces;
  (11) structured-output validation with safe degradation; (12) human approval before public
  publish at L2+; (13) dry-run-first (a render-and-log stage, not a binary flag);
  (14) minors/likeness/rights checks for outputs referencing real people; (15) an audit trail
  tying output → source facts → prompt version → model run → approval?
- **Enterprise-agent specs** (LLM answering over permissioned data): did the plan require
  pre-context ACL filtering (permissions enforced BEFORE content reaches the model), abstention
  on insufficient evidence, leak validation on outputs, grounded citations, and eval metrics
  whose semantics are stated precisely (e.g. citation-coverage vs groundedness not conflated)?
- **Payment-depth** (expanded 2026-06-11 from the shorter payment/status wording — reviews
  before that date ran the shorter version; money, paid entitlements, or charge-like transfers):
  did the plan address ALL of — (1) owed amount/currency computed server-side; (2) captured
  amount/currency/captured-status verified against owed BEFORE granting; (3) a canonical
  payment↔domain identifier with defined miss behavior; (4) stale/superseded-session rules (no
  silent loss, no stale-amount honor); (5) event idempotency on a durable id; (6) duplicate
  distinct payments detected and alerted, not absorbed; (7) defined outcome for payment after
  cancel/reversal; (8) explicit serialization of the reversal-vs-payment sibling-writer race;
  (9) a refund/manual-reconciliation signal whenever money moves but state rejects activation;
  (10) paid entitlement bound to a verified principal; (11) fail-closed on missing/ambiguous
  payment data; (12) auditability of money-state transitions?
- **Evidence-sufficiency** (added 2026-06-11 after the GroundTruth eval's GT10 PARTIAL; applies
  wherever a consequential decision — launch, enablement, automated action, compliance
  attestation — consumes metrics/evals/reviews): did the plan map each decision to its exact
  evidence artifacts; pin each metric's semantics including what it cannot show (no proxy
  substitution); set sufficiency thresholds (sample size, coverage, recency); represent
  INSUFFICIENT_EVIDENCE as an explicit state distinct from pass/fail, defaulting to no-go; define
  staleness invalidation and contradiction blocking; require evidence provenance/reproducibility;
  characterize instrument error where a judge gates decisions; and include negative controls
  proving the evidence system can fail?
- **Identity/account-claim bindings** (added 2026-06-11 after the first CPA eval, whose plan
  missed this class; applies to any user↔resource binding in any domain): did the plan
  distinguish *claimed* identifiers from *verified control* — stating what proves the principal
  controls the binding identifier, whether someone can claim another's pending/paid/existing
  record, whether money/PII bind to a verified principal, and what happens when the identifier is
  changed or reassigned after binding?

## Verdict

- **PASS** — a senior engineer would start building from this plan; questions 1–7 all YES or
  PARTIAL-with-recorded-rationale; no NO on questions 1, 3, 4, or 7.
- **NEEDS_REVISION** — fixable gaps; list them as numbered revision obligations.
- **REJECT** — intent lost, ambiguity papered over, or invariants untestable.

Question 8 never changes the verdict (it measures the compiler, not the plan's usability); its
scores are recorded separately in the proof document.
