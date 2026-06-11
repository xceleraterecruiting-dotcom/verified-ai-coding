# Fixture spec — youth academy registration & enrollment (expected: Level 2, money/status)

> Provenance: paraphrased strictly from the Charleston Passing Academy product README's
> description sections (text that predates every review of that codebase). The README's
> "Security properties" section is deliberately EXCLUDED — it is the answer key for part of the
> pre-registered ground truth (proof-10). Builder is contaminated on this fixture's answers, so
> compilation and scoring run in fresh contexts.

We run a youth football training academy (quarterbacks, receivers, defensive backs, grades 3–12)
and need the web app for our launch. How it works:

Families register for a free evaluation day through the public site — parent info, one or more
kids per family (name, birth date, grade, position, school, gear sizes), and a liability waiver
the parent signs by typing their name. The inaugural evaluation is capped (around 60 kids) and
when it's full it's full.

After evaluation day, we (the admins) go through the registrations and decide each kid: selected
or not selected. Selecting a kid means placing them into a training cohort with a skill tier, and
that creates their enrollment. The parent gets an email saying their kid was selected and to log
in and pay. We sometimes change our minds before payment happens, so decisions need to be
reversible.

Parents sign in to a portal (email-based accounts), see their kids' status, and pay online by
card. Pricing depends on position and plan: QBs are $1,200 per 6-week cohort or $4,000 for the
full year upfront; receivers and DBs are $500 per cohort or $1,700 full-year. Parents can switch
between per-cohort and full-year at payment time. Full-year includes gear; everyone in the
inaugural cohort gets gear regardless. Don't show prices on the public site — families see
pricing in the portal after their kid is selected, before paying.

Once paid, the kid is enrolled: the portal shows their cohort's training schedule and any
announcements we post. We manage cohorts, sessions, and announcements in an admin area.

Stack-wise we're on Next.js + Postgres, Stripe for payments, and a hosted auth provider for the
portal accounts. Email notifications can be best-effort at launch (if email is down, selection
should still work and we'll call the family).
