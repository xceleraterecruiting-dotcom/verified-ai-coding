# Proof #06 — Client interpretation of seam outcomes (hardening note)

Like Proof #05, this is a **production-learned hardening note, not a heroic catch**. It records a requirement that surfaced once the workflow looked past the backend invariant to how a UI/client reports the backend's result.

## What happened

A verified slice composed existing, already-proven backend seams through a UI/client layer. Grounding confirmed the backend seams were safe: the invariant was correctly enforced below the UI, and the client routed through the canonical seams rather than around them.

But reading the **actual outcomes** those seams return exposed a layer the prior gates didn't cover. The seams don't return a simple boolean — they return distinct outcomes: success, **idempotent success** (the action had already happened), **refusal** (not allowed), and **stale/error** (the entity changed or the call failed). A correct backend can still drive a dishonest product if the client collapses those outcomes wrongly — most commonly by showing optimistic success after only the first step of a multi-step flow, or by treating an idempotent-success response as a failure.

## The lesson

A below-the-UI invariant can be correct while the client still lies to the user about the result. Enforcing the rule below the UI is necessary but not sufficient: the client has to **map each backend outcome truthfully**, and a multi-step flow must not claim a state the backend never created.

## The hardening

- **verified-implementation** (folded under the enforcement-path / seam guidance): when a UI composes backend seams, the contract must define the client's state machine over the seam outcomes — success, idempotent success, refusal, stale/error — and must not mark a flow complete until the specific backend step that creates that state has succeeded or returned an idempotent-success result.
- **ship-review:** a new client-interpretation check. If a client composes seams but the bundle doesn't define/prove the client's interpretation of the outcomes → NEEDS_REVIEW. If the client shows success for a state the backend didn't create (or maps idempotent-success as failure against the contract) → FAIL unless explicitly defined and approved.
- **Templates:** a client-interpretation contract table, a bundle evidence section, a scorecard row, and an outcome-specific redteam case-class (idempotent-success mapped as success; refusal not shown as success; partial multi-step state; stale/error refresh).

## The point

The goal is **not** to make the UI a safety boundary — the backend seam remains the boundary, and deterministic gates remain the source of truth. The goal is narrower and honest: **prevent the UI from lying about what the backend did.** This completes the pack's "below the UI" thesis — the UI is not trusted to *enforce* the invariant, and it is not allowed to *misreport* the enforced result either.
