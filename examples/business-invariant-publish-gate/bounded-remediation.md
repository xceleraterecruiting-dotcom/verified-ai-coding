# Bounded Remediation

Triggered by the FAIL. This is the only write step. Fix **only** the two blockers, with a regression test for each, in the smallest patch possible.

## Bounds

- **Allowed files:** the publish service + its tests.
- **Forbidden:** schema changes, UI redesign, publisher adapter changes, any unrelated refactor.
- **One regression test per blocker**, failing on the baseline, passing after the fix.
- **No silent fixing** of anything else discovered — report as a follow-up.

## Step 1 — Regression tests (written first)

```js
// publish-service.test.js  (regression tests for the two blockers)

test("rejected approval does NOT create a publish job", async () => {
  const approval = { decision: "rejected" };
  const draft = { id: "d1", gate_status: "clean" };
  await expect(requestPublish({ draft, approval }))
    .rejects.toThrow("Approved approval required");
  expect(createPublishJob).not.toHaveBeenCalled();
});

test("blocked_until_fixed draft does NOT create a publish job", async () => {
  const approval = { decision: "approved" };
  const draft = { id: "d2", gate_status: "blocked_until_fixed" };
  await expect(requestPublish({ draft, approval }))
    .rejects.toThrow("Blocked draft cannot create publish job");
  expect(createPublishJob).not.toHaveBeenCalled();
});

// guardrail that the fix is not too strict:
test("approved_with_edits on a clean draft DOES create a publish job", async () => {
  const approval = { decision: "approved_with_edits" };
  const draft = { id: "d3", gate_status: "clean" };
  await requestPublish({ draft, approval });
  expect(createPublishJob).toHaveBeenCalledWith({ draftId: "d3", status: "queued" });
});
```

## Step 2 — Minimal service-layer patch

```js
// corrected guard (publish service)
if (!approval || !["approved", "approved_with_edits"].includes(approval.decision)) {
  throw new Error("Approved approval required");
}
if (draft.gate_status === "blocked_until_fixed") {
  throw new Error("Blocked draft cannot create publish job");
}
return createPublishJob({
  draftId: draft.id,
  status: "queued",
});
```

The invariant now lives **below the UI**, in the service guard, exactly where the boundary belongs.

## Step 3 — Confirm proofs

- Case 2 (rejected approval) → reject ✓
- Case 3 (blocked draft) → reject ✓
- Cases 1, 4, 5 → unchanged and correct ✓

## Follow-ups (noticed, NOT fixed here)

- Consider logging every refused publish attempt with its reason, to satisfy the Observability dimension. Out of scope for these two blockers — raise as a separate change.
