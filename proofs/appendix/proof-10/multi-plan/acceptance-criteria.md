# Acceptance criteria

## Acceptance criteria

Each criterion is testable; criteria covering an invariant cite its INV id.

**Cohort isolation:**

- AC1 (INV-01): An authenticated member of cohort A requesting any cohort-B hub resource (post,
  comment, file download, RSVP list, headcount, order) by direct API call or URL receives
  403/404 and no resource data — verified for every resource type, not just the index pages.
- AC2 (INV-01): An unauthenticated request to any hub endpoint or stored-file URL returns no
  content.

**Message board:**

- AC3 (INV-02): A parent or athlete account POSTing a board post receives a server-side
  rejection; a coach of the cohort succeeds; a coach of a different cohort is rejected.
- AC4 (INV-03): A comment submission authenticated as an athlete with DOB < 13 years ago is
  rejected with no persisted comment; the same text submitted by that athlete's linked parent
  succeeds.
- AC5 (INV-04): A comment containing a filter-listed term is never returned by any
  comment-listing endpoint for non-staff users; a clean comment becomes visible.
- AC6 (INV-05): Pressing report on a visible comment creates exactly one moderation record and
  triggers a coach notification; the report action is present on every visible comment.
- AC7 (INV-18): A comment-on-behalf or purchase request that names an athlete not linked to the
  requesting parent in the existing system's linkage is rejected, even if the parent supplies the
  athlete's correct name/email.

**File area:**

- AC8 (INV-06): Upload attempts by parents and athletes are rejected server-side; a cohort coach
  succeeds; a different cohort's coach is rejected.
- AC9 (INV-07): A 100MB+ε upload is rejected and no object exists in storage afterward; a
  100MB−ε upload succeeds.
- AC10 (INV-08): A stored file's URL fetched without authorization yields no file content; a
  signed URL (if used) expires and is unusable afterward.

**RSVP and reminders:**

- AC11 (INV-09): An athlete answering yes, then no, then yes yields exactly one effective RSVP
  with state yes; the coach headcount for the session equals the count of yes states.
- AC12 (INV-10): A recipient with no recorded SMS consent receives no reminder; a recipient who
  opted out after consenting receives no further reminders; no recipient outside the session's
  cohort is ever in the send list.
- AC13 (INV-11): Running the reminder job twice for the same session produces no duplicate
  sends (ReminderDispatch uniqueness holds under retry).

**Store:**

- AC14 (INV-12): A successful checkout creates exactly one charge; replaying/double-submitting
  the checkout request does not create a second charge; a declined card leaves the order in
  charge_failed with no fulfillable state and no stock decrement.
- AC15 (INV-13): Two concurrent checkouts competing for the last unit result in exactly one paid
  order; the other is rejected before charge; stock never goes negative.
- AC16 (INV-14): A parent fetching another parent's order by id receives 403/404; the purchaser
  and staff can view it.

**Badges:**

- AC17 (INV-15): Badge awards exactly match recomputation from attendance records for a fixture
  cohort; no API route or admin form exists that writes a BadgeAward directly.
- AC18 (INV-16): A minor athlete with an earned badge and no consent record shows no badge (and
  no badge placeholder) on their public profile; recording consent makes it appear; revoking
  consent removes it.

**Attendance export:**

- AC19 (INV-17): The CSV endpoint rejects parents, athletes, and other-cohort coaches; a cohort
  coach's export contains only that cohort's athletes/sessions and parses as valid CSV.
