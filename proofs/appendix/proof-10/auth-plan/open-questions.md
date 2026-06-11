# Open questions

## Open questions

High severity (block implementation until the user answers — do not pick the convenient
reading):

- OQ-1 [severity: high] [status: open] "Evaluation results for their own players" — does a coach see evaluation results for ALL athletes at their affiliated school(s), or only for athletes on that coach's own team/roster? Rosters and attendance say "from their school"; evaluations say "their own players", which may be narrower. The answer changes INV-1's scope for the most sensitive data class (minors' evaluations) and the Slice 4 read path.
- OQ-2 [severity: high] [status: open] What is the existing auth/identity stack, and must coach credentials live in it (existing user table / IdP / session machinery) or in a new coach-specific store? This plan had no codebase access; the answer changes Slice 2/3 boundaries and possibly the session-invalidation mechanism behind INV-7 (e.g. stateless JWTs would forbid naive claims-based authorization).

Medium severity:

- OQ-3 [severity: medium] [status: open] Multi-school handling was delegated ("however makes sense") — confirm assumption A4: one account, N independently revocable school memberships, union view. Alternative (separate accounts per school) is rejected but cheap to confirm now.
- OQ-4 [severity: medium] [status: open] School email addresses get reassigned (coach leaves, successor inherits coach@school.org). The invite binds at acceptance time — but should the system re-verify or alert when a *new* invite targets an email already bound to an existing coach account, and is email ever usable for account recovery? (Identity lens point 4; recovery is currently a non-goal.)
- OQ-5 [severity: medium] [status: open] A coach with zero active memberships (revoked everywhere, not yet moved): can they still log in and see an empty/"contact admin" state, or is login itself blocked? Affects Slice 3's guard and the revoke UX.
- OQ-6 [severity: medium] [status: open] Password reset / account recovery is excluded from this plan (non-goal). Confirm it ships as a follow-up — coaches WILL forget passwords mid-season, and an ad-hoc recovery flow added later under pressure would reopen the claimed-vs-verified email surface without review.
- OQ-7 [severity: medium] [status: open] Does any regulatory regime (state student-data-privacy law, school-district data agreements) apply to coach access to minors' evaluation data? If yes, risk escalates to L3 and the risk map must be re-issued. Classified medium because access is private and admin-provisioned, but only the user knows the contractual context.

Low severity:

- OQ-8 [severity: low] [status: open] Operational defaults to confirm at slice time: invite expiry window (proposed 7 days), password policy floor, login rate-limit/lockout thresholds, audit-log retention period.
