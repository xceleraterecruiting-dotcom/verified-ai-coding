# Fixture spec — coach portal access (expected: Level 2, permissions/tenancy)

> Synthetic fixture. Tests permission/tenant-boundary planning.

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
