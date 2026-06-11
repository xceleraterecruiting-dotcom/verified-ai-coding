# Invariants — team hub

## Invariants

Levels are each invariant's own risk class. Lens-derived invariants (the spec is silent; the
payment-depth or identity lens supplies the default) are marked "(lens-derived)" in the text.

**Cohort isolation and content**

- INV-01 [L2] A principal who is not a member of cohort C must never read or write any hub
  resource of C (posts, comments, files, RSVPs, headcounts, orders, exports); enforcement is a
  single server-side authorization guard, not per-page UI checks.
- INV-02 [L2] A comment whose authoring principal is an athlete with age < 13 at submission
  time must never be accepted, regardless of client behavior (server-side, DOB-based; identity
  authority per OQ-004).
- INV-03 [L2] A comment that fails the profanity filter must never become visible to any
  non-author; it is blocked at submission with a stored reason.
- INV-04 [L2] Every comment report creates a persistent CommentReport record surfaced to that
  cohort's coaches; a report is never silently dropped, and reporting never deletes content
  without a coach action.
- INV-05 [L1] A file upload exceeding 100MB is rejected server-side before storage commit.
- INV-06 [L2] File content (practice plans, film clips of minors) is served only through
  authenticated, cohort-authorized requests; any signed URL expires; no durable public URL ever
  exists for a cohort file.

**Reminders (SMS)**

- INV-07 [L2] A reminder SMS is sent only to a phone number with a recorded SMS consent/opt-in
  (per OQ-003); absent a consent record, the send is skipped and logged — fail closed
  (lens-derived: identity/privacy default).
- INV-08 [L2] At most one reminder is sent per (session, recipient): re-runs, retries, or
  overlapping executions of the morning job are no-ops against the ReminderDispatch record.

**Store and payments (payment-depth lens applies to Slices 8–11 only)**

- INV-09 [L2] The amount and currency owed for an order are computed server-side from the
  canonical Product price list; client-supplied amounts/prices are never trusted (lens-derived).
- INV-10 [L2] An order transitions to `paid` only after grant-time verification that the
  captured amount, currency, and captured (not merely authorized) status on the canonical
  PaymentRecord equal what is owed; missing, null, or unparseable amount/currency/session
  fields refuse the transition — fail closed, never default to success (lens-derived).
- INV-11 [L2] Each order binds to exactly one open canonical payment-session/intent id; a
  superseded session can never mark an order paid (no silent loss, no stale-amount honor), and
  a payment event matching no known order/session is quarantined for manual reconciliation,
  never auto-applied (lens-derived).
- INV-12 [L2] Payment webhook/event processing is idempotent keyed on the provider's durable
  event id: replay of the same event is a no-op (lens-derived).
- INV-13 [L2] A second DISTINCT payment for an already-paid order is detected and alerted as a
  duplicate-payment incident — not absorbed as a replay, not silently refunded (lens-derived).
- INV-14 [L2] Cancellation and payment are serialized via conditional state transitions: an
  order can never end both canceled and silently paid; money arriving for a canceled order
  never activates fulfillment and always emits a refund/manual-reconciliation signal — "logged"
  is not a path (lens-derived).
- INV-15 [L2] Every order/payment state transition writes an AuditEntry with actor, prior
  state, new state, reason, and timestamp, sufficient to reconcile money later (lens-derived).
- INV-16 [L2] An order binds to the authenticated parent principal who is a member of the
  cohort (verified principal, not a typed identifier); order records are visible only to that
  purchaser and the cohort's coaches; fulfillment is recorded against that same principal
  (lens-derived: identity lens + payment-depth #10).

**Badges and export**

- INV-17 [L3] No badge for any athlete renders on a public recruiting profile until the
  minors'-data publication gate is satisfied (guardian consent / policy per OQ-001);
  while OQ-001 is open the public render path is default-deny for every athlete.
- INV-18 [L2] Badge awards derive only from the canonical attendance source (per OQ-002), and
  no underlying attendance detail (dates, locations, streak history) is exposed publicly — at
  most the badge itself.
- INV-19 [L2] The attendance CSV export is available only to coaches of the cohort and contains
  only that cohort's data.
- INV-20 [L1] CSV export fields are escaped so no cell can execute as a spreadsheet formula
  (CSV-injection safe).
