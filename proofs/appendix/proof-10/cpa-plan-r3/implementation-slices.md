# Implementation slices

Greenfield Next.js (App Router) + Postgres + Stripe + hosted auth. Paths below are the
repository layout the slices will create. Each slice is one verified-implementation run.
Dependency graph: 1 → 2 → 3 → 4 → 5 → 6 → 7 (linear; 2 needs only the migration baseline from
1; 7 needs 2's admin shell and 6's activation state).

## Slice 1: Public registration with capacity cap and waiver

### Scope
Public registration flow for the evaluation event: family form (parent info, 1..k kids with full
PII fields), typed-name waiver capture stored immutably in the same transaction, atomic kid-count
cap enforcement, and the base schema (events, registrations, kids, waiver acceptances, audit
table scaffold). Public pages carry no pricing anywhere. No portal, no admin, no payments.
Depends on: nothing.

### Allowed files
- `db/migrations/001_core_schema.sql`
- `app/register/`
- `app/page.tsx`
- `app/api/registration/`
- `lib/registration/`
- `lib/waiver/`
- `lib/audit/`
- `tests/registration/`
- `package.json`
- `next.config.ts`

### Forbidden files
- `app/portal/`
- `app/admin/`
- `app/api/portal/`
- `app/api/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`
- `lib/decisions/`

### Invariants touched
- INV-1 (capacity never exceeded, atomic under concurrency)
- INV-2 (no kid without waiver acceptance in the same transaction)
- INV-15 (no prices on public routes — this slice owns the public surface)

### Tests required
- Unit: cap arithmetic, multi-kid form validation, waiver record immutability.
- Integration: INV-1 concurrency test (parallel submissions at cap−1 yield exactly one success);
  INV-2 transactionality (waiver insert failure rolls back kid insert).
- Route scan: render all public routes/APIs; assert no price tokens (1200/4000/500/1700, "$").

### Proof obligations
One line per invariant; each names the expected attributed STRONG_RED (regression-check.mjs).
- INV-1 — regression test `tests/registration/capacity-cap.race.test.ts` (concurrent registrations cannot exceed the cap); expected attributed STRONG_RED: removing the atomic check-and-insert guard turns the test red.
- INV-2 — regression test `tests/registration/waiver-required.test.ts` (kid persists only with same-transaction waiver acceptance); expected attributed STRONG_RED: dropping the waiver insert from the transaction turns the test red.
- INV-15 — regression test `tests/registration/no-public-prices.test.ts` (public route/API scan finds no pricing values); expected attributed STRONG_RED: rendering a price constant on a public page turns the test red.

### Rollback notes
Revert the slice commit; migration 001 is the base schema, so rollback is `down` migration +
revert. No external state (no Stripe, no auth provider config) is created.

### Done criteria
AC-1, AC-2, AC-3 pass; the public-route price scan (AC-11 public half) passes; plan-lint's
allowed-files gate matches the diff; all three STRONG_RED-bearing regression tests exist and are
attributed.

## Slice 2: Admin authentication and cohort/session management

### Scope
Hosted-auth integration with an admin role from a seeded allowlist (A8); admin-only area with
CRUD for cohorts (position, skill tier, inaugural flag, season span) and training sessions.
Centralized admin authorization guard that all later admin mutations reuse. No decisions, no
payments, no announcements yet.
Depends on: Slice 1.

### Allowed files
- `db/migrations/002_cohorts_admin.sql`
- `app/admin/`
- `app/api/admin/cohorts/`
- `app/api/admin/sessions/`
- `lib/auth/`
- `lib/cohorts/`
- `lib/audit/`
- `tests/admin/`
- `middleware.ts`

### Forbidden files
- `app/register/`
- `app/portal/`
- `app/api/portal/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`
- `lib/decisions/`
- `lib/registration/`

### Invariants touched
- INV-17 (admin mutations require admin-role principal)

### Tests required
- Unit: role extraction from provider claims; allowlist seeding.
- Integration: enumerated admin route table — each route rejects anonymous and parent-role,
  accepts admin; cohort/session CRUD round-trips.

### Proof obligations
- INV-17 — regression test `tests/admin/admin-authz.route-table.test.ts` (every enumerated admin route rejects anonymous and parent-role principals); expected attributed STRONG_RED via regression-check.mjs: removing the guard from any one route turns the test red.

### Rollback notes
Revert commit + down-migrate 002. Auth-provider config (admin role/allowlist) is external; note
it in the run log so it can be removed by hand if the slice is abandoned.

### Done criteria
AC-6 passes for the routes that exist so far; cohorts and sessions are manageable end-to-end by
an admin and inaccessible to non-admins; STRONG_RED-bearing authz regression test exists.

## Slice 3: Selection decisions, reversal, and best-effort notification

