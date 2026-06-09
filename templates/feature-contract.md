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

Each claim carries a **grounding level**: ✅ FIRST-HAND (read the exact file/function/route this run) · 📎 QUOTED/INDIRECT (a tool/grep/summary/prior run quoted it; not re-read here) · ❌ UNPROVEN · 🧪 REPRODUCED. A load-bearing claim must be ✅ or 🧪 before approval — 📎/❌ is not approvable for anything safety-bearing.

| Claim | Grounding level | File/function/route | Evidence checked | What it reads | What it ignores | New slice routes through it? |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

- [ ] Every reused seam has actual code evidence (snippet / line-level summary / command output).
- [ ] Every "canonical helper" claim names the helper and shows why it is canonical.
- [ ] Every "DB re-read" claim shows where the DB read happens.
- [ ] Every "caller input ignored" claim shows what body fields are accepted or ignored.
- [ ] Every "actor/timestamp controlled by server" claim shows where actor/timestamp are set.
- [ ] Every new path routes through the cited seam, or explicitly documents why not.
- [ ] No contract approval until load-bearing grounding evidence is present.

## Client interpretation contract

Use this section when the slice has a UI/client compose backend seams. *A correct backend seam can still produce a dishonest product if the client misinterprets its result.*

| Backend step | Success outcome | Idempotent-success outcome | Refusal outcome | Error/stale outcome | Client may display | Client must NOT display |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

- [ ] Every reused route/seam response shape is named.
- [ ] Idempotent success is distinguished from failure.
- [ ] Refusal is distinguished from transport/server error.
- [ ] Partial success in multi-step flows is explicitly represented.
- [ ] The client does not show the final state until the backend step that creates it succeeds or idempotently succeeds.
- [ ] Stale/error responses produce a safe refresh/retry/failure state, not optimistic success.

## Open questions

List anything ambiguous. **Block implementation on any question that affects an invariant.**

- [ ]

## Acceptance

This feature is done when:

- [ ] The behavior above holds on the happy path.
- [ ] Every invariant in the invariant checklist is enforced below the UI.
- [ ] Every redteam case behaves as required.
- [ ] All ship gates are green.
