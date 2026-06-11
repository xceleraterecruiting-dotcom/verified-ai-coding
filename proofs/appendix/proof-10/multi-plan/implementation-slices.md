# Implementation slices

All file paths are **provisional** (no codebase access during compilation — spec-intake A8).
Each slice's first task is to confirm the named existing-system interfaces and re-issue its
allowed/forbidden lists against the real repository before any code is written. One slice = one
`verified-implementation` run = one `ship-review`.

Dependency graph (acyclic):
1 → {3,5,6,8,10}; 2 → {3,4,5,6,9,12}; 3 → 4; 6 → 7; 8 → 9; 10 → 11.
Slices 5, 6, 10, 12 are mutually independent once 1 and 2 land.

## Slice 1: Team-hub core schema (additive migrations)

### Scope
Additive database migrations and model definitions for the hub's core entities: BoardPost,
Comment, CommentReport, HubFile (metadata), Rsvp, ReminderDispatch, BadgeDefinition, BadgeAward,
ConsentRecord. No behavior, no routes, no UI. Every table carries a cohort (or athlete) foreign
key so isolation is expressible at the data layer. Store tables are deliberately excluded
(Slice 8) because their shape depends on OQ-04. Confirms existing-interface assumptions: cohort,
athlete (DOB?), parent linkage, session, attendance-record identifiers.

### Allowed files
- `db/migrations/`
- `src/models/hub/`
- `tests/models/hub/`

### Forbidden files
- `src/hub/`
- `src/profile/`
- `src/payments/`
- `config/`

### Invariants touched
None enforced behaviorally here (schema only); defines the structures that Slices 2–7 and 10–11
enforce: cohort FKs supporting INV-01, the (athlete, session) uniqueness supporting INV-09, the
(recipient, session) uniqueness supporting INV-11, and append-only BadgeAward supporting INV-15.

### Tests required
- Migration round-trip (up/down) on a scratch database.
- Uniqueness constraints proven by attempted duplicate inserts: Rsvp(athlete, session),
  ReminderDispatch(recipient, session), BadgeAward(athlete, badge definition, streak window).
- FK integrity: hub rows cannot reference a nonexistent cohort.

### Proof obligations
- Demonstrate migrations are purely additive (no altering/dropping of existing tables) — diff of
  schema dump before/after touches only new tables.
