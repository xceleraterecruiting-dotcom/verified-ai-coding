# Test Plan

Deterministic gates win. These tests are the real proof; the cold review is advisory. Every MUST NEVER invariant gets a test that proves the system **refuses** the bad action.

## Unit tests

Pure logic and guards in isolation.

| # | What it tests | Invariant | Expected |
|---|---|---|---|
| U1 |  |  |  |

## Integration tests

The behavior across layers, hitting the real enforcement boundary (not the UI).

| # | What it tests | Invariant | Expected |
|---|---|---|---|
| I1 |  |  |  |

## Regression tests

Lock in fixed bugs and invariant violations so they cannot return. (Bounded remediation adds one per blocker here.)

| # | Guards against | Invariant | Expected |
|---|---|---|---|
| R1 |  |  |  |

## How to run

- **Command:**
- **Where they live:**
- **What "green" means for the ship gate:**
