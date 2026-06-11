# Implementation slices — team hub

Ordering and dependencies are explicit and acyclic. One slice = one `verified-implementation`
run = one `ship-review`. File paths follow the provisional convention of assumption A8
(spec-intake.md): they encode boundaries and must be re-grounded against the real repo (which
Step 0 could not read) when each slice starts — preserving the same boundaries. Schema is
deliberately separated into Slice 1; every later slice forbids `db/migrations/`.

Slices 7, 12, and 13 are gated by open high-severity questions (OQ-003; OQ-001/OQ-002;
OQ-002) and must not start until those are answered by the user.

Proof-obligation bullets are single lines so the invariant id and its STRONG_RED commitment are
inseparable; "attributed STRONG_RED" means demonstrated via
`/Users/jorigeck/.verified-ai-coding/scripts/regression-check.mjs` at remediation/review time.

## Slice 1: Team hub schema and migrations

### Scope
Additive database migrations for all new hub entities: Post, Comment, CommentReport, FileAsset,
Rsvp, ReminderDispatch, Product, Order, OrderItem, PaymentRecord, AuditEntry, BadgeAward — each
with a `cohort_id` (or athlete-scoped for BadgeAward) per domain-model.md. No behavior, no
endpoints, no UI. Columns required by later invariants (e.g., PaymentRecord durable event ids,
Comment filter outcome, BadgeAward publication_state defaulting to withheld) are created here.
Depends on: nothing.

### Allowed files
- db/migrations/
- db/schema-docs/

### Forbidden files
- src/
- tests/e2e/

