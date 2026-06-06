# Ship / No-Ship Scorecard — FINAL

After bounded remediation. This passes **only** because the invariant is now enforced below the UI and all five redteam cases behave correctly. Nothing here passed by assertion — each row points at a proof.

## Feature

- **Feature:** Marketing publish gate (`MarketingPublishJob` creation)
- **Diff / PR:** publish-service guard + regression tests (remediated)
- **Reviewer model used:** cold reviewer (model-agnostic; pluggable)
- **Date:** (build time)

## Dimensions

| Dimension | Verdict | Evidence |
|---|---|---|
| **Behavior** | **PASS** | Creates a job iff `decision ∈ {approved, approved_with_edits}` and draft not `blocked_until_fixed`; refuses otherwise. |
| **Safety** | **PASS** | Invariant enforced in the service guard — below the UI. Guard reads `approval.decision` and `draft.gate_status`. |
| **Tests** | **PASS** | Two regression tests (rejected, blocked) assert no job; one guardrail test asserts `approved_with_edits` still publishes. All green. |
| **Redteam** | **PASS** | All five cases behave: 1 reject, 2 reject, 3 reject, 4 allow, 5 allow. |
| **Observability** | **NEEDS_REVIEW → follow-up** | Refusal logging not yet added; tracked as a non-blocking follow-up, not a ship blocker for this invariant. |

## Blockers

None open. Both original blockers (rejected approval, blocked draft) are closed with passing regression tests.

## Decision

**SHIP** — for the approval/publish-gating invariant. The two violations that caused the original FAIL are proven fixed below the UI. The observability improvement is logged as a follow-up, per the no-silent-scope-creep rule.

---

*The path here — FAIL → proof obligations → bounded fix → re-proof → PASS — is the product. The green column means something precisely because the red one came first.*
