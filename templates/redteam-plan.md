# Redteam / Bypass Plan

Adversarial cases that try to slip past the guard. Each MUST NEVER invariant needs at least one case that *attempts the forbidden action* and asserts the system refuses it. These cases double as the spec the cold reviewer traces against.

## Cases

| # | Attack / edge input | Invariant targeted | Required behavior | Initial actual (if known) |
|---|---|---|---|---|
| 1 |  |  | reject |  |
| 2 |  |  | reject |  |
| 3 |  |  | allow |  |

## Notes

- Include the "looks approved but isn't" states — partial approval, stale approval, blocked-but-edited, wrong status string.
- A case that *should allow* matters too: prove the guard isn't so tight it blocks valid actions.
- Record the **initial actual** behavior when you first run it. Preserving a real failure is the point — a redteam suite that passes on the first try usually isn't testing the boundary.
