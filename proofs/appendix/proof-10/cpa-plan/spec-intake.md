# Spec intake — youth academy registration & enrollment

## Original spec (verbatim)

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

## Compiler paraphrase

Build the launch web app for a youth football training academy with four user-facing capabilities:

1. **Public registration** — a family registers for a capped free evaluation day: parent contact
   info, one or more children (name, birth date, grade, position, school, gear sizes), and a
   typed-name liability waiver. Hard capacity cap (~60 kids); registration closes when full.
2. **Admin decisions** — after the evaluation, admins mark each child selected or not selected.
   Selecting places the child into a cohort with a skill tier and creates an enrollment awaiting
   payment; a best-effort email tells the parent to log in and pay. Decisions are reversible
   while payment has not happened.
3. **Parent portal & payment** — parents sign in (hosted auth, email-based), see each child's
   status, and — only after selection — see position-based pricing (QB: $1,200/cohort or
   $4,000/year; WR/DB: $500/cohort or $1,700/year), choose per-cohort vs full-year at payment
   time, and pay by card via Stripe. Prices never appear on the public site. Successful payment
   activates the enrollment. Full-year includes gear; everyone in the inaugural cohort gets gear
   regardless of plan.
4. **Enrolled experience & admin content** — once paid, the portal shows the child's cohort
   training schedule and announcements; admins manage cohorts, sessions, and announcements in an
   admin area.

Stack: Next.js + Postgres, Stripe, hosted auth provider. Email is best-effort and must never
block selection.

## Interpretation notes

Step 0 note: this is a greenfield engagement — project-context discovery (CLAUDE.md,
PROJECT-CONTEXT.md, existing specs/codebase) yielded **none**. The spec is interpreted into a
vacuum by instruction; all structural conventions below are proposed, not inherited.

- **"that creates their enrollment" vs "Once paid, the kid is enrolled"** — read as: selection
  creates an enrollment *record* in a pending-payment state; "enrolled" is the *active* state
  reached only on verified payment. Rejected reading: the enrollment record is only created at
  payment time (would make "creates their enrollment" at selection false).
- **"decisions need to be reversible" — scope** — read as reversible *before payment*, because
  the spec motivates it with "we sometimes change our minds before payment happens". Rejected
  reading: reversal (and therefore refunds) required after payment too. Post-payment changes are
  treated as out of scope (see A4, OQ-5).
- **"capped (around 60 kids)"** — read as: the cap counts *children*, not families, and is a hard
  cap ("when it's full it's full" → no waitlist). Rejected readings: cap counts families; cap is
  soft/waitlisted. Exact number treated as configurable with default 60 (A2, OQ-3).
- **"email-based accounts"** — read as: parents authenticate via a hosted auth provider using
  their email (provider's mechanism — magic link or password). Rejected reading: build custom
  authentication.
- **Pricing in the selection email** — the email says "log in and pay"; pricing is deliberately
  *not* included in the email, because the spec routes price disclosure through the
  authenticated portal ("families see pricing in the portal after their kid is selected").
  Rejected reading: include prices in the email for convenience.
- **"everyone in the inaugural cohort gets gear"** — read as: cohorts carry an "inaugural" flag;
  any child enrolled in a flagged cohort is gear-entitled regardless of plan (A7). Rejected
  reading: only one literal single cohort is inaugural (the launch creates several cohorts from
  one inaugural evaluation).
- **"full year upfront"** — the entitlement this purchase creates (all cohorts that year? this
  cohort plus credit?) is not derivable from the text; this is a high-severity open question
  (OQ-1), not an interpretation.
- **"any announcements we post"** — read as announcements scoped to a cohort (matching "their
  cohort's training schedule and any announcements"), with global announcements optional.
  Rejected reading: announcements are only ever global (OQ-11).

## Assumptions

- A1: A single registration event (the inaugural evaluation day) is sufficient at launch;
  multi-event support is not built.
- A2: The capacity cap counts children, defaults to 60, and is admin-configurable.
- A3: Payment is per child per enrollment; a parent with multiple selected children completes a
  separate payment per child.
- A4: Post-payment changes (refunds, un-enrollment, plan changes) are handled manually via the
  Stripe dashboard / offline at launch and are out of app scope (see OQ-5).
- A5: The portal shows a "not selected" status to parents once an admin decides it (the spec
  mandates email only for selected; see OQ-4).
- A6: The four prices are fixed constants at launch, defined in exactly one server-side module
  (see OQ-9).
- A7: "Inaugural cohort" gear entitlement is modeled as an `inaugural` flag on cohorts; all
  launch cohorts are flagged.
- A8: The specific hosted auth provider is an implementation choice (OQ-6); the plan assumes a
  thin abstraction so slices do not depend on the choice.
- A9: "Best-effort" email means asynchronous send with failure logging; no retry queue is
  required at launch.
- A10: Skill tier is a label on the enrollment/cohort placement (e.g., a small enum or free
  text); it does not affect pricing.

## Open questions

See `open-questions.md`. Two high-severity questions (OQ-1, OQ-2 — full-year entitlement and
per-cohort renewal semantics) are **open and block implementation** of the payment slice until
the founder answers.
