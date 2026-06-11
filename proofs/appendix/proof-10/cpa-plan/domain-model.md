# Domain model

## Entities

- **Family** — household unit; owns children and registrations. Linked to one or more parent
  accounts (launch: one; see OQ-8).
- **Parent (portal user)** — hosted-auth identity (email-based) linked to exactly one family;
  carries contact info from registration.
- **Admin (user)** — staff identity with the admin role; no family link required.
- **Child** — name, birth date, grade (3–12), position (QB | WR | DB), school, gear sizes.
  Belongs to a family. Carries a launch status (see state machine).
- **EvaluationEvent** — the inaugural evaluation day; holds the capacity cap (default 60
  children, admin-configurable) and a derived confirmed-child count.
- **Registration** — a family's submission for the evaluation event: parent info snapshot, the
  child entries, and the waiver signature. A registration is only valid with a waiver.
- **WaiverSignature** — typed parent name, timestamp, waiver text version; immutable once
  written.
- **Cohort** — a training group: name, position focus, 6-week term dates, `inaugural` flag
  (gear rule, A7).
- **Enrollment** — child × cohort placement created by a *selected* decision; carries skill
  tier, chosen plan (set at payment time), gear entitlement, and a state (see below).
- **Decision** — admin action history on a child: selected (with cohort + tier) or not
  selected; reversals recorded, never deleted (audit trail for INV-8).
- **Payment** — Stripe-backed record: enrollment reference, plan, server-computed amount,
  Stripe session/event ids (for idempotency), state.
- **Session** — a scheduled training occurrence within a cohort (date, time, location).
- **Announcement** — admin-posted notice, scoped to a cohort (optionally global; OQ-11).

Pricing matrix (fixed constants at launch, single server-side source — A6):
QB: $1,200 per cohort / $4,000 full-year. WR/DB: $500 per cohort / $1,700 full-year.

## States and transitions

Child launch status:

```
registered ──select──▶ selected ──payment verified──▶ enrolled
registered ──reject──▶ not_selected
selected ──reverse (only while unpaid)──▶ registered | not_selected
not_selected ──reverse──▶ registered | selected
```

Enrollment state:

```
pending_payment ──verified Stripe payment──▶ active
pending_payment ──decision reversed──▶ cancelled
active: terminal in-app (post-payment changes are manual, A4)
```

Payment state:

```
initiated ──webhook verified──▶ succeeded
initiated ──failure/expiry──▶ failed
```

Rules the model encodes (full predicates in `invariants.md`):

- `enrolled` / `active` is reachable **only** through a verified successful payment (INV-1,
  INV-13).
- Decision reversal is legal **only** while the enrollment has no succeeded payment (INV-8).
- Capacity is checked transactionally against the event's confirmed-child count at registration
  commit (INV-7).
- Gear entitlement = (plan == full_year) OR (cohort.inaugural == true) (INV-12).
