# Risk map

## Risk classification

Initial classification: L2
Final level: L2

## Justification

This plan handles **money**, **auth/permissions**, **status transitions**, and **minors'
private data** — squarely the L2 definition ("money, auth, permissions, user data, status
transitions, private data").

Money — real card charges with position/plan-dependent amounts, and payment gates enrollment:

> Parents sign in to a portal (email-based accounts), see their kids' status, and pay online by
> card. Pricing depends on position and plan: QBs are $1,200 per 6-week cohort or $4,000 for the
> full year upfront; receivers and DBs are $500 per cohort or $1,700 full-year.

> Once paid, the kid is enrolled

Status transitions with money-coupled reversibility:

> we (the admins) go through the registrations and decide each kid: selected or not selected.

> We sometimes change our minds before payment happens, so decisions need to be reversible.

Confidential pricing (a disclosure rule the public site must never violate):

> Don't show prices on the public site — families see pricing in the portal after their kid is
> selected, before paying.

Minors' private data collected from the public internet, plus a legal instrument (waiver):

> parent info, one or more kids per family (name, birth date, grade, position, school, gear
> sizes), and a liability waiver the parent signs by typing their name.

A hard capacity constraint that must hold under concurrency:

> The inaugural evaluation is capped (around 60 kids) and when it's full it's full.

**Why not L3:** L3 requires regulated work, minors' data *combined with public output*, or
production-critical scale. Children's PII here is collected but never published — it is shown
only to the owning family's authenticated parent and to admins; there is no AI-generated or
public output of minors' data. Payments are standard Stripe card processing (PCI burden carried
by Stripe), the launch scale is one ~60-child event, and nothing here is a regulated domain in
the L3 sense. Escalation to L3 would be free if the founder later adds public rosters, photos,
or published child profiles — that would reopen this classification.

**Per-area levels** (Final level is the plan maximum):

- Payment path (Stripe checkout, webhook, enrollment activation): **L2** — INV-1, INV-2, INV-8,
  INV-9.
- Authorization and child-PII scoping (portal, admin, public routes): **L2** — INV-4, INV-5,
  INV-11.
- Registration cap + waiver capture: **L2** — INV-6, INV-7.
- Pricing confidentiality on public site: **L2** — INV-3.
- Selection/decision state machine: **L2** — INV-13, INV-10, INV-14.
- Cohort/session/announcement CRUD content itself: **L1** behavior behind L2 admin gating
  (INV-5); gear-entitlement computation: **L1** (INV-12).