- Record (in the slice's notes) the confirmed shape of each existing interface relied on,
  including whether athlete DOB exists (feeds OQ-01).

### Rollback notes
Down-migrations drop only the new tables. Additive-only; no existing data is touched.

### Done criteria
Migrations apply and roll back cleanly; constraint tests pass; existing-interface confirmation
notes written; no route/UI/behavior code exists in the diff.

## Slice 2: Cohort-scoped access-control service

### Scope
A single server-side authorization service used by every later slice: given a principal and a
cohort (or a hub resource), answer member/coach/staff role and allow/deny. Wraps the existing
cohort-membership source of truth (interface to confirm). Includes deny-by-default behavior and
a reusable request guard. No feature endpoints yet. Depends on: Slice 1 (resource→cohort keys).

### Allowed files
- `src/hub/access/`
- `tests/hub/access/`

### Forbidden files
- `db/migrations/`
- `src/hub/board/`
- `src/hub/store/`
- `src/profile/`

### Invariants touched
- INV-01 (this service is its single enforcement point; later slices consume it rather than
  re-implementing checks).

### Tests required
- Allow/deny matrix: {athlete, parent, coach, staff, non-member, unauthenticated} ×
  {own cohort, other cohort} for read and write intents.
- Deny-by-default: an unknown role or unmapped resource type is denied.

### Proof obligations
- Regression test named `hub-access-cross-cohort-denied` proving a cohort-A member is denied
  cohort-B resources (INV-01); L2 — will require an attributed STRONG_RED via
  `regression-check.mjs` at remediation/review time.

### Rollback notes
Revert the slice commit; nothing else depends on it until Slice 3+. No data changes.

### Done criteria
Guard service exists with the full allow/deny matrix green; later slices can import one function
instead of writing ad-hoc checks; no feature surface shipped.

## Slice 3: Message board — coach posts

### Scope
Coach-only creation of board posts and cohort-scoped listing/reading, using the Slice 2 guard.
UI for the board page (posts only; comments are Slice 4). Depends on: Slice 1, Slice 2.

### Allowed files
- `src/hub/board/`
- `tests/hub/board/`

### Forbidden files
- `db/migrations/`
- `src/hub/access/`
- `src/hub/comments/`
- `src/hub/store/`

### Invariants touched
- INV-02 (coach-only post creation, enforced server-side).
- INV-01 (board reads/writes go through the Slice 2 guard).

### Tests required
- Post creation: cohort coach succeeds; parent, athlete, other-cohort coach, unauthenticated all
  rejected server-side (AC3).
- Listing: cohort member sees posts; non-member API call gets 403/404 with no data (AC1 board
  portion).

### Proof obligations
- Regression test `board-post-noncoach-rejected` (INV-02, L2) — attributed STRONG_RED required
  at review time.

### Rollback notes
Revert commit; board tables (Slice 1) remain but are inert. Feature can also ship behind a hub
feature flag if one exists (confirm at slice start).

### Done criteria
Coaches can post and cohort members can read in the real UI; all rejection paths are
server-side; AC3 demonstrably green.

## Slice 4: Comments — guardian commenting with profanity filter, reporting, and under-13 gate

### Scope
Parent commenting on board posts (restrictive default A4: coaches and verified parents only,
pending OQ-05), with: profanity filter before visibility, report button creating a
CommentReport and notifying coaches, and the under-13 authoring block backed by the verified
parent↔athlete linkage. Depends on: Slice 3. Gated on: OQ-01 (under-13 determination source);
OQ-05 and OQ-07 have safe defaults recorded in intake.

### Allowed files
- `src/hub/comments/`
- `tests/hub/comments/`

### Forbidden files
- `db/migrations/`
- `src/hub/access/`
- `src/hub/board/`
- `src/hub/store/`

### Invariants touched
- INV-03 (under-13 athletes can never author comments).
- INV-04 (filter before visibility).
- INV-05 (report action and moderation record).
- INV-18 (on-behalf authority comes only from the verified linkage).
- INV-01 (comment reads/writes guarded).

### Tests required
- AC4: under-13 athlete submission rejected and not persisted; linked parent succeeds.
- AC5: filter-listed term never visible to non-staff; clean comment visible.
- AC6: report creates exactly one moderation record and notifies coaches.
- AC7: on-behalf comment naming an unlinked athlete rejected.

### Proof obligations
- Regression tests `comment-under13-blocked` (INV-03), `comment-filter-precedes-visibility`
  (INV-04), `comment-unlinked-parent-rejected` (INV-18) — all L2, each requiring an attributed
  STRONG_RED at review time.

### Rollback notes
Revert commit; comments can be disabled independently of posts (board remains read-only).

### Done criteria
AC4–AC7 green; OQ-01 resolution recorded before merge (the slice cannot honestly implement the
age gate without knowing the DOB source); no athlete-authored comment path exists under A4.

## Slice 5: File area — coach uploads with 100MB cap and cohort-scoped delivery

### Scope
Coach upload of practice plans and film clips into the cohort file area; 100MB pre-storage
rejection; downloads gated by the Slice 2 guard (no public object URLs; short-lived signed URLs
allowed post-authorization). Storage backend is an interface to confirm. Depends on: Slice 1,
Slice 2.

### Allowed files
- `src/hub/files/`
- `tests/hub/files/`

### Forbidden files
- `db/migrations/`
- `src/hub/access/`
- `src/hub/board/`
- `config/`

### Invariants touched
- INV-06 (coach-only upload).
- INV-07 (100MB rejection before storage commit).
- INV-08 (no unauthenticated retrieval path).
- INV-01 (listing and download guarded).

### Tests required
- AC8: parent/athlete/other-cohort-coach uploads rejected; cohort coach succeeds.
- AC9: 100MB+ε rejected with no stored object; 100MB−ε succeeds.
- AC10: direct object URL without authorization yields no content; signed URL expires.

### Proof obligations
- Regression tests `file-upload-noncoach-rejected` (INV-06) and `file-download-unauthed-denied`
  (INV-08) — L2, attributed STRONG_RED at review time.

### Rollback notes
Revert commit; uploaded objects remain in storage (orphaned but inaccessible); a cleanup script
is staff-run if needed — note this in the slice's ship-review bundle.

### Done criteria
AC8–AC10 green in the real app, including a real >100MB rejection; no storage URL reachable
without the guard.

## Slice 6: Session RSVP and coach headcount

### Scope
Per-session RSVP (yes/no, re-answerable, latest wins) recorded against the athlete, and a
coach-facing headcount per session. Who records the RSVP defaults to the parent account (with
13+ athlete self-RSVP pending OQ-08). Reads existing Session interface (confirm at start).
Depends on: Slice 1, Slice 2.

### Allowed files
- `src/hub/rsvp/`
- `tests/hub/rsvp/`

### Forbidden files
- `db/migrations/`
- `src/hub/access/`
- `src/hub/reminders/`
- `src/hub/store/`

### Invariants touched
- INV-09 (one effective state per athlete per session; headcount = yes count).
- INV-01 (RSVP and headcount endpoints guarded).
- INV-18 (parent RSVPs only for linked athletes).

### Tests required
- AC11: yes→no→yes yields one effective record with state yes; headcount equals yes count.
- Cross-cohort: non-member cannot read headcount or submit RSVP (AC1 portion).
- Parent cannot RSVP for an unlinked athlete.

### Proof obligations
- Regression test `rsvp-headcount-consistency` (supports INV-09, L1) — standard test; no
  STRONG_RED attribution required below L2, but cross-cohort denial is covered by the Slice 2
  obligation.

### Rollback notes
Revert commit; RSVP table (Slice 1) inert afterward. Additive otherwise.

### Done criteria
Coaches see live headcount per session; AC11 green; OQ-08 default recorded in the slice notes.

## Slice 7: Morning-of SMS reminders

### Scope
A scheduled job that, on the morning of each session (time/timezone default per OQ-09), sends
one reminder text per consenting recipient in that session's cohort, logging each send in
ReminderDispatch. SMS provider and consent records are existing interfaces to confirm. Depends
on: Slice 6. Gated on: OQ-02 (provider + recorded consent) — do not start until resolved.

### Allowed files
- `src/hub/reminders/`
- `tests/hub/reminders/`

### Forbidden files
- `db/migrations/`
- `src/hub/rsvp/`
- `config/`
- `src/hub/store/`

### Invariants touched
- INV-10 (consent-gated, opt-out-respecting, cohort-scoped sends).
- INV-11 (at-most-once per recipient per session).

### Tests required
- AC12: no-consent recipient excluded; post-opt-out recipient excluded; send list never contains
  a non-cohort number.
- AC13: running the job twice for one session produces zero duplicate sends.
- Provider failure mid-batch: retry does not re-send already-dispatched rows.

### Proof obligations
- Regression test `reminder-consent-gate` (INV-10, L2) — attributed STRONG_RED at review time.
- Evidence of a real (sandbox) provider send in the ship-review bundle, not only mocks.

### Rollback notes
Disable the scheduled job (single switch); no data besides dispatch logs. Document the disable
step in the slice PR.

### Done criteria
AC12–AC13 green; job idempotent under retry; OQ-02 resolution recorded; opt-out path verified
against the real provider's semantics.

## Slice 8: Store schema — products, orders, charges (additive migrations)

### Scope
Additive migrations and models for Product (view over existing GearStock — interface to
confirm, OQ-06), Order, OrderItem, PaymentCharge. Shape of PaymentCharge follows the processor
chosen in OQ-04 — this slice is gated on OQ-04 and must not start before it resolves. No
behavior. Depends on: Slice 1 (migration conventions confirmed there).

### Allowed files
- `db/migrations/`
- `src/models/store/`
- `tests/models/store/`

### Forbidden files
- `src/hub/`
- `src/payments/`
- `src/profile/`
- `config/`

### Invariants touched
Schema-level support only: stock quantity field + check constraint (never negative) supporting
INV-13; one-charge-per-order uniqueness supporting INV-12; purchaser FK supporting INV-14.
Behavioral enforcement is Slice 9.

### Tests required
- Migration round-trip; duplicate-charge insert for one order rejected by constraint; negative
  stock rejected by constraint.

### Proof obligations
- Schema-dump diff showing additive-only changes; confirmation note on how GearStock quantities
  are actually tracked today (resolves OQ-06's interface half).

### Rollback notes
Down-migrations drop only new tables; additive-only.

### Done criteria
Migrations green both directions; constraints proven by failing inserts; OQ-04 and OQ-06
resolutions recorded.

## Slice 9: Storefront checkout — card charge-on-order, stock guard, fulfillment

### Scope
Parent-facing store: browse stocked shirts/shorts, place an order, synchronous card charge at
order time (idempotent — exactly one charge per order), atomic stock decrement, order status
visible to the purchaser, staff "fulfilled at practice" marking. Refund/cancel handling is
staff-manual per N3, policy per OQ-04. Depends on: Slice 8, Slice 2. Gated on: OQ-04.

### Allowed files
- `src/hub/store/`
- `tests/hub/store/`

### Forbidden files
- `db/migrations/`
- `src/hub/access/`
- `src/hub/board/`
- `src/models/store/`

### Invariants touched
- INV-12 (exactly one charge; paid only on success; failed charge never fulfillable).
- INV-13 (no oversell; atomic decrement).
- INV-14 (order visibility limited to purchaser + staff).
- INV-18 (purchases ride the verified parent identity).
- INV-01 (store scoped to cohort membership).

### Tests required
- AC14: double-submit produces one charge; declined card → charge_failed, no stock decrement,
  not fulfillable.
- AC15: concurrent checkout for the last unit — exactly one paid order, stock never negative.
- AC16: other-parent order fetch denied; purchaser and staff allowed.
- Charge attempted only after stock reservation succeeds (no charge-then-oversell window).

### Proof obligations
- Regression tests `order-single-charge-idempotent` (INV-12) and `order-no-oversell-concurrent`
  (INV-13) — L2, attributed STRONG_RED at review time.
- Ship-review bundle includes a sandbox-processor end-to-end charge trace.

### Rollback notes
Feature-flag the storefront off (confirm flag mechanism at slice start) or revert; orders
already charged are real money and must NOT be silently deleted — rollback never voids charges.

### Done criteria
AC14–AC16 green including the concurrency test; a real sandbox charge demonstrated; staff can
mark fulfilled; refund path documented as manual.

## Slice 10: Attendance-streak badge engine

### Scope
BadgeDefinition rules (attendance streaks) and a recomputation engine that derives BadgeAwards
solely from existing AttendanceRecords (read-only interface to confirm). Awards are visible
inside the hub to the athlete's own family and coaches only — public display is Slice 11. No
manual-award surface exists. Depends on: Slice 1, Slice 2 (for in-hub visibility scoping).

### Allowed files
- `src/hub/badges/`
- `tests/hub/badges/`

### Forbidden files
- `db/migrations/`
- `src/profile/`
- `src/hub/access/`
- `src/hub/store/`

### Invariants touched
- INV-15 (derived-only awards; no manual grant path).
- INV-01 (in-hub badge views are cohort/family-scoped).

### Tests required
- AC17 (engine half): fixture attendance histories → exact expected award set; recompute is
  idempotent; a broken streak revokes/withholds correctly per the defined rule.
- Negative: no route/handler accepts a direct BadgeAward write.

### Proof obligations
- Regression test `badge-derivation-matches-attendance` (INV-15, L2) — attributed STRONG_RED at
  review time.

### Rollback notes
Revert commit; awards table inert. Recompute is idempotent so re-enabling later is safe.

### Done criteria
AC17 engine assertions green; awards visible in-hub only; zero manual-award surface in the diff.

## Slice 11: Badge display on public recruiting profile

### Scope
Render earned badges on the athlete's existing public recruiting profile, strictly gated by a
recorded guardian ConsentRecord for minors (consent capture UX shaped by OQ-03's answer). The
only slice allowed to touch profile code. Depends on: Slice 10. Gated on: OQ-03 — must not start
until resolved; this is the plan's L3 path.

### Allowed files
- `src/profile/badges/`
- `tests/profile/badges/`

### Forbidden files
- `src/hub/`
- `db/migrations/`
- `src/models/hub/`
- `config/`

### Invariants touched
- INV-16 (no badge on a minor's public profile without covering guardian consent).
- INV-15 (display reads derived awards only).

### Tests required
- AC18: earned badge + no consent → nothing rendered (and no placeholder leaking existence);
  consent recorded → rendered; consent revoked → removed.
- Public profile of an athlete with no awards is unchanged byte-for-byte from before the slice.

### Proof obligations
- Regression test `public-badge-requires-consent` (INV-16, L3) — attributed STRONG_RED at review
  time; ship-review bundle must include before/after captures of a real public profile for both
  consent states.

### Rollback notes
Feature-flag or revert removes the profile badge section entirely; consent records persist
(harmless, additive).

### Done criteria
AC18 green; OQ-03 resolution recorded with the consent mechanism named; no attendance-derived
datum reachable on any public page without consent.

## Slice 12: Attendance CSV export

### Scope
Coach-initiated, on-demand CSV export of attendance for the coach's own cohort (columns/date
range default per OQ-11's recorded answer; sensible default: athlete name + per-session status,
all sessions). Reads existing AttendanceRecords; uses the Slice 2 guard. Depends on: Slice 2.
Independent of all other feature slices.

### Allowed files
- `src/hub/export/`
- `tests/hub/export/`

### Forbidden files
- `db/migrations/`
- `src/hub/access/`
- `src/hub/badges/`
- `src/profile/`

### Invariants touched
- INV-17 (coach-of-cohort-only; own-cohort rows only).
- INV-01 (endpoint guarded).

### Tests required
- AC19: parent/athlete/other-cohort coach denied; cohort coach's file contains only own-cohort
  athletes/sessions; output parses as valid CSV (including names with commas/quotes).

### Proof obligations
- Regression test `attendance-export-scope` (INV-17, L2) — attributed STRONG_RED at review time.

### Rollback notes
Revert commit; read-only feature, no data written.

### Done criteria
AC19 green; CSV verified against a fixture cohort; no cross-cohort row reachable by parameter
tampering.
