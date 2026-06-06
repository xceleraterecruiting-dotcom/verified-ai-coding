# Baseline (Flawed)

This is the implementation a fast AI pass produces. It is credible precisely because it's the obvious shortcut: it confuses "an approval exists" with "this was approved."

## The flawed guard

```js
// flawed baseline
if (!approval) {
  throw new Error("Approval required");
}
return createPublishJob({
  draftId: draft.id,
  status: "queued",
});
```

## Review observation

This checks approval **existence**, but not `approval.decision`, and not `draft.gate_status`. Concretely:

- A **rejected** approval (`approval.decision === "rejected"`) is still a truthy `approval`, so the guard passes and **a publish job is created** for content a human rejected.
- A **blocked** draft (`draft.gate_status === "blocked_until_fixed"`) is never inspected, so **a publish job is created** for content that is explicitly blocked.

Both violate the MUST NEVER. The UI may disable the publish button in these states, but **a disabled button is not a safety boundary** — anything that reaches this service (a retry, a direct call, a different client, a race) gets a job created.

## Invariants at stake

- **MUST NEVER** create a publish job when `approval.decision` is not `approved` / `approved_with_edits`.
- **MUST NEVER** create a publish job when `draft.gate_status === "blocked_until_fixed"`.
- **MUST ALWAYS** create the job for a genuinely approved, unblocked draft.

The guard enforces none of the first two.
