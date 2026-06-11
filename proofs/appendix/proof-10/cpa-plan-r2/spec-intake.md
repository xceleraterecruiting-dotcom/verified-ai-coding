# Spec intake — youth academy registration & enrollment

## Original spec (verbatim)

> We run a youth football training academy (quarterbacks, receivers, defensive backs, grades 3–12)
> and need the web app for our launch. How it works:
>
> Families register for a free evaluation day through the public site — parent info, one or more
> kids per family (name, birth date, grade, position, school, gear sizes), and a liability waiver
> the parent signs by typing their name. The inaugural evaluation is capped (around 60 kids) and
> when it's full it's full.
>
> After evaluation day, we (the admins) go through the registrations and decide each kid: selected
> or not selected. Selecting a kid means placing them into a training cohort with a skill tier, and
> that creates their enrollment. The parent gets an email saying their kid was selected and to log
> in and pay. We sometimes change our minds before payment happens, so decisions need to be
> reversible.
>
> Parents sign in to a portal (email-based accounts), see their kids' status, and pay online by
> card. Pricing depends on position and plan: QBs are $1,200 per 6-week cohort or $4,000 for the
> full year upfront; receivers and DBs are $500 per cohort or $1,700 full-year. Parents can switch
> between per-cohort and full-year at payment time. Full-year includes gear; everyone in the
> inaugural cohort gets gear regardless. Don't show prices on the public site — families see
> pricing in the portal after their kid is selected, before paying.
>
> Once paid, the kid is enrolled: the portal shows their cohort's training schedule and any
> announcements we post. We manage cohorts, sessions, and announcements in an admin area.
>
> Stack-wise we're on Next.js + Postgres, Stripe for payments, and a hosted auth provider for the
> portal accounts. Email notifications can be best-effort at launch (if email is down, selection
> should still work and we'll call the family).

## Compiler paraphrase

Build a greenfield web application (Next.js + Postgres + Stripe + hosted auth) for a youth
football academy launch, with three surfaces:

1. **Public site** — families register one or more kids for a capacity-capped free evaluation
   day (parent info, per-kid details, typed-name liability waiver). No prices shown anywhere
   public. When the event is full, registration closes.
2. **Parent portal** (email-based accounts via hosted auth) — parents see each kid's status
   (registered / selected / not selected / enrolled), and once a kid is selected they see pricing
   (position- and plan-dependent), choose per-cohort or full-year at payment time, and pay by card
   via Stripe. Successful payment makes the kid enrolled; enrolled kids' families see the cohort
   training schedule and admin-posted announcements.
3. **Admin area** — admins review registrations and mark each kid selected (which places the kid
   into a cohort with a skill tier and creates a pending enrollment) or not selected; decisions
   are reversible while unpaid. Admins manage cohorts, sessions, and announcements. Selection
   triggers a best-effort email ("log in and pay"); email failure must not block the decision.

## Interpretation notes

Step 0 yielded no project context: this is a greenfield engagement — no existing codebase,
CLAUDE.md, or prior invariants to reconcile against. The spec is interpreted on its own terms
plus the stack constraint it states (Next.js + Postgres + Stripe + hosted auth).

- **"decisions need to be reversible" (before payment)** — read as: both selected→not-selected
  and not-selected→selected re-decisions are allowed while no payment has completed. Rejected
  narrower reading: only selected→not-selected is reversible. The spec's "we sometimes change our
  minds" does not limit direction. Post-payment reversal is NOT covered by the spec — see OQ-1.
- **"email-based accounts"** — read as: the hosted auth provider issues accounts identified by
  email, and the portal must bind a parent account to the family/registration created on the
  public site. The spec is silent on how that binding is proven; per the identity lens this
  defaults to *verified email control required* (A1) rather than "any account typing the same
  email gets the kids' records".
- **"capped (around 60 kids)"** — read as a configurable per-event capacity with launch value 60,
  enforced per kid (not per family), atomically. Rejected reading: soft/advisory cap ("when it's
  full it's full" forces a hard cap); exactness of 60 is OQ-4.
- **"Parents can switch between per-cohort and full-year at payment time"** — read as: the plan
  choice is made on the payment screen before paying, not changeable by the parent after payment.
  What full-year covers operationally (subsequent cohorts, auto-continuation) is OQ-2.
- **"Pricing depends on position"** — read as: the position that prices the enrollment is the
  position on the kid's selection/enrollment record at payment time, computed server-side (A4);
  position drift between registration and payment is OQ-5.
- **"pay online by card"** — read as Stripe-hosted payment collection (Stripe Checkout or
  equivalent); the app never touches raw card data (A6). Rejected reading: custom card form with
  raw PAN handling — nothing in the spec requires it and it would raise compliance scope.
- **"Once paid, the kid is enrolled"** — read as: the enrolled status transition is driven by
  Stripe's server-side confirmation (webhook), never by the browser returning from checkout.
- **"the inaugural cohort gets gear regardless"** — read as a recorded entitlement flag (gear
  sizes are already collected); physical fulfillment is offline and out of scope (A9, OQ-6).
- **"an admin area"** — the spec never says how admins are created or authenticated; read as the
  same hosted auth provider with an admin role, provisioning method is OQ-9.

## Assumptions

- A1: Portal account ↔ family binding requires provider-verified control of the email address
  that matches the registration's parent email; mismatches require explicit admin linking. (Money
  and minors' PII bind only to a verified principal — lens default, not spec text.)
- A2: Evaluation capacity is a configurable integer on the event, launch default 60, counted in
  kids, enforced atomically at registration write time.
- A3: Prices are the four fixed amounts in the spec (QB $1,200/$4,000; WR/DB $500/$1,700), held
  server-side; no client-supplied amount is ever trusted.
- A4: The price is computed from the position and plan on the enrollment at payment time,
  server-side, at charge creation.
- A5: No sibling/multi-kid discounts — each kid's enrollment is priced and paid independently.
- A6: Stripe-hosted payment collection (Checkout); no raw card data touches the app.
- A7: One inaugural evaluation event at launch, but the model allows future events.
- A8: "Best-effort email" = selection commits transactionally first; the email is sent
  asynchronously afterward; failures are logged and surfaced to admins, never rolled back.
- A9: Gear entitlement (full-year plan, or inaugural-cohort membership) is recorded as data;
  fulfillment is handled offline.
- A10: Admins authenticate through the same hosted auth provider with an explicit admin role;
  parents can never hold it implicitly.

## Open questions

See `open-questions.md`. Two high-severity questions (post-payment reversal/refunds OQ-1;
full-year plan scope and subsequent-cohort payment cycle OQ-2) are open and block
implementation of the affected slices until the founder answers.
