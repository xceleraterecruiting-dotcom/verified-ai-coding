# Ship / No-Ship Scorecard — FAILED (preserved)

This is the scorecard for the flawed baseline. It is kept on purpose. **DO NOT SHIP.**

## Feature

- **Feature:** Marketing publish gate (`MarketingPublishJob` creation)
- **Diff / PR:** baseline publish-service guard
- **Reviewer model used:** cold reviewer (model-agnostic; pluggable)
- **Date:** (build time)

## Dimensions

| Dimension | Verdict | Evidence |
|---|---|---|
| **Behavior** | **FAIL** | Creates a publish job for rejected approvals and blocked drafts — outside the contract. |
| **Safety** | **FAIL** | Invariant is not enforced below the UI. Guard checks only `!approval`; never reads `approval.decision` or `draft.gate_status`. |
| **Tests** | **FAIL** | No tests assert refusal for rejected/blocked states. The invariants are unproven. |
| **Redteam** | **FAIL** | Case 2 (rejected approval) and Case 3 (blocked draft) both create a publish job. Required: reject. |
| **Observability** | **FAIL** | Refused attempts are not logged; a violation would be invisible in production. |

## Blockers (proof obligations)

1. **Rejected approval creates a publish job.**
   - *Why it matters:* content a human rejected gets published.
   - *Required proof:* redteam Case 2 returns reject; a regression test asserts no job is created when `decision !== approved/approved_with_edits`.
   - *Minimal allowed fix:* extend the guard to check `approval.decision`.
   - *Allowed files:* publish service + its tests.
   - *Forbidden:* schema changes, UI redesign, publisher adapter changes, unrelated refactors.

2. **Blocked draft creates a publish job.**
   - *Why it matters:* content explicitly blocked for fixes still goes out.
   - *Required proof:* redteam Case 3 returns reject; a regression test asserts no job when `draft.gate_status === "blocked_until_fixed"`.
   - *Minimal allowed fix:* add a `gate_status` check to the guard.
   - *Allowed files:* publish service + its tests.
   - *Forbidden:* same as above.

## Decision

**DO NOT SHIP.** Run bounded remediation against the two blockers, re-run gates, re-review.
