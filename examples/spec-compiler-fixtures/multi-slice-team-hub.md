# Fixture spec — team hub (expected: Level 2, multi-slice decomposition)

> Synthetic fixture. Tests decomposition: a deliberately tangled spec mixing several concerns
> that must NOT land in one slice.

Big idea: a "team hub" for each cohort. Parents and athletes get a shared space with: a message
board (coaches post, parents can comment, comments need a profanity filter and a report button);
a file area for practice plans and film clips (coaches upload, 100MB max, only that cohort can
see them); RSVP for each session so coaches know headcount, with an automatic reminder text the
morning of; and a small store where parents can buy extra gear (shirts/shorts we already stock)
with card payment — charge on order, we fulfill at practice.

Also, badges: athletes earn badges for attendance streaks, and badges show on their public
recruiting profile. And while you're in there, the coaches want CSV export of attendance.

All of it should respect who's in which cohort — nobody sees another cohort's stuff. Kids under
13 can't post comments themselves (parents only).
