# Non-goals

## Non-goals

- Coach **write** access of any kind — editing rosters, recording attendance, entering or
  amending evaluation results, messaging athletes/parents. The spec only says "see" (A1).
- Self-registration, public sign-up, social login, SSO, or password-less login for coaches. The
  spec forbids self-registration; SSO was never asked for.
- Logins or portals for athletes or parents/guardians (A8).
- Any change to what coaches' invites cost or any billing/payment feature — payment data is a
  hard exclusion from the coach view, and payment code is forbidden territory in every slice.
- Rebuilding or altering existing admin visibility/permissions ("admins can see everything" is
  treated as already true; this plan only adds invite management, revoke/move, and
  impersonation).
- Coach-to-coach sharing, school-to-school data sharing, or any cross-tenant feature.
- Notification preferences, in-portal analytics, exports/downloads of athlete data from the
  coach portal (an export path would re-open the redaction surface; deliberately excluded —
  revisit as its own spec if wanted).
- Password reset / account recovery flow beyond initial invite acceptance — deferred to a
  follow-up phase unless the user pulls it in (tracked as OQ-6; it touches the same
  claimed-vs-verified email surface and deserves its own scoping).
- Rate limiting / lockout policy tuning beyond a baseline (OQ-8 low).
- Migration of any historical "coach" data that may exist in the current system (unknown —
  no codebase access; if such data exists, that is new scope to be confirmed).
