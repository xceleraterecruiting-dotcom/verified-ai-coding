# Implementation slices

Greenfield Next.js (App Router) + Postgres + Stripe + hosted auth. Proposed layout: `prisma/`
(schema + migrations), `src/lib/` (domain/services), `src/app/(public)/` (unauthenticated),
`src/app/portal/` (parent), `src/app/admin/` (admin), `src/app/api/` (route handlers),
`tests/`. One slice = one verified-implementation run = one ship-review. Build in dependency
order; slices 5 and 8 are independent of each other and of 6.

**Blocked note:** Slice 7 must not start while OQ-1/OQ-2 (full-year entitlement, renewal
semantics) are open — they change what a payment record entitles.

## Slice 1: Project scaffold and core data model

### Scope
Initialize the Next.js app and Postgres schema: families, parents, admins, children,
evaluation event (capacity), registrations, waiver signatures, cohorts, enrollments, decisions,
payments, sessions, announcements. Encode the child-status and enrollment state machines and
the gear-entitlement rule as pure domain functions. Dev seed data. No business routes or UI
beyond the default shell.

### Allowed files
- package.json
- package-lock.json
- next.config.mjs
- tsconfig.json
- .env.example
- prisma/
- src/lib/db/
- src/lib/domain/
- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css
- tests/unit/domain/

### Forbidden files
- src/app/(public)/
- src/app/portal/
- src/app/admin/
- src/app/api/
- src/lib/payments/
- src/lib/auth/

### Invariants touched
- INV-13 — transition rules encoded as the single domain-layer transition function.
- INV-12 — gear entitlement as a pure function.

### Tests required
- Unit: every legal transition in `domain-model.md` is accepted; every illegal transition
  (notably `registered → enrolled`, `pending_payment → active` without payment evidence) is
  rejected by the domain function.
- Unit: gear entitlement truth table (AC-11).
- Migration applies cleanly to an empty database.

### Proof obligations
- Regression test `transitions.rejects-illegal` proving INV-13 at the domain layer (L2: will
  require an attributed STRONG_RED via regression-check.mjs at remediation/review time).
- Regression test `gear-entitlement.matrix` for INV-12.

### Rollback notes
Revert the slice commit; the initial migration is additive on an empty database — drop and
re-create in dev. No production data exists yet.

### Done criteria
Migrations apply; domain unit tests pass; AC-13's domain-layer half is provable; no
pricing, payment, auth, or UI code exists in the diff.

## Slice 2: Public registration with waiver and capacity cap

Depends on: Slice 1.

### Scope
Public registration flow: form for parent info + one or more children (name, birth date, grade,
position, school, gear sizes), typed-name waiver gate, transactional capacity enforcement
against the evaluation event, confirmation and "we're full" states. No authentication, no
pricing anywhere on these pages.

### Allowed files
- src/app/(public)/
- src/lib/registration/
- src/app/api/registration/
- prisma/migrations/
- tests/registration/

### Forbidden files
- src/app/portal/
- src/app/admin/
- src/lib/payments/
- src/lib/pricing/
- src/lib/auth/

### Invariants touched
- INV-6 — waiver required, stored immutably.
- INV-7 — hard cap under concurrency, whole-submission rejection.
- INV-11 — submitted PII never echoed on public routes beyond the submitter's own confirmation.
- INV-3 — no price strings reachable from any public route.

### Tests required
- Concurrency test: two simultaneous one-child submissions at 59/60 → exactly one accepted
  (AC-1).
- Whole-family rejection at the boundary (AC-1).
- Missing/empty waiver name rejected, nothing persisted (AC-2).
- Multi-child submission captures all per-child fields (AC-14).
- Public-route sweep: no occurrence of 1200/4000/500/1700 pricing strings or pricing endpoints
  without auth (AC-3 public half).

### Proof obligations
- Regression tests `registration.cap-concurrent` (INV-7) and `registration.requires-waiver`
  (INV-6) — both L2, attributed STRONG_RED required at review time.

