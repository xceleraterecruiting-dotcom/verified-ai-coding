# Risk map

## Risk classification

Initial classification: L2
Final level: L2

## Justification

The plan moves real money, gates entitlements on payment state, performs admin-driven status
transitions that must serialize against payments, and stores minors' PII behind auth — all
squarely L2 ("money, auth, permissions, user data, status transitions, private data").

Money and payment-state transitions:

> Parents sign in to a portal (email-based accounts), see their kids' status, and pay online by
> card. Pricing depends on position and plan: QBs are $1,200 per 6-week cohort or $4,000 for the
> full year upfront; receivers and DBs are $500 per cohort or $1,700 full-year.

Reversible status transitions racing payment (the reversal writer and the payment writer are
sibling writers on the same enrollment):

> We sometimes change our minds before payment happens, so decisions need to be reversible.

Paid entitlement gating and private-data visibility:

> Once paid, the kid is enrolled: the portal shows their cohort's training schedule and any
> announcements we post.

> Don't show prices on the public site — families see pricing in the portal after their kid is
> selected, before paying.

Minors' private data bound to email-based accounts (identity lens applies):

> …one or more kids per family (name, birth date, grade, position, school, gear sizes), and a
> liability waiver the parent signs by typing their name.

## Per-area levels

- Payment session creation, webhook verification, entitlement activation, reversal/payment
  race: **L2** (the plan's maximum; every invariant in the money group is L2).
- Minors' PII access and account↔registration binding: **L2**.
- Admin CRUD for cohorts/sessions/announcements: **L2 on authz** (INV-17), L1 on the CRUD
  content itself.
- Public-site copy, portal presentation, email template content: **L0–L1** (best-effort email is
  explicitly tolerated by the spec).

## Why not L3

L3 is "regulated, minors' data + public output, production-critical at scale." This system holds
minors' data but publishes none of it — kid PII is visible only to the bound parent account and
admins (INV-3); public output is marketing copy and a registration form with no PII echo and no
prices (INV-15). Scale is one academy, ~60 kids. No downgrade occurred (Initial = Final = L2);
the minors'-PII invariants are nonetheless written to the strictest reading of L2.
