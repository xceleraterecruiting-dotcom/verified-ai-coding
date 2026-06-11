# Domain model

All pre-existing entities (School, Athlete, Roster, EvaluationResult, AttendanceRecord, Payment,
Parent/Guardian contact, Admin) are **interfaces to be confirmed** against the real codebase —
this plan had no access to it. Only the starred entities below are new.

## Entities

- **School** (existing) — tenant boundary for all coach access.
- **Athlete** (existing) — belongs to a school; has roster entries, evaluation results,
  attendance records; linked to parent contact details and payment records that coaches must
  never receive.
- **Coach\*** (new) — a person with portal credentials (email, password hash). Identified by the
  email the invite was sent to. One Coach, zero-or-more CoachSchoolMemberships.
- **CoachSchoolMembership\*** (new) — the authorization edge: (coach, school, status,
  granted_at, revoked_at, granted_by). All coach data access is derived from *active* rows here,
  never from the coach record alone. Multi-school = multiple active rows.
- **CoachInvite\*** (new) — (email, school, token_hash, expires_at, status, invited_by,
  accepted_at). Possession of the unexpired single-use token is the proof of email control.
- **ImpersonationSession\*** (new, audit record) — (admin, coach, started_at, ended_at). Append-
  only.
- **Admin** (existing) — full visibility; gains invite management, revoke/move, impersonation.

## States and transitions

CoachInvite: `pending → accepted` (token redeemed once; creates/links Coach + activates
membership), `pending → expired` (time), `pending → cancelled` (admin). `accepted`, `expired`,
and `cancelled` are terminal — no transition re-arms a token.

CoachSchoolMembership: `active → revoked` (admin revoke; effective immediately). "Move schools"
= atomically { old membership `active → revoked`, new membership created `active` } — never a
state where the old membership outlives the move.

Coach account: exists ↔ has ≥0 memberships. A coach with zero active memberships can still
authenticate but is authorized to see nothing (or is blocked at login — OQ-5 medium); either
way, no school data is reachable.

ImpersonationSession: `started → ended`; rows are never updated except `ended_at`, never
deleted.

```text
invite(pending) --accept(token)--> coach + membership(active) --revoke--> membership(revoked)
invite(pending) --expire/cancel--> terminal
move = revoke(old) + grant(new), atomic
```
