# Invariants

## Invariants

Format: `- INV-<id> [L<level>] <testable predicate>`. Levels are per-invariant risk classes.
Invariants marked “(lens-derived)” come from the identity/payment-depth lenses, not spec text.

### Registration & capacity

- INV-1 [L2] A registration commit that would raise the count of registered kids above the configured evaluation cap is rejected, including under concurrent submissions (atomic check-and-insert); the cap is never exceeded.
- INV-2 [L2] No kid is persisted as registered unless the same transaction persists a waiver acceptance (waiver text version, typed parent name, server timestamp) for that registration.

### Identity & data access (identity lens)

- INV-3 [L2] A minor's PII (name, birth date, grade, school, gear sizes) is readable only by admin principals and by the portal account verifiably bound to that kid's registration; no other principal, authenticated or anonymous, can read it.
- INV-4 [L2] (lens-derived) A portal account is bound to a registration only when the auth provider attests the account email is verified AND it equals the registration's parent email, or via an explicit admin relink that writes an audit record; a claimed/unverified email never creates a binding.
- INV-17 [L2] Every admin mutation (cohorts, sessions, decisions, announcements, relinks) requires an authenticated admin-role principal; parent-role and anonymous requests are rejected.

### Decisions & reversal

- INV-5 [L2] A selection decision can be reversed only while its enrollment holds no verified payment; reversal and payment-activation are serialized by a conditional state transition on the enrollment (only `awaiting_payment` may transition), so no interleaving leaves an enrollment active after a reversal without raising a reconciliation case.
- INV-18 [L1] Decision persistence never depends on email delivery: an email send failure leaves the committed decision intact and surfaces the failure to admins.

### Money (payment-depth lens)

- INV-6 [L2] The amount and currency owed for an enrollment are computed server-side from the enrollment's cohort position and the plan chosen at session-creation time; client-supplied amounts, prices, or plan/price pairs are never trusted.
- INV-7 [L2] (lens-derived) An enrollment becomes active only after the captured payment's amount, currency, and paid/captured status are verified at grant time against the owed amount for that enrollment; creation-time pricing alone never grants entitlement.
- INV-8 [L2] (lens-derived) At most one open payment session exists per enrollment; creating a new session (e.g., plan switch) supersedes prior open ones, and a payment completing on a superseded session is neither honored at the stale amount nor silently dropped — it opens a reconciliation case.
- INV-9 [L2] (lens-derived) Processing the same Stripe event id more than once is a no-op keyed on a durable idempotency record; replays never double-activate an enrollment or open duplicate reconciliation cases.
- INV-10 [L2] (lens-derived) A second distinct successful payment for an already-active enrollment is detected and opens a reconciliation case (refund-needed); it is never absorbed as a replay or treated as success.
- INV-11 [L2] (lens-derived) A payment arriving for a withdrawn/reversed enrollment never activates it; it opens a reconciliation case identifying the Stripe payment so funds can be refunded manually (A7).
- INV-12 [L2] (lens-derived) Whenever funds are captured but the domain refuses activation for any reason, a persisted reconciliation case plus an admin-visible alert is created; a log line alone is never the outcome.
- INV-13 [L2] (lens-derived) Missing, null, or unparseable payment fields (session id, amount, currency, status, enrollment reference, signature) cause the webhook/confirmation path to refuse activation and fail closed; absent data never defaults to success.
- INV-19 [L2] (lens-derived) An activated entitlement records the verified portal account/registration binding it was granted under; entitlements never bind to an unverified asserted identifier.

### Auditability

- INV-14 [L2] Every decision and money state transition (select, reverse, session create/supersede, activation, reconciliation open/close) writes an audit record with actor, action, entity, prior state, new state, and timestamp.

### Visibility

- INV-15 [L2] No price, plan amount, or pricing-derived value is served by public/unauthenticated routes or APIs; within the portal, prices render only to an account whose binding includes at least one selected or enrolled kid.
- INV-16 [L2] Cohort training schedules and announcements are readable only by admin principals and by portal accounts holding an active (paid) enrollment in that cohort.
