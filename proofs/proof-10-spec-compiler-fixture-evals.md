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

## Auth-tenancy eval — pre-registration (committed BEFORE the compile; classes supplied by the user, synthetic fixture so no contamination concern — registered for goalpost discipline)

- **AT1** tenant isolation: a coach reaches only their school's athletes/data
- **AT2** canonical server-side authorization: one decision point, not scattered route checks
- **AT3** no trust of client-claimed tenant or role
- **AT4** direct-object-reference (IDOR) probes: cross-tenant access by id/API denied and tested
- **AT5** authenticated vs unauthenticated behavior distinguished
- **AT6** role/permission boundaries (coach vs admin; impersonation handled safely)
- **AT7** fail-closed on missing/ambiguous tenant context (the multi-school coach is the fixture's deliberate ambiguity)
- **AT8** ownership/authorization checks at API/service layer, not only UI
- **AT9** audit/logging expectations for denied access *where applicable* (the spec does not ask for it — an absence with recorded reasoning is acceptable)
- **AT10** named tests proving cross-tenant access is denied

## v0.7 payment-depth lens round — pre-registration (committed BEFORE the reruns)

**Change under test:** the payment-depth lens (12 requirements) added to the compiler skill, and
the rubric's payment lens expanded to match (prior reviews ran the shorter wording). Also active
for the first time in any compile: plan-lint rule 6b (per-slice PO mapping, v0.7 item 4).
Nothing else changed. Reruns: **CPA and multi-slice only.**

**Pre-registered expectations:**
- CPA (vs C1–C5): C1 and C2 should move PARTIAL → HIT (webhook-time amount/currency/captured
  verification; session supersession); the reversal-vs-webhook sibling race (round-2 revision
  obligation 3) should now be explicitly serialized; C3/C4/C5 should hold HIT.
- Multi-slice (vs its round-1 gaps): amount/currency/captured verification should appear
  (round-1 payment-lens MISS item); INV-14-class order-visibility PO should now exist — forced
  mechanically by lint 6b regardless of lens.
- Both plans must satisfy lint 6b (per-slice PO references) — first compiles under that rule.

**Overfitting falsifiers (recorded either way):**
- The lens stays silent or explicitly not-applicable on non-payment slices (multi-slice's board/
  files/badges/CSV slices must not acquire payment ceremony).
- No escalation of unrelated identity/auth/content features merely for having "status" or
  "approval" semantics.
- Lens-driven defaults are labeled lens-derived where the spec doesn't state them.

## v0.7 AI-output depth lens round — pre-registration (committed BEFORE the reruns)

**Change under test:** the AI-output depth lens (15 requirements) in the compiler skill; rubric's
AI-output lens expanded to match (prior reviews ran the shorter wording). Reruns: **XR-governance
and XR-orchestration only**, both under lint 6b and all three lenses.

**Pre-registered expectations:**
- XR-governance (vs G1–G9): **G6, G7, G8 should move PARTIAL → HIT** (model/prompt-version
  linkage forced explicitly; a real dry-run render-and-log stage, not a binary flag; generator
  goldens beyond safety canaries). G1–G5, G9 should hold HIT. The autonomy trap must STILL
  surface as a blocking high OQ (or equivalent unmissable gate) — the lens must not absorb it.
- XR-orchestration (vs O1–O6 + two new targets): O1–O6 should hold HIT. New: **AO-a** model id +
  prompt version + run id explicitly required per draft (round-1 observation (b): was
  model-call-ID-only, deferred to "existing convention"); **AO-b** generator-side golden/eval
  obligations exist for the drafting step (round-1 observation (a): none existed).
- Watch item carry-over: reviewers re-adjudicate ambiguity severity (no lens-default absorbing a
  founder-grade question below high).

**Overfitting falsifiers (recorded either way):**
- Lens silent or explicitly not-applicable on non-generation slices (schema, dashboards, run
  loops, retrieval).
- No escalation of static UI/routing work merely for containing text.
- Lens-derived requirements labeled lens-derived.
- No human-approval ceremony on purely internal deterministic transformations without risk
  justification.

## v0.7 evidence-sufficiency lens round — pre-registration (committed BEFORE the rerun)

**Change under test:** the evidence-sufficiency lens (9 requirements under the rule "a claim is
satisfied only when the plan identifies the exact evidence, the decision it supports, the
sufficiency threshold, and what happens when evidence is missing/stale/ambiguous/contradicted")
in the compiler skill + rubric. Rerun: **GroundTruth only** (the fixture that earned it via GT10).

**Pre-registered expectations:**
- **GT10 should move PARTIAL → HIT**: the launch gate must represent INSUFFICIENT_EVIDENCE as an
  explicit state distinct from pass/fail, with sufficiency thresholds (sample size / coverage /
  recency), defaulting to no-go.
- GT1–GT9 should hold HIT (incl. GT6 metric honesty, which the lens deepens rather than replaces).
- The instrument-error requirement should land on the groundedness judge (round-1 OQ-8 asked for
  it; now it must be forced, not asked politely).
- Severity discipline holds (no lens default absorbing a founder question).

**Overfitting falsifiers (recorded either way):**
- Lens silent or explicitly not-applicable on slices without decision gates (schema, retrieval,
  answer path as such).
- No sample-size ceremony imposed on ordinary unit tests or non-decision telemetry.
- Lens-derived requirements labeled lens-derived.
- The dashboard does not become launch-gate bureaucracy for metrics nobody decides on.

## v0.7 AI-output depth lens round — results (2026-06-11; plans + verbatim transcripts in `appendix/proof-10/`)

| Measure | XR-gov r1 | **XR-gov r2 (+ AI-output lens)** | XR-orch r1 | **XR-orch r2 (+ AI-output lens)** |
|---|---|---|---|---|
| Verdict | PASS | **PASS** | PASS | **PASS** |
| AI-output lens | PARTIAL (short wording) | **YES, 15/15 point-by-point** | PARTIAL | **YES, 15/15** (points 12/13 by honest scoping — fixture ends at an internal queue; reviewer judged the scoping legitimate, and the plan stages rollout anyway) |
| Ground truth | 6H/3P/0M | **9/9 HIT** — G6 (model/prompt/run rejected at the persistence layer if missing), G7 (dry-run = full-payload render-and-log with zero-external-call network assertion + per-account audited enablement), G8 (dedicated golden harness with expected-output properties, distinct from canaries) all PARTIAL→HIT as pre-registered | 6H + 2 unscored observations | **8/8 HIT** — AO-a ("A model-call id alone is NOT sufficient unless the call record is specified to contain model id and prompt version" — the deferred-convention weakness closed exactly as instructed), AO-b (dedicated golden + adversarial harness slice, CI-gated) |
| Autonomy trap | held | **held** — NG-1 "this plan does not grant it"; OQ-2 blocking, asks the founder to ratify the approval assumption itself; Slice 9's harness positioned as "evidence, not permission" | n/a | n/a |

**Pre-registered expectations: all met.** Overfitting falsifiers: **clean on both, with the
strongest anti-overfit signals of the series** — explicit evaluated-and-not-triggered lens
dispositions with reasons (payment + identity on both plans), an *unlabeled* spec-derived
invariant where labeling would have been false (orch INV-9), and a declined lens point with
honest scoping (orch #13). The reviewers sought counter-evidence and found none.

**Severity-discipline check (watch item from the payment round):** no lens-default absorbed a
founder-grade question. XR-gov: the approval assumption does NOT absorb OQ-2 — the OQ stays
high/blocking and asks the founder to ratify the assumption. Two recorded observations of a
benign tension shape (medium OQs whose answers would widen an invariant, safe only because the
default is fail-closed exclusion) — same shape, both directions noted, neither a guess.

**New since r1 (both fixtures):** XR-orch r2 escalated minors'/likeness control to a HIGH blocker
(r1 had it medium) and surfaced offer-retraction-after-draft as a new high blocker; XR-gov r2
gained a dedicated dry-run publisher slice and a dedicated generator-harness slice. Compile
friction note: one compile burned its first lint iteration on 22 instances of a single mechanical
class (PO bullets wrapped so INV id and STRONG_RED landed on different physical lines) —
self-corrected, but the single-line PO format is now the recurring formatting cost of rule 6b;
candidate ergonomic fix (multi-line PO blocks) recorded for consideration, not actioned.

**Lens disposition: ACCEPTED** — closed all five pre-registered targets (G6/G7/G8, AO-a/AO-b)
with clean falsifiers on both fixtures that earned it. No release label change (rc1 stands).
v0.7 backlog remaining: evidence-sufficiency lens.

## v0.7 payment-depth lens round — results (2026-06-11; plans + verbatim transcripts in `appendix/proof-10/`)

First compiles under both the payment-depth lens and lint rule 6b (CPA-r3 needed one lint
iteration to satisfy the per-slice single-line STRONG_RED format — the rule self-corrects in the
compile loop, as predicted).

| Measure | CPA r2 (identity lens only) | **CPA r3 (+ payment lens)** | Multi r1 | **Multi r2 (+ payment lens, + lint 6b)** |
|---|---|---|---|---|
| Verdict | NEEDS_REVISION | **PASS** | NEEDS_REVISION | **PASS** |
| Payment lens | PARTIAL (3 gaps) | **YES, 12/12 point-by-point** | PARTIAL (2 gaps) | **YES, 12/12 point-by-point** |
| Ground truth | 3H/2P/0M | **5/5 HIT** (C1, C2 PARTIAL→HIT as pre-registered; C3 in-flight race now serialized + tested both interleavings) | MS6 PARTIAL (INV-14 PO gap) | **P-A…P-E 5/5 HIT** incl. P-B (the INV-14-class PO, lint-forced AND judged substantive, not a checkbox) |

**Pre-registered expectations: all met.** Overfitting falsifiers: **clean on both** — the multi
reviewer verified the lens is scoped "to Slices 8–11 only" with zero payment vocabulary leaking
into board/files/RSVP/badges/CSV slices, no status/approval escalation (counter-evidence sought,
none found), and lens-derived labeling that *discriminates* (spec-backed invariants carry spec
citations; one lens-free default labeled "lens-free, needs confirmation").

**The adversarial adjudication finding (CPA r3 came back lint-GREEN with zero high blockers,
where r2 blocked on money-model questions):** the reviewer judged the fail-closed-assumption
posture mostly legitimate — every adopted default is labeled, carries its rejected reading, and
sits behind a human-confirmed charge; nothing silently resolved. Two real findings survived:
(1) OQ-2 (pricing by registered position vs cohort placement) is graded medium but "changes
charged amounts," violating the plan's OWN severity rule — should be high or founder-confirmed
pre-build; (2) the full-year-entitlement question is absorbed into a non-goal rather than asked.
Q3 = PARTIAL with rationale; two non-blocking founder-confirmation recommendations recorded.
**Watch item (recorded, not actioned):** lens-mandated fail-closed defaults can *absorb* founder
questions that deserve blocking severity — severity grading remains model judgment, and the
rubric's Q3 adjudication is the working check. If this recurs, the candidate fix is a lens
provision ("a lens default may not downgrade a money-model question below high"), not a new tool.

**Residue (recorded):** multi-r2 identity lens PARTIAL — post-binding mutation behavior (DOB
edits, parent↔athlete reassignment, consented-phone reassignment) remains the recurring
identifier-reassignment tail; foldable into OQ-004's resolution. Multi-r2 also surfaced a NEW
high blocker round 1 missed entirely: RSVP-vs-actual-attendance source authority.

**Lens disposition: ACCEPTED** — closed every gap it pre-registered, on both fixtures, with
clean falsifiers. No release label change (rc1 stands; that decision is separate and explicit).

## Multi-slice decomposition eval — pre-registration (committed BEFORE the compile; classes supplied by the user; synthetic fixture, registered for goalpost discipline)

- **MS1** decomposes into independently buildable slices
- **MS2** no mega-slices or unrelated-concern mixing (the fixture deliberately tangles board/files/RSVP+SMS/store/badges/CSV)
- **MS3** dependency order preserved (explicit, acyclic)
- **MS4** schema/data-model work separated from UI/API/workflow work
- **MS5** high-risk ambiguity surfaced before implementation (the fixture embeds: card payments, under-13 posting, badges on a PUBLIC recruiting profile, cohort scoping)
- **MS6** L2+ invariants mapped to slices + acceptance criteria + proof obligations
- **MS7** slice outputs feed verified-implementation one slice at a time
- **MS8** unresolved high-severity questions are implementation-blocking
- **MS9** non-goals explicit
- **MS10** no invented requirements

## Multi-slice decomposition eval — results (2026-06-11; plan + verbatim transcript in `appendix/proof-10/`)

Same protocol (fence held, grammar-read disclosed; lint verified locally).

- **Lint:** structurally clean first pass; BLOCKED on 4 high-severity OQs — under-13
  determination/linkage verification, SMS consent + provider, guardian consent for public minor
  badges, payment processor + refund policy. **Self-escalated L2→L3** on the badge-display path —
  the fixture's buried trap ("badges show on their public recruiting profile" = minors' data on
  public output) — judged honest and correctly scoped per-area by the reviewer ("no
  level-shopping").
- **Decomposition (the eval's focus): excellent.** 12 single-concern slices, explicit acyclic
  graph, schema isolated in two pure-migration slices (store schema split out *because* its shape
  depends on a blocked OQ), authorization as its own single-enforcement-point slice consumed by
  all features, four mutually independent mid-graph slices, per-slice OQ gates.
- **Plan-review verdict: NEEDS_REVISION** — Q1–Q6 YES; Q7 PARTIAL without recorded rationale:
  INV-14 [L2] (order visibility purchaser-only) has an AC and slice tests but no named STRONG_RED
  proof obligation. Both applicable lenses PARTIAL: payment lens again missing amount/currency/
  captured-status verification at grant time; identity lens missing identifier-reassignment-after-
  binding (phone reassignment vs SMS consent).
- **Q8: 9 HIT / 1 PARTIAL / 0 MISS.** MS6 PARTIAL categorized **(1) compiler prompt gap** — with
  a sharper sub-diagnosis from the reviewer: the omission is *mechanically enumerable* (every
  touched L2+ invariant must appear in that slice's proof obligations), i.e. closable as a
  **plan-lint check**, not only a prompt lens. Named candidate: lint rule "L2+ invariant in
  'Invariants touched' ⇒ present in that slice's '### Proof obligations'". Not added this round,
  per scope.

## Release-decision summary (v0.6, all fixtures evaluated)

**Aggregate, post-remediation:** 7 fixtures evaluated (4 real-system + 3 synthetic). Verdicts:
PASS ×4 (XR-governance, GroundTruth, XR-orchestration, auth-tenancy), NEEDS_REVISION ×2 (CPA r2,
multi-slice), proportionate-L0 ×1 (cosmetic). Ground truth: **41 HIT / 9 PARTIAL / 0 MISS** —
the only MISS ever recorded (C4) was closed by the identity lens and verified. Every non-HIT is
categorized; recurrence counts: payment depth ×3 (CPA r1, CPA r2, multi-slice), AI-output
generation depth ×2 (XR-governance, XR-orchestration), evidence-sufficiency ×1 (GroundTruth),
per-invariant PO completeness ×1 (multi-slice, mechanically closable), rubric-only ×1 (AT9),
acceptable limitation ×1 (AT5).

| Option | Assessment |
|---|---|
| 1. v0.6 full release | **Not supportable.** Two NEEDS_REVISION verdicts share one family of causes, and two lens candidates have met the graduation bar without being built. |
| 2. **v0.6-rc1 with documented gaps** | **Recommended.** The planner demonstrably does senior-grade work (blocks the right ambiguities, self-escalates honestly, decomposes cleanly, 0 misses); the residual gaps are named, bounded, recurrence-counted, and have defined fixes. Release notes must list: payment-depth lens (graduated, ×3), AI-output depth lens (graduated, ×2), evidence-sufficiency lens (×1), plan-lint PO-mapping check (mechanical). |
| 3. Hold pending one surgical lens | Defensible but inferior: the top gap (payment depth) would still leave the second graduated lens unbuilt, and the re-eval cycle re-opens the suite for one increment. Better spent as the first v0.7 move. |

**Recommendation: Option 2 — tag `v0.6-rc1`,** with the four named items as the v0.7 work list
(payment-depth lens → re-run CPA + multi-slice; AI-output depth lens → re-run one XR fixture;
evidence-sufficiency lens; plan-lint PO-mapping rule + unit tests).

**RATIFIED by the operator, 2026-06-11: Option 2. Tagged `v0.6-rc1` — a release candidate, not a
full release**, because two evaluated fixtures ended NEEDS_REVISION; supportable as rc1 because
the suite demonstrates senior-grade decomposition (7 fixtures, 41/9/0 post-remediation, every
non-HIT categorized, the only-ever MISS closed by a verified lens that then generalized across
domains, ambiguity blocking and L2/L3 self-escalation working, no autonomous coding added). The
four-item v0.7 backlog above is the documented gap list.

## Auth-tenancy eval — results (2026-06-11; plan + verbatim transcript in `appendix/proof-10/`)

Same protocol (fence held, grammar-read disclosed; lint verified locally).

- **Lint:** structurally clean first pass; BLOCKED on 2 high-severity OQs — evaluation-results
  scope ("own players" vs whole school: the spec's sharpest ambiguity over the most sensitive
  class) and the unknown existing auth stack (correctly noted that stateless JWTs would forbid
  the naive claims-based design). L2, no downgrade, with a regulatory-regime escalation question
  recorded.
- **Plan-review verdict: PASS** — Q1–Q7 all YES; identity lens YES (its third domain: invite-token
  possession is the proof of control, "the binding requires the token, never the bare email";
  email-reassignment surfaced as OQ); payment/status lens applied to the invite/membership state
  machines and YES (double-redemption concurrency, revoke-vs-inflight race defeated by
  live-state-per-request, mid-move fault injection).
- **Q8: 8 HIT / 2 PARTIAL / 0 MISS.** The fixture's deliberate ambiguity (multi-school coach)
  was handled fail-closed per-record (AT7 HIT). Single authorization chokepoint with a
  route-coverage proof and explicit no-second-implementation reuse note (AT2 HIT). IDOR red-team
  enumeration named per endpoint (AT4 HIT).
- **The two PARTIALs:** AT5 (authn-vs-unauthn behavior on data endpoints never gets its own named
  test) — category **(4) acceptable limitation** (no codebase access; behavioral split implied by
  the chokepoint). AT9 (denied-access logging absent without recorded reasoning) — category
  **(2) rubric-only gap, the first of the series**: the class exceeds what the spec asked;
  the plan audited only where it surfaced its own constraint (impersonation). Honest reading:
  AT9 measures the *class list*, not the compiler — synthetic classes can out-demand their own
  fixture.

## XR-orchestration eval round — results (2026-06-11; plan + verbatim transcript in `appendix/proof-10/`)

Same protocol (fence held, grammar-read disclosed; lint verified locally).

- **Lint:** structurally clean first pass; BLOCKED on 2 high-severity OQs — stable dedupe
  identity + lifecycle, and re-delivery with corrected facts. L2 with an explicit, unprompted
  **escalation trigger** recorded ("if OQ-8 reveals an opt-out/consent obligation … escalates to
  L3 and the plan must be re-compiled").
- **Plan-review verdict: PASS.** Payment/status lens applied to the state machine and scored YES
  (ledger insert + draft in one transaction; concurrent-worker and overlap-guard tests; the
  stale/superseded case surfaced as blocking OQ-2 rather than guessed). Identity lens judged NOT
  APPLICABLE — and the plan itself had pre-recorded that non-applicability with reasoning, the
  first negative lens attestation observed. AI-output lens PARTIAL with recorded rationale.
- **Q8: 6 HIT / 6 — zero non-HITs, no categories needed.** All real 1.10b review findings would
  have been forced: dedupe identity via a *blocking* OQ (the compiler's designed behavior for
  unresolvable identity ambiguity), impossible-date rejection with named STRONG_RED, pure
  validation slice making no-persist structural, FAILED-run finalization incl. crash-mid-run,
  error allowlist naming "raw model output" with a red-team substring test, and
  provenance-required-to-enqueue. Reviewer caveat recorded: source URL never named specifically —
  the blocked OQ is the forcing function.
- **Unscored observations (consistent with the governance fixture):** no generator-side
  golden/eval obligations (pipeline internals declared a non-goal); traceability is
  model-call-ID-only, with model id + prompt version deferred to "the engine's existing
  traceability convention."

**Lens-graduation note:** generation-side traceability depth and generator goldens have now
recurred across BOTH AI-output fixtures (G6–G8 partials on governance; observations (a)/(b)
here). The "pattern repeats" bar set by the identity-lens remediation is met — the **AI-output
depth lens** (generation provenance fields named explicitly + generator golden obligations) is
the graduated candidate. Not added this round, per scope.

### Acceptance line (per the amended v0.6 scope)

v0.6 planning layer implemented · CPA full eval complete (+ identity-lens remediation round) ·
XR-governance full eval complete · GroundTruth full eval complete (PASS, 9/1/0) ·
XR-orchestration full eval complete (PASS, 6/6 HIT) · auth-tenancy full eval complete (PASS,
8/2/0) · **multi-slice full eval complete (NEEDS_REVISION, 9/1/0)** · cosmetic light eval
complete · **fixture suite COMPLETE — aggregate 41 HIT / 9 PARTIAL / 0 MISS post-remediation
(PASS ×4: XR-governance, GroundTruth, XR-orchestration, auth-tenancy · NEEDS_REVISION ×2: CPA r2,
multi-slice · proportionate-L0 ×1: cosmetic, light eval) · release decision RATIFIED: tagged
`v0.6-rc1`, NOT full v0.6 — documented gaps = the v0.7 backlog: (1) payment-depth lens, re-prove
on CPA + multi-slice; (2) AI-output depth lens, re-prove on one XR fixture; (3)
evidence-sufficiency lens, re-prove on GroundTruth; (4) plan-lint PO-mapping rule (every touched
L2+ invariant must appear in that slice's proof obligations) + unit tests.**
