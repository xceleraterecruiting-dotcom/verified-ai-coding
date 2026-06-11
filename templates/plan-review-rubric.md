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

- **AI-output specs** (generated content reaching humans or platforms): did the plan require
  source-backed claims / no-fabrication controls, human approval before publication, dry-run
  before live side effects, and model/prompt-version/run traceability for every output?
- **Enterprise-agent specs** (LLM answering over permissioned data): did the plan require
  pre-context ACL filtering (permissions enforced BEFORE content reaches the model), abstention
  on insufficient evidence, leak validation on outputs, grounded citations, and eval metrics
  whose semantics are stated precisely (e.g. citation-coverage vs groundedness not conflated)?
- **Payment/status specs** (money or state-machine transitions): did the plan require
  idempotency against replay AND sibling writers, exact amount/currency/captured-status
  verification, stale/superseded-event handling, and explicit race/concurrency reasoning for
  every check-then-act sequence?

## Verdict

- **PASS** — a senior engineer would start building from this plan; questions 1–7 all YES or
  PARTIAL-with-recorded-rationale; no NO on questions 1, 3, 4, or 7.
- **NEEDS_REVISION** — fixable gaps; list them as numbered revision obligations.
- **REJECT** — intent lost, ambiguity papered over, or invariants untestable.

Question 8 never changes the verdict (it measures the compiler, not the plan's usability); its
scores are recorded separately in the proof document.
