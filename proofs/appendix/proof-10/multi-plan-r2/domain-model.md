# Domain model — team hub

## Entities

**Existing (interfaces to confirm — Step 0 had no readable context):**

- **Cohort** — the isolation boundary for every hub resource.
- **Membership** — (principal, cohort, role ∈ {coach, parent, athlete}). The source of every
  authorization decision (INV-01). How parent↔athlete links are established/verified: OQ-004.
- **Athlete** — has date of birth (drives the under-13 rule, INV-02) and a public recruiting
  profile (badge render target, INV-17).
- **Session** — a scheduled practice for a cohort (RSVP target, reminder trigger).
- **AttendanceRecord** — canonical "was actually present" record. Existence/shape is OQ-002;
  badges and CSV export consume it as an interface.

**New (created by this plan, all carrying a `cohort_id`):**

- **Post** — authored by a coach in a cohort.
- **Comment** — authored by a parent on a Post; holds filter outcome and visibility state.
- **CommentReport** — (comment, reporter, reason, created_at); immutable once filed.
- **FileAsset** — coach-uploaded file (≤100MB); metadata row + access-controlled blob (INV-06).
- **Rsvp** — (session, athlete, response ∈ {yes, no}, responded_by parent).
- **ReminderDispatch** — (session, recipient, sent_at, provider_message_id); the idempotency
  record for INV-08.
- **Product** — stocked gear item with canonical server-side price (INV-09).
- **Order / OrderItem** — parent's purchase; binds to the authenticated parent (INV-16).
- **PaymentRecord** — canonical payment-session/intent id, amount, currency, capture status,
  durable provider event ids processed (INV-10..13).
- **AuditEntry** — who/what/why/when for every order/payment state transition (INV-15).
- **BadgeAward** — (athlete, badge type, earned_at, publication_state); public display is
  default-deny pending OQ-001 (INV-17).

## States and transitions

Comment:

```
submitted -> blocked_by_filter        (terminal; never visible — INV-03)
submitted -> visible
visible   -> reported (>=1 report)    (report recorded, coaches notified — INV-04)
reported  -> hidden_by_coach | visible (coach decision)
```

Order and payment (sibling writers — cancel vs payment serialization is INV-14):

```
draft -> pending_payment              (server-priced, single open payment session — INV-09/11)
pending_payment -> paid               (only after grant-time capture verification — INV-10)
pending_payment -> canceled           (conditional transition; race with payment — INV-14)
canceled + payment-arrives            -> refund/reconciliation signal, never fulfillment
paid -> fulfilled                     (coach handover at practice; audited — INV-15/16)
paid + second distinct payment        -> duplicate alert, not absorbed (INV-13)
```

BadgeAward:

```
earned -> publishable                 (only if OQ-001 gate satisfied; default-deny — INV-17)
earned -> withheld                    (gate unsatisfied; profile shows nothing)
```

ReminderDispatch: `scheduled -> sent | failed`; re-running the morning job never produces a
second `sent` row for the same (session, recipient) (INV-08).
