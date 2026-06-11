# Requirements

## Requirements

Traceability: spec paragraph references are to the verbatim spec in `spec-intake.md`
(P1 = "We run a youth football…", P2 = "Families register…", P3 = "After evaluation day…",
P4 = "Parents sign in…", P5 = "Once paid…", P6 = "Stack-wise…").

- R1. The public site offers registration for a free evaluation day with no authentication
  required to register. (P2)
- R2. A registration captures parent info and one or more children per family; each child record
  includes name, birth date, grade, position (QB / receiver / defensive back), school, and gear
  sizes. (P1, P2)
- R3. A registration requires a liability waiver signed by the parent typing their name; the
  signature (name + timestamp + waiver version) is stored with the registration. (P2)
- R4. Evaluation-day capacity is a hard cap (default 60 children, admin-configurable); once
  reached, further registrations are rejected — no waitlist. (P2, A2)
- R5. Admins can review all registrations and decide each child: selected or not selected. (P3)
- R6. Selecting a child requires choosing a training cohort and a skill tier, and creates an
  enrollment in a pending-payment state. (P3)
- R7. On selection, the system sends the parent a best-effort email saying the child was selected
  and to log in and pay; email failure must not block or roll back the decision. (P3, P6)
- R8. Admin decisions (selected / not selected) are reversible while no successful payment exists
  for the child's enrollment. (P3)
- R9. Parents sign in to a portal using email-based accounts backed by a hosted auth provider.
  (P4, P6)
- R10. The portal shows a parent the status of each of their children (and only their own
  children). (P4)
- R11. Pricing is position- and plan-based: QB $1,200 per 6-week cohort or $4,000 full-year;
  receiver/DB $500 per cohort or $1,700 full-year. (P4)
- R12. The parent chooses between per-cohort and full-year at payment time (switchable until
  payment). (P4)
- R13. Pricing is never shown on the public site; it is shown in the authenticated portal only
  for a child who has been selected, before payment. (P4)
- R14. Parents pay online by card via Stripe; a verified successful payment activates the
  child's enrollment. (P4, P5, P6)
- R15. Gear entitlement: full-year plan includes gear; every child enrolled in an inaugural
  cohort gets gear regardless of plan. The entitlement is recorded so admins can see who gets
  gear (gear sizes already captured at registration, R2). (P4, P2)
- R16. Once enrolled (paid), the portal shows the child's cohort training schedule and
  announcements. (P5)
- R17. Admins manage cohorts, sessions (the training schedule), and announcements in an
  admin-only area. (P5)
- R18. Stack: Next.js + Postgres, Stripe for payments, hosted auth provider for portal accounts.
  (P6)
- R19. Child and family personal data is accessible only to that family's authenticated parent
  and to admins — never publicly. (implied by P2 data collection + P4 portal scoping; surfaced
  constraint, see risk-map.md)
