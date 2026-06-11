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

Build the launch web app for a youth football academy on Next.js + Postgres + Stripe + a hosted
auth provider, comprising:

1. A public registration flow for a capped (~60 kids) free evaluation day: parent info, one or
   more kids (PII incl. birth date, grade, position, school, gear sizes), and a typed-name
   liability waiver. No prices appear anywhere public.
2. An admin area where staff mark each kid selected/not-selected; selecting places the kid into
   a cohort with a skill tier and creates an enrollment awaiting payment. Decisions are
   reversible until payment. A best-effort email tells the parent to log in and pay.
3. A parent portal (email-based hosted-auth accounts) where parents see each kid's status, see
   position-and-plan-dependent pricing only after selection, choose per-cohort vs full-year at
   payment time, and pay by card via Stripe.
4. On verified payment, the enrollment activates and the portal shows the cohort's training
   schedule and admin-posted announcements. Admins manage cohorts, sessions, and announcements.

## Interpretation notes

- **Step 0 (project context):** greenfield — no existing codebase, CLAUDE.md, PROJECT-CONTEXT.md,
  or prior specs exist for this plan. No existing project laws constrain interpretation; all
  invariants below originate from the spec text and the compiler lenses.
- "Email-based accounts" + "log in and pay": the spec does not say what links a portal account to
  a registration. Rejected reading: "any account whose typed email matches the registration email
  is the owner." Adopted reading (identity lens, lens-derived): binding requires a
  provider-**verified** email equal to the registration's parent email, or an audited admin
  relink. The registration email is a *claimed* identifier until verified.
- "Decisions need to be reversible" is qualified by "before payment happens." Rejected reading:
  decisions reversible at any time (would require a refund subsystem the spec never mentions).
  Adopted reading: in-app reversal is allowed only while the enrollment is unpaid; post-payment
  changes are out of scope (non-goal), and a payment racing a reversal has a defined fail-closed
  outcome rather than an undefined one.
- "Pricing depends on position": when an admin places a kid in a cohort, the cohort's position
  could differ from the position typed at registration. Rejected reading: price follows the
  registered position. Adopted reading (A3): price follows the position of the cohort the kid was
  placed into — they pay for the training they will receive. Surfaced as OQ-2.
- "$1,200 per 6-week cohort": the spec describes the launch; it does not describe what happens
  when a 6-week cohort ends (renewal, re-payment, next cohort). Adopted reading: launch scope is
  the *first* enrollment payment per kid; renewal/repeat billing is a named non-goal (OQ-4).
- "Parents can switch between per-cohort and full-year at payment time": read as "at the moment
  of paying, before money moves." Rejected reading: plan changes after a successful payment
  (upgrade/proration) — that is a non-goal (OQ-5).
- "Capped (around 60 kids) and when it's full it's full": read as a configurable cap counted in
  kids, with no waitlist; a full event refuses further kid registrations. Rejected reading: cap
  on families.
- "Everyone in the inaugural cohort gets gear regardless": read as a recorded gear-entitlement
  flag on enrollments; gear inventory/fulfillment is operational and out of scope.
- "Email notifications can be best-effort": read as a hard decoupling requirement — decision
  persistence must never depend on email delivery (INV-18), not merely "emails may be slow."
- Lens note: amount/currency verification at grant time, session supersession, duplicate-payment
  detection, payment-after-reversal handling, and fail-closed parsing (INV-7…INV-13) are
  lens-derived defaults — the spec is silent on them; they are labeled as such rather than
  presented as spec text.

## Assumptions

- A1: Payments use Stripe Checkout sessions in USD; card is the only method at launch.
- A2 (identity lens, lens-derived): a portal account is bound to a registration only when the
  hosted auth provider attests the account email is verified AND it equals the registration's
  parent email; mismatches are resolved by an audited admin relink, never by self-service claim.
- A3: the canonical position for pricing is the position of the cohort the kid is placed into,
  not the position typed at registration (see OQ-2).
- A4: one payment checkout covers exactly one enrollment (one kid); families with multiple
  selected kids pay per kid (see OQ-8).
- A5: the evaluation cap is a configurable integer counted in kids (default 60); when reached,
  registration closes with a clear message; no waitlist.
- A6: launch scope is the first enrollment payment per kid; per-cohort renewals and
  per-cohort→full-year upgrades after payment are deferred (non-goals, OQ-4/OQ-5).
- A7 (payment lens, lens-derived): money arriving for a reversed, canceled, or superseded
  obligation is never auto-honored and never silently dropped — funds are held, a reconciliation
  alert with the Stripe identifiers is raised, and refunds are issued manually by admins at
  launch (see OQ-3).
- A8: admin principals are accounts on the same hosted auth provider carrying an admin role from
  a seeded allowlist; there is no self-service admin signup.
- A9: each waiver acceptance is stored immutably with the waiver text version, the typed parent
  name, and a server timestamp.
- A10: not-selected kids show that status in the portal; no rejection email is sent at launch
  (see OQ-9).
- A11: announcements are scoped per cohort (admins may target a cohort); enrolled families see
  their cohort's announcements.

## Open questions

See `open-questions.md` for the full list with severities and statuses. None are
high-severity-open; the lens-mandated identity and payment defaults are adopted as labeled
assumptions (A2, A3, A7) with confirmation questions filed at medium severity.
