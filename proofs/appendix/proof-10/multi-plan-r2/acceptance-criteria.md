# Acceptance criteria — team hub

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV id.

**Cohort isolation**

- AC-1 (INV-01): An authenticated member of cohort A requesting any cohort-B hub resource
  (post list, comment, file metadata, file content, RSVP, headcount, order, CSV export) by
  direct id/URL receives 403/404 — verified per resource type, not just per page.
- AC-2 (INV-01): An unauthenticated request to any hub endpoint is rejected.

**Message board**

- AC-3: A coach of cohort C can create a post; a parent of C sees it; a parent of another
  cohort cannot (INV-01).
- AC-4 (INV-02): A comment submission whose principal is an athlete with DOB < 13 years ago is
  rejected server-side even when the request is crafted directly against the API (UI bypass).
- AC-5 (INV-02): The same athlete's parent CAN comment on the same post.
- AC-6 (INV-03): A comment containing a term on the profanity list is rejected at submission,
  stored with a blocked reason, and is never returned by any read endpoint for another user.
- AC-7 (INV-04): Pressing report on a visible comment creates a persistent CommentReport;
  the cohort's coaches see it in a moderation view; the comment is not deleted by the report
  alone; filing the same report twice does not drop either record.

**File area**

- AC-8 (INV-05): A 100MB+1 byte upload is rejected server-side; a 99MB upload succeeds.
- AC-9 (INV-06): File content is unreachable without an authenticated cohort-authorized
  request; a captured signed URL stops working after its expiry; no route returns a
  non-expiring public URL.

**RSVP and reminders**

- AC-10: A parent can RSVP yes/no for their athlete per session; the coach headcount equals
  the count of yes responses (INV-01 scoping verified).
- AC-11 (INV-07): A recipient without a recorded SMS consent receives no text; the skip is
  logged with reason. (Blocked until OQ-003 resolves.)
- AC-12 (INV-08): Running the morning reminder job twice for the same session produces exactly
  one ReminderDispatch per recipient and exactly one provider send call.

**Store and payments**

- AC-13 (INV-09): An order created with a tampered client-side price still totals to the
  server-side canonical price; the client-supplied amount is ignored or rejected.
- AC-14 (INV-10): A webhook reporting captured amount ≠ owed amount (or wrong currency, or
  authorized-but-not-captured) does NOT mark the order paid; the order remains pending with an
  alert. A webhook with missing/null amount or session fields likewise refuses activation.
- AC-15 (INV-11): When a new payment session supersedes an old one, a payment completing on the
  superseded session does not mark the order paid at the stale amount and is routed to
  reconciliation; a payment event matching no known order is quarantined, not applied.
- AC-16 (INV-12): Delivering the identical provider event (same durable event id) twice
  changes nothing the second time — same order state, no second audit transition.
- AC-17 (INV-13): A second DISTINCT successful payment (different payment id) against an
  already-paid order raises a duplicate-payment alert and does not alter fulfillment state.
- AC-18 (INV-14): Interleaving cancel and payment-success in both orders ends in a consistent
  terminal state: either canceled + refund/reconciliation signal emitted, or paid — never
  canceled-and-silently-paid, never fulfillment for a canceled order.
- AC-19 (INV-15): Every transition in AC-13..AC-18 produced an AuditEntry with actor, prior
  state, new state, reason, timestamp.
- AC-20 (INV-16): An order is created only by an authenticated parent member of the cohort;
  another parent cannot read it; the cohort coach can; fulfillment records the purchaser.

**Badges and export**

- AC-21 (INV-17): With the publication gate unsatisfied (the OQ-001 default), no badge markup
  or data appears in the public profile response for ANY athlete — verified on the rendered
  public page and any public API.
- AC-22 (INV-18): Badge awards change only when the canonical attendance source changes; no
  public endpoint exposes attendance dates/history — at most badge type and earned status,
  and only post-gate.
- AC-23 (INV-19): A coach of cohort C exports CSV containing exactly cohort C's rows; a parent
  or athlete requesting the export endpoint gets 403; a coach of cohort D gets no C rows.
- AC-24 (INV-20): Exported cells beginning with `=`, `+`, `-`, `@` are escaped per CSV-injection
  guidance.
