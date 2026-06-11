# Spec intake — coach portal access

Plan directory: `/tmp/spec-eval/auth/`. Compiled 2026-06-11 by spec-compiler with **no project
context available** (Step 0: the existing system's codebase, CLAUDE.md, and prior specs were not
readable in this run — see Interpretation notes).

## Original spec (verbatim)

We want to give high-school coaches their own portal login. A coach should be able to see the
athletes from their school only — rosters, evaluation results for their own players, and training
attendance. They must never see athletes from other schools, parents' contact details, or any
payment information.

Coaches get invited by us — they can't self-register. An invite goes to their school email, and
when they accept they set a password. We need to be able to revoke a coach instantly (people
change schools mid-season — when a coach moves, their access has to move with them, not linger on
the old school).

Admins (us) can see everything, manage invites, and impersonate a coach view for support. Some
coaches help at two schools; handle that however makes sense.

## Compiler paraphrase

Add a new authenticated role — "coach" — to an existing athlete-management system. Coaches are
provisioned exclusively by admin invite sent to their school email; accepting the invite sets a
password and creates the account. A coach's read access is strictly tenant-scoped to the school(s)
they are actively affiliated with: school rosters, evaluation results, and training attendance.
Three data classes are hard-excluded from the coach view regardless of school: other schools'
athletes, parent/guardian contact details, and all payment information. Admins can revoke a
coach's access with immediate effect, and can move a coach between schools such that old-school
access ends exactly when new-school access begins. Admins retain full visibility, manage invites,
and can impersonate a coach's view for support. A coach may be affiliated with more than one
school simultaneously.

## Interpretation notes

- **No codebase access (Step 0).** Athletes, schools, rosters, evaluation results, attendance,
  payments, and the admin role all pre-exist; I treat each as an *interface to be confirmed* at
  verified-implementation time, not a known schema. All file paths in
  `implementation-slices.md` are provisional placeholders to be remapped onto the real repo
  before each slice's run. Rejected alternative: inventing concrete schemas for existing
  entities and baking them into invariants — that would be fabricated certainty.
- **"see the athletes from their school"** — read as *read-only* access. The spec only ever says
  "see"; I rejected the reading that coaches can edit rosters/attendance/evaluations. Any coach
  write capability is a non-goal pending user confirmation.
- **"evaluation results for their own players"** — ambiguous between (a) all athletes at the
  coach's school and (b) only athletes on that coach's specific team/roster. The roster and
  attendance clauses say "from their school"; the evaluation clause says "their own players",
  which may be narrower. This changes the core scoping invariant for minors' evaluation data, so
  it is **OQ-1 (high), not an assumption**. The plan's invariants are written to the school
  boundary (the widest defensible reading) with OQ-1 blocking implementation of the evaluation
  read path until answered.
- **"revoke a coach instantly"** — read as: the next request after revocation is denied; no
  token/cache TTL grace window. Rejected reading: "revoke" merely flags the account and access
  decays when a session token expires.
- **"impersonate a coach view"** — read as a *view*: read-only, scope-identical to the target
  coach (the admin sees exactly what the coach would see, no more and no less), and audit-logged.
  Rejected reading: full session takeover with the coach's (nonexistent) write powers. The audit
  log is a compiler-surfaced constraint, not a spec feature — justified in `risk-map.md`.
- **"an invite goes to their school email"** — the email address is *admin-provided* (a claim);
  what proves control is *possession of the single-use invite token delivered to that mailbox*
  (evidence). The binding requires the token, never the bare email. (Identity & account-claim
  lens, point 1.)
- **"Some coaches help at two schools; handle that however makes sense."** — explicit delegation;
  modeled as one coach account with N school memberships, each independently grantable/revocable
  (assumption A4, confirmation tracked as OQ-3 medium).
- **"Admins (us) can see everything"** — read as: admin capability is already implemented in the
  existing system and this plan only *adds* invite management, revoke/move, and impersonation to
  it; it does not rebuild admin visibility.

## Assumptions

- A1: Coach access is read-only across rosters, evaluation results, and attendance; no coach
  write paths are built.
- A2: "Instantly" means revocation is enforced on the very next request — authorization is
  checked against live membership state per request (or equivalent immediate invalidation), not
  against a long-lived token claim.
- A3: Invite tokens are single-use, unguessable (≥128 bits entropy), and expire; an expired or
  used token is never redeemable. The user would endorse this as table stakes for minors' data.
- A4: Multi-school is modeled as one account ↔ many school memberships; each membership is
  granted/revoked independently; a coach's view is the union of active memberships, with every
  record still fetched only under its own school's membership.
- A5: Moving a coach between schools is a single atomic operation (revoke old + grant new); there
  is no intermediate state where both or neither are readable contrary to intent.
- A6: Admin impersonation is read-only and recorded in an audit log (who, which coach, when
  started/ended). Surfaced as a constraint the spec missed; see `risk-map.md`.
- A7: Email delivery for invites uses the system's existing outbound email mechanism (interface
  to confirm).
- A8: Parents/guardians and athletes do NOT get logins from this work; only coaches do.

## Open questions

See `open-questions.md` — 8 questions, of which 2 are high severity and open (these block
implementation by design; they need the user, not a convenient guess).
