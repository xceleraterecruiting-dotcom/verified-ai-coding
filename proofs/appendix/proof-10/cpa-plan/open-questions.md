# Open questions

## Open questions

High-severity questions with `status: open` block implementation (plan-lint exits nonzero).
OQ-1 and OQ-2 specifically block Slice 7 (payments); answers belong to the founder, not the
compiler.

- OQ-1 [severity: high] [status: open] What does the full-year upfront purchase ($4,000 QB /
  $1,700 WR-DB) entitle the child to — automatic enrollment in all of that year's cohorts, this
  cohort plus a credit applied to future cohorts, or something else? The answer changes the
  payment/entitlement data model, INV-2's scope, and Slice 7's boundaries.
- OQ-2 [severity: high] [status: open] After a paid 6-week per-cohort term ends, how is the next
  cohort paid for at launch — a new admin selection round, a parent-initiated renewal in the
  portal, or entirely out of scope until later? The answer changes the money flow and whether a
  renewal slice must exist before launch.
- OQ-3 [severity: medium] [status: open] Is the evaluation cap exactly 60 children, and should
  admins be able to change it? Plan assumes configurable with default 60 (A2).
- OQ-4 [severity: medium] [status: open] Should parents see "not selected" in the portal, or
  should that status stay neutral/hidden? Plan assumes it is shown (A5); the spec only mandates
  email for selected.
- OQ-5 [severity: medium] [status: open] Confirm post-payment changes (refunds, un-enrollment,
  plan changes) are manual via the Stripe dashboard at launch (A4) — the spec scopes
  reversibility to "before payment happens", so this is recorded as an assumption rather than
  high severity; correct us if in-app refunds are expected.
- OQ-6 [severity: low] [status: open] Which hosted auth provider (e.g., Clerk, Auth0, Supabase
  Auth)? The plan abstracts the choice (A8).
- OQ-7 [severity: low] [status: open] Which email provider for the best-effort selection
  notification?
- OQ-8 [severity: medium] [status: open] Can two guardians (two email accounts) access the same
  family's children? Launch plan links one parent account per family.
- OQ-9 [severity: low] [status: open] Will prices change during the year (should they be
  admin-configurable), or are fixed constants fine at launch (A6)?
- OQ-10 [severity: medium] [status: open] Who supplies the liability-waiver legal text, and does
  a returning family ever need to re-sign (waiver versioning policy)? Plan stores a waiver
  version per signature so re-signing can be added without migration.
- OQ-11 [severity: low] [status: open] Are announcements cohort-scoped, global, or both? Plan
  assumes cohort-scoped with optional global.