### Scope
Admin decision flow: mark each kid selected (choose cohort + skill tier ⇒ enrollment created in
`awaiting_payment`, gear flag derived per R12) or not selected; reversal withdraws the unpaid
enrollment via a conditional state transition (the decision-side half of INV-5); audit records
for every transition; best-effort selection email that can never block the decision (INV-18).
Depends on: Slice 2.

### Allowed files
- `db/migrations/003_decisions_enrollments.sql`
- `app/admin/decisions/`
- `app/api/admin/decisions/`
- `lib/decisions/`
- `lib/enrollment/`
- `lib/email/`
- `lib/audit/`
- `tests/decisions/`

### Forbidden files
- `app/register/`
- `app/portal/`
- `app/api/portal/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`

### Invariants touched
- INV-5 (reversal only while unpaid; conditional transition — decision-side writer)
- INV-14 (audit of decision transitions)
- INV-17 (decision endpoints are admin mutations)
- INV-18 (email failure never blocks decisions) [L1]

### Tests required
- Unit: gear-flag derivation (full-year OR inaugural); decision state machine legality.
- Integration: select → enrollment `awaiting_payment`; reverse → `withdrawn`; reversal of an
  `active` enrollment rejected; email transport failure leaves decision committed; audit rows
  per transition; non-admin rejected on decision endpoints.

### Proof obligations
- INV-5 — regression test `tests/decisions/reversal-only-unpaid.test.ts` (reversal succeeds only from `awaiting_payment` via a conditional state-predicated write; reversal of `active` rejected; payment-side interleaving proven in Slice 6); expected attributed STRONG_RED via regression-check.mjs: dropping the state predicate from the reversal write turns the test red.
- INV-14 — regression test `tests/decisions/audit-trail.test.ts` (select/reverse/re-select each write actor + prior/new state); expected attributed STRONG_RED: removing the audit write from any one transition turns the test red.
- INV-17 — regression test `tests/decisions/decisions-authz.test.ts` (decision endpoints reject parent and anonymous principals); expected attributed STRONG_RED: unguarding the decision endpoint turns the test red.
- INV-18 [L1] — email-failure injection test required, but STRONG_RED not applicable: L1 invariant, below the attributed-STRONG_RED threshold for this plan.

### Rollback notes
Revert commit + down-migrate 003. Additive relative to Slices 1–2; no Stripe state exists yet,
so reversal of the slice cannot strand money.

### Done criteria
AC-7, AC-8 (reversal half — race half lands in Slice 6), AC-9, AC-20 (decision transitions),
AC-22 (gear flag) pass; all named regression tests exist with attributed STRONG_RED where
applicable.

## Slice 4: Parent portal accounts and verified registration binding

### Scope
Parent-facing portal shell on the hosted auth provider: sign-in, verified-email binding of
account → registration (INV-4, A2), audited admin relink endpoint, and the kids' status view
(pending / selected / not selected / enrolled). PII authorization layer: a bound account reads
only its own family's data (INV-3). No prices, no payment actions yet.
Depends on: Slice 3.

### Allowed files
- `db/migrations/004_portal_bindings.sql`
- `app/portal/`
- `app/api/portal/`
- `app/api/admin/relink/`
- `lib/identity/`
- `lib/audit/`
- `tests/portal/`

### Forbidden files
- `app/register/`
- `app/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`
- `lib/decisions/`

### Invariants touched
- INV-3 (minor PII readable only by admins and the bound account)
- INV-4 (binding requires provider-verified email match or audited admin relink)
- INV-17 (the relink endpoint is an admin mutation)

### Tests required
- Unit: binding predicate (verified flag AND exact email match); status projection per kid.
- Integration: unverified-email account gets no binding; verified-but-different email gets none;
  verified match binds; cross-family data access rejected; relink writes audit and rebinds;
  anonymous portal API access returns no PII.

### Proof obligations
- INV-4 — regression test `tests/portal/binding-verified-email.test.ts` (unverified or mismatched emails never bind; only provider-verified exact match or audited admin relink binds); expected attributed STRONG_RED via regression-check.mjs: relaxing the predicate to accept a claimed email turns the test red.
- INV-3 — regression test `tests/portal/pii-isolation.test.ts` (cross-family and anonymous reads return no PII fields); expected attributed STRONG_RED: removing the family-scope filter from the kid query turns the test red.
- INV-17 — regression test `tests/portal/relink-authz.test.ts` (relink rejects non-admin principals); expected attributed STRONG_RED: unguarding the relink route turns the test red.

### Rollback notes
Revert commit + down-migrate 004 (bindings table is additive). Hosted-auth tenant config for
parent sign-in is external; record it in the run log.

### Done criteria
AC-4, AC-5 pass; AC-6 extended to the relink route; a bound parent sees exactly their kids'
statuses; all three STRONG_RED-bearing regression tests exist and are attributed.

