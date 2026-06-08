# Redteam / Bypass Plan

Adversarial cases that try to slip past the guard. Each MUST NEVER invariant needs at least one case that *attempts the forbidden action* and asserts the system refuses it. These cases double as the spec the cold reviewer traces against.

## Cases

| # | Attack / edge input | Invariant targeted | Required behavior | Initial actual (if known) |
|---|---|---|---|---|
| 1 |  |  | reject |  |
| 2 |  |  | reject |  |
| 3 |  |  | allow |  |

## Cross-entrypoint race cases

When more than one path can mutate or trigger side effects for the same entity, duplicate-delivery cases are not enough — test **interleavings across the different actors** (see "Sibling writers and cross-entrypoint races" in `verified-implementation`).

| # | Actor A (mid-transition) | Actor B (claims/triggers) | Required behavior |
|---|---|---|---|
| C1 | original request has transitioned the entity but not yet fired the side effect | a cron/worker sees it as eligible and claims it | **at most one side effect fires** |
| C2 | two copies of the *same* path (A vs A) | — | one wins; the other no-ops |
| C3 | recovery path keys on age | entity is recent / wrong-timestamp | does **not** claim a fresh entity (right lifecycle clock) |

**Pattern (C1):** Actor A begins a transition but hasn't fired the side effect; Actor B (e.g. a recovery worker) sees the same entity as eligible and claims/triggers it. *Required proof:* at most one side effect fires, **or** the second actor observes the entity as no longer eligible (it was moved out of the rival's candidate set before side effects). "Idempotent against its own replay" does **not** imply "safe against a sibling writer."

## Notes

- **Quality bar — a redteam case must *attempt the forbidden action*, not assert the happy path.** Weak ("approve works", "page renders", "button is disabled") only confirms the happy path. Strong cases attack the boundary: a non-owner calls the endpoint directly; the caller forges actor/timestamp/body fields; a stale approval exists but the latest decision rejects; a sibling writer races the original path; a duplicate event replays; a blocked entity is submitted anyway.
- Include the "looks approved but isn't" states — partial approval, stale approval, blocked-but-edited, wrong status string.
- A case that *should allow* matters too: prove the guard isn't so tight it blocks valid actions.
- Record the **initial actual** behavior when you first run it. Preserving a real failure is the point — a redteam suite that passes on the first try may still be valid, but ask whether it actually attacked the boundary or merely asserted the happy path.
