# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV id.

### Registration (public)

1. A family can submit one registration containing parent info and 2 kids with all required
   per-kid fields; both kids appear in the admin registration list afterward.
2. Submitting without a typed waiver name is rejected and nothing is persisted; a successful
   submission stores the waiver signer name, timestamp, and waiver version alongside the
   registration (INV-7).
3. With capacity 60 and 59 kids accepted, a 2-kid family submission is refused in full (or
   explicitly and atomically reduced per a documented rule — slice must pick one and test it);
   accepted kid-count never exceeds 60 (INV-6).
4. Two concurrent submissions racing for the last remaining spot result in exactly one accepted
   kid; the loser gets a clear "event full" outcome — proven with a concurrency test (INV-6).
5. When the event is full or closed, the public form refuses new submissions with an "it's full"
   message.
6. No public page or unauthenticated API response contains any price-book amount ($1,200 /
   $4,000 / $500 / $1,700 or cent equivalents) (INV-3), nor any athlete PII (INV-11).

### Accounts and access

7. A portal account whose provider-verified email matches a registration's parent email sees that
   family's kids; an account with the same email merely typed/unverified (or a different email)
   sees no kids and gets no payment ability (INV-4).
8. An authenticated parent requesting another family's kid (by id, list filtering, or API
   crafting) receives a not-found/denied response and no PII (INV-11).
9. A parent account invoking any admin operation (decide, manage cohorts/sessions/announcements)
   by direct URL or API call is denied; an admin-role account succeeds (INV-9).

### Selection and reversal

10. Admin marks a kid selected with cohort + skill tier: an enrollment in pending_payment is
    created, and the kid's portal status becomes "selected — payment due".
11. Admin reverses a selection before payment: the enrollment becomes revoked, the portal shows
    the kid as no longer selected, and any attempt to start payment for it fails (INV-5, INV-10).
12. After a kid's payment has succeeded, attempting to re-decide that kid is refused with an
    explanatory message and the paid enrollment is untouched (INV-5).
13. With the email provider forced to fail, marking a kid selected still commits the decision;
    the failure is logged/visible for follow-up, and no rollback occurs (INV-8).
14. A selection with a working email provider sends the parent a "selected — log in and pay"
    email exactly once.

### Pricing and payment

15. A signed-in parent of a selected QB sees exactly $1,200 (per-cohort) and $4,000 (full-year);
    for a selected WR or DB, exactly $500 and $1,700; before selection, no pricing is visible
    even when authenticated (INV-3).
16. For each (position, plan) pair, the Stripe charge amount created server-side equals the
    price book value; a tampered client request (altered amount, plan, price id, or another
    kid's enrollment id) cannot change the amount or target (INV-1).
17. Returning to the success URL without a completed payment (e.g., crafting the redirect) does
    not enroll the kid; status remains pending_payment (INV-2).
18. A webhook with an invalid Stripe signature is rejected and changes nothing (INV-12).
19. A valid success webhook for a pending_payment enrollment marks it enrolled and records the
    payment exactly once; replaying the same event id changes nothing further (INV-2, INV-12).
20. A valid success webhook for a revoked enrollment does not enroll it; it records the payment
    as requiring admin reconciliation and surfaces it to admins (INV-10).
21. The plan chosen at payment time (per-cohort vs full-year) is recorded on the enrollment, and
    full-year enrollments carry the gear entitlement flag; inaugural-cohort enrollments carry it
    regardless of plan.

### Enrolled experience and admin management

22. After (and only after) enrollment, the parent portal shows the kid's cohort schedule
    (sessions) and that cohort's announcements; a pending_payment family does not see them.
23. Admin can create/edit cohorts, add/edit/remove sessions, and post announcements; changes
    appear in the affected enrolled families' portals (INV-9 covers the access side).
24. Schedule and announcement content is never readable by unauthenticated requests or by
    families with no enrolled kid in that cohort (INV-11 scoping discipline applied to cohort
    content).
