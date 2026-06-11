# Invariants

## Invariants

- INV-1 [L2] An enrollment must never become `active` (and a child must never show `enrolled`)
  without a successful Stripe payment for that enrollment verified server-side via a
  signature-checked webhook or server-verified session; a client-side success redirect alone
  must never activate anything.
- INV-2 [L2] The charged amount is always computed server-side from the child's position and the
  chosen plan using the single pricing source (QB: $1,200 cohort / $4,000 full-year; WR/DB:
  $500 cohort / $1,700 full-year); a client-supplied amount, price, or position must never be
  trusted in payment creation.
- INV-3 [L2] No price (any of the four amounts or derived pricing) is ever rendered on a public
  or unauthenticated route; pricing is shown only to an authenticated parent, and only for a
  child of theirs whose status is `selected` or later.
- INV-4 [L2] A parent can only read or act on their own family's children, registrations,
  enrollments, and payments; any cross-family access by id must always be denied server-side.
- INV-5 [L2] Every admin capability (decisions, cohort/session/announcement management, capacity
  configuration) must always require an authenticated admin identity; parents and anonymous
  users must never reach it.
- INV-6 [L2] A registration must never be accepted without a waiver signature (non-empty typed
  parent name) stored with timestamp and waiver version; a stored waiver signature must never be
  mutated or deleted by application code.
- INV-7 [L2] The number of confirmed registered children must never exceed the evaluation
  event's capacity, including under concurrent registration submissions; a submission that
  would exceed it is rejected whole (no partial-family acceptance without explicit rejection of
  the overflow being surfaced to the user).
- INV-8 [L2] A selected/not-selected decision is reversible only while the child's enrollment
  has no succeeded payment; once a payment has succeeded, the decision-reversal path must
  always refuse.
- INV-9 [L2] Payment handling is idempotent: a duplicate Stripe webhook delivery or repeated
  completion of the same checkout must never produce more than one succeeded payment record or
  more than one activation for the same enrollment.
- INV-10 [L2] A failure to send the selection email must never block, fail, or roll back the
  selection decision itself (best-effort email).
- INV-11 [L2] Child and parent PII (child name, birth date, grade, school, gear sizes; parent
  contact info) must never be exposed on a public/unauthenticated route, in client-visible
  payloads of public pages, or to another family's parent.
- INV-12 [L1] Gear entitlement is true exactly when the paid plan is full-year or the
  enrollment's cohort is flagged inaugural; it is never computed any other way.
- INV-13 [L2] Child status and enrollment state changes follow only the transitions defined in
  `domain-model.md`; in particular `registered → enrolled` (skipping selection/payment) and
  `pending_payment → active` without a verified payment must never occur via any code path or
  API.
- INV-14 [L2] Cohort training schedules and announcements are visible to a parent only for a
  child whose enrollment in that cohort is `active` (paid); pending-payment and not-selected
  families must never see this content.
