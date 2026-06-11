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

### GroundTruth fixture (`groundtruth-enterprise-agent.md`) — from the real system's audit (excluded from the fixture); registered 2026-06-11 BEFORE any compile of this fixture

- **GT1** pre-context ACL filtering: permissions enforced BEFORE content reaches the model, not post-hoc
- **GT2** permission-safe retrieval: the retrieval layer itself is permission-scoped
- **GT3** leak validation on outputs
- **GT4** abstention when evidence is insufficient (no confident wrong answers)
- **GT5** grounded citations: claims cite sources the asker can access
- **GT6** metric honesty: citation-coverage vs groundedness not conflated (the real audit's MEDIUM: docs said "grounded citation," code counted "claim has a citation")
- **GT7** ACL semantic ambiguity surfaced: per-source permission metadata (e.g. a roles field) whose semantics the access check might not honor (the real audit's allowedRoles-vs-canAccess finding)
- **GT8** orphan/unknown-permission documents default-deny
- **GT9** negative controls / red-team threat modes in the eval plan
- **GT10** launch gates distinguish PASS from "not enough evidence"

### Deployment-context classes — registered, DEFERRED to v0.7 pre-deploy layer

- **XD1** behind-main/branch-drift risk, **XD2** additive-only schema verification, **XD3** prod-guard verification (from XR's real pre-deploy gate run). Deploy-time evidence, not planning-time extraction; recorded so the deferral is a decision, not an omission.

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

## Results (2026-06-11 round) — **overall verdict: PARTIAL DOGFOOD, not a full v0.6 release**

All compiles and reviews by fresh-context agents under a contamination fence (each listed its
files read; no breach). Lint outputs re-verified locally by the builder. Both full evals ran
**rubric v1** (questions 1–8); the v2 domain lenses were added after these runs and apply to
subsequent evals. Verbatim agent outputs in `appendix/proof-10/`.

| Fixture | Status | Lint | Plan-review | Q8 ground truth |
|---|---|---|---|---|
| xr-marketing-governance | **FULL EVAL COMPLETE** | structurally clean; 3 BLOCKED high-sev OQs (designed terminal state — the autonomy trap, minors' photo rights, middle-schooler exposure) | **PASS** (Q6 PARTIAL: one slice mixes schema+UI+generation; recorded as suggestion) | **6 HIT / 3 PARTIAL / 0 MISS** — partials: G6 model/prompt-version linkage not forced, G7 no dry-run stage (only a binary flag), G8 safety-canary harness yes but no generator goldens |
| cpa-payments | **FULL EVAL COMPLETE** | structurally clean; 2 BLOCKED high-sev OQs (full-year entitlement, renewal flow — genuine spec gaps) | **NEEDS_REVISION** — 3 obligations: (1) verified-email linking invariant, (2) attribute INV-11 to a named proof, (3) close the cancelled-enrollment payment window explicitly. Revision not yet performed. | **1 HIT / 3 PARTIAL / 1 MISS** — HIT: C5 capacity race (concurrency test demanded). MISS: **C4 verified-email account-claim — the same class the real portal review found as blocker B4.** Partials: C1 (replay idempotent, superseded-session loss unhandled), C2 (amount-at-creation forced; received-event amount/currency not re-checked — currency appears nowhere), C3 (state machine forbids it; no checkout-refusal test, no in-flight race handling) |
| cosmetic-landing-refresh | **LIGHT EVAL COMPLETE** | GREEN, L0, 2 slices, 1,885 words | not run (light) | **P1 HIT in full** — proportionate, and the plan surfaced `prefers-reduced-motion` for the carousel unprompted (assumption A4 + Slice 2), the exact class of the landing-page blocker |
| xr-orchestration-offers | committed, **EVAL PENDING** | — | — | O1–O6 pre-registered |
| groundtruth-enterprise-agent | committed, **EVAL PENDING** | — | — | GT1–GT10 pre-registered |
| auth-coach-portal | committed, **EVAL PENDING** | — | — | no pre-registered classes (synthetic) |
| multi-slice-team-hub | committed, **EVAL PENDING** | — | — | decomposition rubric only |

### What the round established

1. **The blocking guardrail works end to end.** Both L2+ fixtures terminated in lint-BLOCKED on
   exactly the ambiguities that belong to the user; neither compile agent papered them to force
   green; both plan-reviews judged them the *right* questions. The XR autonomy trap was surfaced,
   not granted.
2. **The eval discriminates plan quality — including against its own compiler.** The CPA plan
   missed C4 (verified-email account-claim), the same class the real money-path review caught as
   B4; the reviewer's independent revision obligations converged on the same gaps as the Q8
   misses (obligation 1 ↔ C4; obligation 3 ↔ C1/C3 residue). A planner that recurrently misses
   account-claim and stale-session classes is exactly what the rubric's v2 payment lens and a
   future failure-class library should compensate for.
3. **Proportionality holds at L0.** No invented ceremony, and a real prior finding class
   (reduced-motion) surfaced anyway.
4. **Known open items:** CPA plan revision not performed; four fixture evals pending; rubric v2
   lenses unexercised; the planner's recurring weak spots (generation-side traceability on XR,
   session-lifecycle/verification depth on CPA) are now documented planning-blind-spot candidates
   for the deferred failure-class library.

## Remediation round — pre-registration (committed BEFORE the re-run)

**Change under test:** the identity & account-claim lens added to the spec-compiler skill and the
rubric (general claimed-vs-verified-control language; no CPA/B4-specific wording — checked by
grep before commit). Nothing else about the compiler changed.

**Plan:** re-run ONLY the CPA fixture (fresh-context compile with the updated skill → plan-lint →
cold plan-review on rubric **v2 including all domain lenses, their first exercise** → Q8 scoring
vs the same C1–C5).

**Pre-registered expectations:** C4 should move MISS → HIT via the lens. C5 should stay HIT.
C1–C3 may improve via the v2 payment lens being visible to the *reviewer* (not the compiler — the
payment lens was deliberately NOT added to the compiler skill this round) — no expectation set.
**Overfitting check (explicit):** the reviewer must judge whether the new lens caused invented
requirements, inflated risk levels, or ceremony where no binding exists; rubric Q2 is the
falsifier. Verdict may be PASS or NEEDS_REVISION — recorded either way.

## Remediation round — results (2026-06-11; verbatim transcript + plan in `appendix/proof-10/`)

Fresh-context compile with the lens-updated skill (agent disclosed one extra read beyond the
fence: `plan-lint.mjs` itself, for the enforced grammar — no answer-key content; accepted and
recorded). Lint verified locally: structurally clean, BLOCKED on 2 high-severity money OQs
(post-payment reversal/refunds; full-year scope) — right questions again. Cold plan-review ran
**rubric v2 with both applicable domain lenses — their first exercise.**

| Measure | v1 plan (first round) | r2 plan (with identity lens) |
|---|---|---|
| Verdict | NEEDS_REVISION (identity gap + INV-11 attribution) | **NEEDS_REVISION** — but for different, narrower reasons: 3 payment-path obligations confined to Slice 7/invariants/ACs |
| Identity lens | n/a (v1 rubric) | **YES** — all four lens elements addressed (INV-4 verified-email binding + named STRONG_RED test, AC 7/8 claim-refusal, A1 verified-principal default, OQ-3 identifier recycling) |
| Payment lens | n/a | PARTIAL — webhook-time amount/currency/captured verification, session supersession, and the reversal↔webhook sibling-writer race are absent with no recorded rationale |
| **C4 (the remediation target)** | **MISS** | **HIT** — pre-registered expectation met |
| C3 reversal closes payment window | PARTIAL | **HIT** (INV-5/INV-10, AC 20, in-flight webhook test) — improvement not pre-registered; noted, not claimed as lens-caused |
| C5 capacity race | HIT | HIT (expectation met) |
| C1 session lifecycle / C2 amount verification | PARTIAL / PARTIAL | PARTIAL / PARTIAL — expected: the payment lens was deliberately added only to the *rubric* this round, so the reviewer demands what the compiler doesn't yet plan; closing this is the obvious next surgical lens if the pattern repeats |
| Q8 line | 1 HIT / 3 PARTIAL / 1 MISS | **3 HIT / 2 PARTIAL / 0 MISS** |

**Overfitting check (pre-registered falsifier): CLEAN.** The reviewer found the lens applied only
where real bindings exist; the lens-driven default was provenance-labeled in the plan itself
("lens default, not spec text"); the waiver's typed name was correctly NOT inflated into
e-signature identity ceremony; risk-map argued *against* escalation to L3. No invented
requirements.

**Honest residue:** verdict is still NEEDS_REVISION; the un-lensed payment-planning gaps (C1/C2)
persist exactly where no compiler lens exists. The remediation closed what it pre-registered and
nothing it didn't — which is the intended behavior of a surgical lens, and the cleanest evidence
yet that lens-per-blind-spot works without overfitting.

## GroundTruth eval round — results (2026-06-11; plan + verbatim transcript in `appendix/proof-10/`)

Same protocol: fresh-context compile (fence held; one permitted grammar-read of plan-lint.mjs
disclosed) → lint (verified locally) → cold plan-review on rubric v2 → GT1–GT10 scoring.

- **Lint:** structurally clean first pass; BLOCKED on 3 high-severity OQs — per-source ACL field
  semantics, identity source of truth, revocation staleness. The compiler **self-escalated
  L2→L3**, with quoted justification the reviewer judged honest (MNPI existence-suppression,
  heterogeneous ACL metadata, dashboard-as-compliance-artifact).
- **Plan-review verdict: PASS** (Q7 PARTIAL with recorded rationale — INV-11 lacks a named
  STRONG_RED artifact; non-blocking revision recommendation). Enterprise-agent lens: YES on all
  five elements. Identity lens: judged applicable to principal↔entitlement binding and YES —
  evidence the lens generalizes beyond account-claiming (forged client-supplied role claims
  refused; "verified control required" invoked in OQ-2).
- **Q8: 9 HIT / 1 PARTIAL / 0 MISS.** Both classes derived from the real audit's actual findings
  were caught: **GT7 HIT** (OQ-1 names the exact ambiguous field and blocks on it) and **GT6 HIT**
  (INV-9 pins numerators/denominators; "a decline can never increment the grounded numerator";
  groundedness defined as supported-by, not citation-presence).
- **The PARTIAL: GT10** — launch gates don't represent an "insufficient evidence" state (sample
  size / coverage floor) distinct from good numbers. **Category: (1) compiler prompt gap** —
  the named candidate for the next surgical lens *if the pattern repeats on another fixture*
  ("evidence-sufficiency lens": any plan whose launch/ship decision consumes metrics must state
  the conditions under which the metrics themselves are insufficient evidence). Not added this
  round, per scope.
- **Unscored observation (not pre-registered, recorded only):** citation-id hallucination in
  structured output is covered (out-of-set citations rejected pre-send); general
  malformed-model-response fallback (degrade to decline, never pass through) is not — a
  hardening note for any real implementation.

## Cross-fixture pattern (three full evals in)

Misses/partials by category so far: compiler prompt gaps = identity/account-claim (closed by
lens, verified), payment-depth C1/C2 (open, candidate lens), evidence-sufficiency GT10 (open,
candidate lens), generation-side traceability G6–G8 (open, candidate AI-output lens depth).
Rubric-only gaps = none yet. Fixture ambiguity = none claimed. The recurring shape — each domain
has one or two named planning blind spots, closable by surgical lenses without overfitting — is
the failure-class library's design brief, accumulating evidence before it gets built.

### Acceptance line (per the amended v0.6 scope)

v0.6 planning layer implemented · CPA full eval complete (+ identity-lens remediation round) ·
XR-governance full eval complete · **GroundTruth full eval complete (PASS, 9/1/0)** · cosmetic
light eval complete · XR-orchestration fixture committed/eval pending · auth fixture pending ·
multi-slice fixture pending · **overall: PARTIAL DOGFOOD** (three of four real-system fixtures
fully evaluated; synthetic decomposition/auth sanity checks outstanding).
