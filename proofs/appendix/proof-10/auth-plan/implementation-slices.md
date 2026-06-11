# Implementation slices

All file paths are **provisional placeholders** — this plan was compiled without access to the
existing codebase. Before each slice's verified-implementation run, remap paths onto the real
repo layout (keeping the same allowed/forbidden *intent*) and confirm the existing-entity
interfaces (School, Athlete, Roster, EvaluationResult, Attendance, Payment serializers).
Slices 2+ must not start while OQ-2 is open; Slice 4's evaluation read path must not start while
OQ-1 is open.

## Slice 1: Coach identity and membership schema (additive)

### Scope
Add the new persistence model only: Coach, CoachSchoolMembership, CoachInvite,
ImpersonationSession tables/models plus constraints (unique active membership per coach+school,
single-use token semantics via unique token_hash + status, append-only impersonation log). No
routes, no auth logic, no UI. Additive migrations only — no existing table is altered.

### Allowed files
- db/migrations/
- src/models/coach/
- src/models/coach/__tests__/

### Forbidden files
- src/models/athlete/
- src/models/school/
- src/payments/
- src/billing/
- src/auth/
- src/app/

### Invariants touched
- INV-6 (schema-level: token uniqueness/terminal states make double-redeem structurally hard)
- INV-8 (membership model must support atomic revoke+grant in one transaction)
- INV-9 (append-only ImpersonationSession shape)

### Tests required
- Model/constraint tests: cannot persist two active memberships for same (coach, school);
  cannot flip a terminal invite back to pending; impersonation rows reject update/delete at the
  model layer.
- Migration up/down round-trip on a copy of a realistic schema.

### Proof obligations
- For INV-6: a regression test proving two redemption state-transitions of one token cannot both
  commit (DB constraint or guarded transition) — will require an attributed STRONG_RED via
  regression-check.mjs at ship-review.
- Demonstrate migrations touch no existing table (diff of schema dump limited to new objects).

### Rollback notes
Revert = drop the new tables/migrations. Additive only; nothing existing depends on it yet.

### Done criteria
Migrations apply cleanly to a copy of production schema; constraint tests green; no existing
model or table modified; lint/type checks pass.

## Slice 2: Invite issuance and acceptance

### Scope
Admin-only invite creation/resend/cancel API + the public acceptance endpoint/page: token
generation (≥128-bit, stored hashed), email delivery via the existing outbound email interface,
acceptance = validate token → set password (policy-checked, adaptively hashed) → create Coach +
activate membership atomically. Depends on: Slice 1. Blocked by: OQ-2 (which credential/session
stack this plugs into).

### Allowed files
- src/server/coach-invites/
- src/emails/coach-invite/
- src/app/coach/accept-invite/
- src/server/coach-invites/__tests__/

### Forbidden files
- src/models/athlete/
- src/payments/
- src/billing/
- src/server/coach-data/
- db/migrations/

### Invariants touched
- INV-4, INV-5, INV-6, INV-10

### Tests required
- AC5, AC6, AC7, AC12 test cases; concurrency test for double-redeem; token-entropy and
  hashed-at-rest assertions; expiry boundary tests; resend invalidates prior token (AC13 token
  rotation); admin-auth required on management endpoints.

### Proof obligations
- INV-5: regression test "valid email + absent/wrong token never authenticates or binds" —
  attributed STRONG_RED required at review.
- INV-4: route-table audit + test that no self-registration path responds.
- INV-6: reuse Slice 1's double-redeem proof at the API layer (end-to-end concurrent POSTs).

### Rollback notes
Feature-flag the invite routes; rollback = disable flag (no coach can be created), existing
system untouched. Created rows are inert without Slice 3's login path.

### Done criteria
An admin can invite, resend, cancel; a recipient with the emailed token (and only with it) can
set a password and end up with an active membership; all listed tests green; ship-review PASS.

## Slice 3: Coach authentication and per-request authorization guard

### Scope
Coach login (email+password) and session establishment, plus the single authorization chokepoint
for the coach portal: every coach-scoped request resolves the coach's *currently active*
memberships from live state (or immediately-invalidated cache) and derives the permitted school
set. Revocation and move (written in Slice 5) take effect here on the next request. No data
endpoints yet — guard + a trivial authenticated "whoami/my-schools" probe endpoint only.
Depends on: Slice 1, Slice 2. Blocked by: OQ-2, OQ-5 (zero-membership login behavior).

### Allowed files
- src/auth/coach/
- src/middleware/coach-portal/
- src/server/coach-session/
- src/auth/coach/__tests__/

### Forbidden files
- src/payments/
- src/billing/
- src/server/admin/
- src/models/athlete/
- db/migrations/

### Invariants touched
- INV-1 (the enforcement chokepoint exists here), INV-7, INV-10

### Tests required
- Login success/failure paths; session fixation/CSRF baseline; AC8 shape: revoke membership
  mid-session → next request denied with the same unexpired session; guard denies any request
  lacking an active membership for the requested school; multi-school: permitted set equals
  exactly the active membership set (AC2 shape).