### Rollback notes
Revert the slice; tables came from Slice 1, any migration here is additive. Registration data
already collected survives (do not destroy on rollback).

### Done criteria
AC-1, AC-2, AC-14, and the public half of AC-3 pass; a full registration round-trips into the
database; the diff contains no portal/admin/payment code.

## Slice 3: Auth and access-control foundation

Depends on: Slice 1.

### Scope
Integrate the hosted auth provider: parent sign-in (email-based), linking an authenticated
identity to its family (by registration email), admin role assignment, route guards for
`/portal` and `/admin`, and a server-side ownership-check helper every later slice must use.
No portal/admin features yet — just protected shells and the authorization primitives.

### Allowed files
- src/lib/auth/
- src/middleware.ts
- src/app/portal/layout.tsx
- src/app/portal/page.tsx
- src/app/admin/layout.tsx
- src/app/admin/page.tsx
- prisma/migrations/
- .env.example
- tests/auth/

### Forbidden files
- src/app/(public)/
- src/lib/payments/
- src/lib/pricing/
- src/lib/registration/

### Invariants touched
- INV-4 — ownership helper denies cross-family access by construction.
- INV-5 — admin gating at layout/middleware and server-action level.
- INV-11 — no PII served to unauthenticated or wrong-family requests.

### Tests required
- Anonymous → portal and admin: denied/redirected (AC-4, AC-5).
- Parent token → admin shell: denied (AC-5).
- Ownership helper: parent A + parent B's child id → deny, no PII in response (AC-4).

### Proof obligations
- Regression test `authz.cross-family-denied` (INV-4) and `authz.admin-gate` (INV-5) — L2,
  attributed STRONG_RED required at review time.

### Rollback notes
Revert the slice; auth linkage columns are additive. Hosted-provider config is external —
document teardown in the slice PR.

### Done criteria
AC-5 passes for the shells; ownership helper has deny-by-default tests; a parent can sign in
and reach an empty portal shell; admin reaches an empty admin shell.

## Slice 4: Admin selection decisions and enrollment creation

Depends on: Slice 1, Slice 3.

### Scope
Admin registrations review: list children with registration details; decide selected (choose
cohort + skill tier → creates `pending_payment` enrollment) or not selected; reverse either
decision while unpaid (cancels pending enrollment); decision history retained. Uses Slice 1's
transition function exclusively.

### Allowed files
- src/app/admin/registrations/
- src/app/admin/decisions/
- src/lib/decisions/
- src/app/api/admin/decisions/
- tests/decisions/

### Forbidden files
- src/app/(public)/
- src/app/portal/
- src/lib/payments/
- src/lib/pricing/
- src/lib/notifications/

### Invariants touched
- INV-5 — admin-only.
- INV-8 — reversal refused once a payment has succeeded.
- INV-13 — all changes via the domain transition function.
- INV-1 — selection creates `pending_payment`, never `active`.

### Tests required
- Select → enrollment exists in `pending_payment`, child `selected`, never `enrolled` (AC-7
  precondition, AC-13).
- Reverse before payment → child back to `registered`/`not_selected`, enrollment `cancelled`
  (AC-6).
- Reverse with a seeded succeeded payment → refused (AC-6).
- Parent/anonymous → decision endpoints denied (AC-5).

### Proof obligations
- Regression test `decisions.reversal-blocked-after-payment` (INV-8) — L2, attributed
  STRONG_RED required at review time.
- Regression test `decisions.selection-never-activates` (INV-1 boundary in this slice).

### Rollback notes
Revert the slice; decisions/enrollments rows are additive history — reversal is the in-domain
undo, no destructive rollback needed.

### Done criteria
AC-6 passes; AC-5 covers decision routes; decision history visible to admins; no email or
payment code in the diff.

## Slice 5: Best-effort selection email

Depends on: Slice 4. Independent of Slices 6–9.

### Scope
On a selected decision, asynchronously email the parent: child selected, log in to the portal
to pay (no prices in the email — see intake interpretation notes). Email failures are caught
and logged; the decision flow never awaits-and-fails on the send. Provider behind a thin
interface (OQ-7).

