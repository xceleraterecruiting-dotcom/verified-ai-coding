# Proof #04 — Cross-entrypoint race caught by the fresh-context reviewer (NEEDS_REVIEW → PASS)

A real, private product run of the Verified AI Coding workflow on a production-hardening slice. This is the first recorded case where the **isolated-bundle reviewer found a real correctness bug**, the design changed in response, and re-review flipped to PASS — not a clean-PASS confirmation and not a documentation-only fix.

## Context

A payment-triggered background job had already been made **replay-safe**: a duplicate or replayed payment event no longer double-triggered the job or regressed its state, via a transition guard that only acts on the first unpaid→paid delivery.

That left a **crash window**: if the process died after the paid-transition committed but before the job was triggered, the entity was left paid with no run, and replays no-oped (already paid). The slice added a periodic **recovery worker** (a scheduled sweep) to repair such stuck entities.

## The invariant

Every paid, non-refunded entity whose run got stuck (before or during start) is eventually re-triggered **exactly once** — without triggering entities that are unpaid, refunded, complete, or still inside the normal processing window.

## What the workflow derived

- The recovery worker must claim each entity **atomically** before triggering, so two sweeps can't both trigger it.
- Recovery eligibility must be decided by a **real lifecycle timestamp**, not a convenient nearby one.

## What the first implementation built

- An atomic claim (guarded compare-and-set) before triggering.
- A periodic sweep that re-triggered stuck entities.
- Tests that covered **worker-vs-worker** concurrency (two sweeps → one trigger) and the unpaid/refunded/complete/recent cases.

## What `ship-review` (fresh-context, isolated-bundle) caught

**Verdict: NEEDS_REVIEW — a real cross-entrypoint race.** The claim guard only protected actors that went through it. The tests proved *worker vs worker*, but the reviewer identified *worker vs the original trigger*:

> The original path transitions the entity and then fires the side effect a moment later. In that gap, the recovery worker can see the same entity as eligible and claim/trigger it — because the original path never participates in the worker's claim. Result: two side effects for one entity.

The reviewer flagged it as **unproven, not shown-broken** — the bundle claimed "exactly once" but only demonstrated it for same-path concurrency.

## The bounded redesign

Rather than patch around the race, the original trigger was changed to move the entity **into an in-progress state stamped with a lifecycle timestamp before firing the side effect**. The recovery worker was then restricted to claim **only stale in-progress entities** (older than a safe threshold). A freshly-transitioned entity carries a recent timestamp, so the stale-only recovery cannot claim it — the race window is removed, not merely narrowed. Tests were expanded to include the cross-entrypoint case (a freshly-transitioned entity is **not** recovered) alongside the existing same-path cases.

## Re-review

**Verdict: PASS**, zero blockers, with the reviewer's isolation verified at runtime. Remaining notes were advisory follow-ups (a one-time backfill of legacy rows that predate the timestamp; alerting on post-claim trigger failures), none contradicting the invariant.

## Reviewer context (recorded honestly)

- **Level:** Fresh-context Claude + bundle-only (enforced standard tools), isolation verified at runtime.
- **Same-vendor / same-family** — **not** different-vendor independence.
- **Not adversarial-isolated** (a documented residual remains for the bundle-only configuration).
- **External (different-vendor) egress:** no.
- **Deterministic gates remain the source of truth;** the reviewer is advisory. The fix was accepted because the expanded tests passed and the typecheck was clean, with the review as the second set of eyes that surfaced the race.

## The lesson (folded into the enforcement-path principle)

A claim/transition guard only protects the actors that participate in it. When two entry points can act on the same entity, redteam the **interleavings across those actors** — not just duplicate delivery through one path — and base any age-driven recovery on a timestamp that measures the right lifecycle state.
