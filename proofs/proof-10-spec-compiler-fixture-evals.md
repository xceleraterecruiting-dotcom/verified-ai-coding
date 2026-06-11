# Proof 10 — Spec-compiler fixture evals (v0.6)

**Claim under test:** given a realistic founder-voice spec, the `spec-compiler` skill produces a
lint-green, review-passing plan that surfaces the invariants, risk level, ambiguities, and slice
boundaries a senior engineer would demand — including the invariant classes that later reviews of
the real systems proved matter.

**Contamination handling:** the builder knows the ground truth for the CPA and XR fixtures (it
ran or read those reviews). Mitigations: fixtures are paraphrased from product-intent text only,
explicitly excluding the answer-key sections (CPA README "Security properties"; XR operating
contract laws/invariants; XR 1.10b findings); compilation and scoring run in **fresh contexts**;
ground-truth classes are pre-registered here **before any compile runs**; the plan-review rubric
(`templates/plan-review-rubric.md`) was committed before any eval.

## Pre-registered ground-truth classes

Scoring: HIT (a plan invariant/OQ/constraint would have forced the issue to be handled),
PARTIAL (adjacent but would not have forced it), MISS. Scored by the cold plan-reviewer with
cited plan lines. **No pass threshold is pre-set** — the eval records, it does not grade on a
curve. Rubric Q8 scores never change the plan-review verdict.

### CPA payments fixture (`cpa-payments.md`) — from real blockers B1–B5 (proof-08 fixture history)

- **C1** payment-session lifecycle: a superseded/duplicate checkout session must not silently lose or double-capture money
- **C2** payment verification before granting: amount/currency/captured-status checked against what is owed
- **C3** decision reversal closes the payment window (reversed kid's family must not be able to pay/activate)
- **C4** portal account linking requires verified email (account-claim of minors' data)
- **C5** capacity check-and-insert serialized (read-then-write race)

### XR marketing-governance fixture (`xr-marketing-governance.md`) — from the XR operating contract (excluded from the fixture)

- **G1** every public claim source-backed; no fabricated stats/quotes
- **G2** private/internal data (internal evals, coach notes, contact info) can never reach public copy
- **G3** minors/likeness: athlete photos & info require rights/consent constraints
- **G4** no autonomous publishing: the spec's hands-off ask is surfaced as a high-severity decision / human-approval constraint, NOT granted
- **G5** deterministic safety gate whose block an LLM judgment cannot override
- **G6** traceability: every draft links model, prompt version, and run
- **G7** dry-run publisher before any live platform call, behind explicit enablement
- **G8** golden/eval cases as the AI layer's regression harness
- **G9** measurement/learning loop explicitly deferred (named non-goal) until publish outcomes exist

### XR orchestration fixture (`xr-orchestration-offers.md`) — from the real 1.10b review findings (excluded from the fixture)

- **O1** idempotent re-processing with offer-distinguishing dedupe identity (multiple offers per athlete must not collapse)
- **O2** strict timestamp/date validation — no silent normalization of invalid dates
- **O3** no-persist-on-invalid-input (failed validation leaves no partial artifacts)
- **O4** failed runs finalize FAILED with inspectable run history, not merely an HTTP error
- **O5** stored/user-visible errors leak no prompt/model/stack internals
- **O6** per-draft provenance to source offers and the model run

### Cosmetic fixture (`cosmetic-landing-refresh.md`) — proportionality check

- **P1** classified L0/L1, small plan, no invented ceremony; ideally notes the auto-rotating
  carousel's reduced-motion concern (a real prior finding class) without inflating the level.

## Eval plan (pre-registered)

| Fixture | This round | Pipeline |
|---|---|---|
| xr-marketing-governance | **FULL** | fresh-context compile → plan-lint → cold plan-review (rubric) + Q8 scoring vs G1–G9 |
| cpa-payments | **FULL** | same, vs C1–C5 |
| cosmetic-landing-refresh | LIGHT | fresh-context compile → plan-lint → proportionality check vs P1 |
| xr-orchestration-offers | PENDING | committed with ground truth; eval in a later round |
| auth-coach-portal | PENDING | no pre-registered classes (synthetic); rubric-only when run |
| multi-slice-team-hub | PENDING | decomposition-focused rubric review when run |

Falsifiers: a lint-red plan; a plan-review REJECT; scoring that cannot cite plan lines; any
fixture whose compile agent reads beyond the fixture + skill (contamination breach).

## Results

(appended after the runs)
