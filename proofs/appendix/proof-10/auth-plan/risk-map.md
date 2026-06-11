# Risk map

## Risk classification
Initial classification: L2
Final level: L2

## Justification

This is authentication, authorization, tenant boundaries, and minors' private data — squarely L2
("money, auth, permissions, user data, status transitions, private data"). The spec's own words
set the level:

> They must never see athletes from other schools, parents' contact details, or any payment
> information.

A "must never" over private records of high-school athletes (minors), parent PII, and payment
data is a business invariant whose violation is a privacy incident, not a bug.

> We need to be able to revoke a coach instantly (people change schools mid-season — when a
> coach moves, their access has to move with them, not linger on the old school).

Revocation immediacy and access movement are permission state transitions with a stated
must-never ("not linger") — L2 transitions.

> Coaches get invited by us — they can't self-register. An invite goes to their school email…

Account provisioning binds a principal to a tenant via an emailed identifier — the identity &
account-claim lens applies: the email is a *claimed* identifier; only invite-token possession is
evidence. Get this wrong and anyone who can read or guess an invite link claims a coach's access
to minors' records.

> Admins (us) can see everything, manage invites, and impersonate a coach view for support.

Impersonation is a high-privilege auth feature. The spec is silent on auditing it; the compiler
surfaces audit logging as a constraint (INV-9, A6) because un-audited impersonation over minors'
data is an indefensible support tool — this is a constraint the spec missed, not an invented
feature.

**Why not L3:** L3 is "regulated, minors' data + public output, production-critical at scale".
This feature involves minors' data but produces no public output — all access is to vetted,
admin-provisioned school staff and admins. No regulatory regime was named in the spec. OQ-7
(medium) asks the user to confirm no applicable regulation (e.g. state student-privacy law)
forces L3; if one applies, the level escalates and this map must be re-issued.

Per-area levels: coach data-read path and revocation/impersonation are the L2 core; invite email
templating and portal page chrome are L1; any pure styling is L0. Final level is the maximum: L2.
