# Requirements

## Requirements

Traceability: spec paragraph 1 = scoping/exclusions, paragraph 2 = provisioning/revocation,
paragraph 3 = admin capabilities and multi-school.

- R1. Coaches can log in to a dedicated portal with email + password credentials. (¶1 "their own
  portal login", ¶2 "they set a password")
- R2. An authenticated coach can view rosters for the school(s) they are actively affiliated
  with, and no other school. (¶1 "athletes from their school only — rosters")
- R3. An authenticated coach can view evaluation results for their own players — exact player
  scope pending OQ-1. (¶1 "evaluation results for their own players")
- R4. An authenticated coach can view training attendance for athletes within their school
  scope. (¶1 "training attendance")
- R5. Coach-facing responses must exclude: athletes of non-affiliated schools, parent/guardian
  contact details, and all payment information. (¶1 "must never see…")
- R6. Coach accounts are created only through an admin-issued invite; no self-registration
  endpoint or flow exists. (¶2 "invited by us — they can't self-register")
- R7. An invite is delivered to the coach's school email and is accepted by setting a password;
  acceptance requires possession of the invite token, which is single-use and expiring. (¶2 "an
  invite goes to their school email, and when they accept they set a password"; A3)
- R8. An admin can revoke a coach's access to a school with immediate effect — the next request
  scoped to that school is denied. (¶2 "revoke a coach instantly"; A2)
- R9. An admin can move a coach from one school to another as one operation: old-school access
  ends and new-school access begins together, with no lingering old-school access. (¶2 "when a
  coach moves, their access has to move with them, not linger on the old school")
- R10. Admins can list, create, resend, and cancel invites, and view each coach's school
  memberships. (¶3 "manage invites")
- R11. Admins can impersonate a coach's view for support: read-only, showing exactly what that
  coach would see, with every impersonation audit-logged. (¶3 "impersonate a coach view for
  support"; A6)
- R12. A coach may hold active memberships at more than one school simultaneously; their portal
  shows the union of those schools' data, each record gated by its own school membership. (¶3
  "Some coaches help at two schools"; A4)
- R13. Admin visibility is unchanged: admins continue to see everything they see today. (¶3
  "Admins (us) can see everything")