## Slice 5: Portal pricing display and checkout session creation

### Scope
Post-selection pricing display in the portal (position-and-plan matrix for the selected kid,
INV-15 portal half), plan choice (per-cohort vs full-year) at payment time, server-side owed
computation (INV-6, A3), and Stripe Checkout session creation with single-open-session
supersession per enrollment (INV-8 creation half). No webhook/activation yet — sessions are
created but nothing activates.
Depends on: Slice 4.

### Allowed files
- `db/migrations/005_payment_sessions.sql`
- `app/portal/pay/`
- `app/api/portal/checkout/`
- `lib/pricing/`
- `lib/payments/`
- `lib/audit/`
- `tests/payments-sessions/`

### Forbidden files
- `app/register/`
- `app/admin/`
- `app/api/stripe/`
- `lib/decisions/`
- `lib/identity/`

### Invariants touched
- INV-6 (owed amount/currency computed server-side; client values never trusted)
- INV-8 (at most one open session per enrollment; supersession on plan switch — creation half)
- INV-15 (prices only post-selection in the portal)
- INV-14 (audit of session create/supersede)

### Tests required
- Unit: full price matrix (QB 1200/4000; WR/DB 500/1700, USD) keyed off cohort position (A3);
  plan-switch supersession state machine.
- Integration: checkout request with tampered amount/plan-price pair is created at the
  server-computed amount or rejected; two session creations leave exactly one `open`; account
  without a selected kid gets no prices and cannot create a session.

### Proof obligations
- INV-6 — regression test `tests/payments-sessions/server-side-amount.test.ts` (tampered client amounts/plan-price pairs never reach the Stripe session; owed derives from cohort position + plan); expected attributed STRONG_RED via regression-check.mjs: reading the amount from the request body turns the test red.
- INV-8 — regression test `tests/payments-sessions/single-open-session.test.ts` (second creation supersedes the first; at most one `open` per enrollment under concurrent creates; stale-session payment outcome proven in Slice 6); expected attributed STRONG_RED: dropping the supersede/uniqueness guard turns the test red.
- INV-15 — regression test `tests/payments-sessions/prices-gated-by-selection.test.ts` (price payloads require a binding with a selected kid); expected attributed STRONG_RED: removing the selection check from the pricing endpoint turns the test red.
- INV-14 — regression test `tests/payments-sessions/session-audit.test.ts` (create and supersede each write audit records); expected attributed STRONG_RED: removing the audit write turns the test red.

### Rollback notes
Revert commit + down-migrate 005. Stripe sessions already created in test/live mode expire on
their own; none can activate anything because the webhook does not exist yet (fail-closed by
construction).

### Done criteria
AC-10, AC-12 (supersession half), AC-11 (portal halves) pass; checkout redirects to Stripe with
the server-computed amount; all four STRONG_RED-bearing regression tests exist and are
attributed.

## Slice 6: Payment verification, entitlement activation, and reconciliation

### Scope
Stripe webhook endpoint: signature verification, durable event-id idempotency (INV-9),
grant-time verification of captured amount/currency/status against owed (INV-7), conditional
activation only from `awaiting_payment` (payment-side of INV-5), verified-binding requirement on
activation (INV-19), and reconciliation cases + admin alerts for every money-moved-but-refused
path — stale/superseded session, duplicate payment, payment after reversal, amount mismatch,
malformed payload (INV-8/10/11/12/13). Audit of all money transitions (INV-14).
Depends on: Slice 5.

### Allowed files
- `db/migrations/006_payments_reconciliation.sql`
- `app/api/stripe/`
- `lib/payments/`
- `lib/enrollment/`
- `lib/reconciliation/`
- `lib/audit/`
- `app/admin/reconciliation/`
- `tests/payments-webhook/`

### Forbidden files
- `app/register/`
- `app/portal/`
- `app/api/portal/`
- `lib/pricing/`
- `lib/decisions/`
- `lib/identity/`

### Invariants touched
- INV-5 (payment-side serialization of the reversal/payment race)
- INV-7 (grant-time amount/currency/status verification)
- INV-9 (event-id idempotency)
- INV-10 (duplicate distinct payment detected, not absorbed)
- INV-11 (payment after reversal: no activation + reconciliation)
- INV-12 (money-moved-but-refused always opens a persisted reconciliation case)
- INV-13 (fail closed on missing/ambiguous payment data)
- INV-19 (entitlement binds to the verified account)
- INV-14 (audit of money transitions)
- INV-8 (superseded-session payment outcome — completion half)

### Tests required
- Unit: payload parsing fail-closed table (each required field nulled/absent/garbled); amount
  comparison incl. currency mismatch.
