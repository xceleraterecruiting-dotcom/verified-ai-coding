# Example: Business-Invariant Publish Gate

This example is built **backwards from a failure**, on purpose. The failure is the asset. A verification loop that never fails proves nothing — so here you can watch the workflow catch a real, credible bug that a fast AI implementation would actually write.

## The invariant

A `MarketingPublishJob` may only be created if **all** hold:

1. a human approval exists, **and**
2. `approval.decision` is `approved` or `approved_with_edits`, **and**
3. `draft.gate_status` is not `blocked_until_fixed`.

Rejected, blocked, or unapproved drafts must **never** create a publish job.

## The failure

A fast implementation checks whether an approval *exists* — and stops there. It never checks `approval.decision`, and never checks `draft.gate_status`. So:

- a **rejected** approval still creates a publish job, and
- a **blocked** draft still creates a publish job.

The button in the UI might be disabled for these cases — but **a disabled button is not a safety boundary**. The boundary is the service guard, and the service guard is wrong.

## How to read this folder, in order

1. [`feature-request.md`](feature-request.md) — what was asked for.
2. [`baseline-fail.md`](baseline-fail.md) — the actual flawed guard and the review observation.
3. [`redteam-cases.md`](redteam-cases.md) — the five bypass cases.
4. [`failed-scorecard.md`](failed-scorecard.md) — the FAIL verdict, preserved.
5. [`bounded-remediation.md`](bounded-remediation.md) — the bounded fix: regression tests + minimal service-layer patch.
6. [`final-scorecard.md`](final-scorecard.md) — passes only after the invariant is enforced below the UI and all five cases behave.

The lesson: the loop earned its keep at step 4. If you only kept the green final scorecard, you'd have thrown away the proof that the workflow works.
