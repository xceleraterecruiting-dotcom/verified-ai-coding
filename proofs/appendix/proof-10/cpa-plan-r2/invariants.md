# Invariants

## Invariants

Format: `- INV-<id> [L<level>] <testable predicate>`. Levels are the invariant's own risk class.

### Money

- INV-1 [L2] The amount charged is always computed server-side from the enrollment's (position, plan) pair via the server-held price book (QB 120000/400000; WR/DB 50000/170000 cents); no client-supplied amount, price id, or plan string a client controls can change the charged amount.
- INV-2 [L2] An enrollment transitions to enrolled only after server-side verification of a successful Stripe payment for that enrollment (signature-verified webhook or equivalent server-confirmed retrieval); a browser redirect/return URL alone must never cause the enrolled transition.
- INV-10 [L2] A payment can complete enrollment only for an enrollment currently in pending_payment; a succeeded payment for a revoked or already-enrolled enrollment must never auto-enroll and must be flagged for admin reconciliation.
- INV-12 [L2] Stripe webhook handling verifies the Stripe signature and is idempotent per event id: replaying any webhook event must never double-enroll a kid or record a duplicate payment.

### Privacy / pricing visibility

- INV-3 [L2] No price amount from the price book is ever rendered in, or served to, an unauthenticated request; a family sees pricing only when authenticated and only for a kid of theirs whose status is selected (pending payment).
- INV-11 [L2] An athlete's PII (name, birth date, grade, school, gear sizes) is never returned to public/unauthenticated requests and never to an authenticated account bound to a different family; only the kid's own family and admins can read it.

### Identity / access

- INV-4 [L2] A portal account is bound to a family only when the account's provider-verified email equals the registration's parent email, or an admin explicitly links them; a merely typed/unverified email must never grant access to a family's kids, statuses, or payment ability.
- INV-9 [L2] Selection decisions, cohort/session/announcement management, and admin lists are executable only by accounts holding the admin role; a parent account must never be able to invoke them, regardless of URL or request crafting.

### Status transitions

- INV-5 [L2] A decision is re-decidable (selected ↔ not_selected) only while the kid's enrollment has no succeeded payment; reversing a selection voids the pending enrollment so it can no longer be paid; a paid enrollment is never silently deleted or altered by a re-decision attempt.
- INV-6 [L2] A registration is accepted only if the evaluation event is open and under capacity at commit time, enforced atomically so that concurrent submissions can never push accepted kid-count above capacity.
- INV-7 [L2] A registration exists only with a completed waiver record (typed signer name, timestamp, waiver version) committed with it; no waiver, no registration.

### Operational

- INV-8 [L1] Selection-decision persistence never depends on email delivery: the decision commits first, the notification is sent asynchronously, and a send failure leaves the decision intact and is logged for admin follow-up.
