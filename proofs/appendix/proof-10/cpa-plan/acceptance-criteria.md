# Acceptance criteria

## Acceptance criteria

Each criterion is testable as written; INV citations are the invariants it proves.

- AC-1 (INV-7): With capacity 60 and 59 confirmed children, two concurrent registrations of one
  child each result in exactly one acceptance and one capacity rejection; the confirmed count
  never reads 61. A 2-child submission at 59/60 is rejected whole with a clear over-capacity
  message.
- AC-2 (INV-6): A registration submission with an empty or missing typed waiver name is rejected
  and persists nothing; an accepted registration stores the typed name, a server timestamp, and
  the waiver version, and no application endpoint can modify or delete that record.
- AC-3 (INV-3): Every public/unauthenticated route renders none of the four price amounts (and
  no pricing endpoint responds without auth); an authenticated parent sees pricing for a
  `selected` child and sees no pricing for a `registered` or `not_selected` child.
- AC-4 (INV-4, INV-11): Parent A requesting parent B's child, registration, enrollment, or
  payment by direct id (API and page routes) receives a denial (403/404) with no PII in the
  response; unauthenticated requests to any child/family data receive a denial.
- AC-5 (INV-5): Anonymous and parent-authenticated requests to every admin route and admin
  mutation (decide, cohort/session/announcement CRUD, capacity config) are denied; an admin
  identity succeeds.
- AC-6 (INV-8, INV-13): Reversing a selection before payment returns the child to `registered`
  (or `not_selected`) and cancels the pending enrollment; after a succeeded payment, the same
  reversal request is refused and the child remains `enrolled`.
- AC-7 (INV-1, INV-13): Completing the Stripe checkout redirect *without* the webhook leaves
  the enrollment `pending_payment` and the child not `enrolled`; the signature-verified webhook
  (or server-verified session) flips the enrollment to `active` and the child to `enrolled`. A
  webhook with an invalid signature is rejected and changes nothing.
- AC-8 (INV-2): For each (position, plan) pair, the Stripe charge created equals exactly
  $1,200 / $4,000 (QB) or $500 / $1,700 (WR/DB); a request with a tampered client-side amount,
  price, or position field still charges the server-computed amount or is rejected.
- AC-9 (INV-9): Delivering the same Stripe success webhook event twice (and replaying the same
  checkout session) yields exactly one succeeded payment record and one activation; the second
  delivery is acknowledged without side effects.
- AC-10 (INV-10): With the email provider failing (thrown error / timeout simulated), an admin
  selection still commits — the decision, enrollment, and status are persisted — and the email
  failure is logged.
- AC-11 (INV-12): A full-year payment in a non-inaugural cohort yields gear entitlement; a
  per-cohort payment in an inaugural cohort yields gear entitlement; a per-cohort payment in a
  non-inaugural cohort yields no gear entitlement.
- AC-12 (INV-14): A parent of a `selected` (unpaid) child cannot view the cohort schedule or
  announcements; after payment activates the enrollment, the same parent sees that cohort's
  sessions and announcements — and never another cohort's (unless an announcement is global).
- AC-13 (INV-13): Any direct API/mutation attempt to set a child from `registered` to `enrolled`
  or an enrollment from `pending_payment` to `active` without a verified payment is rejected by
  the domain layer (not just hidden in the UI).
- AC-14 (R2, R3): The registration form accepts multiple children in one submission, capturing
  name, birth date, grade, position, school, and gear sizes per child, with one waiver
  signature covering the family's submission.
- AC-15 (R12): On the payment page the parent can toggle between per-cohort and full-year before
  paying, and the created charge matches the plan selected at payment time.
- AC-16 (R16, R17): An admin-created session and announcement for cohort X appear in the portal
  for an active enrollee of cohort X.
