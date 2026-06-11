# Implementation slices

Greenfield Next.js (App Router) + Postgres + Stripe + hosted auth. File layout convention used by
all slices: `app/(public)/` public site, `app/portal/` parent portal, `app/admin/` admin area,
`app/api/` route handlers, `lib/<domain>/` domain logic, `lib/db/` schema/client/migrations,
`tests/` mirrors `lib`/`app`. Each slice = one verified-implementation run = one ship-review.
Slices 6 and 7 are planning-complete but **implementation-blocked on OQ-1/OQ-2** (high, open).

## Slice 1: Data model and project foundation

### Scope
Scaffold the Next.js + Postgres project and create the core schema: families, guardians,
portal-account links, athletes, evaluation events (with capacity), registrations, waivers,
decisions, cohorts, enrollments (with state enum and plan/gear fields), payments, sessions,
announcements, and the server-side price book constants. Migrations + typed db client + seed for
the inaugural event and launch cohorts. No routes, no UI beyond a health check.

### Allowed files
- `lib/db/`
- `lib/pricing/`
- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `.env.example`
- `app/api/health/`
- `tests/db/`
- `tests/pricing/`

### Forbidden files
- `app/(public)/`
- `app/portal/`
- `app/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/auth/`
- `.env`
- `.env.local`

### Invariants touched
- INV-1 (price book lives server-side here; amounts as constants with unit tests)
- Schema-level groundwork for INV-5, INV-6, INV-10 (state enums, capacity column, FK shape)

### Tests required
- Migration up/down round-trip on a scratch database.
- Price book unit tests: exactly four (position, plan) pairs → 120000/400000/50000/170000 cents;
  unknown pairs throw.
- Enrollment state enum permits only pending_payment | enrolled | revoked.

### Proof obligations
- Price-book regression test exists and is named (`tests/pricing/price-book.test.ts`) — will
  require an attributed STRONG_RED via regression-check.mjs at ship-review since it guards
  INV-1 (L2).
- `.env`/secrets are git-ignored; `.env.example` contains placeholders only.

### Rollback notes
Revert the commit; drop the scratch schema. Additive only — nothing depends on it yet.

### Done criteria
Migrations apply cleanly to a fresh Postgres; price-book tests green; lint/typecheck green; no
route except health check exists.

## Slice 2: Public evaluation registration with capacity cap and waiver

Depends on: Slice 1.

### Scope
Public registration flow: form for parent info + one or more kids (name, birth date, grade 3–12,
position QB/WR/DB, school, gear sizes) + typed-name waiver; server action/API that validates,
enforces the event capacity atomically (single transaction, row-lock or conditional insert), and
persists family/guardians/athletes/registrations/waiver together. Full/closed event shows the
"full" state. No prices and no athlete data are ever rendered publicly.

### Allowed files
- `app/(public)/`
- `app/api/registration/`
- `lib/registration/`
- `lib/db/migrations/`
- `tests/registration/`

### Forbidden files
- `app/portal/`
- `app/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`
- `lib/auth/`
- `lib/decisions/`

### Invariants touched
- INV-6 (atomic capacity enforcement)
- INV-7 (no waiver, no registration)
- INV-11 (no athlete PII on public surfaces)
- INV-3 (no prices on public surfaces — enforced by this slice owning all public pages)

### Tests required
- Happy path: multi-kid family persists atomically; partial failure persists nothing.
- Waiver missing → rejected, nothing persisted (INV-7).
- Capacity: 59/60 + 2-kid submission → refused per the slice's documented rule; count never
  exceeds capacity (INV-6).
- Concurrency test: parallel submissions for the last spot → exactly one accepted (INV-6).
- Public-surface scan test: rendered public pages and `app/api/registration` responses contain
  no price-book amounts and no athlete PII (INV-3, INV-11).

### Proof obligations
- Named regression tests for INV-6 (`tests/registration/capacity-race.test.ts`) and INV-7
  (`tests/registration/waiver-required.test.ts`) — L2, attributed STRONG_RED required at review.
- Demonstrate the capacity check and insert occur in one transaction (test asserts behavior
  under concurrency, not implementation).

### Rollback notes
Feature-flag the form route or revert; registration tables are additive (Slice 1), so disabling
the route fully rolls back user-visible behavior.

