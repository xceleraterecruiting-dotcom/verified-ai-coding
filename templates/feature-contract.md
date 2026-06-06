# Feature Contract

The agreement about what is being built, written before code. If anything here is ambiguous and the ambiguity touches an invariant, resolve it before implementing.

## The request

- **What the user asked for (their words):**
- **Restated, precisely:**

## Behavior

- **In one sentence:** When ____, the system ____.
- **Inputs:**
- **Outputs / effects:**
- **The boundary where this is enforced** (which layer, which function):

## Scope

- **In scope:**
- **Explicitly out of scope:**

## Open questions

List anything ambiguous. **Block implementation on any question that affects an invariant.**

- [ ]

## Acceptance

This feature is done when:

- [ ] The behavior above holds on the happy path.
- [ ] Every invariant in the invariant checklist is enforced below the UI.
- [ ] Every redteam case behaves as required.
- [ ] All ship gates are green.
