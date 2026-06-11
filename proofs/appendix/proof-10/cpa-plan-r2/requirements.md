# Requirements

## Requirements

Traceability: spec paragraph 1 = "Families register…", P2 = "After evaluation day…", P3 =
"Parents sign in…", P4 = "Once paid…", P5 = "Stack-wise…".

1. **Public registration (P1).** The public site lets a family register for the free evaluation
   day: parent contact info, one or more kids per family, each kid with name, birth date, grade,
   position, school, and gear sizes.
2. **Typed-name waiver (P1).** Registration requires the parent to sign a liability waiver by
   typing their name; the signed waiver (name, timestamp, waiver text/version) is stored with the
   registration.
3. **Hard capacity cap (P1).** The evaluation event has a capacity (~60 kids, configurable —
   A2/OQ-4). When full, further registrations are refused, including under concurrent
   submissions ("when it's full it's full").
4. **Admin review and decision (P2).** Admins list registrations and decide each kid: selected or
   not selected.
5. **Selection creates enrollment (P2).** Selecting a kid places them into a training cohort with
   a skill tier and creates their enrollment in a pending-payment state.
6. **Selection email, best-effort (P2, P5).** On selection, the parent gets an email saying the
   kid was selected and to log in and pay. Email failure must not block or undo the selection.
7. **Reversible decisions before payment (P2).** Admins can change a decision (either direction)
   any time before payment completes; reversing a selection removes/voids the pending enrollment.
   Post-payment behavior is undefined in the spec (OQ-1, blocking).
8. **Parent portal with email-based accounts (P3, P5).** Parents sign in via the hosted auth
   provider and see their own kids' statuses. Account↔family binding requires verified email
   control (A1).
9. **Position- and plan-based pricing (P3).** QB: $1,200 per 6-week cohort or $4,000 full-year
   upfront; WR/DB: $500 per cohort or $1,700 full-year. Prices live server-side only (A3, A4).
10. **Plan choice at payment time (P3).** The parent chooses per-cohort or full-year on the
    payment screen, before paying. (Full-year operational scope: OQ-2, blocking.)
11. **Gear entitlement (P3).** Full-year plan includes gear; every kid in the inaugural cohort
    gets gear regardless of plan. Recorded as an entitlement flag (A9).
12. **Private pricing (P3).** No prices anywhere on the public site. A family sees pricing only
    in the authenticated portal, only after their kid is selected, before paying.
13. **Card payment via Stripe (P3, P5).** Parents pay online by card through Stripe; the amount
    charged is computed server-side from position + plan.
14. **Payment completes enrollment (P4).** A verified successful payment transitions the kid to
    enrolled. The transition is driven by Stripe's server-side confirmation, not the browser.
15. **Enrolled portal content (P4).** Enrolled families see the kid's cohort training schedule
    and posted announcements in the portal.
16. **Admin management area (P4).** Admins manage cohorts, sessions, and announcements.
17. **Stack (P5).** Next.js + Postgres; Stripe for payments; hosted auth provider for portal
    accounts.
18. **Admin access control (implied by P2/P4).** Decision-making and cohort/session/announcement
    management are admin-only operations (A10).
19. **Minors' data privacy (implied by P1/P3).** Kids' PII (name, birth date, grade, school,
    sizes) is visible only to the kid's own family in the portal and to admins — never on public
    pages, never to other families.