### Allowed files
- src/lib/notifications/
- src/app/api/admin/decisions/
- src/lib/decisions/
- .env.example
- tests/notifications/

### Forbidden files
- src/app/(public)/
- src/app/portal/
- src/lib/payments/
- src/lib/pricing/
- prisma/

### Invariants touched
- INV-10 — email failure never blocks or rolls back selection.
- INV-3 — email contains no pricing (disclosure stays in the portal).

### Tests required
- Provider throws/times out → decision still committed, failure logged (AC-10).
- Sent email content includes login instruction and no price strings.
- Reversal then re-selection sends again (no dedupe bug silently dropping notice).

### Proof obligations
- Regression test `notifications.selection-survives-email-failure` (INV-10) — L2, attributed
  STRONG_RED required at review time.

### Rollback notes
Feature-flag the send (env var); disabling the flag restores Slice 4 behavior exactly.

### Done criteria
AC-10 passes; selection latency does not depend on provider availability; log entry exists on
simulated failure.

## Slice 6: Parent portal — status and pricing reveal

Depends on: Slice 3, Slice 4.

### Scope
Portal dashboard: list the family's children with statuses (registered / selected /
not_selected / enrolled). For a `selected` child, show the position-based pricing (both plans)
and a plan selector leading to a payment stub (no charging yet). Introduce the single
server-side pricing module. Pricing renders only behind auth + ownership + `selected`-or-later
status.

### Allowed files
- src/app/portal/
- src/lib/pricing/
- src/lib/portal/
- tests/portal/

### Forbidden files
- src/app/(public)/
- src/app/admin/
- src/lib/payments/
- src/app/api/webhooks/
- prisma/

### Invariants touched
- INV-3 — pricing only for own, selected child, authenticated.
- INV-4 — dashboard scoped to own family.
- INV-11 — no cross-family PII.
- INV-2 — pricing module is the single source later used by payment creation.

### Tests required
- Parent of `registered`/`not_selected` child sees status but no pricing (AC-3).
- Parent of `selected` child sees correct matrix prices for the child's position (AC-3, AC-8
  display half).
- Parent A cannot render parent B's child page (AC-4).
- Pricing module unit test: exact four amounts in cents, unknown position rejected.

### Proof obligations
- Regression test `pricing.hidden-until-selected` (INV-3) — L2, attributed STRONG_RED required
  at review time.

### Rollback notes
Revert the slice; read-only UI plus a pure pricing module — additive only.

### Done criteria
AC-3 fully passes (public sweep from Slice 2 + portal gating here); plan selector stores
nothing financial; pricing module is the only file defining amounts.

## Slice 7: Stripe payment and enrollment activation

Depends on: Slice 6. **Blocked by OQ-1 and OQ-2 (high, open) — do not start until resolved.**

### Scope
Card payment for a pending enrollment: server creates the Stripe Checkout session with the
amount from the pricing module and the plan chosen at payment time (per-cohort ⇄ full-year
switch); signature-verified webhook records the payment idempotently, activates the enrollment,
sets the child `enrolled`, and computes gear entitlement. Success/failure portal states.

### Allowed files
- src/lib/payments/
- src/app/api/webhooks/stripe/
- src/app/portal/pay/
- src/lib/pricing/
- prisma/migrations/
- .env.example
- tests/payments/

### Forbidden files
- src/app/(public)/
- src/app/admin/
- src/lib/registration/
- src/lib/notifications/

### Invariants touched
- INV-1 — activation only via verified payment.
- INV-2 — server-side amount from pricing module only.
- INV-9 — idempotent webhook/session handling.
- INV-13 — activation via the domain transition function.
- INV-8 — succeeded payment locks the decision.
- INV-12 — gear entitlement recorded at activation.
- INV-4 — a parent can pay only for their own child's enrollment.

