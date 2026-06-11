# Domain model

## Entities

- **EvaluationEvent** — the inaugural evaluation day; holds the configurable kid cap (A5).
- **Registration** — one family's submission for an event: parent name, parent email (claimed
  identifier until verified — identity lens), phone; owns Kids and one WaiverAcceptance.
- **Kid** — minor's PII: name, birth date, grade, registered position (QB/WR/DB), school, gear
  sizes; carries a decision state.
- **WaiverAcceptance** — immutable record: waiver text version, typed parent name, server
  timestamp, registration reference (A9).
- **PortalAccount** — hosted-auth user (provider id, email, email-verified flag, role
  parent|admin); bound to ≤1 Registration via verified-email match or audited admin relink (A2).
- **Cohort** — position + skill tier + season span; owns TrainingSessions and Announcements;
  flagged inaugural (drives gear entitlement, R12).
- **TrainingSession** — date/time/location row under a Cohort.
- **Enrollment** — Kid ↔ Cohort with plan (per-cohort | full-year), state, gear-entitlement
  flag, owed amount/currency snapshot derivation inputs; created by selection (R5).
- **PaymentSession** — one Stripe Checkout session for one Enrollment: stripe session id,
  plan, owed amount+currency computed server-side at creation (INV-6), state
  (open | superseded | completed | expired). At most one open per enrollment (INV-8).
- **PaymentRecord** — verified capture: stripe event id (idempotency key, INV-9), payment
  intent id, amount, currency, status, the PortalAccount it was granted under (INV-19).
- **ReconciliationCase** — persisted alert when money moved but the domain refused activation
  (duplicate payment, payment after reversal, stale-session payment, amount mismatch) (INV-12).
- **Announcement** — admin-authored post targeted at a cohort (A11).
- **AuditRecord** — actor, action, entity, prior state, new state, timestamp for every decision
  and money transition (INV-14).

## States and transitions

Kid decision state:

```
pending ──select(admin: cohort+tier)──▶ selected ──(payment verified)──▶ enrolled
pending ──reject(admin)──▶ not_selected (re-decidable while unpaid)
selected ──reverse(admin, only while enrollment unpaid)──▶ pending | not_selected
```

Enrollment state (created on select; the reversal/payment race is serialized by a conditional
transition — only `awaiting_payment` may move, INV-5):

```
awaiting_payment ──verified payment──▶ active
awaiting_payment ──admin reversal──▶ withdrawn
withdrawn + payment arrives ──▶ stays withdrawn + ReconciliationCase (INV-11)
```

PaymentSession state:

```
open ──new session created for same enrollment──▶ superseded   (INV-8)
open ──Stripe completes + verification passes──▶ completed ⇒ enrollment activation attempt
open ──Stripe expiry──▶ expired
superseded + payment completes ──▶ no activation + ReconciliationCase (INV-8)
```

Visibility rules tied to state: prices render only to a bound account with ≥1 selected kid
(INV-15); schedule/announcements render only with an active enrollment in that cohort (INV-16).