### Done criteria
A family can register until the event is full; full event refuses; all tests above green;
acceptance criteria 1–6 demonstrably pass.

## Slice 3: Parent portal authentication and account-to-family binding

Depends on: Slice 1, Slice 2.

### Scope
Integrate the hosted auth provider for the portal; implement family binding: a signed-in account
is linked to a family iff the provider-verified email equals a registration's parent email
(exact, normalized match), else the portal shows "no registration found" and an admin-link
escape hatch (admin UI for linking lands in Slice 4's admin shell; this slice exposes the
server-side link primitive). Session handling, middleware-protected `app/portal/` routes, and
the family-scoped data-access layer every later portal feature must use.

### Allowed files
- `app/portal/`
- `app/api/auth/`
- `lib/auth/`
- `lib/db/migrations/`
- `middleware.ts`
- `tests/auth/`

### Forbidden files
- `app/(public)/`
- `app/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/pricing/`
- `lib/registration/`

### Invariants touched
- INV-4 (binding requires provider-verified email control)
- INV-11 (family-scoped reads only — the scoping layer is built here)

### Tests required
- Verified-email match → family bound; unverified or mismatched email → no binding, no data
  (INV-4).
- Cross-family access attempts (other family's athlete id via portal routes) → denied, no PII
  (INV-11).
- Unauthenticated requests to any `app/portal/` route → redirected/denied.
- Email normalization cases (case, whitespace) bind correctly; lookalike addresses do not.

### Proof obligations
- Named regression tests for INV-4 (`tests/auth/binding-verified-email.test.ts`) and INV-11
  (`tests/auth/family-scoping.test.ts`) — L2, attributed STRONG_RED at review.
- Document (in the slice's contract) which provider claim is treated as "verified email" and
  that the provider is configured to require verification.

### Rollback notes
Portal routes behind auth middleware; revert the slice and the portal disappears while public
registration (Slice 2) keeps working. Binding rows are additive.

### Done criteria
A parent with a verified matching email signs in and sees their kids listed with statuses;
mismatched accounts see none; acceptance criteria 7–8 pass.

## Slice 4: Admin area shell, selection decisions, and reversal

Depends on: Slice 1, Slice 2, Slice 3 (admin role rides the same auth integration).

### Scope
Admin-gated area: registration list per event; decide each kid selected (choose cohort + skill
tier → creates pending_payment enrollment) or not selected; re-decide in either direction while
unpaid (reversal voids the pending enrollment → revoked); refuse re-decision once a succeeded
payment exists. Admin role check on every admin route and mutation; manual account↔family link
UI using Slice 3's primitive. Emits a domain event/outbox row for "kid selected" that Slice 5
consumes (no email sending here).

### Allowed files
- `app/admin/`
- `lib/decisions/`
- `lib/auth/admin-role.ts`
- `lib/db/migrations/`
- `tests/decisions/`

### Forbidden files
- `app/(public)/`
- `app/portal/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/email/`
- `lib/registration/`

### Invariants touched
- INV-9 (admin-only mutations)
- INV-5 (reversibility only while unpaid; paid enrollments untouched)
- INV-10 (revoked enrollments become unpayable — the state this slice writes is what Slice 7
  validates)
- INV-8 (decision commit is independent of notification — outbox written transactionally,
  delivery elsewhere)

### Tests required
- Parent-role account calling every admin route/mutation → denied (INV-9).
- Select → enrollment pending_payment with cohort + tier; reverse → revoked (INV-5, INV-10).
- Re-decision after a succeeded payment → refused, enrollment unchanged (INV-5).
- Selection commits even when the outbox consumer is down (INV-8 groundwork).

### Proof obligations
- Named regression tests for INV-9 (`tests/decisions/admin-only.test.ts`) and INV-5
  (`tests/decisions/reversal-unpaid-only.test.ts`) — L2, attributed STRONG_RED at review.
- Admin role provisioning method recorded per OQ-9's resolution (assumption A10 until then).

### Rollback notes
Revert slice; decisions/enrollments tables are additive. In-flight decisions would need manual
DB correction — acceptable pre-launch.

### Done criteria
Admins can decide and re-decide per the rules; parents cannot touch admin surfaces; acceptance
criteria 9–12 pass (13–14 complete in Slice 5).

## Slice 5: Best-effort selection notification email

Depends on: Slice 4.

### Scope
Async consumer of the "kid selected" outbox: sends the "your kid was selected — log in and pay"
email via the chosen provider, exactly once per selection event, with retry + dead-letter and an
admin-visible failure list. Email failure never blocks or reverts the decision (it already
committed in Slice 4).

### Allowed files
- `lib/email/`
- `app/api/jobs/`
- `app/admin/notifications/`
- `lib/db/migrations/`
- `tests/email/`

### Forbidden files
- `app/(public)/`
- `app/portal/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/decisions/`
- `lib/registration/`

### Invariants touched
- INV-8 (decision survives email failure; async, logged)

### Tests required
- Provider failure → decision intact, failure logged and visible to admins, retries scheduled
  (INV-8).
- Exactly-once per selection event under consumer retry (no duplicate emails for one decision).
- Reversal before send → pending notification cancelled or send suppressed.

### Proof obligations
- Named regression test for INV-8 (`tests/email/best-effort.test.ts`) — L1, standard test
  evidence (STRONG_RED attribution not mandated below L2, still recommended).

### Rollback notes
Disable the job route/consumer; selections continue to work by design ("we'll call the family").
Fully detachable.

### Done criteria
Selections email parents once; outages degrade to logged failures without touching decisions;
acceptance criteria 13–14 pass.

## Slice 6: Portal status and authenticated pricing display

Depends on: Slice 3, Slice 4. **Implementation-blocked on OQ-2 (full-year scope wording).**

### Scope
Parent portal kid-status view across the lifecycle (registered / selected — payment due / not
selected / enrolled) and the pricing panel: shown only for the parent's own kid, only while
selected/pending_payment, computing display prices server-side from the price book by the
enrollment's position — per-cohort and full-year options side by side with plan-choice UI state
(actual charging is Slice 7). No price ever reaches an unauthenticated response.

### Allowed files
- `app/portal/`
- `lib/pricing/display.ts`
- `tests/portal/`

### Forbidden files
- `app/(public)/`
- `app/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/decisions/`
- `lib/registration/`

### Invariants touched
- INV-3 (pricing only authenticated + own kid + selected)
- INV-4 (rides the Slice 3 binding — no pricing for unbound accounts)
- INV-11 (status view stays family-scoped)

### Tests required
- Pricing visible exactly when (authenticated ∧ own kid ∧ selected-unpaid); hidden before
  selection, after revocation, for other families, and unauthenticated (INV-3, INV-4).
- QB shows $1,200/$4,000; WR/DB show $500/$1,700 — sourced from the server price book, asserted
  against `lib/pricing` constants, not duplicated literals (INV-1 hygiene, owned by Slice 7).
- Snapshot/scan test: no price-book amount in any unauthenticated render (INV-3).

### Proof obligations
- Named regression test for INV-3 (`tests/portal/pricing-visibility.test.ts`) — L2, attributed
  STRONG_RED at review.

### Rollback notes
Revert; portal falls back to status-only view (Slice 3). No schema changes.

### Done criteria
Acceptance criterion 15 passes; status projection correct for all five lifecycle states.

## Slice 7: Stripe checkout, payment verification, and enrollment transition

Depends on: Slice 6. **Implementation-blocked on OQ-1 and OQ-2 (high, open).**

### Scope
Server-side payment initiation: parent picks plan (per-cohort | full-year) for their own
selected kid; server creates a Stripe Checkout session whose amount comes only from the price
book for (enrollment.position, chosen plan); records plan + gear entitlement on the enrollment.
Signature-verified, idempotent webhook consumes success events: pending_payment → enrolled;
revoked/already-enrolled targets are flagged for admin reconciliation, never auto-enrolled.
Redirect/success page is display-only.

### Allowed files
- `app/api/stripe/`
- `lib/payments/`
- `app/portal/pay/`
- `lib/db/migrations/`
- `tests/payments/`

### Forbidden files
- `app/(public)/`
- `app/admin/`
- `lib/decisions/`
- `lib/registration/`
- `lib/auth/`
- `lib/pricing/display.ts`

### Invariants touched
- INV-1 (server-computed amount only)
- INV-2 (enrolled only via verified server-side confirmation)
- INV-10 (state validated in the webhook; revoked never auto-enrolls)
- INV-12 (signature verification + event-id idempotency)

### Tests required
- For all four (position, plan) pairs: created session amount equals price book; tampered
  client inputs (amount, plan, foreign enrollment id) cannot alter amount/target (INV-1).
- Crafted success-URL visit without payment → still pending_payment (INV-2).
- Invalid webhook signature → rejected, no state change (INV-12).
- Valid success webhook → enrolled exactly once; replay of same event id → no further change
  (INV-2, INV-12).
- Success webhook for revoked enrollment → not enrolled, reconciliation flag raised (INV-10).

### Proof obligations
- Named regression tests for INV-1 (`tests/payments/server-priced.test.ts`), INV-2/INV-12
  (`tests/payments/webhook-verify-idempotent.test.ts`), INV-10
  (`tests/payments/revoked-not-enrollable.test.ts`) — all L2, attributed STRONG_RED at review.
- Stripe webhook secret and API keys via env only; never committed.
- **Gate:** do not start implementation while OQ-1/OQ-2 are open — their answers can change
  this slice's scope (refund handling, what a full-year charge entitles).

### Rollback notes
Feature-flag the pay button; webhook endpoint can be disabled at Stripe. Payments already taken
are real money — rollback of code never deletes payment records; reconciliation is manual.

### Done criteria
Acceptance criteria 16–21 pass against Stripe test mode, including replay and tamper cases.

## Slice 8: Admin cohort, session, and announcement management

Depends on: Slice 4 (admin shell). Independent of Slices 5–7.

### Scope
Admin CRUD for cohorts (name, position focus, term dates, inaugural flag), their sessions
(date/time, location, notes), and cohort-scoped announcements. All mutations admin-role-gated.
Replaces the Slice 1 seed as the way cohorts are maintained.

### Allowed files
- `app/admin/cohorts/`
- `app/admin/announcements/`
- `lib/cohorts/`
- `lib/announcements/`
- `lib/db/migrations/`
- `tests/cohorts/`

### Forbidden files
- `app/(public)/`
- `app/portal/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/decisions/`
- `lib/registration/`

### Invariants touched
- INV-9 (admin-only management operations)

### Tests required
- Parent-role and unauthenticated calls to every cohort/session/announcement mutation → denied
  (INV-9).
- CRUD round-trips persist correctly; deleting a session does not orphan enrollments.

### Proof obligations
- INV-9's named regression test from Slice 4 extended to cover these routes
  (`tests/cohorts/admin-only.test.ts`) — L2, attributed STRONG_RED at review.

### Rollback notes
Revert; cohorts fall back to seeded data. Additive schema only.

### Done criteria
Admins manage cohorts/sessions/announcements end to end; acceptance criterion 23's admin half
passes.

## Slice 9: Enrolled portal — schedule and announcements view

Depends on: Slice 7, Slice 8.

### Scope
For enrolled kids only: portal shows the kid's cohort training schedule (sessions) and that
cohort's announcements. Pending-payment, not-selected, and revoked states see none of it.
Read-only; uses Slice 3's family-scoped access layer.

### Allowed files
- `app/portal/schedule/`
- `app/portal/announcements/`
- `lib/schedule-view/`
- `tests/portal-schedule/`

### Forbidden files
- `app/(public)/`
- `app/admin/`
- `app/api/stripe/`
- `lib/payments/`
- `lib/cohorts/`
- `lib/decisions/`

### Invariants touched
- INV-11 (cohort content visible only to families with an enrolled kid in that cohort)

### Tests required
- Enrolled family sees their cohort's sessions + announcements; pending_payment family does not;
  other-cohort enrolled family does not see this cohort's content (INV-11).
- Unauthenticated requests to schedule/announcement routes → denied (INV-11).

### Proof obligations
- Named regression test for the cohort-scoping rule
  (`tests/portal-schedule/enrolled-scope.test.ts`) — guards INV-11 (L2), attributed STRONG_RED
  at review.

### Rollback notes
Revert; enrolled families lose the schedule view but enrollment/payment state is untouched.
Read-only slice, no schema changes.

### Done criteria
Acceptance criteria 22 and 24 pass; full lifecycle demo (register → select → pay (test mode) →
see schedule) works end to end.
