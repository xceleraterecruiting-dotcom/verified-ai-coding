# Domain model

## Entities

- **Family** — household unit created by a public registration. Holds parent contact info. Owns
  one or more Athletes. Bound (later, via verified email — A1/INV-4) to zero or more
  PortalAccounts.
- **Guardian (parent)** — name, email, phone, relationship; part of Family. The waiver signer.
- **PortalAccount** — hosted-auth identity (provider user id + provider-verified email). Linked
  to exactly one Family once bound; admin role flag lives at the account level (A10).
- **Athlete (kid)** — name, birth date, grade (3–12), position (QB | WR | DB), school, gear
  sizes. Belongs to one Family. Carries the family-visible status derived from
  Registration/Decision/Enrollment state.
- **EvaluationEvent** — the evaluation day: date, capacity (int, launch 60 — A2), open/closed.
  One at launch (A7).
- **Registration** — one Athlete's spot request at one EvaluationEvent. Counted against capacity.
- **Waiver** — typed signer name, timestamp, waiver text version, linked to the Registration
  (and Guardian). Immutable once recorded.
- **Decision** — admin's verdict on a Registration: selected | not_selected, with decided-by and
  decided-at; re-decidable while no completed payment exists (INV-5).
- **Cohort** — training group: name, position focus, 6-week term dates, inaugural flag (drives
  the everyone-gets-gear rule).
- **SkillTier** — tier label assigned at selection (attribute of the Enrollment placement).
- **Enrollment** — created by a "selected" Decision: Athlete + Cohort + SkillTier. States below.
  Carries chosen plan (per_cohort | full_year) once payment starts, price charged, and gear
  entitlement flag.
- **PriceBook** — server-side constant mapping (position, plan) → amount in cents: QB
  (120000 / 400000), WR/DB (50000 / 170000) (A3). Never client-supplied.
- **Payment** — Stripe checkout session / payment intent reference, amount, status, webhook
  event ids consumed (for idempotency — INV-12). Belongs to one Enrollment.
- **Session** — a single training occurrence inside a Cohort's schedule: date/time, location,
  notes. Admin-managed.
- **Announcement** — admin-posted message, scoped to a Cohort (academy-wide scope is OQ-8),
  shown to enrolled families.

## States and transitions

Athlete status as the family sees it is a projection of these records:

```
Registration:  submitted ──(admin decides)──▶ selected | not_selected
               selected ◀──(re-decision, only while unpaid)──▶ not_selected
Enrollment:    pending_payment ──(verified Stripe success)──▶ enrolled
               pending_payment ──(selection reversed)──▶ revoked
Payment:       created ──▶ succeeded | failed | expired
EvaluationEvent: open ──(capacity reached or admin closes)──▶ closed
```

Transition rules (normative — each backed by an invariant):

- `submitted → selected` creates an Enrollment in `pending_payment` (REQ-5).
- Any re-decision is permitted only while the Enrollment has no succeeded Payment (INV-5);
  reversing a selection moves the Enrollment to `revoked`, which makes it unpayable (INV-10).
- `pending_payment → enrolled` happens only in the webhook handler after signature verification
  and state validation (INV-2, INV-10, INV-12) — never from the browser redirect.
- A succeeded Payment against a `revoked` Enrollment is never auto-enrolled; it is flagged for
  admin reconciliation (the refund path itself is OQ-1 / non-goal 1).
- Registration writes are atomic against EvaluationEvent capacity (INV-6); a full event accepts
  zero further registrations.
- Post-payment transitions out of `enrolled` (withdrawal, refund) are intentionally absent
  pending OQ-1.
