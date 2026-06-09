# Test / typecheck output

Paste the **actual** slice-scoped output (not a repo-wide pass/fail), and label each piece of evidence with its **proof depth** — how deep the test actually reached.

> **A passing mock can prove intent while leaving the real failure mode untested.**

## Proof-depth labels
- `SOURCE-TRACE` — source path traced, behavior not executed.
- `UNIT-MOCK` — unit test with mocks/fakes; proves branch logic, not integration behavior.
- `SEAM-LEVEL` — calls the real seam/handler below the UI with controlled dependencies.
- `ROUTE-LEVEL` — calls the actual route handler / request boundary.
- `DB-REAL` — executed against a real database or real deployed query.
- `LIVE-SMOKE` — deployed-environment smoke test.
- `UI-CLIENT` — client behavior/branching verified.
- `OPERATOR-CHECK` — dashboard / manual environment / config check.

## Results

| Test / check | Proof depth | Result |
|---|---|---|
|  |  |  |

```
(paste actual runner / typecheck output here — slice-scoped)
```

## Advisories still open
List any risk that lives in a layer the proof depth did **not** exercise (e.g. a `UNIT-MOCK` pin over logic whose real failure mode is `DB-REAL`). These stay advisory-open in the scorecard until exercised.

-
