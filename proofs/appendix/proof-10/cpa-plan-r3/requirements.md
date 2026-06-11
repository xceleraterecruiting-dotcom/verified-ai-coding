# Requirements

## Requirements

Each requirement cites the spec language that forces it.

- R1: Public registration flow captures parent info plus one or more kids per family — name,
  birth date, grade, position, school, gear sizes. ("Families register for a free evaluation day
  through the public site — parent info, one or more kids per family…")
- R2: Registration requires a liability waiver the parent signs by typing their name; the
  acceptance (typed name, timestamp, waiver text version) is stored. ("…a liability waiver the
  parent signs by typing their name.")
- R3: The evaluation event is capped at a configurable number of kids (~60); when full,
  registration closes — no overflow, no waitlist. ("The inaugural evaluation is capped (around
  60 kids) and when it's full it's full.")
- R4: Admins review registrations and mark each kid selected or not selected. ("we (the admins)
  go through the registrations and decide each kid: selected or not selected.")
- R5: Selecting a kid places them into a training cohort with a skill tier and creates an
  enrollment in an awaiting-payment state. ("Selecting a kid means placing them into a training
  cohort with a skill tier, and that creates their enrollment.")
- R6: Selection triggers a best-effort email telling the parent to log in and pay; email failure
  must not block or roll back the decision. ("The parent gets an email… Email notifications can
  be best-effort at launch (if email is down, selection should still work…).")
- R7: Decisions are reversible while the enrollment is unpaid; reversal withdraws the enrollment.
  ("We sometimes change our minds before payment happens, so decisions need to be reversible.")
- R8: Parents sign in to a portal using email-based accounts on a hosted auth provider and see
  each of their kids' statuses. ("Parents sign in to a portal (email-based accounts), see their
  kids' status…")
- R9: Parents pay online by card via Stripe. ("…and pay online by card." / "Stripe for
  payments")
- R10: Pricing is position- and plan-dependent: QB $1,200 per 6-week cohort or $4,000 full year;
  receivers/DBs $500 per cohort or $1,700 full year. Amounts are computed server-side.
  ("Pricing depends on position and plan: QBs are $1,200 per 6-week cohort or $4,000 for the
  full year upfront; receivers and DBs are $500 per cohort or $1,700 full-year.")
- R11: At payment time, the parent can switch between per-cohort and full-year before paying.
  ("Parents can switch between per-cohort and full-year at payment time.")
- R12: Gear entitlement is recorded: full-year plans include gear, and every inaugural-cohort
  enrollment gets gear regardless of plan. ("Full-year includes gear; everyone in the inaugural
  cohort gets gear regardless.")
- R13: No pricing appears on the public site; prices are visible in the portal only after the
  kid is selected and before payment. ("Don't show prices on the public site — families see
  pricing in the portal after their kid is selected, before paying.")
- R14: Once payment is verified, the enrollment is active and the portal shows the kid's cohort
  training schedule and announcements. ("Once paid, the kid is enrolled: the portal shows their
  cohort's training schedule and any announcements we post.")
- R15: Admins manage cohorts, training sessions, and announcements in an admin area restricted
  to admin principals. ("We manage cohorts, sessions, and announcements in an admin area.")
- R16: The system is built on Next.js + Postgres, Stripe for payments, and a hosted auth
  provider for portal accounts. ("Stack-wise we're on Next.js + Postgres, Stripe for payments,
  and a hosted auth provider for the portal accounts.")
