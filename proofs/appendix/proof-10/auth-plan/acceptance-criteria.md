# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV id.

Tenancy and exclusions:

- AC1 (INV-1): Given coach C with an active membership at school A only, requesting school A's
  roster, evaluation results (scope per OQ-1 resolution), and attendance succeeds; requesting any
  of school B's returns an authorization denial (401/403-class), and a recorded red-team probe of
  direct object references (athlete ids from school B) is denied.
- AC2 (INV-1): Given coach C with active memberships at schools A and B (multi-school), C can
  read both A's and B's data; revoking the B membership immediately limits C to A.
- AC3 (INV-2): Snapshot/contract tests over every coach-facing endpoint and page payload assert
  the absence of parent/guardian contact fields, including nested athlete serializations; a
  deliberately-poisoned fixture (athlete with parent contacts populated) leaks nothing.
- AC4 (INV-3): Same contract tests assert absence of all payment fields/objects; a fixture
  athlete with payment history leaks nothing to the coach view.

Provisioning:

- AC5 (INV-4): No unauthenticated or coach-authenticated route can create a coach account or
  membership; the route table contains no self-registration path; attempting the invite-create
  endpoint without admin auth is denied.
- AC6 (INV-5): Invite acceptance with the correct email but a missing/wrong token fails;
  acceptance with the valid token succeeds exactly once and requires setting a password meeting
  policy (INV-10).
- AC7 (INV-6): An already-used token, an expired token, and a cancelled token are each rejected;
  two concurrent redemption attempts of one token yield exactly one created account/membership.

Revocation and movement:

- AC8 (INV-7): With coach C holding a live session, an admin revokes C's membership at school A;
  C's immediately-following request for school A data is denied without C re-authenticating —
  verified with a session/token that has not expired.
- AC9 (INV-8): The "move coach" operation on coach C (school A → school B) results in: next
  request to A denied, next request to B allowed; a forced mid-operation failure (fault
  injection in test) never leaves C with A-access intact post-move.

Impersonation:

- AC10 (INV-9): An admin impersonating coach C receives byte-equivalent data scope to C's own
  session for the same requests (in particular: no parent contacts, no payments, no other
  schools); any write attempted through the impersonated view is rejected; an audit row exists
  with admin id, coach id, start and end timestamps and cannot be updated or deleted through any
  application path.
- AC11 (INV-9): Impersonation of coach C reflects C's *current* memberships — impersonating a
  revoked coach shows zero school data.

Credentials:

- AC12 (INV-10): Passwords below policy are rejected at acceptance; the stored credential is an
  adaptive hash (no plaintext, no fast hash) — asserted by inspecting the persisted record in
  test.

Admin management:

- AC13: Admin can list pending/accepted/expired/cancelled invites, resend (issuing a NEW token
  that invalidates the old one — INV-6), and cancel; each action is denied to non-admins.
