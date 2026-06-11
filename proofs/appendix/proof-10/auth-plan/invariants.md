# Invariants

## Invariants

Tenancy and data exclusion:

- INV-1 [L2] Every athlete-derived record (roster entry, evaluation result, attendance record) returned to a coach session must belong to a school where that coach holds a membership that is active at request time; a coach request for any other school's data must return an authorization denial, not an empty success with leakage elsewhere.
- INV-2 [L2] Parent/guardian contact details (names-as-contacts, emails, phone numbers, addresses) must never appear in any coach-facing API response, page payload, or rendered view — including via nested serialization of athlete objects.
- INV-3 [L2] Payment information (amounts, balances, payment status, instruments, billing records) must never appear in any coach-facing API response, page payload, or rendered view.

Provisioning (identity & account-claim lens):

- INV-4 [L2] A coach account or school membership must never be created by any path other than redemption of an admin-issued invite; no self-registration route may exist or respond.
- INV-5 [L2] Invite redemption must require possession of the single-use, unguessable, expiring invite token; knowledge of the invited email address alone must never authenticate or bind anything.
- INV-6 [L2] A used, expired, or cancelled invite token must never be redeemable; redemption is atomic such that two concurrent redemptions of one token cannot both succeed.

Revocation and movement:

- INV-7 [L2] After an admin revokes a coach's school membership, the coach's very next request scoped to that school must be denied — there is no token-lifetime, cache, or replication grace window during which old access still works.
- INV-8 [L2] Moving a coach between schools must be atomic: at no observable point does the coach retain old-school access after the move completes, and the operation cannot end with old-school access intact but new-school access granted.

Impersonation:

- INV-9 [L2] An admin impersonating a coach must see exactly the data scope that coach would see (no more), must not be able to perform writes through the impersonated view, and every impersonation session must produce an immutable audit record (admin id, coach id, start, end).

Baseline credential hygiene:

- INV-10 [L1] A coach password must meet the minimum strength policy before the account activates, and is stored only as a modern adaptive hash.
