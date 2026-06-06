# Feature Request

> "When a marketing draft is approved, let it be published. Add the publish step so approved drafts can go out."

## Restated, precisely

Create a `MarketingPublishJob` for a draft **only** when the draft has cleared human review and is not blocked. Specifically, a publish job may be created if and only if:

1. an approval record exists for the draft, **and**
2. `approval.decision ∈ { "approved", "approved_with_edits" }`, **and**
3. `draft.gate_status !== "blocked_until_fixed"`.

Any other state — no approval, a `rejected` approval, or a `blocked_until_fixed` draft — must be refused. No publish job is created.

## Behavior in one sentence

When a publish is requested for a draft, the system creates a `MarketingPublishJob` if the draft is genuinely approved and not blocked, and otherwise refuses.

## Boundary

Enforced in the **publish service** (the function that creates the job) — not in the UI, not in a disabled button, not in client-side validation.

## Out of scope

- Which copy/version gets published (this example concerns *whether* a job is created, not *what* it contains).
- Schema changes, the publisher adapter, UI redesign.
