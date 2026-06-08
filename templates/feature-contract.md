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

## Grounding verification

List every existing seam/helper/route this slice relies on. *A summary of existing code is a claim; the grounding evidence is the proof.* Fill this before contract approval.

| Claim | File/function/route | Evidence checked | What it reads | What it ignores | New slice routes through it? |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

- [ ] Every reused seam has actual code evidence (snippet / line-level summary / command output).
- [ ] Every "canonical helper" claim names the helper and shows why it is canonical.
- [ ] Every "DB re-read" claim shows where the DB read happens.
- [ ] Every "caller input ignored" claim shows what body fields are accepted or ignored.
- [ ] Every "actor/timestamp controlled by server" claim shows where actor/timestamp are set.
- [ ] Every new path routes through the cited seam, or explicitly documents why not.
- [ ] No contract approval until load-bearing grounding evidence is present.

## Open questions

List anything ambiguous. **Block implementation on any question that affects an invariant.**

- [ ]

## Acceptance

This feature is done when:

- [ ] The behavior above holds on the happy path.
- [ ] Every invariant in the invariant checklist is enforced below the UI.
- [ ] Every redteam case behaves as required.
- [ ] All ship gates are green.
