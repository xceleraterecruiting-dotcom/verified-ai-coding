# Risk map

## Risk classification

Initial classification: L2
Final level: L2

## Justification

This plan handles real money, authentication, minors' personal data, and gated status
transitions — squarely L2 ("money, auth, permissions, user data, status transitions, private
data"). Spec lines that drove the level:

Money — card payments at four-figure amounts, with plan choice at payment time:

> Parents sign in to a portal (email-based accounts), see their kids' status, and pay online by
> card. Pricing depends on position and plan: QBs are $1,200 per 6-week cohort or $4,000 for the
> full year upfront; receivers and DBs are $500 per cohort or $1,700 full-year.

Minors' PII collected and held:

> parent info, one or more kids per family (name, birth date, grade, position, school, gear
> sizes), and a liability waiver the parent signs by typing their name.

Privacy-gated pricing (a deliberate visibility rule, breakable in either direction):

> Don't show prices on the public site — families see pricing in the portal after their kid is
> selected, before paying.

Status transitions with money consequences, explicitly reversible:

> We sometimes change our minds before payment happens, so decisions need to be reversible.

> Once paid, the kid is enrolled

Hard capacity constraint under concurrency:

> The inaugural evaluation is capped (around 60 kids) and when it's full it's full.

**Why not L3:** L3 is "regulated, minors' data + public output, production-critical at scale."
Minors' data is present but is never published publicly — it stays inside an authenticated
family-scoped portal and admin area; there is no AI-generated or public output of kids' data.
Card data is delegated to Stripe-hosted collection (A6), keeping the app out of direct PCI
scope. Scale is a single ~60-kid launch event. No downgrade occurred (Final = Initial), so no
downgrade justification is required.

### Per-area levels

- Payment + enrollment transition path (Slices 6–7): **L2**, the maximum-risk area (INV-1,
  INV-2, INV-10, INV-12).
- Account binding / access control (Slices 3–4, 8): **L2** (INV-4, INV-9, INV-11).
- Registration cap + waiver (Slice 2): **L2** (INV-6, INV-7, INV-11).
- Selection email (Slice 5): **L1** (best-effort by spec; INV-8).
- Schedule/announcements read views (Slice 9): **L1** behavior on top of L2 access scoping
  (INV-11 applies).
