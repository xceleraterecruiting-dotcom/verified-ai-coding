# Invariants

## Invariants

Levels are each invariant's own risk class (may exceed or trail the plan's overall level).

**Cohort isolation (cross-cutting):**

- INV-01 [L2] A hub resource (post, comment, file, RSVP, headcount, order) belonging to cohort X must never be readable or writable by a principal who is not a member or coach of cohort X (or system staff) — enforced server-side on every request, not by UI hiding.

**Message board:**

- INV-02 [L2] Only a coach of the owning cohort can create a board post; a non-coach create attempt must be rejected server-side.
- INV-03 [L2] A comment authored by an athlete account whose age is under 13 must never be accepted or persisted; under-13 athletes are represented only by comments from their linked parent account.
- INV-04 [L2] A comment must never become visible without passing the profanity filter; a filter-rejected comment is never displayed to any non-staff user.
- INV-05 [L1] Every visible comment exposes a report action; a report always creates a persistent moderation record and notifies the cohort's coaches.

**File area:**

- INV-06 [L2] Only a coach of the owning cohort can upload a file to that cohort's file area.
- INV-07 [L1] An upload exceeding 100MB must be rejected before the object is committed to storage.
- INV-08 [L2] A stored file must never be retrievable without a server-side cohort-membership check — no permanently public or unauthenticated object URLs (short-lived signed URLs issued post-authorization are acceptable).

**RSVP and reminders:**

- INV-09 [L1] There is exactly one effective RSVP state per athlete per session (latest response wins), and the coach-facing headcount equals the count of "yes" states.
- INV-10 [L2] A reminder text must never be sent to a phone number without recorded opt-in consent, never after opt-out, and never to a recipient outside the session's cohort.
- INV-11 [L1] At most one reminder text is sent per recipient per session, even across job retries.

**Store:**

- INV-12 [L2] An order's card is charged exactly once; an order must never be marked paid without a successful charge, and a failed charge must never yield a fulfillable order.
- INV-13 [L2] An order must never be accepted for more units than the recorded available stock at acceptance time; the stock decrement is atomic with order acceptance.
- INV-14 [L2] An order's details and payment record are visible only to the purchasing parent, cohort staff, and system staff — never to other parents or athletes.

**Badges:**

- INV-15 [L2] A badge award derives solely from attendance records via a defined streak rule; no hub UI or API permits manually granting or editing a badge award.
- INV-16 [L3] A badge (or any attendance-derived datum) must never appear on a minor athlete's public recruiting profile without a recorded guardian consent that covers it.

**Attendance export:**

- INV-17 [L2] The attendance CSV export is available only to coaches of the cohort being exported, and the file contains only that cohort's athletes and sessions.

**Identity (account-claim lens):**

- INV-18 [L2] Every "parent acts for athlete" operation (commenting on behalf of an under-13 child, purchasing gear) must rely on the existing system's verified parent↔athlete linkage; the hub must never accept a self-asserted or merely-typed linkage as authority.
