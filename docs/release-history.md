# Release history (detailed)

The engineering-notebook version. The README carries the one-line-per-release summary; this file
carries the full changelog with eval scores and falsifier discipline. Authoritative eval records
live in [`../proofs/proof-10-spec-compiler-fixture-evals.md`](../proofs/proof-10-spec-compiler-fixture-evals.md).

## v0.7.0 — decision-grade planning (tagged `v0.7.0`; supersedes `v0.6-rc1`)

The release where the spec compiler got materially better at saying *"show me the mechanism, show
me the evidence, show me who decides, show me what blocks launch — and do not confuse a passing
test with permission to act."* Four items, each pre-registered before its eval, re-proven on the
fixture(s) that earned it, and accepted on falsifier-checked evidence:

1. **plan-lint proof-obligation mapping rule** (mechanical) — every L2+ invariant a slice
   touches needs a named STRONG_RED proof obligation in that slice (or an explicit
   not-applicable rationale). Promoted from a reviewer-caught gap; retroactively catches both
   PO gaps human reviewers had found by hand.
2. **Payment-depth lens** (12 requirements) — grant-time amount/currency/captured verification,
   session supersession, reversal-vs-payment race serialization, money-moved-but-state-rejects
   reconciliation, fail-closed payment data, money-state audit. Re-proven: CPA r3 PASS 5/5,
   multi-slice r2 PASS 5/5.
3. **AI-output depth lens** (15 requirements) — per-generation model/prompt-version/run capture,
   claim provenance, no-fabrication by verification not instruction, generator goldens +
   adversarial cases, safe decline, leak-safe surfaces, structured-output validation, L2+ human
   approval, dry-run-first as a render-and-log stage, minors/likeness checks, end-to-end audit.
   Re-proven: XR-governance r2 PASS 9/9, XR-orchestration r2 PASS 8/8.
4. **Evidence-sufficiency lens** (9 requirements) — a claim is satisfied only when the plan
   names the exact evidence, the decision it supports, the sufficiency threshold, and the
   behavior when evidence is missing/stale/ambiguous/contradicted. Launch gates carry an
   explicit **PASS / FAIL / INSUFFICIENT_EVIDENCE** trichotomy defaulting to no-go; judged
   metrics require instrument calibration before they gate anything. Re-proven: GroundTruth r2
   PASS 11/11 — "we launch when the numbers look good" became a blocking question ("what are the
   numbers, and who signs?").

Every fixture that ever scored NEEDS_REVISION has been re-proven PASS under the deeper rubric;
every lens round recorded overfitting falsifiers (lens-scoping, no escalation-for-vocabulary,
discriminating lens-derived labels) and all came back clean. Known non-blocking ergonomic issue:
the per-slice PO single-line format causes mechanical first-iteration lint failures that compiles
self-correct (multi-line PO support is a recorded candidate). **Frozen backlog, deliberately
untouched:** failure-class library, enforced reviewer isolation, cross-vendor review, runtime
smoke.

## v0.6 — spec → verified implementation planning (tagged `v0.6-rc1`; superseded by v0.7.0)

The spec-compiler skill, plan-lint structural gate, plan-review rubric, and seven planning
fixtures across three real systems plus three synthetic sanity checks — see
[`fixture-domains.md`](fixture-domains.md) (CPA: money/status; XR Marketing: AI-output governance
+ orchestration idempotency; GroundTruth: enterprise-agent trust boundaries; plus auth,
multi-slice, cosmetic). Released as **rc1, deliberately not a full release**: at tag time two
fixtures stood at NEEDS_REVISION and two lenses had earned candidacy without being built. The
full fixture suite was completed during the v0.7 cycle (final pre-v0.7 aggregate: 41 HIT /
9 PARTIAL / 0 MISS post-remediation, every non-HIT categorized), and the rc1 gap list became the
v0.7 work list — which is what an honest release candidate is for.

## v0.5 — evidence-backed review harness (tagged `v0.5-review-harness`, frozen)

make-bundle (hashed evidence bundles), regression-check (STRONG_RED / WEAK_RED_COMPILE
discrimination taxonomy with attributed mutation specs), risk-leveled ship-review, proofs 01–09,
and the Charleston Passing Academy case study — a real payments app taken from "all tests green"
to 9 confirmed invariant violations to mechanically provable fixes.