### Proof obligations
- INV-7: regression test "unexpired session + revoked membership ⇒ denied on next request" —
  attributed STRONG_RED required. This is the no-grace-window proof; if a token cache exists,
  the test must defeat it.
- INV-1: proof that there is exactly one chokepoint and data routes (Slice 4) cannot bypass it
  (e.g. guard applied at router/middleware level, asserted by a route-coverage test).

### Rollback notes
Feature-flag the coach login route; rollback = disable flag, no coach can establish a session.
No existing auth path is modified (new role, new routes).

### Done criteria
A coach from Slice 2 can log in and hit the probe endpoint for exactly their active schools;
revocation is provably immediate; all tests green; ship-review PASS.

## Slice 4: School-scoped coach data reads with redaction

### Scope
The coach-facing read endpoints and portal pages: rosters, evaluation results, training
attendance — every query filtered by the Slice 3 permitted-school set, every response shaped by
coach-specific serializers that structurally cannot emit parent contact or payment fields
(allowlist serialization, not blocklist stripping). Evaluation scope (school-wide vs own-team)
implements the OQ-1 resolution. Depends on: Slice 3. Blocked by: OQ-1 for the evaluation path.

### Allowed files
- src/server/coach-data/
- src/app/coach/portal/
- src/server/coach-data/__tests__/

### Forbidden files
- src/payments/
- src/billing/
- src/server/admin/
- src/models/
- db/migrations/

### Invariants touched
- INV-1, INV-2, INV-3

### Tests required
- AC1–AC4: cross-tenant direct-object-reference probes denied; poisoned fixtures (parent
  contacts + payment history populated) produce zero leakage in every endpoint and page payload;
  multi-school union correctness; contract/snapshot tests pinning the exact coach-facing field
  set.

### Proof obligations
- INV-2 and INV-3: regression tests over poisoned fixtures with attributed STRONG_RED required;
  serializers must be allowlist-based and the test must fail if a new field appears unreviewed.
- INV-1: red-team test enumerating other-school athlete ids through every endpoint.

### Rollback notes
Behind the same coach-portal feature flag; rollback = disable portal routes. Read-only slice —
no data mutations to undo.

### Done criteria
A multi-school coach sees exactly their schools' rosters/evaluations/attendance with the pinned
field set and nothing else; all probes denied; tests green; ship-review PASS.

## Slice 5: Admin coach management — invites view, revoke, move

### Scope
Admin UI + endpoints to list coaches/invites/memberships, revoke a membership (effective per
INV-7 via Slice 3's live check), and "move school" as one atomic revoke+grant transaction.
Admin-only authorization on every route. Depends on: Slice 1, Slice 3 (independent of Slice 4).

### Allowed files
- src/server/admin/coach-management/
- src/app/admin/coaches/
- src/server/admin/coach-management/__tests__/

### Forbidden files
- src/server/coach-data/
- src/payments/
- src/billing/
- src/models/
- db/migrations/

### Invariants touched
- INV-7 (admin-side trigger), INV-8

### Tests required
- AC8 end-to-end (admin revokes → coach's next request denied); AC9 including fault injection
  (transaction aborts leave prior state intact, never old-access-after-move); AC13 management
  actions denied to non-admins and to coaches.

### Proof obligations
- INV-8: regression test with injected mid-transaction failure proving atomicity — attributed
  STRONG_RED required.
- INV-7: end-to-end revocation-immediacy test reusing Slice 3's chokepoint proof.

### Rollback notes
Admin routes behind a flag; rollback = disable flag. Membership state changes already made by
admins are data, not code — they persist (correctly) across rollback.

### Done criteria
Admin can revoke and move coaches with provably immediate, atomic effect; non-admins denied;
tests green; ship-review PASS.

## Slice 6: Admin impersonation with audit log

### Scope
"View as coach" for admins: starts an ImpersonationSession audit row, renders the coach portal
through the exact Slice 3/4 scoping path for the target coach (same chokepoint, not a parallel
query path), blocks all writes while impersonating, records end of session. Depends on: Slice 4,
Slice 5.

### Allowed files
- src/server/admin/impersonation/
- src/app/admin/impersonate/
- src/server/admin/impersonation/__tests__/

### Forbidden files
- src/server/coach-data/
- src/auth/coach/
- src/payments/
- src/billing/
- src/models/
- db/migrations/

### Invariants touched
- INV-9

### Tests required
- AC10: scope-equivalence test (impersonated responses ≡ the coach's own for identical
  requests); write attempts rejected; audit row immutable via application paths; AC11:
  impersonating a fully-revoked coach yields zero school data; impersonation start requires
  admin auth.

### Proof obligations
- INV-9: regression test for scope-equivalence and for audit-row creation on every
  impersonation start — attributed STRONG_RED required. Proof that impersonation reuses the
  Slice 3 chokepoint (no second authorization implementation to drift).

### Rollback notes
Feature flag; rollback = disable impersonation routes. Audit rows are append-only and remain.

### Done criteria
Admin support can see exactly what a given coach sees, nothing more, with a complete immutable
audit trail; tests green; ship-review PASS.