### Tests required
- Redirect without webhook → still `pending_payment` (AC-7).
- Invalid webhook signature → rejected, no state change (AC-7).
- Duplicate webhook / replayed session → one payment, one activation (AC-9).
- Amount matrix per (position, plan) incl. plan switch at payment time (AC-8, AC-15).
- Tampered client amount/position/plan → server amount used or request rejected (AC-8).
- Gear entitlement matrix on activation (AC-11).
- Parent A cannot create a checkout for parent B's enrollment (AC-4).

### Proof obligations
- Regression tests `payments.activation-requires-verified-webhook` (INV-1),
  `payments.server-side-amount` (INV-2), `payments.webhook-idempotent` (INV-9) — all L2,
  attributed STRONG_RED required at review time.

### Rollback notes
Feature-flag the pay button; disabling returns the portal to Slice 6's stub. Stripe runs in
test mode until ship-review passes; any erroneous live charge is refunded manually in Stripe
(A4).

### Done criteria
AC-7, AC-8, AC-9, AC-11, AC-15 pass; webhook endpoint is the only writer of payment success;
OQ-1/OQ-2 answers are reflected in what the payment record entitles.

## Slice 8: Admin cohort, session, and announcement management

Depends on: Slice 1, Slice 3. Independent of Slices 4–7.

### Scope
Admin CRUD: cohorts (name, position focus, term dates, inaugural flag), sessions per cohort
(date/time/location), announcements (cohort-scoped, optional global pending OQ-11), and the
evaluation-event capacity setting. Admin-only throughout.

### Allowed files
- src/app/admin/cohorts/
- src/app/admin/sessions/
- src/app/admin/announcements/
- src/app/admin/settings/
- src/lib/admin-content/
- src/app/api/admin/
- tests/admin-content/

### Forbidden files
- src/app/(public)/
- src/app/portal/
- src/lib/payments/
- src/lib/pricing/
- src/lib/decisions/

### Invariants touched
- INV-5 — every route and mutation admin-gated.
- INV-7 — capacity setting feeds the cap; lowering below current confirmed count must warn,
  not retro-reject.

### Tests required
- Parent/anonymous denied on every CRUD route and mutation (AC-5).
- Cohort/session/announcement create-edit-delete round-trips (AC-16 admin half).
- Capacity edit persists and is read by the registration cap check.

### Proof obligations
- Regression test `admin-content.non-admin-denied` (INV-5) — L2, attributed STRONG_RED required
  at review time.

### Rollback notes
Revert the slice; content rows are additive. Deleting a cohort with enrollments must be blocked
in-domain (restrict, not cascade), so rollback never orphans enrollments.

### Done criteria
AC-5 passes across admin content routes; AC-16's admin half works; capacity setting drives
Slice 2's check.

## Slice 9: Enrolled portal — schedule and announcements

Depends on: Slice 7, Slice 8.

### Scope
For a child with an `active` enrollment, the portal shows that cohort's training schedule
(sessions) and its announcements (plus globals, pending OQ-11). Nothing of this content for
pending-payment or not-selected children.

### Allowed files
- src/app/portal/schedule/
- src/app/portal/
- src/lib/portal/
- tests/portal-enrolled/

### Forbidden files
- src/app/(public)/
- src/app/admin/
- src/lib/payments/
- src/lib/decisions/
- prisma/

### Invariants touched
- INV-14 — schedule/announcements gated on active (paid) enrollment.
- INV-4 — own-family scoping.
- INV-11 — no other family's data in payloads.

### Tests required
- Parent of `selected` (unpaid) child → no schedule/announcements (AC-12).
- After activation → that cohort's sessions and announcements visible (AC-12, AC-16).
- Another cohort's announcements not shown (AC-12).
- Parent A cannot view via parent B's child id (AC-4).

### Proof obligations
- Regression test `portal.paid-gating` (INV-14) — L2, attributed STRONG_RED required at review
  time.

### Rollback notes
Revert the slice; read-only views, additive only.

### Done criteria
AC-12 and AC-16 pass end-to-end (admin posts → paid parent sees); unpaid gating proven by
test, not by missing links.