- Integration (Stripe events simulated): happy-path activation; replayed event id; second
  distinct payment; payment on withdrawn enrollment; payment on superseded session; reversal
  raced against webhook (both interleavings); activation without verified binding refused; each
  refused-money path yields a reconciliation case visible in the admin area.

### Proof obligations
All via regression-check.mjs with an attributed STRONG_RED expected at review time:
- INV-7 — `tests/payments-webhook/grant-time-verification.test.ts` (mismatched amount/currency/status never activates); expected attributed STRONG_RED: skipping the owed comparison before activation turns the test red.
- INV-5 — `tests/payments-webhook/reversal-race.test.ts` (conditional activation from `awaiting_payment` only; reversal-then-payment yields withdrawn + reconciliation case, both interleavings); expected attributed STRONG_RED: replacing the conditional update with an unconditional state write turns the test red.
- INV-9 — `tests/payments-webhook/event-idempotency.test.ts` (same Stripe event id twice is a no-op); expected attributed STRONG_RED: removing the durable idempotency-key check turns the test red.
- INV-10 — `tests/payments-webhook/duplicate-payment.test.ts` (second distinct payment opens a refund-needed case); expected attributed STRONG_RED: classifying any repeat payment as a replay turns the test red.
- INV-11 — `tests/payments-webhook/payment-after-reversal.test.ts` (withdrawn stays withdrawn, case opened with Stripe ids); expected attributed STRONG_RED: allowing activation from `withdrawn` turns the test red.
- INV-8 — `tests/payments-webhook/superseded-session-payment.test.ts` (completion on a superseded session activates nothing and opens a case); expected attributed STRONG_RED: honoring any completed session regardless of supersession turns the test red.
- INV-12 — `tests/payments-webhook/reconciliation-persisted.test.ts` (every refused-money path persists a case, not only logs); expected attributed STRONG_RED: downgrading the case write to a logger call turns the test red.
- INV-13 — `tests/payments-webhook/fail-closed-parsing.test.ts` (field-absence/garbling table refuses activation); expected attributed STRONG_RED: defaulting a missing amount or status to success turns the test red.
- INV-19 — `tests/payments-webhook/entitlement-binding.test.ts` (activation records the verified account and refuses when no verified binding exists); expected attributed STRONG_RED: dropping the binding lookup from activation turns the test red.
- INV-14 — `tests/payments-webhook/money-audit.test.ts` (every money transition writes an audit record); expected attributed STRONG_RED: removing the audit write from activation turns the test red.

### Rollback notes
Revert commit + down-migrate 006 and disable the Stripe webhook endpoint in the dashboard
(external state — record in run log). Because activation is the only writer that grants
entitlement, reverting the slice returns the system to fail-closed (paid-but-not-activated
states surface as reconciliation work, never as silent grants).

### Done criteria
AC-8 (race half), AC-13–AC-20 pass end-to-end against simulated Stripe events; the admin
reconciliation view lists every refused-money case; all ten named regression tests exist with
attributed STRONG_RED.

## Slice 7: Enrolled experience — schedules and announcements

### Scope
Portal views for actively enrolled kids: cohort training schedule and cohort-scoped
announcements (INV-16); admin announcement CRUD (INV-17) reusing Slice 2's guard. Visibility is
gated on `active` enrollment in the specific cohort.
Depends on: Slice 6 (active state), Slice 2 (admin shell).

### Allowed files
- `db/migrations/007_announcements.sql`
- `app/portal/schedule/`
- `app/portal/announcements/`
- `app/admin/announcements/`
- `app/api/admin/announcements/`
- `app/api/portal/cohort/`
- `lib/announcements/`
- `lib/audit/`
- `tests/announcements/`

### Forbidden files
- `app/register/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`
- `lib/decisions/`
- `lib/identity/`

### Invariants touched
- INV-16 (schedule/announcements only for active enrollment in that cohort, or admins)
- INV-17 (announcement mutations are admin-only)

### Tests required
- Integration: active-enrollment account sees its cohort's schedule/announcements;
  `awaiting_payment`, withdrawn, other-cohort, and anonymous principals see none; admin CRUD
  round-trip; cohort-targeting of announcements (A11).

### Proof obligations
- INV-16 — regression test `tests/announcements/enrolled-visibility.test.ts` (non-active and wrong-cohort principals receive no schedule/announcement data); expected attributed STRONG_RED via regression-check.mjs: dropping the active-enrollment predicate from the query turns the test red.
- INV-17 — regression test `tests/announcements/announcements-authz.test.ts` (announcement mutations reject non-admin principals); expected attributed STRONG_RED: unguarding the announcement route turns the test red.

### Rollback notes
Revert commit + down-migrate 007. Purely additive on top of Slices 1–6; no money or identity
state is touched.

### Done criteria
AC-21, AC-23 pass; AC-6 extended to announcement routes; both STRONG_RED-bearing regression
tests exist and are attributed.
