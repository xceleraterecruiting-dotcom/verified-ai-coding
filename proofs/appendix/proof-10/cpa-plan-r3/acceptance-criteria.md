# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV id.

Registration & capacity:

- AC-1 (INV-1): With the cap set to N and N kids registered, a further registration attempt is
  rejected with a "full" response and persists nothing. With N−1 registered, two concurrent
  submissions of one kid each result in exactly one success — never N+1 kids.
- AC-2 (INV-2): Submitting a registration without waiver acceptance persists no kid; a
  successful registration's waiver record stores typed name, server timestamp, and waiver text
  version, and cannot be mutated afterward.
- AC-3 (R1): A family can register 1..k kids in one submission, each with name, birth date,
  grade, position, school, and gear sizes.

Identity & access:

- AC-4 (INV-4): A portal account whose provider email is unverified — or verified but different
  from the registration's parent email — sees no registration data and gets no binding; after
  provider verification of the matching email, the binding appears. An admin relink writes an
  audit record.
- AC-5 (INV-3): Account A (bound to family A) requesting kid data of family B by id receives a
  403/404 and no PII fields; anonymous requests to portal APIs receive no PII.
- AC-6 (INV-17): Every admin route/mutation rejects anonymous and parent-role principals
  (verified by an enumerated route-table test), and accepts an admin-role principal.

Decisions:

- AC-7 (R4, R5): An admin can mark a kid selected with a cohort + skill tier, which creates an
  enrollment in `awaiting_payment`; marking not-selected creates none.
- AC-8 (INV-5): Reversing a selection while unpaid withdraws the enrollment; attempting reversal
  after activation is rejected. In a simulated race (reversal and payment verification
  interleaved), the final state is either withdrawn+reconciliation-case or active — never
  active-after-reversal without a reconciliation case, and never both-applied silently.
- AC-9 (INV-18): With the email transport forced to fail, the selection decision still commits,
  the enrollment exists, and the failure is visible to admins.

Pricing & payment sessions:

- AC-10 (INV-6): Owed amounts are exactly: QB-cohort $1,200, QB-year $4,000, WR/DB-cohort $500,
  WR/DB-year $1,700 (USD), derived from the enrollment's cohort position + chosen plan; a
  request carrying a tampered client amount or plan/price pair is ignored or rejected — the
  session is created at the server-computed amount only.
- AC-11 (INV-15): Crawling all public routes and APIs yields no price strings or plan amounts; a
  bound account with no selected kid sees no prices; after selection the portal shows the two
  plan prices for that kid's position before payment.
- AC-12 (INV-8): Switching plan at payment time creates a new session and marks the prior one
  superseded; at most one open session per enrollment exists at any time. A Stripe completion
  event for the superseded session activates nothing and opens a reconciliation case.

Payment verification & activation:

- AC-13 (INV-7): A completion event whose captured amount, currency, or paid status mismatches
  the owed amount activates nothing and opens a reconciliation case; a matching event activates
  the enrollment.
- AC-14 (INV-9): Delivering the same Stripe event id twice produces one activation, one audit
  trail, and no duplicate reconciliation case on the replay.
- AC-15 (INV-10): A second, distinct successful payment for an already-active enrollment opens
  a refund-needed reconciliation case and does not alter the enrollment.
- AC-16 (INV-11): A payment completing for a withdrawn enrollment leaves it withdrawn and opens
  a reconciliation case naming the Stripe payment identifiers.
- AC-17 (INV-12): Every money-captured-but-not-activated path in AC-12/13/15/16 produces a
  persisted reconciliation case visible in the admin area — not only a log line.
- AC-18 (INV-13): Webhook payloads with missing/null/unparseable session id, amount, currency,
  status, or enrollment reference — or a bad signature — refuse activation and return a
  non-success outcome; no code path defaults to activation.
- AC-19 (INV-19): An activated enrollment records which verified portal account it was granted
  under; activation is refused when no verified binding exists for the enrollment's
  registration.
- AC-20 (INV-14): For a scripted flow (select → reverse → re-select → pay), the audit trail
  contains one record per transition with actor, prior state, new state, and timestamp.

Enrolled experience:

- AC-21 (INV-16): Schedule and announcements for cohort C are readable by an account with an
  active enrollment in C and by admins; an account with only `awaiting_payment` or a different
  cohort's enrollment gets none.
- AC-22 (R12): Full-year enrollments and all inaugural-cohort enrollments carry the gear
  entitlement flag; per-cohort non-inaugural enrollments do not.
- AC-23 (R14, R15): Admin-created sessions and announcements for a cohort appear in the portal
  of an actively enrolled kid in that cohort.