### Invariants touched
None at L2+ — schema is additive structure only; every invariant's *enforcement* lands in later
slices. The schema must not contradict them (e.g., BadgeAward publication state defaults to
withheld, supporting the badge-gate invariant's default-deny, which Slice 12 owns and proves).

### Tests required
- Migration up/down round-trip on a scratch database.
- Schema assertions: every hub table has cohort scoping columns and NOT NULL constraints named
  in domain-model.md; BadgeAward publication state defaults to withheld.

### Proof obligations
None — no L2+ invariant is enforced in this slice (STRONG_RED not applicable: schema-only,
no behavior exists yet to regress; behavioral proof lands with the owning slices).

### Rollback notes
Revert = run the paired down-migrations; additive-only, no existing table is altered, so
rollback cannot affect existing-system data.

### Done criteria
Migrations apply and revert cleanly; schema assertions pass; no application code changed.

## Slice 2: Cohort authorization guard

### Scope
A single server-side authorization layer ("is principal P a member of cohort C with role R?")
that every hub endpoint will use, built against the existing Membership interface (confirm the
interface first — A1). Includes the hub's route scaffold returning 403/404 for non-members.
Depends on: Slice 1.

### Allowed files
- src/hub/authz/
- src/hub/routes.*
- tests/hub/authz/

### Forbidden files
- db/migrations/
- src/auth/
- src/hub/board/
- src/hub/store/
- src/profiles/

### Invariants touched
- INV-01

### Tests required
- Unit: membership/role decisions for coach/parent/athlete across cohorts, including
  no-membership, multi-cohort membership, and unknown-cohort cases (deny by default).
- Integration: a cohort-B principal hitting a cohort-A scaffold route gets 403/404.

### Proof obligations
- INV-01 — attributed STRONG_RED required: regression test `hub-authz cross-cohort denial` (cohort-B principal denied on every guarded route class) must fail when the guard is deleted or bypassed.

### Rollback notes
Revert the slice commit; nothing else consumes the guard yet. Fail-closed: removing the guard
removes the routes that depend on it.

### Done criteria
Guard is the only authorization path into hub routes; AC-1/AC-2 pass at scaffold level; lint
and tests green.

## Slice 3: Message board — coach posts and parent comments

### Scope
Posts (coach-only create, cohort read) and comments (parent-only create) with the server-side
under-13 rule: an athlete principal younger than 13 can never author a comment (DOB from the
existing Athlete interface — confirm per A1; authority caveat OQ-004). Athletes do not comment
at all per the OQ-012 default. No profanity filter or reports yet (Slice 4) — the board ships
dark behind the hub scaffold until Slice 4 lands, because R4 makes the filter a precondition of
a visible board. Depends on: Slice 1, Slice 2.

### Allowed files
- src/hub/board/
- tests/hub/board/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/
- src/hub/moderation/
- src/profiles/

### Invariants touched
- INV-01
- INV-02

### Tests required
- Coach creates post; parent of same cohort comments; other-cohort principals denied (AC-3).
- Direct-API comment attempts by: under-13 athlete (rejected), 13+ athlete (rejected per
  default), parent (accepted) (AC-4, AC-5).
- Boundary: athlete whose 13th birthday is today/tomorrow.

### Proof obligations
- INV-02 — attributed STRONG_RED required: regression test `under-13 athlete comment rejected server-side (UI bypass)` must fail when the age check is removed.
- INV-01 — attributed STRONG_RED required: regression test `cross-cohort post/comment read+write denied` must fail when board queries lose cohort scoping.

### Rollback notes
Revert the slice commit; board tables (Slice 1) remain but are unreachable. Additive routes
only.

### Done criteria
AC-3, AC-4, AC-5 pass; no comment path bypasses the Slice 2 guard; OQ-004 caveat recorded in
the slice's run notes.

## Slice 4: Comment moderation — profanity filter and reports

### Scope
Submission-time profanity filter (block + stored reason, per A6; mechanism per OQ-007's
provisional blocklist) and the report button: persistent CommentReport records surfaced to the
cohort's coaches, with coach hide/restore actions. Depends on: Slice 3.

### Allowed files
- src/hub/moderation/
- src/hub/board/
- tests/hub/moderation/
- tests/hub/board/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/
- src/profiles/

### Invariants touched
- INV-03
- INV-04

### Tests required
- Filtered term ⇒ comment blocked at submission, invisible to all non-authors, reason stored
  (AC-6).
- Report ⇒ persistent record, coach moderation view shows it, content not auto-deleted,
  double-report keeps both records (AC-7).
- Filter applies on the only comment-write path (no second unfiltered endpoint).

### Proof obligations
- INV-03 — attributed STRONG_RED required: regression test `profanity-blocked comment never visible to non-authors` must fail when the filter is unhooked from the write path.
- INV-04 — attributed STRONG_RED required: regression test `report persists and reaches coach moderation view` must fail when the report write or its surfacing is removed.

### Rollback notes
Revert the slice commit. If the filter must be disabled in an emergency, the board reverts to
Slice 3 state — which must then ship dark again, since R4 makes the filter a precondition of a
visible board.

### Done criteria
AC-6, AC-7 pass; OQ-007's provisional blocklist choice is recorded as an assumption in the
slice run.

## Slice 5: Cohort file area

### Scope
Coach-only upload of practice plans and film clips with a server-enforced 100MB cap;
cohort-member-only listing and download via authenticated, expiring access (no durable public
URLs). Storage backend confirmed against the existing system at slice start (A1); file-type
allowlist and scanning pending OQ-009 (provisional: common doc/video types, no scanning —
recorded as the slice's assumption). Depends on: Slice 1, Slice 2.

### Allowed files
- src/hub/files/
- tests/hub/files/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/board/
- src/hub/store/

### Invariants touched
- INV-01
- INV-05
- INV-06

### Tests required
- Size boundary: 100MB accepted, 100MB+1 rejected server-side (AC-8).
- Cross-cohort metadata and content access denied; unauthenticated content fetch denied;
  signed URL expires (AC-9).
- Non-coach upload attempts rejected.

### Proof obligations
- INV-06 — attributed STRONG_RED required: regression test `file content unreachable without cohort auth; signed URL expires` must fail when the auth check or expiry is removed from the serving path.
- INV-01 — attributed STRONG_RED required: regression test `cross-cohort file listing/download denied` must fail when cohort scoping is dropped from file queries.
- INV-05 is L1 — covered by the size-boundary test (STRONG_RED not applicable: L1 invariant, no attributed STRONG_RED demanded beyond the boundary test).

### Rollback notes
Revert the slice commit; uploaded blobs remain in storage (orphaned but inaccessible) — note a
cleanup task if rolled back after real use.

### Done criteria
AC-8, AC-9 pass; serving path has exactly one entry point and it runs the Slice 2 guard.

## Slice 6: Session RSVP and headcount

### Scope
Per-session RSVP (parent responds yes/no for their athlete, using the existing Session
interface — confirm per A1) and a coach headcount view. No reminders (Slice 7). Depends on:
Slice 1, Slice 2.

### Allowed files
- src/hub/rsvp/
- tests/hub/rsvp/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/reminders/
- src/hub/store/

### Invariants touched
- INV-01

### Tests required
- Parent RSVPs for own athlete; cannot RSVP for another cohort's session or another family's
  athlete; headcount equals yes-count (AC-10).
- Re-submission updates rather than duplicates a response.

### Proof obligations
- INV-01 — attributed STRONG_RED required: regression test `cross-cohort RSVP write and headcount read denied` must fail when session/cohort scoping is removed.

### Rollback notes
Revert the slice commit; additive routes only, RSVP rows remain inert.

### Done criteria
AC-10 passes; headcount visible to coaches only.

## Slice 7: Morning-of SMS reminders (BLOCKED by OQ-003; audience per OQ-006)

### Scope
A scheduled morning job that sends one reminder SMS per recipient per session, consuming
Slice 6's RSVP data and an SMS provider interface. Consent-gated: no recorded opt-in ⇒ no send
(fail closed). DO NOT START until OQ-003 (consent) is answered; OQ-006 (audience/time) should
be answered with it. Depends on: Slice 6.

### Allowed files
- src/hub/reminders/
- tests/hub/reminders/

### Forbidden files
- db/migrations/
- src/hub/rsvp/
- src/hub/authz/
- src/hub/store/

### Invariants touched
- INV-07
- INV-08

### Tests required
- No consent record ⇒ no provider call, skip logged (AC-11).
- Double job run / concurrent run ⇒ exactly one dispatch per (session, recipient) (AC-12).
- Provider failure ⇒ retry does not double-send; timezone of "morning of" per OQ-006 answer.

### Proof obligations
- INV-07 — attributed STRONG_RED required: regression test `recipient without SMS consent is never sent` must fail when the consent check is removed from the send path.
- INV-08 — attributed STRONG_RED required: regression test `re-run of morning job is a no-op per (session, recipient)` must fail when the idempotency record/conditional insert is removed.

### Rollback notes
Disable the scheduled job (config), then revert; no data besides ReminderDispatch rows.

### Done criteria
AC-11, AC-12 pass; OQ-003/OQ-006 answers recorded in the run contract before any send code is
written.

## Slice 8: Store catalog and order creation

### Scope
Product catalog (shirts/shorts, canonical server-side prices) and order creation by an
authenticated parent of the cohort: order rows, server-computed totals, audit entries for the
creation transition. No payment capture yet (Slice 9) — orders stop at `pending_payment`.
Stock-decrement behavior pending OQ-010 (provisional: no decrement; an unfulfillable paid order
takes the cancel/refund path — recorded as the slice's assumption). Depends on: Slice 1,
Slice 2.

### Allowed files
- src/hub/store/catalog/
- src/hub/store/orders/
- tests/hub/store/catalog/
- tests/hub/store/orders/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/payments/
- src/hub/store/fulfillment/
- src/profiles/

### Invariants touched
- INV-01
- INV-09
- INV-15
- INV-16

### Tests required
- Tampered client price/total ignored; total always recomputed server-side (AC-13).
- Order creation by non-parent or out-of-cohort principal rejected; order visible to purchaser
  and cohort coach only (AC-20).
- Creation transition writes an AuditEntry (AC-19 subset).

### Proof obligations
- INV-09 — attributed STRONG_RED required: regression test `client-supplied price cannot change order total` must fail when server-side pricing is bypassed.
- INV-16 — attributed STRONG_RED required: regression test `order binds to authenticated cohort parent; other parents denied` must fail when the binding or visibility check is removed.
- INV-01 — attributed STRONG_RED required: regression test `cross-cohort order access denied` must fail when cohort scoping is removed from order queries.
- INV-15 — attributed STRONG_RED required: regression test `order-creation transition writes a complete AuditEntry` must fail when the audit write is removed.

### Rollback notes
Revert the slice commit; no money has moved in this slice (orders cannot reach `paid`),
so rollback is state-safe.

### Done criteria
AC-13, AC-20 pass; an order cannot reach `paid` by any path in this slice.

## Slice 9: Payment capture and webhook reconciliation

### Scope
Payment-session creation against the provider (per OQ-005 answer; A2 hosted-checkout style),
webhook/event processing with provider signature verification, and the grant-time gate:
`pending_payment → paid` only after verified captured amount/currency/status; durable-event-id
idempotency; one-open-session supersession rule; quarantine of unmatched events;
duplicate-distinct-payment alerting; audit of every transition. Depends on: Slice 8.

### Allowed files
- src/hub/store/payments/
- src/hub/store/orders/
- tests/hub/store/payments/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/catalog/
- src/hub/store/fulfillment/
- src/profiles/

### Invariants touched
- INV-10
- INV-11
- INV-12
- INV-13
- INV-15

### Tests required
- Wrong amount / wrong currency / authorized-not-captured / null-or-missing fields ⇒ order
  stays unpaid, alert raised (AC-14).
- Superseded session completing ⇒ not paid at stale amount, routed to reconciliation; unmatched
  event ⇒ quarantined (AC-15).
- Same durable event id twice ⇒ no-op second time (AC-16).
- Second distinct successful payment on a paid order ⇒ duplicate alert, state unchanged
  (AC-17).
- All transitions audited (AC-19 subset).

### Proof obligations
- INV-10 — attributed STRONG_RED required: regression test `mismatched/missing capture data never marks order paid` must fail when grant-time verification is removed.
- INV-11 — attributed STRONG_RED required: regression test `superseded session cannot pay order; unmatched event quarantined` must fail when supersession/quarantine logic is removed.
- INV-12 — attributed STRONG_RED required: regression test `webhook replay by durable event id is a no-op` must fail when the idempotency key check is removed.
- INV-13 — attributed STRONG_RED required: regression test `second distinct payment raises duplicate alert` must fail when duplicate detection is removed.
- INV-15 — attributed STRONG_RED required: regression test `every payment transition writes AuditEntry` must fail when the audit write is removed from the webhook path.

### Rollback notes
Feature-flag the store checkout entry point off (orders can no longer reach payment), drain
in-flight sessions, then revert. PaymentRecord/AuditEntry rows are retained for reconciliation
— never deleted on rollback.

### Done criteria
AC-14..AC-17 and the AC-19 payment subset pass; the webhook endpoint verifies provider
signatures; no path marks `paid` except the verified gate.

## Slice 10: Order cancellation and refund reconciliation

### Scope
Cancellation of unpaid/paid-unfulfilled orders with conditional state transitions serializing
cancel-vs-payment; the payment-after-cancel path: never fulfill, always emit a
refund/manual-reconciliation signal (mechanism per OQ-005 answer). Depends on: Slice 9.

### Allowed files
- src/hub/store/orders/
- src/hub/store/payments/
- tests/hub/store/cancellation/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/catalog/
- src/hub/store/fulfillment/

### Invariants touched
- INV-14
- INV-15

### Tests required
- Race both ways (cancel-then-webhook, webhook-then-cancel, concurrent) ⇒ consistent terminal
  state, refund/reconciliation signal when money landed on a canceled order, never
  canceled-and-silently-paid (AC-18).
- Cancel of a paid-unfulfilled order emits the refund signal; cancel of a fulfilled order is
  rejected (out of scope per non-goals).
- All transitions audited (AC-19 subset).

### Proof obligations
- INV-14 — attributed STRONG_RED required: regression test `cancel/payment interleavings never yield silent paid-canceled or fulfillment; refund signal emitted` must fail when the conditional transition is replaced by a blind update.
- INV-15 — attributed STRONG_RED required: regression test `cancellation transitions write AuditEntry` must fail when the audit write is removed.

### Rollback notes
Revert the slice commit; cancellation becomes unavailable (manual ops fallback) but no money
path is weakened — Slice 9's gates are untouched files.

### Done criteria
AC-18 and the AC-19 cancellation subset pass; the refund/reconciliation signal is a real
alerting artifact (queue item/incident), not a log line.

## Slice 11: Fulfillment at practice

### Scope
Coach marks a paid order fulfilled at handover; fulfillment requires `paid` state, records the
purchaser identity and fulfilling coach, and is audited. Depends on: Slice 9.

### Allowed files
- src/hub/store/fulfillment/
- src/hub/store/orders/
- tests/hub/store/fulfillment/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/catalog/
- src/hub/store/payments/

### Invariants touched
- INV-15
- INV-16

### Tests required
- Fulfilling an unpaid or canceled order is rejected; only cohort coaches can fulfill; the
  fulfillment record names the purchasing parent (AC-20 subset).
- Fulfillment transition audited (AC-19 subset).
- Double-fulfillment is rejected.

### Proof obligations
- INV-16 — attributed STRONG_RED required: regression test `fulfillment only for paid orders, by cohort coach, recorded against the verified purchaser` must fail when the paid-state or purchaser check is removed.
- INV-15 — attributed STRONG_RED required: regression test `fulfillment transition writes AuditEntry` must fail when the audit write is removed.

### Rollback notes
Revert the slice commit; orders stay `paid` and are fulfilled manually off-system until
re-shipped.

### Done criteria
AC-19/AC-20 fulfillment subsets pass; no transition out of `paid` exists except `fulfilled`
(and Slice 10's cancel-with-refund).

## Slice 12: Attendance badges and gated public display (BLOCKED by OQ-001 and OQ-002)

### Scope
Badge computation from the canonical attendance source (interface per OQ-002 answer; streak
definitions per OQ-011) and the public-profile badge module with a default-deny publication
gate (consent regime per OQ-001 answer). DO NOT START until OQ-001 and OQ-002 are answered.
The public render path ships default-deny and only opens per the OQ-001 regime. Depends on:
Slice 1; consumes the attendance interface (and Slice 6's RSVP only if OQ-002 designates RSVP
as the source).

### Allowed files
- src/hub/badges/
- src/profiles/badges/
- tests/hub/badges/

### Forbidden files
- db/migrations/
- src/hub/store/
- src/hub/authz/
- src/hub/board/

### Invariants touched
- INV-17
- INV-18

### Tests required
- Gate unsatisfied ⇒ zero badge data in public page and public API for every athlete (AC-21).
- Gate satisfied per the OQ-001 regime ⇒ badge renders; revoking consent removes it.
- Badge changes only when the attendance source changes; no public endpoint leaks attendance
  detail (AC-22).
- Streak boundaries per OQ-011 definitions.

### Proof obligations
- INV-17 — attributed STRONG_RED required (L3 — non-negotiable, no not-applicable claim accepted): regression test `public profile renders no badge data while publication gate unsatisfied (default-deny)` must fail when the gate check is removed from the public render path.
- INV-18 — attributed STRONG_RED required: regression test `badges derive only from canonical attendance source; no attendance detail in public responses` must fail when derivation is swapped to a non-canonical source or detail leaks.

### Rollback notes
Publication gate is itself the kill switch: setting the gate unsatisfied removes all public
badge output without a deploy; full rollback = revert the slice commit.

### Done criteria
AC-21, AC-22 pass; OQ-001's answered regime is encoded as data (consent records/policy), not
as a hardcoded constant.

## Slice 13: Attendance CSV export (gated by OQ-002)

### Scope
Coach-only CSV export of the cohort's attendance from the canonical source (per OQ-002 answer;
columns per OQ-008), CSV-injection-safe. DO NOT START until OQ-002 is answered (OQ-008 should
be answered with it). Depends on: Slice 2; consumes the attendance interface.

### Allowed files
- src/hub/exports/
- tests/hub/exports/

### Forbidden files
- db/migrations/
- src/hub/authz/
- src/hub/store/
- src/profiles/

### Invariants touched
- INV-01
- INV-19
- INV-20

### Tests required
- Coach of C gets exactly C's rows; parent/athlete get 403; coach of D gets no C rows (AC-23).
- Cells starting with `=`, `+`, `-`, `@` are escaped (AC-24).
- Empty cohort exports headers only, no error.

### Proof obligations
- INV-19 — attributed STRONG_RED required: regression test `export is coach-only and cohort-scoped` must fail when the role or cohort filter is removed from the export query.
- INV-01 — attributed STRONG_RED required: regression test `non-member and cross-cohort export access denied` (shared fixture with the INV-19 test, distinct assertions) must fail when the membership guard is bypassed on the export route.
- INV-20 is L1 — covered by the escaping test (STRONG_RED not applicable: L1 invariant, no attributed STRONG_RED demanded beyond it).

### Rollback notes
Revert the slice commit; export is read-only, no state to unwind.

### Done criteria
AC-23, AC-24 pass; export columns match the OQ-008 answer recorded in the run contract.
