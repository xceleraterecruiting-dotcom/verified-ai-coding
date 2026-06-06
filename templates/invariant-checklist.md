# Invariant Checklist

> Before implementation, here is what must always happen and what must never happen.

State each invariant as a **testable predicate**, not a vibe. Every MUST NEVER must map to a redteam case and a test that proves the system refuses it.

## MUST ALWAYS

Conditions that hold after every successful path.

| # | Invariant | Enforced where (layer/function) | Proven by (test) |
|---|---|---|---|
| A1 |  |  |  |

## MUST NEVER

Actions or states the system must refuse, for any input.

| # | Invariant | Enforced where (layer/function) | Proven by (redteam case + test) |
|---|---|---|---|
| N1 |  |  |  |

## Business-invariant risk

- **Is there a rule here that causes real harm if violated** (money moved, content published, access granted, data exposed)? ▢ Yes ▢ No
- **If yes, the harm:**
- **The real boundary** (the line below the UI that must enforce it):
- **Reminder:** A disabled button is not a safety boundary. Client-side checks are not enforcement.
